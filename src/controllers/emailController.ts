// src/controllers/rolController.ts
import { Request, Response } from 'express';
import Email from '../models/Email';

export const getEmail = async (req: any, res: any) => {
  try {
    const emails = await Email.findAll();
    
    return res.status(201).json({data: emails, message: 'Succes'});
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getEmailbyId = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const email = await Email.findByPk(id);
    if (!email) {   
      return res.status(404).json({ message: 'Email no encontrado' });
    }
    return res.status(201).json({data: email, message: 'Succes'});
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
