/* =============================================================
 *  PUNTUACIÓN  —  ARCHIVO DE CONFIGURACIÓN DE PUNTOS
 * =============================================================
 *
 *  Este es el ÚNICO archivo que necesitas tocar para cambiar
 *  cómo se reparten los puntos. La lógica del juego lee de aquí.
 *  No hace falta entender el resto del código para ajustar esto.
 *
 *  Lo usan tanto el frontend (para mostrar puntos en vivo) como
 *  el backend (para calcular la tabla final). Por eso vive en la
 *  raíz y se importa desde los dos lados.
 * ============================================================= */

export const PUNTUACION = {

  /* ---------- FASE DE GRUPOS: aciertos por partido ---------- */
  // Puntos por acertar el resultado 1X2 (gana local / empate / gana visitante).
  ACIERTO_1X2: 1,

  // Puntos EXTRA (adicionales) por acertar el marcador exacto.
  // Un marcador exacto da ACIERTO_1X2 + EXTRA_MARCADOR_EXACTO.
  // Con los valores por defecto: marcador exacto = 1 + 2 = 3 puntos.
  EXTRA_MARCADOR_EXACTO: 2,

  /* ---------- BONUS POR POSICIÓN EN LA TABLA ---------- */
  // Cantidad FIJA por cada equipo que quede en la posición EXACTA
  // que el jugador predijo dentro de su grupo.
  // Ej: si aciertas las 4 posiciones de un grupo -> 4 puntos.
  //     si solo aciertas el 1º y los otros 3 están cambiados -> 1 punto.
  BONUS_POR_POSICION_GRUPO: 1,

  // Lo mismo pero para la clasificación cruzada de los 12 terceros.
  // Por cada tercero que el jugador coloque en su posición exacta
  // dentro del ranking de terceros, suma esta cantidad.
  BONUS_POR_POSICION_TERCEROS: 1,

  /* ---------- FASE ELIMINATORIA (se rellena más adelante) ---------- */
  // Estos valores se usan cuando el admin abra la fase eliminatoria.
  // Puntos por acertar el equipo que pasa de ronda en cada cruce.
  ELIM_ACIERTO_CLASIFICADO: 3,

  // Puntos por acertar el marcador exacto de un cruce eliminatorio.
  ELIM_MARCADOR_EXACTO: 2,

  // Multiplicador opcional por ronda. La eliminatoria suma SIEMPRE
  // sobre el total acumulado (un solo ganador al final del torneo).
  // Pon 1 en todas si no quieres que las rondas valgan distinto.
  ELIM_MULTIPLICADOR_RONDA: {
    'dieciseisavos': 1, // Ronda de 32
    'octavos': 1,
    'cuartos': 1,
    'semifinal': 1,
    'final': 1,
  },
};

/* =============================================================
 *  FUNCIONES DE CÁLCULO
 *  (normalmente no hace falta editar esto; solo los valores de arriba)
 * ============================================================= */

// Devuelve 'L' (gana local), 'E' (empate) o 'V' (gana visitante).
export function resultado1X2(golesLocal, golesVisitante) {
  if (golesLocal > golesVisitante) return 'L';
  if (golesLocal < golesVisitante) return 'V';
  return 'E';
}

// Puntos de un partido de grupos: compara la predicción con el resultado real.
// Devuelve 0 si el 1X2 falla; ACIERTO_1X2 si acierta el 1X2;
// ACIERTO_1X2 + EXTRA_MARCADOR_EXACTO si además el marcador es exacto.
export function puntosPartidoGrupo(pred, real) {
  if (!pred || !real) return 0;
  if (pred.local == null || pred.visitante == null) return 0;
  if (real.local == null || real.visitante == null) return 0;

  const aciertoSigno =
    resultado1X2(pred.local, pred.visitante) ===
    resultado1X2(real.local, real.visitante);

  if (!aciertoSigno) return 0;

  const marcadorExacto =
    pred.local === real.local && pred.visitante === real.visitante;

  return marcadorExacto
    ? PUNTUACION.ACIERTO_1X2 + PUNTUACION.EXTRA_MARCADOR_EXACTO
    : PUNTUACION.ACIERTO_1X2;
}

// Bonus por posiciones de un grupo: recibe el orden predicho y el real
// (arrays de códigos de equipo, de 1º a 4º). Suma BONUS_POR_POSICION_GRUPO
// por cada equipo en su posición exacta.
export function puntosPosicionesGrupo(ordenPredicho, ordenReal) {
  if (!ordenPredicho || !ordenReal) return 0;
  let puntos = 0;
  for (let i = 0; i < ordenReal.length; i++) {
    if (ordenPredicho[i] && ordenPredicho[i] === ordenReal[i]) {
      puntos += PUNTUACION.BONUS_POR_POSICION_GRUPO;
    }
  }
  return puntos;
}

// Igual que la anterior pero para el ranking de los 12 terceros.
export function puntosPosicionesTerceros(ordenPredicho, ordenReal) {
  if (!ordenPredicho || !ordenReal) return 0;
  let puntos = 0;
  for (let i = 0; i < ordenReal.length; i++) {
    if (ordenPredicho[i] && ordenPredicho[i] === ordenReal[i]) {
      puntos += PUNTUACION.BONUS_POR_POSICION_TERCEROS;
    }
  }
  return puntos;
}
