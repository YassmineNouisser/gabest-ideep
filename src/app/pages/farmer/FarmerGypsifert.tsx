import { motion } from 'motion/react';
import { Factory, MapPin, Phone, Truck } from 'lucide-react';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const GOLD = '#E0A23A';
const CREAM = '#F7F5F0';

type FactoryOffer = {
  id: string;
  company: string;
  product: string;
  location: string;
  distanceKm: number;
  purityPct: number;
  pricePerTonneDt: number;
  recommendedDoseTHa: string;
  minOrderTonnes: number;
  deliveryDays: number;
  availability: 'En stock' | 'Sur commande' | 'Stock limité';
  phone: string;
};

// Entités tunisiennes RÉELLES vérifiables (sites officiels + registre public).
// Les prix, puretés et délais restent indicatifs — à brancher sur un flux B2B réel.
// Téléphones : standard siège GCT (publique) pour toutes les unités GCT.
const FACTORY_OFFERS: FactoryOffer[] = [
  {
    id: 'gct-ghannouch',
    company: 'GCT — Usine de Ghannouch',
    product: 'Phosphogypse agricole (sous-produit acide phosphorique)',
    location: 'BP 72 · Route de la plage · Ghannouch · 6014 Gabès',
    distanceKm: 9,
    purityPct: 92,
    pricePerTonneDt: 38,
    recommendedDoseTHa: '4–6 t/ha',
    minOrderTonnes: 5,
    deliveryDays: 3,
    availability: 'En stock',
    phone: '+216 71 141 500'
  },
  {
    id: 'gct-skhira',
    company: 'GCT — Pôle de La Skhira',
    product: 'Gypse dihydrate (ligne DAP/MAP)',
    location: 'Zone industrielle de La Skhira · 3080 Sfax',
    distanceKm: 80,
    purityPct: 90,
    pricePerTonneDt: 34,
    recommendedDoseTHa: '4–6 t/ha',
    minOrderTonnes: 10,
    deliveryDays: 5,
    availability: 'Sur commande',
    phone: '+216 71 141 500'
  },
  {
    id: 'tifert-skhira',
    company: 'TIFERT — Tunisian Indian Fertilizers',
    product: 'Gypse agricole purifié (Cd < 2 mg/kg)',
    location: 'Zone industrielle de La Skhira · BP 229 · 3080 Sfax',
    distanceKm: 78,
    purityPct: 95,
    pricePerTonneDt: 52,
    recommendedDoseTHa: '3–5 t/ha',
    minOrderTonnes: 10,
    deliveryDays: 5,
    availability: 'Stock limité',
    phone: '+216 74 274 000'
  },
  {
    id: 'gct-mdhilla',
    company: 'GCT — Unité de M\'Dhilla',
    product: 'Amendement Ca/S poudre (sous-produit TSP)',
    location: 'Usine de M\'Dhilla · 2109 Gafsa',
    distanceKm: 134,
    purityPct: 88,
    pricePerTonneDt: 31,
    recommendedDoseTHa: '5–7 t/ha',
    minOrderTonnes: 8,
    deliveryDays: 6,
    availability: 'En stock',
    phone: '+216 71 141 500'
  }
];

export function FarmerGypsifert() {
  return (
    <div className="px-6 lg:px-12 py-10">
      <FactoryOffersSection />
    </div>
  );
}

function FactoryOffersSection() {
  const sorted = [...FACTORY_OFFERS].sort((a, b) => a.distanceKm - b.distanceKm);
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: GREEN,
              letterSpacing: 2.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 8
            }}
          >
            Offres des usines · {FACTORY_OFFERS.length} fournisseurs
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              fontWeight: 800,
              color: CHARCOAL,
              letterSpacing: '-0.025em',
              maxWidth: 720,
              lineHeight: 1.1
            }}
          >
            Phosphogypse traité disponible autour de Gabès
          </h2>
          <p
            className="mt-3 max-w-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              color: MUTED,
              lineHeight: 1.55
            }}
          >
            Comparez pureté, prix DT/tonne, distance et délai de livraison. Triées par proximité de Chenini Nahal.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((offer, i) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-3xl flex flex-col"
            style={{
              backgroundColor: 'white',
              border: '1px solid rgba(15,26,19,0.06)',
              boxShadow: '0 8px 28px rgba(15,26,19,0.04)'
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(43,162,76,0.12)' }}
              >
                <Factory size={18} style={{ color: GREEN }} />
              </div>
              <AvailabilityBadge availability={offer.availability} />
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: CHARCOAL,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {offer.company}
            </div>
            <div
              className="mt-1.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.4
              }}
            >
              {offer.product}
            </div>

            <div
              className="flex items-center gap-1.5 mt-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: CHARCOAL,
                fontWeight: 500
              }}
            >
              <MapPin size={13} style={{ color: MUTED }} />
              {offer.location} · {offer.distanceKm} km
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <OfferStat label="Pureté" value={`${offer.purityPct}%`} />
              <OfferStat label="Prix" value={`${offer.pricePerTonneDt} DT/t`} highlight />
              <OfferStat label="Dosage" value={offer.recommendedDoseTHa} />
              <OfferStat label="Min commande" value={`${offer.minOrderTonnes} t`} />
            </div>

            <div
              className="mt-4 p-3 rounded-xl flex items-center gap-2"
              style={{
                backgroundColor: CREAM,
                border: '1px solid rgba(15,26,19,0.05)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: CHARCOAL
              }}
            >
              <Truck size={13} style={{ color: GOLD }} />
              Livraison sous {offer.deliveryDays} j
            </div>

            <div className="flex items-center gap-2 mt-4">
              <a
                href={`tel:${offer.phone.replace(/\s/g, '')}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full"
                style={{
                  backgroundColor: GREEN,
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.3
                }}
              >
                <Phone size={13} />
                Demander un devis
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function AvailabilityBadge({ availability }: { availability: FactoryOffer['availability'] }) {
  const tone =
    availability === 'En stock'
      ? { bg: 'rgba(43,162,76,0.14)', color: GREEN }
      : availability === 'Stock limité'
        ? { bg: 'rgba(224,162,58,0.18)', color: GOLD }
        : { bg: 'rgba(15,26,19,0.06)', color: CHARCOAL };
  return (
    <span
      className="px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: tone.bg,
        color: tone.color,
        fontFamily: 'var(--font-display)',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase'
      }}
    >
      {availability}
    </span>
  );
}

function OfferStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="px-3 py-2.5 rounded-xl"
      style={{
        backgroundColor: highlight ? 'rgba(43,162,76,0.08)' : CREAM,
        border: `1px solid ${highlight ? 'rgba(43,162,76,0.2)' : 'rgba(15,26,19,0.05)'}`
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9.5,
          color: MUTED,
          letterSpacing: 1.4,
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 3
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 800,
          color: highlight ? GREEN : CHARCOAL,
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </div>
    </div>
  );
}

