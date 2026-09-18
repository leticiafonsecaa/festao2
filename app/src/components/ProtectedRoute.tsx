import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-blush animate-pulse" />
      </main>
    );
  }

  if (!user) {
    // guarda para onde a pessoa queria ir, e volta pra la depois do login
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
