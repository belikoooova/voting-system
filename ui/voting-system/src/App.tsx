import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import VotingDetails from './pages/VotingDetails';
import VotingCreate from './pages/VotingCreate';
import VotingList from './pages/VotingList';
import AvailableVotingDetails from './pages/AvailableVotingDetails';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

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

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Box sx={{ p: 3 }}>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? <Home /> : <Onboarding />
            } />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/" /> : <Register />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <Profile /> : <Navigate to="/" />
            } />
            <Route path="/votings/create" element={
              isAuthenticated ? <VotingCreate /> : <Navigate to="/" />
            } />
            <Route path="/votings/:id" element={
              isAuthenticated ? <VotingDetails /> : <Navigate to="/" />
            } />
            <Route path="/votings" element={<Home />} />
            <Route path="/available-votings/:id" element={<AvailableVotingDetails />} />
          </Routes>
        </Box>
      </ThemeProvider>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
