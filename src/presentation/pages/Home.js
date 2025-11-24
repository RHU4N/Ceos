import React from 'react';
import { Link } from 'react-router-dom';
import Sobre from '../components/Sobre';
import useScrollToSobre from '../hooks/useScrollToSobre';
import { useEffect } from 'react';
import { speak, useTTS } from '../../hooks/useTTS';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

const Home = () => {
  useScrollToSobre();
  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try {
      speak('Página inicial. Torne-se Premium. Descubra nossas ferramentas de Matemática, Física e Química.');
    } catch (e) {}
  }, [enabled]);
  return (
    <>
      <div className="banner">
        <h1 onMouseEnter={() => speak('Torne-se Premium. Veja nossos planos.')} onFocus={() => speak('Torne-se Premium. Veja nossos planos.')}>
          Torne-se Premium! Veja nosso planos
        </h1>
        <button className="banner-btn" onMouseEnter={() => speak('Saiba mais sobre nossos planos')} onFocus={() => speak('Saiba mais sobre nossos planos')}>
          Saiba Mais
        </button>
      </div>
      <div className="page-container">
        <div className="left-section">
          <h2 onMouseEnter={() => speak('Descubra mais sobre Matemática, Física e Química com Céos')} onFocus={() => speak('Descubra mais sobre Matemática, Física e Química com Céos')}>
            Descubra mais sobre
            <span className="math"> Matemática</span>,
            <span className="physics"> Física</span> e
            <span className="chemistry"> Química </span>
            com <span className="ceos">Céos</span>
          </h2>
          <p onMouseEnter={() => speak('Facilitamos seus estudos com fórmulas e ferramentas interativas para cálculos rápidos e precisos')} onFocus={() => speak('Facilitamos seus estudos com fórmulas e ferramentas interativas para cálculos rápidos e precisos')}>
            Facilitamos seus estudos de Física, Química e Matemática com uma ampla coleção de fórmulas e ferramentas interativas para cálculos rápidos e precisos.
            Seja para resolver exercícios, revisar conceitos ou aprofundar seu conhecimento, nosso site oferece uma experiência intuitiva e prática.
          </p>
        </div>
        <div className="right-section">
          <h4>Conheça nossas ferramentas</h4>
          <div className="tool-buttons">
            <Link to="/matematica" onMouseEnter={() => speak('Navegar para Matemática')} onFocus={() => speak('Navegar para Matemática')}>
              <button className="tool math-tool" onMouseEnter={() => speak('Matemática')} onFocus={() => speak('Matemática')}>
                <span style={{marginRight: 8, fontSize: 22}}>&#x2211;</span> {/* Soma Σ para matemática */}
                Matemática
              </button>
            </Link>
            <Link to="/fisica" onMouseEnter={() => speak('Navegar para Física')} onFocus={() => speak('Navegar para Física')}>
              <button className="tool physics-tool" onMouseEnter={() => speak('Física')} onFocus={() => speak('Física')}>
                <span style={{marginRight: 8, fontSize: 22}}>&#x269B;</span> {/* Átomo para física */}
                Física
              </button>
            </Link>
            <Link to="/quimica" onMouseEnter={() => speak('Navegar para Química')} onFocus={() => speak('Navegar para Química')}>
              <button className="tool chemistry-tool" onMouseEnter={() => speak('Química')} onFocus={() => speak('Química')}>
                <span style={{marginRight: 8, fontSize: 22}}>&#x2697;</span> {/* Tubo de ensaio para química */}
                Química
              </button>
            </Link>
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
