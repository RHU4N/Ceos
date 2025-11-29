import React from "react";
import "../components/Style.css"; // <-- ajuste para importar o CSS de componentes globais
// import axios from 'axios';
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginUser from "../../domain/usecases/LoginUser";
import UserApiRepository from "../../infrastructure/api/UserApiRepository";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useLoading } from "../context/LoadingContext";
import { speak, useTTS } from "../../hooks/useTTS";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const { loading, setLoading } = useLoading();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try { speak('Entrar na sua conta'); } catch (e) {}
  }, [enabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    document.body.classList.add("loading-global");
    const userRepository = new UserApiRepository();
    const loginUser = new LoginUser(userRepository);
    try {
      const { user, token } = await loginUser.execute({ email, senha });
      login(user, token);
      navigate("/");
    } catch (err) {
      setErro(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
      document.body.classList.remove("loading-global");
    }
  };

  return (
    <main>
      <div className="centered-auth-container">
        <div
          className="card p-4 shadow login-card col-12 col-sm-10 col-md-8 col-lg-5"
          style={{ maxWidth: 400, width: "100%" }}
        >
          <h3
            className="mb-3 text-center"
            style={{ fontWeight: 700, letterSpacing: 1 }}
            onMouseEnter={() => speak("Entrar na sua conta")}
            onFocus={() => speak("Entrar na sua conta")}
          >
            Entrar na sua conta
          </h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="form-label fw-bold">
              E-mail
            </label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light">
                <FaEnvelope />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Digite seu e-mail"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                onMouseEnter={() => speak("Campo e-mail")}
                onFocus={() => speak("Campo e-mail")}
              />
            </div>
            <label htmlFor="senha" className="form-label fw-bold">
              Senha
            </label>
            <div className="input-group mb-2">
              <span className="input-group-text bg-light">
                <FaLock />
              </span>
              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Digite sua senha"
                className="form-control"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={loading}
                onMouseEnter={() => speak("Campo senha")}
                onFocus={() => speak("Campo senha")}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 mt-2 fw-bold"
              disabled={loading}
              onMouseEnter={() => speak("Entrar")}
              onFocus={() => speak("Entrar")}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            {erro && (
              <div
                className="alert alert-danger mt-2"
                onMouseEnter={() => speak("Erro ao fazer login")}
                onFocus={() => speak("Erro ao fazer login")}
              >
                {erro}
              </div>
            )}
          </form>
          <div className="mt-3 text-center small">
            <button
              type="button"
              className="btn btn-link text-decoration-none p-0"
              style={{ boxShadow: "none" }}
              tabIndex={loading ? -1 : 0}
              onClick={(e) => {
                e.preventDefault();
                if (!loading) {
                  speak("Esqueci minha senha");
                  navigate('/forgot-password');
                }
              }}
              onMouseEnter={() => !loading && speak("Esqueci minha senha")}
              onFocus={() => !loading && speak("Esqueci minha senha")}
            >
              Esqueci minha senha
            </button>
            <span className="mx-2">|</span>
            <Link
              to="/register"
              className="text-decoration-none"
              tabIndex={loading ? -1 : 0}
              style={{
                pointerEvents: loading ? "none" : undefined,
                opacity: loading ? 0.6 : undefined,
              }}
              onClick={(e) => loading && e.preventDefault()}
              onMouseEnter={() => !loading && speak("Não tem conta? Cadastre-se")}
              onFocus={() => !loading && speak("Não tem conta? Cadastre-se")}
            >
              Não tem conta? Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
