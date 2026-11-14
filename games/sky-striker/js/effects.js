// 特效系统：GPU 粒子、爆炸、冲击波、拖尾、烟雾、碎片、屏幕震动
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { softCircleTex, cloudTex, rand, randInt, pick, clamp, TAU } from './utils.js';
import { Audio } from './audio.js';

const P_N = 2200;

class EffectsSystem {
  init(scene) {
    this.scene = scene;

    // ---- GPU 粒子 ----
    this.N = P_N;
    this.pi = 0;
    this.pos = new Float32Array(P_N * 3);
    this.vel = new Float32Array(P_N * 3);
    this.col = new Float32Array(P_N * 3);
    this.size = new Float32Array(P_N);
    this.life = new Float32Array(P_N);
    this.maxLife = new Float32Array(P_N);
    this.grav = new Float32Array(P_N);
    this.drag = new Float32Array(P_N);
    for (let i = 0; i < P_N; i++) this.pos[i * 3 + 1] = -9999;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: softCircleTex('#ffffff') } },
      vertexShader: `
        attribute vec3 aColor; attribute float aSize; attribute float aLife;
        varying vec3 vColor; varying float vLife;
        void main() {
          vColor = aColor; vLife = aLife;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (140.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D tMap;
        varying vec3 vColor; varying float vLife;
        void main() {
          vec4 tex = texture2D(tMap, gl_PointCoord);
          float a = tex.a * vLife;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor * (0.6 + 0.7 * vLife), a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // ---- 发光精灵池（拖尾/火花/闪光）----
    this.glow = [];
    for (let i = 0; i < 200; i++) {
      const m = new THREE.SpriteMaterial({ map: softCircleTex('#ffffff'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const s = new THREE.Sprite(m);
      s.visible = false;
      scene.add(s);
      this.glow.push({ s, m, active: false, life: 0, maxLife: 1, vel: null, grow: 0, baseOp: 1, baseScale: 1 });
    }
    this.glowIdx = 0;

    // ---- 烟雾精灵池 ----
    this.smokes = [];
    for (let i = 0; i < 70; i++) {
      const m = new THREE.SpriteMaterial({ map: cloudTex('#909090'), transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.visible = false;
      scene.add(s);
      this.smokes.push({ s, m, active: false, life: 0, maxLife: 1, vel: new THREE.Vector3(), grow: 0, spin: 0, baseOp: 0.5 });
    }
    this.smokeIdx = 0;

    // ---- 冲击波环 ----
    this.rings = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.56, 44), m);
      mesh.visible = false;
      scene.add(mesh);
      this.rings.push({ mesh, m, active: false, t: 0, dur: 0.5, maxR: 8 });
    }

    // ---- 碎片 ----
    this.debris = [];
    const dGeo = new THREE.TetrahedronGeometry(0.55);
    for (let i = 0; i < 36; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(dGeo, m);
      mesh.visible = false;
      scene.add(mesh);
      this.debris.push({ mesh, m, active: false, life: 0, vel: new THREE.Vector3(), rot: new THREE.Vector3() });
    }

    // 爆炸点光源
    this.light = new THREE.PointLight(0xffffff, 0, 80, 1.6);
    scene.add(this.light);

    this.shake = 0;
  }

  // ---- 粒子 ----
  spawnP(x, y, z, vx, vy, vz, color, life, size, grav = 0, drag = 0) {
    const i = this.pi;
    this.pi = (this.pi + 1) % this.N;
    const i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    const c = new THREE.Color(color);
    this.col[i3] = c.r; this.col[i3 + 1] = c.g; this.col[i3 + 2] = c.b;
    this.size[i] = size;
    this.life[i] = life; this.maxLife[i] = life;
    this.grav[i] = grav; this.drag[i] = drag;
  }

  burst(pos, { n = 20, speed = 8, color = 0xffcc66, life = 0.55, size = 1.2, grav = -6, drag = 2.2, colors = null, up = 0, szVar = 0.6 } = {}) {
    for (let i = 0; i < n; i++) {
      const th = rand(TAU), ph = Math.acos(rand(-1, 1));
      const sp = speed * rand(0.3, 1);
      const vx = Math.sin(ph) * Math.cos(th) * sp;
      const vy = Math.cos(ph) * sp * 0.7 + up;
      const vz = Math.sin(ph) * Math.sin(th) * sp;
      const c = colors ? pick(colors) : color;
      this.spawnP(pos.x, pos.y, pos.z, vx, vy, vz, c, life * rand(0.6, 1.3), size * rand(1 - szVar, 1 + szVar), grav, drag);
    }
  }

  // ---- 精灵 ----
  _glowGet() {
    for (let k = 0; k < this.glow.length; k++) {
      const g = this.glow[(this.glowIdx + k) % this.glow.length];
      if (!g.active) { this.glowIdx = (this.glowIdx + k + 1) % this.glow.length; return g; }
    }
    return null;
  }
  trail(pos, { color = 0xffffff, size = 1, life = 0.4, vel = null, grow = 0 } = {}) {
    const g = this._glowGet();
    if (!g) return;
    g.active = true; g.s.visible = true;
    g.s.position.copy(pos);
    g.m.color.set(color);
    g.m.opacity = 1;
    g.life = g.maxLife = life;
    g.vel = vel ? vel.clone() : null;
    g.grow = grow;
    g.baseScale = size;
    g.s.scale.setScalar(size);
    g.m.rotation = rand(TAU);
    g.m.map = softCircleTex('#ffffff');
  }
  flash(pos, color, size, life = 0.18) {
    this.trail(pos, { color, size, life, grow: size * 2.5 });
  }

  _smokeGet() {
    for (let k = 0; k < this.smokes.length; k++) {
      const s = this.smokes[(this.smokeIdx + k) % this.smokes.length];
      if (!s.active) { this.smokeIdx = (this.smokeIdx + k + 1) % this.smokes.length; return s; }
    }
    return null;
  }
  puff(pos, { color = 0x555555, size = 3, life = 1.1, vel = null, grow = 4 } = {}) {
    const s = this._smokeGet();
    if (!s) return;
    s.active = true; s.s.visible = true;
    s.s.position.copy(pos);
    s.m.color.set(color);
    s.m.opacity = s.baseOp = rand(0.35, 0.55);
    s.life = s.maxLife = life * rand(0.8, 1.3);
    s.vel = vel ? vel.clone() : new THREE.Vector3(0, 1.5, 0);
    s.vel.x += rand(-1, 1); s.vel.y += rand(0, 1.2); s.vel.z += rand(-1, 1);
    s.grow = grow * rand(0.8, 1.4);
    s.spin = rand(-1.6, 1.6);
    s.s.scale.setScalar(size * rand(0.7, 1.3));
    s.m.rotation = rand(TAU);
  }

  // ---- 冲击波 ----
  shockwave(pos, color = 0xaaddff, maxR = 9, dur = 0.45) {
    for (const r of this.rings) {
      if (r.active) continue;
      r.active = true; r.mesh.visible = true;
      r.mesh.position.copy(pos);
      r.m.color.set(color);
      r.t = 0; r.dur = dur; r.maxR = maxR;
      r.mesh.scale.setScalar(0.1);
      return;
    }
  }

  // ---- 碎片 ----
  debrisBurst(pos, n = 8, color = 0x777777, speed = 12) {
    let used = 0;
    for (const d of this.debris) {
      if (used >= n) break;
      if (d.active) continue;
      used++;
      d.active = true; d.mesh.visible = true;
      d.mesh.position.copy(pos);
      d.m.color.set(color);
      d.life = rand(0.8, 1.6);
      const th = rand(TAU), ph = Math.acos(rand(-1, 1));
      const sp = speed * rand(0.4, 1.2);
      d.vel.set(Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp * 0.8 + 4, Math.sin(ph) * Math.sin(th) * sp);
      d.rot.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
      d.mesh.scale.setScalar(rand(0.5, 1.4));
    }
  }

  // ---- 高层接口 ----
  spark(pos, color = 0xffee88) {
    this.burst(pos, { n: 6, speed: 10, color, life: 0.25, size: 0.9, grav: -8 });
    this.flash(pos, color, 1.6, 0.1);
  }

  muzzle(pos, color = 0xaee6ff) {
    this.flash(pos, color, 1.5, 0.07);
    this.spawnP(pos.x, pos.y, pos.z, rand(-2, 2), rand(-2, 2), rand(-2, 2), color, 0.08, 1.2, 0, 0);
  }

  explosion(pos, scale = 1, opts = {}) {
    const colors = opts.colors || [0xffe08a, 0xffa940, 0xff6b35, 0xff4422];
    const smokeColor = opts.smoke || 0x3a3a3a;
    // 闪光
    this.flash(pos, colors[0], 4.5 * scale, 0.2);
    // 火花
    this.burst(pos, { n: Math.round(26 * scale), speed: 9 * scale, colors, life: rand(0.45, 0.7), size: 1.3 * scale, grav: -5, drag: 1.8, up: 2 * scale });
    // 烟
    for (let i = 0; i < Math.round(6 * scale); i++) {
      this.puff(new THREE.Vector3(pos.x + rand(-1.5, 1.5) * scale, pos.y + rand(-1.5, 1.5) * scale, pos.z + rand(-1.5, 1.5) * scale), { color: smokeColor, size: 3.5 * scale, life: rand(0.9, 1.5), vel: new THREE.Vector3(0, 2.5, 1), grow: 5 * scale });
    }
    // 冲击波
    if (scale >= 0.7) this.shockwave(pos, colors[1], 7 * scale, 0.4);
    // 碎片
    if (scale >= 1.4) this.debrisBurst(pos, Math.round(6 * scale), 0x666a70, 10 * scale);
    // 光 + 震屏 + 音效
    this.light.position.copy(pos);
    this.light.color.set(colors[0]);
    this.light.intensity = 60 * scale;
    this.addShake(0.22 * scale);
    const s = scale >= 2 ? 'explosionL' : scale >= 0.9 ? 'explosionM' : 'explosionS';
    Audio.sfx(s, clamp(scale * 0.6, 0.4, 1.2));
    if (scale >= 2) Audio.boomDuck();
  }

  addShake(a) { this.shake = Math.min(1.8, this.shake + a); }

  update(dt) {
    // 粒子
    const { pos, vel, life, maxLife, grav, drag } = this;
    for (let i = 0; i < this.N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      if (life[i] <= 0) { life[i] = 0; continue; }
      const i3 = i * 3;
      vel[i3 + 1] += grav[i] * dt;
      const dr = Math.max(0, 1 - drag[i] * dt);
      vel[i3] *= dr; vel[i3 + 1] *= dr; vel[i3 + 2] *= dr;
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;
    }
    const geo = this.points.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aLife.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;

    // 发光精灵
    for (const g of this.glow) {
      if (!g.active) continue;
      g.life -= dt;
      if (g.life <= 0) { g.active = false; g.s.visible = false; g.m.opacity = 0; continue; }
      if (g.vel) g.s.position.addScaledVector(g.vel, dt);
      const f = g.life / g.maxLife;
      g.m.opacity = f;
      const sc = g.baseScale * (1 + g.grow * (1 - f) * 0.4);
      g.s.scale.setScalar(sc);
    }
    // 烟雾
    for (const s of this.smokes) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) { s.active = false; s.s.visible = false; s.m.opacity = 0; continue; }
      s.s.position.addScaledVector(s.vel, dt);
      s.m.rotation += s.spin * dt;
      const f = s.life / s.maxLife;
      s.m.opacity = s.baseOp * f;
      s.s.scale.addScalar(s.grow * dt);
    }
    // 冲击波
    if (CTX.camera) {
      for (const r of this.rings) {
        if (!r.active) continue;
        r.t += dt;
        const f = r.t / r.dur;
        if (f >= 1) { r.active = false; r.mesh.visible = false; continue; }
        const e = 1 - Math.pow(1 - f, 3);
        r.mesh.scale.setScalar(0.1 + e * r.maxR);
        r.m.opacity = (1 - f) * 0.85;
        r.mesh.quaternion.copy(CTX.camera.quaternion);
      }
    }
    // 碎片
    for (const d of this.debris) {
      if (!d.active) continue;
      d.life -= dt;
      if (d.life <= 0) { d.active = false; d.mesh.visible = false; continue; }
      d.vel.y -= 14 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.rotation.x += d.rot.x * dt;
      d.mesh.rotation.y += d.rot.y * dt;
      d.mesh.rotation.z += d.rot.z * dt;
    }
    // 光衰减
    this.light.intensity *= Math.exp(-9 * dt);
    // 震屏衰减
    this.shake *= Math.exp(-5.5 * dt);
  }

  clear() {
    if (!this.glow) return;
    for (let i = 0; i < this.N; i++) { this.life[i] = 0; this.pos[i * 3 + 1] = -9999; }
    for (const g of this.glow) { g.active = false; g.s.visible = false; g.m.opacity = 0; }
    for (const s of this.smokes) { s.active = false; s.s.visible = false; s.m.opacity = 0; }
    for (const r of this.rings) { r.active = false; r.mesh.visible = false; }
    for (const d of this.debris) { d.active = false; d.mesh.visible = false; }
    this.light.intensity = 0;
    this.shake = 0;
  }
}

export const Effects = new EffectsSystem();
