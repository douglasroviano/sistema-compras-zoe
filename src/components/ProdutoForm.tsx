import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  InputAdornment,
  Card,
  CardMedia,
  CardContent,
  IconButton
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import FotoUpload from './FotoUpload';
import type { Produto, ProdutoFormData } from '../types/produto';

interface ProdutoFormProps {
  produto?: Produto | null;
  onSave: (produto: Produto) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  nome_produto?: string;
  preco_compra?: string;
  preco_venda?: string;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ 
  produto,
  onSave, 
  onCancel
}) => {
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome_produto: '',
    cor: '',
    tamanho: '',
    descricao: '',
    preco_compra: undefined,
    preco_venda: undefined,
    imposto_percentual: undefined, // Será definido pelo banco (7%)
    foto_url: '',
    observacoes: '',
    marca: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    if (produto) {
      setFormData({
        nome_produto: produto.nome_produto,
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        descricao: produto.descricao || '',
        preco_compra: produto.preco_compra,
        preco_venda: produto.preco_venda,
        imposto_percentual: produto.imposto_percentual,
        foto_url: produto.foto_url || '',
        observacoes: produto.observacoes || '',
        marca: produto.marca || '',
      });
    }
  }, [produto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Tratar campos numéricos
    if (name === 'preco_compra' || name === 'preco_venda') {
      const numericValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[name as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFotoUpload = async (url: string) => {
    setFormData(prev => ({
      ...prev,
      foto_url: url
    }));
  };

  const handleRemoveFoto = () => {
    setFormData(prev => ({
      ...prev,
      foto_url: ''
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.nome_produto.trim()) {
      newErrors.nome_produto = 'Nome do produto é obrigatório';
    }

    if (formData.preco_compra !== undefined && formData.preco_compra < 0) {
      newErrors.preco_compra = 'Preço de compra deve ser positivo';
    }

    if (formData.preco_venda !== undefined && formData.preco_venda < 0) {
      newErrors.preco_venda = 'Preço de venda deve ser positivo';
    }

    if (formData.preco_compra && formData.preco_venda && formData.preco_venda < formData.preco_compra) {
      newErrors.preco_venda = 'Preço de venda deve ser maior que o preço de compra';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMargem = () => {
    if (formData.preco_compra && formData.preco_venda) {
      return ((formData.preco_venda - formData.preco_compra) / formData.preco_compra) * 100;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        const dataToSubmit = produto ? {
          id: produto.id,
          ...formData,
        } : {
          ...formData,
        };
        
        await onSave(dataToSubmit);
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
        setError('Erro ao salvar produto');
      } finally {
        setLoading(false);
      }
    }
  };

  const margem = calculateMargem();

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações Básicas */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Informações Básicas
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="Nome do Produto"
            name="nome_produto"
            value={formData.nome_produto}
            onChange={handleChange}
            error={!!errors.nome_produto}
            helperText={errors.nome_produto}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Cor"
            name="cor"
            value={formData.cor}
            onChange={handleChange}
            placeholder="Ex: Azul, Vermelho"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Tamanho"
            name="tamanho"
            value={formData.tamanho}
            onChange={handleChange}
            placeholder="Ex: P, M, G, 36, 38"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Marca"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            placeholder="Ex: Nike, Adidas, Zara"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
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
        </Grid>

        {/* Preços */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Preços
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="Preço Gôndola (USD)"
            name="preco_compra"
            type="number"
            value={formData.preco_compra || ''}
            onChange={handleChange}
            error={!!errors.preco_compra}
            helperText={errors.preco_compra || "Sem imposto"}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{
              step: "0.01",
              min: "0"
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="Venda (BRL)"
            name="preco_venda"
            type="number"
            value={formData.preco_venda || ''}
            onChange={handleChange}
            error={!!errors.preco_venda}
            helperText={errors.preco_venda}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            inputProps={{
              step: "0.01",
              min: "0"
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="Imposto (%)"
            name="imposto_percentual"
            type="number"
            value={formData.imposto_percentual || ''}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{
              step: "0.1",
              min: "0",
              max: "100"
            }}
            helperText="Padrão: 7%"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="Margem de Lucro"
            value={`${margem.toFixed(1)}%`}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                color: margem >= 50 ? 'success.main' : margem >= 20 ? 'warning.main' : 'error.main',
                fontWeight: 600
              }
            }}
          />
        </Grid>

        {/* Foto */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Foto do Produto
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          {formData.foto_url ? (
            <Card sx={{ maxWidth: 300 }}>
              <CardMedia
                component="img"
                height="200"
                image={formData.foto_url}
                alt={formData.nome_produto}
              />
              <CardContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Foto atual
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleRemoveFoto}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <FotoUpload
              onUpload={handleFotoUpload}
              loading={uploadingFoto}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
            />
          )}
        </Grid>

        {/* Observações */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Observações
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Observações"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            multiline
            rows={3}
            placeholder="Observações adicionais sobre o produto..."
          />
        </Grid>

        {/* Botões */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || uploadingFoto}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Salvando...' : produto ? 'Atualizar' : 'Salvar'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProdutoForm; 