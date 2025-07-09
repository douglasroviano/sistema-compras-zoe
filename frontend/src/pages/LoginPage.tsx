import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  Paper,
  InputAdornment,
  CircularProgress,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, user } = useAuth();
  const theme = useTheme();

  // Se já estiver logado, redireciona para dashboard
  if (user) {
    return <Navigate to="/clientes" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }
      }}
    >
      <Container 
        maxWidth="sm" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 2,
          px: { xs: 2, sm: 3 }
        }}
      >
                 <Fade in timeout={800}>
           <Paper
             elevation={24}
             sx={{
               borderRadius: 4,
               overflow: 'hidden',
               background: 'rgba(255, 255, 255, 0.95)',
               backdropFilter: 'blur(20px)',
               border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
               width: '100%',
               maxWidth: 480,
               mx: 'auto'
             }}
           >
            {/* Header com Branding */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                p: 4,
                textAlign: 'center',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.3)}, transparent)`,
                }
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`
                }}
              >
                <BusinessIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Zoe Grupo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
                Sistema de Compras
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Mensagem de Segurança */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  p: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <SecurityIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                  Acesso restrito para usuários autorizados
                </Typography>
              </Box>

              {/* Formulário */}
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  type="password"
                  label="Senha"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }
                  }}
                />

                {error && (
                  <Fade in>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          alignItems: 'center'
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                      boxShadow: 'none',
                      transform: 'none',
                    }
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? 'Verificando...' : 'Entrar no Sistema'}
                </Button>
              </Box>

              {/* Footer com Informações */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    px: 2,
                    py: 2,
                    bgcolor: alpha(theme.palette.grey[500], 0.05),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Apenas usuários autorizados podem acessar este sistema.
                  <br />
                  Não é possível criar novas contas.
                </Typography>
              </Box>
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage; 