import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/* Cuadro de honor: 6 campos de texto que el jugador rellena.
 * Cada acierto vale los puntos definidos en el admin (por defecto 10).
 */
const CAMPOS = [
  ['campeon', 'Campeón'],
  ['subcampeon', 'Subcampeón'],
  ['tercero', 'Tercer clasificado'],
  ['cuarto', 'Cuarto clasificado'],
  ['goleador', 'Máximo goleador'],
  ['mejor_jugador', 'Mejor jugador'],
];

export default function CuadroHonor({ sesion, fase }) {
  const [respuestas, setRespuestas] = useState({});
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const bloqueada = !fase.abierta;

  useEffect(() => {
    (async () => {
      try {
        const r = await api.cargarCuadroHonor(sesion.codigo, sesion.jugador.id);
        setRespuestas(r.respuestas || {});
      } catch (e) {
        setEstado({ tipo: 'error', texto: 'No se pudo cargar: ' + e.message });
      } finally {
        setCargando(false);
      }
    })();
  }, [sesion]);

  function fijar(campo, valor) {
    setRespuestas((prev) => ({ ...prev, [campo]: valor }));
    setEstado(null);
  }

  async function guardar() {
    setEstado({ tipo: 'info', texto: 'Guardando…' });
    try {
      await api.guardarCuadroHonor(sesion.codigo, sesion.jugador.id, respuestas);
      setEstado({ tipo: 'ok', texto: 'Cuadro de honor guardado.' });
    } catch (e) {
      setEstado({ tipo: 'error', texto: 'Error al guardar: ' + e.message });
    }
  }

  if (cargando) return <div className="tarjeta">Cargando…</div>;

  return (
    <div className="tarjeta">
      <h3>Cuadro de honor</h3>
      <p className="aviso info">
        Rellena tus apuestas para el final del torneo. Cada acierto suma
        puntos. El organizador valida las respuestas al terminar el Mundial.
      </p>
      {CAMPOS.map(([id, etiqueta]) => (
        <div key={id}>
          <label>{etiqueta}</label>
          <input
            value={respuestas[id] || ''}
            disabled={bloqueada}
            onChange={(e) => fijar(id, e.target.value)}
            placeholder={etiqueta + '…'}
          />
        </div>
      ))}
      {!bloqueada && (
        <button className="btn fila" onClick={guardar}>
          Guardar cuadro de honor
        </button>
      )}
      {bloqueada && (
        <p className="aviso info" style={{ marginTop: 14 }}>
          La fase está cerrada: el cuadro de honor ya no se puede editar.
        </p>
      )}
      {estado && <div className={'aviso ' + estado.tipo}>{estado.texto}</div>}
    </div>
  );
}
