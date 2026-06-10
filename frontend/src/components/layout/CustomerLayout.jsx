import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../common/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";

function activeProps({ isActive }) {
  return isActive ? { "aria-current": "page" } : {};
}

export function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <header className="nav-shell">
        <nav className="container nav-inner" aria-label="Primary navigation">
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">GS</span>
            <span>GiftShop</span>
          </Link>
          <button
            className="btn btn-secondary btn-small mobile-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="customer-nav-links"
          >
            Menu
          </button>
          <div
            className={`nav-links ${menuOpen ? "is-open" : ""}`}
            id="customer-nav-links"
          >
            <NavLink className="nav-link" to="/products" onClick={() => setMenuOpen(false)} {...activeProps}>
              Products
            </NavLink>
            {role === "customer" ? (
              <>
                <NavLink className="nav-link" to="/cart" onClick={() => setMenuOpen(false)} {...activeProps}>
                  Cart <span className="cart-count">{itemCount}</span>
                </NavLink>
                <NavLink className="nav-link" to="/orders" onClick={() => setMenuOpen(false)} {...activeProps}>
                  Orders
                </NavLink>
                <NavLink className="nav-link" to="/account/password" onClick={() => setMenuOpen(false)} {...activeProps}>
                  Password
                </NavLink>
                <Button variant="secondary" size="small" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : null}
            {role === "manager" ? (
              <>
                <NavLink className="nav-link" to="/manager" onClick={() => setMenuOpen(false)} {...activeProps}>
                  Manager dashboard
                </NavLink>
                <Button variant="secondary" size="small" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : null}
            {!user ? (
              <>
                <NavLink className="nav-link" to="/login" onClick={() => setMenuOpen(false)} {...activeProps}>
                  Login
                </NavLink>
                <Button to="/register" size="small" onClick={() => setMenuOpen(false)}>
                  Register
                </Button>
              </>
            ) : null}
          </div>
        </nav>
      </header>
      <main className="page-main" id="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container between">
          <p>GiftShop keeps v1 focused on customers and managers.</p>
          <Link className="btn btn-tertiary" to="/products">
            Browse products
          </Link>
        </div>
      </footer>
    </>
  );
}
