// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { disableStateWebSale, getListSaleWeb, printRemision } from '../controllers/SalesWebController';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getListSaleWeb);
router.get("/printRemision/:ID_Sale", authenticateToken, checkRole("Administrador","Trabajador"), printRemision);
router.patch("/completar/:ID_Sale", authenticateToken, checkRole("Administrador","Trabajador"), disableStateWebSale);
  
export default router;