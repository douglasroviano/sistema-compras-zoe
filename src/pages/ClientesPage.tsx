import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
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
      const { getClientes } = await import('../services/api');
      const clientesResponse = await getClientes();
      const clientesData = clientesResponse.data;
      setClientes(clientesData);

      // Buscar vendas
      const { getVendas } = await import('../services/api');
      const vendasResponse = await getVendas();
      const vendasData: Venda[] = vendasResponse.data;

      // Filtrar vendas (excluir apenas canceladas)
      const vendasValidas = vendasData.filter(venda => 
        venda.status_venda !== 'cancelada'
      );

      // Calcular valores para cada cliente
      const clientesComCalculos: ClienteComVendas[] = clientesData.map((cliente: Cliente) => {
        const vendasCliente = vendasValidas.filter(venda => venda.cliente_telefone === cliente.telefone);
        
        const valorTotal = vendasCliente.reduce((sum, venda) => sum + (venda.valor_total || 0), 0);
        // Agora o valor_pago já vem calculado corretamente do backend (da tabela pagamentos)
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
      const { createCliente, updateCliente } = await import('../services/api');
      
      if (editingCliente) {
        await updateCliente(editingCliente.telefone, clienteData);
      } else {
        await createCliente(clienteData);
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
        const { deleteCliente } = await import('../services/api');
        await deleteCliente(telefone);
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Skeleton variant="rectangular" height={200} key={index} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 0 },
      pl: { xs: 2, md: 1 },
      pr: { xs: 2, md: 2 },
      pt: { xs: 2, md: 1 },
      pb: { xs: 2, md: 2 }
    }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
          Clientes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie os clientes do seu grupo de compras
        </Typography>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr 1fr', 
            sm: '1fr 1fr', 
            md: '1fr 1fr 1fr 1fr' 
          }, 
          gap: { xs: 1.5, sm: 2 }, 
          mb: 3 
        }}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <PersonIcon sx={{ fontSize: { xs: 28, sm: 36 }, mr: { xs: 0, sm: 1.5 }, mb: { xs: 0.5, sm: 0 } }} />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                    {clientes.length}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total de Clientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <LocationIcon sx={{ fontSize: { xs: 28, sm: 40 }, mr: { xs: 0, sm: 2 }, mb: { xs: 0.5, sm: 0 } }} />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                    {new Set(clientes.map(c => c.cidade)).size}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Cidades Atendidas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'info.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <ShoppingCartIcon sx={{ fontSize: { xs: 28, sm: 40 }, mr: { xs: 0, sm: 2 }, mb: { xs: 0.5, sm: 0 } }} />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                    {clientesComVendas.reduce((sum, c) => sum + c.totalCompras, 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Compras Ativas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'warning.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <PaymentIcon sx={{ fontSize: { xs: 28, sm: 40 }, mr: { xs: 0, sm: 2 }, mb: { xs: 0.5, sm: 0 } }} />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                    {formatCurrency(clientesComVendas.reduce((sum, c) => sum + c.valorPendente, 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Pendente
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Add Button */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
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
            sx={{ 
              flexGrow: 1, 
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: 'none', sm: 400 }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              height: 56,
              px: 3,
              fontWeight: 600,
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 'auto' }
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
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, width: { xs: '35%', sm: 'auto' } }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Contato</TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Localização</TableCell>
                <TableCell sx={{ fontWeight: 600, width: { xs: '15%', sm: 'auto' } }} align="center">Compras</TableCell>
                <TableCell sx={{ fontWeight: 600, width: { xs: '20%', sm: 'auto' } }}>V. Total</TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>V. Pago</TableCell>
                <TableCell sx={{ fontWeight: 600, width: { xs: '20%', sm: 'auto' } }}>V. Pendente</TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Entrega</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: { xs: '10%', sm: 'auto' } }}>Ações</TableCell>
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
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => handleViewCliente(cliente.telefone)}
                        >
                          {cliente.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                          📱 {cliente.telefone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' } }}>
                          📍 {cliente.cidade}, {cliente.estado}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {cliente.telefone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {cliente.totalCompras}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        compras
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                        {formatCurrency(cliente.valorTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(cliente.valorPago)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          whiteSpace: 'nowrap',
                          color: cliente.valorPendente > 0 ? 'error.main' : 'success.main'
                        }}
                      >
                        {formatCurrency(cliente.valorPendente)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Chip
                        label={cliente.preferencia_entrega}
                        color={getPreferenciaColor(cliente.preferencia_entrega)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: { xs: 0.2, sm: 1 }, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Tooltip title="Ver perfil do cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCliente(cliente.telefone)}
                            sx={{ 
                              color: 'info.main',
                              p: { xs: 0.25, sm: 1 },
                              '& .MuiSvgIcon-root': { fontSize: { xs: '0.875rem', sm: '1.25rem' } }
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(cliente)}
                            sx={{ 
                              color: 'primary.main',
                              p: { xs: 0.25, sm: 1 },
                              '& .MuiSvgIcon-root': { fontSize: { xs: '0.875rem', sm: '1.25rem' } }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(cliente.telefone)}
                            sx={{ 
                              color: 'error.main',
                              p: { xs: 0.25, sm: 1 },
                              '& .MuiSvgIcon-root': { fontSize: { xs: '0.875rem', sm: '1.25rem' } }
                            }}
                          >
                            <DeleteIcon />
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