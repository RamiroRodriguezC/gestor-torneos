import handle from '../utils/handle.js';
import * as applicationsService from '../services/applications.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

export const getAll = handle(async (req) => {
  const data = await applicationsService.findAll({ actorId: req.user?.id });
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await applicationsService.findById(req.params.id);
  if (!data) throw new AppError(ErrorType.APPLICATION_NOT_FOUND);
  return { data };
});

export const create = handle(async (req) => {
  // applicantId siempre sale del token (req.user.id), nunca del body, para evitar suplantación.
  const data = await applicationsService.create(req.body, { actorId: req.user.id });
  return { data };
});

export const update = handle(async (req) => {
  const data = await applicationsService.update(req.params.id, req.body, { actorId: req.user.id });
  return { data };
});
