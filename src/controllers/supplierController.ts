import Email from "../models/Email";
import Phone from "../models/Phone";
import User from "../models/User";
import { Op } from "sequelize";

export const createSupplier = async (req: any, res: any) => {
  try {
    const { Name, Phone: phoneValue, Email: emailValue } = req.body;

    const existingEmail = await Email.findOne({ where: { Description: emailValue } });
    if (existingEmail) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const existingPhone = await Phone.findOne({ where: { Description: phoneValue } });
    if (existingPhone) {
      return res.status(400).json({ message: "El teléfono ya está registrado" });
    }

    const emailCreated = await Email.create({
      Description: emailValue,
      State: true,
    });

    const phoneCreated = await Phone.create({
      Description: phoneValue,
      State: true,
    });

    const newUser = await User.create({
      Name,
      ID_Rol: 3,
      ID_Email: emailCreated.ID_Email,
      ID_Phone: phoneCreated.ID_Phone,
      Imagen: '',
      Password: '',
      State: true,
    });

    res.status(201).json({
      message: 'Registro completado',
      data: newUser
    });

  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      message: 'Error al crear proveedor',
      error,
    });
  }
};

export const getSuppliers = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = (req.query.searchTerm || "").toString().trim();

    let whereClause: any = {
      ID_Rol: 3,     // Proveedores
      State: true,
    };

    // 🔎 Búsqueda por nombre
    if (searchTerm) {
      whereClause = {
        ...whereClause,
        Name: {
          [Op.iLike]: `${searchTerm}%`,
        },
      };
    }

    const { count, rows: suppliers } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Email,
          attributes: ["ID_Email", "Description"],
        },
        {
          model: Phone,
          attributes: ["ID_Phone", "Description"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true, // ⚠️ MUY importante con includes
    });

    res.status(200).json({
      success: true,
      data: suppliers,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      hasMore: page < Math.ceil(count / limit),
    });

  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedores",
      error: error instanceof Error ? error.message : error,
    });
  }
};



export const deleteSuppliers = async (req:any, res:any) => {
  const { ids } = req.body;

  try {

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron IDs válidos' });
    }

    await User.destroy({
      where: {
        ID_User: ids,
        ID_Rol:3
      }
    });

    res.json({ message: 'Proveedores eliminados correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error eliminando proveedor' });
  }
};


export const getSupplierById = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const product = await User.findByPk(id, {
      include: [
        { model: Email },
        { model: Phone }
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};


export const updateUser = async (req: any, res: any) => {
  const { 
    ID_User, 
    Name, 
    Email: emailValue, 
    Phone: phoneValue, 
    Imagen, 
    State 
  } = req.body;

  try {
    const user = await User.findByPk(ID_User, {
      include: [Email, Phone],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await user.update({
      Name,
      Imagen,
      State: State ?? true,
    });

    if (emailValue && user.ID_Email) {
      const existingEmail = await Email.findByPk(user.ID_Email);
      if (existingEmail) {
        await existingEmail.update({ Description: emailValue });
      }
    }

    if (phoneValue && user.ID_Phone) {
      const existingPhone = await Phone.findByPk(user.ID_Phone);
      if (existingPhone) {
        await existingPhone.update({ Description: phoneValue });
      }
    }

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      data: user,
    });

  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      message: "Error del servidor",
      error,
    });
  }
};

export const searchSupplier = async (req: any, res: any) => {
  console.log('entro al endpoint')
  try {
    const searchTerm = (req.query.email as string) || "";

    if (!searchTerm.trim()) {
      return res.status(400).json({
        success: false, 
        message: "El parámetro de búsqueda 'email' es requerido.",
      });
    }

    const customer = await User.findOne({
      where: {ID_Rol: 3},
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
        message: "Proveedor no encontrado.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...customer.toJSON()
      }
    });
  } catch (error) {
    console.error("Error buscando proveedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar proveedor",
      error: error instanceof Error ? error.message : error,
    });
  }
};