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



        this.#http.interceptors.response.use(errorInterceptor.onResponse, errorInterceptor.onError);
    }


}