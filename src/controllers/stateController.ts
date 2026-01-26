// src/controllers/stateController.ts
import { Request, Response } from 'express';
import State from '../models/State';

export const getStates = async (_req: Request, res: Response) => {
  try {
    const states = await State.findAll();
    res.json(states);
  } catch (error) {
    console.error('Error al obtener los estados:', error);
    res.status(500).json({ message: 'Error al obtener los estados' });
  }
};
