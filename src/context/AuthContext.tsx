import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  decodeToken,
  getToken,
  isTokenExpired,
  removeToken,
  setToken,
} from '@utils/helpers';

type AuthUser = {
  email?: string;
  role?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getInitialToken = (): string | null => {
  const token = getToken();

  if (!token) return null;
  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }

  return token;
};

const mapTokenToUser = (token: string | null): AuthUser | null => {
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    email: payload.sub,
    role:
      payload.role ||
      (Array.isArray(payload.roles) ? payload.roles[0] : undefined),
  };
};

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [token, setTokenState] = useState<string | null>(() =>
    getInitialToken()
  );

  useEffect(() => {
    if (!token) return;

    if (isTokenExpired(token)) {
      removeToken();
      setTokenState(null);
    }
  }, [token]);

  const login = (nextToken: string) => {
    setToken(nextToken);
    setTokenState(nextToken);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
  };

  const user = useMemo(() => mapTokenToUser(token), [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      login,
      logout,
      hasRole: (role: string) => user?.role === role,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
