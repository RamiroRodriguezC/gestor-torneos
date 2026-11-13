import { Router } from 'express';
import {
  getAll, getById, create, update, updateStatus,
  getParticipants, postParticipant,
  getRounds, postRound,
  getApplications, generateFixture,
  getTournamentFields, postTournamentField, putTournamentField, deleteTournamentField,
  getModerators, postModerator, deleteModerator,
} from '../controllers/tournaments.controller.js';
import { authenticateToken, isOrganizador, isOrganizadorOrModerador } from '../middlewares/authMiddleware.js';

const router = Router();

// Sub-rutas específicas primero (evita que /:id capture rutas anidadas)

// --- Lectura pública del catálogo ---
// El panel de torneos (descubrimiento) es público: cualquiera puede ver torneos PUBLICADO y su detalle.
// Los datos de consulta de canchas son públicos para que los participantes puedan ver dónde juegan.
router.get('/', getAll); // ?status=PUBLICADO para el panel público
router.get('/:id', getById);
router.get('/:id/participants', getParticipants);
router.get('/:id/fields', getTournamentFields);

// --- Gestión (requiere token de autenticación) ---
router.use(authenticateToken);

// Acciones exclusivas del organizador (Owner) o ADMIN
router.patch('/:id/status', isOrganizador, updateStatus);
router.put('/:id', isOrganizador, update);
router.post('/:id/moderators', isOrganizador, postModerator);
router.delete('/:id/moderators/:userId', isOrganizador, deleteModerator);

// Acciones compartidas: organizador (Owner) y moderadores (o ADMIN)
router.get('/:id/moderators', isOrganizadorOrModerador, getModerators);
router.post('/:id/participants', isOrganizadorOrModerador, postParticipant);

router.get('/:id/rounds', getRounds);
router.post('/:id/rounds', isOrganizadorOrModerador, postRound);

router.post('/:id/fixture', isOrganizadorOrModerador, generateFixture);

router.get('/:id/applications', isOrganizadorOrModerador, getApplications);

// Canchas / Ubicaciones de juego del torneo
router.post('/:id/fields', isOrganizadorOrModerador, postTournamentField);
router.put('/:id/fields/:fieldId', isOrganizadorOrModerador, putTournamentField);
router.delete('/:id/fields/:fieldId', isOrganizadorOrModerador, deleteTournamentField);

// CRUD genérico (crear torneo)
router.post('/', create);

export default router;
