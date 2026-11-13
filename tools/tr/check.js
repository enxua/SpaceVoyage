/* 번역 조각 검사·합치기.  node tools/tr/check.js <언어>          조각(tools/tr/<언어>-N.json)이 원문과 맞는지 검사
                         node tools/tr/check.js <언어> build    검사 후 js/lang/<언어>.js 로 합친다 */
const fs = require("fs"), path = require("path");
const lang = process.argv[2], build = process.argv[3] === "build", dir = __dirname;
if(!lang){ console.log("usage: node tools/tr/check.js <lang> [build]"); process.exit(1); }
const slots = s => (s.match(/[{]\d+[}]/g) || []).sort().join(",");
const tags = s => (s.match(/<[^>]+>/g) || []).sort().join("");
const HANGUL = /[가-힣]/;
let bad = 0, total = 0; const table = {};
for(let n = 1; fs.existsSync(path.join(dir, `keys-${n}.json`)); n++){
  const keys = JSON.parse(fs.readFileSync(path.join(dir, `keys-${n}.json`), "utf8")), f = path.join(dir, `${lang}-${n}.json`);
  if(!fs.existsSync(f)){ console.log(`chunk ${n}: MISSING FILE ${lang}-${n}.json`); bad++; continue; }
  let tr; try{ tr = JSON.parse(fs.readFileSync(f, "utf8")); }catch(e){ console.log(`chunk ${n}: INVALID JSON - ${e.message}`); bad++; continue; }
  if(!Array.isArray(tr) || tr.length !== keys.length){ console.log(`chunk ${n}: LENGTH ${Array.isArray(tr)?tr.length:"not an array"} != ${keys.length}`); bad++; continue; }
  keys.forEach((k, i) => { const t = tr[i]; total++;
    const err = typeof t !== "string" || !t.trim() ? "empty" : slots(k) !== slots(t) ? "placeholders differ" : tags(k) !== tags(t) ? "HTML tags differ" : HANGUL.test(t) ? "Korean left" :
      k.includes("{ship}") !== t.includes("{ship}") ? "{ship} token" : (k.match(/\n/g)||[]).length !== (t.match(/\n/g)||[]).length ? "line breaks differ" : null;
    if(err){ bad++; if(bad <= 25) console.log(`chunk ${n} #${i}: ${err}\n   KO: ${JSON.stringify(k).slice(0,150)}\n   TR: ${JSON.stringify(t).slice(0,150)}`); }
    else table[k] = t; });
}
/* 나중에 추가한 문구: tools/tr/extra.json 의 { 원문: { 언어: 번역 } } */
const extraFile = path.join(dir, "extra.json");
if(fs.existsSync(extraFile)){ const extra = JSON.parse(fs.readFileSync(extraFile, "utf8"));
  for(const k of Object.keys(extra)){ const t = extra[k][lang]; total++;
    const err = typeof t !== "string" || !t.trim() ? "empty" : slots(k) !== slots(t) ? "placeholders differ" : tags(k) !== tags(t) ? "HTML tags differ" : HANGUL.test(t) ? "Korean left" : null;
    if(err){ bad++; console.log(`extra: ${err}\n   KO: ${JSON.stringify(k).slice(0,150)}\n   TR: ${JSON.stringify(t).slice(0,150)}`); } else table[k] = t; } }
console.log(`${lang}: ${total - bad}/${total} ok, ${bad} problem(s)`);
if(build && !bad){ const out = path.resolve(dir, "..", "..", "js", "lang", lang + ".js");
  fs.writeFileSync(out, `/* VOYAGE - ${lang} : 자동 생성 (tools/tr/check.js build). 원문(한국어) → 번역 */\nI18N.${lang} = ${JSON.stringify(table, null, 0).replace(/","/g, '",\n"')};\n`);
  console.log("built " + out); }
process.exit(bad ? 1 : 0);
