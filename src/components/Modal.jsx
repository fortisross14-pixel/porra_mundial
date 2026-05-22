/* Ventana emergente (popup) reutilizable. Se cierra al pulsar la X,
 * al hacer clic fuera, o con la tecla Escape.
 */
import { useEffect } from 'react';

export default function Modal({ titulo, alCerrar, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alCerrar]);

  return (
    <div className="modal-fondo" onClick={alCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2 style={{ margin: 0 }}>{titulo}</h2>
          <button className="modal-cerrar" onClick={alCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}
