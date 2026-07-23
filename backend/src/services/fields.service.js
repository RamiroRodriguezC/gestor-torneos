import Field from '../models/FieldModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') errors.push('name es requerido');
  }
  if (!isUpdate || data.address !== undefined) {
    if (!data.address || typeof data.address !== 'string') errors.push('address es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Field.find({ isDeleted: false });
};

export const findById = async (id) => {
  requireDB();
  return Field.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  return Field.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const field = await Field.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!field) throw new AppError(ErrorType.FIELD_NOT_FOUND);
  return field;
};
