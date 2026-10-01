import axios from 'axios';
import { errorInterceptor } from '@/shared/infrastructure/error.interceptor.js';

const platformApi = import.meta.env.VITE_DESTILATECH_API_URL;

export const STORAGE_KEYS = Object.freeze({
    token: 'destilatech.token',
    user: 'destilatech.user',
    locale: 'destilatech.locale'
});