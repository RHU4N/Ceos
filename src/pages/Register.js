import React, { useState } from 'react';
import '../Style.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();
  // const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (!telefone) {
      setErro('O telefone é obrigatório.');
      return;
    }
    try {
      await axios.post('https://loginapiceos.onrender.com/user', {
        nome, email, senha, telefone, assinante: false, historico: []
      });
      setSucesso('Cadastro realizado com sucesso! Redirecionando para login...');
      setNome(''); setEmail(''); setTelefone(''); setSenha(''); setConfirmarSenha('');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar.');
    }
  };

  return (
    <main>
      <div className="container-fluid py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="card p-4 shadow register-card" style={{ maxWidth: 400, width: '100%' }}>
          <h3 className="mb-3 text-center" style={{ fontWeight: 700, letterSpacing: 1 }}>Criar nova conta</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="nome" className="form-label fw-bold">Nome completo</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaUser /></span>
              <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} className="form-control" placeholder="Digite seu nome" required />
            </div>
            <label htmlFor="email" className="form-label fw-bold">E-mail</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaEnvelope /></span>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Digite seu e-mail" required />
            </div>
            <label htmlFor="telefone" className="form-label fw-bold">Telefone</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaPhone /></span>
              <input type="text" id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="form-control" placeholder="(xx) xxxxx-xxxx" required />
            </div>
            <label htmlFor="senha" className="form-label fw-bold">Senha</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaLock /></span>
              <input type="password" id="senha" value={senha} onChange={e => setSenha(e.target.value)} className="form-control" placeholder="Crie uma senha" required />
            </div>
            <label htmlFor="confirmarSenha" className="form-label fw-bold">Confirmar senha</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaLock /></span>
              <input type="password" id="confirmarSenha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="form-control" placeholder="Repita a senha" required />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2 fw-bold">Cadastrar</button>
            {sucesso && <div className="alert alert-success mt-2">{sucesso}</div>}
            {erro && <div className="alert alert-danger mt-2">{erro}</div>}
          </form>
          <div className="mt-3 text-center small">
            <a href="/login" className="text-decoration-none">Já tem conta? Entrar</a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;