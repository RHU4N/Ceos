import React from 'react';
import '../Style.css';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await axios.post('https://loginapiceos.onrender.com/user/login', { email, senha });
      const { token } = res.data;
      // Buscar dados do usuário
      const userRes = await axios.get('https://loginapiceos.onrender.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Encontrar usuário pelo email
      const userData = userRes.data.find(u => u.email === email);
      login(userData, token);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container-fluid py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="card p-4 shadow login-card" style={{ maxWidth: 400, width: '100%' }}>
          <h3 className="mb-3 text-center" style={{ fontWeight: 700, letterSpacing: 1 }}>Entrar na sua conta</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="form-label fw-bold">E-mail</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaEnvelope /></span>
              <input type="email" id="email" name="email" placeholder="Digite seu e-mail" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <label htmlFor="senha" className="form-label fw-bold">Senha</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaLock /></span>
              <input type="password" id="senha" name="senha" placeholder="Digite sua senha" className="form-control" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2 fw-bold" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            {erro && <div className="alert alert-danger mt-2">{erro}</div>}
          </form>
          <div className="mt-3 text-center small">
            <button
              type="button"
              className="btn btn-link text-decoration-none p-0"
              style={{ boxShadow: 'none' }}
              tabIndex={0}
              onClick={e => e.preventDefault()}
            >
              Esqueci minha senha
            </button>
            <span className="mx-2">|</span>
            <a href="/register" className="text-decoration-none">Não tem conta? Cadastre-se</a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
