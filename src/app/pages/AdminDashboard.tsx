import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Database,
  Factory,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  RefreshCcw,
  Recycle,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Trash2,
  UserCog,
  Users,
  X,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  createUser,
  deleteUser,
  fetchUsers,
  isSupabaseConfigured,
  subscribeUsers,
  updateUser,
  type PlatformUser,
  type RoleId,
  type UserStatus
} from '../lib/admin';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';
const SIDEBAR_BG = '#0C1510';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.72)';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';
const SIDEBAR_HOVER = 'rgba(255,255,255,0.06)';
const CREAM = '#F7F5F0';
const MUTED = '#98A29A';
const BORDER = 'rgba(15,26,19,0.08)';
const GOLD = '#E0A23A';
const RED = '#D24C4C';

const ROLE_META: Record<RoleId, { label: string; icon: LucideIcon; color: string; dashboard: string }> = {
  farmer: { label: 'Agriculteur', icon: Sprout, color: GREEN, dashboard: '/dashboard/farmer' },
  industry: { label: 'Industriel', icon: Factory, color: '#3A6EE0', dashboard: '/dashboard/industry' },
  recycling: { label: 'Recycleur', icon: Recycle, color: GOLD, dashboard: '/dashboard/recycling' },
  admin: { label: 'Admin', icon: Shield, color: CHARCOAL, dashboard: '/dashboard/admin' }
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | RoleId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeUsers(() => load());
    return () => unsub();
  }, []);

  const metrics = useMemo(() => {
    const total = users.length;
    const byRole = (r: RoleId) => users.filter(u => u.role === r).length;
    const pending = users.filter(u => u.status === 'pending').length;
    return {
      total,
      farmers: byRole('farmer'),
      industry: byRole('industry'),
      recycling: byRole('recycling'),
      pending
    };
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filter !== 'all' && u.role !== filter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.zone.toLowerCase().includes(q) &&
          !u.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [users, filter, statusFilter, query]);

  const changeRole = async (id: string, role: RoleId) => {
    setOpenMenu(null);
    setBusyId(id);
    setUsers(us => us.map(u => (u.id === id ? { ...u, role } : u)));
    try {
      await updateUser(id, { role });
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la mise à jour du rôle.');
      load();
    } finally {
      setBusyId(null);
    }
  };
  const changeStatus = async (id: string, status: UserStatus) => {
    setOpenMenu(null);
    setBusyId(id);
    setUsers(us => us.map(u => (u.id === id ? { ...u, status } : u)));
    try {
      await updateUser(id, { status });
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la mise à jour du statut.');
      load();
    } finally {
      setBusyId(null);
    }
  };
  const removeUser = async (id: string) => {
    setOpenMenu(null);
    setBusyId(id);
    setUsers(us => us.filter(u => u.id !== id));
    try {
      await deleteUser(id);
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la suppression.');
      load();
    } finally {
      setBusyId(null);
    }
  };
  const addUser = async (payload: {
    name: string;
    email: string;
    role: RoleId;
    status: UserStatus;
    zone: string;
  }) => {
    try {
      const created = await createUser(payload);
      setUsers(us => [created, ...us]);
      setCreateOpen(false);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de créer le compte.');
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: CREAM, fontFamily: 'var(--font-display)', color: CHARCOAL }}
    >
      {/* ═══════════════════════ SIDEBAR ═══════════════════════ */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[264px] z-40"
        style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div
          className="px-6 py-6 flex items-center gap-2.5"
          style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GREEN }}
          >
            <Shield size={16} color="white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Gabest
            </span>
            <span
              style={{
                color: SIDEBAR_TEXT,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginTop: 3
              }}
            >
              Administration
            </span>
          </div>
        </div>

        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(43,162,76,0.18)' }}
          >
            <span style={{ color: GREEN, fontWeight: 700, fontSize: 13 }}>SA</span>
          </div>
          <div className="flex flex-col">
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Super Admin</span>
            <span
              className="flex items-center gap-1"
              style={{ color: SIDEBAR_TEXT, fontSize: 11 }}
            >
              <Database size={10} />
              Supabase · temps réel
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div
            className="px-3 mb-2"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Pilotage
          </div>
          <SideLink icon={LayoutDashboard} label="Vue d'ensemble" hint="Stats · alertes" active />
          <SideLink icon={Users} label="Utilisateurs" hint="Rôles · statuts" />
          <SideLink icon={UserCog} label="Permissions" hint="Accès modules" />
          <SideLink icon={BarChart3} label="Analytics" hint="Symbiose · KPI" />
          <SideLink icon={Gauge} label="Santé plateforme" hint="API · latence" />

          <div
            className="px-3 mb-2 mt-5"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Tableaux par rôle
          </div>
          <SideLink icon={Sprout} label="Agriculteur" hint="Vue dashboard" onClick={() => navigate('/dashboard/farmer')} />
          <SideLink icon={Factory} label="Industriel" hint="Vue dashboard" onClick={() => navigate('/dashboard/industry')} />
          <SideLink icon={Recycle} label="Recycleur" hint="Vue dashboard" onClick={() => navigate('/dashboard/recycling')} />

          <div
            className="px-3 mb-2 mt-5"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Système
          </div>
          <SideLink icon={Settings} label="Paramètres" hint="Préférences" />
        </nav>

        <div className="px-4 py-4" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: SIDEBAR_TEXT }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = SIDEBAR_HOVER)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Déconnexion</span>
            <LogOut size={14} />
          </button>
          <div
            className="mt-3 px-2"
            style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 }}
          >
            © Gabest · Console admin
          </div>
        </div>
      </aside>

      {/* ═══════════════════════ MAIN ═══════════════════════ */}
      <main className="flex-1 min-w-0 lg:ml-[264px]">
        <div className="px-6 lg:px-10 py-10 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <div
                className="inline-flex items-center gap-2"
                style={{
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 12
                }}
              >
                <Database size={11} />
                Console admin · Supabase
              </div>
              <h1
                style={{
                  fontSize: 'clamp(30px, 3.4vw, 44px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em'
                }}
              >
                Piloter la symbiose{' '}
                <span style={{ color: MUTED }}>Industrie · Agriculture · Recyclage.</span>
              </h1>
              <p className="mt-3 max-w-2xl" style={{ fontSize: 15, color: MUTED, lineHeight: 1.55 }}>
                Gérez les comptes, assignez les rôles, validez les inscriptions — chaque action
                est persistée sur la table <code style={{ color: CHARCOAL, fontWeight: 700 }}>platform_users</code>{' '}
                et synchronisée en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                title="Rafraîchir"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${BORDER}`,
                  color: CHARCOAL
                }}
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: GREEN, color: 'white', fontSize: 14, fontWeight: 600 }}
              >
                <span className="pr-2">Nouvel utilisateur</span>
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'white' }}
                >
                  <Plus size={15} style={{ color: CHARCOAL }} />
                </span>
              </button>
            </div>
          </div>

          {/* Error / config banner */}
          {!isSupabaseConfigured && (
            <div
              className="p-4 rounded-2xl mb-6 flex items-start gap-3"
              style={{
                backgroundColor: '#FDF3DC',
                border: `1px solid ${GOLD}40`
              }}
            >
              <AlertCircle size={16} style={{ color: '#9A6B10', marginTop: 2 }} />
              <div style={{ fontSize: 13, color: '#9A6B10', lineHeight: 1.55 }}>
                Supabase n'est pas configuré. Renseigne{' '}
                <code style={{ fontWeight: 700 }}>VITE_SUPABASE_URL</code> et{' '}
                <code style={{ fontWeight: 700 }}>VITE_SUPABASE_ANON_KEY</code> dans{' '}
                <code style={{ fontWeight: 700 }}>.env.local</code>, puis exécute le script{' '}
                <code style={{ fontWeight: 700 }}>supabase-admin-users.sql</code> dans le SQL Editor.
              </div>
            </div>
          )}

          {error && (
            <div
              className="p-4 rounded-2xl mb-6 flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(210,76,76,0.08)',
                border: `1px solid ${RED}40`
              }}
            >
              <AlertCircle size={16} style={{ color: RED, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: RED, lineHeight: 1.55, flex: 1 }}>{error}</div>
              <button
                onClick={() => setError(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ color: RED }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <Metric label="Utilisateurs" value={metrics.total} unit="comptes" icon={Users} tint={CHARCOAL} />
            <Metric label="Agriculteurs" value={metrics.farmers} unit="actifs" icon={Sprout} tint={GREEN} />
            <Metric label="Industriels" value={metrics.industry} unit="actifs" icon={Factory} tint="#3A6EE0" />
            <Metric label="Recycleurs" value={metrics.recycling} unit="actifs" icon={Recycle} tint={GOLD} />
            <Metric label="En attente" value={metrics.pending} unit="à valider" icon={ShieldAlert} tint={RED} />
          </div>

          {/* Filters */}
          <div
            className="p-4 rounded-3xl mb-6 flex flex-wrap items-center gap-3"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
            }}
          >
            <div
              className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2 rounded-xl"
              style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
            >
              <Search size={15} style={{ color: MUTED }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un nom, email, zone, ID…"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 13.5, color: CHARCOAL }}
              />
            </div>

            <RoleFilter value={filter} onChange={setFilter} />

            <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: CREAM }}>
              {(['all', 'active', 'pending', 'suspended'] as const).map(s => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-3.5 py-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: active ? CHARCOAL : 'transparent',
                      color: active ? 'white' : CHARCOAL,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : s === 'pending' ? 'En attente' : 'Suspendus'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Users table */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
            }}
          >
            <div
              className="hidden lg:grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5"
              style={{
                backgroundColor: CREAM,
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 2,
                color: MUTED,
                textTransform: 'uppercase'
              }}
            >
              <span>Utilisateur</span>
              <span>Rôle</span>
              <span>Statut</span>
              <span>Zone</span>
              <span>Volume</span>
              <span className="text-right pr-2">Actions</span>
            </div>

            <div>
              {loading && users.length === 0 && (
                <div
                  className="px-6 py-16 text-center flex flex-col items-center gap-3"
                  style={{ color: MUTED, fontSize: 14 }}
                >
                  <Loader2 size={20} className="animate-spin" />
                  Chargement depuis Supabase…
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="px-6 py-16 text-center" style={{ color: MUTED, fontSize: 14 }}>
                  {users.length === 0
                    ? "Aucun utilisateur — exécute supabase-admin-users.sql pour créer la table et seeder."
                    : 'Aucun utilisateur ne correspond à ces filtres.'}
                </div>
              )}
              {filtered.map((u, i) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isLast={i === filtered.length - 1}
                  busy={busyId === u.id}
                  menuOpen={openMenu === u.id}
                  onToggleMenu={() => setOpenMenu(m => (m === u.id ? null : u.id))}
                  onChangeRole={r => changeRole(u.id, r)}
                  onChangeStatus={s => changeStatus(u.id, s)}
                  onDelete={() => removeUser(u.id)}
                  onOpenDashboard={() => navigate(ROLE_META[u.role].dashboard)}
                />
              ))}
            </div>
          </div>

          {/* Footer legend */}
          <div
            className="mt-6 flex flex-wrap items-center gap-4"
            style={{ fontSize: 12, color: MUTED }}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} style={{ color: GREEN }} /> Actif — accès total aux modules
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldAlert size={13} style={{ color: GOLD }} /> En attente — inscription à valider
            </span>
            <span className="inline-flex items-center gap-1.5">
              <X size={13} style={{ color: RED }} /> Suspendu — accès bloqué
            </span>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {createOpen && (
          <CreateUserModal onClose={() => setCreateOpen(false)} onSubmit={addUser} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SideLink({
  icon: Icon,
  label,
  hint,
  active,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors text-left"
      style={{
        backgroundColor: active ? 'rgba(43,162,76,0.14)' : 'transparent',
        color: active ? 'white' : SIDEBAR_TEXT,
        borderLeft: `3px solid ${active ? GREEN : 'transparent'}`,
        paddingLeft: 13
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.backgroundColor = SIDEBAR_HOVER;
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Icon
        size={17}
        strokeWidth={2}
        style={{ color: active ? GREEN : SIDEBAR_TEXT, flexShrink: 0 }}
      />
      <div className="flex flex-col min-w-0">
        <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, lineHeight: 1.2 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)',
            marginTop: 2
          }}
        >
          {hint}
        </span>
      </div>
    </button>
  );
}

function Metric({
  label,
  value,
  unit,
  icon: Icon,
  tint
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <div
      className="p-5 rounded-3xl"
      style={{
        backgroundColor: 'white',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontSize: 11,
            color: MUTED,
            letterSpacing: 2,
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${tint}18`, border: `1px solid ${tint}40` }}
        >
          <Icon size={14} style={{ color: tint }} strokeWidth={2.2} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: CHARCOAL,
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{unit}</span>}
      </div>
    </div>
  );
}

function RoleFilter({
  value,
  onChange
}: {
  value: 'all' | RoleId;
  onChange: (v: 'all' | RoleId) => void;
}) {
  const opts: { id: 'all' | RoleId; label: string }[] = [
    { id: 'all', label: 'Tous rôles' },
    { id: 'farmer', label: 'Agriculteurs' },
    { id: 'industry', label: 'Industriels' },
    { id: 'recycling', label: 'Recycleurs' },
    { id: 'admin', label: 'Admins' }
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: CREAM }}>
      {opts.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="px-3.5 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: active ? GREEN : 'transparent',
              color: active ? 'white' : CHARCOAL,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function UserRow({
  user,
  isLast,
  busy,
  menuOpen,
  onToggleMenu,
  onChangeRole,
  onChangeStatus,
  onDelete,
  onOpenDashboard
}: {
  user: PlatformUser;
  isLast: boolean;
  busy: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onChangeRole: (r: RoleId) => void;
  onChangeStatus: (s: UserStatus) => void;
  onDelete: () => void;
  onOpenDashboard: () => void;
}) {
  const meta = ROLE_META[user.role];
  const RoleIcon = meta.icon;
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  const statusColor =
    user.status === 'active' ? GREEN : user.status === 'pending' ? GOLD : RED;
  const statusLabel =
    user.status === 'active' ? 'Actif' : user.status === 'pending' ? 'En attente' : 'Suspendu';

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center relative"
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${BORDER}`,
        opacity: busy ? 0.6 : 1
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${meta.color}18`,
            border: `1px solid ${meta.color}35`,
            color: meta.color,
            fontWeight: 700,
            fontSize: 13
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div
            className="truncate"
            style={{ fontSize: 14, fontWeight: 700, color: CHARCOAL, letterSpacing: '-0.01em' }}
          >
            {user.name}
          </div>
          <div className="truncate" style={{ fontSize: 11.5, color: MUTED, fontWeight: 500 }}>
            {user.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: `${meta.color}14`,
            border: `1px solid ${meta.color}30`
          }}
        >
          <RoleIcon size={12} style={{ color: meta.color }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>

      <div>
        <span
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: 12.5, fontWeight: 600, color: statusColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}80` }}
          />
          {statusLabel}
        </span>
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{ fontSize: 12.5, color: CHARCOAL, fontWeight: 500 }}
      >
        <MapPin size={12} style={{ color: MUTED }} />
        {user.zone}
      </div>

      <div style={{ fontSize: 12.5, color: CHARCOAL, fontWeight: 600 }}>{user.volume}</div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onOpenDashboard}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: CREAM,
            border: `1px solid ${BORDER}`,
            fontSize: 11.5,
            fontWeight: 600,
            color: CHARCOAL
          }}
        >
          Voir <ArrowUpRight size={12} />
        </button>
        <div className="relative">
          <button
            onClick={onToggleMenu}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: menuOpen ? CHARCOAL : 'white',
              color: menuOpen ? 'white' : CHARCOAL,
              border: `1px solid ${BORDER}`,
              fontSize: 11.5,
              fontWeight: 600
            }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <>Gérer <ChevronDown size={12} /></>}
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-[240px] p-2 rounded-2xl"
              style={{
                backgroundColor: 'white',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 20px 60px rgba(15,26,19,0.14)'
              }}
            >
              <div
                className="px-2 py-1.5"
                style={{
                  fontSize: 10,
                  color: MUTED,
                  letterSpacing: 2,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Changer de rôle
              </div>
              {(Object.keys(ROLE_META) as RoleId[]).map(r => {
                const m = ROLE_META[r];
                const Icon = m.icon;
                const current = user.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => onChangeRole(r)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: current ? `${m.color}12` : 'transparent',
                      color: CHARCOAL,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                    onMouseEnter={e => {
                      if (!current) e.currentTarget.style.backgroundColor = CREAM;
                    }}
                    onMouseLeave={e => {
                      if (!current) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} style={{ color: m.color }} />
                      {m.label}
                    </span>
                    {current && <Check size={14} style={{ color: m.color }} />}
                  </button>
                );
              })}

              <div className="mt-1 mx-1 h-px" style={{ backgroundColor: BORDER }} />
              <div
                className="px-2 py-1.5 mt-1"
                style={{
                  fontSize: 10,
                  color: MUTED,
                  letterSpacing: 2,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Statut
              </div>
              {(['active', 'pending', 'suspended'] as UserStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => onChangeStatus(s)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: user.status === s ? CREAM : 'transparent',
                    color: CHARCOAL,
                    fontSize: 13,
                    fontWeight: 600
                  }}
                  onMouseEnter={e => {
                    if (user.status !== s) e.currentTarget.style.backgroundColor = CREAM;
                  }}
                  onMouseLeave={e => {
                    if (user.status !== s) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>
                    {s === 'active' ? 'Activer' : s === 'pending' ? 'Mettre en attente' : 'Suspendre'}
                  </span>
                  {user.status === s && <Check size={14} style={{ color: GREEN }} />}
                </button>
              ))}

              <div className="mt-1 mx-1 h-px" style={{ backgroundColor: BORDER }} />
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-lg transition-colors"
                style={{ color: RED, fontSize: 13, fontWeight: 600 }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = 'rgba(210,76,76,0.08)')
                }
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={14} />
                Supprimer le compte
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (u: {
    name: string;
    email: string;
    role: RoleId;
    status: UserStatus;
    zone: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');
  const [role, setRole] = useState<RoleId>('farmer');
  const [status, setStatus] = useState<UserStatus>('pending');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        zone: zone.trim(),
        role,
        status
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(15,26,19,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-[520px] p-7 rounded-[28px]"
        style={{
          backgroundColor: 'white',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)'
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div
              style={{
                fontSize: 11,
                color: GREEN,
                letterSpacing: 2.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              Nouveau compte · insertion Supabase
            </div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: CHARCOAL,
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              Inviter un utilisateur
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: CREAM, color: CHARCOAL }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nom / raison sociale">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Coopérative, ferme, usine…"
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 14, color: CHARCOAL, padding: '12px 14px' }}
              required
            />
          </Field>
          <Field label="Email (unique)">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@exemple.tn"
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 14, color: CHARCOAL, padding: '12px 14px' }}
              required
            />
          </Field>
          <Field label="Zone">
            <input
              value={zone}
              onChange={e => setZone(e.target.value)}
              placeholder="Chenini, Ghannouch, Mareth…"
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 14, color: CHARCOAL, padding: '12px 14px' }}
            />
          </Field>

          <div>
            <Label>Rôle</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(ROLE_META) as RoleId[]).map(r => {
                const m = ROLE_META[r];
                const Icon = m.icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="p-3 rounded-xl flex flex-col items-start gap-1.5 transition-colors"
                    style={{
                      backgroundColor: active ? `${m.color}12` : CREAM,
                      border: `1px solid ${active ? m.color : BORDER}`
                    }}
                  >
                    <Icon size={14} style={{ color: m.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: CHARCOAL }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Statut initial</Label>
            <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: CREAM }}>
              {(['pending', 'active', 'suspended'] as UserStatus[]).map(s => {
                const active = status === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex-1 px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: active ? CHARCOAL : 'transparent',
                      color: active ? 'white' : CHARCOAL,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {s === 'active' ? 'Actif' : s === 'pending' ? 'En attente' : 'Suspendu'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: GREEN, color: 'white', fontSize: 14, fontWeight: 700 }}
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Création…' : 'Créer le compte'}
        </button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="rounded-xl" style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}>
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        color: MUTED,
        letterSpacing: 2,
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 8
      }}
    >
      {children}
    </div>
  );
}
