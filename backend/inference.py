"""Load gabest_best.pt + scaler.pkl, run inference, compute XAI for all quartiers.

XAI techniques implemented:
  · GNN neighbors  → GAT attention weights (real, from the model's own attention heads)
  · Feature SHAP   → gradient × input (captum-style) averaged over the 7-day sequence
  · Temporal IG    → gradient × input, aggregated per day (J-7 ... J-0)
"""

from __future__ import annotations

import os
import pickle
import warnings
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from torch_geometric.data import Batch, Data

# StandardScaler was fitted on a DataFrame; we pass NumPy arrays at inference.
# The warning is harmless — silence it.
warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names",
    category=UserWarning,
)

from model import (
    COORDS,
    FEATURE_COLS,
    GRID_SIZE,
    LAT_MAX,
    LAT_MIN,
    LEVEL_NAMES,
    LON_MAX,
    LON_MIN,
    NUM_FEATURES,
    NUM_NODES,
    PROXIMITY_GCT,
    QUARTIERS,
    QUARTIERS_LIST,
    WINDOW,
    GaBestZoneClassifier,
    build_edge_index,
)


ARTIFACTS_DIR = Path(
    os.environ.get(
        "GABEST_ARTIFACTS_DIR",
        str(Path(__file__).resolve().parent.parent / "model des zones critiques "),
    )
)

# Human-readable labels for the feature vector — used in SHAP output
FEATURE_LABELS = {
    "nb_signalements": "nb_signalements",
    "so2": "SO₂",
    "no2": "NO₂",
    "pm25": "PM₂.₅",
    "pm10": "PM₁₀",
    "dust": "poussière",
    "vent_vitesse": "vent",
    "humidite": "humidité",
    "temperature": "température",
}


class GabestInference:
    def __init__(self) -> None:
        self.device = torch.device("cpu")
        self.model: GaBestZoneClassifier | None = None
        self.scaler: Any = None
        self.df: pd.DataFrame | None = None
        self.edge_index: torch.Tensor | None = None
        self.dist_matrix: np.ndarray | None = None

    # ------------------------------------------------------------------ loading
    def load(self) -> None:
        model_path = ARTIFACTS_DIR / "gabest_best.pt"
        scaler_path = ARTIFACTS_DIR / "scaler.pkl"
        csv_path = ARTIFACTS_DIR / "signalements_gabes.csv"

        for p in (model_path, scaler_path, csv_path):
            if not p.exists():
                raise FileNotFoundError(f"Artifact missing: {p}")

        model = GaBestZoneClassifier()
        state = torch.load(str(model_path), map_location=self.device, weights_only=False)
        # The checkpoint also contains activation-capture buffers (`.x`, `.y` on
        # ReLU / MaxPool / AdaptiveAvgPool) left over from the XAI captum run
        # in the notebook. They are not needed for inference — strip them.
        clean = {k: v for k, v in state.items() if not k.endswith('.x') and not k.endswith('.y')}
        model.load_state_dict(clean, strict=False)
        model.eval()
        self.model = model.to(self.device)

        with open(scaler_path, "rb") as f:
            self.scaler = pickle.load(f)

        df = pd.read_csv(csv_path)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values(["date", "quartier"]).reset_index(drop=True)
        self.df = df

        edge_index, _, dist = build_edge_index()
        self.edge_index = edge_index.to(self.device)
        self.dist_matrix = dist

    # -------------------------------------------------------------- preprocessing
    def _scale(self, arr: np.ndarray) -> np.ndarray:
        """Apply the StandardScaler to a (N, 9) feature matrix."""
        return self.scaler.transform(arr)

    def _build_inputs(self, target_date: pd.Timestamp):
        """Build the 3 inputs expected by the model for a single day."""
        df = self.df
        assert df is not None

        all_dates = sorted(df["date"].unique())
        if target_date not in set(all_dates):
            target_date = all_dates[-1]
        idx = all_dates.index(target_date)
        if idx < WINDOW:
            target_date = all_dates[WINDOW]
            idx = WINDOW

        window_dates = all_dates[idx - WINDOW: idx]

        # Branch 2 : sequence [1, 7, 8, 9]
        seq = np.zeros((WINDOW, NUM_NODES, NUM_FEATURES), dtype=np.float32)
        for i, d in enumerate(window_dates):
            day = df[df["date"] == d].set_index("quartier").reindex(QUARTIERS_LIST)
            raw = day[FEATURE_COLS].fillna(0.0).values.astype(np.float32)
            seq[i] = self._scale(raw)
        x_seq = torch.tensor(seq, dtype=torch.float32).unsqueeze(0).to(self.device)

        # Branch 1 : graph features at target_date [8, 9]
        day_t = df[df["date"] == target_date].set_index("quartier").reindex(QUARTIERS_LIST)
        node_raw = day_t[FEATURE_COLS].fillna(0.0).values.astype(np.float32)
        node_scaled = self._scale(node_raw).astype(np.float32)
        x_graph = torch.tensor(node_scaled, dtype=torch.float32).to(self.device)

        data = Data(x=x_graph, edge_index=self.edge_index)
        batched = Batch.from_data_list([data]).to(self.device)

        # Branch 3 : heatmap [1, 1, 16, 16]
        grid = np.zeros((GRID_SIZE, GRID_SIZE), dtype=np.float32)
        filled = np.full((GRID_SIZE, GRID_SIZE), -np.inf, dtype=np.float32)
        for q_idx, q in enumerate(QUARTIERS_LIST):
            lat, lon = QUARTIERS[q]
            i = int((lat - LAT_MIN) / (LAT_MAX - LAT_MIN) * (GRID_SIZE - 1))
            j = int((lon - LON_MIN) / (LON_MAX - LON_MIN) * (GRID_SIZE - 1))
            i = max(0, min(GRID_SIZE - 1, i))
            j = max(0, min(GRID_SIZE - 1, j))
            intensite = float(
                node_scaled[q_idx, FEATURE_COLS.index("so2")]
                + node_scaled[q_idx, FEATURE_COLS.index("pm25")]
                + node_scaled[q_idx, FEATURE_COLS.index("nb_signalements")] * 0.5
            )
            if np.isinf(filled[i, j]) or abs(intensite) > abs(filled[i, j]):
                filled[i, j] = intensite
        grid = np.where(np.isinf(filled), 0.0, filled).astype(np.float32)
        x_map = torch.tensor(grid, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)

        return batched, x_seq, x_map, target_date, day_t, window_dates

    # ------------------------------------------------------------------ inference
    @torch.no_grad()
    def _forward(self, batched, x_seq, x_map):
        return self.model(batched, x_seq, x_map)

    def _gat_attention(self, batched) -> np.ndarray:
        """Return a [N,N] attention matrix averaging both GAT layers."""
        with torch.no_grad():
            _, (att1, att2) = self.model.gat(
                batched.x, batched.edge_index, return_attention=True
            )
        mats = []
        for ei, w in (att1, att2):
            w = w.detach().cpu().numpy()
            if w.ndim == 2:
                w = w.mean(axis=1)
            src = ei[0].detach().cpu().numpy()
            dst = ei[1].detach().cpu().numpy()
            mat = np.zeros((NUM_NODES, NUM_NODES), dtype=np.float32)
            for s, d, wi in zip(src, dst, w):
                mat[int(d), int(s)] += float(wi)
            # Row-normalise so each quartier's incoming attention sums to 1
            for r in range(NUM_NODES):
                s = mat[r].sum()
                if s > 0:
                    mat[r] /= s
            mats.append(mat)
        return np.mean(mats, axis=0)

    def _feature_attribution(self, batched, x_seq, x_map, predicted_class: torch.Tensor):
        """Gradient × input, per-node, per-feature, over the 7-day sequence.

        Returns a numpy array of shape [8, 9] and another of shape [8, 7] for
        temporal aggregation (per quartier × per day of the window).
        """
        x_seq_req = x_seq.detach().clone().requires_grad_(True)
        logits = self.model(batched, x_seq_req, x_map)  # [8, 4]
        selected = logits.gather(1, predicted_class.view(-1, 1)).sum()
        selected.backward()
        grad = x_seq_req.grad.detach().cpu().numpy()[0]  # [7, 8, 9]
        seq_np = x_seq.detach().cpu().numpy()[0]          # [7, 8, 9]
        attr = grad * seq_np                              # [7, 8, 9]
        per_feature = attr.mean(axis=0).transpose(0, 1)   # [8, 9]
        per_day = attr.sum(axis=2).transpose(1, 0)        # [8, 7]
        return per_feature, per_day

    # ------------------------------------------------------------------ public
    def predict_all(self, target_date: str | None = None) -> dict:
        assert self.model is not None and self.df is not None

        if target_date is None:
            target_ts = pd.to_datetime(self.df["date"].max())
        else:
            target_ts = pd.to_datetime(target_date)

        batched, x_seq, x_map, real_date, day_t, window_dates = self._build_inputs(target_ts)

        with torch.no_grad():
            logits = self._forward(batched, x_seq, x_map)      # [8, 4]
        probs = torch.softmax(logits, dim=1).cpu().numpy()
        pred_class = logits.argmax(dim=1)
        pred_np = pred_class.cpu().numpy()

        gnn_attn = self._gat_attention(batched)
        feat_attr, day_attr = self._feature_attribution(batched, x_seq, x_map, pred_class)

        raw_today = day_t[FEATURE_COLS].fillna(0.0).values.astype(np.float32)

        quartiers_out = []
        for q_idx, q in enumerate(QUARTIERS_LIST):
            cls = int(pred_np[q_idx])
            conf = float(probs[q_idx, cls])
            probs_row = probs[q_idx].tolist()

            # --- Neighbors (GNNExplainer-style via GAT attention) ---
            row = gnn_attn[q_idx].copy()
            row[q_idx] = 0
            top_n = np.argsort(-row)[:3]
            neighbors = []
            for n_idx in top_n:
                if row[n_idx] < 1e-4:
                    continue
                neighbors.append({
                    "name": QUARTIERS_LIST[int(n_idx)],
                    "weight": float(row[int(n_idx)]),
                })

            # --- SHAP-style feature contributions ---
            contribs = feat_attr[q_idx]
            order = np.argsort(-np.abs(contribs))
            shap = []
            for f_idx in order[:5]:
                if abs(contribs[int(f_idx)]) < 1e-5:
                    continue
                col = FEATURE_COLS[int(f_idx)]
                shap.append({
                    "feature": FEATURE_LABELS.get(col, col),
                    "value": float(contribs[int(f_idx)]),
                })

            # --- Temporal attribution (Captum IG-style) ---
            day_row = day_attr[q_idx]
            day_order = np.argsort(-np.abs(day_row))
            captum = []
            for d_idx in day_order[:3]:
                lag = WINDOW - 1 - int(d_idx)
                lag_label = f"J-{lag}" if lag > 0 else "J-0"
                # Pick the dominant feature for that day to label it
                day_contribs = (
                    x_seq[0, int(d_idx), q_idx].detach().cpu().numpy()
                    * feat_attr[q_idx].shape[-1]
                )
                sub = x_seq[0, int(d_idx), q_idx].detach().cpu().numpy() * contribs
                dom_feature = FEATURE_COLS[int(np.argmax(np.abs(sub)))]
                captum.append({
                    "day": lag_label,
                    "feature": FEATURE_LABELS.get(dom_feature, dom_feature),
                    "value": float(day_row[int(d_idx)]),
                })

            level = LEVEL_NAMES[cls]
            top_feats = [s["feature"] for s in shap[:2]] or ["facteurs stables"]
            neigh_names = [n["name"] for n in neighbors[:2]]
            if level == "Urgence":
                msg = (
                    f"Urgence prédite avec {conf*100:.0f}% de confiance. "
                    f"Facteurs dominants : {', '.join(top_feats)}."
                )
                if neigh_names:
                    msg += f" Propagation attendue depuis {', '.join(neigh_names)}."
            elif level == "Critique":
                msg = (
                    f"Cluster critique en formation. "
                    f"Le modèle pointe {', '.join(top_feats)}."
                )
                if neigh_names:
                    msg += f" Vent porteur depuis {neigh_names[0]}."
            elif level == "Vigilance":
                msg = (
                    f"Vigilance · prépare les patients à risque. "
                    f"Features clés : {', '.join(top_feats)}."
                )
            else:
                msg = "Zone stable · indicateurs sous les seuils critiques."

            lat, lon = QUARTIERS[q]
            quartiers_out.append({
                "name": q,
                "lat": lat,
                "lon": lon,
                "proximityGCT": PROXIMITY_GCT[q],
                "level": level,
                "classIdx": cls,
                "confidence": conf,
                "probs": probs_row,
                "readings": {col: float(raw_today[q_idx, i]) for i, col in enumerate(FEATURE_COLS)},
                "signalements": int(round(raw_today[q_idx, FEATURE_COLS.index("nb_signalements")])),
                "neighbors": neighbors,
                "shap": shap,
                "captum": captum,
                "message": msg,
            })

        counts = {name: 0 for name in LEVEL_NAMES}
        for q in quartiers_out:
            counts[q["level"]] += 1

        return {
            "date": real_date.strftime("%Y-%m-%d") if hasattr(real_date, "strftime") else str(real_date),
            "window": [d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d) for d in window_dates],
            "counts": counts,
            "quartiers": quartiers_out,
            "model": {
                "weights_file": "gabest_best.pt",
                "params": 227_140,
                "classes": LEVEL_NAMES,
                "metrics": {
                    "test_accuracy": 0.8119,
                    "f1_macro": 0.807,
                    "recall_urgence": 0.9359,
                },
            },
        }
