"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 보상형 광고 ══════════════════
   광고를 끝까지 보면 보상을 준다: 상점의 무료 크레딧·보석, 전투·임무·납품 보상 2배, 조난 시 기함 되살리기.
   지금은 광고 모듈이 없어 5초짜리 테스트 화면으로 대신한다.
   실제 광고를 붙일 때는 AD_PLAY 하나만 바꾸면 된다: AD_PLAY(onDone, onCancel) - 끝까지 보면 onDone, 중간에 닫으면 onCancel. */
const AD_LIMIT = { credit:5, gem:3, revive:2, double:20 };           /* 하루에 받을 수 있는 횟수 */
const AD_SECONDS = 5;
function ads(){
  const t = new Date(), d = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
  if(!state.ads || state.ads.day !== d) state.ads = { day:d, credit:0, gem:0, revive:0, double:0 };
  return state.ads;
}
const adLeft = k => Math.max(0, AD_LIMIT[k]-(ads()[k]||0));

/* ── 광고 제거: 기간 동안(또는 영구히) 광고를 보지 않고 보상을 바로 받는다. 하루 횟수 제한은 그대로다 ── */
const AD_PACKS = [
  { id:"na30", name:__("광고 제거 30일"),    won:10000, noAds:30,       ic:"🚫" },
  { id:"naInf",name:__("광고 제거 무제한"),  won:20000, noAds:Infinity, ic:"♾️" },
];
function adFree(){ const v = state.shop && state.shop.noAds; return v === "forever" || (typeof v === "number" && v > Date.now()); }
const adFreeDays = () => { const v = state.shop.noAds; return typeof v === "number" && v > Date.now() ? Math.ceil((v-Date.now())/86400000) : 0; };
function adFreeGrant(days){
  if(state.shop.noAds === "forever") return;
  if(days === Infinity){ state.shop.noAds = "forever"; return; }
  const base = typeof state.shop.noAds === "number" && state.shop.noAds > Date.now() ? state.shop.noAds : Date.now();   /* 남은 기간에 이어 붙인다 */
  state.shop.noAds = base + days*86400000;
}
function adFreeHTML(){
  const forever = state.shop.noAds === "forever", days = adFreeDays();
  let html = `<div class="sec">${__`🚫 광고 제거`}${forever ? ` - ${__`무제한 이용 중`}` : days ? ` - ${__`이용 중 · ${days}일 남음`}` : ""}</div>`;
  for(const p of AD_PACKS){ const done = forever;
    html += `<div class="card"><div class="row"><div style="font-size:28px;width:38px;text-align:center">${p.ic}</div>
      <div class="grow"><div class="ttl">${p.name}</div><div class="stat">${__`광고를 보지 않고 광고 보상을 바로 받습니다.`}</div></div>
      <button class="btn orange" ${done?"disabled":""} onclick="buyPack('${p.id}')">${done ? __("이용 중") : won(p.won)}</button></div></div>`; }
  return html;
}

/* 테스트용 광고 화면. 실제 SDK(AdMob 등)를 붙이면 이 함수만 바꾼다 */
let AD_PLAY = function(onDone, onCancel){
  let el = $("adView");
  if(!el){ el = document.createElement("div"); el.id = "adView"; document.body.appendChild(el);
    el.style.cssText = "position:fixed;inset:0;z-index:300;background:rgba(12,14,24,.94);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;gap:14px"; }
  let left = AD_SECONDS;
  const paint = () => { el.innerHTML = `<div style="font-size:54px">📺</div>
    <div style="font-size:18px;font-weight:800">${__("광고 시청 중")}</div>
    <div style="font-size:12.5px;opacity:.75;max-width:320px;line-height:1.7">${__("🧪 테스트 모드 - 아직 광고 모듈이 없어 잠시 기다리면 보상을 받습니다.")}</div>
    <div style="font-size:40px;font-weight:800;color:#ffb347">${left}</div>
    <div style="width:220px;height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden"><i style="display:block;height:100%;width:${(1-left/AD_SECONDS)*100}%;background:#ffb347;transition:width 1s linear"></i></div>
    <button class="btn ghost" style="margin-top:10px;color:#fff;border-color:rgba(255,255,255,.4)" onclick="adCancel()">${__("그만 보기 (보상 없음)")}</button>`; };
  el.style.display = "flex"; paint();
  const tm = setInterval(()=>{ left--; if(left <= 0){ clearInterval(tm); el.style.display = "none"; window.adCancel = null; onDone(); } else paint(); }, 1000);
  window.adCancel = () => { clearInterval(tm); el.style.display = "none"; window.adCancel = null; onCancel && onCancel(); };
};
/* 광고를 보고 보상 받기. kind: 하루 횟수를 세는 종류 */
let adBusy = false;
function watchAd(kind, reward){
  if(adBusy) return;
  if(adLeft(kind) <= 0){ toast(__("오늘은 이 광고 보상을 모두 받았습니다. 내일 다시 받을 수 있습니다")); return; }
  if(adFree()){ ads()[kind]++; reward(); updateHUD(); save(); return; }          /* 광고 제거 이용 중: 바로 지급 */
  const was = paused; adBusy = true; paused = true;
  const end = () => { adBusy = false; paused = was; };
  AD_PLAY(()=>{ end(); ads()[kind]++; reward(); updateHUD(); save(); }, end);
}

/* ── 보상 2배 제안: 화면 아래에 잠깐 떠 있는 버튼 ── */
let adOfferT = null;
function adOfferHide(){ clearTimeout(adOfferT); adOfferT = null; const el = $("adOffer"); if(el) el.style.display = "none"; }
function adDouble(gold, gems){
  gold = Math.round(gold||0); gems = gems||0;
  if((gold < 1 && gems < 1) || adLeft("double") <= 0) return;
  let el = $("adOffer");
  if(!el){ el = document.createElement("button"); el.id = "adOffer"; el.className = "btn orange"; document.body.appendChild(el);
    el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:300px;z-index:60;padding:10px 18px;font-size:13px;border-radius:22px;box-shadow:0 6px 20px rgba(217,111,50,.4);max-width:92vw;white-space:normal;line-height:1.4"; }
  el.innerHTML = adFree() ? __`🎁 보상 2배 받기 (+${fmt(gold)}💠${gems?` 💎+${gems}`:""})` : __`📺 광고 보고 보상 2배 받기 (+${fmt(gold)}💠${gems?` 💎+${gems}`:""})`;
  el.onclick = () => { adOfferHide(); watchAd("double", ()=>{ state.gold += gold; if(gems) state.gems += gems; sfx("fanfare");
    toast(__`📺 보상을 한 번 더 받았습니다! +${fmt(gold)}💠${gems?` 💎+${gems}`:""}`, true); }); };
  el.style.display = "block"; clearTimeout(adOfferT); adOfferT = setTimeout(adOfferHide, 12000);
}

/* ── 상점: 무료 보상 ── */
const adCreditAmount = () => 500;
function adShopHTML(){
  const c = adLeft("credit"), g = adLeft("gem");
  return `<div class="card" style="border-color:#4a90d9"><div class="row"><div style="font-size:28px;width:38px;text-align:center">📺</div>
    <div class="grow"><div class="ttl">${__("광고 보고 무료로 받기")}</div><div class="stat">${__("광고를 끝까지 보면 보상을 받습니다. 횟수는 매일 다시 채워집니다.")}</div></div></div>
    <div class="row" style="margin-top:10px;gap:8px">
      <button class="btn orange" style="flex:1" ${c?"":"disabled"} onclick="adShop('credit')">💠 ${fmt(adCreditAmount())}<br><span style="font-size:11px;font-weight:600">${__`오늘 ${c}회 남음`}</span></button>
      <button class="btn" style="flex:1" ${g?"":"disabled"} onclick="adShop('gem')">💎 1<br><span style="font-size:11px;font-weight:600">${__`오늘 ${g}회 남음`}</span></button></div></div>`;
}
function adShop(kind){
  watchAd(kind, ()=>{ sfx("fanfare");
    if(kind === "credit"){ const n = adCreditAmount(); state.gold += n; toast(__`📺 광고 보상 +${fmt(n)}💠`, true); }
    else { state.gems += 1; toast(__("📺 광고 보상 💎+1"), true); }
    if(modalKind === "shop") openShop(); });
}

/* ── 조난: 광고를 보고 기함 되살리기 ── */
let goSnap = null;
function adReviveSave(){ goSnap = JSON.stringify({ ships:state.ships, cargo:state.cargo, cost:state.cost||{}, routes:state.routes, flagship:state.flagship, posts:state.posts }); }
function adReviveSetup(){
  const b = $("goAd"); if(!b) return;
  const n = goSnap ? adLeft("revive") : 0;
  b.style.display = n ? "" : "none";
  b.innerHTML = __`📺 광고 보고 기함 되살리기 (오늘 ${n}회 남음)`;
}
function adRevive(){
  if(!goSnap) return;
  watchAd("revive", ()=>{
    Object.assign(state, JSON.parse(goSnap)); goSnap = null; delete state.wiped; syncPosts();
    const st = eff(); state.hull = Math.round(st.hull*0.5); state.fuel = Math.max(state.fuel, st.sup*0.5); state.o2 = Math.max(state.o2, st.sup*0.5); state.buff = null;
    $("gameover").style.display = "none"; paused = false; cam.follow = true; sfx("fanfare");
    say(["vice","eng"], __("🛟 구조대가 제때 도착했습니다! 기함과 화물을 지켜 냈습니다. 선체는 절반만 남았으니 조심하십시오."), true);
  });
}
