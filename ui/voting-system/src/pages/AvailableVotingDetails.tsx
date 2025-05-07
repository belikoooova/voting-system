import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Container,
  useTheme,
  alpha,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  votingApi, 
  Voting, 
  VotingStatus, 
  PermissionRequestStatus,
  PermissionRequestStatusResponse,
  CheckVoteResponse,
  CheckVotingResultsResponse
} from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  HowToVote as VoteIcon,
  Visibility as WatchIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { 
  parseRsaPemToHex, 
  getPublicKey, 
  encryptVote, 
  blindSignMessage, 
  getZeroKnowledgeProof, 
  submitVote 
} from '../utils/crypto';
import { cryptoApi } from '../config/api';

const AvailableVotingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voting, setVoting] = useState<Voting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [votingLoading, setVotingLoading] = useState(false);
  const [voteRequestStatus, setVoteRequestStatus] = useState<PermissionRequestStatus>('NOT_REQUESTED');
  const [watchRequestStatus, setWatchRequestStatus] = useState<PermissionRequestStatus>('NOT_REQUESTED');
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [votingDialogOpen, setVotingDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteToken, setVoteToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showCheckVoteDialog, setShowCheckVoteDialog] = useState(false);
  const [checkVoteToken, setCheckVoteToken] = useState('');
  const [checkVoteResult, setCheckVoteResult] = useState<CheckVoteResponse | null>(null);
  const [checkVoteLoading, setCheckVoteLoading] = useState(false);
  const [checkVoteError, setCheckVoteError] = useState<string | null>(null);
  const [showAllVotesDialog, setShowAllVotesDialog] = useState(false);
  const [allVotes, setAllVotes] = useState<CheckVoteResponse[]>([]);
  const [allVotesLoading, setAllVotesLoading] = useState(false);
  const [allVotesError, setAllVotesError] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] = useState<CheckVoteResponse | null>(null);
  const [votingResults, setVotingResults] = useState<CheckVotingResultsResponse | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const theme = useTheme();

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

  useEffect(() => {
    fetchVoting();
  }, [id]);

  const fetchVoting = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [votingResponse, voteStatusResponse, watchStatusResponse] = await Promise.all([
        votingApi.getVoting(id),
        votingApi.getVoteRequestStatus(id),
        votingApi.getWatchRequestStatus(id)
      ]);
      setVoting(votingResponse.data);
      setVoteRequestStatus(voteStatusResponse.data.status);
      setWatchRequestStatus(watchStatusResponse.data.status);
    } catch (error) {
      console.error('Ошибка при получении голосования:', error);
      setError('Не удалось загрузить голосование');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = () => {
    setShowVoteDialog(true);
  };

  const handleVoteDialogClose = () => {
    setShowVoteDialog(false);
    setSelectedAnswer('');
  };

  const handleVote = async (answerId: string) => {
    if (!voting) return;
    
    try {
      setLoading(true);
      
      // Получаем публичный ключ
      const publicKey = await getPublicKey();
      
      // Шифруем голос
      const encryptedVote = encryptVote(answerId, publicKey);
      
      // Создаем слепую подпись
      const signature = await blindSignMessage(encryptedVote);
      
      // Получаем доказательство
      const zeroKnowledgeProof = await getZeroKnowledgeProof(voting.id);
      
      // Отправляем голос
      const response = await votingApi.vote(voting.id, {
        answerId,
        encryptedVote,
        zeroKnowledgeProof,
        signature,
      });
      
      setVotingDialogOpen(false);
      setSelectedAnswer('');
      setVoteToken(response.data.token);
      handleVoteDialogClose();
      setShowTokenDialog(true);
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      setErrorMessage('Не удалось отправить голос');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenDialogClose = () => {
    setShowTokenDialog(false);
    setVoteToken(null);
    fetchVoting(); // Перезагружаем страницу после подтверждения
  };

  const handleRequestVote = async () => {
    if (!voting) return;
    try {
      setVotingLoading(true);
      await votingApi.requestVote(voting.id);
      fetchVoting();
    } catch (error) {
      console.error('Ошибка при запросе на голосование:', error);
      setError('Не удалось отправить запрос на голосование');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleRequestWatch = async () => {
    if (!voting) return;
    try {
      setVotingLoading(true);
      await votingApi.requestWatch(voting.id);
      fetchVoting();
    } catch (error) {
      console.error('Ошибка при запросе на наблюдение:', error);
      setError('Не удалось отправить запрос на наблюдение');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleCheckVote = async () => {
    if (!voting || !checkVoteToken) return;
    
    try {
      setCheckVoteLoading(true);
      setCheckVoteError(null);
      const response = await votingApi.checkVote(voting.id, { voteToken: checkVoteToken });
      setCheckVoteResult(response.data);
    } catch (error) {
      console.error('Ошибка при проверке голоса:', error);
      setCheckVoteError('Не удалось проверить голос');
    } finally {
      setCheckVoteLoading(false);
    }
  };

  const handleCheckVoteDialogClose = () => {
    setShowCheckVoteDialog(false);
    setCheckVoteToken('');
    setCheckVoteResult(null);
    setCheckVoteError(null);
  };

  const handleCheckAllVotes = async () => {
    if (!voting) return;
    
    try {
      setAllVotesLoading(true);
      setAllVotesError(null);
      const response = await votingApi.checkAllVotes(voting.id);
      setAllVotes(response.data);
      setShowAllVotesDialog(true);
    } catch (error) {
      console.error('Ошибка при получении цепочки голосов:', error);
      setAllVotesError('Не удалось получить цепочку голосов');
    } finally {
      setAllVotesLoading(false);
    }
  };

  const handleAllVotesDialogClose = () => {
    setShowAllVotesDialog(false);
    setAllVotes([]);
    setSelectedVote(null);
    setAllVotesError(null);
  };

  const getVoteRequestButton = () => {
    switch (voteRequestStatus) {
      case 'NOT_REQUESTED':
        return (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRequestVote}
            disabled={votingLoading}
            startIcon={<VoteIcon />}
            sx={{
              borderColor: alpha(theme.palette.primary.main, 0.3),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Запросить право голоса
          </Button>
        );
      case 'CREATOR':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <InfoIcon sx={{ color: theme.palette.info.main }} />
            <Typography color="text.primary">
              Вы создатель этого голосования
            </Typography>
          </Box>
        );
      case 'REQUESTED':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.warning.main, 0.08),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <TimeIcon sx={{ color: theme.palette.warning.main }} />
            <Typography color="text.primary">
              Ваш запрос на голосование находится на рассмотрении
            </Typography>
          </Box>
        );
      case 'APPROVED':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.success.main, 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <CheckIcon sx={{ color: theme.palette.success.main }} />
            <Typography color="text.primary">
              У вас есть право голоса
            </Typography>
          </Box>
        );
      case 'REJECTED':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.error.main, 0.08),
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <ErrorIcon sx={{ color: theme.palette.error.main }} />
            <Typography color="text.primary">
              Ваш запрос на голосование был отклонен
            </Typography>
          </Box>
        );
      case 'USED':
        return (
          <Box>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2,
              background: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}>
              <CheckIcon sx={{ color: theme.palette.info.main }} />
              <Typography color="text.primary">
                Вы уже проголосовали
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowCheckVoteDialog(true)}
              startIcon={<VoteIcon />}
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Проверить голос
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  const getWatchRequestButton = () => {
    switch (watchRequestStatus) {
      case 'NOT_REQUESTED':
        return (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleRequestWatch}
            disabled={votingLoading}
            startIcon={<WatchIcon />}
            sx={{
              borderColor: alpha(theme.palette.secondary.main, 0.3),
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                background: alpha(theme.palette.secondary.main, 0.04),
              },
            }}
          >
            Запросить право наблюдения
          </Button>
        );
      case 'CREATOR':
            return (
              <Box>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2,
              background: alpha(theme.palette.info.main, 0.08),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}>
              <InfoIcon sx={{ color: theme.palette.info.main }} />
              <Typography color="text.primary">
                Вы создатель этого голосования
              </Typography>
            </Box>
            {voting && voting.status !== 'NOT_STARTED' && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCheckAllVotes}
              disabled={allVotesLoading}
                startIcon={<WatchIcon />}
                sx={{
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    background: alpha(theme.palette.secondary.main, 0.04),
                  },
                }}
            >
              Проверить цепочку голосов
            </Button>
            )}
          </Box>
        );
      case 'REQUESTED':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.warning.main, 0.08),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <TimeIcon sx={{ color: theme.palette.warning.main }} />
            <Typography color="text.primary">
              Ваш запрос на наблюдение находится на рассмотрении
            </Typography>
          </Box>
        );
      case 'APPROVED':
          return (
          <Box>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2,
              background: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}>
              <CheckIcon sx={{ color: theme.palette.success.main }} />
              <Typography color="text.primary">
                У вас есть право наблюдения
              </Typography>
            </Box>
            {voting && voting.status !== 'NOT_STARTED' && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCheckAllVotes}
              disabled={allVotesLoading}
                startIcon={<WatchIcon />}
                sx={{
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    background: alpha(theme.palette.secondary.main, 0.04),
                  },
                }}
            >
              Проверить цепочку голосов
            </Button>
            )}
          </Box>
        );
      case 'REJECTED':
        return (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: alpha(theme.palette.error.main, 0.08),
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <ErrorIcon sx={{ color: theme.palette.error.main }} />
            <Typography color="text.primary">
              Ваш запрос на наблюдение был отклонен
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const fetchVotingResults = async () => {
    if (!voting || voting.status !== 'FINISHED') return;
    
    try {
      setResultsLoading(true);
      setResultsError(null);
      const response = await votingApi.getVotingResults(voting.id);
      setVotingResults(response.data);
    } catch (error) {
      console.error('Ошибка при получении результатов:', error);
      setResultsError('Не удалось получить результаты голосования');
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (voting?.status === 'FINISHED') {
      fetchVotingResults();
    }
  }, [voting?.status]);

  const calculateTotalVotes = () => {
    if (!votingResults?.results) return 0;
    return Object.values(votingResults.results).reduce((sum, count) => sum + parseInt(count, 10), 0);
  };

  const calculatePercentage = (count: string) => {
    const total = calculateTotalVotes();
    if (total === 0) return 0;
    return (parseInt(count, 10) / total) * 100;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !voting) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Голосование не найдено'}</Alert>
      </Box>
    );
  }

  const canVote = voteRequestStatus === 'APPROVED' || voteRequestStatus === 'CREATOR';
  const canWatch = watchRequestStatus === 'APPROVED' || watchRequestStatus === 'CREATOR';
  const isActive = voting.status === 'IN_PROGRESS';

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
          {/* Кнопка назад */}
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ 
              mb: 4,
              color: 'text.secondary',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            Назад к списку
          </Button>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : error || !voting ? (
            <Alert 
              severity="error" 
              sx={{ 
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              {error || 'Голосование не найдено'}
            </Alert>
          ) : (
            <>
              {/* Основная информация */}
              <Card sx={{ 
                mb: 4,
                background: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(20px)',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Typography 
                      variant="h4" 
                      component="h1"
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
            label={voting.status === 'NOT_STARTED' ? 'Не начато' :
                   voting.status === 'IN_PROGRESS' ? 'В процессе' : 'Завершено'}
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
                    sx={{ 
                      mb: 4,
                      lineHeight: 1.7,
                    }}
                  >
          {voting.description}
        </Typography>

                  <Stack spacing={3}>
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        Вопрос голосования
          </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          color: 'text.secondary',
                          opacity: 0.9,
                        }}
                      >
            {voting.question}
          </Typography>
        </Box>

                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        Варианты ответов
          </Typography>
                      <Stack spacing={1}>
            {voting.answers.map((answer) => (
                          <Box
                            key={answer.id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.4),
                              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            }}
                          >
                            <Typography variant="body1">
                              {answer.description}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
        </Box>

                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        Сроки проведения
          </Typography>
                      <Stack direction="row" spacing={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <TimeIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
          <Typography variant="body1">
                            {format(voting.startDate, 'dd MMMM yyyy HH:mm', { locale: ru })}
          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <TimeIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
          <Typography variant="body1">
                            {format(voting.endDate, 'dd MMMM yyyy HH:mm', { locale: ru })}
          </Typography>
        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Действия */}
              <Stack spacing={3}>
        {isActive && (
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                  }}>
                    {/* Блок голосования */}
                    <Card sx={{ 
                      background: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      backdropFilter: 'blur(20px)',
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 3,
                          gap: 2,
                        }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}>
                            <VoteIcon />
                          </Box>
          <Box>
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
                              Голосование
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                            >
                              Управление вашим участием в голосовании
                            </Typography>
            </Box>
          </Box>
                        <Box>
                          {getVoteRequestButton()}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Блок наблюдения */}
                    <Card sx={{ 
                      background: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      backdropFilter: 'blur(20px)',
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 3,
                          gap: 2,
                        }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}>
                            <WatchIcon />
                          </Box>
                          <Box>
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
                              Наблюдение
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                            >
                              Проверка и мониторинг голосования
                            </Typography>
                          </Box>
                        </Box>
          <Box>
            {getWatchRequestButton()}
          </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

        {!isActive && (
                  <Alert 
                    severity="info"
                    sx={{ 
                      background: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      borderRadius: 2,
                    }}
                  >
            {voting.status === 'NOT_STARTED' 
              ? 'Голосование еще не началось'
              : 'Голосование завершено'}
          </Alert>
        )}

        {isActive && canVote && (
            <Button
              variant="contained"
              onClick={handleVoteClick}
              disabled={votingLoading}
                    startIcon={<VoteIcon />}
                    sx={{
                      py: 2,
                      px: 4,
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
              Проголосовать
            </Button>
                )}
              </Stack>

              {/* Результаты */}
              {voting.status === 'FINISHED' && (
                <Card sx={{ 
                  mt: 4,
                  background: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  backdropFilter: 'blur(20px)',
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        mb: 3,
                      }}
                    >
                      Результаты голосования
                    </Typography>
                    
                    {resultsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
          </Box>
                    ) : resultsError ? (
                      <Alert 
                        severity="error"
                        sx={{ 
                          background: alpha(theme.palette.error.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          borderRadius: 2,
                        }}
                      >
                        {resultsError}
                      </Alert>
                    ) : votingResults ? (
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 3,
                            color: 'text.secondary',
                          }}
                        >
                          Всего голосов: {calculateTotalVotes()}
                        </Typography>
                        
                        <Stack spacing={3}>
                          {Object.entries(votingResults.results).map(([answer, count]) => {
                            const percentage = calculatePercentage(count);
                            return (
                              <Box key={answer}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body1">{answer}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {count} голосов ({percentage.toFixed(1)}%)
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 4,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 4,
                                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    }
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    ) : (
                      <Alert 
                        severity="info"
                        sx={{ 
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          borderRadius: 2,
                        }}
                      >
                        Результаты голосования пока недоступны
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      </Container>

      {/* Диалоги */}
      <Dialog 
        open={showVoteDialog} 
        onClose={handleVoteDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Голосование
          </Typography>
        </DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            >
              {voting?.answers.map((answer) => (
                <FormControlLabel
                  key={answer.id}
                  value={answer.id}
                  control={<Radio />}
                  label={answer.description}
                  sx={{
                    p: 2,
                    m: 0,
                    mb: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleVoteDialogClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={() => handleVote(selectedAnswer)}
            disabled={!selectedAnswer || votingLoading}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            {votingLoading ? 'Отправка...' : 'Проголосовать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showTokenDialog} 
        onClose={handleTokenDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Голос успешно отправлен!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              background: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            Обязательно сохраните у себя токен для дальнейшего отслеживания!
          </Alert>
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-all',
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              fontFamily: 'monospace',
            }}
          >
            {voteToken}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleTokenDialogClose}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showCheckVoteDialog} 
        onClose={handleCheckVoteDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <VoteIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Проверка голоса
          </Typography>
              <Typography variant="body2" color="text.secondary">
                Введите токен для проверки вашего голоса
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={checkVoteToken}
            onChange={(e) => setCheckVoteToken(e.target.value)}
            placeholder="Введите токен"
            sx={{ 
              mt: 3,
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: alpha(theme.palette.divider, 0.1),
                },
                '&:hover fieldset': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          {checkVoteError && (
            <Alert 
              severity="error"
              sx={{ 
                mb: 3,
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              {checkVoteError}
            </Alert>
          )}
          {checkVoteResult && (
            <Card sx={{ 
              background: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              borderRadius: 2,
            }}>
              <CardContent>
                <Alert 
                  severity="success"
                  sx={{ 
                    mb: 3,
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    borderRadius: 2,
                  }}
                >
                Голос успешно проверен!
              </Alert>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      ID голоса
              </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.voteId}
              </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      ID пользователя
              </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.userId}
              </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Токен
              </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.voteToken}
              </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Зашифрованный голос
              </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.encryptedVote}
              </Typography>
            </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Доказательство
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.zeroKnowledgeProof}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Время
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {format(checkVoteResult.timestamp * 1000, 'dd MMMM yyyy HH:mm:ss', { locale: ru })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                      Хеш блока
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                      {checkVoteResult.blockHash}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCheckVoteDialogClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            Закрыть
          </Button>
          <Button
            onClick={handleCheckVote}
            disabled={!checkVoteToken || checkVoteLoading}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            {checkVoteLoading ? 'Проверка...' : 'Проверить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showAllVotesDialog} 
        onClose={handleAllVotesDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <WatchIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Цепочка голосов
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Просмотр всех голосов в блокчейне
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {allVotesError && (
            <Alert 
              severity="error"
              sx={{ 
                mb: 3,
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              {allVotesError}
            </Alert>
          )}
          {allVotesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 3,
                  color: 'text.secondary',
                }}
              >
                Всего голосов: {allVotes.length}
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2,
              }}>
                {allVotes.map((vote, index) => (
                  <Card
                    key={vote.voteId}
                    sx={{
                      cursor: 'pointer',
                      background: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    }}
                    onClick={() => setSelectedVote(vote)}
                  >
                    <CardContent>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 2,
                      }}>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                        }}>
                          #{index + 1}
                        </Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                          }}
                        >
                      Блок #{index + 1}
                    </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.background.paper, 0.4),
                          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        }}
                      >
                      {vote.blockHash}
                    </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleAllVotesDialogClose}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedVote}
        onClose={() => setSelectedVote(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <InfoIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Детали голоса
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Информация о выбранном голосе
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVote && (
            <Card sx={{ 
              background: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              borderRadius: 2,
            }}>
              <CardContent>
                <Stack spacing={3}>
              <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Токен
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                  {selectedVote.voteToken}
                </Typography>
              </Box>
              <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Зашифрованный голос
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                  {selectedVote.encryptedVote}
                </Typography>
              </Box>
              <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Доказательство
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                  {selectedVote.zeroKnowledgeProof}
                </Typography>
              </Box>
              <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Время
                </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                  {format(selectedVote.timestamp * 1000, 'dd MMMM yyyy HH:mm:ss', { locale: ru })}
                </Typography>
              </Box>
              <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Хеш блока
                </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all', 
                        fontFamily: 'monospace',
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      }}
                    >
                  {selectedVote.blockHash}
                </Typography>
              </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setSelectedVote(null)}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailableVotingDetails; 