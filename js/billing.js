"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 구글 플레이 결제 ══════════════════
   안드로이드 앱에서만 동작한다 (@capgo/native-purchases). 웹에서는 js/ui.js 의 테스트 결제(바로 지급)가 그대로 쓰인다.
   · 상품 ID = "voyage_" + 상점 묶음 id 소문자 (예: voyage_p1, voyage_g3, voyage_na30, voyage_nainf)
     플레이 콘솔 > 수익 창출 > 인앱 상품 에 같은 ID 로 만들어 둔다.
   · 광고 제거 무제한(voyage_nainf)만 한 번 사면 영구히 갖는 상품(비소모성), 나머지는 살 때마다 지급하는 소모성 상품
   · 상점 가격은 플레이 스토어가 알려 주는 그 나라 가격으로 보여 준다 (불러오기 전에는 원화 가격)
   · 앱을 다시 설치해도 광고 제거 무제한은 시작할 때 구매 내역에서 되살린다
   ※ 기기 안에서만 확인하는 결제라 완벽한 부정 방지는 아니다. 매출이 커지면 서버에서 구매 토큰을 검증하는 것이 좋다. */
const BILL = { plugin:null, on:false, prices:{}, busy:false };
const billId = p => "voyage_" + p.id.toLowerCase();
const billConsumable = p => p.noAds !== Infinity;                 /* 광고 제거 무제한만 비소모성 */
const billPacks = () => [...SHOP_PACKS, ...GEM_PACKS, ...STARTER_PACKS, ...AD_PACKS];

/* 상점 버튼에 쓸 가격: 스토어 가격 → 없으면 원화 */
function priceOf(p){ return (BILL.on && BILL.prices[billId(p)]) || won(p.won); }
const payIsTest = () => !BILL.on;                                  /* 웹·결제 미지원 기기: 테스트 결제 */

async function billPay(pack, onPaid){
  const NP = BILL.plugin;
  if(BILL.busy) return;
  BILL.busy = true;
  try{
    const t = await NP.purchaseProduct({ productIdentifier:billId(pack), productType:"inapp", isConsumable:billConsumable(pack) });
    if(t && t.purchaseState && t.purchaseState !== "1"){ toast(__("결제가 대기 중입니다. 결제가 끝나면 다음 실행 때 지급됩니다")); return; }
    onPaid();
  }catch(e){
    const msg = String((e && (e.message || e.code)) || "");
    if(/cancel/i.test(msg)) toast(__("결제를 취소했습니다"));
    else if(/already|owned/i.test(msg)){ if(pack.noAds === Infinity){ onPaid(); } else toast(__("이미 구매한 상품입니다")); }
    else toast(__("결제를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요"));
  }finally{ BILL.busy = false; }
}

/* 시작할 때: 가격 불러오기 + 비소모성 상품 되살리기 + 끝나지 않은 결제 정리 */
async function billInit(){
  const cap = window.Capacitor, NP = cap && cap.Plugins && cap.Plugins.NativePurchases;
  if(!NP || !(cap.isNativePlatform && cap.isNativePlatform())) return;
  try{ const s = await NP.isBillingSupported(); if(!s || !s.isBillingSupported) return; }catch(e){ return; }
  BILL.plugin = NP; BILL.on = true; requestPayment = billPay;
  try{
    const { products } = await NP.getProducts({ productIdentifiers:billPacks().map(billId), productType:"inapp" });
    for(const pr of products || []) if(pr.priceString) BILL.prices[pr.identifier] = pr.priceString;
  }catch(e){}
  try{
    const { purchases } = await NP.getPurchases({ productType:"inapp" });
    for(const t of purchases || []){
      if(t.purchaseState && t.purchaseState !== "1") continue;
      const pack = billPacks().find(p => billId(p) === t.productIdentifier); if(!pack) continue;
      if(pack.noAds === Infinity){ if(state.shop.noAds !== "forever"){ adFreeGrant(Infinity); save(); toast(__("♾️ 광고 제거 무제한 구매 내역을 되살렸습니다"), true); } }
      else if(t.purchaseToken){                                    /* 지급 전에 앱이 꺼진 소모성 결제: 지급하고 소진한다 */
        try{ await NP.consumePurchase({ purchaseToken:t.purchaseToken }); buyPackGrant(pack); }catch(e){}
      }
    }
  }catch(e){}
  if(typeof modalKind !== "undefined" && modalKind === "shop") openShop();      /* 가격이 들어왔으니 상점을 다시 그린다 */
}
window.addEventListener("load", () => setTimeout(billInit, 700));
