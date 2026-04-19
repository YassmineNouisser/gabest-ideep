import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { SellerNavbar } from './components/layout/SellerNavbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewBatchPage } from './pages/NewBatchPage';
import { HistoryPage } from './pages/HistoryPage';
import { BatchDetailPage } from './pages/BatchDetailPage';
import { ProfilePage } from './pages/ProfilePage';

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <PublicNavbar />
      {children}
      <Footer />
    </div>
  );
}

function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface">
        <SellerNavbar />
        <main className="page-shell">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-fade-in-up">
      <Routes>
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><SignupPage /></PublicLayout>} />
        <Route path="/dashboard" element={<SellerLayout><DashboardPage /></SellerLayout>} />
        <Route path="/new-batch" element={<SellerLayout><NewBatchPage /></SellerLayout>} />
        <Route path="/history" element={<SellerLayout><HistoryPage /></SellerLayout>} />
        <Route path="/batch/:id" element={<SellerLayout><BatchDetailPage /></SellerLayout>} />
        <Route path="/profile" element={<SellerLayout><ProfilePage /></SellerLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
