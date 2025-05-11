import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  Container,
  useTheme,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  alpha,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Sort as SortIcon,
  AccessTime as TimeIcon,
  HowToVote as VoteIcon,
  Visibility as WatchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { votingApi, Voting, VotingFilter, VotingStatus } from '../config/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VotingStatus | ''>('');
  const [approvedForWatching, setApprovedForWatching] = useState<boolean | undefined>(undefined);
  const [approvedForVoting, setApprovedForVoting] = useState<boolean | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchVotings = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: VotingFilter = {
        status: statusFilter || undefined,
        approvedForWatching,
        approvedForVoting,
      };
      const response = await votingApi.getAvailableVotings(filter);
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
  }, [statusFilter, approvedForWatching, approvedForVoting]);

  const handleCreateClick = () => {
    navigate('/votings/create');
  };

  const handleVotingClick = (voting: Voting) => {
    navigate(`/available-votings/${voting.id}`);
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

  const handleSortClick = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedVotings = [...votings].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.startDate - b.startDate;
    }
    return b.startDate - a.startDate;
  });

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  const getStatusColor = (status: VotingStatus) => {
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 6,
            position: 'relative',
          }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Голосования
        </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ 
                  opacity: 0.8,
                  maxWidth: '600px',
                }}
              >
                Здесь вы можете просмотреть все голосования и запросить право на голосование или наблюдение
        </Typography>
      </Box>
          <Button
            variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
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
          <Box sx={{ 
            mb: 6,
            p: 4,
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.4),
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 4px 30px ${alpha(theme.palette.common.black, 0.05)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: alpha(theme.palette.background.paper, 0.5),
              borderColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}>
                <FilterIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Фильтры и сортировка
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Настройте параметры отображения голосований
                </Typography>
              </Box>
            </Stack>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={3} 
              alignItems="center"
              sx={{
                '& .MuiFormControl-root': {
                  flex: 1,
                },
              }}
            >
              <FormControl>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusFilter}
                  label="Статус"
                  onChange={handleStatusFilterChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.1),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-select': {
                      py: 2,
                    },
                  }}
                >
                  <MenuItem value="">Все статусы</MenuItem>
                  <MenuItem value="NOT_STARTED">Не начато</MenuItem>
                  <MenuItem value="IN_PROGRESS">В процессе</MenuItem>
                  <MenuItem value="FINISHED">Завершено</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Доступ для наблюдения</InputLabel>
                <Select
                  value={approvedForWatching === undefined ? '' : approvedForWatching.toString()}
                  label="Доступ для наблюдения"
                  onChange={(e) => handleApprovalFilterChange('watching', e.target.value === '' ? undefined : e.target.value === 'true')}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.1),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,    
                      lineHeight: 1.2,
                    },
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="true">Одобрено</MenuItem>
                  <MenuItem value="false">Не одобрено</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Доступ для голосования</InputLabel>
                <Select
                  value={approvedForVoting === undefined ? '' : approvedForVoting.toString()}
                  label="Доступ для голосования"
                  onChange={(e) => handleApprovalFilterChange('voting', e.target.value === '' ? undefined : e.target.value === 'true')}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.1),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-select': {
                      py: 2,
                    },
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="true">Одобрено</MenuItem>
                  <MenuItem value="false">Не одобрено</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={`Сортировка по дате начала (${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'})`}>
                <IconButton 
                  onClick={handleSortClick} 
                  sx={{ 
                    width: 48,
                    height: 48,
                    color: sortOrder === 'asc' ? theme.palette.primary.main : 'text.secondary',
                    background: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SortIcon />
                </IconButton>
              </Tooltip>
            </Stack>
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
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              background: alpha(theme.palette.background.paper, 0.6),
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Голосования не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Попробуйте изменить параметры фильтрации
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 4 }}>
              {sortedVotings.map((voting) => (
                <Card
                  key={voting.id}
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleVotingClick(voting)}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Typography 
                          variant="h5" 
                          component="h2" 
                          gutterBottom
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
                        <Chip
                          label={getStatusText(voting.status)}
                          sx={{
                            background: `${alpha(getStatusColor(voting.status), 0.1)}`,
                            color: getStatusColor(voting.status),
                            border: `1px solid ${alpha(getStatusColor(voting.status), 0.2)}`,
                            fontWeight: 500,
                            px: 1,
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        paragraph
                        sx={{ 
                          mb: 3,
                          lineHeight: 1.7,
                        }}
                      >
                        {voting.description}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        paragraph
                        sx={{ 
                          mb: 3,
                          opacity: 0.8,
                        }}
                      >
                        Вопрос: {voting.question}
                      </Typography>
                      <Stack 
                        direction="row" 
                        spacing={3} 
                        sx={{ 
                          mt: 3,
                          pt: 3,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <TimeIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
                          <Typography variant="body2">
                            {formatDate(voting.startDate)} - {formatDate(voting.endDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <VoteIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
                          <Typography variant="body2">
                            {voting.answers.length} вариантов
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Box>
    </Container>
    </Box>
  );
};

export default Home; 