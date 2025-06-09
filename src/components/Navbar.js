import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Style.css';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaEdit, FaTrash, FaEnvelope, FaLock } from 'react-icons/fa';
import axios from 'axios';

function EditProfileModal({ show, onClose, user, onUpdate, onDelete }) {
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [senha, setSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  // Impede scroll do body quando o modal está aberto
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      const token = localStorage.getItem('ceos_token');
      // Se for alterar senha, precisa da senha atual
      if (senha && !senhaAtual) {
        setErro('Para alterar a senha, informe a senha atual.');
        setLoading(false);
        return;
      }
      await axios.put(`https://loginapiceos.onrender.com/user/${user._id}`, {
        nome, email, telefone, senha: senha || undefined, senhaAtual: senha ? senhaAtual : undefined, assinante: user.assinante, historico: user.historico
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSucesso('Dados atualizados com sucesso!');
      onUpdate({ ...user, nome, email, telefone });
      setSenha('');
      setSenhaAtual('');
      setTimeout(onClose, 1200);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não poderá ser desfeita.')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('ceos_token');
      await axios.delete(`https://loginapiceos.onrender.com/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onDelete();
    } catch (err) {
      setErro('Erro ao excluir conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.35)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="card p-4 shadow" style={{ maxWidth: 340, width: '100%', minHeight: 'auto', maxHeight: '90vh', position:'relative', borderRadius: 18, border: '2px solid #007bff', boxShadow: '0 4px 32px #007bff22', background:'#fafdff', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <button onClick={onClose} style={{ position:'absolute', top:10, right:10, border:'none', background:'none', fontSize:28, color:'#007bff', cursor:'pointer', fontWeight:700, transition:'color 0.2s' }} title="Fechar">&times;</button>

        <form onSubmit={handleSubmit}>
          <label className="form-label fw-bold mt-2" style={{color:'#222', fontFamily:'Montserrat, Arial, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:0.5}}>Nome</label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light"><FaUserCircle /></span>
            <input type="text" className="form-control" value={nome} onChange={e=>setNome(e.target.value)} required style={{borderRadius:8, fontFamily:'Montserrat, Arial, sans-serif', fontWeight:500}} />
          </div>
          <label className="form-label fw-bold" style={{color:'#222', fontFamily:'Montserrat, Arial, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:0.5}}>E-mail</label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light"><FaEnvelope /></span>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required style={{borderRadius:8, fontFamily:'Montserrat, Arial, sans-serif', fontWeight:500}} />
          </div>
          <label className="form-label fw-bold" style={{color:'#222', fontFamily:'Montserrat, Arial, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:0.5}}>Telefone</label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light"><FaEdit /></span>
            <input type="text" className="form-control" value={telefone} onChange={e=>setTelefone(e.target.value)} required style={{borderRadius:8, fontFamily:'Montserrat, Arial, sans-serif', fontWeight:500}} />
          </div>
          <label className="form-label fw-bold" style={{color:'#222', fontFamily:'Montserrat, Arial, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:0.5}}>Nova senha</label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light"><FaLock /></span>
            <input type="password" className="form-control" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Deixe em branco para não alterar" style={{borderRadius:8, fontFamily:'Montserrat, Arial, sans-serif', fontWeight:500}} />
          </div>
          {senha && (
            <>
              <label className="form-label fw-bold" style={{color:'#222', fontFamily:'Montserrat, Arial, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:0.5}}>Senha atual <span style={{color:'#dc3545'}}>*</span></label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-light"><FaLock /></span>
                <input type="password" className="form-control" value={senhaAtual} onChange={e=>setSenhaAtual(e.target.value)} placeholder="Confirme sua senha atual" required={!!senha} style={{borderRadius:8, fontFamily:'Montserrat, Arial, sans-serif', fontWeight:500}} />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary w-100 mt-2 fw-bold" style={{borderRadius:8, fontSize:18, letterSpacing:1, fontFamily:'Montserrat, Arial, sans-serif'}} disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</button>
          {sucesso && <div className="alert alert-success mt-2">{sucesso}</div>}
          {erro && <div className="alert alert-danger mt-2">{erro}</div>}
        </form>
        <button className="btn btn-danger w-100 mt-3" style={{borderRadius:8, fontWeight:600, fontSize:16, fontFamily:'Montserrat, Arial, sans-serif'}} onClick={handleDelete} disabled={loading}><FaTrash style={{marginRight:8, fontSize:18}}/>Excluir conta</button>
      </div>
    </div>
  );
}

function Navbar() {
  const { user, logout, login } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleUpdate = (newUser) => {
    login(newUser, localStorage.getItem('ceos_token'));
  };

  const handleDelete = () => {
    logout();
    setShowModal(false);
  };

  return (
    <header className="navbar">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="Logo Céos" style={{ height: '72px', width: '72px' }} />
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }} className='display-3'>Céos</Link>
      </div>
      <nav>
        <ul className="menu">
          <li className="dropdown">
            <span>Ambiente de Estudo ▼</span>
            <ul className="submenu">
              <li className='active'><Link to="/matematica">Matemática</Link></li>
              <li><Link to="#" disabled>Química</Link></li>
              <li><Link to="#" disabled>Física</Link></li>
            </ul>
          </li>
          <li><Link to="/faq">Central de Ajuda</Link></li>
          <li><Link to="#">Planos</Link></li>
        </ul>
      </nav>
      <div className="buttons">
        {!user ? (
          <>
            <Link to="/login" className="btn btn-light">Entrar</Link>
            <Link to="/register" className="btn btn-dark">Cadastre-se</Link>
          </>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <FaUserCircle size={32} />
            <span style={{cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4}} onClick={()=>setShowModal(true)} title="Editar perfil">
              {user.nome}
              <FaEdit style={{fontSize:20, marginLeft:6, color:'#007bff', background:'#e9f2ff', borderRadius:'50%', padding:3, boxShadow:'0 1px 4px #007bff33'}}/>
            </span>
            <button 
              className="btn btn-outline-secondary btn-sm ms-2 btn-sair-ceos"
              style={{ borderColor: '#dc3545', color: '#dc3545', background: 'white', transition: 'all 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#dc3545'; e.target.style.color = 'white'; }}
              onMouseOut={e => { e.target.style.background = 'white'; e.target.style.color = '#dc3545'; }}
              onClick={logout}
            >
              Sair
            </button>
            <EditProfileModal show={showModal} onClose={()=>setShowModal(false)} user={user} onUpdate={handleUpdate} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
