import React from 'react';
import './App.css';
import './Style.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Matematica from './pages/Matematica';
import Funcao from './pages/Funcao';
import AnaliseComb from './pages/AnaliseComb';
import Estatistica from './pages/Estatistica';
import Footer from './components/Footer';
import FAQ from './pages/FAQ';
import Sobre from './components/Sobre';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/matematica" element={<Matematica />} />
            <Route path="/matematica/funcao" element={<Funcao />} />
            <Route path="/matematica/analise-combinatoria" element={<AnaliseComb />} />
            <Route path="/matematica/estatistica" element={<Estatistica />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
