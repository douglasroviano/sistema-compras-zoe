import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

import type { Cliente } from '../types/cliente';
import type { Venda } from '../types/venda';
import type { ProdutoVenda } from '../types/produtoVenda';
import { getCliente, getVendas, getProdutos } from '../services/api';

interface VendaCompleta extends Venda {
  produtos: ProdutoVenda[];
}

interface ProdutoConsolidado {
  nome_produto: string;
  marca?: string;
  cor?: string;
  tamanho?: string;
  quantidade_total: number;
  valor_total_compra: number;
  valor_total_venda: number;
  vendas_onde_aparece: string[];
}

const ClienteVendasConsolidadasPage: React.FC = () => {
  const { telefone } = useParams<{ telefone: string }>();
  const navigate = useNavigate();
  // Usar cotação do contexto global (não mais necessária para cálculos)
  // const { cotacao } = useCotacao();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (telefone) {
      fetchClienteData();
    }
  }, [telefone]);

  const fetchClienteData = async () => {
    if (!telefone) {
      setError('Telefone do cliente não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do cliente
      const clienteResponse = await getCliente(telefone);
      setCliente(clienteResponse.data);

      // Buscar vendas do cliente
      const vendasResponse = await getVendas();
      const todasVendas = vendasResponse.data;
      
      // Filtrar vendas do cliente
      const vendasCliente = todasVendas.filter((venda: Venda) => 
        venda.cliente_telefone === telefone
      );

      // Buscar produtos para cada venda
      const produtosResponse = await getProdutos();
      const todosProdutos = produtosResponse.data;

      const vendasCompletas = vendasCliente.map((venda: Venda) => {
        // Filtrar produtos desta venda
        const produtosVenda = todosProdutos.filter((produto: ProdutoVenda) => 
          produto.venda_id === venda.id
        );

        return {
          ...venda,
          produtos: produtosVenda
        };
      });

      setVendas(vendasCompletas);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      setError('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const calcularAnaliseConsolidada = () => {
    if (vendas.length === 0) return null;

    let custoTotalUSD = 0;
    let custoTotalBRL = 0;
    let vendaTotalBRL = 0;
    let margemTotalBRL = 0;
    let totalProdutos = 0;
    let somaCotacoesPonderadas = 0;
    let somaQuantidades = 0;
    
    vendas.forEach(venda => {
      venda.produtos.forEach(produto => {
        const quantidade = produto.quantidade || 1;
        const custoUSD = (produto.preco_compra || 0) * quantidade;
        
        // ELIMINAR valor hardcoded - usar APENAS dados do banco
        const impostoPercentual = produto.imposto_percentual ? produto.imposto_percentual / 100 : 0;
        const custoComImpostoUSD = custoUSD * (1 + impostoPercentual);
        
        // ELIMINAR valor hardcoded - usar APENAS cotação histórica do produto
        const cotacaoUsada = produto.dolar_agora;
        
        // SÓ processar se tem cotação histórica válida
        if (cotacaoUsada && cotacaoUsada > 0) {
          const custoComImpostoBRL = custoComImpostoUSD * cotacaoUsada;
          const vendaBRL = (produto.preco_venda || 0) * quantidade;
          
          custoTotalUSD += custoUSD;
          custoTotalBRL += custoComImpostoBRL;
          vendaTotalBRL += vendaBRL;
          margemTotalBRL += vendaBRL - custoComImpostoBRL;
          totalProdutos += quantidade;
          
          // Para cotação média ponderada
          somaCotacoesPonderadas += cotacaoUsada * quantidade;
          somaQuantidades += quantidade;
        }
      });
    });

    const valorTotalVendas = vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const valorPagoTotal = vendas.reduce((sum, v) => sum + (v.valor_pago || 0), 0);
    const valorPendenteTotal = valorTotalVendas - valorPagoTotal;
    
    const margemPercentual = vendaTotalBRL > 0 ? (margemTotalBRL / vendaTotalBRL) * 100 : 0;
    
    // ELIMINAR valor hardcoded - calcular usando cotação média ponderada real
    const cotacaoMediaPonderada = somaQuantidades > 0 ? somaCotacoesPonderadas / somaQuantidades : 0;
    const custoTotalComImpostoUSD = cotacaoMediaPonderada > 0 ? custoTotalBRL / cotacaoMediaPonderada : 0;

    return {
      totalVendas: vendas.length,
      totalProdutos,
      custoTotalUSD,
      custoTotalComImpostoUSD,
      custoTotalBRL,
      vendaTotalBRL,
      margemTotalBRL,
      margemTotalUSD: cotacaoMediaPonderada > 0 ? margemTotalBRL / cotacaoMediaPonderada : 0,
      margemPercentual,
      valorTotalVendas,
      valorPagoTotal,
      valorPendenteTotal
    };
  };

  const consolidarProdutos = (): ProdutoConsolidado[] => {
    const produtosMap: { [key: string]: ProdutoConsolidado } = {};

    vendas.forEach(venda => {
      venda.produtos.forEach(produto => {
        // Criar chave única para o produto
        const chave = `${produto.nome_produto}-${produto.marca || ''}-${produto.cor || ''}-${produto.tamanho || ''}`;
        
        const quantidade = produto.quantidade || 1;
        const valorCompra = (produto.preco_compra || 0) * quantidade;
        const valorVenda = (produto.preco_venda || 0) * quantidade;

        if (produtosMap[chave]) {
          produtosMap[chave].quantidade_total += quantidade;
          produtosMap[chave].valor_total_compra += valorCompra;
          produtosMap[chave].valor_total_venda += valorVenda;
          produtosMap[chave].vendas_onde_aparece.push(venda.id);
        } else {
          produtosMap[chave] = {
            nome_produto: produto.nome_produto,
            marca: produto.marca,
            cor: produto.cor,
            tamanho: produto.tamanho,
            quantidade_total: quantidade,
            valor_total_compra: valorCompra,
            valor_total_venda: valorVenda,
            vendas_onde_aparece: [venda.id]
          };
        }
      });
    });

    return Object.values(produtosMap).sort((a, b) => b.valor_total_venda - a.valor_total_venda);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatUSD = (value?: number) => {
    if (!value) return '$ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !cliente) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Cliente não encontrado'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(telefone ? `/cliente/${telefone}` : '/clientes')}
        >
          Voltar para Cliente
        </Button>
      </Box>
    );
  }

  const analise = calcularAnaliseConsolidada();
  const produtosConsolidados = consolidarProdutos();

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(telefone ? `/cliente/${telefone}` : '/clientes')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600, ml: 1 }}>
          Análise Consolidada - {cliente.nome}
        </Typography>
      </Box>

      {/* Cards de Análise Consolidada */}
      {analise && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {analise.totalVendas}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      Total de Vendas
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {analise.totalProdutos} produtos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {formatUSD(analise.margemTotalUSD)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(analise.margemTotalBRL)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      Lucro Total ({analise.margemPercentual.toFixed(1)}%)
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
                  <MoneyIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0rem' }}>
                      {formatUSD(analise.custoTotalComImpostoUSD)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(analise.custoTotalBRL)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      Custo Total (c/ Imposto)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              bgcolor: analise.valorPendenteTotal > 0 ? 'warning.main' : 'success.main', 
              color: 'white', height: '100%' 
            }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0rem' }}>
                      {formatCurrency(analise.valorPendenteTotal)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      {formatCurrency(analise.valorPagoTotal)} pago
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {analise.valorPendenteTotal > 0 ? 'Valor Pendente' : 'Quitado'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Produtos Consolidados */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Produtos Consolidados ({produtosConsolidados.length} tipos diferentes)
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Qtd Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Custo Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Venda Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Margem</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Aparece em</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {produtosConsolidados.map((produto, index) => {
                const margem = produto.valor_total_venda - produto.valor_total_compra;
                const margemPerc = produto.valor_total_venda > 0 ? (margem / produto.valor_total_venda) * 100 : 0;
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {produto.nome_produto}
                        </Typography>
                        {(produto.marca || produto.cor || produto.tamanho) && (
                          <Typography variant="caption" color="text.secondary">
                            {[produto.marca, produto.cor, produto.tamanho].filter(Boolean).join(' • ')}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {produto.quantidade_total}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(produto.valor_total_compra)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(produto.valor_total_venda)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: margem > 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(margem)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({margemPerc.toFixed(1)}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${produto.vendas_onde_aparece.length} venda${produto.vendas_onde_aparece.length > 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Timeline de Vendas */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Histórico Cronológico de Vendas
      </Typography>
      
      {vendas.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()).map((venda, index) => (
        <Card key={venda.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Venda {index + 1} - {formatDate(venda.data_venda)}
                </Typography>
                <Chip 
                  label={venda.status_venda || 'Pendente'}
                  size="small"
                  color={venda.status_venda === 'entregue' ? 'success' : 'warning'}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(venda.valor_total)} • {venda.produtos.length} produtos
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/vendas/${venda.id}`)}
                  sx={{ mt: 0.5 }}
                >
                  Ver Detalhes
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {venda.produtos.map((produto, prodIndex) => (
                <Chip
                  key={prodIndex}
                  label={`${produto.quantidade || 1}x ${produto.nome_produto}${produto.marca ? ` - ${produto.marca}` : ''}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ClienteVendasConsolidadasPage; 