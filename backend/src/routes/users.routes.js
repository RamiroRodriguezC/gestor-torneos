import { Router } from 'express';
import { getAll, getById, create, update, getUserTournaments, getUserTeams, login } from '../controllers/users.controller.js';
import { authenticateToken, isAdmin, isSelf } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/', create);

// A partir de acá, todo requiere token
router.use(authenticateToken);

router.get('/:id/tournaments', isSelf, getUserTournaments);
router.get('/:id/teams', isSelf, getUserTeams);

router.get('/', isAdmin, getAll);
router.get('/:id', isSelf, getById);
router.put('/:id', isSelf, update);
export default router;
