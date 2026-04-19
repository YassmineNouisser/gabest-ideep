import { createBrowserRouter, Outlet } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { ProfileForm } from './pages/ProfileForm';
import { FarmerLayout } from './pages/FarmerLayout';
import { FarmerOverview } from './pages/farmer/FarmerOverview';
import { FarmerDiagnostic } from './pages/farmer/FarmerDiagnostic';
import { FarmerAdvisor } from './pages/farmer/FarmerAdvisor';
import { FarmerBiomatch } from './pages/farmer/FarmerBiomatch';
import { FarmerGypsifert } from './pages/farmer/FarmerGypsifert';
import { FarmerWatershield } from './pages/farmer/FarmerWatershield';
import { IndustryDashboard } from './pages/IndustryDashboard';
import { RecyclingDashboard } from './pages/RecyclingDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ScrollToTop } from './components/ScrollToTop';

function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/onboarding/:profile', element: <ProfileForm /> },
      { path: '/login', element: <Login /> },
      {
        path: '/dashboard/farmer',
        element: <FarmerLayout />,
        children: [
          { index: true, element: <FarmerOverview /> },
          { path: 'diagnostic', element: <FarmerDiagnostic /> },
          { path: 'conseil', element: <FarmerAdvisor /> },
          { path: 'biomatch', element: <FarmerBiomatch /> },
          { path: 'gypsifert', element: <FarmerGypsifert /> },
          { path: 'watershield', element: <FarmerWatershield /> }
        ]
      },
      { path: '/dashboard/industry', element: <IndustryDashboard /> },
      { path: '/dashboard/recycling', element: <RecyclingDashboard /> },
      { path: '/dashboard/admin', element: <AdminDashboard /> }
    ]
  }
]);
