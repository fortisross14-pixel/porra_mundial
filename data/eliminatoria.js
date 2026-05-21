/* =============================================================
 *  ELIMINATORIA  —  ESTRUCTURA DEL CUADRO FINAL, MUNDIAL 2026
 * =============================================================
 *
 *  El cuadro oficial: 32 equipos, de dieciseisavos a la final.
 *  Cada cruce se define por su PROCEDENCIA, no por equipos
 *  concretos (todavía no se sabe quién pasa).
 *
 *  Cuando termine la fase de grupos, el panel de admin usará esta
 *  estructura para resolver los emparejamientos reales y abrir la
 *  fase eliminatoria del pronóstico.
 *
 *  Notación de procedencia:
 *   '1A'      = 1º del grupo A
 *   '2B'      = 2º del grupo B
 *   '3-ABCDF' = el 3º clasificado que provenga de uno de esos grupos
 *               (la FIFA asigna los 8 mejores terceros según un cuadro fijo)
 *   'WnnXX'   = ganador del partido nn
 *   'LnnXX'   = perdedor del partido nn (solo para el 3er puesto)
 * ============================================================= */

export const ELIMINATORIA = [
  // ---- Dieciseisavos (Ronda de 32) ----
  { id: 'E73', ronda: 'dieciseisavos', local: '2A', visitante: '2B', fecha: '2026-06-28T12:00:00' },
  { id: 'E74', ronda: 'dieciseisavos', local: '1E', visitante: '3-ABCDF', fecha: '2026-06-29T16:30:00' },
  { id: 'E75', ronda: 'dieciseisavos', local: '1F', visitante: '2C', fecha: '2026-06-29T19:00:00' },
  { id: 'E76', ronda: 'dieciseisavos', local: '1C', visitante: '2F', fecha: '2026-06-29T12:00:00' },
  { id: 'E77', ronda: 'dieciseisavos', local: '1I', visitante: '3-CDFGH', fecha: '2026-06-30T17:00:00' },
  { id: 'E78', ronda: 'dieciseisavos', local: '2E', visitante: '2I', fecha: '2026-06-30T12:00:00' },
  { id: 'E79', ronda: 'dieciseisavos', local: '1A', visitante: '3-CEFHI', fecha: '2026-06-30T19:00:00' },
  { id: 'E80', ronda: 'dieciseisavos', local: '1L', visitante: '3-EHIJK', fecha: '2026-07-01T12:00:00' },
  { id: 'E81', ronda: 'dieciseisavos', local: '1D', visitante: '3-BEFIJ', fecha: '2026-07-01T17:00:00' },
  { id: 'E82', ronda: 'dieciseisavos', local: '1G', visitante: '3-AEHIJ', fecha: '2026-07-01T13:00:00' },
  { id: 'E83', ronda: 'dieciseisavos', local: '2K', visitante: '2L', fecha: '2026-07-02T19:00:00' },
  { id: 'E84', ronda: 'dieciseisavos', local: '1H', visitante: '2J', fecha: '2026-07-02T12:00:00' },
  { id: 'E85', ronda: 'dieciseisavos', local: '1B', visitante: '3-EFGIJ', fecha: '2026-07-02T20:00:00' },
  { id: 'E86', ronda: 'dieciseisavos', local: '1J', visitante: '2H', fecha: '2026-07-03T18:00:00' },
  { id: 'E87', ronda: 'dieciseisavos', local: '1K', visitante: '3-DEIJL', fecha: '2026-07-03T20:30:00' },
  { id: 'E88', ronda: 'dieciseisavos', local: '2D', visitante: '2G', fecha: '2026-07-03T13:00:00' },

  // ---- Octavos (Ronda de 16) ----
  { id: 'E89', ronda: 'octavos', local: 'WE74', visitante: 'WE77', fecha: '2026-07-04T17:00:00' },
  { id: 'E90', ronda: 'octavos', local: 'WE73', visitante: 'WE75', fecha: '2026-07-04T12:00:00' },
  { id: 'E91', ronda: 'octavos', local: 'WE76', visitante: 'WE78', fecha: '2026-07-05T16:00:00' },
  { id: 'E92', ronda: 'octavos', local: 'WE79', visitante: 'WE80', fecha: '2026-07-05T18:00:00' },
  { id: 'E93', ronda: 'octavos', local: 'WE83', visitante: 'WE84', fecha: '2026-07-06T14:00:00' },
  { id: 'E94', ronda: 'octavos', local: 'WE81', visitante: 'WE82', fecha: '2026-07-06T17:00:00' },
  { id: 'E95', ronda: 'octavos', local: 'WE86', visitante: 'WE88', fecha: '2026-07-07T12:00:00' },
  { id: 'E96', ronda: 'octavos', local: 'WE85', visitante: 'WE87', fecha: '2026-07-07T13:00:00' },

  // ---- Cuartos de final ----
  { id: 'E97',  ronda: 'cuartos', local: 'WE89', visitante: 'WE90', fecha: '2026-07-09T16:00:00' },
  { id: 'E98',  ronda: 'cuartos', local: 'WE93', visitante: 'WE94', fecha: '2026-07-10T12:00:00' },
  { id: 'E99',  ronda: 'cuartos', local: 'WE91', visitante: 'WE92', fecha: '2026-07-11T17:00:00' },
  { id: 'E100', ronda: 'cuartos', local: 'WE95', visitante: 'WE96', fecha: '2026-07-11T20:00:00' },

  // ---- Semifinales ----
  { id: 'E101', ronda: 'semifinal', local: 'WE97', visitante: 'WE98',  fecha: '2026-07-14T14:00:00' },
  { id: 'E102', ronda: 'semifinal', local: 'WE99', visitante: 'WE100', fecha: '2026-07-15T15:00:00' },

  // ---- Tercer puesto ----
  { id: 'E103', ronda: 'tercer_puesto', local: 'LE101', visitante: 'LE102', fecha: '2026-07-18T17:00:00' },

  // ---- Final ----
  { id: 'E104', ronda: 'final', local: 'WE101', visitante: 'WE102', fecha: '2026-07-19T15:00:00' },
];

// Nombre legible de cada ronda, para mostrar en la interfaz.
export const NOMBRE_RONDA = {
  dieciseisavos: 'Dieciseisavos de final',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinales',
  tercer_puesto: 'Tercer puesto',
  final: 'Final',
};

export function partidosDeRonda(ronda) {
  return ELIMINATORIA.filter((p) => p.ronda === ronda);
}
