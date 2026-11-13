# VOYAGE translation guide

VOYAGE is a mobile/web space-exploration and trading game. The player captains a ship from Earth outward through
seven "universes" (Solar System → Nearby Space → Milky Way → Local Group → Galaxy Clusters → Cosmic Web → Early Universe)
to the Big Bang, discovering real celestial bodies, trading goods, recruiting crew, fighting pirates and following a
story about a mysterious signal called the "Primordial Echo".

## Files

- Source strings (Korean): `tools/tr/keys-1.json` … `keys-6.json`. Each is a JSON array of strings.
- Your output: `tools/tr/<lang>-1.json` … `<lang>-6.json`. Each must be a JSON array of the **same length and order**
  as the matching keys file: element i is the translation of key i. Output only translations, never the Korean keys.
- Check your work: `node tools/tr/check.js <lang>` (run from `D:\Game\voyage`). It reports length mismatches,
  placeholder/tag mismatches, leftover Korean and invalid JSON. Fix everything it reports until it prints `0 problem(s)`.

## Hard rules (the checker enforces these)

1. Keep every placeholder `{0}`, `{1}`, … exactly once each. You may reorder them to fit the grammar of your language.
2. Keep every HTML tag exactly as written, including attributes (`<b>`, `</b>`, `<br>`, `<span class="acc">` …).
   Translate only the text between tags.
3. Keep the literal token `{ship}` unchanged (it becomes the ship's name).
4. Keep the same number of line breaks (`\n`) as the source.
5. No Korean characters may remain.
6. Keep emojis and symbols (💠 🔬 💎 ⛽ 🫧 🛡 ★ · − + % etc.) where they are. Do not add new emojis.
7. Valid JSON: escape `"` as `\"` inside strings.

## Style

- Natural, idiomatic game UI language for native speakers. Not word-for-word.
- UI labels and buttons must be short: this is a phone screen. Prefer the shortest natural wording.
- Korean grammatical particles written as alternatives - `을(를)`, `이(가)`, `은(는)`, `(으)로`, `와(과)` - have no
  equivalent; just write a grammatical sentence in your language.
- Crew speak politely to the player as "Captain" (선장님). The ship AI NOVA is dry, deadpan and slightly humorous.
- Narration in story scenes is literary and calm. Crew banter is light and funny.
- Some keys are sentence fragments or single words used as labels (for example "속도" = speed stat label,
  "1개" = "1 pc" button, "원" = the Korean won currency unit shown after a price, "탭" = "Tap" sound name).
  Translate them as short labels.
- A key that starts or ends with spaces or punctuation (" · ", " (", "- ") is joined to other text: keep that
  leading/trailing spacing and punctuation.
- Do not translate the game title "VOYAGE".
- Real astronomical objects and terms: use the standard name in your language
  (e.g. 안드로메다 은하 = Andromeda Galaxy, 궁수자리 A* = Sagittarius A*, 우주배경복사 = cosmic microwave background,
  오르트 구름 = Oort cloud, 광년 = light-year, 빅뱅 = Big Bang).

## Glossary (Korean → English reference; use the natural equivalent in your language and stay consistent)

| Korean | Meaning |
|---|---|
| 크레딧 | Credits (main currency, shown with 💠) |
| 보석 | Gems (premium currency, 💎) |
| 연구 데이터 | Research Data (🔬) |
| 함대 | Fleet |
| 조선소 | Shipyard (gacha-style ship construction) |
| 건조 | Build / construct (a ship) |
| 승무원 | Crew |
| 무역 | Trade |
| 연구 / 연구소 | Research / Lab |
| 토벌 | Raid (attack on a pirate base) |
| 임무 | Missions |
| 납품 의뢰 | Delivery order |
| 도감 | Codex |
| 항해 일지 | Ship's log (story replay) |
| 업적 · 칭호 | Achievements · Titles |
| 기함 | Flagship |
| 함선 | Ship / vessel |
| 선체 | Hull |
| 연료 · 산소 | Fuel · Oxygen |
| 탱크 | Tank (fuel/oxygen capacity) |
| 화물 · 화물칸 · 적재 | Cargo · cargo hold · capacity |
| 기지 | Base / station (a place you can dock) |
| 입항 · 출항 · 정박 | Dock (arrive) · depart · docked |
| 특산품 | Specialty goods (what a base sells) |
| 수요 | Demand |
| 자동 항로 / 항로 | (Automated) trade route |
| 투자 | Investment (in a base) |
| 워프 드라이브 | Warp Drive |
| 부스트 | Boost |
| 비상 추진 | Emergency thrust |
| 떠돌이 별 | Wandering star |
| 표류물 | Drifting salvage |
| 미확인 신호 | Unidentified signal |
| 해적 · 해적 기지 · 잔당 | Pirates · pirate base · remnants |
| 외계 생명체 | Alien lifeform |
| 포격 · 방어 태세 · 도주 · 퇴각 · 통행료 | Fire · defensive stance · flee · retreat · toll |
| 조준 게이지 | Aim gauge |
| 치명타 | Critical hit |
| 조난 | Wrecked / lost in space (game over) |
| 호감도 | Affinity |
| 직위 · 임명 · 해임 | Post · appoint · dismiss |
| 부기장 | First Officer |
| 항해장 | Navigator |
| 기관장 | Chief Engineer |
| 갑판장 | Tactical Officer |
| 과학장 | Science Officer |
| 화물장 | Quartermaster |
| 군의관 | Ship's Doctor |
| 통신장 | Communications Officer |
| 태초의 메아리 | the Primordial Echo (the mysterious signal) |
| 노바 | NOVA (the ship's AI) |
| 중력류 | Gravity current |
| 스윙바이 | Gravity-assist slingshot |
| 일반 · 고급 · 희귀 · 영웅 · 전설 | Common · Uncommon · Rare · Epic · Legendary (ship grades N/R/SR/SSR/UR) |
| 권역 | Region (the area around a base; used for music names) |
| 축척 | Scale (map scale) |

## Universe names

태양계 Solar System · 근거리 우주 Nearby Space · 우리 은하 Milky Way · 국부 은하군 Local Group ·
은하단·초은하단 Galaxy Clusters & Superclusters · 우주 거대 구조 Cosmic Web (large-scale structure) · 태초의 우주 Early Universe

## Crew names (Korean → intended name; write them in your language's usual script)

세라핀 Seraphine · 이자벨라 Isabella · 아민 Amin · 레일라 Leyla · 라시드 Rashid · 자이나 Zaina · 노아 Noah · 프리야 Priya ·
마야 Maya · 밍화 Minghua · 하루카 Haruka · 마르코 Marco · 아델라이데 Adelaide · 카산드라 Cassandra · 오딜리아 Odilia ·
류잉 Liu Ying · 이스멘 Ismene · 베아트리체 Beatrice · 나일라 Naila · 유키네 Yukine · 로자린드 Rosalind · 샤를로트 Charlotte ·
드레이크 Drake · 알바로 Alvaro · 하산 Hassan · 클라우스 Klaus · 진하이 Jinhai · 마테오 Mateo · 라그나 Ragnar ·
산티아고 Santiago · 오스만 Osman · 켄신 Kenshin

(Japanese: use katakana, except 하루카 → ハルカ, 유키네 → ユキネ, 켄신 → ケンシン. Chinese: use fitting characters,
e.g. 밍화 明华/明華, 류잉 柳莺/柳鶯, 진하이 金海.)
