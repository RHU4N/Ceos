import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Style.css";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";
import axios from "axios";
import { createPortal } from "react-dom";
import { speak, useTTS } from "../../hooks/useTTS";

function EditProfileModal({ show, onClose, user, onUpdate, onDelete }) {
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [senha, setSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // base URL fallback
  const baseUrl =
    process.env.REACT_APP_API_LOGIN_URL || "http://localhost:8081";

  // Impede scroll do body quando o modal está aberto
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  // Auto-dismiss toasts (sucesso / erro)
  useEffect(() => {
    if (sucesso) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSucesso(""), 3000);
    }
    return () => clearTimeout(successTimerRef.current);
  }, [sucesso]);

  useEffect(() => {
    if (erro) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErro(""), 4000);
    }
    return () => clearTimeout(errorTimerRef.current);
  }, [erro]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);
    try {
      const token = localStorage.getItem("ceos_token");
      // Se for alterar senha, precisa da senha atual
      if (senha && !senhaAtual) {
        setErro("Para alterar a senha, informe a senha atual.");
        setLoading(false);
        return;
      }
      await axios.put(
        `${baseUrl}/users/${user._id}`,
        {
          nome,
          email,
          telefone,
          senha: senha || undefined,
          senhaAtual: senha ? senhaAtual : undefined,
          assinante: user.assinante,
          historico: user.historico,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSucesso("Dados atualizados com sucesso!");
      onUpdate({ ...user, nome, email, telefone });
      setSenha("");
      setSenhaAtual("");
      setTimeout(onClose, 1200);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao atualizar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir sua conta? Essa ação não poderá ser desfeita."
      )
    )
      return;
    setLoading(true);
    try {
      const token = localStorage.getItem("ceos_token");
      await axios.delete(`${baseUrl}/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete();
    } catch (err) {
      setErro("Erro ao excluir conta.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.35)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="card p-4 shadow"
        style={{
          maxWidth: 340,
          width: "100%",
          minHeight: "auto",
          maxHeight: "90vh",
          position: "relative",
          borderRadius: 18,
          border: "2px solid #007bff",
          boxShadow: "0 4px 32px #007bff22",
          background: "#fafdff",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 100000,
        }}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "none",
            fontSize: 28,
            color: "#007bff",
            cursor: "pointer",
            fontWeight: 700,
            transition: "color 0.2s",
            zIndex: 4000,
            padding: 6,
            borderRadius: 8,
          }}
          title="Fechar"
        >
          &times;
        </button>

        {/* alert container: positioned absolutely so toasts don't change modal layout */}
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            top: 54,
            left: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "stretch",
            zIndex: 2000,
            pointerEvents: "auto",
          }}
        >
          {sucesso && (
            <div className="alert alert-success" style={{ margin: 0 }}>
              {sucesso}
            </div>
          )}
          {erro && (
            <div className="alert alert-danger" style={{ margin: 0 }}>
              {erro}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className="form-label fw-bold mt-2"
            style={{
              color: "#222",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: 0.5,
            }}
          >
            Nome
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light">
              <FaUserCircle />
            </span>
            <input
              type="text"
              className="form-control"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{
                borderRadius: 8,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <label
            className="form-label fw-bold"
            style={{
              color: "#222",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: 0.5,
            }}
          >
            E-mail
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light">
              <FaEnvelope />
            </span>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                borderRadius: 8,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <label
            className="form-label fw-bold"
            style={{
              color: "#222",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: 0.5,
            }}
          >
            Telefone
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light">
              <FaEdit />
            </span>
            <input
              type="text"
              className="form-control"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              style={{
                borderRadius: 8,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <label
            className="form-label fw-bold"
            style={{
              color: "#222",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: 0.5,
            }}
          >
            Nova senha
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light">
              <FaLock />
            </span>
            <input
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Deixe em branco para não alterar"
              style={{
                borderRadius: 8,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          {senha && (
            <>
              <label
                className="form-label fw-bold"
                style={{
                  color: "#222",
                  fontFamily: "Montserrat, Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  letterSpacing: 0.5,
                }}
              >
                Senha atual <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-light">
                  <FaLock />
                </span>
                <input
                  type="password"
                  className="form-control"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Confirme sua senha atual"
                  required={!!senha}
                  style={{
                    borderRadius: 8,
                    fontFamily: "Montserrat, Arial, sans-serif",
                    fontWeight: 500,
                  }}
                />
              </div>
            </>
          )}
          <button
            type="submit"
            className="btn btn-primary w-100 mt-2 fw-bold"
            style={{
              borderRadius: 8,
              fontSize: 18,
              letterSpacing: 1,
              fontFamily: "Montserrat, Arial, sans-serif",
            }}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
          {/* alerts are rendered in the absolute alert container above to avoid layout shift */}
        </form>
        <button
          className="btn btn-danger w-100 mt-3"
          style={{
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            fontFamily: "Montserrat, Arial, sans-serif",
          }}
          onClick={handleDelete}
          disabled={loading}
        >
          <FaTrash style={{ marginRight: 8, fontSize: 18 }} />
          Excluir conta
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function Navbar() {
  const location = useLocation();
  const { user, logout, login } = useAuth();
  const { loading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { enabled: ttsEnabled, toggle: toggleTTS } = useTTS();
 

  const handleUpdate = (newUser) => {
    login(newUser, localStorage.getItem("ceos_token"));
  };

  const handleDelete = () => {
    logout();
    setShowModal(false);
  };

  // Helper to prevent navigation/click if loading
  const preventIfLoading = (e) => {
    if (loading) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return true;
  };

  // Add a small scroll listener to apply a "scrolled" class when the page is scrolled.
  // Only active on wider screens (desktop) where the navbar is sticky.
  useEffect(() => {
    function onScroll() {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 900) {
        setScrolled(false);
        return;
      }
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div
        className="logo"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <Link
          to="/"
          style={{
            color: "inherit",
            textDecoration: "none",
            fontSize: "3.5rem",
            fontFamily: "Times New Roman",
            pointerEvents: loading ? "none" : undefined,
            opacity: loading ? 0.6 : undefined,
          }}
          className="display-3"
          tabIndex={loading ? -1 : 0}
          onClick={(e) => {
            preventIfLoading(e);
            speak("Página inicial");
          }}
        >
          <img
            src="/logo.png"
            alt="Logo Céos"
            style={{
              height: "4.9rem",
              width: "4.9rem",
              maxWidth: "12vw",
              minWidth: 32,
              pointerEvents: loading ? "none" : undefined,
              opacity: loading ? 0.6 : undefined,
            }}
          />
          Céos
        </Link>
      </div>
      <nav>
        <ul className="menu">
          <li
            className="dropdown"
            style={{
              pointerEvents: loading ? "none" : undefined,
              opacity: loading ? 0.6 : undefined,
            }}
          >
            <span
              onMouseEnter={() => !loading && speak("Ambiente de estudo")}
              onFocus={() => !loading && speak("Ambiente de estudo")}
              tabIndex={loading ? -1 : 0}
            >
              Ambiente de Estudo ▼
            </span>

            <ul className="submenu">
              <li
                className={
                  location.pathname.startsWith("/matematica") ? "active" : ""
                }
              >
                <Link
                  to="/matematica"
                  tabIndex={loading ? -1 : 0}
                  style={{
                    pointerEvents: loading ? "none" : undefined,
                    opacity: loading ? 0.6 : undefined,
                  }}
                  onClick={(e) => {
                    preventIfLoading(e);
                    speak("Matemática");
                  }}
                  onMouseEnter={() => !loading && speak("Matemática")}
                  onFocus={() => !loading && speak("Matemática")}
                >
                  Matemática
                </Link>
              </li>

              <li className={location.pathname.startsWith('/quimica') ? 'active' : ''}>
                <Link
                  to="/quimica"
                  tabIndex={loading ? -1 : 0}
                  style={{
                    pointerEvents: loading ? 'none' : undefined,
                    opacity: loading ? 0.6 : undefined,
                  }}
                  onClick={(e) => {
                    preventIfLoading(e);
                    speak('Química');
                  }}
                  onMouseEnter={() => !loading && speak('Química')}
                  onFocus={() => !loading && speak('Química')}
                >
                  Química
                </Link>
              </li>

              <li className={location.pathname.startsWith('/fisica') ? 'active' : ''}>
                <Link
                  to="/fisica"
                  tabIndex={loading ? -1 : 0}
                  style={{
                    pointerEvents: loading ? 'none' : undefined,
                    opacity: loading ? 0.6 : undefined,
                  }}
                  onClick={(e) => {
                    preventIfLoading(e);
                    speak('Física');
                  }}
                  onMouseEnter={() => !loading && speak('Física')}
                  onFocus={() => !loading && speak('Física')}
                >
                  Física
                </Link>
              </li>
            </ul>
          </li>

          <li>
            <Link
              to="/faq"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
              onClick={(e) => {
                preventIfLoading(e);
                speak("Central de ajuda");
              }}
              onMouseEnter={() => !loading && speak("Central de ajuda")}
              onFocus={() => !loading && speak("Central de ajuda")}
            >
              Central de Ajuda
            </Link>
          </li>

          <li>
            <Link
              to="#"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
              onClick={(e) => {
                preventIfLoading(e);
                speak("Planos");
              }}
              onMouseEnter={() => !loading && speak("Planos")}
              onFocus={() => !loading && speak("Planos")}
            >
              Planos
            </Link>
          </li>
        </ul>
      </nav>

      <div className="buttons">
        {!user ? (
          <>
            <button
              onClick={() => {
                toggleTTS();
              }}
              onMouseEnter={() => !loading && speak("Alternar leitor de voz")}
              onFocus={() => !loading && speak("Alternar leitor de voz")}
            >
              {ttsEnabled ? "TTS: ON" : "TTS: OFF"}
            </button>

            {/* ENTRAR */}
            <Link
              to="/login"
              className="btn btn-light"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
                borderRadius: 5,
                padding: '8px 14px',
                transition: 'all 0.12s ease',
              }}
              onClick={preventIfLoading} // MANTIDO
              onMouseEnter={() => !loading && speak("Entrar")} // ADICIONADO
              onFocus={() => !loading && speak("Entrar")}
            >
              Entrar
            </Link>

            {/* CADASTRE-SE */}
            <Link
              to="/register"
              className="btn btn-dark"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
                borderRadius: 5,
                padding: '8px 14px',
                transition: 'all 0.12s ease',
              }}
              onClick={preventIfLoading} // MANTIDO
              onMouseEnter={() => !loading && speak("Cadastre-se")} // ADICIONADO
              onFocus={() => !loading && speak("Cadastre-se")}
            >
              Cadastre-se
            </Link>
          </>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <FaUserCircle size={32} />

            {/* NOME DO USUÁRIO */}
            <span
              style={{
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
              onClick={() => !loading && setShowModal(true)} // MANTIDO
              onMouseEnter={() => !loading && speak("Editar perfil")} // ADICIONADO
              onFocus={() => !loading && speak("Editar perfil")}
              title="Editar perfil"
              tabIndex={loading ? -1 : 0}
              aria-disabled={loading}
            >
              {user.nome}
              <FaEdit
                style={{
                  fontSize: 20,
                  marginLeft: 6,
                  color: "#007bff",
                  background: "#e9f2ff",
                  borderRadius: "50%",
                  padding: 3,
                  boxShadow: "0 1px 4px #007bff33",
                }}
              />
            </span>

            {/* BOTÃO SAIR */}
            <button
              className="btn btn-outline-secondary btn-sm ms-2 btn-sair-ceos"
              style={{
                borderColor: "#dc3545",
                color: "#dc3545",
                background: "white",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#dc3545";
                e.target.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "white";
                e.target.style.color = "#dc3545";
              }}
              onClick={logout} // MANTIDO
              onMouseEnter={() => !loading && speak("Sair")} // ADICIONADO
              disabled={loading}
              tabIndex={loading ? -1 : 0}
            >
              Sair
            </button>

            <EditProfileModal
              show={showModal}
              onClose={() => setShowModal(false)}
              user={user}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
