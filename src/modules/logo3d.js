import * as THREE from 'three';

export function initLogo3D() {
  const container = document.getElementById('logo-3d-container');
  if (!container) return;

  const width = container.clientWidth || 48;
  const height = container.clientHeight || 48;

  // 1. Escena y Cámara Micro de Alto Rendimiento
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10);
  camera.position.set(0, 0, 3.2);

  // Renderizador con canal alfa habilitado para transparencia impecable
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 2. Iluminación Speakeasy Cálida
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xE5A93C, 6, 10); // Halógeno dorado
  pointLight.position.set(2, 2, 2);
  scene.add(pointLight);

  // 3. Creación de la Cosa Nostra Golden Pizza Coin
  const coinGroup = new THREE.Group();
  scene.add(coinGroup);

  // Base de la moneda (Cilindro de Latón de Oro Viejo)
  const coinGeom = new THREE.CylinderGeometry(1, 1, 0.15, 32);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xC5A059, // Latón cepillado dorado
    metalness: 0.95,
    roughness: 0.15,
    bumpScale: 0.05
  });
  const coinMesh = new THREE.Mesh(coinGeom, goldMat);
  coinMesh.rotation.x = Math.PI / 2; // Colocar cara de frente
  coinGroup.add(coinMesh);

  // Borde de la Pizza (Torus de cera roja en el relieve)
  const crustGeom = new THREE.TorusGeometry(0.7, 0.08, 8, 24);
  const redMat = new THREE.MeshStandardMaterial({
    color: 0x8B1C1C, // Rojo borgoña lacrado
    metalness: 0.2,
    roughness: 0.5
  });
  const crustMesh = new THREE.Mesh(crustGeom, redMat);
  crustMesh.position.z = 0.08;
  coinGroup.add(crustMesh);

  // Pepperonis del relieve tridimensional
  const pepGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12);
  const peps = [];
  const coords = [
    [0.3, 0.3, 0.09],
    [-0.3, -0.2, 0.09],
    [0.2, -0.4, 0.09]
  ];

  coords.forEach(coord => {
    const pep = new THREE.Mesh(pepGeom, redMat);
    pep.rotation.x = Math.PI / 2;
    pep.position.set(coord[0], coord[1], coord[2]);
    coinGroup.add(pep);
    peps.push(pep);
  });

  // 4. Parámetros de Animación y Control de Velocidad
  let spinSpeed = 0.015;
  let targetSpeed = 0.015;

  // Interactividad: Acelerar rotación al pasar el mouse por el logo
  const parentElement = container.closest('.group');
  if (parentElement) {
    parentElement.addEventListener('mouseenter', () => {
      targetSpeed = 0.08;
    });
    parentElement.addEventListener('mouseleave', () => {
      targetSpeed = 0.015;
    });
  }

  // 5. Bucle de Renderizado de 60 FPS con throttle a 10 FPS en reposo
  let frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);

    if (document.hidden) return;

    // Si no está acelerado, renderizar a 10 FPS (1 de cada 6 frames)
    if (targetSpeed === 0.015) {
      frameCount++;
      if (frameCount % 6 !== 0) {
        return;
      }
    }

    // Suavizado en aceleración (easing)
    spinSpeed += (targetSpeed - spinSpeed) * 0.1;
    coinGroup.rotation.y += spinSpeed;
    
    // Balanceo tridimensional interactivo de filamento
    coinGroup.rotation.x = Math.sin(performance.now() * 0.002) * 0.15;

    renderer.render(scene, camera);
  }

  animate();

  // 6. Manejador de Redimensionamiento micro-responsivo
  window.addEventListener('resize', () => {
    const w = container.clientWidth || 48;
    const h = container.clientHeight || 48;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
