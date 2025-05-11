import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Container,
  useTheme,
  alpha,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import { 
  Add as AddIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { votingApi, Voting } from '../config/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchVotings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await votingApi.getMyVotings();
      setVotings(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке голосований:', err);
      setError('Не удалось загрузить список голосований');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotings();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleVotingClick = (voting: Voting) => {
    navigate(`/votings/${voting.id}`);
  };

  const handleCreateClick = () => {
    navigate('/votings/create');
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return theme.palette.success.main;
      case 'FINISHED':
        return theme.palette.error.main;
      case 'NOT_STARTED':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'В процессе';
      case 'FINISHED':
        return 'Завершено';
      case 'NOT_STARTED':
        return 'Не начато';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.background.default,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%)`,
        pointerEvents: 'none',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: `radial-gradient(circle at 50% 100%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%)`,
        pointerEvents: 'none',
      },
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 6 }}>
          {/* Информация о пользователе */}
          <Card sx={{ 
            mb: 4,
            background: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backdropFilter: 'blur(20px)',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3,
                mb: 4,
              }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    fontSize: '2rem',
                  }}
                >
                  {user?.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.8)})`,
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {user?.username}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {user?.isLegal ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                    {user?.isLegal ? 'Юридическое лицо' : 'Физическое лицо'}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={3}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}>
                  <EmailIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Box sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    borderColor: alpha(theme.palette.error.main, 0.3),
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      background: alpha(theme.palette.error.main, 0.04),
                    },
                  }}
                >
                  Выйти
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4 
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.8)})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Мои голосования
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Создать голосование
            </Button>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : votings.length === 0 ? (
            <Card sx={{ 
              p: 4,
              textAlign: 'center',
              background: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              backdropFilter: 'blur(20px)',
            }}>
              <Typography variant="body1" color="text.secondary">
                У вас пока нет созданных голосований
              </Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {votings.map((voting) => (
                <Card
                  key={voting.id}
                  sx={{
                    cursor: 'pointer',
                    background: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                  onClick={() => handleVotingClick(voting)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.8)})`,
                          backgroundClip: 'text',
                          textFillColor: 'transparent',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {voting.name}
                      </Typography>
                      <Box sx={{ 
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        background: alpha(getStatusColor(voting.status), 0.1),
                        border: `1px solid ${alpha(getStatusColor(voting.status), 0.2)}`,
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: getStatusColor(voting.status),
                            fontWeight: 500,
                          }}
                        >
                          {getStatusText(voting.status)}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      {voting.description}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Вопрос: {voting.question}
                    </Typography>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 3,
                      color: 'text.secondary',
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                      }}>
                        <TimeIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                        <Typography variant="body2">
                          Начало: {formatDate(voting.startDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                      }}>
                        <TimeIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                        <Typography variant="body2">
                          Окончание: {formatDate(voting.endDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Profile; 