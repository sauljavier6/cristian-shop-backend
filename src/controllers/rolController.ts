// src/controllers/rolController.ts
import Rol from '../models/Rol';

export const crearRol = async (req: any, res: any) => {
  try {
    const { Description, State } = req.body;

    if (!Description) {
      return res.status(400).json({ message: 'La descripción es obligatoria' });
    }

    const nuevoRol = await Rol.create({ Description, State });

    return res.status(201).json({
      message: 'Rol creado correctamente',
      rol: nuevoRol,
    });
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getRoles = async (req: any, res: any) => {
  try {
    const roles = await Rol.findAll();
    
    return res.status(201).json({data: roles, message: 'Succes'});
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
