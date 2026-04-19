import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, User } from 'lucide-react';
import type { SignupData } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorBanner } from '../ui/ErrorBanner';

type SignupFormData = SignupData & { confirmPassword: string };

const initialData: SignupFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  company_name: '',
  contact_person: '',
  phone: '',
  location: 'Gabès, Tunisia',
  industry: 'phosphate producer',
};

export function SignupForm() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof SignupFormData, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!data.email || !data.password || !data.company_name || !data.contact_person || !data.phone) {
      setError('Veuillez compléter tous les champs obligatoires.');
      return;
    }
    if (data.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      signup(data);
      navigate('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de créer le compte.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" type="email" value={data.email} icon={<Mail className="h-4 w-4" />} onChange={(event) => update('email', event.target.value)} />
        <Input label="Téléphone" value={data.phone} icon={<Phone className="h-4 w-4" />} onChange={(event) => update('phone', event.target.value)} />
        <Input label="Mot de passe" type="password" value={data.password} onChange={(event) => update('password', event.target.value)} />
        <Input label="Confirmer le mot de passe" type="password" value={data.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
        <Input label="Entreprise" value={data.company_name} icon={<Building2 className="h-4 w-4" />} onChange={(event) => update('company_name', event.target.value)} />
        <Input label="Contact" value={data.contact_person} icon={<User className="h-4 w-4" />} onChange={(event) => update('contact_person', event.target.value)} />
        <Input label="Localisation" value={data.location} onChange={(event) => update('location', event.target.value)} />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Industrie</span>
          <select
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={data.industry}
            onChange={(event) => update('industry', event.target.value)}
          >
            <option value="phosphate producer">Producteur phosphate</option>
            <option value="chemical plant">Usine chimique</option>
            <option value="mining">Mine</option>
            <option value="other">Autre</option>
          </select>
        </label>
      </div>
      <Button className="w-full" size="lg" type="submit">Créer mon compte producteur</Button>
      <p className="text-center text-sm text-muted">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">Se connecter</Link>
      </p>
    </form>
  );
}
