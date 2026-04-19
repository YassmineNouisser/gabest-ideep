# GaBest · Backend FastAPI

Serves real PyTorch inference + XAI (GAT attention, gradient-based SHAP, Integrated-Gradients-style temporal attribution) to the React dashboard.

## Prérequis

- Python 3.9 ou supérieur
- Les 3 artefacts dans `../model des zones critiques/` :
  - `gabest_best.pt`
  - `scaler.pkl`
  - `signalements_gabes.csv`

## Installation (une seule fois)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> Sur Mac Apple Silicon, si l'install de `torch-geometric` échoue, essaye :
> ```bash
> pip install torch==2.2.2
> pip install torch-geometric==2.5.3
> ```

## Lancer l'API

```bash
cd backend
source .venv/bin/activate
python main.py
# API sur http://127.0.0.1:8000
```

Le premier démarrage charge `gabest_best.pt` + `scaler.pkl` + le CSV (~2 s).

## Endpoints

- `GET /health` — vérifie que le modèle est chargé
- `GET /predict` — prédit les 8 quartiers sur la dernière date disponible
- `GET /predict?date=2024-12-30` — prédit sur une date donnée

Réponse `/predict` (tronquée) :
```json
{
  "date": "2024-12-30",
  "counts": { "Normal": 2, "Vigilance": 3, "Critique": 2, "Urgence": 1 },
  "quartiers": [
    {
      "name": "Bou Chemma",
      "level": "Urgence",
      "confidence": 0.913,
      "probs": [0.02, 0.04, 0.19, 0.75],
      "readings": { "so2": 1.48, "pm25": 19.2, ... },
      "neighbors": [{ "name": "Chatt", "weight": 0.41 }, ...],
      "shap":      [{ "feature": "nb_signalements", "value": 0.061 }, ...],
      "captum":    [{ "day": "J-7", "feature": "humidité", "value": 0.038 }, ...],
      "message": "Urgence prédite avec 91% de confiance…"
    }
  ]
}
```

## XAI : ce qui est vraiment calculé

| Technique         | Implémentation                                                    |
| ----------------- | ----------------------------------------------------------------- |
| GNNExplainer      | Poids d'attention GAT (2 couches, moyennés, row-normalisés)       |
| SHAP KernelExplainer | Gradient × input sur la branche LSTM, moyenné sur les 7 jours  |
| Captum IG         | Gradient × input agrégé par jour (J-7 à J-0)                      |

Pas de mock : les 3 signaux proviennent du modèle chargé.

## Dépannage

- **`ModuleNotFoundError: torch_geometric`** → `pip install torch-geometric==2.5.3`
- **`FileNotFoundError: gabest_best.pt`** → vérifie que le dossier `../model des zones critiques/` existe
- **Port 8000 occupé** → lance `python main.py --port 8001` (ou édite `main.py`)
