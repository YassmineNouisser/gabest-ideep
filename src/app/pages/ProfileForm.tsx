import { Sprout, Factory, Recycle, ArrowRight, ArrowLeft, MapPin, Upload } from 'lucide-react';
import { Logo } from '../components/Logo';
import { motion } from 'motion/react';
import { useNavigate, useParams, Navigate } from 'react-router';

const GREEN = '#1A6B47';
const GOLD = '#C8973A';
const BLUE = '#1B4F72';

type ProfileId = 'farmer' | 'industry' | 'recycling';

type FormConfig = {
  id: ProfileId;
  icon: typeof Sprout;
  title: string;
  arabic: string;
  intro: string;
  color: string;
  bg: string;
  dashboard: string;
  sections: {
    title: string;
    fields: Field[];
  }[];
};

type Field =
  | { kind: 'text'; name: string; label: string; placeholder?: string; suffix?: string }
  | { kind: 'number'; name: string; label: string; placeholder?: string; suffix?: string }
  | { kind: 'textarea'; name: string; label: string; placeholder?: string }
  | { kind: 'select'; name: string; label: string; options: string[] }
  | { kind: 'chips'; name: string; label: string; options: string[] }
  | { kind: 'gps'; name: string; label: string }
  | { kind: 'upload'; name: string; label: string; hint: string };

const CONFIGS: Record<ProfileId, FormConfig> = {
  farmer: {
    id: 'farmer',
    icon: Sprout,
    title: 'Profil agriculteur',
    arabic: 'فلاح',
    intro: 'Renseignez votre exploitation. L\'IA matchera votre biomasse avec les besoins industriels et vous alertera 48 h avant chaque pic de pollution.',
    color: GOLD,
    bg: '#FEF3DC',
    dashboard: '/dashboard/farmer',
    sections: [
      {
        title: '1. Localisation',
        fields: [
          { kind: 'text', name: 'exploitation', label: 'Nom de l\'exploitation', placeholder: 'Ex. Ferme Chenini' },
          {
            kind: 'select',
            name: 'gouvernorat',
            label: 'Gouvernorat',
            options: ['Gabès', 'Médenine', 'Tataouine', 'Sfax', 'Autre']
          },
          {
            kind: 'select',
            name: 'delegation',
            label: 'Délégation',
            options: ['Chenini Nahal', 'Ghannouch', 'Métouia', 'Mareth', 'El Hamma', 'Matmata', 'Autre']
          },
          { kind: 'gps', name: 'gps', label: 'Coordonnées GPS de la parcelle' },
          { kind: 'number', name: 'surface', label: 'Surface totale', placeholder: '0', suffix: 'ha' }
        ]
      },
      {
        title: '2. Cultures',
        fields: [
          {
            kind: 'chips',
            name: 'cultures',
            label: 'Types de cultures pratiquées',
            options: [
              'Oliviers',
              'Grenadiers',
              'Palmiers dattiers',
              'Tomates',
              'Piment',
              'Luzerne',
              'Henné',
              'Maraîchage',
              'Céréales'
            ]
          },
          {
            kind: 'select',
            name: 'irrigation',
            label: 'Système d\'irrigation',
            options: ['Goutte-à-goutte', 'Aspersion', 'Gravitaire / séguia', 'Pluvial', 'Mixte']
          }
        ]
      },
      {
        title: '3. Déchets agricoles disponibles',
        fields: [
          {
            kind: 'chips',
            name: 'dechets',
            label: 'Types de biomasse générée',
            options: [
              'Palmes',
              'Grignons d\'olive',
              'Tiges de tomates',
              'Cosses de grenade',
              'Luzerne excédentaire',
              'Fumier',
              'Taille d\'arbres'
            ]
          },
          { kind: 'number', name: 'volumeDechets', label: 'Volume estimé par an', placeholder: '0', suffix: 't/an' },
          {
            kind: 'select',
            name: 'traitement',
            label: 'Que faites-vous de vos déchets aujourd\'hui ?',
            options: ['Brûlage au champ', 'Compostage', 'Vente informelle', 'Décharge', 'Rien']
          }
        ]
      }
    ]
  },
  industry: {
    id: 'industry',
    icon: Factory,
    title: 'Profil industriel',
    arabic: 'صناعة',
    intro: 'Déclarez votre activité, vos déchets et vos émissions. L\'IA oriente chaque flux vers l\'agriculture ou une filière de recyclage adaptée.',
    color: BLUE,
    bg: '#E3EEF4',
    dashboard: '/dashboard/industry',
    sections: [
      {
        title: '1. Entreprise',
        fields: [
          { kind: 'text', name: 'raisonSociale', label: 'Raison sociale', placeholder: 'Ex. GCT · Groupe Chimique Tunisien' },
          {
            kind: 'select',
            name: 'secteur',
            label: 'Secteur d\'activité',
            options: [
              'Chimie / phosphate',
              'Cimenterie',
              'Textile',
              'Agroalimentaire',
              'Métallurgie',
              'Plasturgie',
              'Raffinage',
              'Autre'
            ]
          },
          { kind: 'text', name: 'zone', label: 'Zone industrielle', placeholder: 'Ex. Zone industrielle de Ghannouch' },
          { kind: 'gps', name: 'gps', label: 'Coordonnées GPS du site' }
        ]
      },
      {
        title: '2. Déchets produits',
        fields: [
          {
            kind: 'chips',
            name: 'dechets',
            label: 'Types de déchets générés',
            options: [
              'Phosphogypse',
              'Plastiques HDPE / PET',
              'Métaux ferreux',
              'Métaux non-ferreux',
              'Huiles usagées',
              'Boues de station',
              'Chutes de production',
              'Pneus',
              'Papier / carton'
            ]
          },
          { kind: 'number', name: 'volumeDechets', label: 'Volume total annuel', placeholder: '0', suffix: 't/an' },
          {
            kind: 'upload',
            name: 'ficheSecurite',
            label: 'Fiche de sécurité (FDS)',
            hint: 'PDF accepté — permet à l\'IA de classifier en code LoW européen'
          }
        ]
      },
      {
        title: '3. Émissions',
        fields: [
          {
            kind: 'chips',
            name: 'polluants',
            label: 'Polluants atmosphériques émis',
            options: ['SO₂', 'NH₃', 'PM 2.5', 'PM 10', 'NOₓ', 'CO', 'COV']
          },
          { kind: 'number', name: 'so2', label: 'Émissions SO₂ horaires moyennes', placeholder: '0', suffix: 'kg/h' },
          {
            kind: 'select',
            name: 'planning',
            label: 'Planning de production',
            options: ['24 h / 24 en continu', 'Postes 3×8', 'Journée 8 h', 'Saisonnier', 'Variable']
          },
          {
            kind: 'textarea',
            name: 'notes',
            label: 'Flexibilité de production (facultatif)',
            placeholder: 'Ex. Ligne B modulable · 20 % de réduction possible sur 4 h'
          }
        ]
      }
    ]
  },
  recycling: {
    id: 'recycling',
    icon: Recycle,
    title: 'Profil recycleur',
    arabic: 'تدوير',
    intro: 'Décrivez les flux que vous pouvez traiter. L\'IA vous propose des approvisionnements pré-caractérisés avec contrat-type et tarif transparent.',
    color: GREEN,
    bg: '#E8F5EE',
    dashboard: '/dashboard/recycling',
    sections: [
      {
        title: '1. Entreprise',
        fields: [
          { kind: 'text', name: 'raisonSociale', label: 'Raison sociale', placeholder: 'Ex. Ecocycle Tunisie' },
          { kind: 'text', name: 'adresse', label: 'Adresse du site principal', placeholder: 'Ex. Zone industrielle Sidi Abdelhamid, Sousse' },
          { kind: 'gps', name: 'gps', label: 'Coordonnées GPS' },
          {
            kind: 'select',
            name: 'agrement',
            label: 'Agrément ANGED',
            options: ['Agrément en cours', 'Agrément valide', 'Certifié ISO 14001', 'Co-processing cimentier', 'Aucun']
          }
        ]
      },
      {
        title: '2. Déchets acceptés',
        fields: [
          {
            kind: 'chips',
            name: 'accepte',
            label: 'Types de flux traités',
            options: [
              'Plastiques HDPE',
              'Plastiques PET',
              'Plastiques mixtes',
              'Métaux ferreux',
              'Métaux non-ferreux',
              'Papier / carton',
              'Huiles usagées',
              'Pneus',
              'Bois',
              'Boues industrielles',
              'DEEE'
            ]
          },
          {
            kind: 'select',
            name: 'procede',
            label: 'Procédé principal',
            options: [
              'Tri et conditionnement',
              'Broyage / densification',
              'Recyclage mécanique',
              'Co-processing cimentier',
              'Valorisation énergétique',
              'Pyrolyse'
            ]
          }
        ]
      },
      {
        title: '3. Capacités',
        fields: [
          { kind: 'number', name: 'capacite', label: 'Capacité mensuelle de traitement', placeholder: '0', suffix: 't/mois' },
          { kind: 'number', name: 'rayon', label: 'Rayon de collecte', placeholder: '0', suffix: 'km' },
          {
            kind: 'textarea',
            name: 'remarques',
            label: 'Contraintes ou spécifications (facultatif)',
            placeholder: 'Ex. Refus contamination > 3 % · collecte sur palette · minimum 5 t / lot'
          }
        ]
      }
    ]
  }
};

function FieldRow({ field, color, bg }: { field: Field; color: string; bg: string }) {
  const baseInput: React.CSSProperties = {
    fontFamily: 'var(--font-ibm-sans)',
    fontSize: 14,
    color: '#1C1C1E',
    border: '1px solid rgba(28,28,30,0.1)',
    borderRadius: 12,
    padding: '12px 14px',
    width: '100%',
    backgroundColor: 'white',
    outline: 'none'
  };

  const label = (
    <label
      style={{
        fontFamily: 'var(--font-ibm-sans)',
        fontSize: 13,
        color: '#1C1C1E',
        fontWeight: 600,
        marginBottom: 8,
        display: 'block'
      }}
    >
      {field.label}
    </label>
  );

  if (field.kind === 'text' || field.kind === 'number') {
    return (
      <div>
        {label}
        <div className="relative">
          <input
            type={field.kind === 'number' ? 'number' : 'text'}
            name={field.name}
            placeholder={field.placeholder}
            style={{ ...baseInput, paddingRight: field.suffix ? 60 : 14 }}
          />
          {field.suffix && (
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 12,
                color: '#8A8A8E',
                fontWeight: 600
              }}
            >
              {field.suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          name={field.name}
          rows={3}
          placeholder={field.placeholder}
          style={{ ...baseInput, resize: 'vertical', minHeight: 80 }}
        />
      </div>
    );
  }

  if (field.kind === 'select') {
    return (
      <div>
        {label}
        <select name={field.name} style={baseInput} defaultValue="">
          <option value="" disabled>
            Sélectionner…
          </option>
          {field.options.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === 'chips') {
    return (
      <div className="sm:col-span-2">
        {label}
        <div className="flex flex-wrap gap-2">
          {field.options.map(o => (
            <label
              key={o}
              className="cursor-pointer transition-all"
              style={{
                fontFamily: 'var(--font-ibm-sans)',
                fontSize: 13,
                fontWeight: 500
              }}
            >
              <input type="checkbox" name={field.name} value={o} className="peer sr-only" />
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full border transition-colors hover:bg-white peer-checked:text-white peer-checked:border-transparent"
                style={{
                  borderColor: 'rgba(28,28,30,0.12)',
                  backgroundColor: 'white',
                  color: '#1C1C1E'
                }}
                data-chip-color={color}
              >
                {o}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.kind === 'gps') {
    return (
      <div className="sm:col-span-2">
        {label}
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Latitude · ex. 33.8815" style={{ ...baseInput, flex: 1, minWidth: 160 }} />
          <input placeholder="Longitude · ex. 10.0982" style={{ ...baseInput, flex: 1, minWidth: 160 }} />
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 rounded-xl transition-colors"
            style={{
              backgroundColor: bg,
              color,
              fontFamily: 'var(--font-ibm-sans)',
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${color}22`
            }}
          >
            <MapPin size={15} />
            Me localiser
          </button>
        </div>
      </div>
    );
  }

  if (field.kind === 'upload') {
    return (
      <div className="sm:col-span-2">
        {label}
        <div
          className="rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors hover:bg-white"
          style={{
            border: `1.5px dashed ${color}44`,
            backgroundColor: bg + '55'
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bg }}
          >
            <Upload size={18} style={{ color }} />
          </div>
          <div className="flex-1">
            <div
              style={{
                fontFamily: 'var(--font-ibm-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: '#1C1C1E',
                marginBottom: 2
              }}
            >
              Déposer un fichier
            </div>
            <div
              style={{
                fontFamily: 'var(--font-ibm-sans)',
                fontSize: 12,
                color: '#8A8A8E'
              }}
            >
              {field.hint}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function ProfileForm() {
  const navigate = useNavigate();
  const { profile } = useParams<{ profile: string }>();

  if (!profile || !(profile in CONFIGS)) {
    return <Navigate to="/onboarding" replace />;
  }

  const config = CONFIGS[profile as ProfileId];
  const Icon = config.icon;

  return (
    <div
      className="min-h-screen px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: '#F7F5F0' }}
    >
      <button
        onClick={() => navigate('/onboarding')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full transition-colors hover:bg-white z-10"
        style={{
          fontFamily: 'var(--font-ibm-sans)',
          color: '#8A8A8E',
          fontSize: 14,
          fontWeight: 500
        }}
      >
        <ArrowLeft size={16} />
        Changer de profil
      </button>

      <style>{`
        [data-chip-color] { }
        input[type="checkbox"]:checked + span[data-chip-color="${config.color}"] {
          background-color: ${config.color};
          border-color: ${config.color};
          color: white;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: config.bg, border: `1px solid ${config.color}22` }}
          >
            <Icon size={14} style={{ color: config.color }} />
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 11,
                color: config.color,
                letterSpacing: 2,
                fontWeight: 700
              }}
            >
              ÉTAPE 2 · {config.title.toUpperCase()}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 700,
              color: '#1C1C1E',
              lineHeight: 1.15
            }}
          >
            Vos informations
          </h1>

          <p
            className="mt-4 max-w-xl mx-auto"
            style={{
              fontFamily: 'var(--font-ibm-sans)',
              fontSize: 15,
              color: '#5A5A5E',
              lineHeight: 1.6
            }}
          >
            {config.intro}
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            navigate(config.dashboard);
          }}
          className="space-y-6"
        >
          {config.sections.map((section, sIdx) => (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.08 + 0.1 }}
              className="p-7 rounded-3xl"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(28,28,30,0.06)',
                boxShadow: '0 10px 30px rgba(28,28,30,0.03)'
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1C1C1E',
                  marginBottom: 20
                }}
              >
                {section.title}
              </h2>

              <div className="grid sm:grid-cols-2 gap-5">
                {section.fields.map(field => (
                  <FieldRow key={field.name} field={field} color={config.color} bg={config.bg} />
                ))}
              </div>
            </motion.div>
          ))}

          <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
            <p
              style={{
                fontFamily: 'var(--font-ibm-sans)',
                fontSize: 13,
                color: '#8A8A8E'
              }}
            >
              Démo non-fonctionnelle. Les données ne sont pas encore enregistrées.
            </p>

            <button
              type="submit"
              className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: config.color,
                color: 'white',
                fontFamily: 'var(--font-ibm-sans)',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <span className="pr-2">Accéder au tableau de bord</span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <ArrowRight size={15} style={{ color: config.color }} />
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
