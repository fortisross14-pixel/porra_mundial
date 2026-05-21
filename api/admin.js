/* POST /api/admin
 *  Acciones reservadas al administrador (Oscar). Protegidas por
 *  ADMIN_CODE, una variable de entorno secreta de Vercel.
 *
 *  Campo "accion":
 *   'resultado'   -> guardar/actualizar el marcador real de un partido
 *   'fase'        -> abrir/cerrar una fase o cambiar su fecha límite
 *   'crearFase'   -> crear la Fase Eliminatoria cuando acaben los grupos
 */
import { sql, esAdmin, leerCuerpo, error } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return error(res, 405, 'Método no permitido');

  try {
    const cuerpo = leerCuerpo(req);
    if (!esAdmin(cuerpo.adminCode)) return error(res, 403, 'Acceso de admin denegado');

    const { accion } = cuerpo;

    if (accion === 'resultado') {
      const { partidoId, golesLocal, golesVisitante } = cuerpo;
      await sql`
        INSERT INTO resultados (partido_id, goles_local, goles_visitante, actualizado)
        VALUES (${partidoId}, ${golesLocal}, ${golesVisitante}, now())
        ON CONFLICT (partido_id)
        DO UPDATE SET goles_local = EXCLUDED.goles_local,
                      goles_visitante = EXCLUDED.goles_visitante,
                      actualizado = now()
      `;
      return res.status(200).json({ ok: true });
    }

    if (accion === 'fase') {
      const { faseId, abierta, fechaLimite } = cuerpo;
      await sql`
        UPDATE fases
        SET abierta = COALESCE(${abierta}, abierta),
            fecha_limite = COALESCE(${fechaLimite}, fecha_limite)
        WHERE id = ${faseId}
      `;
      return res.status(200).json({ ok: true });
    }

    if (accion === 'crearFase') {
      // Crea una fase nueva (ej. la eliminatoria) en TODAS las porras.
      const { nombre, fechaLimite } = cuerpo;
      const { rows: porras } = await sql`SELECT id FROM porras`;
      for (const p of porras) {
        await sql`
          INSERT INTO fases (porra_id, nombre, fecha_limite, abierta)
          VALUES (${p.id}, ${nombre}, ${fechaLimite}, false)
        `;
      }
      return res.status(200).json({ ok: true, creadas: porras.length });
    }

    return error(res, 400, 'Acción no válida');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
