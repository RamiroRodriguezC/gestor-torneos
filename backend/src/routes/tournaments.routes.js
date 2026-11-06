import { Router } from 'express';
import {
  getAll, getById, create, update, updateStatus,
  getParticipants, postParticipant,
  getRounds, postRound,
  getApplications, generateFixture,
  getTournamentFields, postTournamentField, putTournamentField, deleteTournamentField,
} from '../controllers/tournaments.controller.js';
import { authenticateToken, isOrganizador } from '../middlewares/authMiddleware.js';

const router = Router();

// Sub-rutas específicas primero (evita que /:id capture rutas anidadas)

// --- Lectura pública del catálogo ---
// El panel de torneos (descubrimiento) es público: cualquiera puede ver torneos PUBLICADO y su detalle.
// Los datos de consulta de canchas son públicos para que los participantes puedan ver dónde juegan.
router.get('/', getAll); // ?status=PUBLICADO para el panel público
router.get('/:id', getById);
router.get('/:id/participants', getParticipants);
router.get('/:id/fields', getTournamentFields);

// --- Gestión (requiere token y ser organizador o admin) ---
router.use(authenticateToken);

router.patch('/:id/status', isOrganizador, updateStatus);
router.put('/:id', isOrganizador, update);

router.post('/:id/participants', isOrganizador, postParticipant);

router.get('/:id/rounds', getRounds);
router.post('/:id/rounds', isOrganizador, postRound);

router.post('/:id/fixture', isOrganizador, generateFixture);

router.get('/:id/applications', isOrganizador, getApplications);

// Canchas / Ubicaciones de juego del torneo (solo organizador o admin)
router.post('/:id/fields', isOrganizador, postTournamentField);
router.put('/:id/fields/:fieldId', isOrganizador, putTournamentField);
router.delete('/:id/fields/:fieldId', isOrganizador, deleteTournamentField);

// CRUD genérico (protegido)
router.post('/', create);

export default router;
