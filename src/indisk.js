// The Indian restaurant in Moraira. Magnio picks a dish off the table with
// ← and → and eats it with ✕. Every time he eats, the waiter brings more, and
// a little more each time, and we see Magnio fill up with curry from the
// shoes upwards, one coloured layer per dish. When it reaches his shoulders
// he says stop, and he and Tove walk home along the seafront. □ stops early.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216, X = '✕';
  var SC = 3, ME_X = 22, FEET = 200;           // Magnio, three times his size
  var SHOULDER = 13;                            // the sprite row the curry stops at
  var CAP = 100;                                // how much he holds, feet to shoulders
  var TABLE_Y = 150, SLOTS = 5, STACK = 3, DISH = 2, LIFT = 14;   // dishes are drawn twice their size; LIFT is how high a stack grows
  var TOVE_X = 312, DOOR_X = 186, WAITER_FEET = 168;

  function slotX(i) { return 116 + i * 40; }

  // amt is how much of him a dish fills, before the portions grow.
  var DISHES = [
    { name: 'BUTTER CHICKEN', kind: 'bowl', col: '#e8862e', hi: '#f8b060', amt: 7 },
    { name: 'TIKKA MASALA', kind: 'bowl', col: '#d04a24', hi: '#f07a4a', bits: '#f4e0c0', amt: 7 },
    { name: 'DAL', kind: 'bowl', col: '#e8b830', hi: '#f8d870', amt: 6 },
    { name: 'PALAK PANEER', kind: 'bowl', col: '#3a8a2a', hi: '#5aaa3a', bits: '#f4f0e0', amt: 6 },
    { name: 'KORMA', kind: 'bowl', col: '#ecd49a', hi: '#f8ecc8', bits: '#c89a5a', amt: 7 },
    { name: 'VINDALOO', kind: 'bowl', col: '#9a1e14', hi: '#c83a24', hot: true, amt: 7 },
    { name: 'BIRYANI', kind: 'rice', col: '#f0c860', hi: '#f8e8a8', bits: '#d86a2a', amt: 8 },
    { name: 'NAAN', kind: 'naan', col: '#e8c890', hi: '#f8e4b8', bits: '#a8743a', amt: 5 },
    { name: 'SAMOSA', kind: 'samosa', col: '#d8a04a', hi: '#f0c870', amt: 5 },
    { name: 'ONION BHAJI', kind: 'balls', col: '#b0702a', hi: '#d8984a', amt: 5 },
    { name: 'MANGO LASSI', kind: 'glass', col: '#f8b030', hi: '#ffd870', drink: true, amt: 4 },
    { name: 'GULAB JAMUN', kind: 'balls', col: '#7a3a1a', hi: '#a85a2a', sweet: true, amt: 4 },
    { name: 'PAPADUM', kind: 'papad', col: '#f0dca0', hi: '#fff0c8', bits: '#c8a060', amt: 3 },
    { name: 'RAITA', kind: 'bowl', col: '#f0f4ec', hi: '#ffffff', bits: '#6aa84a', amt: 4 }
  ];

  // What gets said as he fills up: at is how full he is, from 0 to 1.
  var REMARKS = [
    { at: 0.04, who: 'tove', text: 'DEN E GOD, DENNE!' },
    { at: 0.12, who: 'tove', text: 'NÅ E DU FULL TE ANKLENE, MAGNE.' },
    { at: 0.3, who: 'me', text: 'I KJENNER DET I KNÆRNE.' },
    { at: 0.46, who: 'tove', text: 'SKA DU VIRKELIG SPISE MER?' },
    { at: 0.56, who: 'me', text: 'DET KOMMER JO BARE MER!' },
    { at: 0.68, who: 'tove', text: 'NÅ E DU FULL TE MAGEN!' },
    { at: 0.86, who: 'me', text: 'I... KJENNER DET I BRYSTET.' },
    { at: 0.94, who: 'tove', text: 'MAGNE! DET E SNART OPP TE SKULDRENE!' }
  ];
  var WAITER_LINES = ['VÆR SÅ GOD!', 'MER? MÁS? MORE?', 'KOKKEN INSISTERER!', 'EKSTRA STOR PORSJON!',
    'DENNE ER PÅ HUSET!', 'DET KOMMER MER!', 'BARE SMAK!', 'KOKKEN ER SÅ GLAD I DEG!'];
  var YUM = ['NAM!', 'MMM!', 'GODT!', 'NAM NAM!'];

  var S = null, env = null;

  // ---------------------------------------------------------------- the waiter
  function fromRows(rows, pal) {
    var c = document.createElement('canvas'), g = c.getContext('2d');
    c.width = rows[0].length; c.height = rows.length;
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === '.') continue;
      g.fillStyle = pal[rows[y][x]]; g.fillRect(x, y, 1, 1);
    }
    return c;
  }
  var waiterArt = null;
  function waiter() {
    if (!waiterArt) waiterArt = fromRows([
      '................', '................', '................', '.....HHHHHH.....', '....HHHHHHHH....',
      '....HHSSSSSH....', '....HSSSSKSS....', '....SSSSSSSSS...', '....HSSSSSPP....', '.....HHHHHH.....',
      '......SSSS......',
      '.....WVVVVW.....', '....WVVVVVVW....', '...WWVVWWVVWW...', '...WWVVWWVVWW...', '...WWVVVVVVWW...',
      '...WW.VVVV.WW...', '...WW.VVVV.WW...', '...SS.VVVV.SS...', '......VVVV......', '.....LLLLLL.....',
      '.....LLLLLL.....', '.....LL..LL.....', '.....LL..LL.....', '.....LL..LL.....', '.....LL..LL.....',
      '....NNN..NNN....', '....NNN..NNN....'
    ], { H: '#1a1410', S: '#c08050', P: '#a86a40', K: '#141414', W: '#f4f4f0', V: '#a01e2a', L: '#1a1a22', N: '#101010' });
    return waiterArt;
  }

  // ---------------------------------------------------------------- start and step
  function start(e) {
    env = e;
    S = { phase: 'intro', t: 0, slots: [], sel: 0, level: 0, target: 0, layers: [], eaten: 0, owed: 0, bag: [],
      fly: null, chew: 0, hot: 0, said: 0, say: null, queue: [], pops: [], yums: [], steam: [], bubbles: [],
      waiter: { x: DOOR_X, state: 'out', carry: [], t: 0, line: 0 }, why: 'full' };
    for (var i = 0; i < SLOTS; i++) S.slots.push([]);
    S.owed = 4;
    AU.startMusic('indisk');
  }

  function go(phase) { S.phase = phase; S.t = 0; }

  // Dishes come round in a shuffled order, so the table is always a mix.
  function nextDish() {
    if (!S.bag.length) {
      S.bag = DISHES.slice();
      for (var i = S.bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = S.bag[i]; S.bag[i] = S.bag[j]; S.bag[j] = t; }
    }
    return S.bag.pop();
  }

  function say(who, text) { S.queue.push({ who: who, text: text }); }

  // The slot with the fewest dishes, counting those on their way there.
  function freeSlot() {
    var best = -1, n = [], i;
    for (i = 0; i < SLOTS; i++) n.push(S.slots[i].length);
    for (i = 0; i < S.pops.length; i++) n[S.pops[i].slot]++;
    for (i = 0; i < SLOTS; i++) if (n[i] < STACK && (best < 0 || n[i] < n[best])) best = i;
    return best;
  }
  function anyFood() { for (var i = 0; i < SLOTS; i++) if (S.slots[i].length) return true; return false; }

  // Move the pointer to the next slot with food on it, in that direction.
  function moveSel(dir) {
    for (var k = 1; k <= SLOTS; k++) {
      var i = (S.sel + dir * k + SLOTS * 2) % SLOTS;
      if (S.slots[i].length) { S.sel = i; AU.sfx('talk'); return; }
    }
  }

  function stepWaiter() {
    var w = S.waiter;
    w.t++;
    if (w.state === 'out') {
      if (S.owed > 0 && freeSlot() >= 0 && S.phase === 'eat' || S.phase === 'intro' && S.t > 30 && S.owed > 0) {
        var n = Math.min(S.owed, 3);
        w.carry = [];
        for (var i = 0; i < n; i++) w.carry.push(nextDish());
        S.owed -= n;
        w.state = 'in'; w.t = 0;
      }
    } else if (w.state === 'in') {
      w.x += (150 - w.x) * 0.08 - 0.6;
      if (w.x < 152) { w.state = 'serve'; w.t = 0; }
    } else if (w.state === 'serve') {
      if (w.t % 10 === 0 && w.carry.length) {
        var s = freeSlot();
        if (s < 0) { S.owed += w.carry.length; w.carry = []; }
        else {
          var d = w.carry.shift();
          S.pops.push({ dish: d, slot: s, t: 0, x0: w.x + 16, y0: WAITER_FEET - 34 });
          AU.sfx('kick');
        }
      }
      if (!w.carry.length && w.t > 24) {
        if (S.eaten > 0 && S.phase === 'eat' && !S.say && !S.queue.length) say('waiter', WAITER_LINES[w.line++ % WAITER_LINES.length]);
        w.state = 'back'; w.t = 0;
      }
    } else if (w.state === 'back') {
      w.x += 1.8;
      if (w.x >= DOOR_X) { w.x = DOOR_X; w.state = 'out'; w.t = 0; }
    }
    for (var p = 0; p < S.pops.length; p++) {
      var pp = S.pops[p];
      if (++pp.t === 12) {
        S.slots[pp.slot].push(pp.dish);
        if (!S.slots[S.sel].length) S.sel = pp.slot;
      }
    }
    S.pops = S.pops.filter(function (q) { return q.t < 12; });
  }

  function eat() {
    var st = S.slots[S.sel], d = st.pop();
    S.fly = { dish: d, t: 0, x0: slotX(S.sel), y0: TABLE_Y + 3 - st.length * LIFT };
    AU.sfx('jump');
  }

  function swallow(d) {
    var amt = d.amt * (1 + S.eaten * 0.07);
    S.eaten++;
    S.target = Math.min(CAP, S.target + amt);
    S.layers.push({ col: d.col, hi: d.hi, upTo: S.target });
    S.owed += 1 + Math.floor(S.eaten / 3);
    AU.sfx('gulp');
    var text = d.hot ? 'STERKT!!' : d.drink ? 'AAAH.' : d.sweet ? 'SØTT!' : YUM[S.eaten % YUM.length];
    S.yums.push({ text: text, t: 0, x: ME_X + 40, y: FEET - 96 - 8 });
    if (d.hot) { S.hot = 200; say('tove', 'DRIKK LASSI, MAGNE! DET HJELPE.'); }
    S.chew = 22;
    if (!S.slots[S.sel].length) moveSel(1);
  }

  function step() {
    S.t++;
    var i;
    if (S.say && ++S.say.t > 50 + S.say.text.length * 2 + (S.queue.length ? 0 : 40)) S.say = null;
    if (!S.say && S.queue.length) S.say = { who: S.queue[0].who, text: S.queue.shift().text, t: 0 };
    for (i = 0; i < S.yums.length; i++) S.yums[i].t++;
    S.yums = S.yums.filter(function (q) { return q.t < 40; });
    for (i = 0; i < S.steam.length; i++) { S.steam[i].y -= 0.6; S.steam[i].x += Math.sin(S.steam[i].y / 4) * 0.3; S.steam[i].life--; }
    S.steam = S.steam.filter(function (q) { return q.life > 0; });
    for (i = 0; i < S.bubbles.length; i++) { S.bubbles[i].y -= 0.4; S.bubbles[i].life--; }
    S.bubbles = S.bubbles.filter(function (q) { return q.life > 0 && q.y > FEET - (S.level / CAP) * (32 - SHOULDER) * SC; });
    if (S.hot > 0) {
      S.hot--;
      if (S.t % 4 === 0) S.steam.push({ x: ME_X + 14 + Math.random() * 20, y: FEET - 96, life: 40 });
    }
    if (S.level < S.target) {
      S.level = Math.min(S.target, S.level + 0.35);
      if (S.t % 5 === 0) S.bubbles.push({ x: 8 + Math.random() * 32, y: FEET - 4, life: 60 });
    }

    if (S.phase === 'home') { stepHome(); return; }
    stepWaiter(); // even after he says stop, what is on its way still arrives

    if (S.phase === 'intro') {
      if (S.t === 20) say('tove', 'EG E SÅ SULTEN, MAGNE!');
      if (anyFood() && S.t > 60) { go('eat'); }
      return;
    }
    if (S.phase === 'eat') {
      for (i = S.said; i < REMARKS.length && S.level / CAP >= REMARKS[i].at; i++) { say(REMARKS[i].who, REMARKS[i].text); S.said = i + 1; }
      if (S.fly) {
        var f = S.fly;
        if (++f.t >= 16) { S.fly = null; swallow(f.dish); }
        return;
      }
      if (S.chew > 0) { S.chew--; return; }
      if (S.level >= CAP) {
        S.why = 'full';
        S.queue = []; S.say = null;
        AU.stopMusic();
        AU.sfx('bump');
        go('stop');
        return;
      }
      if (env.pressed('leftP')) moveSel(-1);
      if (env.pressed('rightP')) moveSel(1);
      if (env.pressed('jumpP') && S.slots[S.sel].length && S.target < CAP) eat();
      if (env.pressed('fireP') && S.eaten > 0) {
        S.why = 'early';
        S.queue = []; S.say = null;
        AU.stopMusic();
        go('stop');
      }
      return;
    }
    if (S.phase === 'stop') {
      if (S.t === 1) {
        if (S.why === 'full') { say('me', 'STOPP! I KLARER IKKE MER!'); say('tove', 'HEILT OPP TE SKULDRENE! NÅ GÅR ME HJEM.'); }
        else { say('me', 'I TROR I STOPPER HER.'); say('tove', 'LURT, MAGNE. NÅ GÅR ME HJEM.'); }
      }
      if (S.t > 70 && !S.queue.length && env.pressed('jumpP')) { S.say = null; go('home'); AU.startMusic('indisk'); }
    }
  }

  // ---------------------------------------------------------------- walking home
  var HOME_LINES = [
    [60, 'tove', 'DET VAR GODT, DET.'],
    [230, 'me', 'I SKAL ALDRI SPISE IGJEN.'],
    [420, 'me', '...KANSKJE LITT FROKOST.'],
    [590, 'tove', 'DU E FIN, DU, MAGNE.']
  ];
  function stepHome() {
    for (var i = 0; i < HOME_LINES.length; i++) if (S.t === HOME_LINES[i][0]) say(HOME_LINES[i][1], HOME_LINES[i][2]);
    if (S.t > 700 && env.pressed('jumpP')) { AU.stopMusic(); env.done(); }
  }

  // ---------------------------------------------------------------- drawing
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function disc(ctx, x, y, rx, ry, c) { A.disc(ctx, Math.round(x), Math.round(y), rx, ry, c); }

  // A dish, standing on the table with its bottom at (x, y), drawn once
  // at its own size and then blown up.
  var dishArt = {};
  function drawDish(ctx, d, x, y) {
    if (!dishArt[d.name]) {
      var c = document.createElement('canvas');
      c.width = 24; c.height = 22;
      paintDish(c.getContext('2d'), d, 12, 21);
      dishArt[d.name] = c;
    }
    ctx.drawImage(dishArt[d.name], Math.round(x - 12 * DISH), Math.round(y - 21 * DISH), 24 * DISH, 22 * DISH);
  }
  function paintDish(ctx, d, x, y) {
    if (d.kind === 'bowl' || d.kind === 'balls') {
      rect(ctx, x - 9, y - 6, 18, 2, '#c8843a');
      rect(ctx, x - 8, y - 4, 16, 2, '#a86a2a');
      rect(ctx, x - 6, y - 2, 12, 2, '#8a5420');
      if (d.kind === 'bowl') {
        disc(ctx, x, y - 7, 8, 2, d.col);
        rect(ctx, x - 4, y - 8, 3, 1, d.hi);
        if (d.bits) { rect(ctx, x + 2, y - 7, 1, 1, d.bits); rect(ctx, x - 2, y - 6, 1, 1, d.bits); rect(ctx, x + 5, y - 6, 1, 1, d.bits); }
      } else {
        disc(ctx, x - 4, y - 8, 3, 3, d.col); disc(ctx, x + 3, y - 8, 3, 3, d.col); disc(ctx, x, y - 11, 3, 3, d.col);
        rect(ctx, x - 5, y - 10, 1, 1, d.hi); rect(ctx, x + 2, y - 10, 1, 1, d.hi); rect(ctx, x - 1, y - 13, 1, 1, d.hi);
      }
    } else if (d.kind === 'glass') {
      rect(ctx, x - 3, y - 14, 7, 14, '#dce8ec');
      rect(ctx, x - 2, y - 11, 5, 10, d.col);
      rect(ctx, x - 2, y - 11, 1, 10, d.hi);
      rect(ctx, x + 1, y - 18, 1, 6, '#e83a6a');
    } else {
      disc(ctx, x, y - 2, 10, 2, '#f4f4f0');
      disc(ctx, x, y - 2, 8, 1, '#d8d8d4');
      if (d.kind === 'rice') {
        disc(ctx, x, y - 5, 7, 4, d.col);
        rect(ctx, x - 3, y - 8, 2, 1, d.hi);
        rect(ctx, x + 2, y - 6, 1, 1, d.bits); rect(ctx, x - 4, y - 4, 1, 1, d.bits); rect(ctx, x + 4, y - 4, 1, 1, '#4a9a3a');
      } else if (d.kind === 'naan') {
        disc(ctx, x, y - 4, 9, 2, d.col);
        rect(ctx, x - 6, y - 5, 3, 1, d.hi);
        rect(ctx, x - 2, y - 4, 2, 1, d.bits); rect(ctx, x + 4, y - 5, 2, 1, d.bits); rect(ctx, x + 1, y - 3, 1, 1, d.bits);
      } else if (d.kind === 'samosa') {
        for (var r = 0; r < 6; r++) { rect(ctx, x - 7 + r / 2, y - 4 - r, 7 - r, 1, r < 2 ? d.col : d.hi); rect(ctx, x + 1 + r / 2, y - 4 - r, 7 - r, 1, r < 2 ? d.col : d.hi); }
      } else if (d.kind === 'papad') {
        disc(ctx, x, y - 5, 10, 2, d.col);
        rect(ctx, x - 5, y - 6, 1, 1, d.bits); rect(ctx, x + 3, y - 5, 1, 1, d.bits); rect(ctx, x, y - 6, 1, 1, d.bits);
      }
    }
  }

  // Magnio, filled with what he has eaten. The curry is drawn on a canvas of
  // its own, column by column so the top can slosh, and then painted onto
  // him only where he is (source-atop), so it takes his shape.
  var meCan = document.createElement('canvas'), curryCan = document.createElement('canvas');
  function drawMe(ctx, frame, x, feet, sc, left, wobble) {
    var spr = A.player.magnio.normal.big[frame][left ? 'l' : 'r'];
    var w = spr.width * sc, h = spr.height * sc;
    if (meCan.width !== w || meCan.height !== h) { meCan.width = curryCan.width = w; meCan.height = curryCan.height = h; }
    var g = meCan.getContext('2d'), c = curryCan.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, h);
    g.drawImage(spr, 0, 0, w, h);
    c.clearRect(0, 0, w, h);
    var full = (spr.height - SHOULDER) * sc, top = h - S.level / CAP * full, i;
    if (S.level > 0) {
      for (var cx = 0; cx < w; cx++) {
        var sy = Math.round(top + Math.sin(S.t * 0.12 + cx * 0.3) * wobble);
        var below = h;
        for (i = 0; i < S.layers.length && below > sy; i++) {
          var ly = Math.round(h - Math.min(S.level, S.layers[i].upTo) / CAP * full);
          var from = Math.max(ly, sy);
          if (from < below) { c.fillStyle = S.layers[i].col; c.fillRect(cx, from, 1, below - from); }
          below = Math.min(below, ly);
        }
        if (sy < h) {
          var topLayer = S.layers[Math.min(i, S.layers.length) - 1] || S.layers[S.layers.length - 1];
          c.fillStyle = topLayer.hi; c.fillRect(cx, sy, 1, 1);
        }
      }
      for (i = 0; i < S.bubbles.length; i++) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(Math.round(S.bubbles[i].x * sc / 3), Math.round(S.bubbles[i].y - feet + h), sc - 1, sc - 1); }
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = 0.92;
      g.drawImage(curryCan, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(meCan, Math.round(x), Math.round(feet - h));
  }

  function bubble(ctx, text, cx, bottom, color) {
    var lines = wrap(text, 26), w = 0, i;
    for (i = 0; i < lines.length; i++) w = Math.max(w, F.width(lines[i]));
    var bw = w + 10, bh = lines.length * 10 + 6;
    var bx = Math.max(2, Math.min(VW - bw - 2, Math.round(cx - bw / 2))), by = Math.max(2, bottom - bh);
    rect(ctx, bx - 1, by - 1, bw + 2, bh + 2, '#1a1a1a');
    rect(ctx, bx, by, bw, bh, '#fffaf0');
    var tx = Math.max(bx + 4, Math.min(bx + bw - 6, Math.round(cx)));
    rect(ctx, tx - 1, by + bh + 1, 3, 2, '#1a1a1a'); rect(ctx, tx, by + bh, 1, 3, '#fffaf0');
    for (i = 0; i < lines.length; i++) F.draw(ctx, lines[i], bx + 5, by + 5 + i * 10, color || '#2a2a2a');
  }
  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      if (cur && (cur + ' ' + words[i]).length > n) { lines.push(cur); cur = words[i]; } else cur = cur ? cur + ' ' + words[i] : words[i];
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function centered(ctx, text, y, color, scale) {
    F.outline(ctx, text, Math.round((VW - F.width(text, scale || 1)) / 2), y, color, scale || 1, '#000');
  }

  function drawRoom(ctx) {
    var x, y, i;
    rect(ctx, 0, 0, VW, WAITER_FEET, '#7a1a26');
    for (y = 30; y < WAITER_FEET; y += 16) for (x = (y / 16) % 2 ? 0 : 8; x < VW; x += 16) {
      rect(ctx, x + 6, y, 3, 1, '#8e2a34'); rect(ctx, x + 7, y - 1, 1, 3, '#8e2a34');
    }
    rect(ctx, 0, 22, VW, 3, '#d8a838'); rect(ctx, 0, 25, VW, 1, '#8a6018');
    rect(ctx, 0, 0, VW, 22, '#5a1018');
    F.outline(ctx, 'MAHARAJA', Math.round((VW - F.width('MAHARAJA', 2)) / 2), 5, '#f0c848', 2, '#3a0a10');
    // the window: dusk over the sea, with the Peñón out on the horizon
    var wx = 92, wy = 40, ww = 56, wh = 70;
    rect(ctx, wx - 3, wy - 3, ww + 6, wh + 6, '#d8a838');
    for (y = 0; y < wh; y++) {
      var u = y / wh;
      rect(ctx, wx, wy + y, ww, 1, u < 0.55 ? (u < 0.25 ? '#3a3a7a' : u < 0.45 ? '#a84a6a' : '#f08a4a') : '#1a4a78');
    }
    for (i = 0; i < 26; i++) {
      var ph = i < 5 ? 2 + i * 3.4 : 19 - (i - 5) * 0.8;   // a sheer face to the north, a long slope to the south
      rect(ctx, wx + 12 + i, wy + 44 - Math.round(ph), 1, Math.round(ph), '#2a2440');
    }
    rect(ctx, wx + 4, wy + 46, 22, 1, '#f8c070');
    for (i = 0; i < 6; i++) rect(ctx, wx + 10 + i * 6, wy + 50 + (i % 3) * 5, 4, 1, '#3a6a98');
    // the arched top of the window, in the Mughal way
    for (y = 0; y < 14; y++) {
      var cut = Math.round(ww / 2 * Math.sqrt(1 - Math.pow(1 - y / 14, 2)));
      rect(ctx, wx, wy + y, ww / 2 - cut, 1, '#d8a838'); rect(ctx, wx + ww / 2 + cut, wy + y, ww / 2 - cut, 1, '#d8a838');
    }
    // the Taj Mahal on the wall
    var px = 234, py = 44;
    rect(ctx, px - 3, py - 3, 56, 44, '#d8a838'); rect(ctx, px, py, 50, 38, '#4a8ac8');
    rect(ctx, px, py + 30, 50, 8, '#5a9a4a');
    rect(ctx, px + 12, py + 18, 26, 13, '#f4f0e8');
    disc(ctx, px + 25, py + 15, 7, 6, '#f4f0e8');
    rect(ctx, px + 25, py + 5, 1, 4, '#f4f0e8');
    rect(ctx, px + 4, py + 10, 2, 21, '#f4f0e8'); rect(ctx, px + 44, py + 10, 2, 21, '#f4f0e8');
    rect(ctx, px + 22, py + 23, 6, 8, '#8a8a9a');
    // the kitchen door, warm light behind it
    for (y = 0; y < 70; y++) {
      var half = y < 18 ? Math.round(18 * Math.sqrt(1 - Math.pow(1 - y / 18, 2))) : 18;
      rect(ctx, DOOR_X + 16 - half - 2, 98 + y, half * 2 + 4, 1, '#d8a838');
      rect(ctx, DOOR_X + 16 - half, 98 + y + 2, half * 2, 1, y < 66 ? '#f0b050' : '#d08030');
    }
    // hanging lamps
    var lamps = [40, 340];
    for (i = 0; i < lamps.length; i++) {
      x = lamps[i];
      rect(ctx, x, 26, 1, 20, '#3a2a18');
      disc(ctx, x, 52, 6, 6, '#c8943a'); disc(ctx, x, 52, 4, 4, '#ffe080');
      for (y = 0; y < 4; y++) rect(ctx, x - 2 + y % 2 * 3, 47 + y * 3, 1, 1, '#8a5a1a');
      rect(ctx, x - 1, 58, 3, 3, '#c8943a');
    }
    // the floor
    for (y = WAITER_FEET; y < VH; y += 6) rect(ctx, 0, y, VW, 6, (y / 6) % 2 ? '#4a2a1a' : '#55301e');
    for (y = WAITER_FEET; y < VH; y += 6) for (x = (y * 7) % 40; x < VW; x += 40) rect(ctx, x, y, 1, 6, '#3a1e10');
  }

  function drawTable(ctx) {
    rect(ctx, 80, TABLE_Y, 226, 4, '#f4f0e8');
    rect(ctx, 80, TABLE_Y + 4, 226, 22, '#e8e2d4');
    rect(ctx, 150, TABLE_Y, 86, 26, '#c84a24');
    rect(ctx, 150, TABLE_Y, 86, 1, '#e88a4a');
    for (var x = 152; x < 236; x += 6) rect(ctx, x, TABLE_Y + 23, 3, 3, '#d8a838');
    rect(ctx, 80, TABLE_Y + 26, 226, 1, '#b8b2a4');
    rect(ctx, 90, TABLE_Y + 27, 5, FEET - TABLE_Y - 27, '#5a3420'); rect(ctx, 292, TABLE_Y + 27, 5, FEET - TABLE_Y - 27, '#5a3420');
  }

  function drawTove(ctx, x, feet, left, hop) {
    var spr = A.npc.tove[left ? 'l' : 'r'];
    ctx.drawImage(spr, Math.round(x), Math.round(feet - spr.height * SC + (hop || 0)), spr.width * SC, spr.height * SC);
  }

  function drawWaiter(ctx) {
    var w = S.waiter;
    if (w.state === 'out') return;
    var img = waiter(), bob = (w.state === 'in' || w.state === 'back') ? (w.t >> 3) % 2 : 0;
    ctx.drawImage(img, Math.round(w.x), WAITER_FEET - 56 - bob, 32, 56);
    for (var i = 0; i < w.carry.length; i++) drawDish(ctx, w.carry[i], w.x + 16 + (i - 1) * 14, WAITER_FEET - 30 - bob - i * 6);
  }

  function drawSaying(ctx) {
    if (!S.say) return;
    var who = S.say.who, x, top;
    if (who === 'me') { x = ME_X + 24; top = FEET - 96 - 4; }
    else if (who === 'tove') { x = TOVE_X + 24; top = FEET - 84 - 4; }
    else { x = S.waiter.x + 16; top = WAITER_FEET - 60; }
    if (S.phase === 'home') {
      x = who === 'me' ? homeX('me') + 16 : homeX('tove') + 16;
      top = 140;
    }
    bubble(ctx, S.say.text, x, top, who === 'tove' ? '#a01e4a' : who === 'me' ? '#1a2a6a' : '#5a3a10');
  }

  function draw(ctx) {
    if (S.phase === 'home') { drawHome(ctx); return; }
    var i;
    drawRoom(ctx);
    drawWaiter(ctx);
    drawTable(ctx);
    for (i = 0; i < SLOTS; i++) {
      for (var k = 0; k < S.slots[i].length; k++) drawDish(ctx, S.slots[i][k], slotX(i), TABLE_Y + 3 - k * LIFT);
    }
    for (i = 0; i < S.pops.length; i++) {
      var p = S.pops[i], u = p.t / 12;
      drawDish(ctx, p.dish, p.x0 + (slotX(p.slot) - p.x0) * u, p.y0 + (TABLE_Y + 3 - S.slots[p.slot].length * LIFT - p.y0) * u - Math.sin(Math.PI * u) * 12);
    }
    var bounce = S.chew > 0 ? (S.chew >> 2) % 2 : 0;
    drawMe(ctx, 'stand', ME_X, FEET + bounce, SC, false, S.level < S.target ? 1.5 : 0.6);
    if (S.hot > 0 && (S.t >> 3) % 2) rect(ctx, ME_X + 27, FEET - 96 + 15, 9, 6, 'rgba(255,40,20,0.35)');
    for (i = 0; i < S.steam.length; i++) rect(ctx, S.steam[i].x, S.steam[i].y, 2, 2, 'rgba(255,255,255,' + (S.steam[i].life / 40) + ')');
    drawTove(ctx, TOVE_X, FEET, true, 0);
    if (S.fly) {
      var f = S.fly, v = f.t / 16, mx = ME_X + 40, my = FEET - 96 + 40;
      drawDish(ctx, f.dish, f.x0 + (mx - f.x0) * v, f.y0 + (my - f.y0) * v - Math.sin(Math.PI * v) * 30);
    }
    for (i = 0; i < S.yums.length; i++) F.outline(ctx, S.yums[i].text, S.yums[i].x, S.yums[i].y - (S.yums[i].t >> 1), '#ffe060', 1, '#000');
    // the pointer over the chosen dish
    if (S.phase === 'eat' && !S.fly && S.slots[S.sel].length) {
      var ax = slotX(S.sel), ay = TABLE_Y - 30 - (S.slots[S.sel].length - 1) * LIFT + Math.round(Math.sin(S.t / 6) * 2);
      for (i = 0; i < 4; i++) rect(ctx, ax - 3 + i, ay + i, 7 - i * 2, 1, '#ffffff');
    }
    drawSaying(ctx);
    rect(ctx, 0, VH - 14, VW, 14, 'rgba(30,8,12,0.9)');
    if (S.phase === 'eat') {
      var d = S.slots[S.sel][S.slots[S.sel].length - 1];
      var hint = (d ? '< ' + d.name + ' >   ' + X + ' SPIS' : 'VENT PÅ MAT...') + (S.eaten ? '   □ STOPP' : '');
      centered(ctx, hint, VH - 10, '#ffffff');
    } else if (S.phase === 'stop') {
      if (S.why === 'full') centered(ctx, 'STOPP!', 34, '#ffe060', 4);
      if (S.t > 70 && !S.queue.length) centered(ctx, X + ' GÅ HJEM', VH - 10, '#ffffff');
    } else {
      centered(ctx, 'MAHARAJA, MORAIRA', VH - 10, '#f0c848');
    }
  }

  // They walk home along the seafront, Magnio a good deal slower than before.
  function homeX(who) {
    return who === 'me' ? -40 + S.t * 0.42 : -6 + S.t * 0.42;
  }
  function drawHome(ctx) {
    var i, x, y;
    for (y = 0; y < 120; y++) rect(ctx, 0, y, VW, 1, y < 50 ? '#0e1434' : y < 90 ? '#16204a' : '#24305e');
    for (i = 0; i < 40; i++) {
      var sx = (i * 97) % VW, sy = (i * 53) % 100;
      if ((S.t + i * 13) % 90 > 4) rect(ctx, sx, sy, 1, 1, i % 5 ? '#c8d0f0' : '#ffffff');
    }
    disc(ctx, 320, 30, 9, 9, '#f8f0c8'); disc(ctx, 324, 28, 8, 8, '#16204a');
    // the Peñón, far out
    for (i = 0; i < 40; i++) {
      var ph = i < 8 ? 3 + i * 2.6 : 24 - (i - 8) * 0.7;
      rect(ctx, 104 + i, 112 - Math.round(ph), 1, Math.round(ph), '#1a1c3a');
    }
    rect(ctx, 0, 112, VW, 40, '#14284a');
    for (i = 0; i < 14; i++) rect(ctx, 304 + Math.sin(S.t / 20 + i) * 4, 116 + i * 2.6, 26 - i, 1, '#d8d0a0');
    for (i = 0; i < 20; i++) rect(ctx, (i * 59 + S.t / 3) % VW, 120 + (i * 17) % 28, 5, 1, '#2a4a78');
    // white houses with lit windows on the far side of the promenade
    var houses = [[150, 30, 22], [200, 40, 30], [252, 26, 18]];
    for (i = 0; i < houses.length; i++) {
      var h = houses[i];
      rect(ctx, h[0], 140 - h[2], h[1], h[2], '#c8c4d8');
      for (x = h[0] + 4; x < h[0] + h[1] - 4; x += 8) rect(ctx, x, 140 - h[2] + 5, 3, 4, '#f8d070');
    }
    // the restaurant they came from, its sign still lit
    rect(ctx, 0, 92, 70, 50, '#d8d0c0');
    rect(ctx, 6, 98, 58, 12, '#7a1a26');
    F.draw(ctx, 'MAHARAJA', 11, 101, '#f0c848');
    rect(ctx, 26, 116, 18, 26, '#f0b050');
    // palms
    var palms = [96, 300, 360];
    for (i = 0; i < palms.length; i++) {
      x = palms[i];
      for (y = 0; y < 44; y++) rect(ctx, x + Math.round(Math.sin(y / 14) * 3), 140 - y, 3, 1, '#0a0e20');
      for (var k = 0; k < 5; k++) {
        var ang = -Math.PI * (0.1 + k * 0.2);
        for (var r = 0; r < 14; r++) rect(ctx, x + 1 + Math.cos(ang) * r, 96 + Math.sin(ang) * r * 0.5 + r * r * 0.04, 2, 1, '#0a0e20');
      }
    }
    rect(ctx, 0, 140, VW, 4, '#5a5068');
    rect(ctx, 0, 144, VW, VH - 144, '#3a3448');
    for (x = 0; x < VW; x += 12) rect(ctx, x, 144, 1, VH - 144, '#2e2a3c');
    for (i = 0; i < 3; i++) {
      x = 60 + i * 130;
      rect(ctx, x, 104, 2, 40, '#1a1a24'); disc(ctx, x + 1, 102, 3, 2, '#f8e8a0');
      ctx.fillStyle = 'rgba(248,232,160,0.12)'; ctx.beginPath(); ctx.moveTo(x - 2, 104); ctx.lineTo(x - 18, 160); ctx.lineTo(x + 20, 160); ctx.lineTo(x + 4, 104); ctx.fill();
    }
    // Magnio waddles; Tove walks on a step ahead
    var mx = homeX('me'), tx = homeX('tove');
    var frame = (S.t >> 4) % 2 ? 'walk1' : 'walk2', wad = Math.round(Math.sin(S.t / 8) * 1);
    drawMe(ctx, frame, mx + wad, 196, 2, false, 0.6);
    var tove = A.npc.tove.r;
    ctx.drawImage(tove, Math.round(tx), 196 - tove.height * 2 - ((S.t >> 3) % 2), tove.width * 2, tove.height * 2);
    drawSaying(ctx);
    rect(ctx, 0, VH - 14, VW, 14, 'rgba(8,10,30,0.9)');
    centered(ctx, S.t > 700 ? 'SÅ GIKK MAGNIO OG TOVE HJEM.   ' + X : 'SÅ GIKK MAGNIO OG TOVE HJEM.', VH - 10, '#f0e8c0');
  }

  SM.curry = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
