import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { NOMBRE_RONDA } from '../../data/eliminatoria.js';
import { nombreEquipo } from '../../data/partidos.js';
import { cuadroDelJugador, cuadroCompleto, baseAdminDesdeFilas, RONDAS_ELIM } from '../lib/eliminatoria.js';
import Bandera from './Bandera.jsx';

/* Pantalla de pronóstico de la FASE ELIMINATORIA.
 * El jugador predice un marcador por cruce. El ganador que predice
 * avanza y rellena la ronda siguiente (cuadro progresivo).
 * Si predice empate, elige quién pasa en penaltis.
 */
export default function PronosticoElim({ sesion, fase, rondaExterna }) {
  const [base, setBase] = useState(null);          // cuadro resuelto por el admin
  const [predicciones, setPredicciones] = useState({}); // cruceId -> {local,visitante,penaltis}
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const bloqueada = !fase.abierta;

  useEffect(() => {
    (async () => {
      try {
        const cuadro = await api.cargarCuadro();
        setBase(baseAdminDesdeFilas(cuadro.huecos));

        const r = await api.cargarPronostico(sesion.codigo, sesion.jugador.id, fase.id);
        const pred = {};
        for (const p of r.predicciones) {
          pred[p.partido_id] = {
            local: p.goles_local,
            visitante: p.goles_visitante,
            penaltis: p.penaltis || '',
          };
        }
        setPredicciones(pred);
      } catch (e) {
        setEstado({ tipo: 'error', texto: 'No se pudo cargar: ' + e.message });
      } finally {
        setCargando(false);
      }
    })();
  }, [sesion, fase]);

  function fijarGol(cruceId, lado, valor) {
    const n = valor === '' ? null : Math.max(0, Math.min(20, parseInt(valor, 10)));
    setPredicciones((prev) => {
      const actual = prev[cruceId] || {};
      const nuevo = { ...actual, [lado]: Number.isNaN(n) ? null : n };
      // Si deja de ser empate, se borra la elección de penaltis.
      if (nuevo.local != null && nuevo.visitante != null && nuevo.local !== nuevo.visitante) {
        nuevo.penaltis = '';
      }
      return { ...prev, [cruceId]: nuevo };
    });
    setEstado(null);
  }

  function fijarPenaltis(cruceId, equipo) {
    setPredicciones((prev) => ({
      ...prev,
      [cruceId]: { ...prev[cruceId], penaltis: equipo },
    }));
    setEstado(null);
  }

  async function guardar() {
    try {
      const lista = Object.entries(predicciones)
        .filter(([, v]) => v && v.local != null && v.visitante != null)
        .map(([partidoId, v]) => ({
          partidoId,
          golesLocal: v.local,
          golesVisitante: v.visitante,
          penaltis: v.penaltis || '',
        }));
      await api.guardarPronostico({
        codigo: sesion.codigo,
        jugadorId: sesion.jugador.id,
        faseId: fase.id,
        predicciones: lista,
        desempates: [],
      });
      const completo = cuadroCompleto(cruces);
      if (completo) {
        setEstado({ tipo: 'ok', texto: 'Cuadro completo y guardado correctamente.' });
      } else {
        setEstado({ tipo: 'falta', texto: 'Guardado. Aún te faltan cruces por completar.' });
      }
    } catch (e) {
      setEstado({ tipo: 'error', texto: 'Error al guardar: ' + e.message });
    }
  }

  if (cargando) return <div className="tarjeta">Cargando cuadro…</div>;

  if (!base || Object.keys(base).length === 0) {
    return (
      <div className="tarjeta">
        <h2>{fase.nombre}</h2>
        <p className="aviso info">
          El organizador todavía no ha definido el cuadro eliminatorio.
          Vuelve cuando termine la fase de grupos.
        </p>
      </div>
    );
  }

  const cruces = cuadroDelJugador(base, predicciones);
  const porRonda = {};
  for (const c of cruces) {
    if (!porRonda[c.ronda]) porRonda[c.ronda] = [];
    porRonda[c.ronda].push(c);
  }

  return (
    <>
      {!rondaExterna && (
        <div className="tarjeta">
          <h2>{fase.nombre}</h2>
          {bloqueada ? (
            <p className="aviso info">
              Esta fase está cerrada. Tu cuadro ya no se puede modificar.
            </p>
          ) : (
            <p className="aviso info">
              Predice el marcador de cada cruce. El ganador que elijas avanza
              a la siguiente ronda. Si empatas, elige quién pasa en penaltis.
            </p>
          )}
        </div>
      )}

      {RONDAS_ELIM.filter((r) => !rondaExterna || r === rondaExterna).map((ronda) => (
        porRonda[ronda] ? (
          <div className="tarjeta" key={ronda}>
            <h3>{NOMBRE_RONDA[ronda]}</h3>
            {porRonda[ronda].map((c) => (
              <CruceElim
                key={c.id}
                cruce={c}
                bloqueada={bloqueada}
                alGol={fijarGol}
                alPenaltis={fijarPenaltis}
              />
            ))}
          </div>
        ) : null
      ))}

      {!bloqueada && (
        <>
          <button className="btn fila" onClick={guardar}>
            Guardar mi cuadro
          </button>
          {estado && <div className={'aviso ' + estado.tipo}>{estado.texto}</div>}
        </>
      )}
    </>
  );
}

/* Un cruce individual: dos equipos, marcador, y selector de penaltis
 * si el jugador predice empate. */
function CruceElim({ cruce, bloqueada, alGol, alPenaltis }) {
  const { equipoLocal, equipoVisitante, pred, listo, esEmpate } = cruce;

  if (!listo) {
    return (
      <div className="partido">
        <span className="lado" style={{ color: 'var(--texto-tenue)' }}>
          Por determinar
        </span>
        <span className="marcador">·</span>
        <span className="guion">–</span>
        <span className="marcador">·</span>
        <span className="lado visita" style={{ color: 'var(--texto-tenue)' }}>
          Por determinar
        </span>
        <span className="fecha-partido">
          Completa la ronda anterior para desbloquear este cruce.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="partido">
        <span className="lado">
          <Bandera code={equipoLocal} ancho={40} />
          <span className="nombre">{nombreEquipo(equipoLocal)}</span>
        </span>
        <input
          className="marcador" inputMode="numeric" disabled={bloqueada}
          value={pred.local ?? ''}
          onChange={(e) => alGol(cruce.id, 'local', e.target.value)}
        />
        <span className="guion">–</span>
        <input
          className="marcador" inputMode="numeric" disabled={bloqueada}
          value={pred.visitante ?? ''}
          onChange={(e) => alGol(cruce.id, 'visitante', e.target.value)}
        />
        <span className="lado visita">
          <span className="nombre">{nombreEquipo(equipoVisitante)}</span>
          <Bandera code={equipoVisitante} ancho={40} />
        </span>
      </div>

      {esEmpate && (
        <div className="penaltis">
          <span className="penaltis-txt">Pasa en penaltis:</span>
          <button
            className={'btn-mini ' + (pred.penaltis === equipoLocal ? 'pen-activo' : '')}
            disabled={bloqueada}
            onClick={() => alPenaltis(cruce.id, equipoLocal)}
          >
            {nombreEquipo(equipoLocal)}
          </button>
          <button
            className={'btn-mini ' + (pred.penaltis === equipoVisitante ? 'pen-activo' : '')}
            disabled={bloqueada}
            onClick={() => alPenaltis(cruce.id, equipoVisitante)}
          >
            {nombreEquipo(equipoVisitante)}
          </button>
        </div>
      )}
    </>
  );
}
