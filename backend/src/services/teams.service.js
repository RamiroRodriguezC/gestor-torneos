import Team from '../models/TeamsModel.js';
import { requireDB } from '../config/db.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') errors.push('name es requerido');
  }
  if (!isUpdate || data.discipline !== undefined) {
    if (!data.discipline || typeof data.discipline !== 'string') errors.push('discipline es requerido');
  }
  if (!isUpdate || data.capitanId !== undefined) {
    if (!data.capitanId) errors.push('capitanId es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Team.find({ isDeleted: false });
};

export const findById = async (id) => {
  requireDB();
  return Team.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new Error(errors.join('; '));

  return Team.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new Error(errors.join('; '));

  const team = await Team.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!team) throw new Error('Equipo no encontrado');
  return team;
};
