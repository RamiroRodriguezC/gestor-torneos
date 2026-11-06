import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/fields.controller.js';
import { authenticateToken, canManageField } from '../middlewares/authMiddleware.js';

const router = Router();

// Consulta pública de canchas / ubicaciones de juego
router.get('/', getAll);
router.get('/:id', getById);

// Rutas de administración protegidas
router.use(authenticateToken);

router.post('/', canManageField, create);
router.put('/:id', canManageField, update);
router.delete('/:id', canManageField, remove);

export default router;
