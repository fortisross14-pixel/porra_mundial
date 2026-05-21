/* =============================================================
 *  MOTOR DE CLASIFICACIÓN  (clasificacion.js)
 * =============================================================
 *
 *  Convierte una lista de marcadores (predichos o reales) en una
 *  tabla de grupo ordenada. Aplica los criterios OBJETIVOS:
 *     1. Puntos
 *     2. Diferencia de goles
 *     3. Goles a favor
 *
 *  Si tras esos tres criterios quedan equipos EMPATADOS, NO los
 *  resuelve: los marca como "empate sin resolver" para que el
 *  jugador decida el orden manualmente. Es un juego de adivinar.
 *
 *  También calcula el ranking cruzado de los 12 terceros con la
 *  misma lógica.
 * ============================================================= */

// Tabla de un grupo a partir de los partidos.
// `equipos`  = array de códigos de equipo del grupo (ej. ['ESP','URU',...])
// `partidos` = array de { local, visitante, golesLocal, golesVisitante }
//              (los goles pueden ser null si aún no se han predicho/jugado)
export function calcularTablaGrupo(equipos, partidos) {
  const stats = {};
  for (const eq of equipos) {
    stats[eq] = { equipo: eq, pj: 0, pts: 0, gf: 0, gc: 0, dg: 0 };
  }

  for (const p of partidos) {
    if (p.golesLocal == null || p.golesVisitante == null) continue;
    const L = stats[p.local];
    const V = stats[p.visitante];
    if (!L || !V) continue;

    L.pj++; V.pj++;
    L.gf += p.golesLocal; L.gc += p.golesVisitante;
    V.gf += p.golesVisitante; V.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) L.pts += 3;
    else if (p.golesLocal < p.golesVisitante) V.pts += 3;
    else { L.pts += 1; V.pts += 1; }
  }

  for (const eq of equipos) {
    stats[eq].dg = stats[eq].gf - stats[eq].gc;
  }

  return ordenarConEmpates(Object.values(stats));
}

// Ordena por puntos -> dif. goles -> goles a favor.
// Devuelve { filas, gruposEmpatados } donde gruposEmpatados es una
// lista de clusters de equipos que quedan IDÉNTICOS en esos 3 criterios
// y necesitan que el jugador los ordene a mano.
export function ordenarConEmpates(filas) {
  const ordenadas = [...filas].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0; // empate real -> lo decide el jugador
  });

  const gruposEmpatados = [];
  let i = 0;
  while (i < ordenadas.length) {
    let j = i + 1;
    while (
      j < ordenadas.length &&
      ordenadas[j].pts === ordenadas[i].pts &&
      ordenadas[j].dg === ordenadas[i].dg &&
      ordenadas[j].gf === ordenadas[i].gf
    ) {
      j++;
    }
    if (j - i > 1) {
      gruposEmpatados.push({
        posicionInicio: i,           // índice 0-based donde empieza el empate
        equipos: ordenadas.slice(i, j).map((f) => f.equipo),
      });
    }
    i = j;
  }

  return { filas: ordenadas, gruposEmpatados };
}

// Aplica el orden manual elegido por el jugador sobre una tabla.
// `tabla`       = resultado de calcularTablaGrupo
// `ordenManual` = { "<equipoA,equipoB>": ['equipoB','equipoA'], ... }
//                 clave = equipos empatados ordenados alfabéticamente y unidos por coma
// Devuelve el array final de equipos de 1º a 4º.
export function aplicarOrdenManual(tabla, ordenManual = {}) {
  const filas = [...tabla.filas];
  for (const cluster of tabla.gruposEmpatados) {
    const clave = [...cluster.equipos].sort().join(',');
    const eleccion = ordenManual[clave];
    if (!eleccion) continue; // sin resolver: se queda el orden por defecto
    for (let k = 0; k < cluster.equipos.length; k++) {
      filas[cluster.posicionInicio + k] = tabla.filas.find(
        (f) => f.equipo === eleccion[k]
      );
    }
  }
  return filas.map((f) => f.equipo);
}

// Clave canónica de un cluster de empate (para guardar/leer la elección
// del jugador de forma estable, sin importar el orden de entrada).
export function claveEmpate(equipos) {
  return [...equipos].sort().join(',');
}

// Ranking cruzado de los 12 terceros.
// `terceros` = array de filas de stats (las mismas que produce el motor),
//              una por cada equipo que quedó 3º en su grupo.
// Devuelve { filas, gruposEmpatados } igual que ordenarConEmpates.
// Los 8 primeros de este ranking son los terceros que clasifican.
export function calcularRankingTerceros(terceros) {
  return ordenarConEmpates(terceros);
}
