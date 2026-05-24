/* =============================================================
 *  PUNTUACIÓN COMPLETA  —  bonus de posición y fase eliminatoria
 * =============================================================
 *  Reúne las dos piezas de cálculo que faltaban:
 *
 *   1. BONUS POR POSICIÓN DE GRUPO
 *      La tabla final predicha por el jugador (sus marcadores +
 *      sus desempates manuales) vs. la tabla real. Suma el valor
 *      'clasificado' por cada equipo en su posición exacta.
 *      Solo cuenta cuando el grupo tiene los 6 resultados.
 *
 *   2. PUNTOS DE FASE ELIMINATORIA
 *      Por cada CRUCE (slot), comparando marcadores:
 *        - 1x2     : acierta el signo del marcador (equipos aparte)
 *        - exacto  : acierta el marcador exacto (equipos aparte)
 *      Por cada CRUCE, comparando el equipo que avanza:
 *        - clasificado : el equipo que el jugador hace avanzar
 *          coincide con el que avanzó de verdad.
 * ============================================================= */

import { GRUPOS, partidosDeGrupo } from '../../data/partidos.js';
import { ELIMINATORIA } from '../../data/eliminatoria.js';
import { calcularTablaGrupo, aplicarOrdenManual } from './clasificacion.js';
import { puntosPartido } from '../../puntuacion.js';
import { cuadroDelJugador, baseAdminDesdeFilas } from './eliminatoria.js';

/* ---------- 1. BONUS POR POSICIÓN DE GRUPO ---------- */

// Tabla final REAL de un grupo (a partir de los resultados reales).
// Devuelve el array de equipos 1.º..4.º, o null si el grupo no está
// completo (faltan resultados).
function tablaRealGrupo(letra, realPorId) {
  const partidos = partidosDeGrupo(letra);
  if (!partidos.every((p) => realPorId[p.id])) return null; // incompleto
  const conGoles = partidos.map((p) => {
    const r = realPorId[p.id];
    return {
      local: p.local, visitante: p.visitante,
      golesLocal: r.local, golesVisitante: r.visitante,
    };
  });
  return calcularTablaGrupo(GRUPOS[letra], conGoles).filas.map((f) => f.equipo);
}

// Tabla PREDICHA por el jugador para un grupo: sus marcadores +
// sus desempates manuales. Devuelve array de equipos 1.º..4.º.
function tablaPredichaGrupo(letra, predPorId, desempatesJugador) {
  const partidos = partidosDeGrupo(letra);
  const conGoles = partidos.map((p) => {
    const pr = predPorId[p.id];
    return {
      local: p.local, visitante: p.visitante,
      golesLocal: pr ? pr.local : null,
      golesVisitante: pr ? pr.visitante : null,
    };
  });
  const tabla = calcularTablaGrupo(GRUPOS[letra], conGoles);
  // Aplica los desempates manuales que correspondan a este grupo.
  const ordenManual = {};
  for (const d of desempatesJugador) {
    if (d.ambito === `grupo:${letra}`) {
      ordenManual[d.clave_empate] = d.orden;
    }
  }
  return aplicarOrdenManual(tabla, ordenManual);
}

/* Bonus de posición de UN jugador, sumando todos los grupos completos.
 * Devuelve el total de puntos de 'clasificado' de grupos.
 */
export function bonusPosicionGrupos(predPorId, desempatesJugador, realPorId, valorClasificado) {
  let puntos = 0;
  for (const letra of Object.keys(GRUPOS)) {
    const real = tablaRealGrupo(letra, realPorId);
    if (!real) continue; // grupo incompleto: aún no puntúa
    const predicha = tablaPredichaGrupo(letra, predPorId, desempatesJugador);
    for (let i = 0; i < real.length; i++) {
      if (predicha[i] && predicha[i] === real[i]) puntos += valorClasificado;
    }
  }
  return puntos;
}

/* ---------- 2. PUNTOS DE FASE ELIMINATORIA ---------- */

// Ronda de un cruce, por su id.
const RONDA_DE = {};
for (const c of ELIMINATORIA) RONDA_DE[c.id] = c.ronda;

/* Calcula el cuadro REAL: quién avanza de verdad en cada cruce,
 * a partir de los resultados reales de la eliminatoria.
 * `realPorId` incluye también los cruces (E73..E104).
 * Para decidir el avance en un empate real haría falta el dato de
 * penaltis real; como no lo guardamos, si el resultado real es empate
 * el avance real queda indefinido (no puntúa 'clasificado' ahí).
 */
function cuadroReal(baseAdmin, realPorId) {
  // Reutiliza la lógica progresiva, pero con los marcadores reales
  // como si fueran "predicciones".
  const predDesdeReal = {};
  for (const c of ELIMINATORIA) {
    const r = realPorId[c.id];
    if (r) predDesdeReal[c.id] = { local: r.local, visitante: r.visitante };
  }
  return cuadroDelJugador(baseAdmin, predDesdeReal);
}

/* Puntos de eliminatoria de UN jugador.
 * Devuelve { final1x2, finalExacto, finalClasificado, puntos }.
 *   final1x2 / finalExacto = nº de aciertos (para las columnas)
 *   puntos = puntos totales de eliminatoria
 */
export function puntosEliminatoria(predPorId, baseFilas, realPorId, valores) {
  const baseAdmin = baseAdminDesdeFilas(baseFilas);
  const cuadroJug = cuadroDelJugador(baseAdmin, predPorId);
  const cuadroRl = cuadroReal(baseAdmin, realPorId);

  // Índice del cuadro real por id de cruce.
  const realCruce = {};
  for (const c of cuadroRl) realCruce[c.id] = c;

  let final1x2 = 0, finalExacto = 0, finalClasificado = 0, puntos = 0;

  for (const cruce of cuadroJug) {
    const ronda = RONDA_DE[cruce.id];
    const v = valores[ronda] || {};
    const real = realPorId[cruce.id];        // marcador real del slot
    const realInfo = realCruce[cruce.id];    // quién avanzó de verdad

    // --- 1x2 / exacto: por slot, solo marcadores (equipos aparte) ---
    if (real && cruce.pred && cruce.pred.local != null && cruce.pred.visitante != null) {
      const res = puntosPartido(
        { local: cruce.pred.local, visitante: cruce.pred.visitante },
        { local: real.local, visitante: real.visitante },
        v
      );
      if (res.tipo === 'exacto') finalExacto += 1;
      else if (res.tipo === '1x2') final1x2 += 1;
      puntos += res.puntos;
    }

    // --- clasificado: el equipo que el jugador hace avanzar vs. el real ---
    // (no aplica a la final ni al 3.er puesto: no tienen 'clasificado')
    if (v.clasificado && realInfo && realInfo.ganador && cruce.ganador) {
      if (cruce.ganador === realInfo.ganador) {
        finalClasificado += 1;
        puntos += v.clasificado;
      }
    }
  }

  return { final1x2, finalExacto, finalClasificado, puntos };
}
