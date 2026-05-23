import { useState } from 'react';
import Acceso from './components/Acceso.jsx';
import MiPronostico from './components/MiPronostico.jsx';
import Resultados from './components/Resultados.jsx';
import Admin from './components/Admin.jsx';

/* Cabecera: logo a la izquierda + "Porra Mundial" / "Mundial 2026". */
function Barra() {
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
    </div>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(null); // { codigo, porra, fases, jugador }
  const [vista, setVista] = useState('pronostico');

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

  // Localiza las dos fases por su nombre.
  const faseGrupos = sesion?.fases.find((f) => /grupos/i.test(f.nombre));
  const faseElim = sesion?.fases.find((f) => /eliminatoria/i.test(f.nombre));

  const tabs = [
    ['pronostico', 'Mi pronóstico'],
    ['resultados', 'Resultados'],
  ];

  return (
    <>
      <Barra />
      <div className="contenedor">
        {!sesion && (
          <Acceso alEntrar={(s) => setSesion(s)} />
        )}

        {sesion && (
          <>
            <div className="tarjeta">
              <div className="fila-cuenta">
                <span>
                  <strong>{sesion.porra.nombre}</strong> · {sesion.jugador.usuario}
                </span>
              </div>
              <div className="pestanas" style={{ marginTop: 12, marginBottom: 0 }}>
                {tabs.map(([id, txt]) => (
                  <button
                    key={id}
                    className={'pestana ' + (vista === id ? 'activa' : '')}
                    onClick={() => setVista(id)}
                  >{txt}</button>
                ))}
              </div>
            </div>

            {vista === 'pronostico' && (
              <MiPronostico
                sesion={sesion}
                faseGrupos={faseGrupos}
                faseElim={faseElim}
              />
            )}
            {vista === 'resultados' && (
              <Resultados
                sesion={sesion}
                faseGrupos={faseGrupos}
                faseElim={faseElim}
              />
            )}
          </>
        )}

        <div className="pie">Porra Mundial · Mundial 2026</div>
      </div>
    </>
  );
}
