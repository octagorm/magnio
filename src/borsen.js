// Trondheim Børs, started by talking to the stockbroker outside the
// exchange. Speculation as a horse race: six odd companies run against each
// other, Magnio picks one and bets the coins he has collected, and if it wins
// he gets his bet times the odds. A commentator calls the race, as at the
// trotting track. Now and then a chance card turns up, as in Monopoly.
// It looks like a racecourse: a stand full of people at the back, and the
// companies' mascots riding galloping horses in their colours.
//
// It is kind on purpose: the company he backs wins more often than not,
// the cards only ever give, and if he runs out the bank lends him some
// more. He can keep going for as long as he likes, and □ leaves.
//
// With two players, Frodigi bets too, on a company of his own choosing and
// from his own purse, and the race starts once both have pressed ✕. One of
// the two companies they back wins more often than not.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216;
  // The track, seen a little from the side: lane 0 is the far one. The start
  // and the finish move a bit to the right for each nearer lane, which makes
  // it look angled.
  var TRACK_TOP = 62, FEET0 = 80, LANE_GAP = 16, TRACK_BOTTOM = 168, PANEL_Y = 172;
  function feet(i) { return FEET0 + i * LANE_GAP; }
  function startX(i) { return 30 + i * 3; }
  function finishX(i) { return 330 + i * 4; }
  var WIN_CHANCE = 0.6; // how often the company he backs wins
  var X = '✕', SQ = '□';

  // The runners. look picks how each one is drawn and moves.
  // The runners: each company's mascot rides a horse, in the company's colours.
  var COMPANIES = [
    { name: 'REGNINGEN ASA', look: 'bill', coat: 'bay', silk: '#d83030', line: 'REGNINGEN KOMMER ALLTID, FOLKENS.' },
    { name: 'KRABBE KAPITAL', look: 'krabbe', coat: 'grey', silk: '#f08020', line: 'KRABBE KAPITAL GÅR SIDELENGS. TYPISK MARKEDET.' },
    { name: 'SILDETØNNA A/S', look: 'fisk', coat: 'chestnut', silk: '#3a6ad8', line: 'SILDA STÅR TETT I DAG!' },
    { name: 'MÅKE HOLDING', look: 'make', coat: 'black', silk: '#f4f4f4', line: 'MÅKE HOLDING STJELER ALT SOM GLINSER!' },
    { name: 'ULL & CO', look: 'sau', coat: 'palomino', silk: '#3aa040', line: 'ULL & CO HOLDER SEG I FLOKKEN.' },
    { name: 'BOBLE & KRAKK', look: 'boble', coat: 'white', silk: '#a040c0', line: 'BOBLE & KRAKK VOKSER OG VOKSER. DETTE KAN IKKE GÅ GALT.' }
  ];
  var COATS = {
    bay: ['#8a5228', '#5a3218', '#1e1410'], chestnut: ['#b8642c', '#84441c', '#6a3418'], black: ['#2e2a2c', '#1a1618', '#0e0c0c'],
    grey: ['#a0a0a8', '#74747c', '#4a4a50'], palomino: ['#e0b860', '#b08a3a', '#f4ecd0'], white: ['#ece8e0', '#bab4aa', '#d0c8b8']
  };
  var ODDS = [2, 2, 3, 4, 6, 10];
  var CALLS = [
    'DETTE ER BEDRE ENN TRAVET PÅ LEANGEN!', 'BJØRNEN SOVER, OKSEN STANGER!', 'REVISOREN NIKKER FORNØYD.',
    'HER ER DET SPEKULASJON PÅ HØYT NIVÅ!', 'KURSENE SVINGER SOM BARE DET!', 'OSLO BØRS KAN BARE DRØMME OM DETTE.'
  ];
  // Chance cards, Monopoly style. They only ever give.
  var CARDS = [
    ['BANKFEIL I DIN FAVØR.', 'MOTTA 200 KR.', 200],
    ['DU PASSERER START.', 'MOTTA 200 KR.', 200],
    ['DU HAR VUNNET ANDREPREMIE', 'I EN SKJØNNHETSKONKURRANSE. MOTTA 100 KR.', 100],
    ['UTBYTTE FRA SILDETØNNA A/S.', 'MOTTA 50 KR.', 50],
    ['GÅ I FENGSEL! NEI FORRESTEN, REVISOREN', 'FANT EN FEIL I DIN FAVØR. MOTTA 150 KR.', 150],
    ['SKATTEETATEN HAR REGNET FEIL.', 'DU FÅR IGJEN 120 KR.', 120]
  ];
  var LOAN = 50;

  var S = null, env = null;

  var NAMES = ['MAGNIO', 'FRODIGI'], INK = ['#ffe060', '#b0ffb0'];

  function start(e) {
    env = e;
    S = { phase: 'intro', t: 0, round: 0, bets: [{ pick: 0, bet: 10 }], odds: [], runners: [], say: '', sayT: 0, result: null, card: null };
    if (env.two) S.bets.push({ pick: 1, bet: 10 });
    newOdds();
    AU.startMusic('bors');
    AU.sfx('bell');
  }

  function go(phase) { S.phase = phase; S.t = 0; }
  // i is the player: 0 Magnio, 1 Frodigi
  function money(i) { return i ? env.coins2() : env.coins(); }
  function setMoney(i, n) { n = Math.max(0, Math.round(n)); if (i) env.setCoins2(n); else env.setCoins(n); }
  function say(text, frames) { S.say = text; S.sayT = frames || 150; }
  function pressed(b) { return env.pressed(b); }
  function by(i, b) { return env.two ? env.by(i, b) : env.pressed(b); }

  function newOdds() {
    var o = ODDS.slice();
    for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; }
    S.odds = o;
  }

  function step() {
    S.t++;
    if (S.sayT > 0) S.sayT--;
    if (S.dust) {
      for (var i = 0; i < S.dust.length; i++) { S.dust[i].life--; S.dust[i].x -= 0.6; S.dust[i].y -= 0.1; }
      S.dust = S.dust.filter(function (q) { return q.life > 0; });
    }
    stepCrowd();
    var P = S.phase;
    if (P === 'intro') {
      // the welcome stays up until the first bet, so there is time to read it
      // (with two, the bottom line is needed for the buttons, so it goes after a while)
      if (S.t === 1) say('VELKOMMEN TIL TRONDHEIM BØRS! HER LØPER AKSJENE OM KAPP.', env.two ? 300 : Infinity);
      if (S.t > 40) go('pick');
    } else if (P === 'pick') stepPick();
    else if (P === 'race') stepRace();
    else if (P === 'result') {
      if (S.t > 60 && (pressed('jumpP') || pressed('fireP'))) {
        S.round++;
        newOdds();
        S.say = ''; S.sayT = 0;
        AU.startMusic('bors');
        if (S.round % 3 === 0) { S.card = CARDS[Math.floor(Math.random() * CARDS.length)]; go('card'); AU.sfx('power'); }
        else go('pick');
      }
    } else if (P === 'card') {
      if (S.t === 40) { for (var c = 0; c < S.bets.length; c++) setMoney(c, money(c) + S.card[2]); AU.sfx('coin'); }
      if (S.t > 60 && pressed('jumpP')) go('pick');
    }
  }

  // Each player picks and bets with their own controller, and ✕ says they
  // are ready. Changing their mind afterwards takes the ready back.
  function stepPick() {
    var i, b, all = true;
    for (i = 0; i < S.bets.length; i++) {
      b = S.bets[i];
      if (S.t === 1) {
        if (money(i) < 10) {
          setMoney(i, money(i) + LOAN);
          say(env.two ? 'BANKEN LÅNER ' + NAMES[i] + ' ' + LOAN + ' KR. RENTEFRITT, SELVFØLGELIG!' : 'BANKEN GIR DEG ET LÅN PÅ ' + LOAN + ' KR. RENTEFRITT, SELVFØLGELIG!', env.two ? 240 : Infinity);
          AU.sfx('coin');
        }
      }
      if (by(i, 'upP')) b.pick = (b.pick + COMPANIES.length - 1) % COMPANIES.length;
      if (by(i, 'downP')) b.pick = (b.pick + 1) % COMPANIES.length;
      var step = money(i) >= 200 ? 50 : 10;
      if (by(i, 'rightP')) b.bet += step;
      if (by(i, 'leftP')) b.bet -= step;
      b.bet = Math.max(10, Math.min(money(i), b.bet));
      if (by(i, 'upP') || by(i, 'downP') || by(i, 'leftP') || by(i, 'rightP')) { b.ready = false; AU.sfx('talk'); }
      if (S.t > 10 && by(i, 'jumpP') && !b.ready) { b.ready = true; if (env.two) AU.sfx('join'); }
      if (!b.ready) all = false;
    }
    if (S.t > 10 && pressed('fireP')) { env.done(); return; }
    if (all) startRace();
  }

  // Who wins is decided up front, and each runner's path is shaped so it
  // finishes in the right order: some start fast and fade, some come from
  // behind, and they all wobble a little on the way.
  function startRace() {
    var picks = S.bets.map(function (b) { return b.pick; });
    var winner = Math.random() < WIN_CHANCE ? picks[Math.floor(Math.random() * picks.length)] : pickOther(picks);
    var T = 420 + Math.floor(Math.random() * 80), runnerUp = pickOther([winner]);
    S.runners = COMPANIES.map(function (c, i) {
      // one runner-up close behind for a tight finish, the rest spread out
      var close = i === runnerUp ? 4 + Math.random() * 16 : 25 + Math.random() * 140;
      return { i: i, time: i === winner ? T : T + close, shape: (Math.random() * 2 - 1) * 0.24,
        phase: Math.random() * 6, f: 0, popAt: c.look === 'boble' && i !== winner ? 0.45 + Math.random() * 0.3 : 0 };
    });
    S.winner = winner;
    for (var i = 0; i < S.bets.length; i++) { S.bets[i].stake = S.bets[i].bet; S.bets[i].ready = false; setMoney(i, money(i) - S.bets[i].bet); }
    S.leader = -1; S.leadT = 0; S.callT = 0;
    go('race');
    AU.sfx('bell');
    AU.startMusic('bil');
    say('OG DE ER I GANG!', 120);
  }

  // Any company but these.
  function pickOther(not) {
    var rest = [];
    for (var i = 0; i < COMPANIES.length; i++) if (not.indexOf(i) < 0) rest.push(i);
    return rest[Math.floor(Math.random() * rest.length)];
  }

  function stepRace() {
    var lead = 0, best = -1;
    for (var k = 0; k < S.runners.length; k++) {
      var r = S.runners[k], u = Math.min(1, S.t / r.time);
      var f = u + Math.sin(Math.PI * u) * r.shape + Math.sin(u * 22 + r.phase) * Math.sin(Math.PI * u) * 0.015;
      if (r.popAt && u > r.popAt) {
        if (!r.popped) {
          r.popped = true; r.popF = r.f;
          AU.sfx('brk');
          say('BOBLE & KRAKK SPRAKK! KRAKK PÅ BØRSEN!', 160);
        }
        f = r.popF + (u - r.popAt) * 0.25; // the horse carries on at a trot, without its rider
      }
      r.f = Math.max(0, Math.min(1, f));
      if (r.f > best) { best = r.f; lead = k; }
      if (S.t % 5 === k % 5 && r.f < 1) dust(k, r);
    }
    S.leadT++; S.callT++;
    if (lead !== S.leader && S.leadT > 90 && S.t > 60) {
      S.leader = lead; S.leadT = 0;
      say(COMPANIES[lead].name + ' TAR LEDELSEN!', 150);
    } else if (S.callT > 180 && S.sayT === 0) {
      S.callT = 0;
      say(Math.random() < 0.5 ? COMPANIES[Math.floor(Math.random() * COMPANIES.length)].line : CALLS[Math.floor(Math.random() * CALLS.length)], 160);
    }
    if (S.t >= S.runners[S.winner].time) finishRace();
  }

  function finishRace() {
    var w = S.winner, second = Infinity, any = false, texts = [];
    for (var k = 0; k < S.runners.length; k++) if (k !== w) second = Math.min(second, S.runners[k].time);
    var margin = second - S.runners[w].time;
    AU.stopMusic();
    for (var i = 0; i < S.bets.length; i++) {
      var b = S.bets[i], won = w === b.pick, prize = b.stake * S.odds[b.pick];
      if (won) { setMoney(i, money(i) + prize); any = true; }
      texts.push(NAMES[i] + (won ? ' VANT ' + prize + ' KR!' : ' TAPTE ' + b.stake + ' KR.'));
    }
    if (env.two) S.result = { won: any, text: texts.join(' '), sub: '' };
    else if (any) S.result = { won: true, text: 'DU VANT ' + S.bets[0].stake * S.odds[w] + ' KR!', sub: 'GRATULERER! DU SLO MARKEDET.' };
    else S.result = { won: false, text: 'DU TAPTE ' + S.bets[0].stake + ' KR.', sub: 'MARKEDET ER UFORUTSIGBART. PRØV IGJEN!' };
    AU.sfx(any ? 'clear' : 'down');
    say(COMPANIES[w].name + (margin < 20 ? ' VINNER MED EN NESELENGDE!' : ' VINNER SUVERENT!'), Infinity);
    go('result');
  }

  // ---------------------------------------------------------------- the crowd
  // Three rows of people in the stand. They bob along, more during the race,
  // and throw their arms up at the finish. Two of them hold up signs.
  var crowd = null;
  var SHIRTS = ['#d83030', '#3a6ad8', '#f0c030', '#3aa040', '#f4f4f4', '#a040c0', '#f08020', '#2a3450', '#e870b0'];
  var SKIN = ['#f8c088', '#e8a878', '#c88858'], HAIR = ['#3a2a1a', '#f0d070', '#6a4a2a', '#a0a0a0', '#1a1410', '#b05a20'];
  function makeCrowd() {
    var c = [], k = 0;
    for (var row = 0; row < 3; row++) {
      for (var x = -3 + row * 3; x < VW; x += 7 + (k % 3), k++) {
        c.push({ x: x, y: 22 + row * 11, shirt: SHIRTS[(k * 7 + row) % SHIRTS.length], skin: SKIN[k % 3], hair: HAIR[(k * 5) % HAIR.length],
          phase: k * 1.3, sign: row === 1 && (k % 17 === 5) ? (k % 2 ? 'KJØP!' : 'SELG!') : null });
      }
    }
    return c;
  }
  function stepCrowd() { if (!crowd) crowd = makeCrowd(); }

  function drawStand(ctx) {
    ctx.fillStyle = '#2a2236';
    ctx.fillRect(0, 10, VW, 12);
    for (var x = 0; x < VW; x += 12) { ctx.fillStyle = '#3a3048'; ctx.fillRect(x, 20, 10, 2); } // the roof's edge
    var title = 'TRONDHEIM BØRS';
    F.draw(ctx, title, Math.round((VW - F.width(title)) / 2), 12, '#f0d040');
    ctx.fillStyle = '#4a3a5a';
    ctx.fillRect(0, 22, VW, TRACK_TOP - 22);
    for (var row = 0; row < 3; row++) { ctx.fillStyle = '#3a2c4a'; ctx.fillRect(0, 31 + row * 11, VW, 2); } // benches
    var cheer = S.phase === 'result' && S.t < 200, amp = S.phase === 'race' ? 2 : cheer ? 3 : 1;
    for (var i = 0; i < crowd.length; i++) {
      var p = crowd[i], bob = Math.round(Math.max(0, Math.sin(S.t / 6 + p.phase)) * amp), y = p.y - bob;
      ctx.fillStyle = p.shirt; ctx.fillRect(p.x, y + 4, 6, 6);
      ctx.fillStyle = p.skin; ctx.fillRect(p.x + 1, y, 4, 4);
      ctx.fillStyle = p.hair; ctx.fillRect(p.x + 1, y, 4, 1);
      if (cheer && (i % 3 !== 0)) { ctx.fillStyle = p.skin; ctx.fillRect(p.x - 1, y - 2, 1, 5); ctx.fillRect(p.x + 6, y - 2, 1, 5); }
      if (p.sign) {
        var w = F.width(p.sign) + 4, sy = y - 12;
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(p.x + 3, sy + 9, 1, 4);
        ctx.fillStyle = '#f4f4f4'; ctx.fillRect(p.x + 3 - w / 2, sy, w, 10);
        F.draw(ctx, p.sign, p.x + 5 - w / 2, sy + 2, '#c82020');
      }
    }
  }

  // ---------------------------------------------------------------- horses
  // A galloping horse facing right, four frames, drawn once per coat.
  var horses = {};
  function horse(coatName, frame) {
    var key = coatName + frame;
    if (horses[key]) return horses[key];
    var c = document.createElement('canvas'), g = c.getContext('2d'), col = COATS[coatName];
    c.width = 32; c.height = 22;
    function r(x, y, w, h, colour) { g.fillStyle = colour; g.fillRect(x, y, w, h); }
    // legs: [front near, front far, back near, back far] foot offsets from the hip, per frame
    var LEGS = [[5, 2, -5, -2], [1, -1, 2, -1], [-2, 3, -1, -4], [3, 0, -3, 0]][frame];
    var hips = [[21, 12], [20, 12], [9, 12], [8, 12]];
    function leg(k, colour) {
      var hx = hips[k][0], hy = hips[k][1], dx = LEGS[k];
      for (var s = 0; s <= 8; s++) r(hx + Math.round(dx * s / 8), hy + s, 2, 1, s === 8 ? '#2a2018' : colour);
    }
    leg(1, col[1]); leg(3, col[1]);
    SM.art.disc(g, 15, 9, 9, 4, col[0]);
    r(7, 11, 16, 1, col[1]);                                       // belly shadow
    for (var k = 0; k < 6; k++) r(20 + Math.round(k * 0.8), 7 - k, 4, 2, col[0]); // neck
    r(24, 1, 5, 3, col[0]); r(27, 3, 3, 2, col[0]);               // head and muzzle
    r(25, 1, 1, 1, '#141414'); r(29, 4, 1, 1, '#141414');         // eye, nostril
    r(24, 0, 1, 1, col[1]);                                        // ear
    for (k = 0; k < 6; k++) r(19 + Math.round(k * 0.8), 6 - k, 2, 1, col[2]); // mane
    var sway = frame % 2;
    r(5, 7, 2, 1, col[2]); r(3, 8 + sway, 3, 1, col[2]); r(2, 9 + sway, 2, 3, col[2]); // tail
    leg(0, col[0]); leg(2, col[0]);
    horses[key] = c;
    return c;
  }

  function dust(k, r) {
    S.dust = S.dust || [];
    S.dust.push({ x: laneX(k, r.f) + 4, y: feet(k) - 1, life: 18 });
  }

  function laneX(i, f) { return startX(i) + (finishX(i) - startX(i)) * f; }

  // The rider: the company's mascot, sitting on the saddle.
  function drawRider(ctx, c, x, y, t, popped) {
    var flap = Math.floor(t / 8) % 2 ? 'walk2' : 'walk1';
    if (c.look === 'bill') ctx.drawImage(A.enemy.bill.walk1.r, x - 8, y - 14);
    else if (c.look === 'krabbe') ctx.drawImage(A.enemy.krabbe.walk1.r, x - 8, y - 14);
    else if (c.look === 'fisk') ctx.drawImage(A.enemy.fisk.walk1.l, x - 8, y - 13);
    else if (c.look === 'make') ctx.drawImage(A.enemy.make[S.phase === 'race' ? flap : 'walk1'].l, x - 8, y - 15);
    else if (c.look === 'sau') {
      var sh = A.decor.sau; // drawn facing left, so flip it to face the way it rides
      ctx.save(); ctx.translate(x + 9, y - 10); ctx.scale(-1, 1); ctx.drawImage(sh, 0, 0); ctx.restore();
    } else if (c.look === 'boble' && !popped) {
      var rad = S.phase === 'race' ? 4 + Math.round(S.runners[5].f * 4) : 4;
      A.disc(ctx, x, y - rad, rad, rad, '#8ac4ec');
      A.disc(ctx, x, y - rad, rad - 1, rad - 1, '#c8e8f8');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - Math.ceil(rad / 2), y - rad - Math.ceil(rad / 2), 2, 2);
    } else if (c.look === 'boble') {
      ctx.fillStyle = '#c8f0f8'; // what is left of the bubble
      ctx.fillRect(x - 3, y - 4, 2, 2); ctx.fillRect(x + 2, y - 6, 2, 2); ctx.fillRect(x, y - 2, 1, 1);
    }
  }

  function drawRunner(ctx, i, x, fy) {
    var c = COMPANIES[i], r = S.runners[i], running = S.phase === 'race' && r && r.f < 1;
    var speed = r && r.popped ? 10 : 5, frame = running ? Math.floor((S.t + i * 3) / speed) % 4 : 1;
    var bob = running && frame % 2 === 0 ? 1 : 0;
    A.disc(ctx, Math.round(x) + 15, fy, 10, 1, 'rgba(0,0,0,0.28)'); // shadow
    var h = horse(c.coat, frame), hx = Math.round(x), hy = fy - h.height + 1 - bob;
    ctx.drawImage(h, hx, hy);
    ctx.fillStyle = c.silk; ctx.fillRect(hx + 11, hy + 5, 8, 4);  // saddle cloth in the company's colour
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(hx + 11, hy + 8, 8, 1);
    drawRider(ctx, c, hx + 15, hy + 6 - (running ? bob : 0), S.t + i * 13, r && r.popped);
  }

  function drawTrack(ctx) {
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, TRACK_TOP - 4, VW, 2);                          // the far rail
    for (var x = 4; x < VW; x += 16) ctx.fillRect(x, TRACK_TOP - 4, 2, 4);
    for (var i = 0; i < COMPANIES.length; i++) {
      var top = i ? feet(i - 1) + 2 : TRACK_TOP, bottom = feet(i) + 2;
      ctx.fillStyle = i % 2 ? '#a87c50' : '#b08458';
      ctx.fillRect(0, top, VW, bottom - top);
    }
    ctx.fillStyle = '#b08458';
    ctx.fillRect(0, feet(COMPANIES.length - 1) + 2, VW, TRACK_BOTTOM - feet(COMPANIES.length - 1) - 2);
    // the finish line, chequered and slanted with the track, and the post above it
    for (i = 0; i < COMPANIES.length; i++) {
      var fx = finishX(i) + 30, top2 = i ? feet(i - 1) + 2 : TRACK_TOP;
      for (var y = top2; y < feet(i) + 2; y += 2) {
        ctx.fillStyle = ((y >> 1) + (i & 1)) % 2 ? '#141414' : '#f4f4f4';
        ctx.fillRect(fx, y, 2, 2);
        ctx.fillStyle = ((y >> 1) + (i & 1)) % 2 ? '#f4f4f4' : '#141414';
        ctx.fillRect(fx + 2, y, 2, 2);
      }
    }
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(finishX(0) + 31, TRACK_TOP - 18, 2, 14);
    A.disc(ctx, finishX(0) + 32, TRACK_TOP - 20, 6, 4, '#d83030');
    F.draw(ctx, 'MÅL', finishX(0) + 24, TRACK_TOP - 23, '#ffffff');
    // the starting gate, while they wait in it
    if (S.phase !== 'race' && S.phase !== 'result') {
      for (i = 0; i < COMPANIES.length; i++) {
        ctx.fillStyle = '#7a7a84';
        ctx.fillRect(startX(i) - 3, feet(i) - 15, 2, 15);
        ctx.fillRect(startX(i) + 34, feet(i) - 15, 2, 15);
        ctx.fillRect(startX(i) - 3, feet(i) - 15, 39, 2);
      }
    }
    // the horses, far lane first so the near ones stand in front
    for (i = 0; i < COMPANIES.length; i++) {
      var r = S.runners[i], f = r && (S.phase === 'race' || S.phase === 'result') ? r.f : 0;
      drawRunner(ctx, i, laneX(i, f), feet(i));
      if (S.phase === 'pick' || S.phase === 'intro' || S.phase === 'card') drawLabel(ctx, i);
      else {
        for (var k = 0; k < S.bets.length; k++) {
          if (S.bets[k].pick !== i) continue;
          var mx = Math.round(laneX(i, f)) + 14 + k * 5;
          ctx.fillStyle = INK[k];
          ctx.fillRect(mx, feet(i) - 34 - ((S.t >> 3) & 1), 3, 3); // a marker over each pick
        }
      }
    }
    if (S.dust) {
      for (i = 0; i < S.dust.length; i++) {
        var d = S.dust[i];
        ctx.globalAlpha = Math.max(0, d.life / 18);
        ctx.fillStyle = '#d8c0a0';
        ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, TRACK_BOTTOM, VW, 2);                           // the near rail
    for (x = 10; x < VW; x += 16) ctx.fillRect(x, TRACK_BOTTOM, 2, 4);
  }

  // Name and odds beside each horse while bets are being placed.
  // Magnio's pick is yellow, and Frodigi's green.
  function drawLabel(ctx, i) {
    var c = COMPANIES[i], text = c.name + '  ODDS ' + S.odds[i], mine = -1, k;
    for (k = S.bets.length - 1; k >= 0; k--) if (S.bets[k].pick === i) mine = k;
    var x = startX(i) + 44, y = feet(i) - 11, w = F.width(text) + 6;
    ctx.fillStyle = mine >= 0 ? 'rgba(42,52,96,0.92)' : 'rgba(20,24,40,0.75)';
    ctx.fillRect(x - 3, y - 2, w, 11);
    ctx.fillStyle = c.silk; ctx.fillRect(x - 3, y - 2, 2, 11);
    F.draw(ctx, text, x + 1, y, mine >= 0 ? INK[mine] : '#e8f0e0');
    for (k = 0, x += w; k < S.bets.length; k++) {
      if (S.bets[k].pick !== i) continue;
      if (S.bets[k].ready || (S.t >> 4) & 1) F.draw(ctx, S.bets[k].ready ? '*' : '<', x, y, INK[k]);
      x += 8;
    }
  }

  function drawTicker(ctx) {
    ctx.fillStyle = '#10141c';
    ctx.fillRect(0, 0, VW, 10);
    var tick = '';
    for (var i = 0; i < COMPANIES.length; i++) {
      var ch = Math.sin(S.round * 3.1 + i * 1.7 + Math.floor(S.t / 120)) * 4.5;
      tick += COMPANIES[i].name + (ch >= 0 ? ' +' : ' ') + ch.toFixed(1).replace('.', ',') + '%   ';
    }
    var w = F.width(tick), off = (S.t * 0.6 + S.round * 97) % w;
    for (var k = -1; k < 2; k++) F.draw(ctx, tick, Math.round(k * w - off), 2, '#ff9a30');
  }

  function drawPanel(ctx) {
    var y = PANEL_Y;
    ctx.fillStyle = '#0c1a3a';
    ctx.fillRect(0, y, VW, VH - y);
    if (env.two) { drawPanel2(ctx, y); return; }
    var kr = 'KR ' + money(0), b = S.bets[0];
    if (S.phase === 'pick') {
      var c = COMPANIES[b.pick];
      F.draw(ctx, 'SATS ' + b.bet + ' KR PÅ ' + c.name + ' (ODDS ' + S.odds[b.pick] + ')', 8, y + 4, '#ffe060');
      F.draw(ctx, kr, VW - 8 - F.width(kr), y + 4, '#ffffff');
      F.draw(ctx, 'OPP/NED: SELSKAP  < >: BELØP  ' + X + ' SATS  ' + SQ + ' GÅ UT', 8, y + 15, '#c0d0e8');
      if (S.sayT > 0) F.draw(ctx, S.say, 8, y + 26, '#ffffff');
    } else {
      F.draw(ctx, 'KOMMENTATOREN:', 8, y + 4, '#90d8ff');
      F.draw(ctx, kr, VW - 8 - F.width(kr), y + 4, '#ffffff');
      F.draw(ctx, S.say, 8, y + 15, '#ffffff');
      if (S.phase === 'race') F.draw(ctx, 'DU HAR SATSET ' + b.stake + ' KR PÅ ' + COMPANIES[b.pick].name + '.', 8, y + 26, '#c0d0e8');
    }
    drawResult(ctx, y);
  }

  function drawResult(ctx, y) {
    if (S.phase !== 'result') return;
    F.draw(ctx, S.result.text + ' ' + S.result.sub, 8, y + 26, S.result.won ? '#80ff90' : '#ffb0a0');
    if (S.t > 60 && (S.t >> 5) & 1) F.draw(ctx, X, VW - 14, y + 26, '#ffffff');
  }

  // With two players: a line each while betting, and both purses.
  function drawPanel2(ctx, y) {
    var i, b, right;
    if (S.phase === 'pick') {
      for (i = 0; i < S.bets.length; i++) {
        b = S.bets[i];
        F.draw(ctx, NAMES[i] + ': ' + b.bet + ' KR PÅ ' + COMPANIES[b.pick].name + ' (ODDS ' + S.odds[b.pick] + ')', 8, y + 4 + i * 11, INK[i]);
        right = (b.ready ? 'KLAR!  ' : '') + 'KR ' + money(i);
        F.draw(ctx, right, VW - 8 - F.width(right), y + 4 + i * 11, '#ffffff');
      }
      if (S.sayT > 0) F.draw(ctx, S.say, 8, y + 26, '#ffffff');
      else F.draw(ctx, 'OPP/NED: SELSKAP  < >: BELØP  ' + X + ' KLAR  ' + SQ + ' GÅ UT', 8, y + 26, '#c0d0e8');
      return;
    }
    F.draw(ctx, 'KOMMENTATOREN:', 8, y + 4, '#90d8ff');
    right = 'MAGNIO KR ' + money(0) + '  FRODIGI KR ' + money(1);
    F.draw(ctx, right, VW - 8 - F.width(right), y + 4, '#ffffff');
    F.draw(ctx, S.say, 8, y + 15, '#ffffff');
    if (S.phase === 'race') {
      F.draw(ctx, 'MAGNIO: ' + COMPANIES[S.bets[0].pick].name, 8, y + 26, INK[0]);
      F.draw(ctx, 'FRODIGI: ' + COMPANIES[S.bets[1].pick].name, 8 + F.width('MAGNIO: ' + COMPANIES[S.bets[0].pick].name + '   '), y + 26, INK[1]);
    }
    drawResult(ctx, y);
  }

  function drawCard(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, VW, VH);
    var w = 260, h = 92, x = (VW - w) / 2, y = 54;
    ctx.fillStyle = '#7a3a10'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#f8a838'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fbd08a'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    centered(ctx, 'SJANSE', y + 10, '#7a3a10', 2);
    centered(ctx, S.card[0], y + 38, '#3a1a08');
    centered(ctx, S.card[1], y + 52, '#3a1a08');
    if (S.t > 60 && (S.t >> 5) & 1) F.draw(ctx, X, x + w - 14, y + h - 12, '#7a3a10');
  }

  function centered(ctx, text, y, color, scale) {
    F.draw(ctx, text, Math.round((VW - F.width(text, scale || 1)) / 2), y, color, scale || 1);
  }

  function draw(ctx) {
    if (!crowd) crowd = makeCrowd();
    drawTicker(ctx);
    drawStand(ctx);
    drawTrack(ctx);
    drawPanel(ctx);
    if (S.phase === 'card') drawCard(ctx);
  }

  SM.stock = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
