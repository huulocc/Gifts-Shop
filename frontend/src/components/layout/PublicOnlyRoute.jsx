import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export function PublicOnlyRoute({ children }) {
  const { user, loading, landingPath } = useAuth();

  if (loading) {
    return (
      <div className="auth-card" aria-busy="true">
        <div className="skeleton skeleton-line" />
        <div className="skeleton" style={{ minHeight: 160 }} />
      </div>
    );
  }

  if (user) return <Navigate to={landingPath} replace />;

  return children;
}
