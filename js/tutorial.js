"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 노바의 안내 (튜토리얼) ══════════════════
   · 처음 출항할 때(프롤로그가 끝난 뒤) 기본 조작만 짧게 안내한다 (TUT_START, state.tut 로 한 번만)
   · 아래 메뉴(함대·조선소·승무원·무역·연구·토벌·임무·도감)는 처음 열 때 한 번씩 노바가 설명한다 (TUT_TIPS, state.tips)
   · 설정 창의 「게임 도움말」을 누르면 처음 안내를 다시 보여 주고, 메뉴 설명도 다시 나오게 한다
   · 프롤로그의 함선 항해 지능 「노바」가 말한다 (글자가 한 자씩 나오고, 누르면 한 번에)
   · 처음 안내는 화면 가운데 + 설명하는 곳에 주황 테두리, 메뉴 설명은 창을 가리지 않게 화면 위쪽에 뜬다
   · 게임을 막지 않는다: 말풍선 밖은 그대로 눌린다 */
const TUT_START = [
  { ic:"🚀", t:__("항해하기"), el:null,
    d:__("선장님, 이 배의 항해 지능 노바입니다. 우주 아무 곳이나 탭하시면 그곳으로 항로를 잡겠습니다. 행성이나 기지를 탭하시면 곧장 그 천체로 모시죠.") },
  { ic:"⛽", t:__("연료와 산소"), el:"grpShip",
    d:__("위쪽 계기판을 봐 주세요. 항해할수록 연료와 산소가 줄어듭니다. 기지에 입항하면 제가 알아서 보급합니다. 산소가 바닥나면… 조난입니다. 너무 멀리 가시기 전에 꼭 기지에 들러 주세요.") },
  { ic:"🎯", t:__("지금 할 일"), el:"hGoal",
    d:__("주황색 목표 줄이 다음에 하실 일입니다. 막막하시면 이 줄만 따라가셔도 됩니다. 누르시면 임무 목록을 보여 드리죠.") },
  { ic:"🔍", t:__("화면 조작"), el:"ctrl",
    d:__("두 손가락으로 벌리거나 오므리면 확대·축소됩니다. 지도를 끌어 둘러보시다가 🚀 내 함선 버튼을 누르면 제자리로 돌아옵니다.") },
  { ic:"☰", t:__("아래 메뉴"), el:"dock",
    d:__("아래 메뉴는 처음 여실 때마다 제가 하나씩 알려 드리겠습니다. 다시 듣고 싶으시면 ⚙️ 설정의 「게임 도움말」을 눌러 주세요. 그럼, 출항하시죠. 선장님.") },
];
/* 메뉴를 처음 열 때 한 번씩 */
const TUT_TIPS = {
  fleet:[{ ic:"🚀", t:__("함대"),
    d:__("함대 창에서는 가진 함선을 보고 기함을 고릅니다. 기함 등급이 높을수록 승무원을 임명할 직위가 늘어납니다. 함선을 누르시면 자세한 제원을 볼 수 있습니다.") }],
  gacha:[{ ic:"🎲", t:__("조선소"),
    d:__("조선소에서는 크레딧으로 설계도를 받아 새 함선을 건조합니다. 이미 있는 함선이 또 나오면 ★ 승성으로 제원이 10%씩 오릅니다.") }],
  crew:[
    { ic:"💞", t:__("함께하는 승무원"),
      d:__("다행히 저 혼자가 아닙니다. 세라핀, 이자벨라, 아민 세 사람이 처음부터 함께합니다. 「승무원 명단」에서 이들의 능력을 확인해 보세요.") },
    { ic:"🎖", t:__("승무원 배치하기"),
      d:__("승무원은 직위에 임명해야 제 실력을 냅니다. 승무원 창의 「임무 배치」에서 직위의 <b>임명</b>을 누르고 사람을 고르시면 됩니다. 높은 직위일수록 능력이 크게 적용되고, 자리가 없는 승무원은 절반만 일합니다. 번거로우시면 ⚡ 자동 배치를 누르세요.") },
    { ic:"📈", t:__("승무원 육성하기"),
      d:__("임명된 승무원은 함께 항해할수록 선장님을 믿게 됩니다. 호감도가 오르면 능력이 최대 50%까지 커지고, 80이 되면 특별한 이야기와 선물이 열립니다. 승무원 뽑기에서 같은 사람이 또 오면 ★ 승성으로 10%씩 강해집니다.") }],
  trade:[{ ic:"⚖️", t:__("무역으로 돈 벌기"),
    d:__("돈은 무역으로 법니다. 기지에 정박해 무역 창을 여세요. 싸게 파는 곳에서 사서 비싸게 사는 곳에 파는 것, 우주에서도 진리입니다.") }],
  tech:[{ ic:"🔬", t:__("발견과 연구"),
    d:__("새 천체에 가까이 가시면 제가 기록해 연구 데이터를 모읍니다. 연구에서 워프 드라이브를 올리면 다음 우주로 넘어갈 수 있습니다.") }],
  dens:[{ ic:"💀", t:__("토벌"),
    d:__("해적 기지 목록입니다. 전투력과 선체가 넉넉할 때 도전하세요. 이기면 큰 보상을 얻고, 잔당은 시간이 지나면 다시 모여듭니다.") }],
  quests:[{ ic:"📜", t:__("임무"),
    d:__("주 임무와 기지의 납품 의뢰가 여기 모여 있습니다. 하나씩 해내시면 크레딧과 연구 데이터를 드리죠.") }],
  codex:[{ ic:"📖", t:__("도감"),
    d:__("발견한 천체, 업적과 칭호, 지나온 이야기가 기록됩니다. 업적을 달성해 얻은 칭호를 장착하면 효과가 붙습니다.") }],
};
const TUT_FACE = `<div class="tutFace">🤖</div>`;   /* 프롤로그의 노바 얼굴과 같은 모양 */
let tutQ = null, tutI = -1, tutTyping = null, tutFull = "";

/* 처음 출항 안내. force: 설정 창의 「게임 도움말」(메뉴 설명도 다시 나오게 한다) */
function tutStart(force){
  if(!state || state.intro) return;
  if(!force && state.tut) return;
  state.tut = true;
  if(force){ state.tips = {}; document.body.classList.remove("fold-top", "fold-bot"); }   /* 접힌 판넬은 펼쳐서 보여 준다 */
  save();
  if(typeof closeModal === "function" && !forcedModal) closeModal();
  tutPlay(TUT_START, false);
}
/* 메뉴를 처음 열었을 때 */
function tutTip(key){
  if(!state || state.intro || !TUT_TIPS[key] || tutQ) return;
  if(typeof ST !== "undefined" && ST.on) return;
  if(!state.tips) state.tips = {};
  if(state.tips[key]) return;
  state.tips[key] = true; save();
  tutPlay(TUT_TIPS[key], true);
}
function tutPlay(list, top){ tutQ = list; tutI = 0; $("tut").classList.toggle("top", !!top); tutShow(); }

function tutClearHi(){ document.querySelectorAll(".tutHi").forEach(e=>e.classList.remove("tutHi")); }
function tutShow(){
  tutClearHi(); clearInterval(tutTyping); tutTyping = null;
  const s = tutQ && tutQ[tutI], box = $("tut");
  if(!s){ tutEnd(); return; }
  const el = s.el && $(s.el);
  if(el && el.offsetParent) el.classList.add("tutHi");
  const n = tutQ.length, last = tutI === n - 1;
  box.innerHTML = `<div class="tutCard" onclick="tutFinishType()">
      <div class="tutTop"><span class="tutStep">${s.ic} ${s.t}${n > 1 ? ` · ${tutI+1}/${n}` : ""}</span>
        ${last ? "" : `<button class="tutSkip" onclick="event.stopPropagation();tutEnd()">${__`건너뛰기`}</button>`}</div>
      <div class="row" style="align-items:flex-start;gap:12px;margin-top:6px">${TUT_FACE}
        <div class="grow"><div class="tutWho">${__("노바")} <span>${__("🤖 함선 항해 지능")}</span></div>
          <div class="tutSay" id="tutSay"></div></div></div>
      ${n > 1 ? `<div class="tutDots">${tutQ.map((_,i)=>`<i class="${i===tutI?"on":""}"></i>`).join("")}</div>` : `<div style="height:10px"></div>`}
      <div class="row" style="gap:8px">
        ${tutI > 0 ? `<button class="btn ghost" onclick="event.stopPropagation();tutGo(-1)">${__`이전`}</button>` : ""}
        <button class="btn orange grow" onclick="event.stopPropagation();tutGo(1)">${last ? (tutQ === TUT_START ? __("항해 시작!") : __("알겠어요")) : __("다음")}</button></div></div>`;
  box.classList.add("on"); sfx("blip");
  /* 노바가 말하듯 글자가 한 자씩 (태그는 다 나온 뒤에 입힌다) */
  tutFull = s.d; const plain = s.d.replace(/<[^>]+>/g, ""), say = $("tutSay"); let k = 0;
  tutTyping = setInterval(()=>{ k += 2; say.textContent = plain.slice(0, k);
    if(k >= plain.length) tutFinishType(); }, 26);
}
function tutFinishType(){ clearInterval(tutTyping); tutTyping = null; const say = $("tutSay"); if(say) say.innerHTML = tutFull; }
function tutGo(d){
  if(tutTyping && d > 0){ tutFinishType(); return; }           /* 아직 말하는 중이면 먼저 끝까지 보여 준다 */
  tutI = Math.max(0, tutI + d); sfx("tap"); tutShow();
}
function tutEnd(){
  clearInterval(tutTyping); tutTyping = null; tutQ = null; tutI = -1; tutClearHi();
  const box = $("tut"); if(box){ box.classList.remove("on", "top"); box.innerHTML = ""; }
}

/* 아래 메뉴 함수에 「처음 열면 노바 설명」을 붙인다 (창을 연 뒤에 뜬다) */
for(const [fn, key] of Object.entries({ openFleet:"fleet", openGacha:"gacha", openCrew:"crew", openTrade:"trade",
                                         openTech:"tech", openDens:"dens", openQuests:"quests", openCodex:"codex" })){
  const orig = window[fn]; if(typeof orig !== "function") continue;
  window[fn] = function(...a){ const r = orig.apply(this, a); tutTip(key); return r; };
}
