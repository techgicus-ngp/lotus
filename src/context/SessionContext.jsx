import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ensureAdminExists, loadSession, signOut as svcSignOut } from '../services/authService';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Seeds the default admin/guest accounts, then restores a saved session.
        await ensureAdminExists();
        setUser(await loadSession());
      } catch (e) {
        console.error('Startup bootstrap error:', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signOut = useCallback(() => {
    svcSignOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, signOut, ready }), [user, signOut, ready]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
