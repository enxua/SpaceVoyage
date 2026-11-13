#!/usr/bin/env node
/* ══════════════════ 우주 끝까지: VOYAGE - 스토어 스크린샷 · 그래픽 이미지 ══════════════════
   store/raw/<언어>/<장면>.png (tools/shots.js 로 찍은 원본) 위에 우주 배경과 문구를 얹는다.
     store/screenshots/<언어>/01-map.png …   1080×1920 휴대전화 스크린샷 (구글 플레이: 최대 8장)
     store/feature/<언어>.png                1024×500 그래픽 이미지
   node tools/store-art.js [언어…] */
const fs = require("fs"), path = require("path");
const puppeteer = require("puppeteer-core");
const { serve, findBrowser, ROOT } = require("./static-server");
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ["ko", "en", "es", "fr", "it", "pt", "ja", "zhs", "zht"];

/* 장면 순서 = 스토어에 보이는 순서. [큰 문구, 작은 문구] */
const ORDER = ["map", "nebula", "fleet", "crew", "trade", "battle", "codex", "intro"];
const CAP = {
  ko: { map:["실제 우주를 항해하세요", "태양계의 행성부터 머나먼 은하까지"], nebula:["지구에서 빅뱅까지", "7개의 우주, 60여 개의 실제 천체"],
        fleet:["전설의 함선을 건조하세요", "5개 등급, 18척의 함선"], crew:["개성 넘치는 승무원", "50명이 넘는 동료와 8개의 직위"],
        trade:["싸게 사서 비싸게 팔자", "18종의 화물, 자동 항로, 기지 투자"], battle:["해적 기지를 토벌하세요", "조준 게이지로 겨누는 포격 전투"],
        codex:["우주를 발견하고 기록하세요", "실제 천문학 지식이 담긴 도감"], intro:["138억 년 전, 우주의 시작으로", "당신의 항해가 지금 시작됩니다"],
        kicker:"우주 끝까지", tag:"지구에서 빅뱅까지, 우주 대항해" },
  en: { map:["Sail the Real Universe", "From Saturn's rings to distant galaxies"], nebula:["From Earth to the Big Bang", "7 universes, 60+ real celestial objects"],
        fleet:["Build Legendary Ships", "18 ships across 5 grades"], crew:["Recruit a Unique Crew", "50+ companions, 8 posts"],
        trade:["Buy Low, Sell High", "18 cargo types, Auto Routes, investments"], battle:["Raid Pirate Bases", "Aim-gauge cannon battles"],
        codex:["Discover and Record", "A Codex full of real astronomy"], intro:["To the Beginning of Time", "13.8 billion years. Your voyage starts now."],
        kicker:"To the Edge of Space", tag:"From Earth to the Big Bang" },
  es: { map:["Navega por el universo real", "De los anillos de Saturno a galaxias lejanas"], nebula:["De la Tierra al Big Bang", "7 universos, más de 60 objetos celestes reales"],
        fleet:["Construye naves legendarias", "18 naves de 5 grados"], crew:["Recluta una tripulación única", "Más de 50 compañeros y 8 cargos"],
        trade:["Compra barato, vende caro", "18 cargas, rutas automáticas e inversiones"], battle:["Asalta bases piratas", "Combates de cañones con medidor de puntería"],
        codex:["Descubre y registra", "Un Códice lleno de astronomía real"], intro:["Hacia el origen del tiempo", "13.800 millones de años. Tu viaje empieza ahora."],
        kicker:"Al confín del espacio", tag:"De la Tierra al Big Bang" },
  fr: { map:["Naviguez dans le vrai univers", "Des anneaux de Saturne aux galaxies lointaines"], nebula:["De la Terre au Big Bang", "7 univers, plus de 60 astres réels"],
        fleet:["Bâtissez des vaisseaux légendaires", "18 vaisseaux répartis en 5 rangs"], crew:["Recrutez un équipage unique", "Plus de 50 compagnons, 8 postes"],
        trade:["Achetez bas, vendez haut", "18 cargaisons, routes auto et investissements"], battle:["Attaquez les bases pirates", "Combats au canon avec jauge de visée"],
        codex:["Découvrez et répertoriez", "Un Codex rempli de vraie astronomie"], intro:["Vers l'origine du temps", "13,8 milliards d'années. Votre voyage commence."],
        kicker:"Jusqu’aux confins de l’espace", tag:"De la Terre au Big Bang" },
  it: { map:["Naviga nell'universo reale", "Dagli anelli di Saturno alle galassie lontane"], nebula:["Dalla Terra al Big Bang", "7 universi, oltre 60 corpi celesti reali"],
        fleet:["Costruisci navi leggendarie", "18 navi in 5 gradi"], crew:["Recluta un equipaggio unico", "Oltre 50 compagni e 8 ruoli"],
        trade:["Compra a poco, vendi a tanto", "18 carichi, rotte automatiche e investimenti"], battle:["Assalta le basi pirata", "Battaglie a cannonate con indicatore di mira"],
        codex:["Scopri e cataloga", "Un Codex pieno di vera astronomia"], intro:["Verso l'inizio del tempo", "13,8 miliardi di anni. Il viaggio inizia ora."],
        kicker:"Fino ai confini dello spazio", tag:"Dalla Terra al Big Bang" },
  pt: { map:["Navegue pelo universo real", "Dos anéis de Saturno a galáxias distantes"], nebula:["Da Terra ao Big Bang", "7 universos, mais de 60 corpos celestes reais"],
        fleet:["Construa naves lendárias", "18 naves em 5 níveis"], crew:["Recrute uma tripulação única", "Mais de 50 companheiros e 8 cargos"],
        trade:["Compre barato, venda caro", "18 cargas, rotas automáticas e investimentos"], battle:["Invada bases piratas", "Batalhas de canhão com medidor de mira"],
        codex:["Descubra e registre", "Um Códex cheio de astronomia real"], intro:["Rumo ao início do tempo", "13,8 bilhões de anos. Sua viagem começa agora."],
        kicker:"Até os confins do espaço", tag:"Da Terra ao Big Bang" },
  ja: { map:["本物の宇宙を航海しよう", "土星の環から遥かな銀河まで"], nebula:["地球からビッグバンまで", "7つの宇宙、60以上の実在の天体"],
        fleet:["伝説の艦船を建造しよう", "5つの等級、18隻の艦船"], crew:["個性豊かなクルー", "50人以上の仲間と8つの役職"],
        trade:["安く買って高く売ろう", "18種類の貨物、自動航路、基地投資"], battle:["海賊基地を討伐しよう", "照準ゲージで狙う砲撃バトル"],
        codex:["発見して記録しよう", "本物の天文学が詰まった図鑑"], intro:["138億年前、宇宙のはじまりへ", "あなたの航海が、いま始まる"],
        kicker:"宇宙の果てまで", tag:"地球からビッグバンまで、宇宙大航海" },
  zhs:{ map:["航行于真实的宇宙", "从土星光环到遥远星系"], nebula:["从地球到宇宙大爆炸", "7个宇宙，60多个真实天体"],
        fleet:["建造传奇舰船", "5个等级，18艘舰船"], crew:["个性鲜明的船员", "50多位伙伴，8个职位"],
        trade:["低买高卖", "18种货物、自动航线、基地投资"], battle:["讨伐海盗基地", "用瞄准条进行炮击战斗"],
        codex:["发现并记录宇宙", "满载真实天文知识的图鉴"], intro:["驶向138亿年前的宇宙起点", "你的航程，现在开始"],
        kicker:"直抵宇宙尽头", tag:"从地球到宇宙大爆炸" },
  zht:{ map:["航行於真實的宇宙", "從土星光環到遙遠星系"], nebula:["從地球到宇宙大爆炸", "7個宇宙，60多個真實天體"],
        fleet:["建造傳奇艦船", "5個等級，18艘艦船"], crew:["個性鮮明的船員", "50多位夥伴，8個職位"],
        trade:["低買高賣", "18種貨物、自動航線、基地投資"], battle:["討伐海盜基地", "用瞄準條進行砲擊戰鬥"],
        codex:["發現並記錄宇宙", "滿載真實天文知識的圖鑑"], intro:["駛向138億年前的宇宙起點", "你的航程，現在開始"],
        kicker:"直抵宇宙盡頭", tag:"從地球到宇宙大爆炸" },
};
const FONT = { ko:'"Malgun Gothic"', ja:'"Yu Gothic UI","Yu Gothic","Meiryo"', zhs:'"Microsoft YaHei"', zht:'"Microsoft JhengHei"' };
const fontOf = l => (FONT[l] ? FONT[l] + "," : "") + '"Segoe UI","Malgun Gothic",sans-serif';

/* 늘 같은 별이 찍히도록 씨앗 고정 */
function stars(n, w, h, seed){
  let s = seed >>> 0; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  let out = ""; for(let i = 0; i < n; i++){ const big = r() < 0.07, sz = big ? 2.5 + r() * 2.5 : 0.8 + r() * 1.6;
    out += `<i style="left:${(r() * w).toFixed(0)}px;top:${(r() * h).toFixed(0)}px;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;opacity:${(0.35 + r() * 0.65).toFixed(2)};${big ? "box-shadow:0 0 10px 3px rgba(180,210,255,.55);" : ""}"></i>`; }
  return out;
}
const BASE_CSS = `*{margin:0;padding:0;box-sizing:border-box} html,body{width:100%;height:100%;overflow:hidden}
  body{background:radial-gradient(120% 80% at 40% 20%,#15255a 0%,#070c1f 55%,#02030a 100%);color:#fff;position:relative}
  .neb{position:absolute;border-radius:50%;filter:blur(70px);mix-blend-mode:screen}
  .sky i{position:absolute;border-radius:50%;background:#fff}`;

function shotHTML(lang, scene, i, url){
  const [h, sub] = CAP[lang][scene], cjk = ["ko", "ja", "zhs", "zht"].includes(lang);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  body{font-family:${fontOf(lang)}}
  .n1{width:900px;height:620px;left:-320px;top:-240px;background:radial-gradient(closest-side,rgba(226,115,58,.7),rgba(140,40,90,.3) 60%,transparent)}
  .n2{width:820px;height:820px;right:-420px;top:${300 + (i % 3) * 180}px;background:radial-gradient(closest-side,rgba(60,120,255,.55),rgba(70,32,140,.25) 60%,transparent)}
  .cap{position:absolute;left:70px;right:70px;top:120px;text-align:center}
  .kick{display:inline-flex;align-items:center;gap:18px;font-size:30px;letter-spacing:.32em;color:#9fc2ff;font-weight:600;margin-bottom:22px}
  .kick:before,.kick:after{content:"";width:60px;height:2px;background:linear-gradient(90deg,transparent,#7fb6ff)} .kick:after{transform:scaleX(-1)}
  h1{font-size:${cjk ? 84 : 76}px;line-height:1.18;word-break:keep-all;text-wrap:balance;font-weight:800;letter-spacing:${cjk ? "-.01em" : "-.005em"};
     background:linear-gradient(180deg,#ffffff 30%,#ffd2ad);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 4px 18px rgba(255,140,70,.35))}
  p{word-break:keep-all;text-wrap:balance;margin-top:22px;font-size:${cjk ? 40 : 38}px;line-height:1.35;color:#c4d2ec;font-weight:500}
  .dev{position:absolute;left:50%;top:${cjk ? 520 : 540}px;width:820px;height:1458px;transform:translateX(-50%);border-radius:56px;padding:14px;
       background:linear-gradient(160deg,#3a4a72,#121a33 40%,#0a0f22);box-shadow:0 0 0 2px rgba(150,200,255,.35),0 0 80px rgba(80,150,255,.35),0 30px 80px rgba(0,0,0,.6)}
  .dev img{width:100%;height:100%;border-radius:44px;display:block;object-fit:cover;object-position:top}
  .glow{position:absolute;left:50%;bottom:-260px;width:1400px;height:520px;transform:translateX(-50%);border-radius:50%;
        background:radial-gradient(closest-side,rgba(255,150,80,.45),transparent);filter:blur(30px)}
  </style></head><body>
  <div class="neb n1"></div><div class="neb n2"></div><div class="sky">${stars(160, 1080, 1920, 7 + i * 31)}</div><div class="glow"></div>
  <div class="cap"><div class="kick">VOYAGE</div><h1>${h}</h1><p>${sub}</p></div>
  <div class="dev"><img src="${url}store/raw/${lang}/${scene}.png"></div>
  </body></html>`;
}

function featureHTML(lang, url){
  const c = CAP[lang], cjk = ["ko", "ja", "zhs", "zht"].includes(lang);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
  body{font-family:${fontOf(lang)}}
  .n1{width:620px;height:420px;left:-200px;top:-200px;background:radial-gradient(closest-side,rgba(226,115,58,.75),rgba(140,40,90,.3) 60%,transparent)}
  .n2{width:560px;height:560px;right:-140px;top:-120px;background:radial-gradient(closest-side,rgba(60,120,255,.6),rgba(70,32,140,.25) 60%,transparent)}
  .earth{position:absolute;left:50%;top:430px;width:1700px;height:1700px;margin-left:-850px;border-radius:50%;
     background:radial-gradient(circle at 50% 0%,#3a8fd6,#1a5aa4 6%,#0b2f5e 18%,#030a1c 45%);
     box-shadow:0 0 30px 6px rgba(124,196,255,.7),0 0 120px 30px rgba(60,130,255,.35),inset 0 6px 12px rgba(220,240,255,.7)}
  .txt{position:absolute;left:64px;top:0;bottom:70px;width:560px;display:flex;flex-direction:column;justify-content:center}
  .kick{font-size:${cjk ? 30 : 24}px;letter-spacing:${cjk ? ".35em" : ".22em"};color:#a9c6ff;font-weight:600;margin-bottom:6px}
  h1{font-size:118px;font-weight:200;letter-spacing:.16em;line-height:1;color:#f4f7ff;text-shadow:0 0 22px rgba(127,182,255,.75),0 0 60px rgba(80,140,255,.4)}
  .tag{margin-top:18px;font-size:${cjk ? 28 : 25}px;color:#ffb27a;font-weight:600;letter-spacing:.06em;text-shadow:0 0 14px rgba(217,111,50,.6)}
  .ship{position:absolute;right:-6px;top:-10px;width:470px;height:470px;filter:drop-shadow(0 0 30px rgba(120,190,255,.45))}
  </style></head><body>
  <div class="neb n1"></div><div class="neb n2"></div><div class="sky">${stars(110, 1024, 430, 99)}</div><div class="earth"></div>
  <div class="txt"><div class="kick">${c.kicker}</div><h1>VOYAGE</h1><div class="tag">${c.tag}</div></div>
  <img class="ship" src="${url}assets/emblem.png">
  </body></html>`;
}

/* 그림이 모두 그려질 때까지 기다린다 */
const fitTitle = page => page.evaluate(() => { const h = document.querySelector(".cap h1"); if(!h) return;
  let fs = parseFloat(getComputedStyle(h).fontSize); const lh = () => parseFloat(getComputedStyle(h).lineHeight);
  while((h.scrollHeight > lh() * 2.2 || h.scrollWidth > h.clientWidth + 1) && fs > 52){ fs -= 2; h.style.fontSize = fs + "px"; } });
const imgsReady = page => page.evaluate(() => Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))).then(() => document.fonts.ready));

(async () => {
  const { server, url } = await serve();
  const browser = await puppeteer.launch({ executablePath:findBrowser(), headless:true });
  try{
    const page = await browser.newPage();
    for(const lang of LANGS){
      const dir = path.join(ROOT, "store", "screenshots", lang); fs.mkdirSync(dir, { recursive:true });
      await page.setViewport({ width:1080, height:1920, deviceScaleFactor:1 });
      for(const [i, scene] of ORDER.entries()){
        if(!fs.existsSync(path.join(ROOT, "store", "raw", lang, scene + ".png"))){ console.log(`  건너뜀: raw/${lang}/${scene}.png 없음`); continue; }
        await page.setContent(shotHTML(lang, scene, i, url), { waitUntil:"load" }); await imgsReady(page); await fitTitle(page);
        const f = path.join(dir, `${String(i + 1).padStart(2, "0")}-${scene}.png`); await page.screenshot({ path:f });
        console.log(path.relative(ROOT, f));
      }
      fs.mkdirSync(path.join(ROOT, "store", "feature"), { recursive:true });
      await page.setViewport({ width:1024, height:500, deviceScaleFactor:1 });
      await page.setContent(featureHTML(lang, url), { waitUntil:"load" }); await imgsReady(page);
      await page.screenshot({ path:path.join(ROOT, "store", "feature", lang + ".png") }); console.log(`store/feature/${lang}.png`);
    }
  } finally { await browser.close(); server.close(); }
})();
