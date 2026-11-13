"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - UI ══════════════════ */
function toast(msg, gold){
  const t = document.createElement("div");
  t.className = "toast"+(gold?" gold":""); t.textContent = msg;
  $("toasts").appendChild(t);
  while($("toasts").children.length > 4) $("toasts").firstChild.remove();
  setTimeout(()=>t.remove(), 3300);
}
let modalKind = null;
function openModal(title, sub, html, kind){
  $("mTitle").textContent = title; $("mSub").textContent = sub||""; $("mBody").innerHTML = html;
  $("shade").classList.add("on"); modalKind = kind||null;
  $("modal").classList.toggle("wide", modalKind === "crew");      /* 임무 배치 창은 넓게 (직위 8개가 한눈에) */
  document.body.classList.add("modal-open");                    /* 창이 열리면 승무원 말풍선은 위로 비켜난다 */
}
function closeModal(){ if(forcedModal) return; $("shade").classList.remove("on"); modalKind = null; document.body.classList.remove("modal-open"); }
const gtag = g => `<span class="gtag" style="background:${GRADES[g].color}">${g}</span>`;
const starsOf = n => `<span class="stars">${"★".repeat(Math.min(n,5))}${"☆".repeat(5-Math.min(n,5))}</span>`;

function buildMini(){
  $("mini").innerHTML = ZONES.map((z,i)=>`<div class="mz" id="mz${i}" title="${z.name}" onclick="jumpZone(${i})">${z.ic}</div>`).join("");
}
function jumpZone(i){
  if(i > state.tech.warp){ toast(__`🔒 ${ZONES[i].name} - 워프 드라이브 Mk.${i} 필요`); return; }
  cam.follow = false; cam.x = WORLD_W/2; cam.y = ZY(i,.5); cam.s = 0.8;
}
function techAffordable(t){ const lv = state.tech[t.id]; return lv < t.max && state.gold >= t.gold[lv] && state.sci >= t.sci[lv]; }
function updateHUD(){
  if(!state) return;
  renderCrewBar();
  const st = eff(), z = zoneOf(state.y);
  $("hGold").textContent = fmt(state.gold); $("hGem").textContent = fmt(state.gems); $("hSci").textContent = fmt(state.sci);
  $("hFuel").textContent = `${state.fuel.toFixed(1)}/${st.sup}`; $("hO2").textContent = `${state.o2.toFixed(1)}/${st.sup}`;
  $("hHull").textContent = `${fmt(state.hull)}/${st.hull}`;
  $("pFuel").classList.toggle("warn", state.fuel < st.sup*.2);
  $("pO2").classList.toggle("warn", state.o2 < st.sup*.2);
  $("pHull").classList.toggle("warn", state.hull < st.hull*.3);
  const s = SHIP_MAP[state.flagship];
  $("shipPill").textContent = (state.title ? `「${ACHV_MAP[state.title].name}」 ` : "") + s.name;
  $("hDate").textContent = `📅 ${dateStr(state.day)}`;
  $("hZone").textContent = `${ZONES[z].ic} ${ZONES[z].name}` + (dockedAt ? ` · ⚓ ${BODY_MAP[dockedAt].name}` : "");
  const f = sail ? flowFactor() : 1, pct = Math.round((f-1)*100);
  $("hFlow").innerHTML = state.buff && state.day < state.buff.until
    ? (state.buff.t==="boost" ? __("🌠 <b>중력 가속</b>") : __("🔧 <b>엔진 이상</b>")) + __` ${Math.ceil((state.buff.until-state.day)*10)/10}일`
    : `${__`🌬 중력류 <b>${pct>=0?"+":""}${pct}%</b>`}`;
  const m = MISSIONS[state.mission];
  $("hGoal").textContent = m ? `🎯 ${m.t}` : __("🎯 모든 임무 완료 - 자유 항해");
  $("btnTrade").classList.toggle("hot", !!dockedAt); $("btnCrew").classList.toggle("hot", !!dockedAt && crewHere().length>0);
  $("btnTech").classList.toggle("badge", TECH.some(techAffordable));
  $("btnQuest").classList.toggle("badge", !!dockedAt && ensureQuests().some(q=>!q.done && q.port===dockedAt && (state.cargo[q.good]||0)>=q.qty));
  for(let i=0;i<ZONE_N;i++){ const e = $("mz"+i); if(!e) continue;
    e.classList.toggle("lock", i>state.tech.warp); e.classList.toggle("here", i===z); }
}

/* ══════════════════ 함대 ══════════════════ */
const SHIP_DESC = {
  shuttle:__("궤도 왕복용으로 쓰이던 퇴역 셔틀. 낡았지만 모든 선장의 첫 배는 언제나 이런 배다."),
  tug:__("정거장 사이에서 화물을 끌던 작업선. 작지만 힘이 좋고 연비가 준수하다."),
  barge:__("엔진 위에 컨테이너를 얹은 게 전부인 화물선. 느리지만 일반 등급에서 가장 많이 싣는다."),
  probe:__("무인 탐사선을 유인용으로 개조했다. 가볍고 빠르며 한 번 보급으로 멀리 간다."),
  corvet:__("후퇴익을 단 소형 전투함. 속도와 무장의 균형이 좋아 초보 선장의 사랑을 받는다."),
  miner:__("함수의 굴착 드릴로 소행성을 파내는 채굴선. 선체가 두껍고 화물칸이 넓다."),
  cutter:__("밀수꾼들이 애용하던 바늘 모양 쾌속선. 고급 등급에서 가장 빠르다."),
  hauler:__("화물 모듈 세 칸을 줄줄이 매단 장거리 수송선. 별과 별 사이를 묵묵히 오간다."),
  destroy:__("전진익과 측면 함포를 갖춘 주력 전투함. 해적들이 가장 마주치기 싫어하는 배."),
  freight:__("컨테이너 네 열을 싣는 초대형 화물선. 희귀 등급 최고의 적재량을 자랑한다."),
  clipper:__("거대한 태양 돛으로 항성풍을 타는 쾌속선. 연료를 거의 쓰지 않고 우아하게 미끄러진다."),
  science:__("원반형 선체에 관측 장비를 가득 실은 연구선. 행운이 따르는 배로 유명하다."),
  aurum:__("황금빛 합금으로 두른 전설적인 무역선. 이 배가 입항하면 시장의 시세가 움직인다."),
  dread:__("겹겹의 장갑판과 포탑으로 무장한 전함. 영웅 등급에서 가장 단단한 선체를 가졌다."),
  phantom:__("반투명한 선체가 별빛에 스며드는 유령선. 누가 만들었는지 아무도 모른다."),
  helios:__("부채꼴 돛으로 항성의 빛을 모아 달리는 채집선. 태양의 축복을 받았다고 전해진다."),
  ark:__("수천 명이 대를 이어 살아가도록 설계된 세대 우주선. 하나의 도시가 통째로 항해한다."),
  levia:__("공간 자체를 접어 도약하는 차원함. 지나간 자리에는 푸른 빛의 파문만 남는다."),
};
function shipStatLine(id){
  const e = eff(id);
  return `${__`속도 <b>${Math.round(e.speed)}</b> · 적재 <b>${e.cargo}</b> · 연비 <b>${e.fuel.toFixed(1)}</b> · 탱크 <b>${e.sup}</b><br>
    선체 <b>${e.hull}</b> · 전투력 <b>${e.pow}</b> · 행운 <b>${Math.round(e.luck)}</b>`}`;
}
/* 등급 필터 탭: [전체][N][R][SR][SSR][UR] */
const gradeFilter = { fleet:"all", crew:"all" };
function gradeTabs(kind, list, re){
  const cur = gradeFilter[kind];
  return `<div class="tabs gtabs">${["all","N","R","SR","SSR","UR"].map(g => {
    const n = g==="all" ? list.length : list.filter(x=>x.g===g).length;
    return `<div class="tab ${g===cur?"on":""}" ${g!=="all"&&g!==cur?`style="color:${GRADES[g].color}"`:""} onclick="gradeFilter.${kind}='${g}';${re}">${g==="all"?__("전체"):g}<span class="gtc">${n}</span></div>`; }).join("")}</div>`;
}
const gradeOk = (kind, g) => gradeFilter[kind] === "all" || gradeFilter[kind] === g;
function openFleet(){
  const own = SHIPS.filter(s=>s.id in state.ships && gradeOk("fleet", s.g)).reverse(), rest = SHIPS.filter(s=>!(s.id in state.ships) && gradeOk("fleet", s.g)).reverse();
  let html = gradeTabs("fleet", SHIPS, "openFleet()") + `<div class="stat" style="margin:0 4px 10px">${__`보유 함선 ${Object.keys(state.ships).length}/${SHIPS.length}종 · 임무 직위 ${state.mates.length}/${mateCap()}자리 · 함선을 누르면 큰 그림과 세부 정보를 볼 수 있습니다.`}</div>`;
  for(const s of own){
    const id = s.id, flag = id===state.flagship, onRoute = state.routes.some(r=>r.ship===id);
    html += `<div class="card" style="cursor:pointer" onclick="openShip('${id}')"><div class="row">
      <img src="${shipIcon(id)}" width="110" height="66" style="flex:none">
      <div class="grow"><div class="ttl">${gtag(s.g)} ${s.name} ${starsOf(state.ships[id])}</div>
        <div class="stat">${shipStatLine(id)}</div></div>
      ${flag ? `${__`<span class="acc" style="font-size:12px">기함</span>`}`
        : onRoute ? `${__`<span class="stat">항로 운항 중</span>`}`
        : `<button class="btn sm" ${dockedAt&&!sail?"":"disabled"} onclick="event.stopPropagation();setFlagship('${id}')">${__`기함으로`}</button>`}
    </div></div>`;
  }
  if(rest.length){ html += `<div class="sec">${__`아직 보유하지 못한 함선 ${rest.length}종`}</div>`;
    for(const s of rest) html += `<div class="card dim" style="cursor:pointer" onclick="openShip('${s.id}')"><div class="row">
      <img src="${shipIcon(s.id)}" width="80" height="48" style="flex:none;filter:grayscale(1) opacity(.55)">
      <div class="grow"><div class="ttl">${gtag(s.g)} ${s.name}</div><div class="stat">${__`조선소 건조 또는 해적 기지 토벌 보상으로 획득`}</div></div></div></div>`; }
  openModal(__("🚀 함대"), "", html, "fleet");
}
/* 함선 상세: 큰 그림 + 세부 제원 */
function openShip(id){
  const s = SHIP_MAP[id], owned = id in state.ships, stars = Math.min(state.ships[id]||0, 5), e = eff(id);
  const all = SHIPS.map(x=>eff(x.id)), mx = k => Math.max(...all.map(a=>a[k]));
  const range = Math.round(e.sup/e.fuel*100), mxRange = Math.max(...all.map(a=>a.sup/a.fuel*100));
  const row = (ic, name, val, pct, note) => `<div style="margin-bottom:9px"><div class="row" style="gap:6px">
      <div style="width:22px;text-align:center">${ic}</div><div class="grow" style="font-size:12.5px;font-weight:600">${name}
      ${note?`<span class="stat" style="margin-left:4px">${note}</span>`:""}</div><div style="font-size:13px;font-weight:800">${val}</div></div>
      <div class="bar"><i style="width:${clamp(pct*100,3,100)}%;background:${GRADES[s.g].color}"></i></div></div>`;
  const cap = POST_CAP[s.g];
  const flag = id===state.flagship, onRoute = state.routes.some(r=>r.ship===id);
  const html = `
    <div class="card" style="padding:0;overflow:hidden;border-color:${GRADES[s.g].color}">
      <div style="background:radial-gradient(ellipse at 50% 55%, #1b2748 0%, #0a0f1e 70%, #05070f 100%);text-align:center;padding:6px 0 0">
        <img src="${shipIcon(id,true)}" style="width:100%;max-width:500px;aspect-ratio:5/3;display:block;margin:0 auto${owned?"":";filter:grayscale(.7) brightness(.7)"}"></div>
      <div style="padding:12px 14px;text-align:center">
        <div style="font-size:18px;font-weight:800">${gtag(s.g)} ${s.name}</div>
        <div style="margin-top:4px">${__`<span style="color:${GRADES[s.g].color};font-weight:800;font-size:12px">${GRADES[s.g].name} 등급</span>
          ${owned?` · ${starsOf(stars)}`:` ${__`· <span class="stat">미보유</span>`}`}${flag?__(' · <b class="acc" style="font-size:12px">현재 기함</b>'):onRoute?__(' · <span class="stat">항로 운항 중</span>'):""}`}</div>
        <div class="stat" style="margin-top:8px;font-size:12.5px;line-height:1.7">${SHIP_DESC[id]||""}</div></div></div>
    ${owned ? `<div class="sec">${__`⭐ 승성`}</div><div class="card"><div class="ttl" style="color:#e0a63f">${"★".repeat(stars)}${"☆".repeat(5-stars)}</div>
      <div class="stat">${__`승성 ★마다 속도·탱크·선체·전투력이 10%씩 오르고 연비가 5%씩 좋아집니다 (지금 <b>×${(1+SHIP_STAR*stars).toFixed(1)}</b>). 조선소에서 같은 함선이 나오면 오릅니다.`}</div></div>` : ""}
    <div class="sec">${__`세부 제원 ${owned?__("(승성·연구·승무원 효과 포함)"):__("(획득 시 예상 수치)")}`}</div>
    <div class="card">
      ${row("💨",__("속도"), Math.round(e.speed), e.speed/mx("speed"), __`기본 ${s.speed}`)}
      ${row("📦",__("화물 적재량"), e.cargo, e.cargo/mx("cargo"), __`기본 ${s.cargo}`)}
      ${row("⛽",__("연료·산소 탱크"), e.sup, e.sup/mx("sup"))}
      ${row("🔥",__("연비"), e.fuel.toFixed(1), Math.min(...all.map(a=>a.fuel))/e.fuel, __("거리 100당 연료 · 낮을수록 좋음"))}
      ${row("🧭",__("항속 거리"), fmt(range), range/mxRange, __("한 번 보급으로 가는 거리"))}
      ${row("🛡",__("선체 내구도"), e.hull, e.hull/mx("hull"), __`기본 ${s.hull}`)}
      ${row("💥",__("전투력"), e.pow, e.pow/mx("pow"))}
      ${row("🍀",__("행운"), Math.round(e.luck), e.luck/Math.max(1,mx("luck")), __("이벤트·치명타·도주에 영향"))}
    </div>
    <div class="sec">${__`추가 정보`}</div>
    <div class="card"><div class="stat" style="font-size:12px;line-height:1.9">
      ${__`💞 임무 직위 <b>${cap}자리</b> - ${POSTS.slice(0,cap).map(p=>p.name).join(" · ")}<br>
      ⭐ 승성 <b>★${stars}/5</b> - 같은 함선을 다시 얻을 때마다 속도·탱크·선체·전투력 <b>+10%</b>, 연비 <b>−5%</b><br>
      💠 ★5 이후 중복 획득 시 <b>${fmt(shipRefund())}</b> 크레딧 환급<br>
      🎲 조선소 건조 확률 - ${GRADES[s.g].name} 등급 <b>${GRADES[s.g].rate}%</b> 중 ${SHIPS.filter(x=>x.g===s.g).length}종 가운데 하나`}</div></div>
    ${owned && !flag && !onRoute ? `<button class="btn orange wide" ${dockedAt&&!sail?"":"disabled"} onclick="setFlagship('${id}')">${__`이 함선을 기함으로${dockedAt&&!sail?"":__(" (정박 중에만 가능)")}`}</button>` : ""}
    <button class="btn ghost wide" onclick="openFleet()">${__`← 함대 목록으로`}</button>`;
  openModal(__("🚀 함선 상세"), s.name, html, "ship");
  $("mBody").scrollTop = 0;
}
function setFlagship(id){
  if(!dockedAt) return;
  const old = state.flagship; state.flagship = id;
  const st = eff();
  if(cargoUsed() > st.cargo){ state.flagship = old; toast(__("화물이 새 기함의 적재량을 초과합니다. 먼저 화물을 파세요")); return; }
  syncPosts();
  state.fuel = Math.min(state.fuel, st.sup); state.o2 = Math.min(state.o2, st.sup); state.hull = Math.min(Math.max(state.hull, st.hull*.5), st.hull);
  sfx("ok"); toast(__`🚀 기함을 「${SHIP_MAP[id].name}」(으)로 교체했습니다`); updateHUD(); save(); modalKind==="ship" ? openShip(id) : openFleet();
}

/* ══════════════════ 조선소 (건조) ══════════════════ */
function openGacha(res){
  let html = `<div class="card" style="text-align:center">
    <div class="stat">${__`설계도를 무작위로 받아 함선을 건조합니다. 이미 있는 함선이 나오면 ★ 승성(최대 5)하고, ★마다 제원이 10%씩 오릅니다. ★5 이후에는 ${fmt(shipRefund())}💠를 돌려받습니다.`}</div>
    <div class="stat" style="margin-top:6px">${Object.keys(GRADES).map(g=>`${gtag(g)} ${GRADES[g].rate}%`).join(" &nbsp;")}</div>
    <div class="row" style="margin-top:12px;justify-content:center">
      <button class="btn orange" ${state.gold<GACHA_COST?"disabled":""} onclick="doGacha(1)">${__`1회 건조 · ${fmt(GACHA_COST)}💠`}</button>
      <button class="btn" ${state.gold<GACHA_TEN?"disabled":""} onclick="doGacha(10)">${__`10회 건조 · ${fmt(GACHA_TEN)}💠`}</button></div>
    <div class="stat" style="margin-top:8px">${__`10회 건조 시 고급(R) 이상 1척 확정`}<br>${__`누적 ${pity().ship}회 · ${gtag("SR")} 확정까지 ${PITY_N-pity().ship%PITY_N}회`}</div></div>`;
  if(res) html += `<div id="pullWrap">${res.map((r,i)=>`<div class="pullCard" style="border-color:${GRADES[r.s.g].color};animation-delay:${i*0.06}s">
      <img src="${shipIcon(r.s.id)}" width="70" height="42"><div class="gd" style="color:${GRADES[r.s.g].color}">${r.s.g} · ${GRADES[r.s.g].name}</div>
      <div class="nm">${r.s.name}</div><div class="dup">${r.note}</div></div>`).join("")}</div>`;
  openModal(__("🎲 조선소"), __`보유 ${Object.keys(state.ships).length}/${SHIPS.length}종`, html, "gacha");
}
function rollGrade(minR){
  let r = Math.random()*100;
  for(const g of ["UR","SSR","SR","R","N"]){ r -= GRADES[g].rate; if(r < 0) return (minR && g==="N") ? "R" : g; }
  return minR ? "R" : "N";
}
function doGacha(n){
  const cost = n===10 ? GACHA_TEN : GACHA_COST;
  if(state.gold < cost) return;
  state.gold -= cost; state.stats.pulls += n;
  const res = [];
  for(let i=0;i<n;i++){
    let g = rollGrade(n===10 && i===9 && !res.some(r=>r.s.g!=="N"));
    if(++pity().ship % PITY_N === 0 && ["N","R"].includes(g)) g = "SR";          /* 100회째: SR 이상 확정 */
    const pool = SHIPS.filter(s=>s.g===g), s = pool[Math.floor(Math.random()*pool.length)];
    let note;
    if(!(s.id in state.ships)){ state.ships[s.id] = 0; note = "NEW!"; }
    else if(state.ships[s.id] < 5){ state.ships[s.id]++; note = __`★${state.ships[s.id]} 승성`; }
    else { state.gold += shipRefund(); note = `+${fmt(shipRefund())}💠`; }
    res.push({ s, note });
  }
  sfx(res.some(r=>["SSR","UR"].includes(r.s.g)) ? "warp" : "coin");
  checkMissions(); checkAchievements(); updateHUD(); save(); openGacha(res);
}

/* ══════════════════ 승무원 · 임무 배치 ══════════════════ */
function portrait(n, size){
  const pc = CREW_PIC[n.id]; if(!pc) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#f4f1ec;flex:none"></div>`;
  const sh = SHEETS[pc[0]], d = sh.d*0.84;
  const bgW = (sh.w/d*100).toFixed(2), bgH = (sh.h/d*100).toFixed(2);
  const x = ((pc[1]-d/2)/(sh.w-d)*100).toFixed(2), y = ((pc[2]-d/2)/(sh.h-d)*100).toFixed(2);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;flex:none;border:1px solid #e6e3de;background-color:#f6f1ea;
    background-image:url('image/character_${pc[0]}.png');background-repeat:no-repeat;background-size:${bgW}% ${bgH}%;background-position:${x}% ${y}%"></div>`;
}
/* 얼굴 아래에 붙는 등급(승성) 표시: 가진 승무원은 금색 ★, 나머지 칸은 회색 ☆ */
function gradeRow(n, fs){ const s = state.crew.includes(n.id) ? starOf(n.id) : 0;
  return `<div style="text-align:center;line-height:1;margin-top:3px"><span class="gtag" style="margin:0;background:${GRADES[n.g].color};font-size:${Math.max(9,(fs||10)*0.8)}px">${n.g}</span></div><div style="text-align:center;font-size:${fs||10}px;line-height:1.3;letter-spacing:-.5px;white-space:nowrap"><span style="color:#e0a63f">${"★".repeat(s)}</span><span style="color:#cfc9c0">${"☆".repeat(STAR_MAX-s)}</span></div>`; }
const faceGrade = (n, size) => `<div style="flex:none">${portrait(n,size)}${gradeRow(n, size>=56?10.5:9.5)}</div>`;
function bonusText(b){
  const p = [], pc = v => Math.round(v*1000)/10;
  if(b.sell)  p.push(__`판매가 +${pc(b.sell)}%`);
  if(b.buy)   p.push(__`구매가 −${pc(b.buy)}%`);
  if(b.route) p.push(__`항로 수익 +${pc(b.route)}%`);
  if(b.luck)  p.push(__`행운 +${Math.round(b.luck*10)/10}`);
  if(b.salv)  p.push(__`표류물 보상 +${pc(b.salv)}%`);
  if(b.fuel)  p.push(__`연료·산소 소모 −${pc(b.fuel)}%`);
  if(b.speed) p.push(__`항해 속도 +${pc(b.speed)}%`);
  if(b.atk)   p.push(__`전투력 +${Math.round(b.atk*10)/10}`);
  if(b.crit)  p.push(__`치명타 확률 +${pc(b.crit)}%`);
  if(b.sci)   p.push(__`연구 데이터 +${pc(b.sci)}%`);
  return p.join(" · ");
}
const scaled = (b, m) => Object.fromEntries(Object.entries(b).map(([k,v])=>[k, v*m]));
const postOf = id => POSTS.find(p=>state.posts[p.id] === id) || null;
const starTag = id => starOf(id) ? ` <span style="color:#e0a63f;font-weight:800">★${starOf(id)}</span>` : "";
const crewMult = id => (1 + (state.aff[id]||0)/200) * starMult(id) * (postOf(id) ? postOf(id).mult : IDLE_MULT);
/* 추천 직위: 승무원의 능력과 어울리는 자리. 맞는 자리가 없으면 부기장감으로 본다 */
const POST_FIT = { nav:["speed","route"], eng:["fuel"], deck:["atk","crit"], sci:["sci"], cargo:["sell","buy","salv"], doc:["luck"], comm:["route","luck"] };
const postFits = (pid, id) => (POST_FIT[pid]||[]).some(k => k in CREW_MAP[id].bonus);
function recPost(id){ return POSTS.find(p => postFits(p.id, id)) || POSTS[0]; }
/* 빈 직위 가운데 이 승무원에게 줄 자리: 추천 직위가 비어 있으면 그 자리, 아니면 어울리는 빈자리, 그것도 없으면 가장 높은 빈자리 */
function freePostFor(id){
  const free = POSTS.slice(0, mateCap()).filter(p=>!state.posts[p.id]); if(!free.length) return null;
  const rec = recPost(id); return free.find(p=>p.id===rec.id) || free.find(p=>postFits(p.id, id)) || free[0];
}
const crewPower = id => CREW_MAP[id].cost * starMult(id) * (1 + (state.aff[id]||0)/200);
/* 자동 배치: 능력이 좋은 승무원부터 높은 직위에 앉힌다. 비슷하면 직위와 어울리는 사람을 먼저 */
function autoPosts(){
  const cap = mateCap(); let pool = [...state.crew].sort((a,b)=>crewPower(b)-crewPower(a)).slice(0, cap);
  state.posts = {};
  for(const p of POSTS.slice(0, cap)){ if(!pool.length) break;
    let best = pool[0], bs = -1; for(const id of pool){ const s = crewPower(id)*(postFits(p.id, id) ? 1.25 : 1); if(s > bs){ bs = s; best = id; } }
    state.posts[p.id] = best; pool = pool.filter(x=>x!==best); }
  syncPosts(); sfx("ok"); toast(__("⚡ 능력이 좋은 순서로 직위를 배치했습니다"), true); updateHUD(); save(); openCrew(0);
}
/* 직위 정리: 없는 승무원·기함 등급을 넘는 직위를 비우고, 예전 '승선' 세이브를 직위로 옮긴다 */
function syncPosts(){
  if(!state.posts) state.posts = {};
  for(const old of ["gun","trade"]) if(state.posts[old]){ if(!state.posts.deck) state.posts.deck = state.posts[old]; delete state.posts[old]; }   /* 없어진 직위(교역관·포술장) → 갑판장 */
  const cap = mateCap();
  if(!state.postsInit){ state.postsInit = true;                 /* 예전 '승선' 세이브는 한 번만 직위로 옮긴다 */
    if(!Object.keys(state.posts).length && state.mates) state.mates.slice(0,cap).forEach((id,i)=>{ state.posts[POSTS[i].id] = id; }); }
  POSTS.forEach((p,i)=>{ const id = state.posts[p.id]; if(id && (i >= cap || !state.crew.includes(id))) delete state.posts[p.id]; });
  state.mates = POSTS.map(p=>state.posts[p.id]).filter(Boolean);
}
/* 인연: 기지에 입항하면 확률로 승무원이 나타난다. 나타난 그 기지에서만(며칠 동안) 영입할 수 있다 */
const crewHere = () => { const o = state.offer;
  return o && dockedAt && o.port === dockedAt && o.until > state.day ? o.ids.map(i=>CREW_MAP[i]).filter(n=>n && !state.crew.includes(n.id)) : []; };
function rollCrew(){
  const o = state.offer;
  if(o && o.port === dockedAt && o.until > state.day) return;          /* 아직 이 기지에서 기다리는 중 */
  state.offer = null;
  if(!state.crewCd) state.crewCd = {};
  if((state.crewCd[dockedAt]||0) > state.day) return;                  /* 들락거리며 다시 뽑지 못하게 */
  state.crewCd[dockedAt] = state.day + 3;
  const z = BODY_MAP[dockedAt].z, free = CREW.filter(n=>!state.crew.includes(n.id));
  let n = null;
  if(state.day >= state.rareCd && Math.random() < 0.06){ const pool = free.filter(x=>x.rare);
    if(pool.length){ n = pool[Math.floor(Math.random()*pool.length)]; state.rareCd = state.day + 5; } }
  if(!n){ const home = free.find(x=>x.port===dockedAt), pool = free.filter(x=>!x.rare && BODY_MAP[x.port].z <= z);
    if(home && Math.random() < 0.5) n = home;                          /* 그 기지 출신은 더 자주 나타난다 */
    else if(pool.length && Math.random() < (state.crew.length ? 0.3 : 0.6)) n = pool[Math.floor(Math.random()*pool.length)]; }
  if(!n) return;
  state.offer = { port:dockedAt, ids:[n.id], until:state.day + 3 };
  meetCrew(n);
}
function crewCard(n, btn, extra){
  return `<div class="card" style="cursor:pointer" onclick="openMember('${n.id}')"><div class="row">${tapFace(n,58)}
    <div class="grow"><div class="ttl">${n.rare?"🌟 ":""}${n.name}${state.crew.includes(n.id)?starTag(n.id):""} <span class="stat" style="color:#b0743f">${n.title}</span></div>
      <div class="stat">${n.desc}</div><div class="stat acc">${bonusText(n.bonus)}</div>${extra||""}</div>${btn||""}</div></div>`;
}
let crewTab = 0;
function openCrew(tab, res){
  if(tab != null) crewTab = tab;
  if(crewTab === 0 && !state.crew.length) crewTab = 1;
  const tabs = `<div class="tabs">${[__("임무 배치"),__("승무원 명단"),__("승무원 뽑기")].map((t,i)=>`<div class="tab ${i===crewTab?"on":""}" onclick="openCrew(${i})">${t}</div>`).join("")}</div>`;
  openModal(__("💞 승무원"), __`임명 ${state.mates.length}/${mateCap()}`, tabs + (crewTab===0 ? postsHTML() : crewTab===1 ? rosterHTML() : crewGachaHTML(res)), "crew");
}
function postsHTML(){
  const cap = mateCap();
  let html = `<div class="stat" style="margin:0 4px 10px">${__`직위에 임명된 승무원만 능력을 온전히 발휘합니다. <b>높은 직위일수록 능력이 크게</b> 적용되고, 직위마다 고유 효과가 따로 붙습니다. 임명되지 않은 승무원은 능력의 ${Math.round(IDLE_MULT*100)}%만 발휘합니다.`}</div>`;
  if(state.crew.length > 1) html += `<button class="btn orange wide" style="margin-bottom:10px" onclick="autoPosts()">${__`⚡ 능력 순으로 자동 배치`}</button>`;
  html += `<div class="pgrid">`;
  POSTS.forEach((p,i)=>{
    const id = state.posts[p.id], n = id && CREW_MAP[id], locked = i >= cap;
    html += `<div class="card ${locked?"dim":""}" ${i===0&&!locked?'style="border-color:#d96f32"':""}><div class="row">
      ${n ? tapFace(n,58) : `<div style="width:58px;height:58px;border-radius:50%;background:#efede9;flex:none;text-align:center;line-height:58px;font-size:24px">${locked?"🔒":p.ic}</div>`}
      <div class="grow"><div class="ttl">${__`${p.ic} ${p.name} <span class="gtag" style="background:#d96f32">능력 ×${p.mult}</span>`}</div>
        <div class="stat">${__`${p.desc} · 직위 효과 <b>${bonusText(p.perk)}</b>`}</div>
        ${locked ? `<div class="stat">${__`🔒 더 높은 등급의 기함이 필요합니다 (${Object.keys(POST_CAP).filter(g=>POST_CAP[g]>i)[0]} 등급 이상)`}</div>`
          : n ? `<div class="stat"><b>${n.name}</b> · 💞 ${Math.floor(state.aff[id]||0)}</div><div class="stat acc">${bonusText(scaled(n.bonus, crewMult(id)))}</div>`
          : `<div class="stat">${__`비어 있음 - 직위 효과도 적용되지 않습니다`}</div>`}</div>
      ${locked ? "" : `<div style="display:flex;flex-direction:column;gap:4px">
        <button class="btn sm ${n?"":"orange"}" ${state.crew.length?"":"disabled"} onclick="pickPost('${p.id}')">${n?__("교체"):__("임명")}</button>
        ${n?`<button class="btn sm ghost" onclick="clearPost('${p.id}')">${__`해임`}</button>`:""}</div>`}
    </div></div>`;
  });
  html += `</div>`;
  if(!state.crew.length) html += `<div class="stat" style="margin:8px 4px 0">${__`아직 승무원이 없습니다. 기지에 입항해 인연을 찾아보세요.`}</div>`;
  return html;
}
function pickPost(pid){
  const p = POSTS.find(x=>x.id===pid);
  let html = `<div class="stat" style="margin:0 4px 10px">${__`${p.desc}. 능력 <b>×${p.mult}</b> · 직위 효과 <b>${bonusText(p.perk)}</b>`}</div>`;
  const list = [...state.crew].sort((a,b)=>CREW_MAP[b].cost-CREW_MAP[a].cost);
  for(const id of list){
    const n = CREW_MAP[id], cur = postOf(id), m = (1+(state.aff[id]||0)/200)*starMult(id)*p.mult;
    html += `<div class="card" style="cursor:pointer" onclick="assignPost('${pid}','${id}')"><div class="row">${faceGrade(n,50)}
      <div class="grow"><div class="ttl">${n.name}${recPost(id).id===pid?` <span class="gtag" style="background:#3fa66b">${__("추천")}</span>`:""} <span class="stat">${cur?__`현재 ${cur.ic} ${cur.name}`:__("대기 중")}</span></div>
        <div class="stat acc">${__`이 직위에서: ${bonusText(scaled(n.bonus, m))}`}</div></div>
      <span class="btn sm orange">${cur&&cur.id===pid?__("임명됨"):__("임명")}</span></div></div>`;
  }
  html += `<button class="btn ghost wide" onclick="openCrew(0)">${__`← 돌아가기`}</button>`;
  openModal(__`${p.ic} ${p.name} 임명`, "", html, "crew");
}
function assignPost(pid, id){
  const prev = postOf(id), old = state.posts[pid];
  if(prev) delete state.posts[prev.id];
  if(old && prev && old !== id) state.posts[prev.id] = old;        /* 두 사람의 직위를 맞바꾼다 */
  state.posts[pid] = id; syncPosts(); sfx("ok");
  const p = POSTS.find(x=>x.id===pid);
  toast(__`${p.ic} ${CREW_MAP[id].name}을(를) ${p.name}(으)로 임명했습니다`, true);
  narrate("", p.hi, false, pid);                                   /* 임명 인사 */
  updateHUD(); save(); openCrew(0);
}
function clearPost(pid){ delete state.posts[pid]; syncPosts(); updateHUD(); save(); openCrew(0); }
function rosterHTML(){
  let html = gradeTabs("crew", CREW, "openCrew(1)");
  const here = crewHere().filter(n=>gradeOk("crew", n.g));
  if(here.length){ html += `<div class="sec">${__`이 기지에서 만난 인연`}</div>`;
    for(const n of here) html += crewCard(n, `<button class="btn sm orange" ${state.gold<n.cost?"disabled":""} onclick="event.stopPropagation();recruit('${n.id}')">${__`영입<br>${fmt(n.cost)}💠`}</button>`); }
  html += `<div class="sec">${__`나의 승무원 ${state.crew.length}명`}</div>`;
  if(!state.crew.length) html += `<div class="stat" style="margin:0 4px 10px">${__`아직 승무원이 없습니다. 기지에 입항해 인연을 찾아보세요.`}</div>`;
  for(const id of state.crew){
    const n = CREW_MAP[id], a = Math.floor(state.aff[id]||0), p = postOf(id);
    if(!gradeOk("crew", n.g)) continue;
    html += crewCard(n, `<button class="btn sm ${p?"ghost":""}" onclick="event.stopPropagation();openCrew(0)">${p?__("직위 변경"):__("임명하기")}</button>`,
      `<div class="stat">${p?`${__`<b class="acc">${p.ic} ${p.name}</b> (능력 ×${p.mult})`}`:__`대기 중 (능력 ×${IDLE_MULT})`} · 💞 ${affName(a)} ${a}/100</div><div class="bar"><i style="width:${a}%"></i></div>`);
  }
  /* 도감: 아직 없는 승무원도 미리 볼 수 있다 (눌러서 상세 보기) */
  const lack = CREW.filter(n=>!state.crew.includes(n.id) && !here.includes(n) && gradeOk("crew", n.g));
  if(lack.length){ html += `<div class="sec">${__`아직 만나지 못한 인연`} (${lack.length})</div>`;
    for(const n of lack) html += `<div style="opacity:.72">${crewCard(n, "")}</div>`; }
  const rest = CREW.filter(n=>!n.rare && !state.crew.includes(n.id)).length;
  if(rest) html += `<div class="stat" style="margin:10px 4px 0">${__`💞 아직 만나지 못한 인연 ${rest}명 - 기지에 입항하면 확률로 나타나고, 나타난 그 기지에서만 영입할 수 있습니다.`}</div>`;
  html += `<div class="stat" style="margin:10px 4px">${__`🌟 떠도는 전설의 승무원은 기지에 입항할 때 낮은 확률로 나타납니다. (보유 ${state.crew.filter(i=>CREW_MAP[i].rare).length}/${RARE_CREW.length})`}</div>`;
  return html;
}
/* 승무원 뽑기 */
function crewGachaHTML(res){
  let html = `<div class="card" style="text-align:center">
    <div class="stat">${__`승무원을 무작위로 뽑습니다. 이미 있는 승무원이 나오면 ★ 승성(최대 ${STAR_MAX})하고, ★마다 능력이 10%씩 오릅니다. ★${STAR_MAX} 이후에는 ${fmt(CREW_REFUND)}💠를 돌려받습니다.`}</div>
    <div class="stat" style="margin-top:6px">${Object.keys(CREW_RATE).map(g=>`${gtag(g)} ${CREW_RATE[g]}%`).join(" &nbsp;")}</div>
    <div class="row" style="margin-top:12px;justify-content:center">
      <button class="btn orange" ${state.gold<CREW_PULL?"disabled":""} onclick="doCrewGacha(1)">${__`1회 뽑기 · ${fmt(CREW_PULL)}💠`}</button>
      <button class="btn" ${state.gold<CREW_PULL_TEN?"disabled":""} onclick="doCrewGacha(10)">${__`10회 뽑기 · ${fmt(CREW_PULL_TEN)}💠`}</button></div>
    <div class="stat" style="margin-top:8px">${__`10회 뽑기 시 희귀(SR) 이상 1명 확정`}<br>${__`누적 ${pity().crew}회 · ${gtag("SSR")} 확정까지 ${PITY_N-pity().crew%PITY_N}회`}<br>${__`승성은 뽑기로만 올릴 수 있습니다. 기지에는 아직 없는 승무원만 나타납니다.`}</div></div>`;
  if(res) html += `<div id="pullWrap">${res.map((r,i)=>`<div class="pullCard" style="cursor:pointer;border-color:${GRADES[r.n.g].color};animation-delay:${i*0.06}s" onclick="openMember('${r.n.id}')">
      <div style="display:inline-block">${faceGrade(r.n,56)}</div><div class="gd" style="color:${r.n.rare?"#e0a63f":"#d96f32"}">${r.n.rare?"🌟 ":""}${r.n.title}</div>
      <div class="nm">${r.n.name}</div><div class="dup">${r.note}</div></div>`).join("")}</div>`;
  return html;
}
function doCrewGacha(k){
  const cost = k===10 ? CREW_PULL_TEN : CREW_PULL;
  if(state.gold < cost) return;
  state.gold -= cost; if(!state.stars) state.stars = {};
  const res = []; let fresh = false;
  for(let i=0;i<k;i++){
    let g = "N", r = Math.random()*100; for(const k of ["UR","SSR","SR","R","N"]){ r -= CREW_RATE[k]; if(r < 0){ g = k; break; } }
    if(k===10 && i===9 && ["N","R"].includes(g) && !res.some(x=>!["N","R"].includes(x.n.g))) g = "SR";   /* 10회: SR 이상 1명 확정 */
    if(++pity().crew % PITY_N === 0 && !["SSR","UR"].includes(g)) g = "SSR";      /* 100회째: SSR 이상 확정 */
    const pool = CREW.filter(n=>n.g === g), n = pool[Math.floor(Math.random()*pool.length)];
    let note;
    if(!state.crew.includes(n.id)){ state.crew.push(n.id); state.aff[n.id] = 0; note = "NEW!"; fresh = true;
      const free = freePostFor(n.id); if(free) state.posts[free.id] = n.id; }   /* 빈 직위가 있으면 바로 임명 (어울리는 자리부터) */
    else if(starOf(n.id) < STAR_MAX){ state.stars[n.id] = starOf(n.id)+1; note = __`★${state.stars[n.id]} 승성`; }
    else { state.gold += CREW_REFUND; note = `+${fmt(CREW_REFUND)}💠`; }
    res.push({ n, note });
  }
  syncPosts(); sfx(res.some(r=>["SSR","UR"].includes(r.n.g)) ? "warp" : "coin");
  if(fresh){ storyOnce("firstCrew"); cutTry("join", null, res.find(r=>r.note==="NEW!").n.id); }
  checkMissions(); checkAchievements(); updateHUD(); save(); openCrew(2, res);
}
function recruit(id){
  const n = CREW_MAP[id]; if(state.gold < n.cost || state.crew.includes(id)) return;
  state.gold -= n.cost; state.crew.push(id); state.aff[id] = 0;
  const free = freePostFor(id);        /* 빈 직위가 있으면 바로 임명 (어울리는 자리부터) */
  if(free) state.posts[free.id] = id;
  syncPosts(); sfx("ok");
  toast(__`💞 ${n.name}이(가) 승무원이 되었습니다!${free?__` ${free.ic} ${free.name}(으)로 임명했습니다`:""}`, true);
  storyOnce("firstCrew"); cutTry("join", null, id);
  checkMissions(); checkAchievements(); updateHUD(); save(); openCrew(0);
}
/* 상단·하단 판넬 접기 (이 기기에만 기억) */
function foldUI(which, init){
  const cls = "fold-" + which, on = init != null ? init : !document.body.classList.contains(cls);
  document.body.classList.toggle(cls, on);
  const b = $({ top:"topFold", bot:"botFold", crew:"crewFold" }[which]);
  if(b) b.textContent = which === "top" ? (on ? "▼" : "▲") : (which === "crew" ? "👥 " : "☰ ") + (on ? "▲" : "▼");
  if(init == null){ try{ localStorage.setItem("voyage_" + cls, on ? "1" : ""); }catch(e){} if(typeof sfx === "function") sfx("tap"); }
}
for(const w of ["top", "bot", "crew"]){ let v = ""; try{ v = localStorage.getItem("voyage_fold-" + w) || ""; }catch(e){} if(v) foldUI(w, true); }
/* 화면 하단: 임명된 승무원 얼굴 */
let crewBarKey = "";
function renderCrewBar(){
  const cap = mateCap(), key = state.crew.length ? POSTS.slice(0,cap).map(p=>state.posts[p.id]||"-").join(",") : "";
  if(key === crewBarKey) return; crewBarKey = key;
  $("crewBar").innerHTML = !key ? "" : POSTS.slice(0,cap).map(p=>{ const id = state.posts[p.id];
    return `<div class="cb ${p.id==="vice"?"vice":""}" onclick="${id?`openCrew(0)`:`pickPost('${p.id}')`}" title="${__`${p.name} · 능력 ×${p.mult}`}">
      ${id ? portrait(CREW_MAP[id],38) : `<div class="empty">＋</div>`}<span>${p.ic} ${p.name}</span>${id?`<span class="nm">${CREW_MAP[id].name}</span>`:""}</div>`; }).join("");
}
/* 부기장 보고: 부기장이 있으면 얼굴과 함께 말풍선으로, 없으면 일반 알림으로 */
let speechQ = [], speechT = null;
/* who: 보고할 직위(여럿이면 앞에서부터 자리에 있는 사람). 아무도 없으면 일반 알림 */
function narrate(plain, spoken, gold, who){
  const order = [].concat(who || "vice");
  const post = POSTS.find(p=>order.includes(p.id) && state.posts && state.posts[p.id] && CREW_MAP[state.posts[p.id]])
    && order.map(id=>POSTS.find(p=>p.id===id)).find(p=>p && state.posts[p.id] && CREW_MAP[state.posts[p.id]]);
  if(!post){ if(plain) toast(plain, gold); return; }
  const last = speechQ[speechQ.length-1];
  if(last && last.text === spoken) return;                       /* 같은 보고가 연달아 쌓이지 않게 */
  speechQ.push({ v:CREW_MAP[state.posts[post.id]], post, text:spoken }); if(speechQ.length > 4) speechQ.shift();
  if(!speechT) nextSpeech();
}
/* 항해 관련 보고는 항해장이 맡는다 */
const navSay = (plain, spoken, gold) => narrate(plain, spoken, gold, "nav");
/* 담당 직위의 승무원이 그대로 전하는 짧은 보고 (담당이 없으면 일반 알림) */
const say = (who, msg, gold) => narrate(msg, msg, gold, who);
function nextSpeech(){
  clearTimeout(speechT); speechT = null;
  const el = $("speech"), s = speechQ.shift();
  if(!s){ el.classList.remove("on"); return; }
  el.innerHTML = `${portrait(s.v,60)}<div class="grow"><div class="who">${s.post.ic} ${s.post.name} ${s.v.name}${speechQ.length?` ${__`<span class="more">· 보고 ${speechQ.length}건 더 (눌러서 넘기기)</span>`}`:""}</div><div class="say">${s.text}</div></div>`;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); sfx("blip");
  speechT = setTimeout(nextSpeech, clamp(1800+s.text.replace(/<[^>]+>/g,"").length*60, 2800, 8000));
}
function meetCrew(n){
  sfx("ok");
  openModal(n.rare ? __("🌟 뜻밖의 인연") : __("💞 새로운 인연"), BODY_MAP[dockedAt].name, crewCard(n,"") + `
    <div class="stat" style="margin:0 4px 6px">${n.rare ? __`선착장에서 전설로만 듣던 인물과 마주쳤습니다. 지금이 아니면 다시 만나기 어렵습니다.`
      : __`선착장에서 함께 떠나고 싶다는 사람을 만났습니다. 이 기지를 떠나면 다시 만나기 어렵습니다.`}</div>
    <button class="btn orange wide" ${state.gold<n.cost?"disabled":""} onclick="recruit('${n.id}')">${__`영입한다 · ${fmt(n.cost)}💠`}</button>
    <button class="btn ghost wide" onclick="closeModal()">${__`다음 기회에`}</button>`);
}

/* ══════════════════ 무역 · 투자 · 항로 ══════════════════ */
let tradeTab = 0;
function openTrade(tab){
  if(tab != null) tradeTab = tab;
  if(!dockedAt && tradeTab !== 2) tradeTab = 2;
  const tabs = `<div class="tabs">${[__("거래"),__("기지 투자"),__("자동 항로")].map((t,i)=>`<div class="tab ${i===tradeTab?"on":""}" onclick="openTrade(${i})">${t}</div>`).join("")}</div>`;
  const p = dockedAt && BODY_MAP[dockedAt];
  const body = tradeTab===0 ? tradeHTML(p) : tradeTab===1 ? investHTML(p) : routesHTML(p);
  openModal(__("⚖️ 무역"), p ? `${p.name} · ${ZONES[p.z].name}` : __("항해 중"), tabs+body, "trade");
}
/* ── 무역 규칙 ──
   · 기지는 자기 특산품(산지 품목 2종)만 판다. 기지마다 살 수 있는 물건이 다르다.
   · 특산품은 그 기지에서 싸게 살 수 있지만, 같은 기지(같은 특산품을 파는 기지 포함)에 되팔면 산 값의 절반 이하만 받는다.
   · 수요 품목은 비싸게(×1.6) 사 주고, 그 밖의 품목은 보통 시세로 사 준다. 산지 우주에서 멀수록 값이 오른다. */
const RESELL_RATE = 0.45;                                    /* 특산품 되팔기: 그 기지 판매가의 45% */
const buyPrice = (gid, pid) => Math.max(1, Math.round(goodPrice(pid||dockedAt, gid)*(1-Math.min(.5,bonus().buy))));
function sellPrice(gid, pid){
  pid = pid || dockedAt; const p = BODY_MAP[pid];
  const market = Math.round(goodPrice(pid, gid)*(1+bonus().sell+investLv(pid)*0.02));
  return p.p.includes(gid) ? Math.max(1, Math.min(market, Math.floor(buyPrice(gid, pid)*RESELL_RATE))) : market;
}
/* 발견한 기지 가운데 이 품목을 가장 비싸게 사 주는 곳 (가까운 우주 우선으로 3곳) */
function bestMarkets(gid, n){
  return PORTS.filter(q=>q.id !== dockedAt && q.z <= state.tech.warp && state.found.includes(q.id) && q.d.includes(gid))
    .map(q=>({ q, price:sellPrice(gid, q.id), far:Math.abs(q.z-BODY_MAP[dockedAt].z)*5000 + dist(q.x,q.y,BODY_MAP[dockedAt].x,BODY_MAP[dockedAt].y) }))
    .sort((a,b)=>a.far-b.far).slice(0, n||3);
}
const marketHint = gid => { const m = bestMarkets(gid);
  return m.length ? __`잘 팔리는 곳: ${m.map(x=>`<b>${x.q.name}</b> ${fmt(x.price)}💠`).join(" · ")}` : __("수요지를 아직 발견하지 못했습니다 - 탐사해 보세요"); };
function tradeHTML(p){
  if(!p) return `<div class="stat" style="margin:10px 4px">${__`기지에 정박해야 거래할 수 있습니다.`}</div>`;
  const st = eff(), used = cargoUsed(), room = st.cargo-used;
  let html = `<div class="card"><div class="stat">${p.fact}</div>
    <div class="stat" style="margin-top:6px">${__`📦 화물칸 <b>${used}/${st.cargo}</b> · 보유 <b>${fmt(state.gold)}</b>💠`}</div>
    <div class="bar"><i style="width:${used/st.cargo*100}%"></i></div></div>`;

  /* 1) 구매 - 이 기지의 특산품만 */
  html += `<div class="sec">${__`🛒 구매 - ${p.name}의 특산품`}</div><div class="card">`;
  for(const gid of p.p){
    const g = GOOD_MAP[gid], bp = buyPrice(gid), have = state.cargo[gid]||0, maxBuy = Math.max(0, Math.min(room, Math.floor(state.gold/bp)));
    html += `<div class="goodRow" style="flex-wrap:wrap"><div class="gname">${g.ic} ${g.name}</div>
      <div class="gprice cheap">${fmt(bp)}💠</div><div class="ghave">${__`보유 ${have}`}</div>
      <div class="tbtns"><button class="btn sm" ${maxBuy<1?"disabled":""} onclick="buyGood('${gid}',1)">+1</button>
        <button class="btn sm" ${maxBuy<10?"disabled":""} onclick="buyGood('${gid}',10)">+10</button>
        <button class="btn sm orange" ${maxBuy<1?"disabled":""} onclick="buyGood('${gid}',${maxBuy})">${__`최대 ${maxBuy}`}</button></div>
      <div class="stat" style="width:100%;margin:2px 0 0">${marketHint(gid)}</div></div>`;
  }
  html += `</div>`;

  /* 2) 판매 - 내 화물 */
  const mine = GOODS.filter(g=>state.cargo[g.id]);
  html += `<div class="sec">${__`📦 판매 - 내 화물`}</div><div class="card">`;
  if(!mine.length) html += `<div class="stat">${__`실려 있는 화물이 없습니다.`}</div>`;
  for(const g of mine){
    const have = state.cargo[g.id], sp = sellPrice(g.id), own = p.p.includes(g.id), dem = p.d.includes(g.id);
    const cost = state.cost && state.cost[g.id], diff = cost ? sp-cost : null;
    const tag = own ? `${__`<span class="gtag" style="background:#9aa2a8">특산품 · 반값 이하</span>`}` : dem ? `${__`<span class="gtag" style="background:#d96f32">수요 높음</span>`}` : `${__`<span class="gtag" style="background:#b9b5ac">보통 시세</span>`}`;
    html += `<div class="goodRow" style="flex-wrap:wrap"><div class="gname">${g.ic} ${g.name}</div>
      <div class="gprice ${dem?"expensive":""}" style="${own?"color:#aaa":""}">${fmt(sp)}💠</div><div class="ghave">${__`보유 ${have}`}</div>
      <div class="tbtns"><button class="btn sm ghost" onclick="sellGood('${g.id}',1)">${__`1개`}</button>
        <button class="btn sm ${dem?"orange":""}" onclick="sellGood('${g.id}',${have})">${__`전부 +${fmt(sp*have)}`}</button></div>
      <div class="stat" style="width:100%;margin:2px 0 0">${tag}${cost?` ${__`산 값 ${fmt(cost)}💠 → 개당 <b style="color:${diff>=0?"#3f8f5a":"#c8503c"}">${diff>=0?"+":""}${fmt(diff)}</b>`}`:""}${dem?"":` · ${marketHint(g.id)}`}</div></div>`;
  }
  html += `</div>`;

  /* 3) 이 기지가 비싸게 사 주는 것 */
  html += `<div class="sec">${__`📈 ${p.name}이(가) 비싸게 사 주는 품목`}</div><div class="card">`;
  for(const gid of p.d){ const g = GOOD_MAP[gid];
    const src = PORTS.filter(q=>q.z <= state.tech.warp && state.found.includes(q.id) && q.p.includes(gid)).slice(0,3);
    html += `<div class="goodRow" style="flex-wrap:wrap"><div class="gname">${g.ic} ${g.name}</div><div class="gprice expensive">${fmt(sellPrice(gid))}💠</div>
      <div class="stat" style="width:100%;margin:2px 0 0">${src.length?__`살 수 있는 곳: ${src.map(q=>`<b>${q.name}</b> ${fmt(buyPrice(gid,q.id))}💠`).join(" · ")}`:__("파는 기지를 아직 발견하지 못했습니다")}</div></div>`; }
  html += `</div><div class="stat" style="margin:0 4px">${__`💡 기지마다 파는 물건이 다릅니다. 특산품을 싸게 사서 <b>수요가 높은 다른 기지</b>에 파세요. 산 곳이나 같은 물건을 파는 기지에 되팔면 <b>산 값의 절반도 받지 못합니다.</b>`}</div>`;
  return html;
}
function buyGood(gid, n){
  const st = eff(), bp = buyPrice(gid);
  if(!BODY_MAP[dockedAt].p.includes(gid)) return;
  n = Math.min(n, st.cargo-cargoUsed(), Math.floor(state.gold/bp)); if(n < 1) return;
  const have = state.cargo[gid]||0, before = cargoUsed(); if(!state.cost) state.cost = {};
  state.cost[gid] = Math.round(((state.cost[gid]||0)*have + bp*n)/(have+n));          /* 평균 매입가 (손익 표시용) */
  state.gold -= bp*n; state.cargo[gid] = have+n; sfx("tap");
  updateHUD(); save(); openTrade();
  if(before < st.cargo*0.8 && cargoUsed() >= st.cargo*0.8) cutTry("full");          /* 서비스 컷: 화물칸이 거의 찼을 때 */
}
function sellGood(gid, n){
  n = Math.min(n, state.cargo[gid]||0); if(n < 1) return;
  const unit = sellPrice(gid), paid = state.cost && state.cost[gid];
  const g = unit*n; state.gold += g; state.stats.sell += g;
  state.cargo[gid] -= n; if(!state.cargo[gid]){ delete state.cargo[gid]; if(state.cost) delete state.cost[gid]; }
  sfx("coin"); checkMissions(); checkAchievements(); updateHUD(); save(); openTrade();
  if(paid) cutTry(unit >= paid*1.5 ? "profit" : unit < paid ? "loss" : "none");     /* 서비스 컷: 크게 남기거나 손해 봤을 때 */
}
function investHTML(p){
  if(!p) return `<div class="stat" style="margin:10px 4px">${__`기지에 정박해야 투자할 수 있습니다.`}</div>`;
  const lv = investLv(p.id);
  return `<div class="card" style="text-align:center"><div class="ttl">${__`${p.name} 투자 등급`}</div>
    <div class="stars" style="font-size:20px;margin:8px 0">${"★".repeat(lv)}${"☆".repeat(5-lv)}</div>
    <div class="stat">${__`등급당 보급·수리 할인 <b>10%</b> (★5는 무료) · 판매가 <b>+2%</b> · 이 기지의 항로 수익 <b>+6%</b>`}</div>
    ${lv<5 ? `<button class="btn orange wide" ${state.gold<INVEST_COST[lv]*(p.z+1)?"disabled":""} onclick="investPort()">${__`투자하기 · ${fmt(INVEST_COST[lv]*(p.z+1))}💠`}</button>`
           : `<div class="acc" style="margin-top:10px">${__`🏅 단골 기지 - 최대 등급`}</div>`}</div>`;
}
function investPort(){
  const p = BODY_MAP[dockedAt], lv = investLv(p.id), c = INVEST_COST[lv]*(p.z+1);
  if(lv >= 5 || state.gold < c) return;
  state.gold -= c; state.invest[p.id] = lv+1; sfx("ok");
  say("comm", __`🏗 ${p.name}에 투자했습니다 (★${lv+1})`, true); checkAchievements(); updateHUD(); save(); openTrade(); cutTry("invest");
}
function routeIncome(r){
  const a = BODY_MAP[r.from], b = BODY_MAP[r.to];
  const d = dist(a.x,a.y,b.x,b.y) + Math.abs(a.z-b.z)*200;
  return Math.round(TRADE_SCALE*d*eff(r.ship).cargo*0.018*(1+(a.z+b.z)*0.3)*(1+bonus().route+(investLv(a.id)+investLv(b.id))*0.06));
}
const routePending = r => Math.floor(Math.min(5, state.day-r.last)*routeIncome(r));
function routesHTML(p){
  const total = state.routes.reduce((s,r)=>s+routePending(r),0);
  let html = `<div class="card"><div class="stat">${__`기함이 아닌 함선을 두 기지 사이에 배치하면 매일 수익이 쌓입니다. (최대 5일치 보관)`}</div>
    <button class="btn orange wide" ${total<1?"disabled":""} onclick="collectRoutes()">${__`수익 모두 수령 · +${fmt(total)}💠`}</button></div>`;
  state.routes.forEach((r,i)=>{ html += `<div class="card"><div class="row"><div class="grow">
      <div class="ttl">${BODY_MAP[r.from].name} ⇄ ${BODY_MAP[r.to].name}</div>
      <div class="stat">${__`${SHIP_MAP[r.ship].name} · 하루 <b>${fmt(routeIncome(r))}</b>💠 · 누적 <b class="acc">${fmt(routePending(r))}</b>💠`}</div></div>
      <button class="btn sm ghost" onclick="removeRoute(${i})">${__`철수`}</button></div></div>`; });
  const spare = Object.keys(state.ships).filter(id=>id!==state.flagship && !state.routes.some(r=>r.ship===id));
  const dests = state.visited.filter(id=>id!==dockedAt && !state.routes.some(r=>(r.from===dockedAt&&r.to===id)||(r.to===dockedAt&&r.from===id)));
  html += `<div class="sec">${__`새 항로 개설`}</div>`;
  if(!p) html += `<div class="stat" style="margin:0 4px">${__`기지에 정박하면 그 기지를 기점으로 새 항로를 열 수 있습니다.`}</div>`;
  else if(!spare.length) html += `<div class="stat" style="margin:0 4px">${__`배치할 여분의 함선이 없습니다. 조선소에서 함선을 건조하세요.`}</div>`;
  else if(!dests.length) html += `<div class="stat" style="margin:0 4px">${__`연결할 다른 기지를 먼저 방문하세요.`}</div>`;
  else { const cost = 500*(p.z+1);
    html += `<div class="card"><div class="stat">${__`기점: <b>${p.name}</b> · 개설 비용 <b>${fmt(cost)}</b>💠`}</div>
      <select id="rtDest" style="width:100%;padding:8px;margin-top:8px;border-radius:8px;border:1px solid #e2dfda">${dests.map(id=>`<option value="${id}">${BODY_MAP[id].name} (${ZONES[BODY_MAP[id].z].name})</option>`).join("")}</select>
      <select id="rtShip" style="width:100%;padding:8px;margin-top:6px;border-radius:8px;border:1px solid #e2dfda">${spare.map(id=>`<option value="${id}">${__`${SHIP_MAP[id].name} (적재 ${eff(id).cargo})`}</option>`).join("")}</select>
      <button class="btn wide" ${state.gold<cost?"disabled":""} onclick="addRoute()">${__`항로 개설`}</button></div>`; }
  return html;
}
function addRoute(){
  const p = BODY_MAP[dockedAt], cost = 500*(p.z+1); if(state.gold < cost) return;
  state.gold -= cost; state.routes.push({ from:dockedAt, to:$("rtDest").value, ship:$("rtShip").value, last:state.day });
  sfx("ok"); say("comm", __("🧭 새 자동 무역 항로를 개설했습니다"), true); checkMissions(); updateHUD(); save(); openTrade(); cutTry("route");
}
function removeRoute(i){ const r = state.routes[i]; state.gold += routePending(r); state.routes.splice(i,1); updateHUD(); save(); openTrade(); }
function collectRoutes(){
  let t = 0; for(const r of state.routes){ t += routePending(r); r.last = state.day; }
  state.gold += t; sfx("coin"); say("comm", __`🧭 항로 수익 ${fmt(t)}💠 수령`, true); checkMissions(); updateHUD(); save(); openTrade(); cutTry("income");
}

/* ══════════════════ 연구 ══════════════════ */
function openTech(){
  let html = `<div class="stat" style="margin:0 4px 10px">${__`🔬 연구 데이터는 천체 발견, 첫 입항, 미확인 신호(파란 파동), 전투 승리로 얻습니다.`}</div>`;
  for(const t of TECH){
    const lv = state.tech[t.id], max = lv >= t.max;
    const sub = t.id==="warp" ? (max ? __("모든 우주에 진입 가능") : `${__`다음: <b class="acc">${ZONES[lv+1].name}</b> 진입`}`) : t.desc;
    html += `<div class="card"><div class="row"><div style="font-size:26px;width:34px;text-align:center">${t.ic}</div>
      <div class="grow"><div class="ttl">${t.name} <span class="stat">${t.id==="warp"?`Mk.${lv}`:`Lv.${lv}`} / ${t.max}</span></div>
        <div class="stat">${sub}</div>
        ${max?"":`<div class="stat">${__`비용 <b>${fmt(t.gold[lv])}</b>💠 · <b>${t.sci[lv]}</b>🔬`}</div>`}</div>
      ${max ? `${__`<span class="acc" style="font-size:12px">완료</span>`}` : `<button class="btn sm ${t.id==="warp"?"orange":""}" ${techAffordable(t)?"":"disabled"} onclick="buyTech('${t.id}')">${__`연구`}</button>`}
    </div></div>`;
  }
  openModal(__("🔬 연구소"), `💠 ${fmt(state.gold)} · 🔬 ${fmt(state.sci)}`, html, "tech");
}
function buyTech(id){
  const t = TECH_MAP[id]; if(!techAffordable(t)) return;
  const lv = state.tech[id]; state.gold -= t.gold[lv]; state.sci -= t.sci[lv]; state.tech[id]++;
  if(id === "hull") state.hull += 25;
  if(id === "warp"){ sfx("warp"); say(["sci","eng"], __`🌀 워프 드라이브 Mk.${lv+1} 완성! ${ZONES[lv+1].name}(으)로 가는 길이 열렸습니다`, true); }
  else { sfx("ok"); say(["sci","eng"], __`🔬 ${t.name} 연구 완료 (Lv.${lv+1})`, true); }
  checkMissions(); checkAchievements(); updateHUD(); save(); openTech(); cutTry(id === "warp" ? "warp" : "tech");
}

/* ══════════════════ 토벌 ══════════════════ */
function openDens(){
  const st = eff();
  let html = `<div class="stat" style="margin:0 4px 10px">${__`지도 위 💀 표식을 탭하거나 아래에서 항로를 설정하세요. 현재 전투력 <b>${st.pow}</b> · 선체 <b>${fmt(state.hull)}/${st.hull}</b><br>
    토벌 후에도 ${DEN_RESPAWN}일마다 잔당이 모여들어 다시 소탕할 수 있습니다.`}</div>`;
  for(const d of DENS){
    const open = d.z <= state.tech.warp, done = state.dens[d.id];
    html += `<div class="card ${open?"":"dim"}"><div class="row"><div style="font-size:26px">${done?"⚔️":"💀"}</div>
      <div class="grow"><div class="ttl">${open?d.name:"???"} <span class="stat">${ZONES[d.z].name}</span></div>
        <div class="stat">${__`전투력 <b>${d.pow}</b> · 보상 <b>${fmt(d.gold)}</b>💠 + ${gtag(d.ship)} 함선${done?` ${__`· <b class="acc">토벌 완료</b>${remnantReady(d)?__(" (잔당 출몰)"):""}`}`:""}`}</div></div>
      ${open ? `<button class="btn sm ${done?"ghost":"orange"}" ${done&&!remnantReady(d)?"disabled":""} onclick="closeModal();requestSail(${d.x},${d.y},{den:'${d.id}'})">${__`출격`}</button>` : `<span class="stat">🔒</span>`}
    </div></div>`;
  }
  html += `<div class="stat" style="margin:0 4px">${__`🏆 모든 기지 토벌 시 추가 보상 ${fmt(DEN_CLEAR_GOLD)}💠`}</div>`;
  openModal(__("💀 해적 토벌"), `${Object.keys(state.dens).length}/${DENS.length}`, html, "dens");
}

/* ══════════════════ 임무 · 의뢰 ══════════════════ */
function todayKey(){ const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function ensureQuests(){
  const key = todayKey();
  if(state.quests && state.quests.date === key) return state.quests.list;
  const rnd = mulberry32(hash(key) + state.maxZ*977), list = [];
  const ports = PORTS.filter(p=>p.z <= state.tech.warp && !p.final);
  for(let i=0;i<3;i++){
    const p = ports[Math.floor(rnd()*ports.length)];
    const goods = GOODS.filter(g=>!p.p.includes(g.id) && g.z <= state.tech.warp+1);
    const g = goods[Math.floor(rnd()*goods.length)], qty = 3+Math.floor(rnd()*6)+p.z;
    list.push({ port:p.id, good:g.id, qty, reward: Math.round(g.base*TRADE_SCALE*(1+0.1*Math.abs(p.z-g.z))*qty*2.4 + 150*(p.z+1)*REWARD_SCALE), done:false });
  }
  state.quests = { date:key, list }; return list;
}
function openQuests(){
  let html = `<div class="sec">${__`주 임무 ${Math.min(state.mission,MISSIONS.length)}/${MISSIONS.length}`}</div>`;
  MISSIONS.forEach((m,i)=>{
    if(i < state.mission-1 || i > state.mission+2) return;
    const done = i < state.mission, cur = i === state.mission;
    html += `<div class="card ${done||!cur?"dim":""}" ${cur?'style="border-color:#d96f32"':""}><div class="row"><div style="font-size:20px">${done?"✅":cur?"🎯":"▫️"}</div>
      <div class="grow"><div class="ttl">${m.t}</div><div class="stat">${__`보상 <b>${fmt(m.gold)}</b>💠${m.sci?` · <b>${m.sci}</b>🔬`:""}`}</div></div></div></div>`;
  });
  html += `<div class="sec">${__`오늘의 납품 의뢰 (매일 갱신)`}</div>`;
  for(const [i,q] of ensureQuests().entries()){
    const p = BODY_MAP[q.port], g = GOOD_MAP[q.good], have = state.cargo[q.good]||0, here = dockedAt === q.port;
    html += `<div class="card ${q.done?"dim":""}"><div class="row"><div style="font-size:22px">${g.ic}</div>
      <div class="grow"><div class="ttl">${__`${state.found.includes(p.id)?p.name:__("미발견 기지")}에 ${g.name} ${q.qty}개 납품`}</div>
        <div class="stat">${__`${ZONES[p.z].name} · 보유 ${have}/${q.qty} · 보상 <b class="acc">${fmt(q.reward)}</b>💠`}</div></div>
      ${q.done ? `${__`<span class="acc" style="font-size:12px">완료</span>`}` : `<button class="btn sm orange" ${here&&have>=q.qty?"":"disabled"} onclick="deliverQuest(${i})">${__`납품`}</button>`}
    </div></div>`;
  }
  openModal(__("📜 임무"), "", html, "quests");
}
function deliverQuest(i){
  const q = ensureQuests()[i]; if(q.done || dockedAt !== q.port || (state.cargo[q.good]||0) < q.qty) return;
  state.cargo[q.good] -= q.qty; if(!state.cargo[q.good]) delete state.cargo[q.good];
  q.done = true; state.gold += q.reward; state.stats.quests++; const n = addSci(4*(BODY_MAP[q.port].z+1));
  sfx("coin"); say("comm", __`📜 납품 완료! +${fmt(q.reward)}💠 🔬+${n}`, true); adDouble(q.reward, 0);
  checkMissions(); checkAchievements(); updateHUD(); save(); openQuests();
}

/* ══════════════════ 도감 · 업적 ══════════════════ */
let codexTab = 0;
function openCodex(tab){
  if(tab != null) codexTab = tab;
  let html = `<div class="tabs">${[__("우주 도감"),__("업적·칭호"),__("항해 일지"),__("인연")].map((t,i)=>`<div class="tab ${i===codexTab?"on":""}" onclick="openCodex(${i})">${t}</div>`).join("")}</div>`;
  if(codexTab === 3){ html += bondsHTML() + fateHTML(); }
  else if(codexTab === 2){
    const seen = storyState().seen, n = SCENE_ORDER.filter(id=>seen[id]).length;
    html += `<div class="stat" style="margin:0 4px 10px">${__`지나온 이야기를 다시 볼 수 있습니다. (${n}/${SCENE_ORDER.length}) 다시 보기에서는 선택지 보상이 주어지지 않습니다.`}</div>`;
    for(const id of SCENE_ORDER){ const sc = SCENES[id], ok = seen[id];
      html += `<div class="card ${ok?"":"dim"}"><div class="row"><div style="font-size:20px">${ok?"📓":"🔒"}</div>
        <div class="grow"><div class="ttl">${ok?sc.title:"???"}</div><div class="stat">${ok?sc.lines.find(l=>l.t).t.replace(/<[^>]+>/g,"").slice(0,46)+"…":__("아직 겪지 않은 이야기입니다.")}</div></div>
        ${ok?`<button class="btn sm" onclick="storyReplay('${id}')">${__`다시 보기`}</button>`:""}</div></div>`; }
  } else if(codexTab === 0){
    ZONES.forEach((z,zi)=>{
      const list = BODIES.filter(b=>b.z===zi), n = list.filter(b=>state.found.includes(b.id)).length;
      html += `<div class="sec">${__`${z.ic} ${z.name} · 축척 ${z.scale} · ${n}/${list.length}`}</div>`;
      if(zi > state.tech.warp){ html += `<div class="card dim"><div class="stat">${__`🔒 워프 드라이브 Mk.${zi} 연구 후 탐사할 수 있습니다.`}</div></div>`; return; }
      for(const b of list){
        const f = state.found.includes(b.id);
        html += `<div class="card ${f?"":"dim"}"><div class="ttl">${f?(b.lm?"🔭 ":"⚓ ")+b.name:"??? "}${f&&state.visited.includes(b.id)?__(' <span class="stat">방문함</span>'):""}</div>
          <div class="stat">${f?b.fact:__("아직 발견하지 못한 천체입니다. 가까이 다가가 탐지하세요.")}</div></div>`;
      }
    });
  } else {
    html += `<div class="stat" style="margin:0 4px 10px">${__`달성한 업적의 칭호를 장착하면 효과가 적용됩니다. (${state.titles.length}/${ACHV.length})`}</div>`;
    for(const a of ACHV){
      const got = state.titles.includes(a.id), eq = state.title === a.id, pr = a.prog ? a.prog(state) : null;
      html += `<div class="card ${got?"":"dim"}"><div class="row"><div style="font-size:22px">${got?"🏅":"▫️"}</div>
        <div class="grow"><div class="ttl">「${a.name}」</div><div class="stat">${a.desc}${pr&&!got?` (${fmt(pr[0])}/${fmt(pr[1])})`:""}</div>
          <div class="stat acc">${__`${bonusText(a.bonus)||__("칭호")} · 보상 ${fmt(a.gold)}💠`}</div></div>
        ${got ? `<button class="btn sm ${eq?"orange":"ghost"}" onclick="equipTitle('${a.id}')">${eq?__("장착 중"):__("장착")}</button>` : ""}</div></div>`;
    }
    html += `<button class="btn ghost wide" onclick="resetGame()">${__`⚠️ 처음부터 다시 시작`}</button>`;
  }
  openModal(__("📖 도감"), __`천체 ${state.found.length}/${BODIES.length} · 떠돌이 별 ${state.starsFound.length}/${wstars.length}`, html, "codex");
}
function equipTitle(id){ state.title = state.title===id ? null : id; updateHUD(); save(); openCodex(); }
function resetGame(){
  if(!confirm(__("모든 진행 상황을 지우고 처음부터 다시 시작할까요?"))) return;
  localStorage.removeItem("voyage_space_save"); location.reload();
}

/* ══════════════════ 상점 (크레딧 충전) ══════════════════
   현재는 테스트 모드: 결제 모듈이 없어 구매 즉시 지급된다.
   실제 결제를 붙일 때는 requestPayment() 한 곳만 바꾸면 된다. */
const SHOP_PACKS = [
  { id:"p1", name:__("크레딧 주머니"),   won:1200,   gold:1000,   bonus:0,   ic:"💠" },
  { id:"p2", name:__("크레딧 상자"),     won:5900,   gold:5000,   bonus:.10, ic:"📦" },
  { id:"p3", name:__("크레딧 금고"),     won:12000,  gold:10000,  bonus:.20, ic:"🧰" },
  { id:"p4", name:__("크레딧 화물칸"),   won:37000,  gold:30000,  bonus:.35, ic:"🚚", tag:__("인기") },
  { id:"p5", name:__("크레딧 수송선"),   won:65000,  gold:50000,  bonus:.50, ic:"🚀" },
  { id:"p6", name:__("크레딧 은하 금고"),won:119000, gold:100000, bonus:.80, ic:"🌌", tag:__("최고 효율") },
];
/* 초보 지원 패키지: 한 번씩만 살 수 있다 */
const STARTER_PACKS = [
  { id:"s1", name:__("초보 함선 패키지"),   won:5000,  grant:{ ship:"SR" },  ic:"🚀" },
  { id:"s2", name:__("초보 승무원 패키지"), won:10000, grant:{ crew:"SSR" }, ic:"💞" },
];
/* 보석 묶음: 크레딧 묶음과 같은 규칙(묶음 보너스 · VIP 보너스 · 첫 구매 2배 · VIP 포인트 적립) */
const GEM_PACKS = [
  { id:"g1", name:__("보석 주머니"),   won:1200,  gems:10,   bonus:0,   ic:"💎" },
  { id:"g2", name:__("보석 상자"),     won:5900,  gems:50,   bonus:.10, ic:"👝" },
  { id:"g3", name:__("보석 금고"),     won:12000, gems:100,  bonus:.20, ic:"💍" },
  { id:"g4", name:__("보석 화물칸"),   won:37000, gems:300,  bonus:.35, ic:"👑", tag:__("인기") },
  { id:"g5", name:__("보석 은하 금고"),won:99000, gems:800,  bonus:.60, ic:"🌠", tag:__("최고 효율") },
];
/* 누적 결제 등급(VIP): 충전 보너스가 영구히 늘고, 등급 달성 시 1회 보상 */
const VIP = [
  { need:0,       extra:0,    pay:0,     reward:null },
  { need:5000,    extra:.05,  pay:500,   reward:{ sci:50 } },
  { need:30000,   extra:.10,  pay:1000,  reward:{ sci:150, crew:"SR" } },
  { need:100000,  extra:.15,  pay:2000,  reward:{ sci:300, gold:20000 } },
  { need:300000,  extra:.20,  pay:4000,  reward:{ sci:600, ship:"SR" } },
  { need:600000,  extra:.30,  pay:7000,  reward:{ sci:1200, crew:"SSR" } },
  { need:1000000, extra:.40,  pay:11000, reward:{ sci:2000, gold:100000 } },
  { need:1500000, extra:.50,  pay:16000, reward:{ sci:3000, ship:"SSR" } },
  { need:2200000, extra:.60,  pay:22000, reward:{ sci:4000, gold:300000 } },
  { need:3000000, extra:.75,  pay:30000, reward:{ sci:6000, crew:"UR" } },
  { need:5000000, extra:1.00, pay:50000, reward:{ sci:10000, gold:1000000, ship:"UR" } },
];
/* VIP 일일 지급: 기기 날짜가 바뀌면 등급에 따른 크레딧을 하루 한 번 준다 */
const today = () => { const t = new Date(); return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`; };
let vipChk = 0;
function vipTick(){
  const now = Date.now(); if(now-vipChk < 2000) return; vipChk = now;
  const lv = vipLevel(), d = today(), s = state.shop;
  if(!lv || s.vipDate === d) return;
  const n = VIP[lv].pay; s.vipDate = d;
  state.gold += n; sfx("coin"); say("vice", __`👑 VIP ${lv} 일일 지급 +${fmt(n)}💠`, true); updateHUD(); save();
}
const won = n => n.toLocaleString()+__("원");
const vipPt = n => fmt(n)+"P";          /* VIP 포인트: 결제한 금액만큼 쌓인다 */
function vipLevel(){ let lv = 0; for(let i=0;i<VIP.length;i++) if(state.shop.paid >= VIP[i].need) lv = i; return lv; }
function packGold(p){          /* 기본 + 묶음 보너스 + VIP 보너스, 첫 구매는 기본 수량 2배 */
  const first = !state.shop.count[p.id];
  const base = p.gold || p.gems;
  return Math.round(base*(1+p.bonus+VIP[vipLevel()].extra) + (first ? base : 0));
}
/* 등급이 정해진 승무원 1명 지급: 없으면 합류, 있으면 ★ 승성, ★5면 크레딧으로 돌려준다 */
function grantCrew(g){
  const pool = CREW.filter(n=>n.g===g), lack = pool.filter(n=>!state.crew.includes(n.id)), n = (lack.length ? lack : pool)[Math.floor(Math.random()*(lack.length ? lack : pool).length)];
  if(!state.stars) state.stars = {};
  if(!state.crew.includes(n.id)){ state.crew.push(n.id); state.aff[n.id] = 0;
    const free = freePostFor(n.id); if(free) state.posts[free.id] = n.id; syncPosts();
    cutTry("join", null, n.id); return __`💞 새 승무원 「${n.name}」 합류!`; }
  if(starOf(n.id) < STAR_MAX){ state.stars[n.id] = starOf(n.id)+1; return __`💞 「${n.name}」 ★${state.stars[n.id]} 승성!`; }
  state.gold += CREW_REFUND; return __`💞 「${n.name}」 중복 → +${fmt(CREW_REFUND)}💠`;
}
function rewardText(r){
  const t = []; if(r.gold) t.push(`${fmt(r.gold)}💠`); if(r.sci) t.push(`🔬${r.sci}`); if(r.ship) t.push(__`${r.ship} 등급 함선 1척`); if(r.crew) t.push(__`${r.crew} 등급 승무원 1명`);
  return t.join(" + ");
}
/* ▼ 결제 연동 지점: 실제 결제 모듈을 붙이면 결제 성공 콜백에서 onPaid()를 호출하도록 바꾼다.
     (실서비스에서는 서버에서 영수증을 검증한 뒤 지급해야 한다) */
function requestPayment(pack, onPaid){ onPaid(); }
function buyPack(id){
  const p = SHOP_PACKS.find(x=>x.id===id) || GEM_PACKS.find(x=>x.id===id) || AD_PACKS.find(x=>x.id===id) || STARTER_PACKS.find(x=>x.id===id); if(!p) return;
  if(p.grant && state.shop.count[p.id]) return;                       /* 초보 지원은 한 번만 */
  if(p.noAds === Infinity && state.shop.noAds === "forever") return;
  requestPayment(p, ()=>{
    const before = vipLevel(), g = p.noAds || p.grant ? 0 : packGold(p);
    const got = p.grant ? (p.grant.ship ? grantShip(p.grant.ship) : grantCrew(p.grant.crew)) : "";
    if(p.grant){} else if(p.noAds) adFreeGrant(p.noAds); else if(p.gems) state.gems += g; else state.gold += g;
    state.shop.paid += p.won; state.shop.count[p.id] = (state.shop.count[p.id]||0)+1;
    sfx(p.gems ? "gem" : "coin"); toast(p.grant ? __`🛒 ${p.name} 구매 완료! (테스트 모드: 실제 결제 없음)` + ` ${got}` : p.noAds ? __`🛒 ${p.name} 구매 완료! (테스트 모드: 실제 결제 없음)` : p.gems ? __`🛒 ${p.name} 구매 완료! 💎+${fmt(g)} (테스트 모드: 실제 결제 없음)` : __`🛒 ${p.name} 구매 완료! +${fmt(g)}💠 (테스트 모드: 실제 결제 없음)`, true);
    for(let lv=before+1; lv<=vipLevel(); lv++){
      const r = VIP[lv].reward; let msg = __`👑 VIP ${lv} 달성!`;
      if(r){ if(r.gold) state.gold += r.gold; if(r.sci) state.sci += r.sci;
        msg += __` 보상: ${rewardText(r)}`; if(r.ship) msg += ` - ${grantShip(r.ship)}`; if(r.crew) msg += ` - ${grantCrew(r.crew)}`; }
      sfx("warp"); toast(msg, true);
    }
    checkMissions(); checkAchievements(); updateHUD(); save(); openShop();
  });
}
function openShop(){
  const lv = vipLevel(), next = VIP[lv+1], paid = state.shop.paid;
  let html = `<div class="card" style="border-color:#e0a63f">
    <div class="row"><div style="font-size:26px">👑</div><div class="grow">
      <div class="ttl">${__`VIP ${lv} <span class="stat">포인트 ${vipPt(paid)}</span>`}</div>
      <div class="stat">${__`충전 보너스 <b class="acc">+${Math.round(VIP[lv].extra*100)}%</b> 적용 중${next?` ${__`· 다음 등급까지 <b>${vipPt(next.need-paid)}</b>`}`:__(" · 최고 등급")}`}</div>
      ${lv ? `<div class="stat">${__`매일 <b class="acc">${fmt(VIP[lv].pay)}💠</b> 지급 - 날짜가 바뀌면 받습니다`}</div>` : ""}
      <div class="bar"><i style="width:${next?clamp((paid-VIP[lv].need)/(next.need-VIP[lv].need)*100,0,100):100}%;background:#e0a63f"></i></div></div></div></div>
    <div class="stat" style="margin:0 4px 10px">${__`🧪 <b>테스트 모드</b> - 아직 결제 모듈이 없어 버튼을 누르면 결제 없이 바로 지급됩니다.`}</div>`;
  html += `<div class="sec">${__`🎁 초보 지원 패키지 - 한 번씩만 살 수 있습니다`}</div>`;
  for(const p of STARTER_PACKS){ const done = !!state.shop.count[p.id];
    html += `<div class="card" style="border-color:#8e6fd8"><div class="row"><div style="font-size:28px;width:38px;text-align:center">${p.ic}</div>
      <div class="grow"><div class="ttl">${p.name}</div><div style="font-size:14px;font-weight:800;color:#8e6fd8;margin-top:2px">${rewardText(p.grant)}</div></div>
      <button class="btn orange" ${done?"disabled":""} onclick="buyPack('${p.id}')">${done ? __("구매 완료") : won(p.won)}</button></div></div>`; }
  html += adShopHTML() + adFreeHTML();
  for(const p of [...SHOP_PACKS, ...GEM_PACKS]){
    if(p === GEM_PACKS[0]) html += `<div class="sec">${__`💎 보석 충전 - 보유 ${fmt(state.gems)}개`}</div>`;
    const first = !state.shop.count[p.id], g = packGold(p), base = p.gold || p.gems, pct = Math.round((p.bonus+VIP[lv].extra)*100);
    html += `<div class="card"><div class="row"><div style="font-size:28px;width:38px;text-align:center">${p.ic}</div>
      <div class="grow"><div class="ttl">${p.name}${p.tag?` <span class="gtag" style="background:#d96f32">${p.tag}</span>`:""}</div>
        <div style="font-size:15px;font-weight:800;color:${p.gems?"#8e6fd8":"#d96f32"};margin-top:2px">${p.gems?"💎":"💠"} ${fmt(g)}</div>
        <div class="stat">${__`기본 ${fmt(base)}${pct?` ${__`· 보너스 <b>+${pct}%</b>`}`:""}${first?` ${__`· <b class="acc">첫 구매 2배 (+${fmt(base)})</b>`}`:""}`}</div></div>
      <button class="btn orange" onclick="buyPack('${p.id}')">${won(p.won)}</button></div></div>`;
  }
  html += `<div class="sec">${__`💎 보석 교환소 - 보유 ${fmt(state.gems)}개 (떠돌이 별 조사·외계 생명체 격퇴로 획득)`}</div><div class="card">`;
  for(const g of GEM_SHOP) html += `<div class="goodRow"><div style="font-size:20px;width:30px;text-align:center">${g.ic}</div>
      <div class="grow"><div style="font-size:13px;font-weight:700">${g.name}</div><div class="stat" style="margin:0">${g.desc}</div></div>
      <button class="btn sm" ${state.gems<g.cost?"disabled":""} onclick="gemBuy('${g.id}')">💎 ${g.cost}</button></div>`;
  html += `</div>`;
  html += `<div class="sec">${__`VIP 등급 혜택 - 많이 충전할수록 커집니다`}</div><div class="card">`;
  VIP.forEach((v,i)=>{ if(!i) return;
    html += `<div class="goodRow" style="${i<=lv?"":"opacity:.6"}"><div style="width:68px;flex:none;white-space:nowrap;font-weight:800;font-size:13px">${i<=lv?"✅":"👑"} VIP ${i}</div>
      <div class="grow"><div class="stat" style="margin:0">${__`누적 <b>${vipPt(v.need)}</b> · 충전 보너스 <b>+${Math.round(v.extra*100)}%</b> · 매일 <b>${fmt(v.pay)}💠</b>`}</div>
      <div class="stat" style="margin:0">${__`달성 보상: <b class="acc">${rewardText(v.reward)}</b>`}</div></div></div>`; });
  html += `</div><div class="stat" style="margin:0 4px">${__`묶음이 클수록 보너스가 크고, 묶음마다 첫 구매는 기본 수량을 한 번 더 드립니다.`}</div>`;
  openModal(__("🛒 상점"), __`보유 ${fmt(state.gold)}💠` + ` · 💎 ${fmt(state.gems)}`, html, "shop");
}

/* ── 보석 교환소 ── */
const GEM_SHOP = [
  { id:"supply", cost:2, ic:"⛽", name:__("긴급 보급"),     desc:__("어디서든 연료·산소를 가득 채운다") },
  { id:"repair", cost:3, ic:"🛡", name:__("긴급 수리"),     desc:__("어디서든 선체를 완전히 수리한다") },
  { id:"boost",  cost:4, ic:"🌠", name:__("중력 가속 장치"), desc:__("5일간 항해 속도 +40%") },
  { id:"sci",    cost:5, ic:"🔬", name:__("연구 자료 묶음"), desc:__("연구 데이터 +60") },
  { id:"ship",   cost:30, ic:"🚀", name:__("프리미엄 건조"),  desc:__("희귀(SR) 이상 함선 확정 (SSR 17% · UR 3%)") },
];
function gemBuy(id){
  const g = GEM_SHOP.find(x=>x.id===id); if(!g || state.gems < g.cost) return;
  state.gems -= g.cost; const st = eff();
  if(id === "supply"){ state.fuel = st.sup; state.o2 = st.sup; say("eng", __("⛽ 긴급 보급 완료 - 연료와 산소가 가득 찼습니다"), true); }
  else if(id === "repair"){ state.hull = st.hull; say("eng", __("🛡 긴급 수리 완료"), true); }
  else if(id === "boost"){ state.buff = { t:"boost", until:state.day+5 }; say("eng", __("🌠 중력 가속 장치 가동! 5일간 가속"), true); }
  else if(id === "sci"){ state.sci += 60; say("sci", __("🔬 연구 데이터 +60"), true); }
  else { const r = Math.random(); toast(__("💎 프리미엄 건조 - ")+grantShip(r<0.03?"UR":r<0.20?"SSR":"SR"), true); }
  sfx("ok"); checkMissions(); checkAchievements(); updateHUD(); save(); openShop();
}

/* ══════════════════ 승무원 상세: 큰 초상화 + 세부 능력 ══════════════════ */
const BONUS_INFO = {
  sell:["⚖️",__("판매가"),__("기지에 화물을 팔 때 받는 값이 오른다")],       buy:["🛒",__("구매가 할인"),__("기지에서 화물을 살 때 값이 내려간다")],
  route:["🧭",__("항로 수익"),__("자동 무역 항로에서 쌓이는 수익이 는다")],  luck:["🍀",__("행운"),__("좋은 사건·치명타·도주 성공 확률이 오른다")],
  salv:["📦",__("표류물 보상"),__("표류물과 화물 회수 보상이 는다")],        fuel:["⛽",__("연료·산소 절약"),__("항해 중 연료와 산소 소모가 준다")],
  speed:["💨",__("항해 속도"),__("함선이 더 빠르게 움직인다")],              atk:["💥",__("전투력"),__("포격 피해가 커지고 전투 승률이 오른다")],
  sci:["🔬",__("연구 데이터"),__("발견·조사로 얻는 연구 데이터가 는다")],
};
const bonusVal = (k, v) => (k==="luck"||k==="atk") ? `+${Math.round(v*10)/10}` : `${k==="buy"||k==="fuel"?"−":"+"}${Math.round(v*1000)/10}%`;
const tapFace = (n, size) => `<div style="cursor:pointer;flex:none" title="${__`크게 보기`}" onclick="event.stopPropagation();openMember('${n.id}')">${portrait(n,size)}${gradeRow(n, size>=56?10.5:9.5)}</div>`;
let memberId = null;
function openMember(id){
  const n = CREW_MAP[id]; if(!n) return; memberId = id;
  const owned = state.crew.includes(id), aff = Math.floor(state.aff[id]||0), post = owned && postOf(id);
  const affA = 1 + (owned ? (state.aff[id]||0) : 0)/200, starM = owned ? starMult(id) : 1, affM = affA*starM, postM = post ? post.mult : IDLE_MULT, home = n.port && BODY_MAP[n.port];
  const canHire = !owned && crewHere().some(x=>x.id===id);
  let html = `<div class="card" style="padding:0;overflow:hidden;border-color:${n.rare?"#e0a63f":"#d96f32"}">
      <div style="background:radial-gradient(ellipse at 50% 40%, #fff6ea 0%, #f3e6d6 60%, #e6d3bd 100%);padding:22px 0 16px;text-align:center">
        <div id="chatFace" onclick="chatNext()" title="${__`눌러서 이야기 듣기`}" style="display:inline-block;cursor:pointer;transition:transform .12s;border-radius:50%;padding:5px;background:#fff;box-shadow:0 6px 22px rgba(120,80,40,.25)">${portrait(n, 230)}</div>${gradeRow(n, 22)}
        <div onclick="chatNext()" style="position:relative;cursor:pointer;margin:12px 18px 0;padding:11px 14px;background:#fff;border:1px solid #ecd9c4;border-radius:14px;box-shadow:0 3px 10px rgba(120,80,40,.12);font-size:13.5px;line-height:1.6;color:#4a3a2c;min-height:44px">
          <span style="position:absolute;left:50%;top:-7px;width:12px;height:12px;margin-left:-6px;background:#fff;border-left:1px solid #ecd9c4;border-top:1px solid #ecd9c4;transform:rotate(45deg)"></span>
          <span id="chatSay">${chatStart(id)}</span></div>
        <div class="stat" style="margin-top:6px;font-size:11px;opacity:.75">${__`👆 얼굴을 누르면 다른 이야기를 합니다`}</div></div>
      <div style="padding:12px 16px 14px;text-align:center">
        <div style="font-size:19px;font-weight:800">${n.rare?"🌟 ":""}${n.name}${owned?starTag(id):""}</div>
        <div style="color:#b0743f;font-weight:700;font-size:12.5px;margin-top:2px">${n.title}${n.rare?__(" · 떠도는 전설의 승무원"):""}</div>
        <div class="stat" style="font-size:12.5px;line-height:1.7;margin-top:8px">${n.desc}</div>
        <div class="stat" style="margin-top:4px">${__`추천 직위 <b style="color:#3fa66b">${recPost(id).ic} ${recPost(id).name}</b>`}</div>
        <div class="stat" style="margin-top:6px">${owned ? (post ? `${__`현재 직위 <b class="acc">${post.ic} ${post.name}</b>`}` : `${__`현재 <b>대기 중</b> - 직위에 임명하면 능력이 커집니다`}`)
          : `${__`📍 기지 입항 시 드물게 만남 · 영입 비용 <b>${fmt(n.cost)}</b>💠`}`}</div></div></div>`;
  if(owned){
    html += `<div class="sec">${__`💞 호감도`}</div><div class="card">
      <div class="row"><div class="grow"><div class="ttl">${affName(aff)} <span class="stat">${aff}/100</span></div>
        <div class="bar"><i style="width:${aff}%"></i></div>
        <div class="stat">${__`호감도는 직위에 임명한 채 항해하면 오르고, 능력을 최대 <b>+50%</b>까지 키웁니다 (지금 <b>×${affA.toFixed(2)}</b>)`}</div></div></div>
      <div class="stat" style="margin-top:8px;font-style:italic;color:${state.affDone[id]?"#b0743f":"#aaa"}">${state.affDone[id] ? `“${n.talk}”` : __("🔒 호감도 80에 이르면 특별한 이야기와 선물이 열립니다")}</div></div>`;
  }
  if(owned) html += `<div class="sec">${__`⭐ 승성`}</div><div class="card"><div class="ttl" style="color:#e0a63f">${"★".repeat(starOf(id))}${"☆".repeat(STAR_MAX-starOf(id))}</div>
      <div class="stat">${__`승성 ★마다 능력이 10%씩 오릅니다 (지금 <b>×${starM.toFixed(1)}</b>). 승무원 뽑기에서 같은 승무원이 나오면 오릅니다.`}</div></div>`;
  html += cutsHTML(id);
  html += `<div class="sec">${__`세부 능력${owned?__` - 지금 적용 중: 기본 × 호감도 ${affA.toFixed(2)} × ${post?`${post.name} ${post.mult}`:__`대기 ${IDLE_MULT}`}`:__(" (기본 수치)")}`}</div><div class="card">`;
  for(const k in n.bonus){
    const [ic, name, desc] = BONUS_INFO[k], base = n.bonus[k], now = base*affM*postM;
    html += `<div style="margin-bottom:10px"><div class="row" style="gap:6px"><div style="width:22px;text-align:center">${ic}</div>
        <div class="grow"><div style="font-size:13px;font-weight:700">${name}</div><div class="stat" style="margin:0">${desc}</div></div>
        <div style="text-align:right"><div style="font-size:15px;font-weight:800;color:#d96f32">${bonusVal(k, owned?now:base)}</div>
          ${owned?`<div class="stat" style="margin:0">${__`기본 ${bonusVal(k, base)}`}</div>`:""}</div></div></div>`;
  }
  html += `</div><div class="sec">${__`직위별 능력 - 높은 직위일수록 크게 발휘됩니다`}</div><div class="card">`;
  const cap = mateCap();
  POSTS.forEach((p,i)=>{ const cur = post && post.id === p.id, m = affM*p.mult;
    html += `<div class="goodRow" style="${i>=cap?"opacity:.45":""}${cur?";background:#fff4ec;border-radius:8px":""}">
      <div style="width:76px;font-size:12.5px;font-weight:700">${p.ic} ${p.name}</div><div style="width:42px" class="stat">×${p.mult}</div>
      <div class="grow stat acc" style="margin:0">${bonusText(scaled(n.bonus, m))}</div>
      ${cur ? `${__`<span class="acc" style="font-size:11px">현재</span>`}` : owned && i<cap ? `<button class="btn sm" onclick="assignPost('${p.id}','${id}')">${__`임명`}</button>` : i>=cap ? `<span class="stat">🔒</span>` : ""}</div>`; });
  html += `<div class="goodRow"><div style="width:76px;font-size:12.5px;font-weight:700">${__`💤 대기`}</div><div style="width:42px" class="stat">×${IDLE_MULT}</div>
      <div class="grow stat" style="margin:0">${bonusText(scaled(n.bonus, affM*IDLE_MULT))}</div>${owned&&!post?`${__`<span class="acc" style="font-size:11px">현재</span>`}`:""}</div></div>`;
  if(canHire) html += `<button class="btn orange wide" ${state.gold<n.cost?"disabled":""} onclick="recruit('${id}')">${__`영입한다 · ${fmt(n.cost)}💠`}</button>`;
  html += `<button class="btn ghost wide" onclick="openCrew(${owned?0:1})">${__`← 승무원 창으로`}</button>`;
  openModal(__("💞 승무원 상세"), n.name, html, "member");
  $("mBody").scrollTop = 0;
}

/* ══════════════════ 소리 설정 ══════════════════ */
function openAudio(){
  const v = state.vol, cur = AU.track ? `${AU.track.d.title} (${AU.track.d.mood})` : __("아직 재생 전 (화면을 한 번 누르면 시작)");
  const slider = (k, label, ic) => `<div style="margin-bottom:14px"><div class="row"><div class="grow ttl">${ic} ${label}</div><div class="acc" id="vol_${k}">${Math.round(v[k]*100)}%</div></div>
      <input type="range" min="0" max="100" value="${Math.round(v[k]*100)}" style="width:100%;accent-color:#d96f32;margin-top:6px"
        oninput="setVol('${k}', this.value/100)" onchange="save()${k==="sfx"?";sfx('coin')":""}"></div>`;
  openModal(__("🔊 소리·화면 효과 설정"), "", `<div class="card">
      <div class="row" style="margin-bottom:14px"><div class="grow"><div class="ttl">${__`전체 소리`}</div><div class="stat">${__`지금 흐르는 곡: <b>${cur}</b>`}</div></div>
        <button class="btn ${state.mute?"ghost":"orange"}" onclick="toggleMute();openAudio()">${state.mute?__("🔇 꺼짐"):__("🔊 켜짐")}</button></div>
      ${slider("bgm",__("배경 음악"),"🎵")}${slider("sfx",__("효과음"),"🔔")}
      <div class="stat">${__`배경 음악은 지금 있는 우주에 따라 바뀌고, 전투 중에는 긴박한 곡으로 넘어갑니다. 모든 소리는 실시간으로 합성되어 음악 파일이 없습니다.`}</div></div>
    <div class="sec">🌐 Language</div><div class="card" style="display:flex;flex-wrap:wrap;gap:6px">${langButtons()}</div>
    <div class="sec">${__`화면 효과`}</div><div class="card">
      <div style="margin-bottom:14px"><div class="row"><div class="grow ttl">${__`📳 화면 흔들림 세기`}</div><div class="acc" id="fx_shake">${Math.round(state.fx.shake*100)}%</div></div>
        <input type="range" min="0" max="100" value="${Math.round(state.fx.shake*100)}" style="width:100%;accent-color:#d96f32;margin-top:6px"
          oninput="state.fx.shake=this.value/100;$('fx_shake').textContent=this.value+'%'" onchange="save();FX.trauma=0.7"></div>
      <div class="row"><div class="grow"><div class="ttl">${__`⚡ 번쩍임`}</div><div class="stat">${__`피격·워프 때 화면이 번쩍입니다. 눈이 피로하면 줄이세요.`}</div></div>
        <button class="btn ${state.fx.flash?"orange":"ghost"}" onclick="state.fx.flash=!state.fx.flash;save();openAudio()">${state.fx.flash?__("보통"):__("약하게")}</button></div></div>
    <div class="sec">${__`효과음 들어보기`}</div><div class="card" style="display:flex;flex-wrap:wrap;gap:6px">${
      [["tap",__("탭")],["depart",__("출항")],["dock",__("입항")],["discover",__("발견")],["coin",__("크레딧")],["gem",__("보석")],["fanfare",__("임무 완료")],["warp",__("워프")],
       ["alarm",__("경보")],["shot",__("포격")],["hit",__("피격")],["explode",__("격파")],["bad",__("경고")],["over",__("조난")]]
      .map(([k,n])=>`<button class="btn sm ghost" onclick="sfx('${k}')">${n}</button>`).join("")}</div>`, "audio");
}
function setVol(k, val){ state.vol[k] = val; $("vol_"+k).textContent = Math.round(val*100)+"%"; auApplyVolume(); }
/* VIP 일일 지급은 정박 중이거나 멈춰 있어도 확인한다 */
setInterval(()=>{ if(typeof state !== "undefined" && state && state.shop && !state.intro && $("gameover").style.display !== "flex") vipTick(); }, 5000);
