'use strict';
/*
 * ascii-survival —— 纯游戏逻辑层（不依赖 DOM，Node 可直接 require 做自动化测试）
 *
 * 符号：'#' = 墙  '.' = 空地  '@' = 玩家  'g' = 怪物
 *
 * 回合流程（玩家每按一次方向键 = 1 回合，固定执行顺序，避免同回合判定不一致）：
 *   1) 玩家尝试移动 1 格；目标格是墙则原地不动（回合照样消耗，防止原地挂机无敌）。
 *   2) 若玩家目标格上是怪物 → 接触判定：
 *        护盾就绪 → 双方交换位置、怪物掉头、护盾进入冷却，且本回合怪物不再移动；
 *        冷却中   → 游戏结束。
 *   3) 只有玩家“成功移动”会计步：步数 +1，护盾冷却 -1（撞墙不计步、不回充护盾）。
 *   4) 怪物按当前速度走 N 格，逐格判定：
 *        下一格是墙   → 随机改走一个可通行方向（只有被挡才变向，平时保持直线）；
 *        下一格是玩家 → 接触判定：护盾就绪则怪物不进入玩家格、原地掉头并结束本回合移动；
 *                       冷却中 → 游戏结束。
 *   5) 因为逐格判定，怪物不可能一跃跨过玩家。
 *
 * 主动变向：以"步"为单位的节奏——怪物半场开始时**提前规划本回合逐格路径**，
 * dirTimer 每 3~8 步倒数归零，归零的那一步直接改走随机新方向（优先侧向、不即时 180°，
 * 只挑可通行方向）；同一回合内可以变向多次，撞墙即时反弹也计入规划。
 * 玩家因此无法靠"回合边界"预测怪物的转向点。
 *
 * 难度曲线：怪物速度 = 2 + floor(回合数 / SPEED_RAMP)，**无上限**——速度越高每回合
 * 走的格数越多（渲染层按总时长预算分批播放，逻辑不受影响）。
 * 地图尺寸：MAP_SIZES 四档（特小/小/中/大），默认"特小"，标题与结算画面按 1~4 切换。
 */

const CFG = {
  SPEED_START: 2,            // 怪物初始每回合移动格数（高于玩家的 1）
  SPEED_RAMP: 20,            // 每多少回合怪物速度 +1
  SHIELD_CD: 14,             // 护盾冷却：需玩家成功移动的格数
  M_DIR_MIN: 3,              // 怪物主动变向：最小间隔（步数）
  M_DIR_MAX: 8,              // 怪物主动变向：最大间隔（步数）
};

/* 地图尺寸预设（W/H 含外墙）；obstacles = 随机障碍小块数量，spawnDist = 玩家↔怪物最小出生距离 */
const MAP_SIZES = [
  { key: 'tiny',   name: '特小', W: 20, H: 12, obstacles: 5,  spawnDist: 7 },
  { key: 'small',  name: '小',   W: 32, H: 18, obstacles: 16, spawnDist: 8 },
  { key: 'medium', name: '中',   W: 42, H: 20, obstacles: 26, spawnDist: 10 },
  { key: 'large',  name: '大',   W: 52, H: 24, obstacles: 40, spawnDist: 12 },
];
const DEFAULT_SIZE_KEY = 'tiny';
function sizeByKey(key) { return MAP_SIZES.find(s => s.key === key) || MAP_SIZES[0]; }

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // 东 南 西 北
const revDir = d => (d + 2) % 4;

/* 可复现随机数（自动化测试与 ?seed= 参数使用） */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 怪物速度：初始 SPEED_START，每过 SPEED_RAMP 回合 +1，无上限 */
function monsterSpeed(g) {
  return CFG.SPEED_START + Math.floor(g.turn / CFG.SPEED_RAMP);
}

function collectOpen(map) {
  const open = [];
  for (let y = 0; y < map.length; y++)
    for (let x = 0; x < map[y].length; x++)
      if (map[y][x] === '.') open.push({ x, y });
  return open;
}

function emptyRoom(size) {
  const map = [];
  for (let y = 0; y < size.H; y++) {
    const row = [];
    for (let x = 0; x < size.W; x++)
      row.push((x === 0 || y === 0 || x === size.W - 1 || y === size.H - 1) ? '#' : '.');
    map.push(row);
  }
  return { map, open: collectOpen(map) };
}

/* —— 地图生成：封闭房间 + 少量随机障碍小块，BFS 校验全联通 —— */
function genMap(rng, size) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const map = [];
    for (let y = 0; y < size.H; y++) {
      const row = [];
      for (let x = 0; x < size.W; x++)
        row.push((x === 0 || y === 0 || x === size.W - 1 || y === size.H - 1) ? '#' : '.');
      map.push(row);
    }
    // 撒障碍：1x1 / 1x2 / 2x1 / 2x2 的小块，只覆盖空地
    const blobs = [[1, 1], [1, 2], [2, 1], [2, 2]];
    let placed = 0, guard = 0;
    while (placed < size.obstacles && guard++ < 1000) {
      const [bw, bh] = blobs[Math.floor(rng() * blobs.length)];
      const bx = 1 + Math.floor(rng() * (size.W - 2 - (bw - 1)));
      const by = 1 + Math.floor(rng() * (size.H - 2 - (bh - 1)));
      let ok = true;
      for (let y = by; y < by + bh && ok; y++)
        for (let x = bx; x < bx + bw && ok; x++)
          if (map[y][x] !== '.') ok = false;
      if (!ok) continue;
      for (let y = by; y < by + bh; y++)
        for (let x = bx; x < bx + bw; x++) map[y][x] = '#';
      placed++;
    }
    const open = collectOpen(map);
    if (!open.length) continue;
    // 连通性：从任意空格 BFS，必须覆盖所有空格（防止玩家出生孤岛、怪物被困死）
    const seen = new Set([open[0].y * size.W + open[0].x]);
    const q = [open[0]];
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi];
      for (const [dx, dy] of DIRS) {
        const nx = c.x + dx, ny = c.y + dy, k = ny * size.W + nx;
        if (!seen.has(k) && map[ny] && map[ny][nx] === '.') { seen.add(k); q.push({ x: nx, y: ny }); }
      }
    }
    if (seen.size === open.length) return { map, open };
  }
  return emptyRoom(size); // 兜底：纯空房间（重试 300 次全失败理论上不会发生）
}

/* 出生点：从空格里随机挑，与参照点保持最小曼哈顿距离；多次尝试后放宽兜底 */
function pickSpawn(open, rng, minDist, ref) {
  let best = null;
  for (let i = 0; i < 400; i++) {
    const c = open[Math.floor(rng() * open.length)];
    if (!ref) return { x: c.x, y: c.y };
    const d = Math.abs(c.x - ref.x) + Math.abs(c.y - ref.y);
    if (d >= minDist) return { x: c.x, y: c.y, dir: Math.floor(rng() * 4) };
    if (!best || d > best.d) best = { x: c.x, y: c.y, d, dir: Math.floor(rng() * 4) };
  }
  return best;
}

/*
 * 创建一局游戏。opts（均为测试注入用）：
 *   rng     随机函数（默认 Math.random）
 *   size    地图尺寸预设（默认"小"）；opts.map 显式给出时忽略
 *   map     字符串数组形式的地图（覆盖随机生成）
 *   player / monster  显式出生坐标 {x, y} / {x, y, dir}
 */
function createGame(opts = {}) {
  const rng = opts.rng || Math.random;
  const size = opts.size || sizeByKey(DEFAULT_SIZE_KEY);
  let map, open;
  if (opts.map) {
    map = opts.map.map(r => r.split(''));
    open = collectOpen(map);
  } else {
    const gen = genMap(rng, size);
    map = gen.map; open = gen.open;
  }
  if (!open.length) throw new Error('地图没有可通行区域');
  const player = opts.player ? { ...opts.player } : pickSpawn(open, rng, 0, null);
  const monster = opts.monster
    ? { ...opts.monster, dir: (opts.monster.dir !== undefined ? opts.monster.dir : Math.floor(rng() * 4)) }
    : pickSpawn(open, rng, size.spawnDist, player);
  if (map[player.y][player.x] === '#') throw new Error('玩家出生点在墙里');
  if (map[monster.y][monster.x] === '#') throw new Error('怪物出生点在墙里');
  // 主动变向节奏：以步倒数，倒数到 0 的那一步自主换向（单位 = 怪物步数）
  monster.dirTimer = CFG.M_DIR_MIN + Math.floor(rng() * (CFG.M_DIR_MAX - CFG.M_DIR_MIN + 1));
  return {
    map, player, monster,
    turn: 0,                 // 已消耗回合数（每次按键 +1）
    moves: 0,                // 成功移动步数（撞墙不计）
    shieldCd: 0,             // 护盾冷却剩余步数；0 = 就绪
    status: 'playing',       // 'playing' | 'dead'
    events: [],              // 'shield' | 'shieldReady' | 'death'（UI 消费后清空）
    rng,
  };
}

/* 接触判定：护盾就绪 → 抵挡；冷却中 → 死亡。byPlayer = 玩家主动撞上怪物 */
function touch(g, byPlayer) {
  const m = g.monster;
  if (g.shieldCd === 0) {
    g.shieldCd = CFG.SHIELD_CD;
    g.events.push('shield');
    if (byPlayer) {
      // 玩家撞进怪物：双方交换位置，怪物掉头，本回合怪物不再移动
      const p = g.player, px = p.x, py = p.y;
      p.x = m.x; p.y = m.y;
      m.x = px; m.y = py;
      m.dir = revDir(m.dir);
      m.skip = true;
    } else {
      // 怪物走向玩家：不进入玩家格，原地掉头并结束本回合移动
      m.dir = revDir(m.dir);
      m.stepsLeft = 0;
    }
  } else {
    g.status = 'dead';
    g.events.push('death');
  }
}

/* 回合的“玩家半场”：移动 / 撞墙 / 计步 / 护盾冷却 */
function turnPlayer(g, dx, dy) {
  if (g.status !== 'playing') return;
  const p = g.player;
  const nx = p.x + dx, ny = p.y + dy;
  let moved = false, tickCd = false;
  if (g.map[ny] && g.map[ny][nx] !== undefined && g.map[ny][nx] !== '#') {
    if (nx === g.monster.x && ny === g.monster.y) {
      touch(g, true);
      if (g.status === 'playing') {
        moved = true;    // 交换位置也算成功移动；但触发接触的这一步不回充护盾
      }
    } else {
      p.x = nx; p.y = ny;
      moved = true;
      tickCd = true;
    }
  }
  g.turn++;
  if (moved) g.moves++;
  if (tickCd && g.status === 'playing') {
    if (g.shieldCd > 0) {
      g.shieldCd--;
      if (g.shieldCd === 0) g.events.push('shieldReady');
    }
  }
  if (g.status === 'playing') startMonsterPhase(g);
}

/* 回合的“怪物半场”第一步：提前规划本回合的逐格路径（每步用哪个方向）
 * dirTimer 以步倒数，归零的那一步改为主动换向的新方向并重置节奏（一回合内可变向多次）；
 * 撞墙即时反弹也在规划时解决。执行阶段只按计划逐格走，碰撞判定仍在逐格执行时做。 */
function startMonsterPhase(g) {
  const m = g.monster;
  if (m.skip) { m.stepsLeft = 0; m.skip = false; return; } // 护盾刚触发：不算行动，节奏不动
  const S = monsterSpeed(g);
  const plan = [];
  let x = m.x, y = m.y, dir = m.dir, timer = m.dirTimer;
  for (let i = 0; i < S; i++) {
    if (timer <= 0) {                                      // 节奏到点：这一步就是变向步
      dir = pickWanderDir(g, x, y, dir);
      timer = CFG.M_DIR_MIN + Math.floor(g.rng() * (CFG.M_DIR_MAX - CFG.M_DIR_MIN + 1));
    }
    let tx = x + DIRS[dir][0], ty = y + DIRS[dir][1];
    if (!g.map[ty] || g.map[ty][tx] === '#') {             // 被墙挡住 → 当场反弹重算
      dir = pickBounceDir(g, x, y);                // 被墙挡才变向（反弹在规划时即解决）
      if (dir < 0) break;                                  // 被封死（理论不会发生）
      tx = x + DIRS[dir][0]; ty = y + DIRS[dir][1];
      if (!g.map[ty] || g.map[ty][tx] === '#') break;
    }
    plan.push(dir);
    x = tx; y = ty;
    timer--;
  }
  m.plan = plan;
  m.stepsLeft = plan.length;
  m.dirTimer = timer;                                      // 剩余节奏带入下一回合
}

/* 怪物走“一格”：按规划路径前进，逐格做碰撞判定（供 UI 逐格动画或 step() 循环调用） */
function monsterStepCell(g) {
  if (g.status !== 'playing') return;
  const m = g.monster;
  if (m.stepsLeft <= 0) return;
  const idx = (m.plan ? m.plan.length : 0) - m.stepsLeft;
  const dir = m.plan && m.plan[idx] !== undefined ? m.plan[idx] : null;
  if (dir === null) { m.stepsLeft = 0; return; }           // 无计划（理论不会发生）
  const tx = m.x + DIRS[dir][0], ty = m.y + DIRS[dir][1];
  if (!g.map[ty] || g.map[ty][tx] === '#') { m.stepsLeft = 0; return; } // 理论不会发生
  if (tx === g.player.x && ty === g.player.y) {
    touch(g, false);                                       // 逐格碰撞：不进入玩家格
    return;
  }
  m.x = tx; m.y = ty; m.dir = dir; m.stepsLeft--;
}

/* 撞墙时随机挑一个可通行方向；找不到返回 -1（由规划层放弃该步） */
function pickBounceDir(g, x, y) {
  const ds = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(g.rng() * (i + 1));
    [ds[i], ds[j]] = [ds[j], ds[i]];
  }
  for (const d of ds) {
    const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    if (g.map[ny] && g.map[ny][nx] && g.map[ny][nx] !== '#') return d;
  }
  return -1;
}

/* 主动换向：只挑可通行方向；优先侧向（不同且不 180° 回头），实在没有只能回头 */
function pickWanderDir(g, x, y, fromDir) {
  const passable = [];
  for (const d of [0, 1, 2, 3]) {
    const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    if (g.map[ny] && g.map[ny][nx] && g.map[ny][nx] !== '#') passable.push(d);
  }
  if (!passable.length) return fromDir;                     // 被封死（理论不会发生）
  let opts = passable.filter(d => d !== fromDir && d !== revDir(fromDir));
  if (!opts.length) opts = passable.filter(d => d !== fromDir); // 只能回头
  if (!opts.length) opts = passable;
  return opts[Math.floor(g.rng() * opts.length)];
}

/* 完整一回合（自动化测试与无动画场景用）：玩家半场 + 怪物整场 */
function step(g, dx, dy) {
  turnPlayer(g, dx, dy);
  const planLen = g.monster.plan ? g.monster.plan.length : 0;
  let guard = 0;
  while (g.status === 'playing' && g.monster.stepsLeft > 0 && guard++ < planLen + 8) {
    monsterStepCell(g);   // 速度无上限 → plan 长度无上限，guard 随之放开
  }
}

const gameExports = {
  CFG, MAP_SIZES, DEFAULT_SIZE_KEY, sizeByKey, DIRS, revDir, mulberry32,
  monsterSpeed, collectOpen, genMap, createGame,
  touch, turnPlayer, startMonsterPhase, monsterStepCell, pickBounceDir, pickWanderDir, step,
};
if (typeof module !== 'undefined' && module.exports) module.exports = gameExports;
