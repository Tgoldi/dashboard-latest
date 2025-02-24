/** @jsxImportSource react */
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { UserRole } from '../../types/user';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      owner: 4,
      admin: 3,
      editor: 2,
      user: 1
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      // Redirect to home page with insufficient permissions
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
} 