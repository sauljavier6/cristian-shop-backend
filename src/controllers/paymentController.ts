// @/controllers/payment.controller.ts
import { Request, Response } from "express";
import Payment from "../models/Payment";

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.findAll({
      where: { State: true },
      attributes: ["ID_Payment", "Description"]
    });
    res.json({ data: payments });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener métodos de pago" });
  }
};
