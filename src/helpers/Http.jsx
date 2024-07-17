import axios from 'axios';
import { Global } from './Global';

const http = axios.create({
    baseURL: Global.url,
    headers: {
        'Content-Type': 'application/json'
    },
});
/*HELPER para las solicitudes mendante axios  */
// Interceptor para añadir el token a todas las solicitudes
http.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['token'] = token;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default http;
