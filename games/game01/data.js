/* ============ 物品数据 ============ */
/* 装备加成公式：实际 = baseBonus + realm × perRealmBonus */
const ITEMS = {
  // 丹药
  huichundan:{name:"回春丹",type:"丹药",effect:"气血 +30",desc:"草香扑鼻，常见疗伤丹药。",rarity:"普通",stackable:true,maxStack:99,sellPrice:8},
  xiaohuandan:{name:"小还丹",type:"丹药",effect:"气血 +80",desc:"药力更胜回春丹。",rarity:"普通",stackable:true,maxStack:99,sellPrice:30},
  dahuandan:{name:"大还丹",type:"丹药",effect:"气血 +200",desc:"珍贵疗伤圣药。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:75},
  jiuzhuandan:{name:"九转还魂丹",type:"丹药",effect:"气血全满",desc:"九转丹成，起死回生。",rarity:"传说",stackable:true,maxStack:99,sellPrice:250},
  juqidan:{name:"聚气丹",type:"丹药",effect:"修为 +60",desc:"凝聚灵气。",rarity:"普通",stackable:true,maxStack:99,sellPrice:15},
  wudaodan:{name:"悟道丹",type:"丹药",effect:"悟性 +1",desc:"神台清明。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:25},
  qingxindan:{name:"清心丹",type:"丹药",effect:"清除一次走火入魔计数",desc:"压制心魔。",rarity:"普通",stackable:true,maxStack:99,sellPrice:30},
  pozhangdan:{name:"破障丹",type:"丹药",effect:"下次突破 +15%",desc:"冲关破障。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:40},
  xisuidan:{name:"洗髓丹",type:"丹药",effect:"气血上限 +10",desc:"洗经伐髓。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:90,maxUses:5,hpGain:10},
  duantidan:{name:"锻体丹",type:"丹药",effect:"气血上限 +30",desc:"锻体如钢。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:400,maxUses:3,hpGain:30},
  niepandan:{name:"涅槃丹",type:"丹药",effect:"气血上限 +80",desc:"涅槃重生。",rarity:"传说",stackable:true,maxStack:99,sellPrice:1200,maxUses:1,hpGain:80},
  ningyuandan:{name:"凝元丹",type:"丹药",effect:"突破 +10%",desc:"凝练元气。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:40},
  xiao_yanshou:{name:"小延寿丹",type:"丹药",effect:"寿元 +20",desc:"常见延寿之物。",rarity:"普通",stackable:true,maxStack:99,sellPrice:100,lifespanGain:20,maxUses:3},
  yanshoudan:{name:"延寿丹",type:"丹药",effect:"寿元 +50",desc:"逆天改命。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:250,lifespanGain:50,maxUses:2},
  da_yanshou:{name:"大延寿丹",type:"丹药",effect:"寿元 +100",desc:"珍贵异常。",rarity:"传说",stackable:true,maxStack:99,sellPrice:500,lifespanGain:100,maxUses:1},
  zaohuadan:{name:"造化丹",type:"丹药",effect:"寿元 +200",desc:"夺天地造化。",rarity:"传说",stackable:true,maxStack:99,sellPrice:1000,lifespanGain:200,maxUses:1},

  // 练气期装备
  tiejian:{name:"铁剑",type:"攻击法器",effect:"伤害 +4",desc:"普通铁剑。",rarity:"普通",slot:"attack",baseBonus:4,perRealmBonus:3,realm:0,sellPrice:30},
  qingfengjian:{name:"青锋剑",type:"攻击法器",effect:"伤害 +5",desc:"青云门制式飞剑。",rarity:"普通",slot:"attack",baseBonus:5,perRealmBonus:3,realm:0,sellPrice:50},
  tiejingdao:{name:"铁精刀",type:"攻击法器",effect:"伤害 +6",desc:"铁精打造。",rarity:"稀有",slot:"attack",baseBonus:6,perRealmBonus:4,realm:0,sellPrice:80},
  chiyandao:{name:"赤炎刀",type:"攻击法器",effect:"伤害 +7，每回合 -2 气血",desc:"刀身赤红。",rarity:"稀有",slot:"attack",baseBonus:7,perRealmBonus:4,realm:0,sellPrice:90},
  pijia:{name:"皮甲",type:"防御法器",effect:"减免 2",desc:"兽皮护甲。",rarity:"普通",slot:"defense",baseBonus:2,perRealmBonus:2,realm:0,sellPrice:30},
  huxinjing:{name:"护心镜",type:"防御法器",effect:"减免 3",desc:"护住心脉。",rarity:"普通",slot:"defense",baseBonus:3,perRealmBonus:2,realm:0,sellPrice:50},
  tiebushan:{name:"铁布衫",type:"防御法器",effect:"减免 3，气血上限 +10",desc:"铁布罩身。",rarity:"稀有",slot:"defense",baseBonus:3,perRealmBonus:3,realm:0,sellPrice:70},
  tongdun:{name:"铜盾",type:"防御法器",effect:"减免 4",desc:"铜制盾牌。",rarity:"稀有",slot:"defense",baseBonus:4,perRealmBonus:3,realm:0,sellPrice:80},

  // 筑基期装备
  jinggangdao:{name:"精钢刀",type:"攻击法器",effect:"伤害 +6",desc:"精钢打造。",rarity:"普通",slot:"attack",baseBonus:6,perRealmBonus:3,realm:1,sellPrice:120},
  hantieqiang:{name:"寒铁枪",type:"攻击法器",effect:"伤害 +7",desc:"寒铁铸就。",rarity:"普通",slot:"attack",baseBonus:7,perRealmBonus:4,realm:1,sellPrice:150},
  feiyugong:{name:"飞羽弓",type:"攻击法器",effect:"伤害 +8",desc:"远程法器。",rarity:"稀有",slot:"attack",baseBonus:8,perRealmBonus:4,realm:1,sellPrice:200},
  xuantiejian:{name:"玄铁重剑",type:"攻击法器",effect:"伤害 +8，气血上限 +20",desc:"重剑无锋。",rarity:"稀有",slot:"attack",baseBonus:8,perRealmBonus:4,realm:1,sellPrice:220},
  tiejia:{name:"铁甲",type:"防御法器",effect:"减免 4",desc:"铁片护身。",rarity:"普通",slot:"defense",baseBonus:4,perRealmBonus:3,realm:1,sellPrice:120},
  xuantiedun:{name:"玄铁盾",type:"防御法器",effect:"减免 5",desc:"玄铁铸盾。",rarity:"普通",slot:"defense",baseBonus:5,perRealmBonus:3,realm:1,sellPrice:150},
  qingfengpao:{name:"清风袍",type:"防御法器",effect:"减免 4，寿元消耗 -15%",desc:"减缓岁月侵蚀。",rarity:"稀有",slot:"defense",baseBonus:4,perRealmBonus:3,realm:1,sellPrice:200},
  jingjijia:{name:"荆棘甲",type:"防御法器",effect:"减免 5，反弹 2",desc:"伤敌一千。",rarity:"稀有",slot:"defense",baseBonus:5,perRealmBonus:4,realm:1,sellPrice:220},

  // 金丹期装备
  lingxijian:{name:"灵犀剑",type:"攻击法器",effect:"伤害 +9",desc:"灵犀一点通。",rarity:"普通",slot:"attack",baseBonus:9,perRealmBonus:4,realm:2,sellPrice:300},
  qingyuanjian:{name:"青元剑",type:"攻击法器",effect:"伤害 +11",desc:"青元剑气。",rarity:"稀有",slot:"attack",baseBonus:11,perRealmBonus:5,realm:2,sellPrice:450},
  suixingchui:{name:"碎星锤",type:"攻击法器",effect:"伤害 +10",desc:"专克妖躯。",rarity:"稀有",slot:"attack",baseBonus:10,perRealmBonus:5,realm:2,sellPrice:450},
  chixiaojian:{name:"赤霄剑",type:"攻击法器",effect:"伤害 +14",desc:"赤霄剑气。",rarity:"传说",slot:"attack",baseBonus:14,perRealmBonus:6,realm:2,sellPrice:900},
  xuanguijia:{name:"玄龟甲",type:"防御法器",effect:"减免 6",desc:"龟甲厚重。",rarity:"普通",slot:"defense",baseBonus:6,perRealmBonus:4,realm:2,sellPrice:300},
  yuanyangchi:{name:"元阳尺",type:"防御法器",effect:"减免 7，反弹 3",desc:"元阳之力。",rarity:"稀有",slot:"defense",baseBonus:7,perRealmBonus:5,realm:2,sellPrice:450},
  yinyi:{name:"银翼",type:"防御法器",effect:"减免 6，15% 闪避",desc:"来去如风。",rarity:"稀有",slot:"defense",baseBonus:6,perRealmBonus:5,realm:2,sellPrice:450},
  ziluoyi:{name:"紫罗衣",type:"防御法器",effect:"减免 8，每回合恢复 3 气血",desc:"护体自愈。",rarity:"传说",slot:"defense",baseBonus:8,perRealmBonus:6,realm:2,sellPrice:900},

  // 元婴期装备
  youmingdao:{name:"幽冥刀",type:"攻击法器",effect:"伤害 +12",desc:"幽冥之气缠绕。",rarity:"普通",slot:"attack",baseBonus:12,perRealmBonus:5,realm:3,sellPrice:600},
  duanhunbao:{name:"断魂刀",type:"攻击法器",effect:"伤害 +14",desc:"刀出断魂。",rarity:"稀有",slot:"attack",baseBonus:14,perRealmBonus:7,realm:3,sellPrice:900},
  zidianchui:{name:"紫电锤",type:"攻击法器",effect:"伤害 +17，对妖物 +10",desc:"紫电缠绕。",rarity:"传说",slot:"attack",baseBonus:17,perRealmBonus:8,realm:3,sellPrice:1800},
  jingangjia:{name:"金刚甲",type:"防御法器",effect:"减免 8",desc:"金刚不坏。",rarity:"普通",slot:"defense",baseBonus:8,perRealmBonus:6,realm:3,sellPrice:600},
  taixuandun:{name:"太玄盾",type:"防御法器",effect:"减免 9",desc:"太玄之力护体。",rarity:"稀有",slot:"defense",baseBonus:9,perRealmBonus:7,realm:3,sellPrice:900},
  taixujia:{name:"太虚甲",type:"防御法器",effect:"减免 12，15% 闪避",desc:"太虚之力。",rarity:"传说",slot:"defense",baseBonus:12,perRealmBonus:9,realm:3,sellPrice:1800},

  // 化神期装备
  lietianjian:{name:"裂天剑",type:"攻击法器",effect:"伤害 +19",desc:"一剑裂天。",rarity:"稀有",slot:"attack",baseBonus:19,perRealmBonus:9,realm:4,sellPrice:2000},
  zhuxianjian:{name:"诛仙剑",type:"攻击法器",effect:"伤害 +22，无视 30% 防御",desc:"诛仙一剑。",rarity:"传说",slot:"attack",baseBonus:22,perRealmBonus:12,realm:4,sellPrice:4000},
  jiuxiaohuanpei:{name:"九霄环佩",type:"防御法器",effect:"减免 14",desc:"九霄仙音。",rarity:"稀有",slot:"defense",baseBonus:14,perRealmBonus:10,realm:4,sellPrice:2000},
  yunwendun:{name:"云纹盾",type:"防御法器",effect:"减免 16，反弹 5",desc:"云纹流转。",rarity:"传说",slot:"defense",baseBonus:16,perRealmBonus:12,realm:4,sellPrice:4000},

  // 特殊道具
  guyu:{name:"古玉",type:"特殊道具",effect:"历练 20% 触发隐藏事件",desc:"玉中似有残魂低语。",rarity:"稀有",slot:"special",sellPrice:60},
  yaodan:{name:"妖丹",type:"特殊道具",effect:"突破 +10%",desc:"妖兽精华。",rarity:"稀有",slot:"special",sellPrice:60},
  julingzhu:{name:"聚灵珠",type:"特殊道具",effect:"打坐修为 +30%",desc:"珠内灵气充沛。",rarity:"稀有",slot:"special",sellPrice:60},
  xunbaoluopan:{name:"寻宝罗盘",type:"特殊道具",effect:"历练掉落宝物 +15%",desc:"直指宝气。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},
  tianleizhu:{name:"天雷竹",type:"特殊道具",effect:"历练对妖物 +8",desc:"天雷孕育。",rarity:"稀有",slot:"special",sellPrice:80},
  wanshouPai:{name:"万兽牌",type:"特殊道具",effect:"历练遇兽 +20%",desc:"万兽臣服。",rarity:"稀有",slot:"special",sellPrice:80},
  tianxuanzhu:{name:"天玄珠",type:"特殊道具",effect:"修为获取 +20%",desc:"天玄之气凝聚。",rarity:"传说",slot:"special",sellPrice:1500},

  // 逃脱道具
  dun_di_fu:{name:"遁地符",type:"逃脱道具",escapeRealm:1,effect:"强敌为筑基期时必定逃脱",desc:"遁地而走。",rarity:"普通",stackable:true,maxStack:99,sellPrice:40},
  tu_dun_fu:{name:"土遁符",type:"逃脱道具",escapeRealm:2,effect:"强敌为金丹期时必定逃脱",desc:"借土而遁。",rarity:"普通",stackable:true,maxStack:99,sellPrice:100},
  suo_di_fu:{name:"缩地符",type:"逃脱道具",escapeRealm:3,effect:"强敌为元婴期时必定逃脱",desc:"缩地成寸。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:250},
  shun_yi_fu:{name:"瞬移符",type:"逃脱道具",escapeRealm:4,effect:"强敌为化神期时必定逃脱",desc:"瞬间移动。",rarity:"稀有",stackable:true,maxStack:99,sellPrice:600},
  da_nuo_yi_fu:{name:"大挪移符",type:"逃脱道具",escapeRealm:5,effect:"任何强敌必定逃脱",desc:"大挪移神通。",rarity:"传说",stackable:true,maxStack:99,sellPrice:1500},

  // 消耗品
  jingxinliantai:{name:"静心莲台",type:"特殊道具",effect:"突破失败计数 -1",desc:"莲台清心。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:60},
  tianjipan:{name:"天机盘",type:"特殊道具",effect:"显示下次事件类型",desc:"窥探天机。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:60},
  chuansongfu:{name:"传送符",type:"特殊道具",effect:"秘境失败免除一次伤害",desc:"脱身保命。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:120},
  mijingcantu:{name:"秘境残图",type:"特殊道具",effect:"已关闭秘境重开",desc:"残破地图。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:100},
  yinlufu:{name:"引路符",type:"特殊道具",effect:"重置稀有掉落记录",desc:"引路之符。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:100},
  jiuriYinji:{name:"旧日印记",type:"特殊道具",effect:"进入未通关的低级秘境一次",desc:"逆转时光。",rarity:"传说",stackable:true,maxStack:99,consumable:true,sellPrice:200},

  // 唯一宝物（baseBonus ×2）
  qingzhuFengyun:{name:"青竹蜂云剑",type:"攻击法器",effect:"伤害 +30，对妖物 +10",desc:"韩立本命飞剑。",rarity:"唯一",slot:"attack",baseBonus:30,perRealmBonus:12,unique:true,sellPrice:0},
  pokongjian:{name:"破空剑",type:"攻击法器",effect:"伤害 +32，无视防御",desc:"一剑破空。",rarity:"唯一",slot:"attack",baseBonus:32,perRealmBonus:14,unique:true,sellPrice:0},
  yuancishenshan:{name:"元磁神山",type:"攻击法器",effect:"伤害 +36",desc:"重若山岳。",rarity:"唯一",slot:"attack",baseBonus:36,perRealmBonus:16,unique:true,sellPrice:0},
  yinluofan:{name:"阴罗幡",type:"攻击法器",effect:"伤害 +24，每回合 -4 气血",desc:"魔道法器。",rarity:"唯一",slot:"attack",baseBonus:24,perRealmBonus:12,unique:true,sellPrice:0},
  xuemojian:{name:"血魔剑",type:"攻击法器",effect:"伤害 +28，每回合 -3 气血",desc:"饮血则狂。",rarity:"唯一",slot:"attack",baseBonus:28,perRealmBonus:14,unique:true,sellPrice:0},
  tianjisan:{name:"天机伞",type:"防御法器",effect:"减免 16，10% 闪避",desc:"天机演化。",rarity:"唯一",slot:"defense",baseBonus:16,perRealmBonus:12,unique:true,sellPrice:0},
  shanhefan:{name:"山河扇",type:"防御法器",effect:"减免 20，寿元消耗 -30%",desc:"扇动山河。",rarity:"唯一",slot:"defense",baseBonus:20,perRealmBonus:14,unique:true,sellPrice:0},
  luobaoJinqian:{name:"落宝金钱",type:"防御法器",effect:"减免 18",desc:"专克法器。",rarity:"唯一",slot:"defense",baseBonus:18,perRealmBonus:12,unique:true,sellPrice:0},
  ziluoyi_unique:{name:"紫罗衣（真）",type:"防御法器",effect:"减免 24，每回合恢复 5 气血",desc:"紫罗极火所化。",rarity:"唯一",slot:"defense",baseBonus:24,perRealmBonus:16,unique:true,sellPrice:0},
  zhangtianping:{name:"掌天瓶（仿）",type:"特殊道具",effect:"每回合 +3 修为",desc:"催熟灵药。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},
  wuseKongque:{name:"五色孔雀翎",type:"特殊道具",effect:"突破 +15%",desc:"五色神光。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},
  tianguizhu:{name:"天鬼珠",type:"特殊道具",effect:"20% 斩杀残血 NPC",desc:"摄魂夺魄。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},
  zaohuayudie:{name:"造化玉碟",type:"特殊道具",effect:"全属性 +5%，寿元消耗 -15%",desc:"夺天地之机。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},
  qiankundai:{name:"乾坤袋",type:"特殊道具",effect:"历练掉落 +15%",desc:"空间法器。",rarity:"唯一",slot:"special",unique:true,sellPrice:0},

  // 功法
  changchungong:{name:"长春功",type:"功法",effect:"气血上限 +20",desc:"养生功法。",rarity:"普通"},
  dayanjue:{name:"大衍诀",type:"功法",effect:"悟性 +2",desc:"推演天机。",rarity:"稀有"},
  guixishu:{name:"龟息术",type:"功法",effect:"寿元消耗 -10%",desc:"敛息藏气。",rarity:"稀有"},
  xuemogong:{name:"血魔功",type:"功法",effect:"气血上限 +30，每回合 -1 气血",desc:"魔道功法。",rarity:"传说"},
  qingxinzhou:{name:"清心咒",type:"功法",effect:"突破 +5%",desc:"静心凝神。",rarity:"稀有"},
  nalingjue:{name:"纳灵诀",type:"功法",effect:"打坐修为 +10%",desc:"吐纳效率提升。",rarity:"普通"},

  // 入场道具
  guanghan_yujian:{name:"广寒玉简",type:"入场道具",effect:"开启【广寒宫】",desc:"指向广寒宫。",rarity:"普通",stackable:true,maxStack:99,consumable:true,sellPrice:40},
  wanyao_gushu:{name:"万妖骨书",type:"入场道具",effect:"开启【万妖谷】",desc:"引路万妖谷。",rarity:"普通",stackable:true,maxStack:99,consumable:true,sellPrice:50},
  lingyao_nang:{name:"灵药囊",type:"入场道具",effect:"开启【灵药园】",desc:"引路灵药园。",rarity:"普通",stackable:true,maxStack:99,consumable:true,sellPrice:60},
  gujian_yao:{name:"古剑钥",type:"入场道具",effect:"开启【古剑冢】",desc:"打开古剑冢。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:75},
  yinlei_fu:{name:"引雷符",type:"入场道具",effect:"开启【雷罚之地】",desc:"引天雷开道。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:150},
  taixu_guJuan:{name:"太虚古卷",type:"入场道具",effect:"开启【太虚幻境】",desc:"幻境入口浮现。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:175},
  wanbao_zhenpan:{name:"万宝阵盘",type:"入场道具",effect:"开启【万宝秘境】",desc:"万宝秘境洞开。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:200},
  xueomo_gushu:{name:"血魔骨书",type:"入场道具",effect:"开启【血魔窟】",desc:"引路血魔窟。",rarity:"稀有",stackable:true,maxStack:99,consumable:true,sellPrice:225},
  xinghai_luopan:{name:"星海罗盘",type:"入场道具",effect:"开启【星海残境】",desc:"直指星海深处。",rarity:"传说",stackable:true,maxStack:99,consumable:true,sellPrice:400},
  taichu_guling:{name:"太初古令",type:"入场道具",effect:"开启【太初遗迹】",desc:"蕴含仙人之力。",rarity:"传说",stackable:true,maxStack:99,consumable:true,sellPrice:600},
  jiuYou_guixi:{name:"九幽鬼玺",type:"入场道具",effect:"开启【九幽地狱】",desc:"可开九幽之门。",rarity:"传说",stackable:true,maxStack:99,consumable:true,sellPrice:750},
};

/* ============ NPC 数据 ============ */
const NPC_DATA = {
  wolf_iron:{name:"铁背苍狼",type:"妖兽",rank:"normal",base:{hp:6,atk:4},drops:["yaodan","huichundan","tiejian"],desc:"背覆铁甲的山间恶狼"},
  wolf_pack:{name:"黑风狼群",type:"妖兽",rank:"normal",base:{hp:14,atk:6},drops:["yaodan","juqidan","pijia"],desc:"成群结队的狼群"},
  wolf_king:{name:"黑风狼王",type:"妖兽",rank:"elite",base:{hp:18,atk:7},drops:["yaodan","chiyandao","huxinjing"],desc:"黑风狼之首"},
  fox_three:{name:"三尾妖狐",type:"妖兽",rank:"elite",base:{hp:14,atk:8},drops:["yaodan","qingyuanjian","julingzhu"],desc:"狡黠的妖狐"},
  bear_iron:{name:"铁背熊",type:"妖兽",rank:"normal",base:{hp:25,atk:10},drops:["yaodan","hantieqiang","tiejia"],desc:"皮糙肉厚的巨熊"},
  beast_king:{name:"万兽之王",type:"妖兽",rank:"boss",base:{hp:50,atk:16},drops:["yaodan","wanshouPai","qingyuanjian"],desc:"万兽臣服的妖王"},
  evil_masked:{name:"蒙面邪修",type:"邪修",rank:"normal",base:{hp:10,atk:5},drops:["qingxindan","wudaodan","tiejian"],desc:"行踪诡秘的邪修"},
  evil_solo:{name:"独行散修",type:"邪修",rank:"elite",base:{hp:12,atk:6},drops:["pozhangdan","qingyuanjian","tongdun"],desc:"独来独往的散修"},
  disc_outer_1:{name:"外门弟子甲",type:"同门",rank:"normal",base:{hp:5,atk:3},drops:[],desc:"外门普通弟子"},
  disc_outer_2:{name:"外门弟子乙",type:"同门",rank:"normal",base:{hp:8,atk:4},drops:[],desc:"外门进阶弟子"},
  disc_outer_chief:{name:"外门首席",type:"同门",rank:"elite",base:{hp:12,atk:5},drops:[],desc:"外门第一人"},
  disc_inner_1:{name:"内门弟子甲",type:"同门",rank:"normal",base:{hp:15,atk:8},drops:[],desc:"内门普通弟子"},
  disc_inner_2:{name:"内门弟子乙",type:"同门",rank:"normal",base:{hp:20,atk:10},drops:[],desc:"内门进阶弟子"},
  disc_inner_3:{name:"内门弟子丙",type:"同门",rank:"elite",base:{hp:28,atk:12},drops:[],desc:"内门精英"},
  disc_inner_chief:{name:"内门首席",type:"同门",rank:"boss",base:{hp:38,atk:15},drops:[],desc:"内门第一人"},
  ghost_yin:{name:"阴魂",type:"灵体",rank:"normal",base:{hp:15,atk:8},drops:["huichundan","huxinjing","xisuidan"],desc:"阴气凝聚的鬼魂"},
  ghost_wraith:{name:"怨魂集合体",type:"灵体",rank:"elite",base:{hp:75,atk:26},drops:["xisuidan","lingguangzhao","yuanyangchi"],desc:"怨念聚合体"},
  puppet_guard:{name:"守墓傀儡",type:"傀儡",rank:"elite",base:{hp:45,atk:16},drops:["xisuidan","jingjijia","xuanguijia"],desc:"古墓中的守卫傀儡"},
  puppet_ancient:{name:"古尸傀儡",type:"傀儡",rank:"elite",base:{hp:28,atk:12},drops:["pozhangdan","huxinjing","tiejia"],desc:"上古修士尸体所化"},
  demon_blood:{name:"血魔",type:"魔修",rank:"elite",base:{hp:60,atk:24},drops:["ningyuandan","chiyandao","ziluoyi"],desc:"修习血魔功的魔修"},
  strong_masked:{name:"蒙面强者",type:"强敌",rank:"boss",base:{hp:30,atk:20},drops:[],desc:"修为深不可测的强者",strong:true},
  elder_mystery:{name:"神秘老者",type:"剧情",rank:"story",base:{hp:0,atk:0},drops:[],desc:"来历不明的老者",dialogue:""},
};

const NPC_SCALE = {"妖兽":[1,1.6,2.6,4,6],"邪修":[1,1.8,3,4.5,7],"同门":[1,1.5,2.5,3.5,5],"灵体":[1,1.7,2.8,4.2,6.5],"傀儡":[1,1.4,2.4,3.8,5.5],"魔修":[1,2,3.2,5,8],"强敌":[1,1.8,3,4.5,7],"剧情":[1,1,1,1,1]};

const DUNGEON_DIFFICULTY=1.2;
const DUNGEON_LAYER_BONUS=0.05;

const REALM_INFO=["练气","筑基","金丹","元婴","化神"];
const REQ=[400,2000,8000,30000,80000];
const LIFEBONUS=[0,80,150,300,600];
const HPBONUS=[0,80,80,80,80];
const LIFE_COST=[[1,2,1,1],[3,5,3,1],[6,10,6,2],[10,18,10,3],[15,30,15,5]];
const RANDOM_REFRESH=[6,8,12,16,30];
const SYNTH_COST=[50,200,800,3000,8000];
const RARITY_CHAIN={"普通":"稀有","稀有":"传说"};
/* ============ 洞天古迹 ============ */
const SECRET_REALMS=[
{id:"heifenggu",name:"黑风谷",danger:"低",recRealm:0,desc:"练气修士的试炼场。",uniqueReward:"qingfengjian",canRepeat:false,layers:[
{name:"灵草谷",risk:"灵草遍地。",events:[{p:60,text:"你采到几株灵草，修为 +30。",cult:30},{p:30,text:"你发现回春草，获得回春丹。",item:"huichundan"},{p:10,text:"石缝中藏着一枚聚气丹。",item:"juqidan"}]},
{name:"狼群巢穴",risk:"黑风狼盘踞。",events:[{p:70,text:"一头黑风狼扑来！",npc:"wolf_iron"},{p:30,text:"三头狼同时扑来！",npc:"wolf_pack"}]},
{name:"古碑残文",risk:"残破古碑。",events:[{p:50,text:"你参悟半日，修为 +40。",cult:40},{p:30,text:"你悟出天地之理，悟性 +1。",comp:1},{p:20,text:"你记下残篇，获得功法。",skill:["changchungong","nalingjue"]}]},
{name:"守宝妖兽",risk:"黑风狼王守着宝物。",events:[{p:100,text:"黑风狼王跃出！",npc:"wolf_king"}]},
{name:"秘境核心",risk:"核心处灵光闪烁。",events:[{p:40,text:"你发现一堆灵石 +50。",spirit:50},{p:30,text:"灵光中浮现法器！",rareLoot:true},{p:20,text:"灵气浓郁，修为 +60。",cult:60},{p:10,text:"你发现小延寿丹！",item:"xiao_yanshou"}]}]},
{id:"lingquandong",name:"灵泉洞",danger:"低",recRealm:0,desc:"洞中灵泉汩汩。",uniqueReward:"wudaodan",canRepeat:false,layers:[
{name:"灵泉入口",risk:"洞口狭窄。",events:[{p:60,text:"你饮下灵泉，气血 +30。",hp:30},{p:40,text:"泉水清冽，修为 +25。",cult:25}]},
{name:"泉心石台",risk:"石台灵光流转。",events:[{p:100,text:"你获得悟道丹。",item:"wudaodan"}]},
{name:"水下暗流",risk:"暗流汹涌。",events:[{p:70,text:"一头水灵扑来！",npc:"ghost_yin"},{p:30,text:"你被卷走，气血 -20，捡到聚气丹。",hp:-20,item:"juqidan"}]}]},
{id:"wanshoushan",name:"万兽山",danger:"中",recRealm:1,desc:"妖兽盘踞之地。",uniqueReward:"wanshouPai",canRepeat:false,layers:[
{name:"山脚兽径",risk:"妖兽巡山。",events:[{p:60,text:"一头铁背熊扑来！",npc:"bear_iron"},{p:40,text:"你采到兽元草，修为 +60。",cult:60}]},
{name:"兽骨谷",risk:"妖气浓郁。",events:[{p:60,text:"你在兽骨中发现妖丹。",item:"yaodan"},{p:40,text:"妖气入体，气血 -15，悟性 +1。",hp:-15,comp:1}]},
{name:"万兽台",risk:"守台妖兽极强。",events:[{p:100,text:"三尾妖狐挡在台前！",npc:"fox_three"}]},
{name:"兽王洞",risk:"兽王就在其中。",events:[{p:100,text:"兽王从黑暗中走出！",npc:"beast_king"}]}]},
{id:"guzhanchang",name:"古战场遗迹",danger:"中",recRealm:1,desc:"上古修士战场。",uniqueReward:"tianjisan",canRepeat:false,layers:[
{name:"战场边缘",risk:"残破法器散落。",events:[{p:60,text:"你捡到残破法器，灵石 +30。",spirit:30},{p:40,text:"古尸从土中爬出！",npc:"puppet_ancient"}]},
{name:"残兵冢",risk:"灵气紊乱。",events:[{p:100,text:"你获得洗髓丹。",item:"xisuidan"}]},
{name:"古碑林",risk:"碑上刻着功法。",events:[{p:60,text:"你参悟古碑，修为 +90。",cult:90},{p:40,text:"古碑反噬，气血 -25，悟性 +1。",hp:-25,comp:1}]},
{name:"将军墓",risk:"有守墓傀儡。",events:[{p:100,text:"守墓傀儡走出！",npc:"puppet_guard"}]}]},
{id:"tianleigu",name:"天雷谷",danger:"高",recRealm:2,desc:"雷劫频发之地。",uniqueReward:"da_yanshou",canRepeat:false,layers:[
{name:"雷区外围",risk:"雷电交加。",events:[{p:60,text:"你引雷淬体，修为 +150。",cult:150},{p:40,text:"天雷劈下！",npc:"ghost_yin"}]},
{name:"雷竹丛",risk:"有雷兽守护。",events:[{p:100,text:"你获得天雷竹。",item:"tianleizhu"}]},
{name:"雷池",risk:"雷光翻涌。",events:[{p:60,text:"你沐浴雷光，气血上限 +20。",maxHp:20},{p:40,text:"雷池反噬，气血 -40。",hp:-40}]},
{name:"雷劫台",risk:"残存雷劫之力。",events:[{p:100,text:"雷劫之力凝聚成雷兽！",npc:"fox_three"}]},
{name:"雷心",risk:"雷谷核心。",events:[{p:50,text:"你获得大延寿丹！",item:"da_yanshou"},{p:50,text:"雷心爆发，气血 -50，修为 +200。",hp:-50,cult:200}]}]},
{id:"yinluodian",name:"阴罗殿",danger:"高",recRealm:2,desc:"魔道遗迹。",uniqueReward:"yinluofan",canRepeat:false,layers:[
{name:"殿门",risk:"阴气森森。",events:[{p:60,text:"阴魂扑来！",npc:"ghost_yin"},{p:40,text:"你吸收阴气，修为 +160，气血 -20。",cult:160,hp:-20}]},
{name:"偏殿",risk:"摆着紫色法衣。",events:[{p:100,text:"你获得紫罗衣。",item:"ziluoyi"}]},
{name:"主殿",risk:"阴罗幡悬空。",events:[{p:100,text:"怨魂扑来！",npc:"ghost_wraith"}]},
{name:"血池",risk:"泡着血魔剑。",events:[{p:100,text:"血魔剑灵斩来！",npc:"demon_blood"}]},
{name:"阴罗核心",risk:"天鬼珠悬空。",events:[{p:100,text:"天鬼珠爆发摄魂之力！",npc:"ghost_wraith"}]}]},
{id:"luanxinghai",name:"乱星海",danger:"极高",recRealm:3,desc:"星海茫茫。",uniqueReward:"wuseKongque",canRepeat:false,layers:[
{name:"星海入口",risk:"需小心迷路。",events:[{p:60,text:"你吸收星光，修为 +280。",cult:280},{p:40,text:"星兽从虚空扑出！",npc:"beast_king"}]},
{name:"陨星带",risk:"陨星碎片飞掠。",events:[{p:50,text:"你捡到陨铁，灵石 +120。",spirit:120},{p:50,text:"陨星碎片击中你，气血 -60。",hp:-60}]},
{name:"星宫遗址",risk:"有守卫。",events:[{p:100,text:"星宫傀儡站起！",npc:"puppet_guard"}]},
{name:"孔雀台",risk:"五色神光流转。",events:[{p:100,text:"你获得五色孔雀翎！",item:"wuseKongque"}]},
{name:"星海核心",risk:"虚空翻涌。",events:[{p:50,text:"你获得乾坤袋！",item:"qiankundai"},{p:50,text:"虚空风暴袭来，气血 -80。",hp:-80}]},
{name:"血魔岛",risk:"血雾弥漫。",events:[{p:100,text:"血魔剑灵现身！",npc:"demon_blood"}]},
{name:"山河图",risk:"图中山河真实不虚。",events:[{p:100,text:"你获得山河扇！",item:"shanhefan"}]},
{name:"虚空裂缝",risk:"虚空乱流。",events:[{p:50,text:"你被卷中，气血 -70，修为 +400。",hp:-70,cult:400},{p:50,text:"你捡到传说法器！",rareLoot:true}]}]},
{id:"tiannanyiji",name:"天南遗迹",danger:"极高",recRealm:3,desc:"上古天南修士遗迹。",uniqueReward:"zhangtianping",canRepeat:false,layers:[
{name:"遗迹外围",risk:"禁制重重。",events:[{p:60,text:"你破解禁制，修为 +350。",cult:350},{p:40,text:"禁制反噬，气血 -50。",hp:-50}]},
{name:"传送阵",risk:"目的地不明。",events:[{p:50,text:"你被传送到宝库，获得落宝金钱！",item:"luobaoJinqian"},{p:50,text:"你被传送到险地，气血 -60，修为 +300。",hp:-60,cult:300}]},
{name:"宝库",risk:"有禁制守护。",events:[{p:100,text:"禁制化为傀儡！",npc:"puppet_guard"}]},
{name:"灵药园",risk:"有灵兽守护。",events:[{p:60,text:"你采到大量灵药，修为 +400。",cult:400},{p:40,text:"灵兽袭来！",npc:"fox_three"}]},
{name:"掌天阁",risk:"藏着掌天瓶仿品。",events:[{p:100,text:"你获得掌天瓶（仿）！",item:"zhangtianping"}]},
{name:"天鬼殿",risk:"天鬼珠悬空。",events:[{p:100,text:"天鬼珠灵现身！",npc:"ghost_wraith"}]}]},
{id:"kunwushan",name:"昆吾山",danger:"传说",recRealm:4,desc:"仙人遗迹。",uniqueReward:"zaohuayudie",canRepeat:false,layers:[
{name:"山门",risk:"禁制完整。",events:[{p:60,text:"你破解禁制，修为 +500。",cult:500},{p:40,text:"禁制反噬，气血 -80。",hp:-80}]},
{name:"试剑石",risk:"剑气纵横。",events:[{p:60,text:"你参悟剑意，攻击力 +5。",atkPerm:5},{p:40,text:"剑气入体，气血 -60，悟性 +2。",hp:-60,comp:2}]},
{name:"造化池",risk:"造化之力翻涌。",events:[{p:100,text:"你沐浴造化之力，全属性 +3%。",allBonus:3}]},
{name:"神山",risk:"元磁神山悬浮。",events:[{p:100,text:"你获得元磁神山！",item:"yuancishenshan"}]},
{name:"破空台",risk:"剑气冲天。",events:[{p:100,text:"你获得破空剑！",item:"pokongjian"}]},
{name:"造化殿",risk:"造化玉碟悬空。",events:[{p:100,text:"你获得造化玉碟！",item:"zaohuayudie"}]}]}
];

/* ============ 道具秘境 ============ */
const TOKEN_REALMS=[
{id:"guanghangong",name:"广寒宫",tokenId:"guanghan_yujian",danger:"低",recRealm:0,desc:"月华之力凝聚之地。",layers:[
{name:"月华长廊",risk:"寒气逼人。",events:[
{p:40,text:"你吸收月华，修为 +80。",cult:80},
{p:30,text:"你采到寒玉，获得回春丹。",item:"huichundan"},
{p:30,text:"霜灵袭来！",npc:"ghost_yin"}]},
{name:"寒潭",risk:"映着一轮冷月。",events:[
{p:40,text:"你淬体，气血上限 +15。",maxHp:15,permanent:true,key:"gh_ht"},
{p:30,text:"寒气入体，气血 -20，悟性 +1。",hp:-20,comp:1},
{p:30,text:"你捡到一件法器！",equipDrop:true}]},
{name:"广寒殿",risk:"月华最浓。",events:[
{p:50,text:"你获得月华丹（修为 +150）。",cult:150},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"wanyaogu",name:"万妖谷",tokenId:"wanyao_gushu",danger:"低",recRealm:0,desc:"万妖汇聚之地。",layers:[
{name:"谷口",risk:"妖兽低吼。",events:[
{p:50,text:"一头小妖扑来！",npc:"wolf_iron"},
{p:30,text:"你捡到一枚妖丹。",item:"yaodan"},
{p:20,text:"你发现一件装备！",equipDrop:true}]},
{name:"兽血池",risk:"兽血沸腾。",events:[
{p:100,text:"你沐浴兽血，气血上限 +20，修为 +100。",maxHp:20,cult:100,permanent:true,key:"wy_ht"}]},
{name:"万妖台",risk:"妖气冲天。",events:[
{p:50,text:"妖将挡在台前！",npc:"fox_three"},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"lingyaoyuan",name:"灵药园",tokenId:"lingyao_nang",danger:"低",recRealm:0,desc:"灵药遍地。",layers:[
{name:"外园",risk:"灵虫出没。",events:[
{p:50,text:"你采到灵药，修为 +50。",cult:50},
{p:30,text:"灵虫袭来！",npc:"wolf_iron"},
{p:20,text:"你采到一株灵草，获得回春丹。",item:"huichundan"}]},
{name:"药田",risk:"药香扑鼻。",events:[
{p:50,text:"你采到大量灵药，获得小还丹。",item:"xiaohuandan"},
{p:50,text:"你采到珍贵药草，获得聚气丹。",item:"juqidan"}]},
{name:"丹房",risk:"灵光闪烁。",events:[
{p:50,text:"你获得悟道丹。",item:"wudaodan"},
{p:50,text:"你打开宝箱，获得丹药！",chest:true}]}]},
{id:"gujianzhong",name:"古剑冢",tokenId:"gujian_yao",danger:"低",recRealm:1,desc:"剑修秘境。",layers:[
{name:"剑冢外围",risk:"剑气犹存。",events:[
{p:50,text:"你参悟剑意，攻击力 +3。",atkPerm:3,permanent:true,key:"gj_atk"},
{p:30,text:"剑灵袭来！",npc:"puppet_guard"},
{p:20,text:"你发现一柄古剑！",equipDrop:true}]},
{name:"剑池",risk:"剑气冲天。",events:[
{p:60,text:"你沐浴剑气，修为 +120。",cult:120},
{p:40,text:"你捡到一把飞剑！",equipDrop:true}]},
{name:"剑冢核心",risk:"插着一把古剑。",events:[
{p:50,text:"你获得青元剑！",item:"qingyuanjian"},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"leifazhidi",name:"雷罚之地",tokenId:"yinlei_fu",danger:"中",recRealm:2,desc:"天雷滚滚。",layers:[
{name:"雷区",risk:"雷电交加。",events:[
{p:50,text:"你引雷淬体，修为 +200。",cult:200},
{p:30,text:"雷灵袭来！",npc:"ghost_yin"},
{p:20,text:"你捡到雷石，获得灵石 +150。",spirit:150}]},
{name:"雷池",risk:"雷光翻涌。",events:[
{p:50,text:"你沐浴雷光，气血上限 +25。",maxHp:25,permanent:true,key:"lf_ht"},
{p:50,text:"你捡到一件法器！",equipDrop:true}]},
{name:"雷心",risk:"雷霆最盛。",events:[
{p:40,text:"你获得天雷竹。",item:"tianleizhu"},
{p:30,text:"你获得大还丹！",item:"dahuandan"},
{p:30,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"taixuhuanjing",name:"太虚幻境",tokenId:"taixu_guJuan",danger:"中",recRealm:2,desc:"幻境试炼。",layers:[
{name:"幻境入口",risk:"虚幻不定。",events:[
{p:100,text:"你踏入幻境，修为 +80。",cult:80}]},
{name:"心魔试炼",risk:"心魔浮现。",events:[
{p:60,text:"你战胜心魔，悟性 +2。",comp:2},
{p:40,text:"你被心魔所困，气血 -30。",hp:-30}]},
{name:"幻境核心",risk:"幻境最真。",events:[
{p:40,text:"你参悟幻境，获得大衍诀。",item:"dayanjue"},
{p:30,text:"你参悟幻境，获得凝元丹。",item:"ningyuandan"},
{p:30,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"wanbaomijing",name:"万宝秘境",tokenId:"wanbao_zhenpan",danger:"中",recRealm:2,desc:"全是宝物。",layers:[
{name:"宝库外",risk:"傀儡巡逻。",events:[
{p:70,text:"傀儡袭来！",npc:"puppet_guard"},
{p:30,text:"你躲过傀儡，捡到灵石 +200。",spirit:200}]},
{name:"宝库内",risk:"宝物陈列。",events:[
{p:50,text:"你获得大量灵石 +250。",spirit:250},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]},
{name:"宝库核心",risk:"宝物最盛。",events:[
{p:40,text:"你获得乾坤袋！",item:"qiankundai"},
{p:30,text:"你获得稀有装备！",equipDrop:true},
{p:30,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"xuemoku",name:"血魔窟",tokenId:"xueomo_gushu",danger:"中",recRealm:2,desc:"魔道秘境。",layers:[
{name:"血窟入口",risk:"血腥气弥漫。",events:[
{p:50,text:"血魔袭来！",npc:"demon_blood"},
{p:30,text:"你吸收血气，修为 +180，气血 -25。",cult:180,hp:-25},
{p:20,text:"你捡到一件装备！",equipDrop:true}]},
{name:"血池",risk:"泡着魔道法器。",events:[
{p:60,text:"你获得血魔剑碎片，灵石 +180。",spirit:180},
{p:40,text:"你获得稀有装备！",equipDrop:true}]},
{name:"血魔殿",risk:"阴罗幡悬空。",events:[
{p:40,text:"你获得阴罗幡（仿）。",item:"yinluofan"},
{p:30,text:"血魔殿主现身！",npc:"demon_blood"},
{p:30,text:"你打开宝箱，获得装备！",chest:true}]}]},
{id:"xinghaicanjing",name:"星海残境",tokenId:"xinghai_luopan",danger:"高",recRealm:3,desc:"星辰之力凝聚。",layers:[
{name:"星海入口",risk:"星辰闪烁。",events:[
{p:50,text:"你吸收星光，修为 +350。",cult:350},
{p:30,text:"星兽袭来！",npc:"beast_king"},
{p:20,text:"你捡到星灵石，灵石 +300。",spirit:300}]},
{name:"星宫",risk:"星光璀璨。",events:[
{p:50,text:"你获得星灵石，灵石 +400。",spirit:400},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]},
{name:"星海核心",risk:"星辰之力最盛。",events:[
{p:30,text:"你获得乾坤袋！",item:"qiankundai"},
{p:35,text:"你获得稀有装备！",equipDrop:true},
{p:35,text:"你打开宝箱，获得传说装备！",chest:true,legendary:true}]}]},
{id:"taichuyiji",name:"太初遗迹",tokenId:"taichu_guling",danger:"极高",recRealm:4,desc:"上古仙人遗迹。",layers:[
{name:"遗迹外围",risk:"禁制重重。",events:[
{p:50,text:"你破解禁制，修为 +500。",cult:500},
{p:30,text:"禁制反噬，气血 -80。",hp:-80},
{p:20,text:"你捡到一件装备！",equipDrop:true}]},
{name:"太初殿",risk:"太初之气翻涌。",events:[
{p:50,text:"你吸收太初之气，全属性 +5%。",allBonus:5,permanent:true,key:"tc_all"},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]},
{name:"遗迹核心",risk:"仙人遗物沉睡。",events:[
{p:30,text:"你获得造化丹！",item:"zaohuadan"},
{p:35,text:"你获得稀有装备！",equipDrop:true},
{p:35,text:"你打开宝箱，获得传说装备！",chest:true,legendary:true}]}]},
{id:"jiuyoudiyu",name:"九幽地狱",tokenId:"jiuYou_guixi",danger:"传说",recRealm:4,desc:"九幽之地。",layers:[
{name:"九幽入口",risk:"阴风阵阵。",events:[
{p:50,text:"阴魂扑来！",npc:"ghost_wraith"},
{p:30,text:"你吸收阴气，修为 +550，气血 -60。",cult:550,hp:-60},
{p:20,text:"你捡到一件装备！",equipDrop:true}]},
{name:"鬼门关",risk:"鬼影重重。",events:[
{p:50,text:"你获得九幽之气，修为 +700。",cult:700},
{p:50,text:"你打开宝箱，获得装备！",chest:true}]},
{name:"九幽核心",risk:"天鬼珠悬浮。",events:[
{p:30,text:"你获得天鬼珠碎片，灵石 +800。",spirit:800},
{p:35,text:"你获得稀有装备！",equipDrop:true},
{p:35,text:"你打开宝箱，获得传说装备！",chest:true,legendary:true}]}]}
];

const REALM_PRODUCE={heifenggu:"灵草、回春丹、青锋剑",lingquandong:"灵泉、聚气丹、悟道丹",wanshoushan:"妖丹、碎星锤、万兽牌",guzhanchang:"洗髓丹、天机伞、功法残篇",tianleigu:"天雷竹、雷灵石、大延寿丹",yinluodian:"紫罗衣、阴罗幡、血魔剑",luanxinghai:"五色孔雀翎、乾坤袋、山河扇",tiannanyiji:"落宝金钱、掌天瓶（仿）、天鬼珠",kunwushan:"元磁神山、破空剑、造化玉碟",guanghangong:"月华丹、冰系法器、寒玉",wanyaogu:"妖丹、兽骨、碎星锤",lingyaoyuan:"回春丹、小还丹、悟道丹",gujianzhong:"青元剑、剑意感悟",leifazhidi:"天雷竹、大还丹、稀有装备",taixuhuanjing:"悟道丹、大衍诀、凝元丹",wanbaomijing:"灵石、稀有装备、传说装备",xuemoku:"血魔剑碎片、阴罗幡、魔道功法",xinghaicanjing:"星灵石、稀有装备、传说装备",taichuyiji:"造化丹、稀有装备、传说装备",jiuyoudiyu:"天鬼珠碎片、稀有装备、传说装备"};

/* ============ 常驻任务 ============ */
const TRAINING_ACTIVITIES={
0:[
{id:"guard",name:"看守宗门大阵",years:3,desc:"值守大阵。",events:[
{p:30,cat:"plain",text:"大阵平稳，你静坐阵眼。",cult:15},
{p:15,cat:"gain",text:"你在大阵边缘发现灵脉。",cult:25},
{p:15,cat:"gain",text:"你参悟大阵纹路。",comp:1},
{p:10,cat:"gain",text:"你巡查时捡到几枚灵石。",spirit:15},
{p:15,cat:"special",text:"敌对宗门骚扰大阵。",combat:"evil_masked",reward:{spirit:30}},
{p:5,cat:"danger",text:"大阵灵气暴动，你被震伤。",hp:-20},
{p:5,cat:"loss",text:"你修行出错，真气紊乱。",cult:-20},
{p:5,cat:"lifespan",text:"你误入禁制，寿元流失。",lifespan:-6}]},
{id:"errand",name:"坊市跑腿",years:3,desc:"送信送货。",events:[
{p:30,cat:"plain",text:"你送信到坊市。",cult:10},
{p:20,cat:"gain",text:"你替修士送货，获得灵石。",spirit:20},
{p:15,cat:"gain",text:"途中听闻修行心得。",cult:20},
{p:15,cat:"special",text:"遇小贩兜售玉简，花 10 灵石买下。",buySkill:true},
{p:5,cat:"danger",text:"你遭遇劫匪。",spirit:-15,hp:-10},
{p:5,cat:"loss",text:"你贪图小利，道心受损。",cult:-15},
{p:5,cat:"lifespan",text:"你路途劳顿，寿元损耗。",lifespan:-4},
{p:5,cat:"gain",text:"你在路边捡到散落灵石。",spirit:10}]},
{id:"herb",name:"深山采药",years:3,desc:"入山采药。",events:[
{p:30,cat:"plain",text:"山中寂静。",cult:10},
{p:20,cat:"gain",text:"你采到一株灵草。",cult:25},
{p:10,cat:"gain",text:"你发现百年药草，卖出灵石。",spirit:20},
{p:10,cat:"gain",text:"你找到灵泉，气血恢复。",hp:15},
{p:20,cat:"special",text:"你遇到妖兽！",combat:"wolf_iron"},
{p:5,cat:"danger",text:"你误入毒瘴。",hp:-25},
{p:5,cat:"loss",text:"你采药出错，修为倒退。",cult:-15}]}],
1:[
{id:"chase_evil",name:"追捕邪修",years:3,desc:"追寻邪修踪迹。",events:[
{p:30,cat:"plain",text:"邪修踪迹难寻。",cult:20},
{p:20,cat:"gain",text:"你发现邪修痕迹。",cult:35},
{p:10,cat:"gain",text:"你缴获邪修赃物。",spirit:40},
{p:15,cat:"special",text:"你在山谷中发现邪修！",combat:"evil_masked",reward:{spirit:50}},
{p:10,cat:"special",text:"你找到一枚玉简。",skill:["changchungong","qingxinzhou"]},
{p:5,cat:"danger",text:"邪修设下埋伏。",hp:-30},
{p:5,cat:"loss",text:"你追击失利，道心受挫。",cult:-30},
{p:5,cat:"lifespan",text:"你强行突破未果，寿元受损。",lifespan:-10}]},
{id:"hunt_demon",name:"深山猎妖",years:4,desc:"猎杀妖兽。",events:[
{p:30,cat:"plain",text:"你搜寻妖兽踪迹。",cult:20},
{p:15,cat:"gain",text:"你猎杀妖兽，获得妖丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你发现妖兽巢穴。",spirit:40},
{p:10,cat:"gain",text:"你斩杀妖兽，修为增长。",cult:40},
{p:15,cat:"special",text:"你遇到强大妖兽！",combat:"fox_three",reward:{cult:30}},
{p:5,cat:"danger",text:"你被妖兽围攻。",hp:-35},
{p:5,cat:"loss",text:"你战斗失利，道心不稳。",cult:-30},
{p:5,cat:"lifespan",text:"你被妖兽重伤，寿元受损。",lifespan:-8}]},
{id:"escort",name:"护送商队",years:5,desc:"护送商队远行。",events:[
{p:30,cat:"plain",text:"商队一路平稳。",cult:25},
{p:20,cat:"gain",text:"商队到达，你获得报酬。",spirit:50},
{p:10,cat:"gain",text:"商队修士指点你几句。",comp:1},
{p:15,cat:"special",text:"劫修袭击商队！",combat:"evil_masked",reward:{spirit:60}},
{p:10,cat:"special",text:"商队路过秘境入口。",intel:true},
{p:5,cat:"danger",text:"商队遭遇强敌。",hp:-40},
{p:5,cat:"loss",text:"物资被劫，你受训斥。",cult:-40},
{p:5,cat:"lifespan",text:"长途跋涉，寿元消耗。",lifespan:-8}]}],
2:[
{id:"explore_ruin",name:"探索遗迹",years:6,desc:"探查上古遗迹。",events:[
{p:30,cat:"plain",text:"遗迹外围荒芜。",cult:30},
{p:15,cat:"gain",text:"你找到残破法器。",spirit:80},
{p:15,cat:"gain",text:"你破解一道禁制。",cult:60},
{p:10,cat:"gain",text:"你捡到一枚储物戒。",spirit:70},
{p:15,cat:"special",text:"遗迹深处有守护傀儡！",combat:"puppet_guard",reward:{spirit:100}},
{p:5,cat:"danger",text:"禁制爆发，你被震伤。",hp:-50},
{p:5,cat:"loss",text:"你误入幻阵，道心受损。",cult:-80},
{p:5,cat:"lifespan",text:"你与强敌激战，元气大伤。",lifespan:-20}]},
{id:"border",name:"镇守边关",years:7,desc:"镇守宗门边关。",events:[
{p:30,cat:"plain",text:"边关平静。",cult:40},
{p:15,cat:"gain",text:"你斩杀来犯散修。",spirit:80},
{p:15,cat:"gain",text:"你立下战功，获得赏赐。",spirit:90},
{p:10,cat:"gain",text:"你参悟军阵之法。",cult:70},
{p:15,cat:"special",text:"敌对宗门大举来袭！",combat:"evil_masked",reward:{spirit:120}},
{p:10,cat:"special",text:"你在战场上捡到玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"敌军破关，你力战负伤。",hp:-60}]},
{id:"alchemy",name:"炼丹协助",years:5,desc:"协助炼丹。",events:[
{p:30,cat:"plain",text:"你协助处理药草。",cult:25},
{p:15,cat:"gain",text:"你协助炼成一炉丹药。",item:"huichundan"},
{p:15,cat:"gain",text:"你参悟丹道。",comp:1},
{p:10,cat:"gain",text:"炼丹师赏你灵石。",spirit:50},
{p:15,cat:"special",text:"你协助炼成破障丹！",item:"pozhangdan"},
{p:10,cat:"special",text:"你在丹房发现古方残卷。",intel:true},
{p:5,cat:"danger",text:"炼丹炉爆炸。",hp:-45}]}],
3:[
{id:"mortal",name:"红尘历练",years:9,desc:"化身凡人。",events:[
{p:30,cat:"plain",text:"你化身凡人，混迹市井。",cult:40},
{p:15,cat:"gain",text:"你见识人间百态。",comp:1},
{p:15,cat:"gain",text:"你偶遇凡人疾苦，心有所悟。",cult:80},
{p:10,cat:"gain",text:"你在红尘中捡到灵石。",spirit:50},
{p:15,cat:"special",text:"你遇到隐世高人。",comp:2},
{p:10,cat:"special",text:"你听闻秘境消息。",intel:true},
{p:5,cat:"danger",text:"你卷入凡人纷争。",hp:-30},
{p:5,cat:"loss",text:"你沉溺红尘，道心受损。",cult:-100},
{p:5,cat:"lifespan",text:"你参悟天道反噬，寿元流失。",lifespan:-30}]},
{id:"rule",name:"坐镇一方",years:8,desc:"坐镇一方。",events:[
{p:30,cat:"plain",text:"你处理日常事务。",cult:50},
{p:15,cat:"gain",text:"你获得灵石供奉。",spirit:120},
{p:15,cat:"gain",text:"你指点后辈。",cult:80},
{p:10,cat:"gain",text:"你处理事务，悟性增长。",comp:1},
{p:15,cat:"special",text:"有修士挑战你的权威！",combat:"evil_solo",reward:{spirit:150}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"辖区出现强敌。",hp:-60}]},
{id:"preach",name:"讲道传法",years:7,desc:"开坛讲道。",events:[
{p:30,cat:"plain",text:"你开坛讲道。",cult:50},
{p:15,cat:"gain",text:"讲道中你忽然顿悟。",comp:1},
{p:15,cat:"gain",text:"弟子供奉灵石。",spirit:100},
{p:10,cat:"gain",text:"你参悟功法。",cult:80},
{p:15,cat:"special",text:"一位散修当众挑战。",combat:"evil_solo",reward:{spirit:120}},
{p:10,cat:"special",text:"你获赠一枚功法。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"邪修混入偷袭。",hp:-50}]}],
4:[
{id:"travel",name:"游历天下",years:14,desc:"遍历山川。",events:[
{p:30,cat:"plain",text:"你云游四方。",cult:60},
{p:15,cat:"gain",text:"你见识各地风土。",cult:150},
{p:15,cat:"gain",text:"你偶得一处灵脉。",spirit:200},
{p:10,cat:"gain",text:"你参悟天地。",comp:2},
{p:15,cat:"special",text:"你遇到大妖拦路！",combat:"fox_three",reward:{spirit:250}},
{p:10,cat:"special",text:"你听闻上古秘境传说。",intel:true},
{p:5,cat:"danger",text:"你误入凶地。",hp:-80},
{p:5,cat:"loss",text:"你道心动摇。",cult:-200},
{p:5,cat:"lifespan",text:"你逆天而行，天道夺寿。",lifespan:-50}]},
{id:"seclusion",name:"闭关悟道",years:18,desc:"闭关静修。",events:[
{p:30,cat:"plain",text:"你闭关静修。",cult:80},
{p:15,cat:"gain",text:"你参悟天地至理。",cult:200},
{p:15,cat:"gain",text:"你顿悟大道。",comp:2},
{p:10,cat:"gain",text:"你凝练法力，气血上限增长。",maxHp:30},
{p:15,cat:"special",text:"心魔来袭，你与其苦战。",hp:-60,comp:1},
{p:10,cat:"special",text:"你在闭关中窥见天机。",intel:true},
{p:5,cat:"danger",text:"你走火入魔，气血大损。",hp:-100},
{p:5,cat:"loss",text:"你参悟出错，修为倒退。",cult:-250}]},
{id:"suppress",name:"镇压大妖",years:12,desc:"镇压祸乱大妖。",events:[
{p:30,cat:"plain",text:"你搜寻大妖踪迹。",cult:60},
{p:15,cat:"gain",text:"你斩杀小妖，获得妖丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你缴获大妖赃物。",spirit:250},
{p:10,cat:"gain",text:"你与大妖数次交手。",cult:150},
{p:15,cat:"special",text:"你与大妖正面对决！",combat:"fox_three",reward:{spirit:300}},
{p:10,cat:"special",text:"你在大妖巢穴发现古令。",item:"taichu_guling"},
{p:5,cat:"danger",text:"大妖爆发，你身负重伤。",hp:-90}]}]
};

/* ============ 随机任务 ============ */
const RANDOM_ACTIVITIES={
0:[
{id:"letter",name:"替长老送信",years:2,desc:"替长老送信。",events:[
{p:35,cat:"plain",text:"你替长老送信。",cult:15},
{p:20,cat:"gain",text:"顺利送达，长老赏你灵石。",spirit:25},
{p:15,cat:"gain",text:"途中听闻修行心得。",cult:25},
{p:15,cat:"special",text:"遇小贩兜售玉简。",buySkill:true},
{p:5,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"你遭遇劫匪。",spirit:-15,hp:-10},
{p:5,cat:"lifespan",text:"你路途劳顿，寿元损耗。",lifespan:-4}]},
{id:"farm",name:"看守灵田",years:3,desc:"看守灵田。",events:[
{p:30,cat:"plain",text:"灵田平稳。",cult:15},
{p:20,cat:"gain",text:"灵草长势喜人。",cult:25},
{p:15,cat:"gain",text:"你采到灵草，炼成回春丹。",item:"huichundan"},
{p:15,cat:"special",text:"灵虫成灾。",combat:"wolf_iron"},
{p:10,cat:"special",text:"灵田下发现灵泉。",hp:20,cult:15},
{p:5,cat:"loss",text:"你疏于修炼，修为倒退。",cult:-15},
{p:5,cat:"danger",text:"灵虫咬伤。",hp:-20}]},
{id:"patrol",name:"跟随师兄巡山",years:4,desc:"跟随师兄巡山。",events:[
{p:30,cat:"plain",text:"巡山无恙。",cult:20},
{p:20,cat:"gain",text:"师兄指点你几句口诀。",comp:1},
{p:15,cat:"gain",text:"你在山间拾得灵石。",spirit:20},
{p:15,cat:"special",text:"你们遭遇妖兽！",combat:"wolf_iron",reward:{cult:20}},
{p:10,cat:"special",text:"你们发现邪修踪迹。",intel:true},
{p:5,cat:"loss",text:"你被师兄训斥，道心不稳。",cult:-20},
{p:5,cat:"danger",text:"你被妖兽抓伤。",hp:-30}]},
{id:"sweep",name:"清理山门石阶",years:2,desc:"清扫石阶。",events:[
{p:35,cat:"plain",text:"你默默清扫石阶。",cult:10},
{p:20,cat:"gain",text:"石阶下发现灵石。",spirit:15},
{p:15,cat:"gain",text:"清扫中你悟得道理。",comp:1},
{p:15,cat:"special",text:"你扫出隐藏符文。",cult:30},
{p:10,cat:"special",text:"你在石阶上发现秘境记载。",intel:true},
{p:5,cat:"danger",text:"你被其他弟子嘲笑。",hp:-10}]},
{id:"library",name:"整理藏经阁",years:3,desc:"整理藏经阁。",events:[
{p:30,cat:"plain",text:"你整理经书。",cult:15},
{p:20,cat:"gain",text:"你翻阅功法。",cult:25},
{p:15,cat:"gain",text:"你发现残篇。",comp:1},
{p:15,cat:"special",text:"你找到玉简，学得功法。",buySkill:true},
{p:10,cat:"special",text:"你发现秘境记载。",intel:true},
{p:5,cat:"loss",text:"你参悟出错。",cult:-20},
{p:5,cat:"danger",text:"你被守阁灵兽所伤。",hp:-15}]},
{id:"medicine",name:"药园耕种",years:3,desc:"在药园耕种。",events:[
{p:30,cat:"plain",text:"你在药园劳作。",cult:15},
{p:20,cat:"gain",text:"你收获一株灵药。",item:"huichundan"},
{p:15,cat:"gain",text:"灵药丰收。",spirit:25},
{p:15,cat:"special",text:"药王指点你几句。",comp:1},
{p:10,cat:"special",text:"药园招来妖兽！",combat:"wolf_iron"},
{p:5,cat:"danger",text:"你被药草毒伤。",hp:-20},
{p:5,cat:"loss",text:"你心不在焉。",cult:-15}]},
{id:"shop",name:"坊市看铺",years:3,desc:"在坊市看铺。",events:[
{p:30,cat:"plain",text:"你看铺无事。",cult:15},
{p:20,cat:"gain",text:"你卖出货物。",spirit:30},
{p:15,cat:"gain",text:"听客人讲述修行。",cult:25},
{p:15,cat:"special",text:"你结识散修，得知秘境消息。",intel:true},
{p:10,cat:"special",text:"你遇到慷慨修士。",spirit:20,cult:15},
{p:5,cat:"danger",text:"店铺被抢。",spirit:-15,hp:-15},
{p:5,cat:"loss",text:"你贪图小利。",cult:-20}]},
{id:"vein",name:"巡查灵脉",years:4,desc:"巡查灵脉。",events:[
{p:30,cat:"plain",text:"你巡查灵脉。",cult:20},
{p:20,cat:"gain",text:"你发现小灵脉。",spirit:30},
{p:15,cat:"gain",text:"灵脉灵气充沛。",cult:30},
{p:15,cat:"special",text:"灵脉中隐藏小洞天。",rareLoot:true},
{p:10,cat:"special",text:"你感应到一丝天机。",intel:true},
{p:5,cat:"danger",text:"灵脉异动，你被震伤。",hp:-25},
{p:5,cat:"loss",text:"你吸收灵气过猛。",cult:-25}]},
{id:"hunt_low",name:"猎杀低阶妖兽",years:3,desc:"猎杀低阶妖兽。",events:[
{p:30,cat:"plain",text:"你搜寻妖兽踪迹。",cult:15},
{p:20,cat:"gain",text:"你猎杀小妖。",spirit:25},
{p:15,cat:"gain",text:"你获得妖丹。",item:"yaodan"},
{p:15,cat:"special",text:"你遇到妖兽群！",combat:"wolf_iron",reward:{spirit:20}},
{p:10,cat:"special",text:"你发现兽巢。",rareLoot:true},
{p:5,cat:"danger",text:"你被妖兽重伤。",hp:-30},
{p:5,cat:"loss",text:"你战斗失利。",cult:-20}]},
{id:"outer_contest",name:"参加外门比试",years:1,desc:"淘汰赛制。",tournament:[
{opponent:"disc_outer_1",text:"第一轮，你对阵外门弟子甲。"},
{opponent:"disc_outer_2",text:"第二轮，你对阵外门弟子乙。"},
{opponent:"disc_outer_chief",text:"决赛，你对阵外门首席。"}]}
],
1:[
{id:"ruin_abandon",name:"探索废弃洞府",years:5,desc:"探索废弃洞府。",events:[
{p:30,cat:"plain",text:"洞府荒废已久。",cult:30},
{p:20,cat:"gain",text:"你找到残破法器。",spirit:50},
{p:15,cat:"gain",text:"你破解禁制。",cult:60},
{p:15,cat:"special",text:"洞府深处有傀儡守卫！",combat:"puppet_guard",reward:{spirit:80}},
{p:10,cat:"special",text:"你发现玉简。",buySkill:true},
{p:5,cat:"danger",text:"洞府坍塌。",hp:-40},
{p:5,cat:"loss",text:"你误入幻阵。",cult:-50}]},
{id:"mine",name:"镇守灵矿",years:4,desc:"镇守灵矿。",events:[
{p:30,cat:"plain",text:"灵矿平稳。",cult:25},
{p:20,cat:"gain",text:"你领到灵石俸禄。",spirit:60},
{p:15,cat:"gain",text:"灵矿灵气充沛。",cult:50},
{p:15,cat:"special",text:"有修士偷矿。",combat:"evil_solo",reward:{spirit:80}},
{p:10,cat:"special",text:"你在矿中感应到天机。",intel:true},
{p:5,cat:"danger",text:"矿洞塌方。",hp:-45},
{p:5,cat:"loss",text:"你修行出错。",cult:-40}]},
{id:"missing",name:"追查失踪修士",years:4,desc:"追查失踪修士。",events:[
{p:30,cat:"plain",text:"你追寻线索。",cult:25},
{p:20,cat:"gain",text:"你找到失踪修士遗物。",spirit:50},
{p:15,cat:"gain",text:"你缴获邪修赃物。",spirit:60},
{p:15,cat:"special",text:"你找到邪修据点！",combat:"evil_masked",reward:{spirit:80}},
{p:10,cat:"special",text:"你找到玉简。",skill:["changchungong","qingxinzhou"]},
{p:5,cat:"danger",text:"邪修设伏。",hp:-50},
{p:5,cat:"lifespan",text:"你强行突破未果。",lifespan:-10}]},
{id:"forge",name:"协助炼器师",years:4,desc:"协助炼器。",events:[
{p:30,cat:"plain",text:"你协助炼器师。",cult:25},
{p:20,cat:"gain",text:"炼器师赏你灵石。",spirit:60},
{p:15,cat:"gain",text:"你参悟器道。",comp:1},
{p:15,cat:"special",text:"你协助炼成法器！",rareLoot:true},
{p:10,cat:"special",text:"你发现器谱。",intel:true},
{p:5,cat:"danger",text:"炼器炉爆炸。",hp:-40},
{p:5,cat:"loss",text:"你炼器失败。",cult:-40}]},
{id:"inner_contest",name:"参加内门大比",years:1,desc:"淘汰赛制。",tournament:[
{opponent:"disc_inner_1",text:"第一轮，你对阵内门弟子甲。"},
{opponent:"disc_inner_2",text:"第二轮，你对阵内门弟子乙。"},
{opponent:"disc_inner_3",text:"第三轮，你对阵内门弟子丙。"},
{opponent:"disc_inner_chief",text:"决赛，你对阵内门首席。"}]},
{id:"supply",name:"护送宗门物资",years:5,desc:"护送宗门物资。",events:[
{p:30,cat:"plain",text:"物资护送平稳。",cult:30},
{p:20,cat:"gain",text:"任务完成，获得报酬。",spirit:80},
{p:15,cat:"gain",text:"途中修士指点你几句。",comp:1},
{p:15,cat:"special",text:"劫修袭击商队！",combat:"evil_masked",reward:{spirit:100}},
{p:10,cat:"special",text:"途中路过秘境入口。",intel:true},
{p:5,cat:"danger",text:"你负伤应战。",hp:-60},
{p:5,cat:"loss",text:"物资被劫。",cult:-40}]},
{id:"kill_evil",name:"猎杀为祸妖兽",years:4,desc:"猎杀为祸妖兽。",events:[
{p:30,cat:"plain",text:"你搜寻妖兽踪迹。",cult:30},
{p:20,cat:"gain",text:"你获得妖丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你缴获兽巢灵石。",spirit:60},
{p:15,cat:"special",text:"你遇到强大妖兽！",combat:"fox_three",reward:{cult:50}},
{p:10,cat:"special",text:"你发现兽巢法器。",rareLoot:true},
{p:5,cat:"danger",text:"妖兽凶猛。",hp:-60},
{p:5,cat:"lifespan",text:"你被妖兽重伤。",lifespan:-8}]},
{id:"market_patrol",name:"巡查坊市",years:4,desc:"巡查坊市。",events:[
{p:30,cat:"plain",text:"坊市平静。",cult:25},
{p:20,cat:"gain",text:"你获得巡查俸禄。",spirit:60},
{p:15,cat:"gain",text:"你处理纠纷。",comp:1},
{p:15,cat:"special",text:"你制服闹事散修。",combat:"evil_solo",reward:{spirit:80}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"你被邪修偷袭。",hp:-40},
{p:5,cat:"loss",text:"你处理失当。",cult:-40}]},
{id:"escape",name:"追捕逃犯",years:4,desc:"追捕逃犯。",events:[
{p:30,cat:"plain",text:"你追寻逃犯线索。",cult:25},
{p:20,cat:"gain",text:"你找到逃犯赃物。",spirit:60},
{p:15,cat:"gain",text:"你立下战功。",spirit:70},
{p:15,cat:"special",text:"你追上逃犯！",combat:"evil_masked",reward:{spirit:100}},
{p:10,cat:"special",text:"你发现玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"逃犯反抗。",hp:-50},
{p:5,cat:"loss",text:"你追击失利。",cult:-50}]},
{id:"help_alchemy",name:"协助炼丹",years:4,desc:"协助炼丹师。",events:[
{p:30,cat:"plain",text:"你协助炼丹。",cult:25},
{p:20,cat:"gain",text:"你炼成丹药。",item:"huichundan"},
{p:15,cat:"gain",text:"你参悟丹道。",comp:1},
{p:15,cat:"special",text:"你炼成破障丹！",item:"pozhangdan"},
{p:10,cat:"special",text:"你发现古方残卷。",intel:true},
{p:5,cat:"danger",text:"丹炉爆炸。",hp:-40},
{p:5,cat:"loss",text:"你炼丹失误。",cult:-40}]},
{id:"secret_library",name:"看守秘库",years:5,desc:"看守秘库。",events:[
{p:30,cat:"plain",text:"秘库平稳。",cult:30},
{p:20,cat:"gain",text:"你翻阅秘库功法。",cult:50},
{p:15,cat:"gain",text:"你参悟功法。",comp:1},
{p:15,cat:"special",text:"有贼人潜入秘库！",combat:"evil_solo",reward:{spirit:100}},
{p:10,cat:"special",text:"你发现秘境记载。",intel:true},
{p:5,cat:"danger",text:"你被贼人暗算。",hp:-50},
{p:5,cat:"loss",text:"秘库失窃，你被责罚。",cult:-50}]}
],
2:[
{id:"chase_traitor",name:"追杀叛逃修士",years:6,desc:"追杀叛逃修士。",events:[
{p:30,cat:"plain",text:"你追寻叛逃踪迹。",cult:40},
{p:20,cat:"gain",text:"你缴获叛逃赃物。",spirit:100},
{p:15,cat:"gain",text:"你立下战功。",spirit:120},
{p:15,cat:"special",text:"你追上叛逃修士！",combat:"evil_solo",reward:{spirit:150}},
{p:10,cat:"special",text:"你在叛逃巢穴发现玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"叛逃修士反抗。",hp:-60},
{p:5,cat:"loss",text:"你追击失利。",cult:-80}]},
{id:"market_lord",name:"坐镇坊市",years:5,desc:"坐镇坊市。",events:[
{p:30,cat:"plain",text:"坊市平静。",cult:40},
{p:20,cat:"gain",text:"你获得供奉。",spirit:120},
{p:15,cat:"gain",text:"你处理事务。",comp:1},
{p:15,cat:"special",text:"有修士闹事！",combat:"evil_solo",reward:{spirit:150}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"你被暗算。",hp:-60},
{p:5,cat:"loss",text:"你处理失当。",cult:-80}]},
{id:"mediate",name:"化解宗门恩怨",years:6,desc:"化解两宗恩怨。",events:[
{p:30,cat:"plain",text:"调解进行中。",cult:40},
{p:20,cat:"gain",text:"你获得两宗馈赠。",spirit:120},
{p:15,cat:"gain",text:"你参悟人情世故。",comp:1},
{p:15,cat:"special",text:"你遇两宗高手切磋！",combat:"evil_solo",reward:{spirit:150}},
{p:10,cat:"special",text:"你听到两宗秘闻。",intel:true},
{p:5,cat:"danger",text:"调解失败。",hp:-60},
{p:5,cat:"loss",text:"调解失败，道心受挫。",cult:-80}]},
{id:"vein_fight",name:"争夺灵脉",years:7,desc:"争夺灵脉。",events:[
{p:30,cat:"plain",text:"灵脉争夺僵持。",cult:50},
{p:20,cat:"gain",text:"你占据一段灵脉。",spirit:150},
{p:15,cat:"gain",text:"你在灵脉中淬体。",cult:80},
{p:15,cat:"special",text:"你与敌方修士激战！",combat:"evil_solo",reward:{spirit:200}},
{p:10,cat:"special",text:"你在灵脉中发现异宝。",rareLoot:true},
{p:5,cat:"danger",text:"你被敌方重伤。",hp:-80},
{p:5,cat:"loss",text:"争夺失利。",cult:-100}]},
{id:"escort_yuanying",name:"护送元婴前辈",years:5,desc:"护送元婴前辈。",events:[
{p:30,cat:"plain",text:"护送顺利。",cult:40},
{p:20,cat:"gain",text:"前辈赏赐灵石。",spirit:150},
{p:15,cat:"gain",text:"前辈指点几句。",comp:1},
{p:15,cat:"special",text:"有修士拦路！",combat:"evil_solo",reward:{spirit:200}},
{p:10,cat:"special",text:"前辈提起秘境。",intel:true},
{p:5,cat:"danger",text:"你护主负伤。",hp:-70},
{p:5,cat:"lifespan",text:"你与强敌激战，元气大伤。",lifespan:-20}]},
{id:"trace_demon",name:"探查魔道踪迹",years:6,desc:"探查魔道踪迹。",events:[
{p:30,cat:"plain",text:"你追寻魔道踪迹。",cult:40},
{p:20,cat:"gain",text:"你缴获魔道赃物。",spirit:120},
{p:15,cat:"gain",text:"你发现魔道据点。",cult:80},
{p:15,cat:"special",text:"你与魔修激战！",combat:"demon_blood",reward:{spirit:180}},
{p:10,cat:"special",text:"你发现魔道玉简。",skill:["xuemogong","qingxinzhou"]},
{p:5,cat:"danger",text:"你被魔修重创。",hp:-80}]},
{id:"dao_contest",name:"参加金丹论道",years:1,desc:"论道盛会。",events:[
{p:30,cat:"plain",text:"你静听他人论道。",cult:40},
{p:20,cat:"gain",text:"你发表见解。",comp:1},
{p:15,cat:"gain",text:"你有所顿悟。",cult:80},
{p:15,cat:"special",text:"你与人论道切磋！",combat:"evil_solo",reward:{spirit:150}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"loss",text:"你论道落败。",cult:-80}]},
{id:"guard_gate",name:"镇守秘境入口",years:6,desc:"镇守秘境入口。",events:[
{p:30,cat:"plain",text:"秘境入口平稳。",cult:40},
{p:20,cat:"gain",text:"你获得镇守俸禄。",spirit:120},
{p:15,cat:"gain",text:"你在入口附近修炼。",cult:80},
{p:15,cat:"special",text:"有修士强闯秘境！",combat:"evil_solo",reward:{spirit:180}},
{p:10,cat:"special",text:"你听到秘境秘闻。",intel:true},
{p:5,cat:"danger",text:"你被强闯者重伤。",hp:-70}]},
{id:"evil_lair",name:"追查邪修据点",years:6,desc:"追查邪修据点。",events:[
{p:30,cat:"plain",text:"你追寻邪修踪迹。",cult:40},
{p:20,cat:"gain",text:"你缴获邪修赃物。",spirit:120},
{p:15,cat:"gain",text:"你发现邪修据点。",cult:80},
{p:15,cat:"special",text:"你攻入邪修据点！",combat:"evil_masked",reward:{spirit:180}},
{p:10,cat:"special",text:"你找到玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"你被邪修重伤。",hp:-80}]},
{id:"help_yuanying",name:"协助元婴渡劫",years:5,desc:"协助元婴前辈渡劫。",events:[
{p:30,cat:"plain",text:"渡劫准备中。",cult:40},
{p:20,cat:"gain",text:"前辈赏赐灵石。",spirit:150},
{p:15,cat:"gain",text:"你观摩天劫。",comp:1},
{p:15,cat:"special",text:"天劫余波波及于你！",combat:"evil_solo",reward:{spirit:200}},
{p:10,cat:"special",text:"前辈告知秘境消息。",intel:true},
{p:5,cat:"danger",text:"你被天劫重创。",hp:-80}]},
{id:"ancient_ruin",name:"探索上古遗迹",years:7,desc:"探索上古遗迹。",events:[
{p:30,cat:"plain",text:"遗迹外围荒芜。",cult:50},
{p:20,cat:"gain",text:"你找到残破法器。",spirit:150},
{p:15,cat:"gain",text:"你破解禁制。",cult:100},
{p:15,cat:"special",text:"遗迹深处有守护傀儡！",combat:"puppet_guard",reward:{spirit:200}},
{p:10,cat:"special",text:"你发现古碑。",comp:1},
{p:5,cat:"danger",text:"禁制爆发。",hp:-80},
{p:5,cat:"loss",text:"你误入幻阵。",cult:-100}]},
{id:"hunt_gold",name:"猎杀金丹妖兽",years:5,desc:"猎杀金丹妖兽。",events:[
{p:30,cat:"plain",text:"你搜寻妖兽踪迹。",cult:40},
{p:20,cat:"gain",text:"你获得妖丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你缴获兽巢灵石。",spirit:120},
{p:15,cat:"special",text:"你遇到强大妖兽！",combat:"fox_three",reward:{cult:80}},
{p:10,cat:"special",text:"你发现兽巢法器。",rareLoot:true},
{p:5,cat:"danger",text:"妖兽凶猛。",hp:-80}]}
],
3:[
{id:"mediate_war",name:"调解宗门纷争",years:8,desc:"调解两宗纷争。",events:[
{p:30,cat:"plain",text:"调解进行中。",cult:60},
{p:20,cat:"gain",text:"两宗馈赠灵石。",spirit:200},
{p:15,cat:"gain",text:"你参悟人情世故。",comp:1},
{p:15,cat:"special",text:"有高手挑战你！",combat:"evil_solo",reward:{spirit:250}},
{p:10,cat:"special",text:"你听到两宗秘闻。",intel:true},
{p:5,cat:"danger",text:"调解失败。",hp:-80},
{p:5,cat:"loss",text:"调解失败，道心受挫。",cult:-100}]},
{id:"guard_realm",name:"镇守秘境入口",years:9,desc:"镇守秘境入口。",events:[
{p:30,cat:"plain",text:"秘境入口平稳。",cult:70},
{p:20,cat:"gain",text:"你获得供奉。",spirit:200},
{p:15,cat:"gain",text:"你在入口附近修炼。",cult:120},
{p:15,cat:"special",text:"有修士强闯！",combat:"evil_solo",reward:{spirit:250}},
{p:10,cat:"special",text:"你听到秘境秘闻。",intel:true},
{p:5,cat:"danger",text:"你被强闯者重伤。",hp:-100}]},
{id:"catch_thief",name:"追捕通缉大盗",years:8,desc:"追捕通缉大盗。",events:[
{p:30,cat:"plain",text:"你追寻大盗踪迹。",cult:60},
{p:20,cat:"gain",text:"你缴获大盗赃物。",spirit:200},
{p:15,cat:"gain",text:"你立下战功。",spirit:250},
{p:15,cat:"special",text:"你追上大盗！",combat:"evil_solo",reward:{spirit:300}},
{p:10,cat:"special",text:"你发现玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"大盗反抗。",hp:-100}]},
{id:"trade_fair",name:"参加元婴交易会",years:1,desc:"交易会盛事。",events:[
{p:30,cat:"plain",text:"交易会上人声鼎沸。",cult:50},
{p:20,cat:"gain",text:"你卖出货物。",spirit:250},
{p:15,cat:"gain",text:"你见识各方修士。",comp:1},
{p:15,cat:"special",text:"你买到稀有法器。",rareLoot:true},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"交易会有人闹事。",hp:-70}]},
{id:"battlefield",name:"探索上古战场",years:10,desc:"探索上古战场。",events:[
{p:30,cat:"plain",text:"战场荒芜。",cult:70},
{p:20,cat:"gain",text:"你找到残破法器。",spirit:250},
{p:15,cat:"gain",text:"你破解禁制。",cult:150},
{p:15,cat:"special",text:"战场游荡古尸！",combat:"puppet_ancient",reward:{spirit:300}},
{p:10,cat:"special",text:"你发现战场法器。",rareLoot:true},
{p:5,cat:"danger",text:"你被战场禁制重伤。",hp:-120}]},
{id:"escort_vip",name:"护送重要人物",years:7,desc:"护送重要人物。",events:[
{p:30,cat:"plain",text:"护送顺利。",cult:60},
{p:20,cat:"gain",text:"人物赏赐灵石。",spirit:250},
{p:15,cat:"gain",text:"人物指点几句。",comp:1},
{p:15,cat:"special",text:"有修士拦路！",combat:"evil_solo",reward:{spirit:300}},
{p:10,cat:"special",text:"人物提起秘境。",intel:true},
{p:5,cat:"danger",text:"你护主负伤。",hp:-100}]},
{id:"hunt_huashen",name:"猎杀化神妖兽",years:9,desc:"猎杀化神妖兽。",events:[
{p:30,cat:"plain",text:"你搜寻妖兽踪迹。",cult:70},
{p:20,cat:"gain",text:"你获得妖丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你缴获兽巢灵石。",spirit:250},
{p:15,cat:"special",text:"你遇到强大妖兽！",combat:"fox_three",reward:{cult:150}},
{p:10,cat:"special",text:"你发现兽巢异宝。",rareLoot:true},
{p:5,cat:"danger",text:"妖兽凶猛。",hp:-120}]},
{id:"mortal_exp",name:"红尘历练",years:8,desc:"化身凡人。",events:[
{p:30,cat:"plain",text:"你化身凡人。",cult:60},
{p:20,cat:"gain",text:"你见识人间百态。",comp:1},
{p:15,cat:"gain",text:"你心有所悟。",cult:120},
{p:15,cat:"special",text:"你遇到隐世高人。",comp:2},
{p:10,cat:"special",text:"你听闻秘境消息。",intel:true},
{p:5,cat:"loss",text:"你卷入凡人纷争。",cult:-100},
{p:5,cat:"danger",text:"你受伤。",hp:-60}]},
{id:"rule_area",name:"坐镇一方",years:7,desc:"坐镇一方。",events:[
{p:30,cat:"plain",text:"你处理日常事务。",cult:60},
{p:20,cat:"gain",text:"你获得灵石供奉。",spirit:250},
{p:15,cat:"gain",text:"你指点后辈。",cult:120},
{p:15,cat:"special",text:"有修士挑战！",combat:"evil_solo",reward:{spirit:300}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"辖区出现强敌。",hp:-100}]},
{id:"preach_dharma",name:"讲道传法",years:6,desc:"开坛讲道。",events:[
{p:30,cat:"plain",text:"你开坛讲道。",cult:60},
{p:20,cat:"gain",text:"你忽然顿悟。",comp:1},
{p:15,cat:"gain",text:"弟子供奉灵石。",spirit:250},
{p:15,cat:"special",text:"一位散修挑战。",combat:"evil_solo",reward:{spirit:300}},
{p:10,cat:"special",text:"你获赠功法。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"邪修混入偷袭。",hp:-100}]},
{id:"race_war",name:"化解种族纷争",years:8,desc:"化解人族与妖族纷争。",events:[
{p:30,cat:"plain",text:"调解进行中。",cult:70},
{p:20,cat:"gain",text:"两族馈赠灵石。",spirit:250},
{p:15,cat:"gain",text:"你参悟族群大道。",comp:1},
{p:15,cat:"special",text:"妖族高手挑战！",combat:"fox_three",reward:{spirit:300}},
{p:10,cat:"special",text:"你听到两族秘闻。",intel:true},
{p:5,cat:"danger",text:"调解失败。",hp:-100}]},
{id:"ancient_ruin2",name:"探索远古遗迹",years:9,desc:"探索远古遗迹。",events:[
{p:30,cat:"plain",text:"遗迹外围荒芜。",cult:70},
{p:20,cat:"gain",text:"你找到残破法器。",spirit:250},
{p:15,cat:"gain",text:"你破解禁制。",cult:150},
{p:15,cat:"special",text:"遗迹深处有守卫！",combat:"puppet_guard",reward:{spirit:300}},
{p:10,cat:"special",text:"你发现远古玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"禁制爆发。",hp:-120}]}
],
4:[
{id:"suppress_rebel",name:"镇压宗门叛乱",years:12,desc:"镇压宗门叛乱。",events:[
{p:30,cat:"plain",text:"叛乱平定中。",cult:100},
{p:20,cat:"gain",text:"你缴获叛乱赃物。",spirit:400},
{p:15,cat:"gain",text:"你立下战功。",spirit:450},
{p:15,cat:"special",text:"你与叛乱首领激战！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你发现叛乱玉简。",skill:["dayanjue","qingxinzhou"]},
{p:5,cat:"danger",text:"你被叛乱者重伤。",hp:-150},
{p:5,cat:"lifespan",text:"你逆天而行，天道夺寿。",lifespan:-50}]},
{id:"immortal_cave",name:"探索仙人洞府",years:15,desc:"探索仙人洞府。",events:[
{p:30,cat:"plain",text:"洞府荒废已久。",cult:120},
{p:20,cat:"gain",text:"你找到仙人遗物。",spirit:500},
{p:15,cat:"gain",text:"你参悟仙纹。",cult:200},
{p:15,cat:"special",text:"洞府深处有仙傀！",combat:"puppet_guard",reward:{spirit:600}},
{p:10,cat:"special",text:"你发现仙人传承玉简。",skill:["dayanjue","xuemogong"]},
{p:5,cat:"danger",text:"仙阵爆发。",hp:-180}]},
{id:"dao_debate",name:"参与化神论道",years:1,desc:"论道盛会。",events:[
{p:30,cat:"plain",text:"你静听他人论道。",cult:100},
{p:20,cat:"gain",text:"你发表见解。",comp:1},
{p:15,cat:"gain",text:"你有所顿悟。",cult:200},
{p:15,cat:"special",text:"你与人论道切磋！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"loss",text:"你论道落败。",cult:-200}]},
{id:"hunt_ancient",name:"猎杀上古凶兽",years:14,desc:"猎杀上古凶兽。",events:[
{p:30,cat:"plain",text:"你搜寻凶兽踪迹。",cult:100},
{p:20,cat:"gain",text:"你获得凶兽内丹。",item:"yaodan"},
{p:15,cat:"gain",text:"你缴获兽巢灵石。",spirit:400},
{p:15,cat:"special",text:"你遇到上古凶兽！",combat:"beast_king",reward:{cult:250}},
{p:10,cat:"special",text:"你发现兽巢异宝。",rareLoot:true},
{p:5,cat:"danger",text:"凶兽凶猛。",hp:-180}]},
{id:"mediate_two",name:"调解两宗大战",years:12,desc:"调解两宗大战。",events:[
{p:30,cat:"plain",text:"调解进行中。",cult:100},
{p:20,cat:"gain",text:"两宗馈赠灵石。",spirit:400},
{p:15,cat:"gain",text:"你参悟人情世故。",comp:1},
{p:15,cat:"special",text:"有高手挑战你！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你听到两宗秘闻。",intel:true},
{p:5,cat:"danger",text:"调解失败。",hp:-150}]},
{id:"escort_tribulation",name:"渡劫护法",years:13,desc:"为他人渡劫护法。",events:[
{p:30,cat:"plain",text:"渡劫准备中。",cult:100},
{p:20,cat:"gain",text:"你获得灵石报酬。",spirit:400},
{p:15,cat:"gain",text:"你观摩天劫。",comp:1},
{p:15,cat:"special",text:"有修士趁火打劫！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你从天劫中悟得道理。",cult:200},
{p:5,cat:"danger",text:"天劫余波波及于你。",hp:-180}]},
{id:"seek_ascend",name:"寻找飞升机缘",years:18,desc:"寻找飞升机缘。",events:[
{p:30,cat:"plain",text:"你遍历山川。",cult:120},
{p:20,cat:"gain",text:"你获得灵石。",spirit:500},
{p:15,cat:"gain",text:"你参悟天地至理。",comp:2},
{p:15,cat:"special",text:"你遇到上古凶兽！",combat:"beast_king",reward:{spirit:600}},
{p:10,cat:"special",text:"你发现飞升机缘线索。",intel:true},
{p:5,cat:"danger",text:"你误入凶地。",hp:-180}]},
{id:"against_heaven",name:"逆天而行",years:10,desc:"逆天而行。",events:[
{p:30,cat:"plain",text:"你感悟天道。",cult:100},
{p:20,cat:"gain",text:"你逆天而行。",cult:250},
{p:15,cat:"gain",text:"你参悟天道。",comp:2},
{p:15,cat:"special",text:"你遭遇天罚！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你从天道中窥见天机。",intel:true},
{p:5,cat:"loss",text:"你逆天而行，遭天道反噬。",cult:-300},
{p:5,cat:"lifespan",text:"你逆天而行，天道夺寿。",lifespan:-50}]},
{id:"ask_dao",name:"问道",years:12,desc:"问道于天地。",events:[
{p:30,cat:"plain",text:"你静坐问道。",cult:100},
{p:20,cat:"gain",text:"你悟道。",cult:250},
{p:15,cat:"gain",text:"你参悟大道。",comp:2},
{p:15,cat:"special",text:"你与同修论道！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你窥见天机。",intel:true},
{p:5,cat:"loss",text:"你道心动摇。",cult:-250}]},
{id:"karma",name:"因果历练",years:11,desc:"感悟因果之道。",events:[
{p:30,cat:"plain",text:"你感受因果。",cult:100},
{p:20,cat:"gain",text:"你参悟因果。",comp:2},
{p:15,cat:"gain",text:"你顺因果而行。",cult:200},
{p:15,cat:"special",text:"你遭遇因果之敌！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你从因果中窥见天机。",intel:true},
{p:5,cat:"loss",text:"你为因果所困。",cult:-250}]},
{id:"reincarnation",name:"轮回感悟",years:12,desc:"感悟轮回之道。",events:[
{p:30,cat:"plain",text:"你静坐感悟轮回。",cult:100},
{p:20,cat:"gain",text:"你参悟轮回。",comp:2},
{p:15,cat:"gain",text:"你从轮回中悟得道理。",cult:250},
{p:15,cat:"special",text:"你遭遇轮回之敌！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你从轮回中窥见天机。",intel:true},
{p:5,cat:"loss",text:"你陷入轮回幻境。",cult:-250}]},
{id:"avatar",name:"化身历练",years:10,desc:"化身历练。",events:[
{p:30,cat:"plain",text:"你化身历练。",cult:100},
{p:20,cat:"gain",text:"你化身归来。",cult:250},
{p:15,cat:"gain",text:"你体悟化身之道。",comp:2},
{p:15,cat:"special",text:"化身遭遇强敌！",combat:"evil_solo",reward:{spirit:500}},
{p:10,cat:"special",text:"你从化身中窥见天机。",intel:true},
{p:5,cat:"loss",text:"化身受创。",cult:-250}]}
]
};

const TRAINING_DROPS={
0:["huichundan","juqidan","tiejian","qingfengjian","pijia","huxinjing","guanghan_yujian","wanyao_gushu","lingyao_nang"],
1:["huichundan","xiaohuandan","wudaodan","pozhangdan","jinggangdao","hantieqiang","tiejia","xuantiedun","qingfengpao","gujian_yao"],
2:["xiaohuandan","dahuandan","xisuidan","ningyuandan","lingxijian","qingyuanjian","suixingchui","xuanguijia","yuanyangchi","yinlei_fu","taixu_guJuan"],
3:["dahuandan","da_yanshou","youmingdao","duanhunbao","jingangjia","taixuandun","tianleizhu","wanshouPai","wanbao_zhenpan","xueomo_gushu"],
4:["dahuandan","jiuzhuandan","zaohuadan","lietianjian","jiuxiaohuanpei","tianxuanzhu","jiuYou_guixi","taichu_guling","xinghai_luopan"]
};
const TRAINING_RARE_DROPS={
0:["juqidan","qingfengjian","tiejingdao","chiyandao","tiebushan","tongdun"],
1:["pozhangdan","feiyugong","xuantiejian","qingfengpao","jingjijia"],
2:["xisuidan","ningyuandan","qingyuanjian","chixiaojian","yuanyangchi","yinyi","ziluoyi"],
3:["da_yanshou","duanhunbao","zidianchui","taixuandun","taixujia"],
4:["zaohuadan","zhuxianjian","yunwendun","tianxuanzhu"]
};

const LIMITED_ACTIVITIES={
0:[{id:"outer_contest_lim",name:"外门大比",years:1,desc:"限时活动。",events:[
{p:30,cat:"plain",text:"你在台下观战。",cult:20},
{p:25,cat:"gain",text:"你胜一场。",cult:60,spirit:50},
{p:20,cat:"special",text:"你连胜数场。",cult:100,comp:1},
{p:15,cat:"special",text:"你遇到强敌！",combat:"evil_solo",reward:{spirit:80}},
{p:5,cat:"loss",text:"你落败。",cult:-50},
{p:5,cat:"danger",text:"你受伤。",hp:-30}]}],
1:[{id:"inner_contest_lim",name:"内门大比",years:1,desc:"限时活动。",events:[
{p:30,cat:"plain",text:"你在台下观战。",cult:40},
{p:25,cat:"gain",text:"你胜一场。",cult:100,spirit:80},
{p:20,cat:"special",text:"你连胜数场。",cult:150,comp:1},
{p:15,cat:"special",text:"你遇到强敌！",combat:"evil_solo",reward:{spirit:150}},
{p:5,cat:"loss",text:"你落败。",cult:-80},
{p:5,cat:"danger",text:"你受伤。",hp:-50}]}],
2:[{id:"dao_contest_lim",name:"金丹论道",years:1,desc:"限时活动。",events:[
{p:30,cat:"plain",text:"你静听他人论道。",cult:60},
{p:25,cat:"gain",text:"你发表见解。",comp:1},
{p:20,cat:"special",text:"你有所顿悟。",cult:150},
{p:15,cat:"special",text:"你与人论道切磋！",combat:"evil_solo",reward:{spirit:200}},
{p:5,cat:"loss",text:"你论道落败。",cult:-120},
{p:5,cat:"danger",text:"你被道韵所伤。",hp:-60}]}],
3:[{id:"trade_fair_lim",name:"元婴交易会",years:1,desc:"限时活动。",events:[
{p:30,cat:"plain",text:"交易会上人声鼎沸。",cult:80},
{p:25,cat:"gain",text:"你卖出货物。",spirit:300},
{p:20,cat:"special",text:"你买到稀有法器。",rareLoot:true},
{p:15,cat:"special",text:"你听到秘境消息。",intel:true},
{p:5,cat:"danger",text:"交易会有人闹事。",hp:-80},
{p:5,cat:"loss",text:"你买亏了。",spirit:-200}]}],
4:[{id:"huashen_debate_lim",name:"化神论道",years:1,desc:"限时活动。",events:[
{p:30,cat:"plain",text:"你静听他人论道。",cult:120},
{p:25,cat:"gain",text:"你发表见解。",comp:2},
{p:20,cat:"special",text:"你有所顿悟。",cult:300},
{p:15,cat:"special",text:"你与人论道切磋！",combat:"evil_solo",reward:{spirit:500}},
{p:5,cat:"loss",text:"你论道落败。",cult:-200},
{p:5,cat:"danger",text:"你被天道反噬。",hp:-150,lifespan:-30}]}]
};

/* ============ 坊市 ============ */
const SHOPS=[
{id:"xiaotanfan",name:"小摊贩",minRealm:0,desc:"邋遢老头摆着地摊。",cls:"shop-xiaotanfan",
items:[{id:"huichundan",price:15},{id:"juqidan",price:25},{id:"qingxindan",price:50},{id:"dun_di_fu",price:80},{id:"tiejian",price:40},{id:"qingfengjian",price:60},{id:"pijia",price:40},{id:"huxinjing",price:60},{id:"guanghan_yujian",price:80},{id:"wanyao_gushu",price:100},{id:"lingyao_nang",price:120}],buyRate:0.4},
{id:"baicaotang",name:"百草堂",minRealm:1,desc:"药香扑鼻。",cls:"shop-baicaotang",
items:[{id:"huichundan",price:15},{id:"xiaohuandan",price:60},{id:"dahuandan",price:150},{id:"wudaodan",price:50},{id:"pozhangdan",price:80},{id:"xisuidan",price:90},{id:"duantidan",price:400},{id:"ningyuandan",price:80},{id:"xiao_yanshou",price:100},{id:"yanshoudan",price:250}],buyRate:0.6},
{id:"zhenbaoge",name:"珍宝阁",minRealm:1,desc:"法器陈列在琉璃柜中。",cls:"shop-zhenbaoge",
items:[{id:"tiejingdao",price:120},{id:"chiyandao",price:150},{id:"tiebushan",price:100},{id:"tongdun",price:120},{id:"jinggangdao",price:180},{id:"hantieqiang",price:220},{id:"feiyugong",price:280},{id:"xuantiejian",price:300},{id:"tiejia",price:180},{id:"xuantiedun",price:220},{id:"qingfengpao",price:250},{id:"jingjijia",price:280},{id:"tu_dun_fu",price:200},{id:"gujian_yao",price:150}],buyRate:0.6},
{id:"wanbaolou",name:"万宝楼",minRealm:2,desc:"掌柜是位金丹修士。",cls:"shop-wanbaolou",
items:[{id:"dahuandan",price:150},{id:"jiuzhuandan",price:500},{id:"lingxijian",price:400},{id:"qingyuanjian",price:600},{id:"suixingchui",price:600},{id:"xuanguijia",price:400},{id:"yuanyangchi",price:600},{id:"yinyi",price:600},{id:"tianleizhu",price:150},{id:"wanshouPai",price:150},{id:"suo_di_fu",price:500},{id:"chuansongfu",price:250},{id:"yinlei_fu",price:300},{id:"taixu_guJuan",price:350}],buyRate:0.5},
{id:"tianjige",name:"天机阁",minRealm:3,desc:"昏暗阁楼。",cls:"shop-tianjige",
items:[{id:"jiuzhuandan",price:500},{id:"guyu",price:120},{id:"julingzhu",price:120},{id:"tianjipan",price:120},{id:"youmingdao",price:800},{id:"duanhunbao",price:1200},{id:"jingangjia",price:800},{id:"taixuandun",price:1200},{id:"shun_yi_fu",price:1200},{id:"mijingcantu",price:200},{id:"yinlufu",price:200},{id:"xinghai_luopan",price:800},{id:"taichu_guling",price:1200}],buyRate:0.6},
{id:"heishi",name:"黑市",minRealm:4,desc:"蒙面修士往来。",cls:"shop-heishi",
items:[{id:"lietianjian",price:2500},{id:"zhuxianjian",price:5000},{id:"jiuxiaohuanpei",price:2500},{id:"yunwendun",price:5000},{id:"da_yanshou",price:500},{id:"zaohuadan",price:1000},{id:"niepandan",price:1200},{id:"tianxuanzhu",price:2000},{id:"da_nuo_yi_fu",price:3000},{id:"jiuriYinji",price:400},{id:"jiuYou_guixi",price:1500}],buyRate:0.7}];
