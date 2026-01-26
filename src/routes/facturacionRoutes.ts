// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { facturarVenta, getFacturacionTickets, getSaleById, obtenerPDF } from '../controllers/facturacionController';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

//router.get("/", authenticateToken, listCompras); 
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), facturarVenta);
router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getFacturacionTickets);
router.get("/sale/:ID_Sale", authenticateToken, checkRole("Administrador","Trabajador"), getSaleById);
router.get("/factura/pdf/:uuid", authenticateToken, checkRole("Administrador","Trabajador"), obtenerPDF);

export default router;
