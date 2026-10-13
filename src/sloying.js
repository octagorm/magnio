// Gutting the fish, on the jetty at Heim. When Tove has caught something,
// Magnio can gut it for her: hold → to cut along the belly, press ✕ to take
// the guts out (a gull is always waiting), and ✕ once more to rinse it.
// The fish is whatever she caught: haddock, mackerel, cod, saithe or pollack.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216;
  var SCALE = 4, FX = 124, FY = 112;     // the fish is drawn four times its size
  var GUT_FROM = 9, GUT_TO = 22;         // where the cut runs, in fish pixels
  var BUCKET = [318, 150];
  var X = '✕';

  // back, side, belly, and what makes each one look like itself
  var KINDS = {
    HYSE: { back: '#5a5e66', side: '#a8acb4', belly: '#e8e8ec', line: '#2a2a2e', spot: true },
    TORSK: { back: '#7a6a48', side: '#b8a878', belly: '#ece4cc', line: '#ece4cc', spots: true, barbel: true },
    MAKRELL: { back: '#2a6a7a', side: '#a8c8d0', belly: '#f4f4f4', stripes: '#143a44' },
    SEI: { back: '#3a4a44', side: '#8a948e', belly: '#d8dcd8', line: '#d8dcd8' },
    LYR: { back: '#6a6a3a', side: '#b0a060', belly: '#e0d8b0', line: '#4a4a24' }
  };

  var S = null, env = null, art = {};

  function half(x) { return Math.max(1, Math.round(5 * Math.pow(Math.sin(Math.PI * (x - 1) / 27), 0.7))); }

  // The fish, facing left, 34 by 14 pixels.
  function fishArt(name) {
    if (art[name]) return art[name];
    var k = KINDS[name] || KINDS.HYSE, c = document.createElement('canvas'), g = c.getContext('2d'), x, y;
    c.width = 34; c.height = 14;
    function px(x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    for (x = 1; x <= 27; x++) {
      var h = half(x);
      for (y = 7 - h; y <= 7 + h; y++) px(x, y, y < 7 - h * 0.3 ? k.back : y > 7 + h * 0.4 ? k.belly : k.side);
    }
    for (x = 27; x < 34; x++) {                                            // the tail
      var t = Math.round((x - 26) * 0.9);
      for (y = 7 - t; y <= 7 + t; y++) px(x, y, Math.abs(y - 7) > t - 1 ? k.back : k.side);
    }
    for (x = 12; x < 19; x++) for (y = 1; y < 7 - half(x); y++) if (y >= 7 - half(x) - (x - 11) && y >= 7 - half(x) - (19 - x)) px(x, y, k.back); // dorsal fin
    if (k.line) for (x = 9; x < 27; x++) px(x, 6 + (x > 18 ? 1 : 0), k.line);
    if (k.spot) { px(11, 6, '#141414'); px(12, 6, '#141414'); px(11, 5, '#141414'); }  // the haddock's black thumbprint
    if (k.spots) for (x = 6; x < 26; x += 3) px(x + (x % 2), 4 + (x % 3), '#5a4a30');
    if (k.stripes) for (x = 8; x < 26; x += 3) { px(x, 3, k.stripes); px(x + 1, 4, k.stripes); px(x, 5, k.stripes); }
    if (k.barbel) { px(2, 9, k.back); px(2, 10, k.back); }
    for (y = 4; y <= 10; y++) px(8 + (y > 7 ? 1 : 0), y, k.back);         // gill
    px(4, 4, '#ffffff'); px(5, 4, '#ffffff'); px(4, 5, '#141414'); px(5, 5, '#ffffff'); // eye
    px(1, 7, '#2a2a2a'); px(2, 7, '#2a2a2a');                               // mouth
    px(10, 9, k.back); px(11, 10, k.back); px(12, 10, k.back);              // pectoral fin
    art[name] = c;
    return c;
  }

  function start(e) {
    env = e;
    S = { phase: 'cut', t: 0, name: KINDS[e.fish] ? e.fish : 'HYSE', cut: 0, pulls: 0, blobs: [], drops: [], gull: null, shine: 0 };
    AU.stopMusic();
  }

  function go(phase) { S.phase = phase; S.t = 0; }

  // Where the belly is, in screen pixels, at fish pixel x.
  function bellyY(x) { return FY + (7 + half(x)) * SCALE - 3; }

  function step() {
    S.t++;
    var i;
    for (i = 0; i < S.blobs.length; i++) {
      var b = S.blobs[i];
      if (b.caught) { b.x = S.gull.x + 8; b.y = S.gull.y + 14; continue; }
      b.t++;
      var u = Math.min(1, b.t / 30);
      b.x = b.x0 + (b.x1 - b.x0) * u; b.y = b.y0 + (b.y1 - b.y0) * u - Math.sin(Math.PI * u) * b.h;
      if (u >= 1 && !b.landed) { b.landed = true; AU.sfx('stomp'); }
    }
    for (i = 0; i < S.drops.length; i++) { S.drops[i].y += S.drops[i].vy; S.drops[i].vy += 0.15; S.drops[i].life--; }
    S.drops = S.drops.filter(function (d) { return d.life > 0; });
    if (S.gull) stepGull();
    if (S.shine > 0) S.shine--;
    var P = S.phase;
    if (P === 'cut') {
      if (env.pressed('right') || env.pressed('jump')) {
        S.cut = Math.min(1, S.cut + 0.012);
        if (S.t % 6 === 0) AU.sfx('cut');
      }
      if (S.cut >= 1) go('guts');
    } else if (P === 'guts') {
      if (S.t > 10 && !S.gull && env.pressed('jumpP') && S.pulls < 3) {
        S.pulls++;
        var bx = FX + 15 * SCALE, by = bellyY(15);
        var last = S.pulls === 3;
        S.blobs.push({ x0: bx, y0: by, x1: last ? bx + 40 : BUCKET[0] + 8 + S.pulls * 3, y1: last ? 40 : BUCKET[1] + 6, h: last ? 30 : 40, t: 0, x: bx, y: by, last: last });
        AU.sfx('kick');
        if (last) S.gull = { x: -20, y: 10, t: 0 };
      }
    } else if (P === 'rinse') {
      if (S.t > 10 && env.pressed('jumpP')) {
        for (i = 0; i < 40; i++) S.drops.push({ x: FX + Math.random() * 34 * SCALE, y: FY - 30 - Math.random() * 40, vy: 1 + Math.random(), life: 50 });
        AU.sfx('splash');
        S.shine = 60;
        go('done');
      }
    } else if (P === 'done') {
      if (S.t === 50) AU.sfx('clear');
      if (S.t > 60 && env.pressed('jumpP')) env.done();
    }
  }

  // The gull swoops down, snatches the last of the guts and is off with it.
  function stepGull() {
    var g = S.gull, last = S.blobs[S.blobs.length - 1];
    g.t++;
    if (!g.got) {
      g.x += (last.x - 8 - g.x) * 0.12 + 1;
      g.y += (last.y - 14 - g.y) * 0.12;
      if (Math.abs(g.x + 8 - last.x) < 6 && Math.abs(g.y + 14 - last.y) < 8) {
        g.got = true; last.caught = true;
        AU.sfx('talk');
      }
    } else {
      g.x += 3; g.y -= 1.2;
      if (g.x > VW + 30) { S.gull = null; S.blobs = S.blobs.filter(function (b) { return !b.caught; }); go('rinse'); }
    }
  }

  // ---------------------------------------------------------------- drawing
  function centered(ctx, text, y, color, scale) {
    F.outline(ctx, text, Math.round((VW - F.width(text, scale || 1)) / 2), y, color, scale || 1, '#000');
  }

  function draw(ctx) {
    var i, x;
    ctx.fillStyle = '#9cc4e4'; ctx.fillRect(0, 0, VW, 60);
    ctx.fillStyle = A.WATER; ctx.fillRect(0, 60, VW, 44);
    ctx.fillStyle = '#8ac4ec';
    for (i = 0; i < 16; i++) ctx.fillRect((i * 47 + (S.t >> 2)) % VW, 66 + (i * 13) % 34, 6, 1);
    // the jetty planks
    for (var y = 104; y < VH; y += 12) {
      ctx.fillStyle = (y / 12) % 2 ? '#8a5c32' : '#9a6a3c';
      ctx.fillRect(0, y, VW, 12);
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(0, y, VW, 1);
    }
    // the cutting board
    ctx.fillStyle = '#6a4a28'; ctx.fillRect(FX - 16, FY + 8, 34 * SCALE + 32, 52);
    ctx.fillStyle = '#c89a62'; ctx.fillRect(FX - 14, FY + 9, 34 * SCALE + 28, 48);
    // the bucket
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(BUCKET[0], BUCKET[1], 34, 30);
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(BUCKET[0] + 2, BUCKET[1], 30, 4);
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(BUCKET[0] + 4, BUCKET[1] + 1, 26, 2);
    // the fish, with the cut opening along its belly
    ctx.drawImage(fishArt(S.name), FX, FY, 34 * SCALE, 14 * SCALE);
    var to = GUT_FROM + (GUT_TO - GUT_FROM) * S.cut;
    for (x = GUT_FROM; x < to; x++) {
      ctx.fillStyle = S.phase === 'cut' || S.phase === 'guts' ? '#a01828' : '#d06070';
      ctx.fillRect(FX + x * SCALE, bellyY(x), SCALE, 3);
    }
    if (S.shine) {
      ctx.fillStyle = '#ffffff';
      for (i = 0; i < 4; i++) if ((S.shine + i * 7) % 20 < 8) ctx.fillRect(FX + 20 + i * 28, FY + 14 + (i % 2) * 8, 2, 2);
    }
    // the knife, while cutting
    if (S.phase === 'cut') {
      var kx = FX + Math.round(to * SCALE), ky = bellyY(Math.floor(to));
      ctx.fillStyle = '#d8dce4';
      for (i = 0; i < 14; i++) ctx.fillRect(kx + Math.round(i * 0.6), ky - i, 3, 1);
      ctx.fillStyle = '#5a3420'; ctx.fillRect(kx + 8, ky - 26, 5, 13);
    }
    // the guts, on their way to the bucket (or the gull)
    for (i = 0; i < S.blobs.length; i++) {
      var b = S.blobs[i];
      ctx.fillStyle = '#8a2030'; ctx.fillRect(Math.round(b.x) - 3, Math.round(b.y) - 2, 6, 4);
      ctx.fillStyle = '#c84a5a'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 3, 2);
    }
    if (S.gull) {
      var flap = Math.floor(S.t / 6) % 2 ? 'walk2' : 'walk1';
      ctx.drawImage(A.enemy.make[flap].l, Math.round(S.gull.x), Math.round(S.gull.y));
      if (S.gull.got) centered(ctx, 'MÅKEN TOK DET!', 30, '#ffffff', 2);
    }
    for (i = 0; i < S.drops.length; i++) {
      ctx.fillStyle = '#c8f0f8';
      ctx.fillRect(Math.round(S.drops[i].x), Math.round(S.drops[i].y), 1, 3);
    }
    F.outline(ctx, S.name, 8, 8, '#ffffff', 2, '#000');
    // what to do now
    ctx.fillStyle = 'rgba(12,26,58,0.88)';
    ctx.fillRect(0, VH - 22, VW, 22);
    var hint = S.phase === 'cut' ? 'HOLD > FOR Å SKJÆRE LANGS BUKEN'
      : S.phase === 'guts' ? 'TRYKK ' + X + ' FOR Å TA UT INNVOLLENE (' + S.pulls + '/3)'
      : S.phase === 'rinse' ? 'TRYKK ' + X + ' FOR Å SKYLLE FISKEN'
      : 'TOVE: TAKK, MAGNE! DA BLIR DET ' + S.name + ' TE MIDDAG.';
    centered(ctx, hint, VH - 15, S.phase === 'done' ? '#c0e0ff' : '#ffffff');
    if (S.phase === 'done') {
      centered(ctx, 'PENT SLØYD!', 40, '#ffe060', 3);
      if (S.t > 60 && (S.t >> 5) & 1) F.draw(ctx, X, VW - 14, VH - 15, '#ffffff');
    }
  }

  SM.gut = { start: start, step: step, draw: draw, fishArt: fishArt, state: function () { return S; } }; // state is for poking at from the console
})();
