// IA + données météo / pollution — utilisées par le FarmerDashboard.
// Clés API fournies via des variables d'environnement (.env.local).
export const OPENAI_API_KEY =
  (import.meta as any).env?.VITE_OPENAI_API_KEY ?? '';
export const OWM_API_KEY =
  (import.meta as any).env?.VITE_OWM_API_KEY ?? '';

// ============================ ZONES ============================
export type ZoneName =
  | 'Ghannouch'
  | 'Métouia'
  | 'Chenini'
  | 'Bou Chemma'
  | 'El Hamma'
  | 'Centre ville';

export const ZONES_COORDS: Record<ZoneName, { lat: number; lon: number }> = {
  Ghannouch: { lat: 33.9167, lon: 10.05 },
  'Métouia': { lat: 33.9667, lon: 10.0 },
  Chenini: { lat: 33.8833, lon: 9.9833 },
  'Bou Chemma': { lat: 33.9, lon: 10.1 },
  'El Hamma': { lat: 33.8833, lon: 9.8 },
  'Centre ville': { lat: 33.8833, lon: 10.0982 }
};

export const FARMER_ZONES: ZoneName[] = ['Chenini', 'Métouia', 'El Hamma', 'Bou Chemma', 'Ghannouch'];

// ============================ POLLUTION ============================
export type Pollution = {
  so2: number;
  pm25: number;
  pm10: number;
  no2: number;
  aqi: number;
};

export async function fetchPollution(zone: ZoneName): Promise<Pollution | null> {
  try {
    const { lat, lon } = ZONES_COORDS[zone];
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`
    );
    if (!res.ok) throw new Error('OWM error');
    const data = await res.json();
    const c = data.list[0].components;
    return {
      so2: parseFloat(c.so2.toFixed(2)),
      pm25: parseFloat(c.pm2_5.toFixed(2)),
      pm10: parseFloat(c.pm10.toFixed(2)),
      no2: parseFloat(c.no2.toFixed(2)),
      aqi: data.list[0].main.aqi
    };
  } catch {
    return null;
  }
}

// ============================ WEATHER ============================
export type Weather = {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  description: string;
  icon: string;
  main: string;
  sunrise: number;
  sunset: number;
};

export async function fetchWeather(zone: ZoneName): Promise<Weather | null> {
  try {
    const { lat, lon } = ZONES_COORDS[zone];
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=fr`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      windDeg: Math.round(data.wind.deg ?? 0),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      main: data.weather[0].main,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };
  } catch {
    return null;
  }
}

// ============================ DAILY FORECAST 5J ============================
export type DailyForecast = {
  dt: number;
  dayShort: string;
  date: string;
  tempMin: number;
  tempMax: number;
  humidityAvg: number;
  windAvg: number;
  rainTotal: number;
  main: string;
  icon: string;
  description: string;
};

export async function fetchDailyForecast(zone: ZoneName): Promise<DailyForecast[]> {
  try {
    const { lat, lon } = ZONES_COORDS[zone];
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=fr`
    );
    if (!res.ok) throw new Error('OWM forecast error');
    const data = await res.json();
    const byDay = new Map<string, any[]>();
    for (const entry of data.list as any[]) {
      const d = new Date(entry.dt * 1000);
      const key = d.toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(entry);
    }
    const days: DailyForecast[] = [];
    const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (const [key, entries] of Array.from(byDay.entries()).slice(0, 7)) {
      const temps = entries.map(e => e.main.temp);
      const hums = entries.map(e => e.main.humidity);
      const winds = entries.map(e => e.wind.speed * 3.6);
      const rains = entries.map(e => e.rain?.['3h'] ?? 0);
      const mid = entries.find(e => new Date(e.dt * 1000).getHours() >= 12) ?? entries[0];
      const d = new Date(key + 'T12:00:00');
      days.push({
        dt: mid.dt,
        dayShort: DAY_FR[d.getDay()],
        date: d.getDate().toString(),
        tempMin: Math.round(Math.min(...temps)),
        tempMax: Math.round(Math.max(...temps)),
        humidityAvg: Math.round(hums.reduce((s, x) => s + x, 0) / hums.length),
        windAvg: Math.round(winds.reduce((s, x) => s + x, 0) / winds.length),
        rainTotal: parseFloat(rains.reduce((s, x) => s + x, 0).toFixed(1)),
        main: mid.weather[0].main,
        icon: mid.weather[0].icon,
        description: mid.weather[0].description
      });
    }
    return days;
  } catch {
    return [];
  }
}

// ============================ MARKET PRICES (web search) ============================
export type MarketPrice = {
  crop: string;
  price: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePct: number;
  sourceLabel: string;
};

export type MarketPayload = {
  prices: MarketPrice[];
  recommendation: string;
  sourceUrl: string;
  fetchedAt: string;
};

const MARKET_CACHE_KEY = 'gabest_market_v3';
const MARKET_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function fetchMarketPrices(
  crops: string[] = ['Tomate', 'Poivron', 'Datte', 'Grenade', 'Olive']
): Promise<MarketPayload | null> {
  try {
    const cached = localStorage.getItem(MARKET_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as MarketPayload;
      if (Date.now() - new Date(parsed.fetchedAt).getTime() < MARKET_CACHE_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }

  const cropsList = crops.join(', ');
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        tool_choice: { type: 'web_search_preview' },
        input: `Date : ${today}.
Recherche sur le web les prix de gros RÉCENTS (cette semaine) en Tunisie (préférence : Gabès, Souk El Hafsia, ou à défaut marchés de gros nationaux tunisiens — SOCOMENA, ONAGRI, Mercanet Tunisie, Agridata, presse tunisienne) pour : ${cropsList}.

Pour chaque produit :
1. Donne le prix de gros moyen en Dinars tunisiens par kg (DT/kg).
2. Calcule la variation en % par rapport à la même semaine précédente.
3. Indique la tendance "up", "down" ou "stable" (|variation| < 1% = stable).

Rédige aussi UNE recommandation agronomique concrète (max 2 phrases) pour un agriculteur de Métouia/Gabès, basée sur le produit dont la hausse est la plus forte cette semaine.

Réponds STRICTEMENT avec ce JSON (aucun markdown, aucun backtick) :
{
  "prices": [
    { "crop": "Tomate", "price": 2.40, "unit": "DT/kg", "trend": "up|down|stable", "changePct": 12, "sourceLabel": "<source ex: ONAGRI>" }
  ],
  "recommendation": "<phrase>",
  "sourceUrl": "<URL principale utilisée>"
}`
      })
    });

    if (!res.ok) {
      console.error('OpenAI Responses HTTP', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const outText: string =
      data.output_text ??
      (Array.isArray(data.output)
        ? data.output
            .flatMap((o: any) => o.content ?? [])
            .map((c: any) => c.text ?? '')
            .join('\n')
        : '');
    const match = outText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Omit<MarketPayload, 'fetchedAt'>;
    const payload: MarketPayload = { ...parsed, fetchedAt: new Date().toISOString() };
    try {
      localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return payload;
  } catch (err) {
    console.error('fetchMarketPrices error', err);
    return null;
  }
}

// ============================ CROPADVISOR — PLANTATION IA ============================
export type CropRecommendation = {
  crop: string;
  suitability: number; // 0-100
  rationale: string;
  windowAction: string;
  risks: string;
};

export type PlantationPayload = {
  zone: string;
  headline: string;
  contextSummary: string;
  recommendations: CropRecommendation[];
  generatedAt: string;
};

const PLANT_CACHE_PREFIX = 'gabest_plant_v1_';
const PLANT_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export async function generatePlantationAdvice(
  zone: ZoneName,
  weather: Weather | null,
  forecast: DailyForecast[],
  pollution: Pollution | null
): Promise<PlantationPayload | null> {
  const cacheKey = PLANT_CACHE_PREFIX + zone;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached) as PlantationPayload;
      if (Date.now() - new Date(p.generatedAt).getTime() < PLANT_CACHE_TTL_MS) return p;
    }
  } catch {
    /* ignore */
  }

  if (!weather || forecast.length === 0) return null;

  const forecastText = forecast
    .slice(0, 7)
    .map(
      d =>
        `${d.dayShort} ${d.date}: ${d.tempMin}–${d.tempMax}°C · humidité ${d.humidityAvg}% · vent ${d.windAvg} km/h · pluie ${d.rainTotal} mm · ${d.description}`
    )
    .join('\n');

  const pollutionText = pollution
    ? `SO2 ${pollution.so2} µg/m³ · PM2.5 ${pollution.pm25} · PM10 ${pollution.pm10} · NO2 ${pollution.no2} · AQI ${pollution.aqi}/5`
    : 'données pollution indisponibles';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un agronome IA spécialisé dans l'oasis de Gabès, Tunisie (climat semi-aride côtier, sols salins, proximité industrie chimique GCT). Tu recommandes des cultures adaptées à un agriculteur en te basant STRICTEMENT sur la météo réelle et la pollution actuelles. Réponds UNIQUEMENT en JSON valide, en français, sans emoji, sans markdown.

CONTRAINTES AGRONOMIQUES — saison ${getSeason()} :
- Cultures locales pertinentes : palmier dattier, grenadier, olivier, tomate, poivron, piment, pastèque, melon, courgette, henné, luzerne, orge, blé dur, fève.
- Évite les cultures incompatibles avec la pollution SO2/PM élevée (feuilles brûlent, fruits contaminés) près de Ghannouch/Bou Chemma.
- Privilégie les espèces résistantes à la salinité et au stress hydrique en cas de vent fort + faible humidité.
- Adapte aux fenêtres de plantation/semis du calendrier méditerranéen.`
          },
          {
            role: 'user',
            content: `Zone : ${zone}
Météo actuelle : ${weather.temp}°C (ressenti ${weather.feelsLike}°C), humidité ${weather.humidity}%, vent ${weather.windSpeed} km/h, ${weather.description}.

Prévision 5 jours :
${forecastText}

Qualité de l'air : ${pollutionText}

Renvoie EXACTEMENT ce JSON :
{
  "headline": "<phrase d'1 ligne résumant la fenêtre agronomique de la semaine>",
  "contextSummary": "<2 phrases : conditions météo dominantes + impact pollution sur cultures sensibles>",
  "recommendations": [
    {
      "crop": "<nom culture local>",
      "suitability": <entier 0-100>,
      "rationale": "<2 phrases citant 1 donnée météo réelle (temp, humidité, vent, pluie) ET la zone>",
      "windowAction": "<action concrète : 'Semer cette semaine', 'Planter avant vendredi', 'Reporter de 7j', etc.>",
      "risks": "<1 phrase : risque principal lié à la météo ou pollution citée>"
    },
    { "crop": "...", "suitability": ..., "rationale": "...", "windowAction": "...", "risks": "..." },
    { "crop": "...", "suitability": ..., "rationale": "...", "windowAction": "...", "risks": "..." }
  ]
}

Donne 3 recommandations triées par suitability décroissante. Pas de doublons.`
          }
        ],
        temperature: 0.45,
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) {
      console.error('generatePlantationAdvice HTTP', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? '').trim();
    const parsed = JSON.parse(text) as Omit<PlantationPayload, 'zone' | 'generatedAt'>;
    const payload: PlantationPayload = {
      ...parsed,
      zone,
      generatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return payload;
  } catch (err) {
    console.error('generatePlantationAdvice error', err);
    return null;
  }
}

// ============================ PRICEFORECAST — PRIX CULTURES PAR ZONE ============================
export type PriceForecast = {
  crop: string;
  zone: string;
  currentPrice: number; // DT/kg
  forecastChangePct: number; // variation prévue sur horizonDays
  horizonDays: number; // fenêtre de prévision adaptée au cycle de la culture
  horizonLabel: string; // ex: "30 jours", "2 mois", "3 mois"
  trend: 'up' | 'down' | 'stable';
  drivers: string;
  windowAdvice: string;
};

export type PriceForecastPayload = {
  zone: string;
  headline: string;
  forecasts: PriceForecast[];
  marketSource: string;
  generatedAt: string;
};

const PRICE_CACHE_PREFIX = 'gabest_price_v1_';
const PRICE_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export async function generatePriceForecast(
  zone: ZoneName,
  weather: Weather | null,
  forecast: DailyForecast[],
  pollution: Pollution | null,
  market: MarketPayload | null
): Promise<PriceForecastPayload | null> {
  const cacheKey = PRICE_CACHE_PREFIX + zone;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached) as PriceForecastPayload;
      if (Date.now() - new Date(p.generatedAt).getTime() < PRICE_CACHE_TTL_MS) return p;
    }
  } catch {
    /* ignore */
  }

  if (!weather || forecast.length === 0) return null;

  const forecastText = forecast
    .slice(0, 5)
    .map(
      d =>
        `${d.dayShort} ${d.date}: ${d.tempMin}–${d.tempMax}°C · humidité ${d.humidityAvg}% · vent ${d.windAvg} km/h · pluie ${d.rainTotal} mm`
    )
    .join('\n');

  const pollutionText = pollution
    ? `SO2 ${pollution.so2} · PM2.5 ${pollution.pm25} · PM10 ${pollution.pm10} · NO2 ${pollution.no2} · AQI ${pollution.aqi}/5`
    : 'pollution n/a';

  const marketText = market
    ? market.prices
        .map(
          p =>
            `${p.crop} ${p.price} ${p.unit} (${p.trend === 'up' ? '+' : p.trend === 'down' ? '-' : ''}${Math.abs(p.changePct)}% ${p.sourceLabel})`
        )
        .join(' · ')
    : 'aucun prix marché disponible';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Tu es un analyste agro-marché IA pour la région de Gabès. Tu prédis les évolutions de prix des cultures locales en croisant : météo réelle, pollution, prix de gros récents et saisonnalité tunisienne. Réponds UNIQUEMENT en JSON valide, français, sans emoji, sans markdown.

LOGIQUE DE PRÉDICTION :
- Stress hydrique (vent fort + faible humidité + pas de pluie) → réduction offre → hausse prix sur tomate/poivron/maraîchage.
- Pollution SO2/PM élevée près zone industrielle → fruits sensibles (grenade, raisin) → réduction qualité → hausse prix premium.
- Sécheresse persistante → datte précoce, olive : tendance baissière qualité → prix bas court terme, hausse moyen terme.
- Saison ${getSeason()} : ajuster en fonction du calendrier de récolte.

HORIZON DE PRÉVISION — adapté au cycle de CHAQUE culture (pas d'horizon global) :
- Maraîchage à cycle court (tomate, poivron, piment, courgette, laitue, pastèque, melon) : 30 jours.
- Fruits à cycle moyen (grenade, raisin, figue, henné, pastèque fin de saison) : 60 jours (2 mois).
- Cultures à cycle long / annuel (datte, olive, agrumes, palmier) : 90 jours (3 mois).
- Le champ horizonDays doit refléter la période réaliste avant que l'agriculteur soit prêt à vendre.
- forecastChangePct = variation prévue SUR CET horizon (pas sur 30j systématiquement). Chiffres réalistes -25% à +35%.`
          },
          {
            role: 'user',
            content: `Zone agricole : ${zone}
Météo : ${weather.temp}°C, humidité ${weather.humidity}%, vent ${weather.windSpeed} km/h.
Prévision 5j :
${forecastText}
Pollution : ${pollutionText}
Marché de gros (semaine en cours) : ${marketText}

Renvoie EXACTEMENT ce JSON :
{
  "headline": "<phrase qui nomme LA culture dont le prix va le plus monter et l'horizon correspondant>",
  "forecasts": [
    {
      "crop": "<culture>",
      "currentPrice": <nombre DT/kg>,
      "forecastChangePct": <entier négatif ou positif sur horizonDays>,
      "horizonDays": <30 pour maraîchage, 60 pour fruits, 90 pour datte/olive/palmier>,
      "horizonLabel": "<ex: '30 jours', '2 mois', '3 mois'>",
      "trend": "up|down|stable",
      "drivers": "<2 facteurs concrets en 1 phrase, ex: 'Vent NE soutenu + AQI 3 réduisent l'offre maraîchère'>",
      "windowAdvice": "<conseil concret en 1 phrase pour l'agriculteur de ${zone}>"
    },
    { "crop": "...", "currentPrice": ..., "forecastChangePct": ..., "horizonDays": ..., "horizonLabel": "...", "trend": "...", "drivers": "...", "windowAdvice": "..." },
    { "crop": "...", "currentPrice": ..., "forecastChangePct": ..., "horizonDays": ..., "horizonLabel": "...", "trend": "...", "drivers": "...", "windowAdvice": "..." },
    { "crop": "...", "currentPrice": ..., "forecastChangePct": ..., "horizonDays": ..., "horizonLabel": "...", "trend": "...", "drivers": "...", "windowAdvice": "..." }
  ],
  "marketSource": "<source de prix utilisée, ex: ONAGRI>"
}

Donne 4 cultures locales (tomate, poivron, datte, grenade, olive, pastèque, henné…), triées par |forecastChangePct| décroissant. Chaque culture DOIT avoir son propre horizonDays adapté à son cycle.`
          }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) {
      console.error('generatePriceForecast HTTP', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? '').trim();
    const parsed = JSON.parse(text) as Omit<PriceForecastPayload, 'zone' | 'generatedAt'>;
    const enriched: PriceForecast[] = parsed.forecasts.map(f => {
      const horizonDays = typeof f.horizonDays === 'number' && f.horizonDays > 0 ? f.horizonDays : inferHorizonDays(f.crop);
      const horizonLabel = typeof f.horizonLabel === 'string' && f.horizonLabel.trim() ? f.horizonLabel : horizonDaysToLabel(horizonDays);
      return { ...f, zone, horizonDays, horizonLabel };
    });
    const payload: PriceForecastPayload = {
      ...parsed,
      zone,
      forecasts: enriched,
      generatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return payload;
  } catch (err) {
    console.error('generatePriceForecast error', err);
    return null;
  }
}

function getSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'printemps';
  if (m >= 6 && m <= 8) return 'été';
  if (m >= 9 && m <= 11) return 'automne';
  return 'hiver';
}

function inferHorizonDays(crop: string): number {
  const c = (crop || '').toLowerCase();
  if (/datte|palm|olive|agrume|citron|orange/.test(c)) return 90;
  if (/grenade|raisin|figue|henn[ée]/.test(c)) return 60;
  return 30;
}

function horizonDaysToLabel(days: number): string {
  if (days >= 85) return '3 mois';
  if (days >= 55) return '2 mois';
  if (days >= 40) return '45 jours';
  return `${days} jours`;
}
