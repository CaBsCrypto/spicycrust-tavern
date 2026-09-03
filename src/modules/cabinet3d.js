import * as THREE from 'three';
import { Games } from './games.js';
import { createMahoganyTexture, createParticleTexture } from './textures.js';

export function initCabinet3D() {
  const canvas = document.getElementById('shared-cabinet-canvas');
  if (!canvas) return;

  // Controlar la pérdida de contexto de WebGL para evitar pantallas en negro (QA / Resiliencia)
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn('WebGL context lost. Recargando la taberna para restaurar...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, false);

  // 1. Crear el WebGLRenderer único compartido
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setScissorTest(true);

  const cabinets = [];

  // 1b. Crear IntersectionObserver para evitar reflows continuos de getBoundingClientRect
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const cab = cabinets.find(c => c.container === entry.target);
      if (cab) {
        cab.isInViewport = entry.isIntersecting;
      }
    });
  }, { threshold: 0.05 }); // Disparar cuando al menos 5% sea visible

  const mahoganyTexture = createMahoganyTexture();
  const particleTexture = createParticleTexture();

  // Función helper para inicializar cada modelo en su propia escena
  function addCabinet(containerId, gameCanvasId, gameKey, defaultRotY = 0) {
    const container = document.getElementById(containerId);
    const gameCanvas = document.getElementById(gameCanvasId);
    if (!container || !gameCanvas) return;

    // Escena independiente
    const scene = new THREE.Scene();

    // Cámara con FOV y posición optimizada (reducido 10% para evitar cualquier recorte)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.set(0, 1.32, 2.85);
    camera.lookAt(0, 0.15, 0);

    // Iluminación cálida e interna
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffd866, 2.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const internalLight = new THREE.PointLight(0xff7700, 2, 5);
    internalLight.position.set(0, 0.1, 0);
    scene.add(internalLight);

    const boxGroup = new THREE.Group();
    boxGroup.rotation.y = defaultRotY;
    boxGroup.scale.set(1.0, 1.0, 1.0);
    scene.add(boxGroup);

    // Materiales de caoba y oro
    const woodMaterial = new THREE.MeshStandardMaterial({
      map: mahoganyTexture,
      bumpMap: mahoganyTexture,
      bumpScale: 0.03,
      roughness: 0.8,
      metalness: 0.1
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd866,
      metalness: 0.9,
      roughness: 0.1
    });

    // Construcción de la caja (Base)
    const baseGeom = new THREE.BoxGeometry(2.2, 0.2, 1.38);
    const baseMesh = new THREE.Mesh(baseGeom, woodMaterial);
    baseMesh.position.y = -0.1;
    boxGroup.add(baseMesh);

    const borderGeom = new THREE.BoxGeometry(2.24, 0.05, 0.05);
    const borderFront = new THREE.Mesh(borderGeom, goldMaterial);
    borderFront.position.set(0, 0.0, 0.70);
    boxGroup.add(borderFront);

    // Pivote de la Tapa
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0, -0.69);
    boxGroup.add(lidPivot);

    const texture = new THREE.CanvasTexture(gameCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const screenMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.15,
      metalness: 0.05
    });

    // Tapa de madera pura (Todos los lados son de madera noble caoba)
    const lidGeom = new THREE.BoxGeometry(2.2, 0.05, 1.38);
    const lidMesh = new THREE.Mesh(lidGeom, woodMaterial);
    lidMesh.position.set(0, 0.025, 0.69);
    lidPivot.add(lidMesh);

    // Pantalla Superior (Label exterior - se reduce para dejar un marco de madera de 15cm a los lados)
    const labelGeom = new THREE.PlaneGeometry(1.9, 1.1);
    const labelMesh = new THREE.Mesh(labelGeom, screenMaterial);
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.set(0, 0.051, 0.69); // Leve offset en Y para evitar Z-fighting
    lidPivot.add(labelMesh);

    // Pantalla Interna (Label interior - visible al abrir la caja)
    const innerLabelGeom = new THREE.PlaneGeometry(1.9, 1.1);
    const innerLabelMesh = new THREE.Mesh(innerLabelGeom, screenMaterial);
    innerLabelMesh.rotation.x = Math.PI / 2;
    innerLabelMesh.position.set(0, -0.001, 0.69);
    lidPivot.add(innerLabelMesh);

    // Pizza 3D Interna
    const pizzaGroup = new THREE.Group();
    pizzaGroup.position.set(0, 0.01, 0);
    boxGroup.add(pizzaGroup);

    const crustGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24);
    const crustMaterial = new THREE.MeshStandardMaterial({
      color: 0xc68a4c,
      roughness: 0.85
    });
    const crustMesh = new THREE.Mesh(crustGeom, crustMaterial);
    pizzaGroup.add(crustMesh);

    const cheeseGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 24);
    const cheeseMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4b41a,
      roughness: 0.45
    });
    const cheeseMesh = new THREE.Mesh(cheeseGeom, cheeseMaterial);
    cheeseMesh.position.y = 0.005;
    pizzaGroup.add(cheeseMesh);

    const pepMaterial = new THREE.MeshStandardMaterial({ color: 0xa81c07, roughness: 0.35 });
    const pepGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.01, 12);
    const pepPositions = [
      { x: 0.18, z: 0.18 }, { x: -0.18, z: -0.18 }, { x: 0.18, z: -0.18 }, { x: -0.18, z: 0.18 },
      { x: 0.3, z: 0.0 }, { x: -0.3, z: 0.0 }, { x: 0.0, z: 0.25 }, { x: 0.0, z: -0.25 }
    ];
    pepPositions.forEach(pos => {
      const pepMesh = new THREE.Mesh(pepGeom, pepMaterial);
      pepMesh.position.set(pos.x, 0.035, pos.z);
      pepMesh.rotation.y = Math.random() * Math.PI;
      pizzaGroup.add(pepMesh);
    });

    // Partículas de Vapor de Elixires
    const particleCount = 20;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const lifetimes = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.45;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0.05 + Math.random() * 0.4;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      velocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: 0.006 + Math.random() * 0.01,
        z: (Math.random() - 0.5) * 0.005
      });
      lifetimes.push(Math.random() * 60);
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff33aa,
      size: 0.13, // Tamaño ampliado para suavizar el aspecto circular
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeom, particleMaterial);
    boxGroup.add(particles);

    // Estados e interactividad calibrada con márgenes de seguridad para no recortar la caja
    let targetRotX = 1.15; // inclinación de frente
    let targetRotY = defaultRotY;
    let targetLidAngle = 0.0;
    let targetLightIntensity = 1.5;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1; 
      const y = -((e.clientY - rect.top) / rect.height * 2 - 1); 
      
      targetRotY = defaultRotY + x * 0.15;
      targetRotX = 1.14 - y * 0.10;
      targetLidAngle = -1.30;
      targetLightIntensity = 6.0;

      Games.hoverStates[gameKey] = true;
    });

    container.addEventListener('mouseleave', () => {
      targetRotY = defaultRotY;
      targetRotX = 1.15;
      targetLidAngle = 0.0;
      targetLightIntensity = 1.5;

      Games.hoverStates[gameKey] = false;
    });

    cabinets.push({
      container,
      scene,
      camera,
      boxGroup,
      lidPivot,
      internalLight,
      particles,
      particleGeom,
      particleCount,
      velocities,
      lifetimes,
      texture,
      gameKey,
      frameCount: 0,
      isInViewport: false,
      get targetRotX() { return targetRotX; },
      get targetRotY() { return targetRotY; },
      get targetLidAngle() { return targetLidAngle; },
      get targetLightIntensity() { return targetLightIntensity; }
    });

    // Observar contenedor para control de renderizado y viewport
    observer.observe(container);
  }

  // Cargar las 3 cajas con un ángulo sutil inicial seguro (evita recortes en esquinas)
  addCabinet('cabinet-3d-1', 'game-canvas-3', 'game3', 0.14);
  addCabinet('cabinet-3d-2', 'game-canvas-1', 'game1', 0.0);
  addCabinet('cabinet-3d-3', 'game-canvas-4', 'game4', -0.14);

  // Ajustar tamaño del canvas compartido
  function resizeSharedCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
    }
  }

  // Bucle de renderizado unificado
  function animate() {
    requestAnimationFrame(animate);

    if (document.hidden) return;

    resizeSharedCanvas();

    // Limpiar canvas global
    renderer.clear();

    cabinets.forEach(cab => {
      // Optimización: Si el IntersectionObserver reporta que no es visible, omitir todo
      if (!cab.isInViewport) {
        return;
      }

      const rect = cab.container.getBoundingClientRect();
      const isHovered = Games.hoverStates[cab.gameKey];

      // Suavizado de rotaciones y apertura de tapa
      cab.boxGroup.rotation.y += (cab.targetRotY - cab.boxGroup.rotation.y) * 0.12;
      cab.boxGroup.rotation.x += (cab.targetRotX - cab.boxGroup.rotation.x) * 0.12;
      cab.lidPivot.rotation.x += (cab.targetLidAngle - cab.lidPivot.rotation.x) * 0.12;
      cab.internalLight.intensity += (cab.targetLightIntensity - cab.internalLight.intensity) * 0.12;

      // Animación de partículas de vapor (solo si está hovered/abierto)
      if (isHovered) {
        cab.particles.visible = true;
        const posAttr = cab.particleGeom.attributes.position;
        for (let i = 0; i < cab.particleCount; i++) {
          posAttr.array[i * 3] += cab.velocities[i].x;
          posAttr.array[i * 3 + 1] += cab.velocities[i].y;
          posAttr.array[i * 3 + 2] += cab.velocities[i].z;

          cab.lifetimes[i] -= 1;

          if (cab.lifetimes[i] <= 0 || posAttr.array[i * 3 + 1] > 1.4) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.42;
            posAttr.array[i * 3] = Math.cos(angle) * r;
            posAttr.array[i * 3 + 1] = 0.04;
            posAttr.array[i * 3 + 2] = Math.sin(angle) * r;
            cab.lifetimes[i] = 40 + Math.random() * 50;
          }
        }
        posAttr.needsUpdate = true;
      } else {
        cab.particles.visible = false;
      }

      // Optimización de Textura: Solo actualizar textura en GPU si la simulación 2D pintó un frame nuevo
      if (Games.textureUpdated[cab.gameKey]) {
        cab.texture.needsUpdate = true;
        Games.textureUpdated[cab.gameKey] = false;
      }

      // Configurar área de Viewport y Scissor
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left = rect.left;
      const bottom = window.innerHeight - rect.bottom;

      cab.camera.aspect = width / height;
      cab.camera.updateProjectionMatrix();

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);

      renderer.render(cab.scene, cab.camera);
    });
  }

  animate();
}
