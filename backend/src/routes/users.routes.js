import { Router } from 'express';
import { getAll, getById, create, update, getUserTournaments, getUserTeams } from '../controllers/users.controller.js';

const router = Router();

router.get('/:id/tournaments', getUserTournaments);
router.get('/:id/teams', getUserTeams);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
