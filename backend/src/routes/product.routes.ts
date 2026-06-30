import { Router } from 'express'
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductPhoto,
} from '../controllers/product.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

router.get('/', listProducts)
router.get('/:id', getProductById)

router.post('/', authenticate, requireRole('PRO'), createProduct)
router.put('/:id', authenticate, requireRole('PRO'), updateProduct)
router.delete('/:id', authenticate, requireRole('PRO'), deleteProduct)
router.post('/:id/photo', authenticate, requireRole('PRO'), upload.single('photo'), uploadProductPhoto)

export default router
