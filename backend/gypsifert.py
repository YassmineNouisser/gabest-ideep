"""GypsiFert — XGBoost × 3 + SHAP for phosphogypse → agri valorisation.

Loads the artifacts from `phosphogypse en ressources/`:
  - model_dosage.pkl   · XGBoost regression · dosage t/ha
  - model_gain.pkl     · XGBoost regression · yield gain %
  - model_risk.pkl     · XGBoost classification · contamination risk
  - scaler.pkl         · StandardScaler over the 7 numeric features
  - feature_names.pkl  · final feature order after one-hot encoding
  - config.pkl         · numeric_cols, soil_types, crops, risk_threshold, metrics
  - explainer_dosage.pkl · SHAP TreeExplainer for the dosage model

Exposes `GypsiFertInference.predict(...)` returning a JSON-serializable dict
the React dashboard can render directly.
"""

from __future__ import annotations

import os
import warnings
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


# Silence sklearn "X does not have valid feature names" warning that fires when
# we pass DataFrame slices to the scaler.
warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names",
    category=UserWarning,
)


ARTIFACTS_DIR = Path(
    os.environ.get(
        "GYPSIFERT_ARTIFACTS",
        str(Path(__file__).resolve().parent.parent / "phosphogypse en ressources "),
    )
)


SOIL_LABELS = {
    "sandy": "sableux",
    "loamy": "limoneux",
    "clay":  "argileux",
}

CROP_LABELS = {
    "olive":      "olivier",
    "date_palm":  "palmier-dattier",
    "tomato":     "tomate",
    "barley":     "orge",
}

FEATURE_LABELS_FR = {
    "pH":         "pH du sol",
    "Calcium":    "Calcium (mg/kg)",
    "Magnesium":  "Magnésium (mg/kg)",
    "CEC":        "CEC (cmol+/kg)",
    "Cadmium":    "Cadmium (mg/kg)",
    "Lead":       "Plomb (mg/kg)",
    "Rainfall":   "Pluviométrie (mm/an)",
}


def _feature_label(name: str) -> str:
    if name in FEATURE_LABELS_FR:
        return FEATURE_LABELS_FR[name]
    if name.startswith("Soil_Type_"):
        return f"Sol {SOIL_LABELS.get(name.split('_', 2)[-1], name.split('_', 2)[-1])}"
    if name.startswith("Crop_"):
        return f"Culture {CROP_LABELS.get(name.split('_', 1)[-1], name.split('_', 1)[-1])}"
    return name


class GypsiFertInference:
    def __init__(self) -> None:
        self.model_dosage: Any = None
        self.model_gain: Any = None
        self.model_risk: Any = None
        self.scaler: Any = None
        self.feature_names: list[str] = []
        self.config: dict = {}
        self.explainer_dosage: Any = None
        self.ready = False

    # ------------------------------------------------------------------ load
    def load(self) -> None:
        for name in (
            "model_dosage.pkl",
            "model_gain.pkl",
            "model_risk.pkl",
            "scaler.pkl",
            "feature_names.pkl",
            "config.pkl",
            "explainer_dosage.pkl",
        ):
            p = ARTIFACTS_DIR / name
            if not p.exists():
                raise FileNotFoundError(f"GypsiFert artifact missing: {p}")

        self.model_dosage = joblib.load(str(ARTIFACTS_DIR / "model_dosage.pkl"))
        self.model_gain = joblib.load(str(ARTIFACTS_DIR / "model_gain.pkl"))
        self.model_risk = joblib.load(str(ARTIFACTS_DIR / "model_risk.pkl"))
        self.scaler = joblib.load(str(ARTIFACTS_DIR / "scaler.pkl"))
        self.feature_names = list(joblib.load(str(ARTIFACTS_DIR / "feature_names.pkl")))
        self.config = joblib.load(str(ARTIFACTS_DIR / "config.pkl"))
        # The pickled explainer was serialized with a newer Python — rebuild
        # a fresh TreeExplainer from the already-loaded XGBoost model.
        try:
            import shap  # lazy import — only needed for explainability
            self.explainer_dosage = shap.TreeExplainer(self.model_dosage)
        except Exception:
            self.explainer_dosage = None
        self.ready = True

    # ----------------------------------------------------------- prediction
    def _build_X(self, parcelle: dict) -> pd.DataFrame:
        cfg = self.config
        row: dict[str, list[float]] = {
            "pH":        [float(parcelle["pH"])],
            "Calcium":   [float(parcelle["calcium"])],
            "Magnesium": [float(parcelle["magnesium"])],
            "CEC":       [float(parcelle["cec"])],
            "Cadmium":   [float(parcelle["cadmium"])],
            "Lead":      [float(parcelle["lead"])],
            "Rainfall":  [float(parcelle["rainfall"])],
        }
        for st in cfg["soil_types"]:
            row[f"Soil_Type_{st}"] = [1.0 if parcelle["soil_type"] == st else 0.0]
        for cr in cfg["crops"]:
            row[f"Crop_{cr}"] = [1.0 if parcelle["crop"] == cr else 0.0]

        X = pd.DataFrame(row)[self.feature_names].astype(float)
        X[cfg["numeric_cols"]] = self.scaler.transform(X[cfg["numeric_cols"]])
        return X

    def predict(self, parcelle: dict) -> dict:
        if not self.ready:
            raise RuntimeError("GypsiFert model not loaded")

        X = self._build_X(parcelle)

        dosage = float(self.model_dosage.predict(X)[0])
        gain = float(self.model_gain.predict(X)[0])
        risk_prob = float(self.model_risk.predict_proba(X)[0][1])

        threshold = float(self.config.get("risk_threshold", 0.5))
        risk_level = "ÉLEVÉ" if risk_prob >= threshold else "FAIBLE"

        # SHAP contributions for the dosage model — top 4 drivers
        top_shap: list[dict] = []
        if self.explainer_dosage is not None:
            try:
                values = self.explainer_dosage.shap_values(X)
                arr = np.asarray(values)[0] if np.asarray(values).ndim > 1 else np.asarray(values)
                pairs = sorted(
                    zip(self.feature_names, arr),
                    key=lambda kv: abs(float(kv[1])),
                    reverse=True,
                )
                for name, val in pairs[:4]:
                    v = float(val)
                    if abs(v) < 1e-4:
                        continue
                    top_shap.append({
                        "feature": _feature_label(name),
                        "rawFeature": name,
                        "value": round(v, 4),
                        "direction": "augmente" if v > 0 else "réduit",
                    })
            except Exception:
                top_shap = []

        # Produce a one-line French explanation
        driver = top_shap[0]["feature"] if top_shap else "le pH du sol"
        driver_dir = top_shap[0]["direction"] if top_shap else "ajuste"
        message = (
            f"Pour cette parcelle, applique {dosage:.2f} t/ha de phosphogypse. "
            f"Gain attendu : +{gain:.1f} % de rendement. Risque de contamination : {risk_level}. "
            f"Raison principale : {driver} {driver_dir} le dosage optimal."
        )

        return {
            "dosage_t_ha": round(dosage, 2),
            "yield_gain_percent": round(gain, 1),
            "contamination_risk": round(risk_prob, 3),
            "risk_level": risk_level,
            "risk_threshold": round(threshold, 3),
            "top_shap": top_shap,
            "message": message,
            "model": {
                "backbones": "XGBoost × 3 (dosage régression / gain régression / risque classification)",
                "metrics": self.config.get("metrics", {}),
            },
        }


engine = GypsiFertInference()
