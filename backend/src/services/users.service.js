import createError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/UsersModels.js';
import Team from '../models/TeamsModel.js';
import Tournament from '../models/TournamentsModel.js';
import { requireDB } from '../config/db.js';
import { isValidEmail } from '../utils/validation.js';

const EXCLUDED = '-hashedPassword';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') errors.push('name es requerido');
  }
  if (!isUpdate || data.lastName !== undefined) {
    if (!data.lastName || typeof data.lastName !== 'string') errors.push('lastName es requerido');
  }
  if (!isUpdate || data.email !== undefined) {
    if (!data.email) errors.push('email es requerido');
    else if (!isValidEmail(data.email)) errors.push('email no tiene un formato válido');
  }
  if (!isUpdate || data.dateOfBirth !== undefined) {
    if (!data.dateOfBirth) errors.push('dateOfBirth es requerido');
    else if (isNaN(Date.parse(data.dateOfBirth))) errors.push('dateOfBirth no es una fecha válida');
  }
  if (!isUpdate || data.hashedPassword !== undefined) {
    if (!data.hashedPassword) errors.push('hashedPassword es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return User.find({ isDeleted: false }).select(EXCLUDED);
};

export const findById = async (id) => {
  requireDB();
  return User.findOne({ _id: id, isDeleted: false }).select(EXCLUDED);
};

export const findByEmail = async (email) => {
  requireDB();
  return User.findOne({ email, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw createError(400, errors.join('; '));

  const exists = await User.findOne({ email: data.email });
  if (exists) throw createError(409, 'El email ya está registrado');

  const salt = await bcrypt.genSalt(10);
  data.hashedPassword = await bcrypt.hash(data.hashedPassword, salt);

  const user = await User.create(data);
  return User.findById(user._id).select(EXCLUDED);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw createError(400, errors.join('; '));

  if (data.email) {
    const dup = await User.findOne({ email: data.email, _id: { $ne: id } });
    if (dup) throw createError(409, 'El email ya está registrado por otro usuario');
  }

  if (data.hashedPassword) {
    const salt = await bcrypt.genSalt(10);
    data.hashedPassword = await bcrypt.hash(data.hashedPassword, salt);
  }

  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select(EXCLUDED);
  if (!user) throw createError(404, 'User not found');
  return user;
};

export const findUserTournaments = async (userId) => {
  requireDB();
  const user = await User.findById(userId).select('tournaments');
  if (!user) throw createError(404, 'Usuario no encontrado');
  const ids = user.tournaments.map(t => t.tournamentId);
  if (ids.length === 0) return [];
  return Tournament.find({ _id: { $in: ids }, isDeleted: false });
};

export const findUserTeams = async (userId) => {
  requireDB();
  const user = await User.findById(userId).select('teams');
  if (!user) throw createError(404, 'Usuario no encontrado');
  const ids = user.teams.map(t => t.teamId);
  if (ids.length === 0) return [];
  return Team.find({ _id: { $in: ids }, isDeleted: false });
};

export const validatePassword = async (password, usuario) => {
  return bcrypt.compare(password, usuario.hashedPassword);
};

export const generateToken = (usuario) => {
  const payload = {
    id: usuario._id,
    email: usuario.email,
    name: usuario.name,
    globalRole: usuario.globalRole
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};
