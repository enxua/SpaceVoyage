"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 변조 방지 ══════════════════
   1) 재화(크레딧·보석·연구 데이터)는 메모리에 원래 숫자 그대로 두지 않는다.
      임의의 값으로 섞어 두고 검사값을 함께 들고 있다가, 누가 메모리를 직접 고치면 검사값이 어긋나 원래 값으로 되돌린다.
   2) 세이브에 서명을 붙인다. 저장소를 손으로 고치면 서명이 맞지 않아 직전 정상 세이브로 되돌린다.
   3) 시계 두 개(성능 시계·벽시계)를 견주어 속도 조작(스피드핵)을 잡는다.
   ※ 기기 안에서만 도는 게임이라 완벽히 막을 수는 없다. 진짜 결제·랭킹을 붙이면 서버 검증이 필요하다. */
const GUARD_KEYS = ["gold", "gems", "sci"];
const GUARD_SALT = "vY9#s!q2-" + "Δ7xk" + (31*7+5);          /* 서명용 비밀 문자열 (코드 안에 흩어 둔다) */
let guardTrips = 0;

/* 32비트 해시 두 개를 이어 붙인 서명 */
function guardHash(str){
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for(let i=0;i<str.length;i++){ const c = str.charCodeAt(i);
    a ^= c; a = Math.imul(a, 0x01000193);
    b ^= c + i; b = Math.imul(b, 0x5bd1e995); b ^= b >>> 13; }
  return (a>>>0).toString(36) + "." + (b>>>0).toString(36);
}
const guardSign = json => guardHash(GUARD_SALT + json + GUARD_SALT.length);

/* ── 1) 재화 감싸기 ── */
function guardArm(s){
  if(!s) return;
  for(const key of GUARD_KEYS){
    const d = Object.getOwnPropertyDescriptor(s, key);
    if(d && d.get) continue;                                   /* 이미 감쌌다 */
    const mul = 3 + Math.random()*7, off = Math.random()*1e6;  /* 값마다 다른 섞는 방법 */
    let enc = 0, chk = "", bak = 0;
    const pack = x => (x + off) * mul, unpack = y => y/mul - off;
    const put = x => { x = Number(x); if(!isFinite(x)) x = 0;
      enc = pack(x); bak = pack(x) + 0; chk = guardHash(String(Math.round(x*1000)) + key + off); };
    put(d ? d.value : 0);
    Object.defineProperty(s, key, { enumerable:true, configurable:true,
      get(){
        let x = unpack(enc); x = Math.round(x*1000)/1000;
        if(guardHash(String(Math.round(x*1000)) + key + off) !== chk){   /* 메모리가 직접 고쳐졌다 */
          x = Math.round(unpack(bak)*1000)/1000; enc = bak; guardTrip(key);
        }
        return x;
      },
      set(v){ put(v); } });
  }
}
function guardTrip(what){
  guardTrips++;
  if(guardTrips <= 3 && typeof toast === "function") toast(__("⚠️ 비정상적인 값 변경이 감지되어 되돌렸습니다"));
}

/* ── 2) 세이브 서명 ── */
function guardSaveSig(json){ try{ localStorage.setItem("voyage_space_sig", guardSign(json)); }catch(e){} }
/* 읽은 세이브를 믿어도 되는지: 서명이 없으면(예전 세이브) 한 번은 믿고, 있으면 맞아야 한다 */
function guardCheck(raw, sigKey){
  let sig = null; try{ sig = localStorage.getItem(sigKey); }catch(e){}
  if(sig == null) return "unsigned";
  return sig === guardSign(raw) ? "ok" : "bad";
}

/* ── 3) 속도 조작 감지 ── */
const guardClock = { p:performance.now(), d:Date.now(), bad:0 };
setInterval(()=>{
  const p = performance.now(), d = Date.now(), dp = p - guardClock.p, dd = d - guardClock.d;
  guardClock.p = p; guardClock.d = d;
  if(dd < 500 || dd > 20000) return;                            /* 잠들었다 깨어난 경우 등은 건너뛴다 */
  const r = dp / dd;
  guardClock.bad = (r > 1.35 || r < 0.65) ? guardClock.bad + 1 : 0;
  if(guardClock.bad >= 3 && typeof paused !== "undefined" && !paused){
    paused = true; guardClock.bad = 0;
    if(typeof toast === "function") toast(__("⚠️ 게임 속도 조작이 감지되어 일시 정지했습니다. 화면을 누르면 이어집니다"));
    const resume = () => { paused = false; document.removeEventListener("pointerdown", resume, true); };
    document.addEventListener("pointerdown", resume, true);
  }
}, 3000);

/* 주기적으로 재화를 읽어서 메모리 변조를 빨리 잡는다 */
setInterval(()=>{ if(typeof state !== "undefined" && state) for(const k of GUARD_KEYS) void state[k]; }, 2000);
