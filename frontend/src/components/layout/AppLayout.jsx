import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Outlet />
    </div>
  );
}
