import { Link } from 'react-router-dom';
import { Bot, ChartNoAxesCombined, Clock, Globe2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 420" className="w-full max-w-lg" role="img" aria-label="Réseau industriel méditerranéen">
      <rect x="45" y="210" width="180" height="120" rx="8" fill="#ffffff" opacity="0.95" />
      <rect x="72" y="160" width="50" height="170" rx="6" fill="#14a085" />
      <rect x="132" y="185" width="38" height="145" rx="6" fill="#ff9f43" />
      <path d="M72 160 L97 122 L122 160 Z" fill="#ffffff" opacity="0.9" />
      <path d="M250 245 C315 150 390 150 448 230" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeDasharray="14 12" />
      <path d="M442 232 l-32 -4 l20 -25" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {[318, 388, 455].map((cx, index) => (
        <g key={cx}>
          <circle cx={cx} cy={index === 1 ? 104 : 280} r="42" fill="#ffffff" opacity="0.95" />
          <circle cx={cx} cy={index === 1 ? 104 : 280} r="18" fill={index === 0 ? '#0d7377' : index === 1 ? '#ff9f43' : '#10b981'} />
          <line x1="225" y1="250" x2={cx - 40} y2={index === 1 ? 118 : 270} stroke="#ffffff" strokeWidth="3" opacity="0.7" />
        </g>
      ))}
      <circle cx="104" cy="74" r="22" fill="#ffffff" opacity="0.8" />
      <path d="M96 75 h16 M104 67 v16" stroke="#0d7377" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  const features = [
    { icon: <Bot className="h-7 w-7" />, title: 'Matching IA intelligent', text: 'Qualité, distance, capacité et prix combinés dans un classement lisible.' },
    { icon: <Globe2 className="h-7 w-7" />, title: '22 acheteurs vérifiés dans 6 pays', text: 'Ciment, plâtre, engrais, construction et recyclage autour de la Méditerranée.' },
    { icon: <Clock className="h-7 w-7" />, title: 'Résultats en 5 secondes', text: 'Une short-list commerciale sans appels à froid ni tableurs dispersés.' },
    { icon: <ChartNoAxesCombined className="h-7 w-7" />, title: 'Suivi des négociations', text: 'Historique, statut, notes et valeur estimée pour chaque lot.' },
  ];

  return (
    <>
      <section className="bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
        <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-4 inline-flex rounded-md bg-white/15 px-3 py-1 text-sm font-semibold">Plateforme B2B pour producteurs</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Valorisez votre phosphogypse, protégez Gabès</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
              Plateforme IA qui connecte les producteurs de phosphogypse aux meilleurs acheteurs industriels méditerranéens.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup"><Button variant="secondary" size="lg">Créer mon compte producteur</Button></Link>
              <Link to="/login"><Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">Se connecter</Button></Link>
            </div>
          </div>
          <div className="flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-ink">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {['Créez votre compte producteur', 'Postez votre lot de phosphogypse', "L'IA trouve les 3 meilleurs acheteurs"].map((step, index) => (
            <Card key={step} className="p-6">
              <span className="text-3xl">{index + 1}️⃣</span>
              <h3 className="mt-4 text-lg font-bold text-ink">{step}</h3>
            </Card>
          ))}
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ink">Pourquoi PhosphoMatch ?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{feature.icon}</div>
                <h3 className="font-bold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-primary-dark px-4 py-8 text-center text-xl font-bold text-white">
        500K tonnes valorisées • 22 acheteurs • 6 pays
      </section>
    </>
  );
}
