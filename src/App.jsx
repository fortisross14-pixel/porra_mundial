import { useState } from 'react';
import Acceso from './components/Acceso.jsx';
import Pronostico from './components/Pronostico.jsx';
import Clasificacion from './components/Clasificacion.jsx';

export default function App() {
  const [sesion, setSesion] = useState(null); // { codigo, porra, fases, jugador }
  const [vista, setVista] = useState('pronostico');
  const [faseId, setFaseId] = useState(null);

  const fase = sesion?.fases.find((f) => f.id === faseId) || sesion?.fases[0];

  return (
    <div className="contenedor">
      <header className="cabecera">
        <div className="kicker">Mundial 2026 · Tradición familiar</div>
        <h1>La <em>Porra</em></h1>
      </header>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span>
                <strong>{sesion.porra.nombre}</strong> · {sesion.jugador.usuario}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
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
                <select value={fase?.id} onChange={(e) => setFaseId(Number(e.target.value))}>
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

      <div className="pie">La Porra Mundial · hecho en familia</div>
    </div>
  );
}
