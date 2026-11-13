"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 연출(타격감) ══════════════════
   game-feel 지침을 따른다:
   · 한 사건에 여러 반응을 한꺼번에(소리·입자·흔들림·번쩍임), 사건의 크기(small/medium/large)에 비례해서
   · 화면 흔들림은 trauma(충격량)의 제곱으로, 불규칙한 떨림 대신 서로 다른 속도의 사인파를 더해 부드럽게
   · 흔들림과 연출은 화면만 움직인다. 게임 판정(위치·충돌)은 건드리지 않는다
   · 흔들림 세기와 번쩍임은 설정에서 줄일 수 있다 */
const FX = { trauma:0, t:0, ox:0, oy:0, punch:0, ts:1, stopId:0, parts:[], rings:[], boost:0, boostCd:0, emitAcc:0 };
const fxOpt = () => (state && state.fx) || { shake:1, flash:true };

function fxParticle(x, y, vx, vy, life, size, col, kind){ if(FX.parts.length < 900) FX.parts.push({ x, y, vx, vy, life, max:life, size, col, kind:kind||"dot" }); }
function fxBurst(x, y, n, col, speed, life, size, kind){
  for(let i=0;i<n;i++){ const a = Math.random()*6.283, v = speed*(0.3+Math.random()*0.9);
    fxParticle(x, y, Math.cos(a)*v, Math.sin(a)*v, life*(0.6+Math.random()*0.7), size*(0.6+Math.random()*0.8), col, kind); }
}
function fxRing(x, y, r0, r1, life, col, w){ FX.rings.push({ x, y, r0, r1, life, max:life, col, w:w||2 }); }
function fxFlash(col, strength){
  if(!fxOpt().flash) strength *= 0.25;
  const el = $("flash"); if(!el) return;
  el.style.transition = "none"; el.style.background = col; el.style.opacity = strength;
  requestAnimationFrame(()=>{ el.style.transition = "opacity .45s ease-out"; el.style.opacity = 0; });
}
function fxHitStop(dur){                       /* 잠깐 시간을 느리게. 겹치면 마지막 호출만 원래대로 되돌린다 */
  const id = ++FX.stopId; FX.ts = 0.05;
  setTimeout(()=>{ if(id === FX.stopId) FX.ts = 1; }, dur*1000);
}
function fxBanner(big, small, col){
  const el = $("banner"); if(!el) return;
  el.innerHTML = `<div class="bBig" style="color:${col||"#d96f32"}">${big}</div>${small?`<div class="bSmall">${small}</div>`:""}`;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
}
/* 사건 하나 = 등급에 맞는 반응 묶음 */
const FX_TIER = { small:{ trauma:.14, stop:0, n:5 }, medium:{ trauma:.42, stop:.05, n:12 }, large:{ trauma:.85, stop:.12, n:30 } };
function feedback(tier, x, y, col, flashCol){
  const t = FX_TIER[tier]; FX.trauma = Math.min(1, FX.trauma + t.trauma);
  if(t.stop) fxHitStop(t.stop);
  if(x != null){ fxBurst(x, y, t.n, col||"#ffb347", tier==="large"?9:6, tier==="large"?0.8:0.5, tier==="large"?4:3, "spark");
    if(tier !== "small") fxRing(x, y, 0.3, tier==="large"?9:5, tier==="large"?0.6:0.4, col||"#ffb347", tier==="large"?3:2); }
  if(flashCol) fxFlash(flashCol, tier==="large" ? 0.38 : 0.2);
}

/* ── 사건별 연출 ── */
function fxDiscover(b){
  fxRing(b.x, b.y, b.r, b.r+18, 0.9, "#d96f32", 3); fxRing(b.x, b.y, b.r, b.r+34, 1.3, "#4a90d9", 2);
  for(let i=0;i<26;i++){ const a = Math.random()*6.283, d = b.r+1+Math.random()*4; fxParticle(b.x+Math.cos(a)*d, b.y+Math.sin(a)*d, Math.cos(a)*5, Math.sin(a)*5, 0.9+Math.random()*0.6, 3, i%2?"#ffd24a":"#ffffff", "star"); }
  FX.trauma = Math.min(1, FX.trauma+0.2); FX.punch = 0.05;
  fxBanner(__("🔭 발견!"), b.name);
}
function fxStar(w){ fxRing(w.x, w.y, w.r, w.r+7, 0.7, "#ffd24a", 2); fxBurst(w.x, w.y, 10, "#ffe9a8", 4, 0.8, 2.5, "star"); }
function fxPickup(x, y, col){ fxRing(x, y, 0.2, 3.5, 0.4, col, 2); fxBurst(x, y, 12, col, 5, 0.6, 3, "star"); FX.trauma = Math.min(1, FX.trauma+0.08); }
function fxDepart(){ const h = state.heading+Math.PI; fxRing(state.x, state.y, 0.3, 4, 0.45, "#ff9d5c", 2);
  for(let i=0;i<16;i++){ const a = h+(Math.random()-.5)*1.1, v = 4+Math.random()*7; fxParticle(state.x, state.y, Math.cos(a)*v, Math.sin(a)*v, 0.5+Math.random()*0.4, 3.5, "#ff9d5c", "dot"); } }
function fxDock(p){ fxRing(p.x, p.y, p.r+0.5, p.r+10, 0.7, "#d96f32", 3); fxRing(p.x, p.y, p.r+0.5, p.r+5, 0.45, "#ffffff", 2); FX.trauma = Math.min(1, FX.trauma+0.12); }
function fxDamage(n, max){
  const big = n > max*0.2; feedback(big ? "large" : "medium", state.x, state.y, "#ff5a3c", "#c8201a");
  fxBurst(state.x, state.y, big?18:8, "#ffd24a", 7, 0.5, 2.5, "spark");
}
function fxZone(z){
  FX.trauma = 1; FX.punch = 0.16; fxFlash("#ffffff", 0.5);
  for(let i=0;i<70;i++){ const a = state.heading+Math.PI+(Math.random()-.5)*0.5, v = 20+Math.random()*45;
    fxParticle(state.x+(Math.random()-.5)*30, state.y+(Math.random()-.5)*30, Math.cos(a)*v, Math.sin(a)*v, 0.5+Math.random()*0.6, 2.5, i%3?"#9ff3ff":"#ffffff", "spark"); }
  fxRing(state.x, state.y, 0.5, 40, 1.1, "#9ff3ff", 4);
  fxBanner(`${ZONES[z].ic} ${ZONES[z].name}`, __`축척 ${ZONES[z].scale} · ${ZONES[z].desc}`, "#4a90d9");
}
function fxSwing(){ FX.punch = 0.1; FX.trauma = Math.min(1, FX.trauma+0.5); fxRing(state.x, state.y, 0.5, 16, 0.8, "#b58cff", 3);
  for(let i=0;i<40;i++){ const a = state.heading+Math.PI+(Math.random()-.5)*0.4, v = 15+Math.random()*30; fxParticle(state.x, state.y, Math.cos(a)*v, Math.sin(a)*v, 0.6, 2.5, "#b58cff", "spark"); } }

/* ── 부스트: 연료를 더 태워 잠깐 빠르게 (해적을 따돌리거나 급할 때) ── */
const BOOST_TIME = 4, BOOST_CD = 14, BOOST_SPEED = 2.2, BOOST_FUEL = 2.5;
function boost(){
  if(!state || paused || !sail || FX.boost > 0 || FX.boostCd > 0) return;
  if(state.fuel <= 0){ toast(__("⛽ 연료가 없어 부스트를 쓸 수 없습니다")); return; }
  cutTry("boost");
  FX.boost = BOOST_TIME; FX.boostCd = BOOST_CD; FX.punch = 0.08; FX.trauma = Math.min(1, FX.trauma+0.35);
  fxDepart(); fxRing(state.x, state.y, 0.4, 8, 0.5, "#5cc8ff", 3); sfx("warp");
}
window.addEventListener("keydown", e=>{ if((e.key === "Shift" || e.key === "b" || e.key === "B") && !e.repeat) boost(); });

/* ── 매 프레임 (실제 시간 기준: 히트스톱 중에도 흔들림은 잦아든다) ── */
function fxUpdate(dt){
  FX.t += dt*30;
  FX.trauma = Math.max(0, FX.trauma - 1.3*dt);
  const sh = FX.trauma*FX.trauma*fxOpt().shake;
  FX.ox = 14*sh*Math.sin(FX.t*1.7); FX.oy = 10*sh*Math.sin(FX.t*2.3);
  FX.punch += (0-FX.punch)*Math.min(1, dt*5);
  if(FX.boost > 0 && !paused){ FX.boost = Math.max(0, FX.boost-dt); if(!sail || state.fuel <= 0) FX.boost = 0; }
  if(FX.boostCd > 0) FX.boostCd = Math.max(0, FX.boostCd-dt);
  const bb = $("boostBtn");
  if(bb){ const txt = FX.boost > 0 ? `🔥 ${FX.boost.toFixed(1)}s` : FX.boostCd > 0 ? `⏳ ${Math.ceil(FX.boostCd)}s` : __("🔥 부스트");
    if(bb.textContent !== txt) bb.textContent = txt; bb.classList.toggle("hot", FX.boost > 0); bb.classList.toggle("cd", FX.boost <= 0 && FX.boostCd > 0);
    bb.style.display = state && !state.intro ? "" : "none"; }
  /* 엔진 분사: 항해 중 함미에서 뿜어져 나온다 */
  if(state && sail && !paused){
    const s = SHIP_MAP[state.flagship], sc = Math.max(CRAFT, 1.0/cam.s), tail = s.len*sc*0.5, tier = TIER[s.g]||0, bo = FX.boost > 0;
    FX.emitAcc += dt*(bo ? 130 : state.fuel > 0 ? 55 : 10);
    while(FX.emitAcc >= 1){ FX.emitAcc -= 1;
      const a = state.heading+Math.PI+(Math.random()-.5)*(bo?0.5:0.35), v = (bo?9:4)+Math.random()*4, off = (Math.random()-.5)*s.wid*sc*0.4;
      fxParticle(state.x-Math.cos(state.heading)*tail-Math.sin(state.heading)*off, state.y-Math.sin(state.heading)*tail+Math.cos(state.heading)*off,
        Math.cos(a)*v, Math.sin(a)*v, (bo?0.6:0.42)*(0.6+Math.random()*0.7), bo?4.5:3, bo?"#5cc8ff":FLAME[tier], "dot"); }
    if(bo && Math.random() < 0.5){ const a = state.heading+Math.PI, px = (Math.random()-.5)*W/cam.s, py = (Math.random()-.5)*H/cam.s;   /* 속도선 */
      fxParticle(cam.x+px, cam.y+py, Math.cos(a)*60, Math.sin(a)*60, 0.25, 1.6, "#bfe9ff", "spark"); }
  }
  for(const p of FX.parts){ p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= 1-Math.min(1,dt*2.2); p.vy *= 1-Math.min(1,dt*2.2); }
  FX.parts = FX.parts.filter(p=>p.life > 0);
  for(const r of FX.rings) r.life -= dt;
  FX.rings = FX.rings.filter(r=>r.life > 0);
}
function fxDraw(ctx, u){
  for(const r of FX.rings){ const k = 1-r.life/r.max, e = 1-Math.pow(1-k,3);          /* ease-out: 빠르게 퍼지고 천천히 멈춘다 */
    ctx.strokeStyle = rgba(r.col, (1-k)*0.9); ctx.lineWidth = r.w*u*(1-k*0.6);
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r0+(r.r1-r.r0)*e, 0, 7); ctx.stroke(); }
  for(const p of FX.parts){ const k = p.life/p.max;
    if(p.kind === "spark"){ ctx.strokeStyle = rgba(p.col, k); ctx.lineWidth = p.size*u*0.6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x-p.vx*0.045, p.y-p.vy*0.045); ctx.stroke(); }
    else if(p.kind === "star"){ const s = p.size*u*(0.4+k); ctx.fillStyle = rgba(p.col, k);
      ctx.beginPath(); ctx.moveTo(p.x, p.y-s*1.6); ctx.lineTo(p.x+s*0.4, p.y-s*0.4); ctx.lineTo(p.x+s*1.6, p.y); ctx.lineTo(p.x+s*0.4, p.y+s*0.4);
      ctx.lineTo(p.x, p.y+s*1.6); ctx.lineTo(p.x-s*0.4, p.y+s*0.4); ctx.lineTo(p.x-s*1.6, p.y); ctx.lineTo(p.x-s*0.4, p.y-s*0.4); ctx.fill(); }
    else { ctx.fillStyle = rgba(p.col, k*0.85); ctx.beginPath(); ctx.arc(p.x, p.y, p.size*u*(0.35+k*0.65), 0, 7); ctx.fill(); }
  }
}

/* ══════════════════ 전투장: 움직이는 턴제 전투 ══════════════════
   포격은 '조준 게이지'를 맞춰 쏜다(가운데일수록 강하다). 탄이 날아가 명중하고, 적의 반격이 뒤따른다. */
let AR = null;                                 /* 전투장 연출 상태 */
function cbSeq(steps, instant){ const c = combat; let acc = 0;
  for(const [d, fn] of steps){ acc += d; if(instant){ if(combat === c) fn(); } else setTimeout(()=>{ if(combat === c) fn(); }, acc); } }
function renderCombat(){
  const c = combat, den = c.kind==="den";
  AR = { t:0, last:performance.now(), shots:[], parts:[], pops:[], trauma:0, pHit:0, eHit:0, stars:Array.from({length:60},()=>[Math.random(),Math.random(),0.3+Math.random()*1.2]) };
  const fam = ["drone","hive"].includes(c.foe) ? "drone" : c.alien || ["alien","mother"].includes(c.foe) ? "alien" : "";
  openModal(den?__("💀 해적 기지 공략"):fam==="alien"?__("👾 외계 생명체의 공격!"):fam==="drone"?__("🤖 폭주 드론 출현!"):__("🏴‍☠️ 해적 출현!"), "", `
    <div class="card" style="padding:0;overflow:hidden">
      <canvas id="arena" style="width:100%;height:210px;display:block;cursor:pointer" onclick="combatFire()"></canvas>
      <div style="padding:10px 14px 14px">
        <div class="row" style="gap:14px"><div class="grow"><div class="ttl" style="font-size:12.5px">🚀 ${SHIP_MAP[state.flagship].name} <span class="stat" id="cbPtxt"></span></div>
            <div class="bar blue" style="height:10px"><i id="cbPbar"></i></div></div>
          <div class="grow" style="text-align:right"><div class="ttl" style="font-size:12.5px"><span class="stat" id="cbEtxt"></span> ${c.name} ${den?"💀":fam==="alien"?"👾":fam==="drone"?"🤖":"🏴‍☠️"}</div>
            <div class="bar red" style="height:10px;transform:scaleX(-1)"><i id="cbEbar"></i></div></div></div>
        <div class="log" id="cbLog" style="min-height:44px"></div>
        <div id="cbBtns"></div></div></div>`);
  combatRefresh(); requestAnimationFrame(arenaFrame);
}
function combatRefresh(){
  const c = combat; if(!c || !$("cbBtns")) return;
  const st = eff(), den = c.kind==="den";
  $("cbPbar").style.width = Math.max(0, state.hull/st.hull*100)+"%"; $("cbEbar").style.width = Math.max(0, c.ehp/c.emax*100)+"%";
  $("cbPtxt").textContent = __`선체 ${fmt(Math.max(0,state.hull))}/${fmt(st.hull)} · 전투력 ${st.pow}`;
  $("cbEtxt").textContent = __`전투력 ${c.pow} · ${fmt(Math.max(0,c.ehp))}/${fmt(c.emax)}`;
  $("cbLog").innerHTML = c.log.slice(-3).join("<br>");
  $("mSub").textContent = __`${c.round}턴${c.charge?__(" · ⚡ 충전됨"):""}`;
  const dis = c.busy ? "disabled" : "";
  $("cbBtns").innerHTML = c.aim
    ? `<button class="btn orange wide" style="font-size:15px;padding:13px" onclick="combatFire()">${__`🎯 발사! (게이지가 가운데일 때 누르세요)`}</button>`
    : `<button class="btn orange wide" ${dis} onclick="combatAct('atk')">${__`💥 포격한다${c.charge?__(" (충전 +60%)"):""}`}</button>
       <div class="row" style="gap:6px"><button class="btn wide" ${dis} onclick="combatAct('def')">${__`🔰 방어 태세`}</button>
         <button class="btn ghost wide" ${dis} onclick="combatAct('flee')">🚀 ${den?__("퇴각"):__("도주")} ${den?75:fleeChance(st)}%</button></div>
       ${den||c.alien?"":`<button class="btn ghost wide" ${dis} ${state.gold<bribeCost()?"disabled":""} onclick="combatAct('bribe')">${__`💰 통행료를 낸다 · −${fmt(bribeCost())}💠`}</button>`}`;
}
function combatAct(a, instant){
  const c = combat; if(!c || c.busy) return;
  const st = eff();
  if(a === "bribe"){ state.gold -= bribeCost(); endCombat(__("해적들이 통행료를 받고 길을 내줍니다"), false); cutTry("flee"); return; }
  if(a === "atk"){
    if(instant){ combatAttack(1, true); return; }
    c.aim = { t0:performance.now(), speed:3.2+Math.min(3.2, c.pow/55) }; combatRefresh(); return;   /* 조준 게이지 시작 */
  }
  c.busy = true;
  if(a === "flee"){
    if(Math.random()*100 < (c.kind==="den"?75:fleeChance(st))){ endCombat(__("🚀 전속력으로 이탈했습니다!"), false); cutTry("flee"); return; }
    c.log.push(__("도주 실패! 적이 따라붙습니다")); combatRefresh(); cbSeq([[instant?0:250, ()=>combatEnemy(1, instant)]], instant);
  } else { c.charge = true; c.shield = true; c.log.push(__("🔰 방어막에 출력을 집중합니다 (피해 −65%, 다음 포격 +60%)")); sfx("ok");
    combatRefresh(); cbSeq([[instant?0:350, ()=>combatEnemy(0.35, instant)]], instant); }
}
function combatFire(){
  const c = combat; if(!c || !c.aim || c.busy) return;
  const p = 0.5+0.5*Math.sin((performance.now()-c.aim.t0)/1000*c.aim.speed), d = Math.abs(p-0.5)*2;
  combatAttack(d < 0.16 ? 1.5 : d < 0.55 ? 1 : 0.55, false);
}
function combatAttack(mult, instant){
  const c = combat, st = eff(); c.aim = null; c.busy = true;
  let dmg = st.pow*0.5*R(.8,1.2)*(c.charge?1.6:1)*mult; c.charge = false;
  const perfect = mult >= 1.5, crit = perfect || Math.random() < 0.08+st.luck/250+st.b.crit;
  if(crit) dmg *= perfect ? 1.25 : 1.8;
  dmg = Math.max(1, Math.round(dmg));
  combatRefresh();
  cbSeq([
    [0, ()=>{ sfx("shot"); if(AR) AR.shots.push({ from:"p", t:0, dur:0.24, big:crit }); }],
    [instant?0:240, ()=>{ c.ehp -= dmg;
      c.log.push(`${__`${perfect?__("🎯 완벽한 조준! "):mult<1?__("빗맞았습니다. "):__("💥 명중! ")}<b>${dmg}</b> 피해${crit&&!perfect?__(" (치명타!)"):""}`}`);
      if(AR){ arenaImpact("e", dmg, crit); } sfx(crit ? "explode" : "hit"); combatRefresh();
      if(c.ehp <= 0){ if(AR){ AR.eDead = true; arenaImpact("e", 0, true); arenaImpact("e", 0, true); } cbSeq([[instant?0:750, ()=>winCombat()]], instant); }
      else cbSeq([[instant?0:520, ()=>combatEnemy(1, instant)]], instant); }],
  ], instant);
}
function combatEnemy(mit, instant){
  const c = combat, st = eff();
  const ed = Math.max(1, Math.round(c.eatk*R(.7,1.25)*(1-st.def)*mit));
  cbSeq([
    [0, ()=>{ sfx("shot"); if(AR) AR.shots.push({ from:"e", t:0, dur:0.28, big:false }); }],
    [instant?0:280, ()=>{ state.hull -= ed; c.log.push(`${__`적의 반격 - 선체 <b>−${ed}</b>${mit<1?__(" (방어막이 막아냈습니다)"):""}`}`);
      if(AR) arenaImpact("p", ed, ed > st.hull*0.15); sfx("hit"); c.shield = false; c.round++;
      if(state.hull <= 0){ state.hull = 0; combatRefresh(); cbSeq([[instant?0:600, ()=>{ combat = null; forcedModal = false; closeModal(); gameOver("hull"); }]], instant); return; }
      c.busy = false; combatRefresh(); updateHUD(); }],
  ], instant);
}
function arenaImpact(side, dmg, big){
  const A = AR; if(!A) return;
  const x = side==="e" ? 0.78 : 0.22, y = side==="e" ? 0.48 : 0.56;
  A.trauma = Math.min(1, A.trauma + (big ? 0.85 : 0.45)); if(side==="e") A.eHit = 1; else A.pHit = 1;
  for(let i=0;i<(big?34:16);i++){ const a = Math.random()*6.283, v = (big?260:170)*(0.3+Math.random());
    A.parts.push({ x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:0.35+Math.random()*0.45, max:0.8, col:["#ffd24a","#ff9d5c","#ffffff","#ff5a3c"][i%4], size:2+Math.random()*3 }); }
  if(dmg) A.pops.push({ x, y:y-0.16, txt:"−"+dmg, col:side==="e"?"#ffd24a":"#ff6a5a", t:0, big });
  if(side === "p") fxFlash("#c8201a", big ? 0.3 : 0.16);
}
function arenaAlien(g, x, y, r, t, hit){
  const seed = hash(combat.name), col = ["#7fe0a0","#c58cff","#ff8fb0","#7fd8ff","#ffc56a","#9aa9ff"][seed%6];
  g.save(); g.translate(x, y);
  for(let i=0;i<7;i++){ const a = i/7*6.283 + Math.sin(t*1.3+i)*0.25; g.strokeStyle = rgba(col, .8); g.lineWidth = r*0.13; g.lineCap = "round";
    g.beginPath(); g.moveTo(Math.cos(a)*r*0.7, Math.sin(a)*r*0.7);
    g.quadraticCurveTo(Math.cos(a+0.4)*r*1.5, Math.sin(a+0.4)*r*1.5, Math.cos(a+Math.sin(t*2+i)*0.5)*r*2.1, Math.sin(a+Math.sin(t*2+i)*0.5)*r*2.1); g.stroke(); }
  const gr = g.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r); gr.addColorStop(0,"#ffffff"); gr.addColorStop(.35,col); gr.addColorStop(1,rgba(col,.35));
  g.fillStyle = hit > 0.5 ? "#ffffff" : gr; g.beginPath(); g.arc(0,0,r*(1+Math.sin(t*3)*0.05),0,7); g.fill();
  g.fillStyle = "#10131f"; g.beginPath(); g.ellipse(-r*0.2, 0, r*0.3, r*0.42, 0, 0, 7); g.fill();
  g.fillStyle = "#ff5a3c"; g.beginPath(); g.arc(-r*0.26, 0, r*0.12, 0, 7); g.fill();
  g.restore();
}
function arenaFrame(now){
  const cv2 = $("arena"), c = combat; if(!cv2 || !c || !AR) return;
  const A = AR, dt = Math.min(0.05, (now-A.last)/1000); A.last = now; A.t += dt;
  const dpr = Math.min(window.devicePixelRatio||1, 2), w = cv2.clientWidth, h = cv2.clientHeight;
  if(cv2.width !== Math.round(w*dpr)){ cv2.width = Math.round(w*dpr); cv2.height = Math.round(h*dpr); }
  const g = cv2.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0);
  A.trauma = Math.max(0, A.trauma-1.6*dt); A.pHit = Math.max(0, A.pHit-dt*4); A.eHit = Math.max(0, A.eHit-dt*4);
  const sh = A.trauma*A.trauma*fxOpt().shake;
  /* 배경: 흘러가는 별 */
  const bg = g.createLinearGradient(0,0,0,h); bg.addColorStop(0,"#0b1020"); bg.addColorStop(1,"#1a1430"); g.fillStyle = bg; g.fillRect(0,0,w,h);
  for(const s of A.stars){ s[0] -= dt*0.05*s[2]; if(s[0] < 0) s[0] += 1; g.fillStyle = `rgba(220,230,255,${0.25+s[2]*0.4})`; g.fillRect(s[0]*w, s[1]*h, s[2]*1.6, s[2]*1.6); }
  g.save(); g.translate(16*sh*Math.sin(A.t*51), 11*sh*Math.sin(A.t*69));
  const keep = T; T = THEMES.dark;
  /* 아군 */
  const ps = SHIP_MAP[state.flagship], px = w*0.22 - A.pHit*10, py = h*0.56 + Math.sin(A.t*2)*4, psc = Math.min(3.6, w*0.2/ps.len);
  if(c.shield){ g.strokeStyle = `rgba(92,200,255,${0.5+Math.sin(A.t*8)*0.2})`; g.lineWidth = 3; g.beginPath(); g.ellipse(px, py, ps.len*psc*0.75, ps.wid*psc*1.1, 0, 0, 7); g.stroke();
    g.fillStyle = "rgba(92,200,255,.10)"; g.fill(); }
  drawShip(g, ps, px, py, 0, psc, true, false);
  if(A.pHit > 0){ g.fillStyle = `rgba(255,80,60,${A.pHit*0.5})`; g.beginPath(); g.arc(px, py, ps.len*psc*0.6, 0, 7); g.fill(); }
  /* 적 */
  const ex = w*0.78 + A.eHit*12, ey = h*0.48 + Math.sin(A.t*1.7+1)*5, den = c.kind==="den", dead = A.eDead ? Math.min(1, (A.deadT = (A.deadT||0)+dt)*1.6) : 0;
  g.globalAlpha = 1-dead;
  if(c.mon) drawMonster(g, c.mon, ex, ey, Math.min(34, h*0.17), A.t, A.eHit);
  else if(c.alien) arenaAlien(g, ex, ey, Math.min(30, h*0.16), A.t, A.eHit);
  else { if(den){ g.strokeStyle = "rgba(200,80,60,.55)"; g.lineWidth = 3; g.beginPath(); g.arc(ex+26, ey, 46+Math.sin(A.t)*2, 0, 7); g.stroke();
      drawFoe(g, "corvet", ex+34, ey-38, Math.PI, 1.5); drawFoe(g, "scout", ex+34, ey+38, Math.PI, 1.7); }
    drawFoe(g, c.foe, ex, ey, Math.PI, Math.min(den ? 2.6 : 2.8, 84/(FOES[c.foe]||FOES.scout).len)); }
  if(A.eHit > 0){ g.fillStyle = `rgba(255,255,255,${A.eHit*0.6})`; g.beginPath(); g.arc(ex, ey, 40, 0, 7); g.fill(); }
  g.globalAlpha = 1; T = keep;
  /* 탄환 */
  for(const s of A.shots){ s.t += dt; const k = Math.min(1, s.t/s.dur), fromP = s.from==="p";
    const x0 = fromP ? px+ps.len*psc*0.5 : ex-34, x1 = fromP ? ex : px, y0 = fromP ? py : ey, y1 = fromP ? ey : py, x = x0+(x1-x0)*k, y = y0+(y1-y0)*k;
    g.strokeStyle = fromP ? "#9ff3ff" : "#ff7a5a"; g.lineWidth = s.big ? 6 : 3.5; g.lineCap = "round"; g.shadowColor = g.strokeStyle; g.shadowBlur = 14;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x-(x1-x0)*0.12, y-(y1-y0)*0.12); g.stroke(); g.shadowBlur = 0; }
  A.shots = A.shots.filter(s=>s.t < s.dur);
  /* 파편 · 피해 숫자 */
  for(const p of A.parts){ p.life -= dt; p.x += p.vx*dt/w; p.y += p.vy*dt/h; p.vx *= 1-dt*3; p.vy *= 1-dt*3;
    g.fillStyle = rgba(p.col, Math.max(0, p.life/p.max)); g.beginPath(); g.arc(p.x*w, p.y*h, p.size*(0.4+p.life/p.max), 0, 7); g.fill(); }
  A.parts = A.parts.filter(p=>p.life > 0);
  for(const p of A.pops){ p.t += dt; const k = Math.min(1, p.t/0.18), sc = p.t < 0.18 ? 1.6-0.6*k : 1;       /* 툭 튀어나왔다가 제자리로 */
    g.globalAlpha = Math.max(0, 1-Math.max(0, p.t-0.6)/0.5); g.font = `800 ${(p.big?30:22)*sc}px 'Segoe UI',sans-serif`; g.textAlign = "center";
    g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.7)"; g.strokeText(p.txt, p.x*w, p.y*h-p.t*26); g.fillStyle = p.col; g.fillText(p.txt, p.x*w, p.y*h-p.t*26); g.globalAlpha = 1; }
  A.pops = A.pops.filter(p=>p.t < 1.1);
  g.restore();
  /* 조준 게이지 */
  if(c.aim){ const gw = w*0.7, gx = (w-gw)/2, gy = h-30, p = 0.5+0.5*Math.sin((now-c.aim.t0)/1000*c.aim.speed);
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(gx-6, gy-8, gw+12, 28);
    g.fillStyle = "#5a5560"; g.fillRect(gx, gy, gw, 12);
    g.fillStyle = "#4a90d9"; g.fillRect(gx+gw*0.225, gy, gw*0.55, 12);
    g.fillStyle = "#ffd24a"; g.fillRect(gx+gw*0.42, gy, gw*0.16, 12);
    g.fillStyle = "#fff"; g.fillRect(gx+gw*p-2.5, gy-6, 5, 24);
    g.font = "700 11px 'Segoe UI',sans-serif"; g.textAlign = "center"; g.fillStyle = "#ffd24a"; g.fillText(__("완벽"), gx+gw*0.5, gy-12); }
  requestAnimationFrame(arenaFrame);
}
