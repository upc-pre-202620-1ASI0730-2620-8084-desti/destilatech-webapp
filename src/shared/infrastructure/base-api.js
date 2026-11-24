import axios from 'axios';
import { errorInterceptor } from '@/shared/infrastructure/error.interceptor.js';
import { iamInterceptor } from '@/iam/infrastructure/iam.interceptor.js';

const platformApi = import.meta.env.VITE_DESTILATECH_API_URL;

export const STORAGE_KEYS = Object.freeze({
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

        // Access token of the signed-in account; a 401 closes the session
        this.#http.interceptors.request.use(iamInterceptor.onRequest);
        this.#http.interceptors.response.use(response => response, iamInterceptor.onResponseError);

        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }

    get http() {
        return this.#http;
    }
}
