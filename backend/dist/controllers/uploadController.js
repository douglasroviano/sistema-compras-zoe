"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFotoProduto = void 0;
const storageService_1 = require("../services/storageService");
const uploadFotoProduto = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
    }
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const path = await (0, storageService_1.uploadImage)(fileBuffer, fileName);
    if (!path) {
        res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
        return;
    }
    res.status(201).json({ url: path });
};
exports.uploadFotoProduto = uploadFotoProduto;
