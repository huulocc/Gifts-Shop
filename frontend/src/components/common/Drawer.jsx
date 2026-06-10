import { useEffect, useRef } from "react";
import { Button } from "./Button.jsx";

export function Drawer({ open, title, children, onClose }) {
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    window.setTimeout(() => drawerRef.current?.focus(), 0);
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        ref={drawerRef}
      >
        <div className="between" style={{ marginBottom: 24 }}>
          <h2 id="drawer-title">{title}</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}
