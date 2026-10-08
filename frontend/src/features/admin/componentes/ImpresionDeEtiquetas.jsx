import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ThesisLabel from '../../catalog/ThesisLabel';

// Impresión de las etiquetas de contraportada (propuesta, sección 4.4.1). `imprimir([tesis...])` abre el cuadro de impresión
// con solo las etiquetas, y `portal` va dentro del JSX de quien lo usa. Las etiquetas se dibujan únicamente mientras se
// imprimen; `afterprint` avisa cuando termina o se cancela. Los estilos de impresión están en theme.css.
export function useImpresionDeEtiquetas() {
  const [paraImprimir, setParaImprimir] = useState([]);

  useEffect(() => {
    if (paraImprimir.length === 0) return undefined;
    document.body.classList.add('imprimiendo-etiquetas');
    const terminar = () => setParaImprimir([]);
    window.addEventListener('afterprint', terminar, { once: true });
    window.print();
    return () => {
      window.removeEventListener('afterprint', terminar);
      document.body.classList.remove('imprimiendo-etiquetas');
    };
  }, [paraImprimir]);

  const portal =
    paraImprimir.length > 0
      ? createPortal(
          <div id="etiquetas-impresion">
            {paraImprimir.map((t) => (
              <ThesisLabel key={t.id} tesis={t} />
            ))}
          </div>,
          document.body
        )
      : null;

  return { imprimir: setParaImprimir, portal };
}
