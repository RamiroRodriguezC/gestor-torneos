import handle from '../utils/handle.js';
import * as teamsService from '../services/teams.service.js';

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

export const getTeamMembers = handle(async (req) => {
  const data = await teamsService.findTeamMembers(req.params.id);
  return { data, count: data.length };
});

export const getTeamTournaments = handle(async (req) => {
  const data = await teamsService.findTeamTournaments(req.params.id);
  return { data, count: data.length };
});
