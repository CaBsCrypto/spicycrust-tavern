import * as THREE from 'three';

// Generar textura de caoba procedimental compartida (Optimizada en memoria)
export function createMahoganyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Color base caoba profundo
  ctx.fillStyle = '#4d2410';
  ctx.fillRect(0, 0, 256, 256);
  
  // Vetado oscuro
  ctx.fillStyle = '#311408';
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * 256;
    const h = 4 + Math.random() * 10;
    ctx.fillRect(0, y, 256, h);
  }
  
  // Líneas de grano fino
  ctx.strokeStyle = '#200a03';
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const y = Math.random() * 256;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 15) {
      const dy = Math.sin(x * 0.04 + y) * 2;
      ctx.lineTo(x, y + dy);
    }
    ctx.stroke();
  }
  
  // Ruido orgánico
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

// Generar textura de partícula circular suave para elixir (QA / Evita cuadrados pixelados)
export function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  
  return new THREE.CanvasTexture(canvas);
}
