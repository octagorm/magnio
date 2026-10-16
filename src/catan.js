// Catan in the cabin at Heim, started from the game box by the door. Not the
// whole game, only the race for the longest road: Magnio, Tove and a third
// player nobody names take turns placing one road each, and after eight
// rounds the longest unbroken road wins.
//
// The board looks like Catan: nineteen hexes of forest, pasture, fields,
// hills and mountains round a desert, with number tokens, in the sea.
// The arrows pick where Magnio builds next and ✕ builds there. The other
// two think for a moment and build where it makes their own road longest,
// though they do not always see it. A draw goes to the birthday boy.
// With two players, Frodigi takes the third seat and builds his own roads,
// with the second controller.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216;
  var BX = 116, BY = 102, R = 20, HW = 17, COL = 34, ROW = 30; // board centre, hex size and spacing
  var PANEL_X = 236;
  var ROUNDS = 8;
  var X = '✕', SQ = '□';

  var TERRAIN = {
    skog: { col: '#2e7a32', dark: '#1e5a22' }, beite: { col: '#8ac850', dark: '#6aa838' },
    aker: { col: '#e8c040', dark: '#c8a028' }, leire: { col: '#c86a3a', dark: '#a04a24' },
    fjell: { col: '#8a8a96', dark: '#6a6a76' }, orken: { col: '#e8d8a0', dark: '#c8b880' }
  };
  var TILES = ['skog', 'skog', 'skog', 'skog', 'beite', 'beite', 'beite', 'beite', 'aker', 'aker', 'aker', 'aker',
    'leire', 'leire', 'leire', 'fjell', 'fjell', 'fjell'];
  var NUMBERS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

  var PLAYERS = [
    { name: 'MAGNIO', col: '#d83030', dark: '#801010', at: [-52, 44] },
    { name: 'TOVE', col: '#3a6ad8', dark: '#1a3a80', at: [62, -4], miss: 0.4 },
    { name: '???', col: '#f4f4f4', dark: '#707070', at: [-26, -60], miss: 0.45 }
  ];
  var STRANGER = PLAYERS[2], FRODIGI = { name: 'FRODIGI', col: '#3aa040', dark: '#1a6020', at: STRANGER.at };
  var FAINT = [['#f4c0b0', '#c89080'], null, ['#b8e8b0', '#78b070']];

  var S = null, env = null, board = null;

  // ---------------------------------------------------------------- the board
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function buildBoard() {
    var hexes = [], counts = [3, 4, 5, 4, 3], tiles = shuffle(TILES.slice()), nums = NUMBERS.slice(), k = 0;
    for (var r = 0; r < 5; r++) {
      for (var i = 0; i < counts[r]; i++) {
        var cx = BX + (i - (counts[r] - 1) / 2) * COL, cy = BY + (r - 2) * ROW;
        var desert = r === 2 && i === 2;
        hexes.push({ x: cx, y: cy, kind: desert ? 'orken' : tiles[k], num: desert ? 0 : nums[k] });
        if (!desert) k++;
      }
    }
    // corners and sides, shared between neighbouring hexes
    var verts = [], vIndex = {}, edges = [], eIndex = {};
    function vert(x, y) {
      var key = x + ',' + y;
      if (vIndex[key] === undefined) { vIndex[key] = verts.length; verts.push({ x: x, y: y, edges: [] }); }
      return vIndex[key];
    }
    hexes.forEach(function (h) {
      var c = [[h.x, h.y - R], [h.x + HW, h.y - R / 2], [h.x + HW, h.y + R / 2], [h.x, h.y + R], [h.x - HW, h.y + R / 2], [h.x - HW, h.y - R / 2]];
      var ids = c.map(function (p) { return vert(p[0], p[1]); });
      for (var j = 0; j < 6; j++) {
        var a = ids[j], b = ids[(j + 1) % 6], key = Math.min(a, b) + '-' + Math.max(a, b);
        if (eIndex[key] !== undefined) continue;
        eIndex[key] = edges.length;
        edges.push({ a: a, b: b, owner: -1, mx: (verts[a].x + verts[b].x) / 2, my: (verts[a].y + verts[b].y) / 2 });
        verts[a].edges.push(edges.length - 1); verts[b].edges.push(edges.length - 1);
      }
    });
    return { hexes: hexes, verts: verts, edges: edges, img: paintBoard(hexes) };
  }

  // A crisp hexagon, one scanline at a time.
  function hexFill(g, cx, cy, rad, col) {
    var hw = Math.round(rad * HW / R);
    g.fillStyle = col;
    for (var y = -rad; y <= rad; y++) {
      var a = Math.abs(y), w = a <= rad / 2 ? hw : Math.round(hw * (rad - a) / (rad / 2));
      g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
  }

  function paintBoard(hexes) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), i, h;
    c.width = PANEL_X; c.height = VH;
    g.fillStyle = '#2a6ab0';
    g.fillRect(0, 0, PANEL_X, VH);
    g.fillStyle = '#5a9ad8';
    for (i = 0; i < 60; i++) g.fillRect((i * 53) % PANEL_X, (i * 37) % VH, 4, 1); // waves
    for (i = 0; i < hexes.length; i++) hexFill(g, hexes[i].x, hexes[i].y, R + 4, '#e8d4a0'); // the beach round the island
    for (i = 0; i < hexes.length; i++) {
      h = hexes[i];
      var t = TERRAIN[h.kind];
      hexFill(g, h.x, h.y, R - 1, t.dark);
      hexFill(g, h.x, h.y, R - 2, t.col);
      paintTerrain(g, h, t);
      if (h.num) {
        A.disc(g, h.x, h.y + 1, 6, 5, '#7a6a4a');
        A.disc(g, h.x, h.y, 6, 5, '#f4ecd0');
        var s = String(h.num), red = h.num === 6 || h.num === 8;
        F.draw(g, s, h.x - Math.floor(F.width(s) / 2), h.y - 3, red ? '#c82020' : '#2a2018');
      }
    }
    return c;
  }

  function paintTerrain(g, h, t) {
    var x = h.x, y = h.y, i;
    function r(px, py, w, hh, col) { g.fillStyle = col; g.fillRect(x + px, y + py, w, hh); }
    if (h.kind === 'skog') {
      [[-9, -11], [6, -12], [-12, 5], [9, 6], [-2, 10]].forEach(function (p) {
        for (var k = 0; k < 5; k++) r(p[0] - k, p[1] + k, k * 2 + 1, 1, '#14481a');
        r(p[0], p[1] + 5, 1, 2, '#6a3a1a');
      });
    } else if (h.kind === 'beite') {
      [[-10, -10], [5, -12], [-12, 6], [8, 7]].forEach(function (p) {
        r(p[0], p[1], 4, 3, '#f4f4f4'); r(p[0] + 4, p[1], 2, 2, '#1a1a1a'); r(p[0], p[1] + 3, 1, 1, '#1a1a1a'); r(p[0] + 3, p[1] + 3, 1, 1, '#1a1a1a');
      });
    } else if (h.kind === 'aker') {
      for (i = -14; i <= 14; i += 4) if (Math.abs(i) > 7) r(-10, i, 20, 1, t.dark);
      for (i = -8; i <= 8; i += 4) { r(-14, i, 6, 1, t.dark); r(8, i, 6, 1, t.dark); }
    } else if (h.kind === 'leire') {
      for (i = -14; i <= 12; i += 4) if (Math.abs(i) > 7) for (var bx = -10 + (i & 4); bx < 10; bx += 6) r(bx, i, 5, 3, '#a8482a');
      for (i = -6; i <= 6; i += 4) { r(-15, i, 5, 3, '#a8482a'); r(10, i, 5, 3, '#a8482a'); }
    } else if (h.kind === 'fjell') {
      [[-9, -6, 6], [8, -5, 5], [0, 12, 5]].forEach(function (p) {
        for (var k = 0; k < p[2]; k++) r(p[0] - k, p[1] + k, k * 2 + 1, 1, k < 2 ? '#f4f4f4' : '#5a5a66');
      });
    } else {
      for (i = 0; i < 12; i++) r(((i * 7) % 24) - 12, ((i * 11) % 24) - 12, 1, 1, t.dark);
      r(-2, -4, 5, 9, '#4a4a52'); A.disc(g, x, y - 6, 3, 3, '#4a4a52');  // the robber, standing in the desert
    }
  }

  // ---------------------------------------------------------------- roads
  function nearestVert(px, py, taken) {
    var best = -1, bd = Infinity;
    for (var i = 0; i < board.verts.length; i++) {
      if (taken.indexOf(i) >= 0) continue;
      var v = board.verts[i], d = (v.x - px) * (v.x - px) + (v.y - py) * (v.y - py);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function settlementAt(v) {
    for (var p = 0; p < S.homes.length; p++) if (S.homes[p] === v) return p;
    return -1;
  }

  // A road can be built from your own settlement, or from the end of one of
  // your roads, but not through someone else's settlement.
  function reaches(p, v) {
    var s = settlementAt(v);
    if (s >= 0) return s === p;
    var es = board.verts[v].edges;
    for (var i = 0; i < es.length; i++) if (board.edges[es[i]].owner === p) return true;
    return false;
  }

  function choices(p) {
    var out = [];
    for (var i = 0; i < board.edges.length; i++) {
      var e = board.edges[i];
      if (e.owner < 0 && (reaches(p, e.a) || reaches(p, e.b))) out.push(i);
    }
    return out;
  }

  // The longest unbroken road: the longest trail along your own roads that
  // never uses a road twice, and does not pass through anyone else's settlement.
  function longest(p) {
    var best = 0, used = {};
    function walk(v, len) {
      if (len > best) best = len;
      var s = settlementAt(v);
      if (len > 0 && s >= 0 && s !== p) return;
      var es = board.verts[v].edges;
      for (var i = 0; i < es.length; i++) {
        var e = board.edges[es[i]];
        if (e.owner !== p || used[es[i]]) continue;
        used[es[i]] = true;
        walk(e.a === v ? e.b : e.a, len + 1);
        used[es[i]] = false;
      }
    }
    for (var v = 0; v < board.verts.length; v++) walk(v, 0);
    return best;
  }

  function build(p, ei) {
    board.edges[ei].owner = p;
    S.built[p]++;
    var before = S.longest[p];
    S.longest[p] = longest(p);
    S.flash = { e: ei, t: 0 };
    AU.sfx(S.longest[p] > before ? 'coin' : 'bump');
  }

  // ---------------------------------------------------------------- the game
  // Whose turn is played with a controller: Magnio's, and Frodigi's when he is there.
  function human(p) { return p === 0 || (p === 2 && env.two); }
  function press(k) { return env.two ? env.by(S.turn === 0 ? 0 : 1, k) : env.pressed(k); }

  function start(e) {
    env = e;
    board = buildBoard();
    PLAYERS[2] = env.two ? FRODIGI : STRANGER;
    S = { phase: 'intro', t: 0, turn: 0, round: 1, homes: [], built: [0, 0, 0], longest: [0, 0, 0], sel: -1, last: {},
      say: 'TOVE: SKAL ME TA ET SLAG CATAN? DEN SOM BYGGE LENGST VEI, VINNE!', who: null };
    for (var p = 0; p < PLAYERS.length; p++) S.homes.push(nearestVert(BX + PLAYERS[p].at[0], BY + PLAYERS[p].at[1], S.homes));
    AU.startMusic('main');
  }

  function go(phase) { S.phase = phase; S.t = 0; }

  function step() {
    S.t++;
    if (S.flash) S.flash.t++;
    var P = S.phase;
    if (P === 'intro') {
      if (S.t > 30 && (env.pressed('jumpP') || env.pressed('upP'))) beginTurn(0);
    } else if (P === 'mine') stepMine();
    else if (P === 'theirs') stepTheirs();
    else if (P === 'end') {
      if (S.t > 60 && env.pressed('jumpP')) { start(env); beginTurn(0); }
      else if (S.t > 60 && env.pressed('fireP')) env.done();
    }
  }

  function beginTurn(p) {
    S.turn = p;
    var c = choices(p);
    if (!c.length) { S.say = PLAYERS[p].name + ' KOMMER IKKE VIDERE.'; return nextTurn(); }
    if (human(p)) {
      // start on the choice nearest the last road built, or nearest home
      var from = S.last[p] !== undefined ? board.edges[S.last[p]] : { mx: board.verts[S.homes[p]].x, my: board.verts[S.homes[p]].y };
      S.sel = nearest(c, from.mx, from.my);
      S.say = S.round === 1 ? (p ? 'FRODIGI SIN TUR' : 'DIN TUR') + '! VELG HVOR VEIEN SKAL GÅ, OG BYGG MED ' + X + '.' : 'DIN TUR, ' + PLAYERS[p].name + '.';
      go('mine');
    } else {
      S.say = PLAYERS[p].name === 'TOVE' ? 'TOVE TENKE...' : '???: ...';
      go('theirs');
    }
  }

  function nearest(list, x, y) {
    var best = list[0], bd = Infinity;
    for (var i = 0; i < list.length; i++) {
      var e = board.edges[list[i]], d = (e.mx - x) * (e.mx - x) + (e.my - y) * (e.my - y);
      if (d < bd) { bd = d; best = list[i]; }
    }
    return best;
  }

  function nextTurn() {
    var p = S.turn + 1;
    if (p >= PLAYERS.length) { p = 0; S.round++; }
    if (S.round > ROUNDS) return finish();
    beginTurn(p);
  }

  // The arrows jump to the nearest choice in that direction.
  function stepMine() {
    var c = choices(S.turn), dirs = { leftP: [-1, 0], rightP: [1, 0], upP: [0, -1], downP: [0, 1] };
    if (c.indexOf(S.sel) < 0) S.sel = c[0];
    for (var k in dirs) {
      if (!press(k)) continue;
      var cur = board.edges[S.sel], d = dirs[k], best = -1, bd = Infinity;
      for (var i = 0; i < c.length; i++) {
        if (c[i] === S.sel) continue;
        var e = board.edges[c[i]], vx = e.mx - cur.mx, vy = e.my - cur.my, len = Math.hypot(vx, vy);
        if ((vx * d[0] + vy * d[1]) / len < 0.35) continue;
        if (len < bd) { bd = len; best = c[i]; }
      }
      if (best >= 0) { S.sel = best; AU.sfx('talk'); }
    }
    if (S.t > 8 && press('jumpP')) {
      build(S.turn, S.sel);
      S.last[S.turn] = S.sel;
      nextTurn();
    }
  }

  // The others take a moment, then build where their road gets longest,
  // with a few extra points for blocking Magnio once he is ahead. Now and
  // then they miss the best spot.
  function stepTheirs() {
    if (S.t < 50) return;
    var p = S.turn, c = choices(p), pick = c[0];
    if (Math.random() < PLAYERS[p].miss) {
      pick = c[Math.floor(Math.random() * c.length)];
    } else {
      var mine = choices(0), best = -Infinity;
      for (var i = 0; i < c.length; i++) {
        board.edges[c[i]].owner = p;
        var score = longest(p) * 10 + Math.random() * 3;
        board.edges[c[i]].owner = -1;
        if (mine.indexOf(c[i]) >= 0 && S.longest[0] > S.longest[p] + 1) score += 8;
        if (score > best) { best = score; pick = c[i]; }
      }
    }
    var blocked = choices(0).indexOf(pick) >= 0 && S.longest[0] > 2;
    build(p, pick);
    if (blocked && p === 1) S.say = 'TOVE: HA! DER STENGTE EG VEIEN DIN!';
    nextTurn();
  }

  function finish() {
    var top = Math.max.apply(null, S.longest), winners = [];
    for (var p = 0; p < PLAYERS.length; p++) if (S.longest[p] === top) winners.push(p);
    var w = winners.indexOf(0) >= 0 ? 0 : winners[0];
    S.winner = w;
    if (w === 0) {
      S.say = winners.length > 1 ? 'UAVGJORT, MEN BURSDAGSBARNET VINNER!' : 'TOVE: GRATULERE, MAGNE! DU E GOD TE Å BYGGE VEI.';
      AU.sfx('clear');
    } else if (w === 1) {
      S.say = 'TOVE: HA! EG VANT! SKAL ME TA EN RUNDE TE?';
      AU.sfx('down');
    } else if (env.two) {
      S.say = 'TOVE: GRATULERE, FRODIGI! DU SLO BÅDE MEG OG MAGNE.';
      AU.sfx('clear');
    } else {
      S.say = '???: ...';
      AU.sfx('down');
    }
    go('end');
  }

  // ---------------------------------------------------------------- drawing
  function thickLine(ctx, x0, y0, x1, y1, size, col) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    ctx.fillStyle = col;
    for (var i = 0; i <= n; i++) {
      var x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      ctx.fillRect(x - (size >> 1), y - (size >> 1), size, size);
    }
  }

  // Roads stop a little short of the corners, like the wooden pieces.
  function drawRoad(ctx, e, col, dark) {
    var a = board.verts[e.a], b = board.verts[e.b];
    var x0 = a.x + (b.x - a.x) * 0.18, y0 = a.y + (b.y - a.y) * 0.18, x1 = a.x + (b.x - a.x) * 0.82, y1 = a.y + (b.y - a.y) * 0.82;
    thickLine(ctx, x0, y0, x1, y1, 5, dark);
    thickLine(ctx, x0, y0, x1, y1, 3, col);
  }

  function drawHouse(ctx, v, pl) {
    var x = board.verts[v].x, y = board.verts[v].y;
    ctx.fillStyle = pl.dark;
    ctx.fillRect(x - 5, y - 2, 11, 7);
    for (var k = 0; k < 5; k++) ctx.fillRect(x - k - 1, y - 7 + k, k * 2 + 3, 1);
    ctx.fillStyle = pl.col;
    ctx.fillRect(x - 4, y - 1, 9, 5);
    for (k = 0; k < 4; k++) ctx.fillRect(x - k, y - 6 + k, k * 2 + 1, 1);
  }

  var mystery = null;
  function portrait(p) {
    if (p === 0) return A.player.magnio.normal.big.stand.r;
    if (p === 1) return A.npc.tove.r;
    if (env.two) return A.player.frodigi.normal.big.stand.r;
    if (!mystery) {
      // the third player: a dark shape in a hat and coat
      var src = A.npc.skurk.r, c = document.createElement('canvas'), g = c.getContext('2d');
      c.width = src.width; c.height = src.height;
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#20202c';
      g.fillRect(0, 0, c.width, c.height);
      mystery = c;
    }
    return mystery;
  }

  function drawPanel(ctx) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(PANEL_X, 0, VW - PANEL_X, VH);
    ctx.fillStyle = '#5a4028';
    ctx.fillRect(PANEL_X + 3, 3, VW - PANEL_X - 6, VH - 6);
    F.draw(ctx, 'LENGSTE VEI', PANEL_X + 10, 8, '#f0d040');
    F.draw(ctx, 'RUNDE ' + Math.min(S.round, ROUNDS) + ' AV ' + ROUNDS, PANEL_X + 10, 18, '#e8d8b8');
    for (var p = 0; p < PLAYERS.length; p++) {
      var y = 32 + p * 38, pl = PLAYERS[p], img = portrait(p), active = (S.phase === 'mine' || S.phase === 'theirs') && S.turn === p;
      if (active || (S.phase === 'end' && S.winner === p)) { ctx.fillStyle = '#7a5a38'; ctx.fillRect(PANEL_X + 5, y - 2, VW - PANEL_X - 10, 36); }
      ctx.drawImage(img, PANEL_X + 8, y + 32 - img.height);
      if (p === 2 && !env.two) F.draw(ctx, '?', PANEL_X + 14, y + 10, '#f0d040');
      ctx.fillStyle = pl.dark; ctx.fillRect(PANEL_X + 30, y + 3, 8, 8);
      ctx.fillStyle = pl.col; ctx.fillRect(PANEL_X + 31, y + 4, 6, 6);
      F.draw(ctx, pl.name, PANEL_X + 42, y + 4, '#ffffff');
      F.draw(ctx, 'VEI: ' + S.longest[p], PANEL_X + 42, y + 16, '#e8d8b8');
      if (active && (S.t >> 4) & 1) F.draw(ctx, '<', VW - 16, y + 10, '#f0d040');
    }
    if (S.phase === 'end') drawCard(ctx, PANEL_X + 18, 148);
  }

  // The Longest Road card, for the winner.
  function drawCard(ctx, x, y) {
    ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 1, y - 1, 114, 30);
    ctx.fillStyle = '#f4ecd0'; ctx.fillRect(x, y, 112, 28);
    ctx.fillStyle = PLAYERS[S.winner].col; ctx.fillRect(x + 4, y + 18, 40, 4);
    F.draw(ctx, 'LENGSTE VEI', x + 6, y + 4, '#5a3a1a');
    F.draw(ctx, PLAYERS[S.winner].name, x + 50, y + 17, '#5a3a1a');
  }

  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + ' ' + words[i] : words[i];
      if (next.length > n && cur) { lines.push(cur); cur = words[i]; } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function draw(ctx) {
    ctx.drawImage(board.img, 0, 0);
    F.outline(ctx, 'CATAN', 6, 5, '#f0d040', 2, '#2a1a08');
    var i, e;
    if (S.phase === 'mine') {
      // every place he could build, faintly, and the chosen one blinking
      var c = choices(S.turn);
      for (i = 0; i < c.length; i++) {
        e = board.edges[c[i]];
        if (c[i] !== S.sel) drawRoad(ctx, e, FAINT[S.turn][0], FAINT[S.turn][1]);
      }
      if ((S.t >> 3) & 1) drawRoad(ctx, board.edges[S.sel], '#ffffff', PLAYERS[S.turn].dark);
    }
    for (i = 0; i < board.edges.length; i++) {
      e = board.edges[i];
      if (e.owner >= 0) drawRoad(ctx, e, PLAYERS[e.owner].col, PLAYERS[e.owner].dark);
    }
    if (S.flash && S.flash.t < 20 && (S.flash.t >> 2) & 1) drawRoad(ctx, board.edges[S.flash.e], '#ffffff', '#ffffff');
    for (i = 0; i < S.homes.length; i++) drawHouse(ctx, S.homes[i], PLAYERS[i]);
    drawPanel(ctx);
    // what is being said, along the bottom of the board
    var lines = wrap(S.say, 36), y0 = VH - 6 - lines.length * 10;
    ctx.fillStyle = 'rgba(12,26,58,0.85)';
    ctx.fillRect(0, y0 - 3, PANEL_X, lines.length * 10 + 7);
    for (i = 0; i < lines.length; i++) F.draw(ctx, lines[i], 6, y0 + i * 10, '#ffffff');
    var hint = S.phase === 'intro' ? X : S.phase === 'end' ? X + ' IGJEN  ' + SQ + ' FERDIG' : '';
    if (hint && S.t > 30 && (S.t >> 5) & 1) F.draw(ctx, hint, PANEL_X - 6 - F.width(hint), y0 - 12, '#ffffff');
  }

  SM.catan = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
