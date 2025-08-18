import { useEffect } from 'react';

export default function useScrollToSobre() {
  useEffect(() => {
    const btnSobre = document.getElementById('btn-sobre');
    const sectionSobre = document.getElementById('sobre-nos');
    if (btnSobre && sectionSobre) {
      const handleClick = (e) => {
        e.preventDefault();
        sectionSobre.scrollIntoView({ behavior: 'smooth' });
      };
      btnSobre.addEventListener('click', handleClick);
      return () => btnSobre.removeEventListener('click', handleClick);
    }
  }, []);
}
