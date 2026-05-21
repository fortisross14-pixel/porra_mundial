/* Utilidades compartidas por las funciones serverless de /api */
import { sql } from '@vercel/postgres';

export { sql };

// Normaliza un nombre de usuario para comparar (minúsculas, sin espacios extra).
export function normalizar(nombre) {
  return String(nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Lee el cuerpo JSON de la petición de forma segura.
export function leerCuerpo(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
}

// Busca una porra por su código. Devuelve null si el código no es válido.
export async function porraPorCodigo(codigo) {
  if (!codigo) return null;
  const { rows } = await sql`SELECT * FROM porras WHERE codigo = ${codigo}`;
  return rows[0] || null;
}

// Comprueba el código de administrador (guardado como variable de entorno).
export function esAdmin(codigo) {
  return Boolean(codigo) && codigo === process.env.ADMIN_CODE;
}

// Respuesta de error uniforme.
export function error(res, status, mensaje) {
  return res.status(status).json({ ok: false, error: mensaje });
}
