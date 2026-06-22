import * as teamsService from '../services/teams.service.js';

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    // Un poco raro este manejo de escanear asi el mensaje de error
    const status = error.message.includes('no encontrado') ? 404
      : error.message.includes('requerido') ? 400
      : 500;
    res.status(status).json({ error: error.message });
  }
};

export const getAll = handle(async () => {
  const data = await teamsService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await teamsService.findById(req.params.id);
  if (!data) throw new Error('Equipo no encontrado');
  return { data };
});

export const create = handle(async (req) => {
  const data = await teamsService.create(req.body);
  return { data };
});

export const update = handle(async (req) => {
  const data = await teamsService.update(req.params.id, req.body);
  return { data };
});
