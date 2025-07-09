import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function uploadImage(file: Buffer, fileName: string, bucket: string = 'fotos-produtos'): Promise<string | null> {
  const ext = path.extname(fileName);
  const newFileName = `${uuidv4()}${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(newFileName, file, {
    contentType: 'image/jpeg', // ajuste conforme necessário
    upsert: false,
  });
  if (error) {
    console.error('Erro ao fazer upload da imagem:', error.message);
    return null;
  }
  return data?.path || null;
} 