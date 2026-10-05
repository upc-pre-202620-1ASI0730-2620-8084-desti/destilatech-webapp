import { STORAGE_KEYS } from '@/shared/infrastructure/base-api.js';


export const iamInterceptor = config => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};
