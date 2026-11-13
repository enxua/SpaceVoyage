"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 구글 Play 게임즈 연동 · 클라우드 저장 ══════════════════
   안드로이드 앱에서만 동작한다 (앱 안의 PlayGamesPlugin.java). 웹에서는 설정 창에 안내만 보인다.
   · 앱을 켜면 Play 게임즈가 자동으로 로그인을 시도한다. 로그인돼 있으면 클라우드 기록과 이 기기 기록을 견준다.
   · 어느 쪽을 쓸지: 이 기기에 진행이 없으면 클라우드를 그대로 불러온다. 둘 다 있으면 나중에 저장된 쪽이
     이 기기면 클라우드로 올리고, 클라우드면 플레이어에게 고르게 한다 (실수로 덮어쓰지 않게).
   · 데이터 초기화 직후의 빈 기록(resetAt)은 클라우드보다 새것이면 이긴다 → 초기화가 클라우드에도 반영된다.
   · 올리기: 진행이 바뀌었으면 3분마다, 앱이 뒤로 갈 때, 초기 화면으로 갈 때.
   · 처음 연동하면 한 번 보상을 준다 (구글 계정마다 한 번, 데이터를 초기화해도 다시 받지 않는다).
   · 연동 해제: 이 기기에서 클라우드 저장을 멈춘다. Play 게임즈 v2 는 앱 안 로그아웃을 지원하지 않는다.
   웹에서 시험할 때: localStorage 에 voyage_cloud_mock = "1" 을 넣으면 가짜 클라우드(같은 브라우저 저장소)를 쓴다. */
const CLOUD = { plugin:null, auth:false, id:"", name:"", busy:false, hold:false, dirty:false, lastUp:0, ready:false };
const CLOUD_SLOT = "voyage";
const CLOUD_OFF_KEY = "voyage_cloud_off";
const CLOUD_PUSH_GAP = 180000;                                  /* 자동 올리기 간격 (3분) */
const LINK_REWARD = { gems:30, gold:5000 };                     /* 첫 연동 보상 */

const cloudOff = () => { try{ return localStorage.getItem(CLOUD_OFF_KEY) === "1"; }catch(e){ return false; } };
const cloudOn = () => !!(CLOUD.plugin && CLOUD.auth && !cloudOff());
function cloudMark(){ CLOUD.dirty = true; }
function cloudSet(r){ CLOUD.auth = !!(r && r.auth); CLOUD.id = (r && r.id) || ""; CLOUD.name = (r && r.name) || ""; }

/* 웹 시험용 가짜 플러그인 */
function cloudMock(){
  const K = "voyage_cloud_mock_data";
  return {
    status:async () => ({ auth:localStorage.getItem("voyage_cloud_mock_auth") === "1", id:"mock-player", name:"Tester" }),
    signIn:async () => { localStorage.setItem("voyage_cloud_mock_auth", "1"); return { auth:true, id:"mock-player", name:"Tester" }; },
    load:async () => ({ data:localStorage.getItem(K) || "" }),
    save:async o => { localStorage.setItem(K, o.data); },
  };
}

/* 저장 기록 요약: 날짜 · 크레딧 · 가장 먼 우주 · 저장 시각 */
function cloudSummary(s){
  const z = ZONES[Math.min(s.maxZ||0, ZONES.length-1)];
  return __`${dateStr(s.day||0)} · 💠 ${fmt(s.gold||0)} · ${z.ic} ${z.name}`;
}
const cloudWhen = t => t ? new Date(t).toLocaleString() : "-";

/* 이 기기 기록을 클라우드로 올린다. force: 시작 전 화면(빈 기록)이라도 올린다 (초기화 반영) */
async function cloudPush(force){
  if(!cloudOn() || CLOUD.hold || CLOUD.busy || !state) return false;
  if(state.intro && !force) return false;
  let raw = null; try{ raw = localStorage.getItem("voyage_space_save"); }catch(e){}
  if(!raw) return false;
  CLOUD.busy = true;
  try{
    const data = JSON.stringify({ v:1, raw, sig:guardSign(raw) });
    await CLOUD.plugin.save({ name:CLOUD_SLOT, data, desc:cloudSummary(state), played:Math.round((state.day||0)*1000) });
    CLOUD.lastUp = Date.now(); CLOUD.dirty = false;
    return true;
  }catch(e){ console.warn("cloud save", e); return false; }
  finally{ CLOUD.busy = false; }
}

/* 클라우드 기록을 이 기기에 덮어쓰고 다시 시작한다 */
let saveBlocked = false;
function cloudApply(raw){
  saveBlocked = true;
  try{
    localStorage.setItem("voyage_space_save", raw); localStorage.setItem("voyage_space_sig", guardSign(raw));
    localStorage.removeItem("voyage_space_backup"); localStorage.removeItem("voyage_space_backup_sig");
    sessionStorage.setItem("voyage_cloud_loaded", "1");
  }catch(e){}
  location.reload();
}

/* 클라우드 기록 읽기 → { raw, s } 또는 null */
async function cloudRead(){
  const r = await CLOUD.plugin.load({ name:CLOUD_SLOT });
  if(!r || !r.data) return null;
  const p = JSON.parse(r.data);
  if(!p || !p.raw || p.sig !== guardSign(p.raw)) return null;   /* 손댄 클라우드 기록은 쓰지 않는다 */
  return { raw:p.raw, s:JSON.parse(p.raw) };
}

/* 견주기. manual: 설정 창의 "클라우드에서 불러오기" → 언제나 플레이어가 고른다 */
async function cloudPull(manual){
  if(!cloudOn()) return;
  let c = null;
  try{ c = await cloudRead(); }catch(e){ console.warn("cloud load", e); if(manual) toast(__("클라우드 기록을 읽지 못했습니다. 잠시 뒤 다시 시도하세요")); return; }
  let hasLocal = false; try{ hasLocal = !!localStorage.getItem("voyage_space_save"); }catch(e){}
  const localAt = state.savedAt || 0;
  if(!c){ if(manual) toast(__("클라우드에 저장된 기록이 없습니다")); else cloudPush(); return; }
  const cloudAt = c.s.savedAt || 0;
  if(manual){ cloudChoose(c); return; }
  if(!hasLocal || state.intro){                                  /* 이 기기에 진행이 없다 */
    if((state.resetAt || 0) > cloudAt){ cloudPush(true); return; }   /* 방금 초기화했다 → 초기화를 올린다 */
    if(!c.s.intro){ cloudApply(c.raw); return; }
    return;
  }
  if(cloudAt > localAt + 2000){ cloudChoose(c); return; }        /* 다른 기기에서 더 나중에 저장했다 */
  if(localAt > cloudAt) cloudPush();
}

/* 어느 기록을 쓸지 고르는 창. 고르기 전에는 클라우드에 올리지 않는다 */
function cloudChoose(c){
  CLOUD.hold = true;
  const card = (ic, title, s, btn) => `<div class="card"><div class="ttl">${ic} ${title}</div>
      <div class="stat">${cloudSummary(s)}</div><div class="stat">${__`저장: ${cloudWhen(s.savedAt)}`}</div>${btn}</div>`;
  openModal(__("☁️ 저장 기록 고르기"), "", `<div class="stat" style="margin:0 4px 10px">${__`클라우드와 이 기기의 기록이 다릅니다. 이어서 할 기록을 고르세요. 고르지 않은 기록은 사라집니다.`}</div>
    ${card("☁️", __("클라우드 기록"), c.s, `<button class="btn orange wide" onclick="cloudPick(1)">${__`클라우드 기록으로 하기`}</button>`)}
    ${card("📱", __("이 기기 기록"), state, `<button class="btn wide" onclick="cloudPick(0)">${__`이 기기 기록으로 하기`}</button>`)}`, "cloud");
  forcedModal = true;
  cloudChoose.c = c;
}
function cloudPick(useCloud){
  const c = cloudChoose.c; forcedModal = false; closeModal();
  if(useCloud && c){ cloudApply(c.raw); return; }
  CLOUD.hold = false; save(); cloudPush(true).then(ok => { if(ok) toast(__("☁️ 이 기기 기록을 클라우드에 저장했습니다")); });
}

/* 첫 연동 보상 */
function cloudReward(){
  if(!CLOUD.auth || !state || state.linkReward) return;
  const key = "voyage_link_reward_" + CLOUD.id;
  let got = false; try{ got = localStorage.getItem(key) === "1"; }catch(e){}
  state.linkReward = true;
  if(got){ save(); return; }
  try{ localStorage.setItem(key, "1"); }catch(e){}
  state.gems += LINK_REWARD.gems; state.gold += LINK_REWARD.gold; updateHUD(); save(); sfx("fanfare");
  openModal(__("🎁 계정 연동 보상"), "", `<div class="card" style="text-align:center">
      <div style="font-size:40px;margin:6px 0">🎁</div>
      <div class="ttl">${__`구글 Play 게임즈 연동을 마쳤습니다`}</div>
      <div class="stat">${__`이제 진행 정보가 구글 계정에 저장됩니다. 기기를 바꿔도 이어서 할 수 있습니다.`}</div>
      <div class="ttl acc" style="margin-top:10px">💎 ${fmt(LINK_REWARD.gems)} · 💠 ${fmt(LINK_REWARD.gold)}</div></div>
    <button class="btn orange wide" onclick="closeModal()">${__`받기`}</button>`, "reward");
}

/* 설정 창의 "계정 연동" 버튼 */
async function cloudLink(){
  if(!CLOUD.plugin || CLOUD.busy) return;
  try{ localStorage.removeItem(CLOUD_OFF_KEY); }catch(e){}
  if(!CLOUD.auth){
    try{ cloudSet(await CLOUD.plugin.signIn()); }catch(e){ cloudSet(null); }
    if(!CLOUD.auth){ toast(__("구글 Play 게임즈에 로그인하지 못했습니다")); cloudRefresh(); return; }
  }
  toast(__`✅ ${CLOUD.name || "Google Play"} 계정과 연동했습니다`);
  await cloudPull(false);
  cloudReward(); cloudRefresh();
}
function cloudUnlink(){
  try{ localStorage.setItem(CLOUD_OFF_KEY, "1"); }catch(e){}
  toast(__("연동을 해제했습니다. 이 기기의 기록은 그대로 남습니다"));
  cloudRefresh();
}
async function cloudSaveNow(){
  if(!cloudOn()) return;
  save();
  toast(await cloudPush(true) ? __("☁️ 클라우드에 저장했습니다") : __("클라우드에 저장하지 못했습니다. 잠시 뒤 다시 시도하세요"));
  cloudRefresh();
}
/* 설정 창이 열려 있으면 다시 그린다 */
function cloudRefresh(){ if(modalKind === "settings") openSettings(); cloudIntroBtn(); }

/* 설정 창의 계정 칸 */
function cloudHTML(){
  if(!CLOUD.plugin) return `<div class="card"><div class="stat">${__`구글 Play 게임즈 연동은 안드로이드 앱에서 사용할 수 있습니다.`}</div></div>`;
  if(!cloudOn()) return `<div class="card"><div class="ttl">${__`🎮 구글 Play 게임즈 연동`}</div>
      <div class="stat">${__`연동하면 진행 정보가 구글 계정에 저장되어, 기기를 바꾸거나 앱을 다시 설치해도 이어서 할 수 있습니다.`}</div>
      ${state.linkReward ? "" : `<div class="stat acc">${__`첫 연동 보상: 💎 ${fmt(LINK_REWARD.gems)} · 💠 ${fmt(LINK_REWARD.gold)}`}</div>`}
      <button class="btn orange wide" onclick="cloudLink()">${__`🔗 계정 연동`}</button></div>`;
  return `<div class="card"><div class="row"><div class="grow"><div class="ttl">${__`✅ 연동됨`}${CLOUD.name ? ` · ${esc(CLOUD.name)}` : ""}</div>
        <div class="stat">${__`마지막 클라우드 저장: ${CLOUD.lastUp ? cloudWhen(CLOUD.lastUp) : __("이번 실행에서는 아직 없음")}`}</div></div></div>
      <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn sm orange" onclick="cloudSaveNow()">${__`☁️ 지금 저장`}</button>
        <button class="btn sm" onclick="cloudPull(true)">${__`⬇️ 클라우드에서 불러오기`}</button>
        <button class="btn sm ghost" onclick="cloudUnlink()">${__`연동 해제`}</button></div>
      <div class="stat">${__`구글 계정 로그아웃이나 계정 변경은 Play 게임즈 앱에서 할 수 있습니다. 연동 해제는 이 기기에서 클라우드 저장만 멈춥니다.`}</div></div>`;
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[ch]);

/* 처음 화면의 연동 버튼: 앱에서, 연동 전이고 보상을 아직 안 받았을 때만 */
function cloudIntroBtn(){
  const b = $("introLink"); if(!b) return;
  const show = CLOUD.ready && CLOUD.plugin && !cloudOn();
  b.style.display = show ? "" : "none";
  if(show) b.textContent = state && state.linkReward ? __("🎮 구글 Play 게임즈 연동") : __`🎮 구글 Play 게임즈 연동 - 💎 ${LINK_REWARD.gems} 보상`;
}

async function cloudInit(){
  const cap = window.Capacitor, P = cap && cap.Plugins && cap.Plugins.PlayGames;
  let mock = false; try{ mock = localStorage.getItem("voyage_cloud_mock") === "1"; }catch(e){}
  CLOUD.plugin = (cap && cap.isNativePlatform && cap.isNativePlatform() && P) ? P : mock ? cloudMock() : null;
  try{ if(sessionStorage.getItem("voyage_cloud_loaded")){ sessionStorage.removeItem("voyage_cloud_loaded"); setTimeout(()=>toast(__("☁️ 클라우드에 저장된 기록을 불러왔습니다")), 800); } }catch(e){}
  if(!CLOUD.plugin){ CLOUD.ready = true; return; }
  try{ cloudSet(await CLOUD.plugin.status()); }catch(e){ cloudSet(null); }
  CLOUD.ready = true;
  if(cloudOn()){ await cloudPull(false); if(!saveBlocked) cloudReward(); }
  cloudRefresh();
}
setInterval(()=>{ if(CLOUD.dirty && Date.now() - CLOUD.lastUp > CLOUD_PUSH_GAP) cloudPush(); }, 30000);
window.addEventListener("load", () => setTimeout(cloudInit, 600));
