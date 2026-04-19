// src/components/Dashboard.tsx
// npm install react-map-gl maplibre-gl plotly.js react-plotly.js

import { useState, useEffect }       from "react"
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre"
import Plot                           from "react-plotly.js"
import { usePrediction }              from "../hooks/usePrediction"
import { api }                        from "../services/api"
import type { Factory }               from "../types"
import "maplibre-gl/dist/maplibre-gl.css"

// ── Usines par defaut (avant que l API reponde) ──
const DEFAULT_FACTORIES: Factory[] = [
  { id:"gct",  name:"GCT - Groupe Chimique Tunisien", lat:33.882, lon:10.098, type:"phosphate" },
  { id:"cpg",  name:"CPG - Compagnie des Phosphates",  lat:33.880, lon:10.100, type:"phosphate" },
  { id:"steg", name:"STEG - Centrale Thermique",       lat:33.875, lon:10.105, type:"energie"   },
  { id:"port", name:"Port Industriel de Gabes",        lat:33.868, lon:10.112, type:"port"      },
]

// Couleur selon le risk
function riskBg(label: string) {
  if (label === "high")   return "#e74c3c"
  if (label === "medium") return "#f39c12"
  return "#2ecc71"
}

export default function Dashboard() {
  const [factories,   setFactories]   = useState<Factory[]>(DEFAULT_FACTORIES)
  const [selected,    setSelected]    = useState<Factory>(DEFAULT_FACTORIES[0])
  const [production,  setProduction]  = useState(85)
  const { data, loading, error, predict } = usePrediction()

  // Charge les usines depuis l API
  useEffect(() => {
    api.getFactories()
      .then(f => { setFactories(f); setSelected(f[0]) })
      .catch(() => {})
  }, [])

  // Lance la prediction a chaque changement
  useEffect(() => {
    predict(selected, production)
  }, [selected, production, predict])

  // ── GeoJSON plume ──
  const plumeGeoJSON = data ? {
    type: "FeatureCollection" as const,
    features: data.plume_points.map(p => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
      properties: { intensity: p.z / 200 },
    })),
  } : null

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "320px 1fr 300px",
      gridTemplateRows: "60px 1fr 240px",
      height: "100vh",
      background: "#0a0f1e",
      color: "white",
      fontFamily: "'IBM Plex Mono', monospace",
      gap: 0,
    }}>

      {/* ── HEADER ── */}
      <header style={{
        gridColumn: "1/-1",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "linear-gradient(90deg,#0d1b2a,#1a2a3a)",
        borderBottom: "1px solid #1e3a5f",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span style={{ fontWeight: 700, letterSpacing: 2, fontSize: 14 }}>
            INVISIBLE SHIELD AI
          </span>
          <span style={{ color: "#4a7fa5", fontSize: 11 }}>— Gabès Industrial Monitor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
          {data && (
            <span style={{
              padding: "4px 12px", borderRadius: 20,
              background: riskBg(data.risk_label) + "33",
              border: `1px solid ${riskBg(data.risk_label)}`,
              color: riskBg(data.risk_label),
              fontWeight: 700,
            }}>
              RISK: {data.risk_label.toUpperCase()} {data.risk_score.toFixed(0)}/100
            </span>
          )}
          <span style={{ color: "#4a7fa5" }}>
            {new Date().toLocaleTimeString("fr-TN")}
          </span>
        </div>
      </header>

      {/* ── LEFT PANEL: Controles ── */}
      <aside style={{
        padding: 20,
        background: "#0d1b2a",
        borderRight: "1px solid #1e3a5f",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {/* Selectionneur usine */}
        <div>
          <label style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: 2, display: "block", marginBottom: 8 }}>
            USINE SOURCE
          </label>
          {factories.map(f => (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                marginBottom: 6, borderRadius: 6, cursor: "pointer",
                background: selected.id === f.id ? "#1e3a5f" : "transparent",
                border: `1px solid ${selected.id === f.id ? "#3498db" : "#1e3a5f"}`,
                color: selected.id === f.id ? "white" : "#8899aa",
                fontSize: 11, transition: "all .2s",
              }}
            >
              <div style={{ fontWeight: selected.id === f.id ? 700 : 400 }}>{f.name}</div>
              <div style={{ color: "#4a7fa5", fontSize: 10, marginTop: 2 }}>
                {f.lat.toFixed(4)}N, {f.lon.toFixed(4)}E
              </div>
            </button>
          ))}
        </div>

        {/* Production slider */}
        <div>
          <label style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: 2, display: "block", marginBottom: 8 }}>
            NIVEAU PRODUCTION: {production}%
          </label>
          <input
            type="range" min={10} max={100} value={production}
            onChange={e => setProduction(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3498db" }}
          />
        </div>

        {/* Meteo temps reel */}
        {data && (
          <div style={{
            background: "#071018", borderRadius: 8,
            border: "1px solid #1e3a5f", padding: 14,
          }}>
            <div style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: 2, marginBottom: 10 }}>
              METEO REELLE
            </div>
            {[
              ["🌡️ Temperature", `${data.temperature}°C`],
              ["💨 Vent",        `${data.wind_speed} m/s @ ${data.wind_deg}°`],
              ["💧 Humidite",    `${data.humidity}%`],
              ["🌫️ Dust Index",  `${data.dust_level.toFixed(0)}`],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, marginBottom: 6, color: "#c8d8e8",
              }}>
                <span>{k}</span>
                <span style={{ color: "white", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{
              marginTop: 10, padding: "6px 10px",
              background: "#0d1b2a", borderRadius: 6,
              fontSize: 10, color: "#7ecfff",
            }}>
              {data.wind_text}
            </div>
          </div>
        )}

        {/* Decisions AI */}
        {data && (
          <div style={{
            background: "#071018", borderRadius: 8,
            border: "1px solid #1e3a5f", padding: 14,
          }}>
            <div style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: 2, marginBottom: 10 }}>
              DECISIONS AI
            </div>
            <div style={{ fontSize: 11, marginBottom: 8 }}>
              <span style={{ color: "#8899aa" }}>Production: </span>
              <span style={{ color: "#e74c3c" }}>{data.production_before}%</span>
              <span style={{ color: "#4a7fa5" }}> → </span>
              <span style={{ color: "#2ecc71" }}>{data.production_after}%</span>
              <span style={{ color: "#f39c12", marginLeft: 6 }}>
                ({data.prod_change_pct}%)
              </span>
            </div>
            <div style={{ fontSize: 11, marginBottom: 8 }}>
              <span style={{ color: "#8899aa" }}>Pollution Red.: </span>
              <span style={{ color: "#2ecc71", fontWeight: 700 }}>
                -{data.pollution_reduction_pct}%
              </span>
            </div>
            {data.recommended_products.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#4a7fa5", marginBottom: 6 }}>PRODUITS:</div>
                {data.recommended_products.map(p => (
                  <div key={p} style={{
                    fontSize: 10, padding: "4px 8px", marginBottom: 4,
                    background: "#1e3a5f", borderRadius: 4, color: "#7ecfff",
                  }}>🧪 {p}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── CENTER: Carte Satellite ── */}
      <main style={{ position: "relative", overflow: "hidden" }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,15,30,0.7)", fontSize: 13, color: "#7ecfff",
          }}>
            ⏳ Analyse en cours...
          </div>
        )}
        {error && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            zIndex: 10, background: "#4a0a0a", border: "1px solid #e74c3c",
            padding: "8px 16px", borderRadius: 6, fontSize: 11, color: "#e74c3c",
          }}>
            ⚠️ {error}
          </div>
        )}

        <Map
          initialViewState={{ latitude: 33.882, longitude: 10.098, zoom: 12.5 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={{
            version: 8,
            sources: {
              "esri-satellite": {
                type: "raster",
                tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                tileSize: 256,
                attribution: "Esri World Imagery",
              },
            },
            layers: [{
              id: "esri-satellite-layer",
              type: "raster",
              source: "esri-satellite",
              minzoom: 0, maxzoom: 19,
            }],
          }}
        >
          {/* Heatmap plume pollution */}
          {plumeGeoJSON && (
            <Source id="plume" type="geojson" data={plumeGeoJSON}>
              <Layer
                id="plume-heat"
                type="heatmap"
                paint={{
                  "heatmap-weight":   ["get", "intensity"],
                  "heatmap-intensity": 1.5,
                  "heatmap-radius":    25,
                  "heatmap-opacity":   0.78,
                  "heatmap-color": [
                    "interpolate", ["linear"], ["heatmap-density"],
                    0,   "rgba(0,0,0,0)",
                    0.2, "rgba(0,200,0,0.4)",
                    0.4, "rgba(255,230,0,0.6)",
                    0.7, "rgba(255,100,0,0.75)",
                    1.0, "rgba(180,0,0,0.9)",
                  ],
                }}
              />
            </Source>
          )}

          {/* Fleches vent */}
          {data?.arrows.map((a, i) => (
            <Source key={`arrow-${i}`} id={`arrow-${i}`} type="geojson" data={{
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                geometry: { type: "LineString", coordinates: [[a.elon, a.elat],[a.slon, a.slat]] },
                properties: {},
              }],
            }}>
              <Layer
                id={`arrow-line-${i}`}
                type="line"
                paint={{ "line-color": "rgba(100,210,255,0.85)", "line-width": 2 }}
              />
            </Source>
          ))}

          {/* Marker usine source */}
          <Marker latitude={selected.lat} longitude={selected.lon}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#ff6b35",
              border: "3px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, cursor: "pointer",
              boxShadow: "0 0 20px rgba(255,107,53,0.6)",
              animation: "pulse 2s infinite",
            }}>
              🏭
            </div>
          </Marker>

          {/* Markers zones */}
          {data?.zones.map(z => (
            <Marker key={z.name} latitude={z.lat} longitude={z.lon}>
              <div title={`${z.name}\n${z.impact}\nPollution: ${z.pollution}`}
                style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: z.color, border: "2px solid white",
                  cursor: "pointer", transition: "transform .2s",
                  boxShadow: `0 0 8px ${z.color}88`,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.5)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              />
            </Marker>
          ))}
        </Map>

        {/* Legende */}
        <div style={{
          position: "absolute", bottom: 16, left: 16,
          background: "rgba(13,27,42,0.92)",
          border: "1px solid #1e3a5f",
          borderRadius: 8, padding: "10px 14px",
          fontSize: 10,
        }}>
          {[
            ["#e74c3c","Tres affecte (≥40)"],
            ["#f39c12","Affecte (≥15)"],
            ["#f1c40f","Peu affecte (≥5)"],
            ["#2ecc71","Non affecte (<5)"],
          ].map(([c, l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:c }} />
              <span style={{ color:"#c8d8e8" }}>{l}</span>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
            <div style={{ width:10,height:2,background:"rgba(100,210,255,0.85)" }} />
            <span style={{ color:"#c8d8e8" }}>Direction vent</span>
          </div>
        </div>
      </main>

      {/* ── RIGHT PANEL: Zones impact ── */}
      <aside style={{
        padding: 16,
        background: "#0d1b2a",
        borderLeft: "1px solid #1e3a5f",
        overflowY: "auto",
      }}>
        <div style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: 2, marginBottom: 12 }}>
          ZONES PAR IMPACT
        </div>
        {data?.zones
          .slice()
          .sort((a, b) => b.pollution - a.pollution)
          .map(z => (
          <div key={z.name} style={{
            marginBottom: 8, padding: "10px 12px",
            background: "#071018", borderRadius: 6,
            borderLeft: `3px solid ${z.color}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{z.name}</div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize: 10 }}>
              <span style={{ color: z.color }}>{z.impact}</span>
              <span style={{ color:"#4a7fa5" }}>
                {z.pollution.toFixed(1)}
              </span>
            </div>
            {/* Barre de pollution */}
            <div style={{
              marginTop: 6, height: 3, background: "#1e3a5f", borderRadius: 2,
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.min(z.pollution / 200 * 100, 100)}%`,
                background: z.color,
                transition: "width .5s",
              }} />
            </div>
          </div>
        ))}
      </aside>

      {/* ── BOTTOM: Graphiques ── */}
      <div style={{
        gridColumn: "1/-1",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: "1px solid #1e3a5f",
        background: "#071018",
      }}>
        {data && (
          <>
            {/* KPIs */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-around",
              padding: "0 20px",
            }}>
              {[
                ["Risk Score",     `${data.risk_score.toFixed(0)}/100`, data.risk_color],
                ["Pollution Red.", `-${data.pollution_reduction_pct}%`, "#2ecc71"],
                ["Prod. Change",   `${data.prod_change_pct}%`,         "#f39c12"],
                ["Poll. Index",    `${data.pollution_index.toFixed(0)}`, "#3498db"],
              ].map(([k, v, c]) => (
                <div key={k} style={{ textAlign:"center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{v}</div>
                  <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: 1 }}>{k}</div>
                </div>
              ))}
            </div>

            {/* Gauge risk */}
            <Plot
              data={[{
                type: "indicator" as const,
                mode: "gauge+number",
                value: data.risk_score,
                gauge: {
                  axis: { range: [0,100], tickcolor:"white" },
                  bar:  { color: data.risk_color },
                  steps: [
                    { range:[0,35],  color:"#0d2a1a" },
                    { range:[35,65], color:"#2a1e00" },
                    { range:[65,100],color:"#2a0a0a" },
                  ],
                  threshold: {
                    line:  { color:"white", width:2 },
                    value: data.risk_score,
                  },
                },
                number: { font:{ color:"white", size:24 } },
              }]}
              layout={{
                paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                font:{ color:"white", size:10 },
                margin:{ t:20, b:10, l:30, r:30 },
                height: 220,
                title: { text:"Risk Score", font:{ color:"#4a7fa5", size:11 } },
              }}
              config={{ displayModeBar:false }}
              style={{ width:"100%" }}
            />

            {/* Bar zones */}
            <Plot
              data={[{
                type:        "bar" as const,
                x:           data.zones.map(z => z.name.split(" ").slice(-1)[0]),
                y:           data.zones.map(z => z.pollution),
                marker:      { color: data.zones.map(z => z.color) },
                hovertext:   data.zones.map(z => `${z.name}: ${z.pollution.toFixed(1)}`),
                hoverinfo:   "text",
              }]}
              layout={{
                paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                font:{ color:"white", size:9 },
                margin:{ t:30, b:40, l:30, r:10 },
                height: 220,
                title: { text:"Pollution par Zone", font:{ color:"#4a7fa5", size:11 } },
                xaxis: { gridcolor:"#1e3a5f", color:"#4a7fa5" },
                yaxis: { gridcolor:"#1e3a5f", color:"#4a7fa5" },
              }}
              config={{ displayModeBar:false }}
              style={{ width:"100%" }}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,53,0.6); }
          50%      { box-shadow: 0 0 35px rgba(255,107,53,0.9); }
        }
      `}</style>
    </div>
  )
}
