import createError from 'http-errors';
import handle from '../utils/handle.js';
import * as sportsService from '../services/sports.service.js';

export const getAll = handle(async () => {
  const data = await sportsService.findAll();
  return { data, count: data.length };
});

export const getByName = handle(async (req) => {
  const data = await sportsService.findByName(req.params.name);
  if (!data) throw createError(404, `Deporte '${req.params.name}' no encontrado`);
  return { data };
});
