import * as usersService from '../services/users.service.js';

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    const status = error.message.includes('no encontrado') ? 404
      : error.message.includes('requerido') || error.message.includes('formato') || error.message.includes('válida') ? 400
      : error.message.includes('ya está registrado') ? 409
      : 500;
    res.status(status).json({ error: error.message });
  }
};

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
