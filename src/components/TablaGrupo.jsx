import { calcularTablaGrupo, claveEmpate } from '../lib/clasificacion.js';

/* Muestra la tabla de un grupo calculada en vivo a partir de los
 * marcadores que el jugador va metiendo. Si hay empates objetivos,
 * pide al jugador que ordene esos equipos a mano.
 */
export default function TablaGrupo({ letra, equipos, partidos, predicciones, desempates, alOrdenar }) {
  // Construye los partidos con los goles predichos por el jugador.
  const conGoles = partidos.map((p) => {
    const pr = predicciones[p.id] || {};
    return {
      local: p.local,
      visitante: p.visitante,
      golesLocal: pr.golesLocal ?? null,
      golesVisitante: pr.golesVisitante ?? null,
    };
  });

  const tabla = calcularTablaGrupo(equipos, conGoles);

  // Mueve un equipo dentro de un cluster de empate (subir/bajar).
  function mover(cluster, idx, dir) {
    const clave = claveEmpate(cluster.equipos);
    const actual =
      desempates[`grupo:${letra}|${clave}`] || [...cluster.equipos];
    const nuevo = [...actual];
    const destino = idx + dir;
    if (destino < 0 || destino >= nuevo.length) return;
    [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];
    alOrdenar(`grupo:${letra}`, clave, nuevo);
  }

  function ordenCluster(cluster) {
    const clave = claveEmpate(cluster.equipos);
    return desempates[`grupo:${letra}|${clave}`] || [...cluster.equipos];
  }

  // Para pintar, sustituye los clusters empatados por el orden manual.
  const filas = [...tabla.filas];
  for (const c of tabla.gruposEmpatados) {
    const orden = ordenCluster(c);
    for (let k = 0; k < c.equipos.length; k++) {
      filas[c.posicionInicio + k] = tabla.filas.find((f) => f.equipo === orden[k]);
    }
  }

  return (
    <div className="tarjeta">
      <h2>Grupo {letra}</h2>
      <table className="tabla-grupo">
        <thead>
          <tr>
            <th>Equipo</th><th>PJ</th><th>DG</th><th>GF</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const enEmpate = tabla.gruposEmpatados.some((c) =>
              c.equipos.includes(f.equipo)
            );
            return (
              <tr
                key={f.equipo}
                className={(i < 2 ? 'clasifica ' : '') + (enEmpate ? 'empate' : '')}
              >
                <td>{i + 1}. {f.equipo}</td>
                <td>{f.pj}</td>
                <td>{f.dg > 0 ? '+' + f.dg : f.dg}</td>
                <td>{f.gf}</td>
                <td>{f.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tabla.gruposEmpatados.length > 0 && (
        <div className="aviso info" style={{ marginTop: 14 }}>
          <strong>Hay empate.</strong> Los criterios automáticos (puntos,
          diferencia de goles, goles a favor) no deciden el orden. Ordénalos tú:
          {tabla.gruposEmpatados.map((c) => (
            <div key={claveEmpate(c.equipos)} style={{ marginTop: 10 }}>
              {ordenCluster(c).map((eq, idx) => (
                <div
                  key={eq}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 700 }}>
                    {c.posicionInicio + idx + 1}. {eq}
                  </span>
                  <button
                    className="btn secundario"
                    style={{ padding: '4px 10px' }}
                    onClick={() => mover(c, idx, -1)}
                  >
                    ▲
                  </button>
                  <button
                    className="btn secundario"
                    style={{ padding: '4px 10px' }}
                    onClick={() => mover(c, idx, 1)}
                  >
                    ▼
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
