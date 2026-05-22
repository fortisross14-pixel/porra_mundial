/* =============================================================
 *  RESOLUCIÓN DEL CUADRO ELIMINATORIO
 * =============================================================
 *  A partir de los resultados reales de la fase de grupos, calcula:
 *   - la tabla final de cada grupo (1.º, 2.º, 3.º, 4.º)
 *   - el ranking de los 12 terceros (los 8 mejores clasifican)
 *   - y rellena los 32 huecos del cuadro eliminatorio según la
 *     procedencia definida en data/eliminatoria.js ('1A', '2B',
 *     '3-ABCDF', etc.)
 *
 *  Es una PROPUESTA automática. El admin puede editar cualquier
 *  hueco después (terceros empatados, criterios no deducibles, etc.).
 * ============================================================= */

import { GRUPOS, partidosDeGrupo } from '../../data/partidos.js';
import { ELIMINATORIA } from '../../data/eliminatoria.js';
import { calcularTablaGrupo } from './clasificacion.js';

// Construye la tabla final de un grupo con los resultados reales.
// `reales` = { partido_id: { local, visitante } }
function tablaReal(letra, reales) {
  const partidos = partidosDeGrupo(letra).map((p) => {
    const r = reales[p.id];
    return {
      local: p.local,
      visitante: p.visitante,
      golesLocal: r ? r.local : null,
      golesVisitante: r ? r.visitante : null,
    };
  });
  return calcularTablaGrupo(GRUPOS[letra], partidos);
}

/* Devuelve, para cada grupo, su tabla ordenada (array de 4 equipos)
 * y si el grupo está completo (los 3 partidos con resultado).
 */
export function tablasDeGrupos(reales) {
  const out = {};
  for (const letra of Object.keys(GRUPOS)) {
    const tabla = tablaReal(letra, reales);
    const completos = partidosDeGrupo(letra).every((p) => reales[p.id]);
    out[letra] = {
      orden: tabla.filas.map((f) => f.equipo),
      filas: tabla.filas,
      completo: completos,
      hayEmpate: tabla.gruposEmpatados.length > 0,
    };
  }
  return out;
}

/* Ranking de los 12 terceros, de mejor a peor.
 * Mismos criterios: puntos -> dif. goles -> goles a favor.
 * Devuelve array de { equipo, grupo, pts, dg, gf }.
 */
export function rankingTerceros(tablas) {
  const terceros = [];
  for (const letra of Object.keys(tablas)) {
    const fila = tablas[letra].filas[2]; // 3.ª posición
    if (fila) terceros.push({ ...fila, grupo: letra });
  }
  terceros.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });
  return terceros;
}

/* Resuelve una procedencia ('1A', '2B', '3-ABCDF') a un código de
 * equipo, usando las tablas y el ranking de terceros.
 * Para '3-XXXXX' coge el mejor tercero disponible de esos grupos.
 * Devuelve '' si todavía no se puede determinar.
 */
function resolverProcedencia(proc, tablas, tercerosClasificados) {
  if (!proc) return '';

  // '1A' / '2B' : posición fija de un grupo.
  const m = proc.match(/^([12])([A-L])$/);
  if (m) {
    const pos = Number(m[1]) - 1;
    const grupo = m[2];
    return tablas[grupo]?.orden[pos] || '';
  }

  // '3-ABCDF' : un tercero proveniente de uno de esos grupos.
  const m3 = proc.match(/^3-([A-L]+)$/);
  if (m3) {
    const grupos = m3[1].split('');
    // Coge, de los terceros que clasifican, el de mayor ranking cuyo
    // grupo esté en la lista y que no se haya asignado ya.
    for (const t of tercerosClasificados) {
      if (grupos.includes(t.grupo) && !t._asignado) {
        t._asignado = true;
        return t.equipo;
      }
    }
    return '';
  }

  return ''; // 'WnnXX' / 'LnnXX' (ganador/perdedor) no se resuelven aquí
}

/* Propuesta automática del cuadro: para cada cruce de dieciseisavos,
 * resuelve local y visitante. Las rondas posteriores dependen de
 * ganadores, así que se dejan vacías.
 *
 * Devuelve { partido_id: { local, visitante } }.
 */
export function proponerCuadro(reales) {
  const tablas = tablasDeGrupos(reales);
  const terceros = rankingTerceros(tablas);
  // Los 8 mejores terceros clasifican.
  const clasificados = terceros.slice(0, 8).map((t) => ({ ...t, _asignado: false }));

  const propuesta = {};
  for (const cruce of ELIMINATORIA) {
    if (cruce.ronda !== 'dieciseisavos') continue;
    propuesta[cruce.id] = {
      local: resolverProcedencia(cruce.local, tablas, clasificados),
      visitante: resolverProcedencia(cruce.visitante, tablas, clasificados),
    };
  }
  return propuesta;
}

// ¿Están TODOS los grupos completos? (condición para proponer el cuadro)
export function todosLosGruposCompletos(reales) {
  const tablas = tablasDeGrupos(reales);
  return Object.values(tablas).every((t) => t.completo);
}
