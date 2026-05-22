/* GET /api/puntos
 *  Devuelve los valores de puntos actuales (tabla valores_puntos) y
 *  el valor del cuadro de honor. Es público: lo usa el popup de Ayuda
 *  para que los jugadores vean cuántos puntos da cada acierto.
 */
import { sql, error } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return error(res, 405, 'Método no permitido');
  try {
    const { rows: valores } = await sql`
      SELECT ronda, concepto, puntos FROM valores_puntos
    `;
    const { rows: ch } = await sql`SELECT puntos FROM valor_cuadro_honor LIMIT 1`;
    return res.status(200).json({
      ok: true,
      valores,
      cuadroHonor: ch[0]?.puntos ?? 10,
    });
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
