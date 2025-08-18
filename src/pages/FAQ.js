import React from "react";

const FAQ = () => {
  return (
    <>
    <nav aria-label="breadcrumb" className='nav justify-content-center'>
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">FAQ
          </li>
        </ol>
      </nav>
    <div className="container mt-5 row">
    <h1 className="mb-4 text-center display-5">FAQ</h1>
      <div className="accordion" id="accordionExample">
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              Não estou conseguindo fazer o cálculo, o que fazer?
            </button>
          </h2>
          <div
            id="collapseOne"
            className="accordion-collapse collapse show"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">
              Caso você não consiga fazer o cálculo, verifique se os dados foram inseridos corretamente. Se o problema persistir, entre em contato com o suporte técnico através do e-mail: ceoscalculadora.suporte@gmail.com
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseTwo"
              aria-expanded="false"
              aria-controls="collapseTwo"
            >
              Esqueci minha senha, como posso recuperá-la?
            </button>
          </h2>
          <div
            id="collapseTwo"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">
              Para recuperar sua senha, clique em "Esqueci minha senha" na tela de login. Você receberá um e-mail com instruções para redefinir sua senha. Caso não receba o e-mail, verifique sua caixa de spam ou entre em contato com o suporte técnico.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseThree"
              aria-expanded="false"
              aria-controls="collapseThree"
            >
              Esqueci meu login, como posso recuperá-lo?
            </button>
          </h2>
          <div
            id="collapseThree"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">
              Não é possível recuperar o login, mas você pode criar uma nova conta com um novo e-mail. Caso tenha dúvidas, entre em contato com o suporte técnico.
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseFour"
              aria-expanded="false"
              aria-controls="collapseFour"
            >
              Está dando erro de conexão, o que fazer?
            </button>
          </h2>
          <div
            id="collapseFour"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">
              verifique sua conexão com a internet e tente novamente. Se o problema persistir, entre em contato com o suporte técnico através do e-mail: ceoscalculadora.suporte@gmail.com
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseFive"
              aria-expanded="false"
              aria-controls="collapseFive"
            >
              O que muda do plano gratuito para o pago?
            </button>
          </h2>
          <div
            id="collapseFive"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">
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
