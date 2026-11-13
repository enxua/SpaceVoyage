"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 다국어 ══════════════════
   · 게임 문구는 코드에 한국어로 쓰고 __`…` 또는 __("…") 로 감싼다. 실행 중에 선택한 언어의 번역문으로 바뀐다.
   · 번역문은 js/lang/<언어>.js 의 표: "한국어 원문(자리표시 {0},{1}…)" → "번역문"
   · 번역이 없는 문구는 영어 → 한국어 순으로 대신 보여 준다.
   · 처음 시작할 때는 접속 위치(시간대)와 기기 언어로 기본 언어를 고르고, 한 번 고른 언어는 기억한다.
   · 언어를 바꾸면 저장 후 화면을 새로 불러온다(모든 문구가 한 번에 바뀐다).
   새 문구를 추가했으면 tools/i18n.js 로 tag → extract → 번역 추가 → check 를 돌린다. */
const LANGS = [["en","English"],["es","Español"],["fr","Français"],["it","Italiano"],["pt","Português"],["ko","한국어"],["ja","日本語"],["zhs","简体中文"],["zht","繁體中文"]];
const I18N = {};                               /* I18N.en = { 원문: 번역 } - js/lang/*.js 가 채운다 */
const LANG_KEY = "voyage_lang";

/* 접속 위치 추정: 기기의 시간대 → 그 지역의 언어 (외부 서버에 묻지 않는다) */
const TZ_LANG = {
  "Asia/Seoul":"ko", "Asia/Pyongyang":"ko", "Asia/Tokyo":"ja",
  "Asia/Shanghai":"zhs", "Asia/Chongqing":"zhs", "Asia/Harbin":"zhs", "Asia/Urumqi":"zhs", "Asia/Kashgar":"zhs",
  "Asia/Taipei":"zht", "Asia/Hong_Kong":"zht", "Asia/Macau":"zht",
  "Europe/Paris":"fr", "Europe/Monaco":"fr", "Europe/Rome":"it", "Europe/Vatican":"it", "Europe/San_Marino":"it",
  "Europe/Madrid":"es", "Atlantic/Canary":"es", "Africa/Ceuta":"es", "Europe/Lisbon":"pt", "Atlantic/Madeira":"pt", "Atlantic/Azores":"pt",
};
const TZ_PT = ["Sao_Paulo","Bahia","Fortaleza","Recife","Belem","Manaus","Cuiaba","Campo_Grande","Porto_Velho","Boa_Vista","Rio_Branco","Maceio","Araguaina","Santarem","Noronha","Eirunepe"];
const TZ_ES = ["Mexico_City","Cancun","Monterrey","Merida","Tijuana","Chihuahua","Hermosillo","Mazatlan","Bogota","Lima","Santiago","Caracas","Guayaquil","La_Paz","Asuncion",
  "Montevideo","Panama","Costa_Rica","Guatemala","El_Salvador","Tegucigalpa","Managua","Havana","Santo_Domingo","Puerto_Rico","Punta_Arenas"];
function detectLang(){
  try{
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if(TZ_LANG[tz]) return TZ_LANG[tz];
    if(tz.startsWith("America/")){ const c = tz.slice(8);
      if(TZ_PT.includes(c)) return "pt";
      if(TZ_ES.includes(c) || c.startsWith("Argentina/")) return "es"; }
  }catch(e){}
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
  for(const raw of list){ const l = String(raw).toLowerCase();
    if(l.startsWith("zh")) return /tw|hk|mo|hant/.test(l) ? "zht" : "zhs";
    for(const c of ["ko","ja","es","fr","it","pt","en"]) if(l.startsWith(c)) return c; }
  return "en";
}
let LANG_SAVED = null;
try{ LANG_SAVED = localStorage.getItem(LANG_KEY); }catch(e){}
const LANG = LANGS.some(l=>l[0] === LANG_SAVED) ? LANG_SAVED : detectLang();
const LANG_FIRST = !LANG_SAVED;                /* 아직 고른 적 없음 → 처음 화면에서 언어를 보여 준다 */
document.documentElement.lang = { zhs:"zh-Hans", zht:"zh-Hant" }[LANG] || LANG;
/* 번역 표를 게임 코드보다 먼저 불러온다 (선택 언어 + 대신 보여 줄 영어) */
if(LANG !== "ko"){ document.write('<script src="js/lang/' + LANG + '.js"><\/script>'); if(LANG !== "en") document.write('<script src="js/lang/en.js"><\/script>'); }

const I18N_MISSING = new Set();                /* 번역이 없어 원문으로 나간 문구 (개발 확인용: i18nMissing()) */
function __(s, ...v){
  const cur = I18N[LANG], fb = I18N.en;
  if(typeof s === "string"){
    if(LANG === "ko") return s;
    const r = (cur && cur[s]) || (fb && fb[s]); if(r === undefined) I18N_MISSING.add(s); return r === undefined ? s : r;
  }
  if(LANG === "ko"){ let o = s[0]; for(let i=1;i<s.length;i++) o += v[i-1] + s[i]; return o; }
  let key = s[0]; for(let i=1;i<s.length;i++) key += "{" + (i-1) + "}" + s[i];
  const tpl = (cur && cur[key]) || (fb && fb[key]);
  if(tpl === undefined){ I18N_MISSING.add(key); let o = s[0]; for(let i=1;i<s.length;i++) o += v[i-1] + s[i]; return o; }
  return tpl.replace(/\{(\d+)\}/g, (m, i) => v[i] === undefined ? "" : v[i]);
}
function i18nMissing(){ return [...I18N_MISSING]; }
function setLang(code){
  if(!LANGS.some(l=>l[0] === code)) return;
  try{ localStorage.setItem(LANG_KEY, code); }catch(e){}
  if(code === LANG) return;
  try{ if(typeof save === "function" && typeof state !== "undefined" && state) save(); }catch(e){}
  location.reload();
}
const rememberLang = () => { try{ localStorage.setItem(LANG_KEY, LANG); }catch(e){} };

/* index.html 에 적힌 고정 문구: data-t(안쪽 내용) · data-t-title(title 속성) */
function i18nStatic(){
  if(LANG === "ko") return;
  for(const el of document.querySelectorAll("[data-t]")) el.innerHTML = __(el.innerHTML.trim().replace(/\s*\n\s*/g, "\n"));
  for(const el of document.querySelectorAll("[data-t-title]")) el.title = __(el.title);
  document.title = __("우주 끝까지: VOYAGE");
}
/* 언어 고르기 버튼 묶음 (처음 화면 · 설정 창) */
const langButtons = () => LANGS.map(([c, n]) => `<button class="langBtn ${c===LANG?"on":""}" onclick="setLang('${c}')">${n}</button>`).join("");

/* 하단 메뉴 글씨: 번역문이 길면 버튼 너비에 들어갈 때까지 글씨를 줄인다 */
function fitLabels(){
  /* 버튼 폭은 고정. 여러 낱말이면 줄을 바꾸고, 한 낱말이 폭보다 길 때만 그 낱말이 들어갈 만큼 글씨를 줄인다 */
  for(const el of document.querySelectorAll(".dockBtn span[data-t]")){
    el.style.fontSize = "";
    let fs = parseFloat(getComputedStyle(el).fontSize) || 11; const max = el.parentElement.clientWidth - 2;
    while(el.scrollWidth > max && fs > 7.5){ fs -= 0.5; el.style.fontSize = fs + "px"; }
  }
}
window.addEventListener("resize", () => setTimeout(fitLabels, 50));

/* 언어 바꾸기 창 (상단 도구 줄의 🌐 버튼) */
function openLang(){
  openModal("🌐 Language", (LANGS.find(l=>l[0] === LANG)||[])[1] || "", `<div class="langList">${langButtons()}</div>`, "lang");
}
