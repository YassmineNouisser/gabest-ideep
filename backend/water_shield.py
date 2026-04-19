"""WaterShield — IA de détection de contamination de l'eau d'irrigation.

Charge les artifacts entraînés dans `watershield_app/` :
  - model_safety.pkl              · régresseur safety score 0-100
  - model_recommendation.pkl      · classifieur 4 classes (Safe / Dilute / Tolerant / Do not use)
  - model_high_salinity.pkl       · classifieur binaire
  - model_abnormal_ph.pkl         · classifieur binaire
  - model_heavy_metals_risk.pkl   · classifieur binaire
  - model_high_turbidity.pkl      · classifieur binaire
  - scaler.pkl                    · StandardScaler sur 11 features numériques
  - feature_names.pkl             · ordre des features après one-hot
  - config.pkl                    · config (numeric_features, water_sources, seasons, reco_labels, contaminants)

Expose `WaterShieldInference.predict(observation)` qui prend 5 questions simples
d'un agriculteur (source, distance GCT, couleur, odeur, jours depuis la dernière
pluie) et retourne un diagnostic multi-tâche prêt à afficher dans l'UI React.
"""

from __future__ import annotations

import datetime as _dt
import hashlib
import math
import os
import warnings
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names",
    category=UserWarning,
)


ARTIFACTS_DIR = Path(
    os.environ.get(
        "WATERSHIELD_ARTIFACTS",
        str(Path(__file__).resolve().parent.parent / "watershield_app"),
    )
)


SOURCE_LABELS_FR = {
    "well":    "Forage (nappe)",
    "oasis":   "Source d'oasis",
    "canal":   "Canal d'irrigation",
    "surface": "Eau de surface",
}

COLOR_OPTIONS = ("clear", "cloudy", "brown", "yellow", "green")
ODOR_OPTIONS = ("none", "sulfurous", "metallic", "chemical", "earthy")

COLOR_LABELS_FR = {
    "clear":   "Claire",
    "cloudy":  "Trouble",
    "brown":   "Brunâtre",
    "yellow":  "Jaunâtre",
    "green":   "Verdâtre",
}
ODOR_LABELS_FR = {
    "none":      "Aucune odeur",
    "sulfurous": "Soufre / œuf pourri",
    "metallic":  "Métallique",
    "chemical":  "Chimique / solvant",
    "earthy":    "Terreuse",
}

CONTAMINANT_LABELS_FR = {
    "high_salinity":      "Salinité élevée",
    "abnormal_ph":        "pH anormal",
    "heavy_metals_risk":  "Risque métaux lourds",
    "high_turbidity":     "Turbidité élevée",
}

CONTAMINANT_HINTS_FR = {
    "high_salinity":     "Sodium/chlorures élevés — risque sur racines et rendement.",
    "abnormal_ph":       "pH hors 6,5–8,4 — mobilise métaux et bloque nutriments.",
    "heavy_metals_risk": "Indicateurs proches GCT/industrie — accumulation possible.",
    "high_turbidity":    "Matières en suspension — colmatage goutteurs, UV bloquée.",
}

RECO_LABELS_FR = {
    "Safe use":             "Utilisation sûre",
    "Dilute":               "À diluer avec une source saine",
    "Tolerant crops only":  "Cultures tolérantes uniquement",
    "Do not use":           "Ne pas utiliser",
}

RECO_ACTIONS_FR = {
    "Safe use":
        "Eau conforme. Arrosez normalement — vérifiez à nouveau après un épisode pollué.",
    "Dilute":
        "Diluez à 50 % avec une source plus saine (pluviale, forage éloigné) avant irrigation.",
    "Tolerant crops only":
        "Réservez cette eau aux cultures tolérantes (palmier, olivier, orge). Évitez maraîchage.",
    "Do not use":
        "N'irriguez pas : risque immédiat pour les cultures et la salinisation du sol.",
}


# Cultures tolérantes à l'eau saline / polluée en Tunisie côtière.
TOLERANT_CROPS = ["Palmier dattier", "Olivier", "Grenadier", "Orge", "Luzerne"]
SENSITIVE_CROPS = ["Tomate", "Poivron", "Piment", "Laitue", "Courgette", "Fraisier"]


def _season_now() -> str:
    """Gabès : dry season ≈ mai→septembre, wet ≈ octobre→avril."""
    m = _dt.date.today().month
    return "dry" if 5 <= m <= 9 else "wet"


def _seeded_jitter(seed_str: str, amp: float = 0.1) -> float:
    """Returns a deterministic pseudo-random number in [-amp, +amp]."""
    h = hashlib.md5(seed_str.encode("utf-8")).hexdigest()
    val = int(h[:8], 16) / 0xFFFFFFFF  # [0,1]
    return (val - 0.5) * 2 * amp


def _impute_chemistry(
    water_source: str,
    distance_to_gct_km: float,
    color: str,
    odor: str,
    days_since_rain: int,
    season: str,
) -> dict:
    """Convertit 5 réponses simples → 9 paramètres physico-chimiques + salinité.

    Heuristique inspirée des profils typiques d'eau à Gabès :
    - Forage : TDS/dureté élevés, pH souvent basique, nitrates possibles.
    - Oasis  : plus organique, turbidité modérée, salinité côtière.
    - Canal  : exposé GCT, sulfates/chloramines élevés si proche.
    - Surface: organique, turbide, sulfates variables.

    Cette imputation ne remplace pas une analyse laboratoire — elle fournit des
    features plausibles pour que les modèles scikit-learn puissent produire un
    diagnostic indicatif.
    """
    src = water_source if water_source in {"well", "oasis", "canal", "surface"} else "canal"

    base = {
        "well":    {"ph": 7.6, "Hardness": 230, "Solids": 28_000, "Chloramines": 6.5, "Sulfate": 340, "Conductivity": 520, "Organic_carbon": 11, "Trihalomethanes": 50, "Turbidity": 2.6, "salinity_g_L": 1.6},
        "oasis":   {"ph": 7.3, "Hardness": 190, "Solids": 18_000, "Chloramines": 5.4, "Sulfate": 260, "Conductivity": 410, "Organic_carbon": 14, "Trihalomethanes": 60, "Turbidity": 3.4, "salinity_g_L": 1.1},
        "canal":   {"ph": 7.9, "Hardness": 210, "Solids": 25_000, "Chloramines": 7.3, "Sulfate": 380, "Conductivity": 560, "Organic_carbon": 13, "Trihalomethanes": 75, "Turbidity": 4.0, "salinity_g_L": 1.8},
        "surface": {"ph": 7.4, "Hardness": 175, "Solids": 21_000, "Chloramines": 6.0, "Sulfate": 300, "Conductivity": 460, "Organic_carbon": 16, "Trihalomethanes": 68, "Turbidity": 4.6, "salinity_g_L": 1.3},
    }[src]

    chem = dict(base)

    # --- effet distance au GCT ----------------------------------------------
    d = max(0.5, float(distance_to_gct_km))
    gct_factor = math.exp(-d / 12.0)  # 0.92 à 1 km, 0.44 à 10 km, 0.08 à 30 km
    chem["Sulfate"]        += 220 * gct_factor
    chem["Chloramines"]    += 2.6 * gct_factor
    chem["Trihalomethanes"] += 35 * gct_factor
    chem["Conductivity"]   += 320 * gct_factor
    chem["salinity_g_L"]   += 1.2 * gct_factor

    # --- couleur -------------------------------------------------------------
    col = color if color in COLOR_OPTIONS else "clear"
    if col == "clear":
        chem["Turbidity"] *= 0.5
        chem["Organic_carbon"] *= 0.85
    elif col == "cloudy":
        chem["Turbidity"] *= 1.4
    elif col == "brown":
        chem["Turbidity"] *= 2.2
        chem["Organic_carbon"] *= 1.45
    elif col == "yellow":
        chem["Sulfate"] *= 1.25
        chem["ph"] -= 0.4
        chem["Turbidity"] *= 1.3
    elif col == "green":
        chem["Organic_carbon"] *= 1.65
        chem["Turbidity"] *= 1.3

    # --- odeur ---------------------------------------------------------------
    od = odor if odor in ODOR_OPTIONS else "none"
    if od == "sulfurous":
        chem["Sulfate"] *= 1.4
        chem["Chloramines"] *= 1.2
    elif od == "metallic":
        chem["Hardness"] *= 1.2
        chem["Trihalomethanes"] *= 1.2
        # metallic smell → push up pH slightly (iron/Fe aerobic context)
        chem["ph"] += 0.3
    elif od == "chemical":
        chem["Chloramines"] *= 1.6
        chem["ph"] -= 0.8
        chem["Trihalomethanes"] *= 1.35
    elif od == "earthy":
        chem["Organic_carbon"] *= 1.3

    # --- pluie / concentration ----------------------------------------------
    rd = max(0, int(days_since_rain))
    if rd <= 3:
        # Récente → dilution
        chem["Solids"] *= 0.85
        chem["salinity_g_L"] *= 0.85
        chem["Conductivity"] *= 0.9
    elif rd >= 21:
        # Sécheresse → concentration
        chem["Solids"] *= 1.18
        chem["salinity_g_L"] *= 1.22
        chem["Conductivity"] *= 1.12
        chem["Sulfate"] *= 1.1

    # --- saison --------------------------------------------------------------
    if season == "dry":
        chem["Solids"] *= 1.05
        chem["salinity_g_L"] *= 1.08

    # --- jitter déterministe pour éviter les réponses identiques -------------
    seed = f"{src}|{d:.1f}|{col}|{od}|{rd}|{season}"
    for k in list(chem.keys()):
        chem[k] *= 1.0 + _seeded_jitter(seed + "|" + k, amp=0.06)

    # --- clipping dans les plages physiquement plausibles -------------------
    chem["ph"]              = max(4.0, min(11.0, chem["ph"]))
    chem["Hardness"]        = max(40, min(420, chem["Hardness"]))
    chem["Solids"]          = max(3_000, min(62_000, chem["Solids"]))
    chem["Chloramines"]     = max(0.5, min(13.5, chem["Chloramines"]))
    chem["Sulfate"]         = max(120, min(720, chem["Sulfate"]))
    chem["Conductivity"]    = max(180, min(820, chem["Conductivity"]))
    chem["Organic_carbon"]  = max(2.0, min(28.0, chem["Organic_carbon"]))
    chem["Trihalomethanes"] = max(0.0, min(135.0, chem["Trihalomethanes"]))
    chem["Turbidity"]       = max(1.0, min(7.0, chem["Turbidity"]))
    chem["salinity_g_L"]    = max(0.2, min(7.0, chem["salinity_g_L"]))

    chem["distance_to_GCT_km"] = d
    return chem


class WaterShieldInference:
    def __init__(self) -> None:
        self.model_safety: Any = None
        self.model_recommendation: Any = None
        self.models_contaminants: dict[str, Any] = {}
        self.scaler: Any = None
        self.feature_names: list[str] = []
        self.config: dict = {}
        self.ready = False

    # --------------------------------------------------------------- load
    def load(self) -> None:
        required = [
            "model_safety.pkl",
            "model_recommendation.pkl",
            "model_high_salinity.pkl",
            "model_abnormal_ph.pkl",
            "model_heavy_metals_risk.pkl",
            "model_high_turbidity.pkl",
            "scaler.pkl",
            "feature_names.pkl",
            "config.pkl",
        ]
        for name in required:
            p = ARTIFACTS_DIR / name
            if not p.exists():
                raise FileNotFoundError(f"WaterShield artifact missing: {p}")

        self.model_safety         = joblib.load(str(ARTIFACTS_DIR / "model_safety.pkl"))
        self.model_recommendation = joblib.load(str(ARTIFACTS_DIR / "model_recommendation.pkl"))
        self.models_contaminants = {
            "high_salinity":     joblib.load(str(ARTIFACTS_DIR / "model_high_salinity.pkl")),
            "abnormal_ph":       joblib.load(str(ARTIFACTS_DIR / "model_abnormal_ph.pkl")),
            "heavy_metals_risk": joblib.load(str(ARTIFACTS_DIR / "model_heavy_metals_risk.pkl")),
            "high_turbidity":    joblib.load(str(ARTIFACTS_DIR / "model_high_turbidity.pkl")),
        }
        self.scaler = joblib.load(str(ARTIFACTS_DIR / "scaler.pkl"))
        self.feature_names = list(joblib.load(str(ARTIFACTS_DIR / "feature_names.pkl")))
        self.config = joblib.load(str(ARTIFACTS_DIR / "config.pkl"))
        self.ready = True

    # ------------------------------------------------------------- X build
    def _build_X(self, chem: dict, water_source: str, season: str) -> pd.DataFrame:
        numeric_cols = self.config.get(
            "numeric_features",
            [
                "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
                "Conductivity", "Organic_carbon", "Trihalomethanes",
                "Turbidity", "distance_to_GCT_km", "salinity_g_L",
            ],
        )
        water_sources = self.config.get("water_sources", ["well", "oasis", "canal", "surface"])
        seasons = self.config.get("seasons", ["dry", "wet"])

        row: dict[str, list[float]] = {}
        for col in numeric_cols:
            row[col] = [float(chem.get(col, 0.0))]
        for ws in water_sources:
            row[f"water_source_{ws}"] = [1.0 if water_source == ws else 0.0]
        for ss in seasons:
            row[f"season_{ss}"] = [1.0 if season == ss else 0.0]

        X = pd.DataFrame(row)[self.feature_names].astype(float)
        X[numeric_cols] = self.scaler.transform(X[numeric_cols])
        return X

    # -------------------------------------------------------------- predict
    def predict(self, obs: dict) -> dict:
        if not self.ready:
            raise RuntimeError("WaterShield model not loaded")

        water_source = str(obs.get("water_source", "canal")).lower()
        if water_source not in {"well", "oasis", "canal", "surface"}:
            water_source = "canal"
        distance_to_gct_km = float(obs.get("distance_to_gct_km", 8.0))
        color = str(obs.get("color", "clear")).lower()
        odor = str(obs.get("odor", "none")).lower()
        days_since_rain = int(obs.get("days_since_rain", 7))
        season = str(obs.get("season", _season_now())).lower()
        if season not in {"dry", "wet"}:
            season = _season_now()

        chem = _impute_chemistry(
            water_source, distance_to_gct_km, color, odor, days_since_rain, season
        )

        X = self._build_X(chem, water_source, season)

        # --- safety score 0-100
        try:
            safety_raw = float(np.asarray(self.model_safety.predict(X))[0])
        except Exception:
            safety_raw = 50.0
        safety_score = max(0.0, min(100.0, safety_raw))

        # --- recommendation (str label) ----------------------------------
        try:
            reco_pred = self.model_recommendation.predict(X)[0]
            reco_label = str(reco_pred) if not isinstance(reco_pred, (int, np.integer)) else \
                self.config.get("reco_labels", ["Safe use", "Dilute", "Tolerant crops only", "Do not use"])[int(reco_pred)]
        except Exception:
            reco_label = "Dilute"

        # Garde-fou : si le régresseur safety est très bas, on ne peut pas
        # afficher "Safe use" (le classifieur peut diverger du régresseur sur
        # quelques points synthétiques). On aligne sur la bande de score.
        reco_priority = {"Safe use": 0, "Dilute": 1, "Tolerant crops only": 2, "Do not use": 3}
        if safety_score < 20:
            min_reco = "Do not use"
        elif safety_score < 40:
            min_reco = "Tolerant crops only"
        elif safety_score < 60:
            min_reco = "Dilute"
        else:
            min_reco = "Safe use"
        if reco_priority.get(reco_label, 0) < reco_priority[min_reco]:
            reco_label = min_reco

        # proba distribution (optional)
        reco_probs: dict[str, float] = {}
        try:
            probs = self.model_recommendation.predict_proba(X)[0]
            classes = list(getattr(self.model_recommendation, "classes_", []))
            reco_labels_cfg = self.config.get("reco_labels", classes)
            for i, cls in enumerate(classes):
                label = str(cls) if not isinstance(cls, (int, np.integer)) else reco_labels_cfg[int(cls)]
                reco_probs[label] = round(float(probs[i]), 3)
        except Exception:
            pass

        # --- contaminants ------------------------------------------------
        contaminants: list[dict] = []
        for key, model in self.models_contaminants.items():
            try:
                proba = float(model.predict_proba(X)[0][1])
            except Exception:
                try:
                    proba = float(model.predict(X)[0])
                except Exception:
                    proba = 0.0
            detected = proba >= 0.5
            contaminants.append({
                "key": key,
                "label": CONTAMINANT_LABELS_FR.get(key, key),
                "hint": CONTAMINANT_HINTS_FR.get(key, ""),
                "probability": round(proba, 3),
                "detected": bool(detected),
            })

        # sort detected first, by probability desc
        contaminants.sort(key=lambda c: (-int(c["detected"]), -c["probability"]))

        # --- cultures compatibles ---------------------------------------
        detected_keys = {c["key"] for c in contaminants if c["detected"]}
        if not detected_keys and safety_score >= 75:
            compatible = SENSITIVE_CROPS[:3] + TOLERANT_CROPS[:3]
        elif safety_score >= 55 and detected_keys <= {"high_turbidity"}:
            compatible = ["Tomate (sur paillage)", "Grenadier", "Palmier dattier", "Olivier", "Orge"]
        elif safety_score >= 35:
            compatible = TOLERANT_CROPS
        else:
            compatible = ["Aucune — source à écarter"]

        # --- feature importance / drivers (approximatif sans SHAP) -------
        drivers: list[dict] = []
        try:
            imp = None
            if hasattr(self.model_safety, "feature_importances_"):
                imp = np.asarray(self.model_safety.feature_importances_)
            elif hasattr(self.model_safety, "coef_"):
                imp = np.abs(np.asarray(self.model_safety.coef_)).ravel()
            if imp is not None and len(imp) == len(self.feature_names):
                scaled_values = X.iloc[0].values  # scaled (z-score)
                scores = imp * np.abs(scaled_values)
                pairs = sorted(
                    zip(self.feature_names, scores, scaled_values),
                    key=lambda t: -float(t[1]),
                )
                for name, score, scaled in pairs[:4]:
                    if float(score) <= 1e-5:
                        continue
                    direction = _risk_direction(name, float(scaled), chem)
                    drivers.append({
                        "feature": _feature_fr(name),
                        "rawFeature": name,
                        "impact": round(float(score), 4),
                        "direction": direction,
                    })
        except Exception:
            drivers = []

        # --- message synthétique ----------------------------------------
        driver_txt = drivers[0]["feature"] if drivers else "la source d'eau"
        safety_band = (
            "sûre" if safety_score >= 75
            else "à surveiller" if safety_score >= 55
            else "dégradée" if safety_score >= 35
            else "critique"
        )
        top_contam = next((c for c in contaminants if c["detected"]), None)
        risk_txt = f" Principal risque : {top_contam['label'].lower()}." if top_contam else " Aucun contaminant majeur détecté."
        message = (
            f"Qualité {safety_band} — score {safety_score:.0f}/100."
            f"{risk_txt} Recommandation : {RECO_LABELS_FR.get(reco_label, reco_label)}."
            f" {RECO_ACTIONS_FR.get(reco_label, '')} Déclencheur : {driver_txt}."
        )

        return {
            "safety_score": round(safety_score, 1),
            "safety_band": safety_band,
            "recommendation": {
                "key": reco_label,
                "label": RECO_LABELS_FR.get(reco_label, reco_label),
                "action": RECO_ACTIONS_FR.get(reco_label, ""),
                "probabilities": reco_probs,
            },
            "contaminants": contaminants,
            "compatible_crops": compatible,
            "drivers": drivers,
            "imputed_chemistry": {k: round(float(v), 2) for k, v in chem.items()},
            "context": {
                "water_source": water_source,
                "water_source_label": SOURCE_LABELS_FR.get(water_source, water_source),
                "distance_to_gct_km": round(distance_to_gct_km, 1),
                "color": color,
                "color_label": COLOR_LABELS_FR.get(color, color),
                "odor": odor,
                "odor_label": ODOR_LABELS_FR.get(odor, odor),
                "days_since_rain": days_since_rain,
                "season": season,
            },
            "message": message,
            "model": {
                "backbones": "scikit-learn × 6 (régression safety + 5 classifieurs)",
                "features": len(self.feature_names),
                "dataset": "Kaggle water_potability + augmentation Gabès (distance GCT, source, saison, salinité)",
            },
        }


_FEATURE_LABELS_FR: dict[str, str] = {
    "ph":                 "pH de l'eau",
    "Hardness":           "Dureté (mg/L)",
    "Solids":             "TDS — matières dissoutes",
    "Chloramines":        "Chloramines",
    "Sulfate":            "Sulfates (SO₄)",
    "Conductivity":       "Conductivité électrique",
    "Organic_carbon":     "Carbone organique",
    "Trihalomethanes":    "Trihalométhanes (THM)",
    "Turbidity":          "Turbidité",
    "distance_to_GCT_km": "Distance au GCT (km)",
    "salinity_g_L":       "Salinité (g/L)",
    "water_source_well":     "Source · forage",
    "water_source_oasis":    "Source · oasis",
    "water_source_canal":    "Source · canal",
    "water_source_surface":  "Source · surface",
    "season_dry":   "Saison sèche",
    "season_wet":   "Saison humide",
}


def _feature_fr(name: str) -> str:
    return _FEATURE_LABELS_FR.get(name, name)


# Pour chaque feature, sens physique du risque : +1 = "plus haut = plus risqué",
# -1 = "plus haut = plus sûr", 0 = déviation (pH).
_RISK_SIGN: dict[str, int] = {
    "Hardness":           +1,
    "Solids":             +1,
    "Chloramines":        +1,
    "Sulfate":            +1,
    "Conductivity":       +1,
    "Organic_carbon":     +1,
    "Trihalomethanes":    +1,
    "Turbidity":          +1,
    "salinity_g_L":       +1,
    "distance_to_GCT_km": -1,
    "season_dry":         +1,
    "season_wet":         -1,
    "water_source_canal":   +1,
    "water_source_surface": +1,
    "water_source_well":    -1,
    "water_source_oasis":   -1,
}


def _risk_direction(name: str, scaled_value: float, chem: dict) -> str:
    """Retourne 'dégrade' si ce driver pousse vers plus de risque, sinon 'améliore'."""
    # pH : la déviation par rapport au neutre 7,5 est ce qui compte.
    if name == "ph":
        ph = float(chem.get("ph", 7.5))
        return "dégrade" if abs(ph - 7.5) > 0.8 else "améliore"

    sign = _RISK_SIGN.get(name)
    if sign is None:
        # fallback : au-dessus de la moyenne = plus risqué
        return "dégrade" if scaled_value > 0 else "améliore"
    # product of sign (direction physique) × scaled sign (au-dessus/dessous de la moyenne)
    product = sign * (1 if scaled_value > 0 else -1)
    return "dégrade" if product > 0 else "améliore"


engine = WaterShieldInference()
