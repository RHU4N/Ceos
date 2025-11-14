import React from 'react';
import { speak } from "../../hooks/useTTS"; // ← usa o mesmo TTS do projeto

const Calculos = () => (
  <div className="container3">

    {/* SIDEBAR */}
    <aside>

      <div className="sidebar-header">
        <button
          className="add-btn"
          onMouseEnter={() => speak("Adicionar novo cálculo")}
        >
          +
        </button>
      </div>

      <ul className="sidebar-list">

        <li
          onMouseEnter={() => speak("Cálculo 1")}
        >
          1
        </li>

        <li
          onMouseEnter={() => speak("Cálculo 2")}
        >
          2
        </li>

      </ul>
    </aside>

    {/* MAIN */}
    <main>
      <div className="grid">

        <div
          className="grid-item"
          onMouseEnter={() => speak("Bloco 1")}
        ></div>

        <div
          className="grid-item"
          onMouseEnter={() => speak("Bloco 2")}
        ></div>

        <div
          className="grid-item"
          onMouseEnter={() => speak("Bloco 3")}
        ></div>

        <div
          className="grid-item"
          onMouseEnter={() => speak("Bloco 4")}
        ></div>

      </div>
    </main>

  </div>
);

export default Calculos;
