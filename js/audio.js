"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 오디오 ══════════════════
   Web Audio API만으로 만드는 절차적 BGM과 효과음 (외부 파일·라이브러리 없음).
   - BGM: 우주마다 다른 조성의 앰비언트를 미리보기 스케줄러(look-ahead)로 연주, 전투·조난 시 전환
   - 효과음: 오실레이터와 노이즈를 조합한 원샷
   - 모든 소리는 master → (bgm | sfx) 버스를 거쳐 음소거·볼륨을 한 곳에서 조절 */
const AU = { ctx:null, master:null, bgm:null, sfx:null, rev:null, track:null, eng:null, noiseBuf:null };
const mtof = m => 440*Math.pow(2, (m-69)/12);

function auInit(){
  if(AU.ctx) return true;
  const C = window.AudioContext || window.webkitAudioContext; if(!C) return false;
  try{
    const ctx = AU.ctx = new C();
    AU.master = ctx.createGain(); AU.master.connect(ctx.destination);
    AU.bgm = ctx.createGain(); AU.bgm.connect(AU.master);
    AU.sfx = ctx.createGain(); AU.sfx.connect(AU.master);
    /* 잔향: 감쇠하는 노이즈로 만든 임펄스 응답 */
    const len = Math.floor(ctx.sampleRate*3.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let ch=0; ch<2; ch++){ const d = ir.getChannelData(ch); for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/len, 2.8); }
    AU.rev = ctx.createConvolver(); AU.rev.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.6; AU.rev.connect(wet); wet.connect(AU.bgm);
    AU.sfxRev = ctx.createGain(); AU.sfxRev.gain.value = 0.25; AU.sfxRev.connect(AU.rev);
    /* 공용 노이즈 */
    const nl = ctx.sampleRate*2; AU.noiseBuf = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = AU.noiseBuf.getChannelData(0); for(let i=0;i<nl;i++) nd[i] = Math.random()*2-1;
    /* 엔진음: 항해 중에만 낮게 깔리는 노이즈 */
    const src = ctx.createBufferSource(); src.buffer = AU.noiseBuf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 150;
    AU.eng = ctx.createGain(); AU.eng.gain.value = 0;
    src.connect(lp); lp.connect(AU.eng); AU.eng.connect(AU.sfx); src.start();
    auApplyVolume();
    return true;
  }catch(e){ AU.ctx = null; return false; }
}
function auApplyVolume(){
  if(!AU.ctx || !state) return;
  const v = state.vol || { bgm:.6, sfx:.8 }, t = AU.ctx.currentTime;
  AU.master.gain.setTargetAtTime(state.mute ? 0 : 1, t, 0.03);
  AU.bgm.gain.setTargetAtTime(v.bgm, t, 0.05);
  AU.sfx.gain.setTargetAtTime(v.sfx, t, 0.05);
}
/* 브라우저 자동재생 정책: 첫 사용자 입력에서 오디오를 연다 */
function auUnlock(){ if(auInit() && AU.ctx.state === "suspended") AU.ctx.resume(); }
window.addEventListener("pointerdown", auUnlock, true);
window.addEventListener("keydown", auUnlock, true);
document.addEventListener("visibilitychange", ()=>{ if(!AU.ctx) return; document.hidden ? AU.ctx.suspend() : AU.ctx.resume(); });

/* ── 소리 조각 ── */
function auVoice(dest, freq, type, t, dur, gain, atk, rel, lpf, endFreq){
  const ctx = AU.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if(endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq), t+dur);
  f.type = "lowpass"; f.frequency.setValueAtTime(lpf||3000, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t+Math.max(0.005, atk));
  g.gain.setValueAtTime(gain, t+Math.max(atk, dur-rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(f); f.connect(g); g.connect(dest);
  o.start(t); o.stop(t+dur+0.05);
}
function auNoise(dest, t, dur, gain, lpf, hpf){
  const ctx = AU.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  s.buffer = AU.noiseBuf; s.loop = true;
  f.type = hpf ? "bandpass" : "lowpass"; f.frequency.setValueAtTime(hpf ? (lpf+hpf)/2 : lpf, t); if(hpf) f.Q.value = 0.7;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t, Math.random()*1.5); s.stop(t+dur+0.05);
}

/* ══════════════════ BGM ══════════════════
   우주(7곳)마다 악기 편성·박자·분위기가 뚜렷이 다르고, 같은 우주 안에서도 가까운 천체(권역)에 따라
   조옮김·화음 순서·선율 악기·빠르기가 달라진다.
   root: 기준음(MIDI) · scale: 선율 음계 · chords: 화음 진행(기준음에서의 반음 거리) · spc: 화음 길이(8분음표 수)
   pad: 패드 음색 · bass: long(길게)/ost(반복 음형)/pulse(맥동) · arp: up(오르내림)/rand(무작위) · kick/hat/thump: 타악 · drone/wind: 깔리는 소리 */
const BGM = {
  z0:{ name:__("태양계"),       mood:__("따뜻하고 희망찬"),   bpm:88, root:48, scale:[0,2,4,7,9],      chords:[[0,4,7,11],[9,12,16],[5,9,12,16],[7,11,14]],  spc:16,
       pad:"triangle", padG:.05, bass:"ost", bassPat:[0,3,6,8,11,14], arp:"up", arpG:.045, arpEvery:1, mel:.22, lead:"triangle", kick:[0,8], hat:.5 },
  z1:{ name:__("근거리 우주"),  mood:__("몽환적인"),          bpm:66, root:50, scale:[0,2,3,5,7,9,10], chords:[[0,3,7,10],[5,9,12],[10,14,17],[0,3,7,14]],   spc:16,
       pad:"sine", padG:.08, bass:"long", mel:.34, lead:"sine", melOct:12, echo:.45 },
  z2:{ name:__("우리 은하"),    mood:__("흐르는 듯한"),       bpm:100, root:45, scale:[0,3,5,7,10],    chords:[[0,3,7,10],[8,12,15],[3,7,10,14],[10,14,17]], spc:16,
       pad:"sine", padG:.06, bass:"ost", bassPat:[0,2,4,6,8,10,12,14], arp:"rand", arpG:.04, arpEvery:1, mel:.20, lead:"square", leadLpf:1400, hat:.8, kick:[0,6,8] },
  z3:{ name:__("국부 은하군"),  mood:__("광활하고 고요한"),   bpm:52, root:53, scale:[0,2,4,6,7,9,11], chords:[[0,4,7,11],[2,6,9],[0,4,7,14],[9,12,16]],     spc:16,
       pad:"sine", padG:.09, bass:"long", mel:.16, lead:"sine", melOct:24, echo:.55, drone:.035 },
  z4:{ name:__("은하단"),       mood:__("장엄한"),            bpm:72, root:40, scale:[0,2,3,7,8,10],   chords:[[0,7,12,15],[8,15,20],[5,12,17,20],[7,14,19]], spc:16,
       pad:"sawtooth", padG:.045, padLpf:700, bass:"long", mel:.20, lead:"sawtooth", leadLpf:1100, thump:[0,6,8], arp:"up", arpG:.02, arpEvery:2 },
  z5:{ name:__("우주 거대 구조"), mood:__("어둡고 낯선"),     bpm:46, root:35, scale:[0,1,3,5,7,8,10], chords:[[0,7,13],[1,8,13],[0,6,12],[10,13,17]],       spc:16,
       pad:"sine", padG:.07, bass:"long", mel:.12, lead:"triangle", melOct:12, echo:.6, drone:.06, wind:.05, detune:9 },
  z6:{ name:__("태초의 우주"),  mood:__("경이로운"),          bpm:58, root:49, scale:[0,2,4,6,8,10],   chords:[[0,4,8,14],[2,6,10,16],[4,8,12,18],[6,10,14]], spc:16,
       pad:"sawtooth", padG:.04, padLpf:1500, bass:"long", arp:"rand", arpG:.05, arpEvery:1, arpOct:24, mel:.20, lead:"sine", melOct:12, echo:.5, wind:.03 },
  combat:{ name:__("전투"), mood:__("긴박한"), bpm:136, root:50, scale:[0,2,3,5,7,8,10], chords:[[0,3,7],[0,3,7],[8,12,15],[10,14,17]], spc:16,
       pad:"sawtooth", padG:.03, padLpf:900, bass:"pulse", mel:.42, lead:"sawtooth", leadLpf:1800, kick:[0,4,8,12], hat:1, fixed:1 },
  over:{ name:__("조난"), mood:__("쓸쓸한"), bpm:50, root:45, scale:[0,3,5,7,10], chords:[[0,3,7],[8,12,15],[5,8,12],[7,10,14]], spc:16,
       pad:"sine", padG:.08, bass:"long", mel:.14, lead:"sine", echo:.5, fixed:1 },
};
function auHash(str){ let h = 2166136261; for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; }
/* 권역 변주: 같은 우주라도 가까운 천체에 따라 조·화음 순서·선율 악기·빠르기가 달라진다 */
function auTrackDef(id){
  const [zid, region] = id.split(":"), base = BGM[zid]; if(!base) return null;
  if(base.fixed || !region) return Object.assign({ title:base.name }, base);
  const h = auHash(region), rot = (h>>>3) % base.chords.length;
  return Object.assign({}, base, {
    title: __`${base.name} · ${typeof BODY_MAP !== "undefined" && BODY_MAP[region] ? BODY_MAP[region].name : region} 권역`,
    root: base.root + [-3,-2,0,2,3,5][h % 6],
    bpm: Math.round(base.bpm*(0.9 + ((h>>>5) % 5)*0.05)),
    chords: base.chords.slice(rot).concat(base.chords.slice(0, rot)),
    lead: ["sine","triangle", base.lead, base.lead][(h>>>8) % 4],
    mel: base.mel*(0.8 + ((h>>>11) % 4)*0.15),
    arp: base.arp ? ((h>>>14) % 2 ? "up" : "rand") : ((h>>>14) % 4 === 0 ? "rand" : null),
    arpG: base.arpG || .03, arpEvery: base.arpEvery || 2,
  });
}
function auPlayTrack(id){
  if(!AU.ctx || (AU.track && AU.track.id === id)) return;
  const ctx = AU.ctx, now = ctx.currentTime, old = AU.track;
  if(old){ old.stopped = true; clearTimeout(old.timer);                   /* 이전 곡은 2.5초에 걸쳐 사라진다 */
    old.out.gain.cancelScheduledValues(now); old.out.gain.setValueAtTime(old.out.gain.value, now);
    old.out.gain.linearRampToValueAtTime(0.0001, now+2.5); setTimeout(()=>{ try{ old.out.disconnect(); }catch(e){} }, 9000); }
  const d = auTrackDef(id); if(!d){ AU.track = null; return; }
  const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, now); out.gain.linearRampToValueAtTime(1, now+3);
  out.connect(AU.bgm); out.connect(AU.rev);
  let mel = out;                                                           /* 메아리: 선율만 지연선을 한 번 더 거친다 */
  if(d.echo){ mel = ctx.createGain(); mel.connect(out);
    const dl = ctx.createDelay(1.5), fb = ctx.createGain(); dl.delayTime.value = 60/d.bpm*0.75; fb.gain.value = d.echo;
    mel.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(out); }
  const notes = []; for(let o=0;o<2;o++) for(const s of d.scale) notes.push(d.root+12+(d.melOct||0)+o*12+s);
  const tr = AU.track = { id, d, out, notes, step:0, next:now+0.15, mi:Math.floor(notes.length/2), ai:0, stopped:false, timer:null };
  const sd = 60/d.bpm/2, det = d.detune || 0;                              /* sd: 8분음표 길이 */
  (function schedule(){
    if(tr.stopped) return;
    while(tr.next < ctx.currentTime + 0.3){                               /* 0.3초 앞까지 미리 예약 → 박자가 밀리지 않는다 */
      const t = tr.next, st = tr.step % d.spc, ci = Math.floor(tr.step/d.spc) % d.chords.length, ch = d.chords[ci], len = d.spc*sd;
      if(st === 0){
        ch.forEach((n,i)=>auVoice(out, mtof(d.root+12+n)*(1+(i%2?det:-det)/1200), d.pad, t, len*1.08, d.padG, len*0.3, len*0.35, d.padLpf||1300));   /* 패드 */
        if(d.bass === "long") auVoice(out, mtof(d.root-12+ch[0]), "triangle", t, len*1.02, 0.13, 0.4, len*0.3, 420);
        if(d.drone){ auVoice(out, mtof(d.root-12), "sine", t, len*1.1, d.drone, len*0.4, len*0.4, 300); auVoice(out, mtof(d.root-5)*1.004, "sine", t, len*1.1, d.drone*0.7, len*0.4, len*0.4, 300); }
        if(d.wind) auNoise(out, t+len*0.2, len*0.7, d.wind, 900, 250);
      }
      if(d.bass === "ost" && d.bassPat.includes(st)) auVoice(out, mtof(d.root-12+ch[st % 4 === 3 ? 2 : 0]), "triangle", t, sd*1.6, 0.13, 0.008, sd*1.2, 520);
      if(d.bass === "pulse" && st % 2 === 0) auVoice(out, mtof(d.root-12+ch[0]), "sawtooth", t, sd*0.9, 0.11, 0.005, sd*0.6, 500);
      if(d.kick && d.kick.includes(st)) auVoice(out, 130, "sine", t, 0.22, 0.20, 0.002, 0.18, 400, 42);
      if(d.thump && d.thump.includes(st)){ auVoice(out, 82, "sine", t, 0.7, 0.24, 0.004, 0.6, 260, 38); auNoise(out, t, 0.18, 0.05, 420); }
      if(d.hat && st % 2 === 1 && Math.random() < d.hat) auNoise(out, t, 0.045, 0.035, 9000, 5500);
      if(d.arp && tr.step % d.arpEvery === 0){
        const seq = d.arp === "up" ? [0,1,2,1,0,1,2,3].map(i=>ch[i % ch.length]+(i>=ch.length?12:0)) : null;
        const n = seq ? seq[tr.ai++ % seq.length] : ch[Math.floor(Math.random()*ch.length)];
        if(seq || Math.random() < 0.6) auVoice(out, mtof(d.root+(d.arpOct||12)+12+n), seq ? "triangle" : "sine", t, sd*(seq?1.4:2.6), d.arpG, 0.006, sd*(seq?1:2), 3000);
      }
      if(Math.random() < d.mel && tr.step % (d.bass==="pulse"?1:2) === 0){
        /* 선율: 음계 위를 한두 칸씩 걷다가 가끔 화음 구성음으로 뛴다 → 같은 가락이 반복되지 않는다 */
        if(Math.random() < 0.25){ const target = d.root+12+(d.melOct||0)+ch[Math.floor(Math.random()*ch.length)]+(Math.random()<.5?12:0);
          let best = 0; tr.notes.forEach((n,i)=>{ if(Math.abs(n-target) < Math.abs(tr.notes[best]-target)) best = i; }); tr.mi = best; }
        else tr.mi = Math.max(0, Math.min(tr.notes.length-1, tr.mi + [-2,-1,-1,1,1,2][Math.floor(Math.random()*6)]));
        const fast = d.bass === "pulse", dur = fast ? sd*(1+Math.floor(Math.random()*2)) : sd*(2+Math.random()*5);
        auVoice(mel, mtof(tr.notes[tr.mi]), d.lead, t, dur, d.lead==="sine"?0.10:0.07, fast?0.01:0.04, dur*0.6, d.leadLpf||2400);
      }
      tr.step++; tr.next += sd;
    }
    tr.timer = setTimeout(schedule, 60);
  })();
  if(typeof toast === "function" && typeof state !== "undefined" && state && !state.intro) toast(__`🎵 ${d.title} - ${d.mood} 곡`);
}
/* 지금 있는 권역: 같은 우주에서 가장 가까운 기지 */
function auRegion(){
  const z = zoneOf(state.y); let best = null, bd = 1e9;
  for(const p of PORTS){ if(p.z !== z) continue; const d2 = Math.hypot(p.x-state.x, p.y-state.y); if(d2 < bd){ bd = d2; best = p; } }
  return "z"+z+(best ? ":"+best.id : "");
}
/* 상황에 맞는 곡 고르기 + 엔진음 (0.5초마다). 권역이 바뀌어도 3초 이상 머물러야 곡을 바꾼다 */
let auWant = null, auWantT = 0;
setInterval(()=>{
  if(!AU.ctx || typeof state === "undefined" || !state) return;
  const over = document.getElementById("gameover").style.display === "flex";
  const id = over ? "over" : (typeof combat !== "undefined" && combat) ? "combat" : state.intro || document.body.classList.contains("on-title") ? "z0:earth" : auRegion();
  if(id !== auWant){ auWant = id; auWantT = 0; }
  auWantT += 0.5;
  if(!AU.track || id === "over" || id === "combat" || AU.track.id === "combat" || AU.track.id === "over" || auWantT >= 3) auPlayTrack(id);
  const moving = !!sail && !paused && !over;
  AU.eng.gain.setTargetAtTime(moving ? (state.fuel > 0 ? 0.09 : 0.02) : 0, AU.ctx.currentTime, 0.4);
}, 500);

/* ══════════════════ 효과음 ══════════════════ */
const NOTE = { C4:261.6, D4:293.7, E4:329.6, G4:392, A4:440, C5:523.3, D5:587.3, E5:659.3, G5:784, A5:880, C6:1046.5, E6:1318.5, G6:1568 };
const SFX = {
  tap:     (o,t)=>{ auVoice(o, 660, "sine", t, 0.07, 0.16, 0.003, 0.05, 3000, 760); },
  blip:    (o,t)=>{ auVoice(o, 880, "triangle", t, 0.06, 0.10, 0.003, 0.04, 3500); auVoice(o, 1175, "triangle", t+0.05, 0.07, 0.08, 0.003, 0.05, 3500); },
  ok:      (o,t)=>{ auVoice(o, NOTE.E5, "triangle", t, 0.14, 0.18, 0.005, 0.1, 3000); auVoice(o, NOTE.A5, "triangle", t+0.09, 0.22, 0.18, 0.005, 0.16, 3000); },
  coin:    (o,t)=>{ auVoice(o, NOTE.E6, "square", t, 0.07, 0.10, 0.002, 0.05, 5000); auVoice(o, NOTE.G6, "square", t+0.06, 0.2, 0.10, 0.002, 0.16, 5000); },
  gem:     (o,t)=>{ [NOTE.E5,NOTE.G5,NOTE.C6,NOTE.E6].forEach((f,i)=>auVoice(o, f, "sine", t+i*0.06, 0.35, 0.14, 0.004, 0.3, 6000)); },
  discover:(o,t)=>{ [NOTE.C5,NOTE.E5,NOTE.G5,NOTE.C6].forEach((f,i)=>auVoice(o, f, "triangle", t+i*0.08, 0.45, 0.13, 0.006, 0.38, 4000)); },
  dock:    (o,t)=>{ [NOTE.C4,NOTE.G4,NOTE.E5].forEach((f,i)=>auVoice(o, f, "sine", t+i*0.05, 0.9, 0.13, 0.03, 0.7, 2500)); auNoise(o, t, 0.5, 0.05, 700); },
  depart:  (o,t)=>{ auNoise(o, t, 0.7, 0.12, 900, 120); auVoice(o, 90, "sawtooth", t, 0.6, 0.10, 0.05, 0.3, 500, 240); },
  shot:    (o,t)=>{ auVoice(o, 1300, "sawtooth", t, 0.18, 0.16, 0.002, 0.12, 4000, 180); auNoise(o, t, 0.08, 0.10, 6000, 1500); },
  hit:     (o,t)=>{ auNoise(o, t, 0.28, 0.26, 1400); auVoice(o, 150, "sine", t, 0.3, 0.26, 0.002, 0.25, 600, 45); },
  explode: (o,t)=>{ auNoise(o, t, 0.9, 0.30, 1800); auVoice(o, 120, "sine", t, 0.9, 0.28, 0.003, 0.8, 500, 30); auNoise(o, t+0.08, 0.5, 0.14, 5000, 1200); },
  alarm:   (o,t)=>{ for(let i=0;i<2;i++){ auVoice(o, 740, "square", t+i*0.22, 0.13, 0.12, 0.004, 0.05, 2200); auVoice(o, 554, "square", t+i*0.22+0.11, 0.1, 0.10, 0.004, 0.05, 2200); } },
  bad:     (o,t)=>{ auVoice(o, 330, "square", t, 0.16, 0.13, 0.004, 0.1, 1800); auVoice(o, 220, "square", t+0.13, 0.3, 0.13, 0.004, 0.24, 1800); },
  warp:    (o,t)=>{ auVoice(o, 180, "sine", t, 0.7, 0.20, 0.03, 0.3, 4000, 1400); auVoice(o, 270, "triangle", t+0.05, 0.7, 0.10, 0.03, 0.3, 5000, 2100); auNoise(o, t+0.3, 0.6, 0.07, 8000, 2500); },
  fanfare: (o,t)=>{ [NOTE.C5,NOTE.E5,NOTE.G5].forEach((f,i)=>auVoice(o, f, "triangle", t+i*0.1, 0.16, 0.16, 0.004, 0.1, 3500));
                    [NOTE.C5,NOTE.E5,NOTE.G5,NOTE.C6].forEach(f=>auVoice(o, f, "triangle", t+0.32, 0.7, 0.09, 0.006, 0.6, 3500)); },
  over:    (o,t)=>{ [NOTE.A4,NOTE.G4,NOTE.E4,NOTE.C4].forEach((f,i)=>auVoice(o, f, "triangle", t+i*0.22, 0.6, 0.16, 0.01, 0.5, 2000)); auNoise(o, t, 1.2, 0.08, 500); },
};
function sfx(k){
  if(typeof state === "undefined" || !state || state.mute) return;
  if(!auInit() || AU.ctx.state !== "running") return;
  const f = SFX[k] || SFX.tap;
  try{ f(AU.sfx, AU.ctx.currentTime + 0.005);
    if(k === "dock" || k === "discover" || k === "gem" || k === "warp" || k === "fanfare"){ /* 넓게 울려야 좋은 소리는 잔향으로도 보낸다 */
      const g = AU.ctx.createGain(); g.gain.value = 0.35; g.connect(AU.sfxRev); f(g, AU.ctx.currentTime + 0.005); setTimeout(()=>{ try{ g.disconnect(); }catch(e){} }, 3000); }
  }catch(e){}
}
