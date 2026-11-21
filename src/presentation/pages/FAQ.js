import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { speak } from "../../hooks/useTTS";

const FAQ = () => {
  const location = useLocation();
  const isPlansOpen = location.hash === "#planos";

  useEffect(() => {
    if (!isPlansOpen) return;
    try {
      const target = document.getElementById("planos");
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {}
  }, [isPlansOpen]);

  return (
    <div className="faq-page">
      <nav aria-label="breadcrumb" className="nav justify-content-center">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link
              to="/"
              onMouseEnter={() => speak("Página inicial")}
            >
              Home
            </Link>
          </li>

          <li
            className="breadcrumb-item active"
            aria-current="page"
            onMouseEnter={() => speak("Perguntas frequentes")}
          >
            FAQ
          </li>
        </ol>
      </nav>

      <div className="container mt-5 row justify-content-center">
        <h1
          className="mb-4 text-center display-5"
          onMouseEnter={() => speak("Perguntas frequentes")}
        >
          FAQ
        </h1>

        <div className="accordion col-12 col-md-10 col-lg-8 mx-auto" id="accordionExample">

          {/* 1 */}
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseOne"
                aria-expanded="true"
                aria-controls="collapseOne"
                onMouseEnter={() => speak("Não estou conseguindo fazer o cálculo, o que fazer?")}
              >
                Não estou conseguindo fazer o cálculo, o que fazer?
              </button>
            </h2>

            <div
              id="collapseOne"
              className="accordion-collapse collapse show"
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "Se você não conseguir fazer o cálculo, verifique se os dados foram inseridos corretamente. Se o problema continuar, contate o suporte técnico pelo e-mail ceoscalculadora ponto suporte arroba gmail ponto com"
                  )
                }
              >
                Caso você não consiga fazer o cálculo, verifique se os dados foram inseridos corretamente. Se o problema persistir, entre em contato com o suporte técnico através do e-mail: ceoscalculadora.suporte@gmail.com
              </div>
            </div>
          </div>

          {/* 2 */}
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseTwo"
                aria-expanded="false"
                aria-controls="collapseTwo"
                onMouseEnter={() => speak("Esqueci minha senha, como posso recuperá-la?")}
              >
                Esqueci minha senha, como posso recuperá-la?
              </button>
            </h2>

            <div
              id="collapseTwo"
              className="accordion-collapse collapse"
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "A recuperação automática por e-mail ainda não está disponível nesta versão. Caso ainda tenha acesso à conta, altere a senha em Editar perfil; se perdeu o acesso, contate o suporte técnico."
                  )
                }
              >
                A recuperação automática de senha por e-mail ainda não está disponível nesta versão. Se você ainda tiver acesso à conta, use a opção <strong>Editar perfil</strong> na barra superior para atualizar sua senha; caso tenha perdido o acesso, entre em contato com o suporte técnico pelo e-mail <a href="mailto:ceoscalculadora.suporte@gmail.com">ceoscalculadora.suporte@gmail.com</a>.
              </div>
            </div>
          </div>

          {/* 3 */}
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseThree"
                aria-expanded="false"
                aria-controls="collapseThree"
                onMouseEnter={() => speak("Esqueci meu login, como posso recuperá-lo?")}
              >
                Esqueci meu login, como posso recuperá-lo?
              </button>
            </h2>

            <div
              id="collapseThree"
              className="accordion-collapse collapse"
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "Não é possível recuperar o login, mas você pode criar uma nova conta com outro e-mail. Se tiver dúvidas, contate o suporte técnico."
                  )
                }
              >
                Não é possível recuperar o login, mas você pode criar uma nova conta com um novo e-mail. Caso tenha dúvidas, entre em contato com o suporte técnico.
              </div>
            </div>
          </div>

          {/* 4 */}
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseFour"
                aria-expanded="false"
                aria-controls="collapseFour"
                onMouseEnter={() => speak("Está dando erro de conexão, o que fazer?")}
              >
                Está dando erro de conexão, o que fazer?
              </button>
            </h2>

            <div
              id="collapseFour"
              className="accordion-collapse collapse"
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "Verifique sua conexão com a internet e tente novamente. Se o problema continuar, contate o suporte técnico pelo e-mail ceoscalculadora ponto suporte arroba gmail ponto com"
                  )
                }
              >
                verifique sua conexão com a internet e tente novamente. Se o problema persistir, entre em contato com o suporte técnico através do e-mail: ceoscalculadora.suporte@gmail.com
              </div>
            </div>
          </div>

          {/* 5 */}
          <div className="accordion-item" id="planos">
            <h2 className="accordion-header">
              <button
                className={`accordion-button ${isPlansOpen ? "" : "collapsed"}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseFive"
                aria-expanded={isPlansOpen}
                aria-controls="collapseFive"
                onMouseEnter={() => speak("O que muda do plano gratuito para o plano pago?")}
              >
                O que muda do plano gratuito para o pago?
              </button>
            </h2>

            <div
              id="collapseFive"
              className={`accordion-collapse collapse ${isPlansOpen ? "show" : ""}`}
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "Todas as calculadoras de Matemática, Física e Química, funções personalizadas e painéis IoT já estão liberados para uso acadêmico no CEOS. A contratação de planos comerciais ainda não está habilitada nesta versão."
                  )
                }
              >
                Atualmente todas as calculadoras de Matemática, Física e Química, funções personalizadas, favoritos e painel IoT disponíveis no CEOS estão liberados para uso. Funcionalidades futuras de planos pagos adicionais ainda não estão habilitadas nesta versão; dúvidas podem ser enviadas para <a href="mailto:ceoscalculadora.suporte@gmail.com">ceoscalculadora.suporte@gmail.com</a>.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;
