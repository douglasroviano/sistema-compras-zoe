import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Box,
  Container
} from '@mui/material';
import { 
  People as PeopleIcon, 
  ShoppingCart as ShoppingCartIcon, 
  Payment as PaymentIcon,
  Inventory as InventoryIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientesPage from './pages/ClientesPage';
import ClienteDetalhePage from './pages/ClienteDetalhePage';
import ProdutosPage from './pages/ProdutosPage';
import VendasPage from './pages/VendasPage';
import PagamentosPage from './pages/PagamentosPage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 280,
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: '#f0f7ff',
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            '&:hover': {
              backgroundColor: '#e3f2fd',
            },
          },
        },
      },
    },
  },
});

const drawerWidth = 280;

const menuItems = [
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Produtos', icon: <InventoryIcon />, path: '/produtos' },
  { text: 'Vendas', icon: <ShoppingCartIcon />, path: '/vendas' },
  { text: 'Pagamentos', icon: <PaymentIcon />, path: '/pagamentos' },
];

function NavigationContent() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Sistema de Compras - Zoe Grupo
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      '& .MuiTypography-root': { 
                        fontWeight: location.pathname === item.path ? 600 : 400 
                      } 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth={false} sx={{ py: 3, px: 3, maxWidth: '100vw' }}>
          <Routes>
            <Route path="/" element={<ClientesPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/cliente/:telefone" element={<ClienteDetalhePage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/vendas" element={<VendasPage />} />
            <Route path="/pagamentos" element={<PagamentosPage />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavigationContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
