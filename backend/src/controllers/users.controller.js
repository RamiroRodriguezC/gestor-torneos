import handle from '../utils/handle.js';
import * as usersService from '../services/users.service.js';

export const getAll = handle(async () => {
  const data = await usersService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await usersService.findById(req.params.id);
  if (!data) throw new Error('Usuario no encontrado');
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
