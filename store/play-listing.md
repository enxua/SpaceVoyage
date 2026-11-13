# Google Play 스토어 등록정보

Play Console > 스토어 등록정보 > 기본 스토어 등록정보 (및 번역 추가)에 언어별로 붙여 넣는다.
제한: 앱 이름 30자 · 간단한 설명 80자 · 자세한 설명 4,000자 (글자 수는 `node tools/check-listing.js` 로 확인)

- 기본 언어: 한국어 (ko-KR)
- 추가 언어: en-US, es-ES (es-419), fr-FR, it-IT, pt-BR (pt-PT), ja-JP, zh-CN, zh-TW (zh-HK)
- 카테고리: 게임 > 시뮬레이션 (또는 전략) · 태그: 우주, 탐험, 무역, 함선, 공상과학
- 광고 포함: 예 (보상형 광고) · 인앱 구매: 예 (보석, 광고 제거)

## 그래픽 자료 (언어별로 같은 폴더 이름)

| 항목 | 파일 | 규격 |
|---|---|---|
| 앱 아이콘 | `assets/play-store-512.png` | 512×512 PNG |
| 그래픽 이미지 | `store/feature/<언어>.png` | 1024×500 PNG |
| 휴대전화 스크린샷 | `store/screenshots/<언어>/01-map.png` … `08-intro.png` | 1080×1920 PNG 8장 (파일 이름 순서대로 올린다) |

언어 폴더: ko · en · es · fr · it · pt · ja · zhs(zh-CN) · zht(zh-TW)
다시 만들기: `npm run store` (게임 장면 촬영 → 문구 얹기). 문구는 `tools/store-art.js` 의 CAP 에서 고친다.

---

## ko-KR 한국어

### 앱 이름
```
우주 끝까지: VOYAGE
```

### 간단한 설명
```
지구에서 빅뱅까지! 실제 천체를 따라 항해하는 우주 무역·탐험 게임
```

### 자세한 설명
```
지구에서 출발해 138억 년 전, 우주의 시작까지.
우주 끝까지: VOYAGE는 실제 천체를 따라 우주를 누비는 우주 무역·탐험 게임입니다.

■ 실제 우주를 항해하세요
- 달 기지, 화성, 목성부터 프록시마 b, 베텔게우스, 안드로메다 은하, 우주배경복사까지 60여 개의 실제 천체
- 태양계에서 우리 은하, 우주 거대 구조, 태초의 우주까지 7개의 우주
- 천체를 발견할 때마다 실제 천문학 지식이 담긴 도감이 채워집니다
- 블랙홀의 중력, 소행성대, 거대한 공동이 항로를 가로막습니다

■ 무역으로 부를 쌓으세요
- 헬륨-3, 반물질, 암흑물질 등 18종의 우주 화물
- 기지마다 다른 특산품과 수요, 싸게 사서 비싸게 파는 짜릿한 무역
- 자동 항로와 기지 투자로 늘어나는 수입

■ 조선소에서 함선을 건조하세요
- 낡은 셔틀부터 차원 도약함 레비아탄까지, 5개 등급 18척의 함선
- 기함에 따라 달라지는 속도, 화물칸, 탱크, 화력

■ 승무원과 함께하는 항해
- 50명이 넘는 개성 넘치는 승무원
- 부기장, 항해장, 기관장 등 8개 직위에 임명해 함선을 강화
- 호감도가 쌓일수록 열리는 이야기와 승무원의 한마디

■ 해적과 싸우고 미지를 탐사하세요
- 조준 게이지로 겨누는 포격 전투와 해적 기지 토벌
- 떠돌이 별, 표류물, 미확인 신호 등 항해 중의 뜻밖의 만남
- 워프 드라이브를 연구해 더 먼 우주로 도약

■ 태초의 메아리
우주 깊은 곳에서 들려오는 수수께끼의 신호. 그 끝에서 기다리는 것은 무엇일까요?

■ 이런 분께 추천합니다
- 우주와 천문학을 좋아하는 분
- 무역·경영 시뮬레이션을 좋아하는 분
- 틈틈이 짧게, 또는 느긋하게 오래 즐기고 싶은 분

지원 언어: 한국어, English, Español, Français, Italiano, Português, 日本語, 简体中文, 繁體中文

※ 무료로 즐길 수 있으며, 일부 유료 아이템(보석, 광고 제거)과 보상형 광고가 포함되어 있습니다.
```

---

## en-US English

### App name
```
To the Edge of Space: VOYAGE
```

### Short description
```
From Earth to the Big Bang! Trade and explore across a universe of real stars.
```

### Full description
```
Launch from Earth and sail all the way to the beginning of the universe, 13.8 billion years ago.
To the Edge of Space: VOYAGE is a space trading and exploration game set among real celestial objects.

■ VOYAGE THROUGH THE REAL UNIVERSE
- 60+ real celestial objects, from the Moon Base, Mars and Jupiter to Proxima b, Betelgeuse, the Andromeda Galaxy and the Cosmic Microwave Background
- 7 universes to cross: Solar System, Nearby Space, Milky Way, Local Group, Galaxy Clusters, Cosmic Web and Early Universe
- Every discovery fills your Codex with real astronomy facts
- Black hole gravity, asteroid belts and vast cosmic voids stand in your way

■ TRADE YOUR WAY TO A FORTUNE
- 18 kinds of cargo, including Helium-3, Antimatter and Dark Matter
- Every base has its own specialty goods and demand: buy low, sell high
- Grow your income with Auto Routes and base investments

■ BUILD YOUR FLEET AT THE SHIPYARD
- 18 ships across 5 grades, from the Old Shuttle to the Dimension Jumper Leviathan
- Your flagship sets your speed, cargo hold, tanks and firepower

■ SAIL WITH YOUR CREW
- Recruit 50+ unique crew members
- Appoint them to 8 posts, such as First Officer, Navigator and Chief Engineer, to power up your ship
- Raise their affinity to unlock new stories and conversations

■ FIGHT PIRATES, FACE THE UNKNOWN
- Aim-gauge cannon battles and raids on pirate bases
- Wandering stars, drifting salvage and unidentified signals bring surprises on every voyage
- Research the Warp Drive and jump to the next universe

■ THE PRIMORDIAL ECHO
A mysterious signal calls from the depths of space. What waits at the end of the voyage?

■ PERFECT FOR YOU IF YOU LOVE
- Space and astronomy
- Trading and management sims
- Games you can play in short bursts or relax with for hours

Languages: English, 한국어, Español, Français, Italiano, Português, 日本語, 简体中文, 繁體中文

Free to play. Contains optional in-app purchases (Gems, Remove Ads) and rewarded ads.
```

---

## es-ES Español

### Nombre de la app
```
Al confín del espacio: VOYAGE
```

### Descripción breve
```
¡De la Tierra al Big Bang! Comercia y explora un universo de estrellas reales.
```

### Descripción completa
```
Despega desde la Tierra y navega hasta el origen del universo, hace 13.800 millones de años.
Al confín del espacio: VOYAGE es un juego de comercio y exploración espacial ambientado entre objetos celestes reales.

■ NAVEGA POR EL UNIVERSO REAL
- Más de 60 objetos celestes reales: de la Base lunar, Marte y Júpiter a Próxima b, Betelgeuse, la Galaxia de Andrómeda y el Fondo cósmico de microondas
- 7 universos por recorrer: del Sistema Solar a la Red cósmica y el Universo primitivo
- Cada descubrimiento llena tu Códice con datos reales de astronomía
- La gravedad de los agujeros negros, los cinturones de asteroides y los grandes vacíos cósmicos se cruzan en tu ruta

■ HAZ FORTUNA CON EL COMERCIO
- 18 tipos de carga, como Helio-3, Antimateria y Materia oscura
- Cada base tiene sus propios productos y demanda: compra barato, vende caro
- Aumenta tus ingresos con Rutas automáticas e inversiones en bases

■ CONSTRUYE TU FLOTA EN EL ASTILLERO
- 18 naves de 5 grados, de la Lanzadera vieja al Saltador dimensional Leviatán
- Tu buque insignia define la velocidad, la bodega, los tanques y la potencia de fuego

■ VIAJA CON TU TRIPULACIÓN
- Recluta a más de 50 tripulantes únicos
- Asígnalos a 8 cargos, como Primer oficial, Navegante y Jefe de máquinas, para mejorar tu nave
- Gana su afinidad y desbloquea nuevas historias y conversaciones

■ LUCHA CONTRA PIRATAS Y DESAFÍA LO DESCONOCIDO
- Combates de cañones con medidor de puntería y asaltos a bases piratas
- Estrellas errantes, restos a la deriva y señales no identificadas te sorprenderán en cada viaje
- Investiga el Motor de curvatura y salta al siguiente universo

■ EL ECO PRIMORDIAL
Una señal misteriosa llama desde las profundidades del espacio. ¿Qué te espera al final del viaje?

■ IDEAL SI TE GUSTA
- El espacio y la astronomía
- Los simuladores de comercio y gestión
- Jugar en partidas cortas o relajarte durante horas

Idiomas: Español, English, 한국어, Français, Italiano, Português, 日本語, 简体中文, 繁體中文

Gratis. Incluye compras opcionales dentro de la app (Gemas, eliminar anuncios) y anuncios con recompensa.
```

---

## fr-FR Français

### Nom de l'application
```
Confins de l’espace : VOYAGE
```

### Description courte
```
De la Terre au Big Bang ! Commercez et explorez un univers d'astres réels.
```

### Description complète
```
Décollez de la Terre et naviguez jusqu'à l'origine de l'univers, il y a 13,8 milliards d'années.
Jusqu’aux confins de l’espace : VOYAGE est un jeu de commerce et d'exploration spatiale au milieu d'astres bien réels.

■ VOYAGEZ DANS LE VRAI UNIVERS
- Plus de 60 astres réels : de la Base lunaire, Mars et Jupiter à Proxima b, Bételgeuse, la Galaxie d'Andromède et le Fond diffus cosmologique
- 7 univers à traverser, du Système solaire à la Toile cosmique et à l'Univers primordial
- Chaque découverte enrichit votre Codex de vraies connaissances en astronomie
- La gravité des trous noirs, les ceintures d'astéroïdes et les immenses vides cosmiques barrent votre route

■ FAITES FORTUNE GRÂCE AU COMMERCE
- 18 types de cargaison, dont l'Hélium-3, l'Antimatière et la Matière noire
- Chaque base a ses spécialités et sa demande : achetez bas, vendez haut
- Augmentez vos revenus avec les Routes auto et les investissements dans les bases

■ CONSTRUISEZ VOTRE FLOTTE AU CHANTIER NAVAL
- 18 vaisseaux répartis en 5 rangs, de la Vieille navette au Sauteur dimensionnel Léviathan
- Votre vaisseau amiral détermine la vitesse, la soute, les réservoirs et la puissance de feu

■ PARTEZ AVEC VOTRE ÉQUIPAGE
- Recrutez plus de 50 membres d'équipage uniques
- Affectez-les à 8 postes, comme Second, Navigateur ou Chef mécanicien, pour renforcer votre vaisseau
- Gagnez leur affection pour débloquer de nouvelles histoires et conversations

■ AFFRONTEZ LES PIRATES ET L'INCONNU
- Combats au canon avec jauge de visée et raids sur les bases pirates
- Étoiles errantes, épaves à la dérive et signaux non identifiés : chaque voyage réserve des surprises
- Recherchez le Moteur de distorsion et sautez vers l'univers suivant

■ L'ÉCHO PRIMORDIAL
Un signal mystérieux résonne depuis les profondeurs de l'espace. Qu'est-ce qui vous attend au bout du voyage ?

■ FAIT POUR VOUS SI VOUS AIMEZ
- L'espace et l'astronomie
- Les simulations de commerce et de gestion
- Jouer quelques minutes ou se détendre pendant des heures

Langues : Français, English, 한국어, Español, Italiano, Português, 日本語, 简体中文, 繁體中文

Gratuit. Contient des achats intégrés facultatifs (Gemmes, suppression des publicités) et des publicités avec récompense.
```

---

## it-IT Italiano

### Nome dell'app
```
Confini dello spazio: VOYAGE
```

### Descrizione breve
```
Dalla Terra al Big Bang! Commercia ed esplora un universo di stelle reali.
```

### Descrizione completa
```
Parti dalla Terra e naviga fino all'inizio dell'universo, 13,8 miliardi di anni fa.
Fino ai confini dello spazio: VOYAGE è un gioco di commercio ed esplorazione spaziale ambientato tra corpi celesti reali.

■ VIAGGIA NELL'UNIVERSO REALE
- Oltre 60 corpi celesti reali: dalla Base lunare, Marte e Giove a Proxima b, Betelgeuse, la Galassia di Andromeda e la Radiazione cosmica di fondo
- 7 universi da attraversare, dal Sistema Solare alla Ragnatela Cosmica fino all'Universo Primordiale
- Ogni scoperta arricchisce il tuo Codex con vere nozioni di astronomia
- La gravità dei buchi neri, le fasce di asteroidi e gli immensi vuoti cosmici ostacolano la tua rotta

■ FAI FORTUNA CON IL COMMERCIO
- 18 tipi di carico, tra cui Elio-3, Antimateria e Materia oscura
- Ogni base ha i suoi prodotti tipici e la sua domanda: compra a poco, vendi a tanto
- Aumenta i guadagni con le Rotte automatiche e gli investimenti nelle basi

■ COSTRUISCI LA TUA FLOTTA AL CANTIERE
- 18 navi in 5 gradi, dalla Vecchia navetta alla Nave a salto dimensionale Leviathan
- La tua ammiraglia determina velocità, stiva, serbatoi e potenza di fuoco

■ NAVIGA CON IL TUO EQUIPAGGIO
- Recluta oltre 50 membri dell'equipaggio unici
- Assegnali a 8 ruoli, come Primo ufficiale, Ufficiale di rotta e Direttore di macchina, per potenziare la nave
- Aumenta la loro affinità per sbloccare nuove storie e dialoghi

■ COMBATTI I PIRATI E AFFRONTA L'IGNOTO
- Battaglie a colpi di cannone con indicatore di mira e assalti alle basi pirata
- Stelle vaganti, relitti alla deriva e segnali non identificati: ogni viaggio riserva sorprese
- Ricerca il Motore a curvatura e salta all'universo successivo

■ L'ECO PRIMORDIALE
Un segnale misterioso chiama dalle profondità dello spazio. Cosa ti aspetta alla fine del viaggio?

■ PERFETTO SE AMI
- Lo spazio e l'astronomia
- I simulatori di commercio e gestione
- Giocare per pochi minuti o rilassarti per ore

Lingue: Italiano, English, 한국어, Español, Français, Português, 日本語, 简体中文, 繁體中文

Gratuito. Contiene acquisti in-app facoltativi (Gemme, rimozione pubblicità) e annunci con ricompensa.
```

---

## pt-BR Português

### Nome do app
```
Aos confins do espaço: VOYAGE
```

### Descrição curta
```
Da Terra ao Big Bang! Negocie e explore um universo de estrelas reais.
```

### Descrição completa
```
Decole da Terra e navegue até o início do universo, há 13,8 bilhões de anos.
Até os confins do espaço: VOYAGE é um jogo de comércio e exploração espacial ambientado entre corpos celestes reais.

■ NAVEGUE PELO UNIVERSO REAL
- Mais de 60 corpos celestes reais: da Base Lunar, Marte e Júpiter a Proxima b, Betelgeuse, a Galáxia de Andrômeda e a Radiação Cósmica de Fundo
- 7 universos para atravessar, do Sistema Solar à Teia Cósmica e ao Universo Primordial
- Cada descoberta preenche seu Códex com fatos reais de astronomia
- A gravidade dos buracos negros, os cinturões de asteroides e os enormes vazios cósmicos cruzam sua rota

■ FAÇA FORTUNA COM O COMÉRCIO
- 18 tipos de carga, como Hélio-3, Antimatéria e Matéria Escura
- Cada base tem suas especialidades e sua demanda: compre barato, venda caro
- Aumente sua renda com Rotas Automáticas e investimentos nas bases

■ CONSTRUA SUA FROTA NO ESTALEIRO
- 18 naves em 5 níveis, do Ônibus Espacial Velho à Saltadora Dimensional Leviatã
- Sua nave capitânia define velocidade, porão de carga, tanques e poder de fogo

■ NAVEGUE COM SUA TRIPULAÇÃO
- Recrute mais de 50 tripulantes únicos
- Nomeie-os para 8 cargos, como Imediato, Navegador e Engenheiro-Chefe, para fortalecer sua nave
- Aumente a afinidade para desbloquear novas histórias e conversas

■ ENFRENTE PIRATAS E O DESCONHECIDO
- Batalhas de canhão com medidor de mira e incursões a bases piratas
- Estrelas errantes, destroços à deriva e sinais não identificados trazem surpresas a cada viagem
- Pesquise o Motor de Dobra e salte para o próximo universo

■ O ECO PRIMORDIAL
Um sinal misterioso chama das profundezas do espaço. O que espera por você no fim da viagem?

■ PERFEITO PARA QUEM GOSTA DE
- Espaço e astronomia
- Simuladores de comércio e gestão
- Jogar rapidinho ou relaxar por horas

Idiomas: Português, English, 한국어, Español, Français, Italiano, 日本語, 简体中文, 繁體中文

Grátis para jogar. Contém compras opcionais no app (Gemas, remover anúncios) e anúncios premiados.
```

---

## ja-JP 日本語

### アプリ名
```
宇宙の果てまで: VOYAGE
```

### 簡単な説明
```
地球からビッグバンまで！実在の天体をめぐる宇宙交易・探検ゲーム
```

### 詳しい説明
```
地球を飛び立ち、138億年前、宇宙のはじまりへ。
宇宙の果てまで: VOYAGEは、実在の天体をめぐって宇宙を旅する宇宙交易・探検ゲームです。

■ 本物の宇宙を航海しよう
- 月面基地、火星、木星から、プロキシマb、ベテルギウス、アンドロメダ銀河、宇宙マイクロ波背景放射まで、60以上の実在の天体
- 太陽系から天の川銀河、宇宙の大規模構造、原初の宇宙まで、7つの宇宙
- 天体を発見するたびに、本物の天文学の知識が図鑑に記録されます
- ブラックホールの重力、小惑星帯、巨大な空洞が航路に立ちはだかります

■ 交易で富を築こう
- ヘリウム3、反物質、ダークマターなど18種類の宇宙貨物
- 基地ごとに異なる特産品と需要。安く買って高く売る、交易の醍醐味
- 自動航路と基地への投資で収入アップ

■ 造船所で艦船を建造しよう
- おんぼろシャトルから次元跳躍艦リヴァイアサンまで、5つの等級、18隻の艦船
- 旗艦によって変わる速度、貨物室、タンク、火力

■ クルーとともに旅をしよう
- 個性豊かな50人以上のクルー
- 副長、航海長、機関長など8つの役職に任命して艦を強化
- 好感度が上がるほど、新しい物語や会話が解放されます

■ 海賊と戦い、未知を探ろう
- 照準ゲージで狙う砲撃バトルと海賊基地の討伐
- はぐれ星、漂流物、正体不明の信号など、航海中の思いがけない出会い
- ワープドライブを研究して、次の宇宙へ跳躍

■ 原初のこだま
宇宙の深淵から届く謎の信号。その先で待っているものとは？

■ こんな方におすすめ
- 宇宙や天文学が好きな方
- 交易・経営シミュレーションが好きな方
- すき間時間に少しずつ、またはのんびり長く遊びたい方

対応言語：日本語、English、한국어、Español、Français、Italiano、Português、简体中文、繁體中文

※基本プレイ無料。一部有料アイテム（ジェム、広告削除）とリワード広告があります。
```

---

## zh-CN 简体中文

### 应用名称
```
直抵宇宙尽头: VOYAGE
```

### 简短说明
```
从地球到宇宙大爆炸！在真实天体之间航行的宇宙贸易探索游戏
```

### 完整说明
```
从地球启航，一路驶向138亿年前的宇宙起点。
《直抵宇宙尽头: VOYAGE》是一款在真实天体之间穿梭的宇宙贸易与探索游戏。

■ 航行于真实的宇宙
- 从月球基地、火星、木星，到比邻星b、参宿四、仙女座星系、宇宙微波背景，60多个真实天体
- 从太阳系到银河系、宇宙大尺度结构、太初宇宙，横跨7个宇宙
- 每发现一个天体，图鉴中就会记录下真实的天文知识
- 黑洞引力、小行星带和巨大的宇宙空洞阻挡着你的航线

■ 用贸易积累财富
- 氦-3、反物质、暗物质等18种宇宙货物
- 每个基地都有不同的特产和需求，低买高卖，乐趣无穷
- 通过自动航线和基地投资让收入不断增长

■ 在造船厂建造舰船
- 从老旧穿梭机到次元跃迁舰“利维坦”，5个等级共18艘舰船
- 旗舰决定你的速度、货舱、燃料舱和火力

■ 与船员一同远航
- 50多位个性鲜明的船员
- 任命他们担任副舰长、航海长、轮机长等8个职位，强化你的舰船
- 好感度越高，解锁的故事和对话就越多

■ 对抗海盗，探索未知
- 用瞄准条进行炮击战斗，讨伐海盗基地
- 流浪星、漂流物、不明信号……每次航行都有意外相遇
- 研究曲速引擎，跃迁到下一个宇宙

■ 太初的回响
来自宇宙深处的神秘信号。旅程的尽头，等待你的会是什么？

■ 推荐给这样的你
- 喜欢宇宙和天文学
- 喜欢贸易、经营模拟游戏
- 想利用碎片时间轻松玩，或悠闲地长时间游玩

支持语言：简体中文、English、한국어、Español、Français、Italiano、Português、日本語、繁體中文

※ 免费游玩。包含可选的应用内购买（宝石、移除广告）和激励广告。
```

---

## zh-TW 繁體中文

### 應用程式名稱
```
直抵宇宙盡頭: VOYAGE
```

### 簡短說明
```
從地球到宇宙大爆炸！在真實天體之間航行的宇宙貿易探索遊戲
```

### 完整說明
```
從地球啟航，一路駛向138億年前的宇宙起點。
《直抵宇宙盡頭: VOYAGE》是一款在真實天體之間穿梭的宇宙貿易與探索遊戲。

■ 航行於真實的宇宙
- 從月球基地、火星、木星，到比鄰星b、參宿四、仙女座星系、宇宙微波背景，60多個真實天體
- 從太陽系到銀河系、宇宙大尺度結構、太初宇宙，橫跨7個宇宙
- 每發現一個天體，圖鑑中就會記錄下真實的天文知識
- 黑洞引力、小行星帶和巨大的宇宙空洞阻擋著你的航線

■ 用貿易累積財富
- 氦-3、反物質、暗物質等18種宇宙貨物
- 每個基地都有不同的特產和需求，低買高賣，樂趣無窮
- 透過自動航線和基地投資讓收入不斷成長

■ 在造船廠建造艦船
- 從老舊穿梭艇到次元躍遷艦利維坦，5個等級共18艘艦船
- 旗艦決定你的速度、貨艙、燃料艙和火力

■ 與船員一同遠航
- 50多位個性鮮明的船員
- 任命他們擔任副艦長、航海長、輪機長等8個職位，強化你的艦船
- 好感度越高，解鎖的故事和對話就越多

■ 對抗海盜，探索未知
- 用瞄準條進行砲擊戰鬥，討伐海盜基地
- 流浪星、漂流物、不明訊號……每次航行都有意外的相遇
- 研究曲速引擎，躍遷到下一個宇宙

■ 太初的迴響
來自宇宙深處的神秘訊號。旅程的盡頭，等待你的會是什麼？

■ 推薦給這樣的你
- 喜歡宇宙和天文學
- 喜歡貿易、經營模擬遊戲
- 想利用零碎時間輕鬆玩，或悠閒地長時間遊玩

支援語言：繁體中文、English、한국어、Español、Français、Italiano、Português、日本語、简体中文

※ 免費遊玩。包含可選的應用程式內購買（寶石、移除廣告）和獎勵廣告。
```
