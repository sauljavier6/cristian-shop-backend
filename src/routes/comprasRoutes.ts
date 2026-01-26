// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { createCompra, deleteCompra, listCompras } from '../controllers/comprasController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get("/", authenticateToken, checkRole("Administrador","Trabajador"), listCompras); 
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), createCompra);
router.delete('/', authenticateToken, checkRole("Administrador","Trabajador"), deleteCompra);

export default router;
