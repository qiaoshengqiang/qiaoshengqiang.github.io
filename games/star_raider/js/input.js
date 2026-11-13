/* 键盘 + 鼠标/触屏输入 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const CFG = SR.CONFIG;
  const U = SR.utils;

  const ACTION_KEYS = {
    Space: 'bomb',
    KeyP: 'pause',
    Escape: 'pause',
    KeyM: 'mute',
    Enter: 'confirm'
  };

  class Input {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.keys = new Set();
      this.pointer = { x: CFG.W / 2, y: CFG.H - 120, active: false, down: false };
      this.mode = 'keyboard';
      this._bind();
    }

    _bind() {
      const PLAY_KEYS = new Set([
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'KeyA',
        'KeyD',
        'KeyW',
        'KeyS',
        'Space'
      ]);

      window.addEventListener('keydown', (e) => {
        const target = e.target;
        const onControl =
          target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        if (onControl && (e.code === 'Space' || e.code === 'Enter')) return;

        if (PLAY_KEYS.has(e.code)) e.preventDefault();

        this.keys.add(e.code);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
          this.mode = 'keyboard';
          this.pointer.active = false;
        }

        if (!e.repeat) {
          const action = ACTION_KEYS[e.code];
          if (action) {
            e.preventDefault();
            if (this.game && this.game.onAction) this.game.onAction(action);
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });

      window.addEventListener('blur', () => {
        this.keys.clear();
        this.pointer.down = false;
      });

      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        this.pointer.down = true;
        this.pointer.active = true;
        this.mode = 'pointer';
        this._setPointer(e);
        if (this.canvas.setPointerCapture) {
          try {
            this.canvas.setPointerCapture(e.pointerId);
          } catch (err) {
            /* 忽略 */
          }
        }
        e.preventDefault();
      });

      this.canvas.addEventListener('pointermove', (e) => {
        const isMouse = e.pointerType === 'mouse' || e.pointerType === 'pen';
        if (isMouse || this.pointer.down) {
          this.pointer.active = true;
          this.mode = 'pointer';
          this._setPointer(e);
        }
      });

      const release = (e) => {
        this.pointer.down = false;
        if (e && e.pointerType && e.pointerType !== 'mouse') {
          this.pointer.active = false;
        }
      };
      this.canvas.addEventListener('pointerup', release);
      this.canvas.addEventListener('pointercancel', release);
      window.addEventListener('pointerup', () => {
        this.pointer.down = false;
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
    }

    _setPointer(e) {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = ((e.clientX - r.left) / r.width) * CFG.W;
      const y = ((e.clientY - r.top) / r.height) * CFG.H;
      // 触屏时把飞船抬到手指上方，避免手指挡住飞船
      const lift = e.pointerType === 'touch' ? 58 : 0;
      this.pointer.x = U.clamp(x, 18, CFG.W - 18);
      this.pointer.y = U.clamp(y - lift, 64, CFG.H - 22);
    }

    getAxis() {
      const k = this.keys;
      const x =
        (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) -
        (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
      const y =
        (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) -
        (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
      return { x, y };
    }
  }

  SR.Input = Input;
})();
