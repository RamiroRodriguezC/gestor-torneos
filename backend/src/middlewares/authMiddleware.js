import jwt from 'jsonwebtoken';
import Tournament from '../models/TournamentsModel.js';
import Field from '../models/FieldModel.js';
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
      return next(new AppError(ErrorType.UNAUTHORIZED, 'Token inválido o expirado.'));
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

// Verifica que el usuario autenticado sea el organizador (Owner) del torneo identificado
// por req.params.tournamentId, req.params.id o req.body.tournamentId.
// Exclusivo para Owner (o ADMIN): alta/baja de moderadores, despublicación y edición del torneo.
export const isOrganizador = async (req, res, next) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id || req.body.tournamentId;
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
    req.tournament = tournament;
    next();
  } catch (error) {
    next(error);
  }
};

// Permite acceso tanto al organizador (Owner) como a los moderadores asignados (o ADMIN).
// Utilizado para gestionar solicitudes, canchas y fixture.
export const isOrganizadorOrModerador = async (req, res, next) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id || req.body.tournamentId;
    if (!tournamentId) {
      return next(new AppError(ErrorType.VALIDATION_ERROR, 'tournamentId es requerido.'));
    }
    const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false }).select('organizerId moderators');
    if (!tournament) {
      return next(new AppError(ErrorType.TOURNAMENT_NOT_FOUND));
    }
    const isOwner = String(tournament.organizerId) === String(req.user.id);
    const isMod = (tournament.moderators || []).some((m) => String(m.userId) === String(req.user.id));
    if (!isOwner && !isMod && req.user.globalRole !== 'ADMIN') {
      return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Se requieren permisos de organizador o moderador.'));
    }
    req.tournament = tournament;
    next();
  } catch (error) {
    next(error);
  }
};

// Verifica permisos de administración sobre una cancha (Field).
// Si la cancha pertenece a un torneo, debe ser el organizador o un moderador del torneo (o ADMIN global).
// Si no pertenece a un torneo (cancha global/del sistema), debe ser ADMIN global.
export const canManageField = async (req, res, next) => {
  try {
    if (req.user.globalRole === 'ADMIN') return next();

    // Si es creación y viene tournamentId en req.body
    const tournamentId = req.body?.tournamentId;
    if (tournamentId) {
      const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false }).select('organizerId moderators');
      if (!tournament) return next(new AppError(ErrorType.TOURNAMENT_NOT_FOUND));
      const isOwner = String(tournament.organizerId) === String(req.user.id);
      const isMod = (tournament.moderators || []).some((m) => String(m.userId) === String(req.user.id));
      if (!isOwner && !isMod) {
        return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Solo el organizador o moderadores pueden gestionar canchas.'));
      }
      return next();
    }

    // Si es update o delete con req.params.id (fieldId)
    if (req.params.id) {
      const field = await Field.findOne({ _id: req.params.id, isDeleted: false });
      if (!field) return next(new AppError(ErrorType.FIELD_NOT_FOUND));
      if (field.tournamentId) {
        const tournament = await Tournament.findOne({ _id: field.tournamentId, isDeleted: false }).select('organizerId moderators');
        if (!tournament) return next(new AppError(ErrorType.TOURNAMENT_NOT_FOUND));
        const isOwner = String(tournament.organizerId) === String(req.user.id);
        const isMod = (tournament.moderators || []).some((m) => String(m.userId) === String(req.user.id));
        if (!isOwner && !isMod) {
          return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Solo el organizador o moderadores pueden gestionar canchas.'));
        }
        return next();
      }
    }

    return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Se requieren permisos de administrador.'));
  } catch (error) {
    next(error);
  }
};

// Verifica permisos para gestionar planillas de partido (Matches).
// Permite que tanto el organizerId (Owner) como los moderadores del torneo o ADMIN gestionen partidos.
export const canManageMatch = async (req, res, next) => {
  try {
    if (req.user.globalRole === 'ADMIN') return next();

    let tournamentId = req.body?.tournamentId;
    if (!tournamentId && req.params.id) {
      const Match = (await import('../models/MatchesModel.js')).default;
      const match = await Match.findOne({ _id: req.params.id, isDeleted: false }).select('tournamentId');
      if (!match) return next(new AppError(ErrorType.MATCH_NOT_FOUND));
      tournamentId = match.tournamentId;
    }

    if (!tournamentId) {
      return next(new AppError(ErrorType.VALIDATION_ERROR, 'tournamentId es requerido.'));
    }

    const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false }).select('organizerId moderators');
    if (!tournament) {
      return next(new AppError(ErrorType.TOURNAMENT_NOT_FOUND));
    }

    const isOwner = String(tournament.organizerId) === String(req.user.id);
    const isMod = (tournament.moderators || []).some((m) => String(m.userId) === String(req.user.id));
    if (!isOwner && !isMod) {
      return next(new AppError(ErrorType.FORBIDDEN, 'Acceso denegado. Solo el organizador o un moderador pueden modificar partidos.'));
    }

    next();
  } catch (error) {
    next(error);
  }
};
