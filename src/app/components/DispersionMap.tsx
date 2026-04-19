import { useEffect, useRef } from 'react';
import L, { Map as LMap, Layer } from 'leaflet';

const FACTORY = { lat: 33.8881, lon: 10.0975, name: 'CPG/GCT Gabès' };
const CITY = { lat: 33.8869, lon: 10.0982, name: 'Ville de Gabès' };
const SEA = { lat: 33.95, lon: 10.28, name: 'Golfe de Gabès' };

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
const dn = (d: number) => COMPASS[Math.round(d / 22.5) % 16];

function plumeColor(risk: number): string {
  if (risk > 65) return '#ef4444';
  if (risk > 40) return '#f97316';
  return '#94a3b8';
}

export function DispersionMap({
  windDeg,
  windSpeed,
  risk,
  height = 360
}: {
  windDeg: number;
  windSpeed: number;
  risk: number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const overlayLayersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false
    }).setView([FACTORY.lat, FACTORY.lon], 12);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(map);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.7 }
    ).addTo(map);

    addPin(map, FACTORY.lat, FACTORY.lon, '#ef4444', 30, '🏭', FACTORY.name);
    addPin(map, CITY.lat, CITY.lon, '#3b82f6', 24, '🏙️', CITY.name);
    addPin(map, SEA.lat, SEA.lon, '#22c55e', 22, '🌊', SEA.name);

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      overlayLayersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    overlayLayersRef.current.forEach(l => map.removeLayer(l));
    overlayLayersRef.current = [];

    const rad = (windDeg * Math.PI) / 180;
    const R = 111.32;
    const cL = Math.cos((FACTORY.lat * Math.PI) / 180);
    const maxKm = Math.min(20, Math.max(4, windSpeed * 0.5));
    const N = 40;
    const sc = plumeColor(risk);

    const axis: [number, number][] = [[FACTORY.lat, FACTORY.lon]];
    for (let i = 1; i <= N; i++) {
      const d = (i / N) * maxKm;
      axis.push([
        FACTORY.lat + (d / R) * Math.cos(rad),
        FACTORY.lon + (d / (R * cL)) * Math.sin(rad)
      ]);
    }

    const axisLine = L.polyline(axis, {
      color: sc,
      weight: 3,
      opacity: 0.85,
      dashArray: '10 5'
    })
      .addTo(map)
      .bindTooltip(`Vent ${windSpeed.toFixed(1)} km/h → ${dn(windDeg)}`, { sticky: true });
    overlayLayersRef.current.push(axisLine);

    const perp = rad + Math.PI / 2;
    [0.15, 0.3, 0.46].forEach((sp, i) => {
      [-1, 1].forEach(side => {
        const pts: [number, number][] = axis.map((pt, j) => {
          const t = j / N;
          const s = t * maxKm * sp * Math.pow(Math.sin(t * Math.PI), 0.55) * side;
          return [
            pt[0] + (s / R) * Math.cos(perp),
            pt[1] + (s / (R * cL)) * Math.sin(perp)
          ];
        });
        const line = L.polyline(pts, {
          color: sc,
          weight: 1.5,
          opacity: Math.max(0.05, 0.22 - i * 0.06)
        }).addTo(map);
        overlayLayersRef.current.push(line);
      });
    });

    const top: [number, number][] = [];
    const bot: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const d = t * maxKm;
      const s = d * 0.4 * Math.pow(Math.sin(t * Math.PI), 0.55);
      const bLat = FACTORY.lat + (d / R) * Math.cos(rad);
      const bLon = FACTORY.lon + (d / (R * cL)) * Math.sin(rad);
      top.push([
        bLat + (s / R) * Math.cos(perp),
        bLon + (s / (R * cL)) * Math.sin(perp)
      ]);
      bot.unshift([
        bLat - (s / R) * Math.cos(perp),
        bLon - (s / (R * cL)) * Math.sin(perp)
      ]);
    }
    const polyPlume = L.polygon([...top, ...bot], {
      color: sc,
      weight: 0.6,
      opacity: 0.35,
      fillColor: sc,
      fillOpacity: 0.09
    }).addTo(map);
    overlayLayersRef.current.push(polyPlume);

    const zoneCenter: [number, number] = [
      FACTORY.lat + (1.2 / R) * Math.cos(rad),
      FACTORY.lon + (1.2 / (R * cL)) * Math.sin(rad)
    ];
    const zones = [
      { r: 600, c: '#ef4444', fo: 0.26, t: 'Danger 0–600 m' },
      { r: 2000, c: '#f97316', fo: 0.13, t: '600 m – 2 km' },
      { r: 5000, c: '#eab308', fo: 0.06, t: '2 – 5 km' },
      { r: 10000, c: '#22c55e', fo: 0.03, t: '5 – 10 km' }
    ];
    zones.forEach(z => {
      const circle = L.circle(zoneCenter, {
        radius: z.r,
        color: z.c,
        weight: 0.8,
        fillColor: z.c,
        fillOpacity: z.fo
      })
        .addTo(map)
        .bindTooltip(z.t, { sticky: true });
      overlayLayersRef.current.push(circle);
    });
  }, [windDeg, windSpeed, risk]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(15,26,19,0.08)'
      }}
    />
  );
}

function addPin(
  map: LMap,
  lat: number,
  lon: number,
  color: string,
  size: number,
  icon: string,
  name: string
) {
  const html = `<div style="width:${size + 8}px;height:${size + 8}px;background:#0F1A13;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size - 6}px;box-shadow:0 0 0 3px ${color}33">${icon}</div>`;
  L.marker([lat, lon], {
    icon: L.divIcon({
      html,
      iconSize: [size + 8, size + 8],
      iconAnchor: [(size + 8) / 2, (size + 8) / 2],
      className: ''
    })
  })
    .addTo(map)
    .bindTooltip(name, { direction: 'top', offset: [0, -8] });
}

export function CompassRose({
  windDeg,
  size = 96,
  arrowColor = '#2BA24C',
  ringColor = 'rgba(15,26,19,0.12)',
  textColor = '#98A29A'
}: {
  windDeg: number;
  size?: number;
  arrowColor?: string;
  ringColor?: string;
  textColor?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <circle cx="45" cy="45" r="42" fill="none" stroke={ringColor} strokeWidth="1.5" />
      <circle cx="45" cy="45" r="30" fill="none" stroke={ringColor} strokeWidth="0.5" strokeDasharray="4 3" />
      <text x="45" y="9" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="600">N</text>
      <text x="82" y="48" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="600">E</text>
      <text x="45" y="86" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="600">S</text>
      <text x="8" y="48" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="600">O</text>
      <g transform={`rotate(${windDeg},45,45)`} style={{ transition: 'transform .6s ease' }}>
        <line x1="45" y1="45" x2="45" y2="12" stroke={arrowColor} strokeWidth="3" strokeLinecap="round" />
        <polygon points="45,7 41,17 49,17" fill={arrowColor} />
        <line x1="45" y1="45" x2="45" y2="68" stroke="#D24C4C" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      </g>
      <circle cx="45" cy="45" r="4" fill="#0F1A13" />
    </svg>
  );
}
