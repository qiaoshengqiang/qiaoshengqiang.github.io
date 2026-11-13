import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, max = 720) {
    this.max = max;
    this.cursor = 0;
    this.positions = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.alphas = new Float32Array(max);
    this.sizes = new Float32Array(max);
    this.velocity = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.baseColor = new Float32Array(max * 3);
    this.drag = new Float32Array(max);
    this.gravity = new Float32Array(max * 3);

    for (let i = 0; i < max; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.alphas[i] = 0;
    }
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colAttr = new THREE.BufferAttribute(this.colors, 3);
    this.alphaAttr = new THREE.BufferAttribute(this.alphas, 1);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('aColor', this.colAttr);
    geo.setAttribute('aAlpha', this.alphaAttr);
    geo.setAttribute('aSize', this.sizeAttr);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) } },
      vertexShader: /* glsl */`
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (260.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float a = smoothstep(0.5, 0.04, d) * vAlpha;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 8;
    scene.add(this.points);
  }

  spawnBurst(position, opts = {}) {
    const {
      count = 12,
      color = '#ffffff',
      color2 = null,
      speed = 6,
      spread = 1,
      life = 0.6,
      lifeSpread = 0.3,
      size = 0.55,
      direction = null,
      cone = 0,
      gravity = null,
      drag = 1.5,
    } = opts;
    const colA = new THREE.Color(color);
    const colB = color2 ? new THREE.Color(color2) : colA;
    const dir = direction ? direction.clone().normalize() : null;
    for (let k = 0; k < count; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const i3 = i * 3;
      this.positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
      this.positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      this.positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;

      let vx = Math.random() * 2 - 1;
      let vy = Math.random() * 2 - 1;
      let vz = Math.random() * 2 - 1;
      const l = Math.hypot(vx, vy, vz) || 1;
      vx /= l; vy /= l; vz /= l;
      if (dir) {
        if (cone > 0) {
          const t = speed * (0.7 + Math.random() * 0.6);
          vx = dir.x + (Math.random() - 0.5) * cone;
          vy = dir.y + (Math.random() - 0.5) * cone;
          vz = dir.z + (Math.random() - 0.5) * cone;
          const n = Math.hypot(vx, vy, vz) || 1;
          vx = vx / n * t; vy = vy / n * t; vz = vz / n * t;
        } else {
          const t = speed * (0.35 + Math.random() * 0.9);
          vx = (vx * spread + dir.x) * t;
          vy = (vy * spread + dir.y) * t;
          vz = (vz * spread + dir.z) * t;
        }
      } else {
        const t = speed * (0.2 + Math.random() * 0.8);
        vx *= t * spread; vy *= t * spread; vz *= t * spread;
      }
      this.velocity[i3] = vx;
      this.velocity[i3 + 1] = vy;
      this.velocity[i3 + 2] = vz;

      const col = colA.clone().lerp(colB, Math.random());
      this.baseColor[i3] = col.r;
      this.baseColor[i3 + 1] = col.g;
      this.baseColor[i3 + 2] = col.b;
      this.colors[i3] = col.r;
      this.colors[i3 + 1] = col.g;
      this.colors[i3 + 2] = col.b;
      const ml = life + Math.random() * lifeSpread;
      this.life[i] = ml;
      this.maxLife[i] = ml;
      this.alphas[i] = 1;
      this.baseSize[i] = size * (0.6 + Math.random() * 0.9);
      this.sizes[i] = this.baseSize[i];
      this.drag[i] = drag;
      if (gravity) {
        this.gravity[i3] = gravity.x;
        this.gravity[i3 + 1] = gravity.y;
        this.gravity[i3 + 2] = gravity.z;
      } else {
        this.gravity[i3] = this.gravity[i3 + 1] = this.gravity[i3 + 2] = 0;
      }
    }
  }

  update(dt) {
    let changed = false;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      changed = true;
      this.life[i] -= dt;
      const i3 = i * 3;
      if (this.life[i] <= 0) {
        this.alphas[i] = 0;
        this.positions[i3 + 1] = -9999;
        continue;
      }
      const drag = Math.exp(-this.drag[i] * dt);
      this.velocity[i3] *= drag;
      this.velocity[i3 + 1] = this.velocity[i3 + 1] * drag + this.gravity[i3 + 1] * dt;
      this.velocity[i3 + 2] *= drag;
      this.positions[i3] += this.velocity[i3] * dt;
      this.positions[i3 + 1] += this.velocity[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocity[i3 + 2] * dt;
      const t = this.life[i] / this.maxLife[i];
      this.alphas[i] = Math.min(1, t * 2.2) * t;
      this.sizes[i] = this.baseSize[i] * (0.4 + t * 0.8);
    }
    if (changed) {
      this.posAttr.needsUpdate = true;
      this.alphaAttr.needsUpdate = true;
      this.sizeAttr.needsUpdate = true;
      this.colAttr.needsUpdate = true;
    }
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}

export class Shockwaves {
  constructor(scene, count = 8) {
    this.scene = scene;
    this.items = [];
    const geo = new THREE.RingGeometry(0.55, 0.75, 40);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#ffffff', transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.renderOrder = 7;
      scene.add(mesh);
      this.items.push({ mesh, mat, life: 0, maxLife: 1, scale: 1 });
    }
    this.geo = geo;
    this.cursor = 0;
  }

  trigger(position, up, color = '#ffffff', size = 8, life = 0.55) {
    const item = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    item.mesh.position.copy(position).addScaledVector(up, 0.1);
    item.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
    item.mesh.visible = true;
    item.mat.color.set(color);
    item.life = life;
    item.maxLife = life;
    item.scale = size;
    item.mesh.scale.setScalar(0.2);
  }

  update(dt) {
    for (const item of this.items) {
      if (item.life <= 0) continue;
      item.life -= dt;
      const t = 1 - item.life / item.maxLife;
      if (item.life <= 0) {
        item.mesh.visible = false;
        item.mat.opacity = 0;
        continue;
      }
      const s = 0.2 + t * item.scale;
      item.mesh.scale.setScalar(s);
      item.mat.opacity = (1 - t) * 0.6;
    }
  }

  dispose() {
    this.items.forEach((i) => {
      i.mesh.removeFromParent();
      i.mat.dispose();
    });
    this.geo.dispose();
  }
}
