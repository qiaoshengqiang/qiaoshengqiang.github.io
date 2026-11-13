/* 游戏实体：星空、子弹、敌机、BOSS、补给、粒子 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const CFG = SR.CONFIG;
  const U = SR.utils;
  const W = CFG.W;
  const H = CFG.H;
  const TAU = U.TAU;

  /* ============================================================
     星空背景
     ============================================================ */
  class Starfield {
    constructor() {
      const layers = [
        { count: 56, speed: [12, 30], size: [0.5, 1.1], alpha: [0.2, 0.5] },
        { count: 30, speed: [34, 66], size: [0.8, 1.6], alpha: [0.35, 0.75] },
        { count: 15, speed: [72, 126], size: [1.2, 2.2], alpha: [0.55, 1] }
      ];
      this.stars = [];
      layers.forEach((layer) => {
        for (let i = 0; i < layer.count; i++) {
          this.stars.push({
            x: U.rand(0, W),
            y: U.rand(0, H),
            size: U.rand(layer.size[0], layer.size[1]),
            speed: U.rand(layer.speed[0], layer.speed[1]),
            alpha: U.rand(layer.alpha[0], layer.alpha[1]),
            phase: U.rand(0, TAU),
            twinkle: U.rand(0.6, 2.2)
          });
        }
      });
      this.time = 0;
      this.comet = null;
      this.cometTimer = U.rand(4, 9);
    }

    update(dt, speedScale = 1) {
      this.time += dt;
      for (const s of this.stars) {
        s.y += s.speed * speedScale * dt;
        if (s.y > H + 4) {
          s.y = -4;
          s.x = U.rand(0, W);
        }
      }

      this.cometTimer -= dt;
      if (!this.comet && this.cometTimer <= 0) {
        const fromLeft = U.chance(0.5);
        this.comet = {
          x: fromLeft ? U.rand(-40, W * 0.4) : U.rand(W * 0.6, W + 40),
          y: U.rand(-30, 120),
          vx: fromLeft ? U.rand(90, 160) : U.rand(-160, -90),
          vy: U.rand(90, 170),
          life: 1.1,
          maxLife: 1.1
        };
        this.cometTimer = U.rand(6, 14);
      }
      if (this.comet) {
        this.comet.x += this.comet.vx * dt;
        this.comet.y += this.comet.vy * dt;
        this.comet.life -= dt;
        if (this.comet.life <= 0) this.comet = null;
      }
    }

    draw(ctx) {
      for (const s of this.stars) {
        const tw = 0.72 + 0.28 * Math.sin(this.time * s.twinkle + s.phase);
        const a = s.alpha * tw;
        ctx.fillStyle = `rgba(214, 235, 255, ${a.toFixed(3)})`;
        if (s.size > 1.35) {
          ctx.fillRect(s.x - s.size / 2, s.y - s.size, s.size, s.size * 2.4);
        } else {
          ctx.fillRect(s.x, s.y, s.size, s.size);
        }
      }

      if (this.comet) {
        const c = this.comet;
        const k = c.life / c.maxLife;
        const len = 46;
        const mag = Math.hypot(c.vx, c.vy) || 1;
        const nx = c.vx / mag;
        const ny = c.vy / mag;
        const grad = ctx.createLinearGradient(c.x, c.y, c.x - nx * len, c.y - ny * len);
        grad.addColorStop(0, `rgba(224, 242, 254, ${0.85 * k})`);
        grad.addColorStop(0.3, `rgba(125, 211, 252, ${0.45 * k})`);
        grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - nx * len, c.y - ny * len);
        ctx.stroke();
      }
    }
  }

  /* ============================================================
     玩家子弹
     ============================================================ */
  class Bullet {
    constructor(x, y, vx, vy, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = opts.r || 3.2;
      this.dmg = opts.dmg || 1;
      this.color = opts.color || CFG.COLORS.cyan;
      this.dead = false;
      this.age = 0;
    }

    update(dt) {
      this.age += dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y < -50 || this.y > H + 50 || this.x < -50 || this.x > W + 50) {
        this.dead = true;
      }
    }

    draw(ctx) {
      const ang = Math.atan2(this.vy, this.vx);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(3, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 1.9, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ============================================================
     敌方子弹
     ============================================================ */
  class EnemyBullet {
    constructor(x, y, vx, vy, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = opts.r || 5;
      this.color = opts.color || '#fb7185';
      this.core = opts.core || '#fff1f2';
      this.dead = false;
      this.age = U.rand(0, TAU);
    }

    update(dt) {
      this.age += dt * 2.2;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (
        this.age > 18 ||
        this.x < -30 ||
        this.x > W + 30 ||
        this.y < -60 ||
        this.y > H + 60
      ) {
        this.dead = true;
      }
    }

    draw(ctx) {
      const pulse = 0.86 + 0.14 * Math.sin(this.age * 2.4);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // 尾迹
      const mag = Math.hypot(this.vx, this.vy) || 1;
      const nx = this.vx / mag;
      const ny = this.vy / mag;
      const trail = 16;
      const grad = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x - nx * trail,
        this.y - ny * trail
      );
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'rgba(251, 113, 133, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = this.r * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - nx * trail, this.y - ny * trail);
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.24;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.1 * pulse, 0, TAU);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * pulse, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.core;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.44, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ============================================================
     普通敌机
     ============================================================ */
  const ENEMY_DEFS = {
    scout: {
      hp: 1,
      r: 13,
      score: 100,
      speed: 128,
      maxAge: 15,
      color: '#fb923c',
      glow: '#fed7aa',
      label: 'SCOUT'
    },
    diver: {
      hp: 2,
      r: 14,
      score: 160,
      speed: 235,
      maxAge: 14,
      color: '#f87171',
      glow: '#fecaca',
      label: 'DIVER'
    },
    gunner: {
      hp: 4,
      r: 17,
      score: 260,
      speed: 62,
      maxAge: 17,
      color: '#c084fc',
      glow: '#e9d5ff',
      label: 'GUNNER'
    },
    tank: {
      hp: 12,
      r: 24,
      score: 520,
      speed: 48,
      maxAge: 19,
      color: '#fb7185',
      glow: '#fecdd3',
      label: 'TANK'
    }
  };

  class Enemy {
    constructor(game, type, x, y, opts = {}) {
      this.game = game;
      this.type = type;
      this.def = ENEMY_DEFS[type];
      this.x = x;
      this.y = y;
      this.baseX = x;
      this.r = this.def.r;
      this.maxHp = this.def.hp + (type === 'tank' ? Math.floor(game.wave / 3) * 2 : 0);
      this.hp = this.maxHp;
      this.score = this.def.score + Math.floor(game.wave / 3) * 20;
      this.age = 0;
      this.phase = opts.phase !== undefined ? opts.phase : U.rand(0, TAU);
      this.amp = opts.amp !== undefined ? opts.amp : U.rand(22, 46);
      this.targetY = opts.targetY !== undefined ? opts.targetY : U.rand(128, 215);
      this.dir = x < W / 2 ? 1 : -1;
      this.speed = this.def.speed * (1 + Math.min(0.6, (game.wave - 1) * 0.045));
      this.fireScale = Math.min(1.55, 1 + (game.wave - 1) * 0.035);
      this.fireTimer = U.rand(0.9, 2.0);
      this.flash = 0;
      this.tilt = 0;
      this.vx = 0;
      this.vy = 0;
      this.hasDived = false;
      this.dead = false;
    }

    update(dt) {
      this.age += dt;
      this.flash = Math.max(0, this.flash - dt * 5);
      this.tilt = U.lerp(this.tilt, 0, Math.min(1, dt * 6));

      const leaving = this.age > this.def.maxAge - 1.6;

      switch (this.type) {
        case 'scout': {
          this.y += this.speed * dt;
          this.x = this.baseX + Math.sin(this.age * 2.6 + this.phase) * this.amp;
          this.tilt = Math.cos(this.age * 2.6 + this.phase) * 0.22;
          break;
        }
        case 'diver': {
          if (this.age < 0.55) {
            this.y += 95 * dt;
            this.x = this.baseX + Math.sin(this.age * 5 + this.phase) * 12;
          } else if (!this.hasDived) {
            this.hasDived = true;
            const p = this.game.player;
            const a = Math.atan2(p.y - this.y, p.x - this.x);
            this.vx = Math.cos(a) * this.speed;
            this.vy = Math.max(170, Math.sin(a) * this.speed);
            this.tilt = Math.atan2(this.vy, this.vx) - Math.PI / 2;
          } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.tilt = Math.atan2(this.vy, this.vx) - Math.PI / 2;
          }
          break;
        }
        case 'gunner': {
          if (this.y < this.targetY && !leaving) {
            this.y += 88 * dt;
          } else {
            this.y = this.targetY + Math.sin(this.age * 1.7 + this.phase) * 7;
            this.x += this.dir * 58 * dt;
            if (this.x > W - 48) {
              this.x = W - 48;
              this.dir = -1;
            } else if (this.x < 48) {
              this.x = 48;
              this.dir = 1;
            }
            if (this.y > 10 && this.game.player.alive) {
              this.fireTimer -= dt;
              if (this.fireTimer <= 0) {
                this.fireAtPlayer(1, 0, 205 * this.fireScale);
                this.fireTimer = Math.max(1.05, 2.1 - this.game.wave * 0.04);
              }
            }
          }
          if (leaving) this.y += 150 * dt;
          break;
        }
        case 'tank': {
          if (this.y < this.targetY && !leaving) {
            this.y += 62 * dt;
          } else {
            this.y = this.targetY + Math.sin(this.age * 1.3 + this.phase) * 8;
            this.x = this.baseX + Math.sin(this.age * 0.9 + this.phase) * 58;
            if (this.y > 10 && this.game.player.alive) {
              this.fireTimer -= dt;
              if (this.fireTimer <= 0) {
                this.fireAtPlayer(3, 0.24, 178 * this.fireScale);
                this.fireTimer = Math.max(1.5, 2.6 - this.game.wave * 0.045);
              }
            }
          }
          if (leaving) this.y += 120 * dt;
          break;
        }
      }

      this.x = U.clamp(this.x, this.r + 4, W - this.r - 4);
    }

    fireAtPlayer(count, spread, speed) {
      const p = this.game.player;
      if (!p || !p.alive) return;
      const base = Math.atan2(p.y - this.y, p.x - this.x);
      for (let i = 0; i < count; i++) {
        const a = base + (i - (count - 1) / 2) * spread;
        this.game.enemyBullets.push(
          new EnemyBullet(
            this.x,
            this.y + this.r * 0.4,
            Math.cos(a) * speed,
            Math.sin(a) * speed,
            {
              r: this.type === 'tank' ? 6 : 5,
              color: this.type === 'tank' ? '#fbbf24' : '#fb7185',
              core: '#fff7ed'
            }
          )
        );
      }
      this.game.audio.enemyShoot();
      this.game.addMuzzleFlash(this.x, this.y + this.r * 0.6, '#fda4af');
    }

    hit(dmg, x, y) {
      if (this.dead) return false;
      this.hp -= dmg;
      this.flash = 0.16;
      this.game.addSparks(x === undefined ? this.x : x, y === undefined ? this.y : y, this.def.glow, 2);
      if (this.hp <= 0) {
        this.die();
        return true;
      }
      this.game.audio.hit();
      return false;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      this.game.onEnemyKilled(this);
    }

    offscreen() {
      return this.y > H + this.r + 40;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);
      switch (this.type) {
        case 'scout':
          this.drawScout(ctx);
          break;
        case 'diver':
          this.drawDiver(ctx);
          break;
        case 'gunner':
          this.drawGunner(ctx);
          break;
        case 'tank':
          this.drawTank(ctx);
          break;
      }
      if (this.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.65, this.flash * 3.4);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 0.9, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawScout(ctx) {
      const hot = this.flash > 0.1;
      const body = hot ? '#ffffff' : this.def.color;
      // 引擎焰
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(253, 186, 116, 0.55)';
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(0, -18 - Math.random() * 5);
      ctx.lineTo(4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // 机身
      ctx.fillStyle = body;
      ctx.strokeStyle = 'rgba(255, 247, 237, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(7, 5);
      ctx.lineTo(5, -7);
      ctx.lineTo(0, -12);
      ctx.lineTo(-5, -7);
      ctx.lineTo(-7, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 机翼
      ctx.fillStyle = hot ? '#ffffff' : '#9a3412';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-16, 7);
      ctx.lineTo(-6, 9);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(16, 7);
      ctx.lineTo(6, 9);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();

      // 驾驶舱
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, 1, 2.4, 4.2, 0, 0, TAU);
      ctx.fill();
    }

    drawDiver(ctx) {
      const hot = this.flash > 0.1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
      ctx.beginPath();
      ctx.arc(0, -9, 8, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = hot ? '#ffffff' : this.def.color;
      ctx.strokeStyle = 'rgba(254, 226, 226, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.lineTo(7, 5);
      ctx.lineTo(19, -4);
      ctx.lineTo(7, -9);
      ctx.lineTo(0, -5);
      ctx.lineTo(-7, -9);
      ctx.lineTo(-19, -4);
      ctx.lineTo(-7, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, TAU);
      ctx.fill();

      // 后掠翼尖
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(-11, 8);
      ctx.moveTo(18, -4);
      ctx.lineTo(11, 8);
      ctx.stroke();
    }

    drawGunner(ctx) {
      const hot = this.flash > 0.1;
      // 侧炮
      ctx.fillStyle = hot ? '#ffffff' : '#4c1d95';
      U.roundRect(ctx, -22, 0, 6, 14, 2);
      ctx.fill();
      U.roundRect(ctx, 16, 0, 6, 14, 2);
      ctx.fill();
      ctx.fillStyle = '#f5d0fe';
      ctx.fillRect(-20.5, 12, 3, 4);
      ctx.fillRect(17.5, 12, 3, 4);

      // 机身
      ctx.fillStyle = hot ? '#ffffff' : '#7c3aed';
      ctx.strokeStyle = 'rgba(233, 213, 255, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(13, -7);
      ctx.lineTo(11, 9);
      ctx.lineTo(0, 16);
      ctx.lineTo(-11, 9);
      ctx.lineTo(-13, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 装甲细节
      ctx.fillStyle = hot ? '#ffffff' : this.def.color;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, -4);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 10);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();

      // 核心
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(0, -1, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(0, -1, 1.4, 0, TAU);
      ctx.fill();
    }

    drawTank(ctx) {
      const hot = this.flash > 0.1;
      // 尾焰
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-10, -20, 5, 10, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10, -20, 5, 10, 0, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // 炮管
      ctx.fillStyle = hot ? '#ffffff' : '#5b1225';
      U.roundRect(ctx, -14, 16, 7, 14, 2);
      ctx.fill();
      U.roundRect(ctx, 7, 16, 7, 14, 2);
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.fillRect(-12.5, 27, 4, 3);
      ctx.fillRect(8.5, 27, 4, 3);

      // 主体
      ctx.fillStyle = hot ? '#ffffff' : '#9f1239';
      ctx.strokeStyle = 'rgba(255, 228, 230, 0.85)';
      ctx.lineWidth = 1.4;
      U.roundRect(ctx, -24, -20, 48, 40, 9);
      ctx.fill();
      ctx.stroke();

      // 装甲板
      ctx.fillStyle = hot ? '#ffffff' : '#be123c';
      ctx.beginPath();
      ctx.moveTo(-18, -14);
      ctx.lineTo(18, -14);
      ctx.lineTo(13, 2);
      ctx.lineTo(-13, 2);
      ctx.closePath();
      ctx.fill();

      // 铆钉
      ctx.fillStyle = '#fecdd3';
      [-17, 17].forEach((x) => {
        [-13, 9].forEach((y) => {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, TAU);
          ctx.fill();
        });
      });

      // 核心
      const pulse = 0.7 + 0.3 * Math.sin(this.age * 5);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(253, 164, 175, ${0.28 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 8, 12, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff1f2';
      ctx.beginPath();
      ctx.arc(0, 8, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.arc(0, 8, 2.1, 0, TAU);
      ctx.fill();

      // 血条（受损后才显示）
      if (this.hp < this.maxHp) {
        const w = 40;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(-w / 2, -30, w, 3.5);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(-w / 2, -30, (w * this.hp) / this.maxHp, 3.5);
      }
    }
  }

  /* ============================================================
     BOSS
     ============================================================ */
  class Boss {
    constructor(game, wave) {
      this.game = game;
      this.wave = wave;
      this.x = W / 2;
      this.y = -130;
      this.targetY = 128;
      this.r = 52;
      this.maxHp = 70 + wave * 16;
      this.hp = this.maxHp;
      this.state = 'enter';
      this.age = 0;
      this.flash = 0;
      this.tilt = 0;
      this.ringSpin = 0;
      this.pattern = 0;
      this.attackTimer = 1.4;
      this.burstLeft = 0;
      this.burstTimer = 0;
      this.deathTimer = 0;
      this.explodeTimer = 0;
      this.dead = false;
      this.enraged = false;
    }

    get dying() {
      return this.state === 'dying';
    }

    update(dt) {
      this.age += dt;
      this.flash = Math.max(0, this.flash - dt * 6);
      this.ringSpin += dt * 1.4;
      this.tilt = Math.sin(this.age * 0.9) * 0.035;

      if (this.state === 'enter') {
        this.y += 90 * dt;
        if (this.y >= this.targetY) {
          this.y = this.targetY;
          this.state = 'fight';
          this.attackTimer = 1.1;
        }
        return;
      }

      if (this.state === 'dying') {
        this.deathTimer -= dt;
        this.explodeTimer -= dt;
        this.y += 6 * dt;
        if (this.explodeTimer <= 0) {
          this.explodeTimer = 0.11;
          const ex = this.x + U.rand(-80, 80);
          const ey = this.y + U.rand(-40, 50);
          this.game.spawnExplosion(ex, ey, U.rand(14, 30), U.pick(['#fda4af', '#fbbf24', '#c084fc']), 0.8);
          this.game.addShake(3.5);
          if (U.chance(0.35)) this.game.audio.explode(1.2);
        }
        if (this.deathTimer <= 0) {
          this.dead = true;
          this.game.bossDefeated(this);
        }
        return;
      }

      // 战斗阶段
      if (!this.enraged && this.hp <= this.maxHp * 0.4) {
        this.enraged = true;
        this.game.addShake(12);
        this.game.addFloat(this.x, this.y + 70, 'BOSS 狂暴化', '#fda4af', 1.6, 20);
        this.game.audio.bossWarn();
      }

      const speed = this.enraged ? 1.25 : 1;
      this.x = W / 2 + Math.sin(this.age * 0.58 * speed) * (W / 2 - 112);
      this.y = this.targetY + Math.sin(this.age * 1.2) * 10;
      this.x = U.clamp(this.x, 100, W - 100);

      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attack();
        const base = Math.max(0.78, 1.65 - this.wave * 0.02);
        this.attackTimer = this.enraged ? base * 0.74 : base;
      }

      if (this.burstLeft > 0) {
        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
          this.fireAtPlayer(2, 0.12, 235);
          this.burstLeft--;
          this.burstTimer = 0.17;
        }
      }
    }

    attack() {
      const pat = this.pattern % 4;
      this.pattern++;
      if (pat === 0) {
        this.fireAtPlayer(5, 0.17, 215);
        this.game.addShake(2);
      } else if (pat === 1) {
        this.fireRadial(18, 152, this.ringSpin);
      } else if (pat === 2) {
        this.burstLeft = this.enraged ? 5 : 3;
        this.burstTimer = 0;
      } else {
        this.fireRadial(12, 196, -this.ringSpin * 0.7);
        this.fireAtPlayer(3, 0.3, 190);
      }
    }

    fireAtPlayer(count, spread, speed) {
      const p = this.game.player;
      if (!p || !p.alive) return;
      const base = Math.atan2(p.y - this.y, p.x - this.x);
      for (let i = 0; i < count; i++) {
        const a = base + (i - (count - 1) / 2) * spread;
        this.game.enemyBullets.push(
          new EnemyBullet(this.x, this.y + 18, Math.cos(a) * speed, Math.sin(a) * speed, {
            r: 6,
            color: this.enraged ? '#fb7185' : '#f0abfc',
            core: '#fdf4ff'
          })
        );
      }
      this.game.audio.enemyShoot();
      this.game.addMuzzleFlash(this.x, this.y + 30, '#f5d0fe', 1.4);
    }

    fireRadial(count, speed, offset) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + offset;
        this.game.enemyBullets.push(
          new EnemyBullet(this.x, this.y + 8, Math.cos(a) * speed, Math.sin(a) * speed, {
            r: 5.5,
            color: this.enraged ? '#fda4af' : '#c084fc',
            core: '#fdf4ff'
          })
        );
      }
      this.game.addShake(2.5);
      this.game.audio.enemyShoot();
    }

    hit(dmg, x, y) {
      if (this.state === 'dying' || this.dead) return false;
      this.hp -= dmg;
      this.flash = 0.13;
      this.game.addSparks(x === undefined ? this.x : x, y === undefined ? this.y : y, '#f5d0fe', 2);
      if (this.hp <= 0) {
        this.hp = 0;
        this.startDeath();
        return true;
      }
      return false;
    }

    startDeath() {
      this.state = 'dying';
      this.deathTimer = 1.9;
      this.explodeTimer = 0;
      this.game.clearEnemyBullets(true);
      this.game.addShake(24);
      this.game.flash = 0.6;
      this.game.addScore(2000 + this.wave * 100);
      this.game.audio.bossExplode();
      this.game.spawnExplosion(this.x, this.y, 90, '#fbbf24', 1.5);
    }

    draw(ctx) {
      const t = this.age;
      const corePulse = 0.72 + 0.28 * Math.sin(t * 4.2);
      const coreColor = this.enraged ? '#fb7185' : '#e879f9';

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);

      // 光环
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(0, 10, 10, 0, 10, 105);
      aura.addColorStop(0, this.enraged ? 'rgba(251, 113, 133, 0.20)' : 'rgba(192, 132, 252, 0.17)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 10, 105, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // 尾焰
      const flame = 16 + Math.sin(t * 18) * 6;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(129, 140, 248, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-16, -34);
      ctx.lineTo(-8, -34 - flame);
      ctx.lineTo(0, -34);
      ctx.lineTo(8, -34 - flame * 0.8);
      ctx.lineTo(16, -34);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // 侧翼
      ctx.fillStyle = this.flash > 0.08 ? '#ffffff' : '#241238';
      ctx.strokeStyle = this.enraged ? 'rgba(251, 113, 133, 0.85)' : 'rgba(192, 132, 252, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -30);
      ctx.lineTo(-34, -20);
      ctx.lineTo(-92, -4);
      ctx.lineTo(-102, 16);
      ctx.lineTo(-64, 24);
      ctx.lineTo(-34, 13);
      ctx.lineTo(-12, 22);
      ctx.lineTo(-8, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -30);
      ctx.lineTo(34, -20);
      ctx.lineTo(92, -4);
      ctx.lineTo(102, 16);
      ctx.lineTo(64, 24);
      ctx.lineTo(34, 13);
      ctx.lineTo(12, 22);
      ctx.lineTo(8, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 翼灯
      const lights = [
        [-92, 12],
        [-64, 20],
        [92, 12],
        [64, 20]
      ];
      ctx.fillStyle = this.enraged ? '#fda4af' : '#e9d5ff';
      lights.forEach(([lx, ly]) => {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5 + lx);
        ctx.beginPath();
        ctx.arc(lx, ly, 2.4, 0, TAU);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 炮塔
      [-58, 58].forEach((cx) => {
        ctx.fillStyle = this.flash > 0.08 ? '#ffffff' : '#381d54';
        U.roundRect(ctx, cx - 9, 8, 18, 32, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.stroke();
        ctx.fillStyle = this.enraged ? '#fb7185' : '#c084fc';
        ctx.fillRect(cx - 3, 34, 6, 8);
      });

      // 中央舰体
      ctx.fillStyle = this.flash > 0.08 ? '#ffffff' : '#301a4b';
      ctx.strokeStyle = this.enraged ? 'rgba(251, 113, 133, 0.9)' : 'rgba(216, 180, 254, 0.8)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(27, -24);
      ctx.lineTo(38, 2);
      ctx.lineTo(26, 30);
      ctx.lineTo(0, 46);
      ctx.lineTo(-26, 30);
      ctx.lineTo(-38, 2);
      ctx.lineTo(-27, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 装甲板
      ctx.fillStyle = this.flash > 0.08 ? '#ffffff' : '#48236b';
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(18, -18);
      ctx.lineTo(22, 12);
      ctx.lineTo(0, 30);
      ctx.lineTo(-22, 12);
      ctx.lineTo(-18, -18);
      ctx.closePath();
      ctx.fill();

      // 核心
      ctx.globalCompositeOperation = 'lighter';
      const coreGlow = ctx.createRadialGradient(0, 8, 2, 0, 8, 36);
      coreGlow.addColorStop(0, this.enraged ? 'rgba(255, 228, 230, 0.9)' : 'rgba(253, 244, 255, 0.85)');
      coreGlow.addColorStop(0.28, coreColor);
      coreGlow.addColorStop(1, 'rgba(232, 121, 249, 0)');
      ctx.fillStyle = coreGlow;
      ctx.globalAlpha = 0.5 + 0.5 * corePulse;
      ctx.beginPath();
      ctx.arc(0, 8, 36, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(0, 8, 7.5 * corePulse, 0, TAU);
      ctx.fill();
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(0, 8, 3.4, 0, TAU);
      ctx.fill();

      // 旋转能量环
      ctx.save();
      ctx.translate(0, 8);
      ctx.rotate(this.ringSpin);
      ctx.strokeStyle = this.enraged ? 'rgba(253, 164, 175, 0.65)' : 'rgba(232, 121, 249, 0.6)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 23 + i * 5, i * 1.9, i * 1.9 + 1.1);
        ctx.stroke();
      }
      ctx.restore();

      // 舰首眼灯
      ctx.fillStyle = this.enraged ? '#fb7185' : '#67e8f9';
      ctx.beginPath();
      ctx.ellipse(-12, -20, 3.4, 1.6, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -20, 3.4, 1.6, 0.4, 0, TAU);
      ctx.fill();

      ctx.restore();
    }
  }

  /* ============================================================
     补给
     ============================================================ */
  const POWERUP_TYPES = {
    power: { color: '#67e8f9', glow: '#22d3ee', letter: 'P' },
    bomb: { color: '#fcd34d', glow: '#f59e0b', letter: 'B' },
    shield: { color: '#6ee7b7', glow: '#34d399', letter: 'S' },
    life: { color: '#fda4af', glow: '#fb7185', letter: 'H' }
  };

  class PowerUp {
    constructor(type, x, y) {
      this.type = type;
      this.def = POWERUP_TYPES[type];
      this.x = x;
      this.y = y;
      this.baseX = x;
      this.r = 13;
      this.age = 0;
      this.dead = false;
    }

    update(dt, player) {
      this.age += dt;
      this.y += 82 * dt;
      this.x = this.baseX + Math.sin(this.age * 3.1) * 9;

      // 靠近玩家时轻微吸附
      if (player && player.alive) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 92 && d > 1) {
          const pull = (1 - d / 92) * 300 * dt;
          this.x += (dx / d) * pull;
          this.y += (dy / d) * pull;
        }
      }

      if (this.y > H + 30) this.dead = true;
    }

    draw(ctx) {
      const def = this.def;
      const pulse = 0.78 + 0.22 * Math.sin(this.age * 5);
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 * pulse;
      ctx.fillStyle = def.glow;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      ctx.rotate(this.age * 1.4);
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(8, 16, 28, 0.9)';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-this.age * 1.4);
      ctx.strokeStyle = def.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = def.color;
      ctx.font = '800 13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.letter, 0, 1);

      ctx.restore();
    }
  }

  /* ============================================================
     粒子 / 浮动文字 / 冲击波
     ============================================================ */
  class Particle {
    constructor(opts) {
      this.x = opts.x;
      this.y = opts.y;
      this.vx = opts.vx;
      this.vy = opts.vy;
      this.life = opts.life;
      this.maxLife = opts.life;
      this.size = opts.size;
      this.color = opts.color;
      this.drag = opts.drag !== undefined ? opts.drag : 1.4;
      this.gravity = opts.gravity || 0;
      this.additive = opts.additive !== false;
      this.streak = !!opts.streak;
      this.dead = false;
    }

    update(dt) {
      const damp = Math.exp(-this.drag * dt);
      this.vx *= damp;
      this.vy *= damp;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
      const a = U.clamp(this.life / this.maxLife, 0, 1);
      ctx.save();
      if (this.additive) ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
      if (this.streak) {
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.03, this.y - this.vy * 0.03);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (0.4 + a * 0.6), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatText {
    constructor(x, y, text, color, opts = {}) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.life = opts.life || 1;
      this.maxLife = this.life;
      this.size = opts.size || 14;
      this.vy = opts.vy !== undefined ? opts.vy : -34;
      this.dead = false;
    }

    update(dt) {
      this.y += this.vy * dt;
      this.vy *= Math.exp(-1.6 * dt);
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
      const a = U.clamp(this.life / 0.35, 0, 1);
      const rise = 1 - this.life / this.maxLife;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${this.size}px ui-monospace, Menlo, monospace`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
      if (rise < 0.25) {
        ctx.globalAlpha = (1 - rise / 0.25) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.text, this.x, this.y);
      }
      ctx.restore();
    }
  }

  class Shockwave {
    constructor(x, y, opts = {}) {
      this.x = x;
      this.y = y;
      this.r = 10;
      this.maxR = opts.maxR || 260;
      this.life = opts.life || 0.65;
      this.maxLife = this.life;
      this.color = opts.color || '#67e8f9';
      this.width = opts.width || 3;
      this.dead = false;
    }

    update(dt) {
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
      const k = 1 - this.life / this.maxLife;
      const r = 10 + U.easeOutCubic(k) * this.maxR;
      const a = Math.pow(1 - k, 1.4);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.width * (1 - k * 0.6);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = a * 0.22;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.92, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  SR.Starfield = Starfield;
  SR.Bullet = Bullet;
  SR.EnemyBullet = EnemyBullet;
  SR.Enemy = Enemy;
  SR.Boss = Boss;
  SR.PowerUp = PowerUp;
  SR.Particle = Particle;
  SR.FloatText = FloatText;
  SR.Shockwave = Shockwave;
  SR.ENEMY_DEFS = ENEMY_DEFS;
  SR.POWERUP_TYPES = POWERUP_TYPES;
})();
