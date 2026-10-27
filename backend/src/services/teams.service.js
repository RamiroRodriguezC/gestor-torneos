import Team from '../models/TeamsModel.js';
import User from '../models/UsersModel.js';
import SportsConfig from '../models/SportsConfigModel.js';
import mongoose from 'mongoose';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

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

  const team = await Team.create({
    ...data,
    name: trimmedName,
    members,
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
