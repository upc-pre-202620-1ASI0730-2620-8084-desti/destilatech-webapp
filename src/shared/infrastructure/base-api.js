import axios from 'axios';
import { errorInterceptor } from '@/shared/infrastructure/error.interceptor.js';

const platformApi = import.meta.env.VITE_DESTILATECH_API_URL;

export const STORAGE_KEYS = Object.freeze({
    userId: 'destilatech.user-id',
    locale: 'destilatech.locale'
});


export class BaseApi {

    #http;

    constructor() {
        this.#http = axios.create({ baseURL: platformApi });

        this.#http.interceptors.request.use(config => {
            config.headers['Accept-Language'] = localStorage.getItem(STORAGE_KEYS.locale) || 'en';
            return config;
        });

        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }

    get http() {
        return this.#http;
    }
}
