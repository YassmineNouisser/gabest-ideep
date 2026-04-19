// =========================================================================
// BioMatch — Moteur de matching IA agriculteur ↔ industriel
// =========================================================================
//
// Flow:
//   1. L'agriculteur décrit ses déchets (type, quantité, zone).
//   2. L'IA calcule le pouvoir calorifique (PCI) + valeur énergétique totale.
//   3. Liste des usines dont la demande PCI ≤ PCI du lot, triées par
//      distance ou prix décroissant.
//   4. Après acceptation, recommandation d'entreprises de recyclage
//      spécialisées dans le type de déchet accepté.
// =========================================================================

// Aligned 1:1 with the XGBoost model v2.0 (10 waste types).
// Strings must match the model's label_encoder exactly.
export type WasteTypeId =
  | 'alfalfa'
  | 'date_seeds'
  | 'olive_leaves'
  | 'olive_pomace'
  | 'palm_fronds'
  | 'pomegranate_peels'
  | 'sugarcane_bagasse'
  | 'tomato_stems'
  | 'wheat_straw'
  | 'wood_chips';

export interface WasteType {
  id: WasteTypeId;
  label: string;
  emoji: string;
  pci: number;               // MJ/kg — pouvoir calorifique inférieur (sec)
  moisture: number;          // % humidité typique
  conversion: string;        // produit énergétique final
  basePrice: number;         // DT/t — prix de base indicatif
}

export interface WasteInput {
  type: WasteTypeId;
  quantity: number;          // tonnes
  zone: string;              // ex. "Chenini", "Mareth"
}

export interface Factory {
  id: number;
  name: string;
  industry: 'cimenterie' | 'biogaz' | 'biomasse' | 'biofuel' | 'engrais';
  city: string;
  distanceKm: number;        // distance depuis Gabès centre
  minPci: number;            // PCI min exigé (MJ/kg)
  minTons: number;           // tonnage min accepté
  maxTons: number;           // tonnage max accepté
  pricePerTon: number;       // DT/t
  accepts: WasteTypeId[];    // types compatibles
  certification: string;     // ex. "ISO 14001 · ANGed agréée"
  contactEmail: string;
  contactPhone: string;
  description: string;
}

export interface FactoryOffer {
  factory: Factory;
  matchedTons: number;       // quantité qu'ils peuvent absorber
  totalRevenue: number;      // DT gagnés par l'agriculteur
  transportCost: number;     // DT estimés
  netRevenue: number;        // DT net après transport
  distanceKm: number;
  compatibility: number;     // 0-100
}

export interface Recycler {
  id: number;
  name: string;
  city: string;
  specialty: WasteTypeId[];
  process: string;           // ex. "Compostage contrôlé · biogaz"
  certification: string;
  website?: string;
}

export type SortKey = 'distance' | 'price';

// ============================== DATA ==============================

// PCI / moisture defaults below are used ONLY for the live local preview
// (instant feedback while user is still typing). The real HHV comes from
// POST /api/farmer/estimate when the user submits.
export const WASTE_TYPES: WasteType[] = [
  { id: 'alfalfa',           label: 'Luzerne',              emoji: '🌿', pci: 18.4, moisture: 12, conversion: 'Biogaz · compost',         basePrice: 48 },
  { id: 'date_seeds',        label: 'Noyaux de dattes',     emoji: '🫐', pci: 19.6, moisture: 9,  conversion: 'Bioéthanol · biochar',     basePrice: 64 },
  { id: 'olive_leaves',      label: 'Feuilles d\'olivier',  emoji: '🍃', pci: 17.8, moisture: 14, conversion: 'Biomasse · pellets',       basePrice: 52 },
  { id: 'olive_pomace',      label: 'Grignons d\'olive',    emoji: '🫒', pci: 19.2, moisture: 12, conversion: 'Biomasse · chaudière',     basePrice: 85 },
  { id: 'palm_fronds',       label: 'Palmes de palmier',    emoji: '🌴', pci: 17.1, moisture: 16, conversion: 'Biomasse · pellets',       basePrice: 62 },
  { id: 'pomegranate_peels', label: 'Écorces de grenade',   emoji: '🍎', pci: 16.4, moisture: 18, conversion: 'Biogaz · compost',         basePrice: 38 },
  { id: 'sugarcane_bagasse', label: 'Bagasse canne à sucre',emoji: '🎋', pci: 17.6, moisture: 22, conversion: 'Biomasse · cogénération',  basePrice: 56 },
  { id: 'tomato_stems',      label: 'Tiges de tomate',      emoji: '🍅', pci: 15.2, moisture: 24, conversion: 'Biogaz · compost',         basePrice: 28 },
  { id: 'wheat_straw',       label: 'Paille de blé',        emoji: '🌾', pci: 16.6, moisture: 11, conversion: 'Biomasse · pellets',       basePrice: 45 },
  { id: 'wood_chips',        label: 'Copeaux de bois',      emoji: '🪵', pci: 19.8, moisture: 10, conversion: 'Biomasse · pellets',       basePrice: 90 }
];

export const FACTORIES: Factory[] = [
  {
    id: 1,
    name: 'Cimenterie de Gabès (CIOK)',
    industry: 'cimenterie',
    city: 'Ghannouch',
    distanceKm: 8,
    minPci: 16.0,
    minTons: 5,
    maxTons: 500,
    pricePerTon: 95,
    accepts: ['olive_pomace', 'date_seeds', 'palm_fronds', 'wood_chips'],
    certification: 'ISO 14001 · co-combustion agréée',
    contactEmail: 'biomasse@ciok.tn',
    contactPhone: '+216 75 380 100',
    description: 'Four cimentier en substitution partielle fioul — absorbe gros volumes à haut PCI. Contrat annuel reconductible.'
  },
  {
    id: 2,
    name: 'Bio-Énergie Sfax SA',
    industry: 'biomasse',
    city: 'Sfax',
    distanceKm: 135,
    minPci: 14.0,
    minTons: 2,
    maxTons: 80,
    pricePerTon: 72,
    accepts: ['palm_fronds', 'olive_pomace', 'wheat_straw', 'olive_leaves', 'wood_chips'],
    certification: 'ANGed · RSPO tracé',
    contactEmail: 'contrat@bioenergie-sfax.tn',
    contactPhone: '+216 74 210 988',
    description: 'Unité de pelletisation + chaudière 4 MW. Collecte logistique assurée si lot > 10 t.'
  },
  {
    id: 3,
    name: 'GreenGas Mahrès',
    industry: 'biogaz',
    city: 'Mahrès',
    distanceKm: 95,
    minPci: 10.0,
    minTons: 1,
    maxTons: 40,
    pricePerTon: 38,
    accepts: ['tomato_stems', 'pomegranate_peels', 'alfalfa', 'date_seeds', 'sugarcane_bagasse'],
    certification: 'ANGed · électricité verte STEG',
    contactEmail: 'achat@greengas-mahres.tn',
    contactPhone: '+216 74 290 450',
    description: 'Digesteur anaérobie 1200 m³. Priorité aux déchets humides riches en matière organique.'
  },
  {
    id: 4,
    name: 'BioFuel Kerkennah',
    industry: 'biofuel',
    city: 'Kerkennah',
    distanceKm: 170,
    minPci: 15.0,
    minTons: 5,
    maxTons: 120,
    pricePerTon: 88,
    accepts: ['date_seeds', 'olive_pomace', 'sugarcane_bagasse'],
    certification: 'EN 14214 · export UE',
    contactEmail: 'sourcing@biofuel-krkn.tn',
    contactPhone: '+216 74 480 300',
    description: 'Transformation en bioéthanol 2ᵉ génération. Paiement à 30 j, contrat trimestriel.'
  },
  {
    id: 5,
    name: 'Chaudière GCT Gabès',
    industry: 'biomasse',
    city: 'Ghannouch',
    distanceKm: 6,
    minPci: 15.5,
    minTons: 3,
    maxTons: 200,
    pricePerTon: 68,
    accepts: ['palm_fronds', 'olive_pomace', 'wheat_straw', 'olive_leaves'],
    certification: 'GCT · réseau vapeur industrielle',
    contactEmail: 'energie@gct.com.tn',
    contactPhone: '+216 75 220 110',
    description: 'Substitution gaz naturel sur chaudière utilités. Ramassage direct, tarif transport compris.'
  },
  {
    id: 6,
    name: 'EcoCompost Mareth',
    industry: 'engrais',
    city: 'Mareth',
    distanceKm: 35,
    minPci: 8.0,
    minTons: 1,
    maxTons: 30,
    pricePerTon: 32,
    accepts: ['tomato_stems', 'pomegranate_peels', 'alfalfa', 'wheat_straw'],
    certification: 'Bio Tunisie · label compost NFU-44',
    contactEmail: 'collecte@ecocompost-mareth.tn',
    contactPhone: '+216 75 640 220',
    description: 'Andains ventilés sur 2 ha — compost normé retourné à 60 DT/t aux agriculteurs partenaires.'
  },
  {
    id: 7,
    name: 'PelletTunisia Sousse',
    industry: 'biomasse',
    city: 'Sousse',
    distanceKm: 220,
    minPci: 16.5,
    minTons: 10,
    maxTons: 150,
    pricePerTon: 82,
    accepts: ['olive_pomace', 'wood_chips', 'palm_fronds', 'olive_leaves'],
    certification: 'ENplus A1 · export EU',
    contactEmail: 'achats@pellettn.com',
    contactPhone: '+216 73 455 700',
    description: 'Pelletisation industrielle à forte valeur ajoutée. Contrat annuel, analyse labo incluse.'
  }
];

export const RECYCLERS: Recycler[] = [
  {
    id: 101,
    name: 'AgriVert Tunisie',
    city: 'Mareth',
    specialty: ['tomato_stems', 'pomegranate_peels', 'alfalfa'],
    process: 'Compostage thermophile + méthanisation mutualisée',
    certification: 'ANGed · Bio Tunisie',
    website: 'agrivert.tn'
  },
  {
    id: 102,
    name: 'OlivaRec',
    city: 'Sfax',
    specialty: ['olive_pomace', 'olive_leaves', 'wood_chips'],
    process: 'Extraction huile + pellets énergétiques',
    certification: 'ISO 14001 · CTA',
    website: 'olivarec.com'
  },
  {
    id: 103,
    name: 'Palm-Cycle',
    city: 'Tozeur',
    specialty: ['palm_fronds', 'date_seeds'],
    process: 'Broyage + biochar agricole + fibres artisanales',
    certification: 'GIZ · PNUD partenaire',
    website: 'palmcycle.tn'
  },
  {
    id: 104,
    name: 'SoilBoost Kairouan',
    city: 'Kairouan',
    specialty: ['wheat_straw', 'tomato_stems', 'alfalfa', 'sugarcane_bagasse'],
    process: 'Paillage + amendement organique',
    certification: 'Bio Tunisie · INAT validé',
    website: 'soilboost.tn'
  },
  {
    id: 105,
    name: 'BioCitrus Cap Bon',
    city: 'Nabeul',
    specialty: ['pomegranate_peels'],
    process: 'Extraction huiles essentielles + pectine',
    certification: 'COSMOS Organic',
    website: 'biocitrus-capbon.tn'
  }
];

// ============================== ENGINE ==============================

function effectivePci(waste: WasteType): number {
  const dryFactor = 1 - waste.moisture / 200;
  return Math.round(waste.pci * dryFactor * 10) / 10;
}

export function computeEnergyValue(input: WasteInput): {
  waste: WasteType;
  pci: number;
  totalMJ: number;
  totalMWh: number;
} | null {
  const waste = WASTE_TYPES.find(w => w.id === input.type);
  if (!waste) return null;
  const pci = effectivePci(waste);
  const totalMJ = Math.round(pci * input.quantity * 1000);
  const totalMWh = Math.round((totalMJ / 3600) * 10) / 10;
  return { waste, pci, totalMJ, totalMWh };
}

export function matchFactories(
  input: WasteInput,
  sort: SortKey = 'distance'
): FactoryOffer[] {
  const energy = computeEnergyValue(input);
  if (!energy) return [];

  const offers: FactoryOffer[] = FACTORIES
    .filter(f => f.accepts.includes(input.type))
    .filter(f => f.minPci <= energy.pci)
    .filter(f => input.quantity >= f.minTons)
    .map(f => {
      const matchedTons = Math.min(input.quantity, f.maxTons);
      const transportCost = Math.round(f.distanceKm * matchedTons * 0.12);
      const totalRevenue = Math.round(matchedTons * f.pricePerTon);
      const netRevenue = totalRevenue - transportCost;
      const pciMargin = (energy.pci - f.minPci) * 4;
      const distanceScore = Math.max(0, 30 - f.distanceKm / 10);
      const priceScore = Math.min(40, f.pricePerTon / 2.5);
      const compatibility = Math.min(
        98,
        Math.max(55, Math.round(50 + pciMargin + distanceScore + priceScore))
      );

      return {
        factory: f,
        matchedTons,
        totalRevenue,
        transportCost,
        netRevenue,
        distanceKm: f.distanceKm,
        compatibility
      };
    });

  offers.sort((a, b) =>
    sort === 'distance'
      ? a.distanceKm - b.distanceKm
      : b.netRevenue - a.netRevenue
  );

  return offers;
}

export function recommendRecyclers(wasteType: WasteTypeId): Recycler[] {
  return RECYCLERS.filter(r => r.specialty.includes(wasteType)).slice(0, 3);
}

export const INDUSTRY_LABEL: Record<Factory['industry'], string> = {
  cimenterie: 'Cimenterie',
  biogaz: 'Biogaz',
  biomasse: 'Biomasse',
  biofuel: 'Biocarburant',
  engrais: 'Compost / engrais'
};

// =========================================================================
// Backend API client — XGBoost v2.0 (HHV prediction)
// =========================================================================

export interface ApiEstimate {
  HHV_MJkg: number;
  quality: 'premium' | 'standard' | 'low';
  energy_MJ: number;
  energy_kWh: number;
  value_DT: number;
  moisture_used: number;
  source: 'xgboost_v2' | 'fallback';
}

const GABES_LAT = 33.881;
const GABES_LON = 10.098;

/**
 * Calls the FastAPI /api/farmer/estimate endpoint and returns the model's
 * prediction. Throws if the backend is unreachable (caller should fallback
 * to computeEnergyValue).
 */
export async function estimateBioWasteAPI(opts: {
  type: WasteTypeId;
  quantityTons: number;
  moisturePct?: number;
  lat?: number;
  lon?: number;
}): Promise<ApiEstimate> {
  const body = {
    waste_type: opts.type,
    quantity_kg: Math.max(1, opts.quantityTons * 1000),
    moisture_pct: opts.moisturePct,
    lat: opts.lat ?? GABES_LAT,
    lon: opts.lon ?? GABES_LON
  };
  const res = await fetch('/api/farmer/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  return (await res.json()) as ApiEstimate;
}

export interface WasteTypeOption {
  value: WasteTypeId;
  label: string;
}

export async function fetchWasteTypesAPI(): Promise<WasteTypeOption[]> {
  const res = await fetch('/api/waste-types');
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as WasteTypeOption[];
}
