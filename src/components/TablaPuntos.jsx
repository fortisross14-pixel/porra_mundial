/* Tabla de valores de puntos.
 *  - modo lectura: la usa el popup de Ayuda (jugadores).
 *  - modo edición: la usa el panel de admin (inputs numéricos).
 *
 *  `valores` = { ronda: { concepto: puntos } }
 */

// Orden y nombres legibles de las rondas.
export const RONDAS = [
  { id: 'grupos',        nombre: 'Grupos',          tieneClasificado: true },
  { id: 'dieciseisavos', nombre: 'Dieciseisavos',   tieneClasificado: true },
  { id: 'octavos',       nombre: 'Octavos',         tieneClasificado: true },
  { id: 'cuartos',       nombre: 'Cuartos',         tieneClasificado: true },
  { id: 'semifinal',     nombre: 'Semifinales',     tieneClasificado: true },
  { id: 'final',         nombre: 'Final',           tieneClasificado: false },
  { id: 'tercer_puesto', nombre: '3.er/4.º puesto', tieneClasificado: false },
];

export default function TablaPuntos({ valores, editable = false, alCambiar, cuadroHonor, alCambiarCuadro }) {
  function celda(ronda, concepto, disponible) {
    if (!disponible) return <td style={{ color: '#c2c4cc' }}>—</td>;
    const v = valores?.[ronda]?.[concepto] ?? 0;
    if (!editable) return <td>{v}</td>;
    return (
      <td>
        <input
          type="number"
          min="0"
          value={v}
          onChange={(e) => alCambiar(ronda, concepto, e.target.value)}
        />
      </td>
    );
  }

  return (
    <>
      <table className="tabla-puntos">
        <thead>
          <tr>
            <th>Ronda</th>
            <th>1X2</th>
            <th>Resultado exacto</th>
            <th>Equipo clasificado</th>
          </tr>
        </thead>
        <tbody>
          {RONDAS.map((r) => (
            <tr key={r.id}>
              <td>{r.nombre}</td>
              {celda(r.id, '1x2', true)}
              {celda(r.id, 'exacto', true)}
              {celda(r.id, 'clasificado', r.tieneClasificado)}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="tabla-puntos" style={{ marginTop: 14 }}>
        <tbody>
          <tr>
            <td>Cuadro de honor (por acierto)</td>
            {editable ? (
              <td>
                <input
                  type="number"
                  min="0"
                  value={cuadroHonor ?? 10}
                  onChange={(e) => alCambiarCuadro(e.target.value)}
                />
              </td>
            ) : (
              <td>{cuadroHonor ?? 10}</td>
            )}
          </tr>
        </tbody>
      </table>

      {!editable && (
        <p className="aviso info" style={{ marginTop: 14 }}>
          El <strong>resultado exacto</strong> se suma <em>además</em> del 1X2:
          acertar el marcador exacto da 1X2 + resultado exacto. El{' '}
          <strong>equipo clasificado</strong> se gana por cada equipo colocado
          en su posición exacta de la tabla.
        </p>
      )}
    </>
  );
}
