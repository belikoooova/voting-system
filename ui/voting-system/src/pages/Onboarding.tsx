import React, { useRef } from 'react';
import { Box, Typography, Button, Container, useTheme, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowForward as ArrowIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  Storage as StorageIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';

const FeatureItem = ({ icon: Icon, title, description, theme }: {
  icon: React.ElementType;
  title: string;
  description: string;
  theme: any;
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      p: 4,
      borderRadius: 4,
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        background: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        '& .icon-wrapper': {
          transform: 'scale(1.1) rotate(5deg)',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: '#fff',
        },
        '& .gradient-bg': {
          opacity: 0.1,
          transform: 'scale(1.1)',
        }
      },
    }}
  >
    <Box
      className="gradient-bg"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        opacity: 0,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
      }}
    />
    <Box
      className="icon-wrapper"
      sx={{
        width: 56,
        height: 56,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3,
        background: 'rgba(59, 130, 246, 0.1)',
        color: 'primary.main',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Icon sx={{ fontSize: 28 }} />
    </Box>
    <Typography 
      variant="h6" 
      sx={{ 
        mb: 2, 
        fontWeight: 500,
        position: 'relative',
        zIndex: 1,
        fontSize: '1.25rem',
      }}
    >
      {title}
    </Typography>
    <Typography 
      variant="body1" 
      color="text.secondary"
      sx={{
        position: 'relative',
        zIndex: 1,
        lineHeight: 1.7,
        fontSize: '1rem',
      }}
    >
      {description}
    </Typography>
  </Box>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Container maxWidth="lg">
      {/* Hero секция */}
      <Box
        sx={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Фоновые элементы */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            zIndex: 0,
            opacity: 0.1,
            background: `radial-gradient(circle at center, ${theme.palette.primary.main} 0%, transparent 70%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle at center, ${theme.palette.secondary.main} 0%, transparent 70%)`,
            opacity: 0.1,
            zIndex: 0,
          }}
        />

        {/* Основной контент */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '3rem', md: '5rem' },
              fontWeight: 500,
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
            }}
          >
            VoteChain
          </Typography>
          
          <Typography
            variant="h5"
            component="h2"
            color="text.secondary"
            sx={{
              mb: 6,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Голосование нового поколения
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              endIcon={<ArrowIcon />}
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              }}
            >
              Начать
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={scrollToFeatures}
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              Узнать больше
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Секция с информацией */}
      <Box
        ref={featuresRef}
        sx={{
          py: 4,
          position: 'relative',
        }}
      >
        <Typography
          variant="h2"
          component="h2"
          align="center"
          sx={{
            mb: 8,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          Почему VoteChain?
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)'
            },
            gap: 4,
            mb: 8,
            px: { xs: 2, md: 4 }
          }}
        >
          <FeatureItem
            icon={SecurityIcon}
            title="Безопасность"
            description="Ваши голоса защищены современными криптографическими методами и технологией блокчейн"
            theme={theme}
          />
          <FeatureItem
            icon={VerifiedIcon}
            title="Прозрачность"
            description="Каждый голос можно проверить, сохраняя при этом полную анонимность участников"
            theme={theme}
          />
          <FeatureItem
            icon={VoteIcon}
            title="Удобство"
            description="Простой и интуитивно понятный интерфейс для создания и участия в голосованиях"
            theme={theme}
          />
          <FeatureItem
            icon={StorageIcon}
            title="Надежность"
            description="Данные надежно хранятся в распределенной сети, обеспечивая их сохранность"
            theme={theme}
          />
        </Box>

        <Box
          sx={{
            mt: 8,
            textAlign: 'center',
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            endIcon={<ArrowIcon />}
            sx={{
              px: 6,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              },
            }}
          >
            Зарегистрироваться
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Onboarding; 