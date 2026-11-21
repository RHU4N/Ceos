import SiteImage from './SiteImage';
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
  FaHistory,
} from "react-icons/fa";
import { createPortal } from "react-dom";
import { speak, useTTS } from "../../hooks/useTTS";
import UserApiRepository from "../../infrastructure/api/UserApiRepository";

import { IoTNotificationBell } from '../iot/IoTNotificationProvider';
function EditProfileModal({ show, onClose, user, onUpdate, onDelete, onSessionInvalidated }) {
  const [nome, setNome] = useState(user?.nome || "");
  const [email] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [senha, setSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // A API devolve `id` no DTO. `_id` é aceito apenas para sessões antigas
  // que podem ter ficado salvas no navegador.
  const userId = user?.id || user?._id;

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;

  // Sincroniza campos ao abrir, impede scroll do body, fecha no Escape e move foco inicial
  useEffect(() => {
    if (!show) {
      document.body.style.overflow = "";
      return undefined;
    }
    setNome(user?.nome || "");
    setTelefone(user?.telefone || "");
    setErro("");
    setSucesso("");
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      try { closeButtonRef.current?.focus(); } catch (err) {}
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [show, user?.nome, user?.telefone, onClose]);

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
      // Se for alterar senha, precisa da senha atual
      if (senha && !senhaAtual) {
        setErro("Para alterar a senha, informe a senha atual.");
        setLoading(false);
        return;
      }
      if (!userId) {
        setErro("Não foi possível identificar sua conta. Entre novamente e tente outra vez.");
        return;
      }
      if (senha && senha !== confirmaNovaSenha) {
        setErro("A confirmação da nova senha não confere.");
        return;
      }
      const repository = new UserApiRepository();
      const updatedUser = await repository.updateProfile(userId, { nome, telefone });
      onUpdate(updatedUser);
      if (senha) {
        await repository.changePassword({ senhaAtual, novaSenha: senha, confirmaNovaSenha });
        setSucesso("Perfil atualizado. A senha foi alterada; entre novamente.");
        setTimeout(onSessionInvalidated, 1200);
      } else {
        setSucesso("Dados atualizados com sucesso!");
        setTimeout(onClose, 1200);
      }
      setSenha("");
      setSenhaAtual("");
      setConfirmaNovaSenha("");
    } catch (err) {
      setErro(getErrorMessage(err, "Não foi possível atualizar os dados."));
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
      if (!userId) {
        setErro("Não foi possível identificar sua conta. Entre novamente e tente outra vez.");
        return;
      }
      const repository = new UserApiRepository();
      await repository.deleteAccount(userId);
      onDelete();
    } catch (err) {
      setErro(getErrorMessage(err, "Não foi possível excluir a conta."));
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
        background: "rgba(0,0,0,0.45)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-modal-title"
        className="card p-4 shadow"
        style={{
          maxWidth: 440,
          width: "100%",
          minHeight: "auto",
          maxHeight: "90vh",
          position: "relative",
          borderRadius: 18,
          border: "2px solid #0b5ed7",
          boxShadow: "0 4px 32px rgba(11, 94, 215, 0.2)",
          background: "#fafdff",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          zIndex: 100000,
        }}
      >
        <button
          ref={closeButtonRef}
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
            lineHeight: 1,
            color: "#0b5ed7",
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

        <h2
          id="edit-profile-modal-title"
          className="h5 fw-bold mb-2 text-center"
          style={{ color: "#1565c0" }}
        >
          Editar perfil
        </h2>

        {/* alert container */}
        <div
          aria-live="polite"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "stretch",
            marginBottom: sucesso || erro ? 8 : 0,
          }}
        >
          {sucesso && (
            <div className="alert alert-success" role="status" style={{ margin: 0 }}>
              {sucesso}
            </div>
          )}
          {erro && (
            <div className="alert alert-danger" role="alert" style={{ margin: 0 }}>
              {erro}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="edit-profile-nome"
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
            <span className="input-group-text bg-light" aria-hidden="true">
              <FaUserCircle />
            </span>
            <input
              id="edit-profile-nome"
              type="text"
              className="form-control"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{
                minWidth: 0,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <label
            htmlFor="edit-profile-email"
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
            <span className="input-group-text bg-light" aria-hidden="true">
              <FaEnvelope />
            </span>
            <input
              id="edit-profile-email"
              type="email"
              className="form-control"
              value={email}
              disabled
              readOnly
              style={{
                minWidth: 0,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <small className="text-muted d-block mb-2">O e-mail não pode ser alterado nesta versão.</small>
          <label
            htmlFor="edit-profile-telefone"
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
            <span className="input-group-text bg-light" aria-hidden="true">
              <FaEdit />
            </span>
            <input
              id="edit-profile-telefone"
              type="text"
              className="form-control"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              style={{
                minWidth: 0,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          <label
            htmlFor="edit-profile-nova-senha"
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
            <span className="input-group-text bg-light" aria-hidden="true">
              <FaLock />
            </span>
            <input
              id="edit-profile-nova-senha"
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Deixe em branco para não alterar"
              style={{
                minWidth: 0,
                fontFamily: "Montserrat, Arial, sans-serif",
                fontWeight: 500,
              }}
            />
          </div>
          {senha && (
            <>
              <label
                htmlFor="edit-profile-senha-atual"
                className="form-label fw-bold"
                style={{
                  color: "#222",
                  fontFamily: "Montserrat, Arial, sans-serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  letterSpacing: 0.5,
                }}
              >
                Senha atual <span style={{ color: "#c82333" }}>*</span>
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-light" aria-hidden="true">
                  <FaLock />
                </span>
                <input
                  id="edit-profile-senha-atual"
                  type="password"
                  className="form-control"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Confirme sua senha atual"
                  required={!!senha}
                  style={{
                    minWidth: 0,
                    fontFamily: "Montserrat, Arial, sans-serif",
                    fontWeight: 500,
                  }}
                />
              </div>
              <label htmlFor="edit-profile-confirma-senha" className="form-label fw-bold">
                Confirmar nova senha <span style={{ color: "#c82333" }}>*</span>
              </label>
              <div className="input-group mb-2">
                <span className="input-group-text bg-light" aria-hidden="true"><FaLock /></span>
                <input
                  id="edit-profile-confirma-senha"
                  type="password"
                  className="form-control"
                  value={confirmaNovaSenha}
                  onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  required={!!senha}
                  style={{ minWidth: 0 }}
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
  const { user, logout, updateUser } = useAuth();
  const { loading } = useLoading();
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const { enabled: ttsEnabled, toggle: toggleTTS } = useTTS();
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const profileTriggerRef = useRef(null);

  useEffect(() => {
    function onToast(e) {
      try {
        const d = e && e.detail ? e.detail : {};
        setToast({ show: true, message: d.message || 'Mensagem', type: d.type || 'info' });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3500);
      } catch (err) {}
    }
    window.addEventListener('ceos:toast', onToast);
    return () => window.removeEventListener('ceos:toast', onToast);
  }, []);
 

  const handleUpdate = (newUser) => {
    updateUser(newUser);
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

  // Close menus on route change or Escape
  useEffect(() => {
    setMobileMenuOpen(false);
    setStudyMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setStudyMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Add a small scroll listener to apply a "scrolled" class when the page is scrolled.
  // Only active on wider screens (desktop) where the navbar is sticky.
  useEffect(() => {
    function onScroll() {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 992) {
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

  const closeNavMenus = () => {
    setMobileMenuOpen(false);
    setStudyMenuOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-brand-row">
        <div
          className="logo"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <Link
            to="/"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontSize: "2.2rem",
              fontFamily: "Times New Roman",
              pointerEvents: loading ? "none" : undefined,
              opacity: loading ? 0.6 : undefined,
            }}
            className="display-3"
            tabIndex={loading ? -1 : 0}
            onClick={(e) => {
              if (!preventIfLoading(e)) return;
              closeNavMenus();
              speak("Página inicial");
            }}
          >
            <SiteImage
              src="/logo.png"
              alt="Logo Céos"
              style={{
                height: "3rem",
                width: "3rem",
                minWidth: 32,
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
            />
            Céos
          </Link>
        </div>

        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="ceos-primary-nav"
          aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span aria-hidden="true">{mobileMenuOpen ? "✕" : "☰"}</span>
          <span>Menu</span>
        </button>
      </div>

      <div id="ceos-primary-nav" className={`navbar-collapse-panel ${mobileMenuOpen ? "is-open" : ""}`}>
        <nav aria-label="Navegação principal">
          <ul className="menu">
            <li
              className="dropdown"
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
            >
              <button
                type="button"
                className="navbar-dropdown-trigger"
                aria-expanded={studyMenuOpen}
                aria-haspopup="true"
                aria-controls="ceos-study-submenu"
                onClick={() => setStudyMenuOpen((prev) => !prev)}
                onMouseEnter={() => !loading && speak("Ambiente de estudo")}
                onFocus={() => !loading && speak("Ambiente de estudo")}
                tabIndex={loading ? -1 : 0}
              >
                Ambiente de Estudo <span aria-hidden="true">▼</span>
              </button>

              <ul
                id="ceos-study-submenu"
                className={`submenu ${studyMenuOpen ? "submenu--open" : ""}`}
              >
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
                      if (!preventIfLoading(e)) return;
                      closeNavMenus();
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
                      if (!preventIfLoading(e)) return;
                      closeNavMenus();
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
                      if (!preventIfLoading(e)) return;
                      closeNavMenus();
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
                to="/calculadoras"
                tabIndex={loading ? -1 : 0}
                style={{
                  pointerEvents: loading ? 'none' : undefined,
                  opacity: loading ? 0.6 : undefined,
                }}
                onClick={(e) => {
                  if (!preventIfLoading(e)) return;
                  closeNavMenus();
                  speak('Calculadoras');
                }}
                onMouseEnter={() => !loading && speak('Calculadoras')}
                onFocus={() => !loading && speak('Calculadoras')}
              >
                Calculadoras
              </Link>
            </li>

            <li>
              <Link
                to="/funcoes-personalizadas"
                tabIndex={loading ? -1 : 0}
                style={{
                  pointerEvents: loading ? 'none' : undefined,
                  opacity: loading ? 0.6 : undefined,
                }}
                onClick={(e) => {
                  if (!preventIfLoading(e)) return;
                  closeNavMenus();
                  speak('Funções personalizadas');
                }}
                onMouseEnter={() => !loading && speak('Funções personalizadas')}
                onFocus={() => !loading && speak('Funções personalizadas')}
              >
                Funções
              </Link>
            </li>

            {user && (
              <li>
                <Link
                  to="/favoritos"
                  tabIndex={loading ? -1 : 0}
                  style={{
                    pointerEvents: loading ? 'none' : undefined,
                    opacity: loading ? 0.6 : undefined,
                  }}
                  onClick={(e) => {
                    if (!preventIfLoading(e)) return;
                    closeNavMenus();
                    speak('Favoritos');
                  }}
                  onMouseEnter={() => !loading && speak('Favoritos')}
                  onFocus={() => !loading && speak('Favoritos')}
                >
                  Favoritos
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/faq"
                tabIndex={loading ? -1 : 0}
                style={{
                  pointerEvents: loading ? "none" : undefined,
                  opacity: loading ? 0.6 : undefined,
                }}
                onClick={(e) => {
                  if (!preventIfLoading(e)) return;
                  closeNavMenus();
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
                to="/faq#planos"
                tabIndex={loading ? -1 : 0}
                style={{
                  pointerEvents: loading ? "none" : undefined,
                  opacity: loading ? 0.6 : undefined,
                }}
                onClick={(e) => {
                  if (!preventIfLoading(e)) return;
                  closeNavMenus();
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
          <button
            type="button"
            className="navbar-tts-btn"
            aria-pressed={ttsEnabled}
            aria-label={ttsEnabled ? "TTS: ON — Desativar leitor de voz" : "TTS: OFF — Ativar leitor de voz"}
            onClick={() => {
              toggleTTS();
            }}
            onMouseEnter={() => !loading && speak("Alternar leitor de voz")}
            onFocus={() => !loading && speak("Alternar leitor de voz")}
          >
            {ttsEnabled ? "TTS: ON" : "TTS: OFF"}
          </button>

          {!user ? (
          <>
            {/* ENTRAR */}
            <Link
              to="/login"
              className="btn btn-light"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
                transition: 'all 0.12s ease',
              }}
              onClick={(e) => {
                if (!preventIfLoading(e)) return;
                closeNavMenus();
              }}
              onMouseEnter={() => !loading && speak("Entrar")}
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
                transition: 'all 0.12s ease',
              }}
              onClick={(e) => {
                if (!preventIfLoading(e)) return;
                closeNavMenus();
              }}
              onMouseEnter={() => !loading && speak("Cadastre-se")}
              onFocus={() => !loading && speak("Cadastre-se")}
            >
              Cadastre-se
            </Link>
          </>
        ) : (
          <div className="d-flex align-items-center gap-2 navbar-user-actions">
            <FaUserCircle size={28} aria-hidden="true" />

            {/* NOME DO USUÁRIO */}
            <button
              ref={profileTriggerRef}
              type="button"
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
              onClick={() => !loading && setShowModal(true)}
              onMouseEnter={() => !loading && speak("Editar perfil")}
              onFocus={() => !loading && speak("Editar perfil")}
              title="Editar perfil"
              aria-label={`Editar perfil: ${user.nome}`}
              className="navbar-user-name"
              tabIndex={loading ? -1 : 0}
              disabled={loading}
            >
              <span>{user.nome}</span>
              <FaEdit
                aria-hidden="true"
                style={{
                  fontSize: 20,
                  color: "#0d47a1",
                  background: "#e9f2ff",
                  borderRadius: "50%",
                  padding: 3,
                  flexShrink: 0,
                  boxShadow: "0 1px 4px rgba(13, 71, 161, 0.25)",
                }}
              />
            </button>

            <IoTNotificationBell onNavigate={closeNavMenus} />
            {/* LINK PARA HISTÓRICO */}
            <Link
              to="/historico"
              className="btn btn-primary btn-sm d-flex align-items-center"
              tabIndex={loading ? -1 : 0}
              onClick={(e) => {
                if (!preventIfLoading(e)) return;
                closeNavMenus();
                speak('Histórico');
              }}
              onMouseEnter={() => !loading && speak('Ver histórico')}
              onFocus={() => !loading && speak('Ver histórico')}
              style={{ textDecoration: 'none', borderRadius: 20, padding: '6px 12px' }}
            >
              <FaHistory aria-hidden="true" style={{ marginRight: 6 }} />
              Histórico
            </Link>

            {/* BOTÃO SAIR */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm btn-sair-ceos"
              onClick={() => {
                closeNavMenus();
                logout();
              }}
              onMouseEnter={() => !loading && speak("Sair")}
              disabled={loading}
              tabIndex={loading ? -1 : 0}
            >
              Sair
            </button>

            <EditProfileModal
              show={showModal}
              onClose={() => {
                setShowModal(false);
                setTimeout(() => {
                  try { profileTriggerRef.current?.focus(); } catch (err) {}
                }, 0);
              }}
              user={user}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSessionInvalidated={logout}
            />
          </div>
        )}
        </div>
      </div>
      {/* Toast container */}
      {toast.show && (
        <div style={{ position: 'fixed', right: 18, top: 84, zIndex: 200000 }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : toast.type === 'warning' ? 'alert-warning' : 'alert-info'}`} style={{ margin: 0, minWidth: 260, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}>
            {toast.message}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
