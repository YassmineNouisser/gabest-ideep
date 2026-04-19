import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="text-2xl">♻️</span>
          <span>PhosphoMatch Gabès</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Connexion</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Inscription</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
