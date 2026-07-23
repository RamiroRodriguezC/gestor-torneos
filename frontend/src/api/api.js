/* 
En lugar de usar axios directamente, creamos
 una instancia con axios.create(). 
Esto permite preconfigurarla con valores por defecto que se aplicarán a todas 
las peticiones que hagamos con ella 

*/

import axios from 'axios';

const mode = import.meta.env.VITE_APP_MODE || 'local_test';
const baseUrls = {
  local_test: import.meta.env.VITE_API_BASE_URL_LOCAL_TEST,
  test: import.meta.env.VITE_API_BASE_URL_TEST,
  produccion: import.meta.env.VITE_API_BASE_URL_PRODUCCION,
};
const baseURL = baseUrls[mode] || baseUrls.local_test;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/* 
  Interceptor para agregar el token a cada solicitud
  Es parecido a un Middleware, se ejecuta automáticamente antes de que cada petición salga.
  Busca en el localStorage si existe un token y si lo encuentra lo pone en el header authorization.
*/
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Traemos el token del localStorage del navegador
  // Bearer es el formato estándar para enviar tokens de autenticación en el header Authorization. El backend lo espera así para validar la sesión del usuario.
  if (token) config.headers.Authorization = `Bearer ${token}`; // Si existe, lo agregamos al header de la peticion con el formato Bearer (estándar para tokens de autenticación)
  return config; // si no hay token, la petición se envía sin el header Authorization, lo que hará que el backend la rechace si es un endpoint privado.
});
export default api;