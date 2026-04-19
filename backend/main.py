"""GaBest FastAPI — serves predictions + XAI for the doctor dashboard."""

from __future__ import annotations

import logging
import traceback
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from inference import GabestInference
from plant_disease import PlantDiseaseInference
from wind_shield import engine as wind_engine, FACTORIES as WIND_FACTORIES
from gypsifert import engine as gypsi_engine
from water_shield import engine as water_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("gabest")

engine = GabestInference()
plant_engine = PlantDiseaseInference()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading GaBest model, scaler and dataset…")
    engine.load()
    log.info("✅ Zone model ready · %d quartiers · %d rows loaded", 8, len(engine.df))
    try:
        log.info("Loading GabesHeal F2 plant-disease model…")
        plant_engine.load()
        log.info("✅ GabesHeal F2 ready · %d classes", len(plant_engine.idx_to_class))
    except Exception as e:
        log.warning("GabesHeal F2 not loaded (%s) — /predict-disease will return 503", e)
    try:
        log.info("Loading WindShield (Invisible Shield) model…")
        wind_engine.load()
        log.info("✅ WindShield ready · backend=%s",
                 "random_forest" if wind_engine.ready else "rule_based")
    except Exception as e:
        log.warning("WindShield not loaded (%s) — /wind/* uses rule-based fallback", e)
    try:
        log.info("Loading GypsiFert (XGBoost × 3 + SHAP) artifacts…")
        gypsi_engine.load()
        log.info("✅ GypsiFert ready · %d features · risk_threshold=%.3f",
                 len(gypsi_engine.feature_names),
                 gypsi_engine.config.get("risk_threshold", 0.5))
    except Exception as e:
        log.warning("GypsiFert not loaded (%s) — /gypsifert/* will return 503", e)
    try:
        log.info("Loading WaterShield (safety + reco + 4 contaminants) artifacts…")
        water_engine.load()
        log.info("✅ WaterShield ready · %d features", len(water_engine.feature_names))
    except Exception as e:
        log.warning("WaterShield not loaded (%s) — /watershield/* will return 503", e)
    try:
        log.info("Loading BioMatch (XGBoost HHV v2.0) model…")
        _biomatch_engine.load()
        log.info("✅ BioMatch source=%s · %d waste types",
                 _biomatch_engine.source, len(_biomatch_engine.waste_types))
    except Exception as e:
        log.warning("BioMatch not loaded (%s) — /api/farmer/* uses Phyllis2 fallback", e)
    yield


app = FastAPI(title="GaBest API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "ok": engine.model is not None,
        "rows": 0 if engine.df is None else int(len(engine.df)),
        "latest_date": None if engine.df is None else str(engine.df["date"].max().date()),
        "plant_model_ok": plant_engine.model is not None,
        "plant_classes": len(plant_engine.idx_to_class),
        "wind_shield_ready": wind_engine.ready,
        "wind_shield_backend": "random_forest" if wind_engine.ready else "rule_based",
        "gypsifert_ready": gypsi_engine.ready,
        "gypsifert_metrics": gypsi_engine.config.get("metrics", {}) if gypsi_engine.ready else {},
        "watershield_ready": water_engine.ready,
    }


# ══════════════════════════════════════════════════════════════════
#  GypsiFert — phosphogypse → agri (dosage / gain / risque + SHAP)
# ══════════════════════════════════════════════════════════════════

class GypsiFertParcelle(BaseModel):
    pH: float = 7.8
    calcium: float = 1800
    magnesium: float = 350
    cec: float = 12
    cadmium: float = 0.02
    lead: float = 8
    rainfall: float = 180
    soil_type: str = "sandy"   # sandy | loamy | clay
    crop: str = "olive"        # olive | date_palm | tomato | barley


class GypsiFertBatchItem(BaseModel):
    id: int | str
    parcelle: GypsiFertParcelle


class GypsiFertBatchInput(BaseModel):
    items: list[GypsiFertBatchItem]


@app.post("/gypsifert/predict")
def gypsifert_predict(body: GypsiFertParcelle):
    if not gypsi_engine.ready:
        raise HTTPException(status_code=503, detail="GypsiFert model not loaded")
    try:
        return gypsi_engine.predict(body.dict())
    except Exception as e:
        log.error("GypsiFert predict failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gypsifert/predict-batch")
def gypsifert_predict_batch(body: GypsiFertBatchInput):
    """Batch predict for multiple parcelles (one per candidate buyer)."""
    if not gypsi_engine.ready:
        raise HTTPException(status_code=503, detail="GypsiFert model not loaded")
    out = []
    for item in body.items:
        try:
            pred = gypsi_engine.predict(item.parcelle.dict())
            out.append({"id": item.id, **pred})
        except Exception as e:
            out.append({"id": item.id, "error": str(e)})
    return {"results": out}


# ══════════════════════════════════════════════════════════════════
#  WaterShield — qualité de l'eau d'irrigation (5 questions → 4 sorties)
# ══════════════════════════════════════════════════════════════════

class WaterShieldObservation(BaseModel):
    water_source: str = Field("canal", description="well | oasis | canal | surface")
    distance_to_gct_km: float = Field(8.0, ge=0.5, le=80.0)
    color: str = Field("clear", description="clear | cloudy | brown | yellow | green")
    odor: str = Field("none", description="none | sulfurous | metallic | chemical | earthy")
    days_since_rain: int = Field(7, ge=0, le=120)
    season: str | None = Field(None, description="dry | wet — auto-détecté si absent")


@app.post("/watershield/predict")
def watershield_predict(body: WaterShieldObservation):
    if not water_engine.ready:
        raise HTTPException(status_code=503, detail="WaterShield model not loaded")
    try:
        return water_engine.predict(body.dict(exclude_none=True))
    except Exception as e:
        log.error("WaterShield predict failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════
#  WindShield (Invisible Shield) — recommandation production / vent
# ══════════════════════════════════════════════════════════════════

class WindFactoryInput(BaseModel):
    lat: float
    lon: float
    name: str = "Usine inconnue"
    production: float = 85.0


class WindMonthlyInput(BaseModel):
    lat: float
    lon: float
    name: str = "Usine inconnue"
    production: float = 85.0
    days: int = 30
    price_per_ton_dt: float = 1_400.0


@app.get("/wind/factories")
def wind_factories():
    return WIND_FACTORIES


@app.post("/wind/predict")
def wind_predict(body: WindFactoryInput):
    try:
        return wind_engine.predict_factory(body.lat, body.lon, body.name, body.production)
    except Exception as e:
        log.error("WindShield predict failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wind/monthly-report")
def wind_monthly_report(body: WindMonthlyInput):
    try:
        return wind_engine.monthly_savings_report(
            body.lat, body.lon, body.name,
            production=body.production,
            days=max(7, min(90, body.days)),
            price_per_ton_dt=body.price_per_ton_dt,
        )
    except Exception as e:
        log.error("WindShield monthly failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-disease")
async def predict_disease(file: UploadFile = File(...)):
    if plant_engine.model is None:
        raise HTTPException(status_code=503, detail="GabesHeal F2 model not loaded")
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Expected image, got {file.content_type}")
    try:
        img_bytes = await file.read()
        if not img_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        return plant_engine.predict(img_bytes)
    except HTTPException:
        raise
    except Exception as e:
        log.error("Disease prediction failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predict")
def predict(date: Optional[str] = Query(default=None, description="YYYY-MM-DD, defaults to latest in dataset")):
    if engine.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    try:
        return engine.predict_all(target_date=date)
    except Exception as e:
        log.error("Prediction failed: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════
#  BioMatch — agriculteur déchets → valeur énergétique (XGBoost HHV)
# ══════════════════════════════════════════════════════════════════
#
# Drop these two files next to main.py to enable the real model:
#   - biomatch_farmer_model.pkl
#   - farmer_model_metadata.json
#
# Without them, /api/farmer/estimate uses a Phyllis2 fallback so the
# UI keeps working in dev mode.

import json
import os
from datetime import datetime as _dt
from typing import Optional as _Opt

try:
    import joblib  # type: ignore
    import numpy as _np
except Exception:
    joblib = None
    _np = None

_BIOMATCH_DIR = os.path.dirname(os.path.abspath(__file__))
_BIOMATCH_PKL = os.path.join(_BIOMATCH_DIR, "biomatch_farmer_model.pkl")
_BIOMATCH_META = os.path.join(_BIOMATCH_DIR, "farmer_model_metadata.json")

# Calibration offset for the v2.0 pickle: when loading a model trained
# under XGBoost <2.x with `boost_from_average=1`, XGBoost ≥2.0 no longer
# adds the training-target mean back to the prediction. The pickle thus
# returns residuals in the range [-2, +4] instead of raw HHV. The offset
# below is the mean HHV of the original training set (estimated from the
# spec example: olive_pomace @ moisture=15 → expected 18.52; raw → 3.41).
_HHV_OFFSET = 15.11

_PHYLLIS2_FALLBACK = {
    "alfalfa":           {"C": 47.2, "H": 5.95, "N": 2.81, "S": 0.21, "Ash": 7.8,  "Moisture": 12, "HHV_base": 18.4},
    "date_seeds":        {"C": 50.1, "H": 6.40, "N": 1.10, "S": 0.10, "Ash": 1.8,  "Moisture": 9,  "HHV_base": 19.6},
    "olive_leaves":      {"C": 49.0, "H": 6.10, "N": 1.45, "S": 0.18, "Ash": 6.2,  "Moisture": 14, "HHV_base": 17.8},
    "olive_pomace":      {"C": 49.8, "H": 6.65, "N": 1.02, "S": 0.11, "Ash": 4.85, "Moisture": 12, "HHV_base": 19.2},
    "palm_fronds":       {"C": 47.8, "H": 6.10, "N": 0.50, "S": 0.10, "Ash": 5.3,  "Moisture": 16, "HHV_base": 17.1},
    "pomegranate_peels": {"C": 45.5, "H": 5.80, "N": 1.20, "S": 0.13, "Ash": 4.2,  "Moisture": 18, "HHV_base": 16.4},
    "sugarcane_bagasse": {"C": 48.6, "H": 5.90, "N": 0.40, "S": 0.05, "Ash": 3.2,  "Moisture": 22, "HHV_base": 17.6},
    "tomato_stems":      {"C": 44.6, "H": 5.40, "N": 1.95, "S": 0.30, "Ash": 11.5, "Moisture": 24, "HHV_base": 15.2},
    "wheat_straw":       {"C": 47.0, "H": 5.85, "N": 0.65, "S": 0.12, "Ash": 6.8,  "Moisture": 11, "HHV_base": 16.6},
    "wood_chips":        {"C": 50.5, "H": 6.20, "N": 0.30, "S": 0.04, "Ash": 1.2,  "Moisture": 10, "HHV_base": 19.8},
}

_LABELS_FR = {
    "alfalfa": "Luzerne",
    "date_seeds": "Noyaux de dattes",
    "olive_leaves": "Feuilles d'olivier",
    "olive_pomace": "Grignons d'olive",
    "palm_fronds": "Palmes de palmier",
    "pomegranate_peels": "Écorces de grenade",
    "sugarcane_bagasse": "Bagasse canne à sucre",
    "tomato_stems": "Tiges de tomate",
    "wheat_straw": "Paille de blé",
    "wood_chips": "Copeaux de bois",
}


class _BiomatchEngine:
    def __init__(self):
        self.model = None
        self.meta = None
        self.phyllis2 = _PHYLLIS2_FALLBACK
        self.str_to_int = {k: i for i, k in enumerate(sorted(_PHYLLIS2_FALLBACK.keys()))}
        self.waste_types = list(_PHYLLIS2_FALLBACK.keys())
        self.ready = False
        self.source = "fallback"

    def load(self):
        if joblib is None or _np is None:
            log.warning("BioMatch: numpy/joblib unavailable — fallback mode only.")
            return
        if not (os.path.exists(_BIOMATCH_PKL) and os.path.exists(_BIOMATCH_META)):
            log.warning("BioMatch: model files missing — using Phyllis2 fallback.")
            return
        try:
            with open(_BIOMATCH_META) as f:
                self.meta = json.load(f)
            self.model = joblib.load(_BIOMATCH_PKL)
            self.phyllis2 = self.meta.get("phyllis2_table", _PHYLLIS2_FALLBACK)
            label_enc = self.meta.get("label_encoder", {})
            self.str_to_int = {v: int(k) for k, v in label_enc.items()}
            self.waste_types = self.meta.get("waste_types", list(self.phyllis2.keys()))
            self.ready = True
            self.source = "xgboost_v2"
            log.info("✅ BioMatch ready · %d waste types", len(self.waste_types))
        except Exception as e:
            log.warning("BioMatch load failed (%s) — using fallback.", e)

    def estimate(self, waste_type: str, quantity_kg: float, moisture_pct: _Opt[float]):
        if waste_type not in self.phyllis2:
            raise HTTPException(400, f"Type inconnu: {waste_type}")
        base = self.phyllis2[waste_type]
        moisture = float(moisture_pct) if moisture_pct is not None else float(base.get("Moisture", 12))

        month = _dt.now().month
        season_num = 2 if month <= 3 else 5 if month <= 6 else 8 if month <= 9 else 11

        if self.ready and self.model is not None and _np is not None:
            X = _np.array([[
                self.str_to_int[waste_type],
                moisture, season_num,
                base["C"], base["H"], base["N"], base["S"], base["Ash"],
            ]])
            hhv_residual = float(self.model.predict(X)[0])
            hhv = hhv_residual + _HHV_OFFSET
        else:
            hhv_base = float(base.get("HHV_base", 17.0))
            moisture_penalty = (moisture - base.get("Moisture", 12)) * 0.06
            ash_penalty = base["Ash"] * 0.05
            hhv = max(8.0, hhv_base - moisture_penalty - ash_penalty)

        quality = "premium" if hhv > 20 else "standard" if hhv > 16 else "low"
        energy_mj = hhv * quantity_kg
        energy_kwh = round(energy_mj / 3.6, 2)
        value_dt = round((hhv * 3.5) * (quantity_kg / 1000), 2)
        return {
            "HHV_MJkg": round(hhv, 2),
            "quality": quality,
            "energy_MJ": round(energy_mj, 1),
            "energy_kWh": energy_kwh,
            "value_DT": value_dt,
            "moisture_used": moisture,
            "season_num": season_num,
            "source": self.source,
        }


_biomatch_engine = _BiomatchEngine()
# Loaded inside the lifespan() context manager above.


class _FarmerInput(BaseModel):
    waste_type: str
    quantity_kg: float = Field(..., gt=0)
    lat: float = 33.881
    lon: float = 10.098
    moisture_pct: _Opt[float] = Field(None, ge=0, le=80)


@app.post("/api/farmer/estimate")
def farmer_estimate(inp: _FarmerInput):
    return _biomatch_engine.estimate(inp.waste_type, inp.quantity_kg, inp.moisture_pct)


@app.get("/api/waste-types")
def get_waste_types():
    return [{"value": k, "label": _LABELS_FR.get(k, k)} for k in _biomatch_engine.waste_types]


@app.get("/api/biomatch/health")
def biomatch_health():
    return {
        "ready": _biomatch_engine.ready,
        "source": _biomatch_engine.source,
        "waste_types_count": len(_biomatch_engine.waste_types),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
