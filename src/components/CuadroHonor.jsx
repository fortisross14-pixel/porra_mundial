import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { EQUIPOS, nombreEquipo } from '../../data/partidos.js';

/* Cuadro de honor: 6 campos que el jugador rellena.
 *  - Campeón, Subcampeón, 3.º y 4.º: equipo elegido de un desplegable.
 *  - Máximo goleador y Mejor jugador: texto libre (son jugadores, no
 *    equipos, y no hay lista de jugadores en la app).
 * Cada acierto vale los puntos definidos en el admin.
 */
const CAMPOS = [
  ['campeon', 'Campeón', 'equipo'],
  ['subcampeon', 'Subcampeón', 'equipo'],
  ['tercero', 'Tercer clasificado', 'equipo'],
  ['cuarto', 'Cuarto clasificado', 'equipo'],
  ['goleador', 'Máximo goleador', 'texto'],
  ['mejor_jugador', 'Mejor jugador', 'texto'],
];

export default function CuadroHonor({ sesion, fase, alGuardar }) {
  const [respuestas, setRespuestas] = useState({});
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const bloqueada = !fase.abierta;

  // Equipos ordenados por nombre, para los desplegables.
  const equipos = Object.keys(EQUIPOS).sort((a, b) =>
    nombreEquipo(a).localeCompare(nombreEquipo(b), 'es')
  );

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
      if (alGuardar) alGuardar(); // refresca el color del botón
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
      {CAMPOS.map(([id, etiqueta, tipo]) => (
        <div key={id}>
          <label>{etiqueta}</label>
          {tipo === 'equipo' ? (
            <select
              value={respuestas[id] || ''}
              disabled={bloqueada}
              onChange={(e) => fijar(id, e.target.value)}
            >
              <option value="">— Elige un equipo —</option>
              {equipos.map((c) => (
                <option key={c} value={c}>{nombreEquipo(c)}</option>
              ))}
            </select>
          ) : (
            <input
              value={respuestas[id] || ''}
              disabled={bloqueada}
              onChange={(e) => fijar(id, e.target.value)}
              placeholder={etiqueta + '…'}
            />
          )}
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
