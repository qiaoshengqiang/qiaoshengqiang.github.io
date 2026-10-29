'use strict';
/* ui.js —— 渲染 / 键盘 / 怪物逐格动画 / 消息提示。游戏逻辑全部在 game.js。
 * 也可以用 location 加 ?seed=123 获得可复现的一局（调试用）。 */

const FONT_PX = 20;
const FONT = FONT_PX + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const CH = 26;   // 行高
const PAD = 14;  // 画布内边距
const HUD_ROWS = 2, MSG_ROWS = 1, HELP_ROWS = 1;

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
ctx.font = FONT;
const CW = Math.max(10, Math.ceil(ctx.measureText('@').width));
const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
cv.style.imageRendering = 'pixelated';

let sizeIdx = 0;                 // 房间大小档位（1/2/3 键切换）
let cur = MAP_SIZES[sizeIdx];    // 当前尺寸预设
let cssW = 0, cssH = 0;

/* 按当前尺寸重设画布大小 */
function fitCanvas() {
  cssW = PAD * 2 + CW * cur.W;
  cssH = PAD * 2 + CH * (HUD_ROWS + cur.H + MSG_ROWS + HELP_ROWS);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
}

const COL = {
  bg: '#0a0d07', floor: '#1d2b1a', wall: '#39603a',
  playerOn: '#9fe8ff', playerOff: '#4b7d94', monster: '#ff5f5f',
  text: '#9adf6a', dim: '#597f4a', warn: '#ffd76a', red: '#ff7b6b',
};

let g = null;                 // 当前游戏状态（window.G 同步暴露，便于调试/测试）
let runStart = null;          // 首次移动的时间戳（生存时间从这里起算）
let endedAt = null;           // 死亡时间戳（生存时间定格）
let deathAt = 0;              // 死亡红屏闪烁起点
let flashShieldUntil = 0;     // 护盾抵挡时的青色边框闪光
let msgs = [];                // {text, until}
let bufKey = null;            // 动画期间按键缓冲（只保留最后一次）
let phase = 'idle';           // 'idle' | 'anim'
let myGen = 0;                // 局代号，动画定时器据此作废
let maxSpeedSeen = CFG.SPEED_START;
let bestRecorded = true;      // 是否已计入 best
let best = { turns: 0, time: 0, speed: CFG.SPEED_START };

const seedParam = new URLSearchParams(location.search).get('seed');

function newGame() {
  myGen++;
  cur = MAP_SIZES[sizeIdx];
  fitCanvas();
  g = createGame({ rng: seedParam !== null ? mulberry32(parseInt(seedParam, 10) || 1) : Math.random, size: cur });
  runStart = null; endedAt = null; deathAt = 0; flashShieldUntil = 0;
  msgs = []; bufKey = null; phase = 'idle';
  maxSpeedSeen = monsterSpeed(g);
  bestRecorded = false;
  window.G = g; // 调试钩子
}

function timeMs() { return runStart === null ? 0 : ((endedAt !== null ? endedAt : performance.now()) - runStart); }
function fmtT(ms) { return (ms / 1000).toFixed(1); }

/* —— 输入 —— */
const KEYMAP = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};
window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); newGame(); return; }
  if (!g) return;
  // 1~4：在标题或结算画面选房间大小并立即开新局（游戏中不响应，避免误丢回合）
  const n = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
  if (n !== undefined && (g.status !== 'playing' || runStart === null)) {
    e.preventDefault();
    sizeIdx = n;
    newGame();
    pushMsg(`房间：${cur.name} ${cur.W - 2}×${cur.H - 2}（1~4 切换）`, 2400);
    return;
  }
  if (g.status === 'dead') {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); newGame(); }
    return; // 死亡后方向键无效
  }
  const d = KEYMAP[e.key];
  if (!d) return;
  e.preventDefault();            // 防方向键滚动页面
  bufKey = d;
  if (phase === 'idle') runTurn();
});

function runTurn() {
  const gen0 = myGen;
  const d = bufKey; bufKey = null;
  if (!d) { phase = 'idle'; return; }
  if (runStart === null) { runStart = performance.now(); } // 首次移动才开始计时
  turnPlayer(g, d[0], d[1]);
  if (g.status === 'playing') maxSpeedSeen = Math.max(maxSpeedSeen, monsterSpeed(g));
  phase = 'anim';
  pumpAnim(gen0);
}

/* 怪物多格移动的逐格动画：判定仍逐格发生，但渲染按预算分批——
 * 每回合动画总时长约 min(45ms × 格数, ANIM_BUDGET)，步数很多时一次 tick 合并多格，
 * 避免高速度下逐格 setTimeout 卡住输入缓冲。低速（≤8 格）与旧版逐格 45ms 完全一致。
 * 动画期间按键进缓冲，动画结束立刻续行。 */
const ANIM_BUDGET = 360;   // 每回合怪物动画总时长预算（ms）
const MAX_ANIM_TICKS = 24; // 动画最多拆多少个 tick（tick 内一次走多格）

function pumpAnim(gen0, cpt, ms) {
  if (gen0 !== myGen) return;
  if (g.status !== 'playing' || g.monster.stepsLeft <= 0) {
    phase = 'idle';
    if (bufKey && g.status === 'playing') runTurn();
    return;
  }
  if (cpt === undefined) {                  // 回合动画开始：按本回合步数规划批次
    const S = g.monster.stepsLeft;
    const ticks = Math.min(S, MAX_ANIM_TICKS);
    ms = Math.max(14, Math.min(45, Math.round(ANIM_BUDGET / ticks)));
    cpt = Math.ceil(S / ticks);
  }
  setTimeout(() => {
    if (gen0 !== myGen) return;
    let n = cpt;                            // 本批最多走 cpt 格（内部仍是逐格判定）
    while (n-- > 0 && g.status === 'playing' && g.monster.stepsLeft > 0) monsterStepCell(g);
    pumpAnim(gen0, cpt, ms);
  }, ms);
}

function pushMsg(text, ms) { msgs.push({ text, until: performance.now() + ms }); if (msgs.length > 4) msgs.shift(); }

/* —— 渲染 —— */
function drawText(row, col, text, color, size) {
  ctx.fillStyle = color;
  ctx.font = (size || FONT_PX) + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, PAD + col * CW, PAD + row * CH + Math.floor((CH - (size || FONT_PX)) / 2.4));
}
function drawCenter(row, text, color, size) {
  ctx.fillStyle = color;
  ctx.font = (size || FONT_PX) + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, cssW / 2, PAD + row * CH + Math.floor((CH - (size || FONT_PX)) / 2.4));
  ctx.textAlign = 'left';
}

/* 自适应字号：文本比画布宽时按 1px 步进缩小到刚好放下（最低 10px），窄画布防截断 */
function fitSize(text, maxW) {
  let size = FONT_PX;
  while (size > 10) {
    ctx.font = size + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    if (ctx.measureText(text).width <= maxW) break;
    size--;
  }
  return size;
}
function drawTextFit(row, text, color) { drawText(row, 0, text, color, fitSize(text, cssW - PAD * 2)); }
function drawCenterFit(row, text, color) { drawCenter(row, text, color, fitSize(text, cssW - PAD * 2)); }

function shieldBar(cd) {
  if (cd === 0) return '就绪 [██████████]';
  const filled = Math.round((CFG.SHIELD_CD - cd) / CFG.SHIELD_CD * 10);
  return `冷却 ${cd}/${CFG.SHIELD_CD} [` + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';
}

function render() {
  requestAnimationFrame(render);
  if (!g) return;
  const now = performance.now();

  // 事件 → 消息/特效
  for (const ev of g.events) {
    if (ev === 'shield') { flashShieldUntil = now + 280; pushMsg('护盾抵挡！', 1400); }
    else if (ev === 'shieldReady') pushMsg('护盾已恢复', 1200);
    else if (ev === 'death') pushMsg('被抓住了！', 999999);
  }
  g.events.length = 0;

  // 最佳成绩（以回合数为排名，时间只作展示）
  if (g.status === 'dead' && !bestRecorded) {
    bestRecorded = true;
    if (endedAt === null) endedAt = now;
    deathAt = now;
    if (g.turn > best.turns) best = { turns: g.turn, time: timeMs(), speed: maxSpeedSeen };
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // HUD（窄画布自动缩字号防截断）
  const t = timeMs();
  drawTextFit(0, `生存 ${fmtT(t)}s   回合 ${g.turn}   步 ${g.moves}   最佳 ${best.turns}`, COL.text);
  drawTextFit(1, `怪物速度 x${monsterSpeed(g)}   护盾 ${shieldBar(g.shieldCd)}`,
    g.shieldCd === 0 ? COL.playerOn : COL.warn);

  // 地图
  const mapTop = HUD_ROWS;
  const m = g.monster;
  for (let y = 0; y < cur.H; y++) {
    for (let x = 0; x < cur.W; x++) {
      const px = PAD + x * CW, py = PAD + (mapTop + y) * CH;
      if (x === g.player.x && y === g.player.y) {
        if (g.shieldCd === 0) {  // 护盾就绪：脚下微光 + 亮色
          ctx.fillStyle = 'rgba(120,220,255,0.13)';
          ctx.fillRect(px - 2, py - 1, CW + 4, CH);
        }
        drawText(mapTop + y, x, '@', g.shieldCd === 0 ? COL.playerOn : COL.playerOff);
      } else if (x === m.x && y === m.y) {
        drawText(mapTop + y, x, 'g', COL.monster);
      } else if (g.map[y][x] === '#') {
        drawText(mapTop + y, x, '#', COL.wall);
      } else {
        drawText(mapTop + y, x, '.', COL.floor);
      }
    }
  }
  if (g.shieldCd === 0) {  // 护盾就绪下划线提示
    const px = PAD + g.player.x * CW, py = PAD + (mapTop + g.player.y) * CH;
    ctx.fillStyle = 'rgba(159,232,255,0.55)';
    ctx.fillRect(px, py + CH - 5, CW, 2);
  }

  // 消息行（显示最新一条未过期）
  const live = msgs.filter(mm => now < mm.until);
  if (live.length) drawTextFit(mapTop + cur.H, '· ' + live[live.length - 1].text, COL.warn);

  drawTextFit(mapTop + cur.H + MSG_ROWS, '方向键 / WASD 移动 · R 重新开始', COL.dim);

  // 护盾触发：全屏青色描边闪光
  if (now < flashShieldUntil) {
    ctx.strokeStyle = 'rgba(159,232,255,' + ((flashShieldUntil - now) / 280).toFixed(2) + ')';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, cssW - 3, cssH - 3);
  }

  // 开始遮罩
  if (runStart === null && g.status === 'playing') {
    ctx.fillStyle = 'rgba(5,8,4,0.72)';
    ctx.fillRect(0, 0, cssW, cssH);
    drawCenter(6, 'ASCII 逃生', COL.text, 28);
    drawCenterFit(8, '躲开高速移动的怪物 g —— 它碰到你时，', COL.dim);
    drawCenterFit(9, '护盾若就绪会自动抵挡并让它掉头', COL.dim);
    drawCenterFit(11, '按 方向键 / WASD 开始移动', COL.playerOn);
    drawCenterFit(12, `1~4 房间大小（当前 ${cur.name} ${cur.W - 2}×${cur.H - 2}）· R 重开`, COL.dim);
    drawCenterFit(13, '撞墙也消耗回合，且不会回充护盾', COL.dim);
  }

  // 结算遮罩
  if (g.status === 'dead') {
    const a = Math.max(0, 1 - (now - deathAt) / 400) * 0.5;
    if (a > 0) { ctx.fillStyle = `rgba(150,15,10,${a})`; ctx.fillRect(0, 0, cssW, cssH); }
    ctx.fillStyle = 'rgba(5,8,4,0.78)';
    ctx.fillRect(0, 0, cssW, cssH);
    drawCenter(6, '被 抓 住 了', COL.red, 28);
    drawCenterFit(9, `生存 ${g.turn} 回合 · ${g.moves} 步 · ${fmtT(timeMs())}s`, COL.text);
    drawCenterFit(10, `本局最高怪物速度 x${maxSpeedSeen}`, COL.dim);
    drawCenterFit(12, `历史最佳 ${best.turns} 回合 / ${fmtT(best.time)}s`, COL.warn);
    drawCenterFit(14, `1~4 换房间大小（当前 ${cur.name}）· R 或 回车 重新开始`, COL.playerOn);
  }
}

newGame();
render();
