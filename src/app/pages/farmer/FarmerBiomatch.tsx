import { BioMatchFlow } from '../../components/BioMatchFlow';
import { PageHeader } from '../FarmerLayout';

export function FarmerBiomatch() {
  return (
    <div className="px-6 lg:px-12 py-10">
      <PageHeader
        overline="Module BioMatch · valorisation biomasse"
        title="Transformez vos déchets agricoles en revenu."
        description="Noyaux d'olive, marcs, pailles : le moteur BioMatch identifie les industriels qui rachètent votre biomasse et calcule le prix net par tonne."
      />
      <BioMatchFlow />
    </div>
  );
}
