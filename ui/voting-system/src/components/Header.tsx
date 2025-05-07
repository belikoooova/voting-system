import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccountCircle } from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const theme = useTheme();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.02em',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: '100%',
              height: '2px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              transform: 'scaleX(0)',
              transformOrigin: 'right',
              transition: 'transform 0.3s ease',
            },
            '&:hover::after': {
              transform: 'scaleX(1)',
              transformOrigin: 'left',
            },
            '& .gradient-text': {
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              transition: 'transform 0.3s ease',
            },
            '&:hover .gradient-text': {
              transform: 'scale(1.05)',
            },
          }}
          onClick={() => navigate('/')}
        >
          <span className="gradient-text">Vote</span>
          <span style={{ 
            color: theme.palette.text.primary,
            opacity: 0.9,
            marginLeft: '2px'
          }}>Chain</span>
        </Typography>
        {isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              onClick={handleProfileClick}
              startIcon={<AccountCircle />}
              sx={{ 
                textTransform: 'none',
                fontWeight: 400,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              {user?.username}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 