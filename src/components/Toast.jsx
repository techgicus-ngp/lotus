import { createContext, useCallback, useContext, useState } from 'react';
import { IconInfo } from '../icons';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, { error = false } = {}) => {
    const id = Date.now();
    setToast({ id, message, error });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast ${toast.error ? 'toast-error' : 'toast-ok'}`} role="status">
          <IconInfo size={18} />
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
