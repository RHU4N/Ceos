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
import Footer from './presentation/components/Footer';
import FAQ from './presentation/pages/FAQ';
import Login from './presentation/pages/Login';
import Register from './presentation/pages/Register';
// import Feedback from './presentation/pages/Feedback';
import { AuthProvider } from './presentation/context/AuthContext';

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
            {/* <Route path="/feedback" element={<Feedback />} /> */}
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
