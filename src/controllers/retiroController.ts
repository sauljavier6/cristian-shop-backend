import Retiro from "../models/Retiro";

export const createRetiro = async (req: any, res: any) => {
  try {
    const {
      Description,
      Amount,
      Payment,
      Batch,
      ID_Operador,
    } = req.body;

    if (!Description || !Amount || !Payment || !Batch) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const newRetiro = await Retiro.create({
      Description,
      Amount,
      ID_Payment: Payment,
      Batch,
      ID_Operador,
      State: true
    });

    res.status(201).json({
      message: "Retiro registrado correctamente",
      data: newRetiro
    });
  } catch (error) {
    console.error("Error al registrar retiro:", error);
    res.status(500).json({
      message: "Error al registrar retiro",
      error
    });
  }
};
