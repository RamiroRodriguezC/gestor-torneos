import { Router } from 'express';
import { getAll, getById, create, update } from '../controllers/users.controller.js';

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);

export default router;
