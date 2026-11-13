#!/usr/bin/env node
/* ══════════════════ 앱용 웹 파일 모으기 ══════════════════
   게임에 필요한 파일만 www/ 로 복사한다 (Capacitor 의 webDir).
   node tools/build-web.js   →  이후 npx cap sync android
   새 폴더·파일을 게임에서 쓰기 시작하면 아래 FILES 에 추가한다. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "www");
const FILES = ["index.html", "js", "image"];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for(const f of FILES) fs.cpSync(path.join(ROOT, f), path.join(OUT, f), { recursive: true });
console.log("www/ ← " + FILES.join(", "));
