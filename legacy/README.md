# Raycast Lab

Raycast Lab contiene una demo de raycasting 2D y un renderer 2.5D sobre Canvas 2D.

## Cómo ejecutarlo (sin instalar nada)

1. Abrí la carpeta `raycast-demo` en VS Code (con la extensión Live Server).
2. Clic derecho en `dev.html` → **Open with Live Server**.
3. Después de editar `src/`, recargá el navegador.

> No uses `index.html` con Go Live: carga `dist/raycast-lab.js`, que no está en el repo y solo existe después de `npm run build`. Sin ese archivo se ve una pantalla oscura.

## Estructura

- `src/game/`: estado del mundo y reglas de juego, incluidos movimiento y colisiones.
- `src/raycast/` y `src/math/`: algoritmos y funciones geométricas independientes del DOM.
- `src/input/`: adaptadores de teclado y puntero; entregan eventos normalizados a los juegos.
- `src/rendering/`: dibujo de bajo nivel, renderers de escenas e iluminación.
- `src/application/`: coordinación de layout y traducción de interacciones de pantalla al mapa.
- `src/ui/`: menú y paneles; la composición de la página vive en `src/main.js`.

Flujo principal: `input → Game2D/Game3D → estado de escena → renderer → Canvas`.
`main.js` crea las dependencias y conecta UI, input, juego y renderizador.

## Comandos

- `npm install`: instala herramientas de desarrollo/build.
- `npm run dev`: abre la entrada de desarrollo Vite (`dev.html`).
- `npm test`: pruebas unitarias de geometría, DDA, iluminación y conversión del minimapa.
- `npm run build`: genera `dist/index.html` y un bundle clásico. Se puede abrir `dist/index.html` con doble clic, sin servidor. También se puede abrir el `index.html` raíz después de compilar.
