import { useState } from 'react';
import Acceso from './components/Acceso.jsx';
import Pronostico from './components/Pronostico.jsx';
import Clasificacion from './components/Clasificacion.jsx';
import Admin from './components/Admin.jsx';

/* Cabecera: logo a la izquierda + "Porra Mundial" / "Mundial 2026".
 * El logo se carga desde /logo.png (pon el archivo en public/).
 * Si no existe, se muestra un recuadro con las iniciales "PM".
 */
function Barra() {
  const [logoFalla, setLogoFalla] = useState(false);
  return (
    <div className="barra">
      {logoFalla ? (
        <div className="logo-fallback">PM</div>
      ) : (
        <img
          className="logo"
          src="/logo.png"
          alt="Logo"
          onError={() => setLogoFalla(true)}
        />
      )}
      <div className="titulos">
        <h1>Porra Mundial</h1>
        <div className="sub">Mundial 2026</div>
      </div>
    </div>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(null); // { codigo, porra, fases, jugador }
  const [vista, setVista] = useState('pronostico');
  const [faseId, setFaseId] = useState(null);

  // Si la URL es /admin, se muestra la pantalla de administración.
  const esAdmin = typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/$/, '') === '/admin';

  const fase = sesion?.fases.find((f) => f.id === faseId) || sesion?.fases[0];

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

  return (
    <>
      <Barra />
      <div className="contenedor">
        {!sesion && (
          <Acceso
            alEntrar={(s) => {
              setSesion(s);
              setFaseId(s.fases[0]?.id ?? null);
            }}
          />
        )}

        {sesion && (
          <>
            <div className="tarjeta">
              <div className="fila-cuenta">
                <span>
                  <strong>{sesion.porra.nombre}</strong> · {sesion.jugador.usuario}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={'btn ' + (vista === 'pronostico' ? '' : 'secundario')}
                    onClick={() => setVista('pronostico')}
                  >
                    Mi pronóstico
                  </button>
                  <button
                    className={'btn ' + (vista === 'clasificacion' ? '' : 'secundario')}
                    onClick={() => setVista('clasificacion')}
                  >
                    Clasificación
                  </button>
                </div>
              </div>

              {sesion.fases.length > 1 && (
                <>
                  <label>Fase</label>
                  <select
                    value={fase?.id}
                    onChange={(e) => setFaseId(Number(e.target.value))}
                  >
                    {sesion.fases.map((f) => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {fase && vista === 'pronostico' && <Pronostico sesion={sesion} fase={fase} />}
            {fase && vista === 'clasificacion' && <Clasificacion sesion={sesion} fase={fase} />}
          </>
        )}

        <div className="pie">Porra Mundial · Mundial 2026</div>
      </div>
    </>
  );
}
