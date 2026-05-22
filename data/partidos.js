/* =============================================================
 *  PARTIDOS Y GRUPOS  -  FASE DE GRUPOS DEL MUNDIAL 2026
 *  72 partidos, 12 grupos (A-L), 48 equipos.
 *  'fecha' = hora local de la sede.
 *  EQUIPOS guarda nombre y codigo ISO para la bandera (flagcdn).
 * ============================================================= */

// code -> { nombre, iso }. El iso se usa para la bandera de flagcdn.
export const EQUIPOS = {
  'MEX': { nombre: 'México', iso: 'mx' },
  'RSA': { nombre: 'Sudáfrica', iso: 'za' },
  'KOR': { nombre: 'Corea del Sur', iso: 'kr' },
  'CZE': { nombre: 'Chequia', iso: 'cz' },
  'CAN': { nombre: 'Canadá', iso: 'ca' },
  'BIH': { nombre: 'Bosnia y Herzegovina', iso: 'ba' },
  'USA': { nombre: 'Estados Unidos', iso: 'us' },
  'PAR': { nombre: 'Paraguay', iso: 'py' },
  'HAI': { nombre: 'Haití', iso: 'ht' },
  'SCO': { nombre: 'Escocia', iso: 'gb-sct' },
  'AUS': { nombre: 'Australia', iso: 'au' },
  'TUR': { nombre: 'Turquía', iso: 'tr' },
  'BRA': { nombre: 'Brasil', iso: 'br' },
  'MAR': { nombre: 'Marruecos', iso: 'ma' },
  'QAT': { nombre: 'Catar', iso: 'qa' },
  'SUI': { nombre: 'Suiza', iso: 'ch' },
  'CIV': { nombre: 'Costa de Marfil', iso: 'ci' },
  'ECU': { nombre: 'Ecuador', iso: 'ec' },
  'GER': { nombre: 'Alemania', iso: 'de' },
  'CUW': { nombre: 'Curazao', iso: 'cw' },
  'NED': { nombre: 'Países Bajos', iso: 'nl' },
  'JPN': { nombre: 'Japón', iso: 'jp' },
  'SWE': { nombre: 'Suecia', iso: 'se' },
  'TUN': { nombre: 'Túnez', iso: 'tn' },
  'KSA': { nombre: 'Arabia Saudí', iso: 'sa' },
  'URU': { nombre: 'Uruguay', iso: 'uy' },
  'ESP': { nombre: 'España', iso: 'es' },
  'CPV': { nombre: 'Cabo Verde', iso: 'cv' },
  'IRN': { nombre: 'Irán', iso: 'ir' },
  'NZL': { nombre: 'Nueva Zelanda', iso: 'nz' },
  'BEL': { nombre: 'Bélgica', iso: 'be' },
  'EGY': { nombre: 'Egipto', iso: 'eg' },
  'FRA': { nombre: 'Francia', iso: 'fr' },
  'SEN': { nombre: 'Senegal', iso: 'sn' },
  'IRQ': { nombre: 'Irak', iso: 'iq' },
  'NOR': { nombre: 'Noruega', iso: 'no' },
  'ARG': { nombre: 'Argentina', iso: 'ar' },
  'ALG': { nombre: 'Argelia', iso: 'dz' },
  'AUT': { nombre: 'Austria', iso: 'at' },
  'JOR': { nombre: 'Jordania', iso: 'jo' },
  'GHA': { nombre: 'Ghana', iso: 'gh' },
  'PAN': { nombre: 'Panamá', iso: 'pa' },
  'ENG': { nombre: 'Inglaterra', iso: 'gb-eng' },
  'CRO': { nombre: 'Croacia', iso: 'hr' },
  'POR': { nombre: 'Portugal', iso: 'pt' },
  'COD': { nombre: 'RD Congo', iso: 'cd' },
  'UZB': { nombre: 'Uzbekistán', iso: 'uz' },
  'COL': { nombre: 'Colombia', iso: 'co' },
};

// URL de la bandera de un equipo (ancho 40px). flagcdn sirve por codigo ISO.
export function urlBandera(code, ancho = 40) {
  const eq = EQUIPOS[code];
  if (!eq) return '';
  return `https://flagcdn.com/w${ancho}/${eq.iso}.png`;
}

// Nombre legible de un equipo.
export function nombreEquipo(code) {
  return EQUIPOS[code]?.nombre || code;
}

export const GRUPOS = {
  'A': ['MEX', 'RSA', 'KOR', 'CZE'],
  'B': ['CAN', 'BIH', 'QAT', 'SUI'],
  'C': ['HAI', 'SCO', 'BRA', 'MAR'],
  'D': ['USA', 'PAR', 'AUS', 'TUR'],
  'E': ['CIV', 'ECU', 'GER', 'CUW'],
  'F': ['NED', 'JPN', 'SWE', 'TUN'],
  'G': ['IRN', 'NZL', 'BEL', 'EGY'],
  'H': ['KSA', 'URU', 'ESP', 'CPV'],
  'I': ['FRA', 'SEN', 'IRQ', 'NOR'],
  'J': ['ARG', 'ALG', 'AUT', 'JOR'],
  'K': ['POR', 'COD', 'UZB', 'COL'],
  'L': ['GHA', 'PAN', 'ENG', 'CRO'],
};

export const PARTIDOS = [
  { id: 'G01', grupo: 'A', local: 'MEX', visitante: 'RSA', fecha: '2026-06-11T13:00:00' },
  { id: 'G02', grupo: 'A', local: 'KOR', visitante: 'CZE', fecha: '2026-06-11T20:00:00' },
  { id: 'G03', grupo: 'B', local: 'CAN', visitante: 'BIH', fecha: '2026-06-12T15:00:00' },
  { id: 'G04', grupo: 'D', local: 'USA', visitante: 'PAR', fecha: '2026-06-12T18:00:00' },
  { id: 'G05', grupo: 'C', local: 'HAI', visitante: 'SCO', fecha: '2026-06-13T21:00:00' },
  { id: 'G06', grupo: 'D', local: 'AUS', visitante: 'TUR', fecha: '2026-06-13T21:00:00' },
  { id: 'G07', grupo: 'C', local: 'BRA', visitante: 'MAR', fecha: '2026-06-13T18:00:00' },
  { id: 'G08', grupo: 'B', local: 'QAT', visitante: 'SUI', fecha: '2026-06-13T12:00:00' },
  { id: 'G09', grupo: 'E', local: 'CIV', visitante: 'ECU', fecha: '2026-06-14T19:00:00' },
  { id: 'G10', grupo: 'E', local: 'GER', visitante: 'CUW', fecha: '2026-06-14T12:00:00' },
  { id: 'G11', grupo: 'F', local: 'NED', visitante: 'JPN', fecha: '2026-06-14T15:00:00' },
  { id: 'G12', grupo: 'F', local: 'SWE', visitante: 'TUN', fecha: '2026-06-14T20:00:00' },
  { id: 'G13', grupo: 'H', local: 'KSA', visitante: 'URU', fecha: '2026-06-15T18:00:00' },
  { id: 'G14', grupo: 'H', local: 'ESP', visitante: 'CPV', fecha: '2026-06-15T12:00:00' },
  { id: 'G15', grupo: 'G', local: 'IRN', visitante: 'NZL', fecha: '2026-06-15T18:00:00' },
  { id: 'G16', grupo: 'G', local: 'BEL', visitante: 'EGY', fecha: '2026-06-15T12:00:00' },
  { id: 'G17', grupo: 'I', local: 'FRA', visitante: 'SEN', fecha: '2026-06-16T15:00:00' },
  { id: 'G18', grupo: 'I', local: 'IRQ', visitante: 'NOR', fecha: '2026-06-16T18:00:00' },
  { id: 'G19', grupo: 'J', local: 'ARG', visitante: 'ALG', fecha: '2026-06-16T20:00:00' },
  { id: 'G20', grupo: 'J', local: 'AUT', visitante: 'JOR', fecha: '2026-06-16T21:00:00' },
  { id: 'G21', grupo: 'L', local: 'GHA', visitante: 'PAN', fecha: '2026-06-17T19:00:00' },
  { id: 'G22', grupo: 'L', local: 'ENG', visitante: 'CRO', fecha: '2026-06-17T15:00:00' },
  { id: 'G23', grupo: 'K', local: 'POR', visitante: 'COD', fecha: '2026-06-17T12:00:00' },
  { id: 'G24', grupo: 'K', local: 'UZB', visitante: 'COL', fecha: '2026-06-17T20:00:00' },
  { id: 'G25', grupo: 'A', local: 'CZE', visitante: 'RSA', fecha: '2026-06-18T12:00:00' },
  { id: 'G26', grupo: 'B', local: 'SUI', visitante: 'BIH', fecha: '2026-06-18T12:00:00' },
  { id: 'G27', grupo: 'B', local: 'CAN', visitante: 'QAT', fecha: '2026-06-18T15:00:00' },
  { id: 'G28', grupo: 'A', local: 'MEX', visitante: 'KOR', fecha: '2026-06-18T19:00:00' },
  { id: 'G29', grupo: 'C', local: 'BRA', visitante: 'HAI', fecha: '2026-06-19T21:00:00' },
  { id: 'G30', grupo: 'C', local: 'SCO', visitante: 'MAR', fecha: '2026-06-19T18:00:00' },
  { id: 'G31', grupo: 'D', local: 'TUR', visitante: 'PAR', fecha: '2026-06-19T20:00:00' },
  { id: 'G32', grupo: 'D', local: 'USA', visitante: 'AUS', fecha: '2026-06-19T12:00:00' },
  { id: 'G33', grupo: 'E', local: 'GER', visitante: 'CIV', fecha: '2026-06-20T16:00:00' },
  { id: 'G34', grupo: 'E', local: 'ECU', visitante: 'CUW', fecha: '2026-06-20T19:00:00' },
  { id: 'G35', grupo: 'F', local: 'NED', visitante: 'SWE', fecha: '2026-06-20T12:00:00' },
  { id: 'G36', grupo: 'F', local: 'TUN', visitante: 'JPN', fecha: '2026-06-20T22:00:00' },
  { id: 'G37', grupo: 'H', local: 'URU', visitante: 'CPV', fecha: '2026-06-21T18:00:00' },
  { id: 'G38', grupo: 'H', local: 'ESP', visitante: 'KSA', fecha: '2026-06-21T12:00:00' },
  { id: 'G39', grupo: 'G', local: 'BEL', visitante: 'IRN', fecha: '2026-06-21T12:00:00' },
  { id: 'G40', grupo: 'G', local: 'NZL', visitante: 'EGY', fecha: '2026-06-21T18:00:00' },
  { id: 'G41', grupo: 'I', local: 'NOR', visitante: 'SEN', fecha: '2026-06-22T20:00:00' },
  { id: 'G42', grupo: 'I', local: 'FRA', visitante: 'IRQ', fecha: '2026-06-22T17:00:00' },
  { id: 'G43', grupo: 'J', local: 'ARG', visitante: 'AUT', fecha: '2026-06-22T12:00:00' },
  { id: 'G44', grupo: 'J', local: 'JOR', visitante: 'ALG', fecha: '2026-06-22T20:00:00' },
  { id: 'G45', grupo: 'L', local: 'ENG', visitante: 'GHA', fecha: '2026-06-23T16:00:00' },
  { id: 'G46', grupo: 'L', local: 'PAN', visitante: 'CRO', fecha: '2026-06-23T19:00:00' },
  { id: 'G47', grupo: 'K', local: 'POR', visitante: 'UZB', fecha: '2026-06-23T12:00:00' },
  { id: 'G48', grupo: 'K', local: 'COL', visitante: 'COD', fecha: '2026-06-23T20:00:00' },
  { id: 'G49', grupo: 'C', local: 'SCO', visitante: 'BRA', fecha: '2026-06-24T18:00:00' },
  { id: 'G50', grupo: 'C', local: 'MAR', visitante: 'HAI', fecha: '2026-06-24T18:00:00' },
  { id: 'G51', grupo: 'B', local: 'SUI', visitante: 'CAN', fecha: '2026-06-24T12:00:00' },
  { id: 'G52', grupo: 'B', local: 'BIH', visitante: 'QAT', fecha: '2026-06-24T12:00:00' },
  { id: 'G53', grupo: 'A', local: 'CZE', visitante: 'MEX', fecha: '2026-06-24T19:00:00' },
  { id: 'G54', grupo: 'A', local: 'RSA', visitante: 'KOR', fecha: '2026-06-24T19:00:00' },
  { id: 'G55', grupo: 'E', local: 'CUW', visitante: 'CIV', fecha: '2026-06-25T16:00:00' },
  { id: 'G56', grupo: 'E', local: 'ECU', visitante: 'GER', fecha: '2026-06-25T16:00:00' },
  { id: 'G57', grupo: 'F', local: 'JPN', visitante: 'SWE', fecha: '2026-06-25T18:00:00' },
  { id: 'G58', grupo: 'F', local: 'TUN', visitante: 'NED', fecha: '2026-06-25T18:00:00' },
  { id: 'G59', grupo: 'D', local: 'TUR', visitante: 'USA', fecha: '2026-06-25T19:00:00' },
  { id: 'G60', grupo: 'D', local: 'PAR', visitante: 'AUS', fecha: '2026-06-25T19:00:00' },
  { id: 'G61', grupo: 'I', local: 'NOR', visitante: 'FRA', fecha: '2026-06-26T15:00:00' },
  { id: 'G62', grupo: 'I', local: 'SEN', visitante: 'IRQ', fecha: '2026-06-26T15:00:00' },
  { id: 'G63', grupo: 'G', local: 'EGY', visitante: 'IRN', fecha: '2026-06-26T20:00:00' },
  { id: 'G64', grupo: 'G', local: 'NZL', visitante: 'BEL', fecha: '2026-06-26T20:00:00' },
  { id: 'G65', grupo: 'H', local: 'CPV', visitante: 'KSA', fecha: '2026-06-26T19:00:00' },
  { id: 'G66', grupo: 'H', local: 'URU', visitante: 'ESP', fecha: '2026-06-26T18:00:00' },
  { id: 'G67', grupo: 'L', local: 'PAN', visitante: 'ENG', fecha: '2026-06-27T17:00:00' },
  { id: 'G68', grupo: 'L', local: 'CRO', visitante: 'GHA', fecha: '2026-06-27T17:00:00' },
  { id: 'G69', grupo: 'J', local: 'ALG', visitante: 'AUT', fecha: '2026-06-27T21:00:00' },
  { id: 'G70', grupo: 'J', local: 'JOR', visitante: 'ARG', fecha: '2026-06-27T21:00:00' },
  { id: 'G71', grupo: 'K', local: 'COL', visitante: 'POR', fecha: '2026-06-27T19:30:00' },
  { id: 'G72', grupo: 'K', local: 'COD', visitante: 'UZB', fecha: '2026-06-27T19:30:00' },
];

export function partidosDeGrupo(letra) {
  return PARTIDOS.filter((p) => p.grupo === letra);
}
