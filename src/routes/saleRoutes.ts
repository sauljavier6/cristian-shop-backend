// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { getListSale, createSale, searchProducts, createCustomerSale, UpdateCustomerSale, getSaleById, postCustomerSale, createPaymentSale } from '../controllers/saleController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkRole } from '../middlewares/checkRoleMiddleware';

const router = Router();

router.get('/', authenticateToken, checkRole("Administrador","Trabajador"), getListSale);
router.post('/', authenticateToken, checkRole("Administrador","Trabajador"), createSale);
router.get("/sale/:ID_Sale", authenticateToken, checkRole("Administrador","Trabajador"), getSaleById);
router.get('/search', authenticateToken, checkRole("Administrador","Trabajador"), searchProducts);
router.post('/customer', authenticateToken, checkRole("Administrador","Trabajador"), createCustomerSale);
router.put('/customer', authenticateToken, checkRole("Administrador","Trabajador"), UpdateCustomerSale);   
router.post('/customerwithsale', authenticateToken, checkRole("Administrador","Trabajador"), postCustomerSale);
router.post('/payments', authenticateToken, checkRole("Administrador","Trabajador"), createPaymentSale);

export default router;
