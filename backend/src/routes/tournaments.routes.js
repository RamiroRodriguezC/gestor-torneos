import { Router } from 'express';
import {
  getAll, getById, create, update,
  getParticipants, postParticipant,
  getDates, postDate,
  getApplications,
} from '../controllers/tournaments.controller.js';

const router = Router();

// Sub-rutas específicas primero (evita que /:id capture rutas anidadas)
router.get('/:id/participants', getParticipants);
router.post('/:id/participants', postParticipant);

router.get('/:id/dates', getDates);
router.post('/:id/dates', postDate);

router.get('/:id/applications', getApplications);

// CRUD genérico al final
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
