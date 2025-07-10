         import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  Paper,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  Image as ImageIcon,
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import type { Cliente } from '../types/cliente';
import type { Venda } from '../types/venda';
import type { ProdutoVenda } from '../types/produtoVenda';
import type { Pagamento } from '../types/pagamento';
import { getCliente, getVendas, getProdutos, getPagamentos, updateVenda } from '../services/api';

// Estilos CSS para impressão
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-area, .print-area * {
      visibility: visible;
    }
    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    .print-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    .print-card {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
    }
    .print-spacing {
      margin-bottom: 20px !important;
    }
  }
`;

interface VendaCompleta extends Venda {
  produtos: ProdutoVenda[];
}

const ClienteDetalhePage: React.FC = () => {
  const { telefone } = useParams<{ telefone: string }>();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (telefone) {
      fetchClienteData();
    }
  }, [telefone]);

  const fetchClienteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados do cliente
      const clienteResponse = await getCliente(telefone!);
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

      // Buscar pagamentos
      const pagamentosResponse = await getPagamentos();
      const todosPagamentos = pagamentosResponse.data;
      
      // Filtrar pagamentos das vendas do cliente
      const vendaIds = vendasCompletas.map((venda: VendaCompleta) => venda.id);
      const pagamentosCliente = todosPagamentos.filter((pagamento: Pagamento) => 
        vendaIds.includes(pagamento.venda_id)
      );
      
      setPagamentos(pagamentosCliente);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      setError('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status?: string): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status) {
      case 'pendente': return 'warning';
      case 'despachada': return 'warning';
      case 'whatsapp': return 'info';
      case 'entregue': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'despachada': return 'Despachada';
      case 'whatsapp': return 'Whatsapp';
      case 'entregue': return 'Entregue';
      case 'cancelada': return 'Cancelada';
      default: return 'Não informado';
    }
  };

  const calcularResumoGeral = () => {
    const valorTotal = vendas.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
    const valorPago = vendas.reduce((sum, venda) => sum + (venda.valor_pago || 0), 0);
    const valorDevendo = valorTotal - valorPago;
    const totalCompras = vendas.length;

    return {
      valorTotal,
      valorPago,
      valorDevendo,
      totalCompras
    };
  };

  const getPagamentosPorVenda = (vendaId: string) => {
    return pagamentos.filter(pagamento => pagamento.venda_id === vendaId);
  };

  const handlePrint = () => {
    // Adicionar estilos de impressão
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    // Imprimir
    window.print();
    
    // Remover estilos após impressão
    setTimeout(() => {
      document.head.removeChild(styleElement);
    }, 1000);
  };

  const handleWhatsApp = async () => {
    if (!cliente) return;
    
    const resumo = calcularResumoGeral();
    
    // Gerar lista de produtos de todas as vendas
    let produtosTexto = '';
    vendas.forEach((venda) => {
      if (venda.produtos && venda.produtos.length > 0) {
        produtosTexto += `\nPRODUTOS:\n`;
        venda.produtos.forEach((produto) => {
          let produtoLinha = `• ${produto.nome_produto}`;
          
          // Adicionar detalhes do produto
          const detalhes = [];
          if (produto.cor) detalhes.push(produto.cor);
          if (produto.tamanho) detalhes.push(produto.tamanho);
          if (produto.marca) detalhes.push(produto.marca);
          
          if (detalhes.length > 0) {
            produtoLinha += ` ${detalhes.join(' ')}`;
          }
          
          // Adicionar preço
          produtoLinha += ` - ${formatCurrency(produto.preco_venda)}`;
          
          produtosTexto += produtoLinha + '\n';
        });
      }
    });

    // Mensagem com introdução personalizada
    const message = `Olá ${cliente.nome}

Aqui é o Douglas Roviano do Zoe Grupo de compras , essa mensagem é automática, envio para você o resumo das suas compras.

O Vencimento do restante é ate o dia 13 de Julho o PIX é Meu telefone 48 996771122

• Total de Compras: ${resumo.totalCompras}
• Valor Total: ${formatCurrency(resumo.valorTotal)}
• Valor Pago: ${formatCurrency(resumo.valorPago)}
• Valor Pendente: ${formatCurrency(resumo.valorDevendo)}
${produtosTexto}
Qualquer duvida, estou a disposicao!

Atenciosamente,
Zoe Grupo de Compras`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Atualizar status das vendas para "whatsapp"
    try {
      const vendasPendentes = vendas.filter(venda => 
        venda.status_venda === 'pendente' || venda.status_venda === 'despachada'
      );
      
      for (const venda of vendasPendentes) {
        if (venda.id) {
          await updateVenda(venda.id, {
            ...venda,
            status_venda: 'whatsapp'
          });
        }
      }
      
      // Recarregar dados para mostrar o status atualizado
      fetchClienteData();
    } catch (error) {
      console.error('Erro ao atualizar status das vendas:', error);
    }
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
          onClick={() => navigate('/clientes')}
        >
          Voltar para Clientes
        </Button>
      </Box>
    );
  }

  const resumoGeral = calcularResumoGeral();

  return (
    <Box className="print-area" sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/clientes')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Perfil do Cliente
          </Typography>
        </Box>
        
        <Box className="no-print" sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Enviar resumo por WhatsApp">
            <IconButton color="success" onClick={handleWhatsApp}>
              <WhatsAppIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir página">
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Informações do Cliente */}
      <Card className="print-header print-spacing" sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {cliente.nome}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">{cliente.telefone}</Typography>
                </Box>
                {cliente.cidade && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">{cliente.cidade}, {cliente.estado}</Typography>
                  </Box>
                )}
                {cliente.preferencia_entrega && (
                  <Chip 
                    label={cliente.preferencia_entrega} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={() => {
                // Navegar para a análise consolidada do cliente
                navigate(`/cliente/${cliente.telefone}/vendas-consolidadas`);
              }}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                },
                mr: 1
              }}
            >
              DETALHES
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                // Navegar para a página de vendas filtrada por este cliente
                navigate(`/vendas?cliente=${encodeURIComponent(cliente.nome)}`);
              }}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)', 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              Lista de Vendas
            </Button>
          </Box>
        </CardContent>
      </Card>

             {/* Resumo Financeiro */}
       <Grid container spacing={3} sx={{ mb: 3 }}>
         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
           <Card sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
             <CardContent>
               <ShoppingCartIcon sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h4" sx={{ fontWeight: 600 }}>
                 {resumoGeral.totalCompras}
               </Typography>
               <Typography variant="body2">Total de Compras</Typography>
             </CardContent>
           </Card>
         </Grid>
         
         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
           <Card sx={{ textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
             <CardContent>
               <ReceiptIcon sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6" sx={{ fontWeight: 600 }}>
                 {formatCurrency(resumoGeral.valorTotal)}
               </Typography>
               <Typography variant="body2">Valor Total</Typography>
             </CardContent>
           </Card>
         </Grid>
         
         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
           <Card sx={{ textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
             <CardContent>
               <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6" sx={{ fontWeight: 600 }}>
                 {formatCurrency(resumoGeral.valorPago)}
               </Typography>
               <Typography variant="body2">Valor Pago</Typography>
             </CardContent>
           </Card>
         </Grid>
         
         <Grid size={{ xs: 12, sm: 6, md: 3 }}>
           <Card sx={{ 
             textAlign: 'center', 
             bgcolor: resumoGeral.valorDevendo > 0 ? 'error.main' : 'success.main', 
             color: 'white' 
           }}>
             <CardContent>
               <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6" sx={{ fontWeight: 600 }}>
                 {formatCurrency(resumoGeral.valorDevendo)}
               </Typography>
               <Typography variant="body2">
                 {resumoGeral.valorDevendo > 0 ? 'Valor Pendente' : 'Quitado'}
               </Typography>
             </CardContent>
           </Card>
         </Grid>
       </Grid>

      {/* Lista de Vendas */}
      <Typography id="historico-vendas" variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Histórico de Compras
      </Typography>

      {vendas.length === 0 ? (
        <Alert severity="info">
          Este cliente ainda não possui compras registradas.
        </Alert>
      ) : (
        vendas.map((venda) => {
          const resumoVenda = {
            valorTotal: venda.valor_total || 0,
            valorPago: venda.valor_pago || 0,
            valorDevendo: (venda.valor_total || 0) - (venda.valor_pago || 0)
          };

                      return (
            <Card key={venda.id} className="print-card print-spacing" sx={{ mb: 3 }}>
              <CardContent>
                {/* Header da Venda */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Compra de {formatDate(venda.data_venda)}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(venda.status_venda)}
                      color={getStatusColor(venda.status_venda)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      ID: {venda.id?.substring(0, 8)}...
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => navigate(`/vendas/${venda.id}`)}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      Detalhes
                    </Button>
                  </Box>
                </Box>

                {/* Produtos */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Produtos:
                </Typography>
                
                                 <Grid container spacing={2} sx={{ mb: 3 }}>
                   {venda.produtos.map((produto) => (
                     <Grid size={{ xs: 12, sm: 6, md: 4 }} key={produto.id}>
                      <Paper sx={{ p: 2, height: '100%' }}>
                        {/* Espaço para foto do produto */}
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: 120, 
                            bgcolor: 'grey.100', 
                            borderRadius: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mb: 2,
                            border: '2px dashed',
                            borderColor: 'grey.300'
                          }}
                        >
                          {produto.foto_url ? (
                            <img 
                              src={produto.foto_url} 
                              alt={produto.nome_produto}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: 4
                              }}
                            />
                          ) : (
                            <Box sx={{ textAlign: 'center', color: 'grey.500' }}>
                              <ImageIcon sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="caption">Foto do Produto</Typography>
                            </Box>
                          )}
                        </Box>
                        
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {produto.nome_produto}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {produto.cor && (
                            <Chip label={produto.cor} size="small" variant="outlined" />
                          )}
                          {produto.tamanho && (
                            <Chip label={produto.tamanho} size="small" variant="outlined" />
                          )}
                          {produto.marca && (
                            <Chip label={produto.marca} size="small" variant="outlined" />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          {formatCurrency(produto.preco_venda)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                                 {/* Resumo da Venda */}
                 <Grid container spacing={2}>
                   <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="body2" color="text.secondary">
                         Valor Total
                       </Typography>
                       <Typography variant="h6" sx={{ fontWeight: 600 }}>
                         {formatCurrency(resumoVenda.valorTotal)}
                       </Typography>
                     </Box>
                   </Grid>
                   
                   <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="body2" color="text.secondary">
                         Valor Pago
                       </Typography>
                       <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                         {formatCurrency(resumoVenda.valorPago)}
                       </Typography>
                     </Box>
                   </Grid>
                   
                   <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="body2" color="text.secondary">
                         Valor Pendente
                       </Typography>
                       <Typography 
                         variant="h6" 
                         sx={{ 
                           fontWeight: 600, 
                           color: resumoVenda.valorDevendo > 0 ? 'error.main' : 'success.main' 
                         }}
                       >
                         {formatCurrency(resumoVenda.valorDevendo)}
                       </Typography>
                     </Box>
                   </Grid>
                   
                   <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="body2" color="text.secondary">
                         Pagamento
                       </Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600 }}>
                         {venda.metodo_pagamento || 'Não informado'}
                       </Typography>
                     </Box>
                   </Grid>
                 </Grid>

                {/* Seção de Pagamentos */}
                {venda.id && getPagamentosPorVenda(venda.id).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon color="primary" />
                      Detalhamento dos Pagamentos
                    </Typography>
                    <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Método</TableCell>
                            <TableCell>Observações</TableCell>
                          </TableRow>
                        </TableHead>
                                                 <TableBody>
                           {venda.id && getPagamentosPorVenda(venda.id).map((pagamento) => (
                            <TableRow key={pagamento.id} hover>
                              <TableCell>{formatDate(pagamento.data_pagamento)}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                                {formatCurrency(pagamento.valor)}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={pagamento.metodo || 'Não informado'}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              </TableCell>
                              <TableCell>
                                {pagamento.observacoes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {venda.observacoes && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Observações:
                    </Typography>
                    <Typography variant="body2">
                      {venda.observacoes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
};

export default ClienteDetalhePage; 