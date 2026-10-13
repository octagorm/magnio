// The scene after the credits, as in the films: the birthday cake seen from
// above, and Magne deciding how big a piece to take. Left makes the piece
// smaller, right makes it bigger, and ✕ takes it. We never see the people
// round the table, only what they say, and the bigger the piece, the louder
// they get. Past the whole cake the cut carries on through the plate, the
// tablecloth and the table. Nobody stops him, and it does not matter.
//
// The picture is drawn pixel by pixel from four prepared layers (floor,
// tablecloth, plate, cake), so the cut always has crisp edges.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio;

  var VW = 384, VH = 216;
  var CX = 192, CY = 100, RC = 64, RP = 82;           // centre, cake radius, plate radius
  var RMAX = Math.ceil(Math.sqrt(CX * CX + (VH - CY) * (VH - CY))) + 2; // reaches every corner
  var START = 1 / 12;                                  // an ordinary piece
  var VMAX = 3;                                        // 1 is the whole cake, 2 the whole screen
  var X = '✕';

  // How people react, from the smallest piece to the most outrageous one.
  // n is how many remarks can be on screen at once, scale the largest text.
  var TIERS = [
    { upTo: 0.045, n: 1, scale: 1, lines: ['ER DU SYK, MAGNE?', 'ER DET ALT?', 'BARE EN SMAKEBIT?'] },
    { upTo: 0.11, n: 1, scale: 1, lines: ['VÆR SÅ GOD!', 'TA DU, MAGNE.', 'DET SER GODT UT.'] },
    { upTo: 0.2, n: 2, scale: 1, lines: ['OI.', 'DET VAR ET GODT STYKKE.', 'MMM.'] },
    { upTo: 0.34, n: 2, scale: 1, lines: ['SKAL DU HA SÅ MYE?', 'MAGNE...', 'DU, MAGNE?'] },
    { upTo: 0.55, n: 3, scale: 1, lines: ['DET ER JO HALVE KAKA!', 'VI ANDRE SKAL OGSÅ HA!', 'BESTE!'] },
    { upTo: 0.9, n: 4, scale: 1, lines: ['MAGNE!!', 'HAN TAR HELE!', 'FARMOR, SI NOE!', 'BARNA HAR IKKE FÅTT!'] },
    { upTo: 1.06, n: 4, scale: 1, lines: ['HELE KAKA?!', 'DET ER HELE KAKA!', 'HAN TAR ALT!'] },
    { upTo: 1.33, n: 3, scale: 1, lines: ['IKKE FATET!', 'DET ER DET GODE FATET!', 'HVOR SKAL HAN MED DET?'] },
    { upTo: 1.8, n: 5, scale: 1, lines: ['DUKEN!', 'HELE BORDET?!', 'RING NOEN!', 'STOPP HAM!', 'NEI NEI NEI!'] },
    { upTo: 2.4, n: 5, scale: 2, lines: ['HELE STUA!', 'HELE HUSET!', 'HELE BLÅBÆRÅSEN!', 'HAN ER HELT GAL!',
      'FLAGGSTANGA OGSÅ!', 'HELE HAGEN!'] },
    { upTo: VMAX, n: 6, scale: 2, lines: ['HELE LILLESAND!', 'HELE SØRLANDET!', 'HELE NORGE!', 'HAVET OGSÅ?!', 'AAAAAH!',
      'MAGNE!!!', 'HELE JORDA!', 'NOEN MÅ GJØRE NOE!'] }
  ];

  // What someone says once he has eaten it, one entry per tier.
  var VERDICT = [
    ['ER DET ALT?', 'DET ER LOV Å TA MER, MAGNE.'],
    ['ET HELT VANLIG STYKKE?', 'ER DU SIKKER PÅ AT DU ER FRISK?'],
    ['ET GODT STYKKE.', 'SOM VANLIG.'],
    ['DET VAR ET SKIKKELIG STYKKE.', 'DET GJØR INGENTING. DET ER BURSDAGEN DIN.'],
    ['HALVE KAKA.', 'DET GJØR INGENTING. DET ER BURSDAGEN DIN.'],
    ['NESTEN HELE KAKA.', 'DET GJØR INGENTING. DET ER MER I KJØLESKAPET.'],
    ['HELE KAKA.', 'SELVFØLGELIG.'],
    ['HELE KAKA, OG FATET.', 'DET GJØR INGENTING. VI HAR FLERE FAT.'],
    ['NÅ HAR VI IKKE NOE BORD LENGER.', 'DET GJØR INGENTING. VI SPISER PÅ GULVET.'],
    ['NÅ HAR VI IKKE NOE HUS LENGER.', 'MEN DET GJØR INGENTING.'],
    ['NÅ HAR VI IKKE NOE NORGE LENGER.', 'MEN DET GJØR INGENTING.', 'GRATLA MED DAGEN, MAGNE!']
  ];

  var TEXT_COLORS = ['#ffffff', '#ffe060', '#90d8ff', '#ffb0c8', '#b0ff98'];

  // ---------------------------------------------------------------- layers
  var built = null; // { floor, cloth, plate, full, dist, ang, raw, out, img, g, canvas }

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
  }
  var C = {};
  ['#5a3a1e', '#9a6a3c', '#8a5c32', '#7a4e2a', // seam, plank, plank, grain
    '#fbf3ef', '#ec9a9a', '#c83838', '#d8d0cc', '#c88080', '#a82c2c', // tablecloth, and in the plate's shadow
    '#f4f6fa', '#e2e6ee', '#c0cce0', '#a8b0c0', '#4a70b8', '#d0d4de', '#d8b080', '#fffaf0', // plate
    '#fcf7ee', '#f2eadb', '#ece0cc', '#c8b496', // cream
    '#d82838', '#a01828', '#ff8090', '#f8e070', '#3a8a30', '#ffffff', '#e6e0d6', '#fff2b0', '#ffe060',
    '#3a2010', '#f4f6fa', '#c4c8d0', '#8a909c', '#5a3420', '#7a4a2c', '#d0d0d0'
  ].forEach(function (h) { C[h] = rgb(h); });

  var CANDLES = ['#e04848', '#4890e0', '#f0c030', '#50b050', '#c060d0', '#e08030', '#40c0c0'];

  function hash(x, y) {
    var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function floorAt(x, y) {
    var row = Math.floor(y / 18), off = (row * 53) % 120;
    if (y % 18 === 0 || (x + off) % 120 === 0) return C['#5a3a1e'];
    if (hash(Math.floor((x + off) / 9), y) < 0.1) return C['#7a4e2a'];
    return row % 2 ? C['#9a6a3c'] : C['#8a5c32'];
  }

  function clothAt(x, y, shade) {
    var a = Math.floor(x / 10) % 2, b = Math.floor(y / 10) % 2;
    if (a && b) return shade ? C['#a82c2c'] : C['#c83838'];
    if (a || b) return shade ? C['#c88080'] : C['#ec9a9a'];
    return shade ? C['#d8d0cc'] : C['#fbf3ef'];
  }

  // The plate, with a blue rim. withCake adds the cake's shadow; without it
  // there are crumbs where the cake stood.
  function plateAt(x, y, dx, dy, d, a, withCake) {
    if (d >= RP - 1) return C['#a8b0c0'];
    if (d >= RP - 7 && d < RP - 6) return C['#c0cce0'];
    if (d >= RP - 6) {
      var step = Math.PI * 2 / 40, k = Math.round(a / step);
      if (Math.hypot(dx - Math.cos(k * step) * (RP - 3.5), dy - Math.sin(k * step) * (RP - 3.5)) < 1.3) return C['#4a70b8'];
      return dy > 0 ? C['#e2e6ee'] : C['#f4f6fa'];
    }
    if (withCake) return Math.hypot(dx - 3, dy - 4) < RC ? C['#d0d4de'] : C['#f4f6fa'];
    if (d < RC) {
      var h = hash(x, y);
      if (h < 0.03) return C['#d8b080'];
      if (h < 0.05) return C['#fffaf0'];
    }
    return C['#f4f6fa'];
  }

  // A cream cake with strawberries round the edge, seven candles, and
  // MAGNE 71 written in chocolate (added afterwards with the font).
  function cakeAt(x, y, dx, dy, d, a) {
    if (d >= RC - 1) return C['#c8b496'];
    if (d >= RC - 3) return C['#ece0cc'];
    var step = Math.PI * 2 / 12, R = RC - 11;
    var k = Math.round(a / step);
    var bx = dx - Math.cos(k * step) * R, by = dy - Math.sin(k * step) * R, bd = Math.hypot(bx, by);
    if (bd <= 4.6) {
      if (Math.abs(bx) + Math.abs(by) <= 1.5) return C['#3a8a30'];
      if (bx + by > 4) return C['#a01828'];
      if (bx < -1 && by < -1 && bd > 2) return C['#ff8090'];
      if (hash(x, y) < 0.15) return C['#f8e070'];
      return C['#d82838'];
    }
    k = Math.round((a - step / 2) / step);
    bx = dx - Math.cos(k * step + step / 2) * R; by = dy - Math.sin(k * step + step / 2) * R;
    if (Math.hypot(bx, by) <= 3.6) return bx + by > 1.5 ? C['#e6e0d6'] : C['#ffffff'];
    for (var i = 0; i < CANDLES.length; i++) {
      var ca = -Math.PI / 2 + i * Math.PI * 2 / CANDLES.length;
      var cd = Math.hypot(dx - Math.cos(ca) * 38, dy - Math.sin(ca) * 38);
      if (cd < 1) return C['#ffe060'];
      if (cd < 2) return rgb(CANDLES[i]);
      if (cd < 3.4) return C['#fff2b0'];
    }
    return hash(x, y) < 0.08 ? C['#f2eadb'] : C['#fcf7ee'];
  }

  function build() {
    var canvas = document.createElement('canvas');
    canvas.width = VW; canvas.height = VH;
    var g = canvas.getContext('2d');
    var n = VW * VH;
    var B = {
      floor: new Uint32Array(n), cloth: new Uint32Array(n), plate: new Uint32Array(n),
      dist: new Float32Array(n), ang: new Float32Array(n), raw: new Float32Array(n), canvas: canvas, g: g
    };
    var img = g.createImageData(VW, VH), full = new Uint32Array(img.data.buffer);
    for (var y = 0; y < VH; y++) {
      for (var x = 0; x < VW; x++) {
        var i = y * VW + x, dx = x + 0.5 - CX, dy = y + 0.5 - CY, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        var off = Math.abs(a - Math.PI / 2); // how far round from straight down, towards Magne
        if (off > Math.PI) off = Math.PI * 2 - off;
        B.dist[i] = d; B.ang[i] = off; B.raw[i] = a;
        B.floor[i] = floorAt(x, y);
        B.cloth[i] = clothAt(x, y, false);
        var shade = d >= RP && Math.hypot(dx - 3, dy - 4) < RP;
        B.plate[i] = d < RP ? plateAt(x, y, dx, dy, d, a, false) : clothAt(x, y, shade);
        full[i] = d < RC ? cakeAt(x, y, dx, dy, d, a) : d < RP ? plateAt(x, y, dx, dy, d, a, true) : clothAt(x, y, shade);
      }
    }
    g.putImageData(img, 0, 0);
    F.draw(g, 'MAGNE', CX - Math.round(F.width('MAGNE', 2) / 2), CY - 16, '#5a2e18', 2);
    F.draw(g, '71', CX - Math.round(F.width('71', 2) / 2), CY + 3, '#5a2e18', 2);
    B.full = new Uint32Array(g.getImageData(0, 0, VW, VH).data.buffer.slice(0));
    B.img = g.createImageData(VW, VH);
    B.out = new Uint32Array(B.img.data.buffer);
    return B;
  }

  // ---------------------------------------------------------------- the piece
  // Up to 1 the piece is a wedge of cake centred on Magne's side. Above 1 it
  // is a circle that grows from the cake's edge until it covers everything,
  // slowly at first so there is time to take just the plate.
  function radius(v) { var u = Math.min(v, 2) - 1; return v <= 1 ? RC : RC + u * u * (RMAX - RC); }
  function inside(i, v) {
    var B = built;
    if (v <= 1) return B.dist[i] < RC && B.ang[i] <= v * Math.PI;
    return B.dist[i] <= radius(v);
  }
  // What is left where the piece was.
  function under(v) {
    if (v <= 1) return built.plate;
    return radius(v) <= RP ? built.cloth : built.floor;
  }

  var LAYERS = [rgb('#d8a860'), rgb('#d8a860'), rgb('#c83040'), rgb('#fff4e0'), rgb('#fff4e0')]; // sponge, jam, cream

  function lighten(c, f) {
    var r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
    r += ((255 - r) * f) >> 8; g += ((255 - g) * f) >> 8; b += ((255 - b) * f) >> 8;
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }

  // The knife lies along the right-hand cut, with its tip towards the middle.
  function knifeAt(dx, dy, v) {
    var e = Math.PI / 2 - Math.min(v, 1) * Math.PI;
    var r = radius(v), tip = v <= 1 ? 4 : r - RC + 4, hilt = (v <= 1 ? RC : r) + 3;
    var cs = Math.cos(e), sn = Math.sin(e);
    var along = dx * cs + dy * sn, perp = -dx * sn + dy * cs;
    if (along >= tip && along < hilt) {
      var w = Math.min(3, (along - tip) / 2 + 0.5);
      if (perp > 0 || perp < -w) return 0;
      if (perp > -1) return C['#f4f6fa'];
      return perp < -w + 1 ? C['#8a909c'] : C['#c4c8d0'];
    }
    if (along >= hilt && along < hilt + 25 && Math.abs(perp + 1.5) <= 2) {
      var rivet = (Math.abs(along - hilt - 6) < 0.8 || Math.abs(along - hilt - 18) < 0.8) && Math.abs(perp + 1.5) < 0.8;
      if (rivet) return C['#d0d0d0'];
      return perp > -0.5 ? C['#7a4a2c'] : C['#5a3420'];
    }
    return 0;
  }

  function compose() {
    var B = built, out = B.out, full = B.full, v = S.v, U = under(v), i, x, y;
    if (S.phase === 'choose' || S.phase === 'fade') {
      // The piece is pulled a little towards Magne, and the gap shows the
      // layers inside the cake where it was cut.
      var f = 30 + Math.round(20 * Math.sin(S.t / 8)), r = radius(v), lift = 4 * VW;
      for (y = 0, i = 0; y < VH; y++) {
        for (x = 0; x < VW; x++, i++) {
          var j = i - lift, col;
          if (j >= 0 && inside(j, v)) col = lighten(full[j], f);
          else if (!inside(i, v)) col = full[i];
          else if (v <= 1) col = LAYERS[y % LAYERS.length];
          else col = U[i];
          if (v > 1 && Math.abs(B.dist[i] - r) < 0.9) {
            col = Math.floor((B.raw[i] * r) / 4 + S.t / 4) & 1 ? C['#3a2010'] : C['#ffffff'];
          }
          out[i] = knifeAt(x + 0.5 - CX, y + 0.5 - CY, v) || col;
        }
      }
    } else if (S.phase === 'take') {
      var drop = (Math.floor(S.drop) + 4) * VW;
      for (i = 0; i < out.length; i++) {
        var k = i - drop;
        if (k >= 0 && inside(k, v)) out[i] = full[k];
        else out[i] = inside(i, v) ? U[i] : full[i];
      }
    } else {
      for (i = 0; i < out.length; i++) out[i] = inside(i, v) ? U[i] : full[i];
    }
    B.g.putImageData(B.img, 0, 0);
  }

  // ---------------------------------------------------------------- remarks
  function tierOf(v) {
    for (var i = 0; i < TIERS.length; i++) if (v <= TIERS[i].upTo) return i;
    return TIERS.length - 1;
  }

  function overlaps(x, y, w, h) {
    for (var i = 0; i < S.texts.length; i++) {
      var t = S.texts[i];
      if (x < t.x + t.w + 3 && x + w + 3 > t.x && y < t.y + t.h + 3 && y + h + 3 > t.y) return true;
    }
    return false;
  }

  function hitsCake(x, y, w, h) {
    var nx = Math.max(x, Math.min(CX, x + w)), ny = Math.max(y, Math.min(CY, y + h));
    return Math.hypot(nx - CX, ny - CY) < RC + 4;
  }

  // Remarks come from all round the table. While the piece is sensible they
  // keep off the cake and each other; once it is not, anything goes.
  function say(text, tier, life) {
    for (var s = TIERS[tier].scale; s >= 1; s--) {
      var w = F.width(text, s), h = 7 * s;
      if (w > VW - 8) continue;
      for (var k = 0; k < 40; k++) {
        var x = Math.round(4 + Math.random() * (VW - 8 - w)), y = Math.round(4 + Math.random() * (VH - 24 - h));
        if (tier < 9 && hitsCake(x, y, w, h)) continue;
        if (overlaps(x, y, w, h) && (tier < 9 || k < 30)) continue;
        S.texts.push({ text: text, x: x, y: y, w: w, h: h, s: s, life: life, col: TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)] });
        return true;
      }
    }
    return false;
  }

  function remark(tier) {
    var lines = TIERS[tier].lines, free = lines.filter(function (l) {
      for (var i = 0; i < S.texts.length; i++) if (S.texts[i].text === l) return false;
      return true;
    });
    var pool = free.length ? free : lines;
    return say(pool[Math.floor(Math.random() * pool.length)], tier, tier >= 8 ? 130 : 200);
  }

  // ---------------------------------------------------------------- the scene
  var S = null, env = null;

  function start(e) {
    env = e;
    if (!built) built = build();
    S = { phase: 'wait', t: 0, v: START, tier: tierOf(START), texts: [], heat: 0, cool: 0, fresh: false, hold: 0, drop: 0, fall: 0,
      shake: [0, 0], nams: 0 };
  }

  function go(phase) { S.phase = phase; S.t = 0; }

  function pressed() { return env.pressed('jumpP') || env.pressed('fireP') || env.pressed('startP'); }

  function step() {
    S.t++;
    for (var i = 0; i < S.texts.length; i++) { S.texts[i].life--; if (S.t % 8 === 0) S.texts[i].y--; }
    S.texts = S.texts.filter(function (t) { return t.life > 0; });
    var P = S.phase;
    if (P === 'wait') { if (S.t > 50) go('card'); return; }
    if (P === 'card') { if (S.t > 150 || (S.t > 30 && pressed())) go('fade'); return; }
    if (P === 'fade') {
      if (S.t >= 30) {
        go('choose');
        say('MAGNE, DU FÅR FORSYNE DEG FØRST!', 0, 200);
      }
      return;
    }
    if (P === 'choose') { stepChoose(); return; }
    if (P === 'take') {
      S.fall += 0.3; S.drop += S.fall;
      if (S.drop > VH + 10) go('eat');
      return;
    }
    if (P === 'eat') {
      var count = S.tier >= 8 ? 6 : 3, at = 15 + S.nams * 22;
      if (S.nams < count && S.t >= at) { S.nams++; AU.sfx('kick'); }
      if (S.t === 30 + count * 22) AU.sfx('gulp');
      if (S.t > 80 + count * 22) { go('verdict'); AU.sfx('clear'); }
      return;
    }
    if (P === 'verdict' && S.t > 60 && pressed()) env.done();
  }

  function stepChoose() {
    var dir = (env.pressed('right') ? 1 : 0) - (env.pressed('left') ? 1 : 0);
    if (dir) S.hold++; else S.hold = 0;
    var before = S.v;
    if (dir) {
      var rate = (S.v < 1 ? 0.0018 : 0.003) * Math.min(1.6, 1 + S.hold / 120);
      S.v = Math.max(0.02, Math.min(VMAX, S.v + dir * rate));
    }
    if (S.v !== before) {
      S.heat = 150;
      if (S.t % 7 === 0) AU.sfx('cut');
    }
    var tier = tierOf(S.v);
    if (tier !== S.tier) {
      if (tier > S.tier && tier >= 7) AU.sfx('boom');
      S.tier = tier;
      S.cool = 0;
      S.fresh = true;
    }
    if (S.heat > 0) S.heat--;
    if (S.cool > 0) S.cool--;
    // A new tier gets heard at once: the oldest remark makes room for it.
    if (S.fresh && S.texts.length >= TIERS[tier].n && S.texts[0].life > 15) S.texts[0].life = 15;
    if ((S.heat > 0 || tier >= 8) && S.cool === 0 && S.texts.length < TIERS[tier].n) {
      if (remark(tier)) { AU.sfx('talk'); S.fresh = false; }
      S.cool = tier >= 8 ? 20 : tier >= 5 ? 30 : 45;
    }
    var amp = Math.max(0, tier - 8);
    if (S.t % 2 === 0) S.shake = [Math.round((Math.random() * 2 - 1) * amp), Math.round((Math.random() * 2 - 1) * amp)];
    if (S.t > 20 && (env.pressed('jumpP') || env.pressed('fireP'))) {
      go('take');
      S.shake = [0, 0];
      AU.sfx('jump');
      for (var i = 0; i < S.texts.length; i++) S.texts[i].life = Math.min(S.texts[i].life, 40);
    }
  }

  function centered(ctx, text, y, color, scale) {
    F.outline(ctx, text, Math.round((VW - F.width(text, scale)) / 2), y, color, scale, '#000');
  }

  function draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, VH);
    var P = S.phase;
    if (P === 'wait') return;
    if (P === 'card') {
      if (S.t > 10) centered(ctx, 'LITT SENERE,', 88, '#ffffff', 2);
      if (S.t > 40) centered(ctx, 'PÅ BLÅBÆRÅSEN...', 112, '#ffe060', 2);
      return;
    }
    compose();
    ctx.drawImage(built.canvas, S.shake[0], S.shake[1]);
    for (var i = 0; i < S.texts.length; i++) {
      var t = S.texts[i];
      if (t.life < 12 && (t.life >> 1) & 1) continue;
      F.outline(ctx, t.text, t.x, Math.round(t.y), t.col, t.s, '#000');
    }
    if (P === 'fade') {
      ctx.globalAlpha = 1 - S.t / 30;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;
    }
    if (P === 'choose') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, VH - 14, VW, 14);
      centered(ctx, '< MINDRE    STØRRE >    ' + X + ' FORSYN DEG', VH - 10, '#ffffff', 1);
    }
    if (P === 'eat') {
      // Low on the screen, on Magne's side of the table: he is the one eating.
      var words = [];
      for (i = 0; i < S.nams; i++) words.push('NAM');
      if (words.length) centered(ctx, words.join(' '), VH - 28, '#ffffff', 2);
    }
    if (P === 'verdict') {
      var lines = VERDICT[S.tier], h = lines.length * 14 + 14;
      ctx.fillStyle = 'rgba(12,26,58,0.88)';
      ctx.fillRect(40, 70, VW - 80, h);
      for (i = 0; i < lines.length; i++) centered(ctx, lines[i], 78 + i * 14, i ? '#ffffff' : '#ffe060', 1);
      if (S.t > 60 && (S.t >> 5) & 1) F.draw(ctx, X, VW - 52, 70 + h - 10, '#ffffff');
    }
  }

  SM.cake = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
