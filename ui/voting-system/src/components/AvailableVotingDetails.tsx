import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Stack,
} from '@mui/material';
import { votingApi } from '../config/api';
import { Voting, VotingRequest, VotingAnswer } from '../types/voting';
import { blindSignMessage, encryptAnswer, getZKProof, submitVote, getPublicKey } from '../utils/crypto';

const AvailableVotingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [voting, setVoting] = useState<Voting | null>(null);
  const [votingRequest, setVotingRequest] = useState<VotingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<VotingAnswer | null>(null);
  const [voteToken, setVoteToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const userId = localStorage.getItem('userId') || '';

  const handleVote = async () => {
    if (!selectedAnswer || !id) return;

    try {
      setLoading(true);
      setError(null);

      const publicKey = await getPublicKey();
      console.log('Получен публичный ключ');

      const encryptedVote = await encryptAnswer(selectedAnswer.id, publicKey);
      console.log('Голос зашифрован');

      const voteToken = await blindSignMessage(selectedAnswer.id);
      console.log('Создана слепая подпись');

      const zkProof = await getZKProof(id, userId);
      console.log('Получено доказательство с нулевым разглашением');

      await submitVote(
        id,
        userId,
        selectedAnswer.id,
        encryptedVote,
        zkProof,
        voteToken
      );
      console.log('Голос успешно отправлен');

      setVoteToken(voteToken);
      setShowTokenDialog(true);
      setVotingRequest((prev: VotingRequest | null) => prev ? { ...prev, status: 'USED' } : null);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      setError('Не удалось отправить голос. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTokenDialog = () => {
    setShowTokenDialog(false);
    setVoteToken(null);
  };

  const canVote = votingRequest && (votingRequest.status === 'APPROVED' || votingRequest.status === 'CREATOR');

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : voting ? (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {voting.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {voting.description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={`Статус: ${voting.status}`} color="primary" />
              <Chip label={`Тип: ${voting.type}`} color="secondary" />
            </Stack>
          </Paper>

          {votingRequest && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ваш запрос на участие
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={`Статус: ${votingRequest.status}`}
                  color={votingRequest.status === 'APPROVED' ? 'success' : 'default'}
                />
              </Stack>
            </Paper>
          )}

          {canVote && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Выберите вариант ответа
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedAnswer?.id || ''}
                  onChange={(e) => {
                    const answer = voting?.answers.find((a: VotingAnswer) => a.id === e.target.value);
                    setSelectedAnswer(answer || null);
                  }}
                >
                  {voting?.answers.map((answer: VotingAnswer) => (
                    <FormControlLabel
                      key={answer.id}
                      value={answer.id}
                      control={<Radio />}
                      label={answer.text}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVote}
                  disabled={!selectedAnswer || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Голосовать'}
                </Button>
              </Box>
            </Paper>
          )}

          {/* Диалог с токеном */}
          <Dialog open={showTokenDialog} onClose={handleCloseTokenDialog}>
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
              <Button onClick={handleCloseTokenDialog} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Alert severity="error">Голосование не найдено</Alert>
      )}
    </Box>
  );
};

export default AvailableVotingDetails; 