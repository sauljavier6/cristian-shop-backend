export const checkRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.Rol;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para esta acción"
      });
    }

    next();
  };
};
