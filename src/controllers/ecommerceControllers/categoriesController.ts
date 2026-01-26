import { Request, Response } from 'express';
import Category from '../../models/Category';


export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll();

    res.status(200).json({
      message: 'Categorías obtenidas exitosamente',
      data: categories,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};