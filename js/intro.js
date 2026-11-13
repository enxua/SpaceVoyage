"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 처음 화면 연출 ══════════════════
   · 별 흐름: 화면 가운데(제목 쪽)에서 별이 천천히 다가온다. 깊이가 다른 별 세 겹.
   · 계기: 경과 시간 · 적색편이 숫자가 흐른다 (HUD 장식, 번역할 문구 없음)
   · 발진: 별이 빛줄기로 늘어나며 가속 → 하얗게 번진 뒤 게임 시작
   처음 화면이 보일 때만 돈다. 화면을 닫으면 그리기를 멈춘다. */
const INTRO = { on:false, cx:null, w:0, h:0, dpr:1, stars:[], speed:0.35, target:0.35, last:0, born:0, launching:false };
const INTRO_STILL = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const INTRO_TINTS = ["255,255,255", "255,255,255", "255,255,255", "190,215,255", "255,225,190", "160,200,255"];

function introStar(spread){
  const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * 1.2;
  return { x:Math.cos(a) * r, y:Math.sin(a) * r, z:spread ? 0.05 + Math.random() : 1,
    tint:INTRO_TINTS[(Math.random() * INTRO_TINTS.length) | 0], tw:Math.random() * 6.3, px:null, py:null };
}
function introResize(){
  const cv = $("introSky"); if(!cv) return;
  INTRO.dpr = Math.min(2, window.devicePixelRatio || 1);
  INTRO.w = cv.clientWidth; INTRO.h = cv.clientHeight;
  cv.width = Math.round(INTRO.w * INTRO.dpr); cv.height = Math.round(INTRO.h * INTRO.dpr);
  INTRO.cx = cv.getContext("2d"); INTRO.cx.setTransform(INTRO.dpr, 0, 0, INTRO.dpr, 0, 0);
  const n = Math.round(Math.min(520, Math.max(220, INTRO.w * INTRO.h / 2600)));
  while(INTRO.stars.length < n) INTRO.stars.push(introStar(true));
  INTRO.stars.length = n;
}
function introFrame(now){
  if(!INTRO.on) return;
  const dt = Math.min(0.05, (now - (INTRO.last || now)) / 1000); INTRO.last = now;
  INTRO.speed += (INTRO.target - INTRO.speed) * Math.min(1, dt * (INTRO.launching ? 2.2 : 1.5));
  const { cx, w, h } = INTRO, ox = w / 2, oy = h * 0.4, f = Math.max(w, h) * 0.55;
  cx.globalCompositeOperation = "source-over"; cx.clearRect(0, 0, w, h);
  cx.globalCompositeOperation = "lighter";
  const t = now / 1000;
  for(const s of INTRO.stars){
    s.z -= dt * 0.06 * INTRO.speed;
    if(s.z <= 0.02){ Object.assign(s, introStar(false)); continue; }
    const sx = ox + s.x / s.z * f * 0.5, sy = oy + s.y / s.z * f * 0.5;
    if(sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40){ Object.assign(s, introStar(false)); continue; }
    const near = 1 - s.z, size = 0.35 + near * near * 2.2;
    const tw = INTRO.launching ? 1 : 0.65 + 0.35 * Math.sin(t * 2.2 + s.tw);
    const alpha = Math.min(1, (0.15 + near * 1.1) * tw);
    if(s.px !== null && INTRO.speed > 0.8){                    /* 빠를수록 꼬리가 길어진다 */
      cx.strokeStyle = `rgba(${s.tint},${alpha})`; cx.lineWidth = size;
      cx.beginPath(); cx.moveTo(s.px, s.py); cx.lineTo(sx, sy); cx.stroke();
    } else {
      cx.fillStyle = `rgba(${s.tint},${alpha})`;
      cx.beginPath(); cx.arc(sx, sy, size, 0, 6.2832); cx.fill();
      if(size > 1.6){ cx.fillStyle = `rgba(${s.tint},${alpha * 0.15})`; cx.beginPath(); cx.arc(sx, sy, size * 3, 0, 6.2832); cx.fill(); }
    }
    s.px = sx; s.py = sy;
  }
  introHud(now);
  requestAnimationFrame(introFrame);
}
/* 계기 숫자: 경과 시간과 적색편이(멀리 갈수록 커지는 값)를 흘려 보낸다 */
function introHud(now){
  const el = $("introT"), ez = $("introZ"); if(!el) return;
  const s = Math.floor((now - INTRO.born) / 1000), p = n => String(n).padStart(2, "0");
  el.textContent = `T+ ${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  const z = INTRO.launching ? (now - INTRO.launchAt) / 1000 * 4 : 0.0001 * Math.sin(now / 900) + 0.0001;
  ez.textContent = "z " + Math.max(0, z).toFixed(4);
}
function introStart(){
  const el = $("intro"); if(!el || el.style.display === "none") return;
  INTRO.born = performance.now(); INTRO.on = true;
  introResize(); window.addEventListener("resize", introResize);
  if(INTRO_STILL){ INTRO.speed = INTRO.target = 0.05; }
  requestAnimationFrame(introFrame);
}
function introStop(){ INTRO.on = false; window.removeEventListener("resize", introResize); }

/* 발진 버튼: 가속 연출 뒤 게임 시작 */
function introLaunch(){
  if(INTRO.launching) return;
  const el = $("intro");
  if(INTRO_STILL || !INTRO.on){ introStop(); startGame(); return; }
  INTRO.launching = true; INTRO.launchAt = performance.now(); INTRO.target = 60;
  el.classList.add("launch"); sfx("warp");
  setTimeout(()=>{
    introStop(); startGame(true);
    el.style.display = ""; void el.offsetWidth; el.classList.add("gone");           /* 하얀 빛이 걷히며 게임 화면이 드러난다 */
    setTimeout(()=>{ el.style.display = "none"; el.classList.remove("launch", "gone"); }, 650);
  }, 1350);
}
window.addEventListener("load", ()=> setTimeout(introStart, 0));
