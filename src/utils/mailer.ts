// src/utils/mailer.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.tu-servidor.com',
  port: 587,
  secure: false,
  auth: {
    user: 'tu-correo@dominio.com',
    pass: 'tu-contraseña',
  },
});
