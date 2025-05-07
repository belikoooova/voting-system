import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  TextField,
  LinearProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  votingApi, 
  Voting, 
  WatchOrVoteRequest, 
  VotingStatus, 
  Answer, 
  CreateVotingRequest,
  AnswerForWatchOrVoteRequest,
  PermissionRequestStatus,
  PermissionRequestStatusResponse,
  CheckVotingResultsResponse
} from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

interface VotingResults {
  options: {
    text: string;
    votes: number;
  }[];
  totalVotes: number;
}

const VotingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voting, setVoting] = useState<Voting | null>(null);
  const [results, setResults] = useState<CheckVotingResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVoteRequests, setShowVoteRequests] = useState(false);
  const [showWatchRequests, setShowWatchRequests] = useState(false);
  const [voteRequests, setVoteRequests] = useState<WatchOrVoteRequest[]>([]);
  const [watchRequests, setWatchRequests] = useState<WatchOrVoteRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [editingAnswers, setEditingAnswers] = useState<string[]>([]);
  const [requestAnswers, setRequestAnswers] = useState<Record<string, boolean>>({});
  const [voteRequestsDialogOpen, setVoteRequestsDialogOpen] = useState(false);
  const [watchRequestsDialogOpen, setWatchRequestsDialogOpen] = useState(false);
  const [votedSuccessfully, setVotedSuccessfully] = useState(false);

  const fetchVoting = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await votingApi.getMyVoting(id);
      setVoting(response.data);

      if (response.data.status === 'FINISHED') {
        const resultsResponse = await votingApi.getVotingResults(id);
        setResults(resultsResponse.data);
      }

      if (user && response.data.creatorId === user.id) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Ошибка при получении голосования:', error);
      setError('Не удалось загрузить голосование');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteRequests = async () => {
    try {
      const response = await votingApi.getVoteRequests();
      setVoteRequests(response.data);
      setRequestAnswers({});
      setVoteRequestsDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при получении запросов на голосование:', error);
      setError('Не удалось загрузить запросы на голосование');
    }
  };

  const fetchWatchRequests = async () => {
    try {
      const response = await votingApi.getWatchRequests();
      setWatchRequests(response.data);
      setRequestAnswers({});
      setWatchRequestsDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при получении запросов на наблюдение:', error);
      setError('Не удалось загрузить запросы на наблюдение');
    }
  };

  const fetchRequests = async () => {
    if (!user || !voting || voting.creatorId !== user.id) return;
    try {
      const [voteResponse, watchResponse] = await Promise.all([
        votingApi.getVoteRequests(),
        votingApi.getWatchRequests()
      ]);
      setVoteRequests(voteResponse.data);
      setWatchRequests(watchResponse.data);
    } catch (error) {
      console.error('Ошибка при получении запросов:', error);
      setError('Не удалось загрузить запросы');
    }
  };

  useEffect(() => {
    fetchVoting();
  }, [id]);

  useEffect(() => {
    if (voting) {
      setEditingAnswers(voting.answers.map(answer => answer.description));
    }
  }, [voting]);

  const handleVote = async () => {
    if (!voting || !id) return;
    try {
      await votingApi.vote(id, {
        answerId: selectedAnswers[0],
        encryptedVote: '', // TODO: Добавить шифрование
        zeroKnowledgeProof: '', // TODO: Добавить доказательство
        signature: '', // TODO: Добавить подпись
      });
      setShowVoteDialog(false);
      setVotedSuccessfully(true);
      fetchVoting();
    } catch (err) {
      console.error('Ошибка при голосовании:', err);
      setError('Не удалось отправить голос');
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await votingApi.deleteMyVoting(id!);
      navigate('/votings');
    } catch (error) {
      console.error('Ошибка при удалении голосования:', error);
      setError('Не удалось удалить голосование');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = (permissionId: string, approve: boolean) => {
    setRequestAnswers(prev => ({
      ...prev,
      [permissionId]: approve
    }));
  };

  const handleSubmitVoteRequests = async () => {
    try {
      const answers: AnswerForWatchOrVoteRequest[] = Object.entries(requestAnswers)
        .map(([permissionId, approve]) => ({
          permissionId,
          approve
        }));
      await votingApi.answerVoteRequests(answers);
      setVoteRequestsDialogOpen(false);
      fetchVoting();
    } catch (error) {
      console.error('Ошибка при обработке запросов на голосование:', error);
      setError('Не удалось обработать запросы на голосование');
    }
  };

  const handleSubmitWatchRequests = async () => {
    try {
      const answers: AnswerForWatchOrVoteRequest[] = Object.entries(requestAnswers)
        .map(([permissionId, approve]) => ({
          permissionId,
          approve
        }));
      await votingApi.answerWatchRequests(answers);
      setWatchRequestsDialogOpen(false);
      fetchVoting();
    } catch (error) {
      console.error('Ошибка при обработке запросов на наблюдение:', error);
      setError('Не удалось обработать запросы на наблюдение');
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd.MM.yyyy HH:mm', { locale: ru });
  };

  const getStatusColor = (status: VotingStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'success';
      case 'FINISHED':
        return 'error';
      case 'NOT_STARTED':
        return 'warning';
      default:
        return 'default';
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

  const isCreator = user && voting?.creatorId === user.id;
  const canVote = voting?.status === 'IN_PROGRESS' && !isCreator;

  const handleSave = async () => {
    if (!voting || !id) return;
    try {
      const editData: CreateVotingRequest = {
        name: voting.name,
        description: voting.description,
        question: voting.question,
        answers: editingAnswers,
        startDate: voting.startDate,
        endDate: voting.endDate,
      };
      await votingApi.editMyVoting(id, editData);
      setError(null);
      fetchVoting();
    } catch (err) {
      console.error('Ошибка при редактировании голосования:', err);
      setError('Не удалось сохранить изменения');
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...editingAnswers];
    newAnswers[index] = value;
    setEditingAnswers(newAnswers);
  };

  const handleAddAnswer = () => {
    setEditingAnswers([...editingAnswers, '']);
  };

  const handleRemoveAnswer = (index: number) => {
    const newAnswers = editingAnswers.filter((_, i) => i !== index);
    setEditingAnswers(newAnswers);
  };

  const renderRequestsDialog = (
    open: boolean,
    onClose: () => void,
    title: string,
    requests: WatchOrVoteRequest[],
    onSubmit: () => void
  ) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <List>
          {requests.map((request) => (
            <ListItem
              key={request.permissionId}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Одобрить">
                    <IconButton
                      edge="end"
                      color={requestAnswers[request.permissionId] === true ? "success" : "default"}
                      onClick={() => handleRequestResponse(request.permissionId, true)}
                      sx={{ 
                        mr: 1,
                        border: requestAnswers[request.permissionId] === true ? '2px solid' : 'none',
                        borderColor: 'success.main'
                      }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Отклонить">
                    <IconButton
                      edge="end"
                      color={requestAnswers[request.permissionId] === false ? "error" : "default"}
                      onClick={() => handleRequestResponse(request.permissionId, false)}
                      sx={{ 
                        border: requestAnswers[request.permissionId] === false ? '2px solid' : 'none',
                        borderColor: 'error.main'
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemText
                primary={`${request.userName} (${request.userEmail})`}
                secondary={`Голосование: ${request.voteName}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          color="primary"
          disabled={Object.keys(requestAnswers).length === 0}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );

  const calculateTotalVotes = () => {
    if (!results?.results) return 0;
    return Object.values(results.results).reduce((sum, count) => sum + parseInt(count, 10), 0);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {voting.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isCreator && (
            <>
              <Button
                variant="outlined"
                startIcon={<HowToVoteIcon />}
                onClick={fetchVoteRequests}
              >
                Запросы на голосование
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={fetchWatchRequests}
              >
                Запросы на наблюдение
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteDialog(true)}
              >
                Удалить
              </Button>
            </>
          )}
          {!isCreator && voting.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="outlined"
                onClick={() => handleRequestResponse(voteRequests[0].permissionId, true)}
                disabled={requestLoading}
              >
                Запросить голосование
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleRequestResponse(watchRequests[0].permissionId, true)}
                disabled={requestLoading}
              >
                Запросить наблюдение
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Информация о голосовании</Typography>
          <Chip
            label={getStatusText(voting.status as VotingStatus)}
            color={getStatusColor(voting.status as VotingStatus) as any}
          />
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Описание
            </Typography>
            <Typography>{voting.description}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Вопрос
            </Typography>
            <Typography>{voting.question}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Варианты ответов
            </Typography>
            <List>
              {voting.answers.map((answer) => (
                <ListItem key={answer.id}>
                  <ListItemText primary={answer.description} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Дата начала
              </Typography>
              <Typography>{formatDate(voting.startDate)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Дата окончания
              </Typography>
              <Typography>{formatDate(voting.endDate)}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {isCreator && voting.status === 'NOT_STARTED' && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Редактирование голосования
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="Название"
              value={voting.name}
              onChange={(e) => setVoting({ ...voting, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Описание"
              value={voting.description}
              onChange={(e) => setVoting({ ...voting, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Вопрос"
              value={voting.question}
              onChange={(e) => setVoting({ ...voting, question: e.target.value })}
            />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Варианты ответов
              </Typography>
              {editingAnswers.map((answer, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                  />
                  {editingAnswers.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveAnswer(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={handleAddAnswer}
                sx={{ mt: 1 }}
              >
                Добавить вариант
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Дата начала"
                type="datetime-local"
                value={format(new Date(voting.startDate), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setVoting({ ...voting, startDate: new Date(e.target.value).getTime() })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Дата окончания"
                type="datetime-local"
                value={format(new Date(voting.endDate), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setVoting({ ...voting, endDate: new Date(e.target.value).getTime() })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setEditingAnswers(voting.answers.map(answer => answer.description))}
              >
                Отмена
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
              >
                Сохранить
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {canVote && !votedSuccessfully && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ваш голос
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswers[0] || ''}
              onChange={(e) => setSelectedAnswers([e.target.value])}
            >
              {voting.answers.map((answer) => (
                <FormControlLabel
                  key={answer.id}
                  value={answer.id}
                  control={<Radio />}
                  label={answer.description}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      )}

      {voting.status === 'FINISHED' && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Результаты голосования
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : results ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Всего голосов: {calculateTotalVotes()}
              </Typography>
              
              <List>
                {Object.entries(results.results).map(([answer, count]) => {
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

      {renderRequestsDialog(
        voteRequestsDialogOpen,
        () => setVoteRequestsDialogOpen(false),
        'Запросы на голосование',
        voteRequests,
        handleSubmitVoteRequests
      )}

      {renderRequestsDialog(
        watchRequestsDialogOpen,
        () => setWatchRequestsDialogOpen(false),
        'Запросы на наблюдение',
        watchRequests,
        handleSubmitWatchRequests
      )}

      <Dialog
        open={showVoteDialog}
        onClose={() => setShowVoteDialog(false)}
      >
        <DialogTitle>Подтверждение голоса</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите проголосовать за выбранные варианты? После отправки голоса его нельзя будет изменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVoteDialog(false)}>
            Отмена
          </Button>
          <Button onClick={handleVote} variant="contained">
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Удаление голосования</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить это голосование? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VotingDetails; 