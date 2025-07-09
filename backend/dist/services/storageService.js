"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
const supabaseClient_1 = require("./supabaseClient");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
async function uploadImage(file, fileName, bucket = 'fotos-produtos') {
    const ext = path_1.default.extname(fileName);
    const newFileName = `${(0, uuid_1.v4)()}${ext}`;
    const { data, error } = await supabaseClient_1.supabase.storage.from(bucket).upload(newFileName, file, {
        contentType: 'image/jpeg', // ajuste conforme necessário
        upsert: false,
    });
    if (error) {
        console.error('Erro ao fazer upload da imagem:', error.message);
        return null;
    }
    return data?.path || null;
}
