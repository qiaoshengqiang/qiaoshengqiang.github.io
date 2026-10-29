'use strict';
/* ascii-survival/test.js —— Node 自动化测试：node test.js（失败时退出码非 0） */
const G = require('./game.js');
const CFG = G.CFG;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; failures.push(msg); }
}

/* 独立实现一次 BFS，校验全联通 */
function fullyConnected(map) {
  const open = G.collectOpen(map);
  if (!open.length) return false;
  const W = map[0].length;
  const seen = new Set([open[0].y * W + open[0].x]);
  const q = [open[0]];
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi];
    for (const [dx, dy] of G.DIRS) {
      const nx = c.x + dx, ny = c.y + dy, k = ny * W + nx;
      if (!seen.has(k) && map[ny] && map[ny][nx] === '.') { seen.add(k); q.push({ x: nx, y: ny }); }
    }
  }
  return seen.size === open.length;
}

/* —— 1. 地图生成：三档尺寸 × 各 150 个种子逐局校验 —— */
for (const size of G.MAP_SIZES) {
  for (let s = 0; s < 150; s++) {
    const tag = `${size.key}/seed${s}`;
    const game = G.createGame({ rng: G.mulberry32(s * 7919 + 1), size });
    ok(game.map.length === size.H && game.map[0].length === size.W, `${tag} 尺寸`);
    ok(game.map[game.player.y][game.player.x] === '.', `${tag} 玩家不嵌墙`);
    ok(game.map[game.monster.y][game.monster.x] === '.', `${tag} 怪物不嵌墙`);
    ok(!(game.player.x === game.monster.x && game.player.y === game.monster.y), `${tag} 出生不重叠`);
    const d = Math.abs(game.player.x - game.monster.x) + Math.abs(game.player.y - game.monster.y);
    ok(d >= size.spawnDist, `${tag} 出生距离${d}>=${size.spawnDist}`);
    ok(fullyConnected(game.map), `${tag} 地图全联通`);
    // 防退化：障碍必须真的生成（BFS 修复前这里会静默回退成空房间）
    const wallCount = game.map.flat().filter(ch => ch === '#').length;
    const border2 = 2 * size.W + 2 * size.H - 4;
    ok(wallCount - border2 >= size.obstacles, `${tag} 内部障碍格数${wallCount - border2}`);
    ok(game.monster.dirTimer >= CFG.M_DIR_MIN && game.monster.dirTimer <= CFG.M_DIR_MAX, `${tag} 变向节奏初值`);
  }
}

/* 测试用小地图 */
const room = [
  '##########',
  '#........#',
  '#........#',
  '#........#',
  '##########',
];
const mk = o => G.createGame(Object.assign({ map: room }, o));
function drain(g) { const e = g.events.slice(); g.events.length = 0; return e; }

/* —— 2. 撞墙：不动、耗回合、不计步、不回充护盾 —— */
{
  const g = mk({ player: { x: 1, y: 1 }, monster: { x: 8, y: 3, dir: 0 } });
  g.shieldCd = 3;
  G.step(g, -1, 0);
  ok(g.player.x === 1 && g.player.y === 1, '撞墙不动');
  ok(g.turn === 1, '撞墙消耗回合');
  ok(g.moves === 0, '撞墙不计步');
  ok(g.shieldCd === 3, '撞墙不回充护盾');
}

/* —— 3. 冷却按“成功移动格数”递减，到 0 触发就绪事件（怪物在密封死角，保证确定性） —— */
const roomSealed = [
  '##########',
  '#......#.#',   // (8,1)：四周全是墙的密封小格
  '#......###',
  '#........#',
  '##########',
];
{
  const g = G.createGame({ map: roomSealed, player: { x: 1, y: 1 }, monster: { x: 8, y: 1, dir: 0 } });
  g.shieldCd = 3;
  G.step(g, 1, 0); ok(g.shieldCd === 2 && g.moves === 1, '回充 3→2');
  G.step(g, 1, 0); ok(g.shieldCd === 1 && g.moves === 2, '回充 2→1');
  G.step(g, 1, 0);
  let ev = drain(g);
  ok(g.shieldCd === 0 && ev.includes('shieldReady'), '回充 1→0 并发出就绪事件');
  G.step(g, 1, 0); drain(g);
  ok(g.shieldCd === 0 && !g.events.includes('shieldReady'), '就绪后保持 0，不再发事件');
  ok(g.monster.x === 8 && g.monster.y === 1, '密封死角里的怪物保持不动');
}

/* —— 4. 速度曲线：无上限，每 SPEED_RAMP=20 回合 +1 —— */
ok(G.monsterSpeed({ turn: 0 }) === 2, '初始速度 2');
ok(G.monsterSpeed({ turn: 19 }) === 2, '19 回合仍是 2');
ok(G.monsterSpeed({ turn: 20 }) === 3, '20 回合升到 3');
ok(G.monsterSpeed({ turn: 60 }) === 5, '60 回合升到 5');
ok(G.monsterSpeed({ turn: 100 }) === 7, '100 回合升到 7');
ok(G.monsterSpeed({ turn: 600 }) === 32, '600 回合升到 32（原版此时早已封顶）');
ok(G.monsterSpeed({ turn: 7000 }) === 352, '长局速度无上限：7000 回合=352');

/* —— 5. 走廊逐格碰撞：怪物不能越过玩家；护盾阻挡；冷却后接触即死 —— */
const corridor = [
  '##########',
  '##########',
  '#........#',
  '##########',
  '##########',
];
{
  const g = G.createGame({ map: corridor, player: { x: 5, y: 2 }, monster: { x: 8, y: 2, dir: 2 } });
  g.monster.dirTimer = 99; // 本场景固定变向节奏，只测撞墙反弹与接触
  G.step(g, 0, 1); // 玩家向下撞墙耗回合；怪物向西走 2 格 → (6,2)
  ok(g.monster.x === 6 && g.monster.y === 2, '怪物逐格走到 (6,2)');
  ok(g.status === 'playing', '未接触未死亡');
  G.step(g, 0, 1); // 怪物下一格是玩家 → 护盾：不进入玩家格、掉头、结束移动
  ok(g.status === 'playing', '护盾抵挡存活');
  ok(g.monster.x === 6, '怪物未进入玩家格');
  ok(g.monster.dir === 0, '怪物掉头向东');
  ok(g.monster.stepsLeft === 0, '护盾触发后本回合停止移动');
  ok(g.shieldCd === CFG.SHIELD_CD, '护盾进入冷却');
  ok(g.player.x === 5 && g.player.y === 2, '玩家位置不变');
  drain(g);
  // 掉头的怪物向东跑远、撞墙后折返，第 5 回合再次逼近玩家（全程玩家原地撞墙）
  G.step(g, 0, 1); ok(g.monster.x === 8, '第3回合怪物向东跑到(8,2)');
  G.step(g, 0, 1); ok(g.monster.x === 6 && g.monster.dir === 2, '第4回合怪物撞墙折返到(6,2)');
  G.step(g, 0, 1);
  ok(g.status === 'dead', '冷却中接触即死');
  ok(g.monster.x === 6, '死亡时怪物也没有越过玩家');
}

/* —— 8. 变向下沉到步级：半场开始即规划逐格路径，可在某回合内多次变向 —— */
{
  // 足够大的空场：怪物从 (9,6) 往任一方向连走 7 格都不会撞墙
  const W = 20, H = 14;
  const openBig = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) row.push((x === 0 || y === 0 || x === W - 1 || y === H - 1) ? '#' : '.');
    openBig.push(row.join(''));
  }
  // 假 rng 恒为 0：变向必选“序号最小的可选侧向”，节奏重置必为 MIN(=3)
  const fake = () => 0;
  const mkOpen = (turn, dirTimer, fromE) => {
    const g = G.createGame({ map: openBig, player: { x: 16, y: 12 }, monster: { x: 9, y: 6, dir: fromE }, rng: fake });
    g.turn = turn;
    g.monster.dirTimer = dirTimer;
    return g;
  };

  // A 节奏倒数 2 步归零：本回合第 3 步（0 基第 2 步）改为新方向；RAMP=20 下 turn 70→71 speed=5
  {
    const g = mkOpen(70, 2, 0);
    G.step(g, 0, -1);
    ok(JSON.stringify(g.monster.plan) === '[0,0,1,1,1]', `第3步变向 plan=${JSON.stringify(g.monster.plan)}`);
    ok(g.monster.x === 11 && g.monster.y === 9, `变向步轨迹 (${g.monster.x},${g.monster.y})`);
    ok(g.monster.dir === 1 && g.monster.dirTimer === 0, '变向后朝向与剩余节奏');
  }
  // B 一回合内两次变向：第 2 步变南，重置 3 步后第 5 步再变东；turn 105→106 speed=7
  {
    const g = mkOpen(105, 1, 0);
    G.step(g, 0, -1);
    ok(JSON.stringify(g.monster.plan) === '[0,1,1,1,0,0,0]', `一回合两次变向 plan=${JSON.stringify(g.monster.plan)}`);
    ok(g.monster.x === 13 && g.monster.y === 9, `双变向轨迹 (${g.monster.x},${g.monster.y})`);
    ok(g.monster.dir === 0 && g.monster.dirTimer === 0, '连变两次后的朝向与剩余节奏');
  }
  // C 节奏未归零：整回合保持直线（speed=2）
  {
    const g = mkOpen(0, 9, 0);
    G.step(g, 0, -1);
    ok(JSON.stringify(g.monster.plan) === '[0,0]', '未到点整回合直线');
    ok(g.monster.x === 11 && g.monster.y === 6 && g.monster.dir === 0, '直线轨迹');
  }
}

/* —— 9. 玩家撞怪交换时本回合怪物停走，且不消耗变向节奏 —— */
{
  const g = mk({ player: { x: 2, y: 2 }, monster: { x: 3, y: 2, dir: 0 } });
  const dtBefore = g.monster.dirTimer;
  G.step(g, 1, 0);
  ok(g.player.x === 3 && g.player.y === 2, '玩家交换到怪物原格');
  ok(g.monster.x === 2 && g.monster.y === 2, '怪物交换到玩家原格');
  ok(g.monster.dir === 2, '怪物掉头');
  ok(g.monster.stepsLeft === 0, '本回合怪物不再移动');
  ok(g.shieldCd === CFG.SHIELD_CD, '护盾进入冷却');
  ok(g.moves === 1, '交换计一步');
  ok(g.status === 'playing', '交换存活');
  ok(g.monster.dirTimer === dtBefore, '被跳过的半场不消耗变向节奏');
}

/* —— 7. 玩家冷却中走进怪物：直接死亡，位置不交换 —— */
{
  const g = mk({ player: { x: 2, y: 2 }, monster: { x: 3, y: 2, dir: 0 } });
  g.shieldCd = 5;
  G.step(g, 1, 0);
  ok(g.status === 'dead', '冷却中撞进怪物死亡');
  ok(g.player.x === 2 && g.monster.x === 3, '死亡后无交换');
}

/* —— 8. 长跑模糊测试 30 局 × 400 回合：每回合做不变式校验 —— */
let deaths = 0, shieldsUsed = 0, totalTurns = 0;
for (let s = 0; s < 30; s++) {
  const game = G.createGame({ rng: G.mulberry32(4242 + s) });
  for (let t = 0; t < 400 && game.status === 'playing'; t++) {
    totalTurns++;
    const p = game.player, m = game.monster;
    const md = Math.abs(p.x - m.x) + Math.abs(p.y - m.y);
    let d;
    if (md <= 3) {
      // 简单逃跑代理：选移动后离怪物最远方向
      let bestD = 0, bestDist = -1;
      for (let i = 0; i < 4; i++) {
        const nx = p.x + G.DIRS[i][0], ny = p.y + G.DIRS[i][1];
        if (!game.map[ny] || game.map[ny][nx] === '#') continue;
        const nd = Math.abs(nx - m.x) + Math.abs(ny - m.y);
        if (nd > bestDist) { bestDist = nd; bestD = i; }
      }
      d = bestD;
    } else {
      d = Math.floor(game.rng() * 4);
    }
    G.step(game, G.DIRS[d][0], G.DIRS[d][1]);
    ok(game.map[game.player.y][game.player.x] === '.', `fuzz${s}/t${t} 玩家不嵌墙`);
    ok(game.map[game.monster.y][game.monster.x] === '.', `fuzz${s}/t${t} 怪物不嵌墙`);
    if (game.status === 'playing') {
      ok(!(game.player.x === game.monster.x && game.player.y === game.monster.y), `fuzz${s}/t${t} 不重叠`);
    }
    if (game.events.includes('shield')) shieldsUsed++;
    if (game.status === 'dead') deaths++;
    game.events.length = 0;
  }
}
console.log(`fuzz: 30 局 / ${totalTurns} 回合 / 死亡 ${deaths} 局 / 护盾抵挡 ${shieldsUsed} 次`);
ok(deaths > 0, 'fuzz 中有死亡（游戏能正常结束）');
ok(shieldsUsed > 0, 'fuzz 中护盾有实际触发');

console.log(`\n通过 ${pass} 项，失败 ${fail} 项`);
if (fail) {
  failures.slice(0, 20).forEach(f => console.error('FAIL: ' + f));
  process.exit(1);
}
