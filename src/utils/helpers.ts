type JwtPayload = {
  exp?: number;
  sub?: string;
  email?: string;
  fullName?: string;
  role?: string;
  roles?: string[];
};

export const classNames = (
  ...classes: (string | false | undefined)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU').format(date);
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Ошибка декодирования токена:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
};

export const getAuthPayload = (): JwtPayload | null => {
  const token = getToken();
  if (!token || isTokenExpired(token)) return null;

  return decodeToken(token);
};

export const getUserRole = (): string | null => {
  const payload = getAuthPayload();
  if (!payload) return null;

  if (payload.role) return payload.role;
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles[0];
  }

  return null;
};

export const hasRole = (role: string): boolean => {
  const userRole = getUserRole();
  return userRole === role;
};
