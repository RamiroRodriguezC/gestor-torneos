import jwt from 'jsonwebtoken';
import Tournament from '../models/TournamentsModel.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(ErrorType.UNAUTHORIZED, 'Acceso denegado. Token no proporcionado.'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new AppError(ErrorType.FORBIDDEN, 'Token inválido o expirado.'));
    }

    req.user = user;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (req.user.globalRole !== 'ADMIN') {
    return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Se requieren permisos de administrador.'));
  }

  next();
};

export const isSelf = (req, res, next) => {
  if (req.user.id !== req.params.id && req.user.globalRole !== 'ADMIN') {
    return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Solo el usuario editado o un administrador pueden realizar esta acción.'));
  }
  next();
};

// Verifica que el usuario autenticado sea el organizador del torneo identificado
// por req.params.id (o req.body.tournamentId cuando la ruta es de una sub-entidad).
export const isOrganizador = async (req, res, next) => {
  try {
    const tournamentId = req.params.id || req.body.tournamentId;
    if (!tournamentId) {
      return next(new AppError(ErrorType.VALIDATION_ERROR, 'tournamentId es requerido.'));
    }
    const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false }).select('organizerId');
    if (!tournament) {
      return next(new AppError(ErrorType.TOURNAMENT_NOT_FOUND));
    }
    if (String(tournament.organizerId) !== String(req.user.id) && req.user.globalRole !== 'ADMIN') {
      return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Solo el organizador del torneo puede realizar esta acción.'));
    }
    next();
  } catch (error) {
    next(error);
  }
};
