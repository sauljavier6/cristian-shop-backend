// src/routes/saleRoutes.ts ✅
import { Router } from 'express';
import { createQuotes } from '../../controllers/ecommerceControllers/quotesController';

const router = Router();

router.post('/', createQuotes);

export default router;
