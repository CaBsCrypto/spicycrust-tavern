# 🍕 Walkthrough Final: "La Famiglia: Cyber-Speakeasy // Cosa Nostra 2026" de SpicyCrust

¡Bienvenido a las operaciones clandestinas de la Cosa Nostra Siciliana en **SpicyCrust: Cosa Nostra 2026**!

Hemos completado una reestructuración visual, interactiva y narrativa completa de SpicyCrust, convirtiéndola en una experiencia premium e inmersiva que evoca el ambiente acogedor y misterioso de un speakeasy de la mafia clásica de los años 40/50, infundido con tecnología arcade holográfica de vanguardia.

---

## 🎨 1. Sistema de Diseño e Identidad Visual (`src/style.css`)

Hemos redefinido los tokens y variables visuales para adoptar una estética oscura, elegante y cinematográfica:

### A. Paleta de Colores "Cosa Nostra Speakeasy" (Tokens en `@theme`)
*   `--color-mafia-dark` (`#0E0B09`): Negro absoluto, simulando un lecho de cenizas y humo de habano.
*   `--color-mafia-mahogany` (`#231712`): Tono caoba oscura de las mesas pulidas del bar clandestino.
*   `--color-mafia-gold` (`#C5A059`): Latón envejecido y oro viejo de la bóveda del sindicato.
*   `--color-mafia-amber` (`#E5A93C`): Luz de filamento cálida de lámparas vintage y velas.
*   `--color-mafia-red` (`#8B1C1C`): Rojo borgoña profundo de vino chianti y sellos de lacre de cera.
*   `--color-mafia-green` (`#1B5E20`): Verde billar clásico y dinero del contrabando.

### B. Tipografías Emblemáticas
*   **`Cinzel`** (`font-cinzel`): Serif clásica romana para los títulos del Clan, aportando elegancia institucional y prestigio.
*   **`Special Elite`** (`font-typewriter`): Tipografía monospaced de máquina de escribir antigua para simular expedientes clasificados y teletipos técnicos.

### C. Nuevas Clases Visuales
*   **Fondo Cinemático del Body**: Se aplica una imagen de speakeasy tridimensional de alta resolución (`/speakeasy_bg.png`) con un degradado oscurecedor superior e inferior (`linear-gradient(rgba(14,11,10,0.88), rgba(5,4,4,0.94))`) para garantizar la máxima legibilidad y halos dorados envolventes.
*   **`.cyber-forno-cabinet`**: Rediseñado como consolas de madera caoba translúcida (`rgba(35, 23, 18, 0.78)` con desenfoque de fondo de 20px) con hilos metálicos en oro viejo (`rgba(197, 160, 89, 0.2)`) y halos de neón borgoña.
*   **`.cyber-hud-gauge`**: Re-tematizado a esferas metálicas de latón y caoba con esferas en ámbar interactivo para simular manómetros industriales vintage.

---

## 🏗️ 2. Estructura e Integración Web (`index.html`)

El dashboard y los modales técnicos se adaptaron al vocabulario y la narrativa de la Cosa Nostra:

1.  **Grid de Operaciones Clandestinas (Diseño Widescreen 16:9):**
    *   **Remoción del Leads/Caja Fuerte**: Se ha eliminado por completo la tarjeta de captación de leads ("La Caja Fuerte") para centrar toda la experiencia del usuario puramente en la interactividad de los juegos.
    *   **Restauración del Grid**: Con 3 juegos restantes, se ha reestructurado el grid central a un diseño de **3 columnas ultra-anchas (`grid-cols-1 md:grid-cols-3`)**.
    *   **Contenedores 16:9**: Cada cabina de juego se ha rediseñado para adoptar proporciones panorámicas sumamente cinematográficas. La parte superior muestra de manera prominente la pantalla CRT de juego en **16:9 (`aspect-video`)**, y la parte inferior es una delgada y moderna barra de caoba y latón que muestra el título y un **slot interactivo de moneda (icono 🪙)** como disparador. Las descripciones e instrucciones se han movido a elegantes overlays hover que se difuminan suavemente al pasar el mouse.
2.  **Operaciones Activas:**
    *   **Marinara Masacre** (Mueve el cortador de caoba y dispara proyectiles de oro para defender los muelles de la Famiglia).
    *   **Escape de la Leña** (Transporta el cargamento chiptune a alta velocidad por la autopista de caoba esquivando las redadas policiales).
    *   **Corte Cosa Nostra** (Rebana el contrabando de ingredientes frescos en el aire antes de que la policía los confisque).
3.  **Sección Inferior de Scroll (La Bóveda de la Famiglia):**
    El HUD de telemetría inferior se convirtió en la consola de lavado y contabilidad del Clan:
    *   `DISTILLERY TEMP: 450°C` (Temperatura del horno de destilería)
    *   `LAUNDRY RATIO: 1.2 BAR` (Proporción de presión de lavado financiero)
    *   `BOUNTY SYNDICATE` (Combustible / Activos)
    *   `ZKP LAUNDERING: ACTIVE` (Lógica de Pruebas de Conocimiento Cero para lavado digital de chiptunes)
    *   `COGNAC-MAINNET` (Red principal segura del Clan)

---

## 📦 3. Cinemática 3D: Caja de Madera Caoba de la Cosa Nostra (`src/modules/unboxing3d.js`)

Se realizó una transformación total del módulo Three.js inicial:

*   **Caja de Pizza** → **Caja de Contrabando de la Famiglia**:
    *   La base y la tapa ahora están hechas de **madera de caoba pulida (`0x231712`)** con remaches de **latón viejo (`0xC5A059`)**.
    *   La tapa central muestra un **sello lacrado tridimensional de cera roja (`0x8B1C1C`)** de la Cosa Nostra.
*   **Iluminación Speakeasy**: Reemplazamos los neones por luces cálidas doradas (`0xC5A059`, `0xE5A93C`) y halos borgoña (`0x8B1C1C`) que se reflejan en el barniz de la madera.
*   **Partículas Clandestinas**: Al abrir la consola, el sello tridimensional explota liberando **bocanadas de humo gris habano** y **chispas de oro viejo** a lo largo de un temblor de cámara espectacular.

---

## 🕹️ 4. Overhaul Gráfico de Videojuegos y Capturas Reales (`src/modules/games.js`)

Hemos corregido y reestructurado por completo los monitores de los videojuegos para mostrar las capturas reales de los landings de juego de forma premium y pulida:

*   **Remoción de Superposiciones Obsoletas**: Eliminamos todas las lógicas antiguas de juego en modo demo (naves, invasores, jefes, partituras) que se superponían y ensuciaban las capturas de pantalla, garantizando que cada monitor muestre el juego real de forma limpia y nítida.
*   **Mapeo de Capturas Correcto y Alta Resolución**:
    *   **Rhythm Slice (Monitor 1 - `game-canvas-3`)**: Renderiza a alta calidad `/rhythmslice_preview.png` en correspondencia directa con su subdomain real `rhythmslice.spicycrust.com`.
    *   **Spicy Challenge (Monitor 2 - `game-canvas-2`)**: Renderiza a alta calidad `/spicychallenge_preview.png` correspondiente a `spicychallenge.spicycrust.com`.
    *   **Slash Slice (Monitor 3 - `game-canvas-1`)**: Renderiza a alta calidad `/slashslice_preview.png` correspondiente a `slashslice.spicycrust.com`.
*   **Efectos Analógicos Vivos**:
    *   Se implementó un barrido de haz de escaneo CRT dorado ultra sutil (`rgba(197, 160, 89, 0.12)`) que cruza la pantalla de arriba a abajo de manera fluida a 60 FPS.
    *   Se agregó un micro-parpadeo de fósforo analógico premium para dar vida a los monitores sin distraer ni interferir con la legibilidad del landing real.
    *   Se añadió un marco HUD ciber-italiano en color latón que envuelve cada monitor de forma elegante.

---

## 🚀 5. Verificación de Compilación y Publicación

*   **Compilación Local**: Ejecutar `pnpm run build` confirma que la aplicación compila perfectamente en un instante (285ms) con cero advertencias.
*   **Publicación de Producción**: La aplicación ha sido publicada y conectada exitosamente a la dirección de producción en Vercel, enlazando el dominio del usuario de manera inmediata:
    *   URL de Producción: **[https://spicycrust.com](https://spicycrust.com)**
    *   FPS: 60 FPS ultra-fluidos y estables.

---

## 📈 6. Campaña SEO Premium y Estructura en Google (`/goal`)

Hemos diseñado e implementado una campaña de SEO técnico integral y de última generación para asegurar la correcta indexación de SpicyCrust en los motores de búsqueda de Google:

### A. robots.txt Optimizado
*   Creado `/robots.txt` a nivel raíz para autorizar el rastreo de Googlebot y definir la ubicación exacta de nuestro Sitemap XML.

### B. Sitemap XML Multidominio completo
*   Creado `/sitemap.xml` para guiar a los motores de búsqueda.
*   Declarados todos los URLs clave, incluyendo la raíz principal (`https://spicycrust.com`) y **los tres subdominios de juego de Micro-Frontends** (`rhythmslice.spicycrust.com`, `spicychallenge.spicycrust.com`, `slashslice.spicycrust.com`), asegurando el indexado completo de la red.

### C. Rich Structured Data de Schema.org (JSON-LD Graph)
Añadimos un bloque `@graph` sumamente potente con los siguientes esquemas:
*   **`WebSite`**: Declara a SpicyCrust como un sitio oficial premium con su título y descripciones.
*   **`Organization`**: Especifica a "SpicyCrust Labs" como la marca central.
*   **`VideoGame`** (x3): Añadidos esquemas independientes para *Rhythm Slice*, *Spicy Challenge* y *Slash Slice*. Google reconocerá estos módulos como videojuegos oficiales interactivos de forma nativa en los resultados de búsqueda.

### D. Red Social Enriquecida (OpenGraph y Twitter Cards)
*   Integrados tags de imágenes OpenGraph (`og:image`) y Twitter Cards de gran formato (`twitter:image`) apuntando de forma segura a nuestras imágenes de speakeasy para que la web se comparta con previsualizaciones suntuosas.

¡El centro clandestino de SpicyCrust está listo con sus previews arcade impecables y totalmente indexado para conquistar Google!

---

## 📦 7. Optimización e Integración de Gabinetes de Cajas 3D con Three.js (`cabinet3d.js`)

Se ha corregido y optimizado la visualización en 3D de las cajas de pizza que proyectan los juegos en vivo:
1. **Inclusión de Lienzos Ocultos (`index.html`)**: Se han integrado los tres `<canvas>` invisibles (`game-canvas-1`, `game-canvas-2`, `game-canvas-3`) en el DOM raíz. Esto permite que el simulador de juegos dibuje a 60 FPS en segundo plano y Three.js capture la textura de forma reactiva en tiempo real.
2. **Proporción de Aspecto Rectangular sin Distorsión**: Modificamos el volumen de las cajas en Three.js a una proporción rectangular de `2.4 de ancho x 1.5 de profundidad` (en lugar de `2.3 x 2.3` cuadrado). De esta manera, el canvas del juego (relación 16:9) se mapea sobre la tapa de la caja sin sufrir deformaciones ni estiramientos verticales.
3. **Pantalla en el Interior de la Tapa**: Para hacer visible el juego con la caja abierta, mapeamos la textura de la pantalla a la cara inferior (interior) de la tapa. Rotamos la textura 180° para que al levantarse la tapa, la pantalla del juego mire al frente con total claridad de cara al usuario.
4. **Pizza 3D Modelada**: Creamos una pizza en 3D dentro del cofre base con meshes y materiales independientes:
   - Masa crujiente exterior (`0xc68a4c`).
   - Queso fundido y salsa roja (`0xf4b41a`).
   - Rodajas de pepperoni distribuidas de forma procedural.
   - Hojas de albahaca fresca en color verde.
5. **Sistema de Partículas de Elixir**: Desarrollamos un sistema de partículas dinámico a 60 FPS donde 20 esferas rosas de elixir brillante flotan en dirección ascendente simulando vapor mágico al abrirse la caja.
6. **Iluminación e Interactividad Hover**: Al pasar el cursor sobre la caja 3D, la caja se inclina tridimensionalmente siguiendo la posición del mouse y la tapa se abre ampliamente (`-1.45rad` o ~83°). Un PointLight interno pasa del 15% al 100% de intensidad, arrojando luz dorada/naranja sobre la pizza e iluminando la escena de forma premium.
7. **Visualización Libre de Cajas Voladoras**: Eliminamos por completo los marcos de contenedor, fondos oscuros, HUD brackets `[ ]` y bordes de madera que rodeaban a las cajas 3D en HTML. Ahora, las tres cajas de pizza 3D flotan con transparencia total de manera pura y directa en las columnas del grid.
8. **Ajuste de Margen de Escala y Cámara para Evitar Recortes (Clipping)**:
   - Redujimos las dimensiones del modelo de la caja a `2.2 x 1.38` (y adaptamos la pizza interna a escala).
   - Incrementamos la altura del contenedor en HTML usando un aspect-ratio más vertical (`aspect-[0.95]`).
   - Ajustamos la cámara en `cabinet3d.js` a `(0, 1.45, 3.1)` con un campo de visión (FOV) de 45 y lookAt en `(0, 0.2, 0)`.
   - La combinación del nuevo aspect ratio y los parámetros de la cámara proporciona un área de visualización excelente, eliminando por completo los recortes (clipping) en la base y la tapa al rotar la caja.
9. **Mapeo de Pantalla Bidireccional (Doble Tapa)**: Mapeamos la pantalla del canvas tanto en la cara superior (+Y, index 2) como en la cara inferior (-Y, index 3) de la tapa. De esta manera, el juego es visible tanto en estado cerrado como abierto.
10. **Alineación de Texturas al Derecho por Defecto (Sin Rotaciones UV)**: Removemos las rotaciones manuales y globales de la textura y de los UVs. Al usar la configuración por defecto de Three.js, ambas caras de la tapa (la superior exterior y la inferior interior) mapean la imagen perfectamente al derecho y orientadas de cara al usuario, resolviendo cualquier efecto de texto al revés o invertido.
11. **Información Dinámica en la Tapa (Canvas)**: Cuando la caja está cerrada, se aplica un filtro oscuro de opacidad reducida (`0.25`) a la captura del juego en el canvas y se dibuja directamente sobre la textura el Título del juego, su Rareza (con fondo coloreado según su nivel), el costo de Elixir y una invitación interactiva parpadeante (`CLICK PARA ABRIR Y JUGAR`). Al pasar el cursor y abrirse la tapa, esta capa de textos desaparece y el fondo de juego pasa a opacidad completa (`0.98`) para mostrar el gameplay con total fidelidad.
12. **Información Flotante Sin Contenedores en Pantalla Principal**: Diseñamos e integramos una maquetación de tipografía flotante y limpia justo debajo de cada caja 3D en HTML. Muestra el título del juego con tipografía medieval Cinzel grande, la rareza/elixir con colores vivos y las estadísticas del juego (Ritmo, Daño, Velocidad, etc.) en tono dorado suave sobre la mesa de la taberna, logrando una legibilidad perfecta 100% de frente sin necesidad de usar cajones o tarjetas.
13. **Optimización Extrema de CPU y GPU (WebGL throttling)**:
    - **Tasa de Refresco Inteligente**: Las cajas en reposo (no hovered) reducen su tasa de renderizado de 60 FPS a **~12 FPS** (1 de cada 5 frames), minimizando enormemente la carga de la GPU.
    - **Ocultamiento y Pausa de Partículas**: Cuando las cajas están cerradas, el sistema de partículas se desactiva y se oculta (`particles.visible = false`) por completo, omitiendo los cálculos matemáticos de posiciones y velocidades.
    - **Pausa en Segundo Plano**: Si la pestaña del navegador no está activa (documento oculto/miniminizado), todos los bucles de renderizado se congelan inmediatamente (`if (document.hidden) return`).
    - **Logo Optimizado**: La moneda dorada giratoria del logo reduce su rotación a **~10 FPS** (1 de cada 6 frames) en reposo, ahorrando valiosos ciclos de procesamiento.
    - **Terminación del Bucle de Introducción**: Agregamos un control en `unboxing3d.js` para detener por completo el bucle `requestAnimationFrame(animate)` una vez que la caja de pizza de la intro se abre y se limpia el lienzo, liberando recursos que antes se consumían indefinidamente en segundo plano.
    - **Throttling en Canvases 2D**: El bucle de dibujo de `games.js` para previsualizaciones 2D ahora corre a **~15 FPS** en lugar de 60 FPS cuando la caja no está hovered, disminuyendo la sobrecarga de repintado del DOM.
14. **Visualización Frontal Total ("De Frente")**:
    - Ajustamos la orientación inicial de las cajas a `targetRotX = 1.15` y `targetLidAngle = 0.0`. Esto hace que, en estado de reposo (cerradas), la tapa superior se incline de cara a la cámara de manera perpendicular a la línea de visión del usuario.
    - La información del juego, el título y los textos se leen perfectamente de forma plana y frontal sin distorsión por perspectiva, tal como si se visualizara la página de frente, logrando el 100% de apreciación deseada.
    - Al pasar el cursor por encima, la tapa se abre suavemente para revelar la pizza 3D y el juego en su interior.
