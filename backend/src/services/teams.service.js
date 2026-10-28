import Team from '../models/TeamsModel.js';
import User from '../models/UsersModel.js';
import SportsConfig from '../models/SportsConfigModel.js';
import mongoose from 'mongoose';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { generateInviteCode } from '../utils/codeGenerator.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) errors.push('name es requerido');
  }
  if (!isUpdate || data.discipline !== undefined) {
    if (!data.discipline || typeof data.discipline !== 'string' || !data.discipline.trim()) errors.push('discipline es requerido');
  }
  if (!isUpdate || data.capitanId !== undefined) {
    if (!data.capitanId) errors.push('capitanId es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Team.find({ isDeleted: false })
    .populate('capitanId', 'name lastName url_profile_photo');
};

export const findById = async (id) => {
  requireDB();
  return Team.findOne({ _id: id, isDeleted: false })
    .populate('capitanId', 'name lastName url_profile_photo');
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  // Resolver y verificar disciplina en SportsConfig
  let sport = null;
  if (mongoose.isValidObjectId(data.discipline)) {
    sport = await SportsConfig.findById(data.discipline);
  }
  if (!sport) {
    sport = await SportsConfig.findOne({ name: data.discipline });
  }
  if (!sport) {
    throw new AppError(ErrorType.SPORT_NOT_FOUND, 'La disciplina o deporte especificado no existe.');
  }
  data.discipline = String(sport._id);

  // Evitar nombres duplicados dentro de la misma disciplina
  const trimmedName = data.name.trim();
  const duplicate = await Team.findOne({
    name: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    discipline: data.discipline,
    isDeleted: false,
  });
  if (duplicate) {
    throw new AppError(ErrorType.CONFLICT, 'Ya existe un equipo con ese nombre en esta disciplina.');
  }

  // Asegurar que el capitán esté en el array de miembros
  const members = Array.isArray(data.members) ? [...data.members] : [];
  if (data.capitanId && !members.some((m) => String(m.userId) === String(data.capitanId))) {
    members.push({ userId: data.capitanId });
  }

  // Generar código de invitación seguro (7 días de vigencia por defecto)
  const inviteCode = {
    code: generateInviteCode(6),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  };

  const team = await Team.create({
    ...data,
    name: trimmedName,
    members,
    inviteCode,
  });

  // Vincular equipo al usuario capitán
  if (data.capitanId) {
    await User.findByIdAndUpdate(data.capitanId, {
      $addToSet: {
        teams: {
          teamId: team._id,
          role: 'CAPITAN',
        },
      },
    });
  }

  return team;
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const team = await Team.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  return team;
};

export const findTeamMembers = async (teamId) => {
  requireDB();
  const team = await Team.findById(teamId).select('members');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  const ids = team.members.map(m => m.userId);
  if (ids.length === 0) return [];
  return User.find({ _id: { $in: ids }, isDeleted: false }).select('-hashedPassword');
};

export const findTeamTournaments = async (teamId) => {
  requireDB();
  const team = await Team.findById(teamId).select('tournaments');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  const ids = team.tournaments.map(t => t.tournamentId);
  if (ids.length === 0) return [];
  const Tournament = (await import('../models/TournamentsModel.js')).default;
  return Tournament.find({ _id: { $in: ids }, isDeleted: false });
};

export const joinByCode = async (code, userId) => {
  requireDB();

  if (!code || typeof code !== 'string' || !code.trim()) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'El código de invitación es requerido.');
  }

  const cleanCode = code.trim().toUpperCase();
  const team = await Team.findOne({
    'inviteCode.code': cleanCode,
    isDeleted: false,
  }).select('+inviteCode.code');

  if (!team) {
    throw new AppError(ErrorType.TEAM_NOT_FOUND, 'Código de invitación inválido o inexistente.');
  }

  if (!team.inviteCode || !team.inviteCode.isActive) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Este código de invitación ha sido desactivado.');
  }

  if (team.inviteCode.expiresAt && new Date() > new Date(team.inviteCode.expiresAt)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'El código de invitación ha expirado.');
  }

  const isCaptain = String(team.capitanId) === String(userId);
  const isMember = (team.members || []).some((m) => String(m.userId) === String(userId));
  if (isCaptain || isMember) {
    throw new AppError(ErrorType.CONFLICT, 'Ya perteneces a este equipo.');
  }

  // Verificar cupo si el deporte define límites
  if (team.discipline) {
    const sport = await SportsConfig.findById(team.discipline);
    const maxSubs = sport?.rulesConfig?.subsLimit?.supported ? (sport?.rulesConfig?.subsLimit?.max || 0) : 0;
    const maxStarters = sport?.sportProps?.maxParticipants || 0;
    const totalMax = maxStarters + maxSubs;
    if (totalMax > 0 && (team.members || []).length >= totalMax) {
      throw new AppError(ErrorType.CONFLICT, `El equipo alcanzó el cupo máximo de jugadores permitidos (${totalMax}).`);
    }
  }

  team.members.push({ userId });
  await team.save();

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      teams: {
        teamId: team._id,
        role: 'MIEMBRO',
      },
    },
  });

  return team;
};

export const getInviteCode = async (teamId, actorId, role) => {
  requireDB();

  const team = await Team.findOne({ _id: teamId, isDeleted: false }).select('+inviteCode.code');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);

  const isCaptain = String(team.capitanId) === String(actorId);
  const isAdmin = role === 'ADMIN';
  if (!isCaptain && !isAdmin) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el capitán del equipo o un administrador pueden ver el código de invitación.');
  }

  if (!team.inviteCode?.code) {
    team.inviteCode = {
      code: generateInviteCode(6),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    };
    await team.save();
  }

  return {
    code: team.inviteCode.code,
    expiresAt: team.inviteCode.expiresAt,
    isActive: team.inviteCode.isActive,
  };
};

export const regenerateInviteCode = async (teamId, actorId, role) => {
  requireDB();

  const team = await Team.findOne({ _id: teamId, isDeleted: false }).select('+inviteCode.code');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);

  const isCaptain = String(team.capitanId) === String(actorId);
  const isAdmin = role === 'ADMIN';
  if (!isCaptain && !isAdmin) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el capitán del equipo o un administrador pueden regenerar el código de invitación.');
  }

  const newCode = generateInviteCode(6);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  team.inviteCode = {
    code: newCode,
    expiresAt,
    isActive: true,
  };
  await team.save();

  return {
    code: team.inviteCode.code,
    expiresAt: team.inviteCode.expiresAt,
    isActive: team.inviteCode.isActive,
  };
};

export const removeTeamMember = async (teamId, memberUserId, actorId, role) => {
  requireDB();

  const team = await Team.findOne({ _id: teamId, isDeleted: false });
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);

  const isCaptain = String(team.capitanId) === String(actorId);
  const isAdmin = role === 'ADMIN';
  const isSelf = String(memberUserId) === String(actorId);

  if (!isCaptain && !isAdmin && !isSelf) {
    throw new AppError(ErrorType.FORBIDDEN, 'No tienes permisos para remover a este miembro del equipo.');
  }

  if (String(memberUserId) === String(team.capitanId)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'El capitán no puede ser expulsado del equipo. Debe transferir la capitanía o eliminar el equipo.');
  }

  team.members = (team.members || []).filter((m) => String(m.userId) !== String(memberUserId));
  await team.save();

  await User.findByIdAndUpdate(memberUserId, {
    $pull: {
      teams: { teamId: team._id },
    },
  });

  return { success: true, teamId: team._id, removedUserId: memberUserId };
};
