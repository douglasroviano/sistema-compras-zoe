import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Fab,
  Alert,
  Skeleton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  DialogActions,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Edit as EditIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import type { Pagamento } from '../types/pagamento';
import type { Venda } from '../types/venda';
import { api } from '../services/api';

interface PagamentoComDetalhes extends Pagamento {
  cliente_nome?: string;
  cliente_telefone?: string;
  venda_valor_total?: number;
  venda_valor_pago?: number;
  status_pagamento?: 'pago' | 'pendente' | 'atrasado';
}

const PagamentosPage: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<PagamentoComDetalhes[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<PagamentoComDetalhes | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'atrasado'>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<'todos' | 'pix' | 'cartao' | 'dinheiro' | 'transferencia'>('todos');

  // Form states
  const [formData, setFormData] = useState({
    venda_id: '',
    valor: '',
    metodo: '',
    observacoes: '',
    data_pagamento: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPagamentos();
    fetchVendas();
  }, []);

  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pagamentos');
      if (response.status !== 200) {
        throw new Error('Erro ao carregar pagamentos');
      }
      const data = response.data;
      setPagamentos(data);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      setError('Erro ao carregar pagamentos. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendas = async () => {
    try {
      const response = await api.get('/vendas');
      if (response.status !== 200) {
        throw new Error('Erro ao carregar vendas');
      }
      const data = response.data;
      setVendas(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingPagamento 
        ? `/api/pagamentos/${editingPagamento.id}`
        : '/api/pagamentos';
      
      const method = editingPagamento ? 'PUT' : 'POST';
      
      const response = await api[method](url, {
        ...formData,
        valor: parseFloat(formData.valor)
      });

      if (response.status !== 200) {
        throw new Error('Erro ao salvar pagamento');
      }

      await fetchPagamentos();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      setError('Erro ao salvar pagamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      try {
        const response = await api.delete(`/pagamentos/${id}`);

        if (response.status !== 200) {
          throw new Error('Erro ao excluir pagamento');
        }

        await fetchPagamentos();
      } catch (error) {
        console.error('Erro ao excluir pagamento:', error);
        setError('Erro ao excluir pagamento');
      }
    }
  };

  const handleEdit = (pagamento: PagamentoComDetalhes) => {
    setEditingPagamento(pagamento);
    setFormData({
      venda_id: pagamento.venda_id,
      valor: pagamento.valor.toString(),
      metodo: pagamento.metodo || '',
      observacoes: pagamento.observacoes || '',
      data_pagamento: pagamento.data_pagamento.split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPagamento(null);
    setFormData({
      venda_id: '',
      valor: '',
      metodo: '',
      observacoes: '',
      data_pagamento: new Date().toISOString().split('T')[0]
    });
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

  const getStatusPagamento = (pagamento: PagamentoComDetalhes): 'pago' | 'pendente' | 'atrasado' => {
    if (pagamento.valor > 0) return 'pago';
    
    const hoje = new Date();
    const dataPagamento = new Date(pagamento.data_pagamento);
    const diasAtraso = Math.floor((hoje.getTime() - dataPagamento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasAtraso > 7) return 'atrasado';
    return 'pendente';
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pago': return 'success';
      case 'pendente': return 'warning';
      case 'atrasado': return 'error';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago': return <PaidIcon />;
      case 'pendente': return <PendingIcon />;
      case 'atrasado': return <WarningIcon />;
      default: return <PendingIcon />;
    }
  };

  const getMetodoIcon = (metodo?: string) => {
    switch (metodo?.toLowerCase()) {
      case 'pix': return <PaymentIcon />;
      case 'cartao': case 'cartão': return <CardIcon />;
      case 'transferencia': case 'transferência': return <BankIcon />;
      case 'dinheiro': return <MoneyIcon />;
      default: return <PaymentIcon />;
    }
  };

  const filteredPagamentos = pagamentos.filter(pagamento => {
    const matchesSearch = pagamento.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagamento.cliente_telefone?.includes(searchTerm) ||
                         pagamento.metodo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const status = getStatusPagamento(pagamento);
    if (filtroStatus !== 'todos' && status !== filtroStatus) return false;

    if (filtroMetodo !== 'todos' && pagamento.metodo?.toLowerCase() !== filtroMetodo) return false;

    return true;
  });

  // Estatísticas
  const estatisticas = {
    totalPagamentos: pagamentos.length,
    valorRecebido: pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0),
    valorTotalVendas: pagamentos.reduce((sum, p) => sum + (p.venda_valor_total || 0), 0),
    valorPendente: pagamentos.reduce((sum, p) => {
      const total = p.venda_valor_total || 0;
      const pago = p.venda_valor_pago || 0;
      return sum + (total - pago);
    }, 0),
    pagamentosPendentes: pagamentos.filter(p => getStatusPagamento(p) === 'pendente').length,
    pagamentosAtrasados: pagamentos.filter(p => getStatusPagamento(p) === 'atrasado').length,
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', width: '100%' }}>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
          Pagamentos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Controle financeiro e gestão de pagamentos
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReceiptIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {estatisticas.totalPagamentos}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Total de Pagamentos
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
                  <MoneyIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {formatCurrency(estatisticas.valorRecebido)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Total Recebido
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
                  <PendingIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {formatCurrency(estatisticas.valorPendente)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Valor Pendente
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
                  <WarningIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {estatisticas.pagamentosAtrasados}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Atrasados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar por cliente, telefone ou método..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtroStatus}
              label="Status"
              onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'pago' | 'pendente' | 'atrasado')}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="pago">Pagos</MenuItem>
              <MenuItem value="pendente">Pendentes</MenuItem>
              <MenuItem value="atrasado">Atrasados</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Método</InputLabel>
            <Select
              value={filtroMetodo}
              label="Método"
              onChange={(e) => setFiltroMetodo(e.target.value as 'todos' | 'pix' | 'cartao' | 'dinheiro' | 'transferencia')}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="pix">PIX</MenuItem>
              <MenuItem value="cartao">Cartão</MenuItem>
              <MenuItem value="dinheiro">Dinheiro</MenuItem>
              <MenuItem value="transferencia">Transferência</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              height: 56,
              px: 2.5,
              fontWeight: 600,
              minWidth: 'auto'
            }}
          >
            Novo Pagamento
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Payments Table */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>Venda Total</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>Já Pago</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>Falta Pagar</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '10%' }}>Este Pagto</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '10%' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '10%' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '5%' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPagamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PaymentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento cadastrado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Tente ajustar os termos de busca' : 'Clique em "Novo Pagamento" para começar'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPagamentos.map((pagamento) => {
                  const status = getStatusPagamento(pagamento);
                  const valorTotal = pagamento.venda_valor_total || 0;
                  const valorPago = pagamento.venda_valor_pago || 0;
                  const valorFaltante = valorTotal - valorPago;
                  const percentualPago = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0;
                  
                  return (
                    <TableRow 
                      key={pagamento.id} 
                      sx={{ 
                        '&:hover': { bgcolor: 'grey.50' },
                        '&:last-child td': { border: 0 }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {pagamento.cliente_nome || 'Cliente não informado'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pagamento.cliente_telefone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatCurrency(valorTotal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Valor da venda
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(valorPago)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {percentualPago.toFixed(0)}% pago
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: valorFaltante > 0 ? 'error.main' : 'success.main' 
                          }}
                        >
                          {formatCurrency(valorFaltante)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {valorFaltante > 0 ? 'Pendente' : 'Quitado'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                          {formatCurrency(pagamento.valor)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          {getMetodoIcon(pagamento.metodo)}
                          <Typography variant="caption" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                            {pagamento.metodo || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(pagamento.data_pagamento)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={getStatusIcon(status)}
                          label={status === 'pago' ? 'Pago' : status === 'pendente' ? 'Pendente' : 'Atrasado'}
                          color={getStatusColor(status)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar pagamento">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(pagamento)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir pagamento">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(pagamento.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setOpenDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 600 }}>
          {editingPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Venda</InputLabel>
              <Select
                value={formData.venda_id}
                label="Venda"
                onChange={(e) => setFormData({ ...formData, venda_id: e.target.value })}
              >
                {vendas.map((venda) => (
                  <MenuItem key={venda.id} value={venda.id}>
                    {venda.cliente_nome} - {formatCurrency(venda.valor_total)} 
                    ({formatDate(venda.data_venda)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Valor"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              required
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Método de Pagamento</InputLabel>
              <Select
                value={formData.metodo}
                label="Método de Pagamento"
                onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
              >
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="cartao">Cartão</MenuItem>
                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                <MenuItem value="transferencia">Transferência</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Data do Pagamento"
              type="date"
              value={formData.data_pagamento}
              onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
              required
              fullWidth
            />

            <TextField
              label="Observações"
              multiline
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o pagamento..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={!formData.venda_id || !formData.valor}
          >
            {editingPagamento ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PagamentosPage; 