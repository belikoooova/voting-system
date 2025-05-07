import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Добро пожаловать в систему онлайн-голосования
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Безопасное, анонимное и прозрачное голосование
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Основные возможности:
        </Typography>
        <ul>
          <li>Создание и управление голосованиями</li>
          <li>Анонимное участие в голосованиях</li>
          <li>Прозрачные результаты с возможностью верификации</li>
          <li>Безопасное хранение данных с использованием блокчейна</li>
        </ul>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
          >
            Войти
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
          >
            Зарегистрироваться
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Onboarding; 