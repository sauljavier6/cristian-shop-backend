import { Request, Response } from 'express';
import Category from '../models/Category';

export const postCategory = async (req: Request, res: Response) => {
  const { Description, Genero } = req.body;

  try {
    const newCategory = await Category.create({
      Description,
      Genero,
      State: true,
    });

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      data: newCategory,
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};


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