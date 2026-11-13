#!/usr/bin/env node
/* ══════════════════ 우주 끝까지: VOYAGE - 스토어 스크린샷 원본 찍기 ══════════════════
   설치된 크롬(또는 엣지)을 화면 없이 띄워 게임 장면을 1080×1920 으로 찍는다.
   보기 좋은 중반부 세이브(함선·승무원·재화)를 만들어 넣고 장면마다 창을 연다.
     node tools/shots.js            9개 언어 전부
     node tools/shots.js ko en      고른 언어만
   결과: store/raw/<언어>/<장면>.png  →  node tools/store-art.js 로 문구를 얹는다 */
const fs = require("fs"), path = require("path");
const { serve, findBrowser, ROOT } = require("./static-server");
const puppeteer = require("puppeteer-core");
const OUT = path.join(ROOT, "store", "raw");
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ["ko", "en", "es", "fr", "it", "pt", "ja", "zhs", "zht"];
const W = 405, H = 720, DPR = 1080 / 405;                     /* 1080 × 1920 (9:16) */

/* 중반부 세이브: 은하 중심까지 연 상태, 황금 성운호 기함, 승무원 10명 */
function showcaseSave(){
  const seen = {}; for(const k of ["prologue", "zone1", "zone2", "firstCrew", "firstDen", "sgra", "loss"]) seen[k] = true;
  Object.assign(state, { intro:false, day:212, flagship:"aurum", maxZ:2, theme:"dark", docked:null, storyInit:true });
  state.gold = 128450; state.gems = 340; state.sci = 2380;
  state.ships = { shuttle:2, tug:1, barge:0, probe:1, corvet:2, miner:1, cutter:0, hauler:1, destroy:1, freight:0, clipper:1, science:0, aurum:1, phantom:0 };
  state.crew = ["seraphine", "isabella", "amin", "leyla", "noah", "priya", "maya", "haruka", "marco", "cassandra"];
  state.crew.forEach((c, i) => state.aff[c] = 40 + i * 6);
  state.posts = {}; POSTS.forEach((p, i) => { state.posts[p.id] = state.crew[i]; });
  state.tech = { warp:2, tank:3, hull:3, gun:2, shield:2, scan:2, hold:3, scoop:1 };
  state.found = BODIES.filter(b => b.z <= 2).map(b => b.id); state.visited = BODIES.filter(b => b.z <= 1).map(b => b.id);
  state.story.seen = Object.assign(state.story.seen || {}, seen);
  Object.assign(state.stats, { wins:14, sell:96, pulls:22, quests:9 });
  const s = BODY_MAP.saturn; state.x = s.x; state.y = s.y; dockedAt = null;
  syncPosts(); save();
}

/* 장면: 이름 → 페이지 안에서 할 일 */
const SCENES = {
  intro:   null,                                                               /* 새 게임 첫 화면 */
  map:     () => { const b = BODY_MAP.saturn; state.x = b.x - 7; state.y = b.y + 9; cam.x = state.x; cam.y = state.y - 3; cam.s = 3.2; foldUI("crew", true); },
  nebula:  () => { const b = BODY_MAP.orionneb; state.x = b.x + 4; state.y = b.y + 6; cam.x = state.x; cam.y = state.y; cam.s = 1.2; foldUI("crew", true); },
  crew:    () => { foldUI("crew", false); openCrew(); },
  trade:   () => { const b = BODY_MAP.mars; state.x = b.x; state.y = b.y; dockedAt = "mars"; cam.x = b.x; cam.y = b.y; openTrade(); },
  fleet:   () => { openShip("aurum"); },
  battle:  () => { openRaid("d0"); },
  codex:   () => { openCodex(); },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = findBrowser(), { server:srv, url } = await serve();
  const browser = await puppeteer.launch({ executablePath:exe, headless:true, args:["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
  const only = process.env.SCENES ? process.env.SCENES.split(",") : Object.keys(SCENES);
  try{
    for(const lang of LANGS){
      const dir = path.join(OUT, lang); fs.mkdirSync(dir, { recursive:true });
      for(const name of only){
        const ctx = await browser.createBrowserContext(), page = await ctx.newPage();     /* 장면마다 깨끗한 저장소 */
        page.on("pageerror", e => console.log(`  [${lang}/${name}] page error: ${e.message}`));
        await page.setViewport({ width:W, height:H, deviceScaleFactor:DPR, isMobile:true, hasTouch:true });
        await page.goto(url, { waitUntil:"load" });
        await page.evaluate(l => { localStorage.clear(); localStorage.setItem("voyage_lang", l); }, lang);
        if(SCENES[name]){
          await page.reload({ waitUntil:"load" }); await sleep(400);
          await page.evaluate(showcaseSave);
          await page.reload({ waitUntil:"load" });
          /* 찍는 동안만: 승무원 컷 · 광고 제안 · 알림 · 보고 말풍선을 끈다 */
          await page.addStyleTag({ content:"#cutView,#adOffer,.toast{display:none!important}" });
          await page.evaluate(() => { cutTry = () => false; narrate = () => {}; speechQ = []; });
          await sleep(1200);
          await page.evaluate(`(${SCENES[name]})()`); await sleep(name === "battle" ? 1800 : 1400);
          await page.evaluate(() => { document.querySelectorAll(".toast").forEach(t => t.remove()); });
        } else {
          await page.reload({ waitUntil:"load" }); await sleep(3600);                  /* 처음 화면 등장 연출이 끝날 때까지 */
        }
        await page.screenshot({ path:path.join(dir, name + ".png") });
        console.log(`store/raw/${lang}/${name}.png`);
        await ctx.close();
      }
    }
  } finally { await browser.close(); srv.close(); }
})();
