import * as THREE from 'three';

/**
 * UV projection helper to map procedural textures accurately across ExtrudeGeometry surfaces.
 * For top/bottom caps & bevels (|Ny| >= 0.3), projects planar (X, Z) coordinates.
 * For vertical cut side walls (|Ny| < 0.3), maps length (Z) to U and dough thickness (Y) to V,
 * preventing collapsed 1-pixel streaks along the cut edges.
 */
function projectPlanarUVs(geometry, minX, maxX, minZ, maxZ, minY = -0.045, maxY = 0.040) {
  const posAttr = geometry.attributes.position;
  const uvAttr = geometry.attributes.uv;
  const normAttr = geometry.attributes.normal;
  if (!posAttr || !uvAttr) return;

  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;
  const rangeY = maxY - minY || 1;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    const ny = normAttr ? Math.abs(normAttr.getY(i)) : 1;
    if (ny < 0.3) {
      // Cut side walls: map U along slice length (Z) and V along slice thickness (Y)
      const u = Math.max(0, Math.min(1, (z - minZ) / rangeZ));
      const v = Math.max(0, Math.min(1, (y - minY) / rangeY));
      uvAttr.setXY(i, u, v);
    } else {
      // Horizontal top/bottom caps & bevels: map planar (X, Z) coordinates
      const u = Math.max(0, Math.min(1, (x - minX) / rangeX));
      const v = Math.max(0, Math.min(1, (z - minZ) / rangeZ));
      uvAttr.setXY(i, u, v);
    }
  }
  uvAttr.needsUpdate = true;
}

/**
 * Procedural texture generators for appetizing food materials
 */
function createCheeseTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base melted cheese gradient: warm golden yellow to rich cheese orange (#ffbe0b to #f77f00)
  const grad = ctx.createRadialGradient(128, 120, 20, 128, 128, 125);
  grad.addColorStop(0, '#ffbe0b');    // Radiant molten mozzarella
  grad.addColorStop(0.35, '#fcb017'); // Rich creamy cheddar
  grad.addColorStop(0.70, '#f77f00'); // Golden toasted cheese
  grad.addColorStop(1.0, '#d95d00');  // Warm baked edge
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Soft creamy melted mozzarella pools
  const poolColors = ['#fff5c0', '#ffefa0', '#fff8dc'];
  for (let i = 0; i < 18; i++) {
    const px = 25 + Math.random() * 206;
    const py = 25 + Math.random() * 206;
    const pr = 10 + Math.random() * 18;
    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    pGrad.addColorStop(0, poolColors[i % poolColors.length]);
    pGrad.addColorStop(1, 'rgba(255, 190, 11, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Baked brown blisters and toasting spots (#b06500 to #d48b38)
  const blisterColors = [
    'rgba(176, 101, 0, 0.75)',
    'rgba(148, 66, 0, 0.80)',
    'rgba(212, 139, 56, 0.70)',
    'rgba(120, 40, 0, 0.85)'
  ];
  for (let i = 0; i < 30; i++) {
    const bx = 20 + Math.random() * 216;
    const by = 20 + Math.random() * 216;
    const br = 2.5 + Math.random() * 6.5;
    ctx.fillStyle = blisterColors[i % blisterColors.length];
    ctx.beginPath();
    ctx.ellipse(bx, by, br, br * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine Italian herb specks (dried oregano & crushed seasoning)
  ctx.fillStyle = 'rgba(34, 78, 20, 0.65)';
  for (let i = 0; i < 40; i++) {
    const hx = 25 + Math.random() * 206;
    const hy = 25 + Math.random() * 206;
    ctx.beginPath();
    ctx.arc(hx, hy, 0.8 + Math.random() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

function createCrustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Warm golden-brown crust gradient (#b06500 to #d48b38)
  const grad = ctx.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, '#d48b38');
  grad.addColorStop(0.35, '#c57c2c');
  grad.addColorStop(0.70, '#b06500');
  grad.addColorStop(1.0, '#8f4f00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  // Baked crust flour dusting and wood-fired oven spots
  for (let i = 0; i < 36; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const r = 3 + Math.random() * 12;
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(238, 214, 178, 0.38)' : 'rgba(88, 42, 0, 0.36)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.generateMipmaps = true;
  return texture;
}

function createPepperoniTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Spiced pepperoni crimson gradient with darker crispy edge
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
  grad.addColorStop(0, '#c1121f');
  grad.addColorStop(0.55, '#a4161a');
  grad.addColorStop(0.85, '#780000');
  grad.addColorStop(1.0, '#480407');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  // Fine marbled fat flecks
  ctx.fillStyle = 'rgba(255, 238, 232, 0.76)';
  for (let i = 0; i < 24; i++) {
    const fx = 25 + Math.random() * 78;
    const fy = 25 + Math.random() * 78;
    if ((fx - 64) ** 2 + (fy - 64) ** 2 < 48 ** 2) {
      ctx.beginPath();
      ctx.arc(fx, fy, 1 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dark crushed spice specks
  ctx.fillStyle = 'rgba(40, 4, 7, 0.82)';
  for (let i = 0; i < 18; i++) {
    const sx = 20 + Math.random() * 88;
    const sy = 20 + Math.random() * 88;
    if ((sx - 64) ** 2 + (sy - 64) ** 2 < 52 ** 2) {
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Initializes the 3D Appetizing Pizza Slice Emblem in the navigation header
 */
export function initLogo3D() {
  const container = document.getElementById('logo-3d-container');
  if (!container) return;

  // Prevent multiple overlapping canvases and animation loops
  if (container._cleanupLogo3D) {
    try {
      container._cleanupLogo3D();
    } catch (e) {
      console.warn('Error cleaning up previous logo3D instance:', e);
    }
  }

  const width = container.clientWidth || 48;
  const height = container.clientHeight || 48;

  // 1. Scene & Top-Down 3/4 Perspective Camera calibrated for heroic 48x48 framing
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 10);
  camera.position.set(0, 1.60, 2.30);
  camera.lookAt(0, 0, 0);

  // WebGL Renderer with clean alpha transparency & ACESFilmic tone mapping (R2)
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.pointerEvents = 'none';
  container.appendChild(renderer.domElement);

  // 2. High-Contrast Tailored Micro-Lighting Rig (R2)
  // Warm ambient fill to eliminate muddy shadows while keeping rich contrast
  const ambientLight = new THREE.AmbientLight(0xfff3e0, 1.1);
  scene.add(ambientLight);

  // Primary directional key light for crust highlights & topping glints
  const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.4);
  keyLight.position.set(2.4, 4.0, 2.8);
  scene.add(keyLight);

  // Warm opposing amber rim light to sharply pop the silhouette against dark header
  const rimLight = new THREE.DirectionalLight(0xff9e2c, 2.0);
  rimLight.position.set(-2.4, 2.0, -2.8);
  scene.add(rimLight);

  // Soft front-left fill light for delicious color fidelity on shaded sides
  const fillLight = new THREE.DirectionalLight(0xffdfc4, 0.9);
  fillLight.position.set(-2.8, 1.8, 2.2);
  scene.add(fillLight);

  // Overhead point light for dancing specular highlights on cheese and pepperoni
  const topPointLight = new THREE.PointLight(0xffffff, 1.3, 6);
  topPointLight.position.set(0.2, 2.0, 0.6);
  scene.add(topPointLight);

  // 3. Appetizing 3D Pizza Slice Assembly (R1)
  // Centered at (0, 0, 0) with tip pointing forward (+Z) and arched crust at rear (-Z)
  const pizzaGroup = new THREE.Group();
  pizzaGroup.rotation.order = 'YXZ'; // Decouple world-space floating wobble from spin
  scene.add(pizzaGroup);

  // Procedural food textures
  const cheeseTexture = createCheeseTexture();
  const crustTexture = createCrustTexture();
  const pepTexture = createPepperoniTexture();

  // A. Triangular Base Dough Wedge
  // 2D Shape rotated by -PI/2 around X:
  // x' = x, y' = z (extrusion front cap points +Y), z' = -y (tip at y = -0.66 becomes z = +0.66)
  const baseShape = new THREE.Shape();
  baseShape.moveTo(0, -0.66);
  baseShape.lineTo(-0.52, 0.52);
  baseShape.quadraticCurveTo(0, 0.62, 0.52, 0.52);
  baseShape.lineTo(0, -0.66);

  const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015
  });
  baseGeom.rotateX(-Math.PI / 2);
  baseGeom.translate(0, -0.045, 0);
  projectPlanarUVs(baseGeom, -0.52, 0.52, -0.62, 0.66, -0.060, 0.015);

  const crustBaseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.80,
    metalness: 0.04,
    map: crustTexture || undefined
  });
  const baseMesh = new THREE.Mesh(baseGeom, crustBaseMat);
  pizzaGroup.add(baseMesh);

  // B. Rich Red Tomato Sauce Base Layer (#c1121f)
  // Extends slightly past the cheese layer so red sauce peeks out along cut edges
  const sauceShape = new THREE.Shape();
  sauceShape.moveTo(0, -0.64);
  sauceShape.lineTo(-0.50, 0.50);
  sauceShape.quadraticCurveTo(0, 0.59, 0.50, 0.50);
  sauceShape.lineTo(0, -0.64);

  const sauceGeom = new THREE.ExtrudeGeometry(sauceShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008
  });
  sauceGeom.rotateX(-Math.PI / 2);
  sauceGeom.translate(0, 0.004, 0);

  const sauceMat = new THREE.MeshStandardMaterial({
    color: 0xc1121f,
    roughness: 0.16,
    metalness: 0.02,
    emissive: 0x3d0006
  });
  const sauceMesh = new THREE.Mesh(sauceGeom, sauceMat);
  pizzaGroup.add(sauceMesh);

  // Distinct curved sauce bead along the front edge of the back crust
  // Positioned right in front of the puffy crust with elevated Y for guaranteed visibility at micro scale
  const sauceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.46, 0.042, -0.40),
    new THREE.Vector3(-0.25, 0.048, -0.47),
    new THREE.Vector3(0, 0.052, -0.51),
    new THREE.Vector3(0.25, 0.048, -0.47),
    new THREE.Vector3(0.46, 0.042, -0.40)
  ]);
  const sauceRimGeom = new THREE.TubeGeometry(sauceCurve, 24, 0.034, 10, false);
  const sauceRimMesh = new THREE.Mesh(sauceRimGeom, sauceMat);
  pizzaGroup.add(sauceRimMesh);

  // C. Golden Melted Baked Cheese Layer (#ffbe0b to #f77f00)
  const cheeseShape = new THREE.Shape();
  cheeseShape.moveTo(0, -0.61);
  cheeseShape.lineTo(-0.46, 0.46);
  cheeseShape.quadraticCurveTo(0, 0.54, 0.46, 0.46);
  cheeseShape.lineTo(0, -0.61);

  const cheeseGeom = new THREE.ExtrudeGeometry(cheeseShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.010
  });
  cheeseGeom.rotateX(-Math.PI / 2);
  cheeseGeom.translate(0, 0.012, 0);
  projectPlanarUVs(cheeseGeom, -0.46, 0.46, -0.54, 0.61, 0.002, 0.040);

  const cheeseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: cheeseTexture || undefined,
    bumpMap: cheeseTexture || undefined,
    bumpScale: 0.014,
    roughness: 0.28,
    metalness: 0.02,
    emissive: 0x3d1f00
  });
  const cheeseMesh = new THREE.Mesh(cheeseGeom, cheeseMat);
  pizzaGroup.add(cheeseMesh);

  // D. Puffy, Curved Back Crust (#b06500 to #d48b38)
  const crustCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.52, 0.045, -0.48),
    new THREE.Vector3(-0.30, 0.060, -0.57),
    new THREE.Vector3(0, 0.065, -0.62),
    new THREE.Vector3(0.30, 0.060, -0.57),
    new THREE.Vector3(0.52, 0.045, -0.48)
  ]);
  const puffyCrustGeom = new THREE.TubeGeometry(crustCurve, 28, 0.075, 14, false);
  const puffyCrustMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: crustTexture || undefined,
    bumpMap: crustTexture || undefined,
    bumpScale: 0.020,
    roughness: 0.74,
    metalness: 0.04,
    emissive: 0x241000
  });
  const puffyCrustMesh = new THREE.Mesh(puffyCrustGeom, puffyCrustMat);
  pizzaGroup.add(puffyCrustMesh);

  // Rounded end caps for seamless crust integration
  const capGeom = new THREE.SphereGeometry(0.074, 12, 12);
  const capLeft = new THREE.Mesh(capGeom, puffyCrustMat);
  capLeft.position.set(-0.52, 0.045, -0.48);
  pizzaGroup.add(capLeft);

  const capRight = new THREE.Mesh(capGeom, puffyCrustMat);
  capRight.position.set(0.52, 0.045, -0.48);
  pizzaGroup.add(capRight);

  // E. Distinct Elevated Pepperoni Discs
  const pepConfigs = [
    { radius: 0.135, x: -0.18, y: 0.048, z: -0.27, rotX: 0.05, rotZ: -0.06 },
    { radius: 0.130, x: 0.18, y: 0.048, z: -0.25, rotX: -0.05, rotZ: 0.06 },
    { radius: 0.140, x: -0.02, y: 0.049, z: -0.02, rotX: 0.04, rotZ: 0.02 },
    { radius: 0.120, x: 0.02, y: 0.046, z: 0.28, rotX: -0.04, rotZ: -0.03 }
  ];

  const pepMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pepTexture || undefined,
    roughness: 0.20,
    metalness: 0.04,
    emissive: 0x220204
  });

  pepConfigs.forEach((cfg) => {
    const pepGeom = new THREE.CylinderGeometry(cfg.radius, cfg.radius * 0.95, 0.016, 20);
    const pepMesh = new THREE.Mesh(pepGeom, pepMat);
    pepMesh.position.set(cfg.x, cfg.y, cfg.z);
    pepMesh.rotation.set(cfg.rotX, 0, cfg.rotZ);
    pizzaGroup.add(pepMesh);
  });

  // F. Fresh Green Basil Leaves
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.09);
  leafShape.bezierCurveTo(0.06, -0.03, 0.07, 0.05, 0, 0.11);
  leafShape.bezierCurveTo(-0.07, 0.05, -0.06, -0.03, 0, -0.09);

  const leafGeom = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.009,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2
  });
  leafGeom.rotateX(-Math.PI / 2);

  const basilMat = new THREE.MeshStandardMaterial({
    color: 0x38b000,
    roughness: 0.26,
    metalness: 0.02,
    emissive: 0x082408
  });

  const leafConfigs = [
    { x: -0.13, y: 0.042, z: -0.13, rotX: 0.08, rotY: 0.8, rotZ: -0.10, scale: 0.95 },
    { x: 0.14, y: 0.042, z: -0.09, rotX: -0.06, rotY: -1.0, rotZ: 0.10, scale: 1.05 },
    { x: -0.02, y: 0.042, z: 0.15, rotX: 0.08, rotY: 2.4, rotZ: 0.06, scale: 0.85 }
  ];

  leafConfigs.forEach((cfg) => {
    const leafMesh = new THREE.Mesh(leafGeom, basilMat);
    leafMesh.position.set(cfg.x, cfg.y, cfg.z);
    leafMesh.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
    leafMesh.scale.setScalar(cfg.scale);
    pizzaGroup.add(leafMesh);
  });

  // Scale to comfortably fit within 48x48 (and mobile) bounding box with zero clipping
  pizzaGroup.scale.setScalar(0.78);

  // Initial hero presentation angle (slight 3/4 turn showing depth & toppings)
  pizzaGroup.rotation.y = 0.40;

  // 4. Hover Micro-Interactions & Performance Easing (R3)
  let isHovered = false;
  let currentSpeed = 0.6; // rad/s at idle
  const idleSpeed = 0.6;
  const hoverSpeed = 2.8;

  let currentWobble = 0.045;
  const idleWobble = 0.045;
  const hoverWobble = 0.085;

  const hoverTarget = container.closest('.group') || container;

  const onMouseEnter = () => {
    isHovered = true;
  };
  const onMouseLeave = () => {
    isHovered = false;
  };

  hoverTarget.addEventListener('mouseenter', onMouseEnter);
  hoverTarget.addEventListener('mouseleave', onMouseLeave);
  hoverTarget.addEventListener('touchstart', onMouseEnter, { passive: true });
  hoverTarget.addEventListener('touchend', onMouseLeave, { passive: true });
  hoverTarget.addEventListener('touchcancel', onMouseLeave, { passive: true });

  // 5. Frame-Rate Independent Animation with Accurate Idle Throttling
  let lastRenderTime = 0;
  let animId = null;

  const onVisibilityChange = () => {
    if (!document.hidden) {
      lastRenderTime = performance.now();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  function animate(now) {
    animId = requestAnimationFrame(animate);

    if (document.hidden) {
      lastRenderTime = now;
      return;
    }

    // Idle throttling: render at ~30 FPS (28ms interval with tolerance) when idle, full 60+ FPS on hover
    const minInterval = isHovered ? 0 : 28;
    if (now - lastRenderTime < minInterval) {
      return;
    }

    // Accurate delta time based on actual elapsed time since last render (guaranteed non-negative)
    const elapsed = lastRenderTime > 0 ? (now - lastRenderTime) : 16;
    const dt = Math.max(0, Math.min(elapsed * 0.001, 0.1));
    lastRenderTime = now;

    // Time-based smooth acceleration/deceleration without frame-jumps
    const targetSpeed = isHovered ? hoverSpeed : idleSpeed;
    const lerpFactor = 1.0 - Math.exp(-4.5 * dt);
    currentSpeed += (targetSpeed - currentSpeed) * lerpFactor;

    // Smooth wobble amplitude transition (eliminates instantaneous angle jerk)
    const targetWobble = isHovered ? hoverWobble : idleWobble;
    currentWobble += (targetWobble - currentWobble) * lerpFactor;

    // Continuous rotation around geometric center
    pizzaGroup.rotation.y += currentSpeed * dt;

    // Gentle wobble and floating effect
    const t = now * 0.001;
    pizzaGroup.position.y = Math.sin(t * 2.2) * 0.025;
    pizzaGroup.rotation.x = Math.sin(t * 1.8) * currentWobble;
    pizzaGroup.rotation.z = Math.cos(t * 1.4) * (currentWobble * 0.5);

    renderer.render(scene, camera);
  }

  animId = requestAnimationFrame(animate);

  // 6. Responsive Resize Handling (ResizeObserver + window resize fallback)
  function handleResize(w, h) {
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(Math.round(w), Math.round(h), false);
    }
  }

  function onWindowResize() {
    if (!container) return;
    handleResize(container.clientWidth || 48, container.clientHeight || 48);
  }
  window.addEventListener('resize', onWindowResize);

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        handleResize(w, h);
      }
    });
    resizeObserver.observe(container);
  }

  // Handle WebGL Context Loss gracefully
  const onContextLost = (event) => {
    event.preventDefault();
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

  // 7. Clean WebGL Lifecycle & Disposal
  function cleanup() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    window.removeEventListener('resize', onWindowResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);

    hoverTarget.removeEventListener('mouseenter', onMouseEnter);
    hoverTarget.removeEventListener('mouseleave', onMouseLeave);
    hoverTarget.removeEventListener('touchstart', onMouseEnter);
    hoverTarget.removeEventListener('touchend', onMouseLeave);
    hoverTarget.removeEventListener('touchcancel', onMouseLeave);

    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

    const disposedGeometries = new Set();
    const disposedMaterials = new Set();
    const disposedTextures = new Set();

    const disposeTexture = (tex) => {
      if (tex && !disposedTextures.has(tex)) {
        tex.dispose();
        disposedTextures.add(tex);
      }
    };

    scene.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry && !disposedGeometries.has(child.geometry)) {
          child.geometry.dispose();
          disposedGeometries.add(child.geometry);
        }
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!disposedMaterials.has(mat)) {
              if (mat.map) disposeTexture(mat.map);
              if (mat.bumpMap) disposeTexture(mat.bumpMap);
              if (mat.normalMap) disposeTexture(mat.normalMap);
              mat.dispose();
              disposedMaterials.add(mat);
            }
          });
        }
      }
    });

    disposeTexture(cheeseTexture);
    disposeTexture(crustTexture);
    disposeTexture(pepTexture);

    try {
      renderer.forceContextLoss();
    } catch (e) {
      // Ignored if unsupported
    }
    renderer.dispose();

    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    container._cleanupLogo3D = null;
  }

  container._cleanupLogo3D = cleanup;
  return cleanup;
}
