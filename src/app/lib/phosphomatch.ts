export interface Buyer {
  id: number;
  company_name: string;
  industry_type: 'cement' | 'plaster' | 'fertilizer' | 'construction' | 'recycling startup';
  location: string;
  phone: string;
  email: string;
  website: string;
  min_purity_required: number;
  max_fluor_allowed: number;
  max_p2o5_allowed: number;
  max_humidity_allowed: number;
  max_heavy_metals_allowed: number;
  max_radioactivity_allowed: number;
  capacity_tons_per_day: number;
  base_price_per_ton: number;
  transport_cost_per_ton_per_km: number;
  latitude?: number;
  longitude?: number;
}

export interface Batch {
  purity: number;
  fluor: number;
  p2o5: number;
  humidity: number;
  heavy_metals: number;
  radioactivity: number;
  quantity: number;
  location: string;
}

export interface Match {
  id: number;
  company_name: string;
  industry_type: Buyer['industry_type'];
  location: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  compatibility_score: number;
  estimated_deal_value_usd: number;
  reasoning: string;
}

export type BatchStatus = 'pending' | 'contacted' | 'negotiating' | 'closed';

export interface SavedBatch {
  id: string;
  batch: Batch;
  matches: Match[];
  created_at: string;
  status: BatchStatus;
  notes?: string;
}

export interface MatchResponse {
  matches: Match[];
  message?: string;
}

export interface BatchPreset {
  id: string;
  label: string;
  description: string;
  values: Batch;
}

export const batchPresets: BatchPreset[] = [
  {
    id: 'gct-standard',
    label: 'Lot standard GCT',
    description: 'Profil moyen issu des lignes de production de Gabès',
    values: {
      purity: 82, fluor: 0.85, p2o5: 1.25, humidity: 16,
      heavy_metals: 42, radioactivity: 620, quantity: 5000,
      location: 'Gabès, Tunisia',
    },
  },
  {
    id: 'high-purity',
    label: 'Haute pureté',
    description: 'Lot séché et trié pour usages cimentiers ou plâtre',
    values: {
      purity: 91, fluor: 0.42, p2o5: 0.75, humidity: 8,
      heavy_metals: 24, radioactivity: 410, quantity: 2500,
      location: 'Gabès, Tunisia',
    },
  },
  {
    id: 'low-grade',
    label: 'Faible qualité',
    description: 'Lot brut à orienter vers recyclage ou construction',
    values: {
      purity: 68, fluor: 1.45, p2o5: 2.2, humidity: 24,
      heavy_metals: 78, radioactivity: 840, quantity: 8000,
      location: 'Gabès, Tunisia',
    },
  },
];

// ============================== Matching engine ==============================

const GABES_COORDS = { latitude: 33.8815, longitude: 10.0982 };
const LOCATION_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'gabès, tunisia': GABES_COORDS,
  'gabes, tunisia': GABES_COORDS,
};

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadius = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCoordsForLocation(location: string) {
  return LOCATION_COORDS[location.toLowerCase()] ?? GABES_COORDS;
}

export function buyerMeetsConstraints(batch: Batch, buyer: Buyer): boolean {
  return (
    batch.purity >= buyer.min_purity_required &&
    batch.fluor <= buyer.max_fluor_allowed &&
    batch.p2o5 <= buyer.max_p2o5_allowed &&
    batch.humidity <= buyer.max_humidity_allowed &&
    batch.heavy_metals <= buyer.max_heavy_metals_allowed &&
    batch.radioactivity <= buyer.max_radioactivity_allowed
  );
}

function createDeterministicMatches(batch: Batch, buyers: Buyer[]): Match[] {
  const sellerCoords = getCoordsForLocation(batch.location);
  return buyers
    .filter((buyer) => buyerMeetsConstraints(batch, buyer))
    .map((buyer) => {
      const buyerCoords = {
        latitude: buyer.latitude ?? GABES_COORDS.latitude,
        longitude: buyer.longitude ?? GABES_COORDS.longitude,
      };
      const km = distanceKm(sellerCoords, buyerCoords);
      const transport = Math.min(12, km * buyer.transport_cost_per_ton_per_km);
      const sellableQuantity = Math.min(batch.quantity, buyer.capacity_tons_per_day * 30);
      const qualityHeadroom =
        batch.purity - buyer.min_purity_required +
        (buyer.max_fluor_allowed - batch.fluor) * 8 +
        (buyer.max_p2o5_allowed - batch.p2o5) * 6;
      const compatibilityScore = Math.max(
        45,
        Math.min(98, Math.round(72 + qualityHeadroom - km / 170 + buyer.base_price_per_ton / 4)),
      );

      return {
        id: buyer.id,
        company_name: buyer.company_name,
        industry_type: buyer.industry_type,
        location: buyer.location,
        phone: buyer.phone,
        email: buyer.email,
        website: buyer.website,
        latitude: buyerCoords.latitude,
        longitude: buyerCoords.longitude,
        compatibility_score: compatibilityScore,
        estimated_deal_value_usd: Math.max(0, Math.round(sellableQuantity * (buyer.base_price_per_ton - transport))),
        reasoning:
          "Ce client respecte les seuils critiques du lot et dispose d'une capacité adaptée au volume proposé. Sa combinaison prix, proximité méditerranéenne et marge qualité en fait une piste commerciale prioritaire.",
      };
    })
    .sort(
      (a, b) =>
        b.compatibility_score - a.compatibility_score ||
        b.estimated_deal_value_usd - a.estimated_deal_value_usd,
    )
    .slice(0, 3);
}

export async function fetchBuyers(): Promise<Buyer[]> {
  const response = await fetch('/buyers.json');
  if (!response.ok) throw new Error('Impossible de charger la base acheteurs.');
  return (await response.json()) as Buyer[];
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function validateMatches(value: MatchResponse): MatchResponse {
  if (!Array.isArray(value.matches)) return { matches: [], message: value.message };
  return {
    matches: value.matches
      .filter((m) => typeof m.id === 'number' && typeof m.company_name === 'string')
      .slice(0, 3),
    message: value.message,
  };
}

export async function findMatches(batch: Batch): Promise<MatchResponse> {
  const buyers = await fetchBuyers();
  const eligibleBuyers = buyers.filter((b) => buyerMeetsConstraints(batch, b));

  if (eligibleBuyers.length === 0) {
    return {
      matches: [],
      message:
        "Aucun acheteur ne respecte les contraintes techniques de ce lot. Essayez un lot plus sec ou mieux purifié.",
    };
  }

  const deterministicTop = createDeterministicMatches(batch, buyers);
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY as string | undefined;

  if (!apiKey) {
    return {
      matches: deterministicTop,
      message:
        'Classement calculé avec le moteur local. Ajoutez VITE_OPENAI_API_KEY pour activer le re-ranking IA.',
    };
  }

  const prompt = `
Tu es PhosphoMatch Gabès, un moteur de matching B2B pour valoriser le phosphogypse tunisien.

Lot vendeur:
${JSON.stringify(batch, null, 2)}

Acheteurs méditerranéens éligibles après contraintes dures:
${JSON.stringify(eligibleBuyers, null, 2)}

Contraintes:
- Retourne uniquement un JSON valide.
- Format exact: {"matches":[...],"message":"..."}.
- Chaque match contient id, company_name, industry_type, location, phone, email, website, latitude, longitude, compatibility_score (0-100), estimated_deal_value_usd, reasoning.
- reasoning doit être en français, 2 phrases, orienté décision commerciale.
- Classe les 3 meilleurs par distance, prix, capacité et marge qualité.
- Si aucun buyer valide, retourne {"matches":[],"message":"..."}.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Tu retournes seulement du JSON valide pour une plateforme française de matching phosphogypse.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return {
        matches: deterministicTop,
        message:
          "Le service IA n'a pas répondu. Classement local utilisé en repli.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return { matches: deterministicTop, message: 'Classement calculé avec le moteur local.' };
    }

    const validated = validateMatches(JSON.parse(content) as MatchResponse);
    return {
      matches: validated.matches.length > 0 ? validated.matches : deterministicTop,
      message: validated.message ?? 'Re-classement GPT-4o-mini · raisonnement IA commercial.',
    };
  } catch {
    return {
      matches: deterministicTop,
      message:
        "Connexion OpenAI impossible depuis le navigateur. Classement local utilisé en repli.",
    };
  }
}

// ============================== Storage (localStorage) ==============================

const STORAGE_KEY = 'gabest.phosphomatch.batches';

function readStore(): SavedBatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedBatch[]) : [];
  } catch {
    return [];
  }
}

function writeStore(items: SavedBatch[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getAllBatches(): SavedBatch[] {
  return readStore().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveBatch(batch: Batch, matches: Match[]): SavedBatch {
  const entry: SavedBatch = {
    id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    batch,
    matches,
    created_at: new Date().toISOString(),
    status: 'pending',
  };
  const items = readStore();
  items.push(entry);
  writeStore(items);
  return entry;
}

export function updateBatchStatus(id: string, status: BatchStatus) {
  const items = readStore().map((b) => (b.id === id ? { ...b, status } : b));
  writeStore(items);
}

export function deleteBatch(id: string) {
  writeStore(readStore().filter((b) => b.id !== id));
}

export function getBatchById(id: string): SavedBatch | null {
  return readStore().find((b) => b.id === id) ?? null;
}

// ============================== Utils ==============================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const INDUSTRY_LABEL: Record<Buyer['industry_type'], string> = {
  cement: 'Cimenterie',
  plaster: 'Plâtre',
  fertilizer: 'Engrais',
  construction: 'BTP',
  'recycling startup': 'Recyclage',
};
