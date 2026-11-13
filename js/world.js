"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 우주 현상 · 인연 ══════════════════
   · 우주 현상: 떠돌이 블랙홀(자리를 옮겨 다닌다) · 웜홀(순간 이동) · 초신성 폭발과 잔해 · 혜성 · 이온 폭풍
   · 인연: 항해 중 마주치는 배들(상인 캐러밴·순찰대·방랑 과학자·조난선·외계 사절·유령선·현상금 사냥꾼)과의 선택형 만남.
           자주 만난 세력과는 인연이 깊어져 더 좋은 조건을 받는다.
   설계 원칙: 몇 분마다 선택할 거리를 주고, 기지 근처와 출발 직후는 안전하게, 드물게(약 5%) 훨씬 큰 것이 나온다. */
let phen = [], visitors = [], worldT = 0, novaT = 150, cometT = 60, whCd = 0, stormZap = 0;
const BH_PULL = 95, NOVA_MAX = 70, NOVA_SPEED = 9, NOVA_COUNT = 12;

/* ── 인연(세력 평판) ── */
const BONDS = {
  merchant:{ ic:"🛒", name:__("상인 연합"),   perk:__("캐러밴에 화물을 더 비싸게 팔고 보급을 싸게 받는다") },
  patrol:  { ic:"🛡", name:__("은하 순찰대"), perk:__("수리비가 줄고 호위 기간이 늘어난다") },
  science: { ic:"🔬", name:__("과학 길드"),   perk:__("연구 데이터를 더 싸게 산다") },
  alien:   { ic:"👽", name:__("외계 사절단"), perk:__("선물로 받는 보석이 늘어난다") },
};
function bonds(){ if(!state.bonds) state.bonds = { merchant:0, patrol:0, science:0, alien:0, favor:0 }; return state.bonds; }
const bondLv = k => Math.min(5, Math.floor((bonds()[k]||0)/2));
function addBond(k, n){
  const before = bondLv(k); bonds()[k] = (bonds()[k]||0) + (n||1);
  if(bondLv(k) > before){ sfx("fanfare"); toast(__`🤝 ${BONDS[k].name}와(과)의 인연이 깊어졌습니다 (Lv.${bondLv(k)})`, true); }
}
function bondsHTML(){
  let html = `<div class="stat" style="margin:0 4px 10px">${__`항해 중 마주치는 배들과 만날수록 인연이 깊어집니다. 인연이 깊은 세력은 더 좋은 조건을 내줍니다.`}</div>`;
  for(const k in BONDS){ const b = BONDS[k], lv = bondLv(k), pts = bonds()[k]||0;
    html += `<div class="card"><div class="row"><div style="font-size:26px;width:34px;text-align:center">${b.ic}</div>
      <div class="grow"><div class="ttl">${b.name} <span class="stat">Lv.${lv} / 5</span></div><div class="stat">${b.perk}</div>
        <div class="bar"><i style="width:${Math.min(100, pts*10)}%"></i></div></div></div></div>`; }
  html += `<div class="card"><div class="row"><div style="font-size:26px;width:34px;text-align:center">🕊</div>
    <div class="grow"><div class="ttl">${__`갚을 은혜`} <span class="stat">${bonds().favor||0}</span></div>
      <div class="stat">${__`구해 준 조난자들은 언젠가 항해 중에 은혜를 갚으러 찾아옵니다.`}</div></div></div></div>`;
  return html;
}

/* ── 생성 ── */
function worldSpot(z, far){                     /* 기지에서 떨어져 있고, 함선 바로 옆은 아닌 자리 */
  for(let t=0;t<30;t++){ const [x,y] = randSpot(z); if(dist(x,y,state.x,state.y) > (far||35)) return [x,y]; }
  return randSpot(z);
}
function worldEnsure(){
  for(let z=0; z<=state.tech.warp; z++){
    if(!phen.some(p=>p.kind==="bh" && p.z===z)){ const [x,y] = worldSpot(z, 120), a = Math.random()*6.283, big = Math.random() < 0.05;
      phen.push({ kind:"bh", k:"bh", c:"#1a1410", x, y, z, r:big?R(15,19):R(7,11), big, vx:Math.cos(a)*0.28, vy:Math.sin(a)*0.28, until:state.day+R(6,10), min:1e9 }); }
    if(!phen.some(p=>p.kind==="wh" && p.z===z)){ const [x,y] = worldSpot(z, 60);
      const z2 = Math.random() < 0.6 ? z : Math.floor(Math.random()*(state.tech.warp+1)), [x2,y2] = worldSpot(z2, 60);
      phen.push({ kind:"wh", x, y, z, x2, y2, z2, until:state.day+R(8,12) }); }
    if(!phen.some(p=>p.kind==="storm" && p.z===z)){ const [x,y] = worldSpot(z, 70), a = Math.random()*6.283;
      phen.push({ kind:"storm", x, y, z, r:R(14,22), vx:Math.cos(a)*0.5, vy:Math.sin(a)*0.5, until:state.day+R(5,9) }); }
    while(visitors.filter(v=>v.z===z).length < 3) spawnVisitor(z);
  }
}
const VISITOR = {
  trader:   { ic:"🛒", name:__("상인 캐러밴"),     w:22 },
  patrol:   { ic:"🛡", name:__("은하 순찰대"),     w:16 },
  scientist:{ ic:"🔬", name:__("방랑 과학자"),     w:14 },
  distress: { ic:"🆘", name:__("조난선"),          w:16 },
  envoy:    { ic:"👽", name:__("외계 사절"),       w:10 },
  ghost:    { ic:"👻", name:__("유령선"),          w:10 },
  hunter:   { ic:"🎯", name:__("현상금 사냥꾼"),   w:12 },
};
function spawnVisitor(z){
  let tot = 0; for(const k in VISITOR) tot += VISITOR[k].w;
  let r = Math.random()*tot, kind = "trader"; for(const k in VISITOR){ r -= VISITOR[k].w; if(r <= 0){ kind = k; break; } }
  const [x,y] = worldSpot(z, 40), [tx,ty] = randSpot(z);
  visitors.push({ kind, x, y, z, tx, ty, cd:0, rare:Math.random() < 0.05 });   /* rare: 드물게 훨씬 후한 만남 */
}

/* ── 매 프레임 (항해 중). 항해가 끊기면 true ── */
function worldSpeedMul(){ return phen.some(p=>p.kind==="storm" && dist(state.x,state.y,p.x,p.y) < p.r) ? 0.6 : 1; }
function updateWorld(rdt, dt, st){
  worldT += rdt; if(whCd > 0) whCd -= rdt;
  if(worldT >= 1){ worldT = 0; worldEnsure();
    phen = phen.filter(p => p.until === undefined || p.until > state.day);
    if(bonds().favor > 0 && Math.random() < 0.006) favorReturn(st);
  }
  const z = zoneOf(state.y), safe = PORTS.some(p=>dist(state.x,state.y,p.x,p.y) < 30);
  /* 초신성 · 혜성은 때가 되면 근처에 나타난다 */
  novaT -= rdt; cometT -= rdt;
  if(novaT <= 0){ novaT = R(150,260); if(z >= 1 && !safe){ const a = Math.random()*6.283, d = R(26,44);
      phen.push({ kind:"nova", x:state.x+Math.cos(a)*d, y:state.y+Math.sin(a)*d, z, t:-NOVA_COUNT, hit:false });
      sfx("alarm"); fxBanner(__("⚠️ 초신성 폭발 임박"), __`${NOVA_COUNT}초 안에 멀리 벗어나세요`, "#c8201a");
      say(["sci","nav"], __`⚠️ 근처의 별이 곧 폭발합니다! ${NOVA_COUNT}초 뒤 충격파가 퍼집니다. 멀어질수록 피해가 줄어듭니다.`); } }
  if(cometT <= 0){ cometT = R(80,140); if(!safe){ const a = Math.random()*6.283, sp = 6.5, T = 7;
      const px = state.x+Math.cos(state.heading)*st.speed*TIME_SCALE*T, py = state.y+Math.sin(state.heading)*st.speed*TIME_SCALE*T+R(-9,9);
      phen.push({ kind:"comet", x:px+Math.cos(a)*sp*T, y:py+Math.sin(a)*sp*T, vx:-Math.cos(a)*sp, vy:-Math.sin(a)*sp, z, t:0 });
      toast(__("☄️ 혜성이 지나갑니다! 따라잡으면 얼음과 산소를 얻습니다")); } }

  for(const p of phen){
    const d = dist(state.x,state.y,p.x,p.y);
    if(p.kind === "bh"){
      p.x += p.vx*rdt; p.y += p.vy*rdt;
      if(p.x < 60 || p.x > WORLD_W-60) p.vx *= -1;
      if(p.y < ZY(p.z,.96) || p.y > ZY(p.z,.04)) p.vy *= -1;
      if(!p.seen && d < 55){ p.seen = true; const n = addSci(12*(p.z+1)); sfx("alarm");
        fxBanner(p.big ? __("⚠️ 거대 떠돌이 블랙홀") : __("⚠️ 떠돌이 블랙홀"), __("끌려 들어가기 전에 방향을 트세요"), "#8e6fd8");
        say(["sci","nav"], __`⚠️ 떠돌이 블랙홀을 포착했습니다! 가까이 가면 끌려 들어갑니다. 스쳐 지나가면 가속을 얻습니다. (🔬+${n})`, true); }
      const PR = BH_PULL*(p.big?1.5:1);
      if(d < PR){
        const pull = (1-d/PR)*(p.big?48:32)*dt; state.x += (p.x-state.x)/d*pull; state.y += (p.y-state.y)/d*pull;
        p.inside = true; p.min = Math.min(p.min, d);
        if(d < p.r*0.85+0.8){
          const a = Math.atan2(state.y-p.y, state.x-p.x); state.x = p.x+Math.cos(a)*(PR+8); state.y = p.y+Math.sin(a)*(PR+8);
          sail = null; trail = []; p.inside = false; p.min = 1e9;
          damage(st.hull*(p.big?0.6:0.4), __("떠돌이 블랙홀의 사건의 지평선에 스쳤습니다"));
          updateHUD(); return true; }
      } else if(p.inside){ p.inside = false;
        if(p.min < PR*0.5){ state.buff = { t:"boost", until:state.day+2 }; state.stats.sling++; fxSwing(); sfx("warp");
          cutTry("gravity");
          navSay(__("🌀 블랙홀 스윙바이 성공! 중력 도움으로 2일간 가속합니다"), __("<b>블랙홀 스윙바이 성공</b>입니다! 중력의 힘을 빌려 2일간 속도가 크게 오릅니다."), true); }
        p.min = 1e9; }
    } else if(p.kind === "wh"){
      for(const [ax,ay,bx,by,bz] of [[p.x,p.y,p.x2,p.y2,p.z2],[p.x2,p.y2,p.x,p.y,p.z]]){
        if(whCd <= 0 && dist(state.x,state.y,ax,ay) < 2.6){
          const h = state.heading; state.x = bx+Math.cos(h)*6; state.y = by+Math.sin(h)*6; sail = null; trail = []; whCd = 6; rocks = [];
          cam.x = state.x; cam.y = state.y; FX.punch = 0.2; FX.trauma = 0.8; fxFlash("#b58cff", 0.5); fxRing(state.x, state.y, 0.5, 30, 0.9, "#b58cff", 4); sfx("warp");
          if(bz > state.maxZ){ state.maxZ = bz; cutTry("zone"); }
          const n = p.used ? 0 : addSci(8*(bz+1)); p.used = true;
          say(["nav","sci"], __`🌀 웜홀을 통과했습니다! ${ZONES[bz].name}의 다른 곳으로 나왔습니다.${n?` (🔬+${n})`:""}`, true);
          cutTry("gravity"); updateHUD(); save(); return true; } }
    } else if(p.kind === "nova"){
      p.t += rdt;
      if(p.t >= 0){ const Rr = p.t*NOVA_SPEED;
        if(!p.boom){ p.boom = true; sfx("explode"); FX.trauma = Math.min(1, FX.trauma+0.5); fxFlash("#ffffff", 0.35); fxBurst(p.x, p.y, 40, "#ffd24a", 14, 1.2, 4, "spark"); }
        if(!p.hit && Rr >= d){ p.hit = true;
          const k = Math.max(0, 1-d/NOVA_MAX);
          if(k > 0.02) damage(st.hull*0.3*k, __("초신성 충격파가 함선을 덮쳤습니다")); else toast(__("초신성 충격파가 약해진 채로 지나갔습니다"));
          if(!sail){ return true; } }
        if(Rr > NOVA_MAX){ p.kind = "rem"; p.until = state.day+4; p.r = 3; } }
    } else if(p.kind === "rem"){
      if(d < 3.2){ p.until = -1; const g = addGems(1+Math.floor(Math.random()*2), p.x, p.y), n = addSci(15*(p.z+1));
        const pool = GOODS.filter(q=>q.z >= p.z && q.z <= p.z+1), q = pool[Math.floor(Math.random()*pool.length)], room = Math.max(0, st.cargo-cargoUsed()), c = Math.min(room, 3+Math.floor(Math.random()*4));
        if(q && c){ state.cargo[q.id] = (state.cargo[q.id]||0)+c; }
        say(["sci","cargo"], __`✨ 초신성 잔해에서 귀한 물질을 건졌습니다! 💎+${g} 🔬+${n}${q&&c?` ${q.ic} ${q.name} +${c}`:""}`, true); }
    } else if(p.kind === "comet"){
      p.t += rdt; p.x += p.vx*rdt; p.y += p.vy*rdt;
      if(Math.random() < rdt*30) fxParticle(p.x, p.y, -p.vx*0.4+R(-1,1), -p.vy*0.4+R(-1,1), 0.8, 3, "#bfe9ff", "dot");
      if(d < 2.8){ p.until = -1; state.o2 = st.sup; const room = Math.max(0, st.cargo-cargoUsed()), c = Math.min(room, 4+Math.floor(Math.random()*5)), n = addSci(6*(p.z+1));
        if(c) state.cargo.ice = (state.cargo.ice||0)+c; fxPickup(p.x, p.y, "#bfe9ff"); sfx("discover");
        say(["cargo","sci"], __`☄️ 혜성을 따라잡았습니다! 산소 가득 · 🧊 물 얼음 +${c} · 🔬+${n}`, true); cutTry("meteor", 0.6); }
      else if(p.t > 26) p.until = -1;
    } else if(p.kind === "storm"){
      p.x += p.vx*rdt; p.y += p.vy*rdt;
      if(p.x < 60 || p.x > WORLD_W-60) p.vx *= -1;
      if(p.y < ZY(p.z,.96) || p.y > ZY(p.z,.04)) p.vy *= -1;
      if(d < p.r){ stormZap += rdt;
        if(!p.warned){ p.warned = true; cutTry("storm"); say(["eng","nav"], __("⚡ 이온 폭풍에 들어섰습니다! 속도가 떨어지고 번개가 선체를 때립니다. 빨리 빠져나가세요")); }
        if(stormZap > 2.4){ stormZap = 0; fxFlash("#b58cff", 0.25); damage(st.hull*0.03, null); floatText(state.x, state.y-2, __("번개!"), "#8e6fd8"); if(!sail) return true; } }
      else p.warned = false;
    }
  }
  /* 인연: 다가가면 만남이 시작된다 */
  for(const v of visitors){
    if(v.z > state.tech.warp) continue;
    const dg = dist(v.x,v.y,v.tx,v.ty);
    if(dg < 2) [v.tx,v.ty] = randSpot(v.z); else { v.x += (v.tx-v.x)/dg*1.1*rdt; v.y += (v.ty-v.y)/dg*1.1*rdt; }
    if(state.day >= v.cd && dist(state.x,state.y,v.x,v.y) < 2.8){ openEncounter(v, st); return true; }
  }
  return false;
}
function favorReturn(st){
  bonds().favor--; const z = zoneOf(state.y), g = Math.round(R(400,900)*(z+1));
  state.gold += g; state.fuel = st.sup; state.o2 = st.sup; addGems(1, state.x, state.y); sfx("fanfare");
  say(["comm","vice"], __`🕊 예전에 구해 준 조난자들이 찾아와 은혜를 갚았습니다! +${fmt(g)}💠 💎+1 · 연료와 산소 가득`, true);
}

/* ── 만남(선택형) ── */
let ENC = null;
function encModal(title, sub, ic, text, opts){
  ENC = opts; paused = true; forcedModal = true; sfx("blip");
  openModal(title, sub, `<div class="card" style="text-align:center;padding:20px 14px"><div style="font-size:38px">${ic}</div>
    <div class="stat" style="margin:10px 0;font-size:12.5px;line-height:1.7">${text}</div>
    ${opts.map((o,i)=>`<button class="btn ${i===0?"orange":o.ghost?"ghost":""} wide" ${o.off?"disabled":""} onclick="encAct(${i})">${o.t}</button>`).join("")}</div>`, "enc");
}
function encAct(i){
  const o = ENC && ENC[i]; if(!o) return;
  ENC = null; paused = false; forcedModal = false; closeModal();
  o.fn && o.fn();
  if(!combat){ checkMissions(); checkAchievements(); updateHUD(); save(); }
}
function openEncounter(v, st){
  const z = v.z, zf = z+1, V = VISITOR[v.kind], sub = ZONES[z].name, big = v.rare ? 2 : 1;
  const leave = { t:__("인사만 하고 떠난다"), ghost:true, fn:()=>{} };
  const done = days => { v.cd = state.day+(days||4); [v.x,v.y] = worldSpot(v.z, 60); [v.tx,v.ty] = randSpot(v.z); v.rare = Math.random() < 0.05; if(Math.random() < 0.5) v.kind = Object.keys(VISITOR)[Math.floor(Math.random()*7)]; };
  const rareTxt = v.rare ? `<br><b class="acc">${__("오늘은 유난히 넉넉한 손님입니다.")}</b>` : "";
  if(v.kind === "trader"){ const lv = bondLv("merchant"), mult = 1.1+lv*0.04+(v.rare?0.25:0), fuelP = Math.max(1, Math.round(20*zf*(1-lv*0.12)));
    let worth = 0; for(const g of GOODS){ const q = state.cargo[g.id]||0; if(q) worth += Math.max(1, Math.round(g.base*TRADE_SCALE*(1+0.1*Math.abs(z-g.z))*mult*(1+bonus().sell)))*q; }
    const pool = GOODS.filter(g=>g.z <= z+1 && g.z >= z-1), g = pool[Math.floor(Math.random()*pool.length)], price = Math.max(1, Math.round(g.base*TRADE_SCALE*0.6)), room = st.cargo-cargoUsed(), n = Math.max(0, Math.min(room, Math.floor(state.gold/price), 20*big));
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`화물을 가득 실은 캐러밴이 속도를 늦추며 신호를 보냅니다.<br>“좋은 값에 쳐 드리리다, 선장.”` + rareTxt, [
      { t:__`📦 화물을 전부 판다 (+${fmt(worth)}💠)`, off:worth < 1, fn:()=>{ state.cargo = {}; state.cost = {}; state.gold += worth; state.stats.sell += worth; addBond("merchant"); cutTry("market"); sfx("coin"); say("cargo", __`${V.name}에 화물을 전부 넘겼습니다 (+${fmt(worth)}💠)`, true); } },
      { t:__`${g.ic} ${g.name} ${n}개를 싸게 산다 (−${fmt(price*n)}💠)`, off:n < 1, fn:()=>{ state.gold -= price*n; state.cargo[g.id] = (state.cargo[g.id]||0)+n; if(!state.cost) state.cost = {}; state.cost[g.id] = price; addBond("merchant"); cutTry("market"); sfx("coin"); say("cargo", __`${g.ic} ${g.name} ${n}개를 헐값에 들였습니다`, true); } },
      { t:__`⛽ 연료·산소를 가득 채운다 (−${fmt(fuelP)}💠)`, off:state.gold < fuelP, fn:()=>{ state.gold -= fuelP; state.fuel = st.sup; state.o2 = st.sup; addBond("merchant"); cutTry("market"); sfx("ok"); say("eng", __("캐러밴에서 연료와 산소를 가득 채웠습니다"), true); } },
      leave ]); }
  else if(v.kind === "patrol"){ const lv = bondLv("patrol"), need = st.hull-state.hull, cost = lv >= 2 ? 0 : Math.round(need*2*zf*(1-lv*0.25)), days = 2+lv+(v.rare?3:0);
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`순찰함이 나란히 다가와 경례를 보냅니다.<br>“이 구역은 저희가 지킵니다. 도울 일이 있습니까?”` + rareTxt, [
      { t:__`🤝 ${days}일간 호위를 부탁한다 (해적이 다가오지 않음)`, fn:()=>{ for(const r of raiders) r.cd = Math.max(r.cd, state.day+days); addBond("patrol"); sfx("ok"); say("deck", __`순찰대가 ${days}일간 호위해 주기로 했습니다. 그동안 해적은 다가오지 못합니다.`, true); } },
      { t:cost ? __`🛠 선체 수리를 받는다 (−${fmt(cost)}💠)` : __("🛠 선체 수리를 받는다 (무료)"), off:need < 1 || state.gold < cost, fn:()=>{ state.gold -= cost; state.hull = st.hull; addBond("patrol"); sfx("ok"); say("eng", __("순찰대 정비선이 선체를 말끔히 고쳐 주었습니다"), true); } },
      { t:__("📍 해적 기지 정보를 넘긴다 (크레딧 보상)"), off:!Object.keys(state.dens).length, fn:()=>{ const g = Math.round(300*zf*big); state.gold += g; addBond("patrol", 2); sfx("coin"); say("comm", __`토벌 기록을 넘기고 포상금을 받았습니다 (+${fmt(g)}💠)`, true); } },
      leave ]); }
  else if(v.kind === "scientist"){ const lv = bondLv("science"), price = Math.round(400*zf*(1-lv*0.08)), gain = Math.round(18*zf*big), tip = 25*zf;
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`낡은 관측선에서 흥분한 목소리가 들립니다.<br>“마침 잘 만났소! 내 관측 자료, 관심 있소?”` + rareTxt, [
      { t:__`🔬 관측 자료를 산다 (−${fmt(price)}💠 → 🔬+${gain})`, off:state.gold < price, fn:()=>{ state.gold -= price; state.sci += gain; addBond("science"); sfx("ok"); say("sci", __`과학자의 관측 자료를 손에 넣었습니다 (🔬+${gain})`, true); } },
      { t:__`📡 우리 발견 기록을 나눈다 (천체 ${state.found.length}곳)`, fn:()=>{ const n = Math.round(state.found.length*0.6*big); state.sci += n; addBond("science", 2); sfx("discover"); say("sci", __`서로의 기록을 맞춰 보니 새로 알게 된 것이 많습니다 (🔬+${n})`, true); } },
      { t:__`💎 보석 1개를 연구용으로 기증한다 (🔬+${tip})`, off:state.gems < 1, fn:()=>{ state.gems--; state.sci += tip; addBond("science", 2); sfx("ok"); say("sci", __`보석을 기증하자 과학자가 감격해 연구 결과를 통째로 내주었습니다 (🔬+${tip})`, true); } },
      leave ]); }
  else if(v.kind === "distress"){ const fuelNeed = Math.max(1, st.sup*0.2);
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`엔진이 멎은 배가 힘없이 떠 있습니다. 비상등만 깜빡입니다.<br>“…누구든… 들립니까… 연료가…”`, [
      { t:__`⛽ 연료 20%를 나눠 주고 구조한다`, off:state.fuel < fuelNeed, fn:()=>{ state.fuel -= fuelNeed;
          if(Math.random() < 0.14){ toast(__("🏴‍☠️ 조난 신호는 미끼였습니다!")); startCombat({ kind:"raider", name:__("매복 해적선"), pow:Math.round((18+z*26)*R(.85,1.15)), z }); return; }
          const g = Math.round(R(200,500)*zf), k = ["merchant","patrol","science"][Math.floor(Math.random()*3)]; state.gold += g; bonds().favor = (bonds().favor||0)+1; addBond(k); sfx("fanfare");
          say(["comm","vice"], __`조난자들을 구했습니다. 사례금 ${fmt(g)}💠을 받았고, 그들은 ${BONDS[k].name} 사람들이었습니다. 언젠가 이 은혜를 갚겠다고 합니다.`, true); } },
      { t:__("🔧 승무원을 보내 엔진을 고쳐 준다 (기관장 필요)"), off:!state.posts.eng, fn:()=>{ const n = addSci(8*zf); bonds().favor = (bonds().favor||0)+1; addBond("patrol"); sfx("ok");
          say("eng", __`엔진을 고쳐 주었습니다. 고마워하며 항해 기록을 넘겨주었습니다 (🔬+${n})`, true); } },
      { t:__("못 본 척 지나간다"), ghost:true, fn:()=>{} } ]); }
  else if(v.kind === "envoy"){ const lv = bondLv("alien"), gems = 1+(lv >= 3 ? 1 : 0)+(v.rare ? 2 : 0), have = cargoUsed();
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`빛으로 이루어진 듯한 배가 소리 없이 다가옵니다.<br>알 수 없는 문양이 관측창에 떠오릅니다. 무언가를 기다리는 것 같습니다.` + rareTxt, [
      { t:__`🎁 화물 5개를 선물로 건넨다 (💎+${gems})`, off:have < 5, fn:()=>{ let left = 5; for(const g of GOODS){ const q = Math.min(left, state.cargo[g.id]||0); if(q){ state.cargo[g.id] -= q; if(!state.cargo[g.id]) delete state.cargo[g.id]; left -= q; } }
          addGems(gems, state.x, state.y); addBond("alien", 2); say("comm", __`사절이 선물을 받고 답례로 빛나는 결정을 건넸습니다 (💎+${gems})`, true); } },
      { t:__("📡 문양을 따라 그려 응답한다"), fn:()=>{ if(Math.random()*100 < clamp(55+st.luck*0.5+lv*6, 30, 92)){ const n = addSci(14*zf); addBond("alien"); sfx("discover"); say("comm", __`사절이 기뻐하며 별들의 지도를 보여 주었습니다 (🔬+${n})`, true); }
          else { state.buff = { t:"broken", until:state.day+1 }; sfx("bad"); say("comm", __("문양을 잘못 그렸나 봅니다. 사절이 떠나며 남긴 파동에 항법 장치가 하루 동안 먹통이 됐습니다")); } } },
      leave ]); }
  else if(v.kind === "ghost"){
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`불 꺼진 거대한 배가 어둠 속에 떠 있습니다. 선체에는 아무 이름도 없습니다.<br>화물칸 문이 열려 있습니다.`, [
      { t:__`🔦 깊숙이 들어간다 (성공 ${Math.round(clamp(45+st.luck*0.5, 25, 85))}% · 큰 보상)`, fn:()=>{ if(Math.random()*100 < clamp(45+st.luck*0.5, 25, 85)){ const g = Math.round(R(600,1400)*zf*big), m = addGems(1+big, state.x, state.y), n = addSci(12*zf); state.gold += g; sfx("fanfare");
            say("cargo", __`유령선의 금고를 열었습니다! +${fmt(g)}💠 💎+${m} 🔬+${n}`, true); }
          else { sfx("bad"); damage(st.hull*0.22, __("유령선의 방어 장치가 깨어났습니다")); } } },
      { t:__("📦 입구의 화물만 챙긴다 (안전)"), fn:()=>{ const g = Math.round(R(120,300)*zf); state.gold += g; sfx("coin"); say("cargo", __`입구에서 쓸 만한 것들을 챙겼습니다 (+${fmt(g)}💠)`); } },
      leave ]); }
  else { const pow = Math.round((24+z*28)*R(.95,1.2)*(v.rare?1.4:1)), toll = Math.round(250*zf);
    encModal(`${V.ic} ${V.name}`, sub, V.ic, __`검은 함선이 앞을 가로막습니다.<br>“네 목에 걸린 현상금, 꽤 쏠쏠하더군. 순순히 따라오겠나, 아니면 실력을 보겠나?”`, [
      { t:__`⚔️ 결투를 받아들인다 (전투력 ${pow} · 승리 시 💎)`, fn:()=>{ startCombat({ kind:"raider", name:V.name, foe:"bounty", pow, z, gems:1+big }); } },
      { t:__`💰 돈으로 해결한다 (−${fmt(toll)}💠)`, off:state.gold < toll, fn:()=>{ state.gold -= toll; sfx("coin"); toast(__("사냥꾼이 돈을 세어 보더니 길을 비켜 줍니다")); } },
      { t:__`🚀 따돌린다 (성공 ${fleeChance(st)}%)`, ghost:true, fn:()=>{ if(Math.random()*100 < fleeChance(st)) toast(__("전속력으로 사냥꾼을 따돌렸습니다!")); else { toast(__("따돌리지 못했습니다!")); startCombat({ kind:"raider", name:V.name, pow, z, gems:1+big }); } } } ]); }
  done();                                        /* 어떤 선택이든 이 배는 자리를 뜬다 */
}

/* ── 그리기 ── */
function drawWorld(g, u, vis, F){
  for(const p of phen){
    if(p.z > state.tech.warp && !(p.kind==="wh" && p.z2 <= state.tech.warp)) continue;
    if(p.kind === "bh" && vis(p.x,p.y,BH_PULL*1.6)){
      const PR = BH_PULL*(p.big?1.5:1);
      g.strokeStyle = rgba("#8e6fd8", .3+Math.sin(bobT*2)*.12); g.lineWidth = u; g.setLineDash([4*u,6*u]); g.beginPath(); g.arc(p.x,p.y,PR,0,7); g.stroke(); g.setLineDash([]);
      drawBody(g, p, null); label((p.big?"⚠️ ":"⚠ ")+(p.big?__("거대 떠돌이 블랙홀"):__("떠돌이 블랙홀")), p.x, p.y+p.r*1.1+14*u, "#8e6fd8", F(700));
    } else if(p.kind === "wh"){
      for(const [x,y,zz,oz] of [[p.x,p.y,p.z,p.z2],[p.x2,p.y2,p.z2,p.z]]){ if(zz > state.tech.warp || !vis(x,y,12)) continue;
        for(let i=0;i<4;i++){ g.strokeStyle = rgba(i%2?"#b58cff":"#5fe0ff", .75-i*.14); g.lineWidth = (2.2-i*0.3)*u*2;
          g.beginPath(); g.arc(x, y, 1+i*0.75, bobT*(2.4-i*0.4)+i, bobT*(2.4-i*0.4)+i+3.6); g.stroke(); }
        label(`🌀 ${__("웜홀")} → ${ZONES[oz].name}`, x, y+4.2+12*u, "#8e6fd8", F(700)); }
    } else if(p.kind === "nova" && vis(p.x,p.y,NOVA_MAX+5)){
      if(p.t < 0){ const k = 1+Math.sin(bobT*14)*0.25; glow(g, p.x, p.y, 4.5*k, "#ffffff", .9); glow(g, p.x, p.y, 9*k, "#ff5a3c", .5);
        label(`💥 ${Math.ceil(-p.t)}`, p.x, p.y-7, "#c8201a", `800 ${22*u}px 'Segoe UI',sans-serif`);
        g.strokeStyle = rgba("#c8201a", .25); g.lineWidth = u; g.setLineDash([5*u,7*u]); g.beginPath(); g.arc(p.x,p.y,NOVA_MAX,0,7); g.stroke(); g.setLineDash([]); }
      else { const Rr = p.t*NOVA_SPEED, a = Math.max(0, 1-Rr/NOVA_MAX);
        g.strokeStyle = rgba("#ffd24a", a*0.9); g.lineWidth = 2.4*a+0.4; g.beginPath(); g.arc(p.x,p.y,Rr,0,7); g.stroke();
        g.strokeStyle = rgba("#ff5a3c", a*0.6); g.lineWidth = 5*a+0.3; g.beginPath(); g.arc(p.x,p.y,Math.max(0.1,Rr-1.5),0,7); g.stroke(); glow(g, p.x, p.y, 6, "#ffb347", a*0.8); }
    } else if(p.kind === "rem" && vis(p.x,p.y,10)){
      for(let i=0;i<5;i++) glow(g, p.x+Math.cos(i*1.3+bobT*0.2)*1.6, p.y+Math.sin(i*1.7)*1.4, 2.6, ["#ffb347","#b58cff","#5fe0ff"][i%3], .35);
      label(`✨ ${__("초신성 잔해")}`, p.x, p.y+4+10*u, T.acc, F(700));
    } else if(p.kind === "comet" && vis(p.x,p.y,12)){
      const gr = g.createLinearGradient(p.x, p.y, p.x-p.vx*1.4, p.y-p.vy*1.4); gr.addColorStop(0, rgba("#bfe9ff",.9)); gr.addColorStop(1, rgba("#bfe9ff",0));
      g.strokeStyle = gr; g.lineWidth = 1.5; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-p.vx*1.4, p.y-p.vy*1.4); g.stroke();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(p.x,p.y,0.8,0,7); g.fill(); glow(g, p.x, p.y, 2.4, "#bfe9ff", .7);
      label(`☄️ ${__("혜성")}`, p.x, p.y+2.5+10*u, "#4a90d9", F(700));
    } else if(p.kind === "storm" && vis(p.x,p.y,p.r+5)){
      glow(g, p.x, p.y, p.r*1.15, "#8e6fd8", T.dark ? .38 : .3);
      g.strokeStyle = rgba("#8e6fd8", .4); g.lineWidth = u; g.setLineDash([3*u,5*u]); g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.stroke(); g.setLineDash([]);
      if(Math.sin(bobT*9+p.x) > 0.55){ g.strokeStyle = rgba("#e9d8ff", .9); g.lineWidth = 1.6*u; g.beginPath();
        let lx = p.x+Math.cos(bobT*3)*p.r*0.6, ly = p.y-p.r*0.6; g.moveTo(lx,ly); for(let i=0;i<5;i++){ lx += (Math.random()-.5)*p.r*0.35; ly += p.r*0.24; g.lineTo(lx,ly); } g.stroke(); }
      label(`⚡ ${__("이온 폭풍")}`, p.x, p.y-p.r-10*u, "#8e6fd8", F(700));
    }
  }
  for(const v of visitors){ if(v.z > state.tech.warp || !vis(v.x,v.y,10)) continue;
    const V = VISITOR[v.kind], ready = state.day >= v.cd;
    g.globalAlpha = ready ? 1 : 0.35;
    if(ready){ g.strokeStyle = rgba(v.rare?"#e0a63f":"#4a90d9", .5+Math.sin(bobT*3+v.x)*.25); g.lineWidth = 1.4*u; g.beginPath(); g.arc(v.x, v.y, (15+Math.sin(bobT*3+v.x)*2)*u, 0, 7); g.stroke(); }
    g.font = `${20*u}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#000"; g.fillText(V.ic, v.x, v.y);
    label(V.name+(v.rare?" ★":""), v.x, v.y+20*u, v.rare ? "#b8863f" : T.sub, F(600)); g.globalAlpha = 1; }
}
