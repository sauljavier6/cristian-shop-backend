// src/routes/authRoutes.ts
import express from 'express';
import { register, login } from '../controllers/authController';
import { uploadProfile } from '../middlewares/uploadProfile';
import { resizeProfileImage } from '../middlewares/resizeImagesProfile';

const router = express.Router();

router.post('/register', uploadProfile, resizeProfileImage, register);
router.post('/login', login);

export default router;

