/* /api/cuadro
 *  GET  -> el cuadro eliminatorio guardado (público; lo necesita la
 *          pantalla de pronóstico de eliminatoria de los jugadores).
 *  POST { huecos } -> guarda el cuadro. Protegido por sesión de admin.
 *        huecos = [{ partidoId, lado, equipo }, ...]
 */
import { sql, leerCuerpo, error, sesionAdminValida } from './_lib/helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT partido_id, lado, equipo FROM cuadro_eliminatorio
      `;
      return res.status(200).json({ ok: true, huecos: rows });
    }

    if (req.method === 'POST') {
      if (!sesionAdminValida(req)) {
        return error(res, 401, 'Sesión de administrador no válida o caducada');
      }
      const { huecos } = leerCuerpo(req);
      for (const h of huecos || []) {
        const equipo = String(h.equipo || '').trim().slice(0, 8);
        await sql`
          INSERT INTO cuadro_eliminatorio (partido_id, lado, equipo, actualizado)
          VALUES (${h.partidoId}, ${h.lado}, ${equipo}, now())
          ON CONFLICT (partido_id, lado)
          DO UPDATE SET equipo = EXCLUDED.equipo, actualizado = now()
        `;
      }
      return res.status(200).json({ ok: true });
    }

    return error(res, 405, 'Método no permitido');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
