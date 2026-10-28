import handle from '../utils/handle.js';
import * as teamsService from '../services/teams.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

export const getAll = handle(async () => {
  const data = await teamsService.findAll();
  return { data, count: data.length };
});

export const getById = handle(async (req) => {
  const data = await teamsService.findById(req.params.id);
  if (!data) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  return { data };
});

export const create = handle(async (req) => {
  const capitanId = (req.user?.globalRole === 'ADMIN' && req.body.capitanId)
    ? req.body.capitanId
    : req.user.id;
  const data = await teamsService.create({ ...req.body, capitanId });
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

export const joinByCode = handle(async (req) => {
  const { code } = req.body;
  const data = await teamsService.joinByCode(code, req.user.id);
  return { data };
});

export const getInviteCode = handle(async (req) => {
  const data = await teamsService.getInviteCode(req.params.id, req.user.id, req.user.globalRole);
  return { data };
});

export const regenerateInviteCode = handle(async (req) => {
  const data = await teamsService.regenerateInviteCode(req.params.id, req.user.id, req.user.globalRole);
  return { data };
});

export const removeMember = handle(async (req) => {
  const data = await teamsService.removeTeamMember(req.params.id, req.params.userId, req.user.id, req.user.globalRole);
  return { data };
});
