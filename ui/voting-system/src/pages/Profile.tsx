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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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
        return 'success.main';
      case 'FINISHED':
        return 'error.main';
      case 'NOT_STARTED':
        return 'warning.main';
      default:
        return 'text.secondary';
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
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Профиль пользователя
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Имя пользователя</Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.username}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Email</Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Тип пользователя</Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.isLegal ? 'Юридическое лицо' : 'Физическое лицо'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Выйти
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Мои голосования
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Создать голосование
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : votings.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          У вас пока нет созданных голосований
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {votings.map((voting) => (
            <Paper
              key={voting.id}
              elevation={1}
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleVotingClick(voting)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {voting.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {voting.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Вопрос: {voting.question}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: getStatusColor(voting.status),
                    fontWeight: 'bold',
                  }}
                >
                  {getStatusText(voting.status)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Начало: {formatDate(voting.startDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Окончание: {formatDate(voting.endDate)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Profile; 