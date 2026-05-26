import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { GRUPOS, partidosDeGrupo } from '../../data/partidos.js';
import { RONDAS_ELIM } from '../lib/eliminatoria.js';
import { NOMBRE_RONDA } from '../../data/eliminatoria.js';
import SubCinta from './SubCinta.jsx';
import Pronostico from './Pronostico.jsx';
import PronosticoElim from './PronosticoElim.jsx';
import CuadroHonor from './CuadroHonor.jsx';

/* "Mi pronóstico" con navegación de tres niveles:
 *   Nivel 1 (cinta azul oscuro)  : Mi pronóstico / Resultados
 *   Nivel 2 (cinta azul claro)   : Fase de Grupos / Fase Eliminatoria
 *   Nivel 3 (botones)            : Grupo A..L + Cuadro de honor  ó  rondas
 *
 * Los botones de grupo y el de Cuadro de honor se ponen VERDES cuando
 * el jugador tiene esa parte completa y guardada.
 */
const CAMPOS_CUADRO = ['campeon', 'subcampeon', 'tercero', 'cuarto', 'goleador', 'mejor_jugador'];

export default function MiPronostico({ sesion, faseGrupos, faseElim }) {
  const grupos = Object.keys(GRUPOS);
  const elimAbierta = Boolean(faseElim && faseElim.abierta);

  const [grupo2, setGrupo2] = useState('grupos');
  const [grupoSel, setGrupoSel] = useState(grupos[0]); // puede ser 'CH' = cuadro de honor
  const [rondaSel, setRondaSel] = useState(RONDAS_ELIM[0]);

  // Estado de completitud: set de grupos completos + cuadro completo.
  const [completos, setCompletos] = useState(new Set());
  const [cuadroCompleto, setCuadroCompleto] = useState(false);

  // Recalcula qué partes están completas leyendo lo guardado.
  const refrescarCompletitud = useCallback(async () => {
    if (!faseGrupos) return;
    try {
      const r = await api.cargarPronostico(sesion.codigo, sesion.jugador.id, faseGrupos.id);
      const hechas = new Set();
      for (const p of r.predicciones) {
        if (p.goles_local != null && p.goles_visitante != null) hechas.add(p.partido_id);
      }
      const nuevos = new Set();
      for (const g of grupos) {
        if (partidosDeGrupo(g).every((p) => hechas.has(p.id))) nuevos.add(g);
      }
      setCompletos(nuevos);

      const ch = await api.cargarCuadroHonor(sesion.codigo, sesion.jugador.id);
      const todos = CAMPOS_CUADRO.every(
        (c) => ch.respuestas[c] && String(ch.respuestas[c]).trim() !== ''
      );
      setCuadroCompleto(todos);
    } catch {
      /* si falla, los botones simplemente no se pintan de verde */
    }
  }, [sesion, faseGrupos]);

  useEffect(() => { refrescarCompletitud(); }, [refrescarCompletitud]);

  const sub2 = [
    { id: 'grupos', texto: 'Fase de Grupos' },
    { id: 'elim', texto: 'Fase Eliminatoria' },
  ];

  function claseBoton(activo, completo) {
    return 'pestana ' + (activo ? 'activa ' : '') + (completo ? 'completa' : '');
  }

  return (
    <>
      <SubCinta items={sub2} activo={grupo2} alElegir={setGrupo2} />

      {/* ----- Fase de Grupos (grupos + cuadro de honor) ----- */}
      {grupo2 === 'grupos' && (
        <>
          <div className="pestanas">
            {grupos.map((g) => (
              <button
                key={g}
                className={claseBoton(g === grupoSel, completos.has(g))}
                onClick={() => setGrupoSel(g)}
              >
                Grupo {g}
              </button>
            ))}
            <button
              className={claseBoton(grupoSel === 'CH', cuadroCompleto)}
              onClick={() => setGrupoSel('CH')}
            >
              Cuadro de honor
            </button>
          </div>

          {grupoSel === 'CH' ? (
            faseGrupos && (
              <CuadroHonor
                sesion={sesion}
                fase={faseGrupos}
                alGuardar={refrescarCompletitud}
              />
            )
          ) : (
            faseGrupos && (
              <Pronostico
                sesion={sesion}
                fase={faseGrupos}
                grupoExterno={grupoSel}
                alGuardar={refrescarCompletitud}
              />
            )
          )}
        </>
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
