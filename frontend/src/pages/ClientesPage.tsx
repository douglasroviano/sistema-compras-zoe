import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Phone as PhoneIcon, 
  LocationOn as LocationIcon, 
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import ClienteForm from '../components/ClienteForm';
import type { Cliente } from '../types/cliente';
import type { Venda } from '../types/venda';

interface ClienteComVendas extends Cliente {
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  totalCompras: number;
}

const ClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesComVendas, setClientesComVendas] = useState<ClienteComVendas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      // Buscar clientes
      const clientesResponse = await fetch('/api/clientes');
      if (!clientesResponse.ok) {
        throw new Error('Erro ao carregar clientes');
      }
      const clientesData = await clientesResponse.json();
      setClientes(clientesData);

      // Buscar vendas
      const vendasResponse = await fetch('/api/vendas');
      const vendasData: Venda[] = await vendasResponse.json();

      // Filtrar apenas vendas ativas (pendente e despachada)
      const vendasAtivas = vendasData.filter(venda => 
        venda.status_venda === 'pendente' || venda.status_venda === 'despachada'
      );

      // Calcular valores para cada cliente
      const clientesComCalculos: ClienteComVendas[] = clientesData.map((cliente: Cliente) => {
        const vendasCliente = vendasAtivas.filter(venda => venda.cliente_telefone === cliente.telefone);
        
        const valorTotal = vendasCliente.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
        const valorPago = vendasCliente.reduce((sum, venda) => sum + (venda.valor_pago || 0), 0);
        const valorPendente = valorTotal - valorPago;
        const totalCompras = vendasCliente.length;

        return {
          ...cliente,
          valorTotal,
          valorPago,
          valorPendente,
          totalCompras
        };
      });

      setClientesComVendas(clientesComCalculos);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar dados. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (clienteData: Cliente) => {
    try {
      const url = editingCliente 
        ? `/api/clientes/${editingCliente.telefone}`
        : '/api/clientes';
      
      const method = editingCliente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar cliente');
      }

      await fetchClientes();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setError('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (telefone: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const response = await fetch(`/api/clientes/${telefone}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erro ao excluir cliente');
        }

        await fetchClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        setError('Erro ao excluir cliente');
      }
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCliente(null);
  };

  const handleViewCliente = (telefone: string) => {
    navigate(`/cliente/${encodeURIComponent(telefone)}`);
  };

  const filteredClientes = clientesComVendas.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPreferenciaColor = (preferencia: string): 'primary' | 'success' | 'warning' | 'default' => {
    switch (preferencia) {
      case 'retirada':
        return 'primary';
      case 'entrega':
        return 'success';
      case 'correios':
        return 'warning';
      default:
        return 'default';
    }
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
          Clientes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie os clientes do seu grupo de compras
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {clientes.length}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Total de Clientes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {new Set(clientes.map(c => c.cidade)).size}
                    </Typography>
                    <Typography variant="body2">
                      Cidades Atendidas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {clientesComVendas.reduce((sum, c) => sum + c.totalCompras, 0)}
                    </Typography>
                    <Typography variant="body2">
                      Compras Ativas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(clientesComVendas.reduce((sum, c) => sum + c.valorPendente, 0))}
                    </Typography>
                    <Typography variant="body2">
                      Total Pendente
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Add Button */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Buscar por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
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
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Clients Table */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contato</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Localização</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Compras Ativas</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Valor Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Valor Pago</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Valor Pendente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entrega</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PersonIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Tente ajustar os termos de busca' : 'Clique em "Novo Cliente" para começar'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow 
                    key={cliente.telefone} 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => handleViewCliente(cliente.telefone)}
                        >
                          {cliente.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tel: {cliente.telefone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {cliente.telefone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cliente.cidade}, {cliente.estado}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          CEP: {cliente.cep}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {cliente.totalCompras}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        compras
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {cliente.valorTotal > 0 && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(cliente.valorTotal)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cliente.valorPago > 0 && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(cliente.valorPago)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cliente.valorPendente > 0 && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'error.main'
                          }}
                        >
                          {formatCurrency(cliente.valorPendente)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.preferencia_entrega}
                        color={getPreferenciaColor(cliente.preferencia_entrega)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Ver perfil do cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCliente(cliente.telefone)}
                            sx={{ color: 'info.main' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(cliente)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(cliente.telefone)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
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
          {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <ClienteForm
            cliente={editingCliente}
            onSave={handleSave}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClientesPage; 