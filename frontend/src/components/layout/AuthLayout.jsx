import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="auth-shell" id="main-content">
      <section className="auth-brand-panel" aria-label="GiftShop welcome">
        <Link className="brand" to="/">
          <span className="brand-mark">GS</span>
          <span>GiftShop</span>
        </Link>
        <div className="stack">
          <p className="eyebrow">Thoughtful gifts</p>
          <h1>Shop calm, useful gifts.</h1>
          <p className="lead">
            Browse a compact catalog, keep cart choices clear, and check out with confidence.
          </p>
        </div>
      </section>
      <section className="auth-form-panel" aria-label="Authentication form">
        <Outlet />
      </section>
    </main>
  );
}
