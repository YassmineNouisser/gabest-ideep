import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Camera,
  Droplet,
  LayoutDashboard,
  LogOut,
  MapPin,
  Recycle,
  Sparkles,
  Sprout,
  TestTube,
  X
} from 'lucide-react';
import { AdminFab } from '../components/AdminFab';
import {
  fetchDailyForecast,
  fetchPollution,
  fetchWeather,
  type DailyForecast,
  type Pollution,
  type Weather
} from '../lib/ai';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const CHARCOAL = '#0F1A13';
const SIDEBAR_BG = '#0C1510';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.72)';
const SIDEBAR_TEXT_ACTIVE = 'white';
const SIDEBAR_HOVER = 'rgba(255,255,255,0.06)';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';
const CREAM = '#F7F5F0';
const MUTED = '#98A29A';

export interface FarmerLiveData {
  weather: Weather | null;
  pollution: Pollution | null;
  forecast: DailyForecast[];
  loading: boolean;
}

const NAV_ITEMS = [
  {
    to: '/dashboard/farmer',
    end: true,
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    hint: 'Météo · alertes'
  },
  {
    to: '/dashboard/farmer/diagnostic',
    label: 'Diagnostic photo',
    icon: Camera,
    hint: 'CropDiag · ResNet-50'
  },
  {
    to: '/dashboard/farmer/conseil',
    label: 'Conseil IA',
    icon: Sparkles,
    hint: 'Plantation · prix'
  },
  {
    to: '/dashboard/farmer/biomatch',
    label: 'BioMatch',
    icon: Recycle,
    hint: 'Valoriser déchets'
  },
  {
    to: '/dashboard/farmer/gypsifert',
    label: 'GypsiFert',
    icon: TestTube,
    hint: 'Amendement sol'
  },
  {
    to: '/dashboard/farmer/watershield',
    label: 'WaterShield',
    icon: Droplet,
    hint: 'Qualité eau irrigation'
  }
];

export function FarmerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [pollution, setPollution] = useState<Pollution | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [w, p, f] = await Promise.all([
        fetchWeather('Chenini'),
        fetchPollution('Chenini'),
        fetchDailyForecast('Chenini')
      ]);
      if (cancelled) return;
      setWeather(w);
      setPollution(p);
      setForecast(f);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const context: FarmerLiveData = { weather, pollution, forecast, loading };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: CREAM, fontFamily: 'var(--font-display)' }}
    >
      {/* ═══════════════════════ SIDEBAR (desktop) ═══════════════════════ */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[264px] z-40"
        style={{
          backgroundColor: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`
        }}
      >
        <SidebarContent onLogout={() => navigate('/login')} />
      </aside>

      {/* ═══════════════════════ MOBILE TOPBAR ═══════════════════════ */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14"
        style={{ backgroundColor: SIDEBAR_BG, borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <button
          className="flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GREEN }}
          >
            <Sprout size={15} color="white" />
          </div>
          <span
            style={{
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            Gabest · Agriculteur
          </span>
        </button>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? (
            <X size={16} color="white" />
          ) : (
            <LayoutDashboard size={15} color="white" />
          )}
        </button>
      </div>

      {/* ═══════════════════════ MOBILE DRAWER ═══════════════════════ */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed top-14 left-0 bottom-0 z-40 w-[264px] flex flex-col"
            style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
          >
            <SidebarContent onLogout={() => navigate('/login')} />
          </aside>
        </>
      )}

      {/* ═══════════════════════ MAIN ═══════════════════════ */}
      <main
        className="flex-1 min-w-0 lg:ml-[264px]"
        style={{ paddingTop: 56 }} /* topbar mobile */
      >
        <div className="lg:pt-0">
          <Outlet context={context} />
        </div>
      </main>

      <AdminFab />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SidebarContent({ onLogout }: { onLogout: () => void }) {
  return (
    <>
      {/* logo */}
      <div
        className="px-6 py-6 flex items-center gap-2.5"
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: GREEN }}
        >
          <Sprout size={16} color="white" strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span
            style={{
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}
          >
            Gabest
          </span>
          <span
            style={{
              color: SIDEBAR_TEXT,
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginTop: 3
            }}
          >
            Agriculteur
          </span>
        </div>
      </div>

      {/* identity strip */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(43,162,76,0.18)' }}
        >
          <span
            style={{
              color: GREEN,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13
            }}
          >
            HF
          </span>
        </div>
        <div className="flex flex-col">
          <span
            style={{
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Hassen Ferchichi
          </span>
          <span
            className="flex items-center gap-1"
            style={{
              color: SIDEBAR_TEXT,
              fontFamily: 'var(--font-display)',
              fontSize: 11
            }}
          >
            <MapPin size={10} />
            Chenini Nahal · 12,4 ha
          </span>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div
          className="px-3 mb-2"
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          Modules
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={(item as any).end}
              className="block"
            >
              {({ isActive }) => (
                <div
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(43,162,76,0.14)' : 'transparent',
                    color: isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                    borderLeft: `3px solid ${isActive ? GREEN : 'transparent'}`,
                    paddingLeft: 13
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = SIDEBAR_HOVER;
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={2}
                    style={{ color: isActive ? GREEN : SIDEBAR_TEXT, flexShrink: 0 }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13.5,
                        fontWeight: isActive ? 700 : 600,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10.5,
                        color: isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)',
                        marginTop: 2
                      }}
                    >
                      {item.hint}
                    </span>
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: SIDEBAR_TEXT }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = SIDEBAR_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            Déconnexion
          </span>
          <LogOut size={14} />
        </button>
        <div
          className="mt-3 px-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 0.3
          }}
        >
          © Gabest · OpenWeather live · GabesHeal F2
        </div>
      </div>
    </>
  );
}

// helper for pages
export function PageHeader({
  overline,
  title,
  description
}: {
  overline: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          color: GREEN,
          letterSpacing: 2.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 12
        }}
      >
        {overline}
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3.2vw, 42px)',
          fontWeight: 800,
          lineHeight: 1.05,
          color: CHARCOAL,
          letterSpacing: '-0.03em',
          maxWidth: 860
        }}
      >
        {title}
      </h1>
      {description && (
        <p
          className="mt-4 max-w-2xl"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            color: MUTED,
            lineHeight: 1.55
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// re-export helpers
export { GREEN, GREEN_DARK, CHARCOAL, CREAM, MUTED };
