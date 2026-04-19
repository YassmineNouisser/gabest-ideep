"""GabesHeal F2 — ResNet-50 plant disease classifier.

Loads `gabeseal_f2_model.pth` (38 classes) and returns, for any leaf photo:
  - plant + disease (FR) + confidence + top-3
  - severity level
  - a recommended treatment with dosage + price in TND (dinar tunisien)

The weights file (~94 MB) is expected in the repo root folder
`gabeseal_f2_model/gabeseal_f2_model.pth` — override with the
GABESEAL_F2_WEIGHTS env var if needed.
"""

from __future__ import annotations

import base64
import io
import os
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as tv_models
import torchvision.transforms as T
from PIL import Image, ImageDraw


# --------------------------------------------------------------------------- paths
WEIGHTS_PATH = Path(
    os.environ.get(
        "GABESEAL_F2_WEIGHTS",
        str(
            Path(__file__).resolve().parent.parent
            / "gabeseal_f2_model"
            / "gabeseal_f2_model.pth"
        ),
    )
)


# --------------------------------------------------------------------------- labels
# Human-friendly French labels for the 38 PlantVillage classes the model was
# fine-tuned on. Keys are the raw folder names exported in `idx_to_class`.
DISEASE_FR: dict[str, dict[str, str]] = {
    "Apple___Apple_scab":                        {"plant": "Pommier",       "disease": "Tavelure du pommier"},
    "Apple___Black_rot":                         {"plant": "Pommier",       "disease": "Pourriture noire"},
    "Apple___Cedar_apple_rust":                  {"plant": "Pommier",       "disease": "Rouille grillagée"},
    "Apple___healthy":                           {"plant": "Pommier",       "disease": "Feuillage sain"},
    "Blueberry___healthy":                       {"plant": "Myrtillier",    "disease": "Feuillage sain"},
    "Cherry_(including_sour)___Powdery_mildew":  {"plant": "Cerisier",      "disease": "Oïdium"},
    "Cherry_(including_sour)___healthy":         {"plant": "Cerisier",      "disease": "Feuillage sain"},
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {"plant": "Maïs", "disease": "Cercosporiose (taches grises)"},
    "Corn_(maize)___Common_rust_":               {"plant": "Maïs",          "disease": "Rouille commune"},
    "Corn_(maize)___Northern_Leaf_Blight":       {"plant": "Maïs",          "disease": "Helminthosporiose (Northern Leaf Blight)"},
    "Corn_(maize)___healthy":                    {"plant": "Maïs",          "disease": "Feuillage sain"},
    "Grape___Black_rot":                         {"plant": "Vigne",         "disease": "Black rot"},
    "Grape___Esca_(Black_Measles)":              {"plant": "Vigne",         "disease": "Esca (Black Measles)"},
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)":{"plant": "Vigne",         "disease": "Brûlure des feuilles (Isariopsis)"},
    "Grape___healthy":                           {"plant": "Vigne",         "disease": "Feuillage sain"},
    "Orange___Haunglongbing_(Citrus_greening)":  {"plant": "Oranger",       "disease": "Huanglongbing (greening)"},
    "Peach___Bacterial_spot":                    {"plant": "Pêcher",        "disease": "Tache bactérienne"},
    "Peach___healthy":                           {"plant": "Pêcher",        "disease": "Feuillage sain"},
    "Pepper,_bell___Bacterial_spot":             {"plant": "Poivron",       "disease": "Tache bactérienne"},
    "Pepper,_bell___healthy":                    {"plant": "Poivron",       "disease": "Feuillage sain"},
    "Potato___Early_blight":                     {"plant": "Pomme de terre","disease": "Alternariose (early blight)"},
    "Potato___Late_blight":                      {"plant": "Pomme de terre","disease": "Mildiou (late blight)"},
    "Potato___healthy":                          {"plant": "Pomme de terre","disease": "Feuillage sain"},
    "Raspberry___healthy":                       {"plant": "Framboisier",   "disease": "Feuillage sain"},
    "Soybean___healthy":                         {"plant": "Soja",          "disease": "Feuillage sain"},
    "Squash___Powdery_mildew":                   {"plant": "Courge",        "disease": "Oïdium"},
    "Strawberry___Leaf_scorch":                  {"plant": "Fraisier",      "disease": "Brûlure des feuilles"},
    "Strawberry___healthy":                      {"plant": "Fraisier",      "disease": "Feuillage sain"},
    "Tomato___Bacterial_spot":                   {"plant": "Tomate",        "disease": "Tache bactérienne"},
    "Tomato___Early_blight":                     {"plant": "Tomate",        "disease": "Alternariose"},
    "Tomato___Late_blight":                      {"plant": "Tomate",        "disease": "Mildiou"},
    "Tomato___Leaf_Mold":                        {"plant": "Tomate",        "disease": "Cladosporiose (leaf mold)"},
    "Tomato___Septoria_leaf_spot":               {"plant": "Tomate",        "disease": "Septoriose"},
    "Tomato___Spider_mites Two-spotted_spider_mite": {"plant": "Tomate",    "disease": "Acariens tétranyques"},
    "Tomato___Target_Spot":                      {"plant": "Tomate",        "disease": "Tache en cible (Corynespora)"},
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus":    {"plant": "Tomate",        "disease": "TYLCV (enroulement jaune)"},
    "Tomato___Tomato_mosaic_virus":              {"plant": "Tomate",        "disease": "Virus de la mosaïque (ToMV)"},
    "Tomato___healthy":                          {"plant": "Tomate",        "disease": "Feuillage sain"},
}


# --------------------------------------------------------------------------- treatments
# Recommended treatment per class. Prices are in TND (dinar tunisien), estimated
# at retail price for 1 ha of protection and sourced from Tunisian agri-supply
# catalogs (e.g. Comptoir Phytosanitaire, AgroInvest). Severity drives the UI
# color.
#
# "healthy" classes emit a preventive recommendation (bio booster / free).
TreatmentEntry = dict[str, Any]

TREATMENTS: dict[str, TreatmentEntry] = {
    "Apple___Apple_scab": {
        "severity": "Élevée",
        "product": "Captane 80 WG",
        "active_ingredient": "Captane 80 %",
        "dose": "200 g / 100 L · 4 passages à 10 j",
        "price_dt": 68, "price_unit": "DT / ha",
        "bio_alternative": "Décoction de prêle + bouillie sulfocalcique",
        "timing": "Dès débourrement, jusqu'à 21 j avant récolte",
    },
    "Apple___Black_rot": {
        "severity": "Élevée",
        "product": "Mancozèbe 75 WG",
        "active_ingredient": "Mancozèbe 75 %",
        "dose": "250 g / 100 L · 3 passages à 14 j",
        "price_dt": 54, "price_unit": "DT / ha",
        "bio_alternative": "Élagage bois mort + cuivre 0,1 %",
        "timing": "Post-floraison + grossissement fruit",
    },
    "Apple___Cedar_apple_rust": {
        "severity": "Moyenne",
        "product": "Myclobutanil 24 EC",
        "active_ingredient": "Myclobutanil 24 %",
        "dose": "30 mL / 100 L · 2 passages à 14 j",
        "price_dt": 72, "price_unit": "DT / ha",
        "bio_alternative": "Éliminer les genévriers à 500 m",
        "timing": "Entre floraison et fin chute pétales",
    },
    "Apple___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Bouillie bordelaise 0,5 % 1×/mois",
        "price_dt": 18, "price_unit": "DT / ha",
        "bio_alternative": "Purin d'ortie foliaire",
        "timing": "Préventif · printemps + automne",
    },
    "Blueberry___healthy": {
        "severity": "Aucune",
        "product": "Fertilisation acidifiante",
        "active_ingredient": "Soufre 80 %",
        "dose": "40 kg/ha",
        "price_dt": 28, "price_unit": "DT / ha",
        "bio_alternative": "Compost de pin 5 t/ha",
        "timing": "Entrée printemps",
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "severity": "Moyenne",
        "product": "Soufre mouillable 80 WG",
        "active_ingredient": "Soufre 80 %",
        "dose": "3 kg/ha · 3 passages à 10 j",
        "price_dt": 32, "price_unit": "DT / ha",
        "bio_alternative": "Lactosérum dilué 10 %",
        "timing": "Dès apparition des premières taches",
    },
    "Cherry_(including_sour)___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Suivi phytosanitaire mensuel",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Taille aérée + paillage",
        "timing": "Toute la saison",
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "severity": "Élevée",
        "product": "Azoxystrobine 25 SC",
        "active_ingredient": "Azoxystrobine 25 %",
        "dose": "0,8 L/ha · 2 passages à 14 j",
        "price_dt": 88, "price_unit": "DT / ha",
        "bio_alternative": "Rotation + Bacillus subtilis foliaire",
        "timing": "V8 → VT (pré-floraison)",
    },
    "Corn_(maize)___Common_rust_": {
        "severity": "Moyenne",
        "product": "Propiconazole 25 EC",
        "active_ingredient": "Propiconazole 25 %",
        "dose": "0,5 L/ha · 1 à 2 passages",
        "price_dt": 64, "price_unit": "DT / ha",
        "bio_alternative": "Variétés résistantes + soufre",
        "timing": "Dès apparition pustules oranges",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "severity": "Élevée",
        "product": "Tébuconazole 43 SC",
        "active_ingredient": "Tébuconazole 43 %",
        "dose": "0,5 L/ha · 2 passages à 14 j",
        "price_dt": 76, "price_unit": "DT / ha",
        "bio_alternative": "Labour résidus + Trichoderma",
        "timing": "V10 → floraison femelle",
    },
    "Corn_(maize)___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Fertilisation azotée équilibrée",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Rotation avec légumineuse",
        "timing": "Toute la campagne",
    },
    "Grape___Black_rot": {
        "severity": "Élevée",
        "product": "Mancozèbe + Méfénoxam",
        "active_ingredient": "Mancozèbe 64 % + Méfénoxam 4 %",
        "dose": "2,5 kg/ha · 3 passages à 10 j",
        "price_dt": 92, "price_unit": "DT / ha",
        "bio_alternative": "Bouillie bordelaise 0,75 %",
        "timing": "Floraison → fermeture grappe",
    },
    "Grape___Esca_(Black_Measles)": {
        "severity": "Critique",
        "product": "Taille curative + mastic cicatrisant",
        "active_ingredient": "Trichoderma atroviride",
        "dose": "Application sur plaies + pulvérisation 2 L/ha",
        "price_dt": 120, "price_unit": "DT / ha",
        "bio_alternative": "Élagage drastique ceps atteints",
        "timing": "Hiver · taille en sec",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "severity": "Moyenne",
        "product": "Cuivre (oxychlorure) 50 WG",
        "active_ingredient": "Cuivre métal 50 %",
        "dose": "3 kg/ha · 2 passages à 12 j",
        "price_dt": 46, "price_unit": "DT / ha",
        "bio_alternative": "Cuivre homologué AB 2 kg/ha",
        "timing": "Après orages estivaux",
    },
    "Grape___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Ébourgeonnage + effeuillage",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Soufre poudre 15 kg/ha préventif",
        "timing": "Nouaison",
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "severity": "Critique",
        "product": "Imidaclopride 20 SL (vecteur)",
        "active_ingredient": "Imidaclopride 20 %",
        "dose": "0,3 L/ha + arrachage arbres atteints",
        "price_dt": 145, "price_unit": "DT / ha",
        "bio_alternative": "Pièges jaunes + Tamarixia radiata",
        "timing": "Signalement obligatoire · lutte collective",
    },
    "Peach___Bacterial_spot": {
        "severity": "Élevée",
        "product": "Cuivre hydroxyde 35 WG",
        "active_ingredient": "Cuivre métal 35 %",
        "dose": "2,5 kg/ha · 3 passages à 10 j",
        "price_dt": 58, "price_unit": "DT / ha",
        "bio_alternative": "Kaolin calciné 30 kg/ha",
        "timing": "Chute pétales → durcissement noyau",
    },
    "Peach___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Badigeon tronc + bouillie bordelaise",
        "price_dt": 22, "price_unit": "DT / ha",
        "bio_alternative": "Paillage + bandes fleuries",
        "timing": "Repos végétatif",
    },
    "Pepper,_bell___Bacterial_spot": {
        "severity": "Élevée",
        "product": "Cuivre + Mancozèbe",
        "active_ingredient": "Cuivre 25 % + Mancozèbe 40 %",
        "dose": "2 kg/ha · 3 passages à 7 j",
        "price_dt": 62, "price_unit": "DT / ha",
        "bio_alternative": "Bacillus subtilis (Serenade) 4 L/ha",
        "timing": "Dès premiers symptômes aqueux",
    },
    "Pepper,_bell___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Irrigation raisonnée + NPK équilibré",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Purin de consoude foliaire",
        "timing": "Toute la saison",
    },
    "Potato___Early_blight": {
        "severity": "Moyenne",
        "product": "Chlorothalonil 75 WG",
        "active_ingredient": "Chlorothalonil 75 %",
        "dose": "2 kg/ha · 3 passages à 10 j",
        "price_dt": 58, "price_unit": "DT / ha",
        "bio_alternative": "Bouillie bordelaise 0,5 %",
        "timing": "Début tubérisation",
    },
    "Potato___Late_blight": {
        "severity": "Critique",
        "product": "Métalaxyl-M + Mancozèbe",
        "active_ingredient": "Métalaxyl-M 4 % + Mancozèbe 64 %",
        "dose": "2,5 kg/ha · 4 passages à 7 j",
        "price_dt": 96, "price_unit": "DT / ha",
        "bio_alternative": "Cuivre 1,5 kg/ha (homologué AB)",
        "timing": "Urgent · avant pluies",
    },
    "Potato___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Buttage + rotation 4 ans",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Plants certifiés + paillage",
        "timing": "Avant floraison",
    },
    "Raspberry___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Taille sanitaire + compost",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Purin d'ortie au printemps",
        "timing": "Automne + fin hiver",
    },
    "Soybean___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Inoculum Rhizobium à la graine",
        "price_dt": 14, "price_unit": "DT / ha",
        "bio_alternative": "Rotation céréale + soja",
        "timing": "Semis",
    },
    "Squash___Powdery_mildew": {
        "severity": "Moyenne",
        "product": "Soufre micronisé 80 WG",
        "active_ingredient": "Soufre 80 %",
        "dose": "4 kg/ha · 2 passages à 10 j",
        "price_dt": 30, "price_unit": "DT / ha",
        "bio_alternative": "Bicarbonate de potassium 5 g/L",
        "timing": "Dès apparition feutrage blanc",
    },
    "Strawberry___Leaf_scorch": {
        "severity": "Moyenne",
        "product": "Myclobutanil 24 EC",
        "active_ingredient": "Myclobutanil 24 %",
        "dose": "30 mL / 100 L · 2 passages",
        "price_dt": 68, "price_unit": "DT / ha",
        "bio_alternative": "Élimination feuilles atteintes",
        "timing": "Début floraison",
    },
    "Strawberry___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Paillage + goutte-à-goutte",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Purin de prêle 5 %",
        "timing": "Plantation + floraison",
    },
    "Tomato___Bacterial_spot": {
        "severity": "Élevée",
        "product": "Cuivre hydroxyde + Mancozèbe",
        "active_ingredient": "Cuivre 20 % + Mancozèbe 40 %",
        "dose": "2,5 kg/ha · 3 passages à 7 j",
        "price_dt": 58, "price_unit": "DT / ha",
        "bio_alternative": "Bacillus subtilis (Serenade) 4 L/ha",
        "timing": "Avant floraison + fructification",
    },
    "Tomato___Early_blight": {
        "severity": "Moyenne",
        "product": "Chlorothalonil 75 WG",
        "active_ingredient": "Chlorothalonil 75 %",
        "dose": "2 kg/ha · 3 passages à 10 j",
        "price_dt": 52, "price_unit": "DT / ha",
        "bio_alternative": "Bouillie bordelaise 0,5 %",
        "timing": "Début fructification",
    },
    "Tomato___Late_blight": {
        "severity": "Critique",
        "product": "Métalaxyl-M + Mancozèbe",
        "active_ingredient": "Métalaxyl-M 4 % + Mancozèbe 64 %",
        "dose": "2,5 kg/ha · 4 passages à 7 j",
        "price_dt": 96, "price_unit": "DT / ha",
        "bio_alternative": "Cuivre 1,5 kg/ha (AB)",
        "timing": "Urgent · sous serre + pluies",
    },
    "Tomato___Leaf_Mold": {
        "severity": "Moyenne",
        "product": "Difénoconazole 25 EC",
        "active_ingredient": "Difénoconazole 25 %",
        "dose": "0,4 L/ha · 2 passages à 10 j",
        "price_dt": 74, "price_unit": "DT / ha",
        "bio_alternative": "Aération serre + humidité < 80 %",
        "timing": "Sous abri · saison froide",
    },
    "Tomato___Septoria_leaf_spot": {
        "severity": "Moyenne",
        "product": "Mancozèbe 75 WG",
        "active_ingredient": "Mancozèbe 75 %",
        "dose": "2 kg/ha · 3 passages à 10 j",
        "price_dt": 50, "price_unit": "DT / ha",
        "bio_alternative": "Taille basse + paillage",
        "timing": "Après épisodes pluvieux",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "severity": "Élevée",
        "product": "Abamectine 1,8 EC",
        "active_ingredient": "Abamectine 1,8 %",
        "dose": "0,6 L/ha · 2 passages à 7 j",
        "price_dt": 84, "price_unit": "DT / ha",
        "bio_alternative": "Phytoseiulus persimilis (lutte bio)",
        "timing": "Temps chaud et sec",
    },
    "Tomato___Target_Spot": {
        "severity": "Moyenne",
        "product": "Azoxystrobine 25 SC",
        "active_ingredient": "Azoxystrobine 25 %",
        "dose": "0,8 L/ha · 2 passages à 14 j",
        "price_dt": 82, "price_unit": "DT / ha",
        "bio_alternative": "Trichoderma harzianum foliaire",
        "timing": "Dès taches concentriques",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "severity": "Critique",
        "product": "Imidaclopride 20 SL (vecteur)",
        "active_ingredient": "Imidaclopride 20 %",
        "dose": "0,3 L/ha · lutte contre Bemisia",
        "price_dt": 110, "price_unit": "DT / ha",
        "bio_alternative": "Filet insect-proof + Encarsia formosa",
        "timing": "Début cycle · plants indemnes",
    },
    "Tomato___Tomato_mosaic_virus": {
        "severity": "Critique",
        "product": "Arrachage + désinfection outils",
        "active_ingredient": "Hypochlorite 2 %",
        "dose": "Désinfecter sécateurs + mains",
        "price_dt": 35, "price_unit": "DT / ha",
        "bio_alternative": "Variétés résistantes Tm-2²",
        "timing": "Dès symptômes · pas de curatif",
    },
    "Tomato___healthy": {
        "severity": "Aucune",
        "product": "Maintien prophylaxie",
        "active_ingredient": "—",
        "dose": "Paillage + irrigation goutte",
        "price_dt": 0, "price_unit": "Gratuit",
        "bio_alternative": "Rotation 3 ans + basilic compagnon",
        "timing": "Toute la saison",
    },
}


# --------------------------------------------------------------------------- causes
# Detailed agronomic causes per class. Exposed under `causes` in the API so the
# farmer UI can explain *why* the anomaly appeared, not just name it.
#
# Schema:
#   pathogen        — Latin/common name + type (fungus / bacterium / virus / pest / abiotic)
#   conditions      — climatic conditions that favour the outbreak (humidity, temp, wind…)
#   transmission    — how the disease spreads (spores, soil, seed, insects, tools…)
#   risk_factors    — farming practices or field states that amplify risk
#   prevention      — cultural + biological prevention actions
#   local_note      — Gabès-specific context (climate, pollution, vectors)

CAUSES: dict[str, dict[str, Any]] = {
    "Apple___Apple_scab": {
        "pathogen": "Venturia inaequalis · champignon ascomycète",
        "conditions": ["Températures 15–24 °C", "Humidité foliaire > 6 h consécutives", "Pluies printanières"],
        "transmission": ["Ascospores libérées depuis les feuilles mortes au sol", "Dispersion par vent et éclaboussures de pluie"],
        "risk_factors": ["Feuilles infectées laissées sous l'arbre", "Vergers trop denses · mauvaise aération", "Irrigation par aspersion en fin de journée"],
        "prevention": ["Ramassage et compostage profond des feuilles en automne", "Taille d'éclaircissage (40 cm d'écart entre branches)", "Variétés résistantes (Florina, Gold Rush)"],
        "local_note": "À Gabès le climat sec limite la tavelure ; vigilance après les pluies de mars–avril.",
    },
    "Apple___Black_rot": {
        "pathogen": "Botryosphaeria obtusa · champignon",
        "conditions": ["Températures 20–26 °C", "Humidité > 85 %", "Blessures d'écorce (grêle, taille)"],
        "transmission": ["Pycnides sur bois mort et momies de fruits", "Pluie et insectes véhiculent les spores"],
        "risk_factors": ["Bois mort non élagué", "Fruits momifiés laissés sur l'arbre", "Stress hydrique et carences en Ca"],
        "prevention": ["Élagage du bois mort en hiver", "Badigeon de chaux sur le tronc", "Fertilisation calcique équilibrée"],
        "local_note": "Surveiller après les épisodes de sirocco qui blessent l'écorce.",
    },
    "Apple___Cedar_apple_rust": {
        "pathogen": "Gymnosporangium juniperi-virginianae · rouille",
        "conditions": ["Pluies printanières + vent", "Proximité d'un genévrier (hôte alternant)"],
        "transmission": ["Télétéospores du genévrier → basidiospores portées sur 3–5 km vers le pommier"],
        "risk_factors": ["Genévriers ornementaux dans un rayon de 500 m", "Taille tardive qui retarde la cicatrisation"],
        "prevention": ["Supprimer les galles sur genévriers (février)", "Planter hors d'atteinte des hôtes alternants"],
        "local_note": "Rare à Gabès : les genévriers restent en altitude (Matmata).",
    },
    "Apple___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Hygrométrie modérée", "Températures printanières douces"],
        "transmission": ["—"],
        "risk_factors": ["Stress hydrique prolongé peut affaiblir l'arbre"],
        "prevention": ["Suivi phytosanitaire mensuel", "Taille aérée + badigeon hiver"],
        "local_note": "Maintien du plan préventif : paillage + bouillie bordelaise 1×/mois au printemps.",
    },
    "Blueberry___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Sol acide (pH 4,5–5,5)", "Humidité du sol régulière"],
        "transmission": ["—"],
        "risk_factors": ["pH alcalin → chlorose ferrique", "Excès de calcaire dans l'irrigation"],
        "prevention": ["Paillage d'écorces de pin", "Irrigation à l'eau de pluie si possible"],
        "local_note": "Plante peu adaptée aux sols calcaires de Gabès : culture hors-sol recommandée.",
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "pathogen": "Podosphaera clandestina · champignon (oïdium)",
        "conditions": ["Températures 20–28 °C", "Humidité relative 60–80 %", "Rosées nocturnes"],
        "transmission": ["Conidies aéroportées sur longue distance", "Persistance sur pousses de l'année précédente"],
        "risk_factors": ["Pousses vigoureuses (excès d'azote)", "Arbres taillés en gobelet fermé", "Proximité de cultures atteintes (vigne, pêcher)"],
        "prevention": ["Taille aérée en gobelet ouvert", "Fertilisation azotée modérée", "Poudrage soufre 15 kg/ha préventif"],
        "local_note": "Saison critique à Gabès : mai–juin, lorsque les nuits humides succèdent aux jours chauds.",
    },
    "Cherry_(including_sour)___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Climat tempéré", "Sol drainant"],
        "transmission": ["—"],
        "risk_factors": ["Rosées persistantes sans aération", "Excès d'azote foliaire"],
        "prevention": ["Taille en gobelet ouvert", "Paillage + goutte-à-goutte"],
        "local_note": "Période à surveiller : floraison (mars) où gel et oïdium coexistent.",
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "pathogen": "Cercospora zeae-maydis · champignon",
        "conditions": ["Températures 22–30 °C", "Humidité > 90 % plusieurs nuits", "Rosées prolongées"],
        "transmission": ["Conidies sur résidus de maïs précédent", "Dispersion par vent sur 50–100 m"],
        "risk_factors": ["Monoculture de maïs", "Résidus non enfouis (semis direct)", "Irrigation par aspersion tardive"],
        "prevention": ["Rotation maïs/légumineuse 2 ans", "Labour ou broyage fin des résidus", "Semis d'hybrides tolérants"],
        "local_note": "Risque modéré à Gabès (climat sec) mais amplifié sous irrigation pivot humidifiant.",
    },
    "Corn_(maize)___Common_rust_": {
        "pathogen": "Puccinia sorghi · rouille (champignon biotrophe)",
        "conditions": ["Températures 16–25 °C", "Humidité foliaire 6 h minimum", "Vents porteurs depuis le sud"],
        "transmission": ["Urédospores aéroportées sur plusieurs centaines de km (source : Afrique subsaharienne)"],
        "risk_factors": ["Semis tardifs (juin–juillet)", "Densité excessive", "Variétés sensibles"],
        "prevention": ["Hybrides résistants (marqueur Rp1)", "Semis précoces (mars–avril)", "Observation hebdomadaire dès V6"],
        "local_note": "Les pustules orange apparaissent après l'arrivée des vents de sirocco chargés de spores.",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "pathogen": "Exserohilum turcicum · champignon",
        "conditions": ["Températures 18–27 °C", "Humidité > 90 % sur 6–18 h"],
        "transmission": ["Conidies depuis résidus infectés", "Éclaboussures de pluie et vent court (< 100 m)"],
        "risk_factors": ["Rotation courte maïs/maïs", "Résidus en surface", "Densité excessive qui retient l'humidité"],
        "prevention": ["Rotation 2 ans min.", "Labour des résidus", "Hybrides avec gène Ht1/Ht2"],
        "local_note": "Rare à Gabès sauf sous irrigation intensive ; surveiller les parcelles après orages d'été.",
    },
    "Corn_(maize)___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Sol profond, bien drainé", "Fertilisation N-P-K équilibrée"],
        "transmission": ["—"],
        "risk_factors": ["Carence azotée en V6 réduit la vigueur"],
        "prevention": ["Rotation avec légumineuse (soja, pois)", "Semis à la densité optimale (7–8 plants/m²)"],
        "local_note": "Suivi hebdomadaire feuilles supérieures pour détection précoce des rouilles.",
    },
    "Grape___Black_rot": {
        "pathogen": "Guignardia bidwellii · champignon ascomycète",
        "conditions": ["Températures 20–26 °C", "Humidité foliaire > 6 h", "Pluies chaudes de mai à juillet"],
        "transmission": ["Ascospores depuis momies de grains et sarments infectés", "Pluies éclaboussantes + vent"],
        "risk_factors": ["Feuillage non effeuillé", "Grappes au sol", "Tailles courtes qui concentrent l'humidité"],
        "prevention": ["Effeuillage zone grappes après nouaison", "Ébourgeonnage rigoureux", "Brûlage des sarments taillés"],
        "local_note": "Dans les vignobles de Chenini-Gabès, l'effeuillage mi-mai est critique.",
    },
    "Grape___Esca_(Black_Measles)": {
        "pathogen": "Complexe Phaeomoniella chlamydospora + Phaeoacremonium spp.",
        "conditions": ["Stress hydrique estival + chaleur > 32 °C", "Plaies de taille ouvertes"],
        "transmission": ["Infection par blessures de taille (vent, pluie, outils)", "Propagation interne du bois sur 5–15 ans"],
        "risk_factors": ["Taille tardive après montée de sève", "Vignes adultes (>10 ans)", "Porte-greffe sensible (110R)"],
        "prevention": ["Taille en mars, temps sec", "Badigeon pâte Trichoderma sur plaies", "Marquage et arrachage ceps mourants"],
        "local_note": "Maladie prioritaire dans les vieilles vignes du Sud tunisien : arracher et remplacer plutôt que traiter.",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "pathogen": "Pseudocercospora vitis · champignon",
        "conditions": ["Pluies estivales", "Humidité > 85 %", "Températures 22–28 °C"],
        "transmission": ["Conidies par vent et éclaboussures", "Hivernage sur feuilles mortes"],
        "risk_factors": ["Feuillage dense non effeuillé", "Vignes palissées au sol"],
        "prevention": ["Effeuillage + palissage haut", "Compostage feuilles tombées"],
        "local_note": "Apparaît après les orages de fin août : planifier un traitement cuivre post-orage.",
    },
    "Grape___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Climat sec ensoleillé", "Sol drainant"],
        "transmission": ["—"],
        "risk_factors": ["Stress hydrique prolongé", "Grêle"],
        "prevention": ["Effeuillage + ébourgeonnage", "Soufre poudre préventif à la nouaison"],
        "local_note": "Le climat de Gabès est globalement favorable à la vigne — surveiller seulement les nuits humides.",
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "pathogen": "Candidatus Liberibacter asiaticus · bactérie vasculaire",
        "conditions": ["Températures douces 20–32 °C", "Populations du psylle Diaphorina citri"],
        "transmission": ["Psylle asiatique vecteur (vol 1–2 km)", "Greffage à partir de matériel infecté"],
        "risk_factors": ["Plantation près de vergers non surveillés", "Plants non certifiés"],
        "prevention": ["Plants certifiés indemnes", "Pièges jaunes + insecticides ciblés", "Signalement obligatoire à l'INRA"],
        "local_note": "Menace émergente dans le Sud tunisien : tout arbre suspect doit être arraché — lutte collective.",
    },
    "Peach___Bacterial_spot": {
        "pathogen": "Xanthomonas arboricola pv. pruni · bactérie",
        "conditions": ["Températures 24–28 °C", "Pluies battantes + vent", "Humidité > 75 %"],
        "transmission": ["Bactéries sur lésions de rameaux (chancres)", "Éclaboussures de pluie sur feuilles jeunes"],
        "risk_factors": ["Vergers palissés serrés", "Irrigation par aspersion", "Variétés sensibles (Fairhaven, Redhaven)"],
        "prevention": ["Variétés tolérantes (Harrow Diamond)", "Taille hivernale + élimination des chancres", "Badigeon cuivre en fin d'hiver"],
        "local_note": "Favorisée par les vents marins de Gabès qui transportent les bactéries.",
    },
    "Peach___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Hiver marqué (besoin en froid)", "Été sec"],
        "transmission": ["—"],
        "risk_factors": ["Gels tardifs endommagent bourgeons"],
        "prevention": ["Badigeon tronc + bouillie bordelaise à la chute des feuilles"],
        "local_note": "Le climat doux de Gabès peut manquer d'heures de froid : choisir variétés à faible besoin (Flordastar).",
    },
    "Pepper,_bell___Bacterial_spot": {
        "pathogen": "Xanthomonas campestris pv. vesicatoria · bactérie",
        "conditions": ["Températures 24–30 °C", "Humidité > 80 %", "Rosées prolongées"],
        "transmission": ["Semences contaminées", "Éclaboussures d'irrigation", "Outils et mains"],
        "risk_factors": ["Semences non traitées", "Serre mal aérée", "Irrigation en fin de journée"],
        "prevention": ["Semences certifiées désinfectées", "Goutte-à-goutte (pas d'aspersion)", "Aération de serre matin + soir"],
        "local_note": "Problème majeur sous serres de Chenini : aérer dès 7 h du matin.",
    },
    "Pepper,_bell___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Températures 22–28 °C", "Humidité 60–70 %"],
        "transmission": ["—"],
        "risk_factors": ["Stress thermique > 35 °C", "Carence calcique (nécrose apicale)"],
        "prevention": ["Irrigation régulière", "Apport calcique foliaire"],
        "local_note": "Sous serre à Gabès : veiller à maintenir l'hygrométrie sous 70 %.",
    },
    "Potato___Early_blight": {
        "pathogen": "Alternaria solani · champignon",
        "conditions": ["Alternances sec/humide", "Températures 24–29 °C", "Rosées nocturnes"],
        "transmission": ["Conidies sur débris de culture", "Vent sur courte distance (<100 m)"],
        "risk_factors": ["Stress hydrique fin de cycle", "Carence azotée", "Rotation courte pdt/pdt"],
        "prevention": ["Rotation 3 ans min.", "Fertilisation N équilibrée", "Butter pour couvrir tubercules"],
        "local_note": "Première maladie observée à Gabès : surveiller dès la tubérisation.",
    },
    "Potato___Late_blight": {
        "pathogen": "Phytophthora infestans · oomycète",
        "conditions": ["Humidité > 90 % sur 6 h", "Températures 10–24 °C", "Pluies fraîches"],
        "transmission": ["Sporanges aéroportés sur plusieurs km", "Résidus infectés au sol", "Plants contaminés"],
        "risk_factors": ["Irrigation aspersion", "Densité serrée qui piège l'humidité", "Plants non certifiés"],
        "prevention": ["Plants certifiés", "Écartement 75 × 30 cm", "Buttage haut", "Écimer feuillage 10 j avant récolte"],
        "local_note": "Risque élevé à Gabès après les dépressions automnales apportant pluies et vent du nord.",
    },
    "Potato___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Sol profond, frais", "pH 5,5–6,5"],
        "transmission": ["—"],
        "risk_factors": ["Sol compacté, mal drainé"],
        "prevention": ["Buttage régulier", "Plants certifiés"],
        "local_note": "Cycle conseillé à Gabès : plantation décembre–janvier, récolte avril–mai.",
    },
    "Raspberry___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Sol frais, acide", "Ombrage partiel"],
        "transmission": ["—"],
        "risk_factors": ["Excès d'eau → pourriture racinaire"],
        "prevention": ["Paillage écorce + taille sanitaire"],
        "local_note": "Framboisier peu adapté au climat chaud de Gabès — préférer culture en altitude (Matmata).",
    },
    "Soybean___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Températures 20–30 °C", "Sol neutre bien drainé"],
        "transmission": ["—"],
        "risk_factors": ["Carence en Rhizobium si première culture"],
        "prevention": ["Inoculum à la graine", "Rotation avec céréale"],
        "local_note": "Culture émergente dans les périmètres irrigués de Gabès : penser à inoculer.",
    },
    "Squash___Powdery_mildew": {
        "pathogen": "Podosphaera xanthii · champignon",
        "conditions": ["Températures 20–28 °C", "Humidité 50–70 %", "Rosées matinales"],
        "transmission": ["Conidies aéroportées sur courte distance", "Persistance sur résidus"],
        "risk_factors": ["Densité excessive", "Irrigation par aspersion", "Variétés sensibles"],
        "prevention": ["Variétés résistantes (CYV)", "Écartement 1,5 m", "Soufre mouillable préventif"],
        "local_note": "Courante sous serre en fin d'été : aérer dès 6 h.",
    },
    "Strawberry___Leaf_scorch": {
        "pathogen": "Diplocarpon earlianum · champignon",
        "conditions": ["Températures 20–26 °C", "Humidité > 85 %", "Pluies printanières"],
        "transmission": ["Conidies + ascospores depuis feuilles mortes", "Éclaboussures de pluie"],
        "risk_factors": ["Paillage plastique surchauffant", "Couverture foliaire dense", "Résidus non éliminés"],
        "prevention": ["Paillage clair réfléchissant", "Effeuillage régulier", "Rotation 3 ans"],
        "local_note": "Problème sous tunnels de Gabès : surveiller après orages d'avril.",
    },
    "Strawberry___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Températures 15–22 °C", "Sol riche en matière organique"],
        "transmission": ["—"],
        "risk_factors": ["Compactage sol, excès d'eau"],
        "prevention": ["Paillage + goutte-à-goutte"],
        "local_note": "Période idéale à Gabès : octobre–avril (hors période de chaleur).",
    },
    "Tomato___Bacterial_spot": {
        "pathogen": "Xanthomonas campestris pv. vesicatoria · bactérie",
        "conditions": ["Températures 24–30 °C", "Humidité > 80 %", "Rosées prolongées"],
        "transmission": ["Semences contaminées", "Éclaboussures d'irrigation", "Outils et mains souillés"],
        "risk_factors": ["Semences non traitées", "Irrigation aspersion soir", "Serre mal aérée"],
        "prevention": ["Semences certifiées + désinfection", "Goutte-à-goutte", "Rotation 2 ans"],
        "local_note": "Fréquente sous serres de Chenini-Gabès : désinfecter outils entre rangs.",
    },
    "Tomato___Early_blight": {
        "pathogen": "Alternaria solani · champignon",
        "conditions": ["Alternances sec/humide", "Températures 24–29 °C", "Rosées"],
        "transmission": ["Conidies depuis résidus de culture", "Vent courte distance"],
        "risk_factors": ["Plants stressés (eau ou azote)", "Plants trop âgés en fin de cycle", "Densité serrée"],
        "prevention": ["Rotation 2–3 ans", "Effeuillage basse", "Paillage pour éviter éclaboussures"],
        "local_note": "Apparaît d'abord sur les feuilles basses — effeuiller dès les premiers symptômes.",
    },
    "Tomato___Late_blight": {
        "pathogen": "Phytophthora infestans · oomycète",
        "conditions": ["Humidité > 90 % sur 6 h", "Températures 10–24 °C", "Pluies fraîches + brouillard"],
        "transmission": ["Sporanges aéroportés sur plusieurs km", "Résidus infectés au sol", "Plants contaminés"],
        "risk_factors": ["Irrigation aspersion", "Densité excessive", "Proximité de pommes de terre"],
        "prevention": ["Variétés résistantes (gènes Ph2/Ph3)", "Goutte-à-goutte", "Écartement aéré", "Élimination rapide plants atteints"],
        "local_note": "Menace majeure après les dépressions d'octobre : vérifier prévisions OpenWeather.",
    },
    "Tomato___Leaf_Mold": {
        "pathogen": "Passalora fulva (ex Cladosporium fulvum) · champignon",
        "conditions": ["Humidité > 85 %", "Températures 20–25 °C", "Ventilation faible"],
        "transmission": ["Conidies aéroportées en serre", "Persistance sur structures"],
        "risk_factors": ["Serres fermées soir-matin", "Condensation sur plastique", "Densité excessive"],
        "prevention": ["Aération active (extracteurs)", "Chauffage nocturne d'appoint pour rompre la rosée"],
        "local_note": "Typique des serres non chauffées de Gabès en hiver : installer un extracteur.",
    },
    "Tomato___Septoria_leaf_spot": {
        "pathogen": "Septoria lycopersici · champignon",
        "conditions": ["Températures 20–26 °C", "Humidité > 80 %", "Pluies régulières"],
        "transmission": ["Pycnides sur débris de culture", "Éclaboussures de pluie sur feuilles basses"],
        "risk_factors": ["Feuillage bas non effeuillé", "Paillage absent", "Rotation courte"],
        "prevention": ["Paillage plastique ou paille", "Effeuillage basse hebdomadaire", "Rotation 2 ans"],
        "local_note": "Se déclare dans les tunnels non paillés après les pluies d'automne.",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "pathogen": "Tetranychus urticae · acarien tétranyque (ravageur)",
        "conditions": ["Températures 27–33 °C", "Humidité < 50 %", "Poussière foliaire"],
        "transmission": ["Ravageur porté par vent, vêtements, plants voisins"],
        "risk_factors": ["Stress hydrique", "Poussière accumulée sur feuilles (piste agricole)", "Insecticides larges qui tuent prédateurs"],
        "prevention": ["Douchage foliaire matinal", "Lâcher Phytoseiulus persimilis", "Bandes fleuries pour auxiliaires"],
        "local_note": "Problème récurrent dans les serres de Gabès en juillet-août : arroser les allées.",
    },
    "Tomato___Target_Spot": {
        "pathogen": "Corynespora cassiicola · champignon",
        "conditions": ["Températures 25–30 °C", "Humidité > 80 %", "Sous serre chaude"],
        "transmission": ["Conidies aéroportées, résidus de culture"],
        "risk_factors": ["Serres mal aérées", "Rotation courte", "Plants stressés"],
        "prevention": ["Rotation 2 ans", "Aération active", "Désinfection structures en fin de cycle"],
        "local_note": "Émergente sous serres intensives : signaler au CTV pour suivi régional.",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "pathogen": "TYLCV · Begomovirus (ADN circulaire)",
        "conditions": ["Populations de Bemisia tabaci (mouche blanche)", "Températures 24–32 °C"],
        "transmission": ["Bemisia tabaci vecteur persistant", "Plants contaminés introduits en pépinière"],
        "risk_factors": ["Pépinières non protégées", "Serres ouvertes au voisinage des cultures infectées", "Mauvais contrôle des mouches blanches"],
        "prevention": ["Filets insect-proof 50 mesh en pépinière", "Pièges jaunes collants 40/ha", "Variétés tolérantes (gène Ty-3)"],
        "local_note": "Problème numéro 1 de la tomate dans le Sud tunisien — incontournable sans filet insect-proof.",
    },
    "Tomato___Tomato_mosaic_virus": {
        "pathogen": "ToMV · Tobamovirus (ARN très stable)",
        "conditions": ["Pas de conditions climatiques spécifiques", "Activité humaine (taille, palissage)"],
        "transmission": ["Semences contaminées", "Outils de taille, mains, vêtements (tabac fumé)", "Plants infectés voisins"],
        "risk_factors": ["Tabagisme au champ", "Outils non désinfectés entre rangs", "Semences non certifiées"],
        "prevention": ["Semences certifiées", "Désinfection outils (hypochlorite 2 %)", "Interdire tabac au champ", "Variétés Tm-2²"],
        "local_note": "Virus très stable (peut survivre 20 ans dans résidus secs) : éliminer et brûler.",
    },
    "Tomato___healthy": {
        "pathogen": "Aucun pathogène détecté",
        "conditions": ["Températures 20–28 °C", "Humidité 65–75 %"],
        "transmission": ["—"],
        "risk_factors": ["Stress hydrique → nécrose apicale", "Excès azote → feuillage dense sensible"],
        "prevention": ["Goutte-à-goutte", "Fertigation N-K équilibrée", "Effeuillage + palissage"],
        "local_note": "Plan de base à Gabès : filet insect-proof + rotation 3 ans + basilic compagnon.",
    },
}


# --------------------------------------------------------------------------- model
def _build_resnet50(num_classes: int) -> nn.Module:
    """Recreate the exact architecture used during training."""
    model = tv_models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes),
    )
    return model


class PlantDiseaseInference:
    """Lazy-loaded ResNet-50 wrapper. Call `.load()` once on startup."""

    def __init__(self) -> None:
        self.device = torch.device("cpu")
        self.model: nn.Module | None = None
        self.idx_to_class: dict[int, str] = {}
        self.transform: T.Compose | None = None
        self.img_size: int = 224
        self._mean = [0.485, 0.456, 0.406]
        self._std = [0.229, 0.224, 0.225]
        # Grad-CAM hooks
        self._cam_activations: torch.Tensor | None = None
        self._cam_gradients: torch.Tensor | None = None

    # ----------------------------------------------------------------- loading
    def load(self) -> None:
        if not WEIGHTS_PATH.exists():
            raise FileNotFoundError(f"GabesHeal weights missing: {WEIGHTS_PATH}")

        ckpt = torch.load(str(WEIGHTS_PATH), map_location=self.device, weights_only=False)

        # Normalise idx_to_class — the notebook saved JSON-style (str keys).
        raw = ckpt["idx_to_class"]
        self.idx_to_class = {int(k): v for k, v in raw.items()}

        model = _build_resnet50(num_classes=int(ckpt["num_classes"]))
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        self.model = model.to(self.device)

        mean = ckpt.get("imagenet_mean", [0.485, 0.456, 0.406])
        std = ckpt.get("imagenet_std", [0.229, 0.224, 0.225])
        img_size = int(ckpt.get("img_size", 224))
        self._mean = list(mean)
        self._std = list(std)
        self.img_size = img_size
        self.transform = T.Compose([
            T.Resize(256),
            T.CenterCrop(img_size),
            T.ToTensor(),
            T.Normalize(mean, std),
        ])

        # Hook on the last conv block for Grad-CAM
        target = model.layer4[-1]
        target.register_forward_hook(self._cam_fwd_hook)
        target.register_full_backward_hook(self._cam_bwd_hook)

    # ------------------------------------------------------------ Grad-CAM
    def _cam_fwd_hook(self, _m, _i, output):
        self._cam_activations = output

    def _cam_bwd_hook(self, _m, _grad_in, grad_out):
        self._cam_gradients = grad_out[0]

    def _compute_cam(
        self,
        input_tensor: torch.Tensor,
        class_idx: int,
    ) -> np.ndarray:
        """Grad-CAM heatmap [H, W] normalised to [0, 1]."""
        assert self.model is not None
        x = input_tensor.detach().clone().requires_grad_(True)
        logits = self.model(x)
        score = logits[0, class_idx]
        self.model.zero_grad()
        score.backward(retain_graph=False)

        grads = self._cam_gradients  # [1, C, h, w]
        acts = self._cam_activations  # [1, C, h, w]
        assert grads is not None and acts is not None, "Grad-CAM hooks did not fire"

        weights = grads.mean(dim=(2, 3), keepdim=True)      # [1, C, 1, 1]
        cam = (weights * acts).sum(dim=1, keepdim=True)     # [1, 1, h, w]
        cam = F.relu(cam)
        cam = F.interpolate(
            cam, size=(self.img_size, self.img_size),
            mode="bilinear", align_corners=False,
        )[0, 0]
        cam = cam - cam.min()
        denom = float(cam.max().item()) or 1.0
        cam = cam / denom
        return cam.detach().cpu().numpy()

    # ---------------------------------------------------------- image utils
    def _preprocess_preview(self, pil_img: Image.Image) -> Image.Image:
        """Same Resize+CenterCrop as the tensor path, but keeps 8-bit RGB."""
        side = self.img_size
        resized = T.Compose([T.Resize(256), T.CenterCrop(side)])(pil_img)
        return resized

    @staticmethod
    def _cam_to_bbox_circle(cam: np.ndarray, threshold: float = 0.45):
        """Return bbox + enclosing circle in normalized [0,1] coords."""
        h, w = cam.shape
        mask = cam >= threshold
        if not mask.any():
            # fall back to top 2 % hottest pixels
            k = max(1, int(cam.size * 0.02))
            flat = cam.flatten()
            cutoff = np.partition(flat, -k)[-k]
            mask = cam >= cutoff

        ys, xs = np.where(mask)
        x0, x1 = int(xs.min()), int(xs.max())
        y0, y1 = int(ys.min()), int(ys.max())
        cx = (x0 + x1) / 2.0
        cy = (y0 + y1) / 2.0
        r = max(x1 - x0, y1 - y0) / 2.0
        # pad radius a bit so the ring sits OUTSIDE the hot region
        r *= 1.15
        r = max(r, 0.06 * max(h, w))

        return {
            "bbox": {
                "x0": x0 / w, "y0": y0 / h,
                "x1": x1 / w, "y1": y1 / h,
            },
            "circle": {"cx": cx / w, "cy": cy / h, "r": r / max(w, h)},
            "threshold": float(threshold),
            "coverage": float(mask.mean()),
        }

    @staticmethod
    def _cam_png_base64(cam: np.ndarray) -> str:
        """Colorize CAM with a red→yellow colormap and return base64 PNG."""
        # simple jet-ish colormap RGBA
        cam8 = np.clip(cam, 0, 1)
        r = np.clip(1.5 * cam8, 0, 1)
        g = np.clip(1.5 * (cam8 - 0.3), 0, 1) * np.clip(1.3 - cam8, 0, 1)
        b = np.clip(1.5 * (1.0 - cam8) - 0.3, 0, 1)
        alpha = cam8 * 0.7  # transparent where CAM is low
        rgba = np.stack([r, g, b, alpha], axis=-1)
        rgba8 = (rgba * 255).astype(np.uint8)
        img = Image.fromarray(rgba8, mode="RGBA")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    def _processed_png_base64(
        self,
        pil_preview: Image.Image,
        circle: dict,
    ) -> str:
        """Return the cropped view with a drawn circle around the hotspot."""
        img = pil_preview.copy().convert("RGB")
        W, H = img.size
        cx = circle["cx"] * W
        cy = circle["cy"] * H
        r = circle["r"] * max(W, H)
        draw = ImageDraw.Draw(img, "RGBA")
        # glow (soft outer ring)
        draw.ellipse(
            [cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6],
            outline=(255, 80, 80, 90), width=6,
        )
        # sharp inner ring
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(255, 60, 60, 255), width=3,
        )
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def _boxed_png_base64(pil_preview: Image.Image, bbox: dict) -> str:
        """Return the preview with a rounded-rectangle outline around the bbox."""
        img = pil_preview.copy().convert("RGB")
        W, H = img.size
        x0 = int(bbox["x0"] * W)
        y0 = int(bbox["y0"] * H)
        x1 = int(bbox["x1"] * W)
        y1 = int(bbox["y1"] * H)
        # generous padding so the box frames the lesion loosely
        pad = int(0.035 * max(W, H))
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
        x1 = min(W - 1, x1 + pad); y1 = min(H - 1, y1 + pad)
        radius = max(12, int(0.06 * max(W, H)))

        draw = ImageDraw.Draw(img, "RGBA")
        # soft glow (multiple faint strokes)
        for i, (w, a) in enumerate(((10, 28), (6, 48), (3, 90))):
            draw.rounded_rectangle(
                [x0 - w, y0 - w, x1 + w, y1 + w],
                radius=radius + w,
                outline=(180, 48, 48, a),
                width=max(1, 1 + i),
            )
        # sharp main stroke
        draw.rounded_rectangle(
            [x0, y0, x1, y1],
            radius=radius,
            outline=(168, 42, 42, 255),
            width=3,
        )
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def _gradcam_blend_base64(pil_preview: Image.Image, cam: np.ndarray) -> str:
        """Return the preview with the Grad-CAM heatmap alpha-blended on top."""
        base = pil_preview.copy().convert("RGBA")
        W, H = base.size
        cam8 = np.clip(cam, 0, 1).astype(np.float32)
        # warm colormap that mimics the mockup (yellow core → orange → transparent)
        r = np.clip(1.0 + 0.5 * cam8, 0, 1)
        g = np.clip(0.25 + 1.25 * cam8, 0, 1) * np.clip(1.3 - cam8 * 0.6, 0, 1)
        b = np.clip(0.05 + 0.2 * cam8, 0, 1)
        alpha = np.clip(cam8 ** 1.1 * 0.62, 0, 0.85)
        rgba = np.stack([r, g, b, alpha], axis=-1)
        rgba8 = (rgba * 255).astype(np.uint8)
        overlay = Image.fromarray(rgba8, mode="RGBA").resize((W, H), Image.BILINEAR)
        blended = Image.alpha_composite(base, overlay).convert("RGB")
        buf = io.BytesIO()
        blended.save(buf, format="JPEG", quality=90)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    # -------------------------------------------------------------- inference
    def predict(self, image_bytes: bytes, top_k: int = 3) -> dict:
        assert self.model is not None and self.transform is not None, "Model not loaded"

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        preview = self._preprocess_preview(img)
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        # First pass WITH grad to capture Grad-CAM activations/gradients
        with torch.enable_grad():
            logits = self.model(tensor)
            probs = logits.softmax(dim=1)[0].detach()
            top = torch.topk(probs, k=min(top_k, probs.numel()))

            pred_idx = int(top.indices[0].item())
            pred_conf = float(top.values[0].item())
            raw_class = self.idx_to_class[pred_idx]

            # Grad-CAM for the winning class
            cam = self._compute_cam(tensor, pred_idx)

        labels = DISEASE_FR.get(raw_class, {
            "plant": raw_class.split("___")[0].replace("_", " "),
            "disease": (raw_class.split("___")[1] if "___" in raw_class else "Inconnu").replace("_", " "),
        })
        is_healthy = "healthy" in raw_class.lower()

        treatment = TREATMENTS.get(raw_class, {
            "severity": "Inconnue",
            "product": "Consulter un ingénieur agronome",
            "active_ingredient": "—",
            "dose": "—",
            "price_dt": 0, "price_unit": "—",
            "bio_alternative": "—",
            "timing": "Demander un diagnostic terrain",
        })

        causes = CAUSES.get(raw_class, {
            "pathogen": "Pathogène inconnu",
            "conditions": ["—"],
            "transmission": ["—"],
            "risk_factors": ["—"],
            "prevention": ["Demander un diagnostic terrain agronome"],
            "local_note": "Classe non référencée dans la base de causes.",
        })

        top3 = []
        for i in range(top.values.numel()):
            idx = int(top.indices[i].item())
            cls = self.idx_to_class[idx]
            fr = DISEASE_FR.get(cls, {
                "plant": cls.split("___")[0].replace("_", " "),
                "disease": (cls.split("___")[1] if "___" in cls else "?").replace("_", " "),
            })
            top3.append({
                "plant": fr["plant"],
                "disease": fr["disease"],
                "confidence": round(float(top.values[i].item()) * 100, 1),
                "classIdx": idx,
            })

        # --- Reliability signal (honest self-assessment) ---
        top1 = float(top.values[0].item())
        top2 = float(top.values[1].item()) if top.values.numel() > 1 else 0.0
        margin = top1 - top2
        if top1 >= 0.7:
            reliability = "high"
            reliability_label = "Fiable"
            reliability_hint = "Le modèle est confiant · action possible."
        elif top1 >= 0.4 or (top1 >= 0.3 and margin >= 0.15):
            reliability = "medium"
            reliability_label = "À confirmer"
            reliability_hint = (
                "Confiance modérée. Recommandé : une 2ᵉ photo plus nette, feuille cadrée "
                "en lumière naturelle, fond neutre."
            )
        else:
            reliability = "low"
            reliability_label = "Peu fiable"
            reliability_hint = (
                "Confiance faible : l'image ne ressemble pas à une feuille PlantVillage connue. "
                "Reprenez une photo rapprochée d'une feuille isolée avant de commander un traitement."
            )

        # --- Localization (Grad-CAM) ---
        loc = self._cam_to_bbox_circle(cam)
        processed_b64 = self._processed_png_base64(preview, loc["circle"])
        boxed_b64 = self._boxed_png_base64(preview, loc["bbox"])
        gradcam_b64 = self._gradcam_blend_base64(preview, cam)
        heatmap_b64 = self._cam_png_base64(cam)

        return {
            "plant": labels["plant"],
            "disease": labels["disease"],
            "rawClass": raw_class,
            "classIdx": pred_idx,
            "confidence": round(pred_conf * 100, 1),
            "margin": round(margin * 100, 1),
            "isHealthy": is_healthy,
            "reliability": reliability,
            "reliabilityLabel": reliability_label,
            "reliabilityHint": reliability_hint,
            "top3": top3,
            "treatment": {
                "severity": treatment["severity"],
                "product": treatment["product"],
                "activeIngredient": treatment["active_ingredient"],
                "dose": treatment["dose"],
                "priceDt": treatment["price_dt"],
                "priceUnit": treatment["price_unit"],
                "bioAlternative": treatment["bio_alternative"],
                "timing": treatment["timing"],
            },
            "causes": {
                "pathogen": causes["pathogen"],
                "conditions": causes["conditions"],
                "transmission": causes["transmission"],
                "riskFactors": causes["risk_factors"],
                "prevention": causes["prevention"],
                "localNote": causes["local_note"],
            },
            "localization": {
                "imageSize": self.img_size,
                "processedImage": processed_b64,
                "boxedImage": boxed_b64,
                "gradcamImage": gradcam_b64,
                "heatmap": heatmap_b64,
                "bbox": loc["bbox"],
                "circle": loc["circle"],
                "threshold": loc["threshold"],
                "coverage": round(loc["coverage"], 3),
                "method": "Grad-CAM on layer4[-1]",
            },
            "model": {
                "backbone": "ResNet-50 (ImageNet → PlantVillage fine-tuned)",
                "classes": 38,
                "weights_file": WEIGHTS_PATH.name,
            },
        }
