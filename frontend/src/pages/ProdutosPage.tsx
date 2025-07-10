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
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Inventory as InventoryIcon, 
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Photo as PhotoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import ProdutoFormSimples from '../components/ProdutoFormSimples';
import type { Produto } from '../types/produto';
import type { ProdutoVenda } from '../types/produtoVenda';
import { api } from '../services/api';

const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPreco, setFiltroPreco] = useState<'todos' | 'baixo' | 'medio' | 'alto'>('todos');

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/produtos-venda');
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }
      const data = await response.json();
      setProdutos(data);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setError('Erro ao carregar produtos. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (produtoData: Omit<ProdutoVenda, 'id'> | ProdutoVenda) => {
    try {
      const url = editingProduto 
        ? `/api/produtos-venda/${editingProduto.id}`
        : '/api/produtos-venda';
      
      const method = editingProduto ? 'PUT' : 'POST';
      
      const response = await api[method](url, produtoData);

      if (!response.ok) {
        throw new Error('Erro ao salvar produto');
      }

      await fetchProdutos();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setError('Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await api.delete(`/produtos-venda/${id}`);

        if (!response.ok) {
          throw new Error('Erro ao excluir produto');
        }

        await fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        setError('Erro ao excluir produto');
      }
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduto(null);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMargemLucro = (precoCompra?: number, precoVenda?: number) => {
    if (!precoCompra || !precoVenda) return 0;
    return ((precoVenda - precoCompra) / precoCompra) * 100;
  };

  const getMargemColor = (margem: number): 'success' | 'warning' | 'error' => {
    if (margem >= 50) return 'success';
    if (margem >= 20) return 'warning';
    return 'error';
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.cor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.tamanho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filtroPreco === 'todos') return true;
    
    const preco = produto.preco_venda || 0;
    switch (filtroPreco) {
      case 'baixo':
        return preco <= 50;
      case 'medio':
        return preco > 50 && preco <= 200;
      case 'alto':
        return preco > 200;
      default:
        return true;
    }
  });

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
          Produtos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie os produtos do seu catálogo
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InventoryIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {produtos.length}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Total de Produtos
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
                      {formatCurrency(produtos.reduce((sum, p) => sum + (p.preco_venda || 0), 0))}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Valor Total Estoque
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
                  <PhotoIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {produtos.filter(p => p.foto_url).length}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Com Fotos
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
                  <ShoppingCartIcon sx={{ fontSize: 36, mr: 1.5 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {new Set(produtos.map(p => p.nome_produto)).size}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      Tipos Únicos
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
            placeholder="Buscar por nome, cor, tamanho ou descrição..."
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
            <InputLabel>Faixa de Preço</InputLabel>
            <Select
              value={filtroPreco}
              label="Faixa de Preço"
              onChange={(e) => setFiltroPreco(e.target.value as 'todos' | 'baixo' | 'medio' | 'alto')}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="baixo">Até R$ 50</MenuItem>
              <MenuItem value="medio">R$ 50 - R$ 200</MenuItem>
              <MenuItem value="alto">Acima R$ 200</MenuItem>
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
            Novo Produto
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Products Table */}
      <Card sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table size="medium" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '25%' }}>Produto</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '20%' }}>Detalhes</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '20%' }}>Preços</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '12%' }}>Margem</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '10%' }}>Foto</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, py: 1.5, width: '13%' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <InventoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Tente ajustar os termos de busca' : 'Clique em "Novo Produto" para começar'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => {
                  const margem = getMargemLucro(produto.preco_compra, produto.preco_venda);
                  return (
                    <TableRow 
                      key={produto.id} 
                      sx={{ 
                        '&:hover': { bgcolor: 'grey.50' },
                        '&:last-child td': { border: 0 },
                        height: 'auto'
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {produto.nome_produto}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {produto.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {produto.cor && (
                            <Chip label={produto.cor} size="small" color="primary" variant="outlined" />
                          )}
                          {produto.tamanho && (
                            <Chip label={produto.tamanho} size="small" color="secondary" variant="outlined" />
                          )}
                        </Box>
                        {produto.descricao && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {produto.descricao.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Venda: {formatCurrency(produto.preco_venda)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Compra: {formatCurrency(produto.preco_compra)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${margem.toFixed(1)}%`}
                          color={getMargemColor(margem)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        {produto.foto_url ? (
                          <Avatar 
                            src={produto.foto_url} 
                            alt={produto.nome_produto}
                            sx={{ width: 40, height: 40 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
                            <PhotoIcon />
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Editar produto">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(produto)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir produto">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(produto.id)}
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
          {editingProduto ? 'Editar Produto' : 'Novo Produto'}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <ProdutoFormSimples
            produto={editingProduto}
            onSave={handleSave}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProdutosPage; 