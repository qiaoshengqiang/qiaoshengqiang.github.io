// 玩家战机：建模、机动姿态、机炮/导弹/炸弹、护盾与重生
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST } from './config.js';
import { Bullets } from './entities.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { rand, clamp, damp, lerp, TAU, glowTex } from './utils.js';

// 战机建模（主菜单展示复用）
export function buildJet(accent = 0x2aa7ff) {
  const g = new THREE.Group();
  const hullM = new THREE.MeshLambertMaterial({ color: 0xd8dfe8 });
  const darkM = new THREE.MeshLambertMaterial({ color: 0x2a323e });
  const accM = new THREE.MeshBasicMaterial({ color: accent });
  const canopyM = new THREE.MeshBasicMaterial({ color: 0x6fd4ff, transparent: true, opacity: 0.85 });

  // 机身（沿 z 轴，机头朝 -z）
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 3.0, 4, 10), hullM);
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.2;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 10), darkM);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -2.4;
  g.add(nose);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), canopyM);
  canopy.scale.set(0.8, 0.6, 1.6);
  canopy.position.set(0, 0.36, 0.3);
  g.add(canopy);
  // 机翼（后掠）
  for (const s of [1, -1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.5), hullM);
    wing.position.set(s * 1.9, -0.08, 0.1);
    wing.rotation.y = -s * 0.42;
    wing.rotation.z = s * 0.1;
    g.add(wing);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.9), darkM);
    tip.position.set(s * 3.35, 0.05, 0.62);
    tip.rotation.y = -s * 0.42;
    g.add(tip);
    // 前鸭翼
    const canard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.6), darkM);
    canard.position.set(s * 0.8, 0, -1.3);
    canard.rotation.y = -s * 0.5;
    g.add(canard);
  }
  // 尾翼
  for (const s of [1, -1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.9), darkM);
    fin.position.set(s * 0.62, 0.5, 1.55);
    fin.rotation.z = s * 0.3;
    g.add(fin);
  }
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.7), darkM);
  tailH.position.set(0, 0.15, 1.7);
  g.add(tailH);
  // 引擎
  for (const s of [1, -1]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.0, 8), darkM);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(s * 0.52, 0, 1.9);
    g.add(eng);
  }
  // 尾焰（加力燃烧）
  const burnM = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const burns = [];
  for (const s of [1, -1]) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.8, 8), burnM.clone());
    b.rotation.x = Math.PI / 2;
    b.position.set(s * 0.52, 0, 3.0);
    g.add(b);
    burns.push(b);
  }
  // 航行灯
  const navL = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#ff5060'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  navL.position.set(-3.4, 0.05, 0.5); navL.scale.setScalar(0.9);
  const navR = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('#4cff7a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  navR.position.set(3.4, 0.05, 0.5); navR.scale.setScalar(0.9);
  g.add(navL, navR);
  return { g, parts: { burns, navL, navR, canopy, nose } };
}

export class Player {
  constructor(carry = {}) {
    const built = buildJet();
    this.mesh = built.g;
    this.parts = built.parts;
    CTX.scene.add(this.mesh);
    this.pos = this.mesh.position;
    this.pos.set(0, 12, 0);
    this.vel = new THREE.Vector3();

    this.hp = 100; this.hpMax = 100;
    this.alive = true;
    this.power = carry.power ?? 1;
    this.missiles = carry.missiles ?? 10;
    this.bombs = carry.bombs ?? 2;
    this.shieldT = 0;
    this.invulnT = 2.0; // 开局短暂无敌
    this.respawnT = 0;

    this.fireT = 0;
    this.missileCd = 0;
    this.bombCd = 0;
    this.trailT = 0;
    this.navT = 0;
    this.speedFactor = 1;
    this.throttle = 0.55;
    this.lockTarget = null;

    // 护盾泡泡
    this.shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xa78dff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    this.shieldMesh.visible = false;
    this.mesh.add(this.shieldMesh);

    this._engines = [new THREE.Vector3(-0.52, 0, 2.6), new THREE.Vector3(0.52, 0, 2.6)];
    this._muzzles = [new THREE.Vector3(-0.7, 0, -2.6), new THREE.Vector3(0.7, 0, -2.6), new THREE.Vector3(0, 0, -3.2)];
    this._tmp = new THREE.Vector3();
  }

  addPower() { if (this.power < 3) { this.power++; } else CTX.stats.score += 500; }
  addMissiles(n) { this.missiles = Math.min(CONST.MISSILE_CAP, this.missiles + n); }
  addBomb() { if (this.bombs < CONST.BOMB_CAP) this.bombs++; else CTX.stats.score += 300; }
  heal(n) { this.hp = Math.min(this.hpMax, this.hp + n); }
  addShield() { this.shieldT = 6; }

  hit(dmg) {
    if (!this.alive || this.invulnT > 0 || CTX.godMode) return;
    if (this.shieldT > 0) {
      this.shieldT = Math.max(0, this.shieldT - 1.6);
      Effects.spark(this.pos, 0xa78dff);
      Effects.addShake(0.15);
      Audio.sfx('hitPlayer', 0.4);
      this.invulnT = 0.2;
      return;
    }
    this.hp -= dmg;
    this.invulnT = 0.35;
    Effects.addShake(0.4);
    Audio.sfx('hitPlayer');
    if (CTX.hud) CTX.hud.damageFlash();
    if (this.hp <= 0) this.die();
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    this.mesh.visible = false;
    this.shieldMesh.visible = false;
    Effects.explosion(this.pos, 2.2);
    Effects.debrisBurst(this.pos, 8, 0x99a5b0, 14);
    Audio.sfx('playerDeath');
    Audio.engineStop();
    CTX.game.onPlayerDeath();
  }

  respawn() {
    this.alive = true;
    this.hp = this.hpMax;
    this.pos.set(0, 12, 0);
    this.mesh.visible = true;
    this.invulnT = 2.8;
    this.power = Math.max(1, this.power - 1);
    Audio.engineStart();
    Audio.engineSet(0.5);
  }

  acquire() {
    // 锁定正前方最近目标
    let best = null, bestD = 1e9;
    const p = this.pos;
    for (const e of CTX.enemies) {
      if (e.dead || e.pos.z > -6 || e.pos.z < -140) continue;
      const dx = Math.abs(e.pos.x - p.x), dy = Math.abs(e.pos.y - p.y);
      if (dx > 30 || dy > 22) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    const boss = CTX.boss;
    if (boss && boss.state === 'fight' && boss.pos.z > -140) {
      const dx = Math.abs(boss.pos.x - p.x), dy = Math.abs(boss.pos.y - p.y);
      const d = dx * dx + dy * dy + 400; // 略优先小体型敌人
      if (dx < 40 && dy < 30 && d < bestD) best = boss;
    }
    return best;
  }

  fireVulcan() {
    const mz = (off, spread = 0) => {
      this._tmp.copy(off).applyQuaternion(this.mesh.quaternion).add(this.pos);
      const dir = new THREE.Vector3(rand(-spread, spread), rand(-spread, spread), -1).normalize();
      Bullets.vulcan(this._tmp, dir);
      Effects.muzzle(this._tmp, 0xaee6ff);
    };
    if (this.power === 1) mz(this._muzzles[2]);
    else if (this.power === 2) { mz(this._muzzles[0]); mz(this._muzzles[1]); }
    else { mz(this._muzzles[0]); mz(this._muzzles[1]); mz(this._muzzles[2], 0.02); }
    Audio.sfx('shoot', 0.55);
  }

  fireMissiles() {
    if (this.missiles <= 0 || this.missileCd > 0) return;
    this.missiles--;
    this.missileCd = 0.55;
    const target = this.acquire();
    if (target) Audio.sfx('lockOn');
    const launch = (off, delay) => {
      this.after(delay, () => {
        this._tmp.copy(off).applyQuaternion(this.mesh.quaternion).add(this.pos);
        Bullets.pMissile(this._tmp, target);
      });
    };
    launch(this._muzzles[0], 0);
    if (this.power >= 2) launch(this._muzzles[1], 0.1);
  }

  after(delay, fn) { CTX.game.seq.push({ t: delay, fn }); }

  fireBomb() {
    if (this.bombs <= 0 || this.bombCd > 0) return;
    this.bombs--;
    this.bombCd = 1.2;
    const p = this.pos.clone().add(new THREE.Vector3(0, 0, -10));
    Effects.shockwave(p, 0xdfefff, 80, 0.85);
    Effects.flash(p, 0xffffff, 26, 0.3);
    Effects.burst(p, { n: 40, speed: 30, colors: [0xffffff, 0xaee6ff, 0x66d9ff], life: 0.6, size: 2, grav: 0, drag: 2 });
    Effects.addShake(0.9);
    if (CTX.hud) CTX.hud.whiteFlash(0.5);
    Audio.sfx('bomb');
    Audio.boomDuck();
    for (const e of CTX.enemies) e.hit(120, e.pos.clone());
    const boss = CTX.boss;
    if (boss && boss.state === 'fight') boss.hit(150, p);
    Bullets.eOrbs.clear();
    Bullets.eBolts.clear();
    Bullets.eMissiles.clear();
  }

  update(dt) {
    this.missileCd -= dt;
    this.bombCd -= dt;
    this.invulnT -= dt;
    this.shieldT -= dt;

    if (!this.alive) {
      this.respawnT -= dt;
      if (this.respawnT <= 0 && CTX.game.lives > 0) this.respawn();
      return;
    }

    // ---- 移动 ----
    const px = this.pos.x, py = this.pos.y;
    this.pos.x = damp(this.pos.x, Input.target.x, 9, dt);
    this.pos.y = damp(this.pos.y, Input.target.y, 9, dt);
    const vx = (this.pos.x - px) / Math.max(dt, 1e-4);
    const vy = (this.pos.y - py) / Math.max(dt, 1e-4);

    // 姿态动画：滚转/俯仰/偏航
    const tz = clamp(-vx * 0.055, -1.15, 1.15);
    const tx = clamp(vy * 0.025, -0.42, 0.42);
    const ty = clamp(-vx * 0.02, -0.5, 0.5);
    this.mesh.rotation.z = damp(this.mesh.rotation.z, tz, 7, dt);
    this.mesh.rotation.x = damp(this.mesh.rotation.x, tx, 7, dt);
    this.mesh.rotation.y = damp(this.mesh.rotation.y, ty, 7, dt);
    // 高速转向滚转
    if (Math.abs(vx) > 18) this.mesh.rotation.z += (Math.sign(-vx)) * 0.0;

    // ---- 油门 / 加力 ----
    const boost = Input.isDown('boost');
    const brake = Input.isDown('brake');
    const targetTh = boost ? 1.0 : brake ? 0.3 : 0.55;
    this.throttle = damp(this.throttle, targetTh, 5, dt);
    CTX.scrollSpeed = 62 * lerp(0.62, 1.55, (this.throttle - 0.3) / 0.7);
    Audio.engineSet(this.throttle);
    // 尾焰脉动
    const bl = 0.4 + this.throttle * 0.9 + Math.sin(performance.now() * 0.02) * 0.12;
    for (const b of this.parts.burns) {
      b.scale.set(0.7 + bl * 0.15, 0.7 + bl * 0.15, bl);
      b.material.opacity = 0.35 + bl * 0.25;
    }
    // 引擎拖尾
    this.trailT -= dt;
    if (this.trailT <= 0) {
      this.trailT = 0.028;
      for (const off of this._engines) {
        this._tmp.copy(off).applyQuaternion(this.mesh.quaternion).add(this.pos);
        Effects.trail(this._tmp, {
          color: boost ? 0x7fb8e8 : 0x4f8fd0,
          size: 0.55 + this.throttle * 0.8,
          life: boost ? 0.34 : 0.22,
          vel: new THREE.Vector3(rand(-0.6, 0.6), rand(-0.6, 0.6), 14 + this.throttle * 10),
          grow: 1.4,
        });
      }
    }
    // 航行灯闪烁
    this.navT += dt;
    const blink = Math.sin(this.navT * 6) > 0.6;
    this.parts.navL.material.opacity = blink ? 1 : 0.15;
    this.parts.navR.material.opacity = blink ? 0.15 : 1;

    // ---- 武器 ----
    this.fireT -= dt;
    if (Input.isDown('fire') && this.fireT <= 0) {
      this.fireT = 1 / CONST.VULCAN_RATE;
      this.fireVulcan();
    }
    if (Input.wasPressed('missile')) this.fireMissiles();
    if (Input.wasPressed('bomb')) this.fireBomb();
    this.lockTarget = this.acquire();

    // ---- 状态 ----
    if (this.shieldT > 0) {
      this.shieldMesh.visible = true;
      const f = Math.min(1, this.shieldT / 1.2);
      this.shieldMesh.material.opacity = 0.12 + Math.sin(this.navT * 8) * 0.06 + 0.12 * f;
      this.shieldMesh.rotation.y += dt * 1.5;
    } else this.shieldMesh.visible = false;
    // 无敌闪烁
    if (this.invulnT > 0) {
      this.mesh.visible = Math.sin(this.navT * 26) > -0.4;
    } else this.mesh.visible = true;
  }

  destroy() {
    CTX.scene.remove(this.mesh);
  }
}
