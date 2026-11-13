"use strict";
/* ══════════════════ 우주 끝까지: VOYAGE - 서비스 컷 ══════════════════
   승무원을 보유하고 있으면 상황에 맞는 순간 그 승무원의 컷이 화면 가득 나오고 대사를 한다.
   한 번 본 컷은 승무원 상세 화면의 "서비스 컷"에서 다시 볼 수 있다.
   컷을 추가하려면: image/cuts/ 에 그림을 넣고 CUTS[승무원 id]에 { id, img, when, lines } 를 더한다.
   when (상황): rest  - 기지에 입항해 쉴 때 (첫 입항 제외)
                land  - 새 천체에 처음 내릴 때
                meteor - 유성우·혜성을 함께 볼 때
                depart - 기지에서 보급을 마치고 출항할 때
                repair - 선체가 크게 부서졌을 때
                profit - 화물을 산 값의 1.5배 넘게 팔았을 때
                loss   - 화물을 산 값보다 싸게 팔았을 때
                win    - 전투에서 이겼을 때
                night  - 항해 중 하루가 지날 때 (긴 항해의 밤)
                lucky  - 보석을 한꺼번에 2개 넘게 얻었을 때
                gravity - 블랙홀 스윙바이나 웜홀을 지날 때
                explore - 떠돌이 별을 조사할 때
                mission - 임무를 완료했을 때
                join   - 새 승무원이 합류했을 때 (그 승무원 본인은 제외)
                zone   - 새 우주에 처음 들어섰을 때
                low    - 연료나 산소가 바닥나 갈 때
                route  - 새 자동 무역 항로를 개설했을 때
                tech   - 연구를 완료했을 때
                flee   - 전투에서 달아나거나 통행료를 냈을 때
                full   - 화물을 사서 화물칸이 거의 찼을 때
                warp   - 워프 드라이브를 완성했을 때
                ruins  - 고대 유적을 조사할 때
                den    - 해적 기지를 토벌했을 때
                chase  - 적이 추격해 오기 시작할 때
                income - 자동 무역 항로 수익을 받았을 때
                signal - 미확인 신호를 분석할 때
                discover - 항해 중 새 천체를 발견했을 때
                invest - 기지에 투자했을 때
                achv   - 업적을 달성했을 때
                storm  - 이온 폭풍에 들어섰을 때
                raid   - 해적 기지를 향해 출격할 때
                home   - 고향 지구에 입항했을 때
                monster - 우주 괴물을 쓰러뜨렸을 때
                tame   - 우주 생물을 길들이거나 함선에 들였을 때
                market - 떠돌이 상인·캐러밴과 거래했을 때
                wreck  - 기함을 잃고 지구로 돌아왔을 때
                boost  - 부스트로 가속할 때
                party  - 항해 30일마다 (함대 기념일)
                rock   - 소행성·우주 쓰레기와 부딪혔을 때 */
const CUTS = {
  adelaide:[
    { id:"adelaide_rest", img:"image/cuts/adelaide_rest.jpg", when:"rest", title:__("휴식"),
      lines:[__("아, 선장… 노크는 하고 들어와야지. …뭐, 이번만 봐줄게."), __("폭풍 세 번 뚫은 것보다 따뜻한 물 한 번이 더 좋을 때가 있어."), __("머리 아직 덜 말랐어. 그렇게 빤히 보면 수건 던진다?")] },
    { id:"adelaide_land", img:"image/cuts/adelaide_land.jpg", when:"land", title:__("첫 발자국"),
      lines:[__("여기 공기 냄새… 처음 맡는데 이상하게 그리워. 바보 같지?"), __("울긴 누가 울어. 바람이 세서 그래."), __("이 땅에 처음 발자국을 남긴 건 우리야. 기억해 둬, 선장.")] },
    { id:"adelaide_meteor", img:"image/cuts/adelaide_meteor.jpg", when:"meteor", title:__("유성우"),
      lines:[__("소원 빌었어? 나는… 비밀이야."), __("폭풍 속에서는 별을 볼 여유가 없었어. 지금은 있네. 당신 덕분에."), __("저 유성들, 다 어딘가로 가는 중이겠지. 우리처럼.")] },
  ],
  noah:[
    { id:"noah_cook", img:"image/cuts/noah_cook.jpg", when:"depart", title:__("출항 전 한 끼"),
      lines:[__("…전투 식량을 그냥 먹는 건 예의가 아닙니다. 데우는 것까지가 요리입니다."), __("…맛은 보장 못 합니다. 대신 배는 부를 겁니다."), __("출항 전에는 든든하게 먹어 둬야 합니다. …더 드시겠습니까.")] },
    { id:"noah_repair", img:"image/cuts/noah_repair.jpg", when:"repair", title:__("기관실의 밤"),
      lines:[__("…엔진이 울고 있었습니다. 이제 조용합니다."), __("조타수가 엔진을 모르면 배를 모르는 겁니다. …렌치 좀 건네주십시오."), __("땀 좀 났습니다. …괜찮습니다. 이 배는 아직 멀쩡히 갑니다.")] },
  ],
  seraphine:[
    { id:"seraphine_stew", img:"image/cuts/seraphine_stew.jpg", when:"profit", title:__("한턱 스튜"),
      lines:[__("오늘 장사 대박이에요! 기념으로 한 솥 끓였어요. 다들 줄 서세요~"), __("흥정 잘한 날은 국물 맛도 좋아요. 이건 과학이에요."), __("선장님 그릇은 제일 큰 걸로 할게요. 오늘 번 돈의 절반은 선장님 덕이니까요.")] },
    { id:"seraphine_mess", img:"image/cuts/seraphine_mess.jpg", when:"loss", title:__("오늘은 꽝"),
      lines:[__("…웃지 마세요. 장사도 요리도 오늘은 좀 안 풀리는 날이에요."), __("밀가루가 왜 여기까지 튀었는지 저도 몰라요. 묻지 마세요."), __("손해 본 만큼 맛있게 만들 거예요. …아마도요. 저기 웃는 사람들은 오늘 설거지 당번이에요.")] },
  ],
  amin:[
    { id:"amin_train", img:"image/cuts/amin_train.jpg", when:"win", title:__("단련"),
      lines:[__("해적이요? 소행성 캐는 것보다는 가볍던데요. …그래도 운동은 해 둡니다."), __("이 팔로 바위를 깼습니다. 다음엔 해적선 문도 열어 보겠습니다."), __("선장님, 땀 냄새 나면 말씀하십시오. …아직 열 개 남았습니다.")] },
    { id:"amin_prank", img:"image/cuts/amin_prank.jpg", when:"night", title:__("한밤의 장난"),
      lines:[__("쉿! 선장님… 이건 못 본 걸로 해 주십시오. 딱 한 줄만 그리려고 했습니다."), __("아, 아닙니다! 펜 뚜껑이 열려 있길래 닫으려던 겁니다! …정말입니다."), __("눈썹이 너무 연하길래… 도와드리려고 했을 뿐입니다. 눈 뜨셨네요. 큰일 났습니다.")] },
  ],
  isabella:[
    { id:"isabella_poker", img:"image/cuts/isabella_poker.jpg", when:"lucky", title:__("올인"),
      lines:[__("다 땄어요! 이건 운이 아니라 실력이에요. 표정 읽는 게 제 일이거든요."), __("흥정이나 포커나 똑같아요. 먼저 웃는 사람이 이기는 거예요."), __("선장님 몫도 챙겨 뒀어요. …절반만요. 나머지는 제 수수료예요.")] },
    { id:"isabella_float", img:"image/cuts/isabella_float.jpg", when:"gravity", title:__("무중력 스트레칭"),
      lines:[__("중력이 잠깐 사라졌어요. 이럴 때 스트레칭하면 몸이 구름처럼 가벼워요."), __("물병 좀 잡아 주시겠어요? 저는 지금… 자세 유지 중이라서요."), __("화성에서는 몸이 늘 무거웠어요. 지금은 날개가 생긴 것 같아요.")] },
  ],
  priya:[
    { id:"priya_sample", img:"image/cuts/priya_sample.jpg", when:"explore", title:__("빛나는 표본"),
      lines:[__("이 꽃잎, 빛이 결정처럼 갈라져요. 보석보다 예쁜 건 오랜만이에요."), __("쉿, 조금만요. 상처 나지 않게 한 잎만 가져갈게요."), __("값을 매길 수 없는 것도 있네요. …그래서 더 갖고 싶어요.")] },
    { id:"priya_diary", img:"image/cuts/priya_diary.jpg", when:"mission", title:__("밤의 일지"),
      lines:[__("오늘 일은 꼭 적어 둬야 해요. 나중에 선장님이랑 같이 읽으려고요."), __("일지에는 숫자만 적는 줄 알았는데… 요즘은 선장님 얘기가 더 많아요."), __("펜 소리가 좋아요. 하루가 반짝이는 결정으로 굳는 소리 같아서요.")] },
    { id:"priya_dance", img:"image/cuts/priya_dance.jpg", when:"join", title:__("복도의 춤"),
      lines:[__("새 동료가 왔대요! 오늘은 기분이 좋아서 춤이 절로 나와요♪"), __("어머, 보셨어요? …못 본 걸로 해 주세요. 그래도 멈추진 않을 거예요."), __("식구가 늘면 배가 더 반짝여요. 보석 감정사가 하는 말이니 믿으세요.")] },
  ],
  zaina:[
    { id:"zaina_mirror", img:"image/cuts/zaina_mirror.jpg", when:"rest", title:__("거울 앞에서"),
      lines:[__("어머, 선장님! 노크… 아, 문이 열려 있었네요. 1분만요!"), __("프록시마 온천만큼은 아니어도, 우주에서 따뜻한 물은 최고의 요리예요."), __("피부도 재료처럼 관리해야 해요. 신선함이 생명이거든요.")] },
    { id:"zaina_scope", img:"image/cuts/zaina_scope.jpg", when:"zone", title:__("새 지평선"),
      lines:[__("선장님, 저기 보세요! 저 계곡엔 분명 새로운 향신료가 자랄 거예요!"), __("새 우주에 왔으니 새 메뉴를 만들어야겠어요. 이름은… 지평선 스튜!"), __("망원경으로 봐도 맛있어 보이는 행성은 처음이에요.")] },
    { id:"zaina_ai", img:"image/cuts/zaina_ai.jpg", when:"low", title:__("AI와의 전쟁"),
      lines:[__("식량 제한이라니요! 이 AI가 감히 제 주방에 참견을 해요?"), __("비행 불가? 배고파서 못 난다는 거면 제가 당장 밥부터 지을게요!"), __("AI한테 식단을 맡겼더니 메뉴가 전부 ‘절약’이래요. 선장님, 빨리 보급 좀 받아요!")] },
  ],
  yukine:[
    { id:"yukine_nap", img:"image/cuts/yukine_nap.jpg", when:"night", title:__("낮잠"),
      lines:[__("…으음… 국이 다 졸면 안 돼요… 불 줄여야… 쿨…"), __("(잠꼬대) 선장님… 이불 덮고 주무세요… 우주는 추우니까…"), __("…말랑이는 제 거예요… 아무한테도 안 줘요… 쿨…")] },
    { id:"yukine_route", img:"image/cuts/yukine_route.jpg", when:"route", title:__("항로 확정"),
      lines:[__("항로 확정. 연료는 아끼고, 도착은 빠르게. 살림이나 항해나 똑같아요."), __("이 나침반은 할머니께 물려받은 거예요. 눈 오는 날에도 길을 잃지 말라고요."), __("가끔은 이 자리에 앉아 보고 싶었어요. …선장님 자리라서 그런 건 아니에요.")] },
    { id:"yukine_robot", img:"image/cuts/yukine_robot.jpg", when:"tech", title:__("새 친구"),
      lines:[__("새 기계가 왔는데 저를 졸졸 따라다녀요. 이름은 ‘한 줌’으로 지었어요."), __("얘가 청소도 하고 설거지도 한대요. …저 일자리 잃는 건 아니겠죠?"), __("하트를 띄웠어요! 연구팀이 제 말투를 학습시켰나 봐요.")] },
  ],
  minghua:[
    { id:"minghua_hatch", img:"image/cuts/minghua_hatch.jpg", when:"repair", title:__("버텨 낸 문"),
      lines:[__("어서 가시오! 이 문은 내가 붙들고 있겠소!"), __("장사꾼은 손해를 싫어하오. 사람을 잃는 손해는 더더욱."), __("다 빠져나갔소? …좋소. 이제야 숨 좀 쉬겠구려.")] },
    { id:"minghua_shower", img:"image/cuts/minghua_shower.jpg", when:"rest", title:__("한숨 돌리며"),
      lines:[__("아, 선장. 젖은 머리로 맞이해서 미안하오. 장사는 깔끔한 몸가짐부터요."), __("따뜻한 물에 오래 있었더니 계산이 다 풀렸소. 오늘 셈은 그만하리다."), __("오리온 성운의 증기탕이 생각나는구려. …이 배의 물도 나쁘지 않소.")] },
    { id:"minghua_teased", img:"image/cuts/minghua_teased.jpg", when:"flee", title:__("놀림감"),
      lines:[__("웃지들 마시오! 달아난 게 아니라 전략적으로 물러난 거요!"), __("흥정에서 물러설 줄 아는 게 진짜 장사꾼이오. …그러니 그만 웃으시오."), __("통행료는 투자요, 투자. …다들 왜 그렇게 웃는 거요?")] },
  ],
  maya:[
    { id:"maya_music", img:"image/cuts/maya_music.jpg", when:"night", title:__("잠 못 드는 밤"),
      lines:[__("잠이 안 와요. 내일이 너무 잘 보여서요. …농담이에요, 그냥 노래가 좋아서요."), __("이 노래, 일곱 행성의 바람 소리랑 박자가 같아요. 들어 보실래요?"), __("밤에는 미래가 조용해져요. 그래서 이 시간이 제일 좋아요.")] },
    { id:"maya_check", img:"image/cuts/maya_check.jpg", when:"low", title:__("점검 시간"),
      lines:[__("산소 수치… 예언할 필요도 없네요. 이대로면 곤란해요, 선장님."), __("점괘보다 계기판이 정확할 때도 있어요. 지금이 그때예요."), __("걱정 마세요. 가까운 기지까지는 버틸 거예요. …제가 그렇게 봤거든요.")] },
    { id:"maya_snack", img:"image/cuts/maya_snack.jpg", when:"full", title:__("함교의 간식"),
      lines:[__("화물칸에서 하나 빼 왔어요. 장부에는 ‘시식’이라고 적어 두세요."), __("이 육포가 잘 팔릴지 점쳐 봤어요. …제가 다 먹으면 안 팔리겠네요."), __("모자요? 예언가는 원래 이렇게 써요. 육포를 먹을 때도요.")] },
  ],
  cassandra:[
    { id:"cassandra_engine", img:"image/cuts/cassandra_engine.jpg", when:"warp", title:__("점화 성공"),
      lines:[__("이번엔 폭발하는 미래가 안 보였어요. …그래도 다들 뒤로 물러나 있던 건 잘한 거예요."), __("제 예언이 처음으로 틀리길 바랐는데, 틀렸네요. 엔진이 살았어요!"), __("새 우주로 가는 길이 열렸어요. 그 너머는… 일부러 안 볼게요. 같이 보고 싶어서요.")] },
    { id:"cassandra_ruins", img:"image/cuts/cassandra_ruins.jpg", when:"ruins", title:__("고대의 예언"),
      lines:[__("이 문자들, 저처럼 미래를 적어 둔 사람이 있었나 봐요."), __("해독했어요. ‘이 글을 읽는 자는 곧 크게 놀라리라.’ …방금 놀랐죠?"), __("수천 년 전의 예언자도 아무도 안 믿어 줬을까요. 왠지 친구 같아요.")] },
    { id:"cassandra_tired", img:"image/cuts/cassandra_tired.jpg", when:"den", title:__("긴 하루의 끝"),
      lines:[__("…토벌은 끝났어요. 이제 아무 미래도 보고 싶지 않아요. 잘래요."), __("오늘 일은 다 예언대로였어요. 피곤할 거라는 것까지요."), __("선장님, 불 좀 꺼 주세요. …아니, 조금만 더 켜 두세요. 얘기 좀 해 줘요.")] },
  ],
  leyla:[
    { id:"leyla_alert", img:"image/cuts/leyla_alert.jpg", when:"chase", title:__("긴급 전술"),
      lines:[__("추격 궤도 계산 중이에요. 말 걸지 마세요, 선장님. …아니, 걸어도 돼요. 이미 끝났으니까."), __("저쪽이 세 수를 두면 저는 네 수를 둬요. 중력은 제 편이거든요."), __("경보가 시끄럽네요. 이 정도 위기는 목성 폭풍에 비하면 산들바람이에요.")] },
    { id:"leyla_coffee", img:"image/cuts/leyla_coffee.jpg", when:"income", title:__("계획대로"),
      lines:[__("항로 수익 들어왔어요. 제가 그린 대로죠. 커피가 오늘따라 맛있네요."), __("전략가의 행복은 별거 없어요. 계획이 맞아떨어지고, 커피가 따뜻하면 돼요."), __("선장님도 한 잔 하실래요? 다음 수는 커피 마시면서 같이 생각해요.")] },
    { id:"leyla_dryer", img:"image/cuts/leyla_dryer.jpg", when:"rest", title:__("전략가의 휴일"),
      lines:[__("어머, 들켰네요. 오늘은 전략가 말고 그냥 레일라예요. 헤헷."), __("머리 말리는 데도 전략이 있어요. 바람의 각도랑… 아, 이건 비밀이에요."), __("선장님, 다음 수 맞혀 볼까요? …지금 저 보고 웃고 계시죠?")] },
  ],
  rashid:[
    { id:"rashid_signal", img:"image/cuts/rashid_signal.jpg", when:"signal", title:__("미지의 신호"),
      lines:[__("미지의 신호예요. 별점으로는… 반은 행운, 반은 사고예요. 어느 쪽이든 재밌겠죠?"), __("이 신호, 토성 고리의 그림자랑 똑같은 박자예요. 우연일까요?"), __("운은 신호처럼 와요. 놓치지 않으려면 먼저 귀를 기울여야죠.")] },
    { id:"rashid_book", img:"image/cuts/rashid_book.jpg", when:"discover", title:__("별을 읽는 밤"),
      lines:[__("새 별이 기록됐어요. 이 별의 운세부터 적어 둬야겠어요."), __("도감을 넘기다 보면 시간 가는 줄 몰라요. 선장님 별자리도 여기 있을까요?"), __("잠이 안 와서 별 이야기를 읽고 있어요. 오늘 찾은 별이 제일 좋네요.")] },
    { id:"rashid_desert", img:"image/cuts/rashid_desert.jpg", when:"land", title:__("먼지 속의 행운"),
      lines:[__("모래 폭풍 한 번 지나갔을 뿐인데 운세가 다 날아갔어요. …그래도 경치는 대길이에요."), __("탐사차가 버텨 준 게 오늘의 행운이에요. 다음 행운은 시원한 물이었으면."), __("새 땅의 첫 운세요? 먼지 많음, 그리고 아주 좋음.")] },
  ],
  ragnar:[
    { id:"ragnar_meeting", img:"image/cuts/ragnar_meeting.jpg", when:"invest", title:__("기지 회의"),
      lines:[__("기지 지표가 좋아지고 있군. 숫자는 거짓말을 안 하지. 사람은 해도."), __("투자란 씨앗을 심는 일이야. 서리 내리기 전에 심어야 열매를 보지."), __("회의는 짧게 하자고. 내 무릎이 오래 앉아 있는 걸 싫어하거든.")] },
    { id:"ragnar_sweat", img:"image/cuts/ragnar_sweat.jpg", when:"repair", title:__("구슬땀"),
      lines:[__("이 나이에 렌치를 잡을 줄은 몰랐군. …그래도 손은 아직 기억하고 있어."), __("땀이 서리처럼 식는구먼. 그대 배는 내가 살려 놨네."), __("젊은 녀석들 일하는 것 좀 보게. 내가 저 나이 땐 두 배는 빨랐지. …아마도.")] },
    { id:"ragnar_warroom", img:"image/cuts/ragnar_warroom.jpg", when:"den", title:__("작전 지도"),
      lines:[__("작전은 끝났지만 지도는 끝나지 않아. 다음 기지를 찾게."), __("이겼다고 들뜨지 마라. 우주 날씨는 늘 다음 폭풍을 숨기고 있지."), __("다들 잘했다. …그대도. 오늘 밤은 내가 차를 끓이지.")] },
  ],
  haruka:[
    { id:"haruka_selfie", img:"image/cuts/haruka_selfie.jpg", when:"achv", title:__("기념 사진"),
      lines:[__("업적 달성 기념! 선장님도 같이 찍어요, 하나 둘… 브이!"), __("이 사진은 은하 중심 고향 친구들한테 보낼 거예요. 우리 배 최고라고!"), __("헤헤, 잘 나왔죠? 중력파도 오늘은 웃고 있는 것 같아요.")] },
    { id:"haruka_meteor", img:"image/cuts/haruka_meteor.jpg", when:"meteor", title:__("별의 파도"),
      lines:[__("와아… 유성들이 파도처럼 밀려와요. 이건 제가 타 본 어떤 파도보다 예뻐요."), __("창문에 손을 대면 중력파가 느껴져요. 쿵, 쿵… 우주의 심장 소리 같죠?"), __("소원이요? 이 장면을 선장님이랑 계속 보는 거요.")] },
    { id:"haruka_wiring", img:"image/cuts/haruka_wiring.jpg", when:"storm", title:__("폭풍 속 배선"),
      lines:[__("이온 폭풍이 배선을 다 헝클어 놨어요. 잠깐만요, 파도 결을 읽듯 하나씩 풀면 돼요."), __("빨강은 여기, 파랑은 저기… 손에 기름 묻은 건 비밀로 해 주세요."), __("번개가 무서운 게 아니라, 배가 멈추는 게 무서워요. 그러니까 지금 고칠게요.")] },
  ],
  santiago:[
    { id:"santiago_jungle", img:"image/cuts/santiago_jungle.jpg", when:"explore", title:__("정글의 지도"),
      lines:[__("지도 따윈 반쯤 틀리게 마련이오. 나머지 반은 발로 채우는 거지."), __("한쪽 눈으로도 길은 보이오. 잃어버린 쪽은 지나온 길을 보고 있으니."), __("뒤따라오는 녀석들 발소리가 들리오. …이번엔 아무도 두고 가지 않소.")] },
    { id:"santiago_ammo", img:"image/cuts/santiago_ammo.jpg", when:"full", title:__("짐꾼의 어깨"),
      lines:[__("짐은 무거울수록 좋소. 가볍게 다니던 함대는 다 사라졌으니까."), __("이 상자, 하나에 오십 근은 되겠군. 지게차는 남들 몫으로 남겨 두지."), __("화물칸이 가득 차니 마음이 놓이오. 빈 배는 유령이 타기 딱 좋거든.")] },
    { id:"santiago_guitar", img:"image/cuts/santiago_guitar.jpg", when:"depart", title:__("출항의 노래"),
      lines:[__("출항할 땐 늘 한 곡 하오. 돌아오지 못한 녀석들한테 들려주는 노래요."), __("이 기타는 전멸한 함대에서 건진 유일한 물건이오. 아직 소리가 살아 있지."), __("조타는 젊은 친구들한테 맡기고, 난 바람이나 맞추겠소.")] },
  ],
  marco:[
    { id:"marco_armor", img:"image/cuts/marco_armor.jpg", when:"raid", title:__("출격 준비"),
      lines:[__("갑옷 끈은 내가 직접 조이오. 남이 조여 준 끈은 믿을 수가 없거든."), __("거울 속 얼굴에 흉터가 하나 더 늘겠군. 상관없소. 지도에 길이 하나 더 늘 테니."), __("해적 기지라… 지도에 없는 곳은 내가 제일 잘 아오. 앞장서지.")] },
    { id:"marco_gun", img:"image/cuts/marco_gun.jpg", when:"win", title:__("총기 손질"),
      lines:[__("싸움이 끝나면 총부터 닦소. 다음 싸움은 늘 생각보다 빨리 오니까."), __("부품 하나라도 잃어버리면 다음엔 내가 잃어버려지는 거요."), __("이 총은 안드로메다 끝에서도 한 번도 날 배신하지 않았소. 사람보다 낫지.")] },
    { id:"marco_family", img:"image/cuts/marco_family.jpg", when:"home", title:__("고향 사진"),
      lines:[__("지구에 오면 이 사진을 꺼내 보게 되오. …다들 잘 지내겠지."), __("지도에 없는 길만 찾아다녔는데, 돌아갈 길은 늘 여기 있었소."), __("막내가 벌써 저만큼 컸겠군. 다음엔 꼭 같이 별을 보여 주겠소.")] },
  ],
  odilia:[
    { id:"odilia_cave", img:"image/cuts/odilia_cave.jpg", when:"night", title:__("늑대의 잠"),
      lines:[__("…동굴은 편하다. 오르트 구름 속 얼음굴이랑 비슷해서."), __("깨우지 마라. …아니, 너라면 괜찮다."), __("늑대는 한쪽 귀를 열어 두고 잔다. 그러니 안심하고 자라, 선장.")] },
    { id:"odilia_massage", img:"image/cuts/odilia_massage.jpg", when:"monster", title:__("무리의 돌봄"),
      lines:[__("어깨가 돌처럼 굳었군. …괴물보다 네 어깨가 더 단단하다."), __("무리는 서로 상처를 핥아 준다. 이건… 그런 거다. 별 뜻 없어."), __("가만히 있어. 다음 사냥까지 버티려면 풀어 둬야 한다.")] },
    { id:"odilia_chip", img:"image/cuts/odilia_chip.jpg", when:"ruins", title:__("전리품"),
      lines:[__("찾았다. 어둠 속에선 반짝이는 게 잘 보이지."), __("…웃은 거 아니다. 햇빛이 눈부셔서 그런 거다."), __("이건 무리 전체의 몫이다. 내 몫은… 네가 칭찬 한마디 해 주면 된다.")] },
  ],
  liuying:[
    { id:"liuying_jump", img:"image/cuts/liuying_jump.jpg", when:"land", title:__("달빛 도약"),
      lines:[__("중력이 가벼워요! 검무 동작이 전부 두 배로 높아져요."), __("이 땅은 춤추라고 만든 것 같아요. 선장님도 한 번 뛰어 보세요!"), __("착지는 칼끝처럼 가볍게. …모래가 튀었네요. 다시 할게요!")] },
    { id:"liuying_hug", img:"image/cuts/liuying_hug.jpg", when:"tame", title:__("새 친구"),
      lines:[__("보세요, 저한테 안겼어요! 칼보다 손이 더 무서운 줄 알았는데."), __("이름은… ‘솜검’으로 할래요. 부드럽지만 용감하니까요."), __("우리 배에 태워도 되죠? 제 몫의 간식을 나눠 줄게요.")] },
    { id:"liuying_market", img:"image/cuts/liuying_market.jpg", when:"market", title:__("성운 시장"),
      lines:[__("이 결정, 칼날에 박으면 성운처럼 빛날 거예요. 깎아 주실 거죠?"), __("시장 구경은 검무만큼 재밌어요. 눈이 바빠서 발이 안 떨어져요."), __("저 작은 용 조각상도 갖고 싶은데… 선장님, 제 월급 미리 주시면 안 돼요?")] },
  ],
  ismene:[
    { id:"ismene_comfort", img:"image/cuts/ismene_comfort.jpg", when:"wreck", title:__("위로의 노래"),
      lines:[__("괜찮아요, 선장님. 배는 다시 띄우면 돼요. 당신은 하나뿐이잖아요."), __("울어도 돼요. 노래는 제가 대신 불러 줄게요. 아주 작게요."), __("세이렌의 노래는 사람을 홀리지만… 오늘은 그냥 재워 줄게요.")] },
    { id:"ismene_wing", img:"image/cuts/ismene_wing.jpg", when:"boost", title:__("날개 위의 바람"),
      lines:[__("바람이 노래해요! 이렇게 빠르면 음이 전부 날아가 버려요."), __("걱정 마세요, 꽉 잡고 있어요. …아마도요."), __("저 아래 돌무덤 보이세요? 옛날 노래 속에 나오던 곳이랑 똑같아요.")] },
    { id:"ismene_earth", img:"image/cuts/ismene_earth.jpg", when:"home", title:__("돌아온 푸른 별"),
      lines:[__("다들 창문에 붙어 있네요. 지구는 몇 번을 봐도 처음 보는 것처럼 예뻐요."), __("이 순간을 노래로 만들어 둘게요. 제목은… ‘우리 집’이요."), __("선장님, 손 흔들어요! 저 아래 누군가는 우리를 보고 있을지도 몰라요.")] },
  ],
  beatrice:[
    { id:"beatrice_garden", img:"image/cuts/beatrice_garden.jpg", when:"invest", title:__("장부 밖의 새싹"),
      lines:[__("투자란 물 주기와 같습니다. 매일 조금씩, 그리고 기다리는 것."), __("이 새싹들의 수익률은 아직 계산 중입니다. …솔직히 계산하고 싶지 않네요."), __("숫자만 보던 제가 화분을 키울 줄은 몰랐습니다. 선장님 탓입니다.")] },
    { id:"beatrice_aid", img:"image/cuts/beatrice_aid.jpg", when:"repair", title:__("응급 처치"),
      lines:[__("움직이지 마세요. 붕대는 장부처럼, 한 치의 오차도 없이 감아야 합니다."), __("손실 보고는 나중에 하겠습니다. 지금은 당신이 먼저예요."), __("이 정도 상처면 회복 비용은… 아니요, 이번엔 장부에 안 적겠습니다.")] },
    { id:"beatrice_lab", img:"image/cuts/beatrice_lab.jpg", when:"tech", title:__("현미경 너머"),
      lines:[__("연구 결과가 맞는지 세 번 확인했습니다. 숫자는 정직하니까요."), __("현미경 속 세상도 시세처럼 움직여요. 오르고, 내리고, 가끔은 놀랍게."), __("새 기술의 가치는… 측정 불가입니다. 제 장부에 처음 생긴 항목이에요.")] },
  ],
  naila:[
    { id:"naila_route", img:"image/cuts/naila_route.jpg", when:"route", title:__("길이 열리는 소리"),
      lines:[__("탁! 길이 보였어요. 대상의 피는 못 속인다니까요."), __("별이 없어도 길은 있어요. 이 항로가 그 증거예요."), __("선장님, 이 길로 낙타… 아니, 화물선들이 줄지어 갈 거예요.")] },
    { id:"naila_photo", img:"image/cuts/naila_photo.jpg", when:"night", title:__("모래 냄새"),
      lines:[__("…가족 사진이에요. 사막 냄새가 날 것만 같아서, 가끔 꺼내 봐요."), __("울긴요. 창문에 서리가 껴서 그래요."), __("대상은 떠나는 게 일이지만, 돌아갈 곳은 늘 마음에 지고 다녀요.")] },
    { id:"naila_alert", img:"image/cuts/naila_alert.jpg", when:"chase", title:__("신호 두절"),
      lines:[__("신호가 끊겼어요! 괜찮아요, 저는 신호 없이도 길을 찾을 수 있어요!"), __("뒤에서 따라붙는 놈들이 있어요. 모래폭풍 속 도적 떼랑 똑같네요."), __("선장님, 제 말만 들으세요. 왼쪽, 그리고 곧장!")] },
  ],
  rosalind:[
    { id:"rosalind_morning", img:"image/cuts/rosalind_morning.jpg", when:"rest", title:__("기지의 아침"),
      lines:[__("좋은 아침이에요! 기지에서 맞는 아침은 왠지 더 반짝여요."), __("머리는 엉망이지만 기분은 최고예요. 오늘도 모두 무사하겠죠?"), __("얼른 씻고 아침 차려야겠어요. 함대 식구들이 배고프다고 아우성일 테니까요.")] },
    { id:"rosalind_highfive", img:"image/cuts/rosalind_highfive.jpg", when:"mission", title:__("하이파이브"),
      lines:[__("임무 완료! 자, 손 올려요. 함대는 이럴 때 한마음이 되는 거예요!"), __("다들 수고했어요. 무사히 끝난 게 제일 큰 보상이에요."), __("이 맛에 함대 엄마 하는 거죠. 오늘 저녁은 제가 쏩니다!")] },
    { id:"rosalind_armor", img:"image/cuts/rosalind_armor.jpg", when:"raid", title:__("엄마의 출격"),
      lines:[__("식구를 건드린 해적은 용서 못 해요. 오늘은 제가 앞장설게요."), __("헬멧 끈 잘 맸어요? 다 같이 돌아오는 것까지가 작전이에요."), __("걱정 마세요. 축복받은 항로에서 지는 법은 없거든요.")] },
  ],
  charlotte:[
    { id:"charlotte_float", img:"image/cuts/charlotte_float.jpg", when:"gravity", title:__("물방울 별자리"),
      lines:[__("보세요, 물방울로 별자리를 그렸어요! 이건 백은 성도에도 없는 거예요."), __("중력이 없으니 성도를 360도로 펼칠 수 있어요. 최고의 작업실이에요."), __("앗, 베개가 날아가요! …괜찮아요, 궤도를 계산해 뒀으니까요.")] },
    { id:"charlotte_solder", img:"image/cuts/charlotte_solder.jpg", when:"storm", title:__("은선 납땜"),
      lines:[__("으읍… 잠깐만요, 드라이버 물고 있어서… 회로 하나만 더요."), __("폭풍이 성도 기록기를 태웠어요. 은선으로 다시 이으면 돼요."), __("섬세한 일은 은으로 선 긋는 것과 같아요. 한 번 틀리면 끝이거든요.")] },
    { id:"charlotte_party", img:"image/cuts/charlotte_party.jpg", when:"party", title:__("함대의 생일"),
      lines:[__("제 생일을 기억해 줬어요? …소원은 비밀이지만, 다들 들어 있어요."), __("케이크에 별 지도를 그려 달라고 했는데, 무지개가 됐네요. 이게 더 좋아요."), __("이렇게 축하받는 건 처음이에요. 이 순간도 성도에 그려 둘게요.")] },
    { id:"charlotte_alarm", img:"image/cuts/charlotte_alarm.jpg", when:"low", title:__("샤워 중 경보"),
      lines:[__("꺄아! 샤워하는데 경보가 울리면 어떡해요! 보, 보지 마세요!"), __("전력이 부족하다고요? …그래서 물이 갑자기 차가워졌구나."), __("머리 다 말리고 갈게요! 아니, 지금 바로 갈게요!")] },
    { id:"charlotte_aurora", img:"image/cuts/charlotte_aurora.jpg", when:"zone", title:__("새 하늘의 오로라"),
      lines:[__("새 우주의 첫 하늘이 오로라라니… 성도의 첫 장은 이걸로 정했어요."), __("손을 뻗으면 닿을 것 같아요. 은으로는 이 색을 못 그리겠네요."), __("선장님, 여기까지 데려와 줘서 고마워요. 이 하늘은 평생 못 잊을 거예요.")] },
  ],
  drake:[
    { id:"drake_rest", img:"image/cuts/drake_rest.jpg", when:"win", title:__("전투 뒤의 숨"),
      lines:[__("…해적 모자 하나 챙겼다. 전리품치고는 초라하군."), __("숨 좀 고르자. 매도 사냥 뒤엔 날개를 접는다."), __("다들 무사한가. …그럼 됐다.")] },
    { id:"drake_coffee", img:"image/cuts/drake_coffee.jpg", when:"discover", title:__("성운을 보는 눈"),
      lines:[__("저 성운 속에 별이 하나 더 있다. 아직 아무도 못 봤겠지."), __("커피가 식기 전에 다 봐 둬야겠군. 이런 하늘은 두 번 안 온다."), __("매의 눈으로 봐도 끝이 안 보이는군. 마음에 든다.")] },
    { id:"drake_bandage", img:"image/cuts/drake_bandage.jpg", when:"repair", title:__("이빨로 묶는 붕대"),
      lines:[__("…움직이지 마. 금방 묶는다. 피는 나중에 흘려도 된다."), __("배가 찢어졌으면 나도 찢어진 거다. 둘 다 고치면 그만이지."), __("놈들이 아직 문 앞이다. 붕대 하나 감을 시간은 충분해.")] },
  ],
  alvaro:[
    { id:"alvaro_pilot", img:"image/cuts/alvaro_pilot.jpg", when:"rock", title:__("충돌 경보"),
      lines:[__("충돌 경보? 이 정도 잔해 속은 내 앞마당이오. 꽉 잡으시오!"), __("잔해 사이로 빠져나가는 법은 난파선을 뒤지며 배웠소."), __("방금 스친 바위, 귀한 광석이 박혀 있었소. …아깝군.")] },
    { id:"alvaro_arcade", img:"image/cuts/alvaro_arcade.jpg", when:"rest", title:__("오락실의 사냥꾼"),
      lines:[__("이 게임도 결국 보물찾기요. 최고 점수는 내 거요!"), __("기지 휴게실의 오락기는 못 참지. 한 판만 더 하겠소."), __("선장, 한 판 붙어 보겠소? 진 사람이 저녁 사기요.")] },
    { id:"alvaro_radio", img:"image/cuts/alvaro_radio.jpg", when:"signal", title:__("잡음 속의 보물"),
      lines:[__("신호가 끊겼다고? 이런 잡음 속에 보물 좌표가 숨어 있는 법이오."), __("오래된 통신기는 한 대 때려 줘야 말을 듣소. …자, 됐다."), __("이 신호, 난파선의 조난 신호 같소. 가 보면 뭔가 있을 거요.")] },
  ],
  hassan:[
    { id:"hassan_door", img:"image/cuts/hassan_door.jpg", when:"ruins", title:__("잠긴 금고의 문"),
      lines:[__("이 문 너머에 뭐가 있든, 값은 내가 매기겠소."), __("반물질 한 병보다 무거운 문이군. 그래서 더 열고 싶소."), __("고대인도 금고를 잠글 줄 알았군. 장사꾼끼리는 통하는 법이지.")] },
    { id:"hassan_cards", img:"image/cuts/hassan_cards.jpg", when:"lucky", title:__("반물질 대공의 패"),
      lines:[__("내 패를 읽으려 하지 마시오. 정거장을 산 손이오."), __("판돈은 과자 한 봉지요. 지는 건 싫으니 진심으로 하겠소."), __("웃고들 있군. 웃는 사람 앞에서 패를 까는 게 내 취미요.")] },
    { id:"hassan_hack", img:"image/cuts/hassan_hack.jpg", when:"signal", title:__("잠금 해제"),
      lines:[__("보안 잠금이라… 남의 창고 열쇠는 내 전공이오."), __("76퍼센트. 조금만 더. 협상도 해킹도 마지막 한 수가 중요하오."), __("이 신호 속에 장부가 숨어 있소. 누구 건지는 열어 보면 알겠지.")] },
  ],
  klaus:[
    { id:"klaus_tracks", img:"image/cuts/klaus_tracks.jpg", when:"explore", title:__("낯선 발자국"),
      lines:[__("발자국이 아직 따뜻하오. 멀리 가지 않았소."), __("이 행성의 주인은 따로 있는 모양이오. 조용히 지나갑시다."), __("길을 잃지 않는 법은 단순하오. 흔적을 읽고, 북극성을 믿는 것.")] },
    { id:"klaus_cockpit", img:"image/cuts/klaus_cockpit.jpg", when:"depart", title:__("점화 순서"),
      lines:[__("추진기 정상, 보정 진행 중. 출항 준비 완료요, 선장."), __("스위치는 늘 같은 순서로 올리오. 습관이 배를 지키지."), __("항로는 이미 머릿속에 그려 두었소. 출발하시오.")] },
    { id:"klaus_flag", img:"image/cuts/klaus_flag.jpg", when:"land", title:__("깃발을 꽂다"),
      lines:[__("이 땅에 우리 깃발을 꽂소. 바람이 불어도 흔들리지 않게."), __("깃발은 지도를 위한 것이 아니오. 돌아올 사람들을 위한 표식이지."), __("충성은 깃대처럼 깊이 박아야 하오. 그대에게 그러하듯.")] },
  ],
  jinhai:[
    { id:"jinhai_carry", img:"image/cuts/jinhai_carry.jpg", when:"wreck", title:__("의무실까지"),
      lines:[__("비켜! 의무실 침대 하나 비워 둬!"), __("배는 잃어도 사람은 안 잃어. 그게 내 운이야."), __("블랙홀도 날 못 삼켰는데, 이깟 사고가 우릴 삼킬 것 같아?")] },
    { id:"jinhai_eva", img:"image/cuts/jinhai_eva.jpg", when:"rock", title:__("선체 밖의 용접"),
      lines:[__("구멍 하나 막는 데 생명줄 하나면 충분해. 나머진 운이지."), __("밖에서 보니 우리 배, 생각보다 멋지네. 흉터까지."), __("용왕님이 보고 계시다면, 지금 박수 치고 계실걸.")] },
    { id:"jinhai_mine", img:"image/cuts/jinhai_mine.jpg", when:"lucky", title:__("결정 광맥"),
      lines:[__("찾았다! 이 결정, 용왕성 보물고에 있던 거랑 똑같아."), __("곡괭이질도 운이야. 어디를 내리찍을지 아는 게 운이지."), __("이거 다 그대 몫이야. …반은 내가 갖고.")] },
  ],
  mateo:[
    { id:"mateo_buggy", img:"image/cuts/mateo_buggy.jpg", when:"chase", title:__("붉은 모래의 추격"),
      lines:[__("뒤에 둘, 앞에 바위 셋. 항로는 이미 두 개 계산해 뒀소. 꽉 잡으시오!"), __("모래폭풍 속에서도 계산은 멈추지 않소. 왼쪽이 0.3초 빠르오."), __("놈들은 한 길밖에 모르오. 나는 두 길을 동시에 달리지.")] },
    { id:"mateo_warp", img:"image/cuts/mateo_warp.jpg", when:"zone", title:__("임계 속도"),
      lines:[__("속도 임계치 돌파! 계산대로라면… 아니, 계산보다 빠르오!"), __("몸이 의자에 박히는군. 두 항로가 하나로 모이는 지점까지 버티시오!"), __("새 우주의 좌표는 이미 외워 두었소. 이제 도착만 하면 되오.")] },
    { id:"mateo_model", img:"image/cuts/mateo_model.jpg", when:"night", title:__("어린 날의 꿈"),
      lines:[__("어릴 때 갖고 싶었던 모형이오. 진짜 배를 몰면서도 이건 못 끊겠더군."), __("날개 하나 붙이는 데 한 시간이오. 항로 계산보다 어렵소."), __("…웃지 마시오. 이 배가 있었기에 지금의 내가 있는 거요.")] },
  ],
  osman:[
    { id:"osman_hall", img:"image/cuts/osman_hall.jpg", when:"join", title:__("복도의 인사"),
      lines:[__("새 얼굴이군. 이 배의 외상 장부에 이름 한 줄 올려 두겠소."), __("반갑소. 일곱 우주를 돌았지만 이런 배는 처음이오."), __("식구가 늘면 장사도 커지는 법이오. 잘 부탁하오.")] },
    { id:"osman_aurora", img:"image/cuts/osman_aurora.jpg", when:"land", title:__("오로라 아래의 휴식"),
      lines:[__("이 하늘은 값을 매길 수가 없소. 처음으로 장부를 덮었지."), __("일곱 우주를 다 돌아도 이런 밤은 드물었소."), __("오늘은 장사 얘기는 그만하겠소. 그냥 같이 봅시다.")] },
    { id:"osman_meal", img:"image/cuts/osman_meal.jpg", when:"home", title:__("한 솥 밥"),
      lines:[__("한 솥 밥을 나눠 먹으면 식구요. 외상은 없소, 다 내가 사겠소."), __("지구가 보이는 자리에서 먹는 밥이 제일 맛있소."), __("일곱 우주의 진미보다 이 국 한 그릇이 낫구려.")] },
  ],
  kenshin:[
    { id:"kenshin_fire", img:"image/cuts/kenshin_fire.jpg", when:"storm", title:__("폭풍 속의 모닥불"),
      lines:[__("폭풍은 지나가오. 그때까지 불만 꺼뜨리지 않으면 되오."), __("손이 차군. 불 가까이 오시오. 검은 내가 지키겠소."), __("검을 쥐지 않은 밤도 나쁘지 않구려.")] },
    { id:"kenshin_guard", img:"image/cuts/kenshin_guard.jpg", when:"repair", title:__("내 뒤에 있으시오"),
      lines:[__("다친 데는 없소? …그럼 됐소. 내 뒤에 있으시오."), __("배가 부서져도 그대는 안 부서지게 하겠소."), __("불길은 내가 베겠소. 그대는 숨만 고르시오.")] },
    { id:"kenshin_port", img:"image/cuts/kenshin_port.jpg", when:"rest", title:__("도착의 기쁨"),
      lines:[__("도착이오! …이럴 땐 검객도 소리를 지르고 싶어지는군."), __("기지의 불빛은 언제 봐도 좋소. 돌아갈 곳이 있다는 뜻이니까."), __("오늘은 검을 내려놓고 거리를 걸어 보겠소. 같이 가겠소?")] },
  ],
};
const CUT_HINT = { rest:__("기지에 입항해 쉴 때"), land:__("새 천체에 처음 내릴 때"), meteor:__("유성우나 혜성을 함께 볼 때"), depart:__("기지에서 보급을 마치고 출항할 때"), repair:__("선체가 크게 부서졌을 때"), profit:__("화물을 크게 남기고 팔았을 때"), loss:__("화물을 손해 보고 팔았을 때"), win:__("전투에서 이겼을 때"), night:__("긴 항해 중 밤이 깊었을 때"), lucky:__("보석을 한꺼번에 얻었을 때"), gravity:__("블랙홀 스윙바이나 웜홀을 지날 때"), explore:__("떠돌이 별을 조사할 때"), mission:__("임무를 완료했을 때"), join:__("새 승무원이 합류했을 때"), zone:__("새 우주에 처음 들어섰을 때"), low:__("연료나 산소가 바닥나 갈 때"), route:__("새 무역 항로를 개설했을 때"), tech:__("연구를 완료했을 때"), flee:__("전투에서 달아나거나 통행료를 냈을 때"), full:__("화물칸을 가득 채웠을 때"), warp:__("워프 드라이브를 완성했을 때"), ruins:__("고대 유적을 조사할 때"), den:__("해적 기지를 토벌했을 때"), chase:__("적이 추격해 오기 시작할 때"), income:__("무역 항로 수익을 받았을 때"), signal:__("미확인 신호를 분석할 때"), discover:__("항해 중 새 천체를 발견했을 때"), invest:__("기지에 투자했을 때"), achv:__("업적을 달성했을 때"), storm:__("이온 폭풍에 들어섰을 때"), raid:__("해적 기지를 향해 출격할 때"), home:__("고향 지구에 입항했을 때"), monster:__("우주 괴물을 쓰러뜨렸을 때"), tame:__("우주 생물을 길들였을 때"), market:__("떠돌이 상인과 거래했을 때"), wreck:__("기함을 잃고 지구로 돌아왔을 때"), boost:__("부스트로 가속할 때"), party:__("항해 30일마다 찾아오는 함대 기념일"), rock:__("소행성이나 우주 쓰레기와 부딪혔을 때") };
const CUT_RATE = { rest:0.25, land:0.5, meteor:1, depart:0.2, repair:0.6, profit:0.5, loss:0.5, win:0.3, night:0.15, lucky:0.5, gravity:0.5, explore:0.3, mission:0.4, join:0.4, zone:1, low:0.5, route:0.6, tech:0.3, flee:0.4, full:0.4, warp:1, ruins:0.5, den:0.6, chase:0.15, income:0.4, signal:0.3, discover:0.12, invest:0.6, achv:0.5, storm:0.5, raid:0.5, home:0.5, monster:0.6, tame:1, market:0.4, wreck:1, boost:0.08, party:1, rock:0.1 };            /* 상황이 왔을 때 컷이 나올 확률 */
const CUT_GAP = 2;                                             /* 컷 사이 최소 간격(게임 속 일) */
function cutState(){ if(!state.cuts) state.cuts = { seen:{}, last:-99 }; return state.cuts; }

/* 상황이 생겼을 때 부른다. 보유한 승무원 가운데 이 상황의 컷이 있는 사람을 골라 보여 준다 */
function cutTry(when, rate, skip){
  if(!CUT_RATE[when]) return false;
  const cs = cutState(); if(state.day - cs.last < CUT_GAP) return false;
  if(Math.random() >= (rate != null ? rate : CUT_RATE[when])) return false;
  /* 이 상황의 컷을 가진 보유 승무원 가운데 한 사람을 무작위로 고르고(아직 못 본 컷이 있는 사람 우선), 그 사람의 컷 하나만 보여 준다 */
  const who = Object.keys(CUTS).filter(id => state.crew.includes(id) && id !== skip && CUTS[id].some(c => c.when === when));
  if(!who.length) return false;
  const fresh = id => CUTS[id].some(c => c.when === when && !cs.seen[c.id]);          /* 아직 못 본 컷이 있는 사람부터 */
  const cand = who.some(fresh) ? who.filter(fresh) : who;
  const id = cand[Math.floor(Math.random()*cand.length)], mine = CUTS[id].filter(c => c.when === when), unseen = mine.filter(c => !cs.seen[c.id]);
  const list = unseen.length ? unseen : mine, pick = [id, list[Math.floor(Math.random()*list.length)]];
  cs.last = state.day;
  setTimeout(()=>{ if((typeof ST !== "undefined" && ST.on) || combat || $("gameover").style.display === "flex") return; showCut(pick[0], pick[1]); }, 700);
  return true;
}
/* 컷 화면: 그림 + 대사. 누르면 닫힌다 */
let cutWas = null;
function showCut(id, c, line){
  const n = CREW_MAP[id], cs = cutState(), first = !cs.seen[c.id];
  cs.seen[c.id] = true;
  if(first && state.aff) state.aff[id] = Math.min(100, (state.aff[id]||0)+3);    /* 처음 보는 컷은 호감도 +3 */
  let el = $("cutView");
  if(!el){ el = document.createElement("div"); el.id = "cutView"; document.body.appendChild(el);
    el.style.cssText = "position:fixed;inset:0;z-index:250;background:rgba(8,10,18,.92);display:none;flex-direction:column;align-items:center;justify-content:center;padding:14px;cursor:pointer;opacity:0;transition:opacity .35s"; }
  const text = line || c.lines[Math.floor(Math.random()*c.lines.length)];
  el.innerHTML = `<img src="${c.img}" style="max-width:min(100%,980px);max-height:68vh;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.6);object-fit:contain">
    <div style="width:min(100%,760px);margin-top:14px;display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.96);border-radius:16px;padding:12px 16px;box-shadow:0 6px 24px rgba(0,0,0,.4)">
      ${portrait(n, 54)}<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px;color:#b0743f">${n.name} <span style="color:#999;font-weight:600">· ${c.title}</span>${first?` <span class="gtag" style="background:#e0a63f">NEW</span>`:""}</div>
      <div id="cutSay" style="font-size:14.5px;line-height:1.6;color:#3a2e24;margin-top:2px"></div></div></div>
    <div style="color:rgba(255,255,255,.6);font-size:11.5px;margin-top:10px">${__("눌러서 닫기")}</div>`;
  el.onclick = closeCut;
  if(cutWas === null) cutWas = paused;
  paused = true; el.style.display = "flex"; void el.offsetWidth; el.style.opacity = "1"; sfx("fanfare");
  let k = 0; const say = $("cutSay"), tm = setInterval(()=>{ k += 2; if(say) say.textContent = text.slice(0, k); if(k >= text.length) clearInterval(tm); }, 28);
  save();
}
function closeCut(){
  const el = $("cutView"); if(!el) return;
  el.style.opacity = "0"; setTimeout(()=>{ el.style.display = "none"; }, 350);
  paused = cutWas === null ? false : cutWas; cutWas = null;
  if(modalKind === "member") openMember(memberId);                              /* 모아보기에서 열었으면 상세 화면을 새로 그린다 */
}
/* 승무원 상세 화면에 붙는 모아보기 */
function cutsHTML(id){
  const list = CUTS[id]; if(!list) return "";
  const cs = cutState(), seen = list.filter(c=>cs.seen[c.id]).length;
  let html = `<div class="sec">${__("📸 서비스 컷")} <span class="stat">${seen}/${list.length}</span></div><div class="card"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">`;
  list.forEach((c,i)=>{ const ok = cs.seen[c.id];
    html += ok ? `<div onclick="showCut('${id}', CUTS['${id}'][${i}])" style="cursor:pointer;text-align:center"><div style="aspect-ratio:16/10;border-radius:10px;background:url('${c.img}') center/cover;box-shadow:0 2px 8px rgba(0,0,0,.18)"></div><div class="stat" style="margin-top:4px;font-weight:700">${c.title}</div></div>`
      : `<div style="text-align:center"><div style="aspect-ratio:16/10;border-radius:10px;background:#2a2f40;color:#8a90a8;display:flex;align-items:center;justify-content:center;font-size:22px">🔒</div><div class="stat" style="margin-top:4px;font-size:10.5px;line-height:1.35">${CUT_HINT[c.when]}</div></div>`; });
  html += `</div>${state.crew.includes(id) ? "" : `<div class="stat" style="margin-top:8px">${__("승무원으로 맞이하면 볼 수 있습니다")}</div>`}</div>`;
  return html;
}
