/* GET /api/admin-datos
 *  Devuelve todo lo que necesita el panel de administración:
 *   - las porras y sus fases (con el estado abierta/cerrada)
 *   - por cada porra, la lista de jugadores: nombre, fecha de alta,
 *     y cuántos partidos lleva pronosticados (para ver si va completo)
 *   - los resultados reales ya introducidos
 *
 *  Protegido por la cookie de sesión de admin.
 */
import { sql, error, sesionAdminValida } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return error(res, 405, 'Método no permitido');
  if (!sesionAdminValida(req)) {
    return error(res, 401, 'Sesión de administrador no válida o caducada');
  }

  try {
    const { rows: porras } = await sql`SELECT id, nombre, codigo FROM porras ORDER BY id`;
    const { rows: fases } = await sql`
      SELECT id, porra_id, nombre, fecha_limite, abierta FROM fases ORDER BY id
    `;
    const { rows: jugadores } = await sql`
      SELECT id, porra_id, usuario, pin, creado FROM jugadores ORDER BY creado
    `;
    // Nº de partidos pronosticados (con ambos goles) por jugador y fase.
    const { rows: conteos } = await sql`
      SELECT jugador_id, fase_id, COUNT(*)::int AS hechos
      FROM predicciones
      WHERE goles_local IS NOT NULL AND goles_visitante IS NOT NULL
      GROUP BY jugador_id, fase_id
    `;
    const { rows: resultados } = await sql`
      SELECT partido_id, goles_local, goles_visitante FROM resultados
    `;
    const { rows: valores } = await sql`
      SELECT ronda, concepto, puntos FROM valores_puntos
    `;
    const { rows: ch } = await sql`SELECT puntos FROM valor_cuadro_honor LIMIT 1`;

    return res.status(200).json({
      ok: true,
      porras, fases, jugadores, conteos, resultados,
      valores,
      cuadroHonor: ch[0]?.puntos ?? 10,
    });
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
