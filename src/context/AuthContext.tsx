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
import { RoleEnum } from '@entities/role-enum';

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: unknown;
  roles?: unknown;
};

type AuthUser = {
  email?: string;
  role?: RoleEnum;
  roles: RoleEnum[];
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (roles: RoleEnum | RoleEnum[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PRIORITY: RoleEnum[] = [
  RoleEnum.ADMIN,
  RoleEnum.GROUP_LEADER,
  RoleEnum.TEACHER,
  RoleEnum.STUDENT,
];

const normalizeRole = (value: unknown): RoleEnum | null => {
  const rawRole =
    typeof value === 'string'
      ? value
      : typeof value === 'object' &&
          value !== null &&
          'authority' in value &&
          typeof (value as { authority?: unknown }).authority === 'string'
        ? (value as { authority: string }).authority
        : null;

  if (!rawRole) return null;

  const normalized = rawRole
    .trim()
    .replace(/^ROLE_/i, '')
    .replace(/[-\s]/g, '_')
    .toUpperCase();

  switch (normalized) {
    case RoleEnum.STUDENT:
      return RoleEnum.STUDENT;
    case RoleEnum.TEACHER:
      return RoleEnum.TEACHER;
    case RoleEnum.ADMIN:
      return RoleEnum.ADMIN;
    case RoleEnum.GROUP_LEADER:
      return RoleEnum.GROUP_LEADER;
    default:
      return null;
  }
};

const getRolesFromPayload = (payload: JwtPayload): RoleEnum[] => {
  const rawRoles = Array.isArray(payload.roles)
    ? payload.roles
    : payload.role != null
      ? [payload.role]
      : [];

  const normalizedRoles = rawRoles
    .map(normalizeRole)
    .filter((role): role is RoleEnum => role !== null);

  return Array.from(new Set(normalizedRoles));
};

const getPrimaryRole = (roles: RoleEnum[]): RoleEnum | undefined => {
  return ROLE_PRIORITY.find((role) => roles.includes(role));
};

const getInitialToken = (): string | null => {
  try {
    const token = getToken();

    if (!token) return null;
    if (isTokenExpired(token)) {
      removeToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to read token:', error);
    removeToken();
    return null;
  }
};

const mapTokenToUser = (token: string | null): AuthUser | null => {
  if (!token) return null;

  try {
    const payload = decodeToken(token) as JwtPayload | null;

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const roles = getRolesFromPayload(payload);
    const email =
      typeof payload.sub === 'string'
        ? payload.sub
        : typeof payload.email === 'string'
          ? payload.email
          : undefined;

    return {
      email,
      roles,
      role: getPrimaryRole(roles),
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [token, setTokenState] = useState<string | null>(() =>
    getInitialToken()
  );

  const user = useMemo(() => mapTokenToUser(token), [token]);

  useEffect(() => {
    if (!token) return;

    if (isTokenExpired(token) || user === null) {
      removeToken();
      setTokenState(null);
    }
  }, [token, user]);

  useEffect(() => {
    const handleStorage = () => {
      setTokenState(getInitialToken());
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = (nextToken: string) => {
    setToken(nextToken);
    setTokenState(nextToken);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
  };

  const hasRole = (requiredRoles: RoleEnum | RoleEnum[]) => {
    if (!user) return false;

    if (user.roles.includes(RoleEnum.ADMIN)) {
      return true;
    }

    const rolesToCheck = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    return rolesToCheck.some((role) => user.roles.includes(role));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      login,
      logout,
      hasRole,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
