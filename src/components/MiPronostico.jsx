import { useState } from 'react';
import { GRUPOS } from '../../data/partidos.js';
import { RONDAS_ELIM } from '../lib/eliminatoria.js';
import { NOMBRE_RONDA } from '../../data/eliminatoria.js';
import SubCinta from './SubCinta.jsx';
import Pronostico from './Pronostico.jsx';
import PronosticoElim from './PronosticoElim.jsx';
import CuadroHonor from './CuadroHonor.jsx';

/* "Mi pronóstico" con navegación de tres niveles:
 *   Nivel 1 (cinta azul oscuro)  : Mi pronóstico / Resultados  -> en App
 *   Nivel 2 (cinta azul claro)   : Fase de Grupos / Cuadro de honor / Fase Eliminatoria
 *   Nivel 3 (botones de pestaña) : Grupo A..L  ó  Dieciseisavos..Final
 */
export default function MiPronostico({ sesion, faseGrupos, faseElim }) {
  const grupos = Object.keys(GRUPOS);
  const elimAbierta = Boolean(faseElim && faseElim.abierta);

  // Nivel 2: agrupación seleccionada.
  const [grupo2, setGrupo2] = useState('grupos');
  // Nivel 3: pestaña dentro de la agrupación.
  const [grupoSel, setGrupoSel] = useState(grupos[0]);
  const [rondaSel, setRondaSel] = useState(RONDAS_ELIM[0]);

  const sub2 = [
    { id: 'grupos', texto: 'Fase de Grupos' },
    { id: 'cuadro', texto: 'Cuadro de honor' },
    { id: 'elim', texto: 'Fase Eliminatoria' },
  ];

  return (
    <>
      <SubCinta items={sub2} activo={grupo2} alElegir={setGrupo2} />

      {/* ----- Fase de Grupos ----- */}
      {grupo2 === 'grupos' && (
        <>
          <div className="pestanas">
            {grupos.map((g) => (
              <button
                key={g}
                className={'pestana ' + (g === grupoSel ? 'activa' : '')}
                onClick={() => setGrupoSel(g)}
              >
                Grupo {g}
              </button>
            ))}
          </div>
          {faseGrupos && (
            <Pronostico sesion={sesion} fase={faseGrupos} grupoExterno={grupoSel} />
          )}
        </>
      )}

      {/* ----- Cuadro de honor ----- */}
      {grupo2 === 'cuadro' && faseGrupos && (
        <CuadroHonor sesion={sesion} fase={faseGrupos} />
      )}

      {/* ----- Fase Eliminatoria ----- */}
      {grupo2 === 'elim' && (
        !elimAbierta ? (
          <div className="tarjeta">
            <h3>Fase Eliminatoria</h3>
            <p className="aviso info">
              La fase eliminatoria aún no está disponible. Se abrirá
              cuando termine la fase de grupos.
            </p>
          </div>
        ) : (
          <>
            <div className="pestanas">
              {RONDAS_ELIM.map((r) => (
                <button
                  key={r}
                  className={'pestana ' + (r === rondaSel ? 'activa' : '')}
                  onClick={() => setRondaSel(r)}
                >
                  {NOMBRE_RONDA[r]}
                </button>
              ))}
            </div>
            {faseElim && (
              <PronosticoElim sesion={sesion} fase={faseElim} rondaExterna={rondaSel} />
            )}
          </>
        )
      )}
    </>
  );
}
