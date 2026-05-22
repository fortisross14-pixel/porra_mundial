-- =============================================================
--  ESQUEMA v2  —  AMPLIACIÓN  (Batch A)
-- =============================================================
--  Ejecuta estos PASOS DE UNO EN UNO en la consola de Prisma,
--  igual que con schema_por_pasos.sql.
--
--  Es ADITIVO: crea tablas nuevas, no toca las que ya tienes.
--  Es seguro ejecutarlo sobre la base de datos actual.
-- =============================================================


-- ===== PASO V2-1 =====
-- Valores de puntos, editables desde el panel de admin.
-- Cada fila = (ronda, concepto) -> puntos.
--   ronda:    'grupos','dieciseisavos','octavos','cuartos',
--             'semifinal','final','tercer_puesto'
--   concepto: '1x2','exacto','clasificado'
CREATE TABLE valores_puntos (
  ronda     TEXT NOT NULL,
  concepto  TEXT NOT NULL,
  puntos    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ronda, concepto)
);


-- ===== PASO V2-2 =====
-- Valores iniciales por defecto. Podrás cambiarlos luego desde el admin.
-- (1X2 = 1, marcador exacto = 2 EXTRA, equipo clasificado = 1 por posición)
INSERT INTO valores_puntos (ronda, concepto, puntos) VALUES
  ('grupos',        '1x2',         1),
  ('grupos',        'exacto',      2),
  ('grupos',        'clasificado', 1),
  ('dieciseisavos', '1x2',         1),
  ('dieciseisavos', 'exacto',      2),
  ('dieciseisavos', 'clasificado', 3),
  ('octavos',       '1x2',         1),
  ('octavos',       'exacto',      2),
  ('octavos',       'clasificado', 3),
  ('cuartos',       '1x2',         1),
  ('cuartos',       'exacto',      2),
  ('cuartos',       'clasificado', 3),
  ('semifinal',     '1x2',         1),
  ('semifinal',     'exacto',      2),
  ('semifinal',     'clasificado', 3),
  ('final',         '1x2',         1),
  ('final',         'exacto',      2),
  ('tercer_puesto', '1x2',         1),
  ('tercer_puesto', 'exacto',      2);


-- ===== PASO V2-3 =====
-- Cuadro de honor: las 6 respuestas de texto de cada jugador.
-- campos: 'campeon','subcampeon','tercero','cuarto','goleador','mejor_jugador'
CREATE TABLE cuadro_honor (
  id          SERIAL PRIMARY KEY,
  jugador_id  INTEGER NOT NULL REFERENCES jugadores(id),
  campo       TEXT NOT NULL,
  valor       TEXT NOT NULL DEFAULT '',
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jugador_id, campo)
);


-- ===== PASO V2-4 =====
-- Respuestas CORRECTAS del cuadro de honor (las marca el admin al final).
-- Misma lista de 'campo' que arriba. Una sola fila por campo.
CREATE TABLE cuadro_honor_correcto (
  campo        TEXT PRIMARY KEY,
  valor        TEXT NOT NULL DEFAULT '',
  actualizado  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===== PASO V2-5 =====
-- Puntos que vale cada acierto del cuadro de honor (editable en el admin).
-- Una sola fila; por defecto 10 puntos por campo acertado.
CREATE TABLE valor_cuadro_honor (
  unico   BOOLEAN PRIMARY KEY DEFAULT true,
  puntos  INTEGER NOT NULL DEFAULT 10
);
INSERT INTO valor_cuadro_honor (unico, puntos) VALUES (true, 10);


-- =============================================================
--  COMPROBACIÓN (opcional)
-- =============================================================
-- SELECT * FROM valores_puntos ORDER BY ronda, concepto;
