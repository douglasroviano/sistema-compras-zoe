import { Router } from 'express';
import multer from 'multer';
import { uploadFotoProduto } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/foto-produto', upload.single('file'), uploadFotoProduto);

export default router; 