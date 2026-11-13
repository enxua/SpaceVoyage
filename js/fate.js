"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 우주 괴물 · 우연 · 이어지는 인연 ══════════════════
   · 우주 괴물: 우주마다 떠도는 거대 생물. 싸우거나, 먹이를 던져 길들이거나, 숨죽여 관찰하거나, 달아난다.
   · 우연: 항해 중 가끔 일어나는 뜻밖의 일(유성우·메시지 캡슐·소원 별똥별·밀항자·쌍둥이 신호·우주 생물·옛 라디오).
           몇몇은 나중 일로 이어진다(편지 배달, 밀항자의 정체).
   · 이어지는 인연: 같은 인물을 여러 번 마주치며 이야기가 3단계로 나아간다. 끝까지 가면 영구 보너스. */
let monsters = [], fatedNPC = null, fateT = 0, fateNext = 55, fateTick = 0;
function fate(){ if(!state.fate) state.fate = { slain:{}, tamed:{}, seen:{}, fated:{}, flag:{}, letter:null, stow:false, pet:false, cd:0 }; return state.fate; }

/* ── 우주 괴물 ── */
const MON = {
  whale:  { ic:"🐋", name:__("공허 고래"),   col:"#6fb6e8", pow:1.5, r:7, calm:true, desc:__("별빛을 걸러 먹으며 천천히 헤엄치는 거대한 생물입니다. 낮고 긴 울음이 선체를 울립니다.") },
  kraken: { ic:"🦑", name:__("성운 크라켄"), col:"#c58cff", pow:2.0, r:6, desc:__("성운 속에서 촉수가 뻗어 나옵니다. 함선만 한 눈이 이쪽을 보고 있습니다.") },
  serpent:{ ic:"🐍", name:__("플라스마 뱀"), col:"#ffb347", pow:1.8, r:6, desc:__("불타는 몸뚱이가 함선 둘레를 휘감듯 돌고 있습니다. 비늘마다 번개가 튑니다.") },
  swarm:  { ic:"🦗", name:__("별벌레 떼"),   col:"#9be36a", pow:1.4, r:5, desc:__("금속을 갉아 먹는 벌레 수천 마리가 구름처럼 몰려옵니다. 선체에서 긁는 소리가 납니다.") },
  eater:  { ic:"👹", name:__("별 포식자"),   col:"#ff5a6a", pow:2.6, r:8, desc:__("별을 통째로 삼킨다는 전설의 괴물입니다. 벌어진 입 안쪽이 용광로처럼 붉습니다.") },
};
const monPow = (m) => Math.round((26+m.z*30)*MON[m.key].pow);
function spawnMonster(z){
  const keys = Object.keys(MON).filter(k => k !== "eater" || z >= 2), key = keys[Math.floor(Math.random()*keys.length)];
  const [x,y] = worldSpot(z, 110), [tx,ty] = randSpot(z);
  monsters.push({ key, x, y, z, tx, ty, h:0, cd:0 });
}
/* 왼쪽을 보는 괴물 한 마리. r: 몸 크기, t: 시간(꿈틀거림), hit: 맞았을 때 번쩍임 */
function drawMonster(g, key, x, y, r, t, hit){
  const M = MON[key], col = hit > 0.5 ? "#ffffff" : M.col, dk = "#10131f";
  g.save(); g.translate(x, y); g.lineCap = "round"; g.lineJoin = "round";
  if(key === "whale"){
    g.fillStyle = rgba(col,.9); g.beginPath(); g.ellipse(0, 0, r*1.5, r*0.62, 0, 0, 7); g.fill();
    const tw = Math.sin(t*1.6)*r*0.25;
    g.beginPath(); g.moveTo(r*1.3, 0); g.lineTo(r*2.15, -r*0.6+tw); g.lineTo(r*1.85, tw*0.5); g.lineTo(r*2.15, r*0.6+tw); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-r*0.2, r*0.4); g.lineTo(r*0.35, r*1.05+tw*0.4); g.lineTo(r*0.55, r*0.4); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-r*0.1, r*0.22, r*1.15, r*0.3, 0, 0, 3.14); g.fill();
    g.fillStyle = "#ffffff"; for(let i=0;i<5;i++){ g.globalAlpha = .5+Math.sin(t*3+i)*.4; g.beginPath(); g.arc(-r*0.5+i*r*0.38, -r*0.28, r*0.07, 0, 7); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = dk; g.beginPath(); g.arc(-r*1.05, -r*0.08, r*0.1, 0, 7); g.fill();
  } else if(key === "kraken"){
    g.strokeStyle = rgba(col,.85); g.lineWidth = r*0.2;
    for(let i=0;i<8;i++){ const a = -1.1+i*0.31+Math.sin(t*1.4+i)*0.12, w = Math.sin(t*2+i)*0.5;
      g.beginPath(); g.moveTo(Math.cos(a)*r*0.6, Math.sin(a)*r*0.6);
      g.quadraticCurveTo(Math.cos(a+0.35)*r*1.5, Math.sin(a+0.35)*r*1.5, Math.cos(a+w)*r*2.3, Math.sin(a+w)*r*2.3); g.stroke(); }
    const gr = g.createRadialGradient(-r*0.5,-r*0.3,r*0.1,-r*0.3,0,r*1.1); gr.addColorStop(0,"#ffffff"); gr.addColorStop(.4,col); gr.addColorStop(1,rgba(col,.4));
    g.fillStyle = hit > 0.5 ? "#ffffff" : gr; g.beginPath(); g.ellipse(-r*0.35, 0, r*1.05, r*0.85, 0, 0, 7); g.fill();
    g.fillStyle = "#fff6c8"; g.beginPath(); g.ellipse(-r*0.75, 0, r*0.3, r*0.38, 0, 0, 7); g.fill();
    g.fillStyle = dk; g.beginPath(); g.ellipse(-r*0.82, 0, r*0.1, r*0.3, 0, 0, 7); g.fill();
  } else if(key === "serpent"){
    for(let i=11;i>=0;i--){ const px = -r*1.2+i*r*0.32, py = Math.sin(t*2.4+i*0.7)*r*0.45, rr = r*(0.42-i*0.024);
      glow(g, px, py, rr*1.8, "#ff5a3c", .25); g.fillStyle = i%2 ? rgba(col,.95) : (hit > 0.5 ? "#ffffff" : "#ff7a3c"); g.beginPath(); g.arc(px, py, rr, 0, 7); g.fill(); }
    const hy = Math.sin(t*2.4)*r*0.45;
    g.fillStyle = col; g.beginPath(); g.moveTo(-r*1.85, hy); g.lineTo(-r*1.2, hy-r*0.5); g.lineTo(-r*0.95, hy); g.lineTo(-r*1.2, hy+r*0.5); g.closePath(); g.fill();
    g.fillStyle = dk; g.beginPath(); g.arc(-r*1.4, hy-r*0.16, r*0.08, 0, 7); g.arc(-r*1.4, hy+r*0.16, r*0.08, 0, 7); g.fill();
  } else if(key === "swarm"){
    for(let i=0;i<18;i++){ const a = i*2.4+t*(0.8+(i%4)*0.25), d = r*(0.35+((i*37)%10)/10*1.25), px = Math.cos(a)*d, py = Math.sin(a*1.3)*d*0.75, s = r*(0.14+(i%3)*0.04);
      g.fillStyle = i%5 ? rgba(col,.95) : "#f4ffd8"; g.beginPath(); g.moveTo(px-s*1.6, py); g.lineTo(px, py-s); g.lineTo(px+s*1.4, py); g.lineTo(px, py+s); g.closePath(); g.fill();
      g.strokeStyle = rgba(col,.5); g.lineWidth = s*0.3; g.beginPath(); g.moveTo(px, py-s); g.lineTo(px+s, py-s*2.2); g.moveTo(px, py+s); g.lineTo(px+s, py+s*2.2); g.stroke(); }
  } else {
    glow(g, 0, 0, r*2.2, "#ff3a2a", .3);
    g.fillStyle = hit > 0.5 ? "#ffffff" : "#3a1418"; g.beginPath(); g.arc(0, 0, r*1.25, 0, 7); g.fill();
    for(let i=0;i<9;i++){ const a = i/9*6.283+t*0.3; g.fillStyle = rgba(col,.9); g.beginPath();
      g.moveTo(Math.cos(a-0.16)*r*1.2, Math.sin(a-0.16)*r*1.2); g.lineTo(Math.cos(a)*r*1.9, Math.sin(a)*r*1.9); g.lineTo(Math.cos(a+0.16)*r*1.2, Math.sin(a+0.16)*r*1.2); g.fill(); }
    const mw = r*(0.55+Math.sin(t*2.2)*0.12);
    const gr = g.createRadialGradient(-r*0.25,0,r*0.05,-r*0.25,0,mw); gr.addColorStop(0,"#fff2a8"); gr.addColorStop(.5,"#ff7a3c"); gr.addColorStop(1,"#7a1414");
    g.fillStyle = gr; g.beginPath(); g.arc(-r*0.25, 0, mw, 0, 7); g.fill();
    g.fillStyle = "#fff6e8"; for(let i=0;i<10;i++){ const a = i/10*6.283; g.beginPath();
      g.moveTo(-r*0.25+Math.cos(a-0.14)*mw, Math.sin(a-0.14)*mw); g.lineTo(-r*0.25+Math.cos(a)*mw*0.62, Math.sin(a)*mw*0.62); g.lineTo(-r*0.25+Math.cos(a+0.14)*mw, Math.sin(a+0.14)*mw); g.fill(); }
  }
  g.restore();
}
function monDone(m, days){ m.cd = state.day+(days||3); [m.x,m.y] = worldSpot(m.z, 110); [m.tx,m.ty] = randSpot(m.z); }
function monSlain(key){ const f = fate(), first = !f.slain[key]; f.slain[key] = (f.slain[key]||0)+1; cutTry("monster");
  if(first){ addGems(2, state.x, state.y); toast(__`🏆 ${MON[key].name}을(를) 처음으로 쓰러뜨렸습니다! 도감에 기록됩니다 (💎+2)`, true); } }
function openMonster(m, st){
  const M = MON[m.key], z = m.z, zf = z+1, pow = monPow(m), gems = 2+Math.floor(z/2), feed = 6, f = fate();
  const tame = Math.round(clamp((M.calm ? 62 : 30)+st.luck*0.4+(f.tamed[m.key] ? 20 : 0), 10, 92)), n = Math.round(10*zf);
  f.seen[m.key] = true;
  const fight = () => startCombat({ kind:"raider", alien:true, mon:m.key, name:M.name, pow, z, gems });
  encModal(`${M.ic} ${M.name}`, ZONES[z].name, M.ic, M.desc + (f.tamed[m.key] ? `<br><b class="acc">${__("예전에 길들인 적이 있는 종입니다. 이쪽을 알아보는 것 같습니다.")}</b>` : ""), [
    { t:__`⚔️ 맞서 싸운다 (전투력 ${pow} · 승리 시 💎+${gems})`, fn:fight },
    { t:__`🍖 화물 ${feed}개를 먹이로 던진다 (길들일 확률 ${tame}%)`, off:cargoUsed() < feed, fn:()=>{ let left = feed;
        for(const gd of GOODS){ const q = Math.min(left, state.cargo[gd.id]||0); if(q){ state.cargo[gd.id] -= q; if(!state.cargo[gd.id]) delete state.cargo[gd.id]; left -= q; } }
        if(Math.random()*100 < tame){ f.tamed[m.key] = (f.tamed[m.key]||0)+1; cutTry("tame"); for(const r of raiders) r.cd = Math.max(r.cd, state.day+3); addGems(1, state.x, state.y); sfx("fanfare");
          say(["sci","vice"], __`${M.name}이(가) 먹이를 받아먹고 함선 곁을 맴돕니다. 3일 동안 곁을 지켜 주어 해적이 다가오지 못합니다. (💎+1)`, true); }
        else if(M.calm){ sfx("blip"); toast(__`${M.name}이(가) 먹이만 삼키고 유유히 사라졌습니다`); }
        else { toast(__`${M.name}이(가) 먹이를 삼키고도 달려듭니다!`); fight(); } } },
    { t:__`🔭 숨죽여 관찰한다 (🔬+${n})`, fn:()=>{ if(!M.calm && Math.random() < 0.3){ toast(__`${M.name}에게 들켰습니다!`); fight(); return; }
        const got = addSci(n); sfx("discover"); say("sci", __`${M.name}의 생태를 기록했습니다. 귀한 자료입니다 (🔬+${got})`, true); } },
    { t:__`🚀 달아난다 (성공 ${M.calm ? 100 : fleeChance(st)}%)`, ghost:true, fn:()=>{ if(M.calm || Math.random()*100 < fleeChance(st)) toast(__("전속력으로 빠져나왔습니다"));
        else damage(st.hull*0.15, __`달아나다 ${M.name}에게 꼬리를 물렸습니다`); } } ]);
  monDone(m);
}

/* ── 우연 ── */
const allAff = n => { for(const id of state.mates) state.aff[id] = Math.min(100, (state.aff[id]||0)+n); };
const FATE_EVENTS = [
  (st, zf) => encModal(__("🌠 유성우"), "", "🌠", __("유성우가 함선 주위로 쏟아집니다. 승무원들이 하나둘 관측창으로 모여듭니다."), [
    { t:__("✨ 다 같이 구경한다 (승무원 호감도 +4)"), fn:()=>{ allAff(4); sfx("ok"); cutTry("meteor"); say(["vice","doc"], __("모두 말없이 유성우를 바라봤습니다. 함교 분위기가 한결 따뜻해졌습니다. (호감도 +4) 💞"), true); } },
    { t:__("⛏ 유성 조각을 건진다 (크레딧 · 선체 위험)"), fn:()=>{ const g = Math.round(R(150,400)*zf); state.gold += g; sfx("coin"); say("cargo", __`유성 조각을 건져 올렸습니다 (+${fmt(g)}💠)`, true);
        if(Math.random() < 0.3) damage(st.hull*0.08, __("유성 조각이 선체를 스쳤습니다")); } } ]),
  (st, zf) => { const f = fate(); if(f.letter) return false;
    const ports = PORTS.filter(p => p.z <= state.tech.warp && dist(p.x,p.y,state.x,state.y) > 120); if(!ports.length) return false;
    const p = ports[Math.floor(Math.random()*ports.length)];
    encModal(__("📨 메시지 캡슐"), "", "📨", __`낡은 메시지 캡슐이 떠다닙니다. 안에는 부치지 못한 편지 한 통이 들어 있습니다.<br>받는 곳은 <b>${ZONES[p.z].name} · ${p.name}</b>입니다.`, [
      { t:__("📨 대신 전해 주기로 한다"), fn:()=>{ f.letter = p.id; sfx("ok"); say("comm", __`편지를 맡았습니다. <b>${p.name}</b>에 입항하면 전해 줄 수 있습니다.`, true); } },
      { t:__("그냥 지나친다"), ghost:true, fn:()=>{} } ]); },
  (st, zf) => encModal(__("💫 소원 별똥별"), "", "💫", __("유난히 밝은 별똥별이 함선 앞을 가로지릅니다. 승무원들이 소원을 빌자고 합니다."), [
    { t:__("⛽ 무사한 항해를 빈다 (연료·산소 가득)"), fn:()=>{ state.fuel = st.sup; state.o2 = st.sup; sfx("ok"); toast(__("탱크 계기판이 가득 찼습니다. 우연일까요?"), true); } },
    { t:__("🛡 튼튼한 배를 빈다 (선체 완전 수리)"), fn:()=>{ state.hull = st.hull; sfx("ok"); toast(__("선체의 균열이 감쪽같이 사라졌습니다. 우연일까요?"), true); } },
    { t:__("💎 큰 행운을 빈다 (절반의 확률로 💎+2)"), fn:()=>{ if(Math.random() < 0.5) addGems(2, state.x, state.y); else toast(__("별똥별은 아무 대답 없이 사라졌습니다")); } } ]),
  (st, zf) => { const f = fate(); if(f.stow) return false;
    encModal(__("🧳 밀항자"), "", "🧳", __("화물칸 구석에서 밀항자가 발견됐습니다. 고향을 잃고 떠돌고 있다며 다음 기지까지만 태워 달라고 합니다."), [
      { t:__("🤝 다음 기지까지 태워 준다"), fn:()=>{ f.stow = true; sfx("ok"); say("vice", __("밀항자에게 빈 선실을 내주었습니다. 다음 기지에서 내려 주기로 했습니다.")); } },
      { t:__("🚪 구명정에 태워 내보낸다"), ghost:true, fn:()=>{} } ]); },
  (st, zf) => encModal(__("👥 쌍둥이 신호"), "", "👥", __("우리 함선과 완전히 똑같은 식별 신호가 잡힙니다. 화면 속에서 또 다른 '우리'가 손을 흔들고 있습니다."), [
    { t:__("📡 교신을 시도한다 (운에 따라)"), fn:()=>{ if(Math.random()*100 < clamp(50+st.luck*0.6, 25, 90)){ const n = addSci(16*zf); addGems(1, state.x, state.y); sfx("discover");
          say("sci", __`저쪽의 '우리'가 항해 기록을 보내왔습니다. 우리가 가지 않은 길의 기록입니다 (🔬+${n} 💎+1)`, true); }
        else { state.buff = { t:"broken", until:state.day+1 }; sfx("bad"); say("comm", __("신호가 겹치며 항법 장치가 하루 동안 먹통이 됐습니다. 화면 속의 '우리'는 사라졌습니다.")); } } },
    { t:__("모른 척 지나간다"), ghost:true, fn:()=>{} } ]),
  (st, zf) => { const f = fate(); if(f.pet) return false;
    encModal(__("🐾 작은 손님"), "", "🐾", __("선체에 작은 우주 생물이 달라붙어 있습니다. 관측창을 톡톡 두드리며 안을 들여다봅니다."), [
      { t:__("🐾 함선에 들인다 (마스코트 · 행운 +3)"), fn:()=>{ f.pet = true; allAff(3); cutTry("tame"); sfx("fanfare"); say(["doc","vice"], __("작은 생물이 함교를 제집처럼 돌아다닙니다. 승무원들이 벌써 이름을 지어 주었습니다. (행운 +3)"), true); } },
      { t:__`🔬 살펴보고 놓아준다 (🔬+${Math.round(12*zf)})`, fn:()=>{ const n = addSci(12*zf); sfx("discover"); say("sci", __`작은 생물을 살펴보고 우주로 돌려보냈습니다 (🔬+${n})`, true); } } ]); },
  (st, zf) => { allAff(3); sfx("blip"); say(["comm","vice"], __("📻 수백 년 전 지구를 떠난 라디오 전파가 이제야 닿았습니다. 오래된 노래가 함교에 흐릅니다. (호감도 +3)"), true); return false; },
];
/* 입항할 때: 맡은 편지 전달 · 밀항자의 정체 */
function fateDock(id){
  const f = fate(), zf = BODY_MAP[id].z+1;
  if(f.letter === id){ f.letter = null; const g = Math.round(800*zf), k = ["merchant","patrol","science"][Math.floor(Math.random()*3)]; state.gold += g; addGems(1); addBond(k);
    say(["comm","vice"], __`📨 편지를 전했습니다. 받는 이가 한참을 읽더니 눈시울을 붉히며 사례했습니다 (+${fmt(g)}💠 💎+1)`, true); }
  if(f.stow){ f.stow = false;
    if(Math.random() < 0.4){ allAff(6); say(["doc","vice"], __("🧳 밀항자는 알고 보니 이름난 요리사였습니다. 내리기 전에 차려 준 만찬에 모두가 감동했습니다. (호감도 +6)"), true); }
    else { const g = Math.round(R(300,700)*zf); state.gold += g; bonds().favor = (bonds().favor||0)+1; say(["vice","comm"], __`🧳 밀항자가 내리며 꼬깃꼬깃한 돈을 쥐여 주었습니다. 이 은혜는 꼭 갚겠다고 합니다 (+${fmt(g)}💠)`, true); } }
}

/* ── 이어지는 인연 ── */
const FATED = {
  kai:  { ic:"🏁", name:__("라이벌 선장 카이"),  perk:__("함선 속도 +3%") },
  miro: { ic:"🧺", name:__("떠돌이 상인 미로"),  perk:__("판매가 +3%") },
};
function openFated(id, st){
  const f = fate(), C = FATED[id], s = f.fated[id]||0, z = zoneOf(state.y), zf = z+1, sub = __`인연 ${s+1}/3`, title = `${C.ic} ${C.name}`;
  const next = () => { f.fated[id] = s+1; if(s+1 >= 3){ sfx("fanfare"); toast(__`🤝 ${C.name}와(과)의 인연이 완성됐습니다! (${C.perk})`, true); } };
  if(id === "kai"){
    if(s === 0){ const win = st.speed*R(.85,1.2) > 52+z*8, g = Math.round(500*zf), lose = Math.min(state.gold, Math.round(200*zf));
      encModal(title, sub, C.ic, __("붉은 쾌속선이 옆에 바짝 붙습니다.<br>“처음 보는 얼굴이군. 나는 카이. 저 앞 소행성까지 내기 한 판 어때?”"), [
        { t:__("🏁 경주를 받아들인다 (속도 승부)"), fn:()=>{ next(); if(win){ state.gold += g; sfx("fanfare"); say("nav", __`간발의 차로 카이를 따돌렸습니다! 카이가 혀를 차며 내기 돈을 던져 줍니다 (+${fmt(g)}💠)`, true); }
            else { state.gold -= lose; sfx("bad"); say("nav", __`카이의 배가 먼저 들어갔습니다. “다음엔 더 빠른 배로 오라고!” (−${fmt(lose)}💠)`); } } },
        { t:__("정중히 거절한다"), ghost:true, fn:()=>{} } ]); }
    else if(s === 1){ const need = Math.max(1, st.sup*0.2), g = Math.round(600*zf);
      encModal(title, sub, C.ic, __("카이의 배가 연기를 뿜으며 떠 있습니다.<br>“…하필 너한테 이런 꼴을 보이다니. 연료 좀 나눠 줄 수 있나?”"), [
        { t:__("⛽ 연료 20%를 그냥 나눠 준다"), off:state.fuel < need, fn:()=>{ state.fuel -= need; f.flag.kai = true; next(); sfx("ok"); say("vice", __("카이가 한참 말이 없다가 입을 엽니다. “…빚졌다. 꼭 갚지.”"), true); } },
        { t:__`💠 연료를 비싸게 판다 (+${fmt(g)}💠)`, off:state.fuel < need, fn:()=>{ state.fuel -= need; state.gold += g; next(); sfx("coin"); say("cargo", __`카이가 이를 갈며 값을 치렀습니다 (+${fmt(g)}💠)`); } },
        { t:__("못 본 척 지나간다"), ghost:true, fn:()=>{ next(); } } ]); }
    else { const pow = Math.round((30+z*30)*(f.flag.kai ? 0.6 : 1));
      encModal(title, sub, C.ic, (f.flag.kai ? __("“빚은 갚는다.” 카이가 해적 함대의 위치를 보내옵니다. 이번에는 나란히 싸우자고 합니다.") : __("카이가 해적 함대의 위치를 보내옵니다. “혼자서는 벅차. 손 좀 빌리지.”")), [
        { t:__`⚔️ 함께 해적을 친다 (전투력 ${pow} · 승리 시 💎+3)`, fn:()=>{ next(); startCombat({ kind:"raider", name:__("해적 순양함"), foe:"cruiser", pow, z, gems:3 }); } },
        { t:__("이번에는 사양한다"), ghost:true, fn:()=>{ next(); } } ]); }
  } else {
    if(s === 0){ const price = Math.round(300*zf);
      encModal(title, sub, C.ic, __("작은 행상선이 통통거리며 다가옵니다.<br>“안녕, 선장! 나는 미로. 첫 손님한테는 덤을 주는 게 우리 집 가훈이야.”"), [
        { t:__("🎁 덤을 받는다 (연료·산소 가득)"), fn:()=>{ state.fuel = st.sup; state.o2 = st.sup; next(); sfx("ok"); say("eng", __("미로가 탱크를 가득 채워 주고 손을 흔들며 떠났습니다."), true); } },
        { t:__`💠 물건을 사 준다 (−${fmt(price)}💠 → 💎+1)`, off:state.gold < price, fn:()=>{ state.gold -= price; addGems(1, state.x, state.y); f.flag.miro = true; next(); say("cargo", __("미로가 활짝 웃으며 가장 아끼던 결정을 내주었습니다."), true); } } ]); }
    else if(s === 1){ const debt = Math.round(800*zf), pow = Math.round(18+z*24);
      encModal(title, sub, C.ic, __("미로의 배가 빚쟁이들의 배에 둘러싸여 있습니다.<br>“선장… 이번 한 번만 도와주면 안 될까?”"), [
        { t:__`💠 빚을 대신 갚아 준다 (−${fmt(debt)}💠)`, off:state.gold < debt, fn:()=>{ state.gold -= debt; f.flag.miro2 = true; next(); sfx("ok"); say("vice", __("빚쟁이들이 물러갔습니다. 미로가 울먹이며 몇 번이고 고개를 숙입니다."), true); } },
        { t:__`⚔️ 빚쟁이들을 쫓아낸다 (전투력 ${pow})`, fn:()=>{ f.flag.miro2 = true; next(); startCombat({ kind:"raider", name:__("빚쟁이 무리"), foe:"corvet", pow, z }); } },
        { t:__("못 본 척 지나간다"), ghost:true, fn:()=>{ next(); } } ]); }
    else { const gems = f.flag.miro2 ? 5 : 1, g = Math.round((f.flag.miro2 ? 2000 : 300)*zf);
      encModal(title, sub, C.ic, (f.flag.miro2 ? __("번듯한 상선이 다가옵니다. 미로입니다.<br>“그때 일, 하루도 잊은 적 없어. 이건 내 마음이야.”") : __("번듯한 상선이 다가옵니다. 미로입니다.<br>“오랜만이야, 선장. 나 이제 제법 잘나가.”")), [
        { t:__`🎁 선물을 받는다 (+${fmt(g)}💠 💎+${gems})`, fn:()=>{ state.gold += g; addGems(gems, state.x, state.y); next(); } } ]); }
  }
}
/* 인연을 끝까지 이어 가면 붙는 영구 보너스 · 마스코트 (bonus()에서 부른다) */
function fateBonus(b){ const f = state.fate; if(!f) return;
  if(f.pet) b.luck += 3; if((f.fated.kai||0) >= 3) b.speed += 0.03; if((f.fated.miro||0) >= 3) b.sell += 0.03; }

/* ── 매 프레임 (항해 중). 항해가 끊기면 true ── */
function fateEnsure(){
  const f = fate();
  for(let z=0; z<=state.tech.warp; z++) if(!monsters.some(m=>m.z===z)) spawnMonster(z);
  if(!fatedNPC && state.day >= f.cd){ const z = zoneOf(state.y), open = Object.keys(FATED).filter(k => (f.fated[k]||0) < 3);
    if(open.length && z <= state.tech.warp){ const [x,y] = worldSpot(z, 45), [tx,ty] = randSpot(z); fatedNPC = { id:open[Math.floor(Math.random()*open.length)], x, y, z, tx, ty }; } }
}
function updateFate(rdt, dt, st){
  fateTick += rdt; if(fateTick >= 1){ fateTick = 0; fateEnsure(); }
  const safe = PORTS.some(p=>dist(state.x,state.y,p.x,p.y) < 90);
  for(const m of monsters){ if(m.z > state.tech.warp) continue;
    const M = MON[m.key], d = dist(state.x,state.y,m.x,m.y), ready = state.day >= m.cd, chase = !M.calm && ready && !safe && d < 70;
    const gx = chase ? state.x : m.tx, gy = chase ? state.y : m.ty, v = chase ? 26+m.z*5 : 7, dg = dist(m.x,m.y,gx,gy);
    if(dg < 4 && !chase) [m.tx,m.ty] = randSpot(m.z);
    else if(dg > 0.1){ m.h = Math.atan2(gy-m.y,gx-m.x); m.x += (gx-m.x)/dg*v*dt; m.y += (gy-m.y)/dg*v*dt; }
    m.chase = chase;
    if(ready && d < M.r*0.5+2.5){ openMonster(m, st); return true; } }
  if(fatedNPC){ const v = fatedNPC, dg = dist(v.x,v.y,v.tx,v.ty);
    if(dg < 2) [v.tx,v.ty] = randSpot(v.z); else { v.x += (v.tx-v.x)/dg*1.3*rdt; v.y += (v.ty-v.y)/dg*1.3*rdt; }
    if(dist(state.x,state.y,v.x,v.y) < 2.8){ fatedNPC = null; fate().cd = state.day+R(3,5); openFated(v.id, st); return true; } }
  /* 우연: 기지에서 떨어져 항해할 때 가끔 */
  fateT += rdt;
  if(fateT >= fateNext && !safe){ fateT = 0; fateNext = R(50,90);
    const ev = FATE_EVENTS[Math.floor(Math.random()*FATE_EVENTS.length)];
    ev(st, zoneOf(state.y)+1); if(paused) return true; }
  return false;
}

/* ── 그리기 ── */
function drawFate(g, u, vis, F){
  for(const m of monsters){ if(m.z > state.tech.warp || !vis(m.x,m.y,30)) continue;
    const M = MON[m.key], ready = state.day >= m.cd;
    g.globalAlpha = ready ? 1 : 0.4;
    g.save(); g.translate(m.x, m.y); g.rotate(m.h+Math.PI); if(Math.cos(m.h) > 0) g.scale(1,-1);   /* 머리가 가는 쪽을 보되 뒤집히지 않게 */
    drawMonster(g, m.key, 0, 0, Math.max(M.r*0.55, 9*u), bobT, 0); g.restore();
    if(m.chase){ g.strokeStyle = rgba("#c8503c",.5); g.lineWidth = u; g.setLineDash([3*u,5*u]); g.beginPath(); g.moveTo(m.x,m.y); g.lineTo(state.x,state.y); g.stroke(); g.setLineDash([]); }
    label(`${M.ic} ${M.name}${m.chase?" ❗":""}`, m.x, m.y+Math.max(M.r*1.2, 16*u)+10*u, m.chase ? "#c8503c" : M.calm ? "#4a90d9" : "#8e6fd8", F(700)); g.globalAlpha = 1; }
  if(fatedNPC && fatedNPC.z <= state.tech.warp && vis(fatedNPC.x,fatedNPC.y,10)){ const v = fatedNPC, C = FATED[v.id];
    g.strokeStyle = rgba("#e0a63f", .55+Math.sin(bobT*3)*.25); g.lineWidth = 1.6*u; g.beginPath(); g.arc(v.x, v.y, (16+Math.sin(bobT*3)*2)*u, 0, 7); g.stroke();
    g.font = `${20*u}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#000"; g.fillText(C.ic, v.x, v.y);
    label(`✨ ${C.name}`, v.x, v.y+20*u, "#b8863f", F(700)); }
}

/* ── 도감(인연 탭)에 붙는 기록 ── */
function fateHTML(){
  const f = fate();
  let html = `<div class="sec">${__`이어지는 인연`}</div>`;
  for(const k in FATED){ const C = FATED[k], s = Math.min(3, f.fated[k]||0);
    html += `<div class="card"><div class="row"><div style="font-size:26px;width:34px;text-align:center">${C.ic}</div>
      <div class="grow"><div class="ttl">${s ? C.name : "???"} <span class="stat">${s} / 3</span></div><div class="stat">${s ? __`인연을 끝까지 이으면 ${C.perk}` : __("항해 중 우연히 마주칩니다")}</div>
        <div class="bar"><i style="width:${s/3*100}%"></i></div></div></div></div>`; }
  html += `<div class="sec">${__`우주 괴물`}</div>`;
  for(const k in MON){ const M = MON[k], seen = f.seen[k];
    html += `<div class="card ${seen?"":"dim"}"><div class="row"><div style="font-size:26px;width:34px;text-align:center">${seen ? M.ic : "❔"}</div>
      <div class="grow"><div class="ttl">${seen ? M.name : "???"}</div><div class="stat">${seen ? M.desc : __("아직 마주친 적이 없습니다")}</div>
        ${seen ? `<div class="stat acc">${__`쓰러뜨림 ${f.slain[k]||0}회 · 길들임 ${f.tamed[k]||0}회`}</div>` : ""}</div></div></div>`; }
  if(f.pet) html += `<div class="stat" style="margin:8px 4px">${__("🐾 함선 마스코트가 함께 항해 중입니다 (행운 +3)")}</div>`;
  if(f.letter && BODY_MAP[f.letter]) html += `<div class="stat" style="margin:8px 4px">${__`📨 맡은 편지: <b>${BODY_MAP[f.letter].name}</b>에 전해 주기로 했습니다`}</div>`;
  return html;
}
