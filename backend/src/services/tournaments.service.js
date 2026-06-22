import Tournament from '../models/TournamentsModel.js';
import Application from '../models/ApplicationsModel.js';
import { requireDB } from '../config/db.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') errors.push('title es requerido');
  }
  if (!isUpdate || data.organizerId !== undefined) {
    if (!data.organizerId) errors.push('organizerId es requerido');
  }
  if (!isUpdate || data.sportConfigId !== undefined) {
    if (!data.sportConfigId) errors.push('sportConfigId es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Tournament.find({ isDeleted: false });
};

export const findById = async (id) => {
  requireDB();
  return Tournament.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new Error(errors.join('; '));

  return Tournament.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new Error(errors.join('; '));

  const tournament = await Tournament.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament;
};

export const findParticipants = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('participantes');
  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament.participantes;
};

export const addParticipant = async (id, data) => {
  requireDB();

  if (!data.id) throw new Error('id del participante es requerido');
  if (!data.name) throw new Error('name del participante es requerido');

  const tournament = await Tournament.findByIdAndUpdate(
    id,
    { $push: { participantes: data } },
    { new: true, runValidators: true }
  ).select('participantes');

  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament.participantes;
};

export const findDates = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('dates');
  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament.dates;
};

export const addDate = async (id, data) => {
  requireDB();

  if (!data.roundName) throw new Error('roundName es requerido');
  if (data.roundNumber === undefined || data.roundNumber === null) throw new Error('roundNumber es requerido');

  const tournament = await Tournament.findByIdAndUpdate(
    id,
    { $push: { dates: data } },
    { new: true, runValidators: true }
  ).select('dates');

  if (!tournament) throw new Error('Torneo no encontrado');
  return tournament.dates;
};

export const findApplications = async (tournamentId) => {
  requireDB();
  return Application.find({ tournamentId, isDeleted: false });
};
