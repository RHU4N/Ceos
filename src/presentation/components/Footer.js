import React from 'react';
import { Link } from 'react-router-dom'
import './Style.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <Link to="/" className="footer-logo">
        <img src="/logo.png" alt="Logo Céos" />
        <span>Céos</span>
      </Link>
      <p className="footer-text">
        Email de contato: <a href="mailto:ceoscalculadora.suporte@gmail.com">ceoscalculadora.suporte@gmail.com</a> | © 2025 Céos
      </p>
    </div>
  </footer>
);

export default Footer;
