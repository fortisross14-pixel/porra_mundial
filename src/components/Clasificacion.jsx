import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { puntosPartidoGrupo } from '../../puntuacion.js';

/* Clasificación general de la porra. Solo se muestra cuando la fase
 * está cerrada. Calcula los puntos en el cliente usando puntuacion.js
 * (así la lógica de puntos vive en un solo archivo editable).
 *
 * Nota: aquí se suman los puntos de ACIERTOS DE MARCADOR. El bonus por
 * posiciones de grupo y terceros se añadirá cuando estén cargados los
 * resultados reales completos de la fase de grupos.
 */
export default function Clasificacion({ sesion, fase }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setDatos(await api.clasificacion(sesion.codigo, fase.id));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [sesion, fase]);

  if (error) return <div className="tarjeta"><div className="aviso error">{error}</div></div>;
  if (!datos) return <div className="tarjeta">Cargando clasificación…</div>;

  if (!datos.bloqueada) {
    return (
      <div className="tarjeta">
        <h2>Clasificación</h2>
        <p className="aviso info">{datos.mensaje}</p>
      </div>
    );
  }

  // Mapa de resultados reales por partido.
  const reales = {};
  for (const r of datos.resultados) {
    reales[r.partido_id] = { local: r.goles_local, visitante: r.goles_visitante };
  }

  // Suma de puntos de marcador por jugador.
  const puntosPorJugador = {};
  for (const j of datos.jugadores) puntosPorJugador[j.id] = 0;
  for (const p of datos.predicciones) {
    const real = reales[p.partido_id];
    if (!real) continue;
    puntosPorJugador[p.jugador_id] +=
      puntosPartidoGrupo(
        { local: p.goles_local, visitante: p.goles_visitante },
        real
      );
  }

  const tabla = datos.jugadores
    .map((j) => ({ ...j, puntos: puntosPorJugador[j.id] || 0 }))
    .sort((a, b) => b.puntos - a.puntos);

  return (
    <div className="tarjeta">
      <h2>Clasificación · {fase.nombre}</h2>
      <table className="ranking">
        <tbody>
          {tabla.map((j, i) => (
            <tr key={j.id}>
              <td className="pos">{i + 1}</td>
              <td>{j.usuario}</td>
              <td>{j.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="aviso info" style={{ marginTop: 14 }}>
        Puntos por aciertos de marcador. El bonus por posiciones de grupo y
        por el ranking de terceros se sumará al completarse todos los
        resultados de la fase.
      </p>
    </div>
  );
}
