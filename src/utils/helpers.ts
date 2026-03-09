/**
 * Вспомогательные утилиты
 */

/**
 * Объединяет CSS классы условно
 */
export const classNames = (
  ...classes: (string | false | undefined)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Форматирует дату в локальный формат
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU').format(date);
};

/**
 * Делает первую букву строки прописной
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Декодирует JWT токен без верификации
 */
export const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
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

/**
 * Проверяет, истек ли токен
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Получает токен из localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Устанавливает токен в localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Удаляет токен из localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

/**
 * Проверяет, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
};
