import { OWM_API_KEY, ZONES_COORDS, type ZoneName } from './ai';

const FACTORY = { lat: 33.8881, lon: 10.0975 };
const CITY = { lat: 33.8869, lon: 10.0982 };
const SEA = { lat: 33.95, lon: 10.28 };
export const FACTORY_EMISSION_RATE = 500; // kg/h SO₂+NOₓ at 100% throttle

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
export const compass16 = (d: number) => COMPASS[Math.round(d / 22.5) % 16];

export function calcDispersionRisk(windDeg: number, windSpeed: number, rain = 0): number {
  const cAz = (Math.atan2(CITY.lon - FACTORY.lon, CITY.lat - FACTORY.lat) * 180 / Math.PI + 360) % 360;
  const sAz = (Math.atan2(SEA.lon - FACTORY.lon, SEA.lat - FACTORY.lat) * 180 / Math.PI + 360) % 360;
  const dc = Math.abs(((windDeg - cAz + 180) % 360) - 180);
  const ds = Math.abs(((windDeg - sAz + 180) % 360) - 180);
  const cs = Math.max(0, (90 - dc) / 90);
  const ss = Math.max(0, (90 - ds) / 90);
  let r = cs * (windSpeed < 8 ? 1.15 : windSpeed < 25 ? 0.85 : 0.65) * Math.max(0.25, 1 - rain * 0.12) * 100;
  if (ss > 0.5) r *= 1 - ss * 0.45;
  return Math.min(100, Math.max(0, r));
}

export type RiskLevel = {
  prodPct: number;
  label: 'OPTIMAL' | 'BON' | 'MODÉRÉ' | 'MAUVAIS' | 'DANGER' | 'ARRÊT';
  color: string;
  toneBg: string;
};

export function riskToProd(risk: number): RiskLevel {
  if (risk < 20) return { prodPct: 100, label: 'OPTIMAL', color: '#2BA24C', toneBg: '#E6F4EA' };
  if (risk < 38) return { prodPct: 80, label: 'BON', color: '#3FB950', toneBg: '#E6F4EA' };
  if (risk < 52) return { prodPct: 60, label: 'MODÉRÉ', color: '#D29922', toneBg: '#FEF3DC' };
  if (risk < 65) return { prodPct: 40, label: 'MAUVAIS', color: '#DB6D28', toneBg: '#FDE6D3' };
  if (risk < 78) return { prodPct: 20, label: 'DANGER', color: '#D24C4C', toneBg: '#FCE8E6' };
  return { prodPct: 0, label: 'ARRÊT', color: '#7F1D1D', toneBg: '#FCE8E6' };
}

export type HourSlot = {
  hour: number;
  hourLabel: string;
  windDeg: number;
  windSpeed: number;
  rain: number;
  risk: number;
  rec: RiskLevel;
  pollutionKg: number;
};

/**
 * Builds 24 hourly slots starting "now" by interpolating the OpenWeather 3-hour forecast.
 * Falls back to the supplied current snapshot with a diurnal pattern when the forecast call fails.
 */
export async function fetchHourlyDispersion(
  zone: ZoneName,
  currentWindDeg: number,
  currentWindSpeed: number
): Promise<HourSlot[]> {
  const { lat, lon } = ZONES_COORDS[zone];
  let triplets: { dt: number; windDeg: number; windSpeed: number; rain: number }[] = [];

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=fr`
    );
    if (res.ok) {
      const data = await res.json();
      triplets = (data.list as any[]).slice(0, 9).map(e => ({
        dt: e.dt * 1000,
        windDeg: e.wind?.deg ?? currentWindDeg,
        windSpeed: (e.wind?.speed ?? currentWindSpeed / 3.6) * 3.6,
        rain: e.rain?.['3h'] ?? 0
      }));
    }
  } catch {
    /* fall through to synthetic */
  }

  const now = Date.now();
  const slots: HourSlot[] = [];
  for (let i = 0; i < 24; i++) {
    const tMs = now + i * 3600 * 1000;
    let windDeg = currentWindDeg;
    let windSpeed = currentWindSpeed;
    let rain = 0;

    if (triplets.length >= 2) {
      // pick the two closest triplets and lerp
      const after = triplets.find(t => t.dt >= tMs) ?? triplets[triplets.length - 1];
      const before = [...triplets].reverse().find(t => t.dt <= tMs) ?? triplets[0];
      const span = after.dt - before.dt;
      const k = span > 0 ? (tMs - before.dt) / span : 0;
      const lerpDeg = (a: number, b: number, t: number) => {
        const d = ((b - a + 540) % 360) - 180;
        return (a + d * t + 360) % 360;
      };
      windDeg = lerpDeg(before.windDeg, after.windDeg, k);
      windSpeed = before.windSpeed + (after.windSpeed - before.windSpeed) * k;
      rain = before.rain + (after.rain - before.rain) * k;
    } else {
      // synthetic diurnal cycle as fallback
      const h = new Date(tMs).getHours();
      const diurnal = Math.sin((h / 24) * Math.PI * 2) * 4;
      windSpeed = Math.max(2, currentWindSpeed + diurnal);
      windDeg = (currentWindDeg + Math.sin(h * 0.45) * 18 + 360) % 360;
    }

    const risk = calcDispersionRisk(windDeg, windSpeed, rain);
    const rec = riskToProd(risk);
    const hourD = new Date(tMs);
    slots.push({
      hour: hourD.getHours(),
      hourLabel: hourD.getHours() + 'h',
      windDeg,
      windSpeed,
      rain,
      risk,
      rec,
      pollutionKg: (rec.prodPct / 100) * FACTORY_EMISSION_RATE
    });
  }
  return slots;
}
