// src/routes/saleRoutes.ts
import { Router } from "express";
import { printTicket, printTicketCotizacion, sendCotizacionByEmail, sendTicketByEmail } from "../controllers/ticketController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRoleMiddleware";

const router = Router();

router.get("/cotizacion/:id", printTicketCotizacion);
router.post("/cotizacion/:id", sendCotizacionByEmail);

router.get("/:id", printTicket);
router.post("/:id", sendTicketByEmail);


export default router;
