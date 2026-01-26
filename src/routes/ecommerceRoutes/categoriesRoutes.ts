// src/routes/rolRoutes.ts
import { Router } from 'express';
import { getCategories } from '../../controllers/ecommerceControllers/categoriesController';

const router = Router();

//router.post('/', postCategory);
router.get('/', getCategories);

export default router;