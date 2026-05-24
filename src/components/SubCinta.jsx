/* Cinta secundaria (azul claro) con las agrupaciones de sección.
 * `items` = [{ id, texto }]; `activo` = id seleccionado.
 */
export default function SubCinta({ items, activo, alElegir }) {
  return (
    <div className="sub-cinta">
      {items.map((it) => (
        <button
          key={it.id}
          className={'sub-item ' + (activo === it.id ? 'activo' : '')}
          onClick={() => alElegir(it.id)}
        >
          {it.texto}
        </button>
      ))}
    </div>
  );
}
