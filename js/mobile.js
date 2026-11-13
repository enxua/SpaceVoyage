"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 모바일(안드로이드 앱) 대응 ══════════════════
   웹에서는 아무 일도 하지 않는다. Capacitor 앱 안에서만 동작한다.
   · 뒤로 가기 버튼: 열린 창 닫기 → 이야기 장면 넘기기 → 한 번 더 누르면 종료
   · 앱이 뒤로 가면 저장하고 소리를 멈춘다 */
(function(){
  const cap = window.Capacitor, App = cap && cap.Plugins && cap.Plugins.App;
  if(!App) return;
  document.body.classList.add("app");
  let lastBack = 0;
  App.addListener("backButton", ()=>{
    if(typeof ST !== "undefined" && ST.on){ storyNext(); return; }
    if($("shade").classList.contains("on")){
      if(forcedModal){ toast(__("지금은 닫을 수 없습니다. 선택지를 골라 주세요")); return; }
      closeModal(); return;
    }
    const now = Date.now();
    if(now - lastBack < 2000){ save(); App.exitApp(); return; }
    lastBack = now; toast(__("뒤로 버튼을 한 번 더 누르면 종료합니다"));
  });
  App.addListener("appStateChange", st=>{
    if(!st.isActive){ try{ save(); }catch(e){} if(AU.ctx) AU.ctx.suspend(); }
    else if(AU.ctx) AU.ctx.resume();
  });
})();
