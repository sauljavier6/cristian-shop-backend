// middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    req.user = user;
    next();
  });
};


export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: any, next: Function) => {
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
    }

    next();
  };
};
