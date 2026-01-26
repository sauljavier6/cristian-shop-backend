// src/routes/rolRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getIva } from '../controllers/ivaController';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getIva);

export default router;