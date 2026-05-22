/* /api/pronostico
 *  GET  ?codigo=...&jugadorId=...&faseId=...
 *       -> devuelve las predicciones y desempates guardados del jugador.
 *  POST { codigo, jugadorId, faseId, predicciones, desempates }
 *       -> guarda/actualiza el pronóstico. Solo si la fase sigue abierta
 *          y dentro de la fecha límite.
 */
import { sql, porraPorCodigo, leerCuerpo, error } from './_lib/helpers.js';

async function faseEditable(faseId) {
  // El bloqueo es MANUAL: una fase se puede editar mientras 'abierta'
  // sea true, sin importar la fecha límite (que es solo informativa).
  const { rows } = await sql`SELECT * FROM fases WHERE id = ${faseId}`;
  const fase = rows[0];
  if (!fase) return { ok: false, motivo: 'La fase no existe' };
  if (!fase.abierta) return { ok: false, motivo: 'La fase está cerrada' };
  return { ok: true, fase };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { codigo, jugadorId, faseId } = req.query;
      if (!(await porraPorCodigo(codigo))) return error(res, 403, 'Código no válido');

      const { rows: predicciones } = await sql`
        SELECT partido_id, goles_local, goles_visitante
        FROM predicciones
        WHERE jugador_id = ${jugadorId} AND fase_id = ${faseId}
      `;
      const { rows: desempates } = await sql`
        SELECT ambito, clave_empate, orden
        FROM desempates
        WHERE jugador_id = ${jugadorId} AND fase_id = ${faseId}
      `;
      return res.status(200).json({ ok: true, predicciones, desempates });
    }

    if (req.method === 'POST') {
      const { codigo, jugadorId, faseId, predicciones, desempates } = leerCuerpo(req);
      if (!(await porraPorCodigo(codigo))) return error(res, 403, 'Código no válido');

      const editable = await faseEditable(faseId);
      if (!editable.ok) return error(res, 423, editable.motivo);

      // Guarda cada predicción (insertar o actualizar).
      for (const p of predicciones || []) {
        await sql`
          INSERT INTO predicciones
            (jugador_id, fase_id, partido_id, goles_local, goles_visitante, actualizado)
          VALUES
            (${jugadorId}, ${faseId}, ${p.partidoId}, ${p.golesLocal}, ${p.golesVisitante}, now())
          ON CONFLICT (jugador_id, fase_id, partido_id)
          DO UPDATE SET goles_local = EXCLUDED.goles_local,
                        goles_visitante = EXCLUDED.goles_visitante,
                        actualizado = now()
        `;
      }

      // Guarda los desempates manuales elegidos por el jugador.
      for (const d of desempates || []) {
        await sql`
          INSERT INTO desempates
            (jugador_id, fase_id, ambito, clave_empate, orden)
          VALUES
            (${jugadorId}, ${faseId}, ${d.ambito}, ${d.claveEmpate}, ${JSON.stringify(d.orden)})
          ON CONFLICT (jugador_id, fase_id, ambito, clave_empate)
          DO UPDATE SET orden = EXCLUDED.orden
        `;
      }

      return res.status(200).json({ ok: true });
    }

    return error(res, 405, 'Método no permitido');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
