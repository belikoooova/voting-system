import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../config/api';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  username: string;
  isLegal: boolean;
}

interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    isLegal: boolean;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await authApi.getMe();
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении информации о пользователе:', error);
      setUser(null);
      if (axios.isAxiosError(error)) {
        setError({
          message: error.response?.data?.message || 'Ошибка при получении данных пользователя',
          code: error.response?.data?.code,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });
      const { accessToken } = response.data;
      localStorage.setItem('token', accessToken);
      await fetchUser();
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError({
          message: error.response?.data?.message || 'Ошибка при входе',
          code: error.response?.data?.code,
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    isLegal: boolean;
  }) => {
    try {
      setLoading(true);
      const response = await authApi.register(data);
      const { accessToken } = response.data;
      localStorage.setItem('token', accessToken);
      await fetchUser();
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError({
          message: error.response?.data?.message || 'Ошибка при регистрации',
          code: error.response?.data?.code,
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated, 
        error,
        login, 
        register, 
        logout,
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 