import handle from '../utils/handle.js';
import * as matchesService from '../services/matches.service.js';

export const getAll = handle(async () => {
  const data = await matchesService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await matchesService.findById(req.params.id);
  if (!data) throw new Error('Partido no encontrado');
  return { data };
});

export const create = handle(async (req) => {
  const data = await matchesService.create(req.body);
  return { data };
});

export const update = handle(async (req) => {
  const data = await matchesService.update(req.params.id, req.body);
  return { data };
});
