import { Router } from 'express';
import {
  getAll, getById, create, update,
  getParticipants, postParticipant,
  getRounds, postRound,
  getApplications,
} from '../controllers/tournaments.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Sub-rutas específicas primero (evita que /:id capture rutas anidadas)
router.get('/:id/participants', getParticipants);
router.post('/:id/participants', postParticipant);

router.get('/:id/rounds', getRounds);
router.post('/:id/rounds', postRound);

router.get('/:id/applications', getApplications);

// CRUD genérico al final
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
