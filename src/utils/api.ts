// import axios, { AxiosInstance } from 'axios';

// const api: AxiosInstance = axios.create({
//   baseURL: process.env.API_BASE_URL,
//   timeout: 10000,
// });

// // Интерцептор для добавления токена в заголовки
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     const isAuthRequest = config.url?.startsWith('/auth/');

//     if (token && !isAuthRequest) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     if (config.data instanceof FormData) {
//       delete config.headers['Content-Type'];
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Интерцептор для обработки ответов (например, для обработки 401)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Токен истек или недействителен, очистить и перенаправить на логин
//       localStorage.removeItem('authToken');
//       window.location.href = '/sign-in';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios, { AxiosInstance } from 'axios';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is not configured');
}

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const isAuthRequest = config.url?.startsWith('/auth/');

    if (token && !isAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/');

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      window.location.pathname !== '/sign-in'
    ) {
      localStorage.removeItem('authToken');
      window.location.replace('/sign-in');
    }

    return Promise.reject(error);
  }
);

export default api;
