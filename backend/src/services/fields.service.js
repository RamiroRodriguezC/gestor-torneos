import Field from '../models/FieldModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { FIELD_TYPE } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('name es requerido');
    }
  }

  if (data.type !== undefined && !FIELD_TYPE.includes(data.type)) {
    errors.push(`type debe ser uno de: ${FIELD_TYPE.join(', ')}`);
  }

  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.push('address debe ser un texto');
  }

  if (data.location !== undefined && typeof data.location !== 'string') {
    errors.push('location debe ser un texto');
  }

  if (data.amenities !== undefined && !Array.isArray(data.amenities)) {
    errors.push('amenities debe ser un arreglo de cadenas');
  }

  return errors;
};

export const findAll = async (filter = {}) => {
  requireDB();
  const query = { isDeleted: false };
  if (filter.tournamentId) {
    query.tournamentId = filter.tournamentId;
  }
  return Field.find(query);
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

  const field = await Field.findOneAndUpdate({ _id: id, isDeleted: false }, data, {
    new: true,
    runValidators: true,
  });
  if (!field) throw new AppError(ErrorType.FIELD_NOT_FOUND);
  return field;
};

export const remove = async (id) => {
  requireDB();

  const field = await Field.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!field) throw new AppError(ErrorType.FIELD_NOT_FOUND);
  return field;
};
