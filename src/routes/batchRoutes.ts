// src/routes/rolRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { postBatch, getBatch, getBatchbyId, putBatch } from '../controllers/BatchController';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

//router.get('/', getEmail);
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), postBatch);
router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getBatch);
router.get('/:ID_Batch', authenticateToken, checkRole("Administrador","Trabajador"), getBatchbyId);
router.put('/', authenticateToken, checkRole("Administrador","Trabajador"), putBatch);

export default router; 