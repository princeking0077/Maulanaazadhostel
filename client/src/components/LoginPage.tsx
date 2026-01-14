import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  IconButton,
  InputAdornment,
  TextField,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  School
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Background style
  const backgroundStyle = {
    background: `
      linear-gradient(135deg, rgba(26, 35, 126, 0.95), rgba(13, 71, 161, 0.9)),
      url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1920&auto=format&fit=crop')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(credentials.username, credentials.password);
      if (!success) {
        setError('Invalid username or password');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...backgroundStyle,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Circles */}
      <Box className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse-soft" />
      <Box className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <Container maxWidth="xs" className="relative z-10">
        <Paper
          elevation={24}
          className="glass border-white/10"
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'scaleIn 0.5s ease-out',
          }}
        >
          {/* Logo / Icon Area */}
          <Box className="flex flex-col items-center mb-8">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(26, 35, 126, 0.3)',
                mb: 2,
              }}
            >
              <School sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1a237e',
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              MAULANA AZAD
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#534bae',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Hostel Management System
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3, textAlign: 'center' }}>
                Welcome Back
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} className="animate-fade-in">
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={credentials.username}
                onChange={handleChange('username')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#1a237e' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#1a237e' },
                    '&.Mui-focused fieldset': { borderColor: '#1a237e', borderWidth: 2 },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={credentials.password}
                onChange={handleChange('password')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#1a237e' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#1a237e' },
                    '&.Mui-focused fieldset': { borderColor: '#1a237e', borderWidth: 2 },
                  },
                }}
              />
            </Box>

            <button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className={`
                w-full py-3 rounded-lg font-bold text-white text-lg tracking-wide shadow-lg
                transition-all duration-300 transform
                ${isLoading || !credentials.username || !credentials.password
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-primary-light hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'
                }
              `}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </Box>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              © 2025 Maulana Azad College
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;