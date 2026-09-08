import * as THREE from 'three';
import { Sound } from './sound.js';

export function initUnboxing3D(onCompleteCallback) {
  const container = document.getElementById('unboxing-canvas-container');
  if (!container) return;

  // 1. Configuración de la Escena 3D
  const scene = new THREE.Scene();
  
  // Cámara con perspectiva cinemática
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 4.0, 16.0);
  camera.lookAt(0, 0.5, 0);

  // Renderizador WebGL de alta precisión
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // 2. Iluminación PBR de Taberna Real
  const ambientLight = new THREE.AmbientLight(0x2a1408, 2.8);
  scene.add(ambientLight);

  // Antorcha dorada cenital
  const dirLight = new THREE.DirectionalLight(0xffea9f, 4.5); 
  dirLight.position.set(6, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  // Luz de acento rosa Elixir de taberna
  const elixirLight = new THREE.PointLight(0xf61b7f, 6, 25); 
  elixirLight.position.set(-6, 4, 7);
  scene.add(elixirLight);

  // Luz interna del horno (Brillo incandescente)
  const coreLight = new THREE.PointLight(0xff7700, 8, 15);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  // Luz de haz celestial que se activa al abrir el cofre
  const beamLight = new THREE.SpotLight(0xffdf78, 0, 30, Math.PI / 5, 0.4, 1.2);
  beamLight.position.set(0, 8, 0);
  beamLight.target.position.set(0, 0, 0);
  scene.add(beamLight);
  scene.add(beamLight.target);

  // Grupo principal del cofre
  const crateGroup = new THREE.Group();
  scene.add(crateGroup);

  // Ajuste responsivo de escala y posición
  const adjustScaleForResponsive = () => {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.0) {
      // Móvil vertical
      const scaleVal = Math.min(0.68, Math.max(0.55, aspect * 0.9));
      crateGroup.scale.set(scaleVal, scaleVal, scaleVal);
      crateGroup.position.set(0, 0.8, 0);
      camera.position.set(0, 4.2, 17.5);
    } else {
      // Pantallas anchas / Escritorio
      crateGroup.scale.set(0.82, 0.82, 0.82);
      crateGroup.position.set(0, 0.55, 0);
      camera.position.set(0, 4.0, 16.0);
    }
  };
  adjustScaleForResponsive();

  // 3. Generación de Texturas Procedurales en Alta Resolución
  function createPolishedWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Degradado base de caoba noble oscura
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#4a1e0b');
    grad.addColorStop(0.5, '#351406');
    grad.addColorStop(1, '#230a02');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Capas de veteado de madera fina
    ctx.fillStyle = 'rgba(28, 8, 2, 0.45)';
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 1024;
      const h = 6 + Math.random() * 28;
      ctx.fillRect(0, y, 1024, h);
    }
    
    // Fibras curvas orgánicas
    ctx.strokeStyle = 'rgba(18, 5, 1, 0.6)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      const y = Math.random() * 1024;
      ctx.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 30) {
        const dy = Math.sin(x * 0.02 + y) * 8 + Math.cos(x * 0.01) * 3;
        ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
    
    // Sutiles nudos de madera
    for (let i = 0; i < 4; i++) {
      const kx = 150 + Math.random() * 700;
      const ky = 150 + Math.random() * 700;
      for (let r = 8; r < 55; r += 10) {
        ctx.strokeStyle = `rgba(20, 6, 2, ${0.4 - (r / 150)})`;
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 2.8, r, Math.PI / 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Viñeteado en bordes para dar sensación de volumen biselado
    const edgeGrad = ctx.createRadialGradient(512, 512, 350, 512, 512, 600);
    edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, 1024, 1024);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const woodTexture = createPolishedWoodTexture();

  // 4. Materiales PBR Estilo Clash Fantasy
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.035,
    roughness: 0.45,
    metalness: 0.05
  });

  const royalGoldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdf78,
    emissive: 0x996515,
    emissiveIntensity: 0.35,
    metalness: 0.95,
    roughness: 0.18
  });

  const antiqueIronMaterial = new THREE.MeshStandardMaterial({
    color: 0x241b16,
    metalness: 0.85,
    roughness: 0.45
  });

  const crustMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9822b,
    roughness: 0.85,
    metalness: 0.02
  });

  const meltedCheeseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    emissive: 0xcc7a00,
    emissiveIntensity: 0.3,
    roughness: 0.35,
    metalness: 0.05
  });

  const pepperoniRubyMaterial = new THREE.MeshStandardMaterial({
    color: 0x9e0b1c,
    emissive: 0x5e0009,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.25
  });

  const basilMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d862d,
    roughness: 0.5,
    metalness: 0.0
  });

  const rubyGemMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xd50000,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.9
  });

  const emberSlitMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: 0xff5500,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });

  // --- 5. ESTRUCTURA 3D DEL COFRE ---

  // A. Base del Cofre
  const baseGeom = new THREE.BoxGeometry(6.6, 0.95, 6.6);
  const baseMesh = new THREE.Mesh(baseGeom, woodMaterial);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.position.y = -0.48;
  crateGroup.add(baseMesh);

  // Ranuras de brasas incandescentes en la base
  const slitGeom = new THREE.BoxGeometry(6.4, 0.04, 0.04);
  const slitFront = new THREE.Mesh(slitGeom, emberSlitMaterial);
  slitFront.position.set(0, -0.05, 3.31);
  crateGroup.add(slitFront);

  // Cantos y molduras de oro en la base
  const trimGeom = new THREE.BoxGeometry(6.66, 0.1, 0.1);
  const trimFront = new THREE.Mesh(trimGeom, royalGoldMaterial);
  trimFront.position.set(0, -0.05, 3.32);
  crateGroup.add(trimFront);

  const trimBack = new THREE.Mesh(trimGeom, royalGoldMaterial);
  trimBack.position.set(0, -0.05, -3.32);
  crateGroup.add(trimBack);

  // B. Tapa del Cofre con Pivote Posterior
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0, -3.3);
  crateGroup.add(lidPivot);

  const lidGeom = new THREE.BoxGeometry(6.6, 0.24, 6.6);
  const lidMesh = new THREE.Mesh(lidGeom, woodMaterial);
  lidMesh.castShadow = true;
  lidMesh.position.set(0, 0.12, 3.3);
  lidPivot.add(lidMesh);

  // Marcos biselados de oro en los bordes de la tapa
  const lidBorderX = new THREE.BoxGeometry(6.64, 0.06, 0.08);
  const lidBorderZ = new THREE.BoxGeometry(0.08, 0.06, 6.64);
  
  const borderFront = new THREE.Mesh(lidBorderX, royalGoldMaterial);
  borderFront.position.set(0, 0.23, 6.6);
  lidPivot.add(borderFront);

  const borderLeft = new THREE.Mesh(lidBorderZ, royalGoldMaterial);
  borderLeft.position.set(-3.3, 0.23, 3.3);
  lidPivot.add(borderLeft);

  const borderRight = new THREE.Mesh(lidBorderZ, royalGoldMaterial);
  borderRight.position.set(3.3, 0.23, 3.3);
  lidPivot.add(borderRight);

  // --- 6. ESCUDO DE ARMAS REAL DE PIZZA (MEDALLÓN CENTRAL) ---
  const emblemGroup = new THREE.Group();
  emblemGroup.position.set(0, 0.25, 3.3);
  lidPivot.add(emblemGroup);

  // Base circular de oro bruñido con bisel
  const medallionBaseGeom = new THREE.CylinderGeometry(2.1, 2.15, 0.08, 36);
  const medallionBase = new THREE.Mesh(medallionBaseGeom, royalGoldMaterial);
  emblemGroup.add(medallionBase);

  // Corona de laureles / tachones de oro alrededor del medallón
  const laurelCount = 18;
  const laurelGeom = new THREE.SphereGeometry(0.08, 8, 8);
  for (let i = 0; i < laurelCount; i++) {
    const angle = (i / laurelCount) * Math.PI * 2;
    const laurel = new THREE.Mesh(laurelGeom, royalGoldMaterial);
    laurel.position.set(Math.cos(angle) * 1.95, 0.05, Math.sin(angle) * 1.95);
    emblemGroup.add(laurel);
  }

  // Núcleo de hierro oscuro grabado
  const medallionInnerGeom = new THREE.CylinderGeometry(1.78, 1.78, 0.1, 36);
  const medallionInner = new THREE.Mesh(medallionInnerGeom, antiqueIronMaterial);
  emblemGroup.add(medallionInner);

  // Rebanada de Pizza 3D con curvatura y volumen
  const sliceGroup = new THREE.Group();
  sliceGroup.position.set(0, 0.06, 0.1);
  emblemGroup.add(sliceGroup);

  // Masa y queso fundido triangular
  const sliceGeom = new THREE.CylinderGeometry(1.35, 1.35, 0.11, 3);
  const sliceMesh = new THREE.Mesh(sliceGeom, meltedCheeseMaterial);
  sliceMesh.rotation.y = Math.PI;
  sliceGroup.add(sliceMesh);

  // Masa crujiente arqueada en la base superior
  const crustGeom = new THREE.BoxGeometry(1.75, 0.16, 0.32);
  const crustMesh = new THREE.Mesh(crustGeom, crustMaterial);
  crustMesh.position.set(0, 0.04, -0.58);
  sliceGroup.add(crustMesh);

  // Rodajas de pepperoni rubí con brillo
  const pepGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16);
  
  const pep1 = new THREE.Mesh(pepGeom, pepperoniRubyMaterial);
  pep1.position.set(-0.32, 0.07, -0.22);
  sliceGroup.add(pep1);

  const pep2 = new THREE.Mesh(pepGeom, pepperoniRubyMaterial);
  pep2.position.set(0.32, 0.07, -0.22);
  sliceGroup.add(pep2);

  const pep3 = new THREE.Mesh(pepGeom, pepperoniRubyMaterial);
  pep3.position.set(0, 0.07, 0.32);
  sliceGroup.add(pep3);

  // Hojas de albahaca fresca
  const basilGeom = new THREE.BoxGeometry(0.16, 0.03, 0.25);
  const basil1 = new THREE.Mesh(basilGeom, basilMaterial);
  basil1.rotation.y = 0.6;
  basil1.position.set(0.12, 0.07, 0.05);
  sliceGroup.add(basil1);

  // Corona Imperial de 5 puntas sobre la rebanada
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 0.18, -0.65);
  sliceGroup.add(crownGroup);

  const crownBaseGeom = new THREE.CylinderGeometry(0.55, 0.42, 0.25, 5);
  const crownMesh = new THREE.Mesh(crownBaseGeom, royalGoldMaterial);
  crownGroup.add(crownMesh);

  // 5 Gemas de Rubí en las puntas de la corona
  const gemGeom = new THREE.SphereGeometry(0.08, 8, 8);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const gem = new THREE.Mesh(gemGeom, rubyGemMaterial);
    gem.position.set(Math.cos(angle) * 0.48, 0.14, Math.sin(angle) * 0.48);
    crownGroup.add(gem);
  }

  // --- 7. HERRAJES DE ESQUINA Y CERROJO ---
  const bracketGeom = new THREE.BoxGeometry(0.75, 0.06, 0.75);
  const cornerPositions = [
    [-3.0, 0.24, 0.3],
    [3.0, 0.24, 0.3],
    [-3.0, 0.24, 6.3],
    [3.0, 0.24, 6.3]
  ];

  cornerPositions.forEach(pos => {
    const bracket = new THREE.Mesh(bracketGeom, royalGoldMaterial);
    bracket.position.set(pos[0], pos[1], pos[2]);
    lidPivot.add(bracket);

    const rivetGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8);
    const rivet = new THREE.Mesh(rivetGeom, antiqueIronMaterial);
    rivet.position.set(pos[0], pos[1] + 0.04, pos[2]);
    lidPivot.add(rivet);
  });

  // Cerrojo frontal con picaporte y bocallave
  const lockPivot = new THREE.Group();
  lockPivot.position.set(0, 0.05, 6.68);
  lidPivot.add(lockPivot);

  const lockGeom = new THREE.BoxGeometry(0.85, 0.3, 0.18);
  const lockMesh = new THREE.Mesh(lockGeom, royalGoldMaterial);
  lockPivot.add(lockMesh);

  const keyholeGeom = new THREE.BoxGeometry(0.12, 0.16, 0.04);
  const keyhole = new THREE.Mesh(keyholeGeom, antiqueIronMaterial);
  keyhole.position.set(0, 0, 0.1);
  lockPivot.add(keyhole);

  // --- 8. PIZZA LEGENDARIA FLOTANTE INTERIOR ---
  const floatingPizza = new THREE.Group();
  floatingPizza.position.set(0, -0.15, 0);
  crateGroup.add(floatingPizza);

  // Masa y corteza redonda de la pizza
  const pizzaDoughGeom = new THREE.CylinderGeometry(2.5, 2.55, 0.18, 36);
  const pizzaDough = new THREE.Mesh(pizzaDoughGeom, crustMaterial);
  floatingPizza.add(pizzaDough);

  const pizzaCrustRingGeom = new THREE.TorusGeometry(2.4, 0.15, 12, 36);
  const pizzaCrustRing = new THREE.Mesh(pizzaCrustRingGeom, crustMaterial);
  pizzaCrustRing.rotation.x = Math.PI / 2;
  pizzaCrustRing.position.y = 0.09;
  floatingPizza.add(pizzaCrustRing);

  // Capa de queso fundido brillante
  const pizzaCheeseGeom = new THREE.CylinderGeometry(2.36, 2.36, 0.07, 36);
  const pizzaCheese = new THREE.Mesh(pizzaCheeseGeom, meltedCheeseMaterial);
  pizzaCheese.position.y = 0.1;
  floatingPizza.add(pizzaCheese);

  // Rodajas de Pepperoni en círculo
  const innerPepGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const pep = new THREE.Mesh(innerPepGeom, pepperoniRubyMaterial);
    pep.position.set(Math.cos(angle) * 1.45, 0.14, Math.sin(angle) * 1.45);
    floatingPizza.add(pep);
  }
  const centerPep = new THREE.Mesh(innerPepGeom, pepperoniRubyMaterial);
  centerPep.position.set(0, 0.14, 0);
  floatingPizza.add(centerPep);

  // --- 9. SISTEMA DE PARTÍCULAS: BRASAS DORADAS Y VAPOR ---
  
  // A. Brasas flotantes doradas orgánicas
  const emberCount = 55;
  const emberGeo = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(emberCount * 3);
  const emberVelocities = [];

  for (let i = 0; i < emberCount; i++) {
    emberPositions[i * 3] = (Math.random() - 0.5) * 14;
    emberPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    emberVelocities.push({
      vx: (Math.random() - 0.5) * 0.008,
      vy: 0.015 + Math.random() * 0.02,
      vz: (Math.random() - 0.5) * 0.008,
      phase: Math.random() * Math.PI * 2
    });
  }

  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));

  function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 140, 1)');
    grad.addColorStop(0.3, 'rgba(255, 160, 40, 0.8)');
    grad.addColorStop(0.8, 'rgba(246, 27, 127, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  const emberMat = new THREE.PointsMaterial({
    size: 0.45,
    map: createSparkTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const emberPoints = new THREE.Points(emberGeo, emberMat);
  scene.add(emberPoints);

  // B. Vapor cálido caliente
  const steamParticles = [];
  const steamCount = 30;
  const steamGroup = new THREE.Group();
  scene.add(steamGroup);

  const steamGeo = new THREE.SphereGeometry(0.2, 5, 5);
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffd866,
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
    const radius = 3.0 + Math.random() * 0.5;
    p.position.set(Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius);
    p.userData = {
      speedY: 0.015 + Math.random() * 0.025,
      speedX: (Math.random() - 0.5) * 0.01,
      speedZ: (Math.random() - 0.5) * 0.01,
      growth: 1.015,
      maxLife: 70 + Math.random() * 60,
      life: 0
    };
    p.scale.set(1, 1, 1);
    p.material.opacity = 0;
  }

  // C. Explosión de chispas de cerrojo
  let explosionParticles = null;
  const blastCount = 120;
  let explosionActive = false;

  function triggerLockBlast() {
    const geom = new THREE.BufferGeometry();
    const posArray = new Float32Array(blastCount * 3);
    const velArray = [];
    const colorArray = new Float32Array(blastCount * 3);

    for (let i = 0; i < blastCount; i++) {
      posArray[i * 3] = 0;
      posArray[i * 3 + 1] = 0.1;
      posArray[i * 3 + 2] = 3.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.35;
      velArray.push({
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed + 0.15,
        z: 0.2 + Math.random() * 0.3
      });

      colorArray[i * 3] = 1.0;
      colorArray[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colorArray[i * 3 + 2] = 0.2;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      map: createSparkTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    explosionParticles = new THREE.Points(geom, mat);
    explosionParticles.userData = { velocities: velArray };
    scene.add(explosionParticles);
    explosionActive = true;
  }

  // --- 10. INTERACTIVIDAD Y SEGUIMIENTO DEL MOUSE ---
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
  let prevTouchX = 0;
  let prevTouchY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && !unboxingStarted) {
      isDragging = true;
      prevTouchX = e.touches[0].clientX;
      prevTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1 && !unboxingStarted) {
      const deltaX = e.touches[0].clientX - prevTouchX;
      const deltaY = e.touches[0].clientY - prevTouchY;
      
      targetRotY += deltaX * 0.007;
      targetRotX += deltaY * 0.007;
      targetRotX = Math.max(-0.2, Math.min(1.1, targetRotX));
      
      prevTouchX = e.touches[0].clientX;
      prevTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // --- 11. SECUENCIA CINEMÁTICA DE APERTURA (CLASH UNBOXING) ---
  const openButton = document.getElementById('open-box-btn');
  let unboxingStarted = false;
  let animTime = 0;
  let lidAngle = 0;
  let cameraShake = 0;
  let pizzaAscendProgress = 0;

  if (openButton) {
    openButton.addEventListener('mouseenter', () => Sound.playHoverBlip());

    openButton.addEventListener('click', () => {
      if (unboxingStarted) return;
      unboxingStarted = true;

      // Desvanecer botón y textos
      openButton.style.transition = 'all 0.3s ease';
      openButton.style.transform = 'scale(0) rotate(15deg)';
      openButton.style.opacity = '0';
      
      const unboxingText = document.getElementById('unboxing-texts');
      if (unboxingText) {
        unboxingText.style.opacity = '0';
        unboxingText.style.transform = 'translateY(-20px)';
      }

      // Reproducir sonido de apertura
      Sound.playUnboxingSound();
      
      // Fase 1: Salto de cerrojo y temblor
      triggerLockBlast();
      lockPivot.position.z += 0.8;
      lockPivot.rotation.x = 0.5;

      setTimeout(() => {
        Sound.toggleMusic(true);
      }, 700);
    });
  }

  // --- 12. BUCLE DE RENDERIZADO Y ANIMACIÓN ---
  let active = true;
  let lastTime = performance.now();

  function animate() {
    if (!active) return;
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    // A. Rotación suave con inercia
    crateGroup.rotation.y += (targetRotY - crateGroup.rotation.y) * 0.08;
    crateGroup.rotation.x += (targetRotX - crateGroup.rotation.x) * 0.08;

    // B. Animación de brasas doradas flotantes
    const pos = emberGeo.attributes.position.array;
    for (let i = 0; i < emberCount; i++) {
      const v = emberVelocities[i];
      pos[i * 3 + 1] += v.vy;
      pos[i * 3] += v.vx + Math.sin(now * 0.002 + v.phase) * 0.005;
      
      // Reiniciar si sube demasiado
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = -6;
        pos[i * 3] = (Math.random() - 0.5) * 14;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
    }
    emberGeo.attributes.position.needsUpdate = true;

    // C. Animación de vapor
    steamParticles.forEach(p => {
      p.position.y += p.userData.speedY;
      p.position.x += p.userData.speedX;
      p.scale.multiplyScalar(p.userData.growth);
      p.userData.life += 1;

      const age = p.userData.life / p.userData.maxLife;
      p.material.opacity = age < 0.2 ? (age / 0.2) * 0.25 : (1 - age) * 0.25;

      if (p.userData.life >= p.userData.maxLife) {
        resetSteamParticle(p);
      }
    });

    // D. Chispas de la explosión del cerrojo
    if (explosionActive && explosionParticles) {
      const pArr = explosionParticles.geometry.attributes.position.array;
      const vArr = explosionParticles.userData.velocities;
      for (let i = 0; i < blastCount; i++) {
        pArr[i * 3] += vArr[i].x;
        pArr[i * 3 + 1] += vArr[i].y;
        pArr[i * 3 + 2] += vArr[i].z;
        vArr[i].y -= 0.008;
      }
      explosionParticles.geometry.attributes.position.needsUpdate = true;
      explosionParticles.material.size *= 0.98;
    }

    // E. Secuencia de Unboxing Activa
    if (unboxingStarted) {
      animTime += delta;

      // Fase 1: Temblor de anticipación (0 - 0.35s)
      if (animTime < 0.35) {
        cameraShake = 0.5;
        coreLight.intensity = 15 + Math.sin(animTime * 40) * 10;
      }
      
      // Fase 2: Apertura de la Tapa y Haz de Luz (0.35s+)
      if (animTime >= 0.35) {
        if (lidAngle < Math.PI * 0.7) {
          lidAngle += (Math.PI * 0.7 - lidAngle) * 0.12 + 0.005;
          lidPivot.rotation.x = -lidAngle;
        }

        beamLight.intensity = Math.min(12, beamLight.intensity + 0.6);
        coreLight.intensity = Math.min(30, coreLight.intensity + 1.2);
        
        // Fase 3: Pizza Flotante que asciende
        if (pizzaAscendProgress < 1.0) {
          pizzaAscendProgress += delta * 0.9;
          const easeY = Math.sin(pizzaAscendProgress * Math.PI / 2);
          floatingPizza.position.y = -0.15 + easeY * 2.2;
          floatingPizza.rotation.y += 0.05;
          floatingPizza.rotation.x = easeY * 0.3;
          floatingPizza.scale.setScalar(1.0 + easeY * 0.25);
        } else {
          floatingPizza.rotation.y += 0.03;
        }
      }

      // Temblor de cámara
      if (cameraShake > 0.01) {
        camera.position.x = (Math.random() - 0.5) * cameraShake;
        camera.position.y = 4.0 + (Math.random() - 0.5) * cameraShake;
        cameraShake *= 0.9;
      } else {
        camera.position.x = 0;
        camera.position.y = 4.0;
      }

      // Fase 4: Fundido y Transición al Dashboard (1.8s+)
      if (animTime > 1.8) {
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
            
            // Liberar memoria WebGL
            const gl = renderer.getContext();
            const extension = gl ? gl.getExtension('WEBGL_lose_context') : null;
            if (extension) extension.loseContext();
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
