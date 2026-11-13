/* 프로젝트 폴더를 그대로 내보내는 작은 웹 서버 (스크린샷 · 스토어 그림 도구용). serve() → { server, url } */
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..");
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg",
  ".json":"application/json", ".css":"text/css", ".svg":"image/svg+xml" };
function serve(){
  return new Promise(res => {
    const server = http.createServer((q, r) => {
      const p = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html"));
      if(!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ r.writeHead(404); r.end(); return; }
      r.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r);
    }).listen(0, "127.0.0.1", () => res({ server, url:`http://127.0.0.1:${server.address().port}/` }));
  });
}
const BROWSERS = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"];
const findBrowser = () => { const f = BROWSERS.find(x => fs.existsSync(x)); if(!f) throw new Error("크롬/엣지를 찾지 못했습니다"); return f; };
module.exports = { serve, findBrowser, ROOT };
