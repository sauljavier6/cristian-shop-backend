// src/routes/state.routes.ts
import { Router } from 'express';
import { getStates } from '../controllers/stateController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getStates);

export default router;
