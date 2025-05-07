import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { useAuth, AuthProvider } from './contexts/AuthContext';

// Компоненты
import Header from './components/Header';
import Home from './pages/Home';
import VotingList from './pages/VotingList';
import VotingCreate from './pages/VotingCreate';
import VotingDetails from './pages/VotingDetails';
import AvailableVotingDetails from './pages/AvailableVotingDetails';
import Login from './pages/Login';
import Register from './pages/Register';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/votings" element={<VotingList />} />
              <Route path="/votings/:id" element={<VotingDetails />} />
              <Route path="/available-votings/:id" element={<AvailableVotingDetails />} />
              <Route path="/votings/create" element={<VotingCreate />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
