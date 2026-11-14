// 全局上下文 —— 各模块共享的游戏状态引用（避免循环依赖）
export const CTX = {
  renderer: null,
  scene: null,       // 当前关卡场景
  camera: null,

  game: null,        // main.js 的 Game 实例
  world: null,       // 当前 World 实例
  player: null,
  effects: null,
  audio: null,
  hud: null,
  input: null,

  enemies: [],       // Enemy 实例
  boss: null,

  levelIdx: 0,
  levelCfg: null,    // LEVELS[levelIdx]
  scrollSpeed: 62,   // 世界卷动速度（units/s）
  gameTime: 0,       // 本关已进行时间（秒）
  dt: 0,

  stats: { score: 0, kills: 0, shots: 0, hits: 0, combo: 0, comboT: 0, total: 0 },

  godMode: false,
};

export function resetRunStats() {
  CTX.stats.score = 0;
  CTX.stats.kills = 0;
  CTX.stats.shots = 0;
  CTX.stats.hits = 0;
  CTX.stats.combo = 0;
  CTX.stats.comboT = 0;
}
