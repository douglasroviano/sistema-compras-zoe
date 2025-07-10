import { Router } from 'express';
import multer from 'multer';
import { uploadFotoProduto } from '../controllers/uploadController';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/foto-produto', upload.single('file'), uploadFotoProduto);

export default router; 