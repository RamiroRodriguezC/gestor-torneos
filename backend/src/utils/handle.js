import { AppError } from './AppError.js';

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.code).json({
        error: { type: error.type, message: error.message, code: error.code },
      });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error inesperado:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default handle;
