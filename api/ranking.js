/* GET /api/ranking?codigo=...&faseId=...
 *  Devuelve todo lo necesario para las pantallas de Resultados:
 *   - jugadores de la porra
 *   - predicciones de todos (de esa fase)
 *   - desempates de todos
 *   - resultados reales
 *   - valores de puntos
 *   - cuadro de honor (respuestas de cada jugador + respuestas correctas)
 *
 *  El cálculo de puntos se hace en el frontend con puntuacion.js, para
 *  que la lógica viva en un solo sitio.
 *
 *  IMPORTANTE: solo entrega las predicciones de los DEMÁS cuando la
 *  fase está cerrada (bloqueo manual). Mientras está abierta, cada
 *  jugador solo ve lo suyo, para que nadie copie.
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

    const bloqueada = !fase.abierta;

    const { rows: jugadores } = await sql`
      SELECT id, usuario FROM jugadores WHERE porra_id = ${porra.id} ORDER BY usuario
    `;
    const { rows: resultados } = await sql`SELECT * FROM resultados`;
    const { rows: valores } = await sql`SELECT ronda, concepto, puntos FROM valores_puntos`;
    const { rows: chValor } = await sql`SELECT puntos FROM valor_cuadro_honor LIMIT 1`;
    const { rows: chCorrecto } = await sql`SELECT campo, valor FROM cuadro_honor_correcto`;

    // Predicciones y desempates: de todos si está cerrada; nada si abierta.
    let predicciones = [];
    let desempates = [];
    let cuadroHonor = [];
    if (bloqueada) {
      const ids = jugadores.map((j) => j.id);
      if (ids.length) {
        predicciones = (await sql`
          SELECT jugador_id, partido_id, goles_local, goles_visitante
          FROM predicciones WHERE fase_id = ${faseId}
        `).rows;
        desempates = (await sql`
          SELECT jugador_id, ambito, clave_empate, orden
          FROM desempates WHERE fase_id = ${faseId}
        `).rows;
        cuadroHonor = (await sql`
          SELECT jugador_id, campo, valor FROM cuadro_honor
          WHERE jugador_id = ANY(${ids})
        `).rows;
      }
    }

    return res.status(200).json({
      ok: true,
      bloqueada,
      jugadores,
      predicciones,
      desempates,
      resultados,
      valores,
      cuadroHonorValor: chValor[0]?.puntos ?? 10,
      cuadroHonorCorrecto: chCorrecto,
      cuadroHonor,
    });
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
