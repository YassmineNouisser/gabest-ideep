
# api_gypsifert.py - À intégrer dans le backend GABEST
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import shap

app = FastAPI(title="GypsiFert API")

# Chargement unique au démarrage
model_dosage = joblib.load("artifacts/model_dosage.pkl")
model_gain = joblib.load("artifacts/model_gain.pkl")
model_risk = joblib.load("artifacts/model_risk.pkl")
scaler = joblib.load("artifacts/scaler.pkl")
feature_names = joblib.load("artifacts/feature_names.pkl")
config = joblib.load("artifacts/config.pkl")
explainer_dosage = joblib.load("artifacts/explainer_dosage.pkl")

class ParcelleInput(BaseModel):
    pH: float
    Calcium: float
    Magnesium: float
    CEC: float
    Cadmium: float
    Lead: float
    Rainfall: float
    Soil_Type: str  # "sandy", "loamy", "clay"
    Crop: str       # "olive", "date_palm", "tomato", "barley"

@app.post("/predict")
def predict(parcelle: ParcelleInput):
    # Construire input
    data = parcelle.dict()
    input_data = {
        "pH": [data["pH"]], "Calcium": [data["Calcium"]],
        "Magnesium": [data["Magnesium"]], "CEC": [data["CEC"]],
        "Cadmium": [data["Cadmium"]], "Lead": [data["Lead"]],
        "Rainfall": [data["Rainfall"]]
    }
    for st in config["soil_types"]:
        input_data[f"Soil_Type_{st}"] = [1 if data["Soil_Type"] == st else 0]
    for cr in config["crops"]:
        input_data[f"Crop_{cr}"] = [1 if data["Crop"] == cr else 0]
    
    X = pd.DataFrame(input_data)[feature_names].astype(float)
    X[config["numeric_cols"]] = scaler.transform(X[config["numeric_cols"]])
    
    # Prédictions
    dosage = float(model_dosage.predict(X)[0])
    gain = float(model_gain.predict(X)[0])
    risk = float(model_risk.predict_proba(X)[0][1])
    
    # SHAP pour explicabilité
    shap_values = explainer_dosage.shap_values(X)
    feature_importance = dict(zip(feature_names, shap_values[0].tolist()))
    
    return {
        "dosage_t_ha": round(dosage, 2),
        "yield_gain_percent": round(gain, 1),
        "contamination_risk": round(risk, 3),
        "risk_level": "ÉLEVÉ" if risk > 0.5 else "FAIBLE",
        "explanation": {k: round(v, 4) for k, v in feature_importance.items()}
    }

@app.get("/health")
def health():
    return {"status": "ok", "metrics": config["metrics"]}
