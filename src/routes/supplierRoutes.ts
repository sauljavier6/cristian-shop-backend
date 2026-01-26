// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { createSupplier, deleteSuppliers, getSupplierById, getSuppliers, updateUser, searchSupplier } from '../controllers/supplierController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), createSupplier);
router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getSuppliers);
router.get("/search", authenticateToken, checkRole("Administrador","Trabajador"), searchSupplier);
router.get('/:id', authenticateToken, checkRole("Administrador","Trabajador"), getSupplierById);
router.delete('/', authenticateToken, checkRole("Administrador","Trabajador"), deleteSuppliers);
router.put('/', authenticateToken, checkRole("Administrador","Trabajador"), updateUser);



export default router;
