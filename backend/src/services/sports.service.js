import SportsConfig from '../models/SportsConfigModel.js';

export const findAll = async () => {
  return SportsConfig.find();
};

export const findByName = async (name) => {
  return SportsConfig.findOne({ name });
};
