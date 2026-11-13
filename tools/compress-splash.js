#!/usr/bin/env node
/* capacitor-assets 가 만든 안드로이드 시작 화면(splash.png)을 팔레트 PNG 로 줄인다 (약 10MB → 4MB, 화질 차이 거의 없음) */
const sharp = require("sharp"), fs = require("fs"), path = require("path");
const R = path.resolve(__dirname, "..", "android", "app", "src", "main", "res");
(async () => {
  let before = 0, after = 0;
  for(const d of fs.readdirSync(R)){
    const f = path.join(R, d, "splash.png"); if(!fs.existsSync(f)) continue;
    const b = fs.readFileSync(f), o = await sharp(b).png({ palette:true, quality:90, dither:1, compressionLevel:9 }).toBuffer();
    if(o.length < b.length){ fs.writeFileSync(f, o); before += b.length; after += o.length; }
  }
  console.log(`splash ${(before / 1e6).toFixed(2)}MB -> ${(after / 1e6).toFixed(2)}MB`);
})();
