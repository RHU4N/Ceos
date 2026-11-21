import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import './Style.css';
import { speak, useTTS } from '../../hooks/useTTS';

const ForgotPassword = () => {
  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try { speak('Recuperar senha'); } catch (e) {}
  }, [enabled]);

  return (
    <div className="centered-auth-container">
      <div className="card p-4 shadow login-card" style={{ maxWidth: 420, width: '100%' }}>
        <h1
          className="h3 mb-3 text-center"
          style={{ fontWeight: 700, letterSpacing: 1 }}
          onMouseEnter={() => speak('Recuperar senha')}
          onFocus={() => speak('Recuperar senha')}
        >
          Recuperar Senha
        </h1>
        <form onSubmit={(e) => e.preventDefault()} aria-label="Recuperação de senha indisponível">
          <label htmlFor="forgot-email" className="form-label fw-bold">E-mail cadastrado</label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light" aria-hidden="true"><FaEnvelope /></span>
            <input
              type="email"
              id="forgot-email"
              className="form-control"
              placeholder="Recuperação por e-mail indisponível"
              disabled
            />
          </div>
          <button type="button" className="btn btn-secondary w-100 mt-2 fw-bold" disabled>
            Recuperação automática indisponível
          </button>
          <div className="alert alert-info mt-3 mb-0" role="status">
            <strong>Fluxo indisponível nesta versão:</strong> a recuperação automática de senha por e-mail depende de suporte na LoginAPI. Se ainda tiver acesso à conta, altere sua senha em <strong>Editar perfil</strong> após entrar; caso contrário, contate{' '}
            <a href="mailto:ceoscalculadora.suporte@gmail.com" className="fw-semibold">
              ceoscalculadora.suporte@gmail.com
            </a>.
          </div>
        </form>
        <div className="mt-3 text-center small d-flex justify-content-center flex-wrap gap-2">
          <Link to="/login" className="text-decoration-none">Voltar para o login</Link>
          <span aria-hidden="true">|</span>
          <Link to="/faq" className="text-decoration-none">Central de Ajuda</Link>
          <span aria-hidden="true">|</span>
          <Link to="/register" className="text-decoration-none">Criar conta</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
