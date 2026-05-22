import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { ELIMINATORIA, NOMBRE_RONDA } from '../../data/eliminatoria.js';
import { EQUIPOS, nombreEquipo } from '../../data/partidos.js';
import { proponerCuadro, todosLosGruposCompletos } from '../lib/bracket.js';

/* Panel de admin para resolver el cuadro eliminatorio.
 *  - Botón "Proponer" : autocompleta los 16 cruces de dieciseisavos
 *    a partir de los resultados de grupos.
 *  - Cada hueco es un desplegable editable (para terceros empatados
 *    y cualquier ajuste manual).
 *  - Las rondas posteriores dependen de ganadores: se rellenan cuando
 *    avance el torneo (de momento se dejan a mano).
 */
export default function PanelCuadro({ datos }) {
  const [huecos, setHuecos] = useState({}); // partidoId -> { local, visitante }
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.cargarCuadro();
        const h = {};
        for (const x of r.huecos) {
          if (!h[x.partido_id]) h[x.partido_id] = { local: '', visitante: '' };
          h[x.partido_id][x.lado] = x.equipo;
        }
        setHuecos(h);
      } catch (e) {
        setEstado('Error al cargar: ' + e.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Resultados reales en el formato que espera bracket.js
  const reales = {};
  for (const r of datos.resultados) {
    reales[r.partido_id] = { local: r.goles_local, visitante: r.goles_visitante };
  }
  const gruposListos = todosLosGruposCompletos(reales);

  function proponer() {
    setEstado('');
    const propuesta = proponerCuadro(reales);
    setHuecos((prev) => ({ ...prev, ...propuesta }));
    setEstado('Propuesta generada. Revisa y ajusta antes de guardar.');
  }

  function fijar(partidoId, lado, equipo) {
    setHuecos((prev) => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [lado]: equipo },
    }));
  }

  async function guardar() {
    setEstado('Guardando…');
    try {
      const lista = [];
      for (const pid of Object.keys(huecos)) {
        lista.push({ partidoId: pid, lado: 'local', equipo: huecos[pid].local || '' });
        lista.push({ partidoId: pid, lado: 'visitante', equipo: huecos[pid].visitante || '' });
      }
      await api.guardarCuadro(lista);
      setEstado('Cuadro guardado.');
    } catch (e) {
      setEstado('Error al guardar: ' + e.message);
    }
  }

  if (cargando) return <div className="tarjeta">Cargando cuadro…</div>;

  // Lista de equipos para los desplegables, ordenada por nombre.
  const equipos = Object.keys(EQUIPOS).sort((a, b) =>
    nombreEquipo(a).localeCompare(nombreEquipo(b), 'es')
  );

  // Agrupa los cruces por ronda.
  const porRonda = {};
  for (const c of ELIMINATORIA) {
    if (!porRonda[c.ronda]) porRonda[c.ronda] = [];
    porRonda[c.ronda].push(c);
  }

  function selector(partidoId, lado, procedencia) {
    const valor = huecos[partidoId]?.[lado] || '';
    return (
      <select
        value={valor}
        onChange={(e) => fijar(partidoId, lado, e.target.value)}
        style={{ minWidth: 140 }}
      >
        <option value="">— {procedencia} —</option>
        {equipos.map((c) => (
          <option key={c} value={c}>{nombreEquipo(c)}</option>
        ))}
      </select>
    );
  }

  return (
    <>
      <div className="tarjeta">
        <h3>Cuadro eliminatorio</h3>
        <p className="aviso info">
          Tras introducir todos los resultados de grupos, pulsa
          "Proponer dieciseisavos" para autocompletar. Puedes editar
          cualquier equipo (útil cuando hay terceros empatados). Las
          rondas siguientes se rellenan a mano según avance el torneo.
        </p>
        {!gruposListos && (
          <div className="aviso falta">
            Aún faltan resultados de la fase de grupos. Puedes proponer
            igualmente, pero el cuadro saldrá incompleto.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={proponer}>
            Proponer dieciseisavos
          </button>
          <button className="btn secundario" onClick={guardar}>
            Guardar cuadro
          </button>
        </div>
        {estado && (
          <div className={'aviso ' + (estado.startsWith('Error') ? 'error' : 'ok')}>
            {estado}
          </div>
        )}
      </div>

      {Object.keys(porRonda).map((ronda) => (
        <div className="tarjeta" key={ronda}>
          <h3>{NOMBRE_RONDA[ronda]}</h3>
          {porRonda[ronda].map((c) => (
            <div className="cruce" key={c.id}>
              <span className="cruce-id">{c.id}</span>
              {selector(c.id, 'local', c.local)}
              <span className="cruce-vs">vs</span>
              {selector(c.id, 'visitante', c.visitante)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
