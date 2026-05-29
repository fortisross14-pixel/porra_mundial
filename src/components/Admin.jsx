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

      {pestana === 'jugadores' && <PanelJugadores datos={datos} recargar={recargar} />}
      {pestana === 'fases' && <PanelFases datos={datos} recargar={recargar} />}
      {pestana === 'resultados' && <PanelResultados datos={datos} recargar={recargar} />}
      {pestana === 'cuadro' && <PanelCuadro datos={datos} />}
      {pestana === 'puntos' && <PanelPuntos datos={datos} recargar={recargar} />}
    </>
  );
}

/* ---------- Jugadores: lista por porra (muestra el CÓDIGO) ---------- */
function PanelJugadores({ datos, recargar }) {
  const total = PARTIDOS.length;
  const [confirmar, setConfirmar] = useState(null); // jugador pendiente de borrar
  const [resetear, setResetear] = useState(null);   // jugador pendiente de reset
  const [estado, setEstado] = useState('');

  async function borrar(jugadorId) {
    setEstado('');
    try {
      await api.adminBorrarJugador(jugadorId);
      setConfirmar(null);
      setEstado('Jugador eliminado.');
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }

  async function confirmarReset() {
    setEstado('');
    try {
      await api.adminResetearPin(resetear.id);
      const nombre = resetear.usuario;
      setResetear(null);
      setEstado(`PIN de ${nombre} reseteado. Dile que entre con su nombre y el PIN 00000; el sistema le pedirá uno nuevo.`);
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }

  return (
    <>
      <div className="tarjeta">
        <p className="aviso info">
          Puedes eliminar la inscripción de un jugador concreto (por
          ejemplo, un registro duplicado o abandonado). Se borra solo
          ese jugador y su pronóstico; la porra y los demás no se tocan.
        </p>
        {estado && (
          <div className={'aviso ' + (estado.startsWith('Error') ? 'error' : 'ok')}>
            {estado}
          </div>
        )}
      </div>

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
                  <tr>
                    <th>Jugador</th><th>PIN</th><th>Alta</th><th>Avance</th>
                    <th>Estado</th><th></th>
                  </tr>
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
                        <td style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                          ••••••
                        </td>
                        <td>{new Date(j.creado).toLocaleDateString('es-ES')}</td>
                        <td>{hechos}/{total}</td>
                        <td style={{ color: completo ? 'var(--verde)' : 'var(--dorado)', fontWeight: 700 }}>
                          {completo ? 'Completo' : 'Incompleto'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn-mini"
                              onClick={() => setResetear(j)}
                            >
                              Resetear PIN
                            </button>
                            <button
                              className="btn-mini"
                              style={{ borderColor: 'var(--acento)', color: 'var(--acento)' }}
                              onClick={() => setConfirmar(j)}
                            >
                              Borrar
                            </button>
                          </div>
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

      {resetear && (
        <div className="tarjeta">
          <div className="zona-peligro">
            <strong>¿Resetear el PIN de {resetear.usuario}?</strong>
            <p style={{ fontSize: 13, margin: '6px 0 10px' }}>
              Su PIN pasará a ser <code>00000</code>. La próxima vez que
              entre con su nombre y <code>00000</code>, el sistema le
              pedirá que elija un PIN nuevo.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={confirmarReset}>
                Sí, resetear PIN
              </button>
              <button className="btn secundario" onClick={() => setResetear(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmar && (
        <div className="tarjeta">
          <div className="zona-peligro">
            <strong>¿Borrar la inscripción de {confirmar.usuario}?</strong>
            <p style={{ fontSize: 13, margin: '6px 0 10px' }}>
              Se eliminará este jugador y todo su pronóstico (marcadores,
              desempates y cuadro de honor). No se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ background: 'var(--acento)' }}
                onClick={() => borrar(confirmar.id)}>
                Sí, borrar
              </button>
              <button className="btn secundario" onClick={() => setConfirmar(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
  async function borrarUno(pid) {
    setEstado('');
    try {
      await api.adminBorrarResultado([pid]);
      setBorrador((prev) => ({ ...prev, [pid]: {} }));
      setEstado(`Resultado de ${pid} borrado.`);
      await recargar();
    } catch (e) {
      setEstado('Error: ' + e.message);
    }
  }
  async function borrarGrupo() {
    setEstado('');
    try {
      const ids = partidosDeGrupo(grupo).map((p) => p.id);
      await api.adminBorrarResultado(ids);
      setBorrador({});
      setEstado(`Resultados del Grupo ${grupo} borrados.`);
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
        <div className="fila-cuenta">
          <h3 style={{ margin: 0 }}>Resultados reales · Grupo {grupo}</h3>
          <button
            className="btn-mini"
            style={{ borderColor: 'var(--acento)', color: 'var(--acento)' }}
            onClick={borrarGrupo}
          >
            Borrar resultados del grupo
          </button>
        </div>
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
                {ya && (
                  <button
                    className="btn-mini"
                    style={{ borderColor: 'var(--acento)', color: 'var(--acento)' }}
                    onClick={() => borrarUno(p.id)}
                  >
                    Borrar
                  </button>
                )}
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
