import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../types';
import './Login.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-container">
      {/* Floating particles */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <img 
            src="/logo-prado.png" 
            alt="Prado Motors" 
            className="login-logo"
          />
          <h1 className="login-title">Prado Motors</h1>
          <p className="login-subtitle">Sistema de Gestão de Vendas</p>
        </div>

        <div className="login-form">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <strong>Erro!</strong> {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <Form.Label className="form-label">Usuário</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Digite seu nome de usuário"
                className="form-control"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <Form.Label className="form-label">Senha</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite sua senha"
                className="form-control"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </Form>

          <div className="forgot-password">
            <small>
              Esqueceu sua senha? Entre em contato com o administrador.
            </small>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="copyright">
        <small>
          © 2025 Vinicius Oliveira - Todos os direitos reservados
        </small>
      </div>
    </div>
  );
};

export default Login;
