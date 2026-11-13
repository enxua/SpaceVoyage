"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 코어 ══════════════════ */
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString();
const R = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const dist = (a,b,c,d) => Math.hypot(c-a, d-b);
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const zoneOf = y => clamp(Math.floor((WORLD_H-y)/ZONE_H), 0, ZONE_N-1);

/* ── 상태 ── */
let state = null;
function freshState(){
  const e = BODY_MAP.earth;
  return {
    gold:1000, fuel:120, o2:120, hull:60, sci:0, day:0, lastPort:"earth", buff:null,
    aff:{}, affDone:{}, stars:{}, mates:[], rareCd:0, dens:{}, denRe:{},
    stats:{ sell:0, pulls:0, deaths:0, quests:0, wins:0, mined:0, sling:0 },
    quests:null, invest:{}, titles:[], title:null, mission:0,
    ships:{ shuttle:0 }, flagship:"shuttle", cargo:{}, crew:[],
    visited:["earth"], found:["earth","moon"], routes:[],
    tech:{ warp:0, tank:0, hull:0, gun:0, shield:0, scan:0, hold:0, scoop:0 }, maxZ:0,
    x:e.x, y:e.y, heading:-Math.PI/2, docked:"earth",
    starSeed:(Math.random()*1e9)|0, starsFound:[],
    shop:{ paid:0, count:{} }, vol:{ bgm:0.6, sfx:0.8 }, fx:{ shake:1, flash:true },
    gems:0, starCd:{}, posts:{}, story:{ seen:{}, flags:{} },                 /* 보석 / 별 재조사 가능 시점 */         /* 상점: 누적 결제액(원), 묶음별 구매 횟수 */
    intro:true, theme:"paper", mute:false, ended:false,
  };
}
function save(){ try{ state.docked = dockedAt; const j = JSON.stringify(state); localStorage.setItem("voyage_space_save", j); guardSaveSig(j); }catch(e){} }
let guardNotice = false;                                          /* 세이브 변조가 감지되어 되돌렸는지 */
function load(){
  const f = freshState();
  try{
    let raw = localStorage.getItem("voyage_space_save"), resetCash = false;
    if(raw && guardCheck(raw, "voyage_space_sig") === "bad"){       /* 저장소를 손으로 고쳤다 → 직전 정상 세이브로 */
      guardNotice = true;
      const bak = localStorage.getItem("voyage_space_backup");
      if(bak && guardCheck(bak, "voyage_space_backup_sig") === "ok") raw = bak; else resetCash = true;
    }
    if(raw){
      const s = JSON.parse(raw);
      if(resetCash){ const f0 = freshState(); s.gold = f0.gold; s.gems = f0.gems; }
      if(s.wiped){                                  /* 함대 전멸 → 새 게임 (소리·화면 설정과 결제 기록만 남긴다) */
        state = Object.assign(f, { theme:s.theme, mute:s.mute, vol:s.vol||f.vol, shop:s.shop||f.shop });
        guardArm(state); return true;
      }
      state = Object.assign(f, s);
      state.stats = Object.assign(freshState().stats, s.stats||{});
      state.tech = Object.assign(freshState().tech, s.tech||{});
      state.shop = Object.assign({ paid:0, count:{} }, s.shop||{});
      state.vol = Object.assign({ bgm:0.6, sfx:0.8 }, s.vol||{});
      state.fx = Object.assign({ shake:1, flash:true }, s.fx||{});
      try{ localStorage.setItem("voyage_space_backup", raw); localStorage.setItem("voyage_space_backup_sig", guardSign(raw)); }catch(e){}      /* 직전 세이브 사본 (복구용) */
      guardArm(state); return true;
    }
  }catch(e){
    /* 세이브를 읽다 실패하면 새 게임이 덮어쓰기 전에 원본을 따로 남겨 둔다 */
    try{ const raw = localStorage.getItem("voyage_space_save"); if(raw) localStorage.setItem("voyage_space_broken", raw); }catch(e2){}
    console.error(__("세이브를 읽지 못했습니다"), e);
  }
  state = f; guardArm(state); return false;
}

/* ── 테마 ── */
const THEMES = {
  paper:{ bg:"#faf9f7", line:"#d6d3cc", faint:"#e9e6e1", ink:"#b9b5ac", text:"#3a3a3a", sub:"#8a8680",
          acc:"#d96f32", star:"#cdc9c1", fog:"rgba(236,233,227,.86)", dark:false },
  dark: { bg:"#070a14", line:"#232e4d", faint:"#141c33", ink:"#55627f", text:"#e8ecf5", sub:"#8b96b0",
          acc:"#ff9d5c", star:"#c8d4f0", fog:"rgba(3,5,10,.84)", dark:true },
};
let T = THEMES.paper;

/* ── 실효 스탯 ── */
function bonus(){
  const b = { sell:0, buy:0, route:0, luck:0, salv:0, fuel:0, speed:0, atk:0, sci:0, crit:0 };
  const posts = state.posts || {};
  for(const id of state.crew){
    const n = CREW_MAP[id]; if(!n) continue;
    const post = POSTS.find(p=>posts[p.id] === id);
    const m = (1 + (state.aff[id]||0)/200) * starMult(id) * (post ? post.mult : IDLE_MULT);   /* 호감도 100 → +50%, 직위가 높을수록 크게 */
    for(const k in n.bonus) b[k] += n.bonus[k]*m;
  }
  for(const p of POSTS) if(posts[p.id]) for(const k in p.perk) b[k] += p.perk[k];   /* 직위 고유 효과 */
  if(state.title && ACHV_MAP[state.title]){ const t = ACHV_MAP[state.title].bonus; for(const k in t) b[k] += t[k]; }
  if(typeof fateBonus === "function") fateBonus(b);            /* 마스코트 · 끝까지 이은 인연 */
  return b;
}
const TANK_SCALE = 0.1;   /* 연료·산소 탱크 용량 축척 */
function eff(id){
  id = id || state.flagship;
  const s = SHIP_MAP[id], st = Math.min(state.ships[id]||0, 5), b = bonus(), t = state.tech;
  return {
    speed: s.speed*(1+SHIP_STAR*st)*(1+b.speed),
    cargo: Math.round(s.cargo*(1+0.15*t.hold)),
    fuel:  s.fuel*(1-0.05*st)*(1-Math.min(.6,b.fuel)),
    luck:  s.luck + b.luck,
    sup:   Math.max(1, Math.round(s.sup*(1+SHIP_STAR*st)*(1+0.12*t.tank)*TANK_SCALE)),
    hull:  Math.round(s.hull*(1+SHIP_STAR*st) + 25*t.hull),
    pow:   Math.round(GRADE_POW[s.g]*(1+SHIP_STAR*st) + t.gun*8 + b.atk),
    def:   Math.min(.6, t.shield*0.08),
    scan:  220*(1+0.2*t.scan),
    b,
  };
}
function mateCap(){ return POST_CAP[SHIP_MAP[state.flagship].g]; }   /* 임명 가능한 직위 수 */
function addSci(n){ n = Math.max(1, Math.round(n*(1+bonus().sci+0.12*state.tech.scan))); state.sci += n; return n; }
const cargoUsed = () => Object.values(state.cargo).reduce((a,b)=>a+b,0);
const lockY = () => WORLD_H - (state.tech.warp+1)*ZONE_H;
function dateStr(d){ const y = 2261 + Math.floor(d/365), dd = Math.floor(d%365); return __`${y}년 ${dd+1}일차`; }

/* 시세: 산지 ×0.55 / 수요지 ×1.6 / 그외 0.85~1.25, 주 산지 우주에서 멀수록 +10%씩 */
function goodPrice(pid, gid){
  const p = BODY_MAP[pid], g = GOOD_MAP[gid];
  const m = p.p.includes(gid) ? 0.55 : p.d.includes(gid) ? 1.6 : 0.85 + (hash(pid+gid)%41)/100;
  const far = 1 + 0.10*Math.abs(p.z - g.z);
  const season = 1 + 0.12*Math.sin(Math.floor(state.day/6)*0.9 + (hash(gid+pid)%63)/10);
  return Math.max(1, Math.round(g.base*m*far*season*TRADE_SCALE));
}
const investLv = pid => (pid && state.invest[pid]) || 0;

/* 효과음·BGM은 js/audio.js */

/* ══════════════════ 우주 지도 (정적 배경 굽기) ══════════════════ */
let worldCv = null;
const NEBS = BODIES.filter(b=>b.k==="neb");
function rgba(hex, a){
  const n = parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;
}
function glow(g, x,y,r, col, a){
  const gr = g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0, rgba(col,a)); gr.addColorStop(1, rgba(col,0));
  g.fillStyle = gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
}
function spiral(g, rnd, cx,cy, rad, tilt, rot, c1, c2, n){
  glow(g, cx,cy, rad*0.45, c1, T.dark?.75:.6);
  const cr = Math.cos(rot), sr = Math.sin(rot);
  for(let i=0;i<n;i++){
    const arm = i%2, t = Math.pow(rnd(),0.75), ang = arm*Math.PI + t*4.6 + (rnd()-.5)*0.55*(0.4+t);
    const rr = t*rad + (rnd()-.5)*rad*0.07, px = Math.cos(ang)*rr, py = Math.sin(ang)*rr*tilt;
    g.fillStyle = rgba(t<0.35?c1:c2, (T.dark?0.8:0.85)*(1-t*0.5));
    g.beginPath(); g.arc(cx+px*cr-py*sr, cy+px*sr+py*cr, 0.7+rnd()*1.5, 0, 7); g.fill();
  }
}
function drawBody(g, b, rnd){
  const x=b.x, y=b.y, r=b.r;
  g.save(); g.lineWidth = 1.2; g.strokeStyle = T.ink;
  switch(b.k){
    case "planet": case "gas": case "moon": {
      if(b.ring){ g.strokeStyle = rgba(b.c2,.9); g.lineWidth = 3; g.beginPath(); g.ellipse(x,y,r*1.9,r*0.55,-0.35,Math.PI*0.95,Math.PI*2.05); g.stroke(); }
      g.save(); g.beginPath(); g.arc(x,y,r,0,7); g.clip();
      g.fillStyle = b.c; g.fillRect(x-r,y-r,r*2,r*2);
      if(b.k==="gas"){ g.fillStyle = rgba(b.c2,.7); for(let i=-r;i<r;i+=r/2.6) g.fillRect(x-r, y+i+rnd()*2, r*2, r/5+rnd()*2); }
      else if(b.k==="planet"){ g.fillStyle = rgba(b.c2,.85);
        for(let i=0;i<4;i++){ g.beginPath(); g.ellipse(x+(rnd()-.5)*r*1.5, y+(rnd()-.5)*r*1.5, r*(.25+rnd()*.4), r*(.15+rnd()*.3), rnd()*3, 0, 7); g.fill(); } }
      else { g.fillStyle = "rgba(0,0,0,.12)"; for(let i=0;i<3;i++){ g.beginPath(); g.arc(x+(rnd()-.5)*r*1.2, y+(rnd()-.5)*r*1.2, r*.22, 0, 7); g.fill(); } }
      const sh = g.createLinearGradient(x-r,y-r,x+r,y+r); sh.addColorStop(0,"rgba(255,255,255,.3)"); sh.addColorStop(1,"rgba(0,0,0,.28)");
      g.fillStyle = sh; g.fillRect(x-r,y-r,r*2,r*2); g.restore();
      g.strokeStyle = T.dark ? "rgba(255,255,255,.25)" : "rgba(90,80,70,.45)"; g.lineWidth = 1.1;
      g.beginPath(); g.arc(x,y,r,0,7); g.stroke();
      if(b.ring){ g.strokeStyle = rgba(b.c2,.95); g.lineWidth = 3; g.beginPath(); g.ellipse(x,y,r*1.9,r*0.55,-0.35,-0.05,Math.PI*1.05); g.stroke(); }
      break; }
    case "star": {
      glow(g, x,y, r*2.6, b.c, T.dark?.55:.5);
      g.strokeStyle = rgba(b.c,.8); g.lineWidth = 1;
      for(let i=0;i<4;i++){ const a = i*Math.PI/2 + .3; g.beginPath();
        g.moveTo(x-Math.cos(a)*r*1.9, y-Math.sin(a)*r*1.9); g.lineTo(x+Math.cos(a)*r*1.9, y+Math.sin(a)*r*1.9); g.stroke(); }
      g.fillStyle = b.c; g.beginPath(); g.arc(x,y,r*0.55,0,7); g.fill();
      g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(x,y,r*0.28,0,7); g.fill();
      break; }
    case "neb": {
      for(let i=0;i<16;i++){ const a = rnd()*7, d = rnd()*r*0.8;
        glow(g, x+Math.cos(a)*d, y+Math.sin(a)*d*0.8, r*(.35+rnd()*.45), i%3?b.c:b.c2, T.dark?.3:.26); }
      g.fillStyle = T.dark ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.95)";
      for(let i=0;i<7;i++){ g.beginPath(); g.arc(x+(rnd()-.5)*r*1.3, y+(rnd()-.5)*r, .8+rnd()*1.2, 0, 7); g.fill(); }
      break; }
    case "gal": spiral(g, rnd, x,y, r, b.tilt||.6, rnd()*3, b.c, b.c2, Math.round(r*16)); break;
    case "ell": {
      g.save(); g.translate(x,y); g.rotate(rnd()*3); g.scale(1,.68);
      glow(g, 0,0, r*1.25, b.c, T.dark?.8:.75);
      g.fillStyle = rgba(b.c,.7); for(let i=0;i<r*2.2;i++){ const a=rnd()*7, d=Math.pow(rnd(),1.6)*r*1.1; g.beginPath(); g.arc(Math.cos(a)*d,Math.sin(a)*d,.5+rnd(),0,7); g.fill(); }
      if(b.dust){ g.strokeStyle = "rgba(70,45,30,.65)"; g.lineWidth = 4; g.beginPath(); g.moveTo(-r,2); g.quadraticCurveTo(0,-5,r,3); g.stroke(); }
      g.restore(); break; }
    case "clu": {
      glow(g, x,y, r*1.1, b.c, T.dark?.3:.35);
      for(let i=0;i<r*1.3;i++){ const a=rnd()*7, d=Math.pow(rnd(),1.4)*r;
        g.fillStyle = rgba(b.c, .55+rnd()*.45); g.beginPath();
        g.ellipse(x+Math.cos(a)*d, y+Math.sin(a)*d, 1+rnd()*2.4, .8+rnd()*1.4, rnd()*3, 0, 7); g.fill(); }
      break; }
    case "bh": {
      glow(g, x,y, r*3.4, "#ff9d5c", T.dark?.4:.35);
      g.strokeStyle = "#f0a25a"; g.lineWidth = 5; g.beginPath(); g.ellipse(x,y,r*1.9,r*0.6,-0.25,0,7); g.stroke();
      g.strokeStyle = "#ffd9a0"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x,y,r*2.3,r*0.75,-0.25,0,7); g.stroke();
      g.fillStyle = "#0b0806"; g.beginPath(); g.arc(x,y,r*0.85,0,7); g.fill();
      g.strokeStyle = "#f0a25a"; g.lineWidth = 2; g.beginPath(); g.arc(x,y,r*0.9,Math.PI*1.05,Math.PI*1.95); g.stroke();
      break; }
    case "stn": {
      g.strokeStyle = b.c; g.lineWidth = 2; g.beginPath(); g.arc(x,y,r,0,7); g.stroke();
      g.beginPath(); g.moveTo(x-r*1.5,y); g.lineTo(x+r*1.5,y); g.moveTo(x,y-r*1.5); g.lineTo(x,y+r*1.5); g.stroke();
      g.fillStyle = T.bg; g.beginPath(); g.arc(x,y,r*.5,0,7); g.fill(); g.stroke();
      break; }
    case "comet": {
      const gr = g.createLinearGradient(x,y,x+70,y-34); gr.addColorStop(0,rgba(b.c,.85)); gr.addColorStop(1,rgba(b.c,0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x,y-r*.7); g.lineTo(x+72,y-40); g.lineTo(x+66,y-22); g.lineTo(x,y+r*.7); g.fill();
      g.fillStyle = T.dark?"#fff":"#8fc3de"; g.beginPath(); g.arc(x,y,r*.7,0,7); g.fill();
      break; }
    case "probe": {
      g.strokeStyle = T.dark?"#cfd6e6":"#6a665f"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x,y,r,Math.PI*.15,Math.PI*.85,true); g.stroke();
      g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+r*1.6); g.moveTo(x-r*1.4,y+r*.9); g.lineTo(x+r*1.4,y+r*.9); g.stroke();
      break; }
    case "web": {
      for(let k=0;k<3;k++){ const a = rnd()*3.14, n = 26;
        for(let i=0;i<n;i++){ const t = (i/n-.5)*2, w = Math.sin(t*3+k)*r*.18;
          g.fillStyle = rgba(b.c, .5+rnd()*.5); g.beginPath();
          g.arc(x+Math.cos(a)*t*r - Math.sin(a)*w + (rnd()-.5)*8, y+Math.sin(a)*t*r + Math.cos(a)*w + (rnd()-.5)*8, .8+rnd()*2, 0, 7); g.fill(); } }
      glow(g, x,y, r*.6, b.c, .45);
      break; }
    case "cmb": {
      g.save(); g.beginPath(); g.ellipse(x,y,r*1.5,r*.85,0,0,7); g.clip();
      g.fillStyle = "#f2c79a"; g.fillRect(x-r*2,y-r,r*4,r*2);
      for(let i=0;i<70;i++){ g.fillStyle = [ "rgba(217,111,50,.55)","rgba(74,120,200,.5)","rgba(250,230,160,.6)" ][i%3];
        g.beginPath(); g.arc(x+(rnd()-.5)*r*3, y+(rnd()-.5)*r*1.7, 3+rnd()*7, 0, 7); g.fill(); }
      g.restore(); g.strokeStyle = T.ink; g.beginPath(); g.ellipse(x,y,r*1.5,r*.85,0,0,7); g.stroke();
      break; }
    case "bang": {
      glow(g, x,y, r*4.5, "#ff8a3a", .55); glow(g, x,y, r*2, "#ffb347", .8);
      g.strokeStyle = "rgba(255,200,140,.7)"; g.lineWidth = 1.2;
      for(let i=0;i<28;i++){ const a = i/28*6.283 + rnd()*.1, l = r*(1.6+rnd()*2); g.beginPath();
        g.moveTo(x+Math.cos(a)*r*.5, y+Math.sin(a)*r*.5); g.lineTo(x+Math.cos(a)*l, y+Math.sin(a)*l); g.stroke(); }
      g.fillStyle = "#fff6e6"; g.beginPath(); g.arc(x,y,r*.42,0,7); g.fill();
      break; }
  }
  g.restore();
}
function buildWorld(){
  /* 부드러운 원경(성운·거미줄·은하수)만 굽는다. 천체·별·경계선은 draw()에서 선명하게 그린다 */
  worldCv = worldCv || document.createElement("canvas");
  worldCv.width = WORLD_W; worldCv.height = WORLD_H;
  const g = worldCv.getContext("2d"), rnd = mulberry32(20261110);
  g.fillStyle = T.bg; g.fillRect(0,0,WORLD_W,WORLD_H);
  let gr = g.createLinearGradient(0,0,0,ZONE_H*1.6);
  gr.addColorStop(0, T.dark?"rgba(255,120,40,.6)":"rgba(238,140,80,.55)");
  gr.addColorStop(.45, T.dark?"rgba(200,80,30,.22)":"rgba(240,170,120,.22)"); gr.addColorStop(1,"rgba(255,140,60,0)");
  g.fillStyle = gr; g.fillRect(0,0,WORLD_W,ZONE_H*1.6);
  for(let i=0;i<260;i++){ const y = Math.pow(rnd(),1.8)*ZONE_H*0.9;
    g.fillStyle = `rgba(${i%2?255:210},${i%2?170:110},${i%2?110:60},${.05+rnd()*.12})`;
    g.beginPath(); g.arc(rnd()*WORLD_W, y, 10+rnd()*34, 0, 7); g.fill(); }
  const nodes = [];
  for(let i=0;i<120;i++) nodes.push([rnd()*WORLD_W, ZONE_H*0.75 + rnd()*ZONE_H*1.35]);
  g.lineCap = "round";
  for(const n of nodes){
    const near = nodes.filter(m=>m!==n).sort((a,b)=>dist(n[0],n[1],a[0],a[1])-dist(n[0],n[1],b[0],b[1])).slice(0,3);
    for(const m of near){
      g.strokeStyle = T.dark ? `rgba(255,140,70,${.16+rnd()*.2})` : `rgba(217,111,50,${.14+rnd()*.2})`;
      g.lineWidth = 1+rnd()*3.5; g.beginPath(); g.moveTo(n[0],n[1]);
      g.quadraticCurveTo((n[0]+m[0])/2+(rnd()-.5)*50, (n[1]+m[1])/2+(rnd()-.5)*50, m[0], m[1]); g.stroke();
    }
    glow(g, n[0],n[1], 9+rnd()*12, "#ffb070", .5);
  }
  for(let i=0;i<150;i++){ const x=rnd()*WORLD_W, y=ZONE_H*2+rnd()*ZONE_H*2.1, s=2+rnd()*6;
    g.fillStyle = rgba(["#e5a37f","#9aa9e0","#e5d6b0","#c9b6e5"][i%4], .3+rnd()*.4);
    g.beginPath(); g.ellipse(x,y,s,s*(.3+rnd()*.5),rnd()*3,0,7); g.fill(); }
  const my = ZY(2,.5);
  spiral(g, rnd, 1000,my, 430, .82, .5, T.dark?"#ffd9a0":"#e9a877", T.dark?"#9ab6ff":"#9aa9d8", 5200);
  g.fillStyle = rgba(T.dark?"#ffe6c0":"#f0b888", .5); g.save(); g.translate(1000,my); g.rotate(.5);
  g.beginPath(); g.ellipse(0,0,90,26,0,0,7); g.fill(); g.restore();
  for(let i=0;i<22;i++) glow(g, rnd()*WORLD_W, ZY(1,rnd()), 60+rnd()*120, ["#9ab6ff","#ffb38a","#c9b6e5"][i%3], T.dark?.07:.09);
  for(const bl of BELTS){ const y0 = ZY(bl.z,bl.f1), y1 = ZY(bl.z,bl.f0);
    for(let i=0;i<620;i++){ const x=rnd()*WORLD_W, y=y0+rnd()*(y1-y0), s=.8+rnd()*2.6;
      g.fillStyle = rgba(T.dark?"#a89f92":"#b5ada2", .4+rnd()*.5); g.beginPath();
      g.ellipse(x,y,s,s*(.6+rnd()*.4),rnd()*3,0,7); g.fill(); } }
  for(let i=0;i<500;i++){ g.fillStyle = rgba(T.dark?"#cfe3f5":"#b9c9d6", .3+rnd()*.5);
    g.beginPath(); g.arc(rnd()*WORLD_W, ZY(1,0)+(rnd()-.5)*70, .6+rnd()*1.6, 0, 7); g.fill(); }
}

/* ══════════════════ 캔버스 / 카메라 ══════════════════ */
const cv = $("sea"), ctx = cv.getContext("2d");
let W=0, H=0, DPR=1;
let cam = { x:1000, y:WORLD_H-200, s:10, follow:true };   /* 지도 10배 확대가 기본 */
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W*DPR; cv.height = H*DPR; cv.style.width = W+"px"; cv.style.height = H+"px";
}
window.addEventListener("resize", resize);
const toWorld = (sx,sy) => [ (sx-W/2)/cam.s + cam.x, (sy-H/2)/cam.s + cam.y ];
function setZoom(f){ cam.s = clamp(cam.s*f, 0.6, 30); }
const BASE_ZOOM = 10;      /* 기본 배율(100%) */
function recenter(){ cam.follow = true; cam.s = BASE_ZOOM; cam.x = state.x; cam.y = state.y; sfx("tap"); }   /* 내 함선으로 + 기본 배율 */
function resetZoom(){ cam.s = BASE_ZOOM; sfx("tap"); }   /* 배율만 100%로 */
let zoomShown = -1;

/* ══════════════════ 게임 오브젝트 ══════════════════ */
let sail = null;            /* {tx,ty,port,den} */
let dockedAt = null, cutDay = -1;
let paused = false, forcedModal = false;
let trail = [], salvages = [], signals = [], raiders = [];
let bobT = 0, hazT = 0, scanT = 0, evT = 0, evNext = 7, chkT = 0;
let hole = { in:null, min:1e9, hit:false };
let lowWarn = { f:false, o:false, h:false, sun:0 };
let floatTexts = [];        /* 지도 위 떠오르는 텍스트 */

function randSpot(z){
  for(let t=0;t<40;t++){
    const x = 60+Math.random()*(WORLD_W-120), y = ZY(z, 0.06+Math.random()*0.88);
    if(PORTS.some(p=>dist(x,y,p.x,p.y)<110)) continue;
    if(HOLES.some(h=>dist(x,y,BODY_MAP[h].x,BODY_MAP[h].y)<190)) continue;
    if(dist(x,y,BODY_MAP.sun.x,BODY_MAP.sun.y) < SUN_R+25) continue;
    return [x,y];
  }
  return [300, ZY(z,.5)];
}
function spawnAll(){
  salvages = []; signals = []; raiders = [];
  for(let z=0;z<ZONE_N;z++){
    for(let i=0;i<6;i++){ const [x,y] = randSpot(z); salvages.push({ x,y,z, a:Math.random()*6 }); }
    for(let i=0;i<3;i++){ const [x,y] = randSpot(z); signals.push({ x,y,z }); }
    for(let i=0;i<(z?7:5);i++){ const [x,y] = randSpot(z), [tx,ty] = randSpot(z), k = Math.random();
      raiders.push({ x,y,z,tx,ty, h:0, cd:0, fam: z ? (k<.5?"pirate":k<.75?"drone":"alien") : (k<.7?"pirate":"drone"), pow:Math.round((16+z*25)*R(.75,1.25)) }); }
  }
}
/* ── 떠돌이 별: 항해마다 무작위 위치·이름. 기함 가까이에서만 보이고 멀어지면 사라진다 ── */
const STAR_PER_ZONE = 200;                      /* 7개 우주 × 200 = 1,400개 */
/* 별 이름 음절: 한국어는 한글, 그 밖의 언어는 로마자 (번역 대상이 아니다) */
const STAR_SYL = LANG === "ko"
  ? ["아","카","루","셀","노","미","라","오","벨","타","리","엔","솔","하","비","크","제","토","유","나","데","로","시","마","펠","이","케","란","휘","온"] /* i18n-skip */
  : ["a","ka","lu","sel","no","mi","ra","o","bel","ta","ri","en","sol","ha","vi","kor","ze","to","yu","na","de","lo","si","ma","pel","i","ke","ran","hui","on"];
const STAR_END = LANG === "ko" ? ["","","","스","르","온","아","엘","리스","투스"] /* i18n-skip */ : ["","","","s","r","on","a","el","is","tus"];
const STAR_COL = ["#ffb38a","#ffe08a","#bcd8ff","#ff8a5c","#cfe2ff","#ffd9a0","#a9c8ff","#ff9d7a"];
let wstars = [];
const starRange = () => 45*(1+0.2*state.tech.scan);
function genStars(){
  if(state.starVer !== 3){ state.starVer = 3; state.starsFound = []; }   /* 별 개수 변경 → 발견 기록 초기화 */
  const rnd = mulberry32(state.starSeed), used = new Set();
  const pick = a => a[Math.floor(rnd()*a.length)];
  wstars = [];
  for(let z=0; z<ZONE_N; z++) for(let i=0; i<STAR_PER_ZONE; i++){
    let x = 0, y = 0;
    for(let t=0; t<30; t++){
      x = 40+rnd()*(WORLD_W-80); y = ZY(z, 0.04+rnd()*0.92);
      if(!BODIES.some(b=>dist(x,y,b.x,b.y) < b.r*2.6+25) && !wstars.some(w=>dist(x,y,w.x,w.y) < 30)) break;
    }
    let name;
    do {
      name = pick(STAR_SYL)+pick(STAR_SYL)+(rnd()<0.55?pick(STAR_SYL):"")+pick(STAR_END);
      if(LANG !== "ko") name = name.charAt(0).toUpperCase()+name.slice(1);
      if(rnd() < 0.45) name += "-"+(1+Math.floor(rnd()*899));
    } while(used.has(name));
    used.add(name);
    wstars.push({ id:z*STAR_PER_ZONE+i, k:"star", x, y, z, r:1.6+rnd()*3.6, c:pick(STAR_COL), name });
  }
}
function floatText(x,y,txt,col){ floatTexts.push({ x,y,txt,col:col||T.acc,t:0 }); }

/* 출항 보급·수리: 부족분을 크레딧으로 자동 구매 (투자 기지는 할인) */
function resupply(){
  const st = eff(), p = BODY_MAP[dockedAt], lv = investLv(dockedAt);
  const zf = 1 + p.z*0.5, disc = lv>=5 ? 0 : 1 - lv*0.1;
  const needO = Math.max(0, st.sup-state.o2), needF = Math.max(0, st.sup-state.fuel), needH = Math.max(0, st.hull-state.hull);
  if(needO+needF+needH < 0.05) return;
  let budget = state.gold, cost = 0;
  const buy = (need, unit) => { const u = unit*zf*disc; const n = u>0 ? Math.min(need, budget/u) : need;
    budget -= n*u; cost += n*u; return n; };
  const o = buy(needO, O2_COST), f = buy(needF, FUEL_COST), h = buy(needH, REPAIR_COST);
  state.o2 += o; state.fuel += f; state.hull += h; cost = Math.round(cost); state.gold -= cost;
  if(o+f+h < needO+needF+needH-0.05) navSay(__("⚠️ 크레딧이 부족해 보급을 다 채우지 못하고 출항합니다!"), __("선장님, 크레딧이 부족해 보급을 다 채우지 못했습니다. <b>연료와 산소가 모자란 채로 출항</b>하니 먼 항해는 위험합니다."));
  else navSay(__`🧺 출항 보급 완료 · ⛽+${f.toFixed(1)} 🫧+${o.toFixed(1)}${h>=1?` 🛡+${fmt(h)}`:""} · −${fmt(cost)}💠${lv?__` (투자 할인 ${lv>=5?100:lv*10}%)`:""}`,
    `${__`출항 준비를 마쳤습니다. 연료 <b>+${f.toFixed(1)}</b>, 산소 <b>+${o.toFixed(1)}</b>${h>=1?`${__`, 선체 수리 <b>+${fmt(h)}</b>`}`:""}을(를) 채웠고 비용은 <b>${fmt(cost)}💠</b>입니다${lv?__` (투자 할인 ${lv>=5?100:lv*10}%)`:""}. 지금 탱크로 갈 수 있는 거리는 약 <b>${fmt(st.sup/st.fuel*100)}</b>입니다.`}`);
}
const EDGE_W = 9;
function edgeWrap(dir){
  state.x = dir < 0 ? WORLD_W-14 : 14; trail = []; rocks = []; cam.x = state.x; cam.y = state.y; cam.follow = true;
  FX.punch = 0.2; FX.trauma = 0.6; fxFlash("#b58cff", 0.45); fxRing(state.x, state.y, 0.5, 30, 0.9, "#b58cff", 4); sfx("warp");
  navSay(__("🌀 우주의 끝을 넘어 반대편 끝으로 나왔습니다"), __("🌀 우주의 끝을 넘어 반대편 끝으로 나왔습니다"), true);
  updateHUD(); save();
}
function requestSail(wx, wy, opt){
  opt = opt || {};
  if(paused) return false;
  /* 우주의 좌우 끝을 누르면 그 끝까지 가서 반대편 끝으로 나온다 */
  const wrap = !opt.port && !opt.den && opt.star == null ? (wx < EDGE_W ? -1 : wx > WORLD_W-EDGE_W ? 1 : 0) : 0;
  wx = clamp(wx, 20, WORLD_W-20); wy = clamp(wy, 20, WORLD_H-20);
  if(wrap){ wx = wrap < 0 ? 5 : WORLD_W-5; opt = Object.assign({}, opt, { wrap }); }
  const ly = lockY();
  if(wy < ly+12){
    const nz = state.tech.warp+1;
    navSay(__`🔒 ${ZONES[Math.min(nz,ZONE_N-1)].name} 진입에는 워프 드라이브 Mk.${nz} 연구가 필요합니다`,
      `${__`선장님, 저 너머는 <b>${ZONES[Math.min(nz,ZONE_N-1)].name}</b>입니다. 지금 엔진으로는 넘어갈 수 없습니다. <b>워프 드라이브 Mk.${nz}</b>을(를) 연구해야 합니다. 경계선 앞까지만 가겠습니다.`}`);
    wy = ly+12; opt = {};
  }
  { const sun = BODY_MAP.sun, dsun = dist(wx,wy,sun.x,sun.y);
    if(dsun < SUN_R+3){
      let a = dsun > 0.5 ? Math.atan2(wy-sun.y, wx-sun.x) : Math.atan2(state.y-sun.y, state.x-sun.x);
      wx = sun.x+Math.cos(a)*(SUN_R+3); wy = sun.y+Math.sin(a)*(SUN_R+3); opt = {};
      navSay(__("☀️ 태양 근처는 너무 뜨거워 접근할 수 없습니다. 안전 거리까지만 항해합니다"), __("태양 근처는 너무 뜨거워 선체가 버티지 못합니다. <b>안전 거리까지만</b> 접근하겠습니다, 선장님."));
    } }
  if(dist(state.x,state.y,wx,wy) < 0.4) return false;
  const from = dockedAt;
  const departing = !!dockedAt;
  if(dockedAt){ resupply(); dockedAt = null; }
  lowWarn.f = lowWarn.o = false;
  sail = { tx:wx, ty:wy, port:opt.port||null, den:opt.den||null, star:opt.star!=null?opt.star:null, wrap:opt.wrap||0, from };   /* from·port: 입출항 중인 천체의 위험은 면제 */
  cam.follow = true; sfx("depart"); if(from) fxDepart(); updateHUD();
  if(opt.den) cutTry("raid"); else if(departing) cutTry("depart");                                    /* 서비스 컷 */
  return true;
}
function flowDirAt(x,y,day){
  return (Math.sin(x*0.0038+day*0.55) + Math.cos(y*0.0043-day*0.4) + Math.sin((x+y)*0.0016+1.7)) * 1.05;
}
function flowFactor(){
  let f = 1 + Math.cos(flowDirAt(state.x,state.y,state.day) - state.heading)*0.22;
  if(state.buff){
    if(state.day < state.buff.until){ f *= state.buff.t==="boost" ? 1.4 : 0.7; }
    else state.buff = null;
  }
  return f;
}
function damage(n, why){
  n = Math.max(1, Math.round(n*(1-eff().def)));
  state.hull -= n; floatText(state.x, state.y, `−${n}🛡`, "#c8503c"); sfx("hit"); fxDamage(n, eff().hull);
  if(why) say(["doc","deck"], __`💥 ${why} (선체 −${n})`);
  if(state.hull <= 0){ state.hull = 0; gameOver("hull"); }
  else if(state.hull < eff().hull*0.4) cutTry("repair");               /* 서비스 컷: 크게 부서졌을 때 */
}

/* ══════════════════ 업데이트 ══════════════════ */
function update(rdt){
  bobT += rdt;
  for(const f of floatTexts) f.t += rdt;
  floatTexts = floatTexts.filter(f=>f.t<1.4);
  chkT += rdt; if(chkT > 1){ chkT = 0; if(!paused){ checkMissions(); checkAchievements(); } }
  if(paused || !sail) return;
  const dt = rdt*TIME_SCALE;          /* 항해·소모·사건은 모두 축척된 시간으로 흐른다 */
  const st = eff();
  let f = flowFactor(), fuelMul = 1;
  for(const b of NEBS) if(dist(state.x,state.y,b.x,b.y) < b.r+16){
    f *= 0.7; if(state.tech.scoop) state.fuel = Math.min(st.sup, state.fuel + state.tech.scoop*2.5*dt); }
  for(const v of VOIDS){ const b = BODY_MAP[v.id]; if(dist(state.x,state.y,b.x,b.y) < v.r) fuelMul = 1.5; }
  if(FX.boost > 0 && state.fuel > 0){ f *= BOOST_SPEED; fuelMul *= BOOST_FUEL; }
  f *= worldSpeedMul();                                        /* 이온 폭풍 안에서는 느려진다 */   /* 부스트 */
  if(state.fuel <= 0) f *= 0.18;      /* 연료 고갈 시 비상 추진: 정상 속도의 18% */
  const dx = sail.tx-state.x, dy = sail.ty-state.y, d = Math.hypot(dx,dy);
  const step = Math.min(d, st.speed*f*dt);
  if(d > 0.01){ state.heading = Math.atan2(dy,dx); state.x += dx/d*step; state.y += dy/d*step; }
  state.fuel = Math.max(0, state.fuel - st.fuel*step/100*fuelMul);
  state.day += dt/DAY_SEC; vipTick();
  if(Math.floor(state.day) !== cutDay){ if(cutDay >= 0){ const d = Math.floor(state.day); if(d > 0 && d % 30 === 0) cutTry("party") || cutTry("night"); else cutTry("night"); } cutDay = Math.floor(state.day); }   /* 서비스 컷: 항해 중 하루가 지날 때 */
  state.o2 = Math.max(0, state.o2 - O2_DAY*dt/DAY_SEC*(1-Math.min(.6,st.b.fuel)));
  for(const id of state.mates){ const a = state.aff[id]||0; if(a<100){ state.aff[id] = Math.min(100, a + dt/DAY_SEC*1.2); crewMoment(id); } }
  { const l = trail[trail.length-1]; if(!l || dist(l.x,l.y,state.x,state.y) > 0.3){ trail.push({ x:state.x, y:state.y }); if(trail.length > 90) trail.shift(); } }

  /* 경고 & 조난 */
  if(!lowWarn.f && state.fuel < st.sup*0.2){ lowWarn.f = true; cutTry("low"); state.fuel<=0 ? navSay(__("⛽ 연료 고갈! 비상 추진으로 겨우 움직입니다"), __("선장님, <b>연료가 바닥났습니다!</b> 비상 추진으로 겨우 움직이고 있습니다. 산소가 떨어지기 전에 가까운 기지에 닿아야 합니다."))
      : navSay(__("⚠️ 연료가 얼마 남지 않았습니다"), __("연료가 <b>20% 아래</b>로 떨어졌습니다. 가까운 기지로 뱃머리를 돌리는 것을 권합니다, 선장님.")); sfx("bad"); }
  if(!lowWarn.o && state.o2 < st.sup*0.2){ lowWarn.o = true; cutTry("low"); narrate(__("⚠️ 산소가 얼마 남지 않았습니다! 가까운 기지로!"), __("선장님, <b>산소가 얼마 남지 않았습니다!</b> 지금 바로 가장 가까운 기지로 가야 합니다."), false, ["doc","nav"]); sfx("bad"); }
  if(state.o2 <= 0){ gameOver("o2"); return; }

  /* 새 우주 진입 */
  const z = zoneOf(state.y);
  if(z > state.maxZ){ state.maxZ = z; const n = addSci(15*z); sfx("warp"); cutTry("zone");
    narrate(__`🌀 ${ZONES[z].name} 진입! - ${ZONES[z].desc} (🔬+${n})`, `${__`선장님, 드디어 <b>${ZONES[z].name}</b>에 들어섰습니다! ${ZONES[z].desc}입니다. 지도의 축척은 이제 ${ZONES[z].scale}입니다. <span class="acc">(🔬+${n})</span>`}`, true, ["nav","vice"]);
    fxZone(z); storyOnce("zone"+z); }

  /* 탐지: 천체 발견 */
  scanT += rdt;
  if(scanT > 0.25){ scanT = 0;
    const SR = starRange();
    for(const w of wstars){
      if(w.z > state.tech.warp || state.starsFound.includes(w.id) || dist(state.x,state.y,w.x,w.y) > SR) continue;
      state.starsFound.push(w.id); const n = addSci(1+w.z);
      floatText(w.x, w.y-w.r*2.4, __`✦ ${w.name} 발견 🔬+${n}`); sfx("blip"); fxStar(w);
    }
    for(const b of BODIES){
      if(b.z > state.tech.warp || state.found.includes(b.id)) continue;
      if(dist(state.x,state.y,b.x,b.y) < st.scan + b.r){
        state.found.push(b.id); const n = addSci((b.lm?10:4)*(b.z+1)); sfx("discover"); fxDiscover(b); cutTry("discover");
        narrate(__`🔭 ${b.name} 발견! 🔬+${n} - ${b.fact}`, `${__`선장님, <b>${b.name}</b>을(를) 포착했습니다! ${b.fact} <span class="acc">(🔬+${n})</span>`}`, true, ["sci","vice"]);
      }
    }
  }
  /* 표류물 · 미확인 신호 */
  for(const s of salvages) if(dist(state.x,state.y,s.x,s.y) < 5) pickSalvage(s, st);
  for(const s of signals) if(dist(state.x,state.y,s.x,s.y) < 6){
    const n = addSci(R(4,9)*(s.z+1)); floatText(s.x,s.y,`🔬+${n}`); sfx("ok"); fxPickup(s.x, s.y, "#4a90d9");
    say("sci", __`📡 미확인 신호 분석 완료 · 연구 데이터 +${n}`); [s.x,s.y] = randSpot(s.z); cutTry("signal"); }

  /* 위험 지대 */
  { const sun = BODY_MAP.sun, ox = state.x-sun.x, oy = state.y-sun.y, ds = Math.hypot(ox,oy);
    if(ds < SUN_R){                                 /* 태양 접근 금지: 경계선을 따라 우회 */
      const nx = ds > 0.01 ? ox/ds : 0, ny = ds > 0.01 ? oy/ds : 1;
      let tx = -ny, ty = nx; if(tx*dx+ty*dy < 0){ tx = -tx; ty = -ty; }
      state.x = sun.x+nx*SUN_R+tx*step; state.y = sun.y+ny*SUN_R+ty*step; state.heading = Math.atan2(ty,tx);
    } }
  hazT += dt;
  if(hazT >= 1){ hazT = 0;
    for(const bl of BELTS){
      if(state.y > ZY(bl.z,bl.f1) && state.y < ZY(bl.z,bl.f0)){
        if(Math.random() < 0.14 && cargoUsed() < st.cargo){ state.cargo.ore = (state.cargo.ore||0)+1; state.stats.mined++;
          floatText(state.x,state.y,__("⛏ 광석 +1")); sfx("coin"); }
      }
    }
  }
  for(const id of HOLES){
    if(sail.port === id || sail.from === id) continue;      /* 관측 궤도로 입출항 중 */
    const b = BODY_MAP[id], PR = 170, dh = dist(state.x,state.y,b.x,b.y);
    if(dh < PR){
      const pull = (1-dh/PR)*34*dt; state.x += (b.x-state.x)/dh*pull; state.y += (b.y-state.y)/dh*pull;
      hole.in = id; hole.min = Math.min(hole.min, dh);
      if(dh < b.r+8){
        const a = Math.atan2(state.y-b.y, state.x-b.x);
        state.x = b.x+Math.cos(a)*(PR+14); state.y = b.y+Math.sin(a)*(PR+14);
        sail = null; hole = { in:null, min:1e9 }; trail = [];
        damage(st.hull*0.4, __`${b.name}의 사건의 지평선에 스쳤습니다! 조석력에 선체가 찢깁니다`);
        updateHUD(); return;
      }
    } else if(hole.in === id){
      if(hole.min < 100){ state.buff = { t:"boost", until: state.day+2 }; state.stats.sling++; fxSwing(); sfx("warp");
        navSay(__("🌀 블랙홀 스윙바이 성공! 중력 도움으로 2일간 가속합니다"), __("<b>블랙홀 스윙바이 성공</b>입니다! 중력의 힘을 빌려 2일간 속도가 크게 오릅니다."), true); }
      hole = { in:null, min:1e9 };
    }
  }

  /* 해적 */
  const safe = PORTS.some(p=>dist(state.x,state.y,p.x,p.y) < 90);
  for(const r of raiders){
    if(r.z > state.tech.warp) continue;
    const dr = dist(state.x,state.y,r.x,r.y);
    const chase = !safe && state.day > r.cd && dr < 230;
    const gx = chase ? state.x : r.tx, gy = chase ? state.y : r.ty, v = chase ? 38+r.z*7 : 18;
    const dg = dist(r.x,r.y,gx,gy);
    if(dg < 6 && !chase){ [r.tx,r.ty] = randSpot(r.z); }
    else if(dg > 0.1){ r.h = Math.atan2(gy-r.y,gx-r.x); r.x += (gx-r.x)/dg*v*dt; r.y += (gy-r.y)/dg*v*dt; }
    if(chase && !r.chase) cutTry("chase");                              /* 서비스 컷: 추격 시작 */
    r.chase = chase;
    if(chase && dr < 3){ startCombat({ kind:"raider", ref:r, name:foeName(r.fam, r.pow), foe:foeKey(r.fam, r.pow), pow:r.pow, z:r.z, gems:r.fam==="alien"?1+Math.floor(r.z/2):0 }); return; }
  }

  /* 날아오는 소행성 · 우주 쓰레기 */
  if(updateRocks(rdt, st) && (paused || !sail)) return;

  /* 우주 현상 · 인연 */
  if(updateWorld(rdt, dt, st)) return;
  if(updateFate(rdt, dt, st)) return;

  /* 항해 이벤트 */
  evT += dt;
  if(evT > evNext){ evT = 0; evNext = R(6,12); rollEvent(st); if(paused || !sail) return; }

  /* 도착 */
  if(d - step < 0.05){
    const s = sail; sail = null;
    if(s.port) dock(s.port);
    else if(s.den) openRaid(s.den);
    else if(s.star != null){ save(); visitStar(s.star); cutTry("explore"); }
    else if(s.wrap) edgeWrap(s.wrap);
    else save();
  }
  updateHUD();
}
/* ══════════════════ 날아오는 소행성 · 우주 쓰레기 ══════════════════
   항해 중 화면 밖에서 날아와 함선 근처를 가로지른다. 맞으면 선체가 깎인다(방어막 연구로 줄어든다).
   다른 곳을 눌러 방향을 틀거나 부스트로 피한다. 소행성대·카이퍼 벨트에서는 훨씬 많이, 지구 근처에서는 쓰레기가 많이 나온다. */
let rocks = [], rockT = 0;
const ROCK_MAX = 48;
function inBelt(){ return BELTS.some(bl => state.y > ZY(bl.z,bl.f1) && state.y < ZY(bl.z,bl.f0)); }
function spawnRock(){
  const e = BODY_MAP.earth, nearEarth = zoneOf(state.y) === 0 && dist(state.x,state.y,e.x,e.y) < 160;
  const junk = !inBelt() && Math.random() < (nearEarth ? 0.75 : 0.25);
  /* 함선이 T초 뒤에 지나갈 자리(P)를 겨눠, 바로 그때 도착하도록 쏜다. 그대로 가면 스치거나 맞고, 방향을 틀면 피한다 */
  const st = eff(), sv = st.speed*TIME_SCALE*(FX.boost > 0 ? BOOST_SPEED : 1), T = R(6.5, 11), off = R(-10, 10);
  const px = state.x+Math.cos(state.heading)*sv*T-Math.sin(state.heading)*off, py = state.y+Math.sin(state.heading)*sv*T+Math.cos(state.heading)*off;
  const sp = R(2.6, 6.5), a = Math.random()*6.283, x = px+Math.cos(a)*sp*T, y = py+Math.sin(a)*sp*T;
  if(dist(x,y,BODY_MAP.sun.x,BODY_MAP.sun.y) < SUN_R+10 || dist(x,y,state.x,state.y) < 14) return;
  const tx = px, ty = py, d = dist(x,y,tx,ty), r = junk ? R(0.5,1.1) : R(0.6,2.1), verts = [];
  for(let i=0;i<8;i++) verts.push(0.68+Math.random()*0.5);
  rocks.push({ x, y, vx:(tx-x)/d*sp, vy:(ty-y)/d*sp, r, junk, rot:Math.random()*6.283, spin:R(-2.2,2.2)*(junk?1.8:1), verts, t:0, col:junk?"#8fa3b8":["#8d8478","#9a8c78","#7d7a74"][Math.floor(Math.random()*3)] });
}
/* 맞았으면 true (조난으로 항해가 끝났을 수 있다) */
function updateRocks(rdt, st){
  rockT += rdt;
  const every = inBelt() ? 0.43 : 1.33;
  if(rockT >= every){ rockT = 0; if(rocks.length < ROCK_MAX) spawnRock(); }
  let hit = false;
  for(const k of rocks){
    k.t += rdt; k.x += k.vx*rdt; k.y += k.vy*rdt; k.rot += k.spin*rdt;
    const d = dist(state.x,state.y,k.x,k.y);
    /* 이대로 가면 맞는지 미리 계산해 경고 표시에 쓴다 */
    const svx = Math.cos(state.heading)*st.speed*TIME_SCALE, svy = Math.sin(state.heading)*st.speed*TIME_SCALE;
    const rx = k.x-state.x, ry = k.y-state.y, rvx = k.vx-svx, rvy = k.vy-svy, vv = rvx*rvx+rvy*rvy;
    const tc = vv > 0.001 ? clamp(-(rx*rvx+ry*rvy)/vv, 0, 5) : 0;
    k.danger = Math.hypot(rx+rvx*tc, ry+rvy*tc) < k.r+1.6 && tc < 5 && d < 45;
    if(d < k.r+0.9){
      k.dead = true; hit = true;
      fxBurst(k.x, k.y, 14, k.col, 7, 0.6, 3, "dot");
      floatText(state.x, state.y-2, k.junk ? __("잔해 충돌!") : __("소행성 충돌!"), "#c8503c");
      damage(st.hull*(0.03+k.r*0.025), k.junk ? __("우주 쓰레기와 충돌했습니다") : __("소행성과 충돌했습니다"));
      if(sail) cutTry("rock");
      if(!sail) break;
    } else if(d > 130 || k.t > 45) k.dead = true;
  }
  rocks = rocks.filter(k => !k.dead);
  if(!state.rockHint && rocks.some(k => k.danger)){ state.rockHint = true;
    navSay(__("☄️ 소행성과 우주 쓰레기가 날아옵니다! 다른 곳을 눌러 방향을 틀거나 부스트로 피하세요"), __("선장님, 소행성과 우주 쓰레기가 날아옵니다! 붉게 표시된 것이 충돌 궤도입니다. 다른 곳을 눌러 방향을 틀거나 부스트로 피하십시오.")); }
  return hit;
}
function drawRocks(g, u, vis){
  for(const k of rocks){
    if(!vis(k.x, k.y, 6)) continue;
    /* 지나온 자취 */
    g.strokeStyle = rgba(k.col, .35); g.lineWidth = Math.max(u, k.r*0.5); g.lineCap = "round";
    g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(k.x-k.vx*0.5, k.y-k.vy*0.5); g.stroke();
    if(k.danger){ g.strokeStyle = rgba("#c8201a", .5+Math.sin(bobT*12)*.3); g.lineWidth = 1.6*u;
      g.beginPath(); g.arc(k.x, k.y, k.r+(5+Math.sin(bobT*12)*2)*u, 0, 7); g.stroke();
      g.setLineDash([3*u,4*u]); g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(k.x+k.vx*2.2, k.y+k.vy*2.2); g.stroke(); g.setLineDash([]); }
    g.save(); g.translate(k.x, k.y); g.rotate(k.rot);
    if(k.junk){                                  /* 우주 쓰레기: 부서진 위성 조각 */
      g.fillStyle = "#4a78c8"; g.strokeStyle = T.dark ? "#cfd6e6" : "#55504a"; g.lineWidth = Math.max(u*0.8, 0.06);
      g.fillRect(-k.r*1.5, -k.r*0.45, k.r*1.1, k.r*0.9); g.strokeRect(-k.r*1.5, -k.r*0.45, k.r*1.1, k.r*0.9);
      g.fillStyle = k.col; g.beginPath(); g.moveTo(-k.r*0.4,-k.r*0.5); g.lineTo(k.r*0.6,-k.r*0.35); g.lineTo(k.r*0.9,k.r*0.3); g.lineTo(-k.r*0.2,k.r*0.55); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(k.r*0.6,-k.r*0.35); g.lineTo(k.r*1.4,-k.r*0.9); g.stroke();
    } else {                                     /* 소행성: 울퉁불퉁한 바위 */
      g.fillStyle = k.col; g.strokeStyle = T.dark ? "rgba(255,255,255,.3)" : "rgba(70,60,50,.6)"; g.lineWidth = Math.max(u*0.8, 0.06);
      g.beginPath(); k.verts.forEach((m,i)=>{ const a = i/k.verts.length*6.283, px = Math.cos(a)*k.r*m, py = Math.sin(a)*k.r*m; i ? g.lineTo(px,py) : g.moveTo(px,py); }); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "rgba(0,0,0,.16)"; g.beginPath(); g.arc(k.r*0.2, -k.r*0.15, k.r*0.25, 0, 7); g.fill(); g.beginPath(); g.arc(-k.r*0.3, k.r*0.25, k.r*0.16, 0, 7); g.fill();
    }
    g.restore();
  }
}
function pickSalvage(s, st){
  const m = (s.z+1)*(1+st.b.salv);
  if(Math.random() < 0.3 && cargoUsed() < st.cargo){
    const pool = GOODS.filter(g=>g.z<=s.z+1), g = pool[Math.floor(Math.random()*pool.length)];
    const q = Math.min(st.cargo-cargoUsed(), 1+Math.floor(Math.random()*3));
    state.cargo[g.id] = (state.cargo[g.id]||0)+q; floatText(s.x,s.y,`${g.ic} ${g.name} +${q}`);
    say("cargo", __`📦 표류 화물 회수 - ${g.name} ${q}개`);
  } else {
    const c = Math.round(R(40,150)*m); state.gold += c; floatText(s.x,s.y,`💠+${c}`);
    say("cargo", __`📦 표류물 회수 - ${fmt(c)} 크레딧`);
  }
  sfx("coin"); fxPickup(s.x, s.y, "#e0a63f"); [s.x,s.y] = randSpot(s.z);
}
/* 적의 종류: 해적(크기 4단계) · 폭주 드론 · 외계 함선 · 현상금 사냥꾼. 생김새(함선 도안)와 색이 저마다 다르다 */
const FOES = {
  scout:  { art:"raider",  len:22, wid:12, col:"#3a2a2a", trim:"#c8503c", flame:"#ff5a3c" },
  corvet: { art:"corvet",  len:28, wid:14, col:"#3a2a2a", trim:"#d9603c", flame:"#ff5a3c" },
  cruiser:{ art:"destroy", len:36, wid:17, col:"#33211f", trim:"#e0503c", flame:"#ff7a3c" },
  flag:   { art:"dread",   len:46, wid:23, col:"#2b1a1a", trim:"#ff4a3c", flame:"#ffb03c" },
  drone:  { art:"probe",   len:18, wid:11, col:"#26303c", trim:"#5cc8ff", flame:"#5cc8ff" },
  hive:   { art:"science", len:38, wid:19, col:"#222b36", trim:"#5cc8ff", flame:"#9fe0ff" },
  alien:  { art:"phantom", len:30, wid:16, col:"#2a1f3d", trim:"#b58cff", flame:"#d7a6ff" },
  mother: { art:"levia",   len:48, wid:24, col:"#16302a", trim:"#5fe0a0", flame:"#9dffc8" },
  bounty: { art:"cutter",  len:30, wid:14, col:"#3a3020", trim:"#e0a63f", flame:"#ffd24a" },
};
const foeKey = (fam, p) => fam==="drone" ? (p<70?"drone":"hive") : fam==="alien" ? (p<90?"alien":"mother") : p<30 ? "scout" : p<70 ? "corvet" : p<130 ? "cruiser" : "flag";
const foeName = (fam, p) => fam==="drone" ? (p<70?__("폭주 드론 편대"):__("폭주 드론 모함")) : fam==="alien" ? (p<90?__("외계 약탈선"):__("외계 모함")) : raiderName(p);
function drawFoe(g, key, x,y,h, sc){ const f = FOES[key] || FOES.scout; drawShip(g, { id:f.art, len:f.len, wid:f.wid }, x,y,h, sc, true, f); }
const raiderName = p => p<30 ? __("해적 정찰선") : p<70 ? __("해적 코르벳") : p<130 ? __("해적 순양함") : __("해적 기함");

/* ── 승무원 호감도 이벤트 ── */
function crewMoment(id){
  if((state.aff[id]||0) >= 80 && !state.affDone[id]){
    state.affDone[id] = true; const n = CREW_MAP[id], gift = Math.round(n.cost*0.2);
    state.gold += gift; sfx("ok");
    toast(__`💞 ${n.name}: "${n.talk}" (선물 +${fmt(gift)}💠)`, true);
  }
}

/* ── 항해 이벤트 ── */
function rollEvent(st){
  const z = zoneOf(state.y), lk = clamp(st.luck/100, 0, .5);
  const E = [
    [10+lk*20, ()=>{ const c = Math.round(R(60,220)*(z+1)); state.gold += c; say("cargo", __`🛰 버려진 위성에서 부품을 회수했습니다 (+${fmt(c)}💠)`); sfx("coin"); }],
    [8+lk*14,  ()=>{ state.buff = { t:"boost", until:state.day+2 }; navSay(__("🌠 중력류를 탔습니다! 2일간 가속"), __("좋은 <b>중력류</b>를 탔습니다, 선장님! 2일간 속도가 오릅니다."), true); sfx("ok"); }],
    [7,        ()=>{ const n = addSci(R(2,5)*(z+1)); say("sci", __`🔭 항해 중 희귀 현상을 관측했습니다 (🔬+${n})`); sfx("ok"); }],
    [9-lk*8,   ()=>{ state.fuel = Math.max(0, state.fuel*0.92); navSay(__("☢️ 우주 방사선 폭풍! 차폐에 연료 8%를 소모했습니다"), __("<b>우주 방사선 폭풍</b>을 만났습니다. 차폐막을 올리느라 연료 8%를 썼습니다.")); sfx("bad"); }],
    [8-lk*8,   ()=>{ damage(R(4,9)+z*2, __("미소 유성체가 선체를 때렸습니다")); }],
    [6-lk*6,   ()=>{ state.buff = { t:"broken", until:state.day+1.5 }; narrate(__("🔧 엔진 이상! 1.5일간 감속합니다"), __("<b>엔진에 이상</b>이 생겼습니다. 고치는 1.5일 동안은 속도를 낼 수 없습니다."), false, ["eng","nav"]); sfx("bad"); }],
    [state.mates.length?8:0, ()=>{ const id = state.mates[Math.floor(Math.random()*state.mates.length)];
      state.aff[id] = Math.min(100,(state.aff[id]||0)+5); say("doc", __`💞 ${CREW_MAP[id].name}이(가) ${CREW_LINES[Math.floor(Math.random()*CREW_LINES.length)]} (호감도 +5)`); crewMoment(id); }],
    [7, ()=>choiceEvent("wreck", z, st)],
    [6, ()=>choiceEvent("sos", z, st)],
  ];
  let tot = 0; for(const e of E) tot += Math.max(0,e[0]);
  let r = Math.random()*tot;
  for(const e of E){ r -= Math.max(0,e[0]); if(r <= 0){ e[1](); break; } }
  updateHUD();
}
let pendingChoice = null;
function choiceEvent(kind, z, st){
  pendingChoice = { kind, z, luck:st.luck }; paused = true; forcedModal = true;
  if(kind === "wreck") openModal(__("🛸 난파선 발견"), ZONES[z].name, `
    <div class="card" style="text-align:center;padding:20px 14px"><div style="font-size:36px">🛸</div>
      <div class="stat" style="margin:10px 0">${__`정체불명의 난파선이 고요히 떠 있습니다.<br>화물이 남아 있을지도, 함정일지도 모릅니다.`}</div>
      <button class="btn orange wide" onclick="choiceAct(1)">${__`🔦 탐색한다 (성공률 ${Math.round(clamp(62+st.luck*.5,30,92))}%)`}</button>
      <button class="btn ghost wide" onclick="choiceAct(0)">${__`지나친다`}</button></div>`);
  else openModal(__("🆘 구조 신호"), ZONES[z].name, `
    <div class="card" style="text-align:center;padding:20px 14px"><div style="font-size:36px">🆘</div>
      <div class="stat" style="margin:10px 0">${__`희미한 구조 신호가 잡힙니다.<br>돕는다면 연료 8%를 나눠줘야 합니다.`}</div>
      <button class="btn orange wide" onclick="choiceAct(1)">${__`🤝 구조하러 간다`}</button>
      <button class="btn ghost wide" onclick="choiceAct(0)">${__`무시한다`}</button></div>`);
}
function choiceAct(yes){
  const c = pendingChoice; if(!c) return;
  pendingChoice = null; paused = false; forcedModal = false; closeModal();
  if(!yes) return;
  if(c.kind === "wreck"){
    if(Math.random()*100 < clamp(62+c.luck*.5,30,92)){
      const g = Math.round(R(200,600)*(c.z+1)); state.gold += g; const n = addSci(3*(c.z+1)); sfx("coin");
      say("cargo", __`🔦 난파선에서 ${fmt(g)}💠와 항해 기록(🔬+${n})을 찾았습니다!`, true);
    } else damage(eff().hull*0.15, __("함정이었습니다! 자폭 장치가 터졌습니다"));
  } else {
    state.fuel *= 0.92;
    if(Math.random() < 0.18){ toast(__("🏴‍☠️ 구조 신호는 해적의 미끼였습니다!"));
      startCombat({ kind:"raider", name:__("매복 해적선"), pow:Math.round((16+c.z*25)*R(.8,1.1)), z:c.z }); }
    else { const g = Math.round(R(150,400)*(c.z+1)), n = addSci(5*(c.z+1)); state.gold += g; sfx("ok");
      say("comm", __`🤝 조난자들이 사례금 ${fmt(g)}💠와 관측 자료(🔬+${n})를 건넸습니다`, true); }
  }
  updateHUD(); save();
}

/* ══════════════════ 떠돌이 별 방문 이벤트 ══════════════════
   발견한 별을 탭해 도착하면 무작위 사건이 일어난다. 같은 별은 STAR_CD일 뒤에 다시 조사할 수 있다. */
const STAR_CD = 3;
const ALIENS = [__("외계 포식체"),__("규소 군체"),__("공허 해파리"),__("결정 기생체"),__("플라스마 유령"),__("심우주 리바이어던")];
const starReady = w => state.day >= (state.starCd[w.id]||0);
function addGems(n, x, y){ state.gems += n; if(n >= 2) cutTry("lucky"); sfx("gem"); if(x != null) fxPickup(x, y, "#8e6fd8"); if(x != null) floatText(x, y, `💎+${n}`, "#8e6fd8"); return n; }
function visitStar(id){
  const w = wstars.find(x=>x.id===id); if(!w) return;
  if(!starReady(w)){
    say("sci", __`✦ ${w.name} - 이미 조사한 별입니다. ${Math.max(1,Math.ceil(state.starCd[id]-state.day))}일 뒤 다시 조사할 수 있습니다`); save(); return; }
  state.starCd[id] = state.day + STAR_CD; state.stats.stars = (state.stats.stars||0)+1;
  const st = eff(), z = w.z, lk = clamp(st.luck/100, 0, .5), N = `✦ ${w.name}`;
  const E = [
    /* 좋은 일 */
    [13+lk*10, ()=>{ const n = addGems(1+Math.floor(Math.random()*(2+z*0.5)), w.x, w.y); sfx("coin");
      say("cargo", __`${N} - 별의 잔해에서 반짝이는 보석 ${n}개를 찾았습니다 💎`, true); }],
    [11, ()=>{ state.fuel = st.sup; sfx("ok"); say("eng", __`${N} - 항성풍에서 연료를 가득 채집했습니다 ⛽`, true); }],
    [9,  ()=>{ state.o2 = st.sup; sfx("ok"); say("eng", __`${N} - 얼음 혜성을 녹여 산소를 가득 채웠습니다 🫧`, true); }],
    [8,  ()=>{ state.hull = st.hull; sfx("ok"); say("eng", __`${N} - 떠돌던 수리 드론 무리가 선체를 말끔히 고쳐 주었습니다 🛡`, true); }],
    [10, ()=>{ const n = addSci(R(6,14)*(z+1)); sfx("ok"); say("sci", __`${N} - 고대 문명의 관측 기록을 발견했습니다 (🔬+${n})`, true); }],
    [10+lk*8, ()=>{ const c = Math.round(R(150,500)*(z+1)); state.gold += c; sfx("coin"); say("cargo", __`${N} - 버려진 채굴 기지의 금고를 열었습니다 (+${fmt(c)}💠)`, true); }],
    [8,  ()=>{ const room = st.cargo-cargoUsed(); if(room < 1){ const c = Math.round(120*(z+1)); state.gold += c; say("cargo", __`${N} - 화물을 발견했지만 실을 곳이 없어 좌표만 팔았습니다 (+${fmt(c)}💠)`); return; }
      const pool = GOODS.filter(g=>g.z<=z+1), g = pool[Math.floor(Math.random()*pool.length)], q = Math.min(room, 2+Math.floor(Math.random()*5));
      state.cargo[g.id] = (state.cargo[g.id]||0)+q; sfx("coin"); say("cargo", __`${N} - 궤도를 도는 화물 컨테이너 회수: ${g.ic} ${g.name} ${q}개`, true); }],
    [6,  ()=>{ state.buff = { t:"boost", until:state.day+3 }; sfx("warp"); say("nav", __`${N} - 별의 중력으로 스윙바이! 3일간 가속합니다 🌠`, true); }],
    [state.mates.length?6:0, ()=>{ const m = state.mates[Math.floor(Math.random()*state.mates.length)];
      state.aff[m] = Math.min(100,(state.aff[m]||0)+8); sfx("ok"); say("doc", __`${N} - ${CREW_MAP[m].name}와(과) 별이 지는 모습을 함께 바라봤습니다 (호감도 +8) 💞`); crewMoment(m); }],
    [3+lk*4, ()=>{ const n = addSci(25*(z+1)), c = Math.round(800*(z+1)); state.gold += c; addGems(2, w.x, w.y); sfx("warp");
      say("sci", __`${N} - 생명이 살 수 있는 행성을 발견했습니다! 대발견 보상 +${fmt(c)}💠 🔬+${n} 💎+2`, true); }],
    [1.5+lk*2, ()=>{ sfx("warp"); say("cargo", __`${N} - 궤도에 버려진 함선을 인양했습니다! ${grantShip(Math.random()<0.7?"N":"R")}`, true); }],
    /* 나쁜 일 */
    [9-lk*6, ()=>{ damage(st.hull*R(.08,.16), __`${N} - 갑작스러운 항성 폭발에 휘말렸습니다`); }],
    [7-lk*6, ()=>{ state.fuel *= 0.75; sfx("bad"); say("eng", __`${N} - 강한 자기장에 연료 탱크가 새어 연료 25%를 잃었습니다`); }],
    [5-lk*4, ()=>{ state.buff = { t:"broken", until:state.day+1.5 }; sfx("bad"); say("eng", __`${N} - 방사선에 항법 장치가 고장났습니다. 1.5일간 감속`); }],
    /* 전투 · 선택 */
    [11, ()=>{ const name = ALIENS[Math.floor(Math.random()*ALIENS.length)];
      toast(__`${N} - 별 그림자에서 ${name}이(가) 덮쳐 옵니다!`);
      startCombat({ kind:"raider", alien:true, name, pow:Math.round((18+z*26)*R(.8,1.25)), z, gems:1+Math.floor(z/2) }); }],
    [8,  ()=>starChoice("merchant", w)],
    [7,  ()=>starChoice("signal", w)],
    [6,  ()=>starChoice("ruin", w)],
  ];
  let tot = 0; for(const e of E) tot += Math.max(0,e[0]);
  let r = Math.random()*tot;
  for(const e of E){ r -= Math.max(0,e[0]); if(r <= 0){ e[1](); break; } }
  checkAchievements(); updateHUD(); save();
}
let pendingStar = null;
function starChoice(kind, w){
  const z = w.z, st = eff();
  pendingStar = { kind, z, name:w.name, x:w.x, y:w.y, luck:st.luck }; paused = true; forcedModal = true;
  const card = (ic, txt, btns) => `<div class="card" style="text-align:center;padding:20px 14px"><div style="font-size:36px">${ic}</div>
    <div class="stat" style="margin:10px 0">${txt}</div>${btns}<button class="btn ghost wide" onclick="starChoiceAct(0)">${__`그냥 떠난다`}</button></div>`;
  if(kind === "merchant"){ const price = 6000*(z+1), fuelP = Math.round(15*(z+1));
    openModal(__("🛸 떠돌이 상인"), `✦ ${w.name}`, card("🛸", __("별 궤도에 정박한 떠돌이 상인이 손을 흔듭니다.<br>“좋은 물건이 있소. 구경이나 하시오.”"),
      `<button class="btn orange wide" ${state.gold<price?"disabled":""} onclick="starChoiceAct(1)">${__`💎 보석 2개를 산다 · ${fmt(price)}💠`}</button>
       <button class="btn wide" ${state.gold<fuelP?"disabled":""} onclick="starChoiceAct(2)">${__`⛽ 연료·산소를 가득 채운다 · ${fmt(fuelP)}💠`}</button>
       <button class="btn wide" ${cargoUsed()<1?"disabled":""} onclick="starChoiceAct(3)">${__`📦 화물을 전부 판다 (시세의 120%)`}</button>`)); }
  else if(kind === "signal"){
    openModal(__("📡 외계 신호"), `✦ ${w.name}`, card("📡", __("별에서 규칙적인 신호가 흘러나옵니다.<br>누군가 말을 걸고 있습니다. 친구일까요, 덫일까요?"),
      `<button class="btn orange wide" onclick="starChoiceAct(1)">${__`응답한다 (우호 확률 ${Math.round(clamp(55+st.luck*.5,30,90))}%)`}</button>`)); }
  else openModal(__("🏛 고대 유적"), `✦ ${w.name}`, card("🏛", __("별을 도는 거대한 구조물을 발견했습니다.<br>깊이 들어갈수록 보상도, 위험도 커집니다."),
      `<button class="btn orange wide" onclick="starChoiceAct(2)">${__`깊숙이 탐사한다 (성공 ${Math.round(clamp(45+st.luck*.5,25,85))}% · 큰 보상)`}</button>
       <button class="btn wide" onclick="starChoiceAct(1)">${__`입구만 조사한다 (안전 · 작은 보상)`}</button>`));
}
function starChoiceAct(n){
  const c = pendingStar; if(!c) return;
  pendingStar = null; paused = false; forcedModal = false; closeModal();
  const z = c.z, N = `✦ ${c.name}`;
  if(n){
    if(c.kind === "merchant"){
      if(n === 1){ state.gold -= 6000*(z+1); cutTry("market"); addGems(2, c.x, c.y); sfx("coin"); say("cargo", __`${N} - 상인에게서 보석 2개를 샀습니다 💎`, true); }
      else if(n === 2){ const st = eff(); state.gold -= Math.round(15*(z+1)); state.fuel = st.sup; state.o2 = st.sup; sfx("ok"); say("cargo", __`${N} - 연료와 산소를 가득 채웠습니다`, true); }
      else { let t = 0; for(const g of GOODS){ const q = state.cargo[g.id]||0; if(q) t += Math.max(1, Math.round(g.base*TRADE_SCALE*(1+0.1*Math.abs(z-g.z))*1.2*(1+bonus().sell)))*q; }
        state.cargo = {}; state.gold += t; state.stats.sell += t; sfx("coin"); say("cargo", __`${N} - 상인이 화물을 전부 사 갔습니다 (+${fmt(t)}💠)`, true); }
    } else if(c.kind === "signal"){
      cutTry("signal");
      if(Math.random()*100 < clamp(55+c.luck*.5,30,90)){ const g = addGems(1+Math.floor(Math.random()*2), c.x, c.y), s = addSci(10*(z+1)); sfx("warp");
        say("comm", __`${N} - 우호적인 외계 문명이 선물을 보냈습니다! 💎+${g} 🔬+${s}`, true); }
      else { toast(__`${N} - 신호는 사냥꾼의 미끼였습니다!`);
        startCombat({ kind:"raider", alien:true, name:ALIENS[Math.floor(Math.random()*ALIENS.length)], pow:Math.round((22+z*28)*R(.9,1.25)), z, gems:2+Math.floor(z/2) }); return; }
    } else {
      cutTry("ruins");                                                /* 서비스 컷: 유적 조사 */
      if(n === 1){ const s = addSci(5*(z+1)), g = Math.round(R(100,250)*(z+1)); state.gold += g; sfx("ok"); say("sci", __`${N} - 유적 입구에서 유물 조각을 챙겼습니다 (+${fmt(g)}💠 🔬+${s})`); }
      else if(Math.random()*100 < clamp(45+c.luck*.5,25,85)){ const s = addSci(18*(z+1)), g = Math.round(R(500,1200)*(z+1)), m = addGems(2+Math.floor(Math.random()*2), c.x, c.y); state.gold += g; sfx("warp");
        say("sci", __`${N} - 유적 심층부의 보물고를 찾았습니다! +${fmt(g)}💠 🔬+${s} 💎+${m}`, true); }
      else damage(eff().hull*0.25, __`${N} - 유적의 방어 장치가 깨어났습니다`);
    }
  }
  checkMissions(); checkAchievements(); updateHUD(); save();
}

/* ══════════════════ 전투 (턴제) ══════════════════ */
let combat = null;
function startCombat(o){
  if(!o.foe && !o.alien) o.foe = o.kind === "den" ? "flag" : foeKey("pirate", o.pow);
  const hp = Math.round(o.pow*1.7);
  combat = Object.assign({ ehp:hp, emax:hp, eatk:o.pow*0.2, charge:false, round:1,
    log:[__`${o.name}이(가) 포문을 엽니다!`] }, o);
  paused = true; forcedModal = true; sfx("alarm"); renderCombat();
}
function fleeChance(st){ return Math.round(clamp(38+(st.speed-55)*0.6+st.luck*0.4+state.mates.length*4, 15, 92)); }
function bribeCost(){ return Math.round(clamp(state.gold*0.1, 80, 600*(combat.z+1))); }
/* 전투 화면(renderCombat)과 행동(combatAct)은 js/fx.js - 움직이는 전투장 */
function endCombat(msg, won){
  const c = combat; combat = null; paused = false; forcedModal = false; closeModal();
  if(c.ref){ c.ref.cd = state.day+3; [c.ref.x,c.ref.y] = randSpot(c.ref.z); c.ref.pow = Math.round((16+c.ref.z*25)*R(.75,1.25)); }
  say(["deck","vice"], msg, won); updateHUD(); save();
  if(state.hull > 0 && state.hull < eff().hull*0.4) cutTry("repair"); else if(won && c.kind !== "den") cutTry("win");
}
function winCombat(){
  const c = combat; state.stats.wins++; sfx("explode");
  if(c.kind === "den"){
    const dn = DENS.find(d=>d.id===c.den); let msg;
    state.gold += c.gold; state.denRe[dn.id] = state.day; const n = addSci(12*(dn.z+1));
    if(c.remnant) msg = __`⚔️ ${dn.name} 잔당 소탕! +${fmt(c.gold)}💠 🔬+${n}`;
    else { state.dens[dn.id] = true; storyOnce("firstDen"); msg = __`⚔️ ${dn.name} 토벌 성공! +${fmt(c.gold)}💠 🔬+${n} · ${grantShip(dn.ship)}`;
      if(DENS.every(d=>state.dens[d.id])){ state.gold += DEN_CLEAR_GOLD; msg += __` · 🏆 모든 기지 토벌! +${fmt(DEN_CLEAR_GOLD)}💠`; } }
    sfx("warp"); endCombat(msg, true); adDouble(c.gold, 0); cutTry("den");
  } else {
    const g = Math.round((120+c.pow*8)*R(.8,1.3)), n = addSci(3*(c.z+1)); state.gold += g; sfx("coin");
    if(c.gems) state.gems += c.gems;
    if(c.mon) monSlain(c.mon);
    endCombat(c.alien ? __`👾 ${c.name} 격퇴! +${fmt(g)}💠 🔬+${n}${c.gems?` 💎+${c.gems}`:""}` : __`⚔️ 승리! 해적선을 나포해 ${fmt(g)}💠와 🔬+${n}을 획득했습니다`, true);
    adDouble(g, c.gems||0);
  }
}
function grantShip(g){
  const all = SHIPS.filter(s=>s.g===g), lack = all.filter(s=>!(s.id in state.ships)), pool = lack.length ? lack : all, s = pool[Math.floor(Math.random()*pool.length)];   /* 아직 없는 함선부터 */
  if(!(s.id in state.ships)){ state.ships[s.id] = 0; return __`🚀 새 함선 「${s.name}」 획득!`; }
  if(state.ships[s.id] < 5){ state.ships[s.id]++; return __`🚀 「${s.name}」 ★${state.ships[s.id]} 승성!`; }
  state.gold += shipRefund(); return __`🚀 「${s.name}」 중복 → +${fmt(shipRefund())}💠`;
}
const remnantReady = dn => state.day >= (state.denRe[dn.id]||0) + DEN_RESPAWN;
function openRaid(id){
  const dn = DENS.find(d=>d.id===id); if(!dn) return;
  const remnant = !!state.dens[id];
  if(remnant && !remnantReady(dn)){ say("deck", __`잔당 재집결까지 ${Math.max(1,Math.ceil((state.denRe[id]||0)+DEN_RESPAWN-state.day))}일 남았습니다`); return; }
  startCombat({ kind:"den", den:id, remnant, name:dn.name+(remnant?__(" 잔당"):""), z:dn.z,
    pow: remnant ? Math.round(dn.pow*0.6) : dn.pow, gold: remnant ? Math.round(dn.gold*0.4) : dn.gold });
}

/* ══════════════════ 입항 / 조난 / 엔딩 ══════════════════ */
function dock(id){
  const p = BODY_MAP[id];
  dockedAt = id; state.lastPort = id; state.x = p.x; state.y = p.y; trail = [];
  if(!state.found.includes(id)) state.found.push(id);
  const firstLand = !state.visited.includes(id);
  if(!state.visited.includes(id)){
    state.visited.push(id); const n = addSci(6*(p.z+1));
    narrate(__`⚓ ${p.name} 첫 입항! 🔬+${n} - ${p.fact}`, `${__`<b>${p.name}</b>에 처음 입항했습니다, 선장님. ${p.fact} 이곳의 특산품은 <b>${p.p.map(g=>GOOD_MAP[g].name).join(", ")}</b>, 비싸게 사 주는 것은 <b>${p.d.map(g=>GOOD_MAP[g].name).join(", ")}</b>입니다. <span class="acc">(🔬+${n})</span>`}`, true);
  } else narrate(__`⚓ ${p.name} 입항`, `${__`<b>${p.name}</b>에 입항했습니다. 특산품은 <b>${p.p.map(g=>GOOD_MAP[g].name).join(", ")}</b>, 수요가 높은 것은 <b>${p.d.map(g=>GOOD_MAP[g].name).join(", ")}</b>입니다.`}`);
  sfx("dock"); fxDock(p); rocks = [];
  storyOnce(id);                                              /* 이야기가 있는 기지(은하 중심·안드로메다·우주배경복사) */
  if(p.final && !state.ended){ state.ended = true; storyOnce("bigbang", showEnding); }
  else rollCrew();
  fateDock(id);
  if(!(p.final && state.ended)) firstLand ? cutTry("land") : (id === "earth" && cutTry("home")) || cutTry("rest");          /* 서비스 컷 */
  checkMissions(); checkAchievements(); updateHUD(); save();
}
/* 조난: 타고 있던 기함은 파괴된다. 남은 함선이 있으면 그중 가장 좋은 배가 새 기함이 되어 지구에서 다시 시작하고,
   마지막 한 척까지 잃으면 모든 진행을 잃고 처음부터 다시 시작한다. */
function gameOver(why){
  if($("gameover").style.display === "flex") return;
  paused = true; sail = null; combat = null; forcedModal = false; closeModal();
  state.stats.deaths++; rocks = [];
  const lost = SHIP_MAP[state.flagship]; adReviveSave(); adOfferHide();
  delete state.ships[lost.id]; state.cargo = {};                       /* 기함과 함께 화물도 사라진다 */
  state.routes = state.routes.filter(r=>r.ship !== lost.id);
  const rest = SHIPS.filter(x=>x.id in state.ships).reverse();         /* 등급 높은 순 */
  $("goTag").textContent = why==="hull" ? __("- 선체가 파괴되었습니다 -") : __("- 산소가 바닥났습니다 -");
  if(rest.length){
    const next = rest.find(x=>!state.routes.some(r=>r.ship===x.id)) || rest[0];
    const pulled = state.routes.some(r=>r.ship===next.id);
    state.routes = state.routes.filter(r=>r.ship !== next.id);        /* 항로를 돌던 배뿐이면 불러들인다 */
    state.flagship = next.id; syncPosts();
    $("goText").innerHTML = `${__`기함 <b>「${lost.name}」</b>은(는) 돌아오지 못했습니다. 싣고 있던 화물도 함께 사라졌습니다.<br>
      구조선이 승무원들을 고향 <b>지구</b>로 데려왔습니다.<br>
      남은 함선 <b>${rest.length}척</b> 가운데 <b>「${next.name}」</b>이(가) 새 기함이 됩니다${pulled?__(" (운항하던 항로는 닫힙니다)"):""}.<br>
      <b>승무원·크레딧·연구·발견 기록은 그대로입니다.</b>`}`;
    $("goBtn").textContent = __("지구에서 다시 시작");
  } else {
    state.wiped = true;
    $("goText").innerHTML = `${__`마지막 함선 <b>「${lost.name}」</b>마저 파괴되었습니다.<br>
      더는 띄울 배가 없습니다. 함대는 여기서 끝났습니다.<br>
      <b>모든 진행을 잃고 처음부터 다시 시작합니다.</b>`}`;
    $("goBtn").textContent = __("처음부터 다시 시작");
  }
  adReviveSetup();
  $("gameover").style.display = "flex"; sfx("over"); save();
}
function respawn(){
  goSnap = null;
  if(state.wiped){ save(); location.reload(); return; }                /* 전멸: load()가 새 게임으로 시작한다 */
  const p = BODY_MAP.earth, st = eff();
  state.lastPort = "earth"; state.x = p.x; state.y = p.y; state.buff = null; sail = null;
  state.fuel = st.sup; state.o2 = st.sup; state.hull = st.hull;
  dockedAt = p.id; trail = []; paused = false; cam.follow = true;
  $("gameover").style.display = "none";
  say("vice", __`🛟 지구로 귀환했습니다. 새 기함 「${SHIP_MAP[state.flagship].name}」의 출항 준비를 마쳤습니다`); storyOnce("loss"); updateHUD(); save(); cutTry("wreck");
}
function showEnding(){
  paused = true;
  $("endText").innerHTML = `${__`지구를 떠난 지 <b>${fmt(state.day)}일</b>.<br>
    당신의 함선은 마침내 시간과 공간이 시작된 한 점에 닿았습니다.<br>
    발견한 천체 <b>${state.found.length}/${BODIES.length}</b> · 전투 승리 <b>${state.stats.wins}</b>회 ·
    함께한 승무원 <b>${state.crew.length}</b>명<br><br>
    모든 별과 은하, 그리고 우리 자신이 바로 이 빛에서 태어났습니다.<br>
    <b>항해는 끝나지 않습니다.</b> 아직 발견하지 못한 우주가 기다립니다.`}`;
  $("ending").style.display = "flex"; sfx("warp");
}
function closeEnding(){ $("ending").style.display = "none"; paused = false; checkAchievements(); }

/* ══════════════════ 임무 · 업적 ══════════════════ */
function checkMissions(){
  let m;
  while((m = MISSIONS[state.mission]) && m.c(state)){
    state.gold += m.gold; state.sci += m.sci; state.mission++; sfx("fanfare"); adDouble(m.gold, 0); cutTry("mission");
    say("vice", __`🎯 임무 완료: ${m.t} (+${fmt(m.gold)}💠${m.sci?` 🔬+${m.sci}`:""})`, true);
    updateHUD();
  }
}
function checkAchievements(){
  for(const a of ACHV){
    if(state.titles.includes(a.id) || !a.cond(state)) continue;
    state.titles.push(a.id); state.gold += a.gold; sfx("fanfare");
    say("vice", __`🏅 업적 달성: 「${a.name}」 (+${fmt(a.gold)}💠) - 도감에서 칭호 장착 가능`, true); cutTry("achv");
  }
}

/* ══════════════════ 그리기 ══════════════════ */
const icons = {};
/* ── 함선 외형: 함선마다 고유한 설계도. 좌표는 길이·폭 대비 비율 (앞 +x, 위쪽 절반만 적고 좌우 대칭)
   부품: ["w",색,점들]=선체 아래 날개쌍  ["o",색,점들]=선체 위 부품쌍  ["m",색,점들]=중심축 대칭 부품  ["c",색,[x,y,반지름]]=원
   색: h 선체 · t 테두리색 · a 강조색 · g 유리 · p 태양전지 · s 돛(반투명)                                              ── */
const SHIP_ART = {
  /* N - 투박하고 단순한 작업선 */
  shuttle:{ hull:[[.5,0],[.3,-.2],[-.1,-.28],[-.5,-.22]], eng:[0],
    parts:[["w","h",[[-.05,-.25],[-.4,-.5],[-.5,-.5],[-.42,-.22]]], ["m","g",[[.38,0],[.28,-.1],[.15,-.1]]]] },
  tug:{ hull:[[.45,0],[.4,-.3],[-.2,-.34],[-.3,-.2],[-.5,-.2]], eng:[-.1,.1],
    parts:[["w","t",[[.5,-.2],[.64,-.44],[.4,-.34]]], ["m","g",[[.3,0],[.25,-.15],[.05,-.15]]], ["c","a",[-.1,0,.1]]] },
  barge:{ hull:[[.5,0],[.42,-.3],[-.5,-.3]], eng:[-.15,.15],
    parts:[["o","a",[[.25,-.3],[.25,-.48],[.02,-.48],[.02,-.3]]], ["o","t",[[-.05,-.3],[-.05,-.48],[-.3,-.48],[-.3,-.3]]],
           ["m","g",[[.45,0],[.4,-.12],[.3,-.12]]]] },
  probe:{ hull:[[.5,0],[.2,-.12],[-.5,-.1]], eng:[0],
    parts:[["w","p",[[.05,-.14],[.05,-.5],[-.2,-.5],[-.2,-.14]]], ["m","t",[[.5,0],[.42,-.24],[.36,-.24],[.4,0]]], ["c","a",[.05,0,.07]]] },
  /* R - 날렵해지고 강조색 줄무늬가 붙는다 */
  corvet:{ hull:[[.5,0],[.15,-.14],[-.2,-.2],[-.5,-.14]], eng:[-.08,.08],
    parts:[["w","h",[[.1,-.14],[-.35,-.5],[-.5,-.5],[-.3,-.18]]], ["m","a",[[.3,0],[.1,-.06],[-.4,-.06]]], ["m","g",[[.4,0],[.3,-.07],[.2,-.07]]]] },
  miner:{ hull:[[.35,0],[.3,-.3],[-.5,-.34]], eng:[-.2,0,.2],
    parts:[["m","a",[[.64,0],[.35,-.17]]], ["o","t",[[.1,-.34],[.05,-.5],[-.25,-.5],[-.3,-.34]]], ["m","g",[[.25,0],[.2,-.14],[.05,-.14]]],
           ["c","a",[-.25,0,.09]]] },
  cutter:{ hull:[[.5,0],[.1,-.1],[-.3,-.16],[-.5,-.1]], eng:[0],
    parts:[["w","a",[[.2,-.08],[.05,-.32],[-.02,-.32],[.02,-.1]]], ["w","h",[[-.3,-.16],[-.5,-.5],[-.56,-.5],[-.46,-.12]]],
           ["m","g",[[.38,0],[.28,-.05],[.16,-.05]]]] },
  hauler:{ hull:[[.5,0],[.4,-.18],[.25,-.2],[.25,-.1],[-.4,-.1],[-.4,-.24],[-.5,-.24]], eng:[-.14,.14],
    parts:[["o","a",[[.2,-.1],[.2,-.42],[.02,-.42],[.02,-.1]]], ["o","t",[[-.02,-.1],[-.02,-.42],[-.2,-.42],[-.2,-.1]]],
           ["o","a",[[-.24,-.1],[-.24,-.42],[-.38,-.42],[-.38,-.1]]], ["m","g",[[.44,0],[.38,-.09],[.3,-.09]]]] },
  /* SR - 다중 엔진, 무장·센서, 창문 불빛 */
  destroy:{ hull:[[.5,0],[.3,-.1],[.1,-.2],[-.3,-.26],[-.5,-.18]], eng:[-.12,0,.12],
    parts:[["w","h",[[0,-.2],[.22,-.52],[.1,-.52],[-.3,-.26]]], ["o","t",[[.38,-.3],[.38,-.36],[-.05,-.36],[-.05,-.3]]],
           ["m","a",[[.34,0],[.1,-.07],[-.44,-.07]]], ["m","g",[[.42,0],[.32,-.06],[.22,-.06]]]] },
  freight:{ hull:[[.5,0],[.42,-.22],[.3,-.3],[-.5,-.3]], eng:[-.2,-.07,.07,.2],
    parts:[["o","a",[[.26,-.3],[.26,-.5],[.1,-.5],[.1,-.3]]], ["o","t",[[.07,-.3],[.07,-.5],[-.09,-.5],[-.09,-.3]]],
           ["o","a",[[-.12,-.3],[-.12,-.5],[-.28,-.5],[-.28,-.3]]], ["o","t",[[-.31,-.3],[-.31,-.5],[-.47,-.5],[-.47,-.3]]],
           ["m","g",[[-.25,0],[-.3,-.12],[-.42,-.12],[-.44,0]]], ["m","t",[[.4,0],[.3,-.05],[-.2,-.05]]]] },
  clipper:{ hull:[[.5,0],[.1,-.07],[-.5,-.05]], eng:[0],
    parts:[["w","s",[[.25,-.06],[.05,-.5],[-.35,-.5],[-.15,-.06]]], ["w","t",[[.06,-.06],[-.14,-.5],[-.17,-.5],[.03,-.06]]],
           ["m","g",[[.4,0],[.3,-.04],[.18,-.04]]], ["c","a",[-.05,0,.06]]] },
  science:{ hull:[[.3,0],[.26,-.3],[.1,-.46],[-.1,-.46],[-.26,-.3],[-.3,0]], eng:[-.35,.35],
    parts:[["w","t",[[-.2,-.3],[-.2,-.4],[-.55,-.4],[-.55,-.3]]], ["m","t",[[.52,0],[.3,-.04]]],
           ["m","g",[[.14,0],[.1,-.2],[-.1,-.2],[-.14,0]]], ["c","a",[0,0,.08]], ["c","a",[.2,-.2,.04]], ["c","a",[-.2,-.2,.04]]] },
  /* SSR - 금속 광택 선체, 겹날개, 오라 */
  aurum:{ acc:"#e0a63f", hull:[[.5,0],[.34,-.12],[.1,-.22],[-.25,-.28],[-.5,-.2]], eng:[-.14,0,.14],
    parts:[["w","h",[[.05,-.2],[-.2,-.52],[-.45,-.52],[-.3,-.26]]], ["w","a",[[.25,-.14],[.12,-.38],[.02,-.38],[.1,-.2]]],
           ["m","a",[[.42,0],[.1,-.07],[-.45,-.07]]], ["m","g",[[.44,0],[.34,-.05],[.24,-.05]]], ["c","t",[-.1,0,.07]], ["c","a",[-.3,0,.05]]] },
  dread:{ acc:"#c8503c", hull:[[.5,0],[.44,-.16],[.2,-.2],[.15,-.32],[-.4,-.36],[-.5,-.26]], eng:[-.24,-.08,.08,.24],
    parts:[["w","t",[[.1,-.32],[.05,-.52],[-.3,-.52],[-.35,-.36]]], ["o","a",[[.32,-.18],[.32,-.3],[.2,-.3],[.2,-.18]]],
           ["o","a",[[-.05,-.2],[-.05,-.3],[-.2,-.3],[-.2,-.2]]], ["m","t",[[.44,0],[.3,-.06],[-.45,-.06]]], ["m","g",[[.3,0],[.24,-.08],[.12,-.08]]]] },
  phantom:{ acc:"#8fd3ff", hull:[[.5,0],[.2,-.08],[-.1,-.2],[-.5,-.06]], eng:[0],
    parts:[["w","h",[[.15,-.1],[-.1,-.52],[-.52,-.46],[-.2,-.34],[-.1,-.2]]], ["w","a",[[-.12,-.24],[-.3,-.42],[-.46,-.42],[-.24,-.3]]],
           ["m","g",[[.4,0],[.28,-.04],[.14,-.04]]], ["c","a",[-.12,0,.1]]] },
  helios:{ acc:"#ff8a3a", hull:[[.5,0],[.2,-.1],[-.5,-.08]], eng:[-.05,.05],
    parts:[["w","s",[[.2,-.1],[.1,-.5],[-.1,-.56],[-.3,-.5],[-.2,-.1]]], ["w","t",[[.02,-.1],[-.08,-.56],[-.12,-.56],[-.02,-.1]]],
           ["m","g",[[.42,0],[.32,-.05],[.2,-.05]]], ["c","a",[0,0,.16]], ["c","h",[0,0,.08]]] },
  /* UR - 거대하고 화려한 전설급: 에너지 고리와 광휘 */
  ark:{ acc:"#ffcf70", hull:[[.5,0],[.4,-.24],[.2,-.4],[-.1,-.46],[-.35,-.36],[-.5,-.2]], eng:[-.3,-.15,0,.15,.3],
    parts:[["w","t",[[-.1,-.46],[-.2,-.62],[-.45,-.62],[-.35,-.36]]], ["w","a",[[.3,-.3],[.34,-.5],[.16,-.52],[.1,-.42]]],
           ["m","t",[[.34,0],[.26,-.2],[.08,-.3],[-.14,-.3],[-.28,-.2],[-.34,0]]], ["m","g",[[.2,0],[.14,-.14],[-.06,-.18],[-.18,-.1],[-.2,0]]],
           ["c","a",[0,0,.07]], ["c","a",[.3,-.18,.035]], ["c","a",[.1,-.36,.035]], ["c","a",[-.2,-.34,.035]], ["c","a",[-.4,-.16,.035]]] },
  levia:{ acc:"#5fe0ff", hull:[[.56,0],[.3,-.08],[.1,-.2],[-.2,-.16],[-.5,-.1]], eng:[-.08,0,.08],
    parts:[["w","h",[[.1,-.2],[.27,-.56],[.1,-.52],[-.25,-.2]]], ["w","a",[[-.15,-.16],[-.2,-.6],[-.52,-.64],[-.4,-.14]]],
           ["w","t",[[.3,-.08],[.4,-.3],[.3,-.28],[.18,-.12]]], ["m","a",[[.46,0],[.2,-.05],[-.46,-.05]]],
           ["m","g",[[.48,0],[.38,-.045],[.26,-.045]]], ["c","a",[.05,0,.07]], ["c","a",[-.15,0,.06]], ["c","a",[-.33,0,.05]]] },
  /* 해적선 */
  raider:{ acc:"#ff5a3c", hull:[[.5,0],[.1,-.16],[-.2,-.2],[-.5,-.12]], eng:[-.08,.08],
    parts:[["w","h",[[.3,-.1],[.45,-.5],[.1,-.4],[-.3,-.2]]], ["m","a",[[.3,0],[.1,-.06],[-.4,-.06]]]] },
};
const TIER = { N:0, R:1, SR:2, SSR:3, UR:4 };
const FLAME = ["#ff9d5c","#5cc8ff","#b58cff","#ffd24a","#9ff3ff"];
function shipPoly(g, pts, L, Wd, side){      /* side 0: 중심축 대칭 폐곡선, ±1: 한쪽 복사본 */
  g.beginPath();
  if(side === 0){
    pts.forEach((p,i)=>{ i ? g.lineTo(p[0]*L,p[1]*Wd) : g.moveTo(p[0]*L,p[1]*Wd); });
    for(let i=pts.length-1;i>=0;i--) g.lineTo(pts[i][0]*L, -pts[i][1]*Wd);
  } else pts.forEach((p,i)=>{ i ? g.lineTo(p[0]*L,p[1]*Wd*side) : g.moveTo(p[0]*L,p[1]*Wd*side); });
  g.closePath();
}
function drawShip(g, s, x,y,h, sc, thrust, enemy){
  const A = SHIP_ART[s.id] || SHIP_ART.shuttle, L = s.len, Wd = s.wid, tier = enemy ? 0 : (TIER[s.g]||0);
  if(enemy === true) enemy = FOES.scout;
  const col = enemy ? enemy.col : (s.col || (T.dark?"#eef1f7":"#ffffff"));
  const trim = enemy ? enemy.trim : (s.trim || (T.dark?"#9aa6c0":"#55504a"));
  const acc = enemy ? enemy.trim : A.acc || (s.g ? GRADES[s.g].color : "#ff5a3c");
  const lw = sc < 0.5 ? 0.5/(sc*cam.s) : 1.2;
  g.save(); g.translate(x,y); g.rotate(h); g.scale(sc,sc); g.lineJoin = "round";
  /* 광휘 (영웅·전설) */
  if(tier >= 3){ g.save(); g.scale(1,.62); glow(g, 0,0, L*(tier===4?.75:.7), acc, tier===4?.5:.32); g.restore(); }
  if(tier === 4){ g.lineWidth = lw*1.2;
    for(let i=0;i<2;i++){ g.strokeStyle = rgba(acc, .55-i*.2); g.beginPath();
      g.ellipse(-L*.08, 0, L*(.2+i*.09), Wd*(.82+i*.2), 0, 0, 7); g.stroke(); } }
  /* 분사 화염 */
  if(thrust) for(const ey of A.eng){ const fl = L*(.3+tier*.1)*(.75+Math.random()*.5), ew = Wd*(.07+tier*.01);
    g.fillStyle = rgba(enemy?enemy.flame:FLAME[tier], .85); g.beginPath();
    g.moveTo(-L*.48, ey*Wd-ew); g.lineTo(-L*.5-fl, ey*Wd); g.lineTo(-L*.48, ey*Wd+ew); g.fill();
    if(tier >= 2){ g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath();
      g.moveTo(-L*.48, ey*Wd-ew*.45); g.lineTo(-L*.5-fl*.45, ey*Wd); g.lineTo(-L*.48, ey*Wd+ew*.45); g.fill(); } }
  let hullFill = col;
  if(tier >= 3){ hullFill = g.createLinearGradient(0,-Wd*.5,0,Wd*.5);
    hullFill.addColorStop(0,"#ffffff"); hullFill.addColorStop(.45,col); hullFill.addColorStop(1,rgba(acc,.55)); }
  const paint = c => c==="h" ? hullFill : c==="t" ? trim : c==="a" ? acc : c==="g" ? (T.dark&&!enemy?"#8fd3ff":"#6fb6e8") : c==="p" ? "#4a78c8" : rgba(acc,.38);
  g.strokeStyle = trim; g.lineWidth = lw;
  const part = (p) => {
    if(p[0] === "c"){ const [cx,cy,cr] = p[2];
      for(const sd of (cy ? [1,-1] : [1])){ g.beginPath(); g.arc(cx*L, cy*Wd*sd, cr*Wd, 0, 7); g.fillStyle = paint(p[1]); g.fill(); g.stroke(); }
    } else if(p[0] === "m"){ shipPoly(g, p[2], L, Wd, 0); g.fillStyle = paint(p[1]); g.fill(); g.stroke(); }
    else for(const sd of [1,-1]){ shipPoly(g, p[2], L, Wd, sd); g.fillStyle = paint(p[1]); g.fill(); g.stroke(); }
  };
  for(const p of A.parts) if(p[0] === "w") part(p);
  shipPoly(g, A.hull, L, Wd, 0); g.fillStyle = hullFill; g.fill(); g.stroke();
  for(const p of A.parts) if(p[0] !== "w") part(p);
  /* 창문 불빛 (희귀 이상) · 이중 윤곽 (전설) */
  if(tier >= 2){ g.fillStyle = tier>=3 ? "#fff6d0" : rgba(acc,.9);
    for(let i=0;i<3+tier;i++){ g.beginPath(); g.arc(L*(.22-i*.11), Wd*.13*(i%2?1:-1), Wd*.022, 0, 7); g.fill(); } }
  if(tier === 4){ g.strokeStyle = rgba(acc,.9); g.lineWidth = lw*.7; shipPoly(g, A.hull.map(p=>[p[0]*.82,p[1]*.7]), L, Wd, 0); g.stroke(); }
  g.restore();
}
function shipIcon(id, big){               /* big: 상세 화면용 큰 그림 (어두운 우주 배경용 배색) */
  const key = id+(big?"#big":""); if(icons[key]) return icons[key];
  const k = big ? 3 : 1, c = document.createElement("canvas"); c.width = 320*k; c.height = 192*k;
  const g = c.getContext("2d"), s = SHIP_MAP[id], keep = T; T = big ? THEMES.dark : THEMES.paper;
  drawShip(g, s, 168*k,96*k, -0.3, Math.min(4.6, 170/s.len)*k, true, false); T = keep;
  return icons[key] = c.toDataURL();
}
const RAIDER_SHIP = { id:"raider", len:24, wid:13 };
const CRAFT = 0.1;        /* 비행체 축척: 천체 대비 아주 작게 (우주의 광활함) */
const TIME_SCALE = 0.1;   /* 항해 시간 축척 (작을수록 느린 항해) */
function label(txt, x, y, col, font){
  ctx.font = font || "600 12px 'Segoe UI','Malgun Gothic',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineWidth = 3.5/cam.s; ctx.strokeStyle = T.bg; ctx.lineJoin = "round"; ctx.strokeText(txt,x,y);
  ctx.fillStyle = col; ctx.fillText(txt,x,y);
}
function draw(){
  if(cam.follow){ cam.x += (state.x-cam.x)*0.12; cam.y += (state.y-cam.y)*0.12; }
  { const zp = Math.round(cam.s/BASE_ZOOM*100); if(zp !== zoomShown){ zoomShown = zp; $("hZoom").innerHTML = `${__`🔍 배율 <b>${zp}%</b>`}`; $("zoomNum").textContent = zp+"%"; } }
  const hw = W/2/cam.s, hh = H/2/cam.s;
  cam.x = clamp(cam.x, Math.min(hw,WORLD_W/2), Math.max(WORLD_W-hw,WORLD_W/2));
  cam.y = clamp(cam.y, Math.min(hh-90/cam.s,WORLD_H/2), Math.max(WORLD_H-hh+130/cam.s,WORLD_H/2));  /* HUD·메뉴에 가리지 않게 여유 */
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle = T.bg; ctx.fillRect(0,0,W,H);
  const x0 = Math.max(0,cam.x-hw), y0 = Math.max(0,cam.y-hh), x1 = Math.min(WORLD_W,cam.x+hw), y1 = Math.min(WORLD_H,cam.y+hh);
  { const zs = cam.s*(1+FX.punch);                           /* 화면 흔들림·줌 펀치: 보이는 화면만 움직인다 */
    ctx.setTransform(DPR*zs,0,0,DPR*zs, DPR*(W/2-cam.x*zs+FX.ox), DPR*(H/2-cam.y*zs+FX.oy)); }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(worldCv, x0,y0,x1-x0,y1-y0, x0,y0,x1-x0,y1-y0);
  const vis = (x,y,m) => x>x0-m && x<x1+m && y>y0-m && y<y1+m;
  const u = 1/cam.s;                                   /* 화면 1px에 해당하는 지도 길이 */
  const fs = 12*u*clamp(cam.s/4, .8, 1);
  const FONT = "'Segoe UI','Malgun Gothic',sans-serif", F = w => `${w} ${fs}px ${FONT}`;

  /* 선명한 별 (셀 단위 절차 생성) */
  if(cam.s >= 3){ const C = 40;
    for(let gx=Math.floor(x0/C); gx<=Math.floor(x1/C); gx++) for(let gy=Math.floor(y0/C); gy<=Math.floor(y1/C); gy++){
      const r = mulberry32((gx*73856093)^(gy*19349663));
      for(let i=0;i<5;i++){ const sx = (gx+r())*C, sy = (gy+r())*C, sz = (0.6+r()*1.4)*u;
        ctx.fillStyle = rgba(T.star, .3+r()*.6); ctx.fillRect(sx,sy,sz,sz); } } }

  /* 태양계 궤도 */
  if(y1 > ZY(0,1)){ const sun = BODY_MAP.sun;
    ctx.save(); ctx.beginPath(); ctx.rect(0, ZY(0,1), WORLD_W, ZONE_H); ctx.clip();
    ctx.lineWidth = u; ctx.setLineDash([3*u,6*u]); ctx.strokeStyle = T.line;
    for(const b of BODIES) if(b.z===0 && (b.k==="planet"||b.k==="gas"||b.id==="ceres"||b.id==="pluto"||b.id==="mercury")){
      ctx.beginPath(); ctx.arc(sun.x,sun.y,dist(sun.x,sun.y,b.x,b.y),0,7); ctx.stroke(); }
    ctx.restore(); ctx.setLineDash([]); }

  /* 우주 경계 등고선 + 축척 라벨 */
  for(let z=1; z<ZONE_N; z++){
    const y = ZY(z,0); if(y < y0-80 || y > y1+80) continue;
    const stp = Math.max(1, 6*u);
    for(let k=0;k<3;k++){
      ctx.strokeStyle = k?T.faint:T.line; ctx.lineWidth = (k?1:1.4)*u; ctx.beginPath();
      for(let x=x0, n=0; x<=x1+stp; x+=stp, n++){ const yy = y + Math.sin(x*0.011+z*2)*9 + Math.sin(x*0.004+z)*14 + (k-1)*11;
        n ? ctx.lineTo(x,yy) : ctx.moveTo(x,yy); }
      ctx.stroke();
    }
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = `700 ${fs*1.2}px ${FONT}`; ctx.fillStyle = T.acc; ctx.fillText(`▲ ${ZONES[z].name}`, x0+56*u, y-36);
    ctx.font = `${fs}px ${FONT}`; ctx.fillStyle = T.sub; ctx.fillText(__`축척 ${ZONES[z].scale} · ${ZONES[z].desc}`, x0+56*u, y-36-18*u);
  }

  /* 천체 (벡터로 직접 그려 확대해도 선명) */
  for(const b of BODIES) if(vis(b.x,b.y,b.r*5+20)) drawBody(ctx, b, mulberry32(hash(b.id)));

  /* 떠돌이 별: 기함 가까이에서만 모습을 드러내고 멀어지면 사라진다 */
  { const SR = starRange();
    for(const w of wstars){ if(w.z > state.tech.warp || !vis(w.x,w.y,30)) continue;
      const a = clamp((SR - dist(state.x,state.y,w.x,w.y))/(SR*0.35), 0, 1); if(a <= 0) continue;
      ctx.globalAlpha = a; drawBody(ctx, w, null);
      const rdy = starReady(w);
      label((rdy?"❗ ":"✦ ")+w.name+(rdy?__(" · 탭해서 조사"):__(" (조사 완료)")), w.x, w.y+w.r*2.2+10*u, rdy?T.acc:T.sub, F(rdy?700:500)); ctx.globalAlpha = 1; } }

  /* 자동 항로 */
  ctx.setLineDash([6*u,8*u]); ctx.lineWidth = 1.5*u; ctx.strokeStyle = rgba("#4a90d9",.6);
  for(const r of state.routes){ const a = BODY_MAP[r.from], b = BODY_MAP[r.to];
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  ctx.setLineDash([]);

  /* 태양 접근 금지 구역 */
  { const b = BODY_MAP.sun; if(vis(b.x,b.y,SUN_R+10)){
      ctx.fillStyle = rgba("#ff8a3a",.07); ctx.beginPath(); ctx.arc(b.x,b.y,SUN_R,0,7); ctx.fill();
      ctx.strokeStyle = rgba("#c8503c",.55); ctx.lineWidth = 1.4*u; ctx.setLineDash([6*u,6*u]);
      ctx.beginPath(); ctx.arc(b.x,b.y,SUN_R,0,7); ctx.stroke(); ctx.setLineDash([]);
      label(__("☀️ 접근 금지 구역"), b.x, b.y-SUN_R-12*u, "#c8503c", F(600)); } }

  /* 블랙홀 중력권 */
  for(const id of HOLES){ const b = BODY_MAP[id]; if(!vis(b.x,b.y,200) || b.z>state.tech.warp) continue;
    ctx.strokeStyle = rgba("#d96f32", .25+Math.sin(bobT*2)*.1); ctx.lineWidth = u; ctx.setLineDash([4*u,6*u]);
    ctx.beginPath(); ctx.arc(b.x,b.y,170,0,7); ctx.stroke(); ctx.setLineDash([]); }

  /* 천체 라벨 */
  for(const b of BODIES){
    if(!vis(b.x,b.y,120) || b.z > state.tech.warp) continue;
    const found = state.found.includes(b.id), ly = b.y + b.r*(b.k==="gal"?0.75:1) + 18*u;
    if(!b.lm){
      ctx.strokeStyle = dockedAt===b.id ? T.acc : rgba(T.dark?"#ffffff":"#3a3a3a", found?.55:.25);
      ctx.lineWidth = (dockedAt===b.id?2.4:1.4)*u;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r+(6+Math.sin(bobT*2+b.x)*1.2)*u,0,7); ctx.stroke();
    }
    if(found) label((b.lm?"":"⚓ ")+b.name, b.x, ly, b.lm?T.sub:T.text, F(b.lm?500:700));
    else if(!b.lm) label("?", b.x, ly, T.sub, F(700));
  }
  /* 해적 기지 */
  for(const d of DENS){ if(!vis(d.x,d.y,60) || d.z>state.tech.warp) continue;
    const done = state.dens[d.id];
    ctx.font = `${22*u}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.globalAlpha = done ? (remnantReady(d)?.75:.3) : 1; ctx.fillStyle = "#000"; ctx.fillText(done?"⚔️":"💀", d.x, d.y); ctx.globalAlpha = 1;
    label(d.name+(done?__(" (토벌됨)"):__` · 전투력 ${d.pow}`), d.x, d.y+22*u, done?T.sub:"#b3502a", F(600)); }

  /* 표류물 · 신호 */
  for(const s of salvages){ if(s.z>state.tech.warp || !vis(s.x,s.y,20)) continue;
    ctx.save(); ctx.translate(s.x,s.y); ctx.scale(u,u); ctx.rotate(s.a+bobT*.4); ctx.strokeStyle = T.dark?"#b9c4dc":"#8a8680"; ctx.lineWidth = 1.3;
    ctx.strokeRect(-4,-4,8,8); ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(4,0); ctx.stroke(); ctx.restore(); }
  for(const s of signals){ if(s.z>state.tech.warp || !vis(s.x,s.y,30)) continue;
    const p = (bobT*.8+s.x)%1; ctx.strokeStyle = rgba("#4a90d9", 1-p); ctx.lineWidth = 1.5*u;
    ctx.beginPath(); ctx.arc(s.x,s.y,(4+p*16)*u,0,7); ctx.stroke();
    ctx.fillStyle = "#4a90d9"; ctx.beginPath(); ctx.arc(s.x,s.y,3*u,0,7); ctx.fill(); }

  /* 잠긴 우주 안개 */
  const ly = lockY();
  if(ly > y0){ ctx.fillStyle = T.fog; ctx.fillRect(x0, y0, x1-x0, ly-y0);
    const nz = state.tech.warp+1;
    if(nz < ZONE_N) label(__`🔒 ${ZONES[nz].name} - 워프 드라이브 Mk.${nz} 필요`, clamp(cam.x,x0+150*u,x1-150*u), ly-26*u, T.acc, F(700)); }

  for(const [ex,dir] of [[0,1],[WORLD_W,-1]]){ if(Math.abs(cam.x-ex) > W/2/cam.s+12) continue;      /* 좌우 끝: 반대편으로 이어지는 문 */
    const gr = ctx.createLinearGradient(ex,0,ex+dir*EDGE_W,0); gr.addColorStop(0, rgba("#8e6fd8",.5+Math.sin(bobT*2)*.12)); gr.addColorStop(1, rgba("#8e6fd8",0));
    ctx.fillStyle = gr; ctx.fillRect(Math.min(ex,ex+dir*EDGE_W), cam.y-H/2/cam.s, EDGE_W, H/cam.s);
  }
  drawWorld(ctx, u, vis, F);
  drawFate(ctx, u, vis, F);
  drawRocks(ctx, u, vis);

  /* 비행체는 지도 축척(CRAFT)을 따르되, 멀리서 봐도 점으로는 보이게 최소 크기를 둔다 */
  const shipSc = Math.max(CRAFT, 1.0*u);
  for(const r of raiders){ if(r.z>state.tech.warp || !vis(r.x,r.y,40)) continue;
    if(r.chase){ ctx.strokeStyle = rgba("#c8503c",.5); ctx.lineWidth = u; ctx.setLineDash([3*u,5*u]);
      ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(state.x,state.y); ctx.stroke(); ctx.setLineDash([]); }
    drawFoe(ctx, foeKey(r.fam, r.pow), r.x, r.y, r.h, shipSc);
    if(r.chase) label("❗", r.x, r.y-26*u, "#c8503c", F(700)); }

  /* 항적 · 목적지 */
  if(trail.length > 1){ ctx.lineWidth = 1.5*u; ctx.lineCap = "round";
    for(let i=1;i<trail.length;i++){ ctx.strokeStyle = rgba(T.dark?"#ff9d5c":"#d96f32", i/trail.length*.5);
      ctx.beginPath(); ctx.moveTo(trail[i-1].x,trail[i-1].y); ctx.lineTo(trail[i].x,trail[i].y); ctx.stroke(); } }
  if(sail){ ctx.strokeStyle = rgba(T.dark?"#ffffff":"#3a3a3a",.35); ctx.lineWidth = 1.2*u; ctx.setLineDash([2*u,6*u]);
    ctx.beginPath(); ctx.moveTo(state.x,state.y); ctx.lineTo(sail.tx,sail.ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = T.acc; ctx.lineWidth = 1.6*u; const pr = (5+Math.sin(bobT*5)*2)*u;
    ctx.beginPath(); ctx.arc(sail.tx,sail.ty,pr,0,7); ctx.stroke(); }

  /* 탐지 범위 · 기함 */
  const st = eff();
  ctx.strokeStyle = rgba("#4a90d9",.13); ctx.lineWidth = u;
  ctx.beginPath(); ctx.arc(state.x,state.y,st.scan,0,7); ctx.stroke();
  const bob = sail ? 0 : Math.sin(bobT*1.6)*0.3*u;
  if(!dockedAt || sail) drawShip(ctx, SHIP_MAP[state.flagship], state.x, state.y+bob, state.heading, shipSc, !!sail, false);
  else drawShip(ctx, SHIP_MAP[state.flagship], state.x+BODY_MAP[dockedAt].r+8*u, state.y+bob-4*u, -Math.PI/2, shipSc, false, false);

  fxDraw(ctx, u);
  for(const f of floatTexts) { ctx.globalAlpha = 1-f.t/1.4; label(f.txt, f.x, f.y-(10+f.t*26)*u, f.col, F(700)); ctx.globalAlpha = 1; }
}

/* ══════════════════ 입력 ══════════════════ */
const ptrs = new Map(); let dragD = 0, pinch0 = 0;
cv.addEventListener("pointerdown", e=>{ cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); dragD = ptrs.size>1 ? 99 : 0;
  if(ptrs.size===2){ const [a,b] = [...ptrs.values()]; pinch0 = dist(a.x,a.y,b.x,b.y); } });
cv.addEventListener("pointermove", e=>{
  const p = ptrs.get(e.pointerId); if(!p) return;
  const dx = e.clientX-p.x, dy = e.clientY-p.y; p.x = e.clientX; p.y = e.clientY;
  if(ptrs.size === 1){ dragD += Math.abs(dx)+Math.abs(dy);
    if(dragD > 8){ cam.follow = false; cam.x -= dx/cam.s; cam.y -= dy/cam.s; } }
  else if(ptrs.size === 2){ const [a,b] = [...ptrs.values()], d = dist(a.x,a.y,b.x,b.y);
    if(pinch0 > 0) setZoom(d/pinch0); pinch0 = d; }
});
function ptrEnd(e){
  if(!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if(e.type === "pointerup" && dragD <= 8 && ptrs.size === 0){ const [wx,wy] = toWorld(e.clientX,e.clientY); onTap(wx,wy); }
}
cv.addEventListener("pointerup", ptrEnd); cv.addEventListener("pointercancel", ptrEnd);
cv.addEventListener("wheel", e=>{ e.preventDefault(); setZoom(e.deltaY<0?1.12:0.89); }, { passive:false });
function onTap(wx, wy){
  if(paused || !state || state.intro) return;
  const pick = 30/cam.s;
  let best = null, bd = 1e9;
  for(const b of BODIES){ if(b.z > state.tech.warp) continue;
    const d = dist(wx,wy,b.x,b.y); if(d < Math.max(b.r+1.5,pick) && d < bd){ bd = d; best = b; } }
  for(const dn of DENS){ if(dn.z > state.tech.warp) continue;
    const d = dist(wx,wy,dn.x,dn.y); if(d < pick && d < bd){ bd = d; best = dn; } }
  if(!best){                      /* 눈에 보이는 떠돌이 별을 탭하면 그 별로 간다 */
    const SR = starRange(); let sb = null, sd = 1e9;
    for(const w of wstars){ if(w.z > state.tech.warp || dist(state.x,state.y,w.x,w.y) > SR) continue;
      const d = dist(wx,wy,w.x,w.y); if(d < Math.max(w.r*2+1.5,pick) && d < sd){ sd = d; sb = w; } }
    if(sb){ requestSail(sb.x, sb.y, { star:sb.id }); return; }
  }
  if(best && best.pow){ requestSail(best.x, best.y, { den:best.id }); return; }
  if(best && !best.lm){
    if(dockedAt === best.id){ openTrade(); return; }
    requestSail(best.x, best.y, { port:best.id }); return;
  }
  if(best && best.lm){            /* 랜드마크는 안전거리에서 관측 */
    const a = Math.atan2(state.y-best.y, state.x-best.x), safe = best.k==="bh" ? 120 : best.r+40;
    requestSail(best.x+Math.cos(a)*safe, best.y+Math.sin(a)*safe); return;
  }
  requestSail(wx, wy);
}

/* ══════════════════ 루프 & 시작 ══════════════════ */
let lastT = 0, saveT = 0;
function loop(t){
  const dt = Math.min(0.05, (t-lastT)/1000 || 0); lastT = t;
  fxUpdate(dt); update(dt*FX.ts); draw();                    /* 연출은 실제 시간, 게임은 히트스톱이 걸린 시간 */
  saveT += dt; if(saveT > 10){ saveT = 0; save(); }
  requestAnimationFrame(loop);
}
function toggleTheme(){
  state.theme = state.theme==="paper" ? "dark" : "paper"; T = THEMES[state.theme];
  document.body.style.background = T.bg; document.body.classList.toggle("dark", T.dark); buildWorld(); save();
}
function toggleMute(){ state.mute = !state.mute; $("muteBtn").textContent = state.mute?"🔇":"🔊"; auApplyVolume(); save(); }
function startGame(quiet){ rememberLang(); state.intro = false; $("intro").style.display = "none"; if(!quiet) sfx("warp"); storyOnce("prologue"); save(); }   /* quiet: 처음 화면 연출(js/intro.js)이 이미 소리를 냈다 */
function init(){
  i18nStatic(); $("langPick").innerHTML = langButtons(); setTimeout(fitLabels, 0);        /* 고정 문구 번역 + 처음 화면의 언어 고르기 */
  const had = load();
  T = THEMES[state.theme] || THEMES.paper; document.body.style.background = T.bg; document.body.classList.toggle("dark", T.dark);
  resize(); buildWorld(); if(state.priceVer !== 2){ state.priceVer = 2;                 /* 시세 조정: 산 값 기록을 새 시세에 맞추고 오늘의 의뢰를 새로 뽑는다 */
    if(state.cost) for(const k in state.cost) state.cost[k] = Math.max(1, Math.round(state.cost[k]*TRADE_SCALE));
    state.quests = null; }
  if(had && !state.storyInit){ const sn = storyState().seen;
    if(!state.intro) sn.prologue = true;
    for(let z=1; z<=state.maxZ; z++) sn["zone"+z] = true;
    if(state.crew.length) sn.firstCrew = true;
    if(Object.keys(state.dens).length) sn.firstDen = true;
    for(const id of ["sgra","andromeda","cmb"]) if(state.visited.includes(id)) sn[id] = true;
    if(state.ended) sn.bigbang = true;
    if(state.stats.deaths) sn.loss = true; }
  state.storyInit = true; storyState();
  if(state.buff && state.buff.t !== "boost" && state.buff.t !== "broken") state.buff.t = state.buff.t === "가속" ? "boost" : "broken"; /* i18n-skip */
  syncPosts(); spawnAll(); genStars(); buildMini(); bonds(); worldEnsure(); fateEnsure();
  dockedAt = state.docked && BODY_MAP[state.docked] && dist(state.x,state.y,BODY_MAP[state.docked].x,BODY_MAP[state.docked].y) < 2 ? state.docked : null;
  { const sun = BODY_MAP.sun;
    if(dist(state.x,state.y,sun.x,sun.y) < SUN_R){ dockedAt = null; state.x = sun.x; state.y = sun.y+SUN_R+3; }
    if(state.lastPort === "sun") state.lastPort = "earth";
    state.visited = state.visited.filter(i=>i !== "sun"); }
  { const st = eff(); state.fuel = Math.min(state.fuel, st.sup); state.o2 = Math.min(state.o2, st.sup); }   /* 탱크 용량 변경 반영 */
  cam.x = state.x; cam.y = state.y;
  if(had && !state.intro) $("intro").style.display = "none";
  $("muteBtn").textContent = state.mute?"🔇":"🔊";
  updateHUD(); requestAnimationFrame(loop);
  if(guardNotice) setTimeout(()=>toast(__("⚠️ 세이브 파일이 변조되어 이전 정상 기록으로 되돌렸습니다")), 1500);
}
window.addEventListener("load", init);
