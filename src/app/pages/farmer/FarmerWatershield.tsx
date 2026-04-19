import { WaterShieldFlow } from '../../components/WaterShieldFlow';
import { PageHeader } from '../FarmerLayout';

export function FarmerWatershield() {
  return (
    <div className="px-6 lg:px-12 py-10">
      <PageHeader
        overline="Module WaterShield · qualité eau d'irrigation"
        title="Vérifiez votre eau avant d'irriguer."
        description="Forage, oasis ou canal : 5 questions simples et l'IA WaterShield détecte salinité, métaux lourds, pH anormal et turbidité en moins de 10 secondes. Zéro analyse laboratoire nécessaire pour un premier filtre."
      />
      <WaterShieldFlow />
    </div>
  );
}
