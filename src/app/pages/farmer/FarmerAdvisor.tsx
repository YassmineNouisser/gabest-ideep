import { CropAdvisorPanel } from '../../components/CropAdvisorPanel';
import { PageHeader } from '../FarmerLayout';

export function FarmerAdvisor() {
  return (
    <div className="px-6 lg:px-12 py-10">
      <PageHeader
        overline="Module CropAdvisor · GPT-4o"
        title="Conseil de plantation et prévision de prix."
        description="L'IA croise vos parcelles avec la météo OpenWeather et les cours du marché pour recommander les cultures à semer et anticiper les prix de vente."
      />
      <CropAdvisorPanel />
    </div>
  );
}
