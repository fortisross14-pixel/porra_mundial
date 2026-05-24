/* =============================================================
 *  CÁLCULO DE PUNTOS PARA LAS PANTALLAS DE RESULTADOS
 * =============================================================
 *  Toma los datos crudos de /api/ranking y produce:
 *   - el desglose por partido de cada jugador (para el popup)
 *   - el ranking de un día concreto
 *   - el ranking total acumulado
 *
 *  De momento cubre la FASE DE GRUPOS. Las columnas de fase final
 *  quedan a 0 hasta que se construya esa fase.
 * ============================================================= */

import { puntosPartido, resultado1X2 } from '../../puntuacion.js';
import { PARTIDOS, EQUIPOS } from '../../data/partidos.js';
import { bonusPosicionGrupos, puntosEliminatoria } from './puntuacion_completa.js';

// Índice rápido: partido_id -> objeto partido.
const PORID = {};
for (const p of PARTIDOS) PORID[p.id] = p;

// Fecha (YYYY-MM-DD) de un partido, a partir de su campo 'fecha'.
export function diaDePartido(partidoId) {
  const p = PORID[partidoId];
  if (!p) return null;
  return p.fecha.slice(0, 10);
}

// Lista ordenada de días que YA tienen algún resultado real cargado.
export function diasConResultados(resultados) {
  const dias = new Set();
  for (const r of resultados) {
    const d = diaDePartido(r.partido_id);
    if (d) dias.add(d);
  }
  return [...dias].sort();
}

// Lista ordenada de TODOS los días que tienen partidos programados.
export function diasConPartidos() {
  const dias = new Set();
  for (const p of PARTIDOS) dias.add(p.fecha.slice(0, 10));
  return [...dias].sort();
}

/* Desglose por partido de UN jugador.
 * Devuelve un array de filas:
 *   { partidoId, etiqueta, pred, real, tipo, puntos }
 * tipo: 'exacto' | '1x2' | 'fallo' | 'sin-resultado' | 'sin-pronostico'
 */
export function desgloseJugador(jugadorId, predicciones, resultados, valores) {
  const predDe = {};
  for (const p of predicciones) {
    if (p.jugador_id === jugadorId) {
      predDe[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante };
    }
  }
  const realDe = {};
  for (const r of resultados) {
    realDe[r.partido_id] = { local: r.goles_local, visitante: r.goles_visitante };
  }

  const filas = [];
  for (const partido of PARTIDOS) {
    const real = realDe[partido.id];
    if (!real) continue; // solo partidos con resultado real
    const pred = predDe[partido.id];
    const nomL = EQUIPOS[partido.local]?.nombre || partido.local;
    const nomV = EQUIPOS[partido.visitante]?.nombre || partido.visitante;
    const etiqueta = `${nomL} – ${nomV}`;

    if (!pred || pred.local == null || pred.visitante == null) {
      filas.push({
        partidoId: partido.id, etiqueta, pred: null, real,
        tipo: 'sin-pronostico', puntos: 0,
      });
      continue;
    }
    const r = puntosPartido(pred, real, valores.grupos);
    filas.push({
      partidoId: partido.id, etiqueta, pred, real,
      tipo: r.tipo, puntos: r.puntos,
    });
  }
  return filas;
}

// Texto corto del tipo de acierto, para mostrar en el popup.
export function textoTipo(tipo) {
  if (tipo === 'exacto') return 'Resultado exacto';
  if (tipo === '1x2') return '1X2';
  if (tipo === 'sin-pronostico') return 'Sin pronóstico';
  return 'Fallo';
}

/* Ranking de UN día concreto.
 * Suma, por jugador, los puntos de los partidos jugados ESE día.
 * Devuelve filas { jugadorId, usuario, puntos } ordenadas.
 */
export function rankingDia(dia, jugadores, predicciones, resultados, valores) {
  // Resultados solo de ese día.
  const resDia = resultados.filter((r) => diaDePartido(r.partido_id) === dia);
  return rankingSobre(resDia, jugadores, predicciones, valores);
}

/* Ranking total: todos los partidos con resultado.
 * `extra` (opcional) = { desempates, prediccionesElim, cuadroElim }
 * para sumar el bonus de posición de grupo y los puntos de eliminatoria.
 */
export function rankingTotal(jugadores, predicciones, resultados, valores, extra) {
  return rankingSobre(resultados, jugadores, predicciones, valores, extra);
}

// Núcleo común: dado un conjunto de resultados, suma puntos por jugador.
// Separa el conteo en grupos (1x2 / exacto) para la tabla de columnas.
function rankingSobre(resultados, jugadores, predicciones, valores, extra) {
  const real = {};
  for (const r of resultados) {
    real[r.partido_id] = { local: r.goles_local, visitante: r.goles_visitante };
  }
  const acc = {};
  for (const j of jugadores) {
    acc[j.id] = {
      jugadorId: j.id, usuario: j.usuario,
      grupos1x2: 0, gruposExacto: 0, gruposClasificado: 0,
      final1x2: 0, finalExacto: 0, finalClasificado: 0,
      puntos: 0,
    };
  }
  for (const p of predicciones) {
    const r = real[p.partido_id];
    if (!r) continue;
    const a = acc[p.jugador_id];
    if (!a) continue;
    const res = puntosPartido(
      { local: p.goles_local, visitante: p.goles_visitante },
      r, valores.grupos
    );
    if (res.tipo === 'exacto') a.gruposExacto += 1;
    else if (res.tipo === '1x2') a.grupos1x2 += 1;
    a.puntos += res.puntos;
  }

  // Bonus de posición de grupo + puntos de eliminatoria.
  if (extra) {
    const valorClasif = valores.grupos?.clasificado || 0;

    // Predicciones de grupos indexadas por jugador -> partido.
    const predGruposPorJug = {};
    for (const p of predicciones) {
      if (!predGruposPorJug[p.jugador_id]) predGruposPorJug[p.jugador_id] = {};
      predGruposPorJug[p.jugador_id][p.partido_id] = {
        local: p.goles_local, visitante: p.goles_visitante,
      };
    }
    // Predicciones de eliminatoria indexadas por jugador -> cruce.
    const predElimPorJug = {};
    for (const p of extra.prediccionesElim || []) {
      if (!predElimPorJug[p.jugador_id]) predElimPorJug[p.jugador_id] = {};
      predElimPorJug[p.jugador_id][p.partido_id] = {
        local: p.goles_local, visitante: p.goles_visitante,
        penaltis: p.penaltis || '',
      };
    }
    // Resultados reales indexados (sirven tanto para grupos como elim).
    const realPorId = {};
    for (const r of resultados) {
      realPorId[r.partido_id] = { local: r.goles_local, visitante: r.goles_visitante };
    }

    for (const j of jugadores) {
      const a = acc[j.id];
      const desJug = (extra.desempates || []).filter((d) => d.jugador_id === j.id);

      // Bonus de posición de grupo.
      a.gruposClasificado = contarPosicionesAcertadas(
        predGruposPorJug[j.id] || {}, desJug, realPorId
      );
      const bonusPos = bonusPosicionGrupos(
        predGruposPorJug[j.id] || {}, desJug, realPorId, valorClasif
      );
      a.puntos += bonusPos;

      // Puntos de eliminatoria.
      const pe = puntosEliminatoria(
        predElimPorJug[j.id] || {}, extra.cuadroElim || [], realPorId, valores
      );
      a.final1x2 = pe.final1x2;
      a.finalExacto = pe.finalExacto;
      a.finalClasificado = pe.finalClasificado;
      a.puntos += pe.puntos;
    }
  }

  return Object.values(acc).sort((a, b) => b.puntos - a.puntos);
}

// Cuenta cuántas posiciones de grupo acertó (para la columna "Posic.").
function contarPosicionesAcertadas(predPorId, desempatesJugador, realPorId) {
  // Reutiliza la lógica del bonus pero contando aciertos, no puntos.
  return bonusPosicionGrupos(predPorId, desempatesJugador, realPorId, 1);
}

/* Cuadrícula de un día: matrices de partidos x jugadores.
 * Devuelve:
 *   partidos : [{ id, etiqueta }]  (etiqueta tipo 'ESP-URU')
 *   reales   : { partidoId: {local,visitante} | null }
 *   filas    : [{ jugadorId, usuario, puntos, celdas: { partidoId: {pred, tipo} } }]
 *              ordenadas por puntos desc, y alfabético en empate o si 0.
 * tipo de celda: 'exacto' | '1x2' | 'fallo' | 'sin-pronostico' | 'sin-resultado'
 */
export function cuadriculaDia(dia, jugadores, predicciones, resultados, valores) {
  const partidosDia = PARTIDOS
    .filter((p) => diaDePartido(p.id) === dia)
    .map((p) => ({ id: p.id, etiqueta: `${p.local}-${p.visitante}`, local: p.local, visitante: p.visitante }));

  const reales = {};
  for (const pd of partidosDia) {
    const r = resultados.find((x) => x.partido_id === pd.id);
    reales[pd.id] = r ? { local: r.goles_local, visitante: r.goles_visitante } : null;
  }

  // Predicciones indexadas: jugador -> partido -> {local,visitante}
  const predIdx = {};
  for (const p of predicciones) {
    if (!predIdx[p.jugador_id]) predIdx[p.jugador_id] = {};
    predIdx[p.jugador_id][p.partido_id] = {
      local: p.goles_local, visitante: p.goles_visitante,
    };
  }

  const filas = jugadores.map((j) => {
    const celdas = {};
    let puntos = 0;
    for (const pd of partidosDia) {
      const pred = predIdx[j.id]?.[pd.id] || null;
      const real = reales[pd.id];
      let tipo = 'sin-pronostico';
      if (pred && pred.local != null && pred.visitante != null) {
        if (!real) {
          tipo = 'sin-resultado';
        } else {
          const res = puntosPartido(pred, real, valores.grupos);
          tipo = res.tipo;
          puntos += res.puntos;
        }
      }
      celdas[pd.id] = { pred, tipo };
    }
    return { jugadorId: j.id, usuario: j.usuario, puntos, celdas };
  });

  filas.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    return a.usuario.localeCompare(b.usuario, 'es');
  });

  return { partidos: partidosDia, reales, filas };
}
