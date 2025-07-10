import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  Grid,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import ImageUpload from './ImageUpload';
import type { ProdutoVenda } from '../types/produtoVenda';

interface ProdutoFormAvancadoProps {
  produto?: ProdutoVenda | null;
  onSave: (produto: Omit<ProdutoVenda, 'id'> | ProdutoVenda) => Promise<void>;
  onCancel: () => void;
}

const ProdutoFormAvancado: React.FC<ProdutoFormAvancadoProps> = ({ 
  produto,
  onSave, 
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nome_produto: '',
    cor: '',
    tamanho: '',
    descricao: '',
    preco_compra: '',
    preco_venda: '',
    foto_url: '',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (produto) {
      setFormData({
        nome_produto: produto.nome_produto || '',
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        descricao: produto.descricao || '',
        preco_compra: produto.preco_compra?.toString() || '',
        preco_venda: produto.preco_venda?.toString() || '',
        foto_url: produto.foto_url || '',
        observacoes: produto.observacoes || '',
      });
    }
  }, [produto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (imageUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      foto_url: imageUrl || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nome_produto.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const dataToSubmit: Omit<ProdutoVenda, 'id'> | ProdutoVenda = {
        ...(produto?.id && { id: produto.id }),
        venda_id: produto?.venda_id || '', // Será definido pelo backend
        nome_produto: formData.nome_produto,
        cor: formData.cor || undefined,
        tamanho: formData.tamanho || undefined,
        descricao: formData.descricao || undefined,
        preco_compra: formData.preco_compra ? parseFloat(formData.preco_compra) : undefined,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : undefined,
        foto_url: formData.foto_url || undefined,
        observacoes: formData.observacoes || undefined,
      };
      
      console.log('Dados sendo enviados:', dataToSubmit);
      await onSave(dataToSubmit);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setError('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const calcularMargem = () => {
    const compra = parseFloat(formData.preco_compra);
    const venda = parseFloat(formData.preco_venda);
    
    if (compra && venda && compra > 0) {
      const margem = ((venda - compra) / compra) * 100;
      return margem.toFixed(1);
    }
    return null;
  };

  const margem = calcularMargem();

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Coluna Esquerda - Dados do Produto */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" gutterBottom>
            Informações do Produto
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Nome do Produto */}
            <TextField
              fullWidth
              label="Nome do Produto"
              name="nome_produto"
              value={formData.nome_produto}
              onChange={handleChange}
              required
              variant="outlined"
            />

            {/* Cor e Tamanho */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Cor"
                name="cor"
                value={formData.cor}
                onChange={handleChange}
                placeholder="Ex: Azul, Vermelho"
              />
              <TextField
                fullWidth
                label="Tamanho"
                name="tamanho"
                value={formData.tamanho}
                onChange={handleChange}
                placeholder="Ex: P, M, G"
              />
            </Box>

            {/* Descrição */}
            <TextField
              fullWidth
              label="Descrição"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Descrição detalhada do produto..."
            />

            <Divider />

            <Typography variant="h6" gutterBottom>
              Preços
            </Typography>

            {/* Preços */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Preço de Compra"
                name="preco_compra"
                type="number"
                value={formData.preco_compra}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  step: "0.01",
                  min: "0"
                }}
              />
              <TextField
                fullWidth
                label="Preço de Venda"
                name="preco_venda"
                type="number"
                value={formData.preco_venda}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  step: "0.01",
                  min: "0"
                }}
              />
            </Box>

            {/* Margem de Lucro */}
            {margem && (
              <Alert 
                severity={parseFloat(margem) >= 50 ? 'success' : parseFloat(margem) >= 20 ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              >
                <Typography variant="body2">
                  <strong>Margem de Lucro: {margem}%</strong>
                  {parseFloat(margem) < 20 && ' - Margem baixa'}
                  {parseFloat(margem) >= 20 && parseFloat(margem) < 50 && ' - Margem moderada'}
                  {parseFloat(margem) >= 50 && ' - Margem excelente'}
                </Typography>
              </Alert>
            )}

            {/* Observações */}
            <TextField
              fullWidth
              label="Observações"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Observações adicionais..."
            />
          </Box>
        </Grid>

        {/* Coluna Direita - Upload de Imagem */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" gutterBottom>
            Imagem do Produto
          </Typography>
          
          <ImageUpload
            currentImageUrl={formData.foto_url}
            onImageChange={handleImageChange}
            disabled={loading}
            maxSizeMB={5}
            compressImage={true}
          />
          
          {/* Opção Manual de URL */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ou cole uma URL de imagem:
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="URL da Imagem"
              name="foto_url"
              value={formData.foto_url}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Botões */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
          sx={{ minWidth: 140 }}
        >
          {loading ? 'Salvando...' : produto ? 'Atualizar' : 'Salvar Produto'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProdutoFormAvancado; 