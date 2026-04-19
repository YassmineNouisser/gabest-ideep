import { Link } from 'react-router-dom';
import { Handshake, Package, Target, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getBatchesBySeller } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Badge';

export function DashboardPage() {
  const { seller } = useAuth();
  const batches = seller ? getBatchesBySeller(seller.id) : [];
  const totalMatches = batches.reduce((sum, batch) => sum + batch.matches.length, 0);
  const totalValue = batches.reduce((sum, batch) => sum + (batch.matches[0]?.estimated_deal_value_usd ?? 0), 0);
  const negotiating = batches.filter((batch) => batch.status === 'negotiating').length;
  const kpis = [
    { label: 'Lots postés total', value: batches.length, icon: <Package className="h-5 w-5" /> },
    { label: 'Matchs générés', value: totalMatches, icon: <Target className="h-5 w-5" /> },
    { label: 'Valeur totale estimée', value: formatCurrency(totalValue), icon: <Wallet className="h-5 w-5" /> },
    { label: 'Deals en négociation', value: negotiating, icon: <Handshake className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Bienvenue, {seller?.contact_person}</h1>
        <p className="mt-1 text-muted">{seller?.company_name}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{kpi.icon}</div>
            <p className="mt-4 text-sm text-muted">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{kpi.value}</p>
          </Card>
        ))}
      </div>
      <section className="rounded-lg bg-gradient-to-r from-primary-dark to-primary p-6 text-white shadow-card">
        <h2 className="text-2xl font-bold">Nouveau lot à valoriser ?</h2>
        <p className="mt-2 text-white/85">Trouvez les meilleurs acheteurs en quelques secondes.</p>
        <Link to="/new-batch" className="mt-5 inline-block">
          <Button variant="secondary">+ Poster un nouveau lot</Button>
        </Link>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Derniers lots</h2>
          <Link to="/history" className="text-sm font-semibold text-primary hover:underline">Tout voir</Link>
        </div>
        {batches.length === 0 ? (
          <EmptyState
            title="Vous n'avez pas encore posté de lot"
            description="Publiez un premier lot de phosphogypse pour obtenir une short-list d'acheteurs qualifiés."
            action={<Link to="/new-batch"><Button>Poster un lot</Button></Link>}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    {['Date', 'Pureté', 'Quantité', 'Meilleur match', 'Score', 'Statut', 'Actions'].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.slice(0, 5).map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-4 py-3">{formatDate(batch.created_at)}</td>
                      <td className="px-4 py-3">{batch.batch.purity}%</td>
                      <td className="px-4 py-3">{batch.batch.quantity.toLocaleString('fr-FR')} t</td>
                      <td className="px-4 py-3 font-semibold">{batch.matches[0]?.company_name ?? 'Aucun'}</td>
                      <td className="px-4 py-3 text-primary">{batch.matches[0]?.compatibility_score ?? 0}%</td>
                      <td className="px-4 py-3"><StatusBadge status={batch.status} /></td>
                      <td className="px-4 py-3"><Link className="font-semibold text-primary hover:underline" to={`/batch/${batch.id}`}>Voir</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
