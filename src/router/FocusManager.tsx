import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export function FocusManager() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Encontra o elemento <main> no documento
    mainContentRef.current = document.querySelector('main');

    // Tenta focar no conteúdo principal após a mudança de rota
    if (mainContentRef.current) {
      mainContentRef.current.setAttribute('tabIndex', '-1');
      mainContentRef.current.focus();
    }
  }, [location.pathname]); // Executa sempre que a URL muda

  return null; // Este componente não renderiza nada
}