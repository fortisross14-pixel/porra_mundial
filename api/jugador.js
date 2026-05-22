/* POST /api/jugador
 * Dos usos, según el campo "modo":
 *   modo: 'registrar' -> crea un jugador nuevo (usuario + PIN elegidos).
 *   modo: 'entrar'    -> valida usuario + PIN de un jugador existente.
 *
 * El código de la porra decide a qué porra pertenece el jugador.
 * El PIN es la prueba de identidad para poder editar el pronóstico.
 */
import { sql, porraPorCodigo, normalizar, leerCuerpo, error } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return error(res, 405, 'Método no permitido');

  try {
    const { codigo, modo, usuario, pin } = leerCuerpo(req);

    const porra = await porraPorCodigo(codigo);
    if (!porra) return error(res, 403, 'Código no válido');

    const usuarioNorm = normalizar(usuario);
    if (!usuarioNorm) return error(res, 400, 'Falta el nombre de usuario');
    if (!pin || String(pin).length < 3) {
      return error(res, 400, 'El PIN debe tener al menos 3 dígitos');
    }

    const { rows: existe } = await sql`
      SELECT id, usuario, pin FROM jugadores
      WHERE porra_id = ${porra.id} AND usuario_norm = ${usuarioNorm}
    `;

    if (modo === 'registrar') {
      if (existe.length) {
        return error(res, 409, 'Ese nombre ya está registrado en esta porra');
      }
      const { rows } = await sql`
        INSERT INTO jugadores (porra_id, usuario_norm, usuario, pin)
        VALUES (${porra.id}, ${usuarioNorm}, ${String(usuario).trim()}, ${String(pin)})
        RETURNING id, usuario
      `;
      return res.status(200).json({ ok: true, jugador: rows[0] });
    }

    if (modo === 'entrar') {
      if (!existe.length) {
        return error(res, 404, 'No existe ese jugador. ¿Es tu primera vez?');
      }
      if (existe[0].pin !== String(pin)) {
        return error(res, 403, 'PIN incorrecto');
      }
      return res.status(200).json({
        ok: true,
        jugador: { id: existe[0].id, usuario: existe[0].usuario },
      });
    }

    return error(res, 400, 'Modo no válido');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
