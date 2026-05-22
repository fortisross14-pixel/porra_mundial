import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { EQUIPOS, GRUPOS, PARTIDOS, partidosDeGrupo, nombreEquipo } from '../../data/partidos.js';
import TablaGrupo from './TablaGrupo.jsx';
import Bandera from './Bandera.jsx';

/* Pantalla principal de pronóstico.
 *  - Pestañas de grupo (A-L) arriba; se ve un grupo cada vez.
 *  - Al guardar, si faltan partidos, avisa "Faltan partidos por pronosticar".
 */
export default function Pronostico({ sesion, fase }) {
  const [predicciones, setPredicciones] = useState({}); // partidoId -> {golesLocal, golesVisitante}
  const [desempates, setDesempates] = useState({});      // "grupo:X|clave" -> [equipos...]
  const [estado, setEstado] = useState(null);            // { tipo, texto }
  const [cargando, setCargando] = useState(true);

  const letras = Object.keys(GRUPOS);
  const [grupoActivo, setGrupoActivo] = useState(letras[0] || null);
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
        setEstado({ tipo: 'error', texto: 'No se pudo cargar tu pronóstico: ' + e.message });
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
    setEstado(null);
  }

  function fijarOrden(ambito, clave, orden) {
    setDesempates((prev) => ({ ...prev, [`${ambito}|${clave}`]: orden }));
  }

  // ¿Cuántos partidos quedan sin un marcador completo?
  function partidosIncompletos() {
    return PARTIDOS.filter((p) => {
      const v = predicciones[p.id];
      return !v || v.golesLocal == null || v.golesVisitante == null;
    });
  }

  async function guardar() {
    const incompletos = partidosIncompletos();

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

      if (incompletos.length > 0) {
        setEstado({
          tipo: 'falta',
          texto: `Faltan partidos por pronosticar (${incompletos.length} de ${PARTIDOS.length}). Tu progreso se ha guardado.`,
        });
      } else {
        setEstado({ tipo: 'ok', texto: 'Pronóstico completo y guardado correctamente.' });
      }
    } catch (e) {
      setEstado({ tipo: 'error', texto: 'Error al guardar: ' + e.message });
    }
  }

  if (cargando) return <div className="tarjeta">Cargando tu pronóstico…</div>;

  if (sinDatos) {
    return (
      <div className="tarjeta">
        <h2>Aún no hay partidos cargados</h2>
        <p className="aviso info">
          El organizador todavía no ha cargado los grupos y partidos.
        </p>
      </div>
    );
  }

  const limite = fase.fecha_limite ? new Date(fase.fecha_limite) : null;
  const bloqueada = !fase.abierta; // bloqueo manual del organizador
  const partidos = partidosDeGrupo(grupoActivo);

  return (
    <>
      <div className="tarjeta">
        <h2>{fase.nombre}</h2>
        {bloqueada ? (
          <p className="aviso info">
            Esta fase está cerrada. Tu pronóstico ya no se puede modificar.
          </p>
        ) : (
          <p className="aviso info">
            Elige un grupo, mete los marcadores y guarda. La clasificación se
            actualiza sola.
            {limite && ` Fecha orientativa: ${limite.toLocaleDateString('es-ES')}.`}
          </p>
        )}
      </div>

      {/* Pestañas de grupo */}
      <div className="pestanas">
        {letras.map((l) => (
          <button
            key={l}
            className={'pestana ' + (l === grupoActivo ? 'activa' : '')}
            onClick={() => setGrupoActivo(l)}
          >
            Grupo {l}
          </button>
        ))}
      </div>

      {/* Partidos del grupo activo */}
      <div className="tarjeta">
        <h3>Partidos · Grupo {grupoActivo}</h3>
        {partidos.map((p) => {
          const pr = predicciones[p.id] || {};
          const fecha = new Date(p.fecha);
          return (
            <div className="partido" key={p.id}>
              <span className="fecha-partido">
                {fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
              <span className="lado">
                <Bandera code={p.local} ancho={40} />
                <span className="nombre">{nombreEquipo(p.local)}</span>
              </span>
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
              <span className="lado visita">
                <span className="nombre">{nombreEquipo(p.visitante)}</span>
                <Bandera code={p.visitante} ancho={40} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Tabla del grupo activo */}
      <TablaGrupo
        letra={grupoActivo}
        equipos={GRUPOS[grupoActivo]}
        partidos={partidos}
        predicciones={predicciones}
        desempates={desempates}
        alOrdenar={fijarOrden}
      />

      {!bloqueada && (
        <>
          <button className="btn fila" onClick={guardar}>
            Guardar mi pronóstico
          </button>
          {estado && (
            <div className={'aviso ' + estado.tipo}>{estado.texto}</div>
          )}
        </>
      )}
    </>
  );
}
