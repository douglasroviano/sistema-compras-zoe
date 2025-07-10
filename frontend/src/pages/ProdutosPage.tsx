import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
  Skeleton,
  Avatar,
  InputAdornment,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  Photo as PhotoIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import ProdutoFormAvancado from '../components/ProdutoFormAvancado';
import type { Produto } from '../types/produto';
import type { ProdutoVenda } from '../types/produtoVenda';
import { useNavigate } from 'react-router-dom';
import { getProdutos, createProduto, updateProduto, deleteProduto, getVendas } from '../services/api';

interface VendaInfo {
  id: string;
  data_venda: string;
  cliente_nome?: string;
  valor_total?: number;
  produtos: {
    nome_produto: string;
    marca?: string;
    quantidade: number;
  }[];
}

const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPreco, setFiltroPreco] = useState<'todos' | 'baixo' | 'medio' | 'alto'>('todos');
  const [filtroMarca, setFiltroMarca] = useState<string>('todas');
  const [vendasCount, setVendasCount] = useState<Record<string, number>>({});
  const [vendasModal, setVendasModal] = useState(false);
  const [vendaAtualList, setVendaAtualList] = useState<VendaInfo[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProdutos();
    fetchVendasCount();
  }, []);

  const fetchVendasCount = async () => {
    try {
      const response = await getVendas();
      const vendas = response.data;

      // Contar vendas por produto (nome + marca)
      const countMap: Record<string, number> = {};

      vendas.forEach((venda: VendaInfo) => {
        if (venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produto) => {
            // Criar chave única usando nome e marca
            const chave = `${produto.nome_produto || ''}|${produto.marca || ''}`;
            countMap[chave] = (countMap[chave] || 0) + (produto.quantidade || 1);
          });
        }
      });

      setVendasCount(countMap);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await getProdutos();
      setProdutos(response.data);
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
      if (editingProduto) {
        await updateProduto(editingProduto.id, produtoData);
      } else {
        await createProduto(produtoData);
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
        await deleteProduto(id);
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

  const formatUSD = (value?: number) => {
    if (!value) return '$ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getLucroBRL = (produto: Produto) => {
    if (!produto.preco_compra || !produto.preco_venda || !produto.dolar_agora) return 0;

    const imposto = produto.imposto_percentual || 0; // Se não tem no banco, é 0%
    const custoComImposto = produto.preco_compra * (1 + imposto / 100);

    return produto.preco_venda - custoComImposto;
  };

  const getLucroUSD = (produto: Produto) => {
    if (!produto.preco_compra || !produto.preco_venda || !produto.dolar_agora) return 0;

    const lucroBRL = getLucroBRL(produto);
    return lucroBRL / produto.dolar_agora; // Usar cotação histórica do produto
  };

  const getMargemLucro = (produto: Produto) => {
    if (!produto.preco_compra || !produto.preco_venda || !produto.dolar_agora) return 0;

    // Calcular custo real em BRL (preço USD + imposto) * cotação histórica
    const imposto = produto.imposto_percentual || 0; // 7% padrão
    const custoComImposto = produto.preco_compra * (1 + imposto / 100);

    // Calcular margem sobre VENDA: (venda BRL - custo real BRL) / venda BRL
    return ((produto.preco_venda - custoComImposto) / produto.preco_venda) * 100;
  };

  const getMargemColor = (margem: number): 'success' | 'warning' | 'error' => {
    if (margem >= 50) return 'success';
    if (margem >= 20) return 'warning';
    return 'error';
  };

  const getMarcasUnicas = () => {
    const marcasMap = new Map<string, string>();

    produtos.forEach(produto => {
      if (produto.marca && produto.marca.trim()) {
        const marcaOriginal = produto.marca.trim();
        const marcaNormalizada = marcaOriginal.toLowerCase().replace(/\s+/g, ' ').trim();

        // Usar a marca normalizada como chave, mas manter a original como valor
        if (!marcasMap.has(marcaNormalizada)) {
          marcasMap.set(marcaNormalizada, marcaOriginal);
        }
      }
    });

    // Retornar apenas os valores únicos (marcas originais) ordenados
    return Array.from(marcasMap.values()).sort();
  };

  const getVendasCount = (nomeProduto: string, marca?: string) => {
    const chave = `${nomeProduto}|${marca || ''}`;
    return vendasCount[chave] || 0;
  };

  const buscarVendasProduto = async (nomeProduto: string, marca?: string) => {
    try {
      const response = await getVendas();
      const vendas = response.data;

      // Filtrar vendas que contêm o produto específico
      const vendasProduto = vendas.filter((venda: VendaInfo) => {
        if (venda.produtos && Array.isArray(venda.produtos)) {
          return venda.produtos.some((produto) =>
            produto.nome_produto === nomeProduto && produto.marca === marca
          );
        }
        return false;
      });

      return vendasProduto;
    } catch (error) {
      console.error('Erro ao buscar vendas do produto:', error);
      return [];
    }
  };

  const handleClickVendas = async (nomeProduto: string, marca?: string) => {
    setProdutoSelecionado(`${nomeProduto}${marca ? ` - ${marca}` : ''}`);
    setVendasModal(true);

    const vendas = await buscarVendasProduto(nomeProduto, marca);
    setVendaAtualList(vendas);
  };

  const handleCloseVendasModal = () => {
    setVendasModal(false);
    setVendaAtualList([]);
    setProdutoSelecionado('');
  };

  const handleVendaClick = (vendaId: string) => {
    navigate(`/vendas/${vendaId}`);
    handleCloseVendasModal();
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.cor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.tamanho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.marca?.trim().toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro por marca
    if (filtroMarca !== 'todas') {
      const marcaProduto = produto.marca?.trim();
      if (!marcaProduto || marcaProduto !== filtroMarca) {
        return false;
      }
    }

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
          Produtos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie os produtos do seu catálogo
        </Typography>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: '1fr 1fr', 
            md: '1fr 1fr 1fr 1fr' 
          }, 
          gap: 2, 
          mb: 3 
        }}>
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
          <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ fontSize: 36, mr: 1.5 }} />
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
          <Card sx={{ bgcolor: 'info.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ fontSize: 36, mr: 1.5 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {getMarcasUnicas().length}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Marcas Únicas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar por nome, cor, tamanho, descrição ou marca..."
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
            <InputLabel>Marca</InputLabel>
            <Select
              value={filtroMarca}
              label="Marca"
              onChange={(e) => setFiltroMarca(e.target.value)}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="todas">Todas</MenuItem>
              {getMarcasUnicas().map(marca => (
                <MenuItem key={marca} value={marca}>{marca}</MenuItem>
              ))}
            </Select>
          </FormControl>

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
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '16%' }}>Produto</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '14%' }}>Detalhes/Marca</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '14%' }}>Preços</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '16%' }}>Lucro BRL/USD</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '8%' }}>Margem</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '6%' }}>Vendas</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: '8%' }}>Foto</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, py: 1.5, width: '12%' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
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
                  const margem = getMargemLucro(produto);
                  const vendasCount = getVendasCount(produto.nome_produto, produto.marca);
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
                          {produto.marca && produto.marca.trim() && (
                            <Chip label={produto.marca.trim()} size="small" color="success" variant="outlined" />
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
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                            Compra: {formatUSD(produto.preco_compra)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                            {formatCurrency(getLucroBRL(produto))}
                          </Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                            {formatUSD(getLucroUSD(produto))}
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
                      <TableCell align="center">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => handleClickVendas(produto.nome_produto, produto.marca)}
                          sx={{
                            minWidth: 'auto',
                            p: 0.5,
                            flexDirection: 'column',
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.50',
                            }
                          }}
                          disabled={vendasCount === 0}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {vendasCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            vendas
                          </Typography>
                        </Button>
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
                                             <ProdutoFormAvancado
              produto={editingProduto as ProdutoVenda}
              cotacaoAtual={5.5}
              onSave={handleSave}
              onCancel={handleCloseDialog}
            />
        </DialogContent>
      </Dialog>

      {/* Modal de Vendas */}
      <Dialog
        open={vendasModal}
        onClose={handleCloseVendasModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 600 }}>
          Vendas de {produtoSelecionado}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {vendaAtualList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nenhuma venda encontrada para este produto.
            </Typography>
          ) : (
            <List>
              {vendaAtualList.map((venda: VendaInfo, index: number) => (
                <React.Fragment key={venda.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleVendaClick(venda.id)}>
                      <ListItemText
                        primary={venda.cliente_nome || 'Cliente não informado'}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Venda #{venda.id.substring(0, 8)}...
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Data: {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Valor: R$ {venda.valor_total?.toFixed(2) || '0,00'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < vendaAtualList.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVendasModal}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProdutosPage; 