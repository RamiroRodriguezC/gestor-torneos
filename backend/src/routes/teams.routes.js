import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  getTeamMembers,
  getTeamTournaments,
  joinByCode,
  getInviteCode,
  regenerateInviteCode,
  removeMember,
} from '../controllers/teams.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/join', joinByCode);

router.get('/:id/members', getTeamMembers);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/tournaments', getTeamTournaments);
router.get('/:id/invite-code', getInviteCode);
router.post('/:id/regenerate-code', regenerateInviteCode);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
