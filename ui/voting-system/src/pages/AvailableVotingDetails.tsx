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
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
            startIcon={<HowToVoteIcon />}
          >
            Запросить право голоса
          </Button>
        );
      case 'CREATOR':
        return <Alert severity="info">Вы создатель этого голосования</Alert>;
      case 'REQUESTED':
        return <Alert severity="info">Ваш запрос на голосование находится на рассмотрении</Alert>;
      case 'APPROVED':
        return <Alert severity="success">У вас есть право голоса</Alert>;
      case 'REJECTED':
        return <Alert severity="error">Ваш запрос на голосование был отклонен</Alert>;
      case 'USED':
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>Вы уже проголосовали</Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowCheckVoteDialog(true)}
              startIcon={<HowToVoteIcon />}
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
            startIcon={<VisibilityIcon />}
          >
            Запросить право наблюдения
          </Button>
        );
      case 'CREATOR':
        if (voting!!.status !== 'NOT_STARTED') {
            return (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>Вы создатель этого голосования</Alert>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCheckAllVotes}
              disabled={allVotesLoading}
              startIcon={<VisibilityIcon />}
            >
              Проверить цепочку голосов
            </Button>
          </Box>
        );
      } else {
        return <Alert severity="info" sx={{ mb: 2 }}>Вы создатель этого голосования</Alert>;
      }
      case 'REQUESTED':
        return <Alert severity="info">Ваш запрос на наблюдение находится на рассмотрении</Alert>;
      case 'APPROVED':
        if (voting!!.status !== 'NOT_STARTED') {  
          return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>У вас есть право наблюдения</Alert>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCheckAllVotes}
              disabled={allVotesLoading}
              startIcon={<VisibilityIcon />}
            >
              Проверить цепочку голосов
            </Button>
          </Box>
        );
      } else {
        return <Alert severity="success" sx={{ mb: 2 }}>У вас есть право наблюдения</Alert>;
      }
      case 'REJECTED':
        return <Alert severity="error">Ваш запрос на наблюдение был отклонен</Alert>;
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
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {voting.name}
          </Typography>
          <Chip
            label={voting.status === 'NOT_STARTED' ? 'Не начато' :
                   voting.status === 'IN_PROGRESS' ? 'В процессе' : 'Завершено'}
            color={voting.status === 'IN_PROGRESS' ? 'success' :
                   voting.status === 'FINISHED' ? 'error' : 'default'}
          />
        </Box>

        <Typography variant="body1" paragraph>
          {voting.description}
        </Typography>

        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Вопрос:
          </Typography>
          <Typography variant="body1">
            {voting.question}
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Варианты ответов:
          </Typography>
          <List>
            {voting.answers.map((answer) => (
              <ListItem key={answer.id}>
                <ListItemText primary={answer.description} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Сроки проведения:
          </Typography>
          <Typography variant="body1">
            Начало: {format(voting.startDate, 'dd MMMM yyyy HH:mm', { locale: ru })}
          </Typography>
          <Typography variant="body1">
            Окончание: {format(voting.endDate, 'dd MMMM yyyy HH:mm', { locale: ru })}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {isActive && (
          <Box>
            <Box mb={2}>
              {getVoteRequestButton()}
            </Box>
          </Box>
        )}

        {
          <Box>
            {getWatchRequestButton()}
          </Box>
        }

        {!isActive && (
          <Alert severity="info">
            {voting.status === 'NOT_STARTED' 
              ? 'Голосование еще не началось'
              : 'Голосование завершено'}
          </Alert>
        )}

        {isActive && canVote && (
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleVoteClick}
              disabled={votingLoading}
              startIcon={<HowToVoteIcon />}
            >
              Проголосовать
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={showVoteDialog} onClose={handleVoteDialogClose}>
        <DialogTitle>Голосование</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
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
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleVoteDialogClose}>Отмена</Button>
          <Button
            onClick={() => handleVote(selectedAnswer)}
            disabled={!selectedAnswer || votingLoading}
            variant="contained"
            color="primary"
          >
            {votingLoading ? 'Отправка...' : 'Проголосовать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showTokenDialog} onClose={handleTokenDialogClose}>
        <DialogTitle>Голос успешно отправлен!</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Обязательно сохраните у себя токен для дальнейшего отслеживания!!!!
          </Alert>
          <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
            {voteToken}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTokenDialogClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showCheckVoteDialog} onClose={handleCheckVoteDialogClose}>
        <DialogTitle>Проверка голоса</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Введите токен, полученный вами при голосовании
          </Typography>
          <TextField
            fullWidth
            value={checkVoteToken}
            onChange={(e) => setCheckVoteToken(e.target.value)}
            placeholder="Введите токен"
            sx={{ mb: 2 }}
          />
          {checkVoteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checkVoteError}
            </Alert>
          )}
          {checkVoteResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Голос успешно проверен!
              </Alert>
              <Typography variant="subtitle2" gutterBottom>
                Информация о голосе:
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                ID голоса: {checkVoteResult.voteId}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                ID пользователя: {checkVoteResult.userId}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                Токен: {checkVoteResult.voteToken}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                Зашифрованный голос: {checkVoteResult.encryptedVote}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                Доказательство: {checkVoteResult.zeroKnowledgeProof}
              </Typography>
              <Typography variant="body2">
                Время: {format(checkVoteResult.timestamp * 1000, 'dd MMMM yyyy HH:mm:ss', { locale: ru })}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                Хеш блока: {checkVoteResult.blockHash}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCheckVoteDialogClose}>Закрыть</Button>
          <Button
            onClick={handleCheckVote}
            disabled={!checkVoteToken || checkVoteLoading}
            variant="contained"
            color="primary"
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
      >
        <DialogTitle>Цепочка голосов</DialogTitle>
        <DialogContent>
          {allVotesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {allVotesError}
            </Alert>
          )}
          {allVotesLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Всего голосов: {allVotes.length}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {allVotes.map((vote, index) => (
                  <Paper
                    key={vote.voteId}
                    elevation={3}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      width: '200px',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => setSelectedVote(vote)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Блок #{index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {vote.blockHash}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAllVotesDialogClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedVote}
        onClose={() => setSelectedVote(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Детали голоса</DialogTitle>
        <DialogContent>
          {selectedVote && (
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Информация о голосе
            </Typography>
            
            <Box sx={{ ml: 1.5, '& > :not(:last-child)': { mb: 2 } }}>
              <Box>
                <Typography variant="overline" display="block" sx={{ lineHeight: 1.3, color: 'text.disabled' }}>
                  Токен
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {selectedVote.voteToken}
                </Typography>
              </Box>
          
              <Box>
                <Typography variant="overline" display="block" sx={{ lineHeight: 1.3, color: 'text.disabled' }}>
                  Зашифрованный голос
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {selectedVote.encryptedVote}
                </Typography>
              </Box>
          
              <Box>
                <Typography variant="overline" display="block" sx={{ lineHeight: 1.3, color: 'text.disabled' }}>
                  Доказательство
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {selectedVote.zeroKnowledgeProof}
                </Typography>
              </Box>
          
              <Box>
                <Typography variant="overline" display="block" sx={{ lineHeight: 1.3, color: 'text.disabled' }}>
                  Время
                </Typography>
                <Typography variant="body2">
                  {format(selectedVote.timestamp * 1000, 'dd MMMM yyyy HH:mm:ss', { locale: ru })}
                </Typography>
              </Box>
          
              <Box>
                <Typography variant="overline" display="block" sx={{ lineHeight: 1.3, color: 'text.disabled' }}>
                  Хеш блока
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {selectedVote.blockHash}
                </Typography>
              </Box>
            </Box>
          </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedVote(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {voting.status === 'FINISHED' && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Результаты голосования
          </Typography>
          
          {resultsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : resultsError ? (
            <Alert severity="error">{resultsError}</Alert>
          ) : votingResults ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Всего голосов: {calculateTotalVotes()}
              </Typography>
              
              <List>
                {Object.entries(votingResults.results).map(([answer, count]) => {
                  const percentage = calculatePercentage(count);
                  return (
                    <ListItem key={answer}>
                      <Box sx={{ width: '100%' }}>
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
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 5,
                            }
                          }}
                        />
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ) : (
            <Alert severity="info">Результаты голосования пока недоступны</Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AvailableVotingDetails; 