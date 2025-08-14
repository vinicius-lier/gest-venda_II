import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginForm, ApiError } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (credentials: LoginForm) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔍 Tentando login com credenciais:', credentials);
      console.log('🔍 URL da API:', process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api');
      
      const response = await apiService.login(credentials);
      console.log('🔍 Resposta da API:', response);
      
      if (response.success) {
        console.log('✅ Login bem-sucedido, token recebido');
        localStorage.setItem('token', response.data.token);
        const userResponse = await apiService.getCurrentUser();
        console.log('🔍 Resposta do usuário atual:', userResponse);
        if (userResponse.success) {
          setUser(userResponse.data);
          return true;
        }
      } else {
        console.log('❌ Login falhou:', response);
      }
      return false;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      const apiError = error as ApiError;
      console.error('❌ Detalhes do erro:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
