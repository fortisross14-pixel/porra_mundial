/* /api/cuadro-honor
 *  GET  ?codigo=...&jugadorId=...  -> las 6 respuestas guardadas del jugador
 *  POST { codigo, jugadorId, respuestas } -> guarda las respuestas
 *
 *  respuestas = { campeon, subcampeon, tercero, cuarto, goleador, mejor_jugador }
 *  Solo se puede editar mientras la fase de grupos esté abierta
 *  (mismo criterio que el pronóstico: bloqueo manual del organizador).
 */
import { sql, porraPorCodigo, leerCuerpo, error } from './_lib/helpers.js';

const CAMPOS = ['campeon', 'subcampeon', 'tercero', 'cuarto', 'goleador', 'mejor_jugador'];

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { codigo, jugadorId } = req.query;
      if (!(await porraPorCodigo(codigo))) return error(res, 403, 'Código no válido');
      const { rows } = await sql`
        SELECT campo, valor FROM cuadro_honor WHERE jugador_id = ${jugadorId}
      `;
      const respuestas = {};
      for (const r of rows) respuestas[r.campo] = r.valor;
      return res.status(200).json({ ok: true, respuestas });
    }

    if (req.method === 'POST') {
      const { codigo, jugadorId, respuestas } = leerCuerpo(req);
      if (!(await porraPorCodigo(codigo))) return error(res, 403, 'Código no válido');

      // ¿La fase de grupos de esta porra está abierta?
      const porra = await porraPorCodigo(codigo);
      const { rows: fr } = await sql`
        SELECT abierta FROM fases WHERE porra_id = ${porra.id} ORDER BY id LIMIT 1
      `;
      if (!fr[0] || !fr[0].abierta) {
        return error(res, 423, 'La fase está cerrada: el cuadro de honor ya no se puede editar');
      }

      for (const campo of CAMPOS) {
        const valor = String(respuestas?.[campo] ?? '').trim().slice(0, 120);
        await sql`
          INSERT INTO cuadro_honor (jugador_id, campo, valor, actualizado)
          VALUES (${jugadorId}, ${campo}, ${valor}, now())
          ON CONFLICT (jugador_id, campo)
          DO UPDATE SET valor = EXCLUDED.valor, actualizado = now()
        `;
      }
      return res.status(200).json({ ok: true });
    }

    return error(res, 405, 'Método no permitido');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
