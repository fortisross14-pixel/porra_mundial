-- =============================================================
--  ESQUEMA POR PASOS  —  La Porra Mundial
-- =============================================================
--  Algunas consolas SQL (como la de Prisma Postgres) solo aceptan
--  UN comando por ejecución y dan el error:
--    "cannot insert multiple commands into a prepared statement"
--
--  Solución: ejecuta los 11 PASOS de abajo DE UNO EN UNO.
--  Copia solo el bloque de un PASO, pégalo, ejecútalo, y pasa al
--  siguiente. Respeta el orden (las tablas antes que los datos).
-- =============================================================


-- ===== PASO 1 =====
CREATE TABLE porras (
  id      SERIAL PRIMARY KEY,
  nombre  TEXT NOT NULL,
  codigo  TEXT NOT NULL UNIQUE,
  creada  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===== PASO 2 =====
CREATE TABLE fases (
  id            SERIAL PRIMARY KEY,
  porra_id      INTEGER NOT NULL REFERENCES porras(id),
  nombre        TEXT NOT NULL,
  fecha_limite  TIMESTAMPTZ,
  abierta       BOOLEAN NOT NULL DEFAULT false
);


-- ===== PASO 3 =====
CREATE TABLE jugadores (
  id            SERIAL PRIMARY KEY,
  porra_id      INTEGER NOT NULL REFERENCES porras(id),
  usuario_norm  TEXT NOT NULL,
  usuario       TEXT NOT NULL,
  pin           TEXT NOT NULL,
  creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (porra_id, usuario_norm)
);


-- ===== PASO 4 =====
CREATE TABLE predicciones (
  id               SERIAL PRIMARY KEY,
  jugador_id       INTEGER NOT NULL REFERENCES jugadores(id),
  fase_id          INTEGER NOT NULL REFERENCES fases(id),
  partido_id       TEXT NOT NULL,
  goles_local      INTEGER,
  goles_visitante  INTEGER,
  actualizado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jugador_id, fase_id, partido_id)
);


-- ===== PASO 5 =====
CREATE TABLE desempates (
  id            SERIAL PRIMARY KEY,
  jugador_id    INTEGER NOT NULL REFERENCES jugadores(id),
  fase_id       INTEGER NOT NULL REFERENCES fases(id),
  ambito        TEXT NOT NULL,
  clave_empate  TEXT NOT NULL,
  orden         JSONB NOT NULL,
  UNIQUE (jugador_id, fase_id, ambito, clave_empate)
);


-- ===== PASO 6 =====
CREATE TABLE resultados (
  partido_id       TEXT PRIMARY KEY,
  goles_local      INTEGER NOT NULL,
  goles_visitante  INTEGER NOT NULL,
  actualizado      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===== PASO 7 =====
CREATE INDEX idx_pred_jugador ON predicciones (jugador_id, fase_id);


-- ===== PASO 8 =====
CREATE INDEX idx_jug_porra ON jugadores (porra_id);


-- ===== PASO 9 =====
-- Crea la porra de la familia. Cambia el código si quieres.
INSERT INTO porras (nombre, codigo) VALUES ('Familia', 'FAMILIA2026');


-- ===== PASO 10 =====
-- Crea la porra de los amigos. Cambia el código si quieres.
INSERT INTO porras (nombre, codigo) VALUES ('Amigos', 'AMIGOS2026');


-- ===== PASO 10B =====
-- Porra de PRUEBAS para testear sin ensuciar las porras reales.
INSERT INTO porras (nombre, codigo) VALUES ('Pruebas', 'PRUEBAS2026');


-- ===== PASO 11 =====
-- Crea la Fase de Grupos para TODAS las porras de golpe.
-- AJUSTA la fecha al primer partido del Mundial si lo necesitas.
INSERT INTO fases (porra_id, nombre, fecha_limite, abierta)
SELECT id, 'Fase de Grupos', '2026-06-11 18:00:00+00', true FROM porras;


-- =============================================================
--  COMPROBACIÓN (opcional) — ejecútalo al final para verificar.
--  Debe devolver 2 filas: Familia y Amigos.
-- =============================================================
-- SELECT p.nombre, p.codigo, f.nombre AS fase
-- FROM porras p JOIN fases f ON f.porra_id = p.id;
