import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCotacao } from '../contexts/CotacaoContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  Logout as LogoutIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

// Componente de teste simples
function TesteChip() {
  console.log('🟡 TesteChip: Componente executado');
  return (
    <Chip
      label="TESTE"
      size="small"
      color="primary"
      sx={{ ml: 2 }}
    />
  );
}

// Componente para mostrar cotação do dólar (como no backup funcional)
/*
function CotacaoDolar() {
  console.log('🚀 CotacaoDolar: Componente iniciado');
  
  // Hooks devem estar fora de try-catch
  const { cotacao, ultimaAtualizacao, loading } = useCotacao();
  
  try {
    console.log('🔍 CotacaoDolar Debug:', { cotacao, ultimaAtualizacao, loading });

    if (loading) {
      console.log('⏳ CotacaoDolar: Mostrando loading...');
      return (
        <Chip
          icon={<AttachMoneyIcon />}
          label="Carregando..."
          size="small"
          variant="outlined"
          sx={{ ml: 2 }}
        />
      );
    }

    // Se cotação for 0, não mostrar (até obter cotação real)
    if (cotacao === 0) {
      console.log('❌ CotacaoDolar: Cotação é 0, não mostrando chip');
      return null;
    }

    console.log('✅ CotacaoDolar: Renderizando chip com cotação:', cotacao);
    return (
      <Chip
        icon={<AttachMoneyIcon />}
        label={`Dólar agora: R$ ${cotacao.toFixed(2)} - Atualizado: ${ultimaAtualizacao}`}
        size="small"
        variant="outlined"
        sx={{ 
          ml: 2,
          backgroundColor: '#e3f2fd',
          borderColor: '#1976d2',
          color: '#1565c0',
          '& .MuiChip-icon': {
            color: '#1976d2'
          }
        }}
      />
    );
  } catch (error) {
    console.error('💥 ERRO no CotacaoDolar:', error);
    // Fallback: mostrar erro visualmente
    return (
      <Chip
        label="Erro na cotação"
        size="small"
        color="error"
        variant="outlined"
        sx={{ ml: 2 }}
      />
    );
  }
}
*/

const Layout: React.FC<LayoutProps> = ({ children }) => {
  console.log('🔥 Layout: Iniciando renderização');
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  console.log('🔥 Layout: Hooks carregados, user:', !!user);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    setMobileOpen(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    { label: 'Clientes', path: '/clientes', icon: <PeopleIcon /> },
    { label: 'Produtos', path: '/produtos', icon: <InventoryIcon /> },
    { label: 'Vendas', path: '/vendas', icon: <ShoppingCartIcon /> },
    { label: 'Pagamentos', path: '/pagamentos', icon: <PaymentIcon /> },
  ];

  console.log('🔥 Layout: Renderizando Toolbar...');

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header da Sidebar */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Sistema de Compras
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontSize: '0.85rem' }}>
          Zoe Grupo
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Navegação */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: isActive ? 'primary.50' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.100' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      {/* User Info e Logout */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {user?.email}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ fontSize: '0.85rem' }}
        >
          Sair
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          boxShadow: 1,
          zIndex: 1201, // Mais alto que o drawer (1200)
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              flexGrow: 1
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </Typography>
          
          <TesteChip />

          {/* User info desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user?.email}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhor performance no mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          position: 'fixed',
          top: { xs: 56, md: 64 }, // altura do AppBar (mobile: 56px, desktop: 64px)
          left: { xs: 0, md: drawerWidth },
          right: 0,
          bottom: 0,
          bgcolor: 'grey.50',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 