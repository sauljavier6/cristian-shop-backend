import fs from "fs";
import path from "path";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

export const resizeImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return next();
    }

    const files = req.files as Express.Multer.File[];

    const uploadDir = path.join(__dirname, "../../uploads/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await Promise.all(
      files.map(async (file) => {
        const uniqueName = `Imagen-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const outputPath = path.join(uploadDir, uniqueName);

        await sharp(file.buffer)
          .resize(1600, 900, { 
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toFormat("webp", { quality: 80 })
          .toFile(outputPath);

        file.filename = uniqueName;
        file.path = outputPath;
      })
    );

    next();
  } catch (error) {
    console.error("Error en resizeImages:", error);
    next(error);
  }
};
