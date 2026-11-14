// 输入管理：键盘 + 鼠标双模式瞄准
import { CONST } from './config.js';
import { clamp, damp, lerp } from './utils.js';

const MOVE_KEYS = {
  x: { left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] },
  y: { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'] },
};
const ACTIONS = {
  fire: ['Space', 'KeyJ'],
  missile: ['KeyX', 'KeyK'],
  bomb: ['KeyZ', 'KeyL'],
  boost: ['ShiftLeft', 'ShiftRight'],
  brake: ['ControlLeft', 'ControlRight'],
  pause: ['Escape', 'KeyP'],
  confirm: ['Enter'],
};

class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0.2 };
    this.mode = 'keys';
    this.target = { x: 0, y: 14 };
    this.fireHeld = false;
    this.enabled = true;
  }

  init() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (MOVE_KEYS.x.left.includes(e.code) || MOVE_KEYS.x.right.includes(e.code) || MOVE_KEYS.y.up.includes(e.code) || MOVE_KEYS.y.down.includes(e.code)) this.mode = 'keys';
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mode = 'mouse';
    });
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.fireHeld = true;
      if (e.button === 2) this.pressed.add('__m_missile');
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.fireHeld = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => { this.keys.clear(); this.fireHeld = false; });
  }

  _has(list) { return list.some((k) => this.keys.has(k)); }
  isDown(action) {
    if (action === 'fire') return this.fireHeld || this._has(ACTIONS.fire);
    return this._has(ACTIONS[action] || []);
  }
  wasPressed(action) {
    if (action === 'missile') return ACTIONS.missile.some((k) => this.pressed.has(k)) || this.pressed.has('__m_missile');
    return (ACTIONS[action] || []).some((k) => this.pressed.has(k));
  }
  endFrame() { this.pressed.clear(); }

  update(dt) {
    const B = CONST.BOUNDS;
    const sp = 36;
    let dx = 0, dy = 0;
    if (this._has(MOVE_KEYS.x.left)) dx -= 1;
    if (this._has(MOVE_KEYS.x.right)) dx += 1;
    if (this._has(MOVE_KEYS.y.up)) dy += 1;
    if (this._has(MOVE_KEYS.y.down)) dy -= 1;
    if (dx || dy) {
      this.mode = 'keys';
      this.target.x += dx * sp * dt;
      this.target.y += dy * sp * dt;
    } else if (this.mode === 'mouse') {
      this.target.x = damp(this.target.x, this.mouse.x * B.x, 13, dt);
      const my = lerp(B.yMin, B.yMax, clamp((this.mouse.y + 0.55) / 1.35, 0, 1));
      this.target.y = damp(this.target.y, my, 13, dt);
    }
    this.target.x = clamp(this.target.x, -B.x, B.x);
    this.target.y = clamp(this.target.y, B.yMin, B.yMax);
  }
}

export const Input = new InputManager();
