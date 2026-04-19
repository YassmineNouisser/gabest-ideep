import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Seller } from '../types';
import { useAuth } from '../hooks/useAuth';
import { deleteCurrentSellerAccount } from '../services/auth';
import { deleteBatchesBySeller } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function ProfilePage() {
  const { seller, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Seller | null>(seller);
  const [saved, setSaved] = useState(false);

  if (!form || !seller) return null;

  const update = (field: keyof Seller, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Supprimer votre compte vendeur et ses lots locaux ?')) return;
    deleteBatchesBySeller(seller.id);
    deleteCurrentSellerAccount();
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">👤 Profil entreprise</h1>
        <p className="mt-2 text-muted">Mettez à jour les informations utilisées dans les lots et contacts.</p>
      </div>
      <Card className="p-5">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Entreprise" value={form.company_name} onChange={(event) => update('company_name', event.target.value)} />
            <Input label="Contact" value={form.contact_person} onChange={(event) => update('contact_person', event.target.value)} />
            <Input label="Téléphone" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            <Input label="Localisation" value={form.location} onChange={(event) => update('location', event.target.value)} />
            <Input label="Industrie" value={form.industry} onChange={(event) => update('industry', event.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Sauvegarder</Button>
            {saved ? <span className="text-sm font-semibold text-success">Profil sauvegardé.</span> : null}
          </div>
        </form>
      </Card>
      <Card className="p-5">
        <h2 className="text-xl font-bold text-ink">Changer le mot de passe</h2>
        <p className="mt-2 text-sm text-muted">Prototype local: la mise à jour sécurisée sera disponible avec le backend.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Nouveau mot de passe" type="password" disabled placeholder="Bientôt disponible" />
          <Input label="Confirmer" type="password" disabled placeholder="Bientôt disponible" />
        </div>
      </Card>
      <Card className="border-danger/30 p-5">
        <h2 className="text-xl font-bold text-danger">Zone danger</h2>
        <p className="mt-2 text-sm text-muted">Cette action supprime le compte vendeur et les lots sauvegardés sur ce navigateur.</p>
        <Button className="mt-4" variant="danger" onClick={handleDeleteAccount}>Supprimer mon compte</Button>
      </Card>
    </div>
  );
}
