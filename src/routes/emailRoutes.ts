// src/routes/rolRoutes.ts
import { Router } from 'express';
import { getEmail, getEmailbyId } from '../controllers/emailController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getEmail);
router.get('/:id', authenticateToken, checkRole("Administrador","Trabajador"), getEmailbyId);

export default router;