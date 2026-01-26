import { Request, Response } from "express";
import Batch from "../models/Batch";
import User from "../models/User";
import { Op } from "sequelize";

export const postBatch = async (req: any, res: any) => {
  try {
    const { operador, lote, fecha } = req.body;

    if (!lote || !operador || !fecha) {
      return res
        .status(400)
        .json({ message: "Lote, fecha e ID_User son obligatorios." });
    }

    const newBatch = await Batch.create({
      Lote: lote,
      ID_User: operador,
      Date: fecha,
      State: true,
    });

    res.status(201).json({
      message: "Lote creado exitosamente",
      data: newBatch,
    });
  } catch (error) {
    console.error("Error al crear el lote:", error);
    res.status(500).json({
      message: "Error al crear el lote",
      error,
    });
  }
};

export const getBatch = async (req: Request, res: Response) => {
  const userRole = (req as any).user?.Rol;
  const user = (req as any).user?.ID_User;
  const searchTerm = req.query.searchTerm || "";

  try {
    let whereCondition: any = {
      State: true,
    };

    if (searchTerm) {
      whereCondition.Lote = {
        [Op.iLike]: `${searchTerm}%`,
      };
    }

    if (userRole !== "Administrador") {
      whereCondition.ID_User = user;
    }

    const batches = await Batch.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ["ID_User", "Name"],
        },
      ],
      order: [["ID_Batch", "DESC"]],
    });

    res.status(200).json({
      data: batches,
      totalItems: batches.length,
      message: "Lista de lotes obtenida correctamente",
    });
  } catch (error) {
    console.error("Error al obtener los lotes:", error);
    res.status(500).json({
      message: "Error al obtener los lotes",
      error,
    });
  }
};

export const getBatchbyId = async (req: any, res: any) => {
  const user = (req as any).user?.ID_User;
  const userRole = (req as any).user?.ID_Rol;
  const id = req.params.ID_Batch;

  console.log("ID solicitado:", id);
  try {
    let batch;

    if (userRole === 1) {
      // Admin: puede ver cualquier lote
      batch = await Batch.findOne({
        where: { ID_Batch: id },
        include: [
          {
            model: User,
            attributes: ["ID_User", "Name"],
          },
        ],
      });
    } else {
      // Usuario normal: solo puede ver sus propios lotes
      batch = await Batch.findOne({
        where: {
          ID_Batch: id,
          ID_User: user,
        },
        include: [
          {
            model: User,
            attributes: ["ID_User", "Name"],
          },
        ],
      });
    }

    if (!batch) {
      return res.status(404).json({
        message: "Lote no encontrado o no tienes permisos",
      });
    }

    res.status(200).json({ data: batch });
  } catch (error) {
    console.error("Error al obtener lote:", error);
    res.status(500).json({
      message: "Error al obtener lote",
      error,
    });
  }
};

export const putBatch = async (req: any, res: any) => {
  try {
    const { operador, lote, fecha, estado, id_batch } = req.body;

    // Validación básica
    if (!id_batch) {
      return res
        .status(400)
        .json({ message: "El ID del lote es obligatorio." });
    }

    // Buscar lote
    const batch = await Batch.findByPk(id_batch);

    if (!batch) {
      return res.status(404).json({ message: "Lote no encontrado." });
    }

    // Actualizar campos
    await batch.update({
      Lote: lote ?? batch.Lote,
      ID_User: operador ?? batch.ID_User,
      Date: fecha ?? batch.Date,
      State: estado ?? batch.State,
    });

    res.status(200).json({
      message: "Lote actualizado correctamente",
      data: batch,
    });
  } catch (error) {
    console.error("Error al actualizar el lote:", error);
    res.status(500).json({
      message: "Error al actualizar el lote",
      error,
    });
  }
};
