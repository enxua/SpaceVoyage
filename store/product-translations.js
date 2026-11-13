/* 구글 플레이 인앱 상품 번역 (이름 · 설명). 상품 이름은 게임 안 번역(js/lang)과 같다.
   node -e 'console.log(JSON.stringify(require("./store/product-translations.js")))' 로 JSON 을 뽑아 콘솔에 넣는다. */
const N = (n, l) => n.toLocaleString({ en:"en-US", es:"es-ES", fr:"fr-FR", it:"it-IT", pt:"pt-BR", ja:"ja-JP", zhs:"zh-CN", zht:"zh-TW" }[l]);
const LANGS = { en:"en-US", es:"es-ES", fr:"fr-FR", it:"it-IT", pt:"pt-BR", ja:"ja-JP", zhs:"zh-CN", zht:"zh-TW" };

const NAMES = {
  p1:{en:"Credit Pouch",es:"Bolsa de créditos",fr:"Bourse de crédits",it:"Borsa di crediti",pt:"Bolsa de Créditos",ja:"クレジットの小袋",zhs:"信用点钱袋",zht:"信用點錢袋"},
  p2:{en:"Credit Crate",es:"Caja de créditos",fr:"Caisse de crédits",it:"Cassa di crediti",pt:"Caixa de Créditos",ja:"クレジットの箱",zhs:"信用点箱",zht:"信用點寶箱"},
  p3:{en:"Credit Vault",es:"Caja fuerte de créditos",fr:"Coffre de crédits",it:"Cassaforte di crediti",pt:"Cofre de Créditos",ja:"クレジットの金庫",zhs:"信用点金库",zht:"信用點金庫"},
  p4:{en:"Credit Cargo Hold",es:"Bodega de créditos",fr:"Soute de crédits",it:"Stiva di crediti",pt:"Porão de Créditos",ja:"クレジットの貨物室",zhs:"信用点货舱",zht:"信用點貨艙"},
  p5:{en:"Credit Transport",es:"Carguero de créditos",fr:"Convoi de crédits",it:"Cargo di crediti",pt:"Cargueiro de Créditos",ja:"クレジット輸送船",zhs:"信用点运输船",zht:"信用點運輸船"},
  p6:{en:"Credit Galactic Vault",es:"Cámara galáctica de créditos",fr:"Trésor galactique de crédits",it:"Caveau galattico di crediti",pt:"Cofre Galáctico de Créditos",ja:"クレジット銀河金庫",zhs:"信用点银河金库",zht:"信用點銀河金庫"},
  g1:{en:"Gem Pouch",es:"Bolsa de gemas",fr:"Bourse de gemmes",it:"Sacchetto di gemme",pt:"Bolsa de gemas",ja:"ジェムの袋",zhs:"宝石袋",zht:"寶石袋"},
  g2:{en:"Gem Box",es:"Caja de gemas",fr:"Boîte de gemmes",it:"Scatola di gemme",pt:"Caixa de gemas",ja:"ジェムの箱",zhs:"宝石箱",zht:"寶石箱"},
  g3:{en:"Gem Safe",es:"Caja fuerte de gemas",fr:"Coffre de gemmes",it:"Cassaforte di gemme",pt:"Cofre de gemas",ja:"ジェムの金庫",zhs:"宝石保险箱",zht:"寶石保險箱"},
  g4:{en:"Gem Cargo Hold",es:"Bodega de gemas",fr:"Soute de gemmes",it:"Stiva di gemme",pt:"Porão de gemas",ja:"ジェムの貨物室",zhs:"宝石货舱",zht:"寶石貨艙"},
  g5:{en:"Galactic Gem Vault",es:"Bóveda galáctica de gemas",fr:"Chambre forte galactique de gemmes",it:"Caveau galattico di gemme",pt:"Cofre galáctico de gemas",ja:"ジェムの銀河金庫",zhs:"宝石银河金库",zht:"寶石銀河金庫"},
  s1:{en:"Starter Ship Pack",es:"Paquete inicial de nave",fr:"Pack de départ vaisseau",it:"Pacchetto iniziale nave",pt:"Pacote inicial de nave",ja:"初心者艦船パック",zhs:"新手舰船礼包",zht:"新手艦船禮包"},
  s2:{en:"Starter Crew Pack",es:"Paquete inicial de tripulación",fr:"Pack de départ équipage",it:"Pacchetto iniziale equipaggio",pt:"Pacote inicial de tripulação",ja:"初心者乗組員パック",zhs:"新手船员礼包",zht:"新手船員禮包"},
  na30:{en:"Remove Ads - 30 Days",es:"Sin anuncios - 30 días",fr:"Sans pub - 30 jours",it:"Niente annunci - 30 giorni",pt:"Sem anúncios - 30 dias",ja:"広告除去 30日",zhs:"去除广告 30天",zht:"移除廣告 30天"},
  naInf:{en:"Remove Ads - Forever",es:"Sin anuncios - para siempre",fr:"Sans pub - à vie",it:"Niente annunci - per sempre",pt:"Sem anúncios - para sempre",ja:"広告除去 無期限",zhs:"永久去除广告",zht:"永久移除廣告"},
};

/* 설명 틀: {n} 수량, {b} 보너스 문구 */
const CRED = {
  en:(n,b)=>`Get ${n} credits for your space voyage${b?` (+${b}% bonus)`:""}. Your first purchase gives the base amount once more, and your VIP bonus is added too.`,
  es:(n,b)=>`Recibe ${n} créditos para tu viaje espacial${b?` (+${b}% de bonificación)`:""}. En la primera compra recibes otra vez la cantidad base, y se suma tu bonificación VIP.`,
  fr:(n,b)=>`Recevez ${n} crédits pour votre voyage spatial${b?` (+${b} % de bonus)`:""}. Le premier achat double la quantité de base, et votre bonus VIP s'ajoute.`,
  it:(n,b)=>`Ricevi ${n} crediti per il tuo viaggio spaziale${b?` (+${b}% di bonus)`:""}. Al primo acquisto ricevi di nuovo la quantità base e si aggiunge il bonus VIP.`,
  pt:(n,b)=>`Receba ${n} créditos para sua viagem espacial${b?` (+${b}% de bônus)`:""}. Na primeira compra você recebe a quantidade base mais uma vez, e o bônus VIP é somado.`,
  ja:(n,b)=>`宇宙航海に使うクレジット${n}${b?`（+${b}%ボーナス）`:""}を受け取れます。初回購入では基本数量をもう一度受け取れ、VIPボーナスも加算されます。`,
  zhs:(n,b)=>`获得用于宇宙航行的信用点${n}${b?`（+${b}%奖励）`:""}。首次购买可再获得一次基础数量，并叠加VIP奖励。`,
  zht:(n,b)=>`獲得用於宇宙航行的信用點${n}${b?`（+${b}%獎勵）`:""}。首次購買可再獲得一次基礎數量，並疊加VIP獎勵。`,
};
const GEM = {
  en:(n,b)=>`Get ${n} Gems for building ships and recruiting crew${b?` (+${b}% bonus)`:""}. Your first purchase gives the base amount once more, and your VIP bonus is added too.`,
  es:(n,b)=>`Recibe ${n} gemas para construir naves y reclutar tripulación${b?` (+${b}% de bonificación)`:""}. En la primera compra recibes otra vez la cantidad base, y se suma tu bonificación VIP.`,
  fr:(n,b)=>`Recevez ${n} gemmes pour construire des vaisseaux et recruter l'équipage${b?` (+${b} % de bonus)`:""}. Le premier achat double la quantité de base, et votre bonus VIP s'ajoute.`,
  it:(n,b)=>`Ricevi ${n} gemme per costruire navi e reclutare l'equipaggio${b?` (+${b}% di bonus)`:""}. Al primo acquisto ricevi di nuovo la quantità base e si aggiunge il bonus VIP.`,
  pt:(n,b)=>`Receba ${n} gemas para construir naves e recrutar tripulantes${b?` (+${b}% de bônus)`:""}. Na primeira compra você recebe a quantidade base mais uma vez, e o bônus VIP é somado.`,
  ja:(n,b)=>`艦船の建造とクルーの勧誘に使うジェム${n}個${b?`（+${b}%ボーナス）`:""}を受け取れます。初回購入では基本数量をもう一度受け取れ、VIPボーナスも加算されます。`,
  zhs:(n,b)=>`获得用于建造舰船和招募船员的宝石${n}个${b?`（+${b}%奖励）`:""}。首次购买可再获得一次基础数量，并叠加VIP奖励。`,
  zht:(n,b)=>`獲得用於建造艦船和招募船員的寶石${n}個${b?`（+${b}%獎勵）`:""}。首次購買可再獲得一次基礎數量，並疊加VIP獎勵。`,
};
const FIXED = {
  s1:{en:"A starter pack that gives you 1 SR-grade ship right away. Can be bought only once and makes your early voyages and trading much easier.",
      es:"Paquete inicial que te da 1 nave de grado SR al instante. Solo se puede comprar una vez y facilita mucho tus primeros viajes y comercio.",
      fr:"Pack de départ qui vous donne tout de suite 1 vaisseau de rang SR. Achetable une seule fois, il facilite vos premiers voyages et échanges.",
      it:"Pacchetto iniziale che ti dà subito 1 nave di grado SR. Acquistabile una sola volta, rende molto più facili i primi viaggi e commerci.",
      pt:"Pacote inicial que dá 1 nave de nível SR na hora. Pode ser comprado só uma vez e deixa suas primeiras viagens e trocas muito mais fáceis.",
      ja:"SR等級の艦船1隻をすぐに受け取れる初心者パックです。購入は1回限りで、序盤の航海と交易がぐっと楽になります。",
      zhs:"立即获得1艘SR等级舰船的新手礼包。仅限购买一次，让前期航行和贸易轻松许多。",
      zht:"立即獲得1艘SR等級艦船的新手禮包。僅限購買一次，讓前期航行和貿易輕鬆許多。"},
  s2:{en:"A starter pack that recruits 1 SSR-grade crew member right away. Can be bought only once; appoint them to a post to greatly boost your ship.",
      es:"Paquete inicial que recluta al instante a 1 tripulante de grado SSR. Solo se compra una vez; asígnalo a un cargo para potenciar mucho tu nave.",
      fr:"Pack de départ qui recrute tout de suite 1 membre d'équipage de rang SSR. Achetable une fois ; nommez-le à un poste pour renforcer votre vaisseau.",
      it:"Pacchetto iniziale che recluta subito 1 membro dell'equipaggio di grado SSR. Acquistabile una volta; assegnalo a un ruolo per potenziare la nave.",
      pt:"Pacote inicial que recruta na hora 1 tripulante de nível SSR. Compra única; nomeie-o para um cargo e fortaleça muito sua nave.",
      ja:"SSR等級のクルー1人をすぐに迎えられる初心者パックです。購入は1回限りで、役職に任命すると艦の能力が大きく上がります。",
      zhs:"立即招募1名SSR等级船员的新手礼包。仅限购买一次，任命到职位后舰船能力大幅提升。",
      zht:"立即招募1名SSR等級船員的新手禮包。僅限購買一次，任命到職位後艦船能力大幅提升。"},
  na30:{en:"For 30 days, get ad rewards instantly without watching ads. Buying again adds 30 days to the time left. Daily reward limits stay the same.",
      es:"Durante 30 días, recibe las recompensas de anuncios al instante sin verlos. Si vuelves a comprar, se suman 30 días. El límite diario no cambia.",
      fr:"Pendant 30 jours, obtenez les récompenses de pub sans regarder de pub. Un nouvel achat ajoute 30 jours. Les limites quotidiennes restent les mêmes.",
      it:"Per 30 giorni ricevi subito le ricompense degli annunci senza guardarli. Un nuovo acquisto aggiunge 30 giorni. I limiti giornalieri restano uguali.",
      pt:"Por 30 dias, receba as recompensas de anúncios na hora, sem assisti-los. Comprar de novo soma 30 dias. Os limites diários continuam iguais.",
      ja:"30日間、広告を見ずに広告報酬をすぐに受け取れます。再購入すると残り期間に30日が加算されます。1日の報酬回数はそのままです。",
      zhs:"30天内无需观看广告即可立即领取广告奖励。再次购买会在剩余时间上增加30天。每日奖励次数不变。",
      zht:"30天內無需觀看廣告即可立即領取廣告獎勵。再次購買會在剩餘時間上增加30天。每日獎勵次數不變。"},
  naInf:{en:"Get ad rewards instantly without watching ads, forever. Restored from your purchase history if you reinstall the app. Daily reward limits stay the same.",
      es:"Recibe para siempre las recompensas de anuncios al instante sin verlos. Se restaura con tu historial de compras al reinstalar. El límite diario no cambia.",
      fr:"Obtenez pour toujours les récompenses de pub sans regarder de pub. Restauré via l'historique d'achats si vous réinstallez. Limites quotidiennes inchangées.",
      it:"Ricevi per sempre le ricompense degli annunci senza guardarli. Viene ripristinato dalla cronologia acquisti se reinstalli. I limiti giornalieri restano uguali.",
      pt:"Receba para sempre as recompensas de anúncios na hora, sem assisti-los. É restaurado pelo histórico de compras ao reinstalar. Limites diários iguais.",
      ja:"広告を見ずに広告報酬を永久にすぐ受け取れます。アプリを再インストールしても購入履歴から復元されます。1日の報酬回数はそのままです。",
      zhs:"永久无需观看广告即可立即领取广告奖励。重新安装应用后可从购买记录恢复。每日奖励次数不变。",
      zht:"永久無需觀看廣告即可立即領取廣告獎勵。重新安裝應用程式後可從購買紀錄恢復。每日獎勵次數不變。"},
};
const AMT = { p1:[1000,0], p2:[5000,10], p3:[10000,20], p4:[30000,35], p5:[50000,50], p6:[100000,80], g1:[10,0], g2:[50,10], g3:[100,20], g4:[300,35], g5:[800,60] };

const out = {};
for(const id of Object.keys(NAMES)){
  out["voyage_" + id.toLowerCase()] = {};
  for(const [l, code] of Object.entries(LANGS)){
    let desc;
    if(FIXED[id]) desc = FIXED[id][l];
    else { const [n, b] = AMT[id]; desc = (id[0] === "p" ? CRED : GEM)[l](N(n, l), b); }
    out["voyage_" + id.toLowerCase()][code] = { name: NAMES[id][l], desc };
  }
}
module.exports = out;
