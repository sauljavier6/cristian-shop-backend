// src/routes/rolRoutes.ts
import { Router } from 'express';
import { postCategory, getCategories } from '../controllers/categoryController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

//router.get('/', getEmail);
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), postCategory);
router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getCategories);

export default router;