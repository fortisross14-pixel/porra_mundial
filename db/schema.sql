-- =============================================================
--  ESQUEMA DE BASE DE DATOS  —  La Porra Mundial
-- =============================================================
--  Ejecuta este archivo UNA SOLA VEZ en la consola de consultas
--  de Vercel Postgres (pestaña Storage -> tu base de datos -> Query).
-- =============================================================

-- Cada "porra" es un grupo de gente (familia, amigos...).
-- El 'codigo' es la contraseña compartida para entrar a esa porra.
CREATE TABLE porras (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  codigo        TEXT NOT NULL UNIQUE,
  creada        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Las fases de cada porra (Fase de Grupos, Fase Eliminatoria).
-- La eliminatoria se crea/abre más adelante desde el panel de admin.
CREATE TABLE fases (
  id            SERIAL PRIMARY KEY,
  porra_id      INTEGER NOT NULL REFERENCES porras(id),
  nombre        TEXT NOT NULL,
  fecha_limite  TIMESTAMPTZ,                 -- tras esta fecha la fase se bloquea
  abierta       BOOLEAN NOT NULL DEFAULT false
);

-- Los jugadores. Identidad = (porra + usuario), protegida por un PIN.
-- El PIN es un secreto corto que el jugador elige al registrarse;
-- sirve para que solo esa persona pueda editar su pronóstico.
CREATE TABLE jugadores (
  id            SERIAL PRIMARY KEY,
  porra_id      INTEGER NOT NULL REFERENCES porras(id),
  usuario_norm  TEXT NOT NULL,               -- nombre normalizado (minúsculas, sin espacios) para comparar
  usuario       TEXT NOT NULL,               -- nombre tal y como se muestra
  pin           TEXT NOT NULL,
  creado        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (porra_id, usuario_norm)
);

-- Predicciones de marcador. Una fila por jugador, fase y partido.
-- 'partido_id' referencia los partidos del archivo data/partidos.js
-- (los partidos de grupos son fijos; no necesitan tabla propia).
CREATE TABLE predicciones (
  id            SERIAL PRIMARY KEY,
  jugador_id    INTEGER NOT NULL REFERENCES jugadores(id),
  fase_id       INTEGER NOT NULL REFERENCES fases(id),
  partido_id    TEXT NOT NULL,
  goles_local      INTEGER,
  goles_visitante  INTEGER,
  actualizado   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jugador_id, fase_id, partido_id)
);

-- Elecciones manuales de desempate del jugador.
-- Cuando dos equipos quedan empatados en una tabla tras los criterios
-- objetivos, el jugador elige el orden y se guarda aquí.
-- 'ambito' = 'grupo:<LETRA>' o 'terceros'
-- 'clave_empate' = equipos empatados, en orden alfabético, unidos por coma
-- 'orden' = JSON con la lista de equipos en el orden elegido por el jugador
CREATE TABLE desempates (
  id            SERIAL PRIMARY KEY,
  jugador_id    INTEGER NOT NULL REFERENCES jugadores(id),
  fase_id       INTEGER NOT NULL REFERENCES fases(id),
  ambito        TEXT NOT NULL,
  clave_empate  TEXT NOT NULL,
  orden         JSONB NOT NULL,
  UNIQUE (jugador_id, fase_id, ambito, clave_empate)
);

-- Resultados reales de los partidos (los introduce el admin).
CREATE TABLE resultados (
  partido_id       TEXT PRIMARY KEY,
  goles_local      INTEGER NOT NULL,
  goles_visitante  INTEGER NOT NULL,
  actualizado      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pred_jugador ON predicciones (jugador_id, fase_id);
CREATE INDEX idx_jug_porra ON jugadores (porra_id);

-- -------------------------------------------------------------
--  DATOS INICIALES  —  ajusta los códigos a tu gusto
-- -------------------------------------------------------------
INSERT INTO porras (nombre, codigo) VALUES
  ('Familia', 'FAMILIA2026'),
  ('Amigos',  'AMIGOS2026');

-- Crea la Fase de Grupos para cada porra.
-- AJUSTA fecha_limite a la hora del primer partido del Mundial.
INSERT INTO fases (porra_id, nombre, fecha_limite, abierta)
SELECT id, 'Fase de Grupos', '2026-06-11 18:00:00+00', true FROM porras;
