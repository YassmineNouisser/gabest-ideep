"""
backend/main.py — Invisible Shield AI API
FastAPI server qui expose le modele ML + meteo reelle
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import requests
import pickle
import os
from datetime import datetime
from typing import Optional

app = FastAPI(title="Invisible Shield AI - Gabes", version="1.0.0")

# CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Charge le modele ML (depuis Kaggle output) ──
MODEL_PATH = os.getenv("MODEL_PATH", "invisible_shield_models.pkl")
models = None

def load_models():
    global models
    try:
        with open(MODEL_PATH, "rb") as f:
            models = pickle.load(f)
        print(f"Modele charge: {MODEL_PATH}")
    except FileNotFoundError:
        print(f"WARN: {MODEL_PATH} introuvable — mode fallback rule-based")

load_models()

# ── Schemas ──
class FactoryInput(BaseModel):
    lat:        float
    lon:        float
    name:       str = "Usine inconnue"
    production: float = 85.0       # % niveau production

class PredictionResponse(BaseModel):
    # Meteo
    temperature:    float
    humidity:       float
    wind_speed:     float
    wind_deg:       float
    wind_direction: str
    wind_text:      str
    # Risk
    risk_score:     float
    risk_label:     str             # low / medium / high
    risk_color:     str             # hex
    pollution_index: float
    dust_level:     float
    # Decisions
    production_before: float
    production_after:  float
    prod_change_pct:   float
    recommended_products: list[str]
    pollution_reduction_pct: float
    # Carte
    plume_points:   list[dict]      # [{lat, lon, z}]
    zones:          list[dict]      # [{name, lat, lon, pollution, impact, color}]
    arrows:         list[dict]      # [{slat, slon, elat, elon}]
    # Meta
    factory_name:   str
    timestamp:      str

# ── Helper: meteo reelle ──
def get_weather(lat: float, lon: float) -> dict:
    try:
        resp = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude":        lat,
                "longitude":       lon,
                "current":         ["temperature_2m", "relative_humidity_2m",
                                    "wind_speed_10m", "wind_direction_10m"],
                "wind_speed_unit": "ms",
                "timezone":        "Africa/Tunis",
            },
            timeout=10,
        )
        cur = resp.json()["current"]
        return {
            "temperature": float(cur["temperature_2m"]),
            "humidity":    float(cur["relative_humidity_2m"]),
            "wind_speed":  float(cur["wind_speed_10m"]),
            "wind_deg":    float(cur["wind_direction_10m"]),
        }
    except Exception as e:
        print(f"API meteo error: {e} — fallback valeurs par defaut")
        return {"temperature": 28.0, "humidity": 55.0,
                "wind_speed": 5.0, "wind_deg": 90.0}

# ── Helper: direction vent ──
def deg_to_qualitative(deg: float) -> tuple[str, str]:
    d = deg % 360
    table = [
        (0,   45,  "away",           "Nord → pollution vers le Sud"),
        (45,  135, "toward_city",    "Est → pollution vers la ville"),
        (135, 225, "away",           "Sud → pollution se disperse"),
        (225, 315, "toward_sea",     "Ouest → pollution vers la mer"),
        (315, 360, "away",           "Nord → pollution vers le Sud"),
    ]
    for lo, hi, qual, text in table:
        if lo <= d < hi:
            return qual, text
    return "away", f"{deg:.0f} deg"

# ── Helper: calcul risk ──
def compute_risk(temp, humidity, wind_speed, wind_deg, dust, production) -> tuple[float, str, str]:
    WIND_W = {"toward_city":1.0,"toward_factory":0.7,"toward_sea":0.4,"away":0.2}
    wind_qual, _ = deg_to_qualitative(wind_deg)
    ww  = WIND_W[wind_qual]
    p   = np.clip(production * 0.4 / 200, 0, 1)
    d   = np.clip(dust / 300, 0, 1)
    ws  = np.clip(wind_speed / 15, 0, 1)
    t   = np.clip((temp - 20) / 30, 0, 1)
    h   = 1 - np.clip(humidity / 100, 0, 1)
    score = float(np.clip(35*p + 20*d + 20*ww*ws + 15*t + 10*h, 0, 100))
    if score >= 65:
        return score, "high",   "#e74c3c"
    elif score >= 35:
        return score, "medium", "#f39c12"
    return score, "low",    "#2ecc71"

# ── Helper: ML predict ──
def ml_predict(row_dict: dict) -> tuple[float, str]:
    if models is None:
        return compute_risk(
            row_dict["temperature"], row_dict["humidity"],
            row_dict["wind_speed"],  row_dict["wind_deg"],
            row_dict["dust_level"],  row_dict["production_level"]
        )[:2]
    try:
        from sklearn.preprocessing import LabelEncoder
        le_wind = models["le_wind"]
        le_day  = models["le_day"]
        le_emit = models["le_emit"]
        FEATURES = models["features"]

        wind_qual, _ = deg_to_qualitative(row_dict["wind_deg"])
        day_type = "weekday" if datetime.now().weekday() < 5 else "weekend"
        emit_type = "marine" if wind_qual == "toward_sea" else "air"

        import pandas as pd
        X = pd.DataFrame([[
            float(row_dict.get("hour", datetime.now().hour)),
            float(datetime.now().month),
            float(row_dict["temperature"]),
            float(row_dict["humidity"]),
            float(row_dict["wind_speed"]),
            float(le_wind.transform([wind_qual])[0]),
            float(row_dict["dust_level"]),
            float(row_dict["production_level"]),
            float(row_dict["pollution_intensity"]),
            float(le_day.transform([day_type])[0]),
            float(le_emit.transform([emit_type])[0]),
        ]], columns=FEATURES)

        label = models["classifier"].predict(X)[0]
        score = float(models["regressor"].predict(X)[0])
        return score, label
    except Exception as e:
        print(f"ML predict error: {e}")
        return compute_risk(
            row_dict["temperature"], row_dict["humidity"],
            row_dict["wind_speed"],  row_dict["wind_deg"],
            row_dict["dust_level"],  row_dict["production_level"]
        )[:2]

# ── Helper: plume de pollution ──
def compute_plume(lat, lon, poll_int, wind_deg, wind_speed) -> list[dict]:
    wind_rad = np.radians(wind_deg)
    dx =  np.sin(wind_rad)
    dy = -np.cos(wind_rad)

    GRID      = 30
    lat_range = np.linspace(lat - 0.12, lat + 0.12, GRID)
    lon_range = np.linspace(lon - 0.12, lon + 0.16, GRID)

    spread    = max(2.5, wind_speed / 1.5)
    shift     = wind_speed * 1.8
    plume_lat = (GRID-1)/2 + dy * shift / 3
    plume_lon = (GRID-1)/2 + dx * shift / 3

    Y, X = np.meshgrid(np.arange(GRID), np.arange(GRID), indexing="ij")
    grid = poll_int * np.exp(
        -((Y - plume_lat)**2 / (2*spread**2)
        + (X - plume_lon)**2 / (2*spread**2))
    )
    cy, cx = GRID//2, GRID//2
    grid[cy-1:cy+2, cx-1:cx+2] += poll_int * 0.8
    grid = np.clip(grid, 0, 200)

    pts = []
    for i in range(GRID):
        for j in range(GRID):
            if grid[i, j] > 3:
                pts.append({"lat": round(float(lat_range[i]), 6),
                             "lon": round(float(lon_range[j]), 6),
                             "z":   round(float(grid[i, j]), 1)})
    return pts

# ── Helper: zones impact ──
GABES_ZONES = [
    {"name": "Centre Ville Gabes",      "lat": 33.8910, "lon": 10.0710},
    {"name": "Zone Residentielle Nord", "lat": 33.8980, "lon": 10.0820},
    {"name": "Plage / Cote",            "lat": 33.8720, "lon": 10.1180},
    {"name": "Zone Agricole / Oasis",   "lat": 33.9100, "lon": 10.0950},
    {"name": "Quartier Jara",           "lat": 33.8850, "lon": 10.0650},
    {"name": "Zone Mnihla",             "lat": 33.8750, "lon": 10.0850},
    {"name": "Cite El Amel",            "lat": 33.8650, "lon": 10.0780},
    {"name": "Zone Chott",              "lat": 33.9200, "lon": 10.1100},
]

def compute_zones(plume_points: list[dict], factory_lat: float, factory_lon: float) -> list[dict]:
    results = []
    for z in GABES_ZONES:
        # Pollution interpolee: moyenne des points proches
        nearby = [p["z"] for p in plume_points
                  if abs(p["lat"]-z["lat"]) < 0.015
                  and abs(p["lon"]-z["lon"]) < 0.015]
        poll = float(np.mean(nearby)) if nearby else 0.0

        if poll >= 40:
            impact, color = "Tres affecte", "#e74c3c"
        elif poll >= 15:
            impact, color = "Affecte",      "#f39c12"
        elif poll >= 5:
            impact, color = "Peu affecte",  "#f1c40f"
        else:
            impact, color = "Non affecte",  "#2ecc71"

        results.append({
            "name":      z["name"],
            "lat":       z["lat"],
            "lon":       z["lon"],
            "pollution": round(poll, 1),
            "impact":    impact,
            "color":     color,
        })
    return results

# ── Helper: fleches ──
def compute_arrows(lat, lon, wind_deg, wind_speed) -> list[dict]:
    wind_rad    = np.radians(wind_deg)
    dx          =  np.sin(wind_rad)
    dy          = -np.cos(wind_rad)
    arrow_len   = wind_speed * 0.005
    radius      = 0.028
    arrows      = []
    for a in np.linspace(0, 2*np.pi, 10, endpoint=False):
        slat = lat + radius * np.cos(a)
        slon = lon + radius * np.sin(a)
        arrows.append({
            "slat": round(slat + dy * arrow_len, 6),
            "slon": round(slon + dx * arrow_len, 6),
            "elat": round(float(slat), 6),
            "elon": round(float(slon), 6),
        })
    return arrows

# ══════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════

@app.get("/")
def root():
    return {"message": "Invisible Shield AI API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": models is not None,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(factory: FactoryInput):
    # 1. Meteo
    weather = get_weather(factory.lat, factory.lon)
    TEMP, HUMIDITY = weather["temperature"], weather["humidity"]
    WIND_SPD, WIND_DEG = weather["wind_speed"], weather["wind_deg"]

    # 2. Features
    hour      = datetime.now().hour
    dust      = float(80 + 40 * np.sin(2 * np.pi * hour / 24))
    poll_int  = float(0.4*factory.production + 0.3*dust/3 + 0.2*TEMP)
    wind_qual, wind_text = deg_to_qualitative(WIND_DEG)

    # 3. ML predict
    row = {
        "temperature": TEMP, "humidity": HUMIDITY,
        "wind_speed": WIND_SPD, "wind_deg": WIND_DEG,
        "dust_level": dust, "production_level": factory.production,
        "pollution_intensity": poll_int, "hour": hour,
    }
    risk_score, risk_label = ml_predict(row)
    _, _, risk_color = compute_risk(TEMP, HUMIDITY, WIND_SPD, WIND_DEG,
                                    dust, factory.production)

    # 4. Decision
    STRATEGIES = {"high": 0.20, "medium": 0.10, "low": 0.0}
    PRODUCTS_MAP = {
        "high":   ["FilterBoost-Z", "AirClean-X"],
        "medium": ["AirClean-X"],
        "low":    [],
    }
    prod_cut       = STRATEGIES.get(risk_label, 0.0)
    prod_after     = factory.production * (1 - prod_cut)
    products       = PRODUCTS_MAP.get(risk_label, [])
    poll_red       = prod_cut * 60 + len(products) * 9.0

    # 5. Carte
    plume  = compute_plume(factory.lat, factory.lon, poll_int, WIND_DEG, WIND_SPD)
    zones  = compute_zones(plume, factory.lat, factory.lon)
    arrows = compute_arrows(factory.lat, factory.lon, WIND_DEG, WIND_SPD)

    return PredictionResponse(
        temperature=round(TEMP, 1),
        humidity=round(HUMIDITY, 1),
        wind_speed=round(WIND_SPD, 1),
        wind_deg=round(WIND_DEG, 1),
        wind_direction=wind_qual,
        wind_text=wind_text,
        risk_score=round(risk_score, 1),
        risk_label=risk_label,
        risk_color=risk_color,
        pollution_index=round(poll_int, 1),
        dust_level=round(dust, 1),
        production_before=factory.production,
        production_after=round(prod_after, 1),
        prod_change_pct=round(-prod_cut * 100, 1),
        recommended_products=products,
        pollution_reduction_pct=round(min(poll_red, 85.0), 1),
        plume_points=plume,
        zones=zones,
        arrows=arrows,
        factory_name=factory.name,
        timestamp=datetime.now().isoformat(),
    )


@app.get("/factories")
def get_factories():
    """Liste des usines connues de Gabes."""
    return [
        {"id": "gct",  "name": "GCT - Groupe Chimique Tunisien",  "lat": 33.8820, "lon": 10.0980, "type": "phosphate"},
        {"id": "cpg",  "name": "CPG - Compagnie des Phosphates",   "lat": 33.8800, "lon": 10.1000, "type": "phosphate"},
        {"id": "steg", "name": "STEG - Centrale Thermique",        "lat": 33.8750, "lon": 10.1050, "type": "energie"},
        {"id": "port", "name": "Port Industriel de Gabes",         "lat": 33.8680, "lon": 10.1120, "type": "port"},
    ]
