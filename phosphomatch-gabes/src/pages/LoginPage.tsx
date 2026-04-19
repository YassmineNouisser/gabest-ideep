import { LoginForm } from '../components/auth/LoginForm';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  return (
    <main className="grid min-h-[calc(100vh-8rem)] bg-white lg:grid-cols-2">
      <section className="hidden items-center justify-center bg-gradient-to-br from-primary to-success p-10 text-white lg:flex">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold">Retrouvez vos lots, vos matchs et vos négociations.</h1>
          <p className="mt-4 text-white/90">Une session vendeur unique pour piloter la valorisation du phosphogypse depuis Gabès.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-ink">Connexion producteur</h1>
          <p className="mt-2 text-muted">Accédez à votre tableau de bord vendeur.</p>
          <Card className="mt-6 p-6">
            <LoginForm />
          </Card>
          <Card className="mt-4 border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            Compte démo: <strong>demo@gct.tn</strong> / <strong>demo123</strong>
          </Card>
        </div>
      </section>
    </main>
  );
}
