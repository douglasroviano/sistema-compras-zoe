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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import type { Venda } from '../types/venda';
import type { Cliente } from '../types/cliente';
import type { Produto } from '../types/produto';
import { useCotacao } from '../contexts/CotacaoContext';
import { useCotacaoCalculos } from '../hooks/useCotacaoCalculos';
import CalculadoraPreco from './CalculadoraPreco';
import SugestaoPreco from './SugestaoPreco';
import axios from 'axios';

// Configuração da API
const api = axios.create({
  baseURL: '/api',
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
  preco_compra: number; // Sempre em USD
  preco_venda: number;  // Sempre em BRL
  quantidade: number;
  marca?: string;
  dolar_agora?: number; // Cotação no momento
  imposto_percentual?: number; // Padrão 7%
  is_novo?: boolean; // Flag para indicar se é um produto novo
}

interface FormErrors {
  cliente_telefone?: string;
  produtos?: string;
  metodo_pagamento?: string;
  metodo_entrega?: string;
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
  { value: 'whatsapp', label: 'Whatsapp' },
  { value: 'cancelada', label: 'Cancelada' }
];

const metodosEntrega = [
  { value: 'correios', label: 'Correios' },
  { value: 'motoboy', label: 'Motoboy' },
  { value: 'retirar_local', label: 'Retirar no Local' },
  { value: 'entrega_propria', label: 'Entrega Própria' },
  { value: 'outros', label: 'Outros' }
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
    status_venda: venda?.status_venda || 'pendente',
    data_vencimento: venda?.data_vencimento || '',
    metodo_entrega: ''
  });

  // Usar cotação do contexto global
  const { cotacao: cotacaoAtual, ultimaAtualizacao: cotacaoTimestamp } = useCotacao();
  
  // Hook para cálculos com cotação
  const { calcularCustoRealBRL } = useCotacaoCalculos();

  useEffect(() => {
    fetchClientes();
    fetchProdutos();
  }, []);

  // Carregar dados da venda quando em modo de edição
  useEffect(() => {
    if (venda && clientes.length > 0) {
      const cliente = clientes.find(c => c.telefone === venda.cliente_telefone);
      if (cliente) {
        setClienteSelecionado(cliente);
        // Carregar preferência de entrega do cliente
        setFormData(prev => ({ ...prev, metodo_entrega: cliente.preferencia_entrega || '' }));
      }
    }
  }, [venda, clientes]);

  // Carregar produtos da venda quando em modo de edição
  useEffect(() => {
    if (venda?.id) {
      fetchProdutosDaVenda(venda.id);
    }
  }, [venda]);

  const fetchProdutosDaVenda = async (vendaId: string) => {
    try {
      // Buscar produtos específicos desta venda
      const response = await api.get(`/produtos-venda?venda_id=${vendaId}`);
      const produtosDaVenda = response.data.map((produto: Produto) => ({
        produto_id: produto.id,
        nome_produto: produto.nome_produto,
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        marca: produto.marca || '',
        preco_compra: produto.preco_compra || 0,
        preco_venda: produto.preco_venda || 0,
        quantidade: produto.quantidade || 1, // Buscar quantidade do banco
        imposto_percentual: produto.imposto_percentual || 7, // Buscar imposto do banco
        is_novo: false
      }));
      setProdutosVenda(produtosDaVenda);
    } catch (error) {
      console.error('Erro ao buscar produtos da venda:', error);
      // Se não conseguir carregar produtos, deixa vazio para o usuário adicionar
      setProdutosVenda([]);
    }
  };

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
        preco_compra: produto.preco_compra || 0,
        preco_venda: produto.preco_venda || 0,
        descricao: produto.descricao || '',
        foto_url: produto.foto_url || '',
        observacoes: produto.observacoes || '',
        imposto_percentual: produto.imposto_percentual || 7 // Incluir imposto
      }));
      
      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleClienteChange = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente);
    setFormData(prev => ({
      ...prev,
      cliente_telefone: cliente?.telefone || '',
      metodo_entrega: cliente?.preferencia_entrega || '' // Adicionar preferência de entrega
    }));
  };

  const handleAddProduto = () => {
    setProdutosVenda(prev => [...prev, {
      produto_id: '',
      nome_produto: '',
      cor: '',
      tamanho: '',
      marca: '',
      preco_compra: 0,
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
              preco_compra: 0,
              preco_venda: 0,
              imposto_percentual: 7, // Padrão para produto novo
              is_novo: true
            };
          } else {
            // Produto existente selecionado
            const produtoSelecionado = produtos.find(p => p.id === String(value));
            return {
              ...produto,
              produto_id: String(value),
              nome_produto: produtoSelecionado?.nome_produto || '',
              preco_compra: produtoSelecionado?.preco_compra || 0,
              preco_venda: produtoSelecionado?.preco_venda || 0,
              cor: produtoSelecionado?.cor || '',
              tamanho: produtoSelecionado?.tamanho || '',
              marca: produtoSelecionado?.marca || '',
              imposto_percentual: produtoSelecionado?.imposto_percentual || 7,
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
    // Sempre usar o valor digitado no campo "Valor de Entrada", independente do método
    const valorEntrada = formData.valor_entrada || 0;
    return valorEntrada;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.cliente_telefone) {
      newErrors.cliente_telefone = 'Cliente é obrigatório';
    }

    if (!venda && produtosVenda.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    } else if (produtosVenda.length > 0) {
      // Validar produtos individuais
      const produtoInvalido = produtosVenda.find(produto => {
        if (produto.is_novo) {
          return !produto.nome_produto || produto.preco_compra <= 0 || produto.preco_venda <= 0;
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

      const valorTotal = calcularValorTotal();
      const valorPago = calcularValorPago();

      const vendaData: Venda = {
        cliente_telefone: formData.cliente_telefone,
        data_venda: venda?.data_venda || new Date().toISOString().split('T')[0],
        data_vencimento: formData.data_vencimento || undefined,
        metodo_pagamento: formData.metodo_pagamento || '',
        valor_total: Number(valorTotal.toFixed(2)),
        valor_pago: Number(valorPago.toFixed(2)),
        status_venda: formData.status_venda || 'pendente',
        observacoes: formData.observacoes || ''
      };

      if (venda?.id) {
        vendaData.id = venda.id;
      }

      // Dados para atualizar o cliente separadamente
      const clienteData = {
        metodo_entrega: formData.metodo_entrega,
        cliente_telefone: formData.cliente_telefone
      };

      // Usar endpoint com produtos para criação e atualização
      if (venda?.id) {
        // Atualização: usar endpoint com produtos
        const response = await api.put(`/vendas/${venda.id}/com-produtos`, {
          vendaData: { ...vendaData, ...clienteData },
          produtos: produtosVenda.map(produto => ({
            nome_produto: produto.nome_produto,
            cor: produto.cor,
            tamanho: produto.tamanho,
            marca: produto.marca,
            preco_compra: produto.preco_compra,
            preco_venda: produto.preco_venda,
            quantidade: produto.quantidade,
            dolar_agora: cotacaoAtual,
            imposto_percentual: produto.imposto_percentual || 7
          }))
        });
        await onSave(response.data);
      } else {
        // Criação: usar endpoint com produtos
        const response = await api.post('/vendas/com-produtos', {
          vendaData,
          produtos: produtosVenda.map(produto => ({
            nome_produto: produto.nome_produto,
            cor: produto.cor,
            tamanho: produto.tamanho,
            marca: produto.marca,
            preco_compra: produto.preco_compra,
            preco_venda: produto.preco_venda,
            quantidade: produto.quantidade,
            dolar_agora: cotacaoAtual,
            imposto_percentual: produto.imposto_percentual || 7
          }))
        });
        
        // Atualizar cliente separadamente se necessário
        if (clienteData.metodo_entrega && clienteData.cliente_telefone) {
          try {
            await api.put(`/clientes/${clienteData.cliente_telefone}`, {
              preferencia_entrega: clienteData.metodo_entrega
            });
          } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
          }
        }
        
        await onSave(response.data);
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      setError('Erro ao salvar a venda. Verifique os dados e tente novamente.');
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
                        label="Preço Gôndola"
                        type="number"
                        value={produto.preco_compra}
                        onChange={(e) => handleProdutoChange(index, 'preco_compra', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0 }}
                        required
                        helperText="Sem imposto"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Venda BRL"
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
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Imposto %"
                        type="number"
                        value={produto.imposto_percentual || ''}
                        onChange={(e) => handleProdutoChange(index, 'imposto_percentual', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        inputProps={{ step: 0.1, min: 0, max: 100 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Venda BRL"
                        type="number"
                        value={produto.preco_venda}
                        onChange={(e) => handleProdutoChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0 }}
                        helperText={
                          produto.preco_compra && produto.imposto_percentual 
                            ? <SugestaoPreco 
                                precoGondola={produto.preco_compra}
                                impostoPercentual={produto.imposto_percentual}
                                cotacao={cotacaoAtual}
                              />
                            : undefined
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Custo Real BRL"
                        type="number"
                        value={
                          produto.preco_compra && produto.imposto_percentual
                            ? calcularCustoRealBRL(produto.preco_compra, produto.imposto_percentual).toFixed(2)
                            : '0.00'
                        }
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          readOnly: true,
                        }}
                        disabled
                        helperText="Gôndola + Imposto × Cotação"
                      />
                    </Grid>
                    
                                        {/* Informações do dólar como texto */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        💵 USD Agora: R$ {cotacaoAtual?.toFixed(4)} - Atualizado: {cotacaoTimestamp}
                      </Typography>
                    </Grid>

                    {/* Calculadora de Margem/Markup */}
                    <Grid size={{ xs: 12 }}>
                      <CalculadoraPreco 
                        precoGondola={produto.preco_compra}
                        impostoPercentual={produto.imposto_percentual || 7}
                        cotacao={cotacaoAtual}
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
                    
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Preço Gôndola"
                        type="number"
                        value={produto.preco_compra}
                        onChange={(e) => handleProdutoChange(index, 'preco_compra', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0 }}
                        helperText="Sem imposto"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Venda BRL"
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
                    
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        fullWidth
                        label="Imposto %"
                        type="number"
                        value={produto.imposto_percentual || ''}
                        onChange={(e) => handleProdutoChange(index, 'imposto_percentual', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        inputProps={{ step: 0.1, min: 0, max: 100 }}
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
            <InputLabel>Método de Entrega</InputLabel>
            <Select
              value={formData.metodo_entrega}
              label="Método de Entrega"
              onChange={(e) => setFormData(prev => ({ ...prev, metodo_entrega: e.target.value }))}
            >
              {metodosEntrega.map((metodo) => (
                <MenuItem key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Status da Venda</InputLabel>
            <Select
              value={formData.status_venda}
              label="Status da Venda"
              onChange={(e) => setFormData(prev => ({ ...prev, status_venda: e.target.value as 'pendente' | 'despachada' | 'entregue' | 'whatsapp' | 'cancelada' }))}
            >
              {statusVenda.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Data de Vencimento"
              value={formData.data_vencimento ? new Date(formData.data_vencimento) : null}
              onChange={(newValue) => {
                setFormData(prev => ({ 
                  ...prev, 
                  data_vencimento: newValue ? newValue.toISOString().split('T')[0] : ''
                }));
              }}
              minDate={new Date()} // Não permitir datas passadas
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: "📅 Data limite para pagamento da parcela",
                  variant: "outlined"
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
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
              disabled={loading || (!venda && produtosVenda.length === 0)}
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