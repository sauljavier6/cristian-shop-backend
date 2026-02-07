// src/routes/rolRoutes.ts
import { Router } from 'express';
import { postCategory, getCategories, getCategoryById, updateCategory, deletecategory } from '../controllers/categoryController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

//router.get('/', getEmail);
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), postCategory);
router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getCategories);
router.get("/:id",authenticateToken, checkRole("Administrador","Trabajador"), getCategoryById);
router.put("/:id", authenticateToken, checkRole("Administrador","Trabajador"), updateCategory);
router.delete('/', authenticateToken, checkRole("Administrador","Trabajador"), deletecategory);

export default router;