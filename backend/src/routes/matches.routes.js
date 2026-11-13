import { Router } from 'express';
import { getAll, getById, create, update } from '../controllers/matches.controller.js';
import { authenticateToken, canManageMatch } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', canManageMatch, create);
router.put('/:id', canManageMatch, update);

export default router;
