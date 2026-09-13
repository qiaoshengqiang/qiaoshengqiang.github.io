/* ============================================================
   工具函数
   ============================================================ */
const statsEl=document.getElementById("stats");
const equipBarEl=document.getElementById("equipBar");
const textEl=document.getElementById("text");
const choicesEl=document.getElementById("choices");

let s={};
let trainingAborted=false;
let trainingInProgress=false;
let currentScene="main";
let currentRealmData=null;
let currentLayerIdx=0;
let currentIsToken=false;

function print(msg){const p=document.createElement("p");p.textContent=msg;if(msg==="")p.innerHTML="&nbsp;";textEl.appendChild(p);textEl.scrollTop=textEl.scrollHeight;}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function typePrint(text,speed){if(speed===undefined)speed=18;const p=document.createElement("p");textEl.appendChild(p);for(let i=0;i<text.length;i++){p.textContent+=text[i];textEl.scrollTop=textEl.scrollHeight;if(speed>0)await sleep(speed);}return p;}
function addChoice(text,fn,cls){const btn=document.createElement("button");btn.textContent=text;if(cls)btn.className=cls;btn.onclick=fn;choicesEl.appendChild(btn);const kids=Array.from(choicesEl.children);kids.forEach(k=>{if(!k.classList.contains("section"))k.style.gridColumn="";});const real=kids.filter(k=>!k.classList.contains("section"));if(real.length>1&&real.length%2===1)real[real.length-1].style.gridColumn="1 / -1";}
function addSection(text){const btn=document.createElement("button");btn.textContent=text;btn.className="section";choicesEl.appendChild(btn);}

function getCurrentYear(){return 1+s.lifeSpent;}
function getNominalYear(){return 1+(s.nominalLifeSpent||0);}

/* ============================================================
   装备加成（随境界缩放 + 品级系数 + 浮动）
   ============================================================ */
/* 品级系数：普通 ×1 / 稀有 ×2 / 传说 ×4 */
const RARITY_MULT={"普通":1,"稀有":2,"传说":4,"唯一":1};

/* 计算装备基础加成（不带浮动） */
function getEquipBase(item){
  if(!item || item.baseBonus===undefined) return 0;
  const mult = item.unique ? 1 : (RARITY_MULT[item.rarity]||1);
  return item.baseBonus * mult + (item.perRealmBonus||0) * s.realm;
}

/* 计算装备实际加成（含浮动） */
function getEquipBonus(item){
  if(!item) return 0;
  const base = getEquipBase(item);
  const roll = item.bonusRoll || 1;
  return Math.floor(base * roll);
}

/* 装备效果动态显示 */
function getEquipEffectText(item){
  if(!item) return "";
  if(item.type==="攻击法器"){
    const v = getEquipBonus(item);
    let txt = "伤害 +" + v;
    if(item.name==="赤炎刀") txt += "，每回合 -2 气血";
    if(item.name==="噬魂幡"||item.name==="阴罗幡") txt += "，每回合 -4 气血";
    if(item.name==="血魔剑") txt += "，每回合 -3 气血";
    if(item.name==="玄铁重剑"||item.name==="诛仙剑") txt += "，气血上限 +20";
    if(item.name==="青竹蜂云剑"||item.name==="青元剑") txt += "，对妖物 +10";
    if(item.name==="紫电锤") txt += "，对妖物 +10";
    if(item.name==="碎星锤") txt += "，对妖兽额外 +5";
    if(item.name==="破空剑") txt += "，无视防御";
    if(item.name==="诛仙剑") txt += "，无视 30% 防御";
    if(item.name==="元磁神山") txt += "，重若山岳";
    return txt;
  }
  if(item.type==="防御法器"){
    const v = getEquipBonus(item);
    let txt = "减免 " + v;
    if(item.name==="铁布衫") txt += "，气血上限 +10";
    if(item.name==="玄铁重剑") txt += "，气血上限 +20";
    if(item.name==="清风袍") txt += "，寿元消耗 -15%";
    if(item.name==="山河扇") txt += "，寿元消耗 -30%";
    if(item.name==="荆棘甲") txt += "，反弹 2";
    if(item.name==="元阳尺") txt += "，反弹 3";
    if(item.name==="云纹盾") txt += "，反弹 5";
    if(item.name==="银翼") txt += "，15% 闪避";
    if(item.name==="太虚甲") txt += "，15% 闪避";
    if(item.name==="天机伞") txt += "，10% 闪避";
    if(item.name==="灵光罩") txt += "，每回合恢复 2 气血";
    if(item.name==="紫罗衣"||item.name==="紫罗衣（真）") txt += "，每回合恢复 " + (item.name==="紫罗衣（真）"?5:3) + " 气血";
    return txt;
  }
  return item.effect;
}

/* 获取动态加成摘要（用于物品详情） */
function getDynamicBonusText(item){
  if(!item) return "";
  if(item.type==="攻击法器") return "当前实际伤害加成：+" + getEquipBonus(item);
  if(item.type==="防御法器") return "当前实际减免：" + getEquipBonus(item);
  return "";
}

/* ============================================================
   战斗数值相关
   ============================================================ */
function getAtkBonus(){
  let b=0;
  const a=s.equipment.attack;
  if(a&&ITEMS[a]) b+=getEquipBonus(ITEMS[a]);
  if(s.permAtkBonus) b+=s.permAtkBonus;
  return b;
}
function getDefReduction(){
  let r=0;
  const d=s.equipment.defense;
  if(d&&ITEMS[d]) r+=getEquipBonus(ITEMS[d]);
  return r;
}
function getHpPerTurn(){
  let h=0;
  const atk=s.equipment.attack;
  const def=s.equipment.defense;
  if(atk==="chiyandao") h-=2;
  if(atk==="yinluofan") h-=4;
  if(atk==="xuemojian") h-=3;
  if(atk==="yuancishenshan") h-=6;
  if(def==="lingguangzhao") h+=2;
  if(def==="ziluoyi") h+=3;
  if(def==="ziluoyi_unique") h+=5;
  if(s.learnedSkills.includes("xuemogong")) h-=1;
  return h;
}
function getLifeCostMod(){
  let m=0;
  if(s.equipment.defense==="qingfengpao") m+=15;
  if(s.equipment.defense==="shanhefan") m+=30;
  if(s.learnedSkills.includes("guixishu")) m+=10;
  if(s.equipment.special==="zaohuayudie") m+=15;
  return Math.min(50,m);
}
function getBreakthroughBonus(){
  let b=0;
  if(s.equipment.special==="yaodan") b+=10;
  if(s.equipment.special==="wuseKongque") b+=15;
  if(s.learnedSkills.includes("qingxinzhou")) b+=5;
  return b;
}
function getMeditateBonus(){
  let b=0;
  if(s.equipment.special==="julingzhu") b+=30;
  if(s.learnedSkills.includes("nalingjue")) b+=10;
  return b;
}
function getDropBonus(){
  let b=0;
  if(s.equipment.special==="xunbaoluopan") b+=15;
  if(s.equipment.special==="qiankundai") b+=15;
  return b;
}
function getPlayerAttack(){
  return Math.floor((5+s.realm*3)*(1+s.realm*0.15)) + getAtkBonus();
}
/* ============================================================
   NPC 生成（按境界缩放 + 洞天古迹难度加成）
   ============================================================ */
function getNPC(npcId, layerIdx){
  const data = NPC_DATA[npcId];
  if(!data) return null;
  const curve = NPC_SCALE[data.type] || [1,1.6,2.6,4,6];
  let m = curve[s.realm];
  if(layerIdx !== undefined && layerIdx !== null){
    m *= DUNGEON_DIFFICULTY * (1 + DUNGEON_LAYER_BONUS * layerIdx);
  }
  return {
    id: npcId,
    name: data.name,
    type: data.type,
    rank: data.rank,
    hp: Math.floor(data.base.hp * m),
    atk: Math.floor(data.base.atk * m),
    drops: data.drops || [],
    desc: data.desc,
    strong: data.strong || false
  };
}
function spendLife(years){
  const mod=getLifeCostMod();
  const actual=years*(1-mod/100);
  s.lifespan-=actual;
  s.lifeSpent+=years;
  s.nominalLifeSpent=(s.nominalLifeSpent||0)+years;
  return actual;
}

/* ============================================================
   状态栏 / 装备栏
   ============================================================ */
function updateStats(){
  const req=REQ[s.realm];
  const cultText=req===Infinity?"圆满":Math.floor(s.cultivation)+" / "+req;
  const year=getCurrentYear();
  const hpRatio=s.hp/s.maxHp;
  let hpClass=""; if(hpRatio<0.3)hpClass="danger"; else if(hpRatio<0.5)hpClass="warn";
  let lifeClass=""; if(s.lifespan<20)lifeClass="danger"; else if(s.lifespan<50)lifeClass="warn";
  statsEl.innerHTML=`
    <div class="stat"><span>境界</span><span>${REALM_INFO[s.realm]}期</span></div>
    <div class="stat"><span>修为</span><span>${cultText}</span></div>
    <div class="stat ${hpClass}"><span>气血</span><span>${Math.max(0,s.hp)} / ${s.maxHp}</span></div>
    <div class="stat"><span>战力</span><span>攻${getPlayerAttack()} 防${getDefReduction()}</span></div>
    <div class="stat"><span>灵石</span><span>${s.spirit}</span></div>
    <div class="stat ${lifeClass}"><span>寿元</span><span>${Math.floor(s.lifespan)} 年</span></div>
    <div class="stat"><span>年份</span><span>第 ${year} 年</span></div>
    <div class="stat"><span>悟性</span><span>${s.comprehension}</span></div>
    <div class="stat skill-btn" id="skillBtn"><span>功法</span><span>${s.learnedSkills.length} 门 ▸</span></div>
    <div class="stat skill-btn" id="bagBtn"><span>储物袋</span><span>▸</span></div>
  `;
  const sb=document.getElementById("skillBtn");
  if(sb) sb.onclick=showSkills;
  const bb=document.getElementById("bagBtn");
    if(bb) bb.onclick=()=>{
      /* 正在历练输出中：只打开储物袋，关闭后什么都不做，等异步流程自己继续 */
      if(trainingInProgress){
        showInventory(()=>{});
        return;
      }
      /* 秘境中：回到当前层 */
      if(currentScene==="dungeon" && currentRealmData && currentRealmData.layers[currentLayerIdx]){
        const realm=currentRealmData;
        const layer=realm.layers[currentLayerIdx];
        showInventory(()=>showLayerChoices(realm,currentLayerIdx,layer,currentIsToken));
        return;
      }
      /* 历练菜单中：回到历练菜单 */
      if(currentScene==="training"){
        showInventory(()=>trainingMenu());
        return;
      }
      /* 其他情况：回主界面 */
      showInventory();
    };  updateEquipBar();
}
function updateEquipBar(){
  const slots=[{key:"attack",label:"攻"},{key:"defense",label:"防"},{key:"special",label:"特"}];
  equipBarEl.innerHTML="";
  slots.forEach(({key,label})=>{
    const id=s.equipment[key];
    const div=document.createElement("div");
    div.className="equip-slot-mini";
    if(id){
      const it=ITEMS[id];
      const rc=it.rarity==="唯一"?"唯一":it.rarity;
      div.innerHTML=`<span class="mini-label">${label}</span><span class="mini-name slot-rarity-${rc}">${it.name}</span>`;
    }else{
      div.innerHTML=`<span class="mini-label">${label}</span><span class="mini-empty">空</span>`;
    }
    div.onclick=()=>showInventory();
    equipBarEl.appendChild(div);
  });
}

/* ============================================================
   初始化
   ============================================================ */
function init(){
  s={
    realm:0,cultivation:0,hp:100,maxHp:100,spirit:30,lifespan:100,lifeSpent:0,nominalLifeSpent:0,
    comprehension:5,turn:0,failCount:0,ended:false,
    inventory:[],equipment:{attack:null,defense:null,special:null},
    learnedSkills:[],pendingItem:null,pendingCallback:null,
    bonusBreakthrough:0,permAtkBonus:0,allBonus:0,
    uniqueObtained:{},uniqueLost:{},lifespanUsed:{},
    knownRealms:{},realmProgress:{},obtainedBuffs:{},
    randomTasks:[],randomTasksRefreshYear:0,randomTasksRealm:-1,randomTasksRefreshCount:0
  };
  trainingAborted=false; trainingInProgress=false; currentScene="main";
  textEl.innerHTML=""; choicesEl.innerHTML="";
  print("【修仙奇遇录】");print("");
  print("你自幼体弱，被路过的青云门长老看中，带入山门。");
  print("从此，你踏上了修仙之路。");print("");
  print("修仙界残酷，寿元耗尽则身死道消。突破境界可延寿。");
  print("");print("—— 愿你仙途顺遂 ——");print("");
  updateStats(); showActions();
}
function turnEnd(){
  s.turn++;
  const hpDelta=getHpPerTurn();
  if(hpDelta!==0){
    s.hp+=hpDelta;
    if(hpDelta>0) print("（每回合恢复 "+hpDelta+" 气血）");
    else print("（每回合损失 "+Math.abs(hpDelta)+" 气血）");
  }
  updateStats();
  if(checkEnd()) return;
  showActions();
}
function checkEnd(){
  if(s.ended) return true;
  if(s.lifespan<=0){endGameByScene("寿元耗尽");return true;}
  if(s.hp<=0){endGameByScene("身死道消");return true;}
  if(s.failCount>=3){endGame("走火入魔","连续突破失败，真气逆冲，你经脉寸断，神智尽失，沦为山野间的一具行尸。");return true;}
  return false;
}
function endGameByScene(type){
  if(type==="寿元耗尽"){
    let desc="";
    if(currentScene==="training") desc="你正在历练途中，忽觉寿元将尽，脚步渐沉，气息渐弱。你倒在路边，再未起身。";
    else if(currentScene==="dungeon") desc="你身处秘境深处，气血衰败，寿元枯竭，再也无力前行。你倒在了无人知晓的角落。";
    else if(currentScene==="breakthrough") desc="你强冲瓶颈，寿元却已枯竭。真气散尽，你盘坐而逝，未能跨过那道门槛。";
    else desc="你盘坐于洞府之中，鬓发皆白，气息渐弱。最终化作一抔黄土，与山川同寂。";
    endGame("寿元耗尽",desc);
  }else{
    let desc="";
    if(currentScene==="training") desc="你在历练途中遭遇强敌，力战不敌，倒在了血泊之中。";
    else if(currentScene==="dungeon") desc="你在秘境深处被守卫击倒，倒在了阴暗的石室之中。";
    else if(currentScene==="breakthrough") desc="突破失败，真气反噬，你经脉寸断，当场殒命。";
    else desc="你倒在血泊之中，眼前走马灯般闪过此生种种。修仙路断，魂魄归墟。";
    endGame("身死道消",desc);
  }
}
function endGame(title,desc){
  s.ended=true; print("");
  const p=document.createElement("p");
  p.className="ending"; p.textContent="【结局 · "+title+"】";
  textEl.appendChild(p);
  print(desc); print("");
  print("共经历 "+s.turn+" 回合，终年 "+(16+s.lifeSpent)+" 岁。"); print("");
  choicesEl.innerHTML=""; addChoice("重新开始",init);
  textEl.scrollTop=textEl.scrollHeight;
}

/* ============================================================
   主菜单
   ============================================================ */
function showActions(){
  choicesEl.innerHTML=""; if(s.ended) return; currentScene="main";
    currentRealmData=null;
  const costs=LIFE_COST[s.realm];
  addChoice("打坐修炼（-"+costs[0]+" 年）",meditate);
  addChoice("外出历练",trainingMenu);
  const timeRealms=getAvailableTimeRealms();
  const tokenRealms=getAvailableTokenRealms();
  if(timeRealms.length>0||tokenRealms.length>0){
    let label="探索秘境（";
    if(timeRealms.length>0) label+="洞天 "+timeRealms.length;
    if(timeRealms.length>0&&tokenRealms.length>0) label+=" · ";
    if(tokenRealms.length>0) label+="道具 "+tokenRealms.length;
    label+="）";
    addChoice(label,exploreMenu);
  }else{
    addChoice("探索秘境（暂无可进）",()=>{print("目前没有可进入的秘境。");print("");showActions();});
  }
//  addChoice("储物袋 / 装备",()=>showInventory());
  addChoice("图鉴",showCodex);
  addChoice("坊市交易",market);
  if(s.cultivation>=REQ[s.realm]){
    const label=s.realm===4?"★ 渡劫飞升 ★":"★ 突破 · "+REALM_INFO[s.realm+1]+"期 ★";
    addChoice(label,breakthrough);
  }
}

/* ============================================================
   打坐
   ============================================================ */
function meditate(){
  currentScene="main";
  spendLife(LIFE_COST[s.realm][0]);
  let gain=2+s.comprehension+Math.floor(Math.random()*4);
  const bp=getMeditateBonus();
  if(bp>0) gain=Math.floor(gain*(1+bp/100));
  s.cultivation+=gain;
  print("你盘膝而坐，吐纳灵气，周天运转。");
  print("修为 +"+gain+"。"); print("");
  turnEnd();
}

/* ============================================================
   随机任务
   ============================================================ */
function generateRandomTasks(){
  s.randomTasksRefreshCount=(s.randomTasksRefreshCount||0)+1;
  const pool=RANDOM_ACTIVITIES[s.realm]||[];
  const prevIds=(s.randomTasks||[]).map(t=>t.id);
  const available=pool.filter(t=>!prevIds.includes(t.id));
  const usePool=available.length>=3?available:pool;
  const count=1+Math.floor(Math.random()*3);
  const shuffled=[...usePool].sort(()=>Math.random()-0.5);
  s.randomTasks=shuffled.slice(0,count).map(t=>({...t,bonus:1.3+Math.random()*0.2}));
  if(s.randomTasksRefreshCount%3===0){
    const limited=LIMITED_ACTIVITIES[s.realm]||[];
    if(limited.length>0){
      const act=limited[Math.floor(Math.random()*limited.length)];
      s.randomTasks.push({...act,bonus:1.6,limited:true});
    }
  }
  s.randomTasksRealm=s.realm;
  s.randomTasksRefreshYear=getNominalYear()+RANDOM_REFRESH[s.realm];
}
function refreshRandomTasks(){
  const now=getNominalYear();
  if(s.randomTasksRealm===s.realm&&now<s.randomTasksRefreshYear&&s.randomTasks.length>0) return;
  generateRandomTasks();
}

/* ============================================================
   历练
   ============================================================ */
function trainingMenu(){
    choicesEl.innerHTML="";
      refreshRandomTasks();
      print("【外出历练】");
      print("当前年份：第 "+getCurrentYear()+" 年。"); print("");
  const acts=TRAINING_ACTIVITIES[s.realm]||[];
  addSection("── 常驻任务 ──");
  acts.forEach(act=>{addChoice(act.name+"（约 "+act.years+" 年）",()=>startTraining(act,false));});
  if(s.randomTasks.length>0){
    addSection("── 随机任务 ──");
    s.randomTasks.forEach(task=>{
      const label=task.limited?("☆ "+task.name+"（限时 · 约 "+task.years+" 年）"):("★ "+task.name+"（约 "+task.years+" 年）");
      const cls=task.limited?"limited":"random";
      addChoice(label,()=>startTraining(task,true),cls);
    });
  }
//  addChoice("打开储物袋",()=>{showInventory(()=>trainingMenu());});
  addChoice("返回洞府",()=>{print("你转身返回洞府。");print("");showActions();});
}
function distributeYears(total,count){
  const years=new Array(count).fill(Math.floor(total/count));
  let rem=total-years.reduce((a,b)=>a+b,0); let i=0;
  while(rem>0){if(i%2===0)years[Math.floor(i/2)]++;else years[count-1-Math.floor(i/2)]++;rem--;i++;}
  return years;
}
function pickEvent(events){
  const total=events.reduce((a,b)=>a+b.p,0);
  let roll=Math.random()*total;
  for(const e of events){roll-=e.p;if(roll<0)return e;}
  return events[0];
}
function applyEventEffects(ev,summary,bonus){
  bonus=bonus||1;
  if(ev.cult){const v=ev.cult>0?Math.floor(ev.cult*0.7*bonus):ev.cult;s.cultivation+=v;summary.cult+=v;if(s.cultivation<0)s.cultivation=0;}
  if(ev.spirit){const v=ev.spirit>0?Math.floor(ev.spirit*bonus):ev.spirit;s.spirit+=v;summary.spirit+=v;if(s.spirit<0)s.spirit=0;}
  if(ev.hp){s.hp+=ev.hp;summary.hp+=ev.hp;}
  if(ev.comp){s.comprehension+=ev.comp;summary.comp+=ev.comp;}
  if(ev.maxHp){s.maxHp+=ev.maxHp;}
  if(ev.lifespan){s.lifespan+=ev.lifespan;summary.lifespan=(summary.lifespan||0)+ev.lifespan;}
  if(ev.item){addItemToInventory(ev.item);summary.items.push(ev.item);}
  if(ev.skill){
    const id=ev.skill[Math.floor(Math.random()*ev.skill.length)];
    if(!s.learnedSkills.includes(id)){learnSkill(id,true);summary.skills.push(id);}
  }
}
function addItemToInventory(id){
  const slot=s.inventory.find(x=>x.id===id);
  if(slot){slot.count++;}else{s.inventory.push({id,count:1});}
}
function tryDropItem(pool,summary){
  if(!pool||pool.length===0) return null;
  const id=pool[Math.floor(Math.random()*pool.length)];
  addItemToInventory(id); summary.items.push(id);
  return id;
}
/* 掉落装备：从当前境界对应品级池中随机 */
function dropEquip(realm,rarities,summary){
  const pool=[];
  Object.keys(ITEMS).forEach(id=>{
    const it=ITEMS[id];
    if(it.type!=="攻击法器"&&it.type!=="防御法器") return;
    if(it.unique) return;
    if(it.realm!==realm) return;
    if(rarities&&!rarities.includes(it.rarity)) return;
    pool.push(id);
  });
  if(pool.length===0) return null;
  const id=pool[Math.floor(Math.random()*pool.length)];
  addItemToInventory(id);
  if(summary) summary.items.push(id);
  return id;
}

/* ============================================================
   强敌事件
   ============================================================ */
function getStrongEnemyRealm(){return Math.min(s.realm+1,4);}
function findEscapeItem(enemyRealm){
  const escapes=["dun_di_fu","tu_dun_fu","suo_di_fu","shun_yi_fu","da_nuo_yi_fu"];
  for(const id of escapes){
    const item=ITEMS[id];
    if(item&&item.escapeRealm>=enemyRealm){
      const slot=s.inventory.find(x=>x.id===id&&x.count>0);
      if(slot) return id;
    }
  }
  return null;
}
async function triggerStrongEnemy(){
  const enemyRealm=getStrongEnemyRealm();
  print(""); await typePrint("忽然，一位修为深不可测的蒙面强者出现在你面前！",18);
  await sleep(400); await typePrint("他冷冷看了你一眼，你只觉浑身僵硬，动弹不得。",18);
  await sleep(400);
  const escapeId=findEscapeItem(enemyRealm);
  if(escapeId){
    const slot=s.inventory.find(x=>x.id===escapeId);
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    await typePrint("你捏碎一张【"+ITEMS[escapeId].name+"】，瞬间传送千里，逃过一劫。",18);
    await sleep(400); updateStats(); return;
  }
  await typePrint("你没有逃脱符，只得咬紧牙关，正面迎敌！",18);
  await sleep(400);
  const npc=getNPC("strong_masked");
  if(npc){
    const log=doCombat(npc);
    await typePrint(log,18);
    await sleep(400);
    /* ===== 新增：打死强敌走掉落 ===== */
    if(s.hp>0){
      await typePrint("你击败了蒙面强者！",18);
      await sleep(300);
      const pool=TRAINING_RARE_DROPS[s.realm];
      const dropId=tryDropItem(pool,{items:[],skills:[]});
      if(dropId){
        await typePrint("你从他身上搜出【"+ITEMS[dropId].name+"】。",18);
        await sleep(300);
      }
      /* 额外奖励：妖丹 + 灵石 */
      addItemToInventory("yaodan");
      const bonusSpirit=100+s.realm*50;
      s.spirit+=bonusSpirit;
      await typePrint("额外获得【妖丹】×1，灵石 +"+bonusSpirit+"。",18);
      await sleep(300);
    }
    /* ===== 新增结束 ===== */
  }
  updateStats();
}
function showHpPauseMenu(resolve){
  choicesEl.innerHTML="";
  addChoice("打开储物袋",()=>{showInventory(()=>showHpPauseMenu(resolve));});
  addChoice("继续历练",()=>{choicesEl.innerHTML="";resolve(true);});
  addChoice("中止历练",()=>{choicesEl.innerHTML="";trainingAborted=true;resolve(false);});
}
function checkHpPause(){
  return new Promise(resolve=>{
    if(s.hp/s.maxHp<0.3&&s.hp>0){showHpPauseMenu(resolve);}
    else{resolve(true);}
  });
}

/* ============================================================
   历练主流程
   ============================================================ */
async function startTraining(activity,isRandom){
  if(trainingInProgress) return;
  trainingInProgress=true; trainingAborted=false; choicesEl.innerHTML="";
  currentScene="training";
  const totalYears=activity.years;
  const bonus=isRandom?(activity.bonus||1.3):1;
  const dropBonus=isRandom?0.15:0;
  spendLife(totalYears);
  print("");
  const title=activity.limited?("☆ "+activity.name):(isRandom?("★ "+activity.name):activity.name);
  await typePrint("你开始【"+title+"】，此行约 "+totalYears+" 年……",18);
  await sleep(500); print("");
  const summary={cult:0,spirit:0,hp:0,comp:0,lifespan:0,items:[],skills:[],events:0,wins:0};

  if(activity.tournament){
    for(let round=0;round<activity.tournament.length;round++){
      const t=activity.tournament[round];
      await typePrint(t.text,18); await sleep(400);
      const npc=getNPC(t.opponent); if(!npc) continue;
      const log=doCombat(npc); await typePrint(log,18); await sleep(400);
      if(s.hp<=0){await typePrint("你倒下了……",18);trainingInProgress=false;checkEnd();return;}
      if(s.hp/s.maxHp<0.3){const cont=await checkHpPause();if(!cont||trainingAborted)break;}
      summary.wins++;
      const winReward=[30,60,100,200][summary.wins-1]||200;
      const winSpirit=[20,40,70,150][summary.wins-1]||150;
      s.cultivation+=Math.floor(winReward*0.7); s.spirit+=winSpirit;
      summary.cult+=Math.floor(winReward*0.7); summary.spirit+=winSpirit;
      if(summary.wins>=2){s.comprehension+=1;summary.comp=(summary.comp||0)+1;}
    }
    if(trainingAborted){
      trainingAborted=false; print("");
      await typePrint("你中止了历练，返回。",18); print("");
      trainingInProgress=false; returnToTraining(); return;
    }
    if(summary.wins===activity.tournament.length){
      const champItem=dropEquip(s.realm,["稀有","传说"],summary);
      await typePrint("★★★ 你夺得了冠军！ ★★★",18); await sleep(400);
      if(champItem){await typePrint("冠军奖励：【"+ITEMS[champItem].name+"】",18);await sleep(300);}
    }
    if(isRandom){s.randomTasks=s.randomTasks.filter(t=>t.id!==activity.id);if(s.randomTasks.length===0)generateRandomTasks();}
    trainingInProgress=false;
    await showTrainingSummary(summary,totalYears,activity,isRandom);
    return;
  }

  const eventCount=Math.min(totalYears,Math.max(2,Math.round(totalYears/2.5)));
  const yearDist=distributeYears(totalYears,eventCount);
  let cumYear=0;
  for(let i=0;i<eventCount;i++){
    if(trainingAborted) break;
    const evYears=yearDist[i];
    const startYear=cumYear+1, endYear=cumYear+evYears;
    cumYear=endYear;
    let yearLabel;
    if(evYears===1) yearLabel="第 "+startYear+" 年";
    else if(i===0) yearLabel="前 "+evYears+" 年";
    else if(i===eventCount-1) yearLabel="最后 "+evYears+" 年";
    else yearLabel="第 "+startYear+" 到 "+endYear+" 年";

    if(Math.random()<0.025){
      await triggerStrongEnemy();
      if(checkEnd()){trainingInProgress=false;return;}
      const cont1=await checkHpPause(); if(!cont1||trainingAborted) break;
      continue;
    }
    const ev=pickEvent(activity.events);
    summary.events++;
    await typePrint(yearLabel+"，"+ev.text,18); await sleep(350);
    applyEventEffects(ev,summary,bonus); updateStats();
    if(checkEnd()){trainingInProgress=false;return;}

    if(ev.combat){
      const npc=getNPC(ev.combat);
      if(npc){
        const log=doCombat(npc); await typePrint(log,18); await sleep(350);
        if(Math.random()<0.40+dropBonus+getDropBonus()/100){
          const dropId=tryDropItem(npc.drops.length>0?npc.drops:TRAINING_DROPS[s.realm],summary);
          if(dropId){await typePrint("你在战斗中摸尸，获得【"+ITEMS[dropId].name+"】。",18);await sleep(300);}
        }
      }
      if(ev.reward){
        if(ev.reward.spirit){const v=Math.floor(ev.reward.spirit*bonus);s.spirit+=v;summary.spirit+=v;}
        if(ev.reward.cult){const v=Math.floor(ev.reward.cult*bonus);s.cultivation+=v;summary.cult+=v;}
      }
      updateStats();
      if(checkEnd()){trainingInProgress=false;return;}
    }else{
      let dropRate=0;
      let pool=TRAINING_DROPS[s.realm];
      if(ev.cat==="gain") dropRate=0.15+dropBonus;
      else if(ev.cat==="special") dropRate=0.30+dropBonus;
      else if(ev.cat==="danger"){dropRate=0.35+dropBonus;pool=TRAINING_RARE_DROPS[s.realm];}
      dropRate+=getDropBonus()/100;
      if(dropRate>0&&Math.random()<dropRate){
        const dropId=tryDropItem(pool,summary);
        if(dropId){await typePrint("你在途中获得【"+ITEMS[dropId].name+"】。",18);await sleep(300);updateStats();}
      }
    }
    if(ev.buySkill){
      if(s.spirit>=10){
        s.spirit-=10;
        const pool=["changchungong","dayanjue","guixishu","nalingjue"];
        const id=pool[Math.floor(Math.random()*pool.length)];
        if(!s.learnedSkills.includes(id)){
          learnSkill(id,true); summary.skills.push(id);
          await typePrint("你买下玉简，研读后学会【"+ITEMS[id].name+"】。",18);
        }else{
          await typePrint("你买下的玉简中功法，你已学过。",18);
        }
      }else{
        await typePrint("你摸了摸空空的储物袋，只好作罢。",18);
      }
      await sleep(350);
    }
    if(checkEnd()){trainingInProgress=false;return;}
    const cont=await checkHpPause();
    if(!cont||trainingAborted) break;
  }
  if(trainingAborted){
    trainingAborted=false; print("");
    await typePrint("你中止了历练，返回。",18); print("");
    trainingInProgress=false; returnToTraining(); return;
  }
  if(isRandom){s.randomTasks=s.randomTasks.filter(t=>t.id!==activity.id);if(s.randomTasks.length===0)generateRandomTasks();}
  trainingInProgress=false;
  await showTrainingSummary(summary,totalYears,activity,isRandom);
}
function returnToTraining(){
  s.turn++;
  const hpDelta=getHpPerTurn();
  if(hpDelta!==0) s.hp+=hpDelta;
  updateStats();
  if(checkEnd()) return;
  trainingMenu();
}
async function showTrainingSummary(summary,totalYears,activity,isRandom){
  const title=isRandom?(activity.limited?("☆ "+activity.name):("★ "+activity.name)):activity.name;
  await typePrint(totalYears+" 年【"+title+"】结束。",18);
  await typePrint("你共经历 "+(summary.events||summary.wins)+" 件事：",18);
  const lines=[];
  if(summary.cult>0) lines.push("- 修为 +"+summary.cult);
  else if(summary.cult<0) lines.push("- 修为 "+summary.cult);
  if(summary.spirit!==0) lines.push("- 灵石 "+(summary.spirit>0?"+":"")+summary.spirit);
  if(summary.comp>0) lines.push("- 悟性 +"+summary.comp);
  if(summary.hp!==0) lines.push("- 气血 "+(summary.hp>0?"+":"")+summary.hp);
  if(summary.lifespan) lines.push("- 寿元 "+summary.lifespan);
  summary.items.forEach(id=>lines.push("- 获得【"+ITEMS[id].name+"】"));
  summary.skills.forEach(id=>lines.push("- 学会【"+ITEMS[id].name+"】"));
  for(const line of lines){await typePrint(line,18);await sleep(120);}
  returnToTraining();
}

/* ============================================================
   战斗
   ============================================================ */
function doCombat(npc){
  const playerAtk=getPlayerAttack();
  const def=getDefReduction();
  let log="";
  let instantKill=false;
  if(s.equipment.special==="tianguizhu"&&Math.random()<0.20&&npc.hp<playerAtk*2) instantKill=true;
  if(playerAtk>=npc.hp||instantKill){
    const atkName=s.equipment.attack?"【"+ITEMS[s.equipment.attack].name+"】":"赤手空拳";
    if(instantKill) log="你祭出【天鬼珠】，"+npc.name+"魂魄被摄，当场毙命。";
    else log="你祭出"+atkName+"，"+npc.name+"还未近身，便已倒地气绝。";
  }else{
    const rounds=Math.ceil(npc.hp/playerAtk);
    const perHit=Math.max(0,npc.atk-def);
    let dmgTaken=perHit*(rounds-1);
    if(s.equipment.defense==="yinyi"&&Math.random()<0.15){dmgTaken=Math.floor(dmgTaken/2);log="【银翼】展开，你闪避了部分攻击。";}
    if(s.equipment.defense==="tianjisan"&&Math.random()<0.10){dmgTaken=Math.floor(dmgTaken/2);log="【天机伞】转动，你避开了致命一击。";}
    if(s.equipment.defense==="taixujia"&&Math.random()<0.15){dmgTaken=Math.floor(dmgTaken/2);log="【太虚甲】虚实难测，你避开了部分攻击。";}
    s.hp-=dmgTaken;
    if(dmgTaken===0){
      log="你与"+npc.name+"缠斗 "+rounds+" 合，将其斩杀。";
      if(def>0) log+="护甲将对方攻势尽数挡下，你毫发无伤。";
      else log+="你毫发无伤。";
    }else{
      log="你与"+npc.name+"缠斗 "+rounds+" 合，将其斩杀，气血 -"+dmgTaken+"。";
    }
  }
  const rewards=[];
  if(npc.type!=="同门"){
    const sp=5+s.realm*5;
    const cu=8+s.realm*8;
    s.spirit+=sp; s.cultivation+=cu;
    rewards.push("灵石 +"+sp,"修为 +"+cu);
  }
  if(rewards.length>0) log+=" "+rewards.join("，")+"。";
  return log;
}

/* ============================================================
   秘境
   ============================================================ */
function realmDiffClass(recRealm){
  const diff=s.realm-recRealm;
  if(diff>=1) return "realm-easy";
  if(diff===0) return "realm-normal";
  if(diff===-1) return "realm-hard";
  return "realm-danger";
}
function realmDiffText(recRealm){
  const diff=s.realm-recRealm;
  if(diff>=2) return "（你已远超，收益减少）";
  if(diff===1) return "（你境界略高，收益略减）";
  if(diff===0) return "（势均力敌）";
  if(diff===-1) return "（你境界不足，危险）";
  return "（你境界远低，极危险）";
}
function getAvailableTimeRealms(){
  return SECRET_REALMS.filter(r=>{
    const prog=s.realmProgress[r.id]||{};
    if(prog.permanentClosed) return false;
    return s.realm>=r.recRealm;
  });
}
function getAvailableTokenRealms(){
  return TOKEN_REALMS.filter(r=>{
    const slot=s.inventory.find(sl=>sl.id===r.tokenId);
    return slot&&slot.count>0;
  });
}
function exploreMenu(){
  choicesEl.innerHTML="";
  const timeRealms=getAvailableTimeRealms();
  const tokenRealms=getAvailableTokenRealms();
  if(timeRealms.length===0&&tokenRealms.length===0){
    print("目前没有可进入的秘境。"); print(""); showActions(); return;
  }
  print(""); print("【选择秘境】"); print("");
  choicesEl.innerHTML="";
  if(timeRealms.length>0){
    addSection("── 洞天古迹 ──");
    timeRealms.forEach(r=>{
      const cls=realmDiffClass(r.recRealm);
      const btn=document.createElement("button");
      btn.innerHTML=`<span class="${cls}">${r.name} · 危险${r.danger} · 推荐${REALM_INFO[r.recRealm]}期</span>`;
      btn.onclick=()=>enterRealm(r,false);
      choicesEl.appendChild(btn);
    });
  }
  if(tokenRealms.length>0){
    addSection("── 道具秘境 ──");
    tokenRealms.forEach(r=>{
      const slot=s.inventory.find(sl=>sl.id===r.tokenId);
      const cls=realmDiffClass(r.recRealm);
      const btn=document.createElement("button");
      btn.innerHTML=`<span class="${cls}">${r.name} · 危险${r.danger} · 推荐${REALM_INFO[r.recRealm]}期 · 消耗${ITEMS[r.tokenId].name}×1（持有${slot.count}）</span>`;
      btn.onclick=()=>confirmEnterTokenRealm(r);
      choicesEl.appendChild(btn);
    });
  }
  addChoice("返回",showActions);
}
function confirmEnterTokenRealm(realm){
  choicesEl.innerHTML="";
  const slot=s.inventory.find(sl=>sl.id===realm.tokenId);
  const cls=realmDiffClass(realm.recRealm);
  const diffText=realmDiffText(realm.recRealm);
  const produce=REALM_PRODUCE[realm.id]||"未知";
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=`
    <div class="panel" style="max-width:480px;">
      <h2>${realm.name}</h2>
      <div class="item-detail">
        <div class="meta">危险等级：${realm.danger}</div>
        <div>推荐境界：${REALM_INFO[realm.recRealm]}期（你当前：${REALM_INFO[s.realm]}期）</div>
        <div class="${cls}">${diffText}</div>
        <div class="desc">${realm.desc}</div>
        <div>主要产出：${produce}</div>
        <div class="price-line">将消耗 1 枚【${ITEMS[realm.tokenId].name}】（持有 ${slot.count} 枚）</div>
      </div>
      <div class="panel-actions">
        <button id="confirmEnter">进入</button>
        <button id="confirmCancel">取消</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#confirmEnter").onclick=()=>{
    document.body.removeChild(overlay);
    slot.count--;
    if(slot.count<=0){const idx=s.inventory.indexOf(slot);s.inventory.splice(idx,1);}
    print("你消耗了一枚【"+ITEMS[realm.tokenId].name+"】。"); print("");
    enterRealm(realm,true);
  };
  overlay.querySelector("#confirmCancel").onclick=()=>{
    document.body.removeChild(overlay); print(""); showActions();
  };
}
function enterRealm(realm,isToken){
  print(""); print("═══════════════════════");
  print("【进入 "+realm.name+"】"); print("═══════════════════════");
  print(realm.desc); print("");
  currentScene="dungeon";
    currentScene="dungeon";
    currentRealmData=realm;
    currentIsToken=isToken;
  spendLife(LIFE_COST[s.realm][3]);
  print("你踏入秘境。"); print("");
  exploreLayer(realm,0,isToken);
}
function exploreLayer(realm,layerIdx,isToken){
    currentLayerIdx=layerIdx;
  if(layerIdx>=realm.layers.length){finishRealm(realm,isToken);return;}
  const layer=realm.layers[layerIdx];
  print(""); print("【第 "+(layerIdx+1)+" 层 · "+layer.name+"】");
  print(layer.risk); print("");
  showLayerChoices(realm,layerIdx,layer,isToken);
}
function showLayerChoices(realm,layerIdx,layer,isToken){
  choicesEl.innerHTML="";
  const layerCost=LIFE_COST[s.realm][2];
  addChoice("继续探索（-"+layerCost+" 年）",()=>{spendLife(layerCost);resolveLayerEvent(realm,layerIdx,layer,isToken);});
//  addChoice("打开储物袋",()=>{showInventory(()=>showLayerChoices(realm,layerIdx,layer,isToken));});
  addChoice("退出秘境",()=>{print("你决定退出秘境。");print("");currentScene="main";turnEnd();});
}
function resolveLayerEvent(realm,layerIdx,layer,isToken){
  const events=layer.events;
  let roll=Math.random()*100;
  let picked=events[0],acc=0;
  for(const e of events){acc+=e.p;if(roll<acc){picked=e;break;}}
  const prog=s.realmProgress[realm.id]||{};

  /* ===== 永久事件：已生效过就走补偿分支 ===== */
  if(picked.permanent&&picked.key&&s.obtainedBuffs[picked.key]){
    print("此地机缘已被你取走。");
    print("你在附近搜寻一番，只找到一些灵石。");
    s.spirit+=50;
    print("（灵石 +50）");
    print("");
    updateStats();
    if(checkEnd()) return;
    exploreLayer(realm,layerIdx+1,isToken);
    return;
  }
  /* 第一次触发永久事件：记录并正常打印 */
  if(picked.permanent&&picked.key){
    s.obtainedBuffs[picked.key]=true;
  }

  print(picked.text); print("");

  if(picked.npc){
    const npc=getNPC(picked.npc,layerIdx);
    if(npc){print(doCombat(npc));print("");}
    updateStats();
    if(checkEnd()) return;
    exploreLayer(realm,layerIdx+1,isToken); return;
  }
  if(picked.cult) s.cultivation+=picked.cult;
  if(picked.spirit) s.spirit+=picked.spirit;
  if(picked.hp) s.hp+=picked.hp;
  if(picked.comp) s.comprehension+=picked.comp;
  if(picked.maxHp) s.maxHp+=picked.maxHp;
  if(picked.atkPerm) s.permAtkBonus+=picked.atkPerm;
  if(picked.allBonus) s.allBonus+=picked.allBonus;
  if(picked.skill){
    const id=picked.skill[Math.floor(Math.random()*picked.skill.length)];
    if(!s.learnedSkills.includes(id)) learnSkill(id);
  }
  if(picked.item){
    acquireItem(picked.item,()=>{updateStats();if(checkEnd())return;exploreLayer(realm,layerIdx+1,isToken);});
    return;
  }
  if(picked.rareLoot){
    if(!prog.rareLooted){
      const item=randomItemByRarity(["稀有"]);
      if(item){
        print("你获得稀有宝物【"+ITEMS[item].name+"】！");
        s.realmProgress[realm.id]={...prog,rareLooted:true};
        acquireItem(item,()=>{updateStats();if(checkEnd())return;exploreLayer(realm,layerIdx+1,isToken);});
        return;
      }
    }else{
      print("此地宝物已被取走，你只找到一些灵石。");
      s.spirit+=30;
    }
  }
  if(picked.equipDrop){
    const item=dropEquip(s.realm,["普通","稀有"],null);
    if(item){
      print("你获得【"+ITEMS[item].name+"】！");
      addItemToInventory(item);
      updateStats();
    }
  }
  if(picked.chest){
    const rarities=picked.legendary?["稀有","传说"]:["稀有"];
    const item=dropEquip(s.realm,rarities,null);
    if(item){
      print("你打开宝箱，获得【"+ITEMS[item].name+"】！");
      addItemToInventory(item);
      updateStats();
    }else{
      print("宝箱中空空如也。");
    }
  }
  if(!isToken&&layerIdx===realm.layers.length-1&&!s.uniqueObtained["xunbaoluopan"]&&!s.uniqueLost["xunbaoluopan"]&&Math.random()<0.05){
    s.uniqueObtained["xunbaoluopan"]=true;
    print(""); print("★★★ 你意外发现了一件稀世宝物：【寻宝罗盘】！ ★★★");
    acquireItem("xunbaoluopan",()=>{updateStats();if(checkEnd())return;exploreLayer(realm,layerIdx+1,isToken);});
    return;
  }
  if(!isToken&&layerIdx===realm.layers.length-1&&!prog.uniqueLooted&&realm.uniqueReward){
    const uid=realm.uniqueReward;
    if(!s.uniqueObtained[uid]&&!s.uniqueLost[uid]){
      print(""); print("★★★ 你发现了此秘境的镇秘之宝：【"+ITEMS[uid].name+"】！ ★★★");
      s.uniqueObtained[uid]=true;
      s.realmProgress[realm.id]={...prog,uniqueLooted:true};
      acquireItem(uid,()=>{updateStats();if(checkEnd())return;exploreLayer(realm,layerIdx+1,isToken);});
      return;
    }
  }
  updateStats();
  if(checkEnd()) return;
  exploreLayer(realm,layerIdx+1,isToken);
}
function finishRealm(realm,isToken){
  print(""); print("═══════════════════════");
  print("【"+realm.name+" · 探索完成】"); print("═══════════════════════");
  print("你从秘境中走出，回望来路，恍如隔世。"); print("");
  if(!isToken){
    const prog=s.realmProgress[realm.id]||{};
    if(!prog.cleared){
      const cultReward=Math.floor(REQ[s.realm]*0.3);
      const spiritReward=200+s.realm*100;
      s.cultivation+=cultReward; s.spirit+=spiritReward; s.comprehension+=1;
      print("首次通关，获得丰厚奖励：");
      print("  修为 +"+cultReward); print("  灵石 +"+spiritReward); print("  悟性 +1"); print("");
      const tokenRealms=TOKEN_REALMS.filter(r=>r.recRealm===s.realm);
      if(tokenRealms.length>0){
        const r=tokenRealms[Math.floor(Math.random()*tokenRealms.length)];
        addItemToInventory(r.tokenId); addItemToInventory(r.tokenId);
        print("额外获得 2 枚【"+ITEMS[r.tokenId].name+"】。"); print("");
      }
      s.realmProgress[realm.id]={...prog,cleared:true,permanentClosed:true};
      print("此洞天古迹已永久关闭。");
    }else{
      s.realmProgress[realm.id]={...prog,permanentClosed:true};
    }
  }
  print(""); updateStats(); currentScene="main"; turnEnd();
}

/* ============================================================
   图鉴
   ============================================================ */
function extractNPCs(realm){
  const npcs=[]; const seen={};
  realm.layers.forEach(layer=>{
    layer.events.forEach(ev=>{
      if(!ev.npc) return;
      let id,name,hp,atk;
      if(typeof ev.npc==="string"){
        id=ev.npc;
        const base=NPC_DATA[id];
        if(!base) return;
        name=base.name; hp=base.base.hp; atk=base.base.atk;
      }else{
        name=ev.npc.name; id=name; hp=ev.npc.hp; atk=ev.npc.atk;
      }
      if(seen[id]) return;
      seen[id]=true;
      npcs.push({name,hp,atk});
    });
  });
  return npcs;
}
function showCodex(){
  choicesEl.innerHTML="";
  const overlay=document.createElement("div");
  overlay.className="overlay";
  let html='<div class="panel"><h2>图鉴</h2><div class="inv-list" style="max-height:70vh;">';
  html+='<h3>── 洞天古迹 ──</h3>';
  SECRET_REALMS.forEach(r=>{
    const prog=s.realmProgress[r.id]||{};
    const unlocked=s.realm>=r.recRealm;
    let status="",cls="";
    if(!unlocked){status="未解锁（需"+REALM_INFO[r.recRealm]+"期）";cls="locked";}
    else if(prog.permanentClosed){status="已通关";cls="cleared";}
    else{status="未通关";cls=realmDiffClass(r.recRealm).replace("realm-","");}
    const npcs=extractNPCs(r);
    html+=`<div class="codex-realm ${cls}">
      <div class="codex-name">${r.name}</div>
      <div class="codex-meta">推荐：${REALM_INFO[r.recRealm]}期 · 危险：${r.danger} · ${status}</div>
      <div class="codex-desc">产出：${REALM_PRODUCE[r.id]||"未知"}</div>
      ${npcs.length>0?'<div class="codex-npc">NPC：'+npcs.map(n=>n.name+"(血"+n.hp+"/攻"+n.atk+")").join("、")+'</div>':''}
    </div>`;
  });
  html+='<h3 style="margin-top:10px;">── 道具秘境 ──</h3>';
  TOKEN_REALMS.forEach(r=>{
    const unlocked=s.realm>=r.recRealm;
    const slot=s.inventory.find(sl=>sl.id===r.tokenId);
    const count=slot?slot.count:0;
    let status="",cls="";
    if(!unlocked){status="未解锁（需"+REALM_INFO[r.recRealm]+"期）";cls="locked";}
    else{status=count>0?("可进入 · 持有"+count+"枚"):"未持有入场道具";cls=realmDiffClass(r.recRealm).replace("realm-","");}
    const npcs=extractNPCs(r);
    html+=`<div class="codex-realm ${cls}">
      <div class="codex-name">${r.name}</div>
      <div class="codex-meta">推荐：${REALM_INFO[r.recRealm]}期 · 危险：${r.danger} · ${status}</div>
      <div class="codex-desc">产出：${REALM_PRODUCE[r.id]||"未知"} · 入场：${ITEMS[r.tokenId].name}</div>
      ${npcs.length>0?'<div class="codex-npc">NPC：'+npcs.map(n=>n.name+"(血"+n.hp+"/攻"+n.atk+")").join("、")+'</div>':''}
    </div>`;
  });
  html+='</div><div class="panel-actions"><button class="wide" id="codexClose">关闭</button></div></div>';
  overlay.innerHTML=html; document.body.appendChild(overlay);
  overlay.querySelector("#codexClose").onclick=()=>{document.body.removeChild(overlay);showActions();};
}

/* ============================================================
   功法面板
   ============================================================ */
function showSkills(){
  const overlay=document.createElement("div");
  overlay.className="overlay";
  let html='<div class="panel"><h2>已学功法</h2>';
  if(s.learnedSkills.length===0){
    html+='<div style="color:#8a7a5c;text-align:center;padding:20px;">尚未习得任何功法。</div>';
  }else{
    html+='<div class="skill-list">';
    s.learnedSkills.forEach(id=>{
      const it=ITEMS[id];
      const rc=it.rarity==="唯一"?"唯一":it.rarity;
      html+=`<div class="skill-card slot-rarity-${rc}">
        <div class="skill-name">${it.name}</div>
        <div class="skill-meta">${it.rarity}</div>
        <div class="skill-effect">${it.effect}</div>
        <div class="skill-desc">${it.desc}</div>
      </div>`;
    });
    html+='</div>';
  }
  html+='<div class="panel-actions"><button class="wide" id="skillClose">关闭</button></div></div>';
  overlay.innerHTML=html; document.body.appendChild(overlay);
  overlay.querySelector("#skillClose").onclick=()=>{document.body.removeChild(overlay);};
}

/* ============================================================
   坊市
   ============================================================ */
function market(){
  print(""); print("【坊市】");
  print("你来到山下坊市，人声鼎沸。");
  print("当前灵石："+s.spirit); print("");
  showMarketMenu();
}
function showMarketMenu(){
  choicesEl.innerHTML="";
  const available=SHOPS.filter(sh=>s.realm>=sh.minRealm);
  available.forEach(sh=>{addChoice(sh.name,()=>enterShop(sh),sh.cls);});
  addChoice("离开坊市",()=>{print("");showActions();});
}
function enterShop(shop){
  print(""); print("【"+shop.name+"】"); print(shop.desc); print("");
  choicesEl.innerHTML="";
  shop.items.forEach(it=>{
    addChoice(ITEMS[it.id].name+" · "+it.price,()=>showShopItemDetail(it.id,it.price,shop));
  });
  addChoice("出售物品",()=>showSellPanel(shop));
  addChoice("返回坊市",()=>{print("");showMarketMenu();});
}
function showShopItemDetail(itemId,price,shop){
  const it=ITEMS[itemId];
  const overlay=document.createElement("div");
  overlay.className="overlay";
  const rc=it.rarity==="唯一"?"唯一":it.rarity;
  function refresh(){
    overlay.querySelector("#detailSpirit").textContent=s.spirit;
    overlay.querySelectorAll(".buy-btn").forEach(btn=>{btn.disabled=s.spirit<price;});
  }
  overlay.innerHTML=`
    <div class="panel" style="max-width:420px;">
      <h2>${it.name}</h2>
      <div class="item-detail">
        <div class="meta">${it.type} · ${rc}</div>
        <div>效果：${getEquipEffectText(it)}</div>
        <div class="desc">${it.desc}</div>
        ${getDynamicBonusText(it)?'<div style="color:#a8d888;font-size:13px;margin-top:4px;">'+getDynamicBonusText(it)+'</div>':''}
        <div class="price-line">单价：${price} 灵石 · 当前：<span id="detailSpirit">${s.spirit}</span></div>
      </div>
      <div class="panel-actions three">
        <button class="buy-btn" data-n="1">购买 ×1</button>
        <button class="buy-btn" data-n="5">购买 ×5</button>
        <button class="buy-btn" data-n="10">购买 ×10</button>
      </div>
      <div class="panel-actions"><button class="wide" id="detailClose">关闭</button></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll(".buy-btn").forEach(btn=>{
    btn.onclick=()=>{
      const n=parseInt(btn.dataset.n);
      let actual=0;
      for(let i=0;i<n;i++){
        if(s.spirit>=price){
          s.spirit-=price;
          addItemToInventory(itemId);
          actual++;
        }else break;
      }
      if(actual>0) print("你买下【"+it.name+"】×"+actual+"。");
      else print("灵石不足。");
      updateStats(); refresh();
    };
  });
  overlay.querySelector("#detailClose").onclick=()=>{document.body.removeChild(overlay);enterShop(shop);};
  refresh();
}
function showSellPanel(shop){
  choicesEl.innerHTML="";
  if(s.inventory.length===0){print("储物袋空空，无物可卖。");print("");enterShop(shop);return;}
  const overlay=document.createElement("div");
  overlay.className="overlay";
  overlay.innerHTML=`
    <div class="panel">
      <h2>出售物品</h2>
      <div style="color:#8a7a5c;font-size:13px;text-align:center;">当前灵石：<span id="sellSpirit">${s.spirit}</span></div>
      <div class="inv-list"><div class="inv-grid" id="sellGrid"></div></div>
      <div class="panel-actions"><button class="wide" id="sellClose">返回</button></div>
    </div>`;
  document.body.appendChild(overlay);
  const grid=overlay.querySelector("#sellGrid");
  const spiritLabel=overlay.querySelector("#sellSpirit");
  function renderSell(){
    grid.innerHTML="";
    if(s.inventory.length===0){
      grid.innerHTML='<div style="color:#8a7a5c;text-align:center;padding:20px;grid-column:1/-1;">储物袋已空</div>';
      return;
    }
    s.inventory.forEach((slot,idx)=>{
      const it=ITEMS[slot.id];
      const basePrice=it.sellPrice||10;
      const price=Math.max(1,Math.floor(basePrice*shop.buyRate/0.5));
      const rc=it.rarity==="唯一"?"唯一":it.rarity;
      const slotEl=document.createElement("div");
      slotEl.className="inv-slot"+(it.unique?" unique":"");
      slotEl.innerHTML=`
        <div class="slot-name">${it.name}</div>
        <div class="slot-type slot-rarity-${rc}">${it.type} · ${rc}</div>
        <div class="slot-price">售价：${price} 灵石${slot.count>1?" ×"+slot.count:""}</div>
      `;
      slotEl.onclick=()=>{
        if(it.unique&&!confirm("【"+it.name+"】是唯一宝物，确定卖出？"))return;
        if(it.rarity==="传说"&&!confirm("【"+it.name+"】稀有，确定卖出？"))return;
        s.spirit+=price;
        slot.count--;
        if(slot.count<=0) s.inventory.splice(idx,1);
        if(it.unique) s.uniqueLost[slot.id]=true;
        print("你卖出【"+it.name+"】，获得灵石 +"+price+"。");
        updateStats(); spiritLabel.textContent=s.spirit; renderSell();
      };
      grid.appendChild(slotEl);
    });
  }
  overlay.querySelector("#sellClose").onclick=()=>{document.body.removeChild(overlay);print("");enterShop(shop);};
  renderSell();
}

/* ============================================================
   获得物品
   ============================================================ */
function acquireItem(itemId,onDone){
  const item=ITEMS[itemId];
  if(item.type==="功法"){
    if(s.learnedSkills.includes(itemId)){print("你已学过此功法。");print("");if(onDone)onDone();else showActions();return;}
    learnSkill(itemId); print(""); if(onDone)onDone();else showActions(); return;
  }
  if(item.unique){
    if(s.uniqueObtained[itemId]||s.uniqueLost[itemId]){print("此物你已获得过。");print("");if(onDone)onDone();else showActions();return;}
    s.uniqueObtained[itemId]=true;
  }
  addItemToInventory(itemId);
  print("【"+item.name+"】已放入储物袋。"); print("");
  updateStats();
  if(onDone)onDone();else showActions();
}
function learnSkill(itemId,silent){
  const item=ITEMS[itemId];
  s.learnedSkills.push(itemId);
  if(itemId==="changchungong"){s.maxHp+=20;s.hp+=20;}
  if(itemId==="dayanjue"){s.comprehension+=2;}
  if(itemId==="xuemogong"){s.maxHp+=30;s.hp+=30;}
  if(!silent){print("你研读【"+item.name+"】。");print("效果："+item.effect);print("");}
  updateStats();
}

/* ============================================================
   储物袋
   ============================================================ */
function showInventory(onClose){
  choicesEl.innerHTML="";
  const hasHeal=s.inventory.some(sl=>sl.id==="huichundan"&&sl.count>0);
  const hpLow=s.hp/s.maxHp<0.5;
  const overlay=document.createElement("div");
  overlay.className="overlay";
  let hintHtml="";
  if(hasHeal&&hpLow) hintHtml='<div class="heal-hint">可使用【回春丹】恢复气血</div>';
  overlay.innerHTML=`
    <div class="panel">
      <h2>储物袋 / 装备</h2>
      <h3>装备栏（攻击力 ${getPlayerAttack()} · 防御减免 ${getDefReduction()}）</h3>
      <div class="inv-grid" id="equipGrid"></div>
      <div class="divider"></div>
      <h3>储物袋（<span id="invCount"></span>）</h3>
      ${hintHtml}
      <div class="inv-list"><div class="inv-grid" id="invGrid"></div></div>
      <div class="panel-actions">
        <button class="wide" id="synthBtn">⚒ 装备合成</button>
        <button class="wide" id="invClose">关闭</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const equipGrid=overlay.querySelector("#equipGrid");
  const invGrid=overlay.querySelector("#invGrid");
  const invCount=overlay.querySelector("#invCount");

  function renderEquip(){
    equipGrid.innerHTML="";
    ["attack","defense","special"].forEach(slotType=>{
      const id=s.equipment[slotType];
      const label=slotType==="attack"?"攻击":slotType==="defense"?"防御":"特殊";
      const slot=document.createElement("div");
      if(id){
        const it=ITEMS[id];
        const rc=it.rarity==="唯一"?"唯一":it.rarity;
        slot.className="inv-slot equipped"+(it.unique?" unique":"");
        slot.innerHTML=`
          <div class="slot-name">${it.name}</div>
          <div class="slot-type slot-rarity-${rc}">${label} · ${rc}</div>
          <div style="color:#a89878;font-size:12px;">${getEquipEffectText(it)}</div>
        `;
        slot.onclick=()=>{
          if(confirm("卸下【"+it.name+"】？")){
            const eq=s.equipment[slotType];
            s.equipment[slotType]=null;
            const slotData=s.equipmentRoll && s.equipmentRoll[slotType];
            addItemToInventory(eq);
            renderAll(); updateStats();
          }
        };
      }else{
        slot.className="inv-slot empty";
        slot.textContent=label+"：空";
      }
      equipGrid.appendChild(slot);
    });
  }
  function renderInv(){
    invGrid.innerHTML="";
    invCount.textContent=s.inventory.length+" 种";
    if(s.inventory.length===0) invGrid.innerHTML='<div style="color:#4a3a26;text-align:center;padding:20px;grid-column:1/-1;">空空如也</div>';
    const sorted=[...s.inventory].sort((a,b)=>{
      const aHeal=a.id==="huichundan"?0:1;
      const bHeal=b.id==="huichundan"?0:1;
      return aHeal-bHeal;
    });
    sorted.forEach((slot)=>{
      const realIdx=s.inventory.indexOf(slot);
      const it=ITEMS[slot.id];
      const rc=it.rarity==="唯一"?"唯一":it.rarity;
      const slotEl=document.createElement("div");
      slotEl.className="inv-slot"+(it.unique?" unique":"");
      slotEl.innerHTML=`
        <div class="slot-name">${it.name}${slot.count>1?" ×"+slot.count:""}</div>
        <div class="slot-type slot-rarity-${rc}">${it.type} · ${rc}</div>
        <div style="color:#a89878;font-size:12px;">${getEquipEffectText(it)}</div>
      `;
      slotEl.onclick=()=>showItemActions(slot.id,realIdx,renderAll);
      invGrid.appendChild(slotEl);
    });
  }
  function renderAll(){renderEquip();renderInv();updateStats();}
  overlay.querySelector("#synthBtn").onclick=()=>{
    document.body.removeChild(overlay);
    showSynthPanel(onClose);
  };
  overlay.querySelector("#invClose").onclick=()=>{
    document.body.removeChild(overlay);
    if(typeof onClose==="function") onClose(); else showActions();
  };
  renderAll();
}

/* ============================================================
   物品操作
   ============================================================ */
function showItemActions(itemId,idx,onDone){
  const it=ITEMS[itemId];
  const overlay=document.createElement("div");
  overlay.className="overlay";
  const rc=it.rarity==="唯一"?"唯一":it.rarity;
  const canUse=(it.type==="丹药"||it.consumable)&&it.type!=="入场道具";
  function refresh(){
    const slot=s.inventory.find(x=>x.id===itemId);
    const countEl=overlay.querySelector("#itemCount");
    if(countEl) countEl.textContent=slot?slot.count:0;
    overlay.querySelectorAll(".use-btn").forEach(btn=>{btn.disabled=!slot||slot.count<=0;});
    const ls=overlay.querySelector("#liveStats");
    if(ls){
      const hpPct=s.hp/s.maxHp;
      const hpColor=hpPct<0.3?"#e86a6a":(hpPct<0.5?"#e8d86a":"#6ad86a");
      ls.innerHTML=`<span>❤ 气血 <b style="color:${hpColor}">${s.hp}/${s.maxHp}</b></span>
        <span>⏳ 寿元 <b style="color:#e8c86a">${Math.floor(s.lifespan)}</b></span>
        <span>修为 <b style="color:#6ad86a">${Math.floor(s.cultivation)}</b></span>
        <span>悟性 <b style="color:#6a9ad8">${s.comprehension}</b></span>`;
    }
  }
  overlay.innerHTML=`
    <div class="panel" style="max-width:420px;">
      <h2 class="${it.unique?'name unique':''}">${it.name}</h2>
      <div class="item-detail">
        <div class="meta">${it.type} · ${rc}</div>
        <div>效果：${getEquipEffectText(it)}</div>
        <div class="desc">${it.desc}</div>
        ${it.unique?'<div class="unique-tag">此物独一无二。</div>':''}
        ${getDynamicBonusText(it)?'<div style="color:#a8d888;font-size:13px;margin-top:4px;">'+getDynamicBonusText(it)+'</div>':''}
        ${canUse?'<div class="price-line">当前数量：<span id="itemCount">1</span></div>':''}
      </div>
      ${canUse?'<div class="live-stats" id="liveStats"></div>':''}
      ${canUse?`<div class="panel-actions three">
        <button class="use-btn" data-n="1">使用 ×1</button>
        <button class="use-btn" data-n="5">使用 ×5</button>
        <button class="use-btn" data-n="10">使用 ×10</button>
      </div>`:''}
      <div class="panel-actions" id="itemActions"></div>
    </div>`;
  document.body.appendChild(overlay);
  const actions=overlay.querySelector("#itemActions");
  function close(){document.body.removeChild(overlay);}

  if(it.slot){
    const btn=document.createElement("button");
    btn.textContent="装备";
    btn.onclick=()=>{
      const old=s.equipment[it.slot];
      s.equipment[it.slot]=itemId;
      const slot=s.inventory.find(x=>x.id===itemId);
      slot.count--;
      if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
      if(old){addItemToInventory(old);}
      print("你装备了【"+it.name+"】。");
      close();if(onDone)onDone();
    };
    actions.appendChild(btn);
  }
  const discardBtn=document.createElement("button");
  discardBtn.className="danger";
  discardBtn.textContent="丢弃";
  discardBtn.onclick=()=>{
    if(it.unique&&!confirm("【"+it.name+"】是唯一宝物，确定丢弃？"))return;
    if(it.rarity==="传说"&&!confirm("【"+it.name+"】稀有，确定丢弃？"))return;
    const slot=s.inventory.find(x=>x.id===itemId);
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    if(it.unique) s.uniqueLost[itemId]=true;
    print("你丢弃了【"+it.name+"】。");
    close();if(onDone)onDone();
  };
  actions.appendChild(discardBtn);
  const cancelBtn=document.createElement("button");
  cancelBtn.textContent="关闭";
  cancelBtn.onclick=close;
  actions.appendChild(cancelBtn);

  if(canUse){
    overlay.querySelectorAll(".use-btn").forEach(btn=>{
      btn.onclick=()=>{
        const n=parseInt(btn.dataset.n);
        let used=0;
        for(let i=0;i<n;i++){
          const slot=s.inventory.find(x=>x.id===itemId);
          if(!slot||slot.count<=0) break;
          const success=useItemById(itemId);
          if(success) used++; else break;
        }
        if(used>0){
          updateStats();
          if(onDone) onDone();
          const stillHas=s.inventory.find(x=>x.id===itemId);
          if(!stillHas){close();}else{refresh();}
        }
      };
    });
    refresh();
  }
}

/* ============================================================
   使用物品
   ============================================================ */
function useItemById(itemId){
  const it=ITEMS[itemId];
  const slot=s.inventory.find(x=>x.id===itemId);
  if(!slot||slot.count<=0) return false;

  if(it.lifespanGain){
    const used=s.lifespanUsed[itemId]||0;
    if(used>=it.maxUses){print("【"+it.name+"】药力已尽。");print("");return false;}
    s.lifespanUsed[itemId]=used+1;
    s.lifespan+=it.lifespanGain;
    print("你服下【"+it.name+"】，寿元 +"+it.lifespanGain+"。");
    print("（已服 "+(used+1)+"/"+it.maxUses+"）");
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    print(""); return true;
  }
  if(it.hpGain){
    const used=s.lifespanUsed[itemId]||0;
    if(used>=it.maxUses){print("【"+it.name+"】药力已尽。");print("");return false;}
    s.lifespanUsed[itemId]=used+1;
    s.maxHp+=it.hpGain;
    print("你服下【"+it.name+"】，气血上限 +"+it.hpGain+"。");
    print("（已服 "+(used+1)+"/"+it.maxUses+"）");
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    print(""); return true;
  }
  if(itemId==="mijingcantu"){
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    const closed=SECRET_REALMS.find(r=>{const p=s.realmProgress[r.id]||{};return p.permanentClosed;});
    if(closed){
      s.realmProgress[closed.id]={...(s.realmProgress[closed.id]||{}),permanentClosed:false};
      print("【"+closed.name+"】已重新开启。");
    }else print("没有可重新开启的秘境。");
    print(""); return true;
  }
  if(itemId==="yinlufu"){
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    SECRET_REALMS.forEach(r=>{if(s.realmProgress[r.id]) s.realmProgress[r.id].rareLooted=false;});
    print("所有秘境的稀有掉落记录已重置。"); print(""); return true;
  }
  if(itemId==="jiuriYinji"){
    slot.count--;
    if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
    const missed=SECRET_REALMS.find(r=>{const p=s.realmProgress[r.id]||{};return p.permanentClosed&&!p.cleared&&s.realm>=r.recRealm;});
    if(missed){
      s.realmProgress[missed.id]={...(s.realmProgress[missed.id]||{}),permanentClosed:false,visitOnce:true};
      print("【"+missed.name+"】已可用旧日印记进入一次。");
    }else print("没有可进入的已关闭秘境。");
    print(""); return true;
  }
  if(it.type==="入场道具"){print("【"+it.name+"】需在探索秘境时使用。");print("");return false;}

  slot.count--;
  if(slot.count<=0){const i=s.inventory.indexOf(slot);s.inventory.splice(i,1);}
  print("你使用了【"+it.name+"】。");
  if(itemId==="huichundan"){s.hp=Math.min(s.maxHp,s.hp+30);print("气血 +30。");}
  if(itemId==="xiaohuandan"){s.hp=Math.min(s.maxHp,s.hp+80);print("气血 +80。");}
  if(itemId==="dahuandan"){s.hp=Math.min(s.maxHp,s.hp+200);print("气血 +200。");}
  if(itemId==="jiuzhuandan"){s.hp=s.maxHp;print("气血全满。");}
  if(itemId==="juqidan"){s.cultivation+=60;print("修为 +60。");}
  if(itemId==="wudaodan"){s.comprehension+=1;print("悟性 +1。");}
  if(itemId==="pozhangdan"){s.bonusBreakthrough+=15;print("下次突破 +15%。");}
  if(itemId==="qingxindan"){s.failCount=Math.max(0,s.failCount-1);print("失败计数 -1。");}
  if(itemId==="ningyuandan"){s.bonusBreakthrough+=10;print("本次突破 +10%。");}
  if(itemId==="jingxinliantai"){s.failCount=Math.max(0,s.failCount-1);print("失败计数 -1。");}
  if(itemId==="tianjipan") print("天机盘指针狂转。");
  if(itemId==="chuansongfu") print("传送符已备。");
  print(""); return true;
}

/* ============================================================
   装备合成（同名 3 件合成）
   ============================================================ */
function showSynthPanel(onClose){
  choicesEl.innerHTML="";
  const overlay=document.createElement("div");
  overlay.className="overlay";

  /* 扫描储物袋，找出 3 件以上同 id 装备 */
  const groups={};
  s.inventory.forEach(slot=>{
    const it=ITEMS[slot.id];
    if(it.type!=="攻击法器"&&it.type!=="防御法器") return;
    if(it.unique) return;
    if(it.rarity==="传说") return;
    if(it.realm===undefined) return;
    if(it.realm!==s.realm) return;
    if(!groups[slot.id]) groups[slot.id]={id:slot.id, total:0};
    groups[slot.id].total+=slot.count;
  });

  const craftable=[];
  Object.keys(groups).forEach(id=>{
    const g=groups[id];
    const it=ITEMS[id];
    const nextRarity=RARITY_CHAIN[it.rarity];
    if(!nextRarity) return;
    if(g.total>=3){
      craftable.push({id:g.id, total:g.total, nextRarity});
    }
  });

  let html='<div class="panel"><h2>装备合成</h2>';
  html+='<div style="color:#8a7a5c;font-size:13px;text-align:center;">3 件相同的装备 + 灵石 → 1 件同名装备（品级提升，属性翻倍）</div>';
  html+=`<div style="color:#8ac86a;font-size:13px;text-align:center;">当前境界：${REALM_INFO[s.realm]}期 · 消耗：${SYNTH_COST[s.realm]} 灵石</div>`;
  html+='<div style="color:#8a7a5c;font-size:12px;text-align:center;margin-top:4px;">（品级系数：普通 ×1 / 稀有 ×2 / 传说 ×4；传说封顶）</div>';

  if(craftable.length===0){
    html+='<div style="color:#8a7a5c;text-align:center;padding:30px;">暂无可合成的装备。<br>需要 3 件相同的当前境界装备（普通或稀有）。</div>';
  }else{
    html+='<div class="synth-pool" style="margin-top:10px;">';
    craftable.forEach((c,idx)=>{
      const it=ITEMS[c.id];
      const nextIt={...it, rarity:c.nextRarity};
      const curBonus=getEquipBase(it);
      const nextBonus=getEquipBase(nextIt);
      const canAfford=s.spirit>=SYNTH_COST[s.realm];
      html+=`<div class="synth-slot${canAfford?'':' disabled'}" data-idx="${idx}">
        <div style="color:#e8c86a;font-size:14px;font-weight:bold;">${it.name}</div>
        <div style="color:#8a7a5c;font-size:12px;">${it.rarity} → ${c.nextRarity}</div>
        <div style="color:#a89878;font-size:12px;">当前基础：+${curBonus}</div>
        <div style="color:#a8d888;font-size:12px;">合成后基础：+${nextBonus}</div>
        <div style="color:#8a7a5c;font-size:12px;">可用：${c.total} 件</div>
        <div style="color:${canAfford?'#8ac86a':'#e86a6a'};font-size:12px;">消耗：${SYNTH_COST[s.realm]} 灵石</div>
      </div>`;
    });
    html+='</div>';
  }
  html+='<div class="panel-actions" style="margin-top:10px;"><button class="wide" id="synthClose">返回</button></div></div>';
  overlay.innerHTML=html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll(".synth-slot:not(.disabled)").forEach(slot=>{
    slot.onclick=()=>{
      const idx=parseInt(slot.dataset.idx);
      const c=craftable[idx];
      document.body.removeChild(overlay);
      doSynth(c, onClose);
    };
  });
  overlay.querySelector("#synthClose").onclick=()=>{
    document.body.removeChild(overlay);
    showInventory(onClose);
  };
}

/* 解析 id，返回基础 id 和品级等级 */
function getBaseIdAndLevel(id){
  const m=id.match(/^(.+?)_(\d+)$/);
  if(m) return { baseId:m[1], level:parseInt(m[2]) };
  return { baseId:id, level:0 };
}

function doSynth(c, onClose){
  const cost=SYNTH_COST[s.realm];
  if(s.spirit<cost){print("灵石不足。");print("");showInventory(onClose);return;}

  /* 判断当前品级：baseId 无后缀=普通，_1=稀有，_2=传说 */
  let baseId, level;
  if(c.id.endsWith("_2")){
    print("传说品级已封顶，无法继续合成。"); print("");
    showInventory(onClose); return;
  }
  if(c.id.endsWith("_1")){ baseId=c.id.slice(0,-2); level=1; }
  else { baseId=c.id; level=0; }

  const nextRarity = ["稀有","传说"][level];
  const newId = baseId + "_" + (level + 1);

  /* 运行时注册合成后的物品 */
  if(!ITEMS[newId]){
    ITEMS[newId] = Object.assign({}, ITEMS[baseId], { rarity: nextRarity });
  }

  /* 扣 3 件同 id 装备 */
  let need=3;
  const toRemove=[];
  s.inventory.forEach((slot,idx)=>{
    if(need<=0) return;
    if(slot.id!==c.id) return;
    const take=Math.min(need,slot.count);
    slot.count-=take;
    need-=take;
    if(slot.count<=0) toRemove.push(idx);
  });
  if(need>0){print("装备数量不足。");print("");showInventory(onClose);return;}

  s.spirit-=cost;
  toRemove.sort((a,b)=>b-a).forEach(i=>s.inventory.splice(i,1));

  /* 加入储物袋 */
  const existing=s.inventory.find(x=>x.id===newId);
  if(existing) existing.count++;
  else s.inventory.push({id:newId, count:1});

  const baseItem=ITEMS[baseId];
  print("");
  print("⚒ 合成成功！");
  print("消耗 3 件【"+baseItem.name+"】 + "+cost+" 灵石。");
  print("获得【"+baseItem.name+"（"+nextRarity+"）】！");
  print("");
  updateStats();
  showInventory(onClose);
}

/* ============================================================
   突破
   ============================================================ */
function breakthrough(){
  currentScene="breakthrough";
  const isFinal=s.realm===4;
  print("");
  if(isFinal){print("【渡劫】");print("天穹乌云翻涌，雷光如龙。");}
  else{print("【突破】");print("你运转功法，冲击 "+REALM_INFO[s.realm+1]+"期 瓶颈。");}
  print("");
  choicesEl.innerHTML="";
  const hasPozhang=s.inventory.find(sl=>sl.id==="pozhangdan");
  const hasNingyuan=s.inventory.find(sl=>sl.id==="ningyuandan");
  const hasJingxin=s.inventory.find(sl=>sl.id==="jingxinliantai");
  if(hasPozhang) addChoice("用破障丹（+15%）",()=>{removeItem("pozhangdan");s.bonusBreakthrough+=15;print("你服下破障丹。");doBreakthrough(isFinal);});
  if(hasNingyuan) addChoice("用凝元丹（+10%）",()=>{removeItem("ningyuandan");s.bonusBreakthrough+=10;print("你服下凝元丹。");doBreakthrough(isFinal);});
  if(hasJingxin) addChoice("用静心莲台",()=>{removeItem("jingxinliantai");s.failCount=Math.max(0,s.failCount-1);print("你坐上莲台。");doBreakthrough(isFinal);});
  addChoice("直接突破",()=>doBreakthrough(isFinal));
  addChoice("返回",()=>{print("你暂且压下突破的冲动。");print("");currentScene="main";showActions();});
}
function doBreakthrough(isFinal){
  let chance=Math.min(0.95,0.45+s.comprehension*0.04);
  chance+=(s.bonusBreakthrough+getBreakthroughBonus())/100;
  chance=Math.max(0.05,Math.min(0.95,chance));
  s.bonusBreakthrough=0;
  print("");
  if(Math.random()<chance){
    if(isFinal){ascendToImmortal();return;}
    const overflow=Math.max(0,s.cultivation-REQ[s.realm]);
    s.cultivation=Math.floor(overflow*0.5);
    s.realm++;
    s.failCount=0;
    const bonus=LIFEBONUS[s.realm];
    const hpBonus=HPBONUS[s.realm];
    s.lifespan+=bonus;
    s.maxHp+=hpBonus;
    s.hp=s.maxHp;
    print("轰——");
    print("瓶颈破碎，你成功踏入 "+REALM_INFO[s.realm]+"期！");
    print("寿元 +"+bonus+"，气血上限 +"+hpBonus+"，气血全满。");
    if(s.cultivation>0) print("溢出修为保留 "+s.cultivation+" 点。");
  }else{
    s.failCount++;
    const dmg=20+s.realm*15;
    s.hp-=dmg;
    s.cultivation=Math.floor(s.cultivation*0.7);
    print("气息一乱，真气反噬！");
    print("突破失败，气血 -"+dmg+"，修为倒退。");
    print("（失败次数："+s.failCount+" / 3）");
  }
  print(""); turnEnd();
}
function removeItem(itemId){
  const idx=s.inventory.findIndex(sl=>sl.id===itemId);
  if(idx>=0){s.inventory[idx].count--;if(s.inventory[idx].count<=0)s.inventory.splice(idx,1);}
}
function randomItemByRarity(rarities){
  const pool=Object.keys(ITEMS).filter(id=>{
    const it=ITEMS[id];
    return rarities.includes(it.rarity)&&it.type!=="功法"&&it.type!=="入场道具"&&!it.unique&&!it.lifespanGain&&it.type!=="逃脱道具";
  });
  if(pool.length===0) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}

/* ============================================================
   飞升
   ============================================================ */
function ascendToImmortal(){
  s.ended=true;
  const clearedRealms=SECRET_REALMS.filter(r=>(s.realmProgress[r.id]||{}).cleared).length;
  const uniqueCount=Object.keys(s.uniqueObtained).filter(k=>s.uniqueObtained[k]&&!s.uniqueLost[k]).length;
  const skillCount=s.learnedSkills.length;
  const totalYears=s.lifeSpent;
  const overlay=document.createElement("div");
  overlay.className="ascend-overlay";
  overlay.innerHTML=`<div class="ascend-glow"></div><div class="ascend-content" id="ascendContent"></div>`;
  document.body.appendChild(overlay);
  const contentEl=overlay.querySelector("#ascendContent");
  const lines=[
    {text:"天地变色，紫气东来。",cls:"ascend-title"},
    {text:"九九八十一道天雷自九霄劈落，雷光如龙。",cls:""},{text:"",cls:""},
    {text:"你以肉身硬抗，经脉寸断又重塑，神魂崩碎又重聚。",cls:""},
    {text:"终于，最后一道雷光散去。",cls:""},{text:"",cls:""},
    {text:"天门洞开，仙乐缥缈。",cls:"ascend-highlight"},
    {text:"你踏空而上，回望人间，云海苍茫，再无挂碍。",cls:""},{text:"",cls:""},
    {text:"━━━━━━━━━━━━━━",cls:"ascend-divider"},
    {text:"【 仙 途 回 顾 】",cls:"ascend-title"},{text:"",cls:""},
    {text:"· 终至 "+REALM_INFO[s.realm]+"期",cls:""},
    {text:"· 终年 "+(16+totalYears)+" 岁",cls:""},
    {text:"· 经历 "+s.turn+" 个回合",cls:""},
    {text:"· 通关洞天古迹 "+clearedRealms+" 座",cls:""},
    {text:"· 收集唯一宝物 "+uniqueCount+" 件",cls:""},
    {text:"· 习得功法 "+skillCount+" 门",cls:""},{text:"",cls:""},
    {text:"━━━━━━━━━━━━━━",cls:"ascend-divider"},{text:"",cls:""},
    {text:"凡尘已远，仙路漫漫。",cls:""},
    {text:"此去，再无归期。",cls:""},{text:"",cls:""},
    {text:"—— 飞 升 成 仙 ——",cls:"ascend-final"}
  ];
  let idx=0;
  function nextLine(){
    if(idx>=lines.length){
      const btn=document.createElement("button");
      btn.textContent="重 新 开 始";
      btn.onclick=()=>{document.body.removeChild(overlay);init();};
      contentEl.appendChild(btn);
      return;
    }
    const item=lines[idx];
    const p=document.createElement("p");
    p.textContent=item.text;
    if(item.cls) p.className=item.cls;
    if(item.text==="") p.innerHTML="&nbsp;";
    contentEl.appendChild(p);
    contentEl.scrollTop=contentEl.scrollHeight;
    idx++;
    const delay=item.text===""?150:500;
    setTimeout(nextLine,delay);
  }
  setTimeout(nextLine,300);
}
/* 自动滚到底：只要 #text 内容变化，就滚到最下方 */
let _scrollPending=false;
const _textObserver=new MutationObserver(()=>{
  if(_scrollPending) return;
  _scrollPending=true;
  requestAnimationFrame(()=>{
    textEl.scrollTop=textEl.scrollHeight;
    _scrollPending=false;
  });
});
_textObserver.observe(textEl,{
  childList:true,      // 新增/删除 <p>
  subtree:true,        // 监听子节点内部
  characterData:true   // 监听文字变化（打字机效果）
});
/* ============================================================
   启动
   ============================================================ */
init();
