/* =============================================================
 *  PUNTUACIÓN  —  LÓGICA DE CÁLCULO DE PUNTOS
 * =============================================================
 *
 *  IMPORTANTE: los VALORES de los puntos ya NO se editan aquí.
 *  Se editan desde el panel de administración (pestaña "Puntos"),
 *  y se guardan en la base de datos (tabla valores_puntos).
 *
 *  Este archivo solo contiene:
 *   1. La LÓGICA de cálculo (cómo se cuentan los puntos).
 *   2. Los valores POR DEFECTO, que sirven solo para:
 *      - rellenar la base de datos la primera vez (schema_v2.sql)
 *      - usarse como respaldo si la BD no devuelve un valor.
 *
 *  Las conceptos son: '1x2', 'exacto', 'clasificado'.
 *  Las rondas: 'grupos','dieciseisavos','octavos','cuartos',
 *              'semifinal','final','tercer_puesto'.
 * ============================================================= */

// Valores por defecto. Reflejan lo que hay en schema_v2.sql.
// 'exacto' es el extra que se suma ADEMÁS del 1x2.
export const VALORES_DEFECTO = {
  grupos:        { '1x2': 1, exacto: 2, clasificado: 1 },
  dieciseisavos: { '1x2': 1, exacto: 2, clasificado: 3 },
  octavos:       { '1x2': 1, exacto: 2, clasificado: 3 },
  cuartos:       { '1x2': 1, exacto: 2, clasificado: 3 },
  semifinal:     { '1x2': 1, exacto: 2, clasificado: 3 },
  final:         { '1x2': 1, exacto: 2 },
  tercer_puesto: { '1x2': 1, exacto: 2 },
};

export const VALOR_CUADRO_HONOR_DEFECTO = 10;

// Convierte las filas de la tabla valores_puntos en un objeto
// { ronda: { concepto: puntos } }. Si falta algo, usa el defecto.
export function valoresDesdeFilas(filas) {
  const v = JSON.parse(JSON.stringify(VALORES_DEFECTO));
  for (const f of filas || []) {
    if (!v[f.ronda]) v[f.ronda] = {};
    v[f.ronda][f.concepto] = f.puntos;
  }
  return v;
}

/* ---------------- LÓGICA DE CÁLCULO ---------------- */

// Devuelve 'L' (gana local), 'E' (empate) o 'V' (gana visitante).
export function resultado1X2(golesLocal, golesVisitante) {
  if (golesLocal > golesVisitante) return 'L';
  if (golesLocal < golesVisitante) return 'V';
  return 'E';
}

// Puntos de un partido. `valoresRonda` = { '1x2': n, 'exacto': n }.
// Devuelve { puntos, tipo } donde tipo es 'exacto' | '1x2' | 'fallo'.
export function puntosPartido(pred, real, valoresRonda) {
  const v = valoresRonda || VALORES_DEFECTO.grupos;
  if (!pred || !real) return { puntos: 0, tipo: 'fallo' };
  if (pred.local == null || pred.visitante == null) return { puntos: 0, tipo: 'fallo' };
  if (real.local == null || real.visitante == null) return { puntos: 0, tipo: 'fallo' };

  const aciertoSigno =
    resultado1X2(pred.local, pred.visitante) ===
    resultado1X2(real.local, real.visitante);
  if (!aciertoSigno) return { puntos: 0, tipo: 'fallo' };

  const exacto = pred.local === real.local && pred.visitante === real.visitante;
  if (exacto) {
    return { puntos: (v['1x2'] || 0) + (v.exacto || 0), tipo: 'exacto' };
  }
  return { puntos: v['1x2'] || 0, tipo: '1x2' };
}

// Compat: versión antigua usada por el cálculo de la fase de grupos.
export function puntosPartidoGrupo(pred, real, valoresRonda) {
  return puntosPartido(pred, real, valoresRonda).puntos;
}

// Bonus por posiciones de un grupo. Suma el valor 'clasificado'
// de la ronda por cada equipo en su posición exacta.
export function puntosPosiciones(ordenPredicho, ordenReal, puntoPorPosicion) {
  if (!ordenPredicho || !ordenReal) return 0;
  let p = 0;
  for (let i = 0; i < ordenReal.length; i++) {
    if (ordenPredicho[i] && ordenPredicho[i] === ordenReal[i]) {
      p += puntoPorPosicion || 0;
    }
  }
  return p;
}
