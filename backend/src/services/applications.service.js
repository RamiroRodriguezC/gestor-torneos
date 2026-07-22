import Application from '../models/ApplicationsModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { APPLICATION_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.tournamentId !== undefined) {
    if (!data.tournamentId) errors.push('tournamentId es requerido');
  }
  if (!isUpdate || data.applicantId !== undefined) {
    if (!data.applicantId) errors.push('applicantId es requerido');
  }
  if (!isUpdate || data.participantId !== undefined) {
    if (!data.participantId) errors.push('participantId es requerido');
  }
  if (data.status !== undefined && !APPLICATION_STATUS.includes(data.status)) {
    errors.push(`status debe ser uno de: ${APPLICATION_STATUS.join(', ')}`);
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Application.find({ isDeleted: false });
};

export const findById = async (id) => {
  requireDB();
  return Application.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  return Application.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const application = await Application.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!application) throw new AppError(ErrorType.APPLICATION_NOT_FOUND);
  return application;
};
