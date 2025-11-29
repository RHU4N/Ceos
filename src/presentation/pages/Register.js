import React, { useState, useEffect } from 'react';
import '../components/Style.css'; // use component styles for auth pages (avoid page styles meant for Matemática)
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import User from '../../domain/entities/User';
import RegisterUser from '../../domain/usecases/RegisterUser';
import UserApiRepository from '../../infrastructure/api/UserApiRepository';
import { FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa';
import { useLoading } from '../context/LoadingContext';
import { speak, useTTS } from '../../hooks/useTTS';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  // const { login } = useAuth();

  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try { speak('Criar nova conta'); } catch (e) {}
  }, [enabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErro('');
    setSucesso('');
    setLoading(true);
    document.body.classList.add('loading-global');
    const userRepository = new UserApiRepository();
    const registerUser = new RegisterUser(userRepository);
    try {
      const user = new User({ nome, email, telefone, senha });
      await registerUser.execute({
        ...user,
        confirmarSenha
      });
      setSucesso('Cadastro realizado com sucesso! Redirecionando para login...');
      setNome(''); setEmail(''); setTelefone(''); setSenha(''); setConfirmarSenha('');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErro(err.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  return (
    <main>
      <div className="centered-auth-container">
        <div className="card p-4 shadow register-card" style={{ maxWidth: 400, width: '100%' }}>
          <h3 className="mb-3 text-center" style={{ fontWeight: 700, letterSpacing: 1 }} onMouseEnter={() => speak('Criar nova conta')} onFocus={() => speak('Criar nova conta')}>Criar nova conta</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="nome" className="form-label fw-bold">Nome completo</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaUser /></span>
              <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} className="form-control" placeholder="Digite seu nome" required disabled={loading} onMouseEnter={() => speak('Campo nome completo')} onFocus={() => speak('Campo nome completo')} />
            </div>
            <label htmlFor="email" className="form-label fw-bold">E-mail</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaEnvelope /></span>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Digite seu e-mail" required disabled={loading} onMouseEnter={() => speak('Campo e-mail')} onFocus={() => speak('Campo e-mail')} />
            </div>
            <label htmlFor="telefone" className="form-label fw-bold">Telefone</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaPhone /></span>
              <input type="text" id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="form-control" placeholder="(xx) xxxxx-xxxx" required disabled={loading} onMouseEnter={() => speak('Campo telefone')} onFocus={() => speak('Campo telefone')} />
            </div>
            <label htmlFor="senha" className="form-label fw-bold">Senha</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaLock /></span>
              <input type="password" id="senha" value={senha} onChange={e => setSenha(e.target.value)} className="form-control" placeholder="Crie uma senha" required disabled={loading} onMouseEnter={() => speak('Campo senha')} onFocus={() => speak('Campo senha')} />
            </div>
            <label htmlFor="confirmarSenha" className="form-label fw-bold">Confirmar senha</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaLock /></span>
              <input type="password" id="confirmarSenha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="form-control" placeholder="Repita a senha" required disabled={loading} onMouseEnter={() => speak('Campo confirmar senha')} onFocus={() => speak('Campo confirmar senha')} />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2 fw-bold" disabled={loading} onMouseEnter={() => speak('Cadastrar')} onFocus={() => speak('Cadastrar')}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
            {sucesso && <div className="alert alert-success mt-2" onMouseEnter={() => speak('Cadastro realizado com sucesso')} onFocus={() => speak('Cadastro realizado com sucesso')}>{sucesso}</div>}
            {erro && <div className="alert alert-danger mt-2" onMouseEnter={() => speak('Erro ao cadastrar')} onFocus={() => speak('Erro ao cadastrar')}>{erro}</div>}
          </form>
          <div className="mt-3 text-center small">
            <Link
              to="/login"
              className="text-decoration-none"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
              onMouseEnter={() => !loading && speak('Já tem conta? Entrar')}
              onFocus={() => !loading && speak('Já tem conta? Entrar')}
            >
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;