import handle from '../utils/handle.js';
import * as tournamentsService from '../services/tournaments.service.js';

export const getAll = handle(async () => {
  const data = await tournamentsService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await tournamentsService.findById(req.params.id);
  if (!data) throw new Error('Torneo no encontrado');
  return { data };
});

export const create = handle(async (req) => {
  const data = await tournamentsService.create(req.body);
  return { data };
});

export const update = handle(async (req) => {
  const data = await tournamentsService.update(req.params.id, req.body);
  return { data };
});

export const getParticipants = handle(async (req) => {
  const data = await tournamentsService.findParticipants(req.params.id);
  return { data, count: data.length };
});

export const postParticipant = handle(async (req) => {
  const data = await tournamentsService.addParticipant(req.params.id, req.body);
  return { data, count: data.length };
});

export const getDates = handle(async (req) => {
  const data = await tournamentsService.findDates(req.params.id);
  return { data, count: data.length };
});

export const postDate = handle(async (req) => {
  const data = await tournamentsService.addDate(req.params.id, req.body);
  return { data, count: data.length };
});

export const getApplications = handle(async (req) => {
  const data = await tournamentsService.findApplications(req.params.id);
  return { data, count: data.length };
});
