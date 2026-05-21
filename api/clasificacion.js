/* GET /api/clasificacion?codigo=...&faseId=...
 *  Devuelve los datos en crudo necesarios para calcular la tabla
 *  de puntos: predicciones de todos los jugadores + resultados reales.
 *  El cálculo de puntos lo hace el frontend con puntuacion.js, para
 *  que la lógica de puntos viva en un solo sitio editable.
 *
 *  Solo entrega las predicciones de los demás cuando la fase está
 *  cerrada (o pasó la fecha límite): así nadie copia antes de tiempo.
 */
import { sql, porraPorCodigo, error } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return error(res, 405, 'Método no permitido');

  try {
    const { codigo, faseId } = req.query;
    const porra = await porraPorCodigo(codigo);
    if (!porra) return error(res, 403, 'Código no válido');

    const { rows: fr } = await sql`SELECT * FROM fases WHERE id = ${faseId}`;
    const fase = fr[0];
    if (!fase || fase.porra_id !== porra.id) {
      return error(res, 404, 'Fase no encontrada en esta porra');
    }

    const bloqueada =
      !fase.abierta ||
      (fase.fecha_limite && new Date(fase.fecha_limite) < new Date());

    if (!bloqueada) {
      return res.status(200).json({
        ok: true,
        bloqueada: false,
        mensaje: 'La clasificación se mostrará cuando cierre la fase.',
      });
    }

    const { rows: jugadores } = await sql`
      SELECT id, usuario FROM jugadores WHERE porra_id = ${porra.id}
    `;
    const { rows: predicciones } = await sql`
      SELECT p.jugador_id, p.partido_id, p.goles_local, p.goles_visitante
      FROM predicciones p
      WHERE p.fase_id = ${faseId}
    `;
    const { rows: desempates } = await sql`
      SELECT jugador_id, ambito, clave_empate, orden
      FROM desempates WHERE fase_id = ${faseId}
    `;
    const { rows: resultados } = await sql`SELECT * FROM resultados`;

    return res.status(200).json({
      ok: true,
      bloqueada: true,
      jugadores,
      predicciones,
      desempates,
      resultados,
    });
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
