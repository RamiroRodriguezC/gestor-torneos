import SportsConfig from '../models/SportsConfigModel.js';
import { requireDB } from '../config/db.js';

export const findAll = async () => {
  requireDB();
  return SportsConfig.find();
};

export const findByName = async (name) => {
  requireDB();
  return SportsConfig.findOne({ name });
};
