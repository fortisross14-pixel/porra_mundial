import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { GRUPOS, partidosDeGrupo, nombreEquipo } from '../../data/partidos.js';
import { valoresDesdeFilas } from '../../puntuacion.js';
import { rankingTotal, cuadriculaDia, diasConPartidos } from '../lib/calculo.js';
import { RONDAS_ELIM } from '../lib/eliminatoria.js';
import { NOMBRE_RONDA } from '../../data/eliminatoria.js';
import Bandera from './Bandera.jsx';
import Modal from './Modal.jsx';
import SubCinta from './SubCinta.jsx';
import TablaPuntos from './TablaPuntos.jsx';
import DesgloseJugador from './DesglosesJugador.jsx';

/* Pantalla "Resultados" con 3 sub-pestañas:
 *   - Resultados      : resultados reales del Mundial, por grupo
 *   - Resultados diarios : ranking de jugadores por día
 *   - Clasificación total: ranking acumulado
 */
export default function Resultados({ sesion, faseGrupos, faseElim }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [sub, setSub] = useState('resultados');
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // El ranking se calcula sobre la fase de grupos.
        setDatos(await api.ranking(sesion.codigo, faseGrupos.id));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [sesion, faseGrupos]);

  if (error) return <div className="tarjeta"><div className="aviso error">{error}</div></div>;
  if (!datos) return <div className="tarjeta">Cargando…</div>;

  const valores = valoresDesdeFilas(datos.valores);

  const sub2 = [
    { id: 'resultados', texto: 'Resultados' },
    { id: 'diarios', texto: 'Resultados diarios' },
    { id: 'total', texto: 'Clasificación total' },
  ];

  return (
    <>
      <SubCinta items={sub2} activo={sub} alElegir={setSub} />

      <div className="tarjeta">
        <div className="fila-cuenta">
          <h2 style={{ margin: 0 }}>
            {sub2.find((s) => s.id === sub)?.texto}
          </h2>
          <button className="btn-ayuda" onClick={() => setAyuda(true)} title="¿Cómo se puntúa?">
            ?
          </button>
        </div>
      </div>

      {sub === 'resultados' && <ResultadosPorSeccion datos={datos} faseElim={faseElim} />}
      {sub === 'diarios' && <ResultadosDiarios datos={datos} valores={valores} />}
      {sub === 'total' && <ClasificacionTotal datos={datos} valores={valores} />}

      {ayuda && (
        <Modal titulo="¿Cómo se puntúa?" alCerrar={() => setAyuda(false)}>
          <TablaPuntos valores={valores} cuadroHonor={datos.cuadroHonorValor} />
        </Modal>
      )}
    </>
  );
}

/* ---------- Resultados reales: secciones (grupos / cuadro / rondas) ---------- */
function ResultadosPorSeccion({ datos, faseElim }) {
  const letras = Object.keys(GRUPOS);
  const [seccion, setSeccion] = useState('G:' + letras[0]);

  const real = {};
  for (const r of datos.resultados) {
    real[r.partido_id] = { l: r.goles_local, v: r.goles_visitante };
  }

  return (
    <>
      <div className="pestanas">
        {letras.map((l) => (
          <button key={l}
            className={'pestana ' + (seccion === 'G:' + l ? 'activa' : '')}
            onClick={() => setSeccion('G:' + l)}>Grupo {l}</button>
        ))}
        <button
          className={'pestana ' + (seccion === 'cuadro' ? 'activa' : '')}
          onClick={() => setSeccion('cuadro')}>Cuadro de honor</button>
        {RONDAS_ELIM.map((r) => (
          <button key={r}
            className={'pestana ' + (seccion === 'R:' + r ? 'activa' : '')}
            onClick={() => setSeccion('R:' + r)}>{NOMBRE_RONDA[r]}</button>
        ))}
      </div>

      {seccion.startsWith('G:') && (
        <div className="tarjeta">
          <h3>Resultados reales · Grupo {seccion.slice(2)}</h3>
          {partidosDeGrupo(seccion.slice(2)).map((p) => {
            const r = real[p.id];
            return (
              <div className="partido" key={p.id}>
                <span className="lado">
                  <Bandera code={p.local} ancho={40} />
                  <span className="nombre">{nombreEquipo(p.local)}</span>
                </span>
                <span className="marcador">{r ? r.l : '–'}</span>
                <span className="guion">–</span>
                <span className="marcador">{r ? r.v : '–'}</span>
                <span className="lado visita">
                  <span className="nombre">{nombreEquipo(p.visitante)}</span>
                  <Bandera code={p.visitante} ancho={40} />
                </span>
              </div>
            );
          })}
          <p className="aviso info" style={{ marginTop: 12 }}>
            Un guion (–) significa que el partido aún no tiene resultado.
          </p>
        </div>
      )}

      {seccion === 'cuadro' && (
        <div className="tarjeta">
          <h3>Cuadro de honor</h3>
          <p className="aviso info">
            Los aciertos del cuadro de honor (campeón, subcampeón, etc.)
            se conocen al terminar el Mundial. El organizador los validará
            entonces y los puntos aparecerán en la clasificación total.
          </p>
        </div>
      )}

      {seccion.startsWith('R:') && (
        <div className="tarjeta">
          <h3>{NOMBRE_RONDA[seccion.slice(2)]}</h3>
          <p className="aviso info">
            {faseElim && faseElim.abierta
              ? 'Los resultados de la fase eliminatoria se mostrarán según se vayan jugando los partidos.'
              : 'La fase eliminatoria aún no está disponible.'}
          </p>
        </div>
      )}
    </>
  );
}

/* ---------- Ranking por día ---------- */
function ResultadosDiarios({ datos, valores }) {
  // Días que tienen partidos programados (no solo los que ya tienen
  // resultado), para poder ver la cuadrícula aunque falten resultados.
  const dias = diasConPartidos();
  const [dia, setDia] = useState(dias[0] || null);

  if (!datos.bloqueada) {
    return (
      <div className="tarjeta">
        <p className="aviso info">
          La cuadrícula se mostrará cuando el organizador cierre la fase.
        </p>
      </div>
    );
  }

  if (dias.length === 0) {
    return (
      <div className="tarjeta">
        <h3>Resultados diarios</h3>
        <p className="aviso info">No hay resultados aún.</p>
      </div>
    );
  }

  const cuad = cuadriculaDia(
    dia, datos.jugadores, datos.predicciones, datos.resultados, valores
  );

  // Color de fuente según el tipo de acierto.
  function colorCelda(tipo) {
    if (tipo === 'exacto') return 'var(--verde)';
    if (tipo === '1x2') return 'var(--azul)';
    return 'inherit'; // negro: fallo, sin pronóstico, o sin resultado aún
  }

  function textoPred(celda) {
    if (!celda.pred || celda.pred.local == null || celda.pred.visitante == null) {
      return '–';
    }
    return `${celda.pred.local}-${celda.pred.visitante}`;
  }

  return (
    <>
      <div className="tarjeta">
        <h3>Resultados diarios</h3>
        <label>Elige un día</label>
        <select value={dia} onChange={(e) => setDia(e.target.value)}>
          {dias.map((d) => (
            <option key={d} value={d}>
              {new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </option>
          ))}
        </select>
      </div>

      <div className="tarjeta">
        {cuad.partidos.length === 0 ? (
          <p className="aviso info">No hay partidos este día.</p>
        ) : (
          <div className="cuadricula-scroll">
            <table className="cuadricula">
              <thead>
                <tr>
                  <th className="col-rank"></th>
                  <th className="col-nombre">Jugador</th>
                  {cuad.partidos.map((p) => (
                    <th key={p.id}>{p.etiqueta}</th>
                  ))}
                  <th className="col-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {/* Fila de resultados reales */}
                <tr className="fila-real">
                  <td className="col-rank"></td>
                  <td className="col-nombre">Resultado final</td>
                  {cuad.partidos.map((p) => {
                    const r = cuad.reales[p.id];
                    return (
                      <td key={p.id}>
                        {r ? `${r.local}-${r.visitante}` : '–'}
                      </td>
                    );
                  })}
                  <td className="col-pts">—</td>
                </tr>
                {/* Filas de jugadores, ordenadas por puntos */}
                {(() => {
                  const hayResultados = cuad.partidos.some((p) => cuad.reales[p.id]);
                  // Puntuación máxima del día (para destacar al líder).
                  const maxPts = cuad.filas.reduce((m, f) => Math.max(m, f.puntos), 0);
                  return cuad.filas.map((fila, idx) => {
                    const ceroPuntos = hayResultados && fila.puntos === 0;
                    const esLider = hayResultados && maxPts > 0 && fila.puntos === maxPts;
                    return (
                      <tr
                        key={fila.jugadorId}
                        className={
                          (ceroPuntos ? 'fila-cero ' : '') + (esLider ? 'fila-lider' : '')
                        }
                      >
                        <td className="col-rank">{idx + 1}</td>
                        <td className="col-nombre">{fila.usuario}</td>
                        {cuad.partidos.map((p) => {
                          const celda = fila.celdas[p.id];
                          return (
                            <td
                              key={p.id}
                              style={{
                                color: ceroPuntos ? 'var(--acento)' : colorCelda(celda.tipo),
                                fontWeight: 600,
                              }}
                            >
                              {textoPred(celda)}
                            </td>
                          );
                        })}
                        <td className="col-pts">{fila.puntos}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
        <p className="aviso info" style={{ marginTop: 12 }}>
          <span style={{ color: 'var(--verde)', fontWeight: 700 }}>Verde</span>:
          resultado exacto. {' '}
          <span style={{ color: 'var(--azul)', fontWeight: 700 }}>Azul</span>:
          acertó el 1X2. Negro: fallo o sin resultado todavía.
        </p>
      </div>
    </>
  );
}

/* ---------- Ranking total acumulado ---------- */
function ClasificacionTotal({ datos, valores }) {
  const [verJugador, setVerJugador] = useState(null);

  if (!datos.bloqueada) {
    return (
      <div className="tarjeta">
        <p className="aviso info">
          La clasificación se mostrará cuando el organizador cierre la fase.
        </p>
      </div>
    );
  }

  const ranking = rankingTotal(
    datos.jugadores, datos.predicciones, datos.resultados, valores,
    {
      desempates: datos.desempates,
      prediccionesElim: datos.prediccionesElim,
      cuadroElim: datos.cuadroElim,
    }
  );

  return (
    <>
      <div className="tarjeta">
        <h3>Clasificación total</h3>
        <RankingTabla ranking={ranking} alVerJugador={setVerJugador} />
        <p className="aviso info" style={{ marginTop: 12 }}>
          Toca un jugador para ver su desglose. Las columnas de Fase final
          se rellenarán cuando empiece la eliminatoria.
        </p>
      </div>

      {verJugador && (
        <DesgloseJugador
          jugador={verJugador}
          predicciones={datos.predicciones}
          resultados={datos.resultados}
          valores={valores}
          alCerrar={() => setVerJugador(null)}
        />
      )}
    </>
  );
}

/* ---------- Tabla de ranking con dos bloques (Grupos / Fase final) ---------- */
function RankingTabla({ ranking, alVerJugador }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tabla-ranking">
        <thead>
          <tr>
            <th rowSpan={2}>#</th>
            <th rowSpan={2} className="izq">Jugador</th>
            <th colSpan={3} className="bloque">Grupos</th>
            <th colSpan={3} className="bloque">Fase final</th>
            <th rowSpan={2}>Total</th>
          </tr>
          <tr>
            <th>1X2</th><th>Exacto</th><th>Posic.</th>
            <th>1X2</th><th>Exacto</th><th>Posic.</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.jugadorId} onClick={() => alVerJugador(r)} className="fila-click">
              <td className="pos">{i + 1}</td>
              <td className="izq" style={{ fontWeight: 600 }}>{r.usuario}</td>
              <td>{r.grupos1x2}</td>
              <td>{r.gruposExacto}</td>
              <td>{r.gruposClasificado}</td>
              <td>{r.final1x2}</td>
              <td>{r.finalExacto}</td>
              <td>{r.finalClasificado}</td>
              <td className="total">{r.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
