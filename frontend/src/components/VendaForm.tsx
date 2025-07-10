import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  Alert,
  Autocomplete,
  Card,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import type { Venda } from '../types/venda';
import type { Cliente } from '../types/cliente';
import type { Produto } from '../types/produto';
import axios from 'axios';

// Configuração da API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

interface VendaFormProps {
  venda?: Venda | null;
  onSave: (venda: Venda) => Promise<void>;
  onCancel: () => void;
}

interface ProdutoVenda {
  produto_id: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  preco_venda: number;
  quantidade: number;
  marca?: string; // Novo campo
  is_novo?: boolean; // Flag para indicar se é um produto novo
}

interface FormErrors {
  cliente_telefone?: string;
  produtos?: string;
  metodo_pagamento?: string;
}

const formasPagamento = [
  { value: 'cartao_100', label: 'Cartão 100%' },
  { value: 'pix_30_resto_entrega', label: 'PIX 30% + Resto na Entrega' },
  { value: 'pix_100', label: 'PIX 100%' },
  { value: 'dinheiro', label: 'Dinheiro' }
];

const statusVenda = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'despachada', label: 'Despachada' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelada', label: 'Cancelada' }
];

const VendaForm: React.FC<VendaFormProps> = ({ venda, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Estados para dados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosVenda, setProdutosVenda] = useState<ProdutoVenda[]>([]);
  
  const [formData, setFormData] = useState({
    cliente_telefone: venda?.cliente_telefone || '',
    metodo_pagamento: venda?.metodo_pagamento || '',
    observacoes: venda?.observacoes || '',
    valor_entrada: 0, // Campo local para cálculos
    status_venda: venda?.status_venda || 'pendente'
  });

  useEffect(() => {
    fetchClientes();
    fetchProdutos();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await api.get('/produtos-venda');
      // Usar todos os produtos disponíveis
      const produtosFormatados = response.data.map((produto: Produto) => ({
        id: produto.id,
        nome_produto: produto.nome_produto,
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        marca: produto.marca || '',
        preco_venda: produto.preco_venda || 0,
        preco_compra: produto.preco_compra || 0,
        descricao: produto.descricao || '',
        foto_url: produto.foto_url || '',
        observacoes: produto.observacoes || ''
      }));
      
      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const salvarProdutoNovo = async (produtoData: {
    nome_produto: string;
    cor?: string;
    tamanho?: string;
    marca?: string;
    preco_venda: number;
  }) => {
    try {
      // Criar produto como produto_venda sem venda_id ainda
      const produtoVendaData = {
        ...produtoData,
        venda_id: null, // Será atualizado depois
        preco_compra: produtoData.preco_venda * 0.7, // Estimativa para margem
      };

      const response = await api.post('/produtos-venda', produtoVendaData);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error;
    }
  };

  const handleClienteChange = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente);
    setFormData(prev => ({
      ...prev,
      cliente_telefone: cliente?.telefone || ''
    }));
  };

  const handleAddProduto = () => {
    setProdutosVenda(prev => [...prev, {
      produto_id: '',
      nome_produto: '',
      cor: '',
      tamanho: '',
      marca: '',
      preco_venda: 0,
      quantidade: 1,
      is_novo: false
    }]);
  };

  const handleRemoveProduto = (index: number) => {
    setProdutosVenda(prev => prev.filter((_, i) => i !== index));
  };

  const handleProdutoChange = (index: number, field: keyof ProdutoVenda, value: string | number) => {
    setProdutosVenda(prev => prev.map((produto, i) => {
      if (i === index) {
        if (field === 'produto_id') {
          if (String(value) === 'novo_produto') {
            // Ativar modo de criação de produto novo
            return {
              ...produto,
              produto_id: 'novo_produto',
              nome_produto: '',
              preco_venda: 0,
              is_novo: true
            };
          } else {
            // Produto existente selecionado
            const produtoSelecionado = produtos.find(p => p.id === String(value));
            return {
              ...produto,
              produto_id: String(value),
              nome_produto: produtoSelecionado?.nome_produto || '',
              preco_venda: produtoSelecionado?.preco_venda || 0,
              cor: produtoSelecionado?.cor || '',
              tamanho: produtoSelecionado?.tamanho || '',
              marca: produtoSelecionado?.marca || '',
              is_novo: false
            };
          }
        }
        return { ...produto, [field]: value };
      }
      return produto;
    }));
  };

  const calcularValorTotal = () => {
    return produtosVenda.reduce((total, produto) => {
      return total + (produto.preco_venda * produto.quantidade);
    }, 0);
  };

  const calcularValorPago = () => {
    const valorTotal = calcularValorTotal();
    const valorEntrada = formData.valor_entrada || 0;
    
    switch (formData.metodo_pagamento) {
      case 'cartao_100':
      case 'pix_100':
        return valorTotal;
      case 'pix_30_resto_entrega':
        return Math.max(valorEntrada, valorTotal * 0.3);
      case 'dinheiro':
        return valorEntrada;
      default:
        return valorEntrada;
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.cliente_telefone) {
      newErrors.cliente_telefone = 'Cliente é obrigatório';
    }

    if (produtosVenda.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    } else {
      // Validar produtos individuais
      const produtoInvalido = produtosVenda.find(produto => {
        if (produto.is_novo) {
          return !produto.nome_produto || produto.preco_venda <= 0;
        }
        return !produto.produto_id || produto.produto_id === '' || produto.produto_id === 'novo_produto';
      });

      if (produtoInvalido) {
        newErrors.produtos = 'Complete todos os dados dos produtos';
      }
    }

    if (!formData.metodo_pagamento) {
      newErrors.metodo_pagamento = 'Forma de pagamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primeiro, criar produtos novos se necessário
      const produtosProcessados = await Promise.all(
        produtosVenda.map(async (produto) => {
          if (produto.is_novo && produto.nome_produto) {
            // Criar produto novo
            const novoProduto = await salvarProdutoNovo({
              nome_produto: produto.nome_produto,
              cor: produto.cor,
              tamanho: produto.tamanho,
              marca: produto.marca,
              preco_venda: produto.preco_venda
            });
            
            // Atualizar lista de produtos local
            setProdutos(prev => [...prev, novoProduto]);
            
            return {
              ...produto,
              produto_id: novoProduto.id,
              is_novo: false
            };
          }
          return produto;
        })
      );

      // Atualizar estado com produtos processados
      setProdutosVenda(produtosProcessados);

      const valorTotal = calcularValorTotal();
      const valorPago = calcularValorPago();

      const vendaData: Venda = {
        cliente_telefone: formData.cliente_telefone,
        data_venda: venda?.data_venda || new Date().toISOString().split('T')[0], // Formato de data YYYY-MM-DD
        metodo_pagamento: formData.metodo_pagamento || '',
        valor_total: Number(valorTotal.toFixed(2)),
        valor_pago: Number(valorPago.toFixed(2)),
        status_venda: formData.status_venda || 'pendente',
        observacoes: formData.observacoes || ''
      };

      // Adicionar ID apenas se for edição
      if (venda?.id) {
        vendaData.id = venda.id;
      }

      await onSave(vendaData);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      setError('Erro ao salvar venda');
    } finally {
      setLoading(false);
    }
  };

  const valorTotal = calcularValorTotal();
  const valorPago = calcularValorPago();
  const valorDevendo = valorTotal - valorPago;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Seleção de Cliente */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Cliente
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Autocomplete
            options={clientes}
            getOptionLabel={(cliente) => `${cliente.nome} - ${cliente.telefone}`}
            value={clienteSelecionado}
            onChange={(_, value) => handleClienteChange(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecione o Cliente"
                error={!!errors.cliente_telefone}
                helperText={errors.cliente_telefone}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            renderOption={(props, cliente) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box>
                    <Typography variant="subtitle2">{cliente.nome}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cliente.telefone} - {cliente.cidade}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />
        </Grid>

        {/* Produtos */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Produtos
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddProduto}
              size="small"
            >
              Adicionar Produto
            </Button>
          </Box>
          
          {errors.produtos && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.produtos}
            </Alert>
          )}
        </Grid>

        {produtosVenda.map((produto, index) => (
          <Grid size={{ xs: 12 }} key={index}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Produto {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveProduto(index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                {produto.is_novo ? (
                  // Formulário para produto novo
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Criando produto novo - preencha os dados abaixo
                      </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth
                        label="Nome do Produto"
                        value={produto.nome_produto}
                        onChange={(e) => handleProdutoChange(index, 'nome_produto', e.target.value)}
                        placeholder="Digite o nome do produto"
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Quantidade"
                        type="number"
                        value={produto.quantidade}
                        onChange={(e) => handleProdutoChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Preço Unit."
                        type="number"
                        value={produto.preco_venda}
                        onChange={(e) => handleProdutoChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0 }}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Cor"
                        value={produto.cor}
                        onChange={(e) => handleProdutoChange(index, 'cor', e.target.value)}
                        placeholder="Ex: Azul"
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Tamanho"
                        value={produto.tamanho}
                        onChange={(e) => handleProdutoChange(index, 'tamanho', e.target.value)}
                        placeholder="Ex: P, M, G"
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={produto.marca}
                        onChange={(e) => handleProdutoChange(index, 'marca', e.target.value)}
                        placeholder="Ex: Nike"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleProdutoChange(index, 'produto_id', '')}
                        size="small"
                      >
                        ← Voltar para Lista de Produtos
                      </Button>
                    </Grid>
                  </>
                ) : (
                  // Formulário para produto existente
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <FormControl fullWidth>
                          <InputLabel>Produto</InputLabel>
                          <Select
                            value={produto.produto_id}
                            label="Produto"
                            onChange={(e) => handleProdutoChange(index, 'produto_id', e.target.value)}
                          >
                            <MenuItem value="novo_produto" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              + Criar Produto Novo
                            </MenuItem>
                            {produtos.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.nome_produto} - R$ {p.preco_venda?.toFixed(2)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        fullWidth
                        label="Quantidade"
                        type="number"
                        value={produto.quantidade}
                        onChange={(e) => handleProdutoChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        fullWidth
                        label="Preço Unit."
                        type="number"
                        value={produto.preco_venda}
                        onChange={(e) => handleProdutoChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0 }}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Cor"
                        value={produto.cor}
                        onChange={(e) => handleProdutoChange(index, 'cor', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Tamanho"
                        value={produto.tamanho}
                        onChange={(e) => handleProdutoChange(index, 'tamanho', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={produto.marca}
                        onChange={(e) => handleProdutoChange(index, 'marca', e.target.value)}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Card>
          </Grid>
        ))}

        {/* Pagamento */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Pagamento
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth error={!!errors.metodo_pagamento}>
            <InputLabel>Forma de Pagamento</InputLabel>
            <Select
              value={formData.metodo_pagamento}
              label="Forma de Pagamento"
              onChange={(e) => setFormData(prev => ({ ...prev, metodo_pagamento: e.target.value }))}
            >
              {formasPagamento.map((forma) => (
                <MenuItem key={forma.value} value={forma.value}>
                  {forma.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Valor de Entrada"
            type="number"
            value={formData.valor_entrada}
            onChange={(e) => setFormData(prev => ({ ...prev, valor_entrada: parseFloat(e.target.value) || 0 }))}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            inputProps={{ step: 0.01, min: 0 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Status da Venda</InputLabel>
            <Select
              value={formData.status_venda}
              label="Status da Venda"
              onChange={(e) => setFormData(prev => ({ ...prev, status_venda: e.target.value as 'pendente' | 'despachada' | 'entregue' | 'cancelada' }))}
            >
              {statusVenda.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Resumo */}
        {valorTotal > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Resumo da Venda
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Valor Total:</Typography>
                <Typography sx={{ fontWeight: 600 }}>R$ {valorTotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Valor Pago:</Typography>
                <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                  R$ {valorPago.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Valor Devendo:</Typography>
                <Typography sx={{ fontWeight: 600, color: valorDevendo > 0 ? 'error.main' : 'success.main' }}>
                  R$ {valorDevendo.toFixed(2)}
                </Typography>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Observações */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Observações"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            multiline
            rows={3}
            placeholder="Observações sobre a venda..."
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
              disabled={loading || produtosVenda.length === 0}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Salvando...' : venda ? 'Atualizar' : 'Salvar Venda'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendaForm; 