import Tournament from '../models/TournamentsModel.js';
import Application from '../models/ApplicationsModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { TOURNAMENT_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') errors.push('title es requerido');
  }
  if (!isUpdate || data.organizerId !== undefined) {
    if (!data.organizerId) errors.push('organizerId es requerido');
  }
  if (!isUpdate || data.sportConfigId !== undefined) {
    if (!data.sportConfigId) errors.push('sportConfigId es requerido');
  }

  return errors;
};

export const findAll = async ({ status } = {}) => {
  requireDB();
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  return Tournament.find(filter);
};

export const findById = async (id) => {
  requireDB();
  return Tournament.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  return Tournament.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const tournament = await Tournament.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament;
};

export const findParticipants = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('participantes');
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.participantes;
};

export const addParticipant = async (id, data, { actorId } = {}) => {
  requireDB();

  const participantId = data.participantId || data.teamId; // tolera payload legacy con teamId
  if (!participantId) throw new AppError(ErrorType.VALIDATION_ERROR, 'participantId del participante es requerido');

  const tournament = await Tournament.findOne({ _id: id, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  // Alta directa sin pasar por el flujo de solicitudes: solo el organizador,
  // o una inscripción con Application APROBADA previa (cierra el bypass documentado).
  const isOrganizer = actorId && String(tournament.organizerId) === String(actorId);
  const approvedApp = await Application.findOne({
    tournamentId: id,
    participantId,
    status: 'APROBADA',
    isDeleted: false,
  });
  if (!isOrganizer && !approvedApp) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el organizador puede agregar participantes directamente, o debe existir una solicitud aprobada.');
  }

  // Duplicados y cupo.
  const alreadyIn = (tournament.participantes || []).some(
    (p) => String(p.participantId ?? p.teamId) === String(participantId)
  );
  if (alreadyIn) throw new AppError(ErrorType.CONFLICT, 'El participante ya está inscripto en el torneo.');

  if (tournament.maxRegistrations > 0 && (tournament.participantes?.length || 0) >= tournament.maxRegistrations) {
    throw new AppError(ErrorType.CONFLICT, 'El torneo alcanzó su cupo máximo de participantes.');
  }

  const participantType = data.participantType || 'TEAM';
  const updated = await Tournament.findByIdAndUpdate(
    id,
    {
      $push: {
        participantes: {
          participantId,
          participantType,
          displayNameSnapshot: data.displayNameSnapshot || '',
          logoURL: data.logoURL || '',
        },
      },
    },
    { new: true, runValidators: true }
  ).select('participantes');

  return updated.participantes;
};

export const findRounds = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('rounds');
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.rounds;
};

export const addRound = async (id, data) => {
  requireDB();

  if (!data.roundName) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundName es requerido');
  if (data.roundNumber === undefined || data.roundNumber === null) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundNumber es requerido');

  // Verificar que no exista ya una ronda con el mismo roundNumber dentro del torneo
  const existing = await Tournament.findOne({ _id: id, 'rounds.roundNumber': data.roundNumber }).select('_id');
  if (existing) throw new AppError(ErrorType.VALIDATION_ERROR, `Ya existe una ronda con roundNumber ${data.roundNumber} en este torneo`);

  const tournament = await Tournament.findByIdAndUpdate(
    id,
    { $push: { rounds: data } },
    { new: true, runValidators: true }
  ).select('rounds');

  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.rounds;
};

export const updateStatus = async (id, status, { actorId } = {}) => {
  requireDB();

  if (!TOURNAMENT_STATUS.includes(status)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, `status debe ser uno de: ${TOURNAMENT_STATUS.join(', ')}`);
  }

  const tournament = await Tournament.findOne({ _id: id, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  if (!actorId || String(tournament.organizerId) !== String(actorId)) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el organizador del torneo puede publicarlo o cambiar su estado.');
  }

  // El ciclo de competencia (EN_CURSO/FINALIZADO) no se maneja desde acá: solo BORRADOR ↔ PUBLICADO.
  if (!['BORRADOR', 'PUBLICADO'].includes(status)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Este endpoint solo permite pasar el torneo a BORRADOR o PUBLICADO.');
  }

  const updated = await Tournament.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  return updated;
};

export const findApplications = async (tournamentId) => {
  requireDB();
  return Application.find({ tournamentId, isDeleted: false });
};
