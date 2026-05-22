import Modal from './Modal.jsx';
import { desgloseJugador, textoTipo, diaDePartido } from '../lib/calculo.js';

/* Popup con el desglose por partido de un jugador.
 * Muestra cada partido con resultado, lo que predijo, y los puntos.
 * `soloDia` (opcional) = YYYY-MM-DD para filtrar a un solo día.
 */
export default function DesgloseJugador({
  jugador, predicciones, resultados, valores, soloDia, alCerrar,
}) {
  let filas = desgloseJugador(jugador.jugadorId, predicciones, resultados, valores);

  if (soloDia) {
    filas = filas.filter((f) => diaDePartido(f.partidoId) === soloDia);
  }

  const total = filas.reduce((s, f) => s + f.puntos, 0);

  return (
    <Modal titulo={`Desglose · ${jugador.usuario}`} alCerrar={alCerrar}>
      {filas.length === 0 ? (
        <p className="aviso info">Todavía no hay partidos con resultado.</p>
      ) : (
        <table className="tabla-puntos">
          <thead>
            <tr>
              <th>Partido</th><th>Tu pron.</th><th>Real</th>
              <th>Acierto</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.partidoId}>
                <td>{f.etiqueta}</td>
                <td>{f.pred ? `${f.pred.local}-${f.pred.visitante}` : '—'}</td>
                <td>{f.real ? `${f.real.local}-${f.real.visitante}` : '—'}</td>
                <td style={{
                  color: f.tipo === 'exacto' ? 'var(--verde)'
                    : f.tipo === '1x2' ? 'var(--azul)'
                    : 'var(--texto-tenue)',
                  fontWeight: 600,
                }}>
                  {textoTipo(f.tipo)}
                </td>
                <td style={{ fontWeight: 700 }}>{f.puntos}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
              <td style={{ fontWeight: 700, color: 'var(--azul)' }}>{total}</td>
            </tr>
          </tbody>
        </table>
      )}
    </Modal>
  );
}
