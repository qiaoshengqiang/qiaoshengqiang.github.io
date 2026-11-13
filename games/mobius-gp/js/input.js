const DRIVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Space',
]);

const GAME_KEYS = new Set(['KeyC', 'KeyR', 'Escape']);

export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = {
      gas: false, brake: false, left: false, right: false,
      nitro: false, drift: false,
    };
    this.enabled = false;
    this.actions = new Set();
    this.padPrev = {};
    this.gamepad = null;
    this.isTouch = false;
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (this.enabled && DRIVE_KEYS.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (GAME_KEYS.has(e.code) && this.enabled) {
        this.actions.forEach((fn) => fn(e.code, e));
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (this.enabled && DRIVE_KEYS.has(e.code)) e.preventDefault();
    }, { passive: false });

    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.keys.clear();
    });

    this.isTouch = (navigator.maxTouchPoints || 0) > 0 || ('ontouchstart' in window);
    if (this.isTouch) document.body.classList.add('touch-device');

    document.querySelectorAll('[data-touch]').forEach((btn) => {
      const action = btn.dataset.touch;
      const press = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.touch[action] = true;
        try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      };
      const release = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.touch[action] = false;
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad = e.gamepad;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
    });
  }

  onAction(fn) {
    this.actions.add(fn);
    return () => this.actions.delete(fn);
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) {
      this.touch.gas = this.touch.brake = false;
      this.touch.left = this.touch.right = false;
      this.touch.nitro = this.touch.drift = false;
      document.querySelectorAll('.touch-controls button').forEach((b) => b.classList.remove('pressed'));
    }
  }

  _pollGamepad() {
    if (!navigator.getGamepads) return null;
    let pad = this.gamepad;
    if (!pad) {
      const pads = navigator.getGamepads();
      pad = Array.from(pads).find((p) => p && p.connected) || null;
      if (pad) this.gamepad = pad;
    }
    if (!pad) return null;
    const buttons = pad.buttons;
    const startPressed = !!buttons[9]?.pressed;
    if (startPressed && !this.padPrev.start && this.enabled) {
      this.actions.forEach((fn) => fn('Escape'));
    }
    if (buttons[8] && buttons[8].pressed && !this.padPrev.select) {
      // view change on select / back
      if (this.enabled) this.actions.forEach((fn) => fn('KeyC'));
    }
    this.padPrev.start = startPressed;
    this.padPrev.select = !!buttons[8]?.pressed;
    const ax = pad.axes[0] || 0;
    const dead = 0.13;
    const steer = Math.abs(ax) < dead ? 0 : Math.sign(ax) * ((Math.abs(ax) - dead) / (1 - dead));
    return {
      throttle: buttons[7]?.value || (buttons[7]?.pressed ? 1 : 0),
      brake: buttons[6]?.value || (buttons[6]?.pressed ? 1 : 0),
      nitro: !!buttons[0]?.pressed,
      drift: !!buttons[2]?.pressed,
      steer,
      pause: buttons[9]?.pressed,
    };
  }

  getState() {
    const k = this.keys;
    const t = this.touch;
    const gp = this.enabled ? this._pollGamepad() : null;

    const keyLeft = k.has('KeyA') || k.has('ArrowLeft');
    const keyRight = k.has('KeyD') || k.has('ArrowRight');
    const keyGas = k.has('KeyW') || k.has('ArrowUp');
    const keyBrake = k.has('KeyS') || k.has('ArrowDown');
    const keyNitro = k.has('ShiftLeft') || k.has('ShiftRight');
    const keyDrift = k.has('Space');

    let steer = (keyRight ? 1 : 0) - (keyLeft ? 1 : 0);
    if (t.right) steer += 1;
    if (t.left) steer -= 1;
    if (gp) steer += gp.steer;
    steer = Math.max(-1, Math.min(1, steer));

    return {
      throttle: Math.max(keyGas ? 1 : 0, t.gas ? 1 : 0, gp?.throttle || 0),
      brake: Math.max(keyBrake ? 1 : 0, t.brake ? 1 : 0, gp?.brake || 0),
      steer,
      nitro: keyNitro || t.nitro || !!gp?.nitro,
      drift: keyDrift || t.drift || !!gp?.drift,
      active: this.enabled,
    };
  }
}
