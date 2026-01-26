// src/routes/rolRoutes.ts
import { Router } from 'express';
import { crearRol, getRoles } from '../controllers/rolController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getRoles);
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), crearRol);

export default router;