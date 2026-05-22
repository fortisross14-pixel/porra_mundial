/* /api/admin-login
 *  POST { accion: 'entrar', codigo }  -> valida el código de admin.
 *        Si es correcto, entrega una cookie de sesión httpOnly firmada.
 *        El código NO vuelve a viajar después: solo viaja la cookie.
 *  POST { accion: 'salir' }           -> borra la cookie de sesión.
 *  GET                                -> dice si hay sesión válida.
 *
 *  Lleva un límite simple de intentos fallidos para frenar a quien
 *  intente adivinar el código a fuerza bruta.
 */
import {
  leerCuerpo, error,
  codigoAdminCorrecto, crearCookieSesion, cookieCerrarSesion, sesionAdminValida,
} from './_lib/helpers.js';

// Límite de intentos en memoria. Es por instancia (no perfecto en
// serverless), pero suficiente para frenar un ataque manual de un amigo.
const intentos = new Map(); // ip -> { fallos, hasta }
const MAX_FALLOS = 5;
const BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos

function ipDe(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, sesion: sesionAdminValida(req) });
  }
  if (req.method !== 'POST') return error(res, 405, 'Método no permitido');

  const { accion, codigo } = leerCuerpo(req);

  if (accion === 'salir') {
    res.setHeader('Set-Cookie', cookieCerrarSesion());
    return res.status(200).json({ ok: true });
  }

  if (accion === 'entrar') {
    const ip = ipDe(req);
    const reg = intentos.get(ip);
    if (reg && reg.hasta > Date.now()) {
      const min = Math.ceil((reg.hasta - Date.now()) / 60000);
      return error(res, 429, `Demasiados intentos. Espera ${min} min.`);
    }

    if (!codigoAdminCorrecto(codigo)) {
      const fallos = (reg?.fallos || 0) + 1;
      intentos.set(ip, {
        fallos,
        hasta: fallos >= MAX_FALLOS ? Date.now() + BLOQUEO_MS : 0,
      });
      return error(res, 403, 'Código de administrador incorrecto');
    }

    intentos.delete(ip); // login correcto: limpia el contador
    res.setHeader('Set-Cookie', crearCookieSesion());
    return res.status(200).json({ ok: true });
  }

  return error(res, 400, 'Acción no válida');
}
