import { calcularTablaGrupo, claveEmpate } from '../lib/clasificacion.js';
import { nombreEquipo } from '../../data/partidos.js';
import Bandera from './Bandera.jsx';

/* Tabla de un grupo calculada en vivo a partir de los marcadores
 * que el jugador va metiendo. Los empates objetivos se ordenan a mano.
 */
export default function TablaGrupo({ letra, equipos, partidos, predicciones, desempates, alOrdenar }) {
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

  function ordenCluster(cluster) {
    const clave = claveEmpate(cluster.equipos);
    return desempates[`grupo:${letra}|${clave}`] || [...cluster.equipos];
  }

  function mover(cluster, idx, dir) {
    const clave = claveEmpate(cluster.equipos);
    const actual = ordenCluster(cluster);
    const nuevo = [...actual];
    const destino = idx + dir;
    if (destino < 0 || destino >= nuevo.length) return;
    [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];
    alOrdenar(`grupo:${letra}`, clave, nuevo);
  }

  // Aplica el orden manual sobre la tabla para pintarla.
  const filas = [...tabla.filas];
  for (const c of tabla.gruposEmpatados) {
    const orden = ordenCluster(c);
    for (let k = 0; k < c.equipos.length; k++) {
      filas[c.posicionInicio + k] = tabla.filas.find((f) => f.equipo === orden[k]);
    }
  }

  return (
    <div className="tarjeta">
      <h3>Clasificación · Grupo {letra}</h3>
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
                <td>
                  <span className="equipo-celda">
                    <span className="pos">{i + 1}</span>
                    <Bandera code={f.equipo} ancho={40} />
                    {nombreEquipo(f.equipo)}
                  </span>
                </td>
                <td>{f.pj}</td>
                <td>{f.dg > 0 ? '+' + f.dg : f.dg}</td>
                <td>{f.gf}</td>
                <td className="pts">{f.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tabla.gruposEmpatados.length > 0 && (
        <div className="aviso falta" style={{ marginTop: 14 }}>
          <strong>Hay empate.</strong> Los criterios automáticos (puntos,
          diferencia de goles, goles a favor) no deciden el orden. Ordénalos tú:
          {tabla.gruposEmpatados.map((c) => (
            <div key={claveEmpate(c.equipos)} style={{ marginTop: 10 }}>
              {ordenCluster(c).map((eq, idx) => (
                <div key={eq} className="empate-fila">
                  <span className="nombre">
                    <strong>{c.posicionInicio + idx + 1}.</strong>
                    <Bandera code={eq} ancho={40} />
                    {nombreEquipo(eq)}
                  </span>
                  <button className="btn-mini" onClick={() => mover(c, idx, -1)}>▲</button>
                  <button className="btn-mini" onClick={() => mover(c, idx, 1)}>▼</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
