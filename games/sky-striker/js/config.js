// ---- 全局常量 ----
export const CONST = {
  SPAWN_Z: -330,
  KILL_Z: 50,
  BOUNDS: { x: 27, yMin: 3.5, yMax: 30 },
  PLAYER_RADIUS: 1.7,
  LIVES: 3,
  VULCAN_RATE: 11,     // 发/秒
  VULCAN_DMG: 3.2,
  MISSILE_DMG: 55,
  MISSILE_CAP: 20,
  BOMB_CAP: 4,
  COMBO_TIME: 2.2,
};

// 波次事件速记
const E = (t, spawner, params = {}) => ({ t, spawner, ...params });

// ---- 六个关卡 ----
export const LEVELS = [
  {
    id: 1, name: '蓝色海岸线', sub: 'BLUE LITTORAL', scene: 'ocean',
    accent: 0x35e0ff,
    pal: {
      skyTop: '#3f9fe8', skyBot: '#cfeaff', fog: '#bfe0f5', fogNear: 70, fogFar: 340,
      ground: '#0e5d9e', ground2: '#1880c4', sun: '#fff3c8', sunPos: [60, 90, -240],
      hemiSky: '#cfeaff', hemiGround: '#0a4a80', dirInt: 1.5,
    },
    music: { bpm: 118, root: 57, scale: 'major', prog: [0, 4, 5, 3], drums: 'four', arp: 0.7, lead: true, bright: 0.9 },
    waves: [
      E(3, 'vee', { n: 5 }), E(9, 'line', { n: 6, side: 1 }), E(15, 'vee', { n: 4, x: -14 }), E(15.6, 'vee', { n: 4, x: 14 }),
      E(22, 'gunship'), E(27, 'snake', { n: 6 }), E(34, 'pincer', { n: 4 }),
      E(40, 'gunship', { x: -16 }), E(41, 'gunship', { x: 16 }), E(47, 'wall', { n: 7 }),
      E(54, 'kamikaze', { n: 3 }), E(60, 'vee', { n: 5 }), E(61, 'line', { n: 5, side: -1 }),
      E(68, 'gunship'), E(69, 'snake', { n: 6 }), E(76, 'mines', { n: 6 }),
      E(84, 'ace', { n: 1 }), E(85, 'vee', { n: 4 }), E(92, 'end'),
    ],
    boss: { cls: 'SteelWhale', name: '钢鲸 · 重型轰炸机', en: 'STEEL WHALE', hp: 2200, score: 8000 },
  },
  {
    id: 2, name: '赤色峡谷', sub: 'RED CANYON', scene: 'canyon',
    accent: 0xffb347,
    pal: {
      skyTop: '#e8794a', skyBot: '#ffd9a8', fog: '#e0a97c', fogNear: 60, fogFar: 320,
      ground: '#b0603a', ground2: '#d98d5c', sun: '#ffe9c0', sunPos: [-70, 70, -220],
      hemiSky: '#ffd9a8', hemiGround: '#7a3d22', dirInt: 1.4,
    },
    music: { bpm: 108, root: 55, scale: 'mixolydian', prog: [0, 6, 3, 4], drums: 'rock', arp: 0.65, lead: true, bright: 0.85 },
    waves: [
      E(3, 'vee', { n: 5 }), E(8, 'line', { n: 6, side: 1 }), E(14, 'turretship'),
      E(20, 'pincer', { n: 4 }), E(26, 'gunship'), E(32, 'mines', { n: 6 }),
      E(38, 'vee', { n: 5, x: -12 }), E(39, 'line', { n: 5, side: -1 }), E(45, 'frigate'),
      E(52, 'kamikaze', { n: 4 }), E(58, 'gunship', { x: -14 }), E(59, 'gunship', { x: 14 }),
      E(65, 'snake', { n: 7 }), E(72, 'ace', { n: 1 }), E(73, 'vee', { n: 4 }),
      E(79, 'turretship'), E(85, 'frigate'), E(86, 'vee', { n: 5 }), E(93, 'end'),
    ],
    boss: { cls: 'SandScorpion', name: '沙蝎 · 沙漠炮舰母机', en: 'SAND SCORPION', hp: 3000, score: 10000 },
  },
  {
    id: 3, name: '霓虹夜城', sub: 'NEON CITY', scene: 'city',
    accent: 0xff4fd8,
    pal: {
      skyTop: '#060a18', skyBot: '#16204a', fog: '#0d1226', fogNear: 60, fogFar: 300,
      ground: '#0a0e1a', ground2: '#1a2f4a', sun: '#cfd8ff', sunPos: [-50, 80, -220], moon: true,
      hemiSky: '#2a3a6a', hemiGround: '#05070d', dirInt: 0.7,
    },
    music: { bpm: 100, root: 57, scale: 'dorian', prog: [0, 3, 6, 3], drums: 'break', arp: 0.5, lead: false, bright: 0.6 },
    waves: [
      E(3, 'line', { n: 6, side: 1 }), E(8, 'gunship'), E(14, 'pincer', { n: 6 }),
      E(20, 'frigate'), E(26, 'ace', { n: 2 }), E(32, 'wall', { n: 8 }),
      E(38, 'turretship', { x: -13 }), E(39, 'turretship', { x: 13 }), E(45, 'snake', { n: 8 }),
      E(51, 'kamikaze', { n: 5 }), E(57, 'gunship'), E(58, 'vee', { n: 5 }),
      E(64, 'ace', { n: 2 }), E(65, 'frigate'), E(72, 'mines', { n: 8 }),
      E(78, 'turretship'), E(84, 'gunship'), E(85, 'ace', { n: 2 }), E(92, 'end'),
    ],
    boss: { cls: 'NightBlade', name: '夜刃 · 隐形翼战斗艇', en: 'NIGHT BLADE', hp: 3600, score: 12000 },
  },
  {
    id: 4, name: '雷暴之眼', sub: 'STORM EYE', scene: 'storm',
    accent: 0x9fd8ff,
    pal: {
      skyTop: '#161d2b', skyBot: '#39485e', fog: '#2a3648', fogNear: 50, fogFar: 280,
      ground: '#101d29', ground2: '#1a2f3d', sun: '#aab8cc', sunPos: [0, 100, -240],
      hemiSky: '#3d4c60', hemiGround: '#0a121a', dirInt: 0.8, lightning: true,
    },
    music: { bpm: 126, root: 52, scale: 'aeolian', prog: [0, 5, 3, 6], drums: 'rock', arp: 0.6, lead: true, bright: 0.75 },
    waves: [
      E(3, 'kamikaze', { n: 4 }), E(8, 'vee', { n: 6 }), E(13, 'turretship'),
      E(19, 'pincer', { n: 6 }), E(25, 'gunship', { x: -14 }), E(26, 'gunship', { x: 14 }),
      E(31, 'mines', { n: 8 }), E(37, 'kamikaze', { n: 6 }), E(43, 'frigate', { x: -12 }), E(44, 'frigate', { x: 12 }),
      E(50, 'snake', { n: 8 }), E(56, 'ace', { n: 2 }), E(57, 'vee', { n: 5 }),
      E(63, 'turretship', { x: -12 }), E(64, 'turretship', { x: 12 }), E(65, 'line', { n: 6, side: 1 }),
      E(70, 'gunship'), E(76, 'kamikaze', { n: 8 }), E(82, 'ace', { n: 3 }), E(88, 'end'),
    ],
    boss: { cls: 'ThorCitadel', name: '雷神 · 浮空堡垒', en: 'THOR CITADEL', hp: 4400, score: 15000 },
  },
  {
    id: 5, name: '极光平流层', sub: 'AURORA STRATOS', scene: 'aurora',
    accent: 0x6dffc8,
    pal: {
      skyTop: '#070b26', skyBot: '#101c46', fog: '#0e1636', fogNear: 70, fogFar: 320,
      ground: '#8fb0d8', ground2: '#b8d0e8', sun: '#dfe8ff', sunPos: [80, 60, -260],
      hemiSky: '#1a2a5a', hemiGround: '#405068', dirInt: 1.0, aurora: true, stars: true,
    },
    music: { bpm: 104, root: 59, scale: 'lydian', prog: [0, 4, 3, 5], drums: 'none', arp: 0.55, lead: true, bright: 1.0 },
    waves: [
      E(3, 'ace', { n: 2 }), E(8, 'wall', { n: 8 }), E(14, 'frigate'),
      E(20, 'pincer', { n: 6 }), E(26, 'turretship', { x: -12 }), E(27, 'turretship', { x: 12 }),
      E(33, 'gunship'), E(34, 'vee', { n: 5 }), E(39, 'ace', { n: 3 }),
      E(45, 'snake', { n: 9 }), E(51, 'frigate', { x: -12 }), E(52, 'frigate', { x: 12 }),
      E(58, 'kamikaze', { n: 6 }), E(59, 'mines', { n: 6 }), E(65, 'turretship'), E(66, 'ace', { n: 2 }),
      E(72, 'gunship', { x: -14 }), E(73, 'gunship', { x: 14 }), E(74, 'line', { n: 6, side: -1 }),
      E(80, 'ace', { n: 4 }), E(86, 'end'),
    ],
    boss: { cls: 'AuroraWing', name: '极光之翼 · 双子歼击机', en: 'AURORA WING', hp: 5200, score: 18000 },
  },
  {
    id: 6, name: '深空前线', sub: 'DEEP SPACE', scene: 'space',
    accent: 0xff6a4d,
    pal: {
      skyTop: '#01020a', skyBot: '#050818', fog: '#05070f', fogNear: 90, fogFar: 380,
      ground: '#000000', sun: '#ffdfd0', sunPos: [-90, 70, -280], stars: true, nebula: true, planet: true,
      hemiSky: '#2a2a5a', hemiGround: '#101020', dirInt: 1.0,
    },
    music: { bpm: 120, root: 50, scale: 'phrygian', prog: [0, 1, 6, 0], drums: 'tense', arp: 0.45, lead: true, bright: 0.8 },
    waves: [
      E(3, 'vee', { n: 6 }), E(4, 'line', { n: 6, side: 1 }), E(10, 'turretship', { x: -12 }), E(11, 'turretship', { x: 12 }),
      E(16, 'kamikaze', { n: 6 }), E(22, 'frigate'), E(28, 'ace', { n: 3 }),
      E(34, 'wall', { n: 10 }), E(40, 'gunship', { x: -14 }), E(41, 'gunship', { x: 14 }), E(42, 'mines', { n: 6 }),
      E(47, 'snake', { n: 9 }), E(53, 'turretship'), E(54, 'ace', { n: 2 }),
      E(60, 'kamikaze', { n: 8 }), E(66, 'frigate'), E(67, 'gunship'), E(73, 'ace', { n: 4 }),
      E(80, 'turretship', { x: -12 }), E(81, 'turretship', { x: 12 }), E(82, 'vee', { n: 6 }), E(89, 'end'),
    ],
    boss: { cls: 'GenesisArk', name: '创世方舟 · 终极母舰', en: 'GENESIS ARK', hp: 6800, score: 30000 },
  },
];

export const MENU_MUSIC = { bpm: 76, root: 57, scale: 'majorPent', prog: [0, 3, 4, 3], drums: 'none', arp: 0.35, lead: true, bright: 0.5, pad: true };
