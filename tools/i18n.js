#!/usr/bin/env node
/* ══════════════════ 다국어(i18n) 도구 ══════════════════
   게임 문구는 코드에 한국어로 쓰고, __`…` / __("…") 로 감싸면 실행 중에 선택한 언어로 바뀐다.
   번역문은 js/lang/<언어>.js 에 "한국어 원문(틀)" → "번역문" 표로 들어 있다.

   node tools/i18n.js tag      새로 쓴 한국어 문구를 자동으로 __ 로 감싼다 (이미 감싼 것은 그대로)
   node tools/i18n.js extract  코드에서 번역 대상 문구를 모아 tools/i18n-keys.json 으로 저장
   node tools/i18n.js check    언어별로 빠진 번역·남는 번역·자리표시({0}) 불일치를 보고
   node tools/i18n.js todo <언어>  그 언어에 아직 번역이 없는 문구만 tools/todo-<언어>.json 으로 저장

   새 문구를 추가한 뒤: tag → extract → todo/번역 추가 → check 순서로 돌린다. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const JS_FILES = ["js/data.js", "js/guard.js", "js/game.js", "js/ui.js", "js/fx.js", "js/world.js", "js/fate.js", "js/ads.js", "js/admob.js", "js/billing.js", "js/cloud.js", "js/chat.js", "js/cuts.js", "js/story.js", "js/audio.js", "js/mobile.js"];
const LANGS = ["en", "es", "fr", "it", "pt", "ja", "zhs", "zht"];
const HANGUL = /[가-힣]/;
const INLINE = new Set(["b", "i", "br", "span", "em", "strong", "small"]);     /* 문장 안에 섞여 있어도 문장을 끊지 않는 태그 */

/* ── 자바스크립트 훑기: 문자열·템플릿·주석·정규식을 구분한다 ── */
function transform(src, onKey){
  let i = 0;
  const hasSkip = pos => { const a = src.lastIndexOf("\n", pos-1)+1, b = src.indexOf("\n", pos); return src.slice(a, b < 0 ? src.length : b).includes("i18n-skip"); };
  function readString(q){                       /* i는 여는 따옴표 위치 */
    let j = i+1; while(j < src.length && src[j] !== q){ if(src[j] === "\\") j++; j++; }
    const lit = src.slice(i, j+1); i = j+1; return lit;
  }
  function readRegex(){
    let j = i+1, cls = false;
    while(j < src.length){ const c = src[j]; if(c === "\\"){ j += 2; continue; } if(c === "[") cls = true; else if(c === "]") cls = false; else if(c === "/" && !cls) break; else if(c === "\n") return null; j++; }
    j++; while(/[a-z]/.test(src[j]||"")) j++;
    const lit = src.slice(i, j); i = j; return lit;
  }
  function code(inExpr){
    let out = "", depth = 0, prev = "", word = "";
    while(i < src.length){
      const c = src[i], n = src[i+1];
      if(c === "/" && n === "/"){ const j = src.indexOf("\n", i); const e = j < 0 ? src.length : j; out += src.slice(i, e); i = e; continue; }
      if(c === "/" && n === "*"){ const j = src.indexOf("*/", i+2)+2; out += src.slice(i, j); i = j; continue; }
      if(c === '"' || c === "'"){
        const start = i, lit = readString(c);
        const already = /__\($/.test(out.replace(/\s+$/, ""));
        let k = i; while(/\s/.test(src[k]||"")) k++;
        const isKey = src[k] === ":" && (prev === "{" || prev === ",");
        if(HANGUL.test(lit) && !already && !isKey && !hasSkip(start)){ out += "__(" + lit + ")"; if(onKey) onKey(evalLit(lit)); }
        else { out += lit; if(already && onKey && HANGUL.test(lit)) onKey(evalLit(lit)); }
        prev = '"'; word = ""; continue;
      }
      if(c === "`"){
        const start = i, tagged = /__$/.test(out);
        i++; const parts = template();
        out += emitTemplate(parts, tagged, hasSkip(start));
        prev = "`"; word = ""; continue;
      }
      if(c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^\n".includes(prev) || ["return","typeof","case","in","of"].includes(word))){
        const save = i, r = readRegex(); if(r !== null){ out += r; prev = "/"; word = ""; continue; } i = save;
      }
      if(c === "{") depth++;
      if(c === "}"){ if(inExpr && depth === 0) return out; depth--; }
      out += c; i++;
      if(/[A-Za-z0-9_$]/.test(c)) word = /[A-Za-z0-9_$]/.test(prev) ? word + c : c; else if(!/\s/.test(c)) word = "";
      if(!/\s/.test(c) || c === "\n") prev = c;
    }
    return out;
  }
  function template(){                          /* i는 여는 ` 다음. [{q:원문} | {e:바뀐 코드}] */
    const parts = []; let q = "";
    while(i < src.length){
      const c = src[i];
      if(c === "\\"){ q += src.slice(i, i+2); i += 2; continue; }
      if(c === "`"){ i++; break; }
      if(c === "$" && src[i+1] === "{"){ parts.push({ q }); q = ""; i += 2; const e = code(true); i++; parts.push({ e }); continue; }
      q += c; i++;
    }
    parts.push({ q }); return parts;
  }
  const rawOf = parts => parts.map(p => p.e !== undefined ? "${" + p.e + "}" : p.q).join("");
  function keyOf(parts){ let k = "", n = 0; for(const p of parts) k += p.e !== undefined ? "{" + (n++) + "}" : cook(p.q); return k; }
  function emitTemplate(parts, tagged, skip){
    const qs = parts.filter(p => p.q !== undefined).map(p => p.q).join("");
    if(tagged){ if(onKey) onKey(keyOf(parts)); return "`" + rawOf(parts) + "`"; }
    if(skip || !HANGUL.test(qs)) return "`" + rawOf(parts) + "`";
    if(!qs.includes("<")){ if(onKey) onKey(keyOf(parts)); return "__`" + rawOf(parts) + "`"; }
    /* HTML이 섞인 템플릿: 태그 사이의 글 덩어리만 감싼다 */
    const items = [];                             /* {c:글자(이스케이프 포함)} | {e:코드} */
    for(const p of parts){ if(p.e !== undefined){ items.push({ e:p.e }); continue; }
      for(let k = 0; k < p.q.length; k++){ if(p.q[k] === "\\"){ items.push({ c:p.q.slice(k, k+2) }); k++; } else items.push({ c:p.q[k] }); } }
    const str = a => a.map(x => x.e !== undefined ? "${" + x.e + "}" : x.c).join("");
    const text = a => a.map(x => x.e !== undefined ? "" : x.c).join("");
    let out = "", run = [], k = 0;
    const flush = () => {
      if(!run.length) return;
      if(!HANGUL.test(text(run))){ out += str(run); run = []; return; }
      let a = 0, b = run.length;
      while(a < b && run[a].c !== undefined && /\s/.test(run[a].c)) a++;
      while(b > a && run[b-1].c !== undefined && /\s/.test(run[b-1].c)) b--;
      const core = run.slice(a, b), ps = [];
      let q = ""; for(const x of core){ if(x.e !== undefined){ ps.push({ q }); q = ""; ps.push({ e:x.e }); } else q += x.c; } ps.push({ q });
      if(onKey) onKey(keyOf(ps));
      out += str(run.slice(0, a)) + "${__`" + str(core) + "`}" + str(run.slice(b)); run = [];
    };
    while(k < items.length){
      const it = items[k];
      if(it.c === "<" && items[k+1] && items[k+1].c !== undefined && /[A-Za-z\/!]/.test(items[k+1].c)){
        let j = k+1, quote = null;
        while(j < items.length){ const x = items[j]; if(x.c !== undefined){ if(quote){ if(x.c === quote) quote = null; } else if(x.c === '"' || x.c === "'") quote = x.c; else if(x.c === ">") break; } j++; }
        const tag = items.slice(k, j+1), ttxt = text(tag), name = (ttxt.match(/^<\/?([A-Za-z0-9]+)/)||[])[1] || "";
        if(INLINE.has(name.toLowerCase()) && !HANGUL.test(ttxt)){ run.push(...tag); k = j+1; continue; }
        flush(); out += wrapAttrs(tag, str, text); k = j+1; continue;
      }
      run.push(it); k++;
    }
    flush();
    return "`" + out + "`";
  }
  /* 태그 안의 title="…" 같은 속성값에 한국어가 있으면 그 값만 감싼다 */
  function wrapAttrs(tag, str, text){
    if(!HANGUL.test(text(tag))) return str(tag);
    let out = "", k = 0;
    while(k < tag.length){
      const x = tag[k];
      if(x.c === '"'){ let j = k+1; while(j < tag.length && tag[j].c !== '"') j++;
        const val = tag.slice(k+1, j);
        if(HANGUL.test(text(val))){ const ps = []; let q = ""; for(const y of val){ if(y.e !== undefined){ ps.push({ q }); q = ""; ps.push({ e:y.e }); } else q += y.c; } ps.push({ q });
          if(onKey) onKey(keyOf(ps)); out += '"${__`' + str(val) + '`}"'; }
        else out += '"' + str(val) + '"';
        k = j+1; continue; }
      out += x.e !== undefined ? "${" + x.e + "}" : x.c; k++;
    }
    return out;
  }
  return code(false);
}
const cook = q => { try{ return new Function("return `" + q + "`")(); }catch(e){ return q; } };
const evalLit = lit => { try{ return new Function("return " + lit)(); }catch(e){ return lit.slice(1, -1); } };

/* ── index.html: data-t(안쪽 내용) · data-t-title(title 속성) 이 붙은 요소가 번역 대상 ── */
function htmlKeys(){
  const s = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), keys = [];
  for(const m of s.matchAll(/<(\w+)\b[^>]*\bdata-t(?=[\s>])[^>]*>([\s\S]*?)<\/\1>/g)) keys.push(m[2].trim().replace(/\s*\n\s*/g, "\n"));
  for(const m of s.matchAll(/<\w+\b[^>]*\bdata-t-title\b[^>]*>/g)){ const t = m[0].match(/\btitle="([^"]*)"/); if(t) keys.push(t[1]); }
  return keys.filter(k => HANGUL.test(k));
}
function allKeys(){
  const keys = new Set();
  for(const f of JS_FILES) transform(fs.readFileSync(path.join(ROOT, f), "utf8"), k => { if(HANGUL.test(k)) keys.add(k); });
  for(const k of htmlKeys()) keys.add(k);
  return [...keys];
}
function loadLang(code){
  const f = path.join(ROOT, "js", "lang", code + ".js"); if(!fs.existsSync(f)) return null;
  const I18N = {}; new Function("I18N", fs.readFileSync(f, "utf8"))(I18N); return I18N[code] || {};
}
const slots = s => (s.match(/\{\d+\}/g) || []).sort().join(",");

const cmd = process.argv[2];
if(cmd === "tag"){
  for(const f of JS_FILES){ const p = path.join(ROOT, f), src = fs.readFileSync(p, "utf8"), out = transform(src, null);
    if(out !== src){ fs.writeFileSync(p, out); console.log("감쌈: " + f); } else console.log("변화 없음: " + f); }
} else if(cmd === "extract"){
  const keys = allKeys(); fs.writeFileSync(path.join(__dirname, "i18n-keys.json"), JSON.stringify(keys, null, 1));
  console.log(`번역 대상 문구 ${keys.length}개 → tools/i18n-keys.json`);
} else if(cmd === "check"){
  const keys = allKeys(); let bad = 0;
  for(const l of LANGS){ const t = loadLang(l); if(!t){ console.log(`${l}: 파일 없음`); bad++; continue; }
    const miss = keys.filter(k => !(k in t) || !String(t[k]).trim()), extra = Object.keys(t).filter(k => !keys.includes(k));
    const slot = keys.filter(k => k in t && slots(k) !== slots(t[k])), ko = keys.filter(k => k in t && HANGUL.test(t[k]) && l !== "ko");
    console.log(`${l}: 번역 ${keys.length-miss.length}/${keys.length} · 빠짐 ${miss.length} · 남음 ${extra.length} · 자리표시 불일치 ${slot.length} · 한글 남음 ${ko.length}`);
    for(const k of slot.slice(0, 5)) console.log("   자리표시: " + JSON.stringify(k).slice(0, 90));
    for(const k of ko.slice(0, 3)) console.log("   한글 남음: " + JSON.stringify(t[k]).slice(0, 90));
    if(miss.length || slot.length) bad++; }
  process.exit(bad ? 1 : 0);
} else if(cmd === "todo"){
  const l = process.argv[3], t = loadLang(l) || {}, keys = allKeys().filter(k => !(k in t));
  fs.writeFileSync(path.join(__dirname, `todo-${l}.json`), JSON.stringify(keys, null, 1)); console.log(`${l}: 번역할 문구 ${keys.length}개 → tools/todo-${l}.json`);
} else console.log("사용법: node tools/i18n.js tag | extract | check | todo <언어>");
