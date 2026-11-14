// HUD：分数仪表、雷达、Boss 血条、横幅警告、锁定框、屏幕切换
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST } from './config.js';
import { clamp, damp, fmtScore } from './utils.js';

const $ = (id) => document.getElementById(id);

class HudManager {
  init() {
    this.root = $('hud');
    this.scoreEl = $('hud-score');
    this.stageEl = $('hud-stage');
    this.hpFill = $('hp-fill');
    this.livesEl = $('hud-lives');
    this.missilesEl = $('hud-missiles');
    this.bombsEl = $('hud-bombs');
    this.powerEl = $('hud-power');
    this.comboEl = $('hud-combo');
    this.bossBar = $('boss-bar');
    this.bossName = $('boss-name');
    this.bossFill = $('boss-fill');
    this.lockEl = $('lock-reticle');
    this.toastEl = $('hud-toast');
    this.radar = $('radar');
    this.radarCtx = this.radar ? this.radar.getContext('2d') : null;
    this.bannerStage = $('banner-stage');
    this.bannerWarn = $('banner-warning');
    this.flashWhite = $('flash-white');
    this.flashRed = $('flash-red');
    this.dispScore = 0;
    this._toastT = 0;
    this._warnT = 0;
    this._stageT = 0;
    this._sweep = 0;
  }

  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }

  setStage(idx, cfg) {
    this.stageEl.textContent = `STAGE ${idx + 1} · ${cfg.name} ${cfg.sub}`;
  }

  // ---- 横幅 ----
  stageBanner(idx, cfg) {
    this.bannerStage.querySelector('.b-title').textContent = `STAGE ${idx + 1}`;
    this.bannerStage.querySelector('.b-sub').textContent = `${cfg.name} · ${cfg.sub}`;
    this.bannerStage.classList.remove('hidden', 'out');
    this._stageT = 2.6;
  }
  warning(text, sub = '') {
    this.bannerWarn.querySelector('.bw-text').textContent = text;
    this.bannerWarn.querySelector('.bw-sub').textContent = sub;
    this.bannerWarn.classList.remove('hidden', 'out');
    this._warnT = 2.6;
  }
  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    this._toastT = 1.3;
  }

  // ---- Boss ----
  bossShow(name, en) {
    this.bossName.textContent = `${name} ── ${en}`;
    this.bossBar.classList.remove('hidden');
    this.bossFill.style.width = '100%';
  }
  bossSet(frac) { this.bossFill.style.width = `${clamp(frac * 100, 0, 100)}%`; }
  bossHide() { this.bossBar.classList.add('hidden'); }

  // ---- 闪光 ----
  damageFlash() {
    this.flashRed.style.transition = 'none';
    this.flashRed.style.opacity = 0.45;
    requestAnimationFrame(() => {
      this.flashRed.style.transition = 'opacity 0.5s';
      this.flashRed.style.opacity = 0;
    });
  }
  whiteFlash(op = 0.5) {
    this.flashWhite.style.transition = 'none';
    this.flashWhite.style.opacity = op;
    requestAnimationFrame(() => {
      this.flashWhite.style.transition = 'opacity 0.45s';
      this.flashWhite.style.opacity = 0;
    });
  }

  // ---- 每帧刷新 ----
  refresh(dt) {
    const s = CTX.stats;
    this.dispScore += (s.score - this.dispScore) * Math.min(1, dt * 8);
    this.scoreEl.textContent = fmtScore(Math.round(this.dispScore));

    const p = CTX.player;
    if (p) {
      this.hpFill.style.width = `${clamp((p.hp / p.hpMax) * 100, 0, 100)}%`;
      this.hpFill.style.background = p.hp < 30 ? 'linear-gradient(90deg,#ff4040,#ff8060)' : 'linear-gradient(90deg,#2ad4ff,#5affe0)';
      this.livesEl.textContent = '✦'.repeat(Math.max(0, CTX.game.lives)) || '—';
      this.missilesEl.textContent = `导弹 ${p.missiles}`;
      this.bombsEl.textContent = `炸弹 ${p.bombs}`;
      this.powerEl.textContent = '火力 ' + '▮'.repeat(p.power) + '▯'.repeat(3 - p.power);

      // 连击
      if (s.combo >= 2 && s.comboT > 0) {
        this.comboEl.classList.remove('hidden');
        this.comboEl.textContent = `×${(1 + s.combo * 0.05).toFixed(2)}  ${s.combo} 连击`;
      } else this.comboEl.classList.add('hidden');

      // 锁定框
      const lt = p.lockTarget;
      if (lt && !lt.dead && lt.state !== 'intro' && lt.alive !== false) {
        const v = new THREE.Vector3().copy(lt.pos);
        v.project(CTX.camera);
        if (v.z < 1) {
          const x = (v.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
          this.lockEl.classList.remove('hidden');
          this.lockEl.style.transform = `translate(${x - 22}px, ${y - 22}px)`;
        } else this.lockEl.classList.add('hidden');
      } else this.lockEl.classList.add('hidden');
    }

    // Boss 血条
    const b = CTX.boss;
    if (b && (b.state === 'fight' || b.state === 'intro')) this.bossSet(Math.max(0, b.hp / b.hpMax));

    // 雷达
    this._drawRadar(dt);

    // 横幅计时
    if (this._stageT > 0) {
      this._stageT -= dt;
      if (this._stageT <= 0.5) this.bannerStage.classList.add('out');
      if (this._stageT <= 0) this.bannerStage.classList.add('hidden');
    }
    if (this._warnT > 0) {
      this._warnT -= dt;
      if (this._warnT <= 0.5) this.bannerWarn.classList.add('out');
      if (this._warnT <= 0) this.bannerWarn.classList.add('hidden');
    }
    if (this._toastT > 0) {
      this._toastT -= dt;
      if (this._toastT <= 0) this.toastEl.classList.add('hidden');
    }
  }

  _drawRadar(dt) {
    const g = this.radarCtx;
    if (!g) return;
    const W = this.radar.width, H = this.radar.height;
    this._sweep += dt * 2.2;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,16,26,0.55)';
    g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(90,220,255,0.35)';
    g.lineWidth = 1;
    for (const r of [22, 44, 66]) { g.beginPath(); g.arc(W / 2, H / 2, r, 0, Math.PI * 2); g.stroke(); }
    // 扫描线
    const a = this._sweep;
    const grad = g.createLinearGradient(W / 2, H / 2, W / 2 + Math.cos(a) * 70, H / 2 + Math.sin(a) * 70);
    grad.addColorStop(0, 'rgba(90,220,255,0.5)');
    grad.addColorStop(1, 'rgba(90,220,255,0)');
    g.strokeStyle = grad;
    g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + Math.cos(a) * 70, H / 2 + Math.sin(a) * 70); g.stroke();

    const map = (x, z) => [W / 2 + clamp(x / 60, -1, 1) * 66, H / 2 + clamp((z + 24) / 210, 0, 1) * 70 - 34];
    const p = CTX.player;
    // 玩家
    if (p) {
      const [px, py] = map(p.pos.x, p.pos.z);
      g.fillStyle = '#5affd0';
      g.beginPath(); g.moveTo(px, py - 5); g.lineTo(px - 4, py + 4); g.lineTo(px + 4, py + 4); g.fill();
    }
    // 敌人
    const accent = CTX.levelCfg ? '#' + CTX.levelCfg.accent.toString(16).padStart(6, '0') : '#ff5566';
    for (const e of CTX.enemies) {
      if (e.dead) continue;
      const [x, y] = map(e.pos.x, e.pos.z);
      g.fillStyle = accent;
      g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill();
    }
    // 导弹威胁
    for (const b of CTX.game?.bullets?.eMissiles?.items ?? []) {
      if (!b.active) continue;
      const [x, y] = map(b.pos.x, b.pos.z);
      g.fillStyle = '#ff5060';
      g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill();
    }
    // Boss
    const boss = CTX.boss;
    if (boss && !boss.dead && boss.state !== 'done') {
      const [x, y] = map(boss.pos.x, boss.pos.z);
      g.fillStyle = '#ff9040';
      g.fillRect(x - 4, y - 4, 8, 8);
      g.strokeStyle = '#ff9040';
      g.strokeRect(x - 6.5, y - 6.5, 13, 13);
    }
  }
}

export const Hud = new HudManager();
