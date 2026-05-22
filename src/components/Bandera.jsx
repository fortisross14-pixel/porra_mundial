import { EQUIPOS } from '../../data/partidos.js';

/* Bandera de un equipo, servida por flagcdn según su código ISO.
 * Si la imagen no carga, se oculta sin romper la interfaz.
 */
export default function Bandera({ code, ancho = 40 }) {
  const eq = EQUIPOS[code];
  if (!eq) return null;
  return (
    <img
      className="bandera"
      src={`https://flagcdn.com/w${ancho}/${eq.iso}.png`}
      alt={eq.nombre}
      loading="lazy"
      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
    />
  );
}
