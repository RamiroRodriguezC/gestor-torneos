import Application from '../models/ApplicationsModel.js';
import Tournament from '../models/TournamentsModel.js';
import Team from '../models/TeamsModel.js';
import User from '../models/UsersModel.js';
import SportsConfig from '../models/SportsConfigModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { APPLICATION_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.tournamentId !== undefined) {
    if (!data.tournamentId) errors.push('tournamentId es requerido');
  }
  if (!isUpdate || data.participantId !== undefined) {
    if (!data.participantId) errors.push('participantId es requerido');
  }
  if (data.status !== undefined && !APPLICATION_STATUS.includes(data.status)) {
    errors.push(`status debe ser uno de: ${APPLICATION_STATUS.join(', ')}`);
  }

  return errors;
};

// Resuelve el snapshot de participante que se guarda en Tournament.participantes[].
// participantId es polimórfico: Team (deporte TEAM) o User (deporte INDIVIDUAL).
const resolveParticipantSnapshot = async ({ participantId, participantType }) => {
  if (participantType === 'TEAM') {
    const team = await Team.findOne({ _id: participantId, isDeleted: false }).select('name logoURL');
    if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
    return {
      participantId,
      participantType: 'TEAM',
      displayNameSnapshot: team.name,
      logoURL: team.logoURL || '',
    };
  }

  const user = await User.findOne({ _id: participantId, isDeleted: false }).select('name lastName url_profile_photo');
  if (!user) throw new AppError(ErrorType.USER_NOT_FOUND);
  return {
    participantId,
    participantType: 'INDIVIDUAL',
    displayNameSnapshot: `${user.name} ${user.lastName}`.trim(),
    logoURL: user.url_profile_photo || '',
  };
};

// Chequea que el torneo esté abierto a inscripciones y tenga cupo.
// Devuelve el participantType del deporte si pasa; si no, lanza AppError.
const assertOpenForRegistration = async (tournament) => {
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  if (tournament.status !== 'PUBLICADO') {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'El torneo no está abierto a inscripciones.');
  }
  if (tournament.registrationCloseAt && new Date(tournament.registrationCloseAt) < new Date()) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La inscripción está cerrada.');
  }
  if (tournament.maxRegistrations > 0 && (tournament.participantes?.length || 0) >= tournament.maxRegistrations) {
    throw new AppError(ErrorType.CONFLICT, 'El torneo alcanzó su cupo máximo de participantes.');
  }

  const sport = await SportsConfig.findById(tournament.sportConfigId).select('sportProps.participantType');
  return sport?.sportProps?.participantType || 'TEAM';
};

export const findAll = async ({ actorId } = {}) => {
  requireDB();
  if (!actorId) return Application.find({ isDeleted: false });

  const myTournaments = await Tournament.find({
    $or: [{ organizerId: actorId }, { 'moderators.userId': actorId }],
    isDeleted: false,
  }).select('_id');
  const myTournamentIds = myTournaments.map((t) => t._id);

  return Application.find({
    isDeleted: false,
    $or: [
      { applicantId: actorId },
      { tournamentId: { $in: myTournamentIds } },
    ],
  });
};

export const findById = async (id) => {
  requireDB();
  return Application.findOne({ _id: id, isDeleted: false });
};

export const create = async (data, { actorId } = {}) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const { tournamentId, participantId, notesCapitan, comprobantURL } = data;
  const applicantId = actorId; // el solicitante SIEMPRE sale del token, no del body

  // 1) Torneo abierto + cupo. En individuales el organizador no puede auto-inscribirse.
  const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false });
  const participantType = await assertOpenForRegistration(tournament);

  if (participantType === 'INDIVIDUAL' && String(tournament.organizerId) === String(applicantId)) {
    throw new AppError(ErrorType.FORBIDDEN, 'El organizador no puede auto-inscribirse como participante individual.');
  }

  // 2) Si es TEAM, validar que el solicitante sea capitán del equipo.
  if (participantType === 'TEAM') {
    const team = await Team.findOne({ _id: participantId, isDeleted: false });
    if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
    if (String(team.capitanId) !== String(applicantId)) {
      throw new AppError(ErrorType.FORBIDDEN, 'Solo el capitán del equipo puede solicitar inscripción.');
    }
  } else {
    // Si es INDIVIDUAL, el participantId debe ser el applicantId.
    if (String(participantId) !== String(applicantId)) {
      throw new AppError(ErrorType.FORBIDDEN, 'Solo podés inscribirte a vos mismo.');
    }
  }

  // 3) No duplicar solicitud pendiente ni participante ya dentro.
  const alreadyInTournament = (tournament.participantes || []).some(
    (p) => String(p.participantId ?? p.teamId) === String(participantId)
  );
  if (alreadyInTournament) {
    throw new AppError(ErrorType.CONFLICT, 'El participante ya forma parte del torneo.');
  }

  const existingPending = await Application.findOne({
    tournamentId,
    participantId,
    status: 'PENDIENTE',
    isDeleted: false,
  });
  if (existingPending) {
    throw new AppError(ErrorType.CONFLICT, 'Ya existe una solicitud pendiente para este participante.');
  }

  // 4) Crear Application y reflejar el summary embebido en Tournament + User.
  const application = await Application.create({
    tournamentId,
    participantId,
    applicantId,
    notesCapitan: notesCapitan || '',
    comprobantURL: comprobantURL || '',
    status: 'PENDIENTE',
  });

  await Tournament.findByIdAndUpdate(tournamentId, {
    $push: {
      applications: {
        applicationId: application._id,
        applicantId,
        participantId,
        status: 'PENDIENTE',
      },
    },
  });
  await User.findByIdAndUpdate(applicantId, { $push: { applications: application._id } });

  return application;
};

export const update = async (id, data, { actorId } = {}) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const application = await Application.findById(id);
  if (!application) throw new AppError(ErrorType.APPLICATION_NOT_FOUND);

  const tournament = await Tournament.findOne({ _id: application.tournamentId, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  const isOrganizer = String(tournament.organizerId) === String(actorId);
  const isModerator = (tournament.moderators || []).some((m) => String(m.userId) === String(actorId));
  const isStaff = isOrganizer || isModerator;
  const isApplicant = String(application.applicantId) === String(actorId);

  const statusChanging = data.status !== undefined && data.status !== application.status;

  // Permisos: el organizador o moderador cambia el estado; el solicitante solo edita notas/comprobante mientras esté PENDIENTE.
  if (!isStaff && !isApplicant) {
    throw new AppError(ErrorType.FORBIDDEN, 'No tenés permisos para editar esta solicitud.');
  }
  if (!isStaff && statusChanging) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el organizador o moderador del torneo puede aprobar o rechazar una solicitud.');
  }
  if (isApplicant && !isStaff && application.status !== 'PENDIENTE') {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La solicitud ya fue resuelta; no se puede editar.');
  }

  const updateData = {};
  if (data.notesOrganizador !== undefined) updateData.notesOrganizador = data.notesOrganizador;
  if (data.notesCapitan !== undefined) updateData.notesCapitan = data.notesCapitan;
  if (data.comprobantURL !== undefined) updateData.comprobantURL = data.comprobantURL;
  if (isStaff && data.status !== undefined) updateData.status = data.status;

  // Side-effects al pasar a APROBADA.
  if (data.status === 'APROBADA' && application.status !== 'APROBADA') {
    const isAlreadyIn = (tournament.participantes || []).some(
      (p) => String(p.participantId ?? p.teamId) === String(application.participantId)
    );
    if (isAlreadyIn) {
      throw new AppError(ErrorType.CONFLICT, 'Este participante ya forma parte del torneo.');
    }
    if (tournament.maxRegistrations > 0 && (tournament.participantes?.length || 0) >= tournament.maxRegistrations) {
      throw new AppError(ErrorType.CONFLICT, 'El torneo alcanzó su cupo máximo de participantes.');
    }

    const sport = await SportsConfig.findById(tournament.sportConfigId).select('sportProps.participantType');
    const participantType = sport?.sportProps?.participantType || 'TEAM';
    const snapshot = await resolveParticipantSnapshot({
      participantId: application.participantId,
      participantType,
    });

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { $set: { ...updateData, status: 'APROBADA' } },
      { new: true, runValidators: true }
    );

    const participantIsTeam = participantType === 'TEAM';

    try {
      // 2) Torneo: push del snapshot + estado del summary embebido.
      await Tournament.updateOne(
        { _id: application.tournamentId },
        {
          $push: { participantes: snapshot },
          $set: { 'applications.$[app].status': 'APROBADA' },
        },
        { arrayFilters: [{ 'app.applicationId': application._id }] }
      );

      // 3) Usuario del capitán/solicitante: rol JUGADOR en el torneo (si no estaba).
      const user = await User.findOne({ _id: application.applicantId, isDeleted: false });
      if (user) {
        const yaEnUserTournaments = (user.tournaments || []).some(
          (t) => String(t.tournamentId) === String(application.tournamentId)
        );
        if (!yaEnUserTournaments) {
          await User.updateOne(
            { _id: application.applicantId },
            { $push: { tournaments: { tournamentId: application.tournamentId, role: 'JUGADOR', status: tournament.status } } }
          );
        }
      }

      // 4) Equipo: registrar el torneo en Team.tournaments (si no estaba).
      if (participantIsTeam) {
        const team = await Team.findOne({ _id: application.participantId, isDeleted: false });
        if (team) {
          const yaEnTeamTournaments = (team.tournaments || []).some(
            (t) => String(t.tournamentId) === String(application.tournamentId)
          );
          if (!yaEnTeamTournaments) {
            await Team.updateOne(
              { _id: application.participantId },
              { $push: { tournaments: { tournamentId: application.tournamentId } } }
            );
          }
        }
      }
    } catch (error) {
      // Rollback manual: si falla algún reflejo, la Application no queda aprobada a medias.
      await Application.updateOne({ _id: id }, { $set: { status: application.status } }).catch(() => {});
      await Tournament.updateOne(
        { _id: application.tournamentId },
        {
          $pull: { participantes: { participantId: application.participantId } },
          $set: { 'applications.$[app].status': application.status },
        },
        { arrayFilters: [{ 'app.applicationId': application._id }] }
      ).catch(() => {});
      throw error;
    }

    return updatedApplication;
  }

  // RECHAZADA / PENDIENTE / edición de notas: flip de estado + summary embebido.
  const updatedApplication = await Application.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
  if (!updatedApplication) throw new AppError(ErrorType.APPLICATION_NOT_FOUND);

  if (updateData.status && updateData.status !== 'APROBADA') {
    await Tournament.updateOne(
      { _id: application.tournamentId },
      { $set: { 'applications.$[app].status': updateData.status } },
      { arrayFilters: [{ 'app.applicationId': application._id }] }
    );
  }

  return updatedApplication;
};
