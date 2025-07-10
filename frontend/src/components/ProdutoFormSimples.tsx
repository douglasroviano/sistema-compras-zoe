import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  AttachMoney as MoneyIcon
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
}

interface ProdutoFormSimplesProps {
  produto?: ProdutoSimples | null;
  onSave: (produto: any) => Promise<void>;
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
        foto_url: (produto as any).foto_url || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nome_produto.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const dataToSubmit: any = {
        nome_produto: formData.nome_produto,
        cor: formData.cor || null,
        tamanho: formData.tamanho || null,
        descricao: formData.descricao || null,
        preco_compra: formData.preco_compra ? parseFloat(formData.preco_compra) : null,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : null,
        foto_url: formData.foto_url || null,
        observacoes: formData.observacoes || null,
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
          rows={2}
          placeholder="Descrição do produto..."
        />

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