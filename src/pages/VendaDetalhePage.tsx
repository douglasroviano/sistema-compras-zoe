import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Skeleton,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import { useCotacao } from '../contexts/CotacaoContext';
import { getVendas, getProdutos } from '../services/api';

interface ProdutoVenda {
  id: string;
  nome_produto: string;
  cor?: string;
  tamanho?: string;
  marca?: string;
  preco_compra: number;
  preco_venda: number;
  quantidade: number;
  venda_id: string;
  imposto_percentual?: number;
  dolar_agora?: number;
}

interface Venda {
  id: string;
  data_venda: string;
  cliente_nome: string;
  cliente_telefone: string;
  metodo_entrega: string;
  valor_total?: number;
  valor_pago?: number;
  valor_pendente?: number;
  status?: string;
  observacoes?: string;
  produtos: ProdutoVenda[];
}

const VendaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cotacao } = useCotacao();

  useEffect(() => {
    if (id) {
      fetchVenda(id);
    }
  }, [id]);

  const fetchVenda = async (vendaId: string) => {
    try {
      setLoading(true);
      
      // Buscar todas as vendas usando o serviço de API
      const vendasResponse = await getVendas();
      const todasVendas = vendasResponse.data;
      
      // Encontrar a venda específica
      const vendaEncontrada = todasVendas.find((v: Venda) => v.id === vendaId);
      if (!vendaEncontrada) {
        throw new Error('Venda não encontrada');
      }
      
      // Buscar produtos da venda usando o serviço de API
      const produtosResponse = await getProdutos();
      const todosProdutos = produtosResponse.data;
      
      // Filtrar produtos desta venda
      const produtosVenda = todosProdutos.filter((produto: ProdutoVenda) => 
        produto.venda_id === vendaId
      );
      
      // Calcular valor pendente
      const valorPendente = (vendaEncontrada.valor_total || 0) - (vendaEncontrada.valor_pago || 0);
      
      // Combinar venda com produtos
      const vendaCompleta = {
        ...vendaEncontrada,
        produtos: produtosVenda,
        valor_pendente: valorPendente
      };
      
      setVenda(vendaCompleta);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      setError('Erro ao carregar venda. Verificar se o ID está correto.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatUSD = (value?: number) => {
    if (value === undefined || value === null) return '$ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const calcularDadosVenda = () => {
    if (!venda || !venda.produtos) return null;
    
    let custoTotalUSD = 0;
    let margemTotalBRL = 0;
    let custoComImpostoUSD = 0;
    let custoComImpostoBRL = 0;
    
    venda.produtos.forEach(produto => {
      const custoUSD = (produto.preco_compra || 0) * (produto.quantidade || 1);
      const impostoPercentual = (produto.imposto_percentual || 7) / 100;
      const custoComImpostoUnitario = custoUSD * (1 + impostoPercentual);
      
      // Usar cotação histórica do produto (dolar_agora) se disponível, senão usar cotação atual
      const cotacaoUsada = produto.dolar_agora || cotacao || 5.20;
      const custoComImpostoBRLProduto = custoComImpostoUnitario * cotacaoUsada;
      
      const vendaBRL = (produto.preco_venda || 0) * (produto.quantidade || 1);
      
      custoTotalUSD += custoUSD;
      custoComImpostoUSD += custoComImpostoUnitario;
      custoComImpostoBRL += custoComImpostoBRLProduto;
      margemTotalBRL += vendaBRL - custoComImpostoBRLProduto;
    });
    
    const vendaTotalBRL = venda.valor_total || 0;
    
    // Usar cotação média ponderada dos produtos para conversão final
    let cotacaoMedia = cotacao || 5.20;
    if (venda.produtos.length > 0) {
      const cotacaoValida = venda.produtos.find(p => p.dolar_agora)?.dolar_agora;
      if (cotacaoValida) {
        cotacaoMedia = cotacaoValida;
      }
    }
    
    const vendaTotalUSD = vendaTotalBRL / cotacaoMedia;
    
    // Calcular margem sobre VENDA (fórmula correta)
    const margemPercentual = vendaTotalBRL > 0 ? (margemTotalBRL / vendaTotalBRL) * 100 : 0;
    
    return {
      custoTotalUSD,
      custoComImpostoUSD,
      custoComImpostoBRL,
      vendaTotalBRL,
      vendaTotalUSD,
      margemTotalBRL,
      margemTotalUSD: margemTotalBRL / cotacaoMedia,
      margemPercentual,
      cotacaoMedia
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'error' => {
    if (!status) return 'warning';
    
    switch (status.toLowerCase()) {
      case 'pago':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'cancelado':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !venda) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/vendas')}
          sx={{ mb: 2 }}
        >
          Voltar para Vendas
        </Button>
        <Alert severity="error">
          {error || 'Venda não encontrada'}
        </Alert>
      </Box>
    );
  }

  const dadosVenda = calcularDadosVenda();
  
  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/vendas')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Venda #{venda.id.substring(0, 8)}...
        </Typography>
        <Tooltip title="Editar venda">
          <IconButton
            onClick={() => {
              // Navegar para a página de vendas com parâmetros para editar esta venda
              navigate(`/vendas?edit=${venda.id}`);
            }}
            sx={{ color: 'primary.main' }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cards de Análise Financeira */}
      {dadosVenda && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {formatUSD(dadosVenda.margemTotalUSD)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(dadosVenda.margemTotalBRL)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      💰 Lucro ({dadosVenda.margemPercentual.toFixed(1)}%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'error.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0rem' }}>
                      {formatUSD(dadosVenda.custoComImpostoUSD)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(dadosVenda.custoComImpostoBRL)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      💸 Custo c/ Imposto (Banco)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'info.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CurrencyExchangeIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0rem' }}>
                      {formatUSD(dadosVenda.vendaTotalUSD)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(dadosVenda.vendaTotalBRL)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      💲 Vendas (R$ {dadosVenda.cotacaoMedia?.toFixed(4)})
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0rem' }}>
                      {venda.produtos.length} itens
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      Qtd Total: {venda.produtos.reduce((sum, p) => sum + (p.quantidade || 1), 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      📦 Produtos da Venda
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Informações da Venda */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informações do Cliente
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Nome:</strong> {venda.cliente_nome}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Telefone:</strong> {venda.cliente_telefone}
              </Typography>
              <Typography variant="body1">
                <strong>Entrega:</strong> {venda.metodo_entrega}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informações da Venda
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Data:</strong> {formatDate(venda.data_venda)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Status:</strong>{' '}
                <Chip
                  label={venda.status || 'Não informado'}
                  color={getStatusColor(venda.status)}
                  size="small"
                />
              </Typography>
              <Typography variant="body1">
                <strong>ID:</strong> {venda.id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumo Financeiro */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ fontSize: 36, mr: 1.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(venda.valor_total)}
                  </Typography>
                  <Typography variant="body2">
                    Valor Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PaymentIcon sx={{ fontSize: 36, mr: 1.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(venda.valor_pago)}
                  </Typography>
                  <Typography variant="body2">
                    Valor Pago
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: (venda.valor_pendente || 0) > 0 ? 'warning.main' : 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ fontSize: 36, mr: 1.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(venda.valor_pendente)}
                  </Typography>
                  <Typography variant="body2">
                    Valor Pendente
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Produtos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Produtos ({venda.produtos.length})
            </Typography>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Detalhes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Preços</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Qtd</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total & Margem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {venda.produtos.map((produto, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {produto.nome_produto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {produto.cor && (
                          <Chip label={produto.cor} size="small" color="primary" variant="outlined" />
                        )}
                        {produto.tamanho && (
                          <Chip label={produto.tamanho} size="small" color="secondary" variant="outlined" />
                        )}
                        {produto.marca && (
                          <Chip label={produto.marca} size="small" color="success" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(produto.preco_venda)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Compra: {formatUSD(produto.preco_compra)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {produto.quantidade}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(produto.preco_venda * produto.quantidade)}
                        </Typography>
                                                 {(() => {
                            // Usar cotação histórica do produto se disponível
                            const cotacaoUsar = produto.dolar_agora || dadosVenda?.cotacaoMedia || cotacao || 5.20;
                            const custoComImpostoUSD = produto.preco_compra * (1 + (produto.imposto_percentual || 7) / 100);
                            const custoComImpostoBRL = custoComImpostoUSD * cotacaoUsar * produto.quantidade;
                            const vendaTotalProduto = produto.preco_venda * produto.quantidade;
                            const lucroBRL = vendaTotalProduto - custoComImpostoBRL;
                            const lucroUSD = lucroBRL / cotacaoUsar;
                            // Margem sobre VENDA (fórmula correta)
                            const margemSobreVenda = vendaTotalProduto > 0 ? (lucroBRL / vendaTotalProduto) * 100 : 0;
                            
                            return (
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                                  Lucro: {formatCurrency(lucroBRL)}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                                  Lucro: {formatUSD(lucroUSD)}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  Margem: {margemSobreVenda.toFixed(1)}% (Cotação: R$ {cotacaoUsar.toFixed(4)})
                                </Typography>
                              </Box>
                                                         );
                           })()}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Observações */}
      {venda.observacoes && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Observações
            </Typography>
            <Typography variant="body1">
              {venda.observacoes}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VendaDetalhePage; 