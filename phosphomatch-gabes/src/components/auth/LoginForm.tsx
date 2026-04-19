import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/ErrorBanner';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@gct.tn');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email et mot de passe sont obligatoires.');
      return;
    }
    const seller = login(email, password);
    if (!seller) {
      setError('Identifiants invalides.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? <ErrorBanner message={error} /> : null}
      <Input label="Email" type="email" value={email} icon={<Mail className="h-4 w-4" />} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Mot de passe" type="password" value={password} icon={<Lock className="h-4 w-4" />} onChange={(event) => setPassword(event.target.value)} />
      <div className="text-right">
        <a className="text-sm font-semibold text-primary hover:underline" href="#prototype">Mot de passe oublié ?</a>
      </div>
      <Button className="w-full" size="lg" type="submit">Se connecter</Button>
      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">S'inscrire</Link>
      </p>
    </form>
  );
}
