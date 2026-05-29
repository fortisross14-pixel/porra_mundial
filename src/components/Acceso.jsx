import { useState } from 'react';
import { api } from '../lib/api.js';

/* Pantalla de entrada en 2 pasos:
 *  1. Código de la porra.
 *  2. Usuario + PIN: "Nueva porra" (registrarse) o "Modificar porra" (entrar).
 */
export default function Acceso({ alEntrar }) {
  const [paso, setPaso] = useState(1);
  const [codigo, setCodigo] = useState('');
  const [porra, setPorra] = useState(null);
  const [fases, setFases] = useState([]);
  const [modo, setModo] = useState('entrar'); // 'entrar' = modificar, 'registrar' = nueva
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Paso extra: el jugador entró con el PIN temporal 00000 y debe
  // elegir uno nuevo. Guardamos su jugador mientras tanto.
  const [pinTemporal, setPinTemporal] = useState(null); // jugador pendiente
  const [pinNuevo, setPinNuevo] = useState('');

  async function validarCodigo() {
    setError(''); setCargando(true);
    try {
      const r = await api.acceso(codigo.trim());
      setPorra(r.porra);
      setFases(r.fases);
      setPaso(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function identificarse() {
    setError(''); setCargando(true);
    try {
      const r =
        modo === 'registrar'
          ? await api.registrar(codigo.trim(), usuario, pin)
          : await api.entrar(codigo.trim(), usuario, pin);
      // Si el PIN era el temporal 00000, pasa al paso de elegir uno nuevo.
      if (r.debeCambiarPin) {
        setPinTemporal(r.jugador);
        setPaso(3);
      } else {
        alEntrar({ codigo: codigo.trim(), porra, fases, jugador: r.jugador });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function fijarPinNuevo() {
    setError(''); setCargando(true);
    try {
      // Cambia el PIN temporal (00000) por el nuevo que elige el jugador.
      await api.cambiarPin(codigo.trim(), pinTemporal.id, '00000', pinNuevo);
      alEntrar({ codigo: codigo.trim(), porra, fases, jugador: pinTemporal });
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="tarjeta">
      {paso === 1 && (
        <>
          <h2>Entra a tu porra</h2>
          <p className="aviso info">
            Introduce el código que te ha pasado el organizador. Cada grupo
            tiene el suyo.
          </p>
          <label>Código de la porra</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="EJ: FAMILIA2026"
            onKeyDown={(e) => e.key === 'Enter' && validarCodigo()}
          />
          {error && <div className="aviso error">{error}</div>}
          <button className="btn fila" onClick={validarCodigo} disabled={cargando}>
            {cargando ? 'Comprobando…' : 'Continuar'}
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <h2>Porra: {porra.nombre}</h2>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <button
              className={'btn ' + (modo === 'entrar' ? '' : 'secundario')}
              onClick={() => setModo('entrar')}
            >
              Modificar porra
            </button>
            <button
              className={'btn ' + (modo === 'registrar' ? '' : 'secundario')}
              onClick={() => setModo('registrar')}
            >
              Nueva porra
            </button>
          </div>

          <label>Tu nombre</label>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Como te conoce la gente"
          />

          <label>Tu PIN {modo === 'registrar' && '(elige uno, 5-8 letras o números)'}</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))}
            placeholder="PIN"
            onKeyDown={(e) => e.key === 'Enter' && identificarse()}
          />
          <p className="aviso info">
            {modo === 'registrar'
              ? 'Apunta tu PIN: lo necesitarás para modificar tu porra más adelante.'
              : 'Usa el mismo nombre y PIN con los que creaste tu porra.'}
          </p>

          {error && <div className="aviso error">{error}</div>}
          <button className="btn fila" onClick={identificarse} disabled={cargando}>
            {cargando
              ? 'Un momento…'
              : modo === 'registrar'
              ? 'Crear y entrar'
              : 'Entrar'}
          </button>
          <button
            className="btn secundario fila"
            style={{ marginTop: 8 }}
            onClick={() => { setPaso(1); setError(''); }}
          >
            ← Cambiar de porra
          </button>
        </>
      )}

      {paso === 3 && (
        <>
          <h2>Elige tu nuevo PIN</h2>
          <p className="aviso info">
            Hola {pinTemporal?.usuario}. Tu PIN actual (00000) es
            temporal porque lo reseteó el organizador. Elige uno nuevo
            para continuar.
          </p>
          <label>Nuevo PIN (5-8 letras o números)</label>
          <input
            value={pinNuevo}
            onChange={(e) => setPinNuevo(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))}
            placeholder="Nuevo PIN"
            onKeyDown={(e) => e.key === 'Enter' && fijarPinNuevo()}
          />
          {error && <div className="aviso error">{error}</div>}
          <button className="btn fila" onClick={fijarPinNuevo} disabled={cargando}>
            {cargando ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </>
      )}
    </div>
  );
}
