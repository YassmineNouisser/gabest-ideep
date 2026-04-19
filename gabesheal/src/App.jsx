import React, { useState, useEffect, useMemo } from "react";

const OPENAI_API_KEY = import.meta.env?.VITE_OPENAI_API_KEY ?? "";
const OWM_API_KEY = import.meta.env?.VITE_OWM_API_KEY ?? "";

const ZONES = {
  "Ghannouch":    { lat: 33.9167, lon: 10.0500 },
  "Métouia":      { lat: 33.9667, lon: 10.0000 },
  "Chenini":      { lat: 33.8833, lon: 9.9833  },
  "Bou Chemma":   { lat: 33.9000, lon: 10.1000 },
  "El Hamma":     { lat: 33.8833, lon: 9.8000  },
  "Centre ville": { lat: 33.8833, lon: 10.0982 }
};

const FALLBACK_POLLUTION = {
  "Ghannouch":    { so2: 87, pm25: 42, pm10: 65, no2: 28, aqi: 3 },
  "Bou Chemma":   { so2: 95, pm25: 58, pm10: 78, no2: 35, aqi: 4 },
  "Métouia":      { so2: 34, pm25: 28, pm10: 40, no2: 18, aqi: 2 },
  "Chenini":      { so2: 12, pm25: 15, pm10: 22, no2: 10, aqi: 1 },
  "El Hamma":     { so2: 18, pm25: 20, pm10: 28, no2: 12, aqi: 2 },
  "Centre ville": { so2: 45, pm25: 35, pm10: 52, no2: 22, aqi: 3 }

};

const SYMPTOMES_LIST = [
  "Toux sèche", "Maux de tête", "Yeux irrités", "Fatigue",
  "Difficultés respiratoires", "Fièvre", "Douleurs thoraciques"

];

const DUREE_LIST = ["Aujourd'hui", "2-3 jours", "1 semaine", "Plus d'une semaine"];

const PROFIL_LIST = [
  "Enfant -12 ans", "Asthmatique", "Femme enceinte", "Personne âgée +65 ans"
];
const idee de projet , 
const COLORS = {
  green: "#1A6B47",
  sand: "#C8973A",
  danger: "#8B3A2A",
  bg: "#F7F5F0",
  text: "#1C1C1E"
};

const INITIAL_PATIENTS = [
  {
    id: 1,
    prenom: "Amira",
    age: 34,
    zone: "Ghannouch",
    symptomes: ["Toux sèche", "Maux de tête"],
    duree: "2-3 jours",
    profil: [],
    pollution: FALLBACK_POLLUTION["Ghannouch"],
    rapport: {
      cause_probable: "Exposition SO₂ industriel",
      lien_pollution: "oui",
      niveau_gravite: "modéré",
      explication: "Les symptômes correspondent à une irritation des voies respiratoires liée au SO₂ émis par les complexes industriels de Ghannouch. La concentration mesurée dépasse les seuils OMS.",
      recommandation_patient: "Limiter les sorties matinales, porter un masque FFP2 à l'extérieur, hydratation accrue.",
      recommandation_medecin: "Surveiller fonction respiratoire",
      action_immediate: "Consultation 24h",
      resume: "Patiente exposée aux rejets SO₂ de Ghannouch présentant céphalées et toux sèche depuis 2-3 jours. Lien environnemental probable. Surveillance recommandée."
    },
    timestamp: new Date(Date.now() - 3600000 * 4).toLocaleString()
  },
  {
    id: 2,
    prenom: "Mohamed",
    age: 67,
    zone: "Bou Chemma",
    symptomes: ["Difficultés respiratoires", "Fatigue"],
    duree: "1 semaine",
    profil: ["Personne âgée +65 ans"],
    pollution: FALLBACK_POLLUTION["Bou Chemma"],
    rapport: {
      cause_probable: "Particules fines PM2.5 élevées",
      lien_pollution: "oui",
      niveau_gravite: "critique",
      explication: "Le taux de PM2.5 atteint un seuil critique à Bou Chemma. Chez un patient âgé, ces particules pénètrent profondément les alvéoles et provoquent dyspnée et fatigue intense.",
      recommandation_patient: "Confinement immédiat, éviter tout effort physique, contacter SAMU si aggravation.",
      recommandation_medecin: "Spirométrie urgente, antécédents cardiaques à vérifier",
      action_immediate: "Urgences",
      resume: "Patient âgé exposé à PM2.5 critique présentant dyspnée et asthénie d'aggravation progressive. Risque cardio-respiratoire élevé. Prise en charge urgente requise."
    },
    timestamp: new Date(Date.now() - 3600000 * 1).toLocaleString()
  },
  {
    id: 3,
    prenom: "Sarra",
    age: 8,
    zone: "Métouia",
    symptomes: ["Yeux irrités", "Toux sèche"],
    duree: "Aujourd'hui",
    profil: ["Enfant -12 ans"],
    pollution: FALLBACK_POLLUTION["Métouia"],
    rapport: {
      cause_probable: "NO₂ et poussières agricoles",
      lien_pollution: "probable",
      niveau_gravite: "faible",
      explication: "Les niveaux modérés de NO₂ combinés à des poussières d'origine agricole peuvent expliquer l'irritation oculaire et la toux légère chez l'enfant.",
      recommandation_patient: "Rinçage oculaire au sérum physiologique, repos, surveillance parentale.",
      recommandation_medecin: "Antihistaminiques, revoir si aggravation",
      action_immediate: "Repos à domicile",
      resume: "Enfant avec symptômes légers liés à la qualité de l'air à Métouia. Aucun signe de gravité. Suivi à 48h conseillé."
    },
    timestamp: new Date(Date.now() - 3600000 * 8).toLocaleString()
  }
];

async function fetchPollution(zone) {
  const coords = ZONES[zone];
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}`
    );
    if (!res.ok) throw new Error("OWM error");
    const data = await res.json();
    const c = data.list[0].components;
    return {
      so2: Math.round(c.so2),
      pm25: Math.round(c.pm2_5),
      pm10: Math.round(c.pm10),
      no2: Math.round(c.no2),
      aqi: data.list[0].main.aqi
    };
  } catch (e) {
    return FALLBACK_POLLUTION[zone];
  }
}

async function generateReport(payload) {
  const { prenom, age, zone, symptomes, duree, profil, pollution } = payload;
  const userPrompt = `
Patient :
- Prénom : ${prenom}
- Age : ${age} ans
- Zone : ${zone}
- Symptômes : ${symptomes.join(", ") || "aucun"}
- Durée : ${duree}
- Profil vulnérable : ${profil.join(", ") || "aucun"}

Données pollution RÉELLES de ${zone} maintenant :
- SO₂ : ${pollution.so2} µg/m³
- PM2.5 : ${pollution.pm25} µg/m³
- PM10 : ${pollution.pm10} µg/m³
- NO₂ : ${pollution.no2} µg/m³
- AQI : ${pollution.aqi}/5

Réponds avec un JSON contenant EXACTEMENT ces clés. Remplace chaque <...> par ton analyse réelle du cas de ${prenom}. Ne recopie JAMAIS la description entre <>.

{
  "cause_probable": "<nomme la cause environnementale la plus probable, ex: 'Exposition aux PM10 et NO2 industriels'>",
  "lien_pollution": "<une seule valeur parmi: oui | non | probable>",
  "niveau_gravite": "<une seule valeur parmi: faible | modéré | critique>",
  "explication": "<2 phrases concrètes liant les symptômes du patient aux polluants mesurés>",
  "recommandation_patient": "<conseil concret et actionnable adressé directement à ${prenom}>",
  "recommandation_medecin": "<information clinique utile au médecin traitant>",
  "action_immediate": "<une seule valeur parmi: Repos à domicile | Consultation 24h | Consultation urgente | Urgences>",
  "resume": "<résumé de 3 phrases pour dossier médical>"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant médical IA pour Gabès, Tunisie. Réponds UNIQUEMENT en JSON valide sans markdown.

CONTEXTE LOCAL — Gabès abrite un pôle chimique majeur (GCT) avec émissions chroniques SO2, phosphogypse, PM. Les capteurs OWM globaux sous-estiment souvent les polluants industriels locaux ; ne te fie PAS uniquement à l'AQI brut.

GRILLE DE GRAVITÉ (applique dans l'ordre — la plus haute gagne) :

CRITIQUE → action "Urgences" ou "Consultation urgente"
- Douleurs thoraciques, quelle que soit la durée
- Difficultés respiratoires + (âge ≥65 OU asthmatique OU femme enceinte OU enfant -12)
- Symptômes respiratoires persistants > 1 semaine chez un profil vulnérable
- ≥3 symptômes simultanés chez un profil vulnérable

MODÉRÉ → action "Consultation 24h"
- Difficultés respiratoires seule chez adulte sans comorbidité
- Symptômes ≥ 2-3 jours chez profil vulnérable sans signe de détresse
- Fièvre + toux persistante
- Combinaison ≥2 symptômes respiratoires

FAIBLE → action "Repos à domicile"
- Symptômes isolés récents (aujourd'hui) chez adulte sans comorbidité
- Yeux irrités OU maux de tête isolés en zone AQI ≤2

LIEN POLLUTION :
- "oui" si la zone est industrielle (Ghannouch, Bou Chemma) ET symptômes respiratoires/oculaires typiques, même si AQI apparent bas (sous-estimation probable)
- "probable" si zone moins exposée mais symptômes compatibles avec polluants mesurés
- "non" uniquement si fièvre isolée ou symptômes clairement non environnementaux

Adapte toujours le ton au profil (pédiatrique, gériatrique, grossesse). Mentionne les polluants spécifiques par leur nom (SO2, PM2.5, PM10, NO2) dans l'explication.`
        },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content?.trim() || "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Réponse IA non parsable en JSON: " + text.slice(0, 120));
  }
}

const Badge = ({ children, color }) => {
  const map = {
    red:    "bg-red-100 text-red-800 border-red-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    green:  "bg-green-100 text-green-800 border-green-300",
    gray:   "bg-gray-100 text-gray-700 border-gray-300"
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const linkColor = (v) => v === "oui" ? "red" : v === "probable" ? "orange" : v === "non" ? "green" : "gray";
const gravColor = (v) => v === "critique" ? "red" : v === "modéré" ? "orange" : v === "faible" ? "green" : "gray";

function CitizenView({ onSubmit }) {
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [zone, setZone] = useState("Ghannouch");
  const [symptomes, setSymptomes] = useState([]);
  const [duree, setDuree] = useState(DUREE_LIST[0]);
  const [profil, setProfil] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastPatient, setLastPatient] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const toggle = (list, setList, val) => {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!prenom.trim() || !age) {
      setError("Veuillez remplir prénom et âge.");
      return;
    }

    setLoading(true);
    try {
      const pollution = await fetchPollution(zone);
      const payload = { prenom: prenom.trim(), age: Number(age), zone, symptomes, duree, profil, pollution };
      const rapport = await generateReport(payload);

      const patient = {
        id: Date.now(),
        ...payload,
        rapport,
        timestamp: new Date().toLocaleString()
      };

      onSubmit(patient);
      setSuccess(true);
      setLastPatient(patient);
      setShowReport(true);
      setPrenom(""); setAge(""); setSymptomes([]); setProfil([]); setDuree(DUREE_LIST[0]);
    } catch (err) {
      setError("Erreur IA : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.green, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Déclaration de symptômes
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Décrivez votre état pour générer un rapport médical IA basé sur la qualité de l'air de votre zone.
        </p>

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center justify-between gap-3">
            <span>✓ Votre rapport a été transmis à votre médecin.</span>
            {lastPatient && (
              <button
                onClick={() => setShowReport(true)}
                className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                style={{ backgroundColor: COLORS.green }}
              >
                Voir mon rapport
              </button>
            )}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Âge</label>
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              {Object.keys(ZONES).map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Symptômes</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYMPTOMES_LIST.map(s => (
                <label key={s} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={symptomes.includes(s)}
                    onChange={() => toggle(symptomes, setSymptomes, s)}
                    className="accent-green-700"
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Durée</label>
            <select
              value={duree}
              onChange={(e) => setDuree(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              {DUREE_LIST.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Profil vulnérable</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROFIL_LIST.map(p => (
                <label key={p} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={profil.includes(p)}
                    onChange={() => toggle(profil, setProfil, p)}
                    className="accent-green-700"
                  />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60 transition"
            style={{ backgroundColor: COLORS.green }}
          >
            {loading ? "L'IA analyse votre état..." : "Soumettre et générer mon rapport IA"}
          </button>
        </form>
      </div>

      {showReport && lastPatient && (
        <ReportPanel patient={lastPatient} onClose={() => setShowReport(false)} forPatient />
      )}
    </div>
  );
}

const POLLUTANT_META = {
  so2:  { label: "SO₂",   desc: "Dioxyde de soufre",    good: 40,  moderate: 80  },
  pm25: { label: "PM2.5", desc: "Particules fines",     good: 15,  moderate: 45  },
  pm10: { label: "PM10",  desc: "Poussières",           good: 45,  moderate: 100 },
  no2:  { label: "NO₂",   desc: "Dioxyde d'azote",      good: 25,  moderate: 80  }
};

const pollutantStatus = (key, value) => {
  const m = POLLUTANT_META[key];
  if (!m) return { label: "—", color: COLORS.green, bg: "#E8F3EE" };
  if (value <= m.good)     return { label: "Bon",      color: COLORS.green,  bg: "#E8F3EE" };
  if (value <= m.moderate) return { label: "Modéré",   color: COLORS.sand,   bg: "#FBF1DC" };
  return                         { label: "Élevé",    color: COLORS.danger, bg: "#F8E3DD" };
};

const AQI_INFO = {
  1: { label: "Très bon", color: COLORS.green,  bg: "#E8F3EE" },
  2: { label: "Bon",      color: COLORS.green,  bg: "#E8F3EE" },
  3: { label: "Modéré",   color: COLORS.sand,   bg: "#FBF1DC" },
  4: { label: "Mauvais",  color: COLORS.danger, bg: "#F8E3DD" },
  5: { label: "Très mauvais", color: COLORS.danger, bg: "#F8E3DD" }
};

const GRAVITY_INFO = {
  faible:   { emoji: "🟢", label: "Risque faible",   desc: "Votre état ne présente pas de signes de gravité.", bg: "#E8F3EE", color: COLORS.green },
  "modéré": { emoji: "🟠", label: "Vigilance requise", desc: "Votre état nécessite un suivi médical dans les 24h.", bg: "#FBF1DC", color: COLORS.sand },
  critique: { emoji: "🔴", label: "Prise en charge urgente", desc: "Vos symptômes nécessitent une attention immédiate.", bg: "#F8E3DD", color: COLORS.danger }
};

function PatientReport({ patient, onClose }) {
  const r = patient.rapport;
  const p = patient.pollution;
  const g = GRAVITY_INFO[r.niveau_gravite] || GRAVITY_INFO.faible;
  const aqi = AQI_INFO[p.aqi] || AQI_INFO[3];
  const handlePrint = () => window.print();

  const recos = (r.recommandation_patient || "")
    .split(/[.;]\s+/).map(s => s.trim()).filter(s => s.length > 3);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 print:hidden" onClick={onClose}></div>
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto print:static print:w-full print:shadow-none">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 px-5 py-3 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: COLORS.green }}>G</div>
            <span className="font-semibold text-sm text-gray-600">Votre rapport santé</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>

        <div className="relative px-6 pt-6 pb-8 text-white overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.green} 0%, #0f4d32 100%)` }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white"></div>
          <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full opacity-10 bg-white"></div>
          <div className="relative">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-1">Bonjour</div>
            <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{patient.prenom}</h2>
            <div className="text-white/80 text-sm mt-1">{patient.age} ans · {patient.zone}</div>
            <div className="text-white/60 text-xs mt-3">Rapport généré le {patient.timestamp}</div>
          </div>
        </div>

        <div className="px-5 py-5 -mt-5 relative z-[1]">
          <div className="rounded-2xl shadow-lg p-5" style={{ backgroundColor: g.bg, borderLeft: `4px solid ${g.color}` }}>
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">{g.emoji}</div>
              <div className="flex-1">
                <div className="text-xs uppercase font-semibold tracking-wider" style={{ color: g.color }}>Gravité · {r.niveau_gravite}</div>
                <div className="font-bold text-lg mt-0.5" style={{ color: g.color }}>{g.label}</div>
                <div className="text-sm text-gray-700 mt-1">{g.desc}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-2xl border-2 p-4 flex items-center gap-4" style={{ borderColor: g.color, backgroundColor: "#fff" }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: g.bg }}>
              →
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Ce que vous devez faire</div>
              <div className="font-bold text-lg" style={{ color: g.color }}>{r.action_immediate}</div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <h4 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: COLORS.green }}></span>
            Qualité de l'air · {patient.zone}
          </h4>

          <div className="rounded-xl p-4 mb-3 flex items-center justify-between" style={{ backgroundColor: aqi.bg }}>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Indice global</div>
              <div className="font-bold text-xl" style={{ color: aqi.color }}>{aqi.label}</div>
            </div>
            <div className="text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <div className="font-bold text-3xl" style={{ color: aqi.color }}>{p.aqi}<span className="text-base text-gray-400">/5</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.keys(POLLUTANT_META).map(key => {
              const meta = POLLUTANT_META[key];
              const status = pollutantStatus(key, p[key]);
              return (
                <div key={key} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{meta.label}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mb-1">{meta.desc}</div>
                  <div className="font-bold text-base" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {p[key]}<span className="text-xs text-gray-400 font-normal"> µg/m³</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 pb-5">
          <h4 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: COLORS.green }}></span>
            Ce que l'IA a compris
          </h4>
          <div className="rounded-xl bg-gray-50 p-4 space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Cause probable</div>
              <div className="font-semibold">{r.cause_probable}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge color={linkColor(r.lien_pollution)}>Lien pollution · {r.lien_pollution}</Badge>
            </div>
            {r.explication && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Pourquoi ?</div>
                <div className="text-sm leading-relaxed text-gray-700">{r.explication}</div>
              </div>
            )}
          </div>
        </div>

        {recos.length > 0 && (
          <div className="px-5 pb-5">
            <h4 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: COLORS.green }}></span>
              Recommandations pour vous
            </h4>
            <ul className="space-y-2">
              {recos.map((reco, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS.green }}>{i + 1}</div>
                  <div className="text-sm flex-1">{reco.replace(/\.$/, "")}.</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-5 pb-5">
          <h4 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: COLORS.green }}></span>
            Votre déclaration
          </h4>
          <div className="rounded-xl border border-gray-200 p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Symptômes</span><span className="font-medium text-right">{patient.symptomes.join(", ") || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{patient.duree}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Profil</span><span className="font-medium text-right">{patient.profil.join(", ") || "—"}</span></div>
          </div>
        </div>

        <div className="px-5 pb-8 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full py-3 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition"
            style={{ backgroundColor: COLORS.green }}
          >
            Imprimer mon rapport
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
            Ce rapport est généré par IA à titre informatif. En cas d'aggravation, contactez un professionnel de santé ou le SAMU (190).
          </p>
        </div>
      </aside>
    </>
  );
}

function ReportPanel({ patient, onClose, forPatient = false }) {
  if (!patient) return null;
  if (forPatient) return <PatientReport patient={patient} onClose={onClose} />;

  const r = patient.rapport;
  const p = patient.pollution;

  const handlePrint = () => window.print();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}></div>
      <aside className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 overflow-y-auto print:static print:w-full print:shadow-none">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-lg" style={{ color: COLORS.green }}>Rapport médical IA</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <section>
            <h4 className="font-semibold text-gray-500 uppercase text-xs mb-2">Patient</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div><span className="font-semibold">{patient.prenom}</span>, {patient.age} ans</div>
              <div className="text-gray-600">Zone : {patient.zone}</div>
              <div className="text-gray-600">Durée symptômes : {patient.duree}</div>
              <div className="text-gray-600">Symptômes : {patient.symptomes.join(", ") || "—"}</div>
              <div className="text-gray-600">Profil : {patient.profil.join(", ") || "—"}</div>
              <div className="text-xs text-gray-400 mt-2">Déclaré le {patient.timestamp}</div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-500 uppercase text-xs mb-2">Pollution mesurée</h4>
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <div className="bg-gray-50 rounded p-2"><div className="text-gray-500">SO₂</div><div className="font-bold text-base">{p.so2} µg/m³</div></div>
              <div className="bg-gray-50 rounded p-2"><div className="text-gray-500">PM2.5</div><div className="font-bold text-base">{p.pm25} µg/m³</div></div>
              <div className="bg-gray-50 rounded p-2"><div className="text-gray-500">PM10</div><div className="font-bold text-base">{p.pm10} µg/m³</div></div>
              <div className="bg-gray-50 rounded p-2"><div className="text-gray-500">NO₂</div><div className="font-bold text-base">{p.no2} µg/m³</div></div>
              <div className="bg-gray-50 rounded p-2 col-span-2"><div className="text-gray-500">AQI</div><div className="font-bold text-base">{p.aqi}/5</div></div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-500 uppercase text-xs mb-2">Analyse IA</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 font-semibold">Cause probable</div>
                <div>{r.cause_probable}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color={linkColor(r.lien_pollution)}>Lien pollution : {r.lien_pollution}</Badge>
                <Badge color={gravColor(r.niveau_gravite)}>Gravité : {r.niveau_gravite}</Badge>
              </div>
              {r.explication && (
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Explication</div>
                  <div>{r.explication}</div>
                </div>
              )}
              {r.recommandation_patient && (
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Recommandation patient</div>
                  <div>{r.recommandation_patient}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 font-semibold">Recommandation médecin</div>
                <div>{r.recommandation_medecin}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">Action immédiate</div>
                <div className="font-semibold" style={{ color: COLORS.danger }}>{r.action_immediate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">Résumé dossier</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 italic">{r.resume}</div>
              </div>
            </div>
          </section>

          <button
            onClick={handlePrint}
            className="w-full py-2.5 rounded-lg text-white font-semibold print:hidden"
            style={{ backgroundColor: COLORS.green }}
          >
            Imprimer rapport
          </button>
        </div>
      </aside>
    </>
  );
}

const I18N = {
  fr: {
    subtitle: "Assistant santé IA · Bilingue FR/تونسي",
    online: "En ligne",
    selectZoneLabel: "Sélectionnez votre zone pour commencer",
    selectZonePlaceholder: "— Choisir une zone —",
    loadingZone: "Chargement des données pollution...",
    zoneLabel: "Zone",
    change: "changer",
    placeholder: "Posez votre question en français ou بالتونسي...",
    errorFetch: "Impossible de récupérer les données pollution.",
    errorNoZone: "Veuillez d'abord sélectionner votre zone.",
    errorAI: "Erreur IA : ",
    welcome: `Bonjour ! Je suis DrGabès, votre assistant santé IA.
Je connais la qualité de l'air de votre zone en ce moment.
Posez-moi vos questions en français ou en tunisien.
Dans quelle zone de Gabès habitez-vous ?`,
    zoneConfirm: (z, p) =>
      `Parfait, je surveille la qualité de l'air à ${z}. AQI actuel : ${p.aqi}/5 · SO₂ ${p.so2} µg/m³ · PM2.5 ${p.pm25} µg/m³. Que puis-je faire pour vous ?`,
    suggestions: [
      "J'ai du mal à respirer ce matin",
      "L'air est dangereux aujourd'hui ?",
      "Mon enfant tousse depuis 3 jours"
    ],
    fallbackReply: "Désolé, je n'ai pas pu répondre."
  },
  tn: {
    subtitle: "مساعد صحي بالذكاء الاصطناعي · FR/تونسي",
    online: "أونلاين",
    selectZoneLabel: "اختار المنطقة متاعك باش نبداو",
    selectZonePlaceholder: "— اختار منطقة —",
    loadingZone: "قاعد نحمّل معطيات التلوث...",
    zoneLabel: "المنطقة",
    change: "بدّل",
    placeholder: "اسأل سؤالك بالتونسي ولا en français...",
    errorFetch: "ما نجمتش نجيب معطيات التلوث.",
    errorNoZone: "اختار المنطقة متاعك لوّل.",
    errorAI: "مشكل في الـIA : ",
    welcome: `أهلا ! أنا DrGabès، المساعد الصحي متاعك بالذكاء الاصطناعي.
نعرف جودة الهواء في منطقتك توّا.
اسألني شنوّة تحب بالتونسي ولا بالفرنسية.
في أنا منطقة من قابس ساكن ؟`,
    zoneConfirm: (z, p) =>
      `باهي، توّا نراقب جودة الهواء في ${z}. الـAQI توّا : ${p.aqi}/5 · SO₂ ${p.so2} µg/m³ · PM2.5 ${p.pm25} µg/m³. شنوّة نجّم نعمل ليك ؟`,
    suggestions: [
      "هالصباح ما نجّمش نتنفّس مليح",
      "الهوا خطير اليوم ؟",
      "ولدي يسعل من 3 أيام"
    ],
    fallbackReply: "سامحني، ما نجّمتش نجاوب."
  }
};

const chatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function ChatbotView() {
  const [lang, setLang] = useState("fr");
  const t = I18N[lang];
  const [zone, setZone] = useState("");
  const [pollution, setPollution] = useState(null);
  const [loadingZone, setLoadingZone] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: I18N.fr.welcome, timestamp: chatTime() }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = React.useRef(null);

  const switchLang = (next) => {
    if (next === lang) return;
    setLang(next);
    const hasOnlyWelcome = messages.length === 1 && messages[0].role === "assistant";
    if (hasOnlyWelcome) {
      setMessages([{ role: "assistant", content: I18N[next].welcome, timestamp: chatTime() }]);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleZoneChange = async (z) => {
    if (!z) return;
    setZone(z);
    setLoadingZone(true);
    setError(null);
    try {
      const p = await fetchPollution(z);
      setPollution(p);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: t.zoneConfirm(z, p),
        timestamp: chatTime()
      }]);
    } catch {
      setError(t.errorFetch);
    } finally {
      setLoadingZone(false);
    }
  };

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || typing) return;
    if (!zone || !pollution) {
      setError(t.errorNoZone);
      return;
    }

    const userMsg = { role: "user", content: text, timestamp: chatTime() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);
    setError(null);

    const systemPrompt = `Tu es DrGabès, médecin IA spécialisé en santé environnementale à Gabès, Tunisie.

Tu parles français, arabe littéraire ET tunisien darija.

RÈGLE DE LANGUE (ABSOLUE) :
- Si le citoyen écrit en français → réponds en français.
- Si le citoyen écrit en tunisien en caractères arabes (ex: "راسي يوجعني") → réponds en tunisien darija en CARACTÈRES ARABES uniquement.
- Si le citoyen écrit en tunisien en caractères latins / arabizi (ex: "rassi youja3", "grejmi touja3", "3omri 40 ans", "3andi asthme") → tu comprends parfaitement, mais tu RÉPONDS OBLIGATOIREMENT en tunisien darija écrit en CARACTÈRES ARABES (pas en latin, pas de mélange arabizi).
- Vocabulaire darija courant : "راسك", "وجعك", "توّا", "شنوّة", "باهي", "نجّم", "ما نجّمش", "لازمك", "جرّب", "خوذ", "اشرب", "ابقى", "برشة", "شويّة", "ما تخافش", "ياخي"...
- SEULE EXCEPTION : les noms de médicaments (Ventoline, Paracétamol, Doliprane) et termes médicaux techniques peuvent rester en français/latin à l'intérieur d'une phrase arabe.
- JAMAIS de phrases entières en arabizi latin type "Chreb barsha ma, ibqa fel dar". Toujours en caractères arabes : "اشرب برشة ماء وابقى في الدار".

COMPORTEMENT :
Quand quelqu'un déclare des symptômes, tu réagis comme un vrai médecin :
1. Tu prends le symptôme au sérieux
2. Tu poses une question de suivi ciblée
3. Tu proposes une action concrète immédiate

Tu NE DIS JAMAIS :
- "c'est peu probable dû à la pollution"
- "calme-toi"
- "ne t'inquiète pas"
- Des phrases vagues et rassurantes sans action

Tu DIS TOUJOURS :
- Ce que le patient doit faire maintenant concrètement
- Si profil vulnérable (asthmatique, enfant, âgé) : tu es plus prudent et plus directif
- Si symptômes multiples : tu les prends tous en compte
- Si asthmatique : tu mentionnes toujours l'inhalateur et les déclencheurs liés à la pollution

DONNÉES POLLUTION de ${zone} maintenant :
- SO₂ : ${pollution?.so2} µg/m³
- PM2.5 : ${pollution?.pm25} µg/m³
- PM10 : ${pollution?.pm10} µg/m³
- NO₂ : ${pollution?.no2} µg/m³
- AQI : ${pollution?.aqi}/5

Même si les valeurs sont basses, rappelle que les capteurs ne mesurent pas les rejets industriels locaux instantanés de Gabès.

EXEMPLES DE BONNES RÉPONSES :

Patient écrit "rassi youja3" (arabizi) → tu réponds TOUT en caractères arabes :
→ "وجع الراس نجّم يكون من الهواء ولا من نقص الماء. اشرب برشة ماء وابقى في الدار شويّة. خوذ Paracétamol 1g كان الوجع قوي. ما تحسّنتش في ساعتين ؟ امشي لطبيب."

Patient écrit "3andi asthme w grejmi touja3" (arabizi asthmatique) → TOUT en arabe :
→ "بما إنّك عندك ربو والصدر يوجعك، استعمل Ventoline توّا : 2 بخّات. ما تحسّنتش في 15 دقيقة ؟ عاود 2 بخّات أخرى. كان مازال الوجع موجود، اتّصل بـ 190 وقتها."

Patient écrit en français → réponse en français avec Ventoline/Paracétamol et posologie.

Si symptômes multiples : prends en compte TOUS les symptômes déclarés, pas seulement le dernier.

Réponds en maximum 4 phrases.
Si urgence réelle : dis-le clairement et donne le 190.`;

    try {
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, ...history],
          temperature: 0.4,
          max_tokens: 400
        })
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || t.fallbackReply;
      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: chatTime() }]);
    } catch (err) {
      setError(t.errorAI + err.message);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 2 && zone && !typing;

  return (
    <div className="max-w-[700px] mx-auto flex flex-col" style={{ height: "calc(100vh - 128px)" }}>
      <div className="bg-white rounded-t-2xl border border-gray-200 border-b-0 px-5 py-3 flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: COLORS.green }}>
            ✚
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white"></span>
        </div>
        <div className="flex-1">
          <div className="font-bold text-base" style={{ color: COLORS.text }}>DrGabès</div>
          <div className="text-xs text-gray-500">{t.subtitle}</div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-full p-0.5 mr-1">
          <button
            onClick={() => switchLang("fr")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${lang === "fr" ? "text-white shadow" : "text-gray-600"}`}
            style={lang === "fr" ? { backgroundColor: COLORS.green } : {}}
          >
            FR
          </button>
          <button
            onClick={() => switchLang("tn")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${lang === "tn" ? "text-white shadow" : "text-gray-600"}`}
            style={lang === "tn" ? { backgroundColor: COLORS.green } : {}}
          >
            تونسي
          </button>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800 border border-green-300">
          {t.online}
        </span>
      </div>

      {!zone && (
        <div className="bg-white border-x border-gray-200 px-5 py-4 border-b" dir={lang === "tn" ? "rtl" : "ltr"}>
          <label className="block text-xs font-semibold text-gray-600 mb-2">{t.selectZoneLabel}</label>
          <select
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value)}
            disabled={loadingZone}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-700 text-sm"
          >
            <option value="">{t.selectZonePlaceholder}</option>
            {Object.keys(ZONES).map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          {loadingZone && <div className="text-xs text-gray-500 mt-2">{t.loadingZone}</div>}
        </div>
      )}

      {zone && (
        <div className="bg-white border-x border-gray-200 px-5 py-2 border-b flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {t.zoneLabel} : <span className="font-semibold" style={{ color: COLORS.green }}>{zone}</span>
            {pollution && <span className="text-gray-400"> · AQI {pollution.aqi}/5</span>}
          </div>
          <button
            onClick={() => { setZone(""); setPollution(null); }}
            className="text-[11px] text-gray-500 hover:text-gray-800 underline"
          >
            {t.change}
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 border-x border-gray-200" style={{ backgroundColor: COLORS.bg }}>
        {messages.map((m, i) => {
          const isArabic = /[\u0600-\u06FF]/.test(m.content);
          return (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[78%]">
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm text-gray-800"}`}
                style={m.role === "user"
                  ? { backgroundColor: COLORS.green }
                  : { backgroundColor: "#E8F5EE" }}
              >
                {m.content}
              </div>
              <div className={`text-[10px] text-gray-400 mt-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                {m.timestamp}
              </div>
            </div>
          </div>
          );
        })}

        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ backgroundColor: "#E8F5EE" }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-2" dir={lang === "tn" ? "rtl" : "ltr"}>
            {t.suggestions.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-300 hover:border-green-700 hover:text-green-800 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-3 py-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          dir={lang === "tn" ? "rtl" : "ltr"}
          disabled={!zone || typing}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm bg-white focus:outline-none focus:border-2 focus:border-green-700 disabled:bg-gray-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!zone || typing || !input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold disabled:opacity-40 transition"
          style={{ backgroundColor: COLORS.green }}
          aria-label="Envoyer"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function DoctorView({ patients }) {
  const [filterZone, setFilterZone] = useState("Toutes");
  const [filterGrav, setFilterGrav] = useState("Toutes");
  const [sort, setSort] = useState("desc");
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => ({
    total: patients.length,
    critique: patients.filter(p => p.rapport.niveau_gravite === "critique").length,
    modere:   patients.filter(p => p.rapport.niveau_gravite === "modéré").length,
    faible:   patients.filter(p => p.rapport.niveau_gravite === "faible").length
  }), [patients]);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (filterZone !== "Toutes") list = list.filter(p => p.zone === filterZone);
    if (filterGrav !== "Toutes") list = list.filter(p => p.rapport.niveau_gravite === filterGrav);
    list.sort((a, b) => sort === "desc" ? b.id - a.id : a.id - b.id);
    return list;
  }, [patients, filterZone, filterGrav, sort]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={counts.total} color="#1C1C1E" />
        <StatCard label="Critiques" value={counts.critique} color="#8B3A2A" />
        <StatCard label="Modérés" value={counts.modere} color="#C8973A" />
        <StatCard label="Faibles" value={counts.faible} color="#1A6B47" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs text-gray-500 mr-2">Zone</label>
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option>Toutes</option>
            {Object.keys(ZONES).map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-2">Gravité</label>
          <select value={filterGrav} onChange={(e) => setFilterGrav(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option>Toutes</option>
            <option value="critique">critique</option>
            <option value="modéré">modéré</option>
            <option value="faible">faible</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-2">Tri</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="desc">Plus récents d'abord</option>
            <option value="asc">Plus anciens d'abord</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Prénom</th>
              <th className="p-3">Age</th>
              <th className="p-3">Zone</th>
              <th className="p-3">Symptômes</th>
              <th className="p-3">Cause IA</th>
              <th className="p-3">Lien pollution</th>
              <th className="p-3">Gravité</th>
              <th className="p-3">Action immédiate</th>
              <th className="p-3">Rapport</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="10" className="p-6 text-center text-gray-400">Aucun patient.</td></tr>
            )}
            {filtered.map((p, i) => {
              const isCritique = p.rapport.niveau_gravite === "critique";
              return (
                <tr key={p.id} className={`border-t border-gray-100 ${isCritique ? "bg-red-50/60" : ""}`}>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 font-semibold">{p.prenom}</td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3">{p.zone}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-[160px]">{p.symptomes.join(", ") || "—"}</td>
                  <td className="p-3 text-xs max-w-[180px]">{p.rapport.cause_probable}</td>
                  <td className="p-3"><Badge color={linkColor(p.rapport.lien_pollution)}>{p.rapport.lien_pollution}</Badge></td>
                  <td className="p-3"><Badge color={gravColor(p.rapport.niveau_gravite)}>{p.rapport.niveau_gravite}</Badge></td>
                  <td className="p-3 text-xs font-semibold" style={{ color: isCritique ? COLORS.danger : COLORS.text }}>{p.rapport.action_immediate}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelected(p)}
                      className="px-3 py-1 rounded text-white text-xs font-semibold"
                      style={{ backgroundColor: COLORS.green }}
                    >
                      Voir rapport
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <ReportPanel patient={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="text-xs uppercase text-gray-500 font-semibold">{label}</div>
    <div className="text-3xl font-bold mt-1" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
  </div>
);

export default function App() {
  const [view, setView] = useState("citoyen");
  const [patients, setPatients] = useState(INITIAL_PATIENTS);

  useEffect(() => {
    const id = "gh-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap";
      document.head.appendChild(link);
    }
    document.body.style.backgroundColor = COLORS.bg;
    document.body.style.color = COLORS.text;
    document.body.style.fontFamily = "'IBM Plex Sans', system-ui, sans-serif";
  }, []);

  const addPatient = (patient) => setPatients(prev => [patient, ...prev]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: COLORS.green }}>
              G
            </div>
            <span className="font-bold text-xl" style={{ color: COLORS.green, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              GabèsHeal
            </span>
          </div>
          <nav className="flex gap-2">
            <NavBtn active={view === "citoyen"} onClick={() => setView("citoyen")}>Espace Citoyen</NavBtn>
            <NavBtn active={view === "drgabes"} onClick={() => setView("drgabes")}>DrGabès</NavBtn>
            <NavBtn active={view === "medecin"} onClick={() => setView("medecin")}>Espace Médecin</NavBtn>
          </nav>
        </div>
      </header>

      <main className="py-8">
        {view === "citoyen" && <CitizenView onSubmit={addPatient} />}
        {view === "drgabes" && <ChatbotView />}
        {view === "medecin" && <DoctorView patients={patients} />}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 print:hidden">
        GabèsHeal · Plateforme médicale IA · Pollution data: OpenWeatherMap
      </footer>
    </div>
  );
}

const NavBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${active ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
    style={active ? { backgroundColor: COLORS.green } : {}}
  >
    {children}
  </button>
);
