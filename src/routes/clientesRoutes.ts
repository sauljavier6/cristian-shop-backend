import express from "express";
import { deleteMultipleUsers, getClients, searchClient, searchClientbyId } from "../controllers/clientesController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRoleMiddleware";

const router = express.Router();

router.get("/", authenticateToken, checkRole("Administrador","Trabajador"), getClients);
router.get("/search", authenticateToken, checkRole("Administrador","Trabajador"), searchClient);
router.get("/:ID_User", authenticateToken, checkRole("Administrador","Trabajador"), searchClientbyId);
router.delete("/", authenticateToken, checkRole("Administrador","Trabajador"), deleteMultipleUsers);

export default router;
