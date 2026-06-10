import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../common/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

function activeProps({ isActive }) {
  return isActive ? { "aria-current": "page" } : {};
}

export function ManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="manager-shell">
      <aside className="manager-sidebar" aria-label="Manager workspace">
        <div className="stack">
          <Link className="brand" to="/manager">
            <span className="brand-mark">GS</span>
            <span>GiftShop</span>
          </Link>
          <p className="muted">Manager workspace for catalog, stock, orders, and revenue.</p>
        </div>
        <nav className="manager-nav-links" aria-label="Manager navigation">
          <NavLink end className="nav-link" to="/manager" {...activeProps}>
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/manager/categories" {...activeProps}>
            Categories
          </NavLink>
          <NavLink className="nav-link" to="/manager/products" {...activeProps}>
            Products and stock
          </NavLink>
          <NavLink className="nav-link" to="/manager/orders" {...activeProps}>
            Orders
          </NavLink>
          <NavLink className="nav-link" to="/manager/revenue" {...activeProps}>
            Revenue
          </NavLink>
          <NavLink className="nav-link" to="/manager/account/password" {...activeProps}>
            Password
          </NavLink>
        </nav>
        <div className="stack">
          <p className="muted">
            Signed in as <strong>{user?.fullName || "Manager"}</strong>
          </p>
          <Button variant="secondary" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="manager-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
