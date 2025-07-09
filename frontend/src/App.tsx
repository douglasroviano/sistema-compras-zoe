import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline
} from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ClientesPage from './pages/ClientesPage';
import ClienteDetalhePage from './pages/ClienteDetalhePage';
import ClienteVendasConsolidadasPage from './pages/ClienteVendasConsolidadasPage';
import ProdutosPage from './pages/ProdutosPage';
import VendasPage from './pages/VendasPage';
import VendaDetalhePage from './pages/VendaDetalhePage';
import PagamentosPage from './pages/PagamentosPage';
import { CotacaoProvider } from './contexts/CotacaoContext';
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



function NavigationContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/clientes" replace />} />
        <Route 
          path="/clientes" 
          element={
            <ProtectedRoute>
              <ClientesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/:telefone" 
          element={
            <ProtectedRoute>
              <ClienteDetalhePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/:telefone/vendas-consolidadas" 
          element={
            <ProtectedRoute>
              <ClienteVendasConsolidadasPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/produtos" 
          element={
            <ProtectedRoute>
              <ProdutosPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendas" 
          element={
            <ProtectedRoute>
              <VendasPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendas/:id" 
          element={
            <ProtectedRoute>
              <VendaDetalhePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pagamentos" 
          element={
            <ProtectedRoute>
              <PagamentosPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
}

function AuthenticatedApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CotacaoProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<NavigationContent />} />
          </Routes>
        </Router>
      </CotacaoProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
