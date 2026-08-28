import { AppError } from './AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

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
      const code = error.status;
      let type = ErrorType.INTERNAL_ERROR;
      if (code === 400) type = ErrorType.VALIDATION_ERROR;
      else if (code === 401) type = ErrorType.UNAUTHORIZED;
      else if (code === 403) type = ErrorType.FORBIDDEN;
      else if (code === 404) type = ErrorType.TOURNAMENT_NOT_FOUND;
      else if (code === 409) type = ErrorType.CONFLICT;
      return res.status(code).json({
        error: { type: type.type, message: error.message, code },
      });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        error: { type: ErrorType.VALIDATION_ERROR.type, message: error.message, code: 400 },
      });
    }
    console.error('Error inesperado:', error);
    return res.status(500).json({
      error: { type: ErrorType.INTERNAL_ERROR.type, message: error.message || ErrorType.INTERNAL_ERROR.defaultMessage, code: 500 },
    });
  }
};

export default handle;
