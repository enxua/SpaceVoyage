"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - AdMob 보상형 광고 ══════════════════
   안드로이드 앱(Capacitor)에서만 동작한다. 웹에서는 js/ads.js 의 테스트 화면이 그대로 쓰인다.
   · 시작할 때: AdMob 초기화 → 개인정보 동의(UMP, 유럽 등 필요한 지역만 동의 창) → 보상형 광고 미리 불러오기
   · AD_PLAY(onDone, onCancel) 를 실제 광고로 바꾼다. 끝까지 봐서 보상을 받은 경우에만 onDone
   · 광고가 닫히면 다음 광고를 미리 불러 둔다. 불러오기에 실패하면 점점 늦춰 가며 다시 시도한다
   ★ 출시 전에 바꿀 것: 아래 ADMOB.rewarded (광고 단위 ID) + android/app/src/main/res/values/strings.xml 의 admob_app_id (앱 ID)
     둘 다 구글 테스트 ID 이면 testing 을 true 로 두고, 실제 ID 로 바꾸면 testing 을 false 로 바꾼다. */
const ADMOB = {
  rewarded: "ca-app-pub-3940256099942544/5224354917",       /* 보상형 광고 단위 ID (지금은 구글 공식 테스트 ID) */
  testing: true,                                            /* 실제 ID 로 바꾸면 false */
};
const ADM = { plugin:null, ready:false, loading:false, canRequest:false, privacy:false, retry:0, cur:null };

function admobPrepare(){
  const A = ADM.plugin; if(!A || !ADM.canRequest || ADM.ready || ADM.loading) return;
  ADM.loading = true;
  A.prepareRewardVideoAd({ adId:ADMOB.rewarded, isTesting:ADMOB.testing })
    .then(() => { ADM.ready = true; ADM.retry = 0; })
    .catch(() => { ADM.retry = Math.min(ADM.retry + 1, 6); setTimeout(admobPrepare, 15000 * ADM.retry); })   /* 15초, 30초 … 최대 90초 뒤 다시 */
    .finally(() => { ADM.loading = false; });
}

/* 실제 광고 보여 주기: 보상 이벤트가 오면 기억했다가, 광고가 닫힐 때 보상을 준다 */
function admobPlay(onDone, onCancel){
  const A = ADM.plugin;
  if(!ADM.ready){
    toast(ADM.canRequest ? __("광고를 준비하고 있습니다. 잠시 후 다시 시도해 주세요") : __("광고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요"));
    admobPrepare(); onCancel && onCancel(); return;
  }
  ADM.ready = false;
  let rewarded = false, closed = false;
  const finish = failed => {
    if(closed) return; closed = true; ADM.cur = null;
    try{ if(AU.ctx) AU.ctx.resume(); }catch(e){}
    if(rewarded) onDone(); else { if(failed) toast(__("광고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요")); onCancel && onCancel(); }
    admobPrepare();
  };
  ADM.cur = { reward:() => { rewarded = true; }, close:() => finish(false), fail:() => finish(true) };
  try{ if(AU.ctx) AU.ctx.suspend(); }catch(e){}                 /* 광고 소리와 겹치지 않게 게임 소리를 멈춘다 */
  A.showRewardVideoAd().then(item => { if(item) rewarded = true; }).catch(() => finish(true));
}

/* 개인정보 설정 (동의를 다시 고를 수 있어야 하는 지역에서만 설정 창에 버튼이 보인다) */
function admobPrivacyHTML(){
  if(!ADM.plugin || !ADM.privacy) return "";
  return `<div class="sec">${__("광고 개인정보 설정")}</div><div class="card"><button class="btn ghost wide" style="margin-top:0" onclick="admobPrivacy()">🛡 ${__("광고 개인정보 설정")}</button></div>`;
}
function admobPrivacy(){
  const A = ADM.plugin; if(!A) return;
  A.showPrivacyOptionsForm().then(() => A.requestConsentInfo()).then(info => { ADM.canRequest = info.canRequestAds; admobPrepare(); }).catch(() => {});
}

async function admobInit(){
  const cap = window.Capacitor, A = cap && cap.Plugins && cap.Plugins.AdMob;
  if(!A || !(cap.isNativePlatform && cap.isNativePlatform())) return;          /* 웹: 테스트 화면 유지 */
  ADM.plugin = A;
  AD_PLAY = admobPlay;
  A.addListener("onRewardedVideoAdReward", () => ADM.cur && ADM.cur.reward());
  A.addListener("onRewardedVideoAdDismissed", () => ADM.cur && ADM.cur.close());
  A.addListener("onRewardedVideoAdFailedToShow", () => ADM.cur && ADM.cur.fail());
  try{
    await A.initialize({ initializeForTesting:ADMOB.testing });
    let info = await A.requestConsentInfo();
    if(info.isConsentFormAvailable && info.status === "REQUIRED") info = await A.showConsentForm();
    ADM.canRequest = info.canRequestAds; ADM.privacy = info.privacyOptionsRequirementStatus === "REQUIRED";
  }catch(e){ ADM.canRequest = true; }                         /* 동의 정보를 못 받아도 광고 요청은 시도한다 (SDK 가 지역 규정을 따른다) */
  admobPrepare();
}
window.addEventListener("load", () => setTimeout(admobInit, 500));
