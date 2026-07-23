import api from '../api/api.js';

export const loginUser = async (mail, password) => {
    try {
        const response = await api.post(`/users/login`, {
            email: mail,
            password : password // Tiene que ser el nombre que espera el backend, no "password" o "contraseña" o algo asi. Tiene que ser EXACTAMENTE "password" porque el backend lo lee con ese nombre.
        });
        return response.data; // Esto debería traer { user, token }
    } catch (error) {
        // Capturamos el error para mostrarlo en la UI si algo se rompe
        throw error.response?.data?.message || 'Error al conectar con el servidor';
    }
};