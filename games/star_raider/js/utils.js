/* 小工具函数 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const TAU = Math.PI * 2;

  const utils = {
    TAU,
    clamp(v, a, b) {
      return v < a ? a : v > b ? b : v;
    },
    lerp(a, b, t) {
      return a + (b - a) * t;
    },
    rand(a, b) {
      if (b === undefined) {
        b = a;
        a = 0;
      }
      return a + Math.random() * (b - a);
    },
    randInt(a, b) {
      return Math.floor(a + Math.random() * (b - a + 1));
    },
    chance(p) {
      return Math.random() < p;
    },
    pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    },
    dist2(ax, ay, bx, by) {
      const dx = ax - bx;
      const dy = ay - by;
      return dx * dx + dy * dy;
    },
    angle(ax, ay, bx, by) {
      return Math.atan2(by - ay, bx - ax);
    },
    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },
    easeInOutSine(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    },
    formatScore(n) {
      return String(Math.max(0, Math.floor(n))).padStart(6, '0');
    },
    roundRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    },
    storageGet(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : raw;
      } catch (err) {
        return fallback;
      }
    },
    storageSet(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch (err) {
        /* file:// 或隐私模式下可能不可用，忽略即可 */
      }
    },
    now() {
      return typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
  };

  SR.utils = utils;
})();
