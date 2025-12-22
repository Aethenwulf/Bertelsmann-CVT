import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { CONFIG, API_BASE } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl || API_BASE });

axiosInstance.interceptors.request.use((config) => {
  console.log('[HTTP]', config.method?.toUpperCase(), config.baseURL, config.url);
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/auth/me',
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
  },
  users: { list: '/users', root: '/users' },
  customers: { list: '/customers', root: '/customers' },
  departments: { list: '/departments', root: '/departments' },
  roles: { list: '/roles', root: '/roles' },
};