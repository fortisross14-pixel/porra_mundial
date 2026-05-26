import { useState } from 'react';
import Acceso from './components/Acceso.jsx';
import MiPronostico from './components/MiPronostico.jsx';
import Resultados from './components/Resultados.jsx';
import Admin from './components/Admin.jsx';

/* Iconos sencillos en SVG (sin dependencias). */
function IconoPronostico() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconoResultados() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconoSalir() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* Cabecera: cinta azul oscuro con logo + navegación principal. */
function Barra({ sesion, vista, setVista, alSalir }) {
  const [logoFalla, setLogoFalla] = useState(false);
  return (
    <div className="barra">
      {logoFalla ? (
        <div className="logo-fallback">PM</div>
      ) : (
        <img className="logo" src="/logo.png" alt="Logo"
          onError={() => setLogoFalla(true)} />
      )}
      <div className="titulos">
        <h1>Porra Mundial</h1>
        <div className="sub">Mundial 2026</div>
      </div>

      {sesion && (
        <nav className="nav-principal">
          <button
            className={'nav-item ' + (vista === 'pronostico' ? 'activo' : '')}
            onClick={() => setVista('pronostico')}
          >
            <IconoPronostico />
            <span>Mi pronóstico</span>
          </button>
          <button
            className={'nav-item ' + (vista === 'resultados' ? 'activo' : '')}
            onClick={() => setVista('resultados')}
          >
            <IconoResultados />
            <span>Resultados</span>
          </button>
          <button className="nav-item nav-salir" onClick={alSalir}>
            <IconoSalir />
            <span>Salir</span>
          </button>
        </nav>
      )}
    </div>
  );
}

// Clave de almacenamiento de la sesión del jugador en el navegador.
const CLAVE_SESION = 'porra_sesion';

// Lee la sesión guardada (si la hay) para no tener que volver a entrar.
function leerSesionGuardada() {
  try {
    const txt = localStorage.getItem(CLAVE_SESION);
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [sesion, setSesion] = useState(leerSesionGuardada);
  const [vista, setVista] = useState('pronostico');

  // Guarda o entra: persiste la sesión en el navegador.
  function entrar(s) {
    setSesion(s);
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch { /* ignora */ }
  }
  // Salir: borra la sesión guardada y vuelve a la pantalla de acceso.
  function salir() {
    setSesion(null);
    try { localStorage.removeItem(CLAVE_SESION); } catch { /* ignora */ }
  }

  const esAdmin = typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/$/, '') === '/admin';

  if (esAdmin) {
    return (
      <>
        <Barra />
        <div className="contenedor">
          <Admin />
          <div className="pie">Porra Mundial · Administración</div>
        </div>
      </>
    );
  }

  const faseGrupos = sesion?.fases.find((f) => /grupos/i.test(f.nombre));
  const faseElim = sesion?.fases.find((f) => /eliminatoria/i.test(f.nombre));

  return (
    <>
      <Barra sesion={sesion} vista={vista} setVista={setVista} alSalir={salir} />
      <div className="contenedor">
        {!sesion && <Acceso alEntrar={entrar} />}

        {sesion && (
          <>
            <div className="cuenta-linea">
              <strong>{sesion.porra.nombre}</strong> · {sesion.jugador.usuario}
            </div>

            {vista === 'pronostico' && (
              <MiPronostico sesion={sesion} faseGrupos={faseGrupos} faseElim={faseElim} />
            )}
            {vista === 'resultados' && (
              <Resultados sesion={sesion} faseGrupos={faseGrupos} faseElim={faseElim} />
            )}
          </>
        )}

        <div className="pie">Porra Mundial · Mundial 2026</div>
      </div>
    </>
  );
}
