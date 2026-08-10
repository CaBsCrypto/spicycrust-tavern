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

  // Ajuste responsivo de escala
  const adjustScaleForResponsive = () => {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.0) {
      const scaleVal = Math.max(0.55, aspect * 0.95);
      crateGroup.scale.set(scaleVal, scaleVal, scaleVal);
      camera.position.z = 18;
    } else {
      crateGroup.scale.set(1, 1, 1);
      camera.position.z = 15;
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

  // Material de Madera Noble de la Pizzería Real (Con veteado y relieve tridimensional)
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.04,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Material de Oro Real brillante
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd866,
    emissive: 0xd89f00,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.1
  });

  const flatGoldMaterial = new THREE.MeshBasicMaterial({ color: 0xffd866 });
  const flatElixirMaterial = new THREE.MeshBasicMaterial({ color: 0xf61b7f });

  // --- BASE DE LA CAJA (Madera noble y cantos de oro) ---
  const baseGeom = new THREE.BoxGeometry(7, 0.8, 7);
  const baseMesh = new THREE.Mesh(baseGeom, woodMaterial);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.position.y = -0.4;
  crateGroup.add(baseMesh);

  // Cantos de oro en las esquinas frontales de la base
  const trimGeom = new THREE.BoxGeometry(7.05, 0.08, 0.08);
  const trimFront = new THREE.Mesh(trimGeom, goldMaterial);
  trimFront.position.set(0, -0.1, 3.51);
  crateGroup.add(trimFront);

  const trimBack = new THREE.Mesh(trimGeom, goldMaterial);
  trimBack.position.set(0, -0.1, -3.51);
  crateGroup.add(trimBack);

  // --- TAPA DE LA CAJA REAL ---
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0, -3.5);
  crateGroup.add(lidPivot);

  const lidGeom = new THREE.BoxGeometry(7, 0.2, 7);
  const lidMesh = new THREE.Mesh(lidGeom, woodMaterial);
  lidMesh.castShadow = true;
  lidMesh.position.set(0, 0.1, 3.5);
  lidPivot.add(lidMesh);

  // Escudo central: Rebanada de Pizza Real en Oro y Corona
  const shieldGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.08, 3); // Escudo triangular
  const shieldMesh = new THREE.Mesh(shieldGeom, goldMaterial);
  shieldMesh.rotation.y = Math.PI;
  shieldMesh.position.set(0, 0.24, 3.5);
  lidPivot.add(shieldMesh);

  // Corona real en miniatura encima de la rebanada
  const crownGeom = new THREE.CylinderGeometry(0.5, 0.35, 0.3, 8);
  const crownMesh = new THREE.Mesh(crownGeom, goldMaterial);
  crownMesh.position.set(0, 0.4, 3.5);
  lidPivot.add(crownMesh);

  // Marcos de oro en los bordes de la tapa
  const goldBorderL = new THREE.BoxGeometry(0.1, 0.04, 6.8);
  const goldBorderR = new THREE.BoxGeometry(0.1, 0.04, 6.8);
  
  const borderLeft = new THREE.Mesh(goldBorderL, goldMaterial);
  borderLeft.position.set(-3.45, 0.22, 3.5);
  lidPivot.add(borderLeft);

  const borderRight = new THREE.Mesh(goldBorderR, goldMaterial);
  borderRight.position.set(3.45, 0.22, 3.5);
  lidPivot.add(borderRight);

  // Nodos LED dorados en las esquinas de la tapa (Remaches Reales)
  const rivetGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8);
  const rivets = [];
  const rivetCoords = [
    [-3.2, 0.21, 0.3],
    [3.2, 0.21, 0.3],
    [-3.2, 0.21, 6.7],
    [3.2, 0.21, 6.7]
  ];

  rivetCoords.forEach(coord => {
    const rivet = new THREE.Mesh(rivetGeom, goldMaterial);
    rivet.position.set(coord[0], coord[1], coord[2]);
    lidPivot.add(rivet);
    rivets.push(rivet);
  });

  // Cerradura dorada en el frente
  const lockGeom = new THREE.BoxGeometry(0.6, 0.2, 0.15);
  const lockIndicator = new THREE.Mesh(lockGeom, goldMaterial);
  lockIndicator.position.set(0, 0.05, 7.05);
  lidPivot.add(lockIndicator);

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
  let targetRotX = 0.3;
  let targetRotY = -0.4;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 - 1;
    
    if (!unboxingStarted && !isDragging) {
      targetRotY = mouseX * 0.4 - 0.4;
      targetRotX = -mouseY * 0.3 + 0.3;
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
