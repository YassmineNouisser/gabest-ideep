# 🛡️ Invisible Shield AI — Guide d'intégration React + TypeScript

## Architecture

```
invisible_shield_platform/
├── backend/               ← Python FastAPI (ton modèle ML)
│   ├── main.py            ← API endpoints
│   ├── requirements.txt
│   └── invisible_shield_models.pkl  ← depuis Kaggle output
│
└── frontend/              ← React + TypeScript
    └── src/
        ├── types/index.ts         ← Interfaces TypeScript
        ├── services/api.ts        ← Appels API
        ├── hooks/usePrediction.ts ← Hook React
        └── components/Dashboard.tsx ← UI principale
```

---

## Étape 1 — Backend Python

### 1.1 Télécharge le modèle depuis Kaggle
```
Kaggle → ton notebook → Output → invisible_shield_models.pkl
→ Copie dans: backend/invisible_shield_models.pkl
```

### 1.2 Installe les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 1.3 Lance le serveur
```bash
uvicorn main:app --reload --port 8000
```

### 1.4 Teste l'API
```bash
# Health check
curl http://localhost:8000/health

# Prediction GCT Gabès
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"lat":33.882,"lon":10.098,"name":"GCT Gabes","production":85}'
```

---

## Étape 2 — Frontend React

### 2.1 Crée le projet Vite
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

### 2.2 Copie les fichiers fournis
```
src/types/index.ts          ← interfaces TypeScript
src/services/api.ts         ← service API
src/hooks/usePrediction.ts  ← hook React
src/components/Dashboard.tsx← composant principal
```

### 2.3 Installe les dépendances
```bash
npm install react-map-gl maplibre-gl react-plotly.js plotly.js
npm install -D @types/react-plotly.js
```

### 2.4 Configure le .env
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

### 2.5 Modifie src/App.tsx
```tsx
import Dashboard from "./components/Dashboard"
export default function App() {
  return <Dashboard />
}
```

### 2.6 Lance
```bash
npm run dev
# → http://localhost:5173
```

---

## Ce que fait chaque fichier

| Fichier | Rôle |
|---------|------|
| `backend/main.py` | Reçoit lat/lon usine → appelle API météo → ML → retourne JSON complet |
| `src/types/index.ts` | Types TypeScript (Factory, PredictionResponse, Zone...) |
| `src/services/api.ts` | Fonctions fetch vers le backend |
| `src/hooks/usePrediction.ts` | State management: loading/data/error |
| `src/components/Dashboard.tsx` | UI: carte satellite + zones colorées + graphiques |

---

## Flow de données

```
User clique usine
      ↓
usePrediction.predict(factory, production)
      ↓
api.ts → POST /predict {lat, lon, name, production}
      ↓
FastAPI → Open-Meteo API (vent réel)
      ↓
FastAPI → ML Model (risk score)
      ↓
FastAPI → Calcul plume + zones impact
      ↓
JSON → React state
      ↓
Dashboard: carte satellite + heatmap + markers colorés
```

---

## Réponse API exemple

```json
{
  "temperature": 22.5,
  "wind_speed": 3.1,
  "wind_deg": 86.0,
  "wind_text": "Est → pollution vers la ville",
  "risk_score": 24.3,
  "risk_label": "low",
  "risk_color": "#2ecc71",
  "pollution_index": 45.7,
  "production_before": 85.0,
  "production_after": 85.0,
  "prod_change_pct": 0.0,
  "recommended_products": [],
  "pollution_reduction_pct": 0.0,
  "plume_points": [{"lat": 33.891, "lon": 10.105, "z": 67.2}, ...],
  "zones": [
    {"name": "Centre Ville", "lat": 33.891, "lon": 10.071,
     "pollution": 0.9, "impact": "Non affecte", "color": "#2ecc71"},
    {"name": "Plage / Cote", "lat": 33.872, "lon": 10.118,
     "pollution": 67.2, "impact": "Tres affecte", "color": "#e74c3c"}
  ],
  "arrows": [{"slat": 33.910, "slon": 10.098, "elat": 33.909, "elon": 10.101}]
}
```
