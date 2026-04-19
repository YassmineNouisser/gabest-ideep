// =========================================================================
// IndustryMatch — Moteur IA usine → preneurs (agri + ciment + BTP + plâtre)
// =========================================================================
//
// Flow symétrique du côté industriel :
//   1. L'usine déclare un rejet (type, quantité, zone, qualité).
//   2. L'IA évalue la valorisation (DT/t) + impact carbone évité.
//   3. Liste mixte de preneurs : agriculteurs (amendement sol),
//      cimenteries, BTP, plâtreries, composteurs — triée par
//      distance ou prix net.
//   4. Après acceptation, recommandation d'éco-recycleur certifié
//      pour la fraction non-valorisable directement.
// =========================================================================

export type IndustryWasteId =
  | 'phosphogypsum'
  | 'organic_sludge'
  | 'fly_ash'
  | 'slag'
  | 'hdpe'
  | 'wash_water'
  | 'gypsum_dust'
  | 'lime_residue';

export type BuyerType =
  | 'agriculteur'
  | 'cimenterie'
  | 'platrerie'
  | 'btp'
  | 'compost'
  | 'engrais';

export interface IndustryWasteType {
  id: IndustryWasteId;
  label: string;
  emoji: string;
  marketPrice: number;     // DT/t — prix marché secondaire indicatif
  conversion: string;
  co2PerTon: number;       // t CO₂ évitées par tonne valorisée
  category: 'mineral' | 'organic' | 'plastic' | 'liquid';
}

export interface IndustryWasteInput {
  type: IndustryWasteId;
  quantity: number;        // tonnes
  zone: string;
  purity: number;          // % qualité (60-99)
}

export type TransportBy = 'buyer' | 'seller' | 'shared';

export interface GypsiFertParcelle {
  pH: number;
  calcium: number;
  magnesium: number;
  cec: number;
  cadmium: number;
  lead: number;
  rainfall: number;
  soil_type: 'sandy' | 'loamy' | 'clay';
  crop: 'olive' | 'date_palm' | 'tomato' | 'barley';
  areaHa: number; // hectares covered by the co-op / farm
}

export interface AgronomicPrediction {
  dosage_t_ha: number;
  yield_gain_percent: number;
  contamination_risk: number;
  risk_level: 'FAIBLE' | 'ÉLEVÉ';
  risk_threshold: number;
  top_shap: { feature: string; rawFeature: string; value: number; direction: string }[];
  message: string;
}

export interface IndustryBuyer {
  id: number;
  name: string;
  type: BuyerType;
  city: string;
  distanceKm: number;
  minPurity: number;
  minTons: number;
  maxTons: number;
  demandedTons: number;        // NEW: tons the buyer wants right now
  transportBy: TransportBy;    // NEW: who handles logistics
  pricePerTon: number;
  accepts: IndustryWasteId[];
  certification: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  parcelle?: GypsiFertParcelle; // agri buyers accepting phosphogypsum
}

export interface BuyerOffer {
  buyer: IndustryBuyer;
  matchedTons: number;
  demandedTons: number;
  transportBy: TransportBy;
  totalRevenue: number;
  transportCost: number;
  transportCoveredByBuyer: boolean;
  netRevenue: number;
  distanceKm: number;
  compatibility: number;
  co2Avoided: number;
  agronomic?: AgronomicPrediction;
}

export interface IndustryRecycler {
  id: number;
  name: string;
  city: string;
  specialty: IndustryWasteId[];
  process: string;
  certification: string;
}

export type IndustrySortKey = 'distance' | 'price';

// ============================== DATA ==============================

export const INDUSTRY_WASTE_TYPES: IndustryWasteType[] = [
  { id: 'phosphogypsum',  label: 'Phosphogypse',       emoji: '⚗️', marketPrice: 35, conversion: 'Amendement sol · plâtre cartons', co2PerTon: 1.2, category: 'mineral' },
  { id: 'organic_sludge', label: 'Boues organiques',   emoji: '🪨', marketPrice: 18, conversion: 'Compost · digestion biogaz',     co2PerTon: 0.6, category: 'organic' },
  { id: 'fly_ash',        label: 'Cendres volantes',   emoji: '🌫️', marketPrice: 22, conversion: 'Ciment · béton bas-carbone',     co2PerTon: 0.9, category: 'mineral' },
  { id: 'slag',           label: 'Scories métalliques', emoji: '🔥', marketPrice: 28, conversion: 'BTP · sous-couches routières',   co2PerTon: 1.1, category: 'mineral' },
  { id: 'hdpe',           label: 'Plastique HDPE',     emoji: '♻️', marketPrice: 45, conversion: 'Recyclage matière secondaire',   co2PerTon: 1.8, category: 'plastic' },
  { id: 'wash_water',     label: 'Eaux process traitées', emoji: '💧', marketPrice: 8, conversion: 'Irrigation contrôlée · réuse',   co2PerTon: 0.2, category: 'liquid' },
  { id: 'gypsum_dust',    label: 'Poussières de gypse', emoji: '🌪️', marketPrice: 25, conversion: 'Plâtre · enduits techniques',    co2PerTon: 0.8, category: 'mineral' },
  { id: 'lime_residue',   label: 'Résidus de chaux',   emoji: '⚪', marketPrice: 30, conversion: 'Neutralisation sol · stabilisation',co2PerTon: 1.0, category: 'mineral' }
];

export const INDUSTRY_BUYERS: IndustryBuyer[] = [
  // ---------- Agriculteurs (preneurs phosphogypse / boues / chaux) ----------
  {
    id: 1,
    name: 'Coopérative Oasis Chenini',
    type: 'agriculteur',
    city: 'Chenini Nahal',
    distanceKm: 12,
    minPurity: 70,
    minTons: 5,
    maxTons: 80,
    demandedTons: 60,
    transportBy: 'buyer',
    pricePerTon: 42,
    accepts: ['phosphogypsum', 'organic_sludge', 'lime_residue'],
    certification: 'Bio Tunisie · CTAB validé',
    contactEmail: 'cooperative@oasis-chenini.tn',
    contactPhone: '+216 75 280 300',
    description: '38 grenadiers + 12 oliviers · sols alcalins demandent gypse acidifiant. Achat groupé + livraison épandeur partagé.',
    parcelle: {
      pH: 7.9, calcium: 520, magnesium: 185, cec: 11.5,
      cadmium: 0.022, lead: 9, rainfall: 185,
      soil_type: 'sandy', crop: 'olive', areaHa: 48
    }
  },
  {
    id: 2,
    name: 'GIE Olive Métouia',
    type: 'agriculteur',
    city: 'Métouia',
    distanceKm: 18,
    minPurity: 65,
    minTons: 10,
    maxTons: 200,
    demandedTons: 180,
    transportBy: 'buyer',
    pricePerTon: 38,
    accepts: ['phosphogypsum', 'lime_residue', 'organic_sludge'],
    certification: 'GDA · INAT validé',
    contactEmail: 'gie@olive-metouia.tn',
    contactPhone: '+216 75 412 100',
    description: 'Groupement 24 oléiculteurs sur 340 ha. Contrat saisonnier épandage post-récolte (nov–fév).',
    parcelle: {
      pH: 8.1, calcium: 610, magnesium: 240, cec: 16,
      cadmium: 0.03, lead: 14, rainfall: 175,
      soil_type: 'loamy', crop: 'olive', areaHa: 340
    }
  },
  {
    id: 3,
    name: 'Ferme El Hamma Bio',
    type: 'agriculteur',
    city: 'El Hamma',
    distanceKm: 28,
    minPurity: 75,
    minTons: 3,
    maxTons: 40,
    demandedTons: 25,
    transportBy: 'buyer',
    pricePerTon: 45,
    accepts: ['organic_sludge', 'lime_residue'],
    certification: 'Bio Tunisie · NF U44-051',
    contactEmail: 'contact@elhamma-bio.tn',
    contactPhone: '+216 75 540 220',
    description: 'Maraîchage bio 18 ha · forte demande matière organique stabilisée. Paiement comptant à livraison.'
  },

  // ---------- Cimenteries (preneurs cendres / scories) ----------
  {
    id: 4,
    name: 'Cimenterie de Gabès (CIOK)',
    type: 'cimenterie',
    city: 'Ghannouch',
    distanceKm: 8,
    minPurity: 80,
    minTons: 50,
    maxTons: 1500,
    demandedTons: 1200,
    transportBy: 'seller',
    pricePerTon: 55,
    accepts: ['fly_ash', 'slag', 'gypsum_dust'],
    certification: 'EN 197-1 · ISO 14001',
    contactEmail: 'achats@ciok.tn',
    contactPhone: '+216 75 380 100',
    description: 'Substitution clinker — réduction empreinte carbone CEM II/B. Contrat-cadre annuel reconductible.'
  },
  {
    id: 5,
    name: 'Cimenterie Sotacib',
    type: 'cimenterie',
    city: 'Kairouan',
    distanceKm: 240,
    minPurity: 82,
    minTons: 80,
    maxTons: 2000,
    demandedTons: 1800,
    transportBy: 'shared',
    pricePerTon: 60,
    accepts: ['fly_ash', 'slag', 'gypsum_dust'],
    certification: 'NT 47.01 · CSI',
    contactEmail: 'sourcing@sotacib.com.tn',
    contactPhone: '+216 77 230 400',
    description: 'Ligne CEM III bas-carbone — gros volumes, transport ferroviaire mutualisé possible.'
  },

  // ---------- Plâtreries (preneurs phosphogypse propre) ----------
  {
    id: 6,
    name: 'Plâtrerie Ben Slimane',
    type: 'platrerie',
    city: 'Sfax',
    distanceKm: 130,
    minPurity: 88,
    minTons: 20,
    maxTons: 600,
    demandedTons: 450,
    transportBy: 'seller',
    pricePerTon: 78,
    accepts: ['phosphogypsum', 'gypsum_dust'],
    certification: 'EN 13279 · gypse cartonné',
    contactEmail: 'commande@platrerie-bs.tn',
    contactPhone: '+216 74 660 800',
    description: 'Production plaques BA13 — exige phosphogypse haute pureté (>88%). Prix premium, paiement 60 j.'
  },

  // ---------- BTP / routes (preneurs scories / résidus) ----------
  {
    id: 7,
    name: 'STMV Routes Sud',
    type: 'btp',
    city: 'Médenine',
    distanceKm: 75,
    minPurity: 60,
    minTons: 100,
    maxTons: 3000,
    demandedTons: 2400,
    transportBy: 'buyer',
    pricePerTon: 22,
    accepts: ['slag', 'phosphogypsum', 'lime_residue'],
    certification: 'NT 25.01 · sous-couches MTPN',
    contactEmail: 'appro@stmv-routes.tn',
    contactPhone: '+216 75 640 700',
    description: 'Chantier autoroute A1 Sud — appel d\'offres en cours pour 8 000 t de matériau granulaire.'
  },
  {
    id: 8,
    name: 'Sotumo Construction',
    type: 'btp',
    city: 'Sousse',
    distanceKm: 215,
    minPurity: 65,
    minTons: 150,
    maxTons: 2500,
    demandedTons: 1600,
    transportBy: 'shared',
    pricePerTon: 26,
    accepts: ['slag', 'fly_ash', 'phosphogypsum'],
    certification: 'NT 47.30 · béton structurel',
    contactEmail: 'sourcing@sotumo.tn',
    contactPhone: '+216 73 308 100',
    description: 'Béton préfabriqué + remblais. Forte demande Q2 2026 — lignes de transport routier établies.'
  },

  // ---------- Compost / engrais ----------
  {
    id: 9,
    name: 'EcoCompost Mareth',
    type: 'compost',
    city: 'Mareth',
    distanceKm: 35,
    minPurity: 60,
    minTons: 5,
    maxTons: 120,
    demandedTons: 90,
    transportBy: 'buyer',
    pricePerTon: 18,
    accepts: ['organic_sludge', 'wash_water'],
    certification: 'ANGed · NF U44-051',
    contactEmail: 'collecte@ecocompost-mareth.tn',
    contactPhone: '+216 75 640 220',
    description: 'Plate-forme andains 2 ha — co-compostage avec déchets verts. Retour compost normé aux fournisseurs.'
  },
  {
    id: 10,
    name: 'GypsiFert Engrais',
    type: 'engrais',
    city: 'Sfax',
    distanceKm: 130,
    minPurity: 80,
    minTons: 20,
    maxTons: 800,
    demandedTons: 600,
    transportBy: 'shared',
    pricePerTon: 48,
    accepts: ['phosphogypsum', 'gypsum_dust', 'lime_residue'],
    certification: 'NF U44-001 · ANGed agréé',
    contactEmail: 'achat@gypsifert.tn',
    contactPhone: '+216 74 220 990',
    description: 'Granulation amendement Ca + S à destination grandes cultures céréalières. Volumes annuels constants.'
  },

  // ---------- Preneurs basse-pureté (méthanisation / co-incinération) ----------
  {
    id: 11,
    name: 'Biogaz Ghannouch SARL',
    type: 'compost',
    city: 'Ghannouch',
    distanceKm: 4,
    minPurity: 40,
    minTons: 20,
    maxTons: 800,
    demandedTons: 320,
    transportBy: 'buyer',
    pricePerTon: 12,
    accepts: ['organic_sludge', 'wash_water'],
    certification: 'ANGed · digestat NF U44-051',
    contactEmail: 'collecte@biogaz-ghannouch.tn',
    contactPhone: '+216 75 377 220',
    description: 'Méthaniseur 1,2 MWe — digestion anaérobie à 40 °C · accepte boues brutes et eaux grasses. Digestat retourné aux fournisseurs comme amendement.'
  },
  {
    id: 12,
    name: 'CIOK Co-Incinération',
    type: 'cimenterie',
    city: 'Ghannouch',
    distanceKm: 8,
    minPurity: 45,
    minTons: 50,
    maxTons: 2500,
    demandedTons: 1400,
    transportBy: 'seller',
    pricePerTon: 9,
    accepts: ['organic_sludge', 'hdpe', 'wash_water'],
    certification: 'ISO 14001 · permis co-incinération ANPE',
    contactEmail: 'coprocessing@ciok.tn',
    contactPhone: '+216 75 380 180',
    description: 'Valorisation énergétique en four clinker à 1450 °C — boues organiques servent de combustible de substitution (TAR). Analyse préalable Cl/S/métaux.'
  }
];

export const INDUSTRY_RECYCLERS: IndustryRecycler[] = [
  {
    id: 201,
    name: 'GypsumLoop Industries',
    city: 'Gabès',
    specialty: ['phosphogypsum', 'gypsum_dust', 'lime_residue'],
    process: 'Lavage acide + séchage rotatif + classification granulométrique',
    certification: 'ISO 14001 · ANGed'
  },
  {
    id: 202,
    name: 'Déconvert Tunisie',
    city: 'Sfax',
    specialty: ['organic_sludge', 'wash_water'],
    process: 'Méthanisation + traitement eaux + déshydratation centrifuge',
    certification: 'ANGed · ISO 9001'
  },
  {
    id: 203,
    name: 'PolyRecycle Sud',
    city: 'Sfax',
    specialty: ['hdpe'],
    process: 'Broyage + lavage + extrusion granulés rPE',
    certification: 'ISCC PLUS · BlueAngel'
  },
  {
    id: 204,
    name: 'AshTech Tunisia',
    city: 'Bizerte',
    specialty: ['fly_ash', 'slag'],
    process: 'Activation alcaline + classification + valorisation géopolymère',
    certification: 'EN 450-1 · CSC'
  },
  {
    id: 205,
    name: 'CircularSouth',
    city: 'Médenine',
    specialty: ['slag', 'fly_ash', 'lime_residue'],
    process: 'Stabilisation + concassage agrégats secondaires',
    certification: 'NT 47.30 · ISO 14001'
  }
];

// ============================== ENGINE ==============================

export function computeIndustryValue(input: IndustryWasteInput): {
  waste: IndustryWasteType;
  unitPrice: number;
  totalValue: number;
  co2Avoided: number;
} | null {
  const waste = INDUSTRY_WASTE_TYPES.find(w => w.id === input.type);
  if (!waste) return null;
  const purityFactor = Math.max(0.5, Math.min(1.15, input.purity / 85));
  const unitPrice = Math.round(waste.marketPrice * purityFactor);
  const totalValue = Math.round(unitPrice * input.quantity);
  const co2Avoided = Math.round(input.quantity * waste.co2PerTon * 10) / 10;
  return { waste, unitPrice, totalValue, co2Avoided };
}

export function matchBuyers(
  input: IndustryWasteInput,
  sort: IndustrySortKey = 'distance'
): BuyerOffer[] {
  const value = computeIndustryValue(input);
  if (!value) return [];

  const offers: BuyerOffer[] = INDUSTRY_BUYERS
    .filter(b => b.accepts.includes(input.type))
    .filter(b => input.purity >= b.minPurity)
    .filter(b => input.quantity >= b.minTons)
    .map(b => {
      // matched tons is the 3-way minimum: what the factory offers,
      // what the buyer demands this cycle, and what their plant can absorb.
      const matchedTons = Math.min(input.quantity, b.demandedTons, b.maxTons);
      const grossTransport = Math.round(b.distanceKm * matchedTons * 0.1);
      const transportCoveredByBuyer = b.transportBy === 'buyer';
      const transportCost = transportCoveredByBuyer
        ? 0
        : b.transportBy === 'shared'
        ? Math.round(grossTransport / 2)
        : grossTransport;
      const totalRevenue = Math.round(matchedTons * b.pricePerTon);
      const netRevenue = totalRevenue - transportCost;

      const purityMargin = (input.purity - b.minPurity) * 0.5;
      const distanceScore = Math.max(0, 30 - b.distanceKm / 10);
      const priceScore = Math.min(35, b.pricePerTon / 2.5);
      const transportBonus = b.transportBy === 'buyer' ? 6 : b.transportBy === 'shared' ? 3 : 0;
      const demandCoverage = Math.min(1, matchedTons / Math.max(1, b.demandedTons));
      const demandBonus = demandCoverage * 4;
      const compatibility = Math.min(
        98,
        Math.max(55, Math.round(44 + purityMargin + distanceScore + priceScore + transportBonus + demandBonus))
      );
      const co2Avoided = Math.round(matchedTons * value.waste.co2PerTon * 10) / 10;
      return {
        buyer: b,
        matchedTons,
        demandedTons: b.demandedTons,
        transportBy: b.transportBy,
        totalRevenue,
        transportCost,
        transportCoveredByBuyer,
        netRevenue,
        distanceKm: b.distanceKm,
        compatibility,
        co2Avoided
      };
    });

  offers.sort((a, b) =>
    sort === 'distance'
      ? a.distanceKm - b.distanceKm
      : b.netRevenue - a.netRevenue
  );

  return offers;
}

// ================== GypsiFert agronomic enrichment ==================
const API_BASE = (import.meta as any).env?.VITE_GABEST_API ?? 'http://127.0.0.1:8000';

export async function enrichOffersWithGypsiFert(
  input: IndustryWasteInput,
  offers: BuyerOffer[]
): Promise<BuyerOffer[]> {
  if (input.type !== 'phosphogypsum') return offers;

  const agri = offers
    .map((o, idx) => ({ idx, o }))
    .filter(({ o }) => o.buyer.type === 'agriculteur' && o.buyer.parcelle);

  if (agri.length === 0) return offers;

  const body = {
    items: agri.map(({ idx, o }) => {
      const p = o.buyer.parcelle!;
      return {
        id: idx,
        parcelle: {
          pH: p.pH,
          calcium: p.calcium,
          magnesium: p.magnesium,
          cec: p.cec,
          // add a small purity-driven contamination bump on top of the soil
          // baseline, capped at the training-set max (0.05 mg/kg).
          cadmium: Math.min(0.049, p.cadmium + Math.max(0, (90 - input.purity) * 0.0015)),
          lead: p.lead,
          rainfall: p.rainfall,
          soil_type: p.soil_type,
          crop: p.crop
        }
      };
    })
  };

  try {
    const res = await fetch(`${API_BASE}/gypsifert/predict-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const byIdx: Record<number, AgronomicPrediction> = {};
    for (const r of data.results || []) {
      if (typeof r.id === 'number' && r.dosage_t_ha != null) {
        byIdx[r.id] = {
          dosage_t_ha: r.dosage_t_ha,
          yield_gain_percent: r.yield_gain_percent,
          contamination_risk: r.contamination_risk,
          risk_level: r.risk_level,
          risk_threshold: r.risk_threshold,
          top_shap: r.top_shap || [],
          message: r.message || ''
        };
      }
    }
    return offers.map((o, idx) =>
      byIdx[idx] ? { ...o, agronomic: byIdx[idx] } : o
    );
  } catch {
    return offers;
  }
}

export const TRANSPORT_LABEL: Record<TransportBy, string> = {
  buyer: 'Transport assuré par le preneur',
  seller: 'Transport à la charge de l\'usine',
  shared: 'Transport partagé 50/50'
};

export function recommendIndustryRecyclers(wasteType: IndustryWasteId): IndustryRecycler[] {
  return INDUSTRY_RECYCLERS.filter(r => r.specialty.includes(wasteType)).slice(0, 3);
}

export interface BuyerGap {
  buyer: IndustryBuyer;
  purityGap: number;   // pts to reach minPurity (positive = missing)
  tonsGap: number;     // tons to reach minTons (positive = missing)
  suggestedPurity: number;
  suggestedTons: number;
}

/**
 * When no buyer matches, list the closest-fit buyers — how many purity
 * points or tons would the factory need to reach to unlock each one.
 * Useful to show actionable next steps instead of a dead-end message.
 */
export function nearMatchBuyers(input: IndustryWasteInput, limit = 3): BuyerGap[] {
  const candidates = INDUSTRY_BUYERS.filter(b => b.accepts.includes(input.type));
  const gaps: BuyerGap[] = candidates.map(b => ({
    buyer: b,
    purityGap: Math.max(0, b.minPurity - input.purity),
    tonsGap: Math.max(0, b.minTons - input.quantity),
    suggestedPurity: b.minPurity,
    suggestedTons: b.minTons,
  }));
  // score by combined gap (purity costs 2 pts per %, tons cost 1 pt per t)
  gaps.sort((a, b) => (a.purityGap * 2 + a.tonsGap * 0.1) - (b.purityGap * 2 + b.tonsGap * 0.1));
  return gaps.slice(0, limit);
}

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  agriculteur: 'Agriculteur',
  cimenterie: 'Cimenterie',
  platrerie: 'Plâtrerie',
  btp: 'BTP / Routes',
  compost: 'Compost',
  engrais: 'Engrais granulé'
};

export const BUYER_TYPE_TONE: Record<BuyerType, string> = {
  agriculteur: '#2BA24C',
  cimenterie: '#3B6CB7',
  platrerie: '#9B6CD6',
  btp: '#E0A23A',
  compost: '#7A9F2F',
  engrais: '#1E7A38'
};
