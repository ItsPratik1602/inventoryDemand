import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let nextToastId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = ({ type = "success", message }) => {
    const id = nextToastId++;

    setToasts((current) => [...current, { id, type, message }]);

    window.setTimeout(() => {
      dismissToast(id);
    }, 3500);
  };

  const value = useMemo(
    () => ({
      showToast,
      dismissToast
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-shell">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card ${toast.type === "error" ? "toast-card-error" : "toast-card-success"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {toast.type === "error" ? "Error" : "Success"}
                </p>
                <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-sm text-[color:var(--muted)]"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
