import React from "react";
import { speak } from "../../hooks/useTTS";

const FAQ = () => {
  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="/"
              onMouseEnter={() => speak("Página inicial")}
            >
              Home
            </a>
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
                    "Para recuperar sua senha, clique em esqueci minha senha na tela de login. Você receberá um e-mail com instruções. Se não receber, verifique o spam ou contate o suporte."
                  )
                }
              >
                Para recuperar sua senha, clique em "Esqueci minha senha" na tela de login. Você receberá um e-mail com instruções para redefinir sua senha. Caso não receba o e-mail, verifique sua caixa de spam ou entre em contato com o suporte técnico.
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
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseFive"
                aria-expanded="false"
                aria-controls="collapseFive"
                onMouseEnter={() => speak("O que muda do plano gratuito para o plano pago?")}
              >
                O que muda do plano gratuito para o pago?
              </button>
            </h2>

            <div
              id="collapseFive"
              className="accordion-collapse collapse"
              data-bs-parent="#accordionExample"
            >
              <div
                className="accordion-body"
                onMouseEnter={() =>
                  speak(
                    "O plano gratuito tem funcionalidades limitadas. O plano pago libera tudo, oferece suporte prioritário e atualizações exclusivas."
                  )
                }
              >
                O plano gratuito oferece acesso limitado a algumas funcionalidades da calculadora. Já o plano pago oferece acesso completo a todas as funcionalidades, além de suporte técnico prioritário e atualizações exclusivas.
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default FAQ;
