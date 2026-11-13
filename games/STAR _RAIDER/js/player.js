/* 玩家战机 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const CFG = SR.CONFIG;
  const U = SR.utils;
  const W = CFG.W;
  const H = CFG.H;
  const TAU = U.TAU;

  class Player {
    constructor(game) {
      this.game = game;
      this.speed = CFG.PLAYER.speed;
      this.r = CFG.PLAYER.hitR;
      this.maxLives = CFG.PLAYER.maxLives;
      this.maxBombs = CFG.PLAYER.maxBombs;
      this.maxPower = CFG.PLAYER.maxPower;
      this.reset();
    }

    reset() {
      this.x = W / 2;
      this.y = H - 108;
      this.alive = true;
      this.lives = CFG.PLAYER.startLives;
      this.bombs = CFG.PLAYER.startBombs;
      this.power = CFG.PLAYER.startPower;
      this.invuln = CFG.PLAYER.invulnTime;
      this.shield = 0;
      this.age = 0;
      this.bank = 0;
      this.vx = 0;
      this.fireTimer = 0.04;
      this.trailTimer = 0;
      this.recoil = 0;
    }

    respawn() {
      this.x = W / 2;
      this.y = H - 108;
      this.bank = 0;
      this.invuln = CFG.PLAYER.invulnTime;
      this.fireTimer = 0.15;
    }

    update(dt) {
      if (!this.alive) return;
      this.age += dt;
      this.invuln = Math.max(0, this.invuln - dt);
      this.shield = Math.max(0, this.shield - dt);
      this.recoil = Math.max(0, this.recoil - dt * 9);

      const input = this.game.input;
      const prevX = this.x;
      const prevY = this.y;

      if (input.mode === 'pointer' && input.pointer.active) {
        const k = 1 - Math.exp(-20 * dt);
        this.x = U.lerp(this.x, input.pointer.x, k);
        this.y = U.lerp(this.y, input.pointer.y, k);
      } else {
        const axis = input.getAxis();
        if (axis.x !== 0 || axis.y !== 0) {
          const m = Math.hypot(axis.x, axis.y) || 1;
          this.x += (axis.x / m) * this.speed * dt;
          this.y += (axis.y / m) * this.speed * dt;
        }
      }

      this.x = U.clamp(this.x, 20, W - 20);
      this.y = U.clamp(this.y, 64, H - 26);

      const instVX = dt > 0 ? (this.x - prevX) / dt : 0;
      const instVY = dt > 0 ? (this.y - prevY) / dt : 0;
      this.vx = U.lerp(this.vx, instVX, Math.min(1, dt * 12));
      this.bank = U.lerp(this.bank, U.clamp(this.vx / 420, -1, 1), Math.min(1, dt * 9));

      // 自动开火
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.shoot();
        const interval = Math.max(
          CFG.PLAYER.fireMin,
          CFG.PLAYER.fireBase - (this.power - 1) * 0.011
        );
        this.fireTimer = interval;
      }

      // 引擎粒子
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.028;
        this.game.addEngineTrail(this.x, this.y + 17, instVY);
      }
    }

    shoot() {
      const p = this.power;
      const speed = CFG.PLAYER.bulletSpeed;
      const muzzleY = this.y - 20;
      const shots = [];

      if (p === 1) {
        shots.push({ ox: 0, spread: 0 });
      } else if (p === 2) {
        shots.push({ ox: -8, spread: 0 }, { ox: 8, spread: 0 });
      } else if (p === 3) {
        shots.push({ ox: 0, spread: 0 }, { ox: -10, spread: -0.14 }, { ox: 10, spread: 0.14 });
      } else if (p === 4) {
        shots.push(
          { ox: -8, spread: 0 },
          { ox: 8, spread: 0 },
          { ox: -12, spread: -0.2 },
          { ox: 12, spread: 0.2 }
        );
      } else {
        shots.push(
          { ox: 0, spread: 0 },
          { ox: -9, spread: 0 },
          { ox: 9, spread: 0 },
          { ox: -14, spread: -0.26 },
          { ox: 14, spread: 0.26 }
        );
      }

      for (const s of shots) {
        this.game.bullets.push(
          new SR.Bullet(
            this.x + s.ox,
            muzzleY - Math.abs(s.ox) * 0.35,
            Math.sin(s.spread) * speed,
            -Math.cos(s.spread) * speed,
            { r: 3.2, dmg: CFG.PLAYER.bulletDamage, color: '#67e8f9' }
          )
        );
      }

      this.game.addMuzzleFlash(this.x, muzzleY, '#a5f3fc');
      this.game.audio.shoot();
      this.recoil = 1;
    }

    hit(force = false) {
      if (!this.alive) return false;

      if (!force) {
        if (this.shield > 0) {
          this.shield = 0;
          this.invuln = Math.max(this.invuln, 0.9);
          this.game.onShieldBreak(this);
          return false;
        }
        if (this.invuln > 0) return false;
      }

      this.lives -= 1;
      this.game.onPlayerHit(this);

      if (this.lives <= 0) {
        this.alive = false;
        this.game.gameOver();
        return true;
      }

      this.power = Math.max(1, this.power - 1);
      this.respawn();
      this.game.audio.hurt();
      return true;
    }

    addPower() {
      if (this.power >= this.maxPower) return false;
      this.power += 1;
      return true;
    }

    addBomb() {
      if (this.bombs >= this.maxBombs) return false;
      this.bombs += 1;
      return true;
    }

    addLife() {
      if (this.lives >= this.maxLives) return false;
      this.lives += 1;
      return true;
    }

    draw(ctx) {
      if (!this.alive) return;

      const blink = this.invuln > 0 ? (Math.sin(this.age * 34) > -0.15 ? 1 : 0.26) : 1;
      const f = 0.7 + 0.3 * Math.sin(this.age * 32);
      const recoil = this.recoil * 2;

      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(this.x, this.y + recoil);
      ctx.rotate(this.bank * 0.15);

      // 引擎火焰
      ctx.globalCompositeOperation = 'lighter';
      const flameGrad = ctx.createLinearGradient(0, 14, 0, 36);
      flameGrad.addColorStop(0, 'rgba(165, 243, 252, 0.95)');
      flameGrad.addColorStop(0.45, 'rgba(34, 211, 238, 0.55)');
      flameGrad.addColorStop(1, 'rgba(129, 140, 248, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-5, 14);
      ctx.lineTo(-2.5, 26 + 9 * f);
      ctx.lineTo(0, 22 + 5 * f);
      ctx.lineTo(2.5, 26 + 9 * f);
      ctx.lineTo(5, 14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.lineTo(-9, 20 + 6 * f);
      ctx.lineTo(-6, 12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(9, 20 + 6 * f);
      ctx.lineTo(6, 12);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // 机翼
      const wingGrad = ctx.createLinearGradient(-24, 0, 24, 14);
      wingGrad.addColorStop(0, '#0e7490');
      wingGrad.addColorStop(0.5, '#155e75');
      wingGrad.addColorStop(1, '#0e7490');
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.85)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-22, 8);
      ctx.lineTo(-20, 14);
      ctx.lineTo(-6, 11);
      ctx.lineTo(-4, 17);
      ctx.lineTo(-10, 20);
      ctx.lineTo(-3, 18);
      ctx.lineTo(0, 12);
      ctx.lineTo(3, 18);
      ctx.lineTo(10, 20);
      ctx.lineTo(4, 17);
      ctx.lineTo(6, 11);
      ctx.lineTo(20, 14);
      ctx.lineTo(22, 8);
      ctx.lineTo(6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 翼尖灯
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(-21, 11, 1.6, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(21, 11, 1.6, 0, TAU);
      ctx.fill();

      // 机身
      const bodyGrad = ctx.createLinearGradient(0, -26, 0, 16);
      bodyGrad.addColorStop(0, '#f0fdff');
      bodyGrad.addColorStop(0.32, '#a5f3fc');
      bodyGrad.addColorStop(0.66, '#22d3ee');
      bodyGrad.addColorStop(1, '#0e7490');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = 'rgba(236, 254, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -27);
      ctx.lineTo(7, -10);
      ctx.lineTo(8, 4);
      ctx.lineTo(5, 15);
      ctx.lineTo(0, 18);
      ctx.lineTo(-5, 15);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-7, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 机头高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(2.4, -12);
      ctx.lineTo(-2.4, -12);
      ctx.closePath();
      ctx.fill();

      // 驾驶舱
      const cockpit = ctx.createLinearGradient(0, -14, 0, 2);
      cockpit.addColorStop(0, '#ecfeff');
      cockpit.addColorStop(0.5, '#67e8f9');
      cockpit.addColorStop(1, '#0f766e');
      ctx.fillStyle = cockpit;
      ctx.strokeStyle = 'rgba(8, 51, 68, 0.8)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, -8, 3.6, 7.5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();

      // 机身条纹
      ctx.strokeStyle = 'rgba(8, 51, 68, 0.55)';
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(-3, 10);
      ctx.moveTo(4, 2);
      ctx.lineTo(3, 10);
      ctx.stroke();

      ctx.restore();

      // 护盾
      if (this.shield > 0) {
        const pulse = 0.72 + 0.28 * Math.sin(this.age * 7);
        const fade = Math.min(1, this.shield / 1.2);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 * pulse * fade;
        const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 34);
        g.addColorStop(0, 'rgba(110, 231, 183, 0)');
        g.addColorStop(0.72, 'rgba(110, 231, 183, 0.18)');
        g.addColorStop(1, 'rgba(52, 211, 153, 0.5)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.8 * pulse * fade;
        ctx.beginPath();
        ctx.arc(0, 0, 31, this.age * 1.6, this.age * 1.6 + 2.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 31, this.age * 1.6 + Math.PI, this.age * 1.6 + Math.PI + 1.6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  SR.Player = Player;
})();
