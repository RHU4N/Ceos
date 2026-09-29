import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import './Style.css'; // <-- ajuste para importar o CSS correto da página
import ForgotPasswordUseCase from '../../domain/usecases/ForgotPassword';
import UserApiRepository from '../../infrastructure/api/UserApiRepository';
import { useLoading } from '../context/LoadingContext';
import { speak, useTTS } from '../../hooks/useTTS';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try { speak('Recuperar senha'); } catch (e) {}
  }, [enabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setLoading(true);
    document.body.classList.add('loading-global');
    const userRepository = new UserApiRepository();
    const forgotPassword = new ForgotPasswordUseCase(userRepository);
    try {
      await forgotPassword.execute(email);
      setMensagem('Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.');
    } catch (err) {
      setErro('Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  return (
    <main>
      <div className="container-fluid py-5 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div className="card p-4 shadow" style={{ maxWidth: 400, width: '100%' }}>
          <h3 className="mb-3 text-center" style={{ fontWeight: 700, letterSpacing: 1 }} onMouseEnter={() => speak('Recuperar senha')} onFocus={() => speak('Recuperar senha')}>Recuperar Senha</h3>
          <form>
            <label htmlFor="email" className="form-label fw-bold">E-mail cadastrado</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaEnvelope /></span>
              <input type="email" id="email" className="form-control" placeholder="Indisponível nesta versão" disabled />
            </div>
            <button type="button" className="btn btn-secondary w-100 mt-2 fw-bold" disabled>Indisponível</button>
            <div className="alert alert-info mt-2">A recuperação de senha ainda não está disponível. Use a troca de senha após entrar na sua conta.</div>
          </form>
          <div className="mt-3 text-center small">
            <Link to="/login" className="text-decoration-none">Voltar para o login</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
