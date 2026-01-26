import Iva from "../models/Iva";

export const getIva = async (req: any, res: any) => {
  try {
    const iva = await Iva.findAll();
    
    return res.status(201).json({data: iva, message: 'Succes'});
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
