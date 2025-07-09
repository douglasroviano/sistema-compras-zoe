import { Request, Response } from 'express';
import { uploadImage } from '../services/storageService';

export const uploadFotoProduto = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    return;
  }
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;
  const path = await uploadImage(fileBuffer, fileName);
  if (!path) {
    res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
    return;
  }
  res.status(201).json({ url: path });
}; 