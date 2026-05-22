/* Utilidades compartidas por las funciones serverless de /api */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

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

// Comprueba el código de administrador (variable de entorno).
export function codigoAdminCorrecto(codigo) {
  const real = process.env.ADMIN_CODE || '';
  if (!codigo || !real) return false;
  // Comparación de tiempo constante para no filtrar info por la duración.
  const a = Buffer.from(String(codigo));
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Respuesta de error uniforme.
export function error(res, status, mensaje) {
  return res.status(status).json({ ok: false, error: mensaje });
}

/* ----------- SESIÓN DE ADMINISTRADOR (cookie httpOnly firmada) -----------
 * Tras un login correcto, el servidor entrega una cookie firmada que el
 * navegador NO puede leer por JavaScript (httpOnly). El código de admin
 * NO viaja en las peticiones siguientes: solo viaja la cookie firmada.
 * La firma usa HMAC con ADMIN_CODE como secreto, así que una cookie
 * falsificada no pasa la verificación.
 */
const DURACION_SESION_MS = 4 * 60 * 60 * 1000; // 4 horas

function firmar(texto) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_CODE || 'sin-secreto')
    .update(texto)
    .digest('hex');
}

// Crea el valor de la cookie de sesión: "<expira>.<firma>".
export function crearCookieSesion() {
  const expira = Date.now() + DURACION_SESION_MS;
  const valor = `${expira}.${firmar(String(expira))}`;
  return [
    `admin_sesion=${valor}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${Math.floor(DURACION_SESION_MS / 1000)}`,
  ].join('; ');
}

// Cookie que borra la sesión (logout).
export function cookieCerrarSesion() {
  return 'admin_sesion=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

// Comprueba que la petición trae una sesión de admin válida y no caducada.
export function sesionAdminValida(req) {
  const cabecera = req.headers.cookie || '';
  const match = cabecera.match(/admin_sesion=([^;]+)/);
  if (!match) return false;
  const [expiraStr, firma] = decodeURIComponent(match[1]).split('.');
  if (!expiraStr || !firma) return false;
  const expira = Number(expiraStr);
  if (!Number.isFinite(expira) || expira < Date.now()) return false;
  const esperada = firmar(expiraStr);
  // Comparación de tiempo constante.
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
