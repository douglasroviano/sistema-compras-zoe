import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Avatar,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { uploadImage, deleteImage, compressImage } from '../services/uploadService';
import type { UploadResult } from '../services/uploadService';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  compressImage?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  disabled = false,
  maxSizeMB = 5,
  compressImage: shouldCompress = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Validações básicas
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`Imagem deve ter no máximo ${maxSizeMB}MB`);
      }

      // Criar preview local
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setUploadProgress(25);

      // Comprimir imagem se necessário
      let fileToUpload = file;
      if (shouldCompress && file.size > 1024 * 1024) { // Comprimir se > 1MB
        console.log('Comprimindo imagem...');
        fileToUpload = await compressImage(file, 800, 0.8);
        setUploadProgress(50);
      }

      setUploadProgress(75);

      // Fazer upload
      const result: UploadResult = await uploadImage(fileToUpload, 'produtos');
      
      if (result.success && result.url) {
        console.log('Upload concluído:', result.url);
        setPreview(result.url);
        onImageChange(result.url);
        setUploadProgress(100);
        
        // Limpar progresso após sucesso
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(result.error || 'Erro no upload');
      }

    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err instanceof Error ? err.message : 'Erro no upload');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      // Limpar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // Se é uma URL do Supabase, tentar deletar
      if (preview.includes('supabase') && preview !== currentImageUrl) {
        await deleteImage(preview);
      }
      
      setPreview(null);
      onImageChange(null);
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPreview(currentImageUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card sx={{ maxWidth: 300 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Foto do Produto
        </Typography>

        {/* Preview da Imagem */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            src={preview || undefined}
            sx={{ 
              width: 120, 
              height: 120,
              bgcolor: 'grey.200',
              border: '2px dashed',
              borderColor: preview ? 'transparent' : 'grey.400'
            }}
          >
            {!preview && <PhotoIcon sx={{ fontSize: 40, color: 'grey.500' }} />}
          </Avatar>
        </Box>

        {/* Barra de Progresso */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {uploadProgress < 25 && 'Preparando...'}
              {uploadProgress >= 25 && uploadProgress < 50 && 'Processando...'}
              {uploadProgress >= 50 && uploadProgress < 75 && 'Comprimindo...'}
              {uploadProgress >= 75 && uploadProgress < 100 && 'Enviando...'}
              {uploadProgress === 100 && 'Concluído!'}
            </Typography>
          </Box>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, fontSize: '0.875rem' }}
            action={
              <IconButton size="small" onClick={handleRetry}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Botões de Ação */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={disabled || uploading}
            aria-label="Selecionar arquivo de imagem"
          />
          
          <Tooltip title="Selecionar imagem">
            <Button
              variant={preview ? 'outlined' : 'contained'}
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              size="small"
            >
              {preview ? 'Trocar' : 'Enviar'}
            </Button>
          </Tooltip>

          {preview && (
            <Tooltip title="Remover imagem">
              <IconButton
                color="error"
                onClick={handleRemoveImage}
                disabled={disabled || uploading}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Informações */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Máximo {maxSizeMB}MB • JPG, PNG, WebP
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ImageUpload; 