/* 全局配置：所有尺寸以 480×720 的逻辑坐标系为准 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});

  SR.CONFIG = Object.freeze({
    W: 480,
    H: 720,
    MAX_DPR: 2,
    BOSS_EVERY: 5,
    STORAGE: {
      high: 'starRaider.highScore',
      muted: 'starRaider.muted'
    },
    PLAYER: Object.freeze({
      speed: 340,
      hitR: 7,
      startLives: 3,
      maxLives: 5,
      startBombs: 2,
      maxBombs: 5,
      startPower: 1,
      maxPower: 5,
      invulnTime: 2.6,
      shieldTime: 7,
      fireBase: 0.125,
      fireMin: 0.078,
      bulletSpeed: 860,
      bulletDamage: 1
    }),
    COLORS: Object.freeze({
      cyan: '#67e8f9',
      cyanDeep: '#22d3ee',
      violet: '#a78bfa',
      pink: '#f472b6',
      amber: '#fbbf24',
      green: '#6ee7b7',
      white: '#f8fafc'
    })
  });
})();
