import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider
} from '@mui/material';
import {
  LocalOffer as BrandIcon,
  Percent as PercentIcon,
  CurrencyExchange as ExchangeIcon
} from '@mui/icons-material';

interface ProdutoSimples {
  id?: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  descricao?: string;
  preco_compra?: number;
  preco_venda?: number;
  observacoes?: string;
  marca?: string;
  imposto_percentual?: number;
  dolar_agora?: number;
  quantidade?: number;
  is_novo?: boolean;
  foto_url?: string;
  created_at?: string;
}

interface ProdutoFormSimplesProps {
  produto?: ProdutoSimples | null;
  onSave: (produto: ProdutoSimples) => Promise<void>;
  onCancel: () => void;
}

const ProdutoFormSimples: React.FC<ProdutoFormSimplesProps> = ({ 
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
    marca: '',
    imposto_percentual: '',
    dolar_agora: '',
    quantidade: '',
    is_novo: false,
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
        marca: produto.marca || '',
        imposto_percentual: produto.imposto_percentual?.toString() || '',
        dolar_agora: produto.dolar_agora?.toString() || '',
        quantidade: produto.quantidade?.toString() || '1',
        is_novo: produto.is_novo || false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nome_produto.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const dataToSubmit: ProdutoSimples = {
        nome_produto: formData.nome_produto,
        cor: formData.cor || undefined,
        tamanho: formData.tamanho || undefined,
        descricao: formData.descricao || undefined,
        preco_compra: formData.preco_compra ? parseFloat(formData.preco_compra) : undefined,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : undefined,
        foto_url: formData.foto_url || undefined,
        observacoes: formData.observacoes || undefined,
        marca: formData.marca || undefined,
        imposto_percentual: formData.imposto_percentual ? parseFloat(formData.imposto_percentual) : undefined,
        dolar_agora: formData.dolar_agora ? parseFloat(formData.dolar_agora) : undefined,
        quantidade: formData.quantidade ? parseInt(formData.quantidade) : undefined,
        is_novo: formData.is_novo,
      };

      // Se é edição, inclui o ID
      if (produto?.id) {
        dataToSubmit.id = produto.id;
      }
      
      console.log('Dados sendo enviados:', dataToSubmit);
      await onSave(dataToSubmit);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setError('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Nome do Produto */}
        <TextField
          fullWidth
          label="Nome do Produto"
          name="nome_produto"
          value={formData.nome_produto}
          onChange={handleChange}
          required
        />

        {/* Cor, Tamanho e Marca */}
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
          <TextField
            fullWidth
            label="Marca"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            placeholder="Ex: Nike, Adidas"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BrandIcon />
                </InputAdornment>
              ),
            }}
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
          rows={2}
          placeholder="Descrição do produto..."
        />

        {/* Preços */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Preço de Compra (USD)"
            name="preco_compra"
            type="number"
            value={formData.preco_compra}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  $
                </InputAdornment>
              ),
            }}
            inputProps={{
              step: "0.01",
              min: "0"
            }}
            helperText="Sem imposto"
          />
          <TextField
            fullWidth
            label="Preço de Venda (BRL)"
            name="preco_venda"
            type="number"
            value={formData.preco_venda}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  R$
                </InputAdornment>
              ),
            }}
            inputProps={{
              step: "0.01",
              min: "0"
            }}
            helperText="Preço final ao cliente"
          />
        </Box>

        {/* Divisor - Dados Financeiros */}
        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Dados Financeiros e Técnicos
          </Typography>
        </Divider>

        {/* Imposto, Cotação e Quantidade */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Imposto (%)"
            name="imposto_percentual"
            type="number"
            value={formData.imposto_percentual}
            onChange={handleChange}
            placeholder="7"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PercentIcon />
                </InputAdornment>
              ),
            }}
            inputProps={{
              step: "0.1",
              min: "0",
              max: "100"
            }}
            helperText="Percentual de imposto aplicado"
          />
          <TextField
            fullWidth
            label="Cotação USD"
            name="dolar_agora"
            type="number"
            value={formData.dolar_agora}
            onChange={handleChange}
            placeholder="5.44"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ExchangeIcon />
                </InputAdornment>
              ),
            }}
            inputProps={{
              step: "0.0001",
              min: "0"
            }}
            helperText="Cotação do dólar no momento"
          />
          <TextField
            fullWidth
            label="Quantidade"
            name="quantidade"
            type="number"
            value={formData.quantidade}
            onChange={handleChange}
            placeholder="1"
            inputProps={{
              step: "1",
              min: "1"
            }}
            helperText="Quantidade do produto"
          />
        </Box>

        {/* Produto Novo */}
        <FormControlLabel
          control={
            <Checkbox
              name="is_novo"
              checked={formData.is_novo}
              onChange={(e) => setFormData(prev => ({ ...prev, is_novo: e.target.checked }))}
              color="primary"
            />
          }
          label="Produto Novo"
        />

        {/* URL da Foto */}
        <TextField
          fullWidth
          label="URL da Foto (opcional)"
          name="foto_url"
          value={formData.foto_url || ''}
          onChange={handleChange}
          placeholder="https://exemplo.com/foto.jpg"
          helperText="Cole aqui o link de uma imagem da internet"
        />

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

        {/* Data de Criação (readonly) */}
        {produto?.created_at && (
          <TextField
            fullWidth
            label="Data de Criação"
            value={new Date(produto.created_at).toLocaleString('pt-BR')}
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          />
        )}

        {/* Botões */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
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
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Salvando...' : produto ? 'Atualizar' : 'Salvar'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProdutoFormSimples; 