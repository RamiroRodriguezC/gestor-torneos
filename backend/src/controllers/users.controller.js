import handle from '../utils/handle.js';
import * as usersService from '../services/users.service.js';

export const getAll = handle(async () => {
  const data = await usersService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await usersService.findById(req.params.id);
  if (!data) throw new Error('User not found');
  return { data };
});

export const create = handle(async (req) => {
  const data = await usersService.create(req.body);
  return { data };
});

export const update = handle(async (req) => {
  const data = await usersService.update(req.params.id, req.body);
  return { data };
});

export const getUserTournaments = handle(async (req) => {
  const data = await usersService.findUserTournaments(req.params.id);
  return { data, count: data.length };
});

export const getUserTeams = handle(async (req) => {
  const data = await usersService.findUserTeams(req.params.id);
  return { data, count: data.length };
});

export const login = handle(async (req) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw Object.assign(new Error('Email y contraseña son requeridos'), { status: 400 });
  }

  const usuario = await usersService.findByEmail(email);
  if (!usuario) {
    throw Object.assign(new Error('Usuario no encontrado'), { status: 400 });
  }

  const isMatch = await usersService.validatePassword(password, usuario);
  if (!isMatch) {
    throw Object.assign(new Error('Contraseña incorrecta'), { status: 400 });
  }

  const token = usersService.generateToken(usuario);

  return {
    message: 'Login exitoso',
    token,
    usuario: {
      id: usuario._id,
      name: usuario.name,
      lastName: usuario.lastName,
      email: usuario.email,
      globalRole: usuario.globalRole,
      url_profile_photo: usuario.url_profile_photo
    }
  };
});
