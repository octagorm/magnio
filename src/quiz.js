// Vil du bli Magnionær? A quiz in the café in Lillesand, in the style of the
// TV show: ten questions, harder and harder, for up to a million kroner.
// Three lifelines: 50:50 takes away two wrong answers, Magnio can phone a
// friend (who is usually right, and always sure), and the audience votes.
// He can go home with what he has at any time. A wrong answer throws him
// out of the show with the last safe amount; he can come back in by
// talking to the host in Lillesand again.
//
// Each new question sweeps in, its answers appear one by one, and nothing is
// selected until an arrow is pressed, so a stray ✕ never picks an answer.
// The arrows move between the answers and the buttons at the top, ✕ picks,
// and before an answer counts the host asks if it is his final answer.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216;
  var X = '✕', SQ = '□';
  var LADDER = [100, 200, 300, 500, 1000, 2000, 5000, 10000, 100000, 1000000];
  var SAFE = [4, 7]; // 1 000 and 10 000 are kept even after a wrong answer
  var LETTERS = ['A', 'B', 'C', 'D'];
  var CALL_HELLO = 160, CALL_RINGS = 240;
  var SHOWN = 76; // frames until a new question and all its answers are up // the phone call: Magnio says hello, it rings, the friend answers

  // The right answer comes first here; the order is shuffled when asked.
  var EASY = [
    ['HVA HETER HOVEDSTADEN I NORGE?', ['OSLO', 'BERGEN', 'HARØYA', 'KØBENHAVN, PÅ ET VIS']],
    ['HVILKEN FARGE HAR ET MODENT BLÅBÆR?', ['BLÅ', 'RØD', 'GRØNN', 'DET KOMMER AN PÅ HUMØRET']],
    ['HVA KALLES EN HANNSAU?', ['VÆR', 'BUKK', 'HINGST', 'HERR SAU']],
    ['HVOR MANGE BEIN HAR EN EDDERKOPP?', ['ÅTTE', 'SEKS', 'TI', 'ALTFOR MANGE']],
    ['HVA ER VERDENS MINSTE LAND?', ['VATIKANSTATEN', 'MONACO', 'SAN MARINO', 'HARØYA']],
    ['HVILKEN PLANET ER NÆRMEST SOLA?', ['MERKUR', 'VENUS', 'MARS', 'SOLARIUM']]
  ];
  var MEDIUM = [
    ['HVOR MANGE BEIN HAR EN KRABBE, KLØRNE MEDREGNET?', ['TI', 'ÅTTE', 'SEKS', 'KOMMER AN PÅ OM DEN GÅR SIDELENGS']],
    ['HVILKEN FISK HAR EN SVART FLEKK PÅ SIDEN, LIKE BAK GJELLENE?', ['HYSE', 'TORSK', 'MAKRELL', 'SEI']],
    ['HVILKEN BY LIGGER LYKKENS PORTAL I?', ['TRONDHEIM', 'BERGEN', 'STAVANGER', 'LILLESAND']],
    ['HVA HETER TRAVBANEN I TRONDHEIM?', ['LEANGEN', 'BJERKE', 'FORUS', 'KRABBEBANEN']],
    ['I HVILKET ÅR BLE GRUNNLOVEN UNDERTEGNET PÅ EIDSVOLL?', ['1814', '1905', '1789', '1066']],
    ['HVOR MANGE SEKSKANTER ER DET PÅ ET VANLIG CATAN-BRETT?', ['19', '16', '21', '25']],
    ['HVA BETYR DET NÅR DET ER OKSEMARKED PÅ BØRSEN?', ['AT KURSENE STIGER', 'AT KURSENE FALLER', 'AT DET SELGES KVEG', 'AT NOEN HAR SLUPPET LØS EN OKSE']],
    ['HVA HET TRONDHEIM I MIDDELALDEREN?', ['NIDAROS', 'BJØRGVIN', 'TUNSBERG', 'TRONDHEIMSEN']],
    ['I HVILKET ÅR LANDET DE FØRSTE MENNESKENE PÅ MÅNEN?', ['1969', '1959', '1972', '1965']],
    ['HVOR MANGE KORT ER DET I EN KORTSTOKK UTEN JOKERE?', ['52', '54', '48', '56']],
    ['HVA ER DET STØRSTE DYRET SOM NOEN GANG HAR LEVD?', ['BLÅHVALEN', 'T-REX', 'MAMMUTEN', 'ONKEL ETTER JULEMIDDAGEN']]
  ];
  var HARD = [
    ['HVA ER DEN LENGSTE FJORDEN I NORGE?', ['SOGNEFJORDEN', 'HARDANGERFJORDEN', 'TRONDHEIMSFJORDEN', 'OSLOFJORDEN']],
    ['HVA HETER NORGES HØYESTE FJELL?', ['GALDHØPIGGEN', 'GLITTERTIND', 'SNØHETTA', 'STORE SKAGASTØLSTIND']],
    ['HVOR MANGE HJERTER HAR EN BLEKKSPRUT?', ['TRE', 'ETT', 'TO', 'ÅTTE, ETT I HVER ARM']],
    ['HVA HETER DET MINSTE BEINET I MENNESKEKROPPEN?', ['STIGBØYLEN', 'HAMMEREN', 'AMBOLTEN', 'LILLETÅA']],
    ['HVA HET NORGES FØRSTE VINNERLÅT I MELODI GRAND PRIX?', ['LA DET SWINGE', 'NOCTURNE', 'FAIRYTALE', 'KAPTEIN SABELTANN']],
    ['HVILKET HAV LIGGER MELLOM NORGE OG ISLAND?', ['NORSKEHAVET', 'NORDSJØEN', 'BARENTSHAVET', 'SKAGERRAK']],
    ['HVA ER RIKTIG FLERTALL AV KAKTUS PÅ BOKMÅL?', ['KAKTUSER', 'KAKTI', 'KAKTUSSER', 'KAKTUSAR']],
    ['HVILKEN FARGE HAR HUDEN UNDER PELSEN PÅ EN ISBJØRN?', ['SVART', 'HVIT', 'ROSA', 'GJENNOMSIKTIG']]
  ];
  var FINAL = [
    ['HVOR LENGE VARTE HUNDREÅRSKRIGEN?', ['116 ÅR', '100 ÅR', '99 ÅR', 'DET STÅR JO I NAVNET']],
    ['HVILKET GRUNNSTOFF HAR KJEMISK SYMBOL W?', ['WOLFRAM', 'VANADIUM', 'WATT', 'WIENERBRØD']],
    ['HVOR MANGE TANGENTER HAR ET VANLIG PIANO?', ['88', '76', '96', '100']],
    ['HVILKE DYR HAR DE STØRSTE ØYNENE I VERDEN?', ['BLEKKSPRUTER', 'BLÅHVALER', 'STRUTSER', 'MAGNE NÅR HAN SER KAKE']]
  ];

  // Who Magnio phones, and how they sound. Each is sure of themselves.
  var FRIENDS = [
    ['ASLAK', function (l) { return 'HMM... EG E NESTEN SIKKER PÅ AT DET E ' + l + '.'; }],
    ['TOVE', function (l) { return 'DET E ' + l + ', MAGNE. STOL PÅ MEG.'; }],
    ['GORM', function (l) { return 'JEG TROR DET ER ' + l + '. MEN JEG HAR TATT FEIL FØR.'; }],
    ['KATHINKA', function (l) { return 'DED ER HELT SIKKERT ' + l + '! ELLER... JA.'; }],
    ['TELLEF', function (l) { return 'BESTE! DET ER ' + l + '! OG DU ER EN DINOSAUR!'; }]
  ];

  var S = null, env = null;

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function kr(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' KR'; }

  // Ten questions: three easy, three medium, three hard and a last one.
  function questions() {
    var pools = [shuffle(EASY.slice()), shuffle(MEDIUM.slice()), shuffle(HARD.slice()), shuffle(FINAL.slice())];
    var plan = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3], used = [0, 0, 0, 0];
    return plan.map(function (p) {
      var q = pools[p][used[p]++], order = shuffle([0, 1, 2, 3]);
      return { text: q[0], answers: order.map(function (k) { return q[1][k]; }), right: order.indexOf(0) };
    });
  }

  function start(e) {
    env = e;
    newGame();
    AU.startMusic('quiz');
  }

  function newGame() {
    S = { phase: 'intro', t: 0, qt: 0, qs: questions(), level: 0, row: 1, col: 0, chosen: -1, hidden: [], used: {},
      say: 'VELKOMMEN TIL VIL DU BLI MAGNIONÆR! TI SPØRSMÅL SKILLER DEG FRA EN MILLION KRONER.', votes: null, call: null, won: 0 };
  }

  function go(phase) { S.phase = phase; S.t = 0; }
  function q() { return S.qs[S.level]; }
  function safeAmount() {
    var amount = 0;
    for (var i = 0; i < SAFE.length; i++) if (S.level > SAFE[i]) amount = LADDER[SAFE[i]];
    return amount;
  }
  function current() { return S.level ? LADDER[S.level - 1] : 0; }

  // ---------------------------------------------------------------- playing
  function step() {
    S.t++;
    S.qt++;
    var P = S.phase, ok = env.pressed('jumpP'), back = env.pressed('fireP');
    if (P === 'intro') { if (S.t > 30 && ok) ask(); }
    else if (P === 'ask') stepAsk(ok);
    else if (P === 'confirm') {
      if (ok && S.t > 20) { go('lock'); AU.sfx('bell'); S.say = 'DA SER VI...'; }
      else if (back) { S.chosen = -1; S.row = -1; go('ask'); S.say = 'TA DEG GOD TID.'; }
    } else if (P === 'lock') { if (S.t > 90) reveal(); }
    else if (P === 'right') { if (S.t > 30 && ok) { S.level++; ask(); } }
    else if (P === 'phone') {
      // ✕ moves the call on one step at a time, so nothing goes by too fast
      if (ok && S.t < CALL_HELLO) S.t = CALL_HELLO;
      else if (ok && S.t < CALL_RINGS) S.t = CALL_RINGS;
      else if (S.t > CALL_RINGS + 40 && (ok || back)) go('ask');
    } else if (P === 'crowd') { if (S.t > 90 && (ok || back)) go('ask'); }
    else if (P === 'end') { if (S.t > 60 && (ok || back)) env.done(); }
  }

  function ask() {
    S.chosen = -1; S.hidden = []; S.votes = null; S.call = null;
    S.row = -1; S.col = 0; S.qt = 0;
    S.say = 'SPØRSMÅL ' + (S.level + 1) + ', FOR ' + kr(LADDER[S.level]) + ':';
    go('ask');
    AU.sfx('power');
  }

  function button(i) { return ['FIFTY', 'PHONE', 'CROWD', 'HOME'][i]; }

  function stepAsk(ok) {
    if (S.qt < SHOWN) return;
    var moved = false;
    if (S.row < 0) {
      // the first arrow only shows where the cursor is, on A
      if (env.pressed('upP') || env.pressed('downP') || env.pressed('leftP') || env.pressed('rightP')) { S.row = 1; S.col = 0; AU.sfx('talk'); }
      return;
    }
    if (env.pressed('upP') && S.row > 0) { S.col = S.row === 1 ? S.col * 2 : S.col; S.row--; moved = true; }
    if (env.pressed('downP') && S.row < 2) { S.col = S.row === 0 ? Math.min(1, S.col >> 1) : S.col; S.row++; moved = true; }
    var cols = S.row === 0 ? 4 : 2;
    if (env.pressed('leftP') && S.col > 0) { S.col--; moved = true; }
    if (env.pressed('rightP') && S.col < cols - 1) { S.col++; moved = true; }
    S.col = Math.min(S.col, cols - 1);
    if (moved) AU.sfx('talk');
    if (!ok || S.t < 10) return;
    if (S.row > 0) {
      var a = (S.row - 1) * 2 + S.col;
      if (S.hidden.indexOf(a) >= 0) return;
      S.chosen = a;
      S.say = 'ER DET DITT ENDELIGE SVAR?';
      go('confirm');
      return;
    }
    var b = button(S.col);
    if (b === 'HOME') { finish(current(), 'DU GÅR HJEM MED ' + kr(current()) + '. KLOKT!'); return; }
    if (S.used[b]) return;
    S.used[b] = true;
    if (b === 'FIFTY') fifty();
    else if (b === 'PHONE') phone();
    else crowd();
  }

  function fifty() {
    var wrong = [0, 1, 2, 3].filter(function (i) { return i !== q().right; });
    S.hidden = shuffle(wrong).slice(0, 2);
    S.say = 'DATAMASKINEN FJERNER TO GALE SVAR.';
    AU.sfx('puff');
  }

  // A friend is right four times out of five, and sounds sure either way.
  function phone() {
    var f = pick(FRIENDS), left = [0, 1, 2, 3].filter(function (i) { return S.hidden.indexOf(i) < 0; });
    var guess = Math.random() < 0.8 ? q().right : pick(left.filter(function (i) { return i !== q().right; }));
    S.call = { who: f[0], line: f[1](LETTERS[guess]) };
    S.say = 'MAGNIO RINGER ' + f[0] + '.';
    go('phone');
  }

  // The audience mostly knows; the right answer usually gets the most votes.
  function crowd() {
    var votes = [0, 0, 0, 0], left = [0, 1, 2, 3].filter(function (i) { return S.hidden.indexOf(i) < 0; });
    var sure = Math.random() < 0.85, top = sure ? q().right : pick(left);
    var rest = 100 - (top === q().right ? 45 + Math.floor(Math.random() * 30) : 35);
    votes[top] = 100 - rest;
    var others = left.filter(function (i) { return i !== top; });
    for (var k = 0; k < others.length; k++) {
      var share = k === others.length - 1 ? rest : Math.floor(Math.random() * rest * 0.7);
      votes[others[k]] = share; rest -= share;
    }
    // whoever they lean towards gets the most votes
    var most = votes.indexOf(Math.max.apply(null, votes));
    if (most !== top) { var tmp = votes[top]; votes[top] = votes[most]; votes[most] = tmp; }
    S.votes = votes;
    S.say = 'PUBLIKUM HAR STEMT.';
    go('crowd');
  }

  function reveal() {
    if (S.chosen === q().right) {
      AU.sfx('clear');
      if (S.level === LADDER.length - 1) {
        S.level++;
        finish(LADDER[LADDER.length - 1], 'RIKTIG! DU ER MAGNIONÆR! EN MILLION KRONER!');
        S.million = true;
        return;
      }
      S.say = 'RIKTIG! DU HAR NÅ ' + kr(LADDER[S.level]) + '.';
      go('right');
    } else {
      AU.sfx('down');
      var safe = safeAmount();
      finish(safe, 'DESSVERRE! RIKTIG SVAR VAR ' + LETTERS[q().right] + ': ' + q().answers[q().right] + '. DU ER UTE, MEN TAR MED DEG ' + kr(safe) + '.');
    }
  }

  function finish(amount, line) {
    S.won = amount;
    if (amount) { env.setCoins(env.coins() + amount); AU.sfx('coin'); }
    S.say = line;
    go('end');
  }

  // ---------------------------------------------------------------- drawing
  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + ' ' + words[i] : words[i];
      if (next.length > n && cur) { lines.push(cur); cur = words[i]; } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // The show's lozenge-shaped boxes, pointed at both ends.
  function lozenge(ctx, x, y, w, h, fill, edge) {
    var half = h >> 1;
    for (var k = 0; k < h; k++) {
      var inset = Math.abs(k - half + 0.5) | 0;
      ctx.fillStyle = edge; ctx.fillRect(x + inset, y + k, w - inset * 2, 1);
      if (k > 0 && k < h - 1) { ctx.fillStyle = fill; ctx.fillRect(x + inset + 2, y + k, w - inset * 2 - 4, 1); }
    }
  }

  function drawStudio(ctx) {
    ctx.fillStyle = '#060a24';
    ctx.fillRect(0, 0, VW, VH);
    // rings of light behind the stage
    for (var r = 5; r > 0; r--) A.disc(ctx, 144, 88, r * 26, r * 16, r % 2 ? '#0e1640' : '#141e52');
    ctx.fillStyle = '#5a6aa8';
    ctx.fillRect(0, 141, VW, 1); ctx.fillRect(0, 170, VW, 1); ctx.fillRect(0, 196, VW, 1);
  }

  function drawLogo(ctx) {
    F.outline(ctx, 'VIL DU BLI', 8, 6, '#c0c8f0', 1, '#000');
    F.outline(ctx, 'MAGNIONÆR?', 8, 16, '#f0c040', 2, '#000');
  }

  function drawButtons(ctx) {
    var labels = ['50:50', 'RING EN VENN', 'PUBLIKUM', 'GÅ HJEM'], keys = ['FIFTY', 'PHONE', 'CROWD', 'HOME'], x = 8;
    for (var i = 0; i < 4; i++) {
      var w = F.width(labels[i]) + 10, sel = S.phase === 'ask' && S.row === 0 && S.col === i, used = S.used[keys[i]];
      ctx.fillStyle = sel ? '#f0a020' : '#f0f0f0'; ctx.fillRect(x, 36, w, 13);
      ctx.fillStyle = used ? '#2a2a3a' : '#1a2a6a'; ctx.fillRect(x + 1, 37, w - 2, 11);
      F.draw(ctx, labels[i], x + 5, 39, used ? '#5a5a6a' : '#ffffff');
      if (used) { ctx.fillStyle = '#d83030'; ctx.fillRect(x + 3, 42, w - 6, 2); }      // struck through once used
      x += w + 4;
    }
  }

  function drawLadder(ctx) {
    for (var i = 0; i < LADDER.length; i++) {
      var y = 118 - i * 11, here = i === S.level && S.phase !== 'end', safe = SAFE.indexOf(i) >= 0;
      if (here) { lozenge(ctx, 290, y - 2, 90, 11, '#f0a020', '#f0c060'); }
      F.draw(ctx, String(i + 1), 296, y, here ? '#000' : '#f0c040');
      var t = kr(LADDER[i]).slice(0, -3); // just the number, so a million fits beside the 10
      F.draw(ctx, t, 374 - F.width(t), y, here ? '#000' : safe ? '#ffffff' : i < S.level ? '#8a8aa8' : '#f0c040');
    }
  }

  function drawStage(ctx) {
    // Magnio at his desk on the left, the host on the right, and what is
    // being said between them
    var me = A.player.magnio.normal.big.stand.r, host = A.npc.kafevert.l;
    ctx.drawImage(me, 18, 72, 32, 64);
    ctx.fillStyle = '#2a3a8a'; ctx.fillRect(10, 112, 48, 26); ctx.fillStyle = '#f0c040'; ctx.fillRect(10, 112, 48, 2);
    ctx.drawImage(host, 238, 80, 32, 56);
    ctx.fillStyle = '#2a3a8a'; ctx.fillRect(232, 116, 44, 22); ctx.fillStyle = '#f0c040'; ctx.fillRect(232, 116, 44, 2);
    if (S.phase === 'crowd' && S.votes) return drawVotes(ctx);
    var lines;
    var waiting = false;
    if (S.phase === 'phone' && S.call) {
      lines = S.t < CALL_HELLO ? wrap('MAGNIO: HALLO, DET ER I! I SITTER PÅ QUIZ OG TRENGER HJELP.', 26)
        : S.t < CALL_RINGS ? ['TUT... TUT...'] : wrap(S.call.who + ': ' + S.call.line, 26);
      waiting = S.t < CALL_RINGS || S.t > CALL_RINGS + 40;
    } else {
      lines = wrap(S.say, 26);
      waiting = S.phase === 'intro' || S.phase === 'right' || (S.phase === 'crowd' && S.t > 90);
    }
    // a speech bubble just big enough for the words
    var w = 0, i;
    for (i = 0; i < lines.length; i++) w = Math.max(w, F.width(lines[i]));
    var bx = 62, by = 58, bw = w + 12, bh = lines.length * 10 + 8;
    ctx.fillStyle = 'rgba(240,240,255,0.95)';
    ctx.fillRect(bx, by, bw, bh);
    for (i = 0; i < lines.length; i++) F.draw(ctx, lines[i], bx + 6, by + 5 + i * 10, '#10183a');
    if (waiting && S.t > 20 && (S.t >> 5) & 1) F.draw(ctx, X, bx + bw - 8, by + bh - 9, '#2a3a8a');
  }

  function drawVotes(ctx) {
    ctx.fillStyle = 'rgba(10,16,48,0.95)';
    ctx.fillRect(66, 56, 160, 78);
    for (var i = 0; i < 4; i++) {
      var h = Math.round(S.votes[i] * 0.5 * Math.min(1, S.t / 40)), x = 84 + i * 36;
      ctx.fillStyle = '#f0a020'; ctx.fillRect(x, 120 - h, 16, h);
      F.draw(ctx, LETTERS[i], x + 5, 123, '#ffffff');
      if (S.t > 40) F.draw(ctx, S.votes[i] + '%', x + 8 - Math.floor(F.width(S.votes[i] + '%') / 2), 110 - h, '#ffffff');
    }
  }

  function drawQuestion(ctx) {
    if (S.phase === 'intro') return;
    var Q = q();
    if (!Q) return;
    lozenge(ctx, 6, 130, 372, 24, '#0a1450', '#c0c8f0');
    if (S.phase === 'ask' && S.qt < 40) {
      // a band of light sweeps across the new question
      var bx = 6 + Math.round(S.qt / 40 * 372);
      ctx.fillStyle = 'rgba(160,190,255,0.35)'; ctx.fillRect(Math.max(10, bx - 30), 131, Math.min(30, bx - 6), 22);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(Math.max(10, bx - 4), 131, 4, 22);
    }
    var lines = wrap(Q.text, 58);
    for (var i = 0; i < lines.length; i++) F.draw(ctx, lines[i], Math.round((VW - F.width(lines[i])) / 2), 134 + i * 9 + (lines.length === 1 ? 4 : 0), '#ffffff');
    for (var a = 0; a < 4; a++) {
      var x = a % 2 ? 194 : 6, y = a < 2 ? 160 : 186, fill = '#0a1450', edge = '#c0c8f0', ink = '#ffffff';
      var sel = S.phase === 'ask' && S.row > 0 && (S.row - 1) * 2 + S.col === a;
      if (sel) { fill = '#2a3a8a'; edge = '#ffffff'; }
      if (a === S.chosen && (S.phase === 'confirm' || S.phase === 'lock')) { fill = (S.t >> 3) & 1 || S.phase === 'confirm' ? '#f0a020' : '#c07810'; ink = '#000'; }
      if (S.phase === 'right' && a === Q.right) { fill = '#30a040'; ink = '#fff'; }
      if (S.phase === 'end' && !S.million && S.chosen >= 0) {
        if (a === Q.right) { fill = '#30a040'; ink = '#fff'; } else if (a === S.chosen) { fill = '#c02828'; ink = '#fff'; }
      }
      lozenge(ctx, x, y, 184, 22, fill, edge);
      if (S.hidden.indexOf(a) >= 0 || (S.phase === 'ask' && S.qt < 40 + a * 9)) continue; // the answers come up one by one
      F.draw(ctx, LETTERS[a] + ':', x + 12, y + 8, ink === '#000' ? '#000' : '#f0c040');
      var text = Q.answers[a];
      if (F.width(text) > 150) text = wrap(text, 25)[0] + '...';
      F.draw(ctx, text, x + 26, y + 8, ink);
    }
  }

  function draw(ctx) {
    drawStudio(ctx);
    drawLogo(ctx);
    drawButtons(ctx);
    drawLadder(ctx);
    drawStage(ctx);
    drawQuestion(ctx);
    // choices that need more than ✕ are spelled out under the bubble
    var hint = S.phase === 'confirm' ? X + ' JA   ' + SQ + ' NEI' : S.phase === 'end' ? X + ' UT AV STUDIOET' : S.phase === 'ask' && S.row < 0 && S.qt >= SHOWN ? 'PILENE VELGER SVAR' : '';
    if (hint && S.t > 30) F.outline(ctx, hint, 66, 120, '#ffffff', 1, '#000');
    if (S.million && S.phase === 'end') {
      for (var i = 0; i < 40; i++) {
        ctx.fillStyle = ['#f0c040', '#ffffff', '#f0a020'][i % 3];
        ctx.fillRect((i * 53 + S.t * (1 + i % 3)) % VW, (i * 37 + S.t * 2) % VH, 2, 2);
      }
    }
  }

  SM.quiz = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
