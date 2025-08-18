import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import '../Style.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setLoading(true);
    try {
      // Aqui você pode implementar o envio de e-mail para recuperação de senha
      // Exemplo fictício:
      await axios.post('https://loginapiceos.onrender.com/user/forgot-password', { email });
      setMensagem('Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.');
    } catch (err) {
      setErro('Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container-fluid py-5 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div className="card p-4 shadow" style={{ maxWidth: 400, width: '100%' }}>
          <h3 className="mb-3 text-center" style={{ fontWeight: 700, letterSpacing: 1 }}>Recuperar Senha</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="form-label fw-bold">E-mail cadastrado</label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light"><FaEnvelope /></span>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Digite seu e-mail" required />
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2 fw-bold" disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</button>
            {mensagem && <div className="alert alert-success mt-2">{mensagem}</div>}
            {erro && <div className="alert alert-danger mt-2">{erro}</div>}
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
