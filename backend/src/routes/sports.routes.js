import { Router } from 'express';
import { getAll, getByName } from '../controllers/sports.controller.js';

const router = Router();

router.get('/', getAll);
router.get('/:name', getByName);

export default router;
