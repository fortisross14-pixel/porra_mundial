import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { EQUIPOS, GRUPOS, partidosDeGrupo } from '../../data/partidos.js';
import TablaGrupo from './TablaGrupo.jsx';

/* Pantalla principal de pronóstico de la fase de grupos.
 * El jugador mete marcadores; las tablas se recalculan en vivo;
 * los empates se ordenan a mano; al guardar se manda todo al backend.
 */
export default function Pronostico({ sesion, fase }) {
  const [predicciones, setPredicciones] = useState({}); // partidoId -> {golesLocal, golesVisitante}
  const [desempates, setDesempates] = useState({});      // "grupo:X|clave" -> [equipos...]
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);

  const letras = Object.keys(GRUPOS);
  const sinDatos = letras.length === 0;

  useEffect(() => {
    (async () => {
      try {
        const r = await api.cargarPronostico(sesion.codigo, sesion.jugador.id, fase.id);
        const pred = {};
        for (const p of r.predicciones) {
          pred[p.partido_id] = {
            golesLocal: p.goles_local,
            golesVisitante: p.goles_visitante,
          };
        }
        const des = {};
        for (const d of r.desempates) {
          des[`${d.ambito}|${d.clave_empate}`] = d.orden;
        }
        setPredicciones(pred);
        setDesempates(des);
      } catch (e) {
        setEstado('No se pudo cargar tu pronóstico: ' + e.message);
      } finally {
        setCargando(false);
      }
    })();
  }, [sesion, fase]);

  function fijarGol(partidoId, lado, valor) {
    const n = valor === '' ? null : Math.max(0, Math.min(20, parseInt(valor, 10)));
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [lado]: Number.isNaN(n) ? null : n },
    }));
  }

  function fijarOrden(ambito, clave, orden) {
    setDesempates((prev) => ({ ...prev, [`${ambito}|${clave}`]: orden }));
  }

  async function guardar() {
    setEstado('Guardando…');
    try {
      const predList = Object.entries(predicciones)
        .filter(([, v]) => v && v.golesLocal != null && v.golesVisitante != null)
        .map(([partidoId, v]) => ({
          partidoId,
          golesLocal: v.golesLocal,
          golesVisitante: v.golesVisitante,
        }));
      const desList = Object.entries(desempates).map(([k, orden]) => {
        const [ambito, claveEmpate] = k.split('|');
        return { ambito, claveEmpate, orden };
      });
      await api.guardarPronostico({
        codigo: sesion.codigo,
        jugadorId: sesion.jugador.id,
        faseId: fase.id,
        predicciones: predList,
        desempates: desList,
      });
      setEstado('Pronóstico guardado correctamente.');
    } catch (e) {
      setEstado('Error al guardar: ' + e.message);
    }
  }

  if (cargando) return <div className="tarjeta">Cargando tu pronóstico…</div>;

  if (sinDatos) {
    return (
      <div className="tarjeta">
        <h2>Aún no hay partidos cargados</h2>
        <p className="aviso info">
          El organizador todavía no ha cargado los grupos y partidos del
          Mundial 2026 (archivo <code>data/partidos.js</code>). Vuelve pronto.
        </p>
      </div>
    );
  }

  const limite = fase.fecha_limite ? new Date(fase.fecha_limite) : null;
  const bloqueada = !fase.abierta || (limite && limite < new Date());

  return (
    <>
      <div className="tarjeta">
        <h2>{fase.nombre}</h2>
        {bloqueada ? (
          <p className="aviso info">
            Esta fase está cerrada. Tu pronóstico ya no se puede editar.
          </p>
        ) : (
          <p className="aviso info">
            Mete tu marcador para cada partido. Las tablas se actualizan solas.
            {limite && ` Fecha límite: ${limite.toLocaleString('es-ES')}.`}
          </p>
        )}
      </div>

      {letras.map((letra) => {
        const partidos = partidosDeGrupo(letra);
        return (
          <div key={letra}>
            <div className="tarjeta">
              <h2>Grupo {letra} · Partidos</h2>
              {partidos.map((p) => {
                const pr = predicciones[p.id] || {};
                return (
                  <div className="partido" key={p.id}>
                    <span className="equipo">{EQUIPOS[p.local] || p.local}</span>
                    <input
                      className="marcador"
                      inputMode="numeric"
                      disabled={bloqueada}
                      value={pr.golesLocal ?? ''}
                      onChange={(e) => fijarGol(p.id, 'golesLocal', e.target.value)}
                    />
                    <span className="guion">–</span>
                    <input
                      className="marcador"
                      inputMode="numeric"
                      disabled={bloqueada}
                      value={pr.golesVisitante ?? ''}
                      onChange={(e) => fijarGol(p.id, 'golesVisitante', e.target.value)}
                    />
                    <span className="equipo visita">
                      {EQUIPOS[p.visitante] || p.visitante}
                    </span>
                  </div>
                );
              })}
            </div>

            <TablaGrupo
              letra={letra}
              equipos={GRUPOS[letra]}
              partidos={partidos}
              predicciones={predicciones}
              desempates={desempates}
              alOrdenar={fijarOrden}
            />
          </div>
        );
      })}

      {!bloqueada && (
        <>
          <button className="btn fila" onClick={guardar}>
            Guardar mi pronóstico
          </button>
          {estado && (
            <div
              className={
                'aviso ' + (estado.startsWith('Error') ? 'error' : 'ok')
              }
            >
              {estado}
            </div>
          )}
        </>
      )}
    </>
  );
}
