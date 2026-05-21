/* Cliente sencillo para hablar con las funciones de /api */

async function pedir(url, opciones) {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok || datos.ok === false) {
    throw new Error(datos.error || 'Error de conexión');
  }
  return datos;
}

export const api = {
  acceso: (codigo) =>
    pedir('/api/acceso', { method: 'POST', body: JSON.stringify({ codigo }) }),

  registrar: (codigo, usuario, pin) =>
    pedir('/api/jugador', {
      method: 'POST',
      body: JSON.stringify({ codigo, modo: 'registrar', usuario, pin }),
    }),

  entrar: (codigo, usuario, pin) =>
    pedir('/api/jugador', {
      method: 'POST',
      body: JSON.stringify({ codigo, modo: 'entrar', usuario, pin }),
    }),

  cargarPronostico: (codigo, jugadorId, faseId) =>
    pedir(
      `/api/pronostico?codigo=${encodeURIComponent(codigo)}&jugadorId=${jugadorId}&faseId=${faseId}`
    ),

  guardarPronostico: (payload) =>
    pedir('/api/pronostico', { method: 'POST', body: JSON.stringify(payload) }),

  clasificacion: (codigo, faseId) =>
    pedir(
      `/api/clasificacion?codigo=${encodeURIComponent(codigo)}&faseId=${faseId}`
    ),
};
