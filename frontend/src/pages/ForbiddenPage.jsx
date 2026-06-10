import { Button } from "../components/common/Button.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ForbiddenPage() {
  const { role, landingPath, logout } = useAuth();

  return (
    <section className="not-found">
      <div className="state-panel" style={{ maxWidth: 560 }}>
        <p className="eyebrow">Forbidden</p>
        <h1>That route is not available for this role.</h1>
        <p className="muted">
          GiftShop has only Customer and Manager actors. Customer accounts cannot open manager tools, and managers do not use cart or checkout flows.
        </p>
        <div className="cluster">
          <Button to={role ? landingPath : "/products"}>
            Go to your workspace
          </Button>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </section>
  );
}
