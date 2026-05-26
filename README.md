# La Porra Mundial 🏆

Porra del Mundial 2026 para dos grupos (familia y amigos). Cada persona
predice los marcadores de la fase de grupos, el sistema calcula las tablas
en vivo, y al cerrar la fase se cuenta quién acertó más.

## Cómo funciona

- **Acceso por código**: cada porra (Familia, Amigos) tiene un código.
  El resto del mundo no entra.
- **Identidad**: cada jugador se registra con un nombre y un PIN. El PIN
  es lo que le permite editar su pronóstico después.
- **Pronóstico**: marcadores exactos. Puntos: +1 por acertar 1X2, +2 extra
  por marcador exacto. Bonus por acertar posiciones de la tabla.
- **Empates**: si dos equipos quedan igualados tras puntos, diferencia de
  goles y goles a favor, el jugador ordena la tabla a mano.
- **Fases**: la fase de grupos primero; la eliminatoria se abre después.

## Puesta en marcha (una sola vez)

### 1. Crear el repo en GitHub
Crea un repositorio vacío llamado `porra-mundial` y sube estos archivos:

```
git init
git add .
git commit -m "Porra Mundial - versión inicial"
git remote add origin https://github.com/TU-USUARIO/porra-mundial.git
git push -u origin main
```

### 2. Conectar Vercel
1. Entra en vercel.com con tu cuenta de GitHub.
2. "Add New Project" → elige `porra-mundial` → Import.
3. Vercel detecta Vite solo. No cambies nada. Deploy.

### 3. Crear la base de datos
1. En el proyecto de Vercel → pestaña **Storage** → Create Database → Postgres.
2. Conéctala al proyecto (Vercel añade la variable de entorno solo).
3. En la consola de consultas (Query), pega y ejecuta `db/schema.sql`.

### 4. Variable de entorno del admin
En Settings → Environment Variables, añade:

| Nombre       | Valor                          |
|--------------|--------------------------------|
| `ADMIN_CODE` | un código secreto solo tuyo    |

Vuelve a desplegar para que tome la variable (Deployments → Redeploy).

### 5. Los partidos ya están cargados
`data/partidos.js` ya contiene los 12 grupos y los 72 partidos de la
fase de grupos del Mundial 2026, y `data/eliminatoria.js` el cuadro
completo de la fase final. No hay que tocar nada para empezar.

## A partir de aquí

Cada cambio: `git push` → Vercel redespliega en ~30 segundos.
La URL `porra-mundial.vercel.app` es la porra en vivo.

## Archivos que tocarás

- `puntuacion.js` — todos los valores de puntos. Edítalo aquí.
- `db/schema.sql` — códigos de las porras (`FAMILIA2026`, `AMIGOS2026`).
- `data/partidos.js` / `data/eliminatoria.js` — ya cargados; solo si
  hay cambios oficiales de calendario.

## Pendiente para más adelante

- Bonus por posiciones de grupo y ranking de terceros en la
  clasificación final.
- Fase eliminatoria completa (el cuadro ya está en
  `data/eliminatoria.js`).

## Panel de administración

Está en la ruta `/admin` (ej. `porra-mundial.vercel.app/admin`).
Cualquiera puede abrir esa URL, pero solo verá un formulario de
código: sin el código de administrador no se entra.

Al introducir el código correcto, el servidor entrega una cookie de
sesión `httpOnly` (que el navegador no expone por JavaScript). El
código solo viaja esa vez; el resto de acciones usan la cookie.

El panel permite:
- **Jugadores**: lista por porra, con fecha de alta y cuántos
  partidos lleva pronosticado cada uno.
- **Fases**: abrir o cerrar cada fase. El bloqueo es MANUAL: una fase
  abierta se puede editar; al cerrarla se bloquea y se muestra la
  clasificación. La fecha límite es solo orientativa, no bloquea sola.
- **Resultados**: introducir el marcador real de los 72 partidos.

## Actualización v2 (Batch A)

Antes de usar las funciones nuevas, ejecuta `db/schema_v2.sql` en la
consola de Prisma, paso a paso (PASO V2-1 ... V2-5). Es aditivo y
seguro: crea tablas nuevas sin tocar las existentes.

Novedades:
- Los valores de puntos ahora se editan desde el panel de admin
  (pestaña "Puntos"), no desde el código.
- Panel de admin: pestaña "Porras" para borrar una porra duplicada.
- Las tablas del admin muestran el CÓDIGO de cada porra.
- Botón de ayuda (?) en la clasificación: abre los valores de puntos.

## Arreglar fases duplicadas (una vez)

Si la tabla `fases` tiene filas repetidas (por haber ejecutado dos
veces los inserts), deja una fase por porra y borra el resto, p.ej.:
  DELETE FROM fases WHERE id IN (3, 4);
Comprueba antes con: SELECT * FROM fases ORDER BY porra_id, id;

## Actualización v2 (Batch B)

Pantallas nuevas para los jugadores:
- Pestaña "Resultados" con 3 sub-pestañas: resultados reales del
  Mundial por grupo, "Resultados diarios" (cuadrícula: jugadores en
  filas, partidos en columnas, marcador previsto en cada celda con
  color verde/azul/negro segun el acierto) y "Clasificación total".
- Las tablas de ranking tienen dos bloques de columnas: Grupos y
  Fase final, con 1X2 / Exacto / Posición bajo cada uno.
- Al tocar un jugador se abre un popup con su desglose por partido.
- Pestaña "Cuadro de honor": 6 campos de texto (Campeón, Subcampeón,
  3.º, 4.º, Máximo goleador, Mejor jugador).

Recuerda: las columnas de "Fase final" quedan a 0 hasta que se
construya la fase eliminatoria. El bonus por posición de grupo
aparece cuando un grupo tiene todos sus resultados cargados.

## Pendiente

- Fase eliminatoria (predicción del cuadro + sus columnas de ranking).
- Cálculo del bonus por posición de grupo y validación del cuadro de
  honor desde el admin.

## Fase eliminatoria — Parte 1

Antes de usarla, ejecuta `db/schema_v3.sql` paso a paso en Prisma.
Añade la "Fase Eliminatoria" (cerrada) a cada porra y la tabla del
cuadro. La fase ya existe siempre; no hay que crearla.

Flujo:
1. La fase eliminatoria aparece cerrada. Los jugadores ven la
   pestaña pero bloqueada.
2. Cuando termine la fase de grupos e introduzcas todos los
   resultados, ve a Admin -> pestaña "Cuadro" -> "Proponer
   dieciseisavos". Autocompleta los 16 cruces.
3. Revisa y AJUSTA cualquier equipo (terceros empatados, etc.).
   Cada hueco es un desplegable editable. Guarda el cuadro.
4. Cuando esté listo, abre la fase en Admin -> "Fases".

La pantalla donde los jugadores rellenan su cuadro se construye en
la Parte 2 (junto con las columnas de Fase final del ranking).

## Fase eliminatoria — Parte 2 (pronóstico del jugador)

Ejecuta el PASO V3-3 de `db/schema_v3.sql` (añade la columna de
penaltis). Después:

- Cuando abras la Fase Eliminatoria, los jugadores ven la pestaña
  "Mi pronóstico" con el cuadro: predicen el marcador de cada cruce.
- El ganador que predicen avanza y rellena la ronda siguiente.
- Si predicen empate, eligen quién pasa en penaltis.
- Una sola pantalla, un solo guardado, todo el cuadro.

### Pendiente (último tramo)
- Mostrar los puntos de la fase eliminatoria en las columnas
  "Fase final" del ranking (ahora siguen a 0).
- Cálculo del bonus por posición de grupo (columna "Posic.").
- Pantalla de admin para validar el cuadro de honor al final.

## Puntuación completa (sesión final)

Ya se calculan TODOS los puntos en la "Clasificación total":
- Columna "Posic." (grupos): por cada equipo que el jugador coloca
  en su posición exacta de la tabla final del grupo. Solo cuenta
  cuando el grupo tiene los 6 resultados.
- Columnas "Fase final": puntos de la eliminatoria.
  - 1X2 y exacto se puntúan POR CRUCE comparando marcadores (los
    equipos no importan: si aciertas el 2-1 de un cruce, puntúas).
  - "Clasificado" se puntúa por el equipo que el jugador hace
    avanzar en cada cruce frente al que avanzó de verdad.

No hay cambios de base de datos en esta sesión.
