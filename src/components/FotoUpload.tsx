import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFotoProduto } from '../services/api';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

interface FotoUploadProps {
  onUpload: (url: string) => void;
}

const FotoUpload: React.FC<FotoUploadProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const file = acceptedFiles[0];
      const response = await uploadFotoProduto(file);
      const url = response.data.url;
      onUpload(url);
    } catch (err) {
      setError('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <Box {...getRootProps()} sx={{ border: '2px dashed #888', borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: isDragActive ? '#f0f0f0' : 'inherit' }}>
      <input {...getInputProps()} />
      {uploading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1" color="textSecondary">
            {isDragActive ? 'Solte a imagem aqui...' : 'Arraste uma foto aqui ou clique para selecionar'}
          </Typography>
          <Button variant="contained" sx={{ mt: 1 }}>Selecionar Foto</Button>
        </>
      )}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Box>
  );
};

export default FotoUpload; 