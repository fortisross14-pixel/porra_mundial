/* POST /api/admin
 *  Acciones de administrador. Protegidas por la cookie de sesión
 *  (no por el código: el código solo se usó una vez al hacer login).
 *
 *  Campo "accion":
 *   'resultado' -> guardar/actualizar el marcador real de un partido
 *   'fase'      -> abrir o cerrar una fase (bloqueo manual)
 *   'crearFase' -> crear una fase nueva (ej. la eliminatoria)
 */
import { sql, leerCuerpo, error, sesionAdminValida } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return error(res, 405, 'Método no permitido');

  // Toda acción de admin exige una sesión válida.
  if (!sesionAdminValida(req)) {
    return error(res, 401, 'Sesión de administrador no válida o caducada');
  }

  try {
    const cuerpo = leerCuerpo(req);
    const { accion } = cuerpo;

    if (accion === 'resultado') {
      const { partidoId, golesLocal, golesVisitante } = cuerpo;
      if (golesLocal == null || golesVisitante == null) {
        return error(res, 400, 'Faltan los goles');
      }
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
      // Bloqueo/desbloqueo manual de una fase.
      const { faseId, abierta } = cuerpo;
      await sql`UPDATE fases SET abierta = ${abierta} WHERE id = ${faseId}`;
      return res.status(200).json({ ok: true });
    }

    if (accion === 'crearFase') {
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

    if (accion === 'guardarPuntos') {
      // valores = [{ ronda, concepto, puntos }, ...]
      const { valores, cuadroHonor } = cuerpo;
      for (const v of valores || []) {
        const n = Math.max(0, parseInt(v.puntos, 10) || 0);
        await sql`
          INSERT INTO valores_puntos (ronda, concepto, puntos)
          VALUES (${v.ronda}, ${v.concepto}, ${n})
          ON CONFLICT (ronda, concepto)
          DO UPDATE SET puntos = EXCLUDED.puntos
        `;
      }
      if (cuadroHonor != null) {
        const n = Math.max(0, parseInt(cuadroHonor, 10) || 0);
        await sql`UPDATE valor_cuadro_honor SET puntos = ${n} WHERE unico = true`;
      }
      return res.status(200).json({ ok: true });
    }

    if (accion === 'borrarJugador') {
      // Borra UN jugador concreto y todo lo suyo (predicciones,
      // desempates, cuadro de honor). La porra y el resto de
      // jugadores no se tocan. Se usa para eliminar una inscripción
      // duplicada o abandonada.
      const { jugadorId } = cuerpo;
      await sql`DELETE FROM predicciones WHERE jugador_id = ${jugadorId}`;
      await sql`DELETE FROM desempates WHERE jugador_id = ${jugadorId}`;
      await sql`DELETE FROM cuadro_honor WHERE jugador_id = ${jugadorId}`;
      await sql`DELETE FROM jugadores WHERE id = ${jugadorId}`;
      return res.status(200).json({ ok: true });
    }

    return error(res, 400, 'Acción no válida');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
