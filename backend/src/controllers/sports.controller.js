import handle from '../utils/handle.js';
import * as sportsService from '../services/sports.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

export const getAll = handle(async () => {
  const data = await sportsService.findAll();
  return { data, count: data.length };
});

export const getByName = handle(async (req) => {
  const data = await sportsService.findByName(req.params.name);
  if (!data) throw new AppError(ErrorType.SPORT_NOT_FOUND, `Deporte '${req.params.name}' no encontrado`);
  return { data };
});
