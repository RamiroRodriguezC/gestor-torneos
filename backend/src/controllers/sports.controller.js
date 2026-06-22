import * as sportsService from '../services/sports.service.js';

export const getAll = async (req, res) => {
  try {
    const data = await sportsService.findAll();
    res.json({ data, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getByName = async (req, res) => {
  try {
    const data = await sportsService.findByName(req.params.name);
    if (!data) {
      return res.status(404).json({ error: `Deporte '${req.params.name}' no encontrado` });
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
