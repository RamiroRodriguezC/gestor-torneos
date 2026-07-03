import { Router } from 'express';
import { getAll, getById, create, update, getTeamMembers, getTeamTournaments } from '../controllers/teams.controller.js';

const router = Router();

router.get('/:id/members', getTeamMembers);
router.get('/:id/tournaments', getTeamTournaments);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
