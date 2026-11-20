"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 랭킹 (구글 Play 게임즈 리더보드) ══════════════════
   안드로이드 앱에서 Play 게임즈에 로그인돼 있으면 기록을 리더보드에 올리고, 구글 리더보드 화면을 띄운다.
   (클라우드 저장 연동과는 별개다. 연동 해제 중이어도 로그인만 돼 있으면 랭킹에 참여한다.)
   · 리더보드 ID 는 플레이 콘솔 > Play 게임즈 서비스 > 리더보드 에서 만든 값 (RANK_IDS)
   · Play 게임즈가 플레이어마다 최고 기록만 남기므로 같은 값은 다시 보내지 않는다
   · 올리는 때: 1분마다 기록이 바뀌었으면, 앱이 뒤로 갈 때, 랭킹 창을 열 때
   웹에서는 내 기록만 보여 준다 (리더보드는 앱에서만). */
const RANK_IDS = { found:"CgkI69adrZYdEAIQAQ", sell:"CgkI69adrZYdEAIQAg", wins:"CgkI69adrZYdEAIQAw", bigbang:"CgkI69adrZYdEAIQBA" };
const RANK_LIST = [
  { k:"found",   ic:"🔭", name:__("탐사가"),         desc:__("발견한 천체와 떠돌이 별의 수"),                 val:s => (s.found||[]).length + (s.starsFound||[]).length },
  { k:"sell",    ic:"💠", name:__("무역왕"),         desc:__("무역으로 번 누적 크레딧"),                       val:s => Math.floor((s.stats||{}).sell || 0) },
  { k:"wins",    ic:"☠️", name:__("해적 사냥꾼"),    desc:__("물리친 해적의 수"),                               val:s => (s.stats||{}).wins || 0 },
  { k:"bigbang", ic:"🌌", name:__("빅뱅 최단 도달"), desc:__("우주의 시작에 닿기까지 걸린 날 (적을수록 높은 순위)"), val:s => s.endDay || 0 },
];
const rankSent = {};
const rankReady = () => !!(CLOUD.plugin && CLOUD.plugin.submitScore && CLOUD.auth);

async function rankSubmit(){
  if(!rankReady() || !state || state.intro) return;
  for(const r of RANK_LIST){
    const id = RANK_IDS[r.k], v = r.val(state);
    if(!id || !v || rankSent[r.k] === v) continue;
    try{ await CLOUD.plugin.submitScore({ id, score:v }); rankSent[r.k] = v; }catch(e){ console.warn("rank submit", e); }
  }
}

/* 랭킹 창: 내 기록 네 가지 + 구글 리더보드 열기 */
function openRanking(){
  const app = !!(CLOUD.plugin && CLOUD.plugin.showLeaderboard);
  let html = `<div class="stat" style="margin:0 4px 10px">${app ? __`구글 Play 게임즈 리더보드에서 전 세계 항해사들과 기록을 겨룹니다.` : __`랭킹은 안드로이드 앱에서 구글 Play 게임즈로 참여할 수 있습니다.`}</div>`;
  for(const r of RANK_LIST){
    const v = state ? r.val(state) : 0;
    const shown = r.k === "bigbang" ? (v ? __`${fmt(v)}일` : __("아직 도달하지 못함")) : fmt(v);
    html += `<div class="card"><div class="row"><div style="font-size:26px;width:36px;text-align:center">${r.ic}</div>
      <div class="grow"><div class="ttl">${r.name}</div><div class="stat">${r.desc}</div><div class="stat acc">${__`내 기록: ${shown}`}</div></div>
      ${app ? `<button class="btn sm orange" onclick="rankShow('${r.k}')">${__`순위 보기`}</button>` : ""}</div></div>`;
  }
  if(app) html += `<button class="btn wide" onclick="rankShow('')">${__`🏆 전체 랭킹 보기`}</button>`;
  openModal(__("🏆 랭킹"), "", html, "ranking");
}

/* 구글 리더보드 화면. 로그인이 안 돼 있으면 먼저 로그인 창을 띄운다 */
async function rankShow(k){
  if(!CLOUD.plugin || !CLOUD.plugin.showLeaderboard) return;
  if(!CLOUD.auth){
    try{ cloudSet(await CLOUD.plugin.signIn()); }catch(e){ cloudSet(null); }
    if(!CLOUD.auth){ toast(__("구글 Play 게임즈에 로그인하지 못했습니다")); return; }
  }
  await rankSubmit();
  try{ await CLOUD.plugin.showLeaderboard({ id:k ? RANK_IDS[k] : "" }); }
  catch(e){ console.warn("rank show", e); toast(__("랭킹을 열지 못했습니다. 잠시 뒤 다시 시도하세요")); }
}

setInterval(rankSubmit, 60000);
