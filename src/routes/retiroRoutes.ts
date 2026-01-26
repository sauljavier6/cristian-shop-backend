import { Router } from "express";
import { createRetiro } from "../controllers/retiroController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRoleMiddleware";

const router = Router();

router.post("/", authenticateToken, checkRole("Administrador","Trabajador"), createRetiro);

export default router;
