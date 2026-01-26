import User from "../models/User";
import Email from "../models/Email";
import Phone from "../models/Phone";
import Facturacion from "../models/Facturacion";
import { Op } from "sequelize";

export const getClients = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = (req.query.searchTerm || "").toString().trim();

    let whereClause: any = {
      ID_Rol: 2,
      State: true,
    };

    // Si hay búsqueda, modificar where
    if (searchTerm) {
      whereClause = {
        ...whereClause,
        Name: { [Op.iLike]: `${searchTerm}%` }
      };
    }

    const { count, rows: clients } = await User.findAndCountAll({
      where: whereClause,
      include: [
        { association: "rol" },
        { association: "Email" },
        { association: "Batch" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: clients,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      hasMore: page < Math.ceil(count / limit),
    });

  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener clientes",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const searchClient = async (req: any, res: any) => {
  try {
    const searchTerm = (req.query.email as string) || "";

    if (!searchTerm.trim()) {
      return res.status(400).json({
        success: false, 
        message: "El parámetro de búsqueda 'email' es requerido.",
      });
    }

    const customer = await User.findOne({
      where: {ID_Rol: 2},
      include: [
        {
          model: Email,
          as: 'Email',
          where: {
            Description: searchTerm,
          }
        },
        {
          model: Phone,
          as: 'Phone'
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado.",
      });
    }

    const facturacion = await Facturacion.findOne({
      where: { ID_User: customer.ID_User }
    });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toJSON(),
        Facturacion: facturacion || null
      }
    });
  } catch (error) {
    console.error("Error buscando cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar cliente",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const searchClientbyId = async (req: any, res: any) => {
  try {
    const searchTerm = req.params.ID_User;
    console.log("ID_User:", searchTerm);

    if (!searchTerm) {
      return res.status(400).json({
        message: "El parámetro de búsqueda 'ID_User' es requerido.",
      });
    }

    const customer = await User.findOne({
      where: { ID_User: searchTerm },
      include: [
        { model: Email, as: "Email" },
        { model: Phone, as: "Phone" },
      ],
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    const facturacion = await Facturacion.findOne({
      where: { ID_User: searchTerm },
    });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toJSON(),
        Facturacion: facturacion ?? null,
      },
    });
  } catch (error) {
    console.error("Error buscando clientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar clientes",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const deleteMultipleUsers = async (req: any, res: any) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar un arreglo de ID_User para eliminar.",
      });
    }

    console.log("Eliminando usuarios con IDs:", ids);

    await Facturacion.destroy({ where: { ID_User: ids } });

    const deleted = await User.destroy({ where: { ID_User: ids } });

    res.status(200).json({
      success: true,
      message: `Se eliminaron ${deleted} usuario(s) correctamente.`,
    });
  } catch (error) {
    console.error("Error al eliminar usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuarios.",
      error: error instanceof Error ? error.message : error,
    });
  }
};
