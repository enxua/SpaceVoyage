"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 튜토리얼 ══════════════════
   처음 출항할 때(프롤로그가 끝난 뒤) 한 번만 나온다. state.tut 이 true 면 다시 자동으로 나오지 않는다.
   설정 창의 「게임 도움말」에서 언제든 다시 볼 수 있다.
   · 화면 가운데 안내 카드 + 해당 버튼에 주황 테두리(tutHi)를 깜빡여 어디를 보면 되는지 알려 준다
   · 게임을 막지 않는다: 카드 밖은 그대로 눌린다 */
const TUT = [
  { ic:"🚀", t:__("항해하기"), el:null,
    d:__("우주를 탭하면 그곳으로 항해합니다. 행성이나 기지를 탭하면 그 천체로 곧장 날아갑니다.") },
  { ic:"⛽", t:__("연료와 산소"), el:"grpShip",
    d:__("항해하는 동안 연료와 산소가 줄어듭니다. 기지에 입항하면 자동으로 보급됩니다. 산소가 바닥나면 조난되니 너무 멀리 가기 전에 기지에 들르세요.") },
  { ic:"🎯", t:__("지금 할 일"), el:"hGoal",
    d:__("주황색 목표 줄이 다음에 할 일을 알려 줍니다. 누르면 임무 창이 열립니다.") },
  { ic:"💞", t:__("함께하는 승무원"), el:"btnCrew",
    d:__("처음부터 함께할 승무원 세 명(세라핀 · 이자벨라 · 아민)이 합류했습니다. 아래 💞 승무원 버튼에서 만나 보세요.") },
  { ic:"🎖", t:__("승무원 배치하기"), el:"btnCrew",
    d:__("승무원 창의 「임무 배치」에서 직위의 <b>임명</b>을 누르고 승무원을 고르세요. 높은 직위일수록 능력이 크게 적용되고, 임명하지 않은 승무원은 능력의 절반만 발휘합니다. ⚡ 자동 배치로 한 번에 맡길 수도 있습니다.") },
  { ic:"📈", t:__("승무원 육성하기"), el:"btnCrew",
    d:__("임명된 승무원은 함께 항해할수록 호감도가 올라 능력이 최대 50%까지 커집니다. 호감도 80이 되면 특별한 이야기와 선물이 열립니다. 승무원 뽑기에서 같은 승무원이 또 나오면 ★ 승성으로 능력이 10%씩 오릅니다.") },
  { ic:"⚖️", t:__("무역으로 돈 벌기"), el:"btnTrade",
    d:__("기지에 정박하면 무역 창에서 물건을 사고팔 수 있습니다. 싸게 파는 곳에서 사서 비싸게 사는 곳에 파세요.") },
  { ic:"🔬", t:__("발견과 연구"), el:"btnTech",
    d:__("새 천체에 가까이 가면 발견되고 연구 데이터가 쌓입니다. 연구에서 워프 드라이브를 올리면 다음 우주로 갈 수 있습니다.") },
  { ic:"🔍", t:__("화면 조작"), el:"ctrl",
    d:__("두 손가락으로 벌리거나 오므려 확대·축소합니다. 지도를 끌어 둘러보다가 🚀 내 함선 버튼을 누르면 돌아옵니다.") },
  { ic:"⚙️", t:__("도움말 다시 보기"), el:"langBtn",
    d:__("이 안내는 ⚙️ 설정의 「게임 도움말」에서 언제든 다시 볼 수 있습니다. 좋은 항해 되세요!") },
];
let tutI = -1;

/* force: 설정 창에서 다시 보기 */
function tutStart(force){
  if(!state || state.intro) return;
  if(!force && state.tut) return;
  state.tut = true; save();
  if(typeof closeModal === "function" && !forcedModal) closeModal();
  if(force){ document.body.classList.remove("fold-top", "fold-bot"); }   /* 접힌 판넬은 펼쳐서 보여 준다 */
  tutI = 0; tutShow();
}
function tutClearHi(){ document.querySelectorAll(".tutHi").forEach(e=>e.classList.remove("tutHi")); }
function tutShow(){
  tutClearHi();
  const s = TUT[tutI], box = $("tut");
  if(!s){ tutEnd(); return; }
  const el = s.el && $(s.el);
  if(el && el.offsetParent) el.classList.add("tutHi");
  const last = tutI === TUT.length - 1;
  box.innerHTML = `<div class="tutCard">
      <div class="tutTop"><span class="tutStep">${tutI+1} / ${TUT.length}</span>
        ${last ? "" : `<button class="tutSkip" onclick="tutEnd()">${__`건너뛰기`}</button>`}</div>
      <div class="tutIc">${s.ic}</div>
      <div class="ttl">${s.t}</div>
      <div class="stat" style="font-size:13px;line-height:1.7;margin-top:6px">${s.d}</div>
      <div class="tutDots">${TUT.map((_,i)=>`<i class="${i===tutI?"on":""}"></i>`).join("")}</div>
      <div class="row" style="gap:8px;margin-top:4px">
        ${tutI > 0 ? `<button class="btn ghost" onclick="tutGo(-1)">${__`이전`}</button>` : ""}
        <button class="btn orange grow" onclick="tutGo(1)">${last ? __("항해 시작!") : __("다음")}</button></div></div>`;
  box.classList.add("on");
}
function tutGo(d){ tutI = Math.max(0, tutI + d); sfx("tap"); tutShow(); }
function tutEnd(){ tutI = -1; tutClearHi(); const box = $("tut"); if(box){ box.classList.remove("on"); box.innerHTML = ""; } }
