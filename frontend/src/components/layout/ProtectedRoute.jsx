import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

function RouteSkeleton() {
  return (
    <main className="container section" id="main-content" aria-busy="true">
      <div className="skeleton" style={{ minHeight: 240 }} />
    </main>
  );
}

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteSkeleton />;

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === "manager") return <Navigate to="/manager" replace />;
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return children;
}
