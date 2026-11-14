// 六个关卡 Boss：独立建模、多阶段攻击、入场/死亡演出
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST, LEVELS } from './config.js';
import { Bullets } from './entities.js';
import { Enemies } from './enemies.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { rand, randInt, pick, chance, clamp, damp, lerp, TAU } from './utils.js';

// ---- 材质缓存 ----
const _hull = new Map();
function hull(color) {
  if (!_hull.has(color)) _hull.set(color, new THREE.MeshLambertMaterial({ color }));
  return _hull.get(color);
}
function hullT(color) { // 可调透明度材质
  return new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 1 });
}
function glowMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
}
function M(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}
const FZ = Math.PI / 2;

// ============ 通用激光 ============
class Beam {
  constructor(scene, color = 0xff5555, width = 2.6) {
    this.teleMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
    this.tele = new THREE.Mesh(new THREE.BoxGeometry(width, width, 1), this.teleMat);
    this.beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.beam = new THREE.Mesh(new THREE.BoxGeometry(width, width, 1), this.beamMat);
    this.core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, width * 0.3, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.beam.add(this.core);
    this.tele.visible = false;
    this.beam.visible = false;
    scene.add(this.tele, this.beam);
    this.mode = null;
    this.t = 0;
  }
  // 从 origin 射向 target（终点）
  start(origin, target, teleT = 0.9, fireT = 0.7) {
    this.origin = origin.clone();
    this.target = target.clone();
    this.mode = 'tele';
    this.t = 0;
    this.teleT = teleT;
    this.fireT = fireT;
    this._place(this.tele, 0.18);
    this.tele.visible = true;
    Audio.sfx('beamCharge', 0.8);
  }
  _place(mesh, thickness = 1) {
    const dir = new THREE.Vector3().copy(this.target).sub(this.origin);
    const len = dir.length();
    mesh.position.copy(this.origin).addScaledVector(dir, 0.5);
    mesh.scale.z = len;
    mesh.lookAt(this.target);
    mesh.scale.set(1, 1, 1);
    mesh.scale.z = len;
    mesh.scale.x = thickness; mesh.scale.y = thickness;
    // BoxGeometry 深度为 1，拉伸 z
  }
  update(dt) {
    if (!this.mode) return;
    this.t += dt;
    if (this.mode === 'tele') {
      this._place(this.tele, 0.22 + Math.sin(this.t * 20) * 0.05);
      if (this.t >= this.teleT) {
        this.mode = 'fire';
        this.t = 0;
        this.tele.visible = false;
        this._place(this.beam);
        this.beam.visible = true;
        Audio.sfx('beamFire');
        Effects.flash(this.origin, 0xff6666, 8, 0.2);
        Effects.addShake(0.25);
      }
      return;
    }
    // fire
    this.beamMat.opacity = 0.75 + Math.sin(this.t * 40) * 0.2;
    this.origin.copy(this._originRef || this.origin);
    this.target.copy(this._targetRef || this.target);
    this._place(this.beam);
    Effects.trail(new THREE.Vector3().copy(this.origin).add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), 0)), { color: 0xff8888, size: 2, life: 0.12 });
    if (this.t >= this.fireT) {
      this.mode = null;
      this.beam.visible = false;
    }
  }
  // 每帧检查玩家是否被击中（返回伤害或 0）
  hitPlayer() {
    if (this.mode !== 'fire') return 0;
    const p = CTX.player.pos;
    const o = this.origin, tg = this.target;
    const abx = tg.x - o.x, aby = tg.y - o.y, abz = tg.z - o.z;
    const apx = p.x - o.x, apy = p.y - o.y, apz = p.z - o.z;
    const ab2 = abx * abx + aby * aby + abz * abz;
    let t = (apx * abx + apy * aby + apz * abz) / ab2;
    t = clamp(t, 0, 1);
    const cx = o.x + abx * t - p.x, cy = o.y + aby * t - p.y, cz = o.z + abz * t - p.z;
    const d = Math.sqrt(cx * cx + cy * cy + cz * cz);
    return d < 2.8 ? 1 : 0;
  }
  destroy() { this.tele.visible = false; this.beam.visible = false; this.mode = null; }
}

// ============ Boss 基类 ============
class BossBase {
  constructor(def) {
    this.def = def;
    this.hp = def.hp;
    this.hpMax = def.hp;
    this.score = def.score;
    this.radius = 6.5;
    this.state = 'intro';
    this.t = 0;
    this.phase = 0;
    this.patterns = [];
    this.seq = []; // 延迟子事件 {t, fn}
    this.mesh = new THREE.Group();
    this.parts = {};
    this.dyingT = 0;
    this.beams = [];
    // 子类 build() 可能在 super() 期间用到以下字段，先初始化
    this.pods = [];
    this.orbs = [];
    this.clones = [];
    this.spiralA = 0;
    this.armorOpen = 0;
    this.sweepA = 0;
    this.cloak = 1;
    this.cloakTarget = 1;
    this.dash = { state: 0, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), hitA: false, hitB: false };
    this.holdX = 0;
    this.holdY = 16;
    this.holdZ = -78;
    this.alive = true;
    this._buildAll();
    this.pos = this.mesh.position;
    this.pos.set(0, this.holdY, -250);
    CTX.scene.add(this.mesh);
  }

  _buildAll() {
    this.build();
    this.mats = [];
    this.mesh.traverse((o) => {
      if (o.material) {
        o.userData.baseOp = o.material.opacity ?? 1;
        if (o.material.transparent || this.def.cloak) this.mats.push(o.material);
      }
    });
  }

  build() {}
  initPatterns() {}
  animate(dt) {}
  move(dt) {}

  start() {
    this.state = 'intro';
    this.pos.set(this.holdX, this.holdY, -250);
  }

  aim(from) {
    return new THREE.Vector3().copy(CTX.player.pos).sub(from).normalize();
  }

  addPattern(cd, fn, opts = {}) {
    this.patterns.push({ cd, fn, next: this.t + (opts.delay ?? cd * 0.55), phase: opts.phase ?? 0 });
  }
  after(delay, fn) { this.seq.push({ t: delay, fn }); }
  runSeq(dt) {
    for (let i = this.seq.length - 1; i >= 0; i--) {
      this.seq[i].t -= dt;
      if (this.seq[i].t <= 0) { const f = this.seq[i].fn; this.seq.splice(i, 1); f(); }
    }
  }

  enterPhase(i) {
    this.phase = i;
    this.patterns.length = 0;
    this.initPatterns();
    Effects.flash(this.pos, 0xffffff, 14, 0.3);
    Effects.shockwave(this.pos, this.def.accent || 0xffaa44, 26, 0.6);
    Effects.addShake(0.5);
    Audio.boomDuck();
    Audio.sfx('warningSiren', 0.7);
    if (CTX.hud) CTX.hud.toast('⚠ 目标形态变化');
  }

  hit(dmg, from) {
    if (this.state !== 'fight' || !this.alive) return false;
    this.hp -= dmg;
    CTX.stats.hits++;
    this.flashT = 0.05;
    if (from) Effects.spark(from, 0xffe08a);
    Audio.sfx('hitEnemy', 0.25);
    const frac = this.hp / this.hpMax;
    const th = this.def.phaseAt ?? [0.5];
    if (this.phase < th.length && frac <= th[this.phase]) this.enterPhase(this.phase + 1);
    if (this.hp <= 0) this.beginDeath();
    return true;
  }

  beginDeath() {
    this.state = 'dying';
    this.dyingT = this.def.dieDur ?? 2.8;
    this.dieExpT = 0;
    this.alive = false;
    for (const b of this.beams) b.destroy();
    Audio.sfx('bossDie', 0.9);
    Audio.boomDuck();
  }

  update(dt) {
    this.t += dt;
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.mesh.scale.setScalar(1 + this.flashT * 1.2);
    } else if (this.mesh.scale.x !== 1) this.mesh.scale.setScalar(1);

    if (this.state === 'intro') {
      this.pos.z = damp(this.pos.z, this.holdZ, 1.6, dt);
      this.pos.y = this.holdY + Math.sin(this.t * 2) * 0.6;
      this.animate(dt);
      if (Math.abs(this.pos.z - this.holdZ) < 3) {
        this.state = 'fight';
        this.initPatterns();
      }
      return;
    }
    if (this.state === 'fight') {
      this.move(dt);
      for (const p of this.patterns) {
        if (this.phase >= p.phase && this.t >= p.next) {
          p.next = this.t + p.cd * rand(0.85, 1.25);
          p.fn();
        }
      }
      this.runSeq(dt);
      this.animate(dt);
      for (const b of this.beams) {
        b.update(dt);
        if (b.hitPlayer() && CTX.player.alive) CTX.player.hit(9);
      }
      return;
    }
    if (this.state === 'dying') {
      this.dyingT -= dt;
      this.dieExpT -= dt;
      this.pos.z += 6 * dt;
      this.pos.y -= 5 * dt;
      this.mesh.rotation.z += dt * 0.7;
      this.mesh.rotation.x += dt * 0.4;
      if (this.dieExpT <= 0) {
        this.dieExpT = Math.max(0.08, this.dyingT * 0.14);
        const off = new THREE.Vector3(rand(-5, 5), rand(-3, 3), rand(-5, 5));
        Effects.explosion(new THREE.Vector3().copy(this.pos).add(off), rand(1.2, 2.2));
        Effects.addShake(0.3);
      }
      if (this.dyingT <= 0) {
        Effects.explosion(this.pos, 3.2);
        Effects.debrisBurst(this.pos, 14, 0x50565e, 16);
        Effects.shockwave(this.pos, 0xffcc88, 34, 0.8);
        Effects.addShake(1.2);
        CTX.game.onBossDefeated(this);
        this.destroy();
      }
    }
  }

  destroy() {
    CTX.scene.remove(this.mesh);
    for (const b of this.beams) b.destroy();
    this.dead = true;
  }
}

// ============ 1. 钢鲸 · 重型轰炸机 ============
class SteelWhale extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.5], accent: 0x35e0ff, dieDur: 3 });
    this.radius = 7.5;
  }
  build() {
    const g = this.mesh;
    g.add(M(new THREE.BoxGeometry(5, 4, 14), hull(0x3a4654), 0, 0, 0));
    g.add(M(new THREE.BoxGeometry(3.6, 2.6, 6), hull(0x4a5866), 0, 0.8, 7.5));
    g.add(M(new THREE.ConeGeometry(1.8, 4, 6), hull(0x2e3744), 0, 0, 10.5, FZ));
    // 机库窗口
    g.add(M(new THREE.BoxGeometry(3.2, 0.3, 8), glowMat(0x66d9ff, 0.85), 0, 1.6, 4));
    // 巨翼
    for (const s of [1, -1]) {
      const wing = M(new THREE.BoxGeometry(9, 0.5, 4.5), hull(0x2e3744), s * 6.5, 0, -1.5, 0, s * 0.12);
      g.add(wing);
      // 发动机舱
      for (const ox of [2.5, 5.5]) {
        g.add(M(new THREE.CylinderGeometry(0.75, 0.9, 3.4, 8), hull(0x39434f), s * (1.5 + ox), 0.1, -0.5, FZ));
        g.add(M(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8), glowMat(0x35e0ff, 0.9), s * (1.5 + ox), 0.1, -2.3, FZ));
      }
      g.add(M(new THREE.BoxGeometry(0.4, 3.2, 2.4), hull(0x2e3744), s * 9.5, 1.6, -3));
    }
    // 腹部弹舱
    g.add(M(new THREE.BoxGeometry(3, 0.4, 9), glowMat(0xff5533, 0.55), 0, -2.1, 1));
    g.add(M(new THREE.SphereGeometry(0.5, 6, 6), glowMat(0x35e0ff), 0, -0.6, 9.6));
  }
  move(dt) {
    this.pos.x = damp(this.pos.x, this.holdX + Math.sin(this.t * 0.4) * 7, 2, dt);
    this.pos.y = damp(this.pos.y, this.holdY + Math.sin(this.t * 0.7) * 2, 2, dt);
    this.mesh.rotation.z = Math.sin(this.t * 0.4) * 0.08;
  }
  initPatterns() {
    const P = this.phase;
    this.addPattern(P === 0 ? 2.9 : 2.0, () => {
      // 扇形弹幕（两轮）
      const fire = () => Bullets.fan(this.pos.clone().add(new THREE.Vector3(0, -2, 6)), this.aim(this.pos), { n: 7, arcDeg: 55, speed: 30, dmg: 10, color: 0x35e0ff });
      fire();
      this.after(0.35, fire);
    }, { phase: 0 });
    this.addPattern(P === 0 ? 6.5 : 4.5, () => {
      // 腹部地毯轰炸
      for (let i = 0; i < 6; i++) {
        this.after(i * 0.22, () => {
          const p = this.pos.clone().add(new THREE.Vector3(rand(-2, 2), -2.4, 2 - i * 2));
          Bullets.orb(p, new THREE.Vector3(0, -0.35, 0.75), { speed: 26, dmg: 12, color: 0xff8844, scale: 1.4 });
        });
      }
      Effects.flash(this.pos.clone().add(new THREE.Vector3(0, -2.4, 2)), 0xff8844, 4, 0.15);
    }, { phase: 0 });
    this.addPattern(P === 0 ? 8.5 : 6, () => {
      for (let i = 0; i < 3; i++) this.after(i * 0.4, () => Bullets.eMissile(this.pos.clone().add(new THREE.Vector3(rand(-4, 4), -2, 2))));
    }, { phase: 0 });
    if (P >= 1) {
      this.addPattern(5, () => Bullets.ring(this.pos.clone().add(new THREE.Vector3(0, 0, 4)), { n: 10, speed: 26, dmg: 10, color: 0x35e0ff, phase: this.t }), { phase: 1 });
    }
  }
  animate() {
    // 引擎微光脉动
  }
}

// ============ 2. 沙蝎 · 沙漠炮舰 ============
class SandScorpion extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.55], accent: 0xffb347, dieDur: 3 });
    this.radius = 7;
  }
  build() {
    const g = this.mesh;
    g.add(M(new THREE.BoxGeometry(8, 3, 10), hull(0xa86a3c), 0, 0, 0));
    g.add(M(new THREE.BoxGeometry(5.5, 2.2, 4), hull(0x8a5630), 0, 1.8, 4));
    g.add(M(new THREE.ConeGeometry(2.6, 5, 4), hull(0x93603a), 0, 0.4, 8, FZ, Math.PI / 4));
    // 装甲条纹
    for (let i = 0; i < 3; i++) g.add(M(new THREE.BoxGeometry(8.4, 0.35, 0.9), hull(0x6e4426), 0, -1 + i * 0.9, -2 + i * 2.4));
    // 四个炮塔臂
    const podPos = [[-4.6, 1.4, 2.5], [4.6, 1.4, 2.5], [-4.6, -1.4, 2.5], [4.6, -1.4, 2.5]];
    podPos.forEach((pp, i) => {
      const pod = new THREE.Group();
      pod.add(M(new THREE.SphereGeometry(0.95, 8, 8), hull(0x6e4426)));
      pod.add(M(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 6), hull(0x4e3018), 0, 0, 1.1, FZ));
      pod.add(M(new THREE.SphereGeometry(0.3, 6, 6), glowMat(0xffb347)));
      pod.position.set(...pp);
      pod.userData.cd = 1.6 + i * 0.55;
      pod.userData.next = rand(1.5, 3);
      g.add(pod);
      this.pods.push(pod);
    });
    // 尾刺
    g.add(M(new THREE.ConeGeometry(1.2, 5, 6), hull(0x6e4426), 0, 0, -7, -FZ));
    g.add(M(new THREE.SphereGeometry(0.7, 8, 8), glowMat(0xffb347, 0.9), 0, 0, -6.5));
  }
  move(dt) {
    this.pos.x = damp(this.pos.x, Math.sin(this.t * 0.35) * 8, 1.8, dt);
    this.pos.y = damp(this.pos.y, 15 + Math.sin(this.t * 0.5) * 2.5, 1.8, dt);
    this.mesh.rotation.z = Math.sin(this.t * 0.35) * 0.1;
  }
  initPatterns() {
    const P = this.phase;
    this.addPattern(P === 0 ? 7 : 5, () => {
      // 沙暴弹墙（留缺口）
      const gap = randInt(1, 6);
      for (let i = 0; i < 9; i++) {
        if (Math.abs(i - gap) <= 1) continue;
        Bullets.orb(new THREE.Vector3(-22 + i * 5.5, this.pos.y - 4, this.pos.z + 6), new THREE.Vector3(0, -0.12, 1), { speed: 22, dmg: 10, color: 0xd8a050, scale: 1.25 });
      }
    }, { phase: 0 });
    if (P >= 1) {
      this.addPattern(0.55, () => {
        this.spiralA += 0.42;
        Bullets.ring(this.pos, { n: 8, speed: 24, dmg: 10, color: 0xffb347, phase: this.spiralA });
      }, { phase: 1, delay: 1 });
    }
  }
  update(dt) {
    // 炮塔独立索敌射击
    if (this.state === 'fight') {
      for (const pod of this.pods) {
        pod.lookAt(CTX.player.pos);
        pod.userData.next -= dt;
        if (pod.userData.next <= 0) {
          pod.userData.next = pod.userData.cd * (this.phase >= 1 ? 0.7 : 1);
          for (let i = 0; i < 3; i++) {
            this.after(i * 0.12, () => {
              if (this.state === 'fight') Bullets.aimed(pod.getWorldPosition(new THREE.Vector3()), { speed: 38, dmg: 10, color: 0xffb347 });
            });
          }
        }
      }
    }
    super.update(dt);
  }
}

// ============ 3. 夜刃 · 隐形翼 ============
class NightBlade extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.5], accent: 0xff4fd8, cloak: true, dieDur: 2.6 });
    this.radius = 6;
  }
  build() {
    const g = this.mesh;
    const body = hullT(0x181e30);
    // 飞翼主体（三角）
    const wing = M(new THREE.ConeGeometry(6.5, 11, 3), body, 0, 0, 0, FZ, Math.PI);
    wing.scale.y = 0.28;
    g.add(wing);
    g.add(M(new THREE.BoxGeometry(11, 0.5, 3.2), body, 0, 0, -1.5));
    // 荧光边缘
    for (const s of [1, -1]) {
      g.add(M(new THREE.BoxGeometry(0.22, 0.22, 7.5), glowMat(0xff4fd8, 0.9), s * 4.2, 0.3, 0.5, 0, s * 0.5));
      g.add(M(new THREE.BoxGeometry(3.4, 0.2, 0.22), glowMat(0x7a3cff, 0.9), s * 3.2, 0.32, -2.4));
    }
    // 核心
    const core = M(new THREE.SphereGeometry(1.1, 10, 10), glowMat(0xff4fd8, 0.95), 0, 0.1, 1.2);
    g.add(core);
    this.parts.core = core;
    g.add(M(new THREE.BoxGeometry(2.4, 0.24, 4.2), glowMat(0x8a2be2, 0.7), 0, -0.4, 2.4));
  }
  move(dt) {
    if (this.dash.state === 0) {
      this.pos.x = damp(this.pos.x, Math.sin(this.t * 0.5) * 10, 2.2, dt);
      this.pos.y = damp(this.pos.y, 15 + Math.sin(this.t * 0.8) * 3.5, 2.2, dt);
      this.pos.z = damp(this.pos.z, this.holdZ + Math.sin(this.t * 0.6) * 5, 2, dt);
      this.mesh.rotation.z = damp(this.mesh.rotation.z, Math.cos(this.t * 0.5) * 0.3, 3, dt);
    }
  }
  startDash() {
    const d = this.dash;
    d.state = 1; d.t = 0;
    d.from.copy(this.pos);
    d.to.set(-Math.sign(this.pos.x || 1) * rand(14, 22), CTX.player.pos.y, -13);
    Audio.sfx('beamCharge', 0.5);
  }
  initPatterns() {
    const P = this.phase;
    this.addPattern(P === 0 ? 6 : 4.2, () => this.startDash(), { phase: 0, delay: 2 });
    this.addPattern(P === 0 ? 3.6 : 2.8, () => {
      for (let i = 0; i < (P === 0 ? 3 : 4); i++) {
        this.after(i * 0.18, () => {
          const p = this.pos.clone().add(new THREE.Vector3(rand(-2, 2), rand(-1, 1), 2));
          Bullets.orb(p, this.aim(p), { speed: 20, dmg: 11, color: 0xb04fe8, scale: 1.25, pulse: true });
        });
      }
    }, { phase: 0 });
    this.addPattern(P === 0 ? 4.4 : 3.2, () => {
      Bullets.fan(this.pos.clone().add(new THREE.Vector3(0, 0, 3)), this.aim(this.pos), { n: 5, arcDeg: 42, speed: 32, dmg: 10, color: 0xff4fd8 });
    }, { phase: 0 });
  }
  update(dt) {
    // 隐形循环
    if (this.state === 'fight') {
      const cyc = this.t % 6;
      this.cloakTarget = cyc > 4.2 ? 0.14 : 1;
      this.cloak = damp(this.cloak, this.cloakTarget, 8, dt);
      for (const m of this.mats) m.opacity = Math.max(0.1, m.userData.baseOp * this.cloak);
      if (this.parts.core) this.parts.core.scale.setScalar(0.9 + Math.sin(this.t * 6) * 0.15 * this.cloak);
    }
    // 冲刺
    const d = this.dash;
    if (d.state === 1) {
      d.t += dt;
      const f = Math.min(1, d.t / 0.45);
      if (f >= 1) { d.state = 2; d.t = 0; }
    } else if (d.state === 2) {
      d.t += dt;
      const f = Math.min(1, d.t / 0.75);
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      this.pos.lerpVectors(d.from, d.to, e);
      this.mesh.rotation.z = (d.to.x > d.from.x ? -1 : 1) * 0.5;
      Effects.trail(this.pos.clone().add(new THREE.Vector3(rand(-2, 2), rand(-1, 1), 2)), { color: 0xff4fd8, size: 3, life: 0.3, grow: 4 });
      if ((f > 0.45 && !d.hitA) || (f > 0.8 && !d.hitB)) {
        if (!d.hitA) d.hitA = true; else d.hitB = true;
        Bullets.aimed(this.pos, { speed: 40, dmg: 11, color: 0xff4fd8 });
      }
      if (f >= 1) {
        d.state = 3; d.t = 0;
        if (this.phase >= 1) Bullets.ring(this.pos, { n: 9, speed: 30, dmg: 10, color: 0xb04fe8, phase: rand(TAU) });
        Effects.shockwave(this.pos, 0xff4fd8, 10, 0.35);
      }
    } else if (d.state === 3) {
      d.t += dt;
      if (d.t > 0.5) { d.state = 0; d.hitA = d.hitB = false; }
    }
    super.update(dt);
  }
}

// ============ 4. 雷神 · 浮空堡垒 ============
class ThorCitadel extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.5], accent: 0x9fd8ff, dieDur: 3.2 });
    this.radius = 8;
  }
  build() {
    const g = this.mesh;
    g.add(M(new THREE.CylinderGeometry(3.6, 4.6, 5.5, 6), hull(0x3a4a5e), 0, 0, 0));
    g.add(M(new THREE.CylinderGeometry(2.2, 3.2, 3.5, 6), hull(0x4a5c72), 0, 3.8, 0));
    g.add(M(new THREE.CylinderGeometry(1.2, 1.8, 2.2, 6), hull(0x566880), 0, 6.2, 0));
    const core = M(new THREE.OctahedronGeometry(1.3), glowMat(0x9fd8ff), 0, 6.8, 0);
    g.add(core);
    this.parts.core = core;
    // 旋转环
    for (const [r, tilt] of [[7.5, 0.5], [9, -0.35]]) {
      const ring = M(new THREE.TorusGeometry(r, 0.35, 8, 40), hull(0x2e3a48), 0, 1, 0);
      ring.rotation.x = Math.PI / 2 + tilt;
      ring.userData.spin = tilt > 0 ? 0.8 : -0.55;
      g.add(ring);
      this.orbs.push({ mesh: ring, spin: ring.userData.spin, orbs: [] });
      // 环上雷球
      for (let i = 0; i < 3; i++) {
        const orb = M(new THREE.SphereGeometry(0.55, 8, 8), glowMat(0xbfe0ff, 0.95));
        orb.userData.a = (i / 3) * TAU;
        orb.userData.r = r;
        ring.add(orb);
      }
    }
    // 避雷针
    for (const s of [1, -1]) {
      g.add(M(new THREE.CylinderGeometry(0.14, 0.14, 6, 5), hull(0x566880), s * 3.4, 4.5, 0, 0, 0, s * 0.35));
      g.add(M(new THREE.SphereGeometry(0.32, 6, 6), glowMat(0xd8ecff), s * 4.4, 7.2, 0));
    }
  }
  move(dt) {
    this.pos.x = damp(this.pos.x, Math.sin(this.t * 0.3) * 6, 1.5, dt);
    this.pos.y = damp(this.pos.y, 17 + Math.sin(this.t * 0.45) * 3, 1.5, dt);
  }
  fireBeam(laneX) {
    const beam = new Beam(CTX.scene, 0x9fd8ff, 3.2);
    this.beams.push(beam);
    beam.start(this.pos.clone().add(new THREE.Vector3(0, 6, 0)), new THREE.Vector3(laneX, CTX.player.pos.y, 10), 0.95, 0.65);
  }
  initPatterns() {
    const P = this.phase;
    this.addPattern(P === 0 ? 8 : 6, () => {
      this.fireBeam(CTX.player.pos.x);
      if (P >= 1) this.after(0.6, () => this.fireBeam(CTX.player.pos.x + 12));
    }, { phase: 0, delay: 2.5 });
    this.addPattern(P === 0 ? 6 : 4.5, () => {
      Bullets.ring(this.pos.clone().add(new THREE.Vector3(0, 2, 2)), { n: P === 0 ? 9 : 12, speed: 27, dmg: 10, color: 0x9fd8ff, phase: this.t });
    }, { phase: 0 });
    this.addPattern(9, () => {
      // 召唤无人机
      for (let i = 0; i < 2; i++) {
        Enemies.spawn('drone', { x: this.pos.x + rand(-8, 8), y: this.pos.y + rand(-3, 3), z: this.pos.z - 6, sway: 3 });
      }
      Effects.flash(this.pos, 0x9fd8ff, 6, 0.2);
    }, { phase: 0 });
    if (P >= 1) {
      this.addPattern(3.2, () => {
        Bullets.fan(this.pos.clone().add(new THREE.Vector3(0, -2, 4)), this.aim(this.pos), { n: 5, arcDeg: 50, speed: 34, dmg: 11, color: 0xbfe0ff });
      }, { phase: 1 });
    }
  }
  animate(dt) {
    for (const r of this.orbs) {
      r.mesh.rotation.z += r.spin * dt;
      for (const o of r.mesh.children) {
        o.userData.a += dt * 2;
        o.position.set(Math.cos(o.userData.a) * o.userData.r, 0, Math.sin(o.userData.a) * o.userData.r);
      }
    }
    this.parts.core.rotation.y += dt * 2;
    this.parts.core.scale.setScalar(1 + Math.sin(this.t * 4) * 0.12);
  }
}

// ============ 5. 极光之翼 · 双子歼击机 ============
class AuroraWing extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.5], accent: 0x6dffc8, dieDur: 2.6 });
    this.radius = 6.5;
  }
  build() {
    const g = this.mesh;
    const mk = (main) => {
      const w = new THREE.Group();
      const body = main ? 0xdce8ec : 0x8aa0a8;
      w.add(M(new THREE.ConeGeometry(0.9, 6.5, 6), hull(body), 0, 0, 0, FZ));
      for (const s of [1, -1]) {
        w.add(M(new THREE.BoxGeometry(4.2, 0.16, 1.8), hull(main ? 0xaabcc4 : 0x70848c), s * 2.4, 0, -0.8, 0, 0, s * 0.28));
        w.add(M(new THREE.BoxGeometry(0.14, 1.4, 1.2), hull(body), s * 1.1, 0.7, -2.2));
        const eng = M(new THREE.CylinderGeometry(0.42, 0.5, 1.8, 7), hull(0x50585e), s * 1.0, 0, -3.2, FZ);
        w.add(eng);
        w.add(M(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 7), glowMat(0x6dffc8, 0.95), s * 1.0, 0, -4.2, FZ));
      }
      w.add(M(new THREE.SphereGeometry(0.42, 8, 8), glowMat(0xaffff0, 0.95), 0, 0.4, 1.0));
      return w;
    };
    g.add(mk(true));
    for (const s of [1, -1]) {
      const c = mk(false);
      c.userData.side = s;
      g.add(c);
      this.clones.push(c);
    }
  }
  move(dt) {
    if (this.dash.state !== 0) return;
    this.pos.x = damp(this.pos.x, Math.sin(this.t * 0.55) * 14, 2.6, dt);
    this.pos.y = damp(this.pos.y, 15 + Math.sin(this.t * 1.05) * 4.5, 2.6, dt);
    this.pos.z = damp(this.pos.z, this.holdZ + Math.sin(this.t * 0.7) * 7, 2, dt);
    this.mesh.rotation.z = damp(this.mesh.rotation.z, Math.cos(this.t * 0.55) * 0.4, 3, dt);
    // 克隆体跟随（滞后）
    this.clones.forEach((c, i) => {
      const s = c.userData.side;
      c.position.x = damp(c.position.x, s * 8 + Math.sin(this.t * 0.55 + s) * 3, 3, dt);
      c.position.y = damp(c.position.y, Math.sin(this.t * 1.05 + s * 2) * 3.5, 3, dt);
      c.position.z = -4 + Math.sin(this.t * 0.7 + s) * 3;
      c.rotation.z = Math.cos(this.t * 0.55 + s) * 0.5;
    });
  }
  startDash() {
    const d = this.dash;
    d.state = 1; d.t = 0; d.hitA = d.hitB = false;
    d.from.copy(this.pos);
    d.to.set(rand(-16, 16), CTX.player.pos.y + rand(-3, 3), -12);
    Audio.sfx('beamCharge', 0.45);
  }
  initPatterns() {
    const P = this.phase;
    this.addPattern(P === 0 ? 5.5 : 3.8, () => this.startDash(), { phase: 0, delay: 1.8 });
    this.addPattern(P === 0 ? 2.4 : 1.9, () => {
      Bullets.fan(this.pos.clone().add(new THREE.Vector3(0, 0, 3)), this.aim(this.pos), { n: P === 0 ? 5 : 7, arcDeg: 38, speed: 36, dmg: 10, color: 0x6dffc8 });
    }, { phase: 0 });
    this.addPattern(4.2, () => {
      // 克隆体齐射
      for (const c of this.clones) {
        const wp = c.getWorldPosition(new THREE.Vector3());
        Bullets.aimed(wp, { speed: 40, dmg: 10, color: 0xaffff0 });
        if (P >= 1) Bullets.aimed(wp, { speed: 30, dmg: 10, spread: 0.12, color: 0xaffff0 });
      }
    }, { phase: 0 });
    if (P >= 1) {
      this.addPattern(4.5, () => {
        Bullets.ring(this.pos, { n: 11, speed: 28, dmg: 10, color: 0x6dffc8, phase: this.t * 1.3 });
      }, { phase: 1 });
    }
  }
  update(dt) {
    const d = this.dash;
    if (d.state === 1) {
      d.t += dt;
      if (d.t > 0.4) { d.state = 2; d.t = 0; }
    } else if (d.state === 2) {
      d.t += dt;
      const f = Math.min(1, d.t / 0.62);
      const e = f * f * (3 - 2 * f);
      this.pos.lerpVectors(d.from, d.to, e);
      Effects.trail(this.pos, { color: 0x6dffc8, size: 3.4, life: 0.28, grow: 5 });
      this.clones.forEach((c, i) => {
        const wp = c.getWorldPosition(new THREE.Vector3());
        Effects.trail(wp, { color: 0xaffff0, size: 2.2, life: 0.24, grow: 3 });
      });
      if (f > 0.5 && !d.hitA) {
        d.hitA = true;
        Bullets.fan(this.pos, this.aim(this.pos), { n: 5, arcDeg: 46, speed: 38, dmg: 11, color: 0xaffff0 });
      }
      if (f >= 1) { d.state = 3; d.t = 0; }
    } else if (d.state === 3) {
      d.t += dt;
      if (d.t > 0.45) d.state = 0;
    }
    super.update(dt);
  }
}

// ============ 6. 创世方舟 · 终极母舰 ============
class GenesisArk extends BossBase {
  constructor(def) {
    super({ ...def, phaseAt: [0.66, 0.33], accent: 0xff6a4d, dieDur: 4.2 });
    this.radius = 9;
  }
  build() {
    const g = this.mesh;
    const dark = 0x232a36, mid = 0x333e4e, light = 0x465468;
    // 主舰体
    g.add(M(new THREE.BoxGeometry(9, 5.5, 18), hull(dark), 0, 0, 0));
    g.add(M(new THREE.BoxGeometry(6, 3, 8), hull(mid), 0, 2.8, 2));
    g.add(M(new THREE.BoxGeometry(3.6, 2.2, 5), hull(light), 0, 4.4, 4));
    g.add(M(new THREE.ConeGeometry(3.2, 6, 4), hull(dark), 0, 0, 12, FZ, Math.PI / 4));
    // 侧舷
    for (const s of [1, -1]) {
      g.add(M(new THREE.BoxGeometry(2.4, 2.2, 12), hull(mid), s * 5.6, -0.5, -1));
      g.add(M(new THREE.BoxGeometry(0.3, 0.3, 10), glowMat(0xff6a4d, 0.85), s * 6.8, 0.4, -1));
      g.add(M(new THREE.BoxGeometry(1.2, 3.2, 4), hull(dark), s * 5.2, 2.2, 5));
    }
    // 前部核心 + 装甲
    const core = M(new THREE.SphereGeometry(2.2, 14, 14), glowMat(0xff8855, 0.95), 0, 0, 8.6);
    core.visible = false;
    g.add(core);
    this.parts.core = core;
    const armorL = M(new THREE.BoxGeometry(4.4, 4.8, 0.9), hull(0x2c3440), -1.7, 0, 8.8);
    const armorR = M(new THREE.BoxGeometry(4.4, 4.8, 0.9), hull(0x2c3440), 1.7, 0, 8.8);
    g.add(armorL, armorR);
    this.parts.armorL = armorL;
    this.parts.armorR = armorR;
    // 炮塔
    const podPos = [[-5.6, 0.8, 3], [5.6, 0.8, 3], [-5.6, 0.8, -5], [5.6, 0.8, -5]];
    podPos.forEach((pp, i) => {
      const pod = new THREE.Group();
      pod.add(M(new THREE.SphereGeometry(0.85, 8, 8), hull(0x465468)));
      pod.add(M(new THREE.CylinderGeometry(0.16, 0.16, 2, 6), hull(0x1c222c), 0, 0, 1, FZ));
      pod.add(M(new THREE.SphereGeometry(0.28, 6, 6), glowMat(0xff6a4d)));
      pod.position.set(...pp);
      pod.userData.cd = 2.1 + i * 0.4;
      pod.userData.next = rand(2, 4);
      g.add(pod);
      this.pods.push(pod);
    });
    // 舰桥灯
    g.add(M(new THREE.BoxGeometry(4, 0.3, 6), glowMat(0xffb080, 0.5), 0, 4.0, 2));
  }
  move(dt) {
    this.pos.x = damp(this.pos.x, Math.sin(this.t * 0.22) * 5, 1.2, dt);
    this.pos.y = damp(this.pos.y, 17 + Math.sin(this.t * 0.35) * 2.5, 1.2, dt);
    this.mesh.rotation.z = Math.sin(this.t * 0.22) * 0.06;
    // 装甲开合动画
    const target = this.phase >= 1 ? 1 : 0;
    this.armorOpen = damp(this.armorOpen, target, 3, dt);
    this.parts.armorL.rotation.y = -this.armorOpen * 1.25;
    this.parts.armorR.rotation.y = this.armorOpen * 1.25;
    this.parts.core.visible = this.armorOpen > 0.1;
    if (this.parts.core.visible) {
      this.parts.core.scale.setScalar(0.9 + Math.sin(this.t * 5) * 0.14);
    }
  }
  initPatterns() {
    const P = this.phase;
    if (P === 0) {
      this.addPattern(6, () => {
        for (let i = 0; i < 4; i++) this.after(i * 0.3, () => Bullets.eMissile(this.pos.clone().add(new THREE.Vector3(rand(-6, 6), -2, 8))));
      }, { delay: 2 });
      this.addPattern(7, () => {
        Bullets.ring(this.pos.clone().add(new THREE.Vector3(0, -2, 6)), { n: 10, speed: 26, dmg: 10, color: 0xff6a4d, phase: this.t });
      });
      this.addPattern(8.5, () => {
        for (let i = 0; i < 2; i++) Enemies.spawn('drone', { x: this.pos.x + rand(-6, 6), y: this.pos.y - 4, z: this.pos.z, sway: 4 });
      });
      this.addPattern(5, () => {
        const b = new Beam(CTX.scene, 0xff6a4d, 2.6);
        this.beams.push(b);
        b.start(this.pos.clone().add(new THREE.Vector3(0, 0, 9)), new THREE.Vector3(CTX.player.pos.x, CTX.player.pos.y, 10), 0.9, 0.5);
      }, { delay: 4 });
    } else if (P === 1) {
      // 激光扫射
      this.addPattern(8, () => {
        const beam = new Beam(CTX.scene, 0xff8855, 3);
        this.beams.push(beam);
        this.sweepA = rand(-0.5, 0.5);
        beam.start(this.pos.clone().add(new THREE.Vector3(0, 0, 9)), new THREE.Vector3(CTX.player.pos.x + this.sweepA * 24, CTX.player.pos.y, 10), 1.0, 1.4);
        // 扫动目标
        for (let i = 0; i < 6; i++) {
          this.after(1.0 + i * 0.2, () => {
            if (beam.mode === 'fire') beam.target.x = CTX.player.pos.x + Math.sin(i * 1.1 + this.sweepA) * 18;
          });
        }
      }, { delay: 1.5 });
      this.addPattern(3.6, () => {
        Bullets.fan(this.pos.clone().add(new THREE.Vector3(0, -2, 8)), this.aim(this.pos), { n: 7, arcDeg: 60, speed: 34, dmg: 11, color: 0xff6a4d });
      }, { phase: 1, delay: 2 });
      this.addPattern(4.8, () => {
        Bullets.ring(this.pos.clone().add(new THREE.Vector3(0, 0, 6)), { n: 12, speed: 28, dmg: 10, color: 0xffb080, phase: this.t });
      }, { phase: 1 });
    } else {
      // 决战阶段
      this.addPattern(3.4, () => {
        Bullets.ring(this.pos.clone().add(new THREE.Vector3(0, 0, 7)), { n: 14, speed: 30, dmg: 11, color: 0xff6a4d, phase: this.t * 1.4 });
      }, { delay: 1 });
      this.addPattern(2.1, () => {
        Bullets.aimed(this.parts.core.getWorldPosition(new THREE.Vector3()), { speed: 42, dmg: 12, color: 0xffd0a0, scale: 1.3 });
        Bullets.aimed(this.parts.core.getWorldPosition(new THREE.Vector3()), { speed: 36, dmg: 12, spread: 0.15, color: 0xff6a4d });
      }, { delay: 1.4 });
      this.addPattern(7, () => {
        for (let i = 0; i < 5; i++) this.after(i * 0.25, () => Bullets.eMissile(this.pos.clone().add(new THREE.Vector3(rand(-7, 7), rand(-2, 2), 8))));
      }, { delay: 3 });
      this.addPattern(9, () => {
        const b = new Beam(CTX.scene, 0xffd0a0, 3.4);
        this.beams.push(b);
        b.start(this.pos.clone().add(new THREE.Vector3(0, 0, 9)), new THREE.Vector3(CTX.player.pos.x, CTX.player.pos.y, 10), 0.9, 0.9);
      }, { delay: 5 });
    }
  }
  update(dt) {
    if (this.state === 'fight') {
      for (const pod of this.pods) {
        pod.lookAt(CTX.player.pos);
        pod.userData.next -= dt;
        if (pod.userData.next <= 0) {
          pod.userData.next = pod.userData.cd * (this.phase === 0 ? 1 : this.phase === 1 ? 0.75 : 0.6);
          this.after(0, () => {
            if (this.state === 'fight') Bullets.aimed(pod.getWorldPosition(new THREE.Vector3()), { speed: 40, dmg: 10, color: 0xff6a4d });
          });
        }
      }
    }
    super.update(dt);
  }
}

const BOSS_CLASSES = { SteelWhale, SandScorpion, NightBlade, ThorCitadel, AuroraWing, GenesisArk };

export function createBoss(levelIdx) {
  const def = LEVELS[levelIdx].boss;
  const Cls = BOSS_CLASSES[def.cls];
  return new Cls(def);
}
