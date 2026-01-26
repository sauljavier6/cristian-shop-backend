// @/routes/payment.routes.ts
import { Router } from "express";
import { getPayments } from "../controllers/paymentController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRoleMiddleware";

const router = Router();

router.get("/", authenticateToken, checkRole("Administrador","Trabajador"), getPayments);

export default router;
