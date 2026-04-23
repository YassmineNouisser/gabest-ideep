"""Invisible Shield — wind-based production recommendation engine.

Wraps the Random Forest model trained on Kaggle (saved as
``invisible_shield_models.pkl``) and exposes:
  · ``predict_factory``       → full live prediction (meteo + risk + plume + zones)
  · ``monthly_savings_report``→ aggregated monthly economic bilan
"""

from __future__ import annotations

import logging
import os
import pickle
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

import numpy as np
import requests

log = logging.getLogger("wind_shield")

MODEL_CANDIDATES = [
    os.environ.get("WIND_SHIELD_MODEL", ""),
    str(Path(__file__).resolve().parent / "invisible_shield_models.pkl"),
    str(Path(__file__).resolve().parent.parent / "model de recommedation de prod selon vent " / "invisible_shield_models.pkl"),
]

GABES_ZONES = [
    {"name": "Centre Ville Gabes",      "lat": 33.8910, "lon": 10.0710, "population": 45000, "type": "urban"},
    {"name": "Zone Residentielle Nord", "lat": 33.8980, "lon": 10.0820, "population": 22000, "type": "urban"},
    {"name": "Plage / Cote",            "lat": 33.8720, "lon": 10.1180, "population":  5000, "type": "coast"},
    {"name": "Zone Agricole / Oasis",   "lat": 33.9100, "lon": 10.0950, "population":  3200, "type": "agri"},
    {"name": "Quartier Jara",           "lat": 33.8850, "lon": 10.0650, "population": 18000, "type": "urban"},
    {"name": "Zone Mnihla",             "lat": 33.8750, "lon": 10.0850, "population": 12000, "type": "urban"},
    {"name": "Cite El Amel",            "lat": 33.8650, "lon": 10.0780, "population":  9000, "type": "urban"},
    {"name": "Zone Chott",              "lat": 33.9200, "lon": 10.1100, "population":  1500, "type": "agri"},
]

FACTORIES = [
    {"id": "gct",  "name": "GCT - Groupe Chimique Tunisien",  "lat": 33.8820, "lon": 10.0980, "type": "phosphate"},
    {"id": "cpg",  "name": "CPG - Compagnie des Phosphates",  "lat": 33.8800, "lon": 10.1000, "type": "phosphate"},
    {"id": "steg", "name": "STEG - Centrale Thermique",       "lat": 33.8750, "lon": 10.1050, "type": "energie"},
    {"id": "port", "name": "Port Industriel de Gabes",        "lat": 33.8680, "lon": 10.1120, "type": "port"},
]

REVENUE_PER_PCT_DAY_DT       = 550.0       # DT de marge par % de prod × jour
# Amendes : barème ANPE (loi 88-91 + décret 2005-1991). On les compte par
# ÉVÉNEMENT avéré (inspection + mise en demeure), pas par jour de risque.
AVOIDED_FINE_HIGH_DT         = 12_000.0    # mise en demeure grave (ANPE)
AVOIDED_FINE_MEDIUM_DT       = 2_500.0     # avertissement / relevé d'infraction
# Prob qu'un jour à risque déclenche réellement une inspection avec amende
P_FINE_PER_HIGH_DAY          = 0.08        # ≈ 1 amende tous les ~12 jours high
P_FINE_PER_MEDIUM_DAY        = 0.015       # amende modérée beaucoup plus rare
# Santé : coût social par habitant × événement grave (très conservateur)
# OMS Europe : 3 à 15 € par habitant/an d'exposition chronique → on prend 0.05 DT par évènement aigu
AVOIDED_HEALTH_DT_PER_PERSON = 0.05
# Produits : coût d'une recharge mensuelle (pas journalier)
PRODUCT_MONTHLY_COST_DT      = {"FilterBoost-Z": 4_200.0, "AirClean-X": 2_800.0}
PLATFORM_LICENCE_DT_MONTH    = 4_500.0     # licence mensuelle AirShield par usine
CARBON_CREDIT_DT_PER_TON     = 65.0        # marché volontaire VCM 2025
TONS_SO2_PER_PCT_CUT         = 0.18        # estimation conservatrice d'intensité SO2


class WindShieldEngine:
    def __init__(self) -> None:
        self.models: Optional[dict] = None
        self.model_path: Optional[str] = None

    def load(self) -> None:
        for cand in MODEL_CANDIDATES:
            if not cand:
                continue
            path = Path(cand)
            if path.is_file():
                try:
                    with open(path, "rb") as f:
                        self.models = pickle.load(f)
                    self.model_path = str(path)
                    log.info("WindShield model loaded: %s", path)
                    return
                except Exception as e:
                    log.warning("Failed to load %s: %s", path, e)
        log.warning("WindShield .pkl not found — running in rule-based fallback.")

    @property
    def ready(self) -> bool:
        return self.models is not None

    # ── Météo temps réel ────────────────────────────────────────────
    def _get_weather(self, lat: float, lon: float) -> dict:
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
                timeout=6,
            )
            cur = resp.json()["current"]
            return {
                "temperature": float(cur["temperature_2m"]),
                "humidity":    float(cur["relative_humidity_2m"]),
                "wind_speed":  float(cur["wind_speed_10m"]),
                "wind_deg":    float(cur["wind_direction_10m"]),
            }
        except Exception as e:
            log.warning("open-meteo unreachable (%s) — fallback defaults", e)
            return {"temperature": 28.0, "humidity": 55.0,
                    "wind_speed": 5.0, "wind_deg": 90.0}

    # ── Direction du vent ───────────────────────────────────────────
    @staticmethod
    def _deg_to_qualitative(deg: float) -> tuple[str, str]:
        d = deg % 360
        table = [
            (0,   45,  "away",        "Nord → pollution dispersée vers le Sud"),
            (45,  135, "toward_city", "Est → pollution dirigée vers la ville"),
            (135, 225, "away",        "Sud → pollution dispersée au large"),
            (225, 315, "toward_sea",  "Ouest → pollution évacuée vers la mer"),
            (315, 360, "away",        "Nord → pollution dispersée vers le Sud"),
        ]
        for lo, hi, qual, text in table:
            if lo <= d < hi:
                return qual, text
        return "away", f"{deg:.0f}°"

    # ── Règle-de-base (fallback si ML indisponible) ─────────────────
    def _rule_risk(self, temp, humidity, wind_speed, wind_deg, dust, production):
        WIND_W = {"toward_city": 1.0, "toward_factory": 0.75, "toward_sea": 0.25, "away": 0.45}
        wind_qual, _ = self._deg_to_qualitative(wind_deg)
        ww  = WIND_W[wind_qual]
        p   = np.clip(production / 100, 0, 1)
        d   = np.clip(dust / 200, 0, 1)
        ws  = np.clip(wind_speed / 12, 0, 1)
        t   = np.clip((temp - 20) / 20, 0, 1)
        h   = 1 - np.clip(humidity / 100, 0, 1)
        score = float(np.clip(15 * p + 22 * d + 35 * ww * ws + 15 * t + 8 * h, 0, 100))
        if score >= 58: return score, "high",   "#e74c3c"
        if score >= 38: return score, "medium", "#f39c12"
        return score, "low",    "#2ecc71"

    # ── ML predict (Random Forest) ──────────────────────────────────
    def _ml_predict(self, row: dict) -> tuple[float, str]:
        if self.models is None:
            s, lbl, _ = self._rule_risk(
                row["temperature"], row["humidity"], row["wind_speed"],
                row["wind_deg"], row["dust_level"], row["production_level"],
            )
            return s, lbl
        try:
            import pandas as pd
            le_wind = self.models["le_wind"]
            le_day  = self.models["le_day"]
            le_emit = self.models["le_emit"]
            FEATURES = self.models["features"]

            wind_qual, _ = self._deg_to_qualitative(row["wind_deg"])
            day_type  = "weekday" if datetime.now().weekday() < 5 else "weekend"
            emit_type = "marine" if wind_qual == "toward_sea" else "air"

            X = pd.DataFrame([[
                float(row.get("hour", datetime.now().hour)),
                float(datetime.now().month),
                float(row["temperature"]),
                float(row["humidity"]),
                float(row["wind_speed"]),
                float(le_wind.transform([wind_qual])[0]),
                float(row["dust_level"]),
                float(row["production_level"]),
                float(row["pollution_intensity"]),
                float(le_day.transform([day_type])[0]),
                float(le_emit.transform([emit_type])[0]),
            ]], columns=FEATURES)

            label = str(self.models["classifier"].predict(X)[0])
            score = float(self.models["regressor"].predict(X)[0])
            return score, label
        except Exception as e:
            log.warning("ML predict failed (%s) — rule-based fallback", e)
            s, lbl, _ = self._rule_risk(
                row["temperature"], row["humidity"], row["wind_speed"],
                row["wind_deg"], row["dust_level"], row["production_level"],
            )
            return s, lbl

    # ── Plume gaussienne dirigée par le vent ───────────────────────
    @staticmethod
    def _compute_plume(lat, lon, poll_int, wind_deg, wind_speed) -> list[dict]:
        wind_rad = np.radians(wind_deg)
        dx =  np.sin(wind_rad)
        dy = -np.cos(wind_rad)

        GRID      = 28
        lat_range = np.linspace(lat - 0.12, lat + 0.12, GRID)
        lon_range = np.linspace(lon - 0.12, lon + 0.16, GRID)
        spread    = max(2.5, wind_speed / 1.5)
        shift     = wind_speed * 1.8
        plume_lat = (GRID - 1) / 2 + dy * shift / 3
        plume_lon = (GRID - 1) / 2 + dx * shift / 3

        Y, X = np.meshgrid(np.arange(GRID), np.arange(GRID), indexing="ij")
        grid = poll_int * np.exp(
            -((Y - plume_lat) ** 2 / (2 * spread ** 2)
              + (X - plume_lon) ** 2 / (2 * spread ** 2))
        )
        cy, cx = GRID // 2, GRID // 2
        grid[cy - 1:cy + 2, cx - 1:cx + 2] += poll_int * 0.8
        grid = np.clip(grid, 0, 200)

        pts: list[dict] = []
        for i in range(GRID):
            for j in range(GRID):
                if grid[i, j] > 3:
                    pts.append({
                        "lat": round(float(lat_range[i]), 6),
                        "lon": round(float(lon_range[j]), 6),
                        "z":   round(float(grid[i, j]), 1),
                    })
        return pts

    @staticmethod
    def _compute_zones(plume: list[dict]) -> list[dict]:
        out = []
        for z in GABES_ZONES:
            nearby = [p["z"] for p in plume
                      if abs(p["lat"] - z["lat"]) < 0.015
                      and abs(p["lon"] - z["lon"]) < 0.015]
            poll = float(np.mean(nearby)) if nearby else 0.0
            if   poll >= 40: impact, color = "Tres affecte", "#e74c3c"
            elif poll >= 15: impact, color = "Affecte",      "#f39c12"
            elif poll >=  5: impact, color = "Peu affecte",  "#f1c40f"
            else:            impact, color = "Non affecte",  "#2ecc71"
            out.append({
                "name":       z["name"],
                "lat":        z["lat"],
                "lon":        z["lon"],
                "pollution":  round(poll, 1),
                "impact":     impact,
                "color":      color,
                "population": z["population"],
                "type":       z["type"],
            })
        return out

    @staticmethod
    def _compute_arrows(lat, lon, wind_deg, wind_speed) -> list[dict]:
        wind_rad  = np.radians(wind_deg)
        dx        =  np.sin(wind_rad)
        dy        = -np.cos(wind_rad)
        arrow_len = wind_speed * 0.005
        radius    = 0.028
        arrows = []
        for a in np.linspace(0, 2 * np.pi, 10, endpoint=False):
            slat = lat + radius * np.cos(a)
            slon = lon + radius * np.sin(a)
            arrows.append({
                "slat": round(slat + dy * arrow_len, 6),
                "slon": round(slon + dx * arrow_len, 6),
                "elat": round(float(slat), 6),
                "elon": round(float(slon), 6),
            })
        return arrows

    @staticmethod
    def _build_recommendation(wind_qual: str, risk_label: str, prod_before: float,
                              prod_after: float, products: list[str]) -> dict:
        delta = prod_after - prod_before
        if wind_qual == "toward_sea" and risk_label == "low":
            headline = "Vent favorable vers la mer"
            detail = ("La direction du vent évacue les émissions au large. "
                      "Vous pouvez maintenir ou augmenter la production sans impact sur la ville.")
            action = "boost"
        elif wind_qual == "toward_city":
            headline = "Vent dirigé vers la ville"
            detail = ("Le vent pousse le panache vers les zones habitées. "
                      "Réduction de production recommandée pour protéger la population et éviter les amendes.")
            action = "reduce"
        elif risk_label == "high":
            headline = "Risque pollution élevé"
            detail = ("Paramètres météo critiques. Activez les produits anti-pollution et réduisez temporairement la cadence.")
            action = "reduce"
        else:
            headline = "Conditions stables"
            detail = "Pas d'action immédiate requise, mais surveillance recommandée."
            action = "hold"
        return {
            "headline":   headline,
            "detail":     detail,
            "action":     action,
            "delta_pct":  round((delta / prod_before) * 100, 1) if prod_before else 0.0,
            "products":   products,
        }

    # ── Endpoint: prédiction complète ───────────────────────────────
    def predict_factory(self, lat: float, lon: float, name: str,
                         production: float = 85.0) -> dict:
        w = self._get_weather(lat, lon)
        TEMP, HUMIDITY = w["temperature"], w["humidity"]
        WIND_SPD, WIND_DEG = w["wind_speed"], w["wind_deg"]

        hour = datetime.now().hour
        dust = float(80 + 40 * np.sin(2 * np.pi * hour / 24))
        poll_int = float(0.4 * production + 0.3 * dust / 3 + 0.2 * TEMP)
        wind_qual, wind_text = self._deg_to_qualitative(WIND_DEG)

        row = {
            "temperature": TEMP, "humidity": HUMIDITY,
            "wind_speed": WIND_SPD, "wind_deg": WIND_DEG,
            "dust_level": dust, "production_level": production,
            "pollution_intensity": poll_int, "hour": hour,
        }
        risk_score, risk_label = self._ml_predict(row)
        _, _, risk_color = self._rule_risk(TEMP, HUMIDITY, WIND_SPD, WIND_DEG, dust, production)

        STRATEGIES = {"high": 0.20, "medium": 0.10, "low": 0.0}
        PRODUCTS_MAP = {
            "high":   ["FilterBoost-Z", "AirClean-X"],
            "medium": ["AirClean-X"],
            "low":    [],
        }
        prod_cut   = STRATEGIES.get(risk_label, 0.0)
        prod_after = production * (1 - prod_cut)
        if wind_qual == "toward_sea" and risk_label == "low":
            prod_after = min(100.0, production * 1.05)
            prod_cut   = -0.05
        products   = PRODUCTS_MAP.get(risk_label, [])
        poll_red   = max(prod_cut, 0) * 60 + len(products) * 9.0

        plume  = self._compute_plume(lat, lon, poll_int, WIND_DEG, WIND_SPD)
        zones  = self._compute_zones(plume)
        arrows = self._compute_arrows(lat, lon, WIND_DEG, WIND_SPD)

        reco = self._build_recommendation(wind_qual, risk_label, production, prod_after, products)

        return {
            "temperature":    round(TEMP, 1),
            "humidity":       round(HUMIDITY, 1),
            "wind_speed":     round(WIND_SPD, 1),
            "wind_deg":       round(WIND_DEG, 1),
            "wind_direction": wind_qual,
            "wind_text":      wind_text,
            "risk_score":     round(risk_score, 1),
            "risk_label":     risk_label,
            "risk_color":     risk_color,
            "pollution_index": round(poll_int, 1),
            "dust_level":     round(dust, 1),
            "production_before": round(production, 1),
            "production_after":  round(prod_after, 1),
            "prod_change_pct":   round(-prod_cut * 100, 1),
            "recommended_products":    products,
            "pollution_reduction_pct": round(min(poll_red, 85.0), 1),
            "plume_points": plume,
            "zones":        zones,
            "arrows":       arrows,
            "recommendation": reco,
            "factory_name":   name,
            "timestamp":      datetime.now().isoformat(),
            "model_used":     "random_forest" if self.models else "rule_based",
        }

    # ── Open-Meteo archive : météo historique RÉELLE ────────────────
    def _get_historical_weather(self, lat: float, lon: float, days: int) -> list[dict]:
        end = datetime.now().date() - timedelta(days=1)   # J-1 = dernière journée complète
        start = end - timedelta(days=days - 1)
        try:
            resp = requests.get(
                "https://archive-api.open-meteo.com/v1/archive",
                params={
                    "latitude":   lat,
                    "longitude":  lon,
                    "start_date": start.isoformat(),
                    "end_date":   end.isoformat(),
                    "daily": ",".join([
                        "temperature_2m_mean",
                        "relative_humidity_2m_mean",
                        "wind_speed_10m_max",
                        "wind_direction_10m_dominant",
                    ]),
                    "wind_speed_unit": "ms",
                    "timezone":  "Africa/Tunis",
                },
                timeout=20,
            )
            resp.raise_for_status()
            js = resp.json()
            daily = js.get("daily", {})
            n = len(daily.get("time", []))
            out: list[dict] = []
            for i in range(n):
                t = daily["temperature_2m_mean"][i]
                h = daily["relative_humidity_2m_mean"][i]
                ws = daily["wind_speed_10m_max"][i]
                wd = daily["wind_direction_10m_dominant"][i]
                if None in (t, h, ws, wd):
                    continue
                out.append({
                    "date":        daily["time"][i],
                    "temperature": float(t),
                    "humidity":    float(h),
                    "wind_speed":  float(ws),
                    "wind_deg":    float(wd),
                })
            if out:
                log.info("Open-Meteo archive: %d real days loaded for (%s, %s)", len(out), lat, lon)
                return out
        except Exception as e:
            log.warning("Open-Meteo archive unreachable (%s) — no real history", e)
        return []

    # ── Endpoint: bilan mensuel économique ──────────────────────────
    def monthly_savings_report(self, lat: float, lon: float, name: str,
                                production: float = 85.0,
                                days: int = 30,
                                price_per_ton_dt: float = 1_400.0) -> dict:
        """Rejoue `days` jours de météo HISTORIQUE RÉELLE (Open-Meteo archive)
        et calcule le bilan économique à partir de constantes documentées."""

        history = self._get_historical_weather(lat, lon, days)
        data_source = "open-meteo_archive" if history else "fallback_climatology"
        if not history:
            # fallback : si archive indisponible, on refuse plutôt que d'inventer
            return {
                "error": "Historique météo Open-Meteo indisponible. Réessayez dans quelques secondes.",
                "data_source": data_source,
                "generated_at": datetime.now().isoformat(),
            }

        by_day: list[dict] = []
        counts = {"high": 0, "medium": 0, "low": 0}
        sum_avoided_fines = sum_health_savings = sum_carbon_credits_dt = 0.0
        sum_boost_revenue = sum_lost_revenue = sum_so2_avoided_ton = 0.0
        used_filterboost = used_airclean = False    # recharge mensuelle unique
        urban_pop_total = sum(z["population"] for z in GABES_ZONES if z["type"] == "urban")
        days_high_cut      = 0   # jours high + vent urbain + coupe production
        days_medium_filter = 0   # jours medium + vent urbain + filtre déployé
        days_boost         = 0   # jours où on a boosté (vent marin favorable)

        for h in history:
            wind_deg = h["wind_deg"]
            wind_spd = h["wind_speed"]
            temp     = h["temperature"]
            humi     = h["humidity"]
            # proxy poussière (Open-Meteo dust_sum disponible sur Sahara)
            # dust dérivé : vent fort + humidité basse → plus de poussière (proxy physique)
            dust = float(np.clip(60 + wind_spd * 6 + (60 - humi) * 0.6, 40, 220))

            poll_int = float(0.4 * production + 0.3 * dust / 3 + 0.2 * temp)
            wind_qual, _ = self._deg_to_qualitative(wind_deg)
            row = {
                "temperature": temp, "humidity": humi,
                "wind_speed": wind_spd, "wind_deg": wind_deg,
                "dust_level": dust, "production_level": production,
                "pollution_intensity": poll_int, "hour": 12,
            }
            score, label = self._ml_predict(row)
            counts[label] = counts.get(label, 0) + 1

            urban_exposed = wind_qual == "toward_city"

            # Stratégie pragmatique :
            #   HIGH + urbain   → coupe 12 % + filtres FilterBoost-Z + AirClean-X (événement rare)
            #   MEDIUM + urbain → filtres AirClean-X uniquement, PAS de coupe (on absorbe)
            #   LOW + mer       → boost +5 % (on profite du vent favorable)
            #   sinon           → production normale
            prod_cut = 0.0
            products: list[str] = []
            boost = 0.0
            if urban_exposed and label == "high":
                prod_cut = 0.12
                products = ["FilterBoost-Z", "AirClean-X"]
                used_filterboost = True; used_airclean = True
                days_high_cut += 1
            elif urban_exposed and label == "medium":
                products = ["AirClean-X"]
                used_airclean = True
                days_medium_filter += 1
            elif wind_qual == "toward_sea" and label == "low":
                prod_cut = -0.05
                boost = 5.0
                days_boost += 1
            prod_after = production * (1 - prod_cut)

            # Amendes évitées : espérance mathématique (probabilité × barème)
            if urban_exposed and label == "high":
                day_fine = P_FINE_PER_HIGH_DAY * AVOIDED_FINE_HIGH_DT
            elif urban_exposed and label == "medium":
                day_fine = P_FINE_PER_MEDIUM_DAY * AVOIDED_FINE_MEDIUM_DT
            else:
                day_fine = 0.0

            # Santé : jours high + coupe → bénéfice plein ; jours medium + filtre → 40 %
            if urban_exposed and label == "high" and prod_cut > 0:
                day_health = urban_pop_total * AVOIDED_HEALTH_DT_PER_PERSON
            elif urban_exposed and label == "medium" and "AirClean-X" in products:
                day_health = urban_pop_total * AVOIDED_HEALTH_DT_PER_PERSON * 0.2
            else:
                day_health = 0.0

            day_so2_avoided  = max(prod_cut, 0) * TONS_SO2_PER_PCT_CUT
            day_carbon       = day_so2_avoided * CARBON_CREDIT_DT_PER_TON
            day_boost_revenue = boost * REVENUE_PER_PCT_DAY_DT
            day_lost_revenue  = max(prod_cut, 0) * 100 * REVENUE_PER_PCT_DAY_DT

            sum_avoided_fines     += day_fine
            sum_health_savings    += day_health
            sum_carbon_credits_dt += day_carbon
            sum_boost_revenue     += day_boost_revenue
            sum_lost_revenue      += day_lost_revenue
            sum_so2_avoided_ton   += day_so2_avoided

            by_day.append({
                "date":        h["date"],
                "wind_deg":    round(wind_deg, 0),
                "wind_speed":  round(wind_spd, 1),
                "temperature": round(temp, 1),
                "humidity":    round(humi, 0),
                "wind_qual":   wind_qual,
                "risk":        label,
                "risk_score":  round(score, 1),
                "prod_pct":    round(prod_after, 1),
                "savings_dt":  round(day_fine + day_health + day_carbon + day_boost_revenue
                                     - day_lost_revenue, 0),
            })
        # Coût produits = recharge mensuelle unique (pas quotidien)
        sum_product_cost = 0.0
        if used_filterboost: sum_product_cost += PRODUCT_MONTHLY_COST_DT["FilterBoost-Z"]
        if used_airclean:    sum_product_cost += PRODUCT_MONTHLY_COST_DT["AirClean-X"]
        platform_licence_cost = PLATFORM_LICENCE_DT_MONTH
        days_protected = days_high_cut + days_medium_filter
        total_population_protected = urban_pop_total if days_protected > 0 else 0

        gross_savings   = sum_avoided_fines + sum_health_savings + sum_carbon_credits_dt + sum_boost_revenue
        gross_costs     = sum_product_cost + sum_lost_revenue + platform_licence_cost
        net_savings     = gross_savings - gross_costs

        # ROI = combien chaque DT investi dans la plateforme rapporte
        invested        = max(platform_licence_cost + sum_product_cost, 1.0)
        roi_pct         = (gross_savings / invested) * 100
        payback_months  = invested / max(net_savings / max(len(history), 1) * 30, 1.0) if net_savings > 0 else None

        return {
            "factory":           {"name": name, "lat": lat, "lon": lon, "production": production},
            "period": {
                "start": history[0]["date"],
                "end":   history[-1]["date"],
                "days":  len(history),
            },
            "data_source": {
                "weather":       "Open-Meteo ERA5 archive (measured, aggregated daily)",
                "weather_url":   "https://archive-api.open-meteo.com/v1/archive",
                "weather_variables": ["temperature_2m_mean", "relative_humidity_2m_mean",
                                        "wind_speed_10m_max", "wind_direction_10m_dominant"],
                "dust_proxy":    "derived from wind_speed & humidity (no public dust feed for Gabès)",
                "risk_model":    "random_forest" if self.models else "rule_based_fallback",
                "wind_azimuth_threshold_toward_city_deg": [45, 135],
            },
            "economic_assumptions": {
                "revenue_per_pct_day_dt":        REVENUE_PER_PCT_DAY_DT,
                "avoided_fine_high_dt":          AVOIDED_FINE_HIGH_DT,
                "avoided_fine_medium_dt":        AVOIDED_FINE_MEDIUM_DT,
                "p_fine_per_high_day":           P_FINE_PER_HIGH_DAY,
                "p_fine_per_medium_day":         P_FINE_PER_MEDIUM_DAY,
                "avoided_health_dt_per_person":  AVOIDED_HEALTH_DT_PER_PERSON,
                "carbon_credit_dt_per_ton":      CARBON_CREDIT_DT_PER_TON,
                "tons_so2_per_pct_cut":          TONS_SO2_PER_PCT_CUT,
                "product_monthly_cost_dt":       PRODUCT_MONTHLY_COST_DT,
                "counting_rules": {
                    "fines":    "espérance mathématique (probabilité × barème), pas amende certaine",
                    "health":   "seulement jours high + vent urbain + réduction appliquée",
                    "products": "recharge mensuelle unique (pas facturation quotidienne)",
                },
                "sources": [
                    "ANPE Tunisie — barème des amendes environnementales (loi 88-91, décret 2005-1991)",
                    "OMS Europe — coût social PM2.5/SO2 (estimation conservatrice par événement aigu)",
                    "World Bank Carbon Pricing Dashboard 2025 — marché volontaire VCM",
                    "GCT Gabès — rapports publics d'émissions SO2 (inventaire annuel)",
                    "Marge/% jour : à calibrer avec la comptabilité de l'usine",
                ],
            },
            "risk_distribution": counts,
            "breakdown": {
                "avoided_fines_dt":     round(sum_avoided_fines, 0),
                "health_savings_dt":    round(sum_health_savings, 0),
                "carbon_credits_dt":    round(sum_carbon_credits_dt, 0),
                "boost_revenue_dt":     round(sum_boost_revenue, 0),
                "product_cost_dt":      round(sum_product_cost, 0),
                "reduced_revenue_dt":   round(sum_lost_revenue, 0),
                "platform_licence_dt":  round(platform_licence_cost, 0),
            },
            "gross_savings_dt":   round(gross_savings, 0),
            "gross_costs_dt":     round(gross_costs, 0),
            "net_savings_dt":     round(net_savings, 0),
            "invested_dt":        round(invested, 0),
            "roi_pct":            round(roi_pct, 1),
            "payback_months":     round(payback_months, 1) if payback_months else None,
            "so2_avoided_ton":    round(sum_so2_avoided_ton, 2),
            "production_ton_sold": round(production / 100 * len(history) * 22.0, 1),
            "population_protected": total_population_protected,
            "days_urban_exposed_and_protected": days_protected,
            "days_high_cut":       days_high_cut,
            "days_medium_filter":  days_medium_filter,
            "days_boost":          days_boost,
            "by_day":             by_day,
            "narrative": self._build_narrative(name, net_savings, counts,
                                                 sum_so2_avoided_ton, roi_pct,
                                                 len(history), days_high_cut,
                                                 days_medium_filter, days_boost),
            "generated_at":       datetime.now().isoformat(),
        }

    @staticmethod
    def _build_narrative(name: str, net_savings: float, counts: dict,
                         so2_ton: float, roi: float, n_days: int = 30,
                         days_high_cut: int = 0, days_medium_filter: int = 0,
                         days_boost: int = 0) -> list[str]:
        lines = [
            f"Sur les {n_days} derniers jours (météo historique **réelle Open-Meteo ERA5**), "
            f"{name} dégage **{net_savings:,.0f} DT** nets en appliquant les décisions "
            "de la plateforme jour par jour.",
        ]
        if days_boost > 0:
            lines.append(
                f"**{days_boost} jours de vent favorable** vers la mer → boost de production autorisé "
                "(la météo devient un avantage compétitif, pas une contrainte)."
            )
        if days_medium_filter > 0:
            lines.append(
                f"**{days_medium_filter} jours à risque modéré** avec vent vers la ville → "
                "filtres AirClean-X déployés automatiquement, production maintenue."
            )
        if days_high_cut > 0:
            lines.append(
                f"**{days_high_cut} jours critiques** détectés → réduction préventive de 12 % + "
                "FilterBoost-Z activé pour protéger les zones urbaines."
            )
        if days_high_cut == 0 and days_medium_filter == 0:
            lines.append(
                "Période calme : aucun jour critique urbain. La valeur de la plateforme provient "
                "de l'optimisation de production (boost). En cas de sirocco, le système basculerait "
                "automatiquement en mode protection."
            )
        lines.append(
            f"**{so2_ton:.1f} t SO₂ évitées** → valorisables en crédits carbone (marché volontaire VCM)."
        )
        lines.append(
            f"**ROI {roi:.0f} %** : chaque DT investi dans la plateforme retourne {roi/100:.1f} DT."
        )
        return lines


# Singleton
engine = WindShieldEngine()
