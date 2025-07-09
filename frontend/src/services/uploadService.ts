import { supabase } from './supabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param folder - Pasta dentro do bucket (opcional)
 * @returns Resultado do upload com URL pública ou erro
 */
export const uploadImage = async (
  file: File, 
  folder: string = 'produtos'
): Promise<UploadResult> => {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Arquivo deve ser uma imagem'
      };
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Imagem deve ter no máximo 5MB'
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    console.log('Fazendo upload da imagem:', fileName);

    // Fazer upload para o Supabase Storage
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      };
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('Upload realizado com sucesso:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error('Erro inesperado no upload:', error);
    return {
      success: false,
      error: 'Erro inesperado durante o upload'
    };
  }
};

/**
 * Remove uma imagem do Supabase Storage
 * @param imageUrl - URL completa da imagem
 * @returns Sucesso ou erro da operação
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split('/storage/v1/object/public/images/');
    if (urlParts.length !== 2) {
      console.error('URL da imagem inválida:', imageUrl);
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }

    console.log('Imagem deletada com sucesso:', filePath);
    return true;

  } catch (error) {
    console.error('Erro inesperado ao deletar imagem:', error);
    return false;
  }
};

/**
 * Comprime uma imagem antes do upload
 * @param file - Arquivo original
 * @param maxWidth - Largura máxima (padrão: 800px)
 * @param quality - Qualidade da compressão (0-1, padrão: 0.8)
 * @returns Arquivo comprimido
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 800, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Converter para blob e depois para File
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Retorna original se falhar
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
}; 