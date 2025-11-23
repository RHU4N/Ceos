import React from 'react';
import { Link } from 'react-router-dom';
import Sobre from '../components/Sobre';
import useScrollToSobre from '../hooks/useScrollToSobre';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

const Home = () => {
  useScrollToSobre();
  return (
    <>
      <div className="banner">
        <h1>Torne-se Premium! Veja nosso planos</h1>
        <button className="banner-btn">Saiba Mais</button>
      </div>
      <div className="page-container">
        <div className="left-section">
          <h2>
            Descubra mais sobre
            <span className="math"> Matemática</span>,
            <span className="physics"> Física</span> e
            <span className="chemistry"> Química </span>
            com <span className="ceos">Céos</span>
          </h2>
          <p>
            Facilitamos seus estudos de Física, Química e Matemática com uma ampla coleção de fórmulas e ferramentas interativas para cálculos rápidos e precisos.
            Seja para resolver exercícios, revisar conceitos ou aprofundar seu conhecimento, nosso site oferece uma experiência intuitiva e prática.
          </p>
        </div>
        <div className="right-section">
          <h4>Conheça nossas ferramentas</h4>
          <div className="tool-buttons">
            <Link to="/matematica">
              <button className="tool math-tool">
                <span style={{marginRight: 8, fontSize: 22}}>&#x2211;</span> {/* Soma Σ para matemática */}
                Matemática
              </button>
            </Link>
            <button className="tool physics-tool">
              <span style={{marginRight: 8, fontSize: 22}}>&#x269B;</span> {/* Átomo para física */}
              Física
            </button>
            <button className="tool chemistry-tool">
              <span style={{marginRight: 8, fontSize: 22}}>&#x2697;</span> {/* Tubo de ensaio para química */}
              Química
            </button>
          </div>
        </div>
      </div>
      <br />
      <div className="container2">
        <Sobre />
      </div>
    </>
  );
};

export default Home;
