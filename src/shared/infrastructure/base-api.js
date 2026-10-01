import axios from 'axios';
import { errorInterceptor } from '@/shared/infrastructure/error.interceptor.js';

const platformApi = import.meta.env.VITE_DESTILATECH_API_URL;

export const STORAGE_KEYS = Object.freeze({
    token: 'destilatech.token',
    user: 'destilatech.user',
    locale: 'destilatech.locale'
});

export class BaseApi {

    #http;

    constructor() {
        this.#http = axios.create({ baseURL: platformApi });

        this.#http.interceptors.request.use(config => {
            const token = localStorage.getItem(STORAGE_KEYS.token);
            if (token) config.headers.Authorization = `Bearer ${token}`;
            config.headers['Accept-Language'] = localStorage.getItem(STORAGE_KEYS.locale) || 'es';
            return config;
        });

        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }


}