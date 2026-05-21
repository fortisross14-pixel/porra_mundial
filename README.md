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

- Panel de administración (introducir resultados reales, abrir/cerrar
  fases, crear la fase eliminatoria). La API ya está lista en
  `api/admin.js`; falta la pantalla.
- Bonus por posiciones de grupo y ranking de terceros en la
  clasificación final.
- Fase eliminatoria completa.
