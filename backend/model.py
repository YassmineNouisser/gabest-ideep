"""GaBest — architecture rebuilt from the Kaggle notebook.

Keep this file in sync with the training notebook: the state_dict saved in
gabest_best.pt can only be loaded if every nn.Module below matches the
original exactly (layer names, dimensions, order).
"""

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv


QUARTIERS = {
    "Bou Chemma": (33.882, 10.098),
    "Chatt":      (33.876, 10.105),
    "Metouia":    (33.971, 10.001),
    "Chenini":    (33.899, 10.044),
    "El Akarit":  (33.849, 10.143),
    "Oudhref":    (33.830, 10.087),
    "Bab Bhar":   (33.891, 10.118),
    "Jara":       (33.905, 10.071),
}
QUARTIERS_LIST = list(QUARTIERS.keys())
COORDS = np.array(list(QUARTIERS.values()))

FEATURE_COLS = [
    "nb_signalements", "so2", "no2", "pm25", "pm10",
    "dust", "vent_vitesse", "humidite", "temperature",
]

LEVEL_NAMES = ["Normal", "Vigilance", "Critique", "Urgence"]
NUM_NODES = 8
NUM_FEATURES = 9
WINDOW = 7
GRID_SIZE = 16
NUM_CLASSES = 4

LAT_MIN, LAT_MAX = 33.82, 33.98
LON_MIN, LON_MAX = 9.99, 10.15

# GCT (Groupe Chimique Tunisien) is at the south-east of the bay.
# Proximity classification used for UI / context (not a model input).
PROXIMITY_GCT = {
    "Bou Chemma": "proche",
    "Chatt":      "proche",
    "El Akarit":  "proche",
    "Metouia":    "intermédiaire",
    "Chenini":    "intermédiaire",
    "Jara":       "intermédiaire",
    "Oudhref":    "périphérique",
    "Bab Bhar":   "périphérique",
}


def build_edge_index(threshold_km: float = 10.0):
    """Compute the static 8-node graph used by GAT."""
    from sklearn.metrics.pairwise import haversine_distances

    dist = haversine_distances(np.radians(COORDS)) * 6371.0
    src, dst, w = [], [], []
    for i in range(NUM_NODES):
        for j in range(NUM_NODES):
            if i != j and dist[i, j] < threshold_km:
                src.append(i)
                dst.append(j)
                w.append(1.0 / (dist[i, j] + 0.1))
    edge_index = torch.tensor([src, dst], dtype=torch.long)
    edge_attr = torch.tensor(w, dtype=torch.float).unsqueeze(1)
    return edge_index, edge_attr, dist


class GATBranch(nn.Module):
    def __init__(self, in_channels=9, hidden=32, heads=4, out=64, dropout=0.3):
        super().__init__()
        self.gat1 = GATConv(in_channels, hidden, heads=heads, dropout=dropout)
        self.gat2 = GATConv(hidden * heads, out, heads=1, concat=False, dropout=dropout)
        self.norm = nn.LayerNorm(out)

    def forward(self, x, edge_index, return_attention=False):
        if return_attention:
            x1, att1 = self.gat1(x, edge_index, return_attention_weights=True)
            x1 = F.elu(x1)
            x2, att2 = self.gat2(x1, edge_index, return_attention_weights=True)
            x2 = F.elu(x2)
            return self.norm(x2), (att1, att2)
        x = F.elu(self.gat1(x, edge_index))
        x = F.elu(self.gat2(x, edge_index))
        return self.norm(x)


class BiLSTMBranch(nn.Module):
    def __init__(self, input_size=9, hidden=64, num_layers=2, out=64, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, hidden,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout,
        )
        self.fc = nn.Linear(hidden * 2, out)
        self.norm = nn.LayerNorm(out)

    def forward(self, x_seq):
        out, (hn, _) = self.lstm(x_seq)
        hn = torch.cat([hn[-2], hn[-1]], dim=1)
        return self.norm(F.relu(self.fc(hn)))


class CNNSpatialBranch(nn.Module):
    def __init__(self, out=64):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.fc = nn.Linear(32 * 4 * 4, out)
        self.norm = nn.LayerNorm(out)

    def forward(self, x_map):
        x = self.conv(x_map)
        x = x.view(x.size(0), -1)
        return self.norm(F.relu(self.fc(x)))


class GaBestZoneClassifier(nn.Module):
    def __init__(self, num_nodes: int = NUM_NODES, num_classes: int = NUM_CLASSES):
        super().__init__()
        self.num_nodes = num_nodes
        self.gat = GATBranch(in_channels=NUM_FEATURES, out=64)
        self.lstm = BiLSTMBranch(input_size=NUM_FEATURES, out=64)
        self.cnn = CNNSpatialBranch(out=64)
        self.fusion = nn.Sequential(
            nn.Linear(64 + 64 + 64, 128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes),
        )

    def forward(self, graph_data, x_seq, x_map):
        B = x_map.size(0)
        gat_out = self.gat(graph_data.x, graph_data.edge_index)
        x_seq_flat = x_seq.permute(0, 2, 1, 3).reshape(B * self.num_nodes, WINDOW, NUM_FEATURES)
        lstm_out = self.lstm(x_seq_flat)
        cnn_out = self.cnn(x_map)
        cnn_out = cnn_out.unsqueeze(1).expand(B, self.num_nodes, 64).reshape(-1, 64)
        combined = torch.cat([gat_out, lstm_out, cnn_out], dim=1)
        return self.fusion(combined)
