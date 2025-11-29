import React from 'react';
import './App.css';
import './Style.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './presentation/components/Navbar';
import Home from './presentation/pages/Home';
import Matematica from './presentation/pages/Matematica';
import Funcao from './presentation/pages/Funcao';
import AnaliseComb from './presentation/pages/AnaliseComb';
import Estatistica from './presentation/pages/Estatistica';
import MatematicaFinanceira from './presentation/pages/MatematicaFinanceira';
import Fisica from './presentation/pages/Fisica';
import Cinetica from './presentation/pages/Cinetica';
import Dinamica from './presentation/pages/Dinamica';
import Energia from './presentation/pages/Energia';
import Footer from './presentation/components/Footer';
import FAQ from './presentation/pages/FAQ';
import Login from './presentation/pages/Login';
import Register from './presentation/pages/Register';
import Quimica from './presentation/pages/Quimica';
import Estequiometria from './presentation/pages/Estequiometria';
import Concentracao from './presentation/pages/Concentracao';
import Termoquimica from './presentation/pages/Termoquimica';
import Solucoes from './presentation/pages/Solucoes';
// import Feedback from './presentation/pages/Feedback';
import { AuthProvider } from './presentation/context/AuthContext';
import { LoadingProvider } from './presentation/context/LoadingContext';

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/matematica" element={<Matematica />} />
              <Route path="/matematica/funcao" element={<Funcao />} />
              <Route path="/matematica/analise-combinatoria" element={<AnaliseComb />} />
              <Route path="/matematica/estatistica" element={<Estatistica />} />
              <Route path="/matematica/financeira" element={<MatematicaFinanceira />} />
              <Route path="/fisica" element={<Fisica />} />
              <Route path="/fisica/cinetica" element={<Cinetica />} />
              <Route path="/fisica/dinamica" element={<Dinamica />} />
              <Route path="/fisica/energia" element={<Energia />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/quimica" element={<Quimica />} />
              <Route path="/quimica/estequiometria" element={<Estequiometria />} />
              <Route path="/quimica/concentracao" element={<Concentracao />} />
              <Route path="/quimica/termoquimica" element={<Termoquimica />} />
              <Route path="/solucoes" element={<Solucoes />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* <Route path="/feedback" element={<Feedback />} /> */}
            </Routes>
          </main>
          <Footer />
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
