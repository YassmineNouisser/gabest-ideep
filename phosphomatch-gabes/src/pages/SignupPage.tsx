import { SignupForm } from '../components/auth/SignupForm';
import { Card } from '../components/ui/Card';

export function SignupPage() {
  return (
    <main className="grid min-h-[calc(100vh-8rem)] bg-white lg:grid-cols-2">
      <section className="hidden items-center justify-center bg-gradient-to-br from-primary-dark to-success p-10 text-white lg:flex">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold">Transformez un passif environnemental en opportunité industrielle.</h1>
          <p className="mt-4 text-white/90">Votre compte producteur centralise lots, résultats IA et historique commercial.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-ink">Créer un compte vendeur</h1>
          <p className="mt-2 text-muted">Réservé aux producteurs de phosphogypse et sites industriels.</p>
          <Card className="mt-6 p-6">
            <SignupForm />
          </Card>
        </div>
      </section>
    </main>
  );
}
