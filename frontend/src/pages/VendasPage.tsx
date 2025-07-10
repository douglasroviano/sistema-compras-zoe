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
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Photo as PhotoIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import type { Venda } from '../types/venda';
import VendaForm from '../components/VendaForm';
import { api } from '../services/api';

const VendasPage: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendente' | 'pago' | 'entregue'>('todas');

  useEffect(() => {
    fetchVendas();
  }, []);

  const fetchVendas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendas');
      if (response.status !== 200) {
        throw new Error('Erro ao carregar vendas');
      }
      const data = response.data;
      setVendas(data);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      setError('Erro ao carregar vendas. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        const response = await api.delete(`/vendas/${id}`);

        if (response.status !== 200) {
          throw new Error('Erro ao excluir venda');
        }

        await fetchVendas();
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        setError('Erro ao excluir venda');
      }
    }
  };

  const handleEdit = (venda: Venda) => {
    setEditingVenda(venda);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVenda(null);
  };

  const handleSave = async (vendaData: Venda) => {
    try {
      const url = editingVenda 
        ? `/api/vendas/${editingVenda.id}`
        : '/api/vendas';
      
      const method = editingVenda ? 'PUT' : 'POST';
      
      const response = await api[method](url, vendaData);

      if (response.status !== 200) {
        throw new Error('Erro ao salvar venda');
      }

      await fetchVendas();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      throw error; // Re-throw para o VendaForm mostrar o erro
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pendente': return 'warning';
      case 'despachada': return 'warning';
      case 'entregue': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'despachada': return 'Despachada';
      case 'entregue': return 'Entregue';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const calcularResumoVenda = (venda: Venda) => {
    const valorTotal = venda.valor_total || 0;
    const valorPago = venda.valor_pago || 0;
    const valorDevendo = valorTotal - valorPago;
    const percentualPago = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0;

    return {
      valorTotal,
      valorPago,
      valorDevendo,
      percentualPago
    };
  };

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venda.id?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filtroStatus === 'todas') return true;
          return venda.status_venda === filtroStatus;
  });

  // Estatísticas gerais
  const estatisticas = {
    totalVendas: vendas.length,
    vendasPendentes: vendas.filter(v => v.status_venda === 'pendente').length,
    vendasEntregues: vendas.filter(v => v.status_venda === 'entregue').length,
    faturamentoTotal: vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0),
    valorRecebido: vendas.reduce((sum, v) => sum + (v.valor_pago || 0), 0)
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Skeleton variant="rectangular" height={200} />
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
          Vendas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie suas vendas do WhatsApp ao delivery
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {estatisticas.totalVendas}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Total de Vendas
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
                  <PaymentIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {estatisticas.vendasPendentes}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Pendentes
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
                      {formatCurrency(estatisticas.faturamentoTotal)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Faturamento Total
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
                  <ReceiptIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {formatCurrency(estatisticas.valorRecebido)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Valor Recebido
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
            placeholder="Buscar por cliente ou ID da venda..."
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
                             onChange={(e) => setFiltroStatus(e.target.value as 'todas' | 'pendente' | 'pago' | 'entregue')}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="pendente">Pendentes</MenuItem>
              <MenuItem value="pago">Pagas</MenuItem>
              <MenuItem value="entregue">Entregues</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              height: 56,
              px: 3,
              fontWeight: 600
            }}
          >
            Nova Venda
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Sales Table */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, width: '25%' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>Produtos</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>Valores</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '12%' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>Pagamento</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '13%' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ShoppingCartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda cadastrada'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Tente ajustar os termos de busca' : 'Clique em "Nova Venda" para começar'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas.map((venda) => {
                  const resumo = calcularResumoVenda(venda);
                  return (
                    <TableRow 
                      key={venda.id} 
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
                              {venda.cliente_nome || 'Cliente não informado'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {venda.id?.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge badgeContent={venda.total_produtos || 0} color="primary">
                            <PhotoIcon />
                          </Badge>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {venda.total_produtos || 0} item(s)
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Total: {formatCurrency(resumo.valorTotal)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pago: {formatCurrency(resumo.valorPago)}
                          </Typography>
                          {resumo.valorDevendo > 0 && (
                            <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                              Deve: {formatCurrency(resumo.valorDevendo)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                                                  label={getStatusLabel(venda.status_venda || 'pendente')}
                        color={getStatusColor(venda.status_venda || 'pendente')}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {venda.metodo_pagamento || 'Não definido'}
                          </Typography>
                          {resumo.percentualPago > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'success.main' }}>
                              {resumo.percentualPago.toFixed(0)}% pago
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalhes">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(venda)}
                              sx={{ color: 'primary.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir para cliente">
                            <IconButton
                              size="small"
                              sx={{ color: 'info.main' }}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir venda">
                            <IconButton
                              size="small"
                              onClick={() => venda.id && handleDelete(venda.id)}
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

      {/* Dialog - Será implementado em seguida */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 600 }}>
          {editingVenda ? 'Detalhes da Venda' : 'Nova Venda'}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <VendaForm
            venda={editingVenda}
            onSave={handleSave}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VendasPage; 