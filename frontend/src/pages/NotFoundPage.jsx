import { Button } from "../components/common/Button.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export function NotFoundPage() {
  const { role } = useAuth();

  return (
    <section className="not-found">
      <div className="state-panel" style={{ maxWidth: 560 }}>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="muted">
          This GiftShop route does not exist in the Customer and Manager v1 scope.
        </p>
        <div className="cluster">
          <Button to="/products">Browse products</Button>
          {role === "manager" ? (
            <Button variant="secondary" to="/manager">
              Manager dashboard
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
