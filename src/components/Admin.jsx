import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { PARTIDOS, partidosDeGrupo, nombreEquipo, GRUPOS } from '../../data/partidos.js';
import { valoresDesdeFilas } from '../../puntuacion.js';
import Bandera from './Bandera.jsx';
import TablaPuntos from './TablaPuntos.jsx';
import PanelCuadro from './PanelCuadro.jsx';

/* Pantalla de administración: login con código (una vez) + paneles.
 * Tras el login, la sesión va en una cookie httpOnly. */
export default function Admin() {
  const [sesion, setSesion] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.adminEstado()
      .then((r) => setSesion(Boolean(r.sesion)))
      .catch(() => setSesion(false));
  }, []);

  async function entrar() {
    setError(''); setCargando(true);
    try {
      await api.adminEntrar(codigo);
      setSesion(true);
      setCodigo('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function salir() {
    await api.adminSalir().catch(() => {});
    setSesion(false);
  }

  if (sesion === null) return <div className="tarjeta">Comprobando sesión…</div>;

  if (!sesion) {
    return (
      <div className="tarjeta">
        <h2>Administración</h2>
        <p className="aviso info">
          Zona reservada al organizador. Introduce el código de administrador.
        </p>
        <label>Código de administrador</label>
        <input
          type="password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
          placeholder="••••••••"
        />
        {error && <div className="aviso error">{error}</div>}
        <button className="btn fila" onClick={entrar} disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    );
  }

  return <PanelAdmin alSalir={salir} />;
}

function PanelAdmin({ alSalir }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('jugadores');

  async function recargar() {
    try {
      setDatos(await api.adminDatos());
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { recargar(); }, []);

  if (error) {
    return (
      <div className="tarjeta">
        <div className="aviso error">{error}</div>
        <button className="btn fila secundario" onClick={alSalir}>Salir</button>
      </div>
    );
  }
  if (!datos) return <div className="tarjeta">Cargando panel…</div>;

  const tabs = [
    ['jugadores', 'Jugadores'],
    ['fases', 'Fases'],
    ['resultados', 'Resultados'],
    ['cuadro', 'Cuadro'],
    ['puntos', 'Puntos'],
    ['porras', 'Porras'],
  ];

  return (
    <>
      <div className="tarjeta">
        <div className="fila-cuenta">
          <h2 style={{ margin: 0 }}>Administración</h2>
          <button className="btn secundario" onClick={alSalir}>Cerrar sesión</button>
        </div>
      </div>

      <div className="pestanas">
        {tabs.map(([id, txt]) => (
          <button
            key={id}
            className={'pestana ' + (pestana === id ? 'activa' : '')}
            onClick={() => setPestana(id)}
          >{txt}</button>
        ))}
      </div>

      {pestana === 'jugadores' && <PanelJugadores datos={datos} />}
      {pestana === 'fases' && <PanelFases datos={datos} recargar={recargar} />}
      {pestana === 'resultados' && <PanelResultados datos={datos} recargar={recargar} />}
      {pestana === 'cuadro' && <PanelCuadro datos={datos} />}
      {pestana === 'puntos' && <PanelPuntos datos={datos} recargar={recargar} />}
      {pestana === 'porras' && <PanelPorras datos={datos} recargar={recargar} />}
    </>
  );
}

/* ---------- Jugadores: lista por porra (muestra el CÓDIGO) ---------- */
function PanelJugadores({ datos }) {
  const total = PARTIDOS.length;
  return (
    <>
      {datos.porras.map((porra) => {
        const jugadores = datos.jugadores.filter((j) => j.porra_id === porra.id);
        const fase = datos.fases.find((f) => f.porra_id === porra.id);
        return (
          <div className="tarjeta" key={porra.id}>
            <h3>{porra.codigo} · {jugadores.length} jugador(es)</h3>
            {jugadores.length === 0 && (
              <p className="aviso info">Todavía no se ha apuntado nadie.</p>
            )}
            {jugadores.length > 0 && (
              <table className="tabla-grupo">
                <thead>
                  <tr><th>Jugador</th><th>Alta</th><th>Avance</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {jugadores.map((j) => {
                    const c = datos.conteos.find(
                      (x) => x.jugador_id === j.id && x.fase_id === fase?.id
                    );
                    const hechos = c?.hechos || 0;
                    const completo = hechos >= total;
                    return (
                      <tr key={j.id}>
                        <td style={{ fontWeight: 600 }}>{j.usuario}</td>
                        <td>{new Date(j.creado).toLocaleDateString('es-ES')}</td>
                        <td>{hechos}/{total}</td>
                        <td style={{ color: completo ? 'var(--verde)' : 'var(--dorado)', fontWeight: 700 }}>
                          {completo ? 'Completo' : 'Incompleto'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ---------- Fases: abrir / cerrar (muestra el CÓDIGO) ---------- */
function PanelFases({ datos, recargar }) {
  const [estado, setEstado] = useState('');
  async function cambiar(faseId, abierta) {
    setEstado('');
    try {
      await api.adminCambiarFase(faseId, abierta);
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }
  return (
    <div className="tarjeta">
      <h3>Bloqueo de fases</h3>
      <p className="aviso info">
        Una fase ABIERTA permite editar el pronóstico. Al CERRARLA se
        bloquea y se muestra la clasificación.
      </p>
      <table className="tabla-grupo">
        <thead>
          <tr><th>Porra</th><th>Fase</th><th>Estado</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {datos.fases.map((f) => {
            const porra = datos.porras.find((p) => p.id === f.porra_id);
            return (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{porra?.codigo}</td>
                <td>{f.nombre}</td>
                <td style={{ color: f.abierta ? 'var(--verde)' : 'var(--acento)', fontWeight: 700 }}>
                  {f.abierta ? 'Abierta' : 'Cerrada'}
                </td>
                <td>
                  <button className="btn-mini" onClick={() => cambiar(f.id, !f.abierta)}>
                    {f.abierta ? 'Cerrar' : 'Abrir'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {estado && <div className="aviso error">{estado}</div>}
    </div>
  );
}

/* ---------- Resultados reales: cuadro de los 72 partidos ---------- */
function PanelResultados({ datos, recargar }) {
  const letras = Object.keys(GRUPOS);
  const [grupo, setGrupo] = useState(letras[0]);
  const [borrador, setBorrador] = useState({});
  const [estado, setEstado] = useState('');

  const guardados = {};
  for (const r of datos.resultados) {
    guardados[r.partido_id] = { l: r.goles_local, v: r.goles_visitante };
  }
  function valor(pid, lado) {
    if (borrador[pid] && borrador[pid][lado] != null) return borrador[pid][lado];
    if (guardados[pid]) return guardados[pid][lado];
    return '';
  }
  function fijar(pid, lado, v) {
    const n = v === '' ? null : Math.max(0, Math.min(20, parseInt(v, 10)));
    setBorrador((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], [lado]: Number.isNaN(n) ? null : n },
    }));
  }
  async function guardar(pid) {
    setEstado('');
    const l = valor(pid, 'l'); const v = valor(pid, 'v');
    if (l === '' || v === '' || l == null || v == null) {
      setEstado('Pon los dos goles antes de guardar.');
      return;
    }
    try {
      await api.adminGuardarResultado(pid, l, v);
      setEstado(`Resultado de ${pid} guardado.`);
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }
  return (
    <>
      <div className="pestanas">
        {letras.map((l) => (
          <button key={l} className={'pestana ' + (l === grupo ? 'activa' : '')}
            onClick={() => setGrupo(l)}>Grupo {l}</button>
        ))}
      </div>
      <div className="tarjeta">
        <h3>Resultados reales · Grupo {grupo}</h3>
        <p className="aviso info">
          Introduce el marcador real de cada partido y pulsa Guardar.
        </p>
        {partidosDeGrupo(grupo).map((p) => {
          const ya = guardados[p.id];
          return (
            <div className="partido" key={p.id}>
              <span className="lado">
                <Bandera code={p.local} ancho={40} />
                <span className="nombre">{nombreEquipo(p.local)}</span>
              </span>
              <input className="marcador" inputMode="numeric"
                value={valor(p.id, 'l')} onChange={(e) => fijar(p.id, 'l', e.target.value)} />
              <span className="guion">–</span>
              <input className="marcador" inputMode="numeric"
                value={valor(p.id, 'v')} onChange={(e) => fijar(p.id, 'v', e.target.value)} />
              <span className="lado visita">
                <span className="nombre">{nombreEquipo(p.visitante)}</span>
                <Bandera code={p.visitante} ancho={40} />
              </span>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center', marginTop: 4 }}>
                {ya && <span style={{ fontSize: 12, color: 'var(--verde)', fontWeight: 700 }}>Guardado</span>}
                <button className="btn-mini" onClick={() => guardar(p.id)}>Guardar</button>
              </div>
            </div>
          );
        })}
        {estado && (
          <div className={'aviso ' + (estado.startsWith('Error') || estado.startsWith('Pon') ? 'error' : 'ok')}>
            {estado}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Puntos: editor de los valores de puntuación ---------- */
function PanelPuntos({ datos, recargar }) {
  const [valores, setValores] = useState(valoresDesdeFilas(datos.valores));
  const [cuadro, setCuadro] = useState(datos.cuadroHonor ?? 10);
  const [estado, setEstado] = useState('');

  function cambiar(ronda, concepto, v) {
    const n = Math.max(0, parseInt(v, 10) || 0);
    setValores((prev) => ({
      ...prev,
      [ronda]: { ...prev[ronda], [concepto]: n },
    }));
  }

  async function guardar() {
    setEstado('Guardando…');
    try {
      const filas = [];
      for (const ronda of Object.keys(valores)) {
        for (const concepto of Object.keys(valores[ronda])) {
          filas.push({ ronda, concepto, puntos: valores[ronda][concepto] });
        }
      }
      await api.adminGuardarPuntos(filas, cuadro);
      setEstado('Valores guardados.');
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }

  return (
    <div className="tarjeta">
      <h3>Valores de puntuación</h3>
      <p className="aviso info">
        Cambia cuántos puntos vale cada acierto. Afecta a toda la porra.
      </p>
      <TablaPuntos
        valores={valores}
        editable
        alCambiar={cambiar}
        cuadroHonor={cuadro}
        alCambiarCuadro={(v) => setCuadro(Math.max(0, parseInt(v, 10) || 0))}
      />
      <button className="btn fila" onClick={guardar}>Guardar valores</button>
      {estado && (
        <div className={'aviso ' + (estado.startsWith('Error') ? 'error' : 'ok')}>
          {estado}
        </div>
      )}
    </div>
  );
}

/* ---------- Porras: borrar una porra duplicada ---------- */
function PanelPorras({ datos, recargar }) {
  const [confirmar, setConfirmar] = useState(null); // porraId pendiente de confirmar
  const [estado, setEstado] = useState('');

  async function borrar(porraId) {
    setEstado('');
    try {
      await api.adminBorrarPorra(porraId);
      setConfirmar(null);
      setEstado('Porra eliminada.');
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }

  return (
    <div className="tarjeta">
      <h3>Porras</h3>
      <p className="aviso info">
        Borra una porra solo si es un duplicado. Se elimina la porra y
        TODOS sus jugadores y pronósticos. No se puede deshacer.
      </p>
      <table className="tabla-grupo">
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Jugadores</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {datos.porras.map((p) => {
            const n = datos.jugadores.filter((j) => j.porra_id === p.id).length;
            return (
              <tr key={p.id}>
                <td style={{ fontWeight: 700 }}>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>{n}</td>
                <td>
                  <button
                    className="btn-mini"
                    style={{ borderColor: 'var(--acento)', color: 'var(--acento)' }}
                    onClick={() => setConfirmar(p.id)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {confirmar != null && (
        <div className="zona-peligro">
          {(() => {
            const p = datos.porras.find((x) => x.id === confirmar);
            const n = datos.jugadores.filter((j) => j.porra_id === confirmar).length;
            return (
              <>
                <strong>¿Borrar la porra {p?.codigo}?</strong>
                <p style={{ fontSize: 13, margin: '6px 0 10px' }}>
                  Se eliminarán {n} jugador(es) y todos sus pronósticos.
                  Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ background: 'var(--acento)' }}
                    onClick={() => borrar(confirmar)}>
                    Sí, borrar definitivamente
                  </button>
                  <button className="btn secundario" onClick={() => setConfirmar(null)}>
                    Cancelar
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
      {estado && (
        <div className={'aviso ' + (estado.startsWith('Error') ? 'error' : 'ok')}>
          {estado}
        </div>
      )}
    </div>
  );
}
