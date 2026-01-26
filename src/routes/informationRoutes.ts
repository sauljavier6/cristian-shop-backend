// src/routes/rolRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { generarPDFCorte, getDatos } from '../controllers/InformationController';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getDatos);
router.get('/corte', authenticateToken, checkRole("Administrador","Trabajador"), generarPDFCorte);

export default router;

