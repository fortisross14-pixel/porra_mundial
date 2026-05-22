/* POST /api/acceso
 * Valida el código de una porra. Si es correcto devuelve la porra
 * y sus fases. Si no, devuelve error (el resto del mundo no entra).
 */
import { sql, porraPorCodigo, leerCuerpo, error } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return error(res, 405, 'Método no permitido');

  try {
    const { codigo } = leerCuerpo(req);
    const porra = await porraPorCodigo(codigo);
    if (!porra) return error(res, 403, 'Código no válido');

    const { rows: fases } = await sql`
      SELECT id, nombre, fecha_limite, abierta
      FROM fases WHERE porra_id = ${porra.id} ORDER BY id
    `;

    return res.status(200).json({
      ok: true,
      porra: { id: porra.id, nombre: porra.nombre },
      fases,
    });
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
