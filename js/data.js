"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 데이터 ══════════════════ */
const GRADES = {
  N:  { name:__("일반"), color:"#9aa2a8", rate:60 },
  R:  { name:__("고급"), color:"#4a90d9", rate:31.5 },
  SR: { name:__("희귀"), color:"#8e6fd8", rate:6.5 },
  SSR:{ name:__("영웅"), color:"#e0a63f", rate:1.5 },
  UR: { name:__("전설"), color:"#d96f32", rate:0.5 },
};
const GRADE_POW = { N:20, R:32, SR:48, SSR:70, UR:95 };

/* speed:px/s  cargo:적재량  fuel:100거리당 연료  luck:행운  sup:연료·산소 탱크  hull:선체 */
const SHIPS = [
  { id:"shuttle", g:"N",  name:__("낡은 셔틀"),       speed:46, cargo:20,  fuel:4.8, luck:0,  sup:120, hull:60,  shape:"dart",  len:22, wid:11 },
  { id:"tug",     g:"N",  name:__("궤도 예인선"),     speed:50, cargo:18,  fuel:4.2, luck:2,  sup:110, hull:70,  shape:"block", len:20, wid:12 },
  { id:"barge",   g:"N",  name:__("화물 바지선"),     speed:42, cargo:40,  fuel:5.4, luck:0,  sup:150, hull:75,  shape:"block", len:28, wid:15 },
  { id:"probe",   g:"N",  name:__("탐사 프로브선"),   speed:52, cargo:16,  fuel:4.0, luck:3,  sup:130, hull:55,  shape:"dart",  len:24, wid:9 },
  { id:"corvet",  g:"R",  name:__("코르벳"),          speed:60, cargo:38,  fuel:3.7, luck:4,  sup:190, hull:95,  shape:"wing",  len:30, wid:14 },
  { id:"miner",   g:"R",  name:__("채굴 프리깃"),     speed:56, cargo:55,  fuel:3.8, luck:3,  sup:220, hull:110, shape:"block", len:32, wid:15 },
  { id:"cutter",  g:"R",  name:__("쾌속 커터"),       speed:66, cargo:32,  fuel:3.4, luck:5,  sup:180, hull:85,  shape:"dart",  len:32, wid:10 },
  { id:"hauler",  g:"R",  name:__("성간 수송선"),     speed:58, cargo:48,  fuel:3.8, luck:3,  sup:210, hull:100, shape:"block", len:34, wid:13 },
  { id:"destroy", g:"SR", name:__("구축함"),          speed:78, cargo:60,  fuel:2.9, luck:6,  sup:290, hull:150, shape:"wing",  len:38, wid:15 },
  { id:"freight", g:"SR", name:__("대형 화물선"),     speed:72, cargo:88,  fuel:3.0, luck:5,  sup:340, hull:140, shape:"block", len:42, wid:16 },
  { id:"clipper", g:"SR", name:__("솔라 세일 클리퍼"),speed:88, cargo:52,  fuel:2.4, luck:8,  sup:260, hull:115, shape:"sail",  len:40, wid:20 },
  { id:"science", g:"SR", name:__("과학 순양함"),     speed:76, cargo:64,  fuel:2.8, luck:10, sup:300, hull:130, shape:"saucer",len:36, wid:18 },
  { id:"aurum",   g:"SSR",name:__("황금 성운호"),     speed:92, cargo:112, fuel:2.2, luck:15, sup:450, hull:180, shape:"wing",  len:46, wid:18, col:"#f6e7c5", trim:"#b8863f" },
  { id:"dread",   g:"SSR",name:__("중장갑 전함"),     speed:86, cargo:95,  fuel:2.3, luck:8,  sup:420, hull:240, shape:"block", len:48, wid:17, col:"#e3e5ea", trim:"#4a4f55" },
  { id:"phantom", g:"SSR",name:__("유령선 팬텀"),     speed:98, cargo:80,  fuel:1.6, luck:20, sup:380, hull:170, shape:"dart",  len:44, wid:13, col:"rgba(205,220,235,.6)", trim:"#7a8894" },
  { id:"helios",  g:"SSR",name:__("항성 채집선 헬리오스"), speed:94, cargo:120, fuel:1.9, luck:12, sup:480, hull:190, shape:"sail", len:46, wid:24, col:"#fdf0dc", trim:"#d96f32" },
  { id:"ark",     g:"UR", name:__("세대 우주선 방주"),speed:116,cargo:165, fuel:1.2, luck:25, sup:650, hull:280, shape:"saucer",len:54, wid:26, col:"#f3ead8", trim:"#8a6f4d" },
  { id:"levia",   g:"UR", name:__("차원 도약함 레비아탄"), speed:124,cargo:135, fuel:1.3, luck:30, sup:580, hull:300, shape:"wing", len:54, wid:20, col:"#e6ecf5", trim:"#3a5b6e" },
];
const SHIP_MAP = Object.fromEntries(SHIPS.map(s=>[s.id,s]));
const DUP_GOLD = { N:80, R:200, SR:600, SSR:2000, UR:6000 };
/* 함선 승성: 같은 함선을 또 얻으면 ★ 승성(최대 5, ★마다 제원 +10%), ★5 이후로는 1회 건조 값의 절반을 돌려준다 */
const SHIP_STAR = 0.1;
const shipRefund = () => Math.round(GACHA_COST/2);
const GACHA_COST = 5000, GACHA_TEN = 45000;
/* 승무원 뽑기: 이미 있는 승무원이 나오면 ★ 승성(최대 5, ★마다 능력 +10%), 그 뒤로는 1회 값의 절반을 돌려준다 */
const CREW_PULL = 3000, CREW_PULL_TEN = 27000, CREW_RATE = { N:60, R:30, SR:8, SSR:1.5, UR:0.5 }, STAR_MAX = 5, STAR_BONUS = 0.1, CREW_REFUND = CREW_PULL/2;
/* 천장: 건조·뽑기를 세어 100회째마다 확정 등급 (함선 SR, 승무원 SSR 이상) */
const PITY_N = 100;
const pity = () => state.pity || (state.pity = { ship:0, crew:0 });
const starOf = id => (state.stars && state.stars[id]) || 0, starMult = id => 1 + starOf(id)*STAR_BONUS;

/* 교역품 - z:주 산지 우주(멀리 가져갈수록 비싸짐) */
const GOODS = [
  { id:"ice",  name:__("물 얼음"),     base:30,  z:0, ic:"🧊" },
  { id:"ore",  name:__("금속 광석"),   base:50,  z:0, ic:"⛏" },
  { id:"he3",  name:__("헬륨-3"),      base:80,  z:0, ic:"🎈" },
  { id:"bio",  name:__("생명 배양체"), base:110, z:1, ic:"🧬" },
  { id:"chip", name:__("양자 칩"),     base:150, z:1, ic:"💾" },
  { id:"rare", name:__("희토류 결정"), base:190, z:2, ic:"💎" },
  { id:"nano", name:__("나노 합금"),   base:240, z:3, ic:"🔩" },
  { id:"anti", name:__("반물질"),      base:330, z:4, ic:"⚛" },
  { id:"dark", name:__("암흑물질"),    base:450, z:5, ic:"🌑" },
  { id:"relic",name:__("고대 유물"),   base:600, z:6, ic:"🏺" },
  /* 기지마다 파는 물건이 겹치지 않도록 늘린 품목 */
  { id:"food", name:__("식량 캡슐"),   base:40,  z:0, ic:"🥫" },
  { id:"solar",name:__("태양 전지"),   base:70,  z:0, ic:"🔋" },
  { id:"med",  name:__("의약품"),      base:130, z:1, ic:"💊" },
  { id:"plasma",name:__("항성 플라스마"),base:210,z:2, ic:"🔥" },
  { id:"super",name:__("초전도체"),    base:280, z:3, ic:"🧲" },
  { id:"neut", name:__("중성자 결정"), base:380, z:4, ic:"🔷" },
  { id:"flare",name:__("퀘이사 섬광석"),base:500,z:5, ic:"✴️" },
  { id:"proto",name:__("원시 수소"),   base:560, z:6, ic:"🫧" },
];
const GOOD_MAP = Object.fromEntries(GOODS.map(g=>[g.id,g]));

/* ══════════════════ 우주 지도 ══════════════════
   세로로 쌓인 7개의 우주. 아래(0)=태양계 → 위(6)=태초의 우주.  x:0~2000, f:우주 안에서의 높이(0~1) */
const WORLD_W = 2000, ZONE_H = 900, ZONE_N = 7, WORLD_H = ZONE_H*ZONE_N;
const ZONES = [
  { name:__("태양계"),         scale:"1 AU",        ic:"🌍", desc:__("태양과 여덟 행성의 우주") },
  { name:__("근거리 우주"),    scale:__("1 광년"),      ic:"⭐", desc:__("수십~수천 광년 이내의 별과 성단") },
  { name:__("우리 은하"),      scale:__("1천 광년"),    ic:"🌀", desc:__("지름 약 10만 광년의 막대나선은하") },
  { name:__("국부 은하군"),    scale:__("1백만 광년"),  ic:"🌌", desc:__("우리 은하가 속한 은하 집단") },
  { name:__("은하단·초은하단"),scale:__("1억 광년"),    ic:"✨", desc:__("수십~수천 개의 은하가 모인 거대 집단") },
  { name:__("우주 거대 구조"), scale:__("10억 광년"),   ic:"🕸", desc:__("은하들이 그물처럼 연결된 우주 거미줄") },
  { name:__("태초의 우주"),    scale:__("138억 년 전"), ic:"💥", desc:__("최초의 별, 우주배경복사, 그리고 빅뱅") },
];
const ZY = (z,f) => WORLD_H - (z+f)*ZONE_H;

/* k: planet|gas|moon|star|neb|gal|ell|clu|bh|stn|comet|probe|web|cmb|bang
   p:산지 품목 d:수요 품목 (기지만) · lm:true = 착륙 불가 랜드마크(발견 시 연구 데이터) */
const BODIES = [
/* ── 0. 태양계 ── */
{ id:"earth",  z:0,x:1000,f:.10, k:"planet",c:"#5b9bd8",c2:"#6fbf7a",r:15, name:__("지구"), p:["bio","chip"], d:["he3","rare"],
  fact:__("우리의 행성. 지금까지 생명이 확인된 유일한 천체.") },
{ id:"moon",   z:0,x:1130,f:.07, k:"moon",c:"#c9c6c0",r:7, name:__("달 기지"), p:["ore","ice"], d:["nano","rare"],
  fact:__("지구에서 약 38.4만 km. 표토에 헬륨-3가 쌓여 있다.") },
{ id:"venus",  z:0,x:860, f:.17, k:"planet",c:"#e8c98a",c2:"#d9a95e",r:13, name:__("금성"), lm:true,
  fact:__("표면 온도 460℃, 태양계에서 가장 뜨거운 행성.") },
{ id:"sun",    z:0,x:1000,f:.27, k:"star",c:"#ffb347",r:34, name:__("태양"), lm:true,
  fact:__("태양계 질량의 99.86%를 차지하는 G형 주계열성.") },
{ id:"mercury",z:0,x:1120,f:.23, k:"moon",c:"#b3a79a",r:6, name:__("수성"), lm:true,
  fact:__("태양에 가장 가까운 행성. 1년이 지구의 88일.") },
{ id:"mars",   z:0,x:700, f:.30, k:"planet",c:"#d9775a",c2:"#b85a3e",r:11, name:__("화성"), p:["ore","ice"], d:["chip","bio"],
  fact:__("산화철 때문에 붉게 보인다. 올림푸스 산의 높이는 약 22km.") },
{ id:"ceres",  z:0,x:1320,f:.40, k:"moon",c:"#a9a39a",r:6, name:__("세레스"), p:["ore","ice"], d:["chip","nano"],
  fact:__("화성과 목성 사이 소행성대에서 가장 큰 왜행성.") },
{ id:"jupiter",z:0,x:600, f:.54, k:"gas",c:"#d8b08a",c2:"#b98562",r:26, name:__("목성"), p:["he3","ice"], d:["bio","nano"],
  fact:__("태양계 최대의 행성. 대적점은 지구보다 큰 폭풍이다.") },
{ id:"saturn", z:0,x:1420,f:.64, k:"gas",c:"#e6cf9a",c2:"#cdb27a",r:22,ring:1, name:__("토성"), p:["he3","nano"], d:["chip","ore"],
  fact:__("얼음과 암석 조각으로 이루어진 거대한 고리를 가졌다.") },
{ id:"uranus", z:0,x:880, f:.72, k:"planet",c:"#9fd9dc",c2:"#8ccfd3",r:16, name:__("천왕성"), lm:true,
  fact:__("자전축이 98° 기울어 옆으로 누워서 공전한다.") },
{ id:"neptune",z:0,x:480, f:.80, k:"planet",c:"#5f8fe0",c2:"#4a78c8",r:16, name:__("해왕성"), p:["ice","he3"], d:["bio","chip"],
  fact:__("태양계에서 가장 빠른 바람(시속 2,100km)이 분다.") },
{ id:"halley", z:0,x:300, f:.42, k:"comet",c:"#bfe3f5",r:6, name:__("핼리 혜성"), lm:true,
  fact:__("약 76년 주기로 돌아오는 혜성. 다음 귀환은 2061년.") },
{ id:"pluto",  z:0,x:1500,f:.90, k:"moon",c:"#d6c4ae",r:7, name:__("명왕성"), p:["ice","rare"], d:["bio","nano"],
  fact:__("카이퍼 벨트의 왜행성. 하트 모양의 질소 얼음 평원이 있다.") },
{ id:"voyager",z:0,x:1000,f:.96, k:"probe",c:"#888",r:6, name:__("보이저 1호"), lm:true,
  fact:__("1977년 발사. 인류가 만든 가장 멀리 간 물체로 성간 공간을 항해 중.") },
/* ── 1. 근거리 우주 ── */
{ id:"proxima",z:1,x:1000,f:.12, k:"star",c:"#ff8a5c",r:12, name:__("프록시마 b"), p:["bio","ore"], d:["chip","he3"],
  fact:__("4.24광년 거리, 태양에서 가장 가까운 별의 행성.") },
{ id:"alphacen",z:1,x:1140,f:.16, k:"star",c:"#ffe08a",r:16, name:__("알파 센타우리"), lm:true,
  fact:__("4.37광년 떨어진 삼중성계. 가장 가까운 이웃 항성계.") },
{ id:"barnard",z:1,x:560, f:.25, k:"star",c:"#ff7a5a",r:11, name:__("바너드 별"), p:["ore","rare"], d:["bio","ice"],
  fact:__("5.96광년 거리의 적색왜성. 밤하늘에서 가장 빠르게 움직이는 별.") },
{ id:"sirius", z:1,x:1400,f:.34, k:"star",c:"#bcd8ff",r:18, name:__("시리우스"), p:["chip","nano"], d:["he3","ore"],
  fact:__("밤하늘에서 가장 밝은 별. 8.6광년 거리의 쌍성.") },
{ id:"wolf359",z:1,x:880, f:.36, k:"star",c:"#ff6a4a",r:8, name:__("울프 359"), lm:true,
  fact:__("7.9광년 거리. 알려진 별 중 가장 어두운 축에 드는 적색왜성.") },
{ id:"vega",   z:1,x:700, f:.52, k:"star",c:"#cfe2ff",r:17, name:__("베가"), p:["nano","chip"], d:["rare","bio"],
  fact:__("25광년 거리의 직녀성. 1.2만 년 뒤에는 북극성이 된다.") },
{ id:"trappist",z:1,x:1250,f:.60, k:"star",c:"#ff7f66",r:11, name:__("트라피스트-1"), p:["bio","ice"], d:["nano","anti"],
  fact:__("지구 크기 행성 7개가 도는 별. 그중 3개는 생명 가능 지대.") },
{ id:"aldebaran",z:1,x:1620,f:.70, k:"star",c:"#ffa861",r:20, name:__("알데바란"), lm:true,
  fact:__("황소자리의 눈. 태양 지름의 44배인 적색거성.") },
{ id:"betel",  z:1,x:450, f:.76, k:"star",c:"#ff6b4a",r:26, name:__("베텔게우스"), p:["rare","anti"], d:["chip","ice"],
  fact:__("태양 지름의 약 760배. 머지않아 초신성으로 폭발할 적색초거성.") },
{ id:"rigel",  z:1,x:920, f:.80, k:"star",c:"#a9c8ff",r:20, name:__("리겔"), lm:true,
  fact:__("오리온자리의 청색초거성. 태양보다 12만 배 밝다.") },
{ id:"pleiades",z:1,x:1500,f:.87, k:"clu",c:"#9ec3ff",r:30, name:__("플레이아데스"), p:["rare","he3"], d:["bio","nano"],
  fact:__("M45, 좀생이별. 444광년 거리의 젊은 푸른 별 무리.") },
/* ── 2. 우리 은하 ── */
{ id:"orionneb",z:2,x:1060,f:.10, k:"neb",c:"#e58fb0",c2:"#8fb4e5",r:44, name:__("오리온 성운"), p:["he3","rare"], d:["chip","nano"],
  fact:__("M42. 1,344광년 거리의 거대한 별 탄생 영역.") },
{ id:"horse",  z:2,x:1320,f:.16, k:"neb",c:"#b5654f",c2:"#3a2a2a",r:26, name:__("말머리 성운"), lm:true,
  fact:__("밝은 성운 앞을 가린 암흑 성운이 말 머리 모양을 만든다.") },
{ id:"eagle",  z:2,x:520, f:.26, k:"neb",c:"#d9a36a",c2:"#7fb8a8",r:40, name:__("독수리 성운"), p:["he3","bio"], d:["nano","anti"],
  fact:__("M16. 별이 태어나는 가스 기둥 '창조의 기둥'이 있다.") },
{ id:"crab",   z:2,x:1500,f:.34, k:"neb",c:"#7fc4d9",c2:"#e59a6a",r:30, name:__("게 성운"), p:["anti","rare"], d:["bio","ice"],
  fact:__("1054년 관측된 초신성의 잔해. 중심에 초당 30회 도는 펄서가 있다.") },
{ id:"sgra",   z:2,x:1120,f:.50, k:"stn",c:"#d96f32",r:10, name:__("궁수자리 A* 관측기지"), p:["anti","dark"], d:["nano","bio"],
  fact:__("은하 중심 블랙홀을 도는 관측 기지. 사건의 지평선이 눈앞이다.") },
{ id:"sgrabh", z:2,x:1000,f:.52, k:"bh",c:"#1a1410",r:20, name:__("궁수자리 A*"), lm:true,
  fact:__("우리 은하 중심의 초대질량 블랙홀. 질량은 태양의 약 400만 배.") },
{ id:"carina", z:2,x:1560,f:.60, k:"neb",c:"#e58a6a",c2:"#d9c36a",r:40, name:__("용골 성운"), lm:true,
  fact:__("태양의 100배 질량을 가진 폭발 직전의 별, 에타 카리나의 집.") },
{ id:"perseus",z:2,x:440, f:.68, k:"stn",c:"#4a90d9",r:10, name:__("페르세우스 팔 전초기지"), p:["nano","ore"], d:["anti","chip"],
  fact:__("우리 은하의 주요 나선팔 중 하나. 태양계 바깥쪽에 있다.") },
{ id:"ring",   z:2,x:760, f:.82, k:"neb",c:"#6ad9c0",c2:"#e5796a",r:22, name:__("고리 성운"), lm:true,
  fact:__("M57. 죽어가는 별이 뿜어낸 가스 껍질. 태양의 먼 미래 모습.") },
{ id:"omega",  z:2,x:1500,f:.84, k:"clu",c:"#ffd9a0",r:34, name:__("오메가 센타우리"), p:["rare","relic"], d:["he3","chip"],
  fact:__("약 1,000만 개의 별이 뭉친 우리 은하 최대의 구상성단.") },
/* ── 3. 국부 은하군 ── */
{ id:"lmc",    z:3,x:680, f:.14, k:"ell",c:"#c9b6e5",r:40, name:__("대마젤란은하"), p:["he3","rare"], d:["nano","anti"],
  fact:__("16만 광년 거리의 위성은하. 남반구에서 맨눈으로 보인다.") },
{ id:"smc",    z:3,x:1260,f:.20, k:"ell",c:"#b6c9e5",r:30, name:__("소마젤란은하"), p:["ore","bio"], d:["chip","dark"],
  fact:__("20만 광년 거리의 왜소은하. 대마젤란은하와 가스 다리로 이어져 있다.") },
{ id:"sagdeg", z:3,x:1000,f:.36, k:"ell",c:"#e5d6b6",r:22, name:__("궁수자리 왜소은하"), lm:true,
  fact:__("우리 은하에 삼켜지며 길게 찢겨 나가는 중인 작은 은하.") },
{ id:"andromeda",z:3,x:1380,f:.56, k:"gal",c:"#e5a37f",c2:"#9aa9e0",r:74,tilt:.45, name:__("안드로메다 은하"), p:["nano","anti"], d:["rare","relic"],
  fact:__("M31. 250만 광년 거리. 약 45억 년 뒤 우리 은하와 충돌한다.") },
{ id:"m33",    z:3,x:540, f:.64, k:"gal",c:"#9ac3e0",c2:"#e0a39a",r:46,tilt:.8, name:__("삼각형자리 은하"), p:["bio","chip"], d:["dark","anti"],
  fact:__("M33. 국부 은하군에서 세 번째로 큰 나선은하.") },
{ id:"ic10",   z:3,x:1000,f:.88, k:"ell",c:"#e5b6c9",r:26, name:"IC 10", p:["dark","anti"], d:["bio","chip"],
  fact:__("국부 은하군에서 유일한 폭발적 항성생성 은하.") },
/* ── 4. 은하단·초은하단 ── */
{ id:"m81",    z:4,x:520, f:.12, k:"gal",c:"#e5c39a",c2:"#a3b6e0",r:44,tilt:.6, name:__("보데 은하"), p:["chip","nano"], d:["dark","relic"],
  fact:__("M81. 1,200만 광년 거리의 장대한 나선은하.") },
{ id:"cena",   z:4,x:1460,f:.20, k:"ell",c:"#e5c9a3",r:38,dust:1, name:__("센타우루스 A"), p:["anti","rare"], d:["bio","nano"],
  fact:__("NGC 5128. 두 은하가 합쳐진 흔적인 먼지 띠와 강력한 전파 제트.") },
{ id:"whirl",  z:4,x:900, f:.38, k:"gal",c:"#e09a9a",c2:"#9ab6e0",r:50,tilt:.95, name:__("소용돌이 은하"), p:["nano","dark"], d:["he3","chip"],
  fact:__("M51. 동반 은하와 상호작용하는 교과서적인 나선은하.") },
{ id:"sombrero",z:4,x:1500,f:.52, k:"gal",c:"#e5d6b0",c2:"#8a6f4d",r:46,tilt:.22, name:__("솜브레로 은하"), p:["dark","rare"], d:["anti","bio"],
  fact:__("M104. 밝은 팽대부와 짙은 먼지 띠가 모자를 닮았다.") },
{ id:"m87bh",  z:4,x:760, f:.58, k:"bh",c:"#1a1410",r:20, name:__("M87* 블랙홀"), lm:true,
  fact:__("2019년 인류가 처음으로 촬영한 블랙홀. 질량은 태양의 65억 배.") },
{ id:"virgo",  z:4,x:600, f:.66, k:"clu",c:"#ffd9b0",r:50, name:__("처녀자리 은하단"), p:["dark","anti"], d:["relic","nano"],
  fact:__("약 1,300개의 은하가 모인, 우리에게 가장 가까운 거대 은하단.") },
{ id:"cartwheel",z:4,x:1200,f:.72, k:"gal",c:"#b0c9ff",c2:"#ffb0a0",r:34,tilt:.7, name:__("수레바퀴 은하"), lm:true,
  fact:__("작은 은하가 정면으로 관통하며 생긴 고리 모양 은하.") },
{ id:"coma",   z:4,x:1280,f:.86, k:"clu",c:"#ffe3b0",r:54, name:__("머리털자리 은하단"), p:["relic","dark"], d:["anti","chip"],
  fact:__("3.2억 광년 거리. 암흑물질의 존재가 처음 제기된 은하단.") },
/* ── 5. 우주 거대 구조 ── */
{ id:"laniakea",z:5,x:1000,f:.12, k:"web",c:"#e58a4a",r:56, name:__("라니아케아 초은하단"), p:["dark","relic"], d:["anti","nano"],
  fact:__("우리 은하가 속한 초은하단. 약 10만 개의 은하, 지름 5.2억 광년.") },
{ id:"shapley",z:5,x:1480,f:.30, k:"web",c:"#e5a34a",r:50, name:__("섀플리 초은하단"), p:["relic","anti"], d:["dark","chip"],
  fact:__("가까운 우주에서 가장 질량이 밀집된 은하 집합체.") },
{ id:"bootes", z:5,x:520, f:.44, k:"stn",c:"#8e6fd8",r:10, name:__("목동자리 공동 전초기지"), p:["dark","anti"], d:["bio","relic"],
  fact:__("지름 3.3억 광년에 은하가 거의 없는 텅 빈 공간, 보이드.") },
{ id:"ton618", z:5,x:1060,f:.52, k:"bh",c:"#1a1410",r:24, name:"TON 618", lm:true,
  fact:__("태양 질량의 약 400억 배. 알려진 가장 무거운 블랙홀 중 하나.") },
{ id:"sloan",  z:5,x:1340,f:.64, k:"web",c:"#e5764a",r:60, name:__("슬론 장성"), p:["relic","nano"], d:["dark","bio"],
  fact:__("길이 약 13.8억 광년에 걸친 은하들의 거대한 벽.") },
{ id:"hugelqg",z:5,x:300, f:.72, k:"web",c:"#e5b04a",r:40, name:__("거대 퀘이사군"), lm:true,
  fact:__("Huge-LQG. 73개의 퀘이사가 40억 광년에 걸쳐 늘어선 구조.") },
{ id:"hercules",z:5,x:700,f:.86, k:"web",c:"#e5644a",r:66, name:__("헤르쿨레스-코로나 장성"), p:["relic","dark"], d:["anti","nano"],
  fact:__("약 100억 광년 길이. 관측된 우주에서 가장 큰 구조.") },
/* ── 6. 태초의 우주 ── */
{ id:"firstgal",z:6,x:600, f:.16, k:"ell",c:"#ffb38a",r:30, name:__("최초의 은하"), p:["relic","dark"], d:["anti","bio"],
  fact:__("빅뱅 후 3~5억 년. 작고 불규칙한 아기 은하들이 태어났다.") },
{ id:"quasar", z:6,x:1560,f:.24, k:"star",c:"#fff0c0",r:18, name:__("가장 먼 퀘이사"), lm:true,
  fact:__("J0313-1806. 빅뱅 후 6.7억 년에 이미 태양 16억 배의 블랙홀.") },
{ id:"firststar",z:6,x:1380,f:.40, k:"star",c:"#bcd0ff",r:24, name:__("최초의 별"), p:["anti","he3"], d:["relic","nano"],
  fact:__("빅뱅 후 1~3억 년. 수소와 헬륨만으로 이루어진 거대한 제1세대 별.") },
{ id:"darkage",z:6,x:760, f:.58, k:"stn",c:"#5a5560",r:10, name:__("암흑시대 관측소"), p:["dark","he3"], d:["relic","chip"],
  fact:__("빅뱅 후 38만~1억 년. 아직 별이 없어 우주가 캄캄했던 시대.") },
{ id:"cmb",    z:6,x:1180,f:.76, k:"cmb",c:"#ff9d5c",r:40, name:__("우주배경복사"), p:["relic","anti"], d:["dark","nano"],
  fact:__("빅뱅 38만 년 뒤 처음 자유로워진 빛. 지금은 2.7K의 마이크로파.") },
{ id:"bigbang",z:6,x:1000,f:.95, k:"bang",c:"#ff7a2a",r:60, name:__("빅뱅"), final:true, p:["relic","anti"], d:["dark","nano"],
  fact:__("약 138억 년 전, 시간과 공간과 모든 것의 시작.") },
];
/* 모든 천체에 상륙(입항) 가능 - 예전 관측 전용 천체에도 교역품을 부여한다 */
const EXTRA_TRADE = {
  venus:{p:["ore","he3"],d:["ice","bio"]},      sun:{p:["he3","anti"],d:["ice","nano"]},     mercury:{p:["ore","ice"],d:["bio","chip"]},
  uranus:{p:["he3","ice"],d:["chip","ore"]},    halley:{p:["ice","bio"],d:["ore","chip"]},   voyager:{p:["relic","chip"],d:["he3","bio"]},
  alphacen:{p:["chip","he3"],d:["ice","rare"]}, wolf359:{p:["ore","ice"],d:["bio","nano"]},  aldebaran:{p:["rare","he3"],d:["chip","bio"]},
  rigel:{p:["anti","nano"],d:["ice","ore"]},    horse:{p:["he3","ore"],d:["chip","bio"]},    sgrabh:{p:["dark","anti"],d:["rare","relic"]},
  carina:{p:["rare","anti"],d:["bio","chip"]},  ring:{p:["nano","he3"],d:["rare","bio"]},    sagdeg:{p:["rare","ore"],d:["nano","chip"]},
  m87bh:{p:["dark","anti"],d:["nano","relic"]}, cartwheel:{p:["nano","rare"],d:["dark","bio"]}, ton618:{p:["dark","relic"],d:["anti","nano"]},
  hugelqg:{p:["anti","relic"],d:["dark","chip"]}, quasar:{p:["anti","dark"],d:["relic","bio"]},
};
for(const b of BODIES){ b.y = ZY(b.z,b.f); if(b.lm && b.id !== "sun"){ if(!EXTRA_TRADE[b.id]) throw new Error("no trade data: "+b.id); Object.assign(b, EXTRA_TRADE[b.id]); delete b.lm; } }
/* 특산품 조합이 다른 기지와 겹치면 새 품목으로 바꿔, 모든 기지가 서로 다른 물건을 팔게 한다.
   새 품목을 비싸게 사 주는 기지도 생기도록 수요 품목을 하나씩 더한다. (목록 순서 기준이라 결과는 항상 같다) */
{ const NEW = ["food","solar","med","plasma","super","neut","flare","proto"], gz = id => GOODS.find(g=>g.id===id).z;
  const seen = new Set(), key = a => [...a].sort().join("+");
  for(const b of BODIES){ if(!b.p) continue;
    if(seen.has(key(b.p))){
      const cand = NEW.filter(g=>!b.d.includes(g)).sort((x,y)=>Math.abs(gz(x)-b.z)-Math.abs(gz(y)-b.z));
      let done = false;
      for(const slot of [1,0]){ for(const g of cand){ const t = [...b.p]; t[slot] = g;
          if(t[0] !== t[1] && !seen.has(key(t))){ b.p = t; done = true; break; } } if(done) break; }
    }
    seen.add(key(b.p));
  }
  let i = 0;
  for(const b of BODIES){ if(!b.p) continue;
    const cand = NEW.filter(g=>!b.p.includes(g) && Math.abs(gz(g)-b.z) >= 1 && Math.abs(gz(g)-b.z) <= 3);
    if(cand.length) b.d = [...b.d, cand[(i++) % cand.length]];
  }
}
const BODY_MAP = Object.fromEntries(BODIES.map(b=>[b.id,b]));
const PORTS = BODIES.filter(b=>!b.lm);

/* 위험 지대 */
const BELTS = [
  { z:0, f0:.36, f1:.45, name:__("소행성대") },
  { z:0, f0:.86, f1:.935,name:__("카이퍼 벨트") },
];
const SUN_R = 78;                                 /* 태양 접근 금지 반경 */
const HOLES = ["sgrabh","m87bh","ton618"];       /* 블랙홀: 끌어당김 + 중심부 치명적 */
const VOIDS = [{ id:"bootes", r:230 }];          /* 공동: 연료 소모 증가 */

/* 해적 기지 - 토벌 목표 콘텐츠 (난이도 순) */
const DENS = [
  { id:"d0", z:0,x:1080,f:.50, name:__("소행성대 약탈단"),     pow:26,  gold:800,   ship:"R"  },
  { id:"d1", z:1,x:1020,f:.46, name:__("센타우리 해적단"),     pow:52,  gold:1800,  ship:"SR" },
  { id:"d2", z:2,x:800, f:.40, name:__("성운의 밀수 연합"),    pow:82,  gold:3500,  ship:"SR" },
  { id:"d3", z:3,x:960, f:.44, name:__("마젤란 무법 함대"),    pow:118, gold:6000,  ship:"SSR"},
  { id:"d4", z:4,x:1060,f:.76, name:__("처녀자리의 약탈 군주"),pow:160, gold:10000, ship:"SSR"},
  { id:"d5", z:5,x:900, f:.62, name:__("공허의 군단"),         pow:215, gold:16000, ship:"UR" },
];
for(const d of DENS){ d.y = ZY(d.z,d.f); }
const DEN_CLEAR_GOLD = 10000, DEN_RESPAWN = 7;

/* 연구(기술) - 워프 드라이브가 다음 우주를 연다 */
const TECH = [
  { id:"warp",  name:__("워프 드라이브"), ic:"🌀", max:6, desc:__("다음 단계의 우주로 진입할 수 있다"),
    gold:[7500,25000,70000,180000,400000,800000], sci:[25,70,160,320,560,900] },
  { id:"tank",  name:__("연료·산소 탱크"), ic:"⛽", max:5, desc:__("보급 적재량 +12%"), gold:[400,1200,3000,8000,20000], sci:[5,15,40,90,180] },
  { id:"hull",  name:__("선체 장갑"),     ic:"🛡", max:5, desc:__("선체 내구도 +25"),  gold:[500,1400,3500,9000,22000], sci:[5,15,40,90,180] },
  { id:"gun",   name:__("함포"),          ic:"💥", max:5, desc:__("전투력 +8"),        gold:[600,1600,4000,10000,24000],sci:[8,20,50,110,200] },
  { id:"shield",name:__("방어막"),        ic:"🔰", max:5, desc:__("받는 피해 -8%"),    gold:[600,1600,4000,10000,24000],sci:[8,20,50,110,200] },
  { id:"scan",  name:__("탐사 스캐너"),   ic:"📡", max:5, desc:__("탐지 범위 +20% · 연구 데이터 +12%"), gold:[300,900,2500,7000,18000], sci:[4,12,30,70,150] },
  { id:"hold",  name:__("화물칸 확장"),   ic:"📦", max:5, desc:__("적재량 +15%"),      gold:[500,1500,4000,10000,25000],sci:[4,12,30,70,150] },
  { id:"scoop", name:__("램스쿱"),        ic:"🌫", max:3, desc:__("성운을 지날 때 연료를 채집한다"), gold:[1500,6000,20000], sci:[20,60,150] },
];
const TECH_MAP = Object.fromEntries(TECH.map(t=>[t.id,t]));

/* 승무원 - bonus: sell/buy/route/luck/salv/fuel/speed/atk/sci */
const CREW = [
  { id:"seraphine", name:__("세라핀"),   title:__("지구의 무역상"),       port:"earth",   cost:2000, bonus:{sell:.06},
    desc:__("미소가 아름다운 무역상. 흥정이라면 궤도 제일."), talk:__("지구의 노을보다… 당신과 보는 별이 더 근사해요.") },
  { id:"isabella",  name:__("이자벨라"), title:__("화성의 중개인"),       port:"mars",    cost:2500, bonus:{buy:.06},
    desc:__("유리처럼 투명한 눈동자. 좋은 물건을 싸게 구해다 준다."), talk:__("이 화성 유리구슬, 당신 눈동자 색이라 골랐어요.") },
  { id:"amin",      name:__("아민"),     title:__("세레스의 채굴꾼"),     port:"ceres",   cost:3000, bonus:{salv:.25},
    desc:__("소행성대에 떠도는 것은 무엇이든 건져 올린다."), talk:__("잔해 속에서 이걸 주웠을 때, 당신 생각이 났습니다.") },
  { id:"leyla",     name:__("레일라"),   title:__("목성의 책사"),         port:"jupiter", cost:4000, bonus:{route:.15},
    desc:__("중력의 물길을 손금 보듯 읽는 전략가."), talk:__("별자리보다 아름다운 항로는 처음이에요. 당신이 그린 항로요.") },
  { id:"rashid",    name:__("라시드"),   title:__("토성의 점성술사"),     port:"saturn",  cost:3500, bonus:{luck:8},
    desc:__("고리의 그림자로 운을 읽는 청년. 그와 함께라면 우주가 웃는다."), talk:__("오늘 밤은 별이 당신 편이에요. 제가 그렇게 읽었거든요.") },
  { id:"zaina",     name:__("자이나"),   title:__("프록시마의 요리사"),   port:"proxima", cost:5000, bonus:{fuel:.10},
    desc:__("수경 재배의 마법사. 같은 보급으로 두 배 멀리 간다."), talk:__("새 요리를 만들었어요. 첫 입은 언제나 당신 거예요.") },
  { id:"noah",      name:__("노아"),     title:__("시리우스의 조타수"),   port:"sirius",  cost:7000, bonus:{speed:.06},
    desc:__("항성풍을 스무 번 넘은 과묵한 조타수."), talk:__("…당신 곁이라면, 블랙홀 옆도 나쁘지 않군.") },
  { id:"priya",     name:__("프리야"),   title:__("베가의 보석상"),       port:"vega",    cost:8000, bonus:{sell:.08},
    desc:__("그녀가 값을 부르면 상인들은 고개를 끄덕일 뿐."), talk:__("이 결정은 값을 매기지 않을래요. 당신에게 어울리니까.") },
  { id:"maya",      name:__("마야"),     title:__("트라피스트의 예언가"), port:"trappist",cost:9000, bonus:{luck:12,sci:.10},
    desc:__("일곱 행성의 바람이 그녀의 귓가에 내일을 속삭인다."), talk:__("당신의 미래를 봤어요. …비밀이지만, 좋은 미래였어요.") },
  { id:"minghua",   name:__("밍화"),     title:__("오리온의 거상"),       port:"orionneb",cost:14000,bonus:{buy:.08},
    desc:__("성운 교역로의 큰손. 그의 도장 하나면 값이 내려간다."), talk:__("당신과의 거래가 요즘 제일 즐겁소. 이건 덤이오.") },
  { id:"haruka",    name:__("하루카"),   title:__("은하 중심의 파도술사"),port:"sgra",    cost:20000,bonus:{speed:.08,atk:6},
    desc:__("중력파의 결을 읽어 배를 미끄러지듯 나아가게 한다."), talk:__("중력파가 당신을 좋아해요. 저도… 같은 마음이에요.") },
  { id:"marco",     name:__("마르코"),   title:__("안드로메다의 개척자"), port:"andromeda",cost:30000,bonus:{route:.25,sci:.15},
    desc:__("지도에 없는 길을 그리는 모험가. 항로 수익의 달인."), talk:__("지도에 없는 은하, 언젠가 꼭 같이 찾으러 갑시다.") },
];
/* 🌟 떠도는 승무원 - 기지 입항 시 낮은 확률의 인연으로만 만남 */
const RARE_CREW = [
  { id:"adelaide", name:__("아델라이데"), title:__("태양 폭풍의 여제"), cost:32000, bonus:{speed:.14,luck:10}, desc:__("코로나 질량 방출 한가운데를 세 번 뚫고 나온 전설의 선장."), talk:__("폭풍의 눈 속은 고요해요. 당신 곁처럼.") },
  { id:"cassandra",name:__("카산드라"),   title:__("운명을 읽는 자"),   cost:30000, bonus:{luck:25}, desc:__("그녀가 조난을 예언한 배는 단 한 척도 무사하지 못했다."), talk:__("당신을 만나는 미래만은… 일부러 읽지 않았어요.") },
  { id:"odilia",   name:__("오딜리아"),   title:__("오르트의 늑대"),   cost:28000, bonus:{speed:.12,fuel:.10}, desc:__("얼어붙은 혜성 구름에서 태어나 어둠을 뜯어먹고 자랐다."), talk:__("늑대는 무리를 고르는 데 신중하지. 당신을 골랐다.") },
  { id:"liuying",  name:__("류잉"),       title:__("성운의 검무희"),   cost:26000, bonus:{atk:14,salv:.30}, desc:__("칼끝으로 잔해 속 보물을 낚아 올리는 무희."), talk:__("제 검무, 당신에게만 보여드릴게요.") },
  { id:"ismene",   name:__("이스멘"),     title:__("세이렌의 후예"),   cost:24000, bonus:{sell:.12}, desc:__("그녀의 노래를 들은 상인은 지갑을 여는 것을 잊지 못한다."), talk:__("노래로 홀리지 않아도… 당신은 이미 곁에 있네요.") },
  { id:"beatrice", name:__("베아트리체"), title:__("황금 장부"),       cost:27000, bonus:{buy:.13}, desc:__("온 우주의 시세가 그녀의 장부 안에 적혀 있다."), talk:__("당신 이름 옆에는 이문이 아니라 마음을 적어뒀어요.") },
  { id:"naila",    name:__("나일라"),     title:__("공동의 별"),       cost:29000, bonus:{luck:20,fuel:.10}, desc:__("별 없는 보이드에서도 길을 잃지 않는 대상(隊商)의 후예."), talk:__("공동의 별은 하나뿐이죠. 저에겐… 당신이에요.") },
  { id:"yukine",   name:__("유키네"),     title:__("설월화"),          cost:25000, bonus:{fuel:.22}, desc:__("한 줌의 배양액으로 함대를 먹이는 신묘한 살림꾼."), talk:__("오늘 밤엔 특별한 걸 끓였어요. 둘이서만 먹어요.") },
  { id:"rosalind", name:__("로자린드"),   title:__("함대의 어머니"),   cost:31000, bonus:{route:.45}, desc:__("그녀가 축복한 항로는 유성우도 비켜 간다."), talk:__("함대는 가족이에요. 당신은… 그 중심이고요.") },
  { id:"charlotte",name:__("샤를로트"),   title:__("백은의 성도"),     cost:34000, bonus:{speed:.15}, desc:__("은으로 그린 성도에는 중력의 길이 새겨져 있다."), talk:__("백은 성도의 마지막 항로, 당신에게만 보여줄게요.") },
  { id:"drake",    name:__("드레이크"),   title:__("우주의 매"),       cost:33000, bonus:{atk:16,luck:12}, desc:__("지평선 너머의 먹잇감도 놓치지 않는 눈을 가졌다."), talk:__("매는 평생 한 하늘만 난다. 내 하늘은 정해졌군.") },
  { id:"alvaro",   name:__("알바로"),     title:__("난파선 사냥꾼"),   cost:26000, bonus:{salv:.55}, desc:__("우주에 떠도는 보물의 절반은 이미 그의 손을 거쳐 갔다."), talk:__("잔해 속 보물보다 값진 걸 함교에서 찾았소.") },
  { id:"hassan",   name:__("하산"),       title:__("반물질 대공"),     cost:35000, bonus:{sell:.10,buy:.08}, desc:__("반물질 한 병으로 정거장을 산 사내."), talk:__("창고 열쇠요. 내 전 재산이자… 내 마음이오.") },
  { id:"klaus",    name:__("클라우스"),   title:__("북극성 항법사"),   cost:30000, bonus:{fuel:.15,speed:.08}, desc:__("성운에 가려도 그의 항로는 흔들리지 않는다."), talk:__("북극성은 변하지 않소. 내 충성도 그렇소.") },
  { id:"jinhai",   name:__("진하이"),     title:__("용왕성의 아들"),   cost:38000, bonus:{luck:30}, desc:__("블랙홀이 그를 삼키지 못해 아들로 삼았다는 소문이 있다."), talk:__("용왕께 그대를 소개해야겠어. 내 사람이라고.") },
  { id:"mateo",    name:__("마테오"),     title:__("쌍둥이 항로"),     cost:33000, bonus:{route:.50}, desc:__("한 번에 두 개의 항로를 계산하는 천재 항법사."), talk:__("두 개의 항로가 하나로 모이는 지점… 그게 당신이오.") },
  { id:"ragnar",   name:__("라그나"),     title:__("서리수염"),        cost:27000, bonus:{sci:.25,fuel:.10}, desc:__("수염에 맺힌 서리로 우주 날씨를 읽는 노장 과학자."), talk:__("서리가 녹는군. 그대 곁은 따뜻해서 큰일이야.") },
  { id:"santiago", name:__("산티아고"),   title:__("무적함대의 유령"), cost:29000, bonus:{atk:12,salv:.30}, desc:__("전멸한 함대에서 홀로 돌아온 남자."), talk:__("유령은 미련이 있어 남는다지. 내 미련은 그대요.") },
  { id:"osman",    name:__("오스만"),     title:__("일곱 우주의 상인"),cost:36000, bonus:{sell:.09,route:.25}, desc:__("일곱 우주 모든 기지에 그의 외상 장부가 있다."), talk:__("일곱 우주를 다 뒤져도 그대 같은 선장은 없었소.") },
  { id:"kenshin",  name:__("켄신"),       title:__("별을 베는 자"),    cost:40000, bonus:{speed:.10,atk:20}, desc:__("함수로 유성을 베어 길을 연다는 검객 조타수."), talk:__("검을 놓는 날이 오면… 그대의 배에서이고 싶소.") },
].map(n=>({ ...n, port:null, rare:true }));
CREW.push(...RARE_CREW);
/* 승무원 등급: 영입 비용(=능력 크기)에 따라 N~UR */
for(const n of CREW) n.g = n.cost >= 33000 ? "UR" : n.cost >= 20000 ? "SSR" : n.cost >= 8000 ? "SR" : n.cost >= 3500 ? "R" : "N";
const CREW_MAP = Object.fromEntries(CREW.map(n=>[n.id,n]));

/* 초상화 - image/ 시트에서 [시트, 원 중심 x, 원 중심 y] (픽셀 실측) */
const SHEETS = { M_1:{ w:1536, h:1024, d:236 }, M_2:{ w:1536, h:1024, d:254 },
                 W_1:{ w:1774, h:887, d:210 },  W_2:{ w:1774, h:887, d:216 } };
const CREW_PIC = {
  seraphine:["W_1",485,116], isabella:["W_1",1258,115], leyla:["W_1",998,554], rashid:["M_1",1262,608],
  amin:["M_1",996,370], zaina:["W_2",498,557], noah:["M_1",159,370], priya:["W_2",1013,340],
  maya:["W_2",759,339], minghua:["M_1",996,606], haruka:["W_1",998,116], marco:["M_2",1335,135],
  adelaide:["W_1",1490,116], cassandra:["W_1",240,115], odilia:["W_2",753,556], liuying:["W_2",1503,774],
  ismene:["W_1",742,115], beatrice:["W_1",998,773], naila:["W_1",484,554], yukine:["W_1",742,554],
  rosalind:["W_1",239,334], charlotte:["W_2",1519,124], drake:["M_2",1047,135], alvaro:["M_2",469,135],
  hassan:["M_1",435,844], klaus:["M_1",435,132], jinhai:["M_2",179,383], mateo:["M_1",996,846],
  ragnar:["M_2",180,632], santiago:["M_2",469,632], osman:["M_1",1259,132], kenshin:["M_1",159,609],
};
const CREW_LINES = [
  __("관측창 앞에서 함께 별을 보자고 청합니다."), __("당신 몫의 야식을 몰래 챙겨 왔습니다."),
  __("고향 별자리 이야기를 들려주고 싶어 합니다."), __("항해일지를 함께 쓰자고 합니다."),
  __("창밖의 성운을 말없이 가리킵니다."), __("콧노래를 흥얼거리다 눈이 마주치자 웃습니다."),
];
function affName(a){ return a>=80?__("운명의 동반자"):a>=50?__("깊은 신뢰"):a>=20?__("친근한 사이"):__("서먹한 사이"); }

/* 주 임무 - 항해의 길잡이 (순서대로 진행) */
const MISSIONS = [
  { t:__("달 기지에 입항하기"),              c:s=>s.visited.includes("moon"),      gold:300,  sci:5 },
  { t:__("무역으로 2,500 크레딧 모으기"),    c:s=>s.gold>=2500,                    gold:300,  sci:5 },
  { t:__("조선소에서 함선 건조하기"),        c:s=>s.stats.pulls>=1,                gold:500,  sci:5 },
  { t:__("태양계 천체 8곳 발견하기"),        c:s=>s.found.filter(i=>BODY_MAP[i].z===0).length>=8, gold:600, sci:10 },
  { t:__("워프 드라이브 Mk.I 연구하기"),     c:s=>s.tech.warp>=1,                  gold:1000, sci:0 },
  { t:__("프록시마 b에 도달하기"),           c:s=>s.visited.includes("proxima"),   gold:1500, sci:20 },
  { t:__("승무원 2명 영입하기"),             c:s=>s.crew.length>=2,                gold:1500, sci:10 },
  { t:__("해적 기지 1곳 토벌하기"),          c:s=>Object.keys(s.dens).length>=1,   gold:2000, sci:20 },
  { t:__("우리 은하에 진입하기 (워프 Mk.II)"), c:s=>s.maxZ>=2,                     gold:3000, sci:30 },
  { t:__("궁수자리 A* 관측기지에 입항하기"), c:s=>s.visited.includes("sgra"),      gold:4000, sci:40 },
  { t:__("안드로메다 은하에 도달하기"),      c:s=>s.visited.includes("andromeda"), gold:8000, sci:60 },
  { t:__("자동 무역 항로 2개 개설하기"),     c:s=>s.routes.length>=2,              gold:6000, sci:40 },
  { t:__("처녀자리 은하단에 도달하기"),      c:s=>s.visited.includes("virgo"),     gold:12000,sci:80 },
  { t:__("우주 거대 구조에 진입하기"),       c:s=>s.maxZ>=5,                       gold:20000,sci:120 },
  { t:__("우주배경복사에 도달하기"),         c:s=>s.visited.includes("cmb"),       gold:30000,sci:150 },
  { t:__("빅뱅 - 우주의 시작을 목격하기"),   c:s=>s.visited.includes("bigbang"),   gold:50000,sci:300 },
];

/* 업적 & 칭호 - 달성 시 크레딧 + 칭호(장착하면 효과 적용) */
const ACHV = [
  { id:"firstpull", name:__("선주"),          desc:__("조선소에서 첫 함선을 건조한다"),  gold:200,  bonus:{}, cond:s=>s.stats.pulls>=1 },
  { id:"explorer10",name:__("탐험가"),        desc:__("천체 15곳을 발견한다"),           gold:300,  bonus:{luck:2}, cond:s=>s.found.length>=15, prog:s=>[s.found.length,15] },
  { id:"cartograph",name:__("우주 지도 제작자"), desc:__("모든 천체를 발견한다"),        gold:8000, bonus:{speed:.05}, cond:s=>s.found.length>=BODIES.length, prog:s=>[s.found.length,BODIES.length] },
  { id:"collector", name:__("제독"),          desc:__("함선 10종을 보유한다"),           gold:800,  bonus:{route:.10}, cond:s=>Object.keys(s.ships).length>=10, prog:s=>[Object.keys(s.ships).length,10] },
  { id:"dexmaster", name:__("전설의 선장"),   desc:__("모든 함선을 수집한다"),           gold:5000, bonus:{luck:10}, cond:s=>Object.keys(s.ships).length>=SHIPS.length, prog:s=>[Object.keys(s.ships).length,SHIPS.length] },
  { id:"rich",      name:__("거상"),          desc:__("크레딧 10,000을 보유한다"),       gold:500,  bonus:{sell:.03}, cond:s=>s.gold>=10000, prog:s=>[Math.min(s.gold,10000),10000] },
  { id:"tradeking", name:__("무역왕"),        desc:__("누적 판매 수익 50,000 달성"),     gold:2000, bonus:{buy:.03}, cond:s=>s.stats.sell>=50000, prog:s=>[Math.min(s.stats.sell,50000),50000] },
  { id:"popular",   name:__("인기인"),        desc:__("승무원 6명을 영입한다"),          gold:800,  bonus:{luck:5}, cond:s=>s.crew.length>=6, prog:s=>[s.crew.length,6] },
  { id:"romantic",  name:__("낭만가"),        desc:__("호감도 100을 달성한다"),          gold:600,  bonus:{fuel:.05}, cond:s=>Object.values(s.aff).some(a=>a>=100) },
  { id:"hunter",    name:__("해적 사냥꾼"),   desc:__("해적 기지를 처음 토벌한다"),      gold:500,  bonus:{atk:4}, cond:s=>Object.keys(s.dens).length>=1 },
  { id:"guardian",  name:__("우주의 수호자"), desc:__("모든 해적 기지를 토벌한다"),      gold:5000, bonus:{atk:12}, cond:s=>DENS.every(d=>s.dens[d.id]), prog:s=>[Object.keys(s.dens).length,DENS.length] },
  { id:"ace",       name:__("에이스"),        desc:__("전투에서 20회 승리한다"),         gold:1500, bonus:{atk:6}, cond:s=>s.stats.wins>=20, prog:s=>[Math.min(s.stats.wins,20),20] },
  { id:"phoenix",   name:__("불사조"),        desc:__("조난에서 살아 돌아온다"),         gold:300,  bonus:{fuel:.03}, cond:s=>s.stats.deaths>=1 },
  { id:"veteran",   name:__("노련한 선장"),   desc:__("항해 100일을 넘긴다"),            gold:1000, bonus:{fuel:.05}, cond:s=>s.day>=100, prog:s=>[Math.floor(Math.min(s.day,100)),100] },
  { id:"merchant",  name:__("단골 상인"),     desc:__("납품 의뢰 10회 완료"),            gold:800,  bonus:{sell:.02}, cond:s=>s.stats.quests>=10, prog:s=>[Math.min(s.stats.quests,10),10] },
  { id:"miner",     name:__("소행성 광부"),   desc:__("광석 30개를 채굴한다"),           gold:600,  bonus:{salv:.10}, cond:s=>s.stats.mined>=30, prog:s=>[Math.min(s.stats.mined,30),30] },
  { id:"slinger",   name:__("중력의 곡예사"), desc:__("블랙홀 스윙바이를 5회 성공한다"), gold:1500, bonus:{speed:.03}, cond:s=>s.stats.sling>=5, prog:s=>[Math.min(s.stats.sling,5),5] },
  { id:"scholar",   name:__("우주 석학"),     desc:__("모든 연구를 완료한다"),           gold:10000,bonus:{sci:.2}, cond:s=>TECH.every(t=>s.tech[t.id]>=t.max) },
  { id:"tycoon",    name:__("기지 재벌"),     desc:__("한 기지를 투자 ★5로 만든다"),     gold:1500, bonus:{route:.05}, cond:s=>Object.values(s.invest).some(v=>v>=5) },
  { id:"witness",   name:__("태초의 목격자"), desc:__("빅뱅에 도달한다"),                gold:20000,bonus:{speed:.08,luck:10}, cond:s=>s.visited.includes("bigbang") },
];
const ACHV_MAP = Object.fromEntries(ACHV.map(a=>[a.id,a]));

const FUEL_COST = 2, O2_COST = 1, REPAIR_COST = 3;       /* 보급·수리 단가 */
const INVEST_COST = [500, 1000, 2000, 3500, 5500];
const DAY_SEC = 8, O2_DAY = 10;                          /* 항해 8초 = 하루 */

/* 임무 직위 - 높은 직위일수록 임명된 승무원의 능력이 크게 적용된다. perk: 자리가 채워지면 붙는 직위 고유 효과 */
const POSTS = [
  { id:"vice",  name:__("부기장"), ic:"🎖", mult:3,    perk:{ sci:.10 },   desc:__("선장을 보좌하며 입항·임무·업적을 보고한다"),
    hi:__("부기장 임무를 맡게 되어 영광입니다, 선장님. 입항과 임무 소식은 제가 직접 보고드리겠습니다.") },
  { id:"nav",   name:__("항해장"), ic:"🧭", mult:2.5,  perk:{ speed:.05 }, desc:__("항로·보급·연료 경고 등 항해 전반을 보고한다"),
    hi:__("항해장을 맡겠습니다. 항로와 보급, 연료 상황은 저에게 맡겨 주십시오.") },
  { id:"eng",   name:__("기관장"), ic:"🔧", mult:2.25, perk:{ fuel:.05 },  desc:__("엔진·탱크·수리를 책임지고 고장을 보고한다"),
    hi:__("기관실은 제가 책임지겠습니다. 엔진 소리만 들어도 상태를 압니다, 선장님.") },
  { id:"deck",  name:__("갑판장"), ic:"⚔️", mult:2,    perk:{ atk:8 },     desc:__("함포와 전투 대원을 지휘하고 전투 결과를 보고한다"),
    hi:__("갑판장으로서 이 함선을 지키겠습니다. 적이 나타나면 제가 먼저 나서겠습니다.") },
  { id:"sci",   name:__("과학장"), ic:"🔬", mult:1.75, perk:{ sci:.08 },   desc:__("천체 발견·신호 분석·유적 조사를 보고한다"),
    hi:__("과학장을 맡게 되어 기쁩니다! 새로운 천체를 발견하면 가장 먼저 알려 드리겠습니다.") },
  { id:"cargo", name:__("화물장"), ic:"📦", mult:1.6,  perk:{ salv:.15 },  desc:__("표류물·난파선·화물 회수를 맡아 보고한다"),
    hi:__("화물장입니다. 우주에 떠도는 것은 무엇이든 건져서 창고에 채워 넣겠습니다.") },
  { id:"doc",   name:__("군의관"), ic:"🩺", mult:1.5,  perk:{ luck:5 },    desc:__("선체 피해와 산소, 승무원의 건강과 사기를 살핀다"),
    hi:__("군의관을 맡겠습니다. 승무원들의 건강과 사기는 제가 챙기겠습니다, 선장님.") },
  { id:"comm",  name:__("통신장"), ic:"📡", mult:1.4,  perk:{ route:.08 }, desc:__("구조 신호·외계 교신·납품과 항로 수익을 보고한다"),
    hi:__("통신장입니다. 구조 신호부터 항로 수익까지, 들어오는 소식은 빠짐없이 전하겠습니다.") },
];
const POST_CAP = { N:3, R:4, SR:6, SSR:7, UR:8 };   /* 기함 등급별 임명 가능한 직위 수 */
const IDLE_MULT = 0.5;                               /* 임명되지 않은 승무원의 능력 배율 */

/* ── 크레딧 수입 조정 ──
   TRADE_SCALE: 교역품 시세 전체 배율 (무역 이익·자동 항로 수익이 함께 줄어든다)
   REWARD_SCALE: 주 임무·업적(도감)·해적 기지 토벌 보상 배율 */
const TRADE_SCALE = 0.2, REWARD_SCALE = 0.5;
for(const m of MISSIONS) m.gold = Math.round(m.gold*REWARD_SCALE);
for(const a of ACHV) a.gold = Math.round(a.gold*REWARD_SCALE);
for(const d of DENS) d.gold = Math.round(d.gold*REWARD_SCALE);
