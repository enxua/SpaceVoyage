#!/usr/bin/env node
/* store/play-listing.md 의 언어별 앱 이름 · 간단한 설명 · 자세한 설명이 구글 플레이 글자 수 제한(30 / 80 / 4000) 안에 드는지 확인한다 */
const fs = require("fs"), path = require("path");
const md = fs.readFileSync(path.resolve(__dirname, "..", "store", "play-listing.md"), "utf8");
const LIMITS = [30, 80, 4000];
let bad = 0;
for(const sec of md.split(/^## /m).slice(1)){
  const lang = sec.split("\n")[0].trim(), blocks = [...sec.matchAll(/```\n([\s\S]*?)\n```/g)].map(m => m[1]);
  if(blocks.length !== 3) continue;
  const lens = blocks.map(b => [...b].length);                  /* 코드 포인트 기준 글자 수 */
  const over = lens.map((n, i) => n > LIMITS[i]);
  if(over.some(Boolean)) bad++;
  console.log(`${lang.padEnd(18)} 이름 ${lens[0]}/30${over[0] ? " ✗" : ""} · 간단 ${lens[1]}/80${over[1] ? " ✗" : ""} · 자세히 ${lens[2]}/4000${over[2] ? " ✗" : ""}${/—/.test(sec) ? " · 긴 줄표 있음 ✗" : ""}`);
  if(/—/.test(sec)) bad++;
}
console.log(bad ? `${bad} problem(s)` : "모두 제한 안에 있음");
process.exit(bad ? 1 : 0);
