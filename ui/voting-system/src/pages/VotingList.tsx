import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Sort as SortIcon } from '@mui/icons-material';
import { votingApi, Voting, VotingFilter, VotingStatus } from '../config/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const VotingList = () => {
  const navigate = useNavigate();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listType, setListType] = useState<'my' | 'available'>('my');
  const [statusFilter, setStatusFilter] = useState<VotingStatus | ''>('');
  const [approvedForWatching, setApprovedForWatching] = useState<boolean | undefined>(undefined);
  const [approvedForVoting, setApprovedForVoting] = useState<boolean | undefined>(undefined);

  const fetchVotings = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (listType === 'my') {
        response = await votingApi.getMyVotings();
        setVotings(response.data);
      } else {
        const filter: VotingFilter = {
          status: statusFilter || undefined,
          approvedForWatching,
          approvedForVoting,
        };
        const params = new URLSearchParams();
        if (filter.status) params.append('status', filter.status);
        if (filter.approvedForWatching !== undefined) params.append('approvedForWatching', filter.approvedForWatching.toString());
        if (filter.approvedForVoting !== undefined) params.append('approvedForVoting', filter.approvedForVoting.toString());
        
        response = await votingApi.getAvailableVotings(filter);
        setVotings(response.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке голосований:', err);
      setError('Не удалось загрузить список голосований');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [listType, statusFilter, approvedForWatching, approvedForVoting]);

  const handleCreateClick = () => {
    navigate('/votings/create');
  };

  const handleVotingClick = (voting: Voting) => {
    if (listType === 'available') {
      navigate(`/available-votings/${voting.id}`);
    } else {
      navigate(`/votings/${voting.id}`);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'my' | 'available') => {
    setListType(newValue);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as VotingStatus | '');
  };

  const handleApprovalFilterChange = (type: 'watching' | 'voting', value: boolean | undefined) => {
    if (type === 'watching') {
      setApprovedForWatching(value);
    } else {
      setApprovedForVoting(value);
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  const getStatusColor = (status: VotingStatus) => {
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

  const getStatusText = (status: VotingStatus) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Голосования
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Создать голосование
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Tabs
          value={listType}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Мои голосования" value="my" />
          <Tab label="Доступные голосования" value="available" />
        </Tabs>

        {listType === 'available' && (
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusFilter}
                  label="Статус"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="NOT_STARTED">Не начато</MenuItem>
                  <MenuItem value="IN_PROGRESS">В процессе</MenuItem>
                  <MenuItem value="FINISHED">Завершено</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Доступ для наблюдения</InputLabel>
                <Select
                  value={approvedForWatching === undefined ? '' : approvedForWatching.toString()}
                  label="Доступ для наблюдения"
                  onChange={(e) => handleApprovalFilterChange('watching', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="true">Одобрено</MenuItem>
                  <MenuItem value="false">Не одобрено</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Доступ для голосования</InputLabel>
                <Select
                  value={approvedForVoting === undefined ? '' : approvedForVoting.toString()}
                  label="Доступ для голосования"
                  onChange={(e) => handleApprovalFilterChange('voting', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="true">Одобрено</MenuItem>
                  <MenuItem value="false">Не одобрено</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}

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
            Голосования не найдены
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
      </Paper>
    </Box>
  );
};

export default VotingList; 