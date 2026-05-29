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

    // Cambiar PIN: el jugador ya identificado cambia su propio PIN.
    // Se trata antes que el resto porque no envía 'usuario'.
    if (modo === 'cambiarPin') {
      const { jugadorId, pinActual, pinNuevo } = leerCuerpo(req);
      if (!/^[A-Za-z0-9]{5,8}$/.test(String(pinNuevo || ''))) {
        return error(res, 400, 'El PIN nuevo debe tener entre 5 y 8 letras o números');
      }
      if (String(pinNuevo) === '00000') {
        return error(res, 400, 'Ese PIN no está permitido, elige otro');
      }
      const { rows } = await sql`
        SELECT pin FROM jugadores WHERE id = ${jugadorId} AND porra_id = ${porra.id}
      `;
      if (!rows.length) return error(res, 404, 'Jugador no encontrado');
      if (rows[0].pin !== String(pinActual)) {
        return error(res, 403, 'El PIN actual no es correcto');
      }
      await sql`UPDATE jugadores SET pin = ${String(pinNuevo)} WHERE id = ${jugadorId}`;
      return res.status(200).json({ ok: true });
    }

    const usuarioNorm = normalizar(usuario);
    if (!usuarioNorm) return error(res, 400, 'Falta el nombre de usuario');
    // El PIN debe tener entre 5 y 8 caracteres alfanuméricos
    // (letras y números, sin símbolos). Es sensible a mayúsculas.
    if (modo === 'registrar' && !/^[A-Za-z0-9]{5,8}$/.test(String(pin || ''))) {
      return error(res, 400, 'El PIN debe tener entre 5 y 8 letras o números (sin símbolos)');
    }
    if (!pin) {
      return error(res, 400, 'Falta el PIN');
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
      // Si el PIN es el temporal '00000', el jugador entra pero debe
      // elegir un PIN nuevo antes de continuar.
      if (existe[0].pin === '00000') {
        return res.status(200).json({
          ok: true,
          debeCambiarPin: true,
          jugador: { id: existe[0].id, usuario: existe[0].usuario },
        });
      }
      return res.status(200).json({
        ok: true,
        jugador: { id: existe[0].id, usuario: existe[0].usuario },
      });
    }

    if (modo === 'cambiarPin') {
      // (ya tratado arriba)
      return error(res, 400, 'Modo no válido');
    }

    return error(res, 400, 'Modo no válido');
  } catch (e) {
    return error(res, 500, 'Error del servidor: ' + e.message);
  }
}
