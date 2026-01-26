// src/routes/rolRoutes.ts
import { Router } from "express";
import { payment, savesale } from '../../controllers/stripeController';

const router = Router();

router.post('/', payment);
router.post('/savesales', savesale);

export default router;