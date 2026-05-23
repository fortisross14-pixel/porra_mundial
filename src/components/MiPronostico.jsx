import { useState } from 'react';
import { GRUPOS } from '../../data/partidos.js';
import { RONDAS_ELIM } from '../lib/eliminatoria.js';
import { NOMBRE_RONDA } from '../../data/eliminatoria.js';
import Pronostico from './Pronostico.jsx';
import PronosticoElim from './PronosticoElim.jsx';
import CuadroHonor from './CuadroHonor.jsx';

/* "Mi pronóstico": una sola fila de pestañas con TODAS las secciones.
 *   Grupo A … Grupo L  |  Cuadro de honor  |  Dieciseisavos … Final
 *
 * Las pestañas de la eliminatoria salen sombreadas (deshabilitadas)
 * hasta que el organizador abre la fase eliminatoria. Al tocar una
 * sombreada, se muestra un aviso breve.
 */
export default function MiPronostico({ sesion, faseGrupos, faseElim }) {
  const grupos = Object.keys(GRUPOS);
  // Rondas que se muestran como pestaña (la final incluye 3.er puesto).
  const rondas = RONDAS_ELIM;

  const [seccion, setSeccion] = useState('G:' + grupos[0]);

  const elimAbierta = Boolean(faseElim && faseElim.abierta);

  // ¿La pestaña seleccionada es una ronda eliminatoria bloqueada?
  const esRonda = seccion.startsWith('R:');
  const rondaSel = esRonda ? seccion.slice(2) : null;

  function Pestana({ id, texto, deshabilitada }) {
    return (
      <button
        className={
          'pestana ' +
          (seccion === id ? 'activa ' : '') +
          (deshabilitada ? 'sombreada' : '')
        }
        onClick={() => setSeccion(id)}
      >
        {texto}
      </button>
    );
  }

  return (
    <>
      <div className="pestanas">
        {grupos.map((g) => (
          <Pestana key={'G' + g} id={'G:' + g} texto={'Grupo ' + g} />
        ))}
        <Pestana id="cuadro" texto="Cuadro de honor" />
        {rondas.map((r) => (
          <Pestana
            key={'R' + r}
            id={'R:' + r}
            texto={NOMBRE_RONDA[r]}
            deshabilitada={!elimAbierta}
          />
        ))}
      </div>

      {/* Grupo seleccionado */}
      {seccion.startsWith('G:') && faseGrupos && (
        <Pronostico
          sesion={sesion}
          fase={faseGrupos}
          grupoExterno={seccion.slice(2)}
        />
      )}

      {/* Cuadro de honor */}
      {seccion === 'cuadro' && faseGrupos && (
        <CuadroHonor sesion={sesion} fase={faseGrupos} />
      )}

      {/* Ronda eliminatoria */}
      {esRonda && (
        elimAbierta && faseElim ? (
          <PronosticoElim
            sesion={sesion}
            fase={faseElim}
            rondaExterna={rondaSel}
          />
        ) : (
          <div className="tarjeta">
            <h3>{NOMBRE_RONDA[rondaSel]}</h3>
            <p className="aviso info">
              La fase eliminatoria aún no está disponible. Se abrirá
              cuando termine la fase de grupos.
            </p>
          </div>
        )
      )}
    </>
  );
}
