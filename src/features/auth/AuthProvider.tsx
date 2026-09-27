import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiMode, apiRequest, ApiError, type ServerUser } from '../../services/backend';
import { useI18n } from '../../i18n';
import { LoadingState, ErrorState } from '../../components/common/ResourceState';
const Context = createContext<{
  user: ServerUser | null;
  acceptUser: (u: ServerUser) => void;
  logout: () => Promise<void>;
}>({ user: null, acceptUser: () => {}, logout: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [loading, setLoading] = useState(apiMode);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { setLocale, locale } = useI18n();
  useEffect(() => {
    if (!apiMode || !user || user.locale === locale) return;
    let active = true;
    apiRequest<ServerUser>('me', { method: 'PATCH', body: JSON.stringify({ locale }) })
      .then((updated) => {
        if (active) setUser(updated);
      })
      .catch(() => {
        if (active) setLocale(user.locale);
      });
    return () => {
      active = false;
    };
  }, [locale, user?.id]);
  useEffect(() => {
    if (!apiMode) return;
    let active = true;
    setLoading(true);
    setError(false);
    apiRequest<ServerUser>('me')
      .then((u) => {
        if (active) {
          setUser(u);
          setLocale(u.locale);
        }
      })
      .catch((e) => {
        if (active && (!(e instanceof ApiError) || e.status !== 401)) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const logout = async () => {
    await apiRequest('auth/logout', { method: 'POST' });
    setUser(null);
  };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState retry={() => setAttempt((x) => x + 1)} />;
  return (
    <Context.Provider
      value={{
        user,
        acceptUser: (u) => {
          setUser(u);
          setLocale(u.locale);
        },
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
