import handle from '../utils/handle.js';
import * as fieldsService from '../services/fields.service.js';

export const getAll = handle(async () => {
  const data = await fieldsService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await fieldsService.findById(req.params.id);
  if (!data) throw new Error('Cancha no encontrada');
  return { data };
});

export const create = handle(async (req) => {
  const data = await fieldsService.create(req.body);
  return { data };
});

export const update = handle(async (req) => {
  const data = await fieldsService.update(req.params.id, req.body);
  return { data };
});
