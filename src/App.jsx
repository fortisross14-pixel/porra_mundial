import { useState } from 'react';
import Acceso from './components/Acceso.jsx';
import Pronostico from './components/Pronostico.jsx';
import PronosticoElim from './components/PronosticoElim.jsx';
import CuadroHonor from './components/CuadroHonor.jsx';
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
  const [faseId, setFaseId] = useState(null);

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

  const tabs = [
    ['pronostico', 'Mi pronóstico'],
    ['cuadro', 'Cuadro de honor'],
    ['resultados', 'Resultados'],
  ];

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

              {sesion.fases.length > 1 && (
                <>
                  <label>Fase</label>
                  <select value={fase?.id}
                    onChange={(e) => setFaseId(Number(e.target.value))}>
                    {sesion.fases.map((f) => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {fase && vista === 'pronostico' && (
              /eliminatoria/i.test(fase.nombre || '')
                ? <PronosticoElim sesion={sesion} fase={fase} />
                : <Pronostico sesion={sesion} fase={fase} />
            )}
            {fase && vista === 'cuadro' && <CuadroHonor sesion={sesion} fase={fase} />}
            {fase && vista === 'resultados' && <Resultados sesion={sesion} fase={fase} />}
          </>
        )}

        <div className="pie">Porra Mundial · Mundial 2026</div>
      </div>
    </>
  );
}
