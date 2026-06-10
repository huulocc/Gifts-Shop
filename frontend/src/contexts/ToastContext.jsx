import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function makeToastId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message = "", type = "success", duration = 4200 }) => {
      const toast = { id: makeToastId(), title, message, type };
      setToasts((current) => [...current, toast]);
      if (duration > 0) {
        window.setTimeout(() => removeToast(toast.id), duration);
      }
      return toast.id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({ addToast, removeToast }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.type}`} key={toast.id} role="status">
            <div>
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label={`Dismiss ${toast.title}`}
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
