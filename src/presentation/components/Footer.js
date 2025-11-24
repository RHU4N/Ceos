import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'
import './Style.css';
import { speak, useTTS } from '../../hooks/useTTS';

const Footer = () => {
  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try {
      speak('Email de contato: ceoscalculadora ponto suporte arroba gmail ponto com. Direitos reservados, 2025.');
    } catch (e) {}
  }, [enabled]);

  const footerAnnouncement = 'Email de contato: ceoscalculadora.suporte@gmail.com.';

  return (
    <footer
      className="footer"
      onMouseEnter={() => speak(footerAnnouncement)}
      onFocus={() => speak(footerAnnouncement)}
      tabIndex={0}
      aria-label="Rodapé do site"
    >
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
};

export default Footer;
