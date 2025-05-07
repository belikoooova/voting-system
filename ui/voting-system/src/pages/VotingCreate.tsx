import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { votingApi, CreateVotingRequest } from '../config/api';
import { addMinutes, isBefore } from 'date-fns';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface FormData {
  name: string;
  description: string;
  question: string;
  startDate: Date | null;
  endDate: Date | null;
  answers: string[];
}

const VotingCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    question: '',
    startDate: null,
    endDate: null,
    answers: [''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const now = new Date();

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }

    if (!formData.question.trim()) {
      newErrors.question = 'Вопрос обязателен';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обязательна';
    } else if (isBefore(formData.startDate, now)) {
      newErrors.startDate = 'Дата начала должна быть в будущем';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Дата окончания обязательна';
    } else if (isBefore(formData.endDate, now)) {
      newErrors.endDate = 'Дата окончания должна быть в будущем';
    }

    if (formData.startDate && formData.endDate && isBefore(formData.endDate, formData.startDate)) {
      newErrors.endDate = 'Дата окончания должна быть позже даты начала';
    }

    if (formData.startDate && formData.endDate) {
      const diffInMinutes = (formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60);
      if (diffInMinutes < 5) {
        newErrors.endDate = 'Голосование должно длиться минимум 5 минут';
      }
    }

    if (formData.answers.length < 2) {
      newErrors.answers = 'Необходимо добавить минимум два варианта ответа';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDates = (startDate: Date | null, endDate: Date | null) => {
    const newErrors: Record<string, string> = { ...errors };
    const now = new Date();

    if (startDate) {
      if (isBefore(startDate, now)) {
        newErrors.startDate = 'Дата начала должна быть в будущем';
      } else {
        delete newErrors.startDate;
      }
    }

    if (endDate) {
      if (isBefore(endDate, now)) {
        newErrors.endDate = 'Дата окончания должна быть в будущем';
      } else if (startDate && isBefore(endDate, startDate)) {
        newErrors.endDate = 'Дата окончания должна быть позже даты начала';
      } else if (startDate) {
        const diffInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
        if (diffInMinutes < 5) {
          newErrors.endDate = 'Голосование должно длиться минимум 5 минут';
        } else {
          delete newErrors.endDate;
        }
      } else {
        delete newErrors.endDate;
      }
    }

    setErrors(newErrors);
  };

  const handleAddOption = () => {
    setFormData({ ...formData, answers: [...formData.answers, ''] });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.answers.length > 2) {
      const newAnswers = formData.answers.filter((_, i) => i !== index);
      setFormData({ ...formData, answers: newAnswers });
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const newAnswers = formData.answers.map((answer, i) => (i === index ? text : answer));
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const votingData: CreateVotingRequest = {
        name: formData.name,
        description: formData.description,
        question: formData.question,
        answers: formData.answers,
        startDate: formData.startDate!.getTime(),
        endDate: formData.endDate!.getTime(),
      };
      await votingApi.createVoting(votingData);
      navigate('/votings');
    } catch (error) {
      console.error('Ошибка при создании голосования:', error);
      setApiError('Не удалось создать голосование');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.name || formData.description || formData.question || formData.answers.some(opt => opt)) {
      setShowCancelDialog(true);
    } else {
      navigate('/votings');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Создание голосования
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {apiError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
              <TextField
                required
                fullWidth
                label="Название"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Box>

            <Box>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Box>

            <Box>
              <TextField
                required
                fullWidth
                label="Вопрос"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                error={!!errors.question}
                helperText={errors.question}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                  <DateTimePicker
                    label="Дата начала"
                    value={formData.startDate}
                    onChange={(date) => {
                      setFormData({ ...formData, startDate: date });
                      validateDates(date, formData.endDate);
                    }}
                    minDateTime={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                  <DateTimePicker
                    label="Дата окончания"
                    value={formData.endDate}
                    onChange={(date) => {
                      setFormData({ ...formData, endDate: date });
                      validateDates(formData.startDate, date);
                    }}
                    minDateTime={formData.startDate ? addMinutes(formData.startDate, 5) : new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Варианты ответа
              </Typography>
              {formData.answers.map((answer, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    required
                    label={`Вариант ${index + 1}`}
                    value={answer}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    error={!!errors.answers}
                    helperText={index === formData.answers.length - 1 ? errors.answers : ''}
                  />
                  {formData.answers.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveOption(index)}
                      sx={{ alignSelf: 'center' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                sx={{ mt: 1 }}
              >
                Добавить вариант
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setShowCancelDialog(true)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Создать'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
      >
        <DialogTitle>Отменить создание голосования?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            У вас есть несохраненные изменения. Вы уверены, что хотите отменить создание голосования?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Продолжить редактирование
          </Button>
          <Button onClick={() => navigate('/votings')} color="error">
            Отменить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VotingCreate; 