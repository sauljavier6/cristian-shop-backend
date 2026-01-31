// src/routes/rolRoutes.ts
import { Router } from 'express';
import { getProducts, getProductById, searchProducts, getProductsCatalogo, getRandomUniqueProductsByGender} from '../../controllers/ecommerceControllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/catalogo', getProductsCatalogo);
router.get('/searchproduct/:description', searchProducts);
router.get('/:id', getProductById);
router.get('/productsbygender/:gender', getRandomUniqueProductsByGender);

export default router;  