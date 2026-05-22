-- =============================================================
--  ESQUEMA v3  —  FASE ELIMINATORIA  (Part 1)
-- =============================================================
--  Ejecuta los PASOS de uno en uno en la consola de Prisma.
--  Es aditivo y seguro.
-- =============================================================


-- ===== PASO V3-1 =====
-- Crea la fase eliminatoria (CERRADA) para todas las porras.
-- A partir de aquí la fase existe siempre; no hay que "crearla" otra vez.
INSERT INTO fases (porra_id, nombre, fecha_limite, abierta)
SELECT id, 'Fase Eliminatoria', NULL, false FROM porras;


-- ===== PASO V3-2 =====
-- Cuadro eliminatorio resuelto por el admin: qué equipo ocupa cada
-- hueco (local/visitante) de cada cruce. Lo rellena el admin tras
-- los resultados de grupos. Editable (para terceros empatados, etc.).
--   partido_id : id del cruce (E73..E104, de data/eliminatoria.js)
--   lado       : 'local' o 'visitante'
--   equipo     : código de equipo (3 letras) o '' si aún sin definir
CREATE TABLE cuadro_eliminatorio (
  partido_id  TEXT NOT NULL,
  lado        TEXT NOT NULL,
  equipo      TEXT NOT NULL DEFAULT '',
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (partido_id, lado)
);


-- =============================================================
--  COMPROBACIÓN (opcional)
-- =============================================================
-- SELECT p.codigo, f.nombre, f.abierta
-- FROM fases f JOIN porras p ON p.id = f.porra_id
-- ORDER BY p.id, f.id;
--  -> cada porra debe tener 2 fases: Fase de Grupos y Fase Eliminatoria.


-- ===== PASO V3-3 =====
-- La predicción de eliminatoria necesita guardar, además del marcador,
-- qué equipo pasa en penaltis cuando el jugador predice empate.
-- Se añade una columna a 'predicciones' (vacía para los partidos de
-- grupos, que nunca tienen penaltis).
ALTER TABLE predicciones ADD COLUMN IF NOT EXISTS penaltis TEXT DEFAULT '';
