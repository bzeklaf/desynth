import { useAuth } from '@/hooks/useAuth';
import { BuyerDashboard } from '@/components/dashboards/BuyerDashboard';
import { FacilityDashboard } from '@/components/dashboards/FacilityDashboard';
import { AuditorDashboard } from '@/components/dashboards/AuditorDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Navigate } from 'react-router-dom';


export const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect to auth if we're sure there's no user and we're not loading
  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  switch (profile.role) {
    case 'buyer':
      return <BuyerDashboard />;
    case 'facility':
      return <FacilityDashboard />;
    case 'auditor':
      return <AuditorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/auth" replace />;
  }
};