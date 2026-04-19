import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/new-batch', label: 'Nouveau lot' },
  { to: '/history', label: 'Historique' },
];

export function SellerNavbar() {
  const { seller, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const initials = seller?.contact_person
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-ink">
          <span className="text-2xl">♻️</span>
          <span>PhosphoMatch</span>
          <span className="hidden rounded-md bg-primary/10 px-2 py-1 text-xs text-primary sm:inline">Gabès Edition</span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-surface',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="relative flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Ouvrir le menu utilisateur" onClick={() => setOpen((value) => !value)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              {initials}
            </span>
            <Menu className="h-4 w-4 md:hidden" />
          </Button>
          {open ? (
            <div className="absolute right-0 top-12 w-56 rounded-lg border border-border bg-white p-2 shadow-card">
              <Link className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface" to="/profile" onClick={() => setOpen(false)}>
                <User className="h-4 w-4" />
                Profil
              </Link>
              <div className="my-1 border-t border-border md:hidden" />
              {links.map((link) => (
                <Link key={link.to} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface md:hidden" to={link.to} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
