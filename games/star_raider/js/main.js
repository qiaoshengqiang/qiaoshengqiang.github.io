/* 启动入口 & 可选的调试接口（?debug=1） */
(function () {
  'use strict';
  const SR = window.SR;

  function boot() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    const game = new SR.Game(canvas);
    window.__SR_GAME = game;

    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      window.__SR_DEBUG = {
        state: () => game.debugState(),
        killPlayer: () => {
          const p = game.player;
          p.invuln = 0;
          p.shield = 0;
          p.hit(true);
          return game.debugState();
        },
        setLives: (n) => {
          game.player.lives = n;
          game.syncBombButton();
          return game.player.lives;
        },
        addBombs: (n) => {
          game.player.bombs = Math.max(0, Math.min(game.player.maxBombs, n));
          game.syncBombButton();
          return game.player.bombs;
        },
        forceBoss: (wave) => {
          const n = wave || Math.max(5, Math.ceil((game.wave + 1) / 5) * 5);
          game.enemies = [];
          game.enemyBullets = [];
          game.boss = null;
          game.bullets = [];
          game.startWave(n);
          return game.debugState();
        },
        damageBoss: (n) => {
          if (!game.boss) return null;
          game.boss.hit(n || 30, game.boss.x, game.boss.y);
          return game.debugState();
        },
        spawnPowerUp: (type) => {
          const pu = new SR.PowerUp(type || 'power', game.player.x, game.player.y - 90);
          game.powerups.push(pu);
          return game.debugState();
        },
        clearEnemies: () => {
          for (const e of game.enemies) e.hit(999, e.x, e.y);
          return game.debugState();
        },
        setInvuln: (seconds) => {
          game.player.invuln = Math.max(0, Number(seconds) || 0);
          return game.player.invuln;
        },
        togglePause: () => {
          game.togglePause();
          return game.debugState();
       },
        start: () => {
          game.startGame();
          return game.debugState();
        }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
