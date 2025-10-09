import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export function FocusManager() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement | null>(null);
  // # atualizado: Estado para armazenar o título e anunciá-lo
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    mainContentRef.current = document.querySelector('main');
    
    if (mainContentRef.current) {
      mainContentRef.current.setAttribute('tabIndex', '-1');
      mainContentRef.current.focus({ preventScroll: true }); // Evita saltos na página
    }

    // # atualizado: Define o anúncio após um pequeno atraso
    // para garantir que o foco já mudou.
    const timeoutId = setTimeout(() => {
      setAnnouncement(`Carregada a página: ${document.title}`);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // # atualizado: Este elemento, visualmente oculto, lerá o conteúdo
  // para leitores de tela sempre que o estado 'announcement' mudar.
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
    >
      {announcement}
    </div>
  );
}