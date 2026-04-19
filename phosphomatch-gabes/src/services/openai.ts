import type { Batch, Buyer, Match, MatchResponse } from '../types';

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

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
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCoordsForLocation(location: string): { latitude: number; longitude: number } {
  return LOCATION_COORDS[location.toLowerCase()] ?? GABES_COORDS;
}

function buyerMeetsConstraints(batch: Batch, buyer: Buyer): boolean {
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
        reasoning: `Ce client respecte les seuils critiques du lot et dispose d'une capacité adaptée au volume proposé. Sa combinaison prix, proximité méditerranéenne et marge qualité en fait une piste commerciale prioritaire.`,
      };
    })
    .sort((a, b) => b.compatibility_score - a.compatibility_score || b.estimated_deal_value_usd - a.estimated_deal_value_usd)
    .slice(0, 3);
}

function validateMatches(value: MatchResponse): MatchResponse {
  if (!Array.isArray(value.matches)) return { matches: [], message: value.message };
  return {
    matches: value.matches
      .filter((match) => typeof match.id === 'number' && typeof match.company_name === 'string')
      .slice(0, 3),
    message: value.message,
  };
}

export async function fetchBuyers(): Promise<Buyer[]> {
  const response = await fetch('/buyers.json');
  if (!response.ok) throw new Error('Impossible de charger la base acheteurs.');
  return (await response.json()) as Buyer[];
}

export async function findMatches(batch: Batch): Promise<MatchResponse> {
  const buyers = await fetchBuyers();
  const eligibleBuyers = buyers.filter((buyer) => buyerMeetsConstraints(batch, buyer));

  if (eligibleBuyers.length === 0) {
    return {
      matches: [],
      message: 'Aucun acheteur ne respecte les contraintes techniques de ce lot. Essayez un lot plus sec ou mieux purifié.',
    };
  }

  const deterministicTop = createDeterministicMatches(batch, buyers);
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    return {
      matches: deterministicTop,
      message: 'Classement calculé avec le moteur local. Ajoutez VITE_OPENAI_API_KEY pour activer le matching IA.',
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
        message: "Le service IA n'a pas répondu correctement. Classement local utilisé pour ce prototype.",
      };
    }

    const payload = (await response.json()) as OpenAIResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return { matches: deterministicTop, message: 'Classement calculé avec le moteur local.' };
    }

    return validateMatches(JSON.parse(content) as MatchResponse);
  } catch {
    return {
      matches: deterministicTop,
      message:
        "Connexion OpenAI impossible depuis le navigateur. Classement local utilisé pour continuer le test.",
    };
  }
}
