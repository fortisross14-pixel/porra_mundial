/* =============================================================
 *  LÓGICA DEL CUADRO ELIMINATORIO DEL JUGADOR
 * =============================================================
 *  El jugador pronostica un marcador por cada cruce. El cuadro es
 *  progresivo: el ganador que él predice avanza y rellena el cruce
 *  de la siguiente ronda.
 *
 *  Si predice empate, debe elegir quién pasa en penaltis: esa
 *  elección es la que avanza (el marcador empatado no decide).
 *
 *  Funciones clave:
 *   - cuadroDelJugador: dado el cuadro base (dieciseisavos resueltos
 *     por el admin) y las predicciones del jugador, devuelve todos
 *     los cruces con sus equipos calculados.
 * ============================================================= */

import { ELIMINATORIA } from '../../data/eliminatoria.js';

// Índice de cruces por id.
const CRUCE = {};
for (const c of ELIMINATORIA) CRUCE[c.id] = c;

// Orden de rondas.
export const RONDAS_ELIM = [
  'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer_puesto', 'final',
];

/* Resuelve una referencia de procedencia a un código de equipo,
 * usando el cuadro base del admin y las predicciones del jugador.
 *   '2A','1E',...   -> del cuadro base (lo resolvió el admin)
 *   'WnnXX'         -> ganador que el jugador predijo en el cruce nn
 *   'LnnXX'         -> perdedor que el jugador predijo en el cruce nn
 */
function resolverRef(ref, baseAdmin, ganadores, perdedores) {
  if (!ref) return '';
  // Ganador / perdedor de otro cruce.
  const w = ref.match(/^W(E\d+)$/);
  if (w) return ganadores[w[1]] || '';
  const l = ref.match(/^L(E\d+)$/);
  if (l) return perdedores[l[1]] || '';
  // Si no, es una procedencia de grupos: la resolvió el admin.
  return baseAdmin[ref] || '';
}

/* Calcula el cuadro completo del jugador.
 *   baseAdmin   : { '2A': 'CZE', '1E': 'GER', ... }  (huecos resueltos)
 *   predicciones: { 'E73': { local, visitante, penaltis } }
 *                 penaltis = código del equipo que pasa si hay empate
 *
 * Devuelve un array de cruces:
 *   { id, ronda, equipoLocal, equipoVisitante, pred, ganador, listo }
 *   listo = true si ambos equipos están definidos.
 */
export function cuadroDelJugador(baseAdmin, predicciones) {
  const ganadores = {};
  const perdedores = {};
  const resultado = [];

  for (const cruce of ELIMINATORIA) {
    const equipoLocal = resolverRef(cruce.local, baseAdmin, ganadores, perdedores);
    const equipoVisitante = resolverRef(cruce.visitante, baseAdmin, ganadores, perdedores);
    const pred = predicciones[cruce.id] || {};
    const listo = Boolean(equipoLocal && equipoVisitante);

    let ganador = '';
    let perdedor = '';
    if (listo && pred.local != null && pred.visitante != null) {
      if (pred.local > pred.visitante) {
        ganador = equipoLocal; perdedor = equipoVisitante;
      } else if (pred.local < pred.visitante) {
        ganador = equipoVisitante; perdedor = equipoLocal;
      } else {
        // Empate: decide la elección de penaltis del jugador.
        if (pred.penaltis === equipoLocal) {
          ganador = equipoLocal; perdedor = equipoVisitante;
        } else if (pred.penaltis === equipoVisitante) {
          ganador = equipoVisitante; perdedor = equipoLocal;
        }
      }
    }
    ganadores[cruce.id] = ganador;
    perdedores[cruce.id] = perdedor;

    resultado.push({
      id: cruce.id,
      ronda: cruce.ronda,
      fecha: cruce.fecha,
      equipoLocal,
      equipoVisitante,
      pred,
      ganador,
      esEmpate: listo && pred.local != null && pred.local === pred.visitante,
      listo,
    });
  }
  return resultado;
}

// ¿El cuadro del jugador está completo? (todos los cruces con marcador
// y, si hay empate, con penaltis elegidos)
export function cuadroCompleto(cruces) {
  return cruces.every((c) => {
    if (!c.listo) return false;
    if (c.pred.local == null || c.pred.visitante == null) return false;
    if (c.esEmpate && !c.pred.penaltis) return false;
    return true;
  });
}

// Convierte el cuadro base (filas de la BD) en { procedencia: equipo }.
// Las filas guardan partido_id+lado+equipo; las procedencias originales
// están en ELIMINATORIA. Hacemos el mapeo procedencia -> equipo.
export function baseAdminDesdeFilas(filas) {
  const porPartidoLado = {};
  for (const f of filas) {
    porPartidoLado[`${f.partido_id}:${f.lado}`] = f.equipo;
  }
  const base = {};
  for (const c of ELIMINATORIA) {
    if (c.ronda !== 'dieciseisavos') continue;
    const eqL = porPartidoLado[`${c.id}:local`];
    const eqV = porPartidoLado[`${c.id}:visitante`];
    if (eqL) base[c.local] = eqL;
    if (eqV) base[c.visitante] = eqV;
  }
  return base;
}
