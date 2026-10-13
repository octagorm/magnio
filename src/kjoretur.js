// The drive round Harøya, started from the red car in the level. Seen from
// above, the road runs to the right with the mountainside on one side and
// the ditch on the other. It starts wide and slow, and gets narrower,
// faster and twistier, so sooner or later Magnio leaves it. Then we see
// it from the side: the car rolls a long way down the hill and lands on
// its roof. It goes quiet. Magnio crawls out without a scratch, and a
// see-through blue angel is standing next to him. He had a guardian angel.
//
// Up and down steer. There is no way to lose, only to finish.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216;
  var CAR_X = 80;                 // where the car sits on the screen while driving
  var TOP_MIN = 26, BOTTOM_MAX = VH - 44; // the road always leaves this much mountain and slope in view
  var X = '✕';

  // ---------------------------------------------------------------- the road
  // Distance d is in pixels along the road.
  function roadWidth(d) { return Math.max(13, 116 - d / 48); }
  function roadCentre(d) {
    var amp = Math.min(64, 8 + d / 90), w = roadWidth(d);
    var c = 104 + amp * (0.62 * Math.sin(d / 160) + 0.38 * Math.sin(d / 71 + 1.3));
    return Math.max(TOP_MIN + w / 2, Math.min(BOTTOM_MAX - w / 2, c));
  }
  function speed(d) { return Math.min(5.5, 1.5 + d / 1300); }

  function hash(x, y) {
    var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
  }
  var C = {};
  ['#62626a', '#6e6e76', '#7c7c84', '#8a8a92', '#5a7a48', '#4a4a52', '#9a9480', '#4c4c56', '#55555f', '#e8e8e8',
    '#f0d040', '#5a9a3a', '#2e4a24', '#3a5a7a', '#6a8aa8', '#4a8a32', '#428030', '#8a5a8a', '#909098'
  ].forEach(function (h) { C[h] = rgb(h); });
  var ROCK = [C['#62626a'], C['#6e6e76'], C['#7c7c84'], C['#8a8a92']];

  // One pixel of the road seen from above, at road distance wx and height y.
  function roadPixel(wx, y, top, bot, mid) {
    if (y < top - 3) {
      var h = hash(wx >> 2, y >> 2);
      if (h < 0.04) return C['#5a7a48'];                       // a tuft of moss
      if (y > top - 9 && hash(wx, y) < 0.5) return C['#62626a']; // shadow at the foot of the rock
      return ROCK[Math.floor(h * 4)];
    }
    if (y === top - 3) return C['#4a4a52'];
    if (y < top) return C['#9a9480'];
    if (y <= bot) {
      if (bot - top > 16 && (y === top + 1 || y === bot - 1)) return C['#e8e8e8'];
      if (y === mid && (wx >> 3) % 3 !== 0) return C['#f0d040']; // Norwegian roads have a yellow middle line
      return hash(wx, y) < 0.06 ? C['#55555f'] : C['#4c4c56'];
    }
    var b = y - bot;
    if (b <= 2) return C['#9a9480'];
    if (b <= 6) return C['#5a9a3a'];
    if (b <= 11) {
      if (b === 7 || b === 11) return C['#2e4a24'];
      return b === 9 && hash(wx >> 2, 1) < 0.5 ? C['#6a8aa8'] : C['#3a5a7a']; // water in the ditch
    }
    var g = hash(wx >> 1, y >> 1);
    if (g < 0.02) return C['#8a5a8a'];                         // heather
    if (g < 0.03) return C['#909098'];                         // a stone
    return (y + (wx >> 3)) % 7 < 3 ? C['#428030'] : C['#4a8a32'];
  }

  // ---------------------------------------------------------------- the hill
  // From the side. The road is up at the top left; the slope runs down to a
  // flat meadow by the sea at the bottom right.
  var HILL_W = 1300, HILL_H = 560, ROAD_Y = 70, MEADOW_Y = 510, SLOPE_FROM = 90, SLOPE_TO = 900;
  function ground(x) {
    var u = Math.max(0, Math.min(1, (x - SLOPE_FROM) / (SLOPE_TO - SLOPE_FROM)));
    return ROAD_Y + (MEADOW_Y - ROAD_Y) * (1 - (1 - u) * (1 - u)); // steep below the road, levelling out at the bottom
  }
  function slope(x) { return (ground(x + 1) - ground(x - 1)) / 2; }
  var ROCKS = [[180, 3], [260, 2], [420, 4], [520, 2], [640, 3], [760, 2], [980, 3]];
  var SHEEP = [[340, 1], [1180, -1], [1230, 1]];

  // ---------------------------------------------------------------- state
  var S = null, env = null, buf = null, img = null, out = null, sea = null;

  function start(e) {
    env = e;
    if (!buf) {
      buf = document.createElement('canvas');
      buf.width = VW; buf.height = VH;
      img = buf.getContext('2d').createImageData(VW, VH);
      out = new Uint32Array(img.data.buffer);
      sea = A.seaStrip(VW);
    }
    S = { phase: 'ready', t: 0, d: 0, y: roadCentre(CAR_X), vy: 0, shake: 0, parts: [], hit: null };
    AU.stopMusic();
  }

  function go(phase) { S.phase = phase; S.t = 0; }

  function puff(x, y, n, col) {
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n + Math.random();
      S.parts.push({ x: x, y: y, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.6 - 0.4, life: 24 + Math.random() * 10, col: col || '#d8d0c0' });
    }
  }

  function step() {
    S.t++;
    if (S.shake > 0) S.shake--;
    for (var i = 0; i < S.parts.length; i++) { var p = S.parts[i]; p.x += p.vx; p.y += p.vy; p.life--; }
    S.parts = S.parts.filter(function (p) { return p.life > 0; });
    var P = S.phase;
    if (P === 'ready') {
      if (S.t === 1 || S.t === 41 || S.t === 81) AU.sfx('talk');
      if (S.t >= 120) { go('drive'); AU.sfx('jump'); AU.startMusic('bil'); }
    } else if (P === 'drive') stepDrive();
    else if (P === 'skid') stepSkid();
    else if (P === 'gone') { if (S.t > 50) startRoll(); }
    else if (P === 'roll') stepRoll();
    else if (P === 'still') { if (S.t > 110) { go('out'); AU.sfx('puff'); } }
    else if (P === 'out') { if (S.t > 70) { go('angel'); AU.sfx('power'); } }
    else if (P === 'angel') { if (S.t > 150 && (env.pressed('jumpP') || env.pressed('fireP') || env.pressed('startP'))) env.done(); }
  }

  function stepDrive() {
    var v = speed(S.d), dir = (env.pressed('down') ? 1 : 0) - (env.pressed('up') ? 1 : 0);
    var max = 1.3 + v * 0.4;
    S.vy += dir ? dir * 0.35 : -S.vy * 0.25;
    S.vy = Math.max(-max, Math.min(max, S.vy));
    S.y += S.vy;
    S.d += v;
    // the car's front and back must both stay on the road
    for (var k = 0; k < 2; k++) {
      var wd = S.d + CAR_X + k * 23, c = roadCentre(wd), w = roadWidth(wd);
      if (S.y - 5 < c - w / 2) return crash('fjell');
      if (S.y + 5 > c + w / 2) return crash('grøft');
    }
  }

  function crash(what) {
    S.hit = what;
    S.v = speed(S.d);
    S.vy = what === 'fjell' ? 2.4 : 1.2; // off the rock and across, or straight over the edge
    S.ang = 0;
    S.shake = 14;
    AU.stopMusic();
    AU.sfx('brk');
    puff(CAR_X + (what === 'fjell' ? 18 : 12), S.y + (what === 'fjell' ? -6 : 6), 10, what === 'fjell' ? '#a0a0a8' : '#d8d0c0');
    go('skid');
  }

  // The car spins off the road, over the ditch and away down the slope.
  function stepSkid() {
    S.d += S.v;
    S.v *= 0.95;
    S.vy += 0.12;
    S.y += S.vy;
    S.ang += 0.22;
    if (S.t % 6 === 0) puff(CAR_X + 12, S.y, 2, '#c8c0a8');
    if (S.t === 12) AU.sfx('fall');
    if (S.y > VH + 20) go('gone');
  }

  function startRoll() {
    S.car = { x: 66, v: 1.6, dist: 0, quarter: 0, stopped: false };
    go('roll');
    AU.sfx('boom');
  }

  // Down the hill, a quarter turn at a time, until it comes to rest on its roof.
  function stepRoll() {
    var c = S.car;
    if (!c.stopped) {
      var s = slope(c.x);
      c.v += s > 0.05 ? 0.07 * s : -0.09;
      // keep rolling all the way down, and then until it lands on the roof
      if (c.quarter % 4 !== 2 || c.x < SLOPE_TO - 60) c.v = Math.max(c.v, 0.8);
      c.v = Math.max(0, Math.min(6, c.v));
      c.x = Math.min(HILL_W - 80, c.x + c.v);
      c.dist += c.v;
      var q = Math.floor(c.dist / 16);
      if (q !== c.quarter) {
        c.quarter = q;
        AU.sfx(q % 3 ? 'bump' : 'brk');
        puff(c.x, ground(c.x), 5);
        S.shake = Math.min(6, Math.round(c.v * 1.5));
      }
      if (c.v === 0 && c.quarter % 4 === 2) { c.stopped = true; go('still'); }
    }
    S.camX = Math.max(0, Math.min(HILL_W - VW, c.x - 150));
    S.camY = Math.max(0, Math.min(HILL_H - VH, ground(c.x) - 130));
  }

  // ---------------------------------------------------------------- drawing
  function drawRoad(ctx) {
    var x, y, i;
    var tops = [], bots = [], mids = [];
    for (x = 0; x < VW; x++) {
      var wd = S.d + x, c = roadCentre(wd), w = roadWidth(wd);
      tops[x] = Math.round(c - w / 2); bots[x] = Math.round(c + w / 2); mids[x] = Math.round(c);
    }
    for (y = 0, i = 0; y < VH; y++) {
      for (x = 0; x < VW; x++, i++) out[i] = roadPixel(Math.floor(S.d) + x, y, tops[x], bots[x], mids[x]);
    }
    buf.getContext('2d').putImageData(img, 0, 0);
    var sx = S.shake ? (S.t % 2 ? 2 : -2) : 0;
    ctx.drawImage(buf, sx, 0);
    if (S.phase !== 'gone') {
      var car = A.car.top;
      if (S.phase === 'skid') {
        ctx.save();
        ctx.translate(CAR_X + 12 + sx, Math.round(S.y));
        ctx.rotate(S.ang);
        ctx.drawImage(car, -12, -6);
        ctx.restore();
      } else {
        ctx.drawImage(car, CAR_X + sx, Math.round(S.y) - 6);
      }
    }
    drawParts(ctx, 0, 0);
    var km = (S.d / 2000).toFixed(1).replace('.', ',') + ' KM';
    F.outline(ctx, km, 8, 6, '#ffffff', 1, '#000');
    if (S.phase === 'ready') {
      var word = S.t < 40 ? 'KLAR...' : S.t < 80 ? 'FERDIG...' : 'KJØR!';
      F.outline(ctx, word, Math.round((VW - F.width(word, 3)) / 2), 80, '#ffe060', 3, '#000');
      centered(ctx, 'OPP OG NED STYRER', 120, '#ffffff');
    } else if (S.phase === 'drive' && S.t < 200) {
      centered(ctx, 'OPP OG NED STYRER', VH - 14, '#ffffff');
    }
  }

  function drawParts(ctx, cx, cy) {
    for (var i = 0; i < S.parts.length; i++) {
      var p = S.parts[i];
      ctx.globalAlpha = Math.min(1, p.life / 12);
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawHill(ctx) {
    var cx = Math.round(S.camX), cy = Math.round(S.camY), x, i;
    var shake = S.shake ? (S.t % 2 ? 2 : -2) : 0;
    ctx.fillStyle = '#8cc0e8';
    ctx.fillRect(0, 0, VW, VH);
    // the sea far below, moving a little with the camera
    var seaY = Math.round(150 - cy * 0.25);
    ctx.drawImage(sea, 0, seaY);
    ctx.fillStyle = A.WATER_DEEP;
    ctx.fillRect(0, seaY + 56, VW, VH);
    // the mountain wall above the road, at the far left
    ctx.fillStyle = '#6e6e76';
    ctx.fillRect(-cx + shake, 0, 26, ROAD_Y - cy);
    // the hillside
    for (x = 0; x < VW; x++) {
      var wx = x + cx, gy = Math.round(ground(wx)) - cy;
      ctx.fillStyle = '#4a8a32';
      ctx.fillRect(x + shake, gy, 1, VH - gy);
      ctx.fillStyle = '#6ab048';
      ctx.fillRect(x + shake, gy, 1, 2);
      for (var k = 0; k < 3; k++) {
        var h = hash(wx, k);
        if (h < 0.3) { ctx.fillStyle = h < 0.05 ? '#8a5a8a' : '#428030'; ctx.fillRect(x + shake, gy + 4 + Math.floor(hash(k, wx) * 40), 1, 2); }
      }
    }
    // the road at the top, and a snow pole at its edge
    ctx.fillStyle = '#4c4c56';
    ctx.fillRect(-cx + shake, ROAD_Y - cy, SLOPE_FROM - 2, 3);
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(SLOPE_FROM - 8 - cx + shake, ROAD_Y - 18 - cy, 2, 18);
    ctx.fillStyle = '#e03020'; ctx.fillRect(SLOPE_FROM - 8 - cx + shake, ROAD_Y - 18 - cy, 2, 4);
    for (i = 0; i < ROCKS.length; i++) {
      var r = ROCKS[i];
      A.disc(ctx, r[0] - cx + shake, Math.round(ground(r[0])) - cy, r[1] + 2, r[1], '#808088');
      A.disc(ctx, r[0] - cx + shake - 1, Math.round(ground(r[0])) - cy - 1, r[1], r[1] - 1, '#a0a0a8');
    }
    for (i = 0; i < SHEEP.length; i++) {
      var sh = A.decor.sau, sx = SHEEP[i][0] - cx + shake, sy = Math.round(ground(SHEEP[i][0] + 9)) - cy - sh.height;
      if (SHEEP[i][1] > 0) ctx.drawImage(sh, sx, sy);
      else { ctx.save(); ctx.translate(sx + sh.width, sy); ctx.scale(-1, 1); ctx.drawImage(sh, 0, 0); ctx.restore(); }
    }
    // the car, a quarter turn at a time so the pixels stay square
    var c = S.car, side = A.car.side;
    var lift = c.stopped ? 0 : Math.round(Math.abs(Math.sin(Math.PI * (c.dist % 16) / 16)) * Math.min(10, c.v * 2));
    var tipped = c.quarter % 2 === 1, half = tipped ? 16 : 7;
    var carX = Math.round(c.x) - cx + shake, carY = Math.round(ground(c.x)) - cy - half - lift;
    // Magnio crawls out from behind the car
    var me = A.player.magnio.normal[env.big ? 'big' : 'small'];
    if (S.phase === 'out' || S.phase === 'angel') {
      var u = S.phase === 'out' ? Math.min(1, S.t / 50) : 1;
      var spr = (u < 1 ? (Math.floor(S.t / 6) % 2 ? me.walk1 : me.walk2) : me.stand).r;
      ctx.drawImage(spr, Math.round(carX + u * 26), Math.round(ground(c.x + u * 26) - cy - spr.height));
    }
    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate((c.quarter % 4) * Math.PI / 2);
    ctx.drawImage(side, -16, -7);
    ctx.restore();
    drawParts(ctx, cx - shake, cy);
    if (S.phase === 'angel') drawAngel(ctx, carX + 52, Math.round(ground(c.x + 52)) - cy);
  }

  function drawAngel(ctx, x, feet) {
    var a = A.angel, bob = Math.round(Math.sin(S.t / 14) * 2);
    ctx.globalAlpha = Math.min(0.6, S.t / 100);
    ctx.drawImage(a, x, feet - a.height - 6 + bob);
    ctx.globalAlpha = 1;
    if (S.t > 20) {
      for (var i = 0; i < 5; i++) {
        var k = (S.t + i * 23) % 60;
        ctx.globalAlpha = 1 - k / 60;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4 + ((i * 7) % 20), feet - 10 - k * 0.6, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    if (S.t > 60) {
      ctx.fillStyle = 'rgba(12,26,58,0.85)';
      ctx.fillRect(60, 14, VW - 120, 40);
      centered(ctx, 'ENGLEVAKT!', 20, '#c8e4ff', 2);
      centered(ctx, 'MAGNIO: I HADDE ENGLEVAKT!', 40, '#ffffff');
    }
    if (S.t > 150 && (S.t >> 5) & 1) F.draw(ctx, X, VW - 14, VH - 12, '#ffffff');
  }

  function centered(ctx, text, y, color, scale) {
    F.outline(ctx, text, Math.round((VW - F.width(text, scale || 1)) / 2), y, color, scale || 1, '#000');
  }

  function draw(ctx) {
    var P = S.phase;
    if (P === 'ready' || P === 'drive' || P === 'skid' || P === 'gone') drawRoad(ctx);
    else drawHill(ctx);
  }

  SM.drive = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
