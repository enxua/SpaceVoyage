#!/usr/bin/env node
/* ══════════════════ 우주 끝까지: VOYAGE - 앱 아이콘 · 시작 화면 그리기 ══════════════════
   SVG 로 그린 뒤 PNG 로 굽는다. 결과는 assets/ 에 저장된다.
     icon-background.png  적응형 아이콘 뒷판: 깊은 우주 · 성운 · 별 · 지구 수평선
     icon-foreground.png  적응형 아이콘 앞판: 궤도 고리 + 상승하는 함선 (안전 영역 안)
     icon-only.png        두 판을 합친 1024 아이콘 (구형 기기용)
     play-store-512.png   구글 플레이 등록용 512 아이콘
     splash.png / splash-dark.png  앱 시작 화면
   node tools/make-icons.js  →  npx capacitor-assets generate --android */
const fs = require("fs"), path = require("path"), sharp = require("sharp");
const OUT = path.resolve(__dirname, "..", "assets");
fs.mkdirSync(OUT, { recursive: true });

/* 늘 같은 그림이 나오도록 씨앗을 고정한 난수 */
function rng(seed){ return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

/* ── 뒷판: 깊은 우주 ── */
function background(W, H, { planet = true, stars = 140, seed = 7 } = {}){
  const r = rng(seed), s = Math.max(W, H) / 1024;
  let dots = "";
  for(let i = 0; i < stars; i++){
    const x = r() * W, y = r() * H * (planet ? 0.78 : 1), big = r() < 0.08, rad = (big ? 2.6 + r() * 2 : 0.8 + r() * 1.6) * s;
    const col = ["#ffffff", "#ffffff", "#cfe0ff", "#ffe2c4"][(r() * 4) | 0], op = (0.35 + r() * 0.65).toFixed(2);
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${col}" opacity="${op}"/>`;
    if(big) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad * 4).toFixed(1)}" fill="url(#glint)" opacity=".6"/>`;
  }
  const cx = W / 2, pr = 820 * s, py = H - 290 * s + pr;        /* 지구: 아래쪽에 수평선만 걸친다 */
  return `
  <defs>
    <radialGradient id="sky" cx="42%" cy="34%" r="80%"><stop offset="0" stop-color="#16265a"/><stop offset=".5" stop-color="#070c1f"/><stop offset="1" stop-color="#020309"/></radialGradient>
    <radialGradient id="nebO" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e2733a" stop-opacity=".75"/><stop offset=".55" stop-color="#8c285a" stop-opacity=".3"/><stop offset="1" stop-color="#8c285a" stop-opacity="0"/></radialGradient>
    <radialGradient id="nebB" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3c78ff" stop-opacity=".6"/><stop offset=".6" stop-color="#46208c" stop-opacity=".25"/><stop offset="1" stop-color="#46208c" stop-opacity="0"/></radialGradient>
    <radialGradient id="glint"><stop offset="0" stop-color="#bcd6ff" stop-opacity=".9"/><stop offset="1" stop-color="#bcd6ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="earth" cx="50%" cy="0%" r="60%"><stop offset="0" stop-color="#3a8fd6"/><stop offset=".12" stop-color="#1a5aa4"/><stop offset=".35" stop-color="#0b2f5e"/><stop offset="1" stop-color="#030a1c"/></radialGradient>
    <linearGradient id="dusk" x1="0" x2="1"><stop offset="0" stop-color="#ffb070" stop-opacity=".45"/><stop offset=".35" stop-color="#ffb070" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${60 * s}"/></filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${18 * s}"/></filter>
    <clipPath id="earthClip"><circle cx="${cx}" cy="${py}" r="${pr}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <ellipse cx="${W * 0.18}" cy="${H * 0.16}" rx="${430 * s}" ry="${300 * s}" fill="url(#nebO)" filter="url(#blur)"/>
  <ellipse cx="${W * 0.9}" cy="${H * 0.45}" rx="${380 * s}" ry="${380 * s}" fill="url(#nebB)" filter="url(#blur)"/>
  ${dots}
  ${planet ? `
  <circle cx="${cx}" cy="${py}" r="${pr + 10 * s}" fill="none" stroke="#7cc4ff" stroke-width="${30 * s}" opacity=".55" filter="url(#glow)"/>
  <circle cx="${cx}" cy="${py}" r="${pr}" fill="url(#earth)"/>
  <g clip-path="url(#earthClip)" opacity=".8">
    <ellipse cx="${cx - 260 * s}" cy="${py - pr + 60 * s}" rx="${170 * s}" ry="${40 * s}" fill="#2f6a48"/>
    <ellipse cx="${cx + 120 * s}" cy="${py - pr + 45 * s}" rx="${120 * s}" ry="${26 * s}" fill="#4a6f45"/>
    <ellipse cx="${cx + 380 * s}" cy="${py - pr + 95 * s}" rx="${150 * s}" ry="${40 * s}" fill="#2f6a48"/>
    <ellipse cx="${cx - 60 * s}" cy="${py - pr + 30 * s}" rx="${200 * s}" ry="${9 * s}" fill="#fff" opacity=".55"/>
    <ellipse cx="${cx + 300 * s}" cy="${py - pr + 55 * s}" rx="${160 * s}" ry="${8 * s}" fill="#fff" opacity=".45"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#dusk)"/>
  </g>
  <circle cx="${cx}" cy="${py}" r="${pr - 2 * s}" fill="none" stroke="#d8efff" stroke-width="${5 * s}" opacity=".85"/>` : ""}`;
}

/* ── 앞판: 궤도 고리 + 위로 솟는 함선 (1024 기준, 가운데 지름 ~640 안에 들어간다) ── */
function emblem(){
  const ship = `
    <path d="M -38 150 Q 0 470 38 150 Z" fill="url(#flameOut)"/>
    <path d="M -20 150 Q 0 330 20 150 Z" fill="url(#flameIn)"/>
    <path d="M -64 0 L -158 128 L -158 168 L -64 138 Z" fill="url(#wingL)"/>
    <path d="M 64 0 L 158 128 L 158 168 L 64 138 Z" fill="url(#wingR)"/>
    <path d="M 0 -240 C 44 -178 66 -86 66 40 L 66 140 L -66 140 L -66 40 C -66 -86 -44 -178 0 -240 Z" fill="url(#hull)"/>
    <path d="M 0 -240 C -44 -178 -66 -86 -66 40 L -66 140 L -30 140 L -30 40 C -30 -100 -18 -180 0 -240 Z" fill="#ffffff" opacity=".35"/>
    <rect x="-48" y="136" width="96" height="26" rx="6" fill="#4b5672"/>
    <path d="M -10 30 L 0 -10 L 10 30 L 10 120 L -10 120 Z" fill="#d96f32"/>
    <ellipse cx="0" cy="-98" rx="27" ry="46" fill="url(#glass)"/>
    <ellipse cx="-8" cy="-114" rx="8" ry="16" fill="#ffffff" opacity=".75"/>`;
  return `
  <defs>
    <linearGradient id="hull" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d9e0ee"/><stop offset="1" stop-color="#8592ad"/></linearGradient>
    <linearGradient id="wingL" x1="1" x2="0"><stop offset="0" stop-color="#f08a45"/><stop offset="1" stop-color="#b9501f"/></linearGradient>
    <linearGradient id="wingR" x1="0" x2="1"><stop offset="0" stop-color="#d96f32"/><stop offset="1" stop-color="#8f3a14"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8f0ff"/><stop offset="1" stop-color="#2a7cc4"/></linearGradient>
    <linearGradient id="flameOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb066"/><stop offset=".5" stop-color="#ff6a2a" stop-opacity=".7"/><stop offset="1" stop-color="#ff3d1a" stop-opacity="0"/></linearGradient>
    <linearGradient id="flameIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ffe0b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd090" stop-opacity="0"/></linearGradient>
    <linearGradient id="ring" x1="0" x2="1"><stop offset="0" stop-color="#ff9a5c" stop-opacity=".25"/><stop offset=".5" stop-color="#ffb37a"/><stop offset="1" stop-color="#7fb6ff" stop-opacity=".35"/></linearGradient>
    <filter id="shipGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <clipPath id="ringBack"><rect x="0" y="0" width="1024" height="512"/></clipPath>
    <clipPath id="ringFront"><rect x="0" y="512" width="1024" height="512"/></clipPath>
  </defs>
  <g transform="rotate(-22 512 512)">
    <ellipse cx="512" cy="512" rx="318" ry="104" fill="none" stroke="url(#ring)" stroke-width="14" clip-path="url(#ringBack)"/>
  </g>
  <g transform="translate(512 520) rotate(38) scale(1.05)">
    <g filter="url(#shipGlow)" opacity=".55"><path d="M 0 -240 C 44 -178 66 -86 66 40 L 66 140 L -66 140 L -66 40 C -66 -86 -44 -178 0 -240 Z" fill="#9fd0ff"/></g>
    ${ship}
  </g>
  <g transform="rotate(-22 512 512)">
    <ellipse cx="512" cy="512" rx="318" ry="104" fill="none" stroke="url(#ring)" stroke-width="14" clip-path="url(#ringFront)"/>
    <circle cx="830" cy="512" r="13" fill="#ffd2a8"/><circle cx="830" cy="512" r="30" fill="#ff9a5c" opacity=".25"/>
  </g>`;
}

const svg = (W, H, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`);
const save = (name, buf) => sharp(buf).png().toFile(path.join(OUT, name)).then(() => console.log("assets/" + name));

(async () => {
  const bg = background(1024, 1024), fg = emblem();
  await save("icon-background.png", svg(1024, 1024, bg));
  /* 적응형 앞판: capacitor-assets 가 앞판을 한 번 더 줄여 넣으므로 미리 키워 둔다 (구형 아이콘과 비슷한 크기가 되도록) */
  await save("icon-foreground.png", svg(1024, 1024, `<g transform="translate(512 512) scale(1.45) translate(-512 -512)">${fg}</g>`));
  /* 구형·스토어 아이콘: 가장자리가 잘리지 않으니 함선을 조금 키운다 */
  const full = svg(1024, 1024, bg + `<g transform="translate(512 512) scale(1.18) translate(-512 -512)">${fg}</g>`);
  await save("icon-only.png", full);
  await sharp(full).resize(512, 512).png().toFile(path.join(OUT, "play-store-512.png")); console.log("assets/play-store-512.png");
  await sharp(full).resize(192, 192).png().toFile(path.resolve(__dirname, "..", "image", "icon-192.png")); console.log("image/icon-192.png");
  /* 시작 화면: 가운데 작은 함선 + 우주 */
  const S = 2732, splash = svg(S, S, background(S, S, { planet: true, stars: 420, seed: 11 }) +
    `<g transform="translate(${S / 2} ${S / 2 - 120}) scale(.9) translate(-512 -512)">${fg}</g>`);
  await save("emblem.png", svg(1024, 1024, fg));                                  /* 스토어 그래픽용 함선 문장(배경 없음) */
  await save("splash.png", splash);
  await save("splash-dark.png", splash);
})();
