import { Button } from "../components/common/Button.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ForbiddenPage() {
  const { role, landingPath, logout } = useAuth();

  return (
    <section className="not-found">
      <div className="state-panel" style={{ maxWidth: 560 }}>
        <p className="eyebrow">Access denied</p>
        <h1>This page is not available for your account.</h1>
        <p className="muted">
          Return to the right area for your account, or log out and switch accounts.
        </p>
        <div className="cluster">
          <Button to={role ? landingPath : "/products"}>
            Go to your home
          </Button>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </section>
  );
}
