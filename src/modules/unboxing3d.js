import * as THREE from 'three';
import { Sound } from './sound.js';

export function initUnboxing3D(onCompleteCallback) {
  const container = document.getElementById('unboxing-canvas-container');
  if (!container) return;

  // 1. Configuración Básica de la Escena 3D
  const scene = new THREE.Scene();
  
  // Cámara de perspectiva
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 4, 15);
  camera.lookAt(0, 0, 0);

  // Renderizador WebGL
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 2. Iluminación Royal Tavern (Cálida antorcha, haz dorado y elixir rosa)
  const ambientLight = new THREE.AmbientLight(0x3d1d07, 2.5); // Luz ambiental madera cálida
  scene.add(ambientLight);

  // Luz direccional de cofre dorado (Haz dorado brillante)
  const dirLight = new THREE.DirectionalLight(0xffd866, 4.5); 
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // Luz de acento rosa Elixir
  const elixirLight = new THREE.PointLight(0xf61b7f, 9, 20); 
  elixirLight.position.set(-5, 3, 5);
  scene.add(elixirLight);

  // Luz interna de la caja (Fuego dorado del horno real)
  const coreLight = new THREE.PointLight(0xff9b26, 20, 15);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  const crateGroup = new THREE.Group();
  scene.add(crateGroup);

  // Ajuste responsivo de escala y encuadre para dar espacio al botón inferior
  const adjustScaleForResponsive = () => {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.0) {
      // Móvil vertical: Cesta más compacta y centrada arriba
      const scaleVal = Math.min(0.68, Math.max(0.55, aspect * 0.9));
      crateGroup.scale.set(scaleVal, scaleVal, scaleVal);
      crateGroup.position.set(0, 0.8, 0);
      camera.position.set(0, 4.2, 17.5);
    } else {
      // Escritorio panorámico: Escala 0.82 y posición elevada
      crateGroup.scale.set(0.82, 0.82, 0.82);
      crateGroup.position.set(0, 0.55, 0);
      camera.position.set(0, 4.0, 16.0);
    }
  };
  adjustScaleForResponsive();

  // Generar textura procedimental de grano de madera rústica
  function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Color base caoba/marrón cálido medieval
    ctx.fillStyle = '#5d3215';
    ctx.fillRect(0, 0, 512, 512);
    
    // Veteado oscuro de madera
    ctx.fillStyle = '#41200b';
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 512;
      const h = 8 + Math.random() * 24;
      ctx.fillRect(0, y, 512, h);
    }
    
    // Líneas de grano fino curvas
    ctx.strokeStyle = '#291203';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      const y = Math.random() * 512;
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 20) {
        const dy = Math.sin(x * 0.03 + y) * 5;
        ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
    
    // Nudos de madera (círculos concéntricos estirados)
    ctx.strokeStyle = 'rgba(41, 18, 3, 0.4)';
    for (let i = 0; i < 3; i++) {
      const kx = 100 + Math.random() * 300;
      const ky = 100 + Math.random() * 300;
      for (let r = 5; r < 40; r += 8) {
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 2.5, r, Math.PI / 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Ruido orgánico de fibra
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  const woodTexture = createWoodTexture();

  // Materiales temáticos de la Pizzería Real
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.05,
    roughness: 0.8,
    metalness: 0.1,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd866,
    emissive: 0xb8860b,
    emissiveIntensity: 0.35,
    metalness: 0.92,
    roughness: 0.18
  });

  const darkIronMaterial = new THREE.MeshStandardMaterial({
    color: 0x221a15,
    metalness: 0.7,
    roughness: 0.5
  });

  const crustMaterial = new THREE.MeshStandardMaterial({
    color: 0xc87d2a,
    roughness: 0.9,
    metalness: 0.0
  });

  const cheeseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    emissive: 0x995c00,
    emissiveIntensity: 0.2,
    roughness: 0.45,
    metalness: 0.05
  });

  const pepperoniMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b111e,
    emissive: 0x4a0005,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.2
  });

  const basilMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d862d,
    roughness: 0.6,
    metalness: 0.0
  });

  const emberGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7b00,
    emissive: 0xff5500,
    emissiveIntensity: 1.8,
    roughness: 0.2
  });

  // --- BASE DE LA CAJA (Cofre Real de Madera y Borde Metálico) ---
  const baseGeom = new THREE.BoxGeometry(6.6, 0.9, 6.6);
  const baseMesh = new THREE.Mesh(baseGeom, woodMaterial);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.position.y = -0.45;
  crateGroup.add(baseMesh);

  // Cantos y ribetes de oro en la base
  const trimGeomH = new THREE.BoxGeometry(6.65, 0.08, 0.08);
  const trimFront = new THREE.Mesh(trimGeomH, goldMaterial);
  trimFront.position.set(0, -0.05, 3.31);
  crateGroup.add(trimFront);

  const trimBack = new THREE.Mesh(trimGeomH, goldMaterial);
  trimBack.position.set(0, -0.05, -3.31);
  crateGroup.add(trimBack);

  // --- PIZZA 3D INTERIOR (Revelada al abrir la caja) ---
  const pizzaGroup = new THREE.Group();
  pizzaGroup.position.set(0, -0.15, 0);
  crateGroup.add(pizzaGroup);

  // Masa y corteza de la pizza
  const pizzaDoughGeom = new THREE.CylinderGeometry(2.45, 2.5, 0.18, 32);
  const pizzaDough = new THREE.Mesh(pizzaDoughGeom, crustMaterial);
  pizzaGroup.add(pizzaDough);

  const pizzaCrustRingGeom = new THREE.TorusGeometry(2.35, 0.14, 10, 32);
  const pizzaCrustRing = new THREE.Mesh(pizzaCrustRingGeom, crustMaterial);
  pizzaCrustRing.rotation.x = Math.PI / 2;
  pizzaCrustRing.position.y = 0.08;
  pizzaGroup.add(pizzaCrustRing);

  // Capa de queso fundido brillante
  const pizzaCheeseGeom = new THREE.CylinderGeometry(2.32, 2.32, 0.06, 32);
  const pizzaCheese = new THREE.Mesh(pizzaCheeseGeom, cheeseMaterial);
  pizzaCheese.position.y = 0.1;
  pizzaGroup.add(pizzaCheese);

  // Rodajas de Pepperoni en la pizza interior
  const pepGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16);
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const rad = 1.4;
    const pep = new THREE.Mesh(pepGeom, pepperoniMaterial);
    pep.position.set(Math.cos(angle) * rad, 0.13, Math.sin(angle) * rad);
    pizzaGroup.add(pep);
  }
  // Pepperoni central
  const centerPep = new THREE.Mesh(pepGeom, pepperoniMaterial);
  centerPep.position.set(0, 0.13, 0);
  pizzaGroup.add(centerPep);

  // --- TAPA DE LA CAJA REAL ---
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0, -3.3);
  crateGroup.add(lidPivot);

  const lidGeom = new THREE.BoxGeometry(6.6, 0.22, 6.6);
  const lidMesh = new THREE.Mesh(lidGeom, woodMaterial);
  lidMesh.castShadow = true;
  lidMesh.position.set(0, 0.11, 3.3);
  lidPivot.add(lidMesh);

  // Ribetes dorados en los bordes de la tapa
  const lidBorderGeomX = new THREE.BoxGeometry(6.64, 0.06, 0.08);
  const lidBorderGeomZ = new THREE.BoxGeometry(0.08, 0.06, 6.64);
  
  const lidFrontBorder = new THREE.Mesh(lidBorderGeomX, goldMaterial);
  lidFrontBorder.position.set(0, 0.22, 6.6);
  lidPivot.add(lidFrontBorder);

  const lidLeftBorder = new THREE.Mesh(lidBorderGeomZ, goldMaterial);
  lidLeftBorder.position.set(-3.3, 0.22, 3.3);
  lidPivot.add(lidLeftBorder);

  const lidRightBorder = new THREE.Mesh(lidBorderGeomZ, goldMaterial);
  lidRightBorder.position.set(3.3, 0.22, 3.3);
  lidPivot.add(lidRightBorder);

  // --- ESCUDO / MEDALLÓN DE PIZZA REAL EN LA TAPA ---
  const emblemGroup = new THREE.Group();
  emblemGroup.position.set(0, 0.24, 3.3);
  lidPivot.add(emblemGroup);

  // Base circular del medallón en oro
  const medallionBaseGeom = new THREE.CylinderGeometry(2.0, 2.05, 0.06, 32);
  const medallionBase = new THREE.Mesh(medallionBaseGeom, goldMaterial);
  emblemGroup.add(medallionBase);

  // Aro interior oscuro de hierro/madera noble
  const medallionInnerGeom = new THREE.CylinderGeometry(1.85, 1.85, 0.08, 32);
  const medallionInner = new THREE.Mesh(medallionInnerGeom, darkIronMaterial);
  emblemGroup.add(medallionInner);

  // Rebanada de Pizza 3D estilizada en el centro del medallón
  const sliceCheeseGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.09, 3); // Cuña triangular
  const sliceCheeseMesh = new THREE.Mesh(sliceCheeseGeom, cheeseMaterial);
  sliceCheeseMesh.rotation.y = Math.PI;
  sliceCheeseMesh.position.set(0, 0.08, 0.15);
  emblemGroup.add(sliceCheeseMesh);

  // Borde de masa crujiente de la rebanada
  const sliceCrustGeom = new THREE.BoxGeometry(1.8, 0.14, 0.32);
  const sliceCrustMesh = new THREE.Mesh(sliceCrustGeom, crustMaterial);
  sliceCrustMesh.position.set(0, 0.12, -0.6);
  emblemGroup.add(sliceCrustMesh);

  // Pepperonis en la rebanada del escudo
  const emblemPepGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
  const emblemPep1 = new THREE.Mesh(emblemPepGeom, pepperoniMaterial);
  emblemPep1.position.set(-0.35, 0.14, -0.2);
  emblemGroup.add(emblemPep1);

  const emblemPep2 = new THREE.Mesh(emblemPepGeom, pepperoniMaterial);
  emblemPep2.position.set(0.35, 0.14, -0.2);
  emblemGroup.add(emblemPep2);

  const emblemPep3 = new THREE.Mesh(emblemPepGeom, pepperoniMaterial);
  emblemPep3.position.set(0, 0.14, 0.35);
  emblemGroup.add(emblemPep3);

  // Hojas de albahaca fresca
  const basilGeom = new THREE.BoxGeometry(0.18, 0.03, 0.28);
  const basil1 = new THREE.Mesh(basilGeom, basilMaterial);
  basil1.rotation.y = 0.5;
  basil1.position.set(0.15, 0.14, 0.05);
  emblemGroup.add(basil1);

  // Corona Real en Oro macizo coronando la rebanada
  const crownGeom = new THREE.CylinderGeometry(0.55, 0.42, 0.3, 5);
  const crownMesh = new THREE.Mesh(crownGeom, goldMaterial);
  crownMesh.position.set(0, 0.25, -0.65);
  emblemGroup.add(crownMesh);

  // Joya de rubí en la corona
  const jewelGeom = new THREE.SphereGeometry(0.1, 8, 8);
  const jewelMesh = new THREE.Mesh(jewelGeom, pepperoniMaterial);
  jewelMesh.position.set(0, 0.38, -0.65);
  emblemGroup.add(jewelMesh);

  // --- HERRAJES Y REMACHES EN LAS ESQUINAS ---
  const bracketGeom = new THREE.BoxGeometry(0.7, 0.05, 0.7);
  const cornerPositions = [
    [-3.0, 0.24, 0.3],
    [3.0, 0.24, 0.3],
    [-3.0, 0.24, 6.3],
    [3.0, 0.24, 6.3]
  ];

  cornerPositions.forEach(pos => {
    const bracket = new THREE.Mesh(bracketGeom, goldMaterial);
    bracket.position.set(pos[0], pos[1], pos[2]);
    lidPivot.add(bracket);

    const rivetGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
    const rivet = new THREE.Mesh(rivetGeom, darkIronMaterial);
    rivet.position.set(pos[0], pos[1] + 0.04, pos[2]);
    lidPivot.add(rivet);
  });

  // Cerradura dorada y picaporte en el frente
  const lockGeom = new THREE.BoxGeometry(0.8, 0.28, 0.18);
  const lockIndicator = new THREE.Mesh(lockGeom, goldMaterial);
  lockIndicator.position.set(0, 0.05, 6.68);
  lidPivot.add(lockIndicator);

  const keyholeGeom = new THREE.BoxGeometry(0.12, 0.16, 0.04);
  const keyhole = new THREE.Mesh(keyholeGeom, darkIronMaterial);
  keyhole.position.set(0, 0.05, 6.78);
  lidPivot.add(keyhole);

  // 4. Sistema de Vapor/Criogénico (Humo Mágico Elixir Rosa)
  const steamParticles = [];
  const steamCount = 35;
  const steamGroup = new THREE.Group();
  scene.add(steamGroup);

  const steamGeo = new THREE.SphereGeometry(0.2, 5, 5);
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xf61b7f, // Elixir Pink
    transparent: true,
    opacity: 0
  });

  for (let i = 0; i < steamCount; i++) {
    const p = new THREE.Mesh(steamGeo, steamMat.clone());
    resetSteamParticle(p);
    steamGroup.add(p);
    steamParticles.push(p);
  }

  function resetSteamParticle(p) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.2 + Math.random() * 0.4;
    p.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    
    p.userData = {
      speedY: 0.02 + Math.random() * 0.03,
      speedX: (Math.random() - 0.5) * 0.01,
      speedZ: (Math.random() - 0.5) * 0.01,
      growth: 1.01 + Math.random() * 0.01,
      maxLife: 80 + Math.random() * 80,
      life: 0
    };
    p.scale.set(1, 1, 1);
    p.material.opacity = 0;
  }

  // 5. Sistema de Partículas Explosivas (Gold & Elixir Spark Blast)
  let explosionParticles = null;
  const sparkCount = 150;
  let explosionActive = false;
  let explosionProgress = 0;

  function createNeonExplosion() {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];
    const colors = new Float32Array(sparkCount * 3);
    
    const palette = [
      new THREE.Color(0xffd866), // Oro Real
      new THREE.Color(0xf61b7f), // Elixir Pink
      new THREE.Color(0xff9b26), // Fuego Naranja
      new THREE.Color(0xffffff)  // Destello Blanco
    ];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.3;
      positions[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 0.15 + Math.random() * 0.25;

      velocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.abs(Math.sin(phi) * Math.sin(theta)) * speed + 0.1,
        z: Math.cos(phi) * speed
      });

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const pTexture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    explosionParticles = new THREE.Points(geom, mat);
    scene.add(explosionParticles);
    explosionParticles.userData = { velocities };
    explosionActive = true;
  }

  // 6. Interactividad y Arrastre Táctil
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0.35;
  let targetRotY = -0.3;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 - 1;
    
    if (!unboxingStarted && !isDragging) {
      targetRotY = mouseX * 0.35 - 0.3;
      targetRotX = -mouseY * 0.25 + 0.35;
    }
  });

  let isDragging = false;
  let previousTouchX = 0;
  let previousTouchY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && !unboxingStarted) {
      isDragging = true;
      previousTouchX = e.touches[0].clientX;
      previousTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1 && !unboxingStarted) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      const deltaX = touchX - previousTouchX;
      const deltaY = touchY - previousTouchY;
      
      targetRotY += deltaX * 0.007;
      targetRotX += deltaY * 0.007;
      
      targetRotX = Math.max(-0.2, Math.min(1.2, targetRotX));
      
      previousTouchX = touchX;
      previousTouchY = touchY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // 7. Lógica de Transición (Clic en botón de unboxing)
  const openButton = document.getElementById('open-box-btn');
  let unboxingStarted = false;
  let lidAngle = 0;
  let cameraShake = 0;
  let fadeProgress = 0;

  if (openButton) {
    openButton.addEventListener('mouseenter', () => {
      Sound.playHoverBlip();
    });

    openButton.addEventListener('click', () => {
      if (unboxingStarted) return;
      unboxingStarted = true;
      
      openButton.style.transform = 'scale(0) rotate(15deg)';
      openButton.style.opacity = '0';
      
      const unboxingText = document.getElementById('unboxing-texts');
      if (unboxingText) {
        unboxingText.style.opacity = '0';
        unboxingText.style.transform = 'translateY(-20px)';
      }

      Sound.playUnboxingSound();
      cameraShake = 0.8;
      
      setTimeout(() => {
        createNeonExplosion();
      }, 100);
      
      setTimeout(() => {
        Sound.toggleMusic(true);
      }, 800);
    });
  }

  // 8. Bucle de Animación
  let active = true;
  let lastTime = performance.now();

  function animate() {
    if (!active) return;
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    // --- A. Rotación con suavizado ---
    crateGroup.rotation.y += (targetRotY - crateGroup.rotation.y) * 0.08;
    crateGroup.rotation.x += (targetRotX - crateGroup.rotation.x) * 0.08;

    // --- B. Simulación de Vapor ---
    steamParticles.forEach(p => {
      p.position.y += p.userData.speedY;
      p.position.x += p.userData.speedX;
      p.position.z += p.userData.speedZ;
      p.scale.multiplyScalar(p.userData.growth);
      p.userData.life += 1;

      const agePercent = p.userData.life / p.userData.maxLife;
      if (agePercent < 0.2) {
        p.material.opacity = (agePercent / 0.2) * 0.35;
      } else {
        p.material.opacity = (1 - agePercent) * 0.35;
      }

      // Parpadeo de colores del vapor criogénico helado en tonos oro y elixir
      if (Math.random() > 0.85) {
        const rand = Math.random();
        if (rand < 0.4) {
          p.material.color.setHex(0xffd866); // Brillo oro
        } else if (rand < 0.8) {
          p.material.color.setHex(0xf61b7f); // Brillo elixir
        } else {
          p.material.color.setHex(0xffffff); // Blanco puro
        }
      }

      if (p.userData.life >= p.userData.maxLife) {
        resetSteamParticle(p);
      }
    });

    // --- C. Animación de apertura ---
    if (unboxingStarted) {
      if (lidAngle < Math.PI * 0.75) {
        lidAngle += (Math.PI * 0.75 - lidAngle) * 0.08 + 0.005;
        lidPivot.rotation.x = -lidAngle;
      }

      crateGroup.rotation.y += 0.04;
      crateGroup.rotation.z += 0.01;
      
      if (crateGroup.scale.x > 0.05) {
        crateGroup.scale.multiplyScalar(0.965);
      }

      coreLight.intensity += 0.5;

      steamGroup.position.y += 0.05;
      steamGroup.scale.multiplyScalar(0.97);

      // --- D. Animación de la Explosión ---
      if (explosionActive && explosionParticles) {
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;
        
        for (let i = 0; i < sparkCount; i++) {
          positions[i * 3] += velocities[i].x;
          positions[i * 3 + 1] += velocities[i].y;
          positions[i * 3 + 2] += velocities[i].z;
          
          velocities[i].y -= 0.004;
          velocities[i].x *= 0.98;
          velocities[i].y *= 0.98;
          velocities[i].z *= 0.98;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;
        explosionParticles.material.size *= 0.975;
        
        explosionProgress += delta;
        if (explosionProgress > 1.8) {
          scene.remove(explosionParticles);
          explosionParticles = null;
          explosionActive = false;
        }
      }

      // --- E. Temblor de cámara ---
      if (cameraShake > 0.01) {
        camera.position.x = (Math.random() - 0.5) * cameraShake;
        camera.position.y = 4 + (Math.random() - 0.5) * cameraShake;
        cameraShake *= 0.92;
      } else {
        camera.position.x = 0;
        camera.position.y = 4;
      }

      // --- F. Fundido a negro y Dashboard ---
      fadeProgress += delta;
      
      if (fadeProgress > 0.9) {
        const overlay = document.getElementById('unboxing-overlay');
        if (overlay && !overlay.classList.contains('fade-out-triggered')) {
          overlay.classList.add('fade-out-triggered');
          overlay.style.transition = 'opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1), pointer-events 1.2s';
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          
          const dashboard = document.getElementById('dashboard-main');
          if (dashboard) {
            dashboard.style.opacity = '1';
            dashboard.style.transform = 'scale(1)';
            dashboard.style.transition = 'opacity 1.5s ease-out 0.2s, transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s';
          }
          
          setTimeout(() => {
            active = false;
            overlay.style.display = 'none';
            if (onCompleteCallback) onCompleteCallback();
            
            // Forzar la pérdida de contexto para liberar recursos en móviles
            const gl = renderer.getContext();
            const extension = gl ? gl.getExtension('WEBGL_lose_context') : null;
            if (extension) {
              extension.loseContext();
            }
            renderer.dispose();
            container.innerHTML = '';
          }, 1250);
        }
      }
    }

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustScaleForResponsive();
  });
}
