// Super Magnio: game state, physics, story, map and drawing.
//
// Forgiving by design, without saying so on screen:
// - there is no timer, no lives and no game over
// - falling into water (or stomach acid) puts you back on the last safe ground
// - getting hit when small knocks you back and costs a few coins, nothing more
// - jumps still work for a moment after walking off a ledge (coyote time),
//   and a jump pressed a little early is remembered (jump buffer)
// - clipping the corner of a block nudges you past it instead of stopping you
// - enemies are slow, stomps count even when the timing is a bit late,
//   and a sliding crab shell never hurts a player
(function () {
  var SM = window.SM;
  var A = SM.art, F = SM.font, AU = SM.audio, IN = SM.input;

  var TS = 16, VW = 384, VH = 216, OFFY = -8;
  var GROUND_Y = 12 * TS;
  var SEA_Y = 136;
  var SMALL_H = 15, BIG_H = 29;
  var FLAG_LOW = GROUND_Y - 22, FLAG_HIGH = 42; // the flag goes up the pole at the end

  var JUMP_V = 5.2;          // take-off speed
  var GRAV_HOLD = 0.18;      // rising with jump held
  var GRAV_RELEASE = 0.42;   // rising with jump released (short hop)
  var GRAV_FALL = 0.3;
  var MAX_FALL = 4.5;
  var WALK_MAX = 1.45;
  var COYOTE = 12;           // frames you can still jump after leaving a ledge
  var JUMP_BUFFER = 15;      // frames an early jump press is remembered
  var ENEMY_SPEED = 0.35;
  var COGNAC_FRAMES = 600;

  // The order of the story. Moraira and Praha are side trips from Værnes:
  // they open together with Lillesand, and can be skipped.
  var ORDER = ['haroya', 'hvalen', 'trondheim', 'heim', 'varnes', 'lillesand'];
  var SIDE = ['moraira', 'praha'];
  var MAPLIST = ['haroya', 'hvalen', 'trondheim', 'heim', 'varnes', 'moraira', 'praha', 'lillesand'];

  var PROLOGUE = [
    { art: 'magnio', text: 'DET ER EN HELT SPESIELL DAG FOR MAGNIO.' },
    { art: 'kasse', text: 'MEN I NATT FORSVANT DEN RØDE VERKTØYKASSA HANS!' },
    { art: 'skurk', text: 'NOEN SÅ EN MYSTISK MANN I FRAKK OG HATT LUSKE AV GÅRDE MED DEN.' },
    { art: null, text: 'SPORENE PEKER MOT HARØYA, DER MAGNIO VOKSTE OPP.' }
  ];

  // What each part of a level looks like in the background, and what fills its gaps.
  var THEMES = {
    havn: { back: 'sea' }, by: { back: 'sea' }, skog: { back: 'ridge' },
    haroy: { back: 'fjell' }, kai: { back: 'fjell' }, trd: { back: 'elv' }, heim: { back: 'fjell' },
    fly: { back: 'terminal' }, spania: { back: 'med', liquid: 'med' }, praha: { back: 'praha' },
    hval: { back: 'ribs', liquid: 'acid' }
  };
  var LIQUIDS = {
    water: { top: A.WATER, deep: A.WATER_DEEP, hi: '#8ac4ec', drop: '#b8e0f8' },
    acid: { top: '#8ab830', deep: '#5a8a22', hi: '#d8f070', drop: '#d8f070' },
    med: { top: '#2aa8c8', deep: '#1a88b0', hi: '#c8f0f8', drop: '#c8f0f8' }
  };

  // How each enemy reacts to being stomped. Fliers ignore the ground.
  var ENEMY = {
    bill: { stomp: 'flat', text: 'BETALT!' },
    flatt: { stomp: 'flat' },
    reke: { stomp: 'flat' },
    krabbe: { stomp: 'shell' },
    koffert: { stomp: 'flat' },
    make: { stomp: 'dead', fly: true },
    due: { stomp: 'dead', fly: true },
    manet: { stomp: 'dead', bob: true },
    fisk: { stomp: 'dead', leap: true }
  };

  // Where scenery sits: on the ground (default), out on the sea, or in the sky.
  var ANCHOR = { holme: 'sea', fyr: 'sea', hvalhale: 'sea', seilbat: 'boat', bat: 'boat', hvalbat: 'boat', sildebat: 'boat',
    gull: 'air', tavle: 'wall' };

  var canvas = document.getElementById('screen');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Scale by a whole number of physical screen pixels, so every game pixel
  // is exactly the same size. Working in physical pixels (not CSS pixels)
  // lets the game fill almost all of a high-resolution screen.
  function resize() {
    if (!window.innerWidth || !window.innerHeight) return; // hidden window; wait for a real size
    var dpr = window.devicePixelRatio || 1;
    var s = Math.floor(Math.min(window.innerWidth * dpr / VW, window.innerHeight * dpr / VH));
    if (s < 1) s = Math.min(window.innerWidth * dpr / VW, window.innerHeight * dpr / VH);
    canvas.style.width = (VW * s / dpr) + 'px';
    canvas.style.height = (VH * s / dpr) + 'px';
  }
  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);
  resize();

  var SOLID = { '#': 1, 'B': 1, '?': 1, 'M': 1, 'K': 1, 'C': 1, 'U': 1, 'X': 1, '[': 1, ']': 1, '{': 1, '}': 1 };
  var NOINPUT = { left: false, right: false, up: false, down: false, jump: false, fire: false, start: false,
    leftP: false, rightP: false, upP: false, downP: false, jumpP: false, fireP: false, startP: false, anyP: false };

  var G = {
    state: 'title', t: 0, L: null, levelId: 'haroya', boats: [], gate: null, players: [], enemies: [], npcs: [], trees: [], items: [], shots: [],
    parts: [], texts: [], bumps: [], camX: 0, freeze: 0, end: null, paused: false, coinHits: {},
    flagY: FLAG_LOW, intro: 0, talk: null, near: null, story: null, mapSel: 0, fade: 0, p2Device: null,
    save: null
  };
  SM.G = G; // handy for poking at from the browser console

  // ?x=150 starts the first level played at that tile column, for testing.
  var startCol = parseInt((/[?&]x=(\d+)/.exec(location.search) || [])[1], 10);
  // ?til=kart and the like jump straight to a scene; ?snarvei lists them all.
  var shortcut = (/[?&]til=([\w-]+)/.exec(location.search) || [])[1] || null;

  // ---------------------------------------------------------------- saving
  // Progress lives in this browser only. ?ny in the address starts over.
  var SAVE_KEY = 'super-magnio';
  function freshSave() {
    return { open: { haroya: true }, done: {}, clues: [], prologue: false, gloves: false,
      wallet: [{ coins: 0, power: 0 }, { coins: 0, power: 0 }] };
  }
  function loadSave() {
    var s = null;
    if (/[?&]ny\b/.test(location.search)) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* no storage */ } }
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { s = null; }
    var f = freshSave();
    if (!s || typeof s !== 'object') return f;
    for (var k in f) if (s[k] === undefined) s[k] = f[k];
    return s;
  }
  function writeSave() {
    if (shortcut) return; // a shortcut never touches the real save
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* no storage */ }
  }
  G.save = loadSave();

  function levelDef(id) { return SM.levelDefs[id]; }
  function playable(id) { var d = levelDef(id); return !!d && typeof d.build === 'function' && !!G.save.open[id]; }

  // ---------------------------------------------------------------- helpers
  function ov(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function tileAt(tx, ty) {
    var L = G.L;
    if (ty < 0 || ty >= L.height || tx < 0 || tx >= L.width) return '.';
    return L.grid[ty][tx];
  }

  function solidAt(tx, ty) {
    var L = G.L;
    if (tx < 0 || tx >= L.width) return true;
    if (ty < 0 || ty >= L.height) return false;
    return SOLID[L.grid[ty][tx]] === 1;
  }

  function overlapsSolid(e) {
    var x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - 0.01) / TS);
    var y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h - 0.01) / TS);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return true;
    return false;
  }

  function liquidAt(x) {
    var th = THEMES[G.L.themeAt[Math.max(0, Math.min(G.L.width - 1, Math.floor(x / TS)))]];
    return LIQUIDS[(th && th.liquid) || 'water'];
  }

  function addText(x, y, text, color) {
    G.texts.push({ x: x, y: y, text: text, color: color || '#fff', life: 50 });
  }

  function part(o) {
    o.vx = o.vx || 0; o.vy = o.vy || 0; o.g = o.g || 0; o.life = o.life || 30;
    o.max = o.life;
    G.parts.push(o);
  }

  function splash(x, y) {
    var col = liquidAt(x).drop;
    for (var i = 0; i < 10; i++) {
      part({ kind: 'drop', color: col, x: x + (Math.random() - 0.5) * 10, y: y || GROUND_Y + 4,
        vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2.5, g: 0.2, life: 30 });
    }
    AU.sfx('splash');
  }

  function puff(x, y, n) {
    for (var i = 0; i < (n || 6); i++) {
      var a = Math.PI * 2 * i / (n || 6);
      part({ kind: 'puff', x: x, y: y, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8, life: 22 });
    }
  }

  function anyPressed(what) {
    for (var id in IN.devices) if (IN.devices[id][what]) return id;
    return null;
  }

  // Break text into lines of at most n characters.
  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + ' ' + words[i] : words[i];
      if (next.length > n && cur) { lines.push(cur); cur = words[i]; } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------------------------------------------------------------- movement
  // Move horizontally and stop at walls. Returns true on a wall hit.
  function moveX(e) {
    e.x += e.vx;
    var top = Math.floor(e.y / TS), bot = Math.floor((e.y + e.h - 0.01) / TS), tx, ty;
    if (e.vx > 0) {
      tx = Math.floor((e.x + e.w - 0.01) / TS);
      for (ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { e.x = tx * TS - e.w; e.vx = 0; return true; }
    } else if (e.vx < 0) {
      tx = Math.floor(e.x / TS);
      for (ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * TS; e.vx = 0; return true; }
    }
    return false;
  }

  // Move vertically, land on floors, and (for players) hit blocks from below.
  function moveY(e, player) {
    var prevTop = e.y;
    e.y += e.vy;
    e.onGround = false;
    var l = Math.floor(e.x / TS), r = Math.floor((e.x + e.w - 0.01) / TS), tx, ty;
    if (player && e.vy >= 0) {
      for (var b = 0; b < G.boats.length; b++) {
        var bt = G.boats[b];
        if (prevTop + e.h <= bt.y + 1 && e.y + e.h >= bt.y && e.x + e.w > bt.x + 2 && e.x < bt.x + bt.w - 2) {
          e.y = bt.y - e.h; e.vy = 0; e.onGround = true; e.boat = bt;
          return;
        }
      }
    }
    if (e.vy >= 0) {
      ty = Math.floor((e.y + e.h) / TS);
      for (tx = l; tx <= r; tx++) {
        if (solidAt(tx, ty)) { e.y = ty * TS - e.h; e.vy = 0; e.onGround = true; return; }
      }
      return;
    }
    ty = Math.floor(e.y / TS);
    var hits = [];
    for (tx = l; tx <= r; tx++) if (solidAt(tx, ty)) hits.push(tx);
    if (hits.length) {
      // Only the corner clipped a block: slide past it instead of bonking.
      if (player && hits.length === 1 && l !== r) {
        var over = hits[0] === l ? (l + 1) * TS - e.x : e.x + e.w - r * TS;
        if (over <= 5) {
          if (hits[0] === l) e.x = (l + 1) * TS; else e.x = r * TS - e.w;
          return;
        }
      }
      e.y = (ty + 1) * TS;
      e.vy = 0;
      if (player) {
        var mid = Math.floor((e.x + e.w / 2) / TS);
        hitBlock(hits.indexOf(mid) >= 0 ? mid : hits[0], ty, e);
      }
      return;
    }
    // Hidden blocks only appear when bumped from underneath.
    if (player && prevTop >= (ty + 1) * TS - 0.01) {
      for (tx = l; tx <= r; tx++) {
        if (tileAt(tx, ty) === 'h') {
          G.L.grid[ty][tx] = 'U';
          e.y = (ty + 1) * TS;
          e.vy = 0;
          bump(tx, ty);
          part({ kind: 'bag', x: tx * TS, y: (ty - 1) * TS, vy: -2.5, g: 0.08, life: 45 });
          e.coins += 10;
          addText(tx * TS + 8, (ty - 1) * TS, '+10 KR', '#ffe060');
          AU.sfx('power');
          return;
        }
      }
    }
  }

  // ---------------------------------------------------------------- blocks
  function bump(tx, ty) {
    G.bumps.push({ tx: tx, ty: ty, t: 0 });
    // Anything standing on a bumped block gets knocked off it.
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (!alive(e) || ENEMY[e.type].fly || ENEMY[e.type].bob || ENEMY[e.type].leap) continue;
      var bottom = e.y + e.h;
      if (bottom >= ty * TS - 2 && bottom <= ty * TS + 2 && e.x + e.w > tx * TS && e.x < (tx + 1) * TS) {
        killEnemy(e, 1);
      }
    }
  }

  function coinPop(tx, ty, p) {
    part({ kind: 'coin', x: tx * TS, y: (ty - 1) * TS, vy: -4.5, g: 0.3, life: 28 });
    p.coins += 1;
    AU.sfx('coin');
  }

  function hitBlock(tx, ty, p) {
    var L = G.L, c = L.grid[ty][tx];
    if (c === '?') {
      L.grid[ty][tx] = 'U'; bump(tx, ty); coinPop(tx, ty, p);
    } else if (c === 'M') {
      L.grid[ty][tx] = 'U'; bump(tx, ty); spawnItem(p.power === 0 ? 'choc' : (G.save.gloves ? 'hansker' : 'cigar'), tx, ty);
    } else if (c === 'K') {
      L.grid[ty][tx] = 'U'; bump(tx, ty); spawnItem('cognac', tx, ty);
    } else if (c === 'C') {
      var k = tx + ',' + ty;
      G.coinHits[k] = (G.coinHits[k] || 0) + 1;
      if (G.coinHits[k] >= 8) L.grid[ty][tx] = 'U';
      bump(tx, ty); coinPop(tx, ty, p);
    } else if (c === 'B') {
      if (p.power > 0) {
        L.grid[ty][tx] = '.';
        bump(tx, ty);
        var x = tx * TS, y = ty * TS;
        part({ kind: 'debris', x: x, y: y, vx: -1.2, vy: -5, g: 0.3, life: 60 });
        part({ kind: 'debris', x: x + 8, y: y, vx: 1.2, vy: -5, g: 0.3, life: 60 });
        part({ kind: 'debris', x: x, y: y + 8, vx: -1.2, vy: -3.5, g: 0.3, life: 60 });
        part({ kind: 'debris', x: x + 8, y: y + 8, vx: 1.2, vy: -3.5, g: 0.3, life: 60 });
        AU.sfx('brk');
      } else {
        bump(tx, ty); AU.sfx('bump');
      }
    } else {
      AU.sfx('bump');
    }
  }

  // ---------------------------------------------------------------- items
  function spawnItem(type, tx, ty) {
    G.items.push({ type: type, x: tx * TS + 1, y: ty * TS, w: 14, h: 16, vx: 0, vy: 0, emerging: 16, onGround: false });
    AU.sfx('sprout');
  }

  // Boats go back and forth across the water and wait a while at each end.
  function updateBoats() {
    for (var i = 0; i < G.boats.length; i++) {
      var b = G.boats[i];
      b.dx = 0;
      if (b.wait > 0) { b.wait--; continue; }
      b.dx = b.dir * 0.8;
      b.x += b.dx;
      if (b.dir > 0 && b.x >= b.x1) { b.x = b.x1; b.dir = -1; b.wait = 120; }
      if (b.dir < 0 && b.x <= b.x0) { b.x = b.x0; b.dir = 1; b.wait = 120; }
    }
  }

  function updateItems() {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.emerging > 0) {
        it.y -= 0.5;
        it.emerging -= 0.5;
        if (it.emerging <= 0) {
          if (it.type === 'choc') it.vx = 0.7;
          if (it.type === 'cognac') { it.vx = 1.0; it.vy = -3; }
        }
        continue;
      }
      if (it.type === 'cigar' || it.type === 'hansker') continue;
      it.vy = Math.min(it.vy + 0.22, 4);
      var v = it.vx;
      if (moveX(it)) it.vx = -v;
      moveY(it, false);
      if (it.type === 'cognac' && it.onGround) it.vy = -4;
      if (it.y > GROUND_Y + 4) { splash(it.x + it.w / 2); it.dead = true; }
    }
    G.items = G.items.filter(function (it) { return !it.dead; });
  }

  function grow(p, power) {
    if (p.power === 0) {
      p.y -= BIG_H - SMALL_H;
      p.h = BIG_H;
      p.growT = 48;
      G.freeze = 48;
    }
    p.power = power;
  }

  function collect(p, it) {
    it.dead = true;
    AU.sfx('power');
    if (it.type === 'choc') {
      if (p.power === 0) grow(p, 1);
      else { p.coins += 5; addText(it.x + 7, it.y, '+5 KR', '#ffe060'); }
      addText(it.x + 7, it.y - 10, 'NAM!', '#fff');
    } else if (it.type === 'cigar') {
      grow(p, 2);
      addText(it.x + 7, it.y - 10, 'AAH!', '#fff');
    } else if (it.type === 'hansker') {
      grow(p, 2);
      addText(it.x + 7, it.y - 10, 'KLAR FOR KAMP!', '#ffd060');
    } else if (it.type === 'cognac') {
      p.star = COGNAC_FRAMES;
      addText(it.x + 7, it.y - 10, 'SKÅL!', '#ffd060');
    }
  }

  // ---------------------------------------------------------------- enemies
  function makeEnemy(type, tx, ty) {
    var e = { type: type, x: tx * TS + 2, y: (ty + 1) * TS - 14, w: 12, h: 14, vx: -ENEMY_SPEED, vy: 0,
      state: 'walk', t: 0, active: false, onGround: false, kickT: 0 };
    if (ENEMY[type].fly) { e.y = ty * TS; e.vx = -0.5; e.h = 10; }
    if (ENEMY[type].bob) { e.y = ty * TS; e.vx = 0; e.h = 12; }
    if (ENEMY[type].leap) { e.y = GROUND_Y + 10; e.vx = 0; e.vy = 0; e.h = 10; e.wait = 30 + (tx * 13) % 90; }
    e.baseX = e.x; e.baseY = e.y;
    e.t = Math.floor(tx * 7) % 60;
    return e;
  }

  function killEnemy(e, dir) {
    e.state = 'dead';
    e.vy = -3.5;
    e.vx = (dir || 1) * 0.8;
    AU.sfx('kick');
  }

  function toShell(e) {
    var bottom = e.y + e.h;
    e.state = 'shell';
    e.vx = 0;
    e.h = 9;
    e.y = bottom - 9;
  }

  function alive(e) {
    if (ENEMY[e.type].leap && e.y > GROUND_Y) return false;
    return e.active && e.state !== 'dead' && e.state !== 'flat';
  }

  function updateEnemies() {
    var i, j, e, o;
    for (i = 0; i < G.enemies.length; i++) {
      e = G.enemies[i];
      if (!e.active) {
        if (e.x < G.camX + VW + 32 && e.x > G.camX - 64) e.active = true;
        else continue;
      }
      e.t++;
      if (e.state === 'dead') {
        e.vy += 0.25; e.x += e.vx; e.y += e.vy;
        if (e.y > VH + 64) e.gone = true;
        continue;
      }
      if (e.state === 'flat') {
        if (--e.life <= 0) e.gone = true;
        continue;
      }
      var kind = ENEMY[e.type];
      if (kind.fly) {
        e.x += e.vx;
        if (Math.abs(e.x - e.baseX) > 96) e.vx = -e.vx;
        e.y = e.baseY + Math.sin(e.t * 0.05) * 8;
        continue;
      }
      if (kind.bob) {
        e.y = e.baseY + Math.sin(e.t * 0.035) * 18;
        continue;
      }
      if (kind.leap) {
        if (e.wait > 0) {
          if (--e.wait === 0) { e.vy = -5.4; splash(e.x + 6); }
          continue;
        }
        e.vy += 0.15;
        e.y += e.vy;
        if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; e.wait = 100 + Math.floor(Math.random() * 80); }
        continue;
      }
      if (e.kickT > 0) e.kickT--;
      e.vy = Math.min(e.vy + 0.25, 4);
      var v = e.vx;
      if (moveX(e)) {
        e.vx = -v;
        if (e.state === 'slide' && Math.abs(e.x - G.camX - VW / 2) < VW) AU.sfx('bump');
      }
      moveY(e, false);
      if (e.y > GROUND_Y + 4) { splash(e.x + e.w / 2); e.gone = true; }
      if (e.state === 'slide') {
        if (e.x < G.camX - 200 || e.x > G.camX + VW + 200) e.gone = true;
        for (j = 0; j < G.enemies.length; j++) {
          o = G.enemies[j];
          if (o !== e && alive(o) && ov(e, o)) killEnemy(o, e.vx > 0 ? 1 : -1);
        }
      } else if (e.state === 'walk') {
        for (j = 0; j < G.enemies.length; j++) {
          o = G.enemies[j];
          var ok = ENEMY[o.type];
          if (o === e || o.state !== 'walk' || !o.active || ok.fly || ok.bob || ok.leap || !ov(e, o)) continue;
          if ((e.vx < 0 && o.x < e.x) || (e.vx > 0 && o.x > e.x)) e.vx = -e.vx;
        }
      }
    }
    G.enemies = G.enemies.filter(function (en) { return !en.gone; });
  }

  // ---------------------------------------------------------------- smoke rings
  function shoot(p) {
    var n = 0;
    for (var i = 0; i < G.shots.length; i++) if (G.shots[i].owner === p) n++;
    if (n >= 2) return;
    if (G.save.gloves) {
      // A punch sends a short shockwave instead of a smoke ring.
      G.shots.push({ owner: p, punch: true, x: p.facing > 0 ? p.x + p.w : p.x - 10, y: p.y + (p.power > 0 ? 10 : 2),
        w: 10, h: 12, vx: p.facing * 3.2, t: 0 });
      p.shotCd = 16;
      p.punchT = 10;
      AU.sfx('punch');
      return;
    }
    G.shots.push({ owner: p, x: p.facing > 0 ? p.x + p.w : p.x - 8, y: p.y + (p.power > 0 ? 8 : 4),
      w: 8, h: 8, vx: p.facing * 2.4, t: 0 });
    p.shotCd = 14;
    AU.sfx('puff');
  }

  function updateShots() {
    for (var i = 0; i < G.shots.length; i++) {
      var s = G.shots[i];
      s.t++;
      s.x += s.vx;
      if (s.punch && s.t > 24) { s.dead = true; continue; }
      if (!s.punch) s.y += Math.sin(s.t * 0.25) * 0.6;
      var cx = Math.floor((s.x + 4) / TS), cy = Math.floor((s.y + 4) / TS);
      if (solidAt(cx, cy) || s.t > 90 || s.x < G.camX - 16 || s.x > G.camX + VW + 16) {
        puff(s.x + 4, s.y + 4, 4);
        s.dead = true;
        continue;
      }
      for (var j = 0; j < G.enemies.length; j++) {
        var e = G.enemies[j];
        if (alive(e) && ov(s, e)) { killEnemy(e, s.vx > 0 ? 1 : -1); puff(s.x + 4, s.y + 4, 4); s.dead = true; break; }
      }
      if (s.punch && !s.dead) {
        for (j = 0; j < G.trees.length; j++) {
          var tr = G.trees[j];
          if (tr.state === 'stand' && ov(s, { x: tr.x + 14, y: GROUND_Y - 48, w: 12, h: 48 })) {
            fellTree(tr, s.vx > 0 ? 1 : -1, s.owner);
            puff(s.x + 4, s.y + 4, 4);
            s.dead = true;
            break;
          }
        }
      }
    }
    G.shots = G.shots.filter(function (s) { return !s.dead; });
  }

  // ---------------------------------------------------------------- players
  function makePlayer(idx, device, x, y) {
    return {
      idx: idx, device: device, ch: idx === 0 ? 'magnio' : 'frodigi', name: idx === 0 ? 'MAGNIO' : 'FRODIGI',
      x: x, y: y, w: 12, h: SMALL_H, vx: 0, vy: 0, onGround: false, facing: 1, power: 0, inv: 0, star: 0,
      coyote: 0, jumpBuf: 0, jumping: false, anim: 0, state: 'play', coins: 0, shotCd: 0,
      safeX: x, safeB: y + SMALL_H, rescueT: 0, growT: 0, smokeT: 0, prevBottom: y + SMALL_H
    };
  }

  // Coins and power carry over from level to level.
  function applyWallet(p) {
    var w = G.save.wallet[p.idx];
    p.coins = w.coins;
    if (w.power > 0) {
      p.power = w.power;
      p.y -= BIG_H - SMALL_H;
      p.h = BIG_H;
    }
  }
  function storeWallet() {
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      G.save.wallet[p.idx] = { coins: p.coins, power: p.power };
    }
  }

  function hurt(p, e) {
    if (p.inv > 0 || p.star > 0 || p.state !== 'play') return;
    if (p.power === 2) {
      p.power = 1;
      p.inv = 120;
      G.freeze = 20;
      AU.sfx('down');
    } else if (p.power === 1) {
      p.power = 0;
      p.y += BIG_H - SMALL_H;
      p.h = SMALL_H;
      p.growT = -30;
      G.freeze = 30;
      p.inv = 120;
      AU.sfx('down');
    } else {
      var lost = Math.min(p.coins, 5);
      p.coins -= lost;
      for (var i = 0; i < lost; i++) {
        part({ kind: 'coin', x: p.x, y: p.y - 8, vx: (Math.random() - 0.5) * 3, vy: -3 - Math.random() * 2, g: 0.2, life: 40 });
      }
      addText(p.x + 6, p.y - 10, lost ? '-' + lost + ' KR' : 'AU!', '#ff8080');
      var dir = e && e.x > p.x ? -1 : 1;
      p.vx = dir * 1.5;
      p.vy = -3;
      p.inv = 120;
      AU.sfx('hurt');
    }
  }

  // Open ground at or to the left of column tx, two tiles wide.
  function groundNear(tx) {
    for (var x = tx; x >= 0; x--) {
      if (tileAt(x, 12) === '#' && tileAt(x + 1, 12) === '#' && !solidAt(x, 11) && !solidAt(x, 10)) {
        return { x: x * TS + 2, b: GROUND_Y };
      }
    }
    return { x: G.L.start.x * TS + 2, b: GROUND_Y };
  }

  // Where to put a player back after falling in: the last solid spot they
  // stood on, as long as it is still there and on screen.
  function safeSpot(p) {
    var tx = Math.floor((p.safeX + p.w / 2) / TS);
    var ty = Math.floor(p.safeB / TS);
    var onScreen = p.safeX >= G.camX && p.safeX <= G.camX + VW - p.w;
    if (onScreen && solidAt(tx, ty) && !solidAt(tx, ty - 1)) return { x: p.safeX, b: p.safeB };
    return groundNear(Math.floor(p.fallX / TS));
  }

  function startRescue(p) {
    p.state = 'rescue';
    p.rescueT = 50;
    p.fallX = p.x;
    p.vx = 0; p.vy = 0;
  }

  function finishRescue(p) {
    var p1 = G.players[0];
    var spot;
    if (p !== p1 && p1.state === 'play' && p1.onGround) spot = { x: p1.x, b: p1.y + p1.h };
    else spot = safeSpot(p);
    p.x = spot.x;
    p.y = spot.b - p.h;
    p.vx = 0; p.vy = 0;
    p.state = 'play';
    p.inv = 100;
    puff(p.x + p.w / 2, p.y + p.h / 2, 8);
  }

  function updatePlayer(p, inp) {
    if (p.state === 'rescue') {
      if (--p.rescueT <= 0) finishRescue(p);
      return;
    }
    if (p.state !== 'play') return;
    if (p.boat && p.onGround) p.x += p.boat.dx;
    p.boat = null;
    p.prevBottom = p.y + p.h;

    var left = inp.left && !inp.right, right = inp.right && !inp.left;
    var accel = p.onGround ? 0.06 : 0.045, turn = p.onGround ? 0.14 : 0.08;
    if (right) {
      p.vx += p.vx < 0 ? turn : accel;
      p.facing = 1;
    } else if (left) {
      p.vx -= p.vx > 0 ? turn : accel;
      p.facing = -1;
    } else {
      var fr = p.onGround ? 0.07 : 0.02;
      if (p.vx > 0) p.vx = Math.max(0, p.vx - fr); else p.vx = Math.min(0, p.vx + fr);
    }
    if (p.vx > WALK_MAX) p.vx = WALK_MAX;
    if (p.vx < -WALK_MAX) p.vx = -WALK_MAX;

    if (inp.jumpP) p.jumpBuf = JUMP_BUFFER; else if (p.jumpBuf > 0) p.jumpBuf--;
    if (p.onGround) p.coyote = COYOTE; else if (p.coyote > 0) p.coyote--;
    if (!inp.jump) p.jumping = false;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -(JUMP_V + Math.abs(p.vx) * 0.2);
      p.jumping = true;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      AU.sfx('jump');
    }

    var g = p.vy < 0 ? (p.jumping ? GRAV_HOLD : GRAV_RELEASE) : GRAV_FALL;
    p.vy = Math.min(p.vy + g, MAX_FALL);

    moveX(p);
    moveY(p, true);

    // coins in the air
    var L = G.L;
    var x0 = Math.floor(p.x / TS), x1 = Math.floor((p.x + p.w - 0.01) / TS);
    var y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 0.01) / TS);
    for (var ty = Math.max(0, y0); ty <= Math.min(L.height - 1, y1); ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        if (tileAt(tx, ty) === 'o') { L.grid[ty][tx] = '.'; p.coins++; AU.sfx('coin'); }
      }
    }

    // remember the last spot with solid ground under both feet
    if (p.onGround) {
      var fy = Math.floor((p.y + p.h + 1) / TS);
      if (solidAt(x0, fy) && solidAt(x1, fy)) { p.safeX = p.x; p.safeB = p.y + p.h; }
    }

    if (p.power === 2 && inp.fireP && p.shotCd <= 0) shoot(p);
    if (p.shotCd > 0) p.shotCd--;
    if (p.inv > 0) p.inv--;
    if (p.star > 0) p.star--;
    p.anim += Math.abs(p.vx) * 0.11;

    if (p.punchT > 0) p.punchT--;
    if (p.power === 2 && !G.save.gloves && ++p.smokeT % 45 === 0) {
      var ex = p.facing > 0 ? 15 : 0, ey = p.power > 0 ? 9 : 6;
      var sprH = p.power > 0 ? 32 : 16;
      part({ kind: 'smoke', x: p.x - 2 + ex, y: p.y + p.h - sprH + ey - 2, vx: p.facing * 0.1, vy: -0.4, life: 40 });
    }

    if (p.y > GROUND_Y + 4) { splash(p.x + p.w / 2); startRescue(p); }
  }

  function collidePlayers() {
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      if (p.state !== 'play') continue;
      var inp = IN.devices[p.device] || NOINPUT;

      for (var k = 0; k < G.items.length; k++) {
        var it = G.items[k];
        if (!it.dead && !(it.emerging > 0) && ov(p, it)) collect(p, it);
      }

      for (var j = 0; j < G.enemies.length; j++) {
        var e = G.enemies[j];
        if (!alive(e)) continue;
        var hb = { x: e.x + 1, y: e.y + 3, w: e.w - 2, h: e.h - 3 };
        if (!ov(p, hb)) continue;
        if (p.star > 0) { killEnemy(e, p.facing); continue; }
        if (e.state === 'shell') {
          e.state = 'slide';
          e.vx = (p.x + p.w / 2 < e.x + e.w / 2 ? 1 : -1) * 3.0;
          e.kickT = 12;
          AU.sfx('kick');
          continue;
        }
        var fromAbove = (p.vy > 0 && p.prevBottom <= e.y + 8) || p.y + p.h <= e.y + 6;
        if (fromAbove) {
          var kind = ENEMY[e.type];
          if (kind.stomp === 'flat') {
            e.state = 'flat'; e.life = 40; e.vx = 0;
          } else if (kind.stomp === 'dead') {
            killEnemy(e, p.facing);
          } else if (e.state === 'walk') {
            toShell(e);
          } else if (e.state === 'slide') {
            e.state = 'shell'; e.vx = 0;
          }
          if (kind.text) addText(e.x + 6, e.y - 6, kind.text, '#ff6060');
          AU.sfx('stomp');
          p.y = e.y - p.h;
          p.vy = inp.jump ? -5 : -3.6;
          p.jumping = inp.jump;
          continue;
        }
        if (e.state === 'slide') continue; // a sliding crab shell never hurts a player
        hurt(p, e);
      }
    }
  }

  // ---------------------------------------------------------------- trees
  // Some pines can be felled with a punch from the boxing gloves. They tip
  // over slowly, then faster, land with a thump, and give a few coins of
  // firewood money.
  function fellTree(tr, dir, p) {
    tr.state = 'fall'; tr.dir = dir; tr.t = 0; tr.by = p;
    AU.sfx('brk');
    addText(tr.x + 20, GROUND_Y - 60, 'TØMMER!', '#ffe060');
  }

  function updateTrees() {
    for (var i = 0; i < G.trees.length; i++) {
      var tr = G.trees[i];
      if (tr.state !== 'fall') continue;
      tr.t++;
      tr.ang += tr.dir * (0.01 + tr.t * 0.0025);
      if (Math.abs(tr.ang) >= Math.PI / 2) {
        tr.ang = tr.dir * Math.PI / 2;
        tr.state = 'down';
        AU.sfx('boom');
        var h = A.decor[tr.kind].height;
        for (var k = 0; k < 5; k++) puff(tr.x + 20 + tr.dir * (h * (0.3 + k * 0.15)), GROUND_Y - 4, 4);
        var p = tr.by || G.players[0];
        if (p) {
          p.coins += 5;
          addText(tr.x + 20 + tr.dir * h * 0.5, GROUND_Y - 24, '+5 KR', '#ffe060');
          AU.sfx('coin');
        }
      }
    }
  }

  function drawTrees(cx) {
    for (var i = 0; i < G.trees.length; i++) {
      var tr = G.trees[i], img = A.decor[tr.kind], x = Math.round(tr.x - cx);
      if (x > VW + img.height || x + img.width < -img.height) continue;
      if (!tr.ang) { ctx.drawImage(img, x, GROUND_Y - img.height + OFFY); continue; }
      // pivot at the foot of the trunk; lying flat it is a whole quarter turn, so the pixels stay square
      ctx.save();
      ctx.translate(x + 20, GROUND_Y + OFFY);
      ctx.rotate(tr.ang);
      ctx.drawImage(img, -20, -img.height);
      ctx.restore();
      if (tr.state === 'down') { ctx.fillStyle = '#a85a30'; ctx.fillRect(x + 18, GROUND_Y + OFFY - 3, 5, 3); } // the stump
    }
  }

  // Someone fishing off the end of the jetty: a rod, a line and a float
  // that bobs, and now and then dips when something bites. What comes up is
  // a bit random, but haddock most often, since that was Tove's favourite.
  var CATCH = [['HYSE', 40], ['MAKRELL', 20], ['TORSK', 15], ['SEI', 15], ['LYR', 10]];
  function pickCatch() {
    var r = Math.random() * 100;
    for (var i = 0; i < CATCH.length; i++) { r -= CATCH[i][1]; if (r < 0) return CATCH[i][0]; }
    return CATCH[0][0];
  }

  // The table the catch lands on: the 'sloye' thing in the level.
  function fishTable() {
    for (var i = 0; i < G.npcs.length; i++) if (G.npcs[i].game === 'sloye') return G.npcs[i];
    return null;
  }

  // While fishing: the first bite comes quickly, then one every eight
  // seconds or so. The fish flies straight up onto the table behind her.
  function stepFishing(n) {
    n.fishT++;
    if (n.fishT === n.nextBite) {
      n.caught = pickCatch();
      n.catchT = 0;
      n.nextBite = n.fishT + 420 + Math.floor(Math.random() * 240);
      addText(n.x + 30, n.y - 6, n.caught + '!', '#c0e0ff');
      AU.sfx('splash');
    }
    if (n.catchT >= 0 && ++n.catchT > 40) {
      n.catchT = -1;
      var table = fishTable();
      if (table && table.table.length < 3) table.table.push(n.caught);
      AU.sfx('stomp');
    }
  }

  function drawFishing(cx) {
    for (var i = 0; i < G.npcs.length; i++) {
      var n = G.npcs[i];
      if (!n.fishing) continue;
      var x = Math.round(n.x - cx), y = n.y + OFFY;
      if (x < -60 || x > VW) continue;
      var hx = x + 12, hy = y + 15, tx = x + 30, ty = y - 3;
      ctx.fillStyle = '#6a4a2a';
      for (var k = 0; k <= 18; k++) ctx.fillRect(Math.round(hx + (tx - hx) * k / 18), Math.round(hy + (ty - hy) * k / 18), 1, 1);
      var bite = n.nextBite - n.fishT < 30, fx = x + 44, fy = GROUND_Y + 6 + OFFY - 2 + (bite ? 3 : Math.round(Math.sin(G.t / 20)));
      ctx.fillStyle = '#d8d8d8';
      for (k = 0; k <= 14; k++) ctx.fillRect(Math.round(tx + (fx + 1 - tx) * k / 14), Math.round(ty + (fy - ty) * k / 14), 1, 1);
      ctx.fillStyle = '#e03020'; ctx.fillRect(fx, fy, 3, 2);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(fx, fy + 2, 3, 2);
      // the catch, flying over her head onto the table
      var table = fishTable();
      if (n.catchT >= 0 && table) {
        var u = n.catchT / 40, ex = Math.round(table.x - cx) + 1, ey = table.y + OFFY - 10;
        var sx = fx - 16 + (ex - (fx - 16)) * u, sy = fy - 8 + (ey - (fy - 8)) * u - Math.sin(Math.PI * u) * 40;
        ctx.drawImage(SM.gut.fishArt(n.caught), Math.round(sx), Math.round(sy));
      }
    }
  }


  // ---------------------------------------------------------------- people
  // dance: hops and turns. ball: has a football at his feet. ends: talking to
  // this person finishes the level. game: talking starts a minigame, and the
  // level carries on afterwards. still: a thing rather than a person, which
  // does not turn to face you. follow: walks along behind Magnio as far as
  // that column, and once he has gone on past it, stays there and fishes
  // (and then says fishLines instead of lines). runAt: once Magnio is past
  // that column, she runs on ahead to her fishing spot.
  function makeNpc(n) {
    var spr = A.npc[n.look].r;
    return { look: n.look, name: n.name, lines: n.lines, clue: n.clue, dance: n.dance, ball: n.ball, ends: n.ends,
      hearts: n.hearts, gives: n.gives, pays: n.pays, auto: n.auto, game: n.game, still: n.still,
      follow: n.follow ? n.follow * TS : 0, runAt: n.runAt ? n.runAt * TS : 0, running: false,
      fishT: 0, nextBite: 90, catchT: -1, table: [],
      fishLines: n.fishLines, fishing: false, walking: false, faceLeft: false,
      x: n.x * TS, y: ((n.y || 11) + 1) * TS - spr.height, w: spr.width, h: spr.height };
  }

  // Followers keep a little behind Magnio, walking along the ground.
  function updateNpcs() {
    var p = G.players[0];
    for (var i = 0; i < G.npcs.length; i++) {
      var n = G.npcs[i];
      n.walking = false;
      if (n.fishing) { stepFishing(n); continue; }
      if (!n.follow || !p || p.state !== 'play') continue;
      if (n.runAt && !n.running && p.x > n.runAt) {
        n.running = true;
        addText(n.x + 8, n.y - 8, 'EG GÅR OG FISKE!', '#c0e0ff');
      }
      var target = n.running ? n.follow : Math.max(0, Math.min(n.follow, p.x - 22)), dx = target - n.x;
      if (Math.abs(dx) > 3) {
        n.x += Math.sign(dx) * (n.running ? 2.4 : Math.min(1.6, 0.5 + Math.abs(dx) * 0.05));
        n.walking = true;
        n.faceLeft = dx < 0;
      } else {
        n.faceLeft = p.x + p.w / 2 < n.x + 8;
      }
      if ((n.running || p.x > n.follow + 3 * TS) && Math.abs(n.x - n.follow) <= 4) { n.x = n.follow; n.fishing = true; n.faceLeft = false; }
    }
  }

  // Whoever is within reach. Something that starts a minigame wins over a
  // person standing next to it (Tove walks right up to the Catan table),
  // and otherwise the nearest one does.
  function findNear() {
    G.near = null;
    var best = Infinity;
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      if (p.state !== 'play' || !p.onGround) continue;
      for (var j = 0; j < G.npcs.length; j++) {
        var n = G.npcs[j], d = Math.abs(p.x + p.w / 2 - (n.x + n.w / 2));
        if (d < 20 + n.w / 2 && p.y + p.h > n.y && p.y < n.y + n.h) {
          var score = n.game && (n.game !== 'sloye' || n.table.length) ? d - 1000 : d;
          if (score < best) { best = score; G.near = { npc: n, player: p }; }
        }
      }
    }
  }

  function startTalk(n) {
    if (n.game === 'sloye' && n.table.length) {
      // a fish on the table: straight to gutting it
      startMinigame('sloye', { fish: n.table.shift() });
      return;
    }
    var pages = (n.fishing && n.fishLines ? n.fishLines : n.lines).slice(), game = n.game === 'sloye' ? null : n.game;
    if (n.clue && G.save.clues.indexOf(n.clue) < 0) pages.push('NYTT SPOR: ' + n.clue);
    G.talk = { npc: n, pages: pages, page: 0, t: 0, game: game };
    AU.sfx('talk');
  }

  function stepTalk() {
    var T = G.talk;
    T.t++;
    if (T.t < 8) return;
    if (anyPressed('jumpP') || anyPressed('upP') || anyPressed('fireP')) {
      T.page++;
      T.t = 0;
      AU.sfx('talk');
      if (T.page >= T.pages.length) {
        if (T.npc.clue && G.save.clues.indexOf(T.npc.clue) < 0) {
          G.save.clues.push(T.npc.clue);
          writeSave();
          AU.sfx('power');
        }
        G.talk = null;
        for (var i = 0; i < G.players.length; i++) G.players[i].jumpBuf = 0;
        if (T.npc.gives === 'hansker' && !G.save.gloves) {
          G.save.gloves = true;
          writeSave();
          for (i = 0; i < G.players.length; i++) {
            var gp = G.players[i];
            grow(gp, 2);
            addText(gp.x + 6, gp.y - 12, 'BOKSEHANSKER!', '#ffd060');
          }
        }
        if (T.npc.pays) {
          G.players[0].coins += T.npc.pays;
          addText(T.npc.x + 8, T.npc.y - 8, '+' + T.npc.pays + ' KR', '#ffe060');
          AU.sfx('coin');
        }
        if (T.npc.ends === 'box') startBox();
        else if (T.npc.ends) startTalkEnd(T.npc);
        else if (T.game) startMinigame(T.game);
      }
    }
  }

  // ---------------------------------------------------------------- camera
  // The camera follows Magnio. He can walk freely inside a calm zone in the
  // middle of the screen; the camera only moves when he walks out of it, so
  // turning around does not swing the view. Frodigi is kept on screen and
  // fetched back to Magnio if the screen edge pushes him into a wall.
  var CALM_LEFT = 0.38, CALM_RIGHT = 0.56;
  function updateCamera() {
    var p = G.players[0];
    var maxX = G.L.width * TS - VW;
    if (G.end && G.end.type === 'whale') {
      G.camX += (maxX - G.camX) * 0.07;
      return;
    }
    if (!p || p.state === 'gone' || p.state === 'cut') return;
    var px = p.x + p.w / 2, target = G.camX;
    if (px > G.camX + VW * CALM_RIGHT) target = px - VW * CALM_RIGHT;
    else if (px < G.camX + VW * CALM_LEFT) target = px - VW * CALM_LEFT;
    target = Math.max(0, Math.min(maxX, target));
    G.camX += (target - G.camX) * 0.2;
    G.camX = Math.max(0, Math.min(maxX, G.camX));
  }

  function clampPlayers() {
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      if (p.state !== 'play') continue;
      if (p.x < G.camX) { p.x = G.camX; if (p.vx < 0) p.vx = 0; }
      if (p.x + p.w > G.camX + VW) { p.x = G.camX + VW - p.w; if (p.vx > 0) p.vx = 0; }
      if (i > 0 && overlapsSolid(p)) {
        var p1 = G.players[0];
        p.x = p1.x; p.y = p1.y + p1.h - p.h; p.vx = 0; p.vy = 0;
        puff(p.x + p.w / 2, p.y + p.h / 2, 6);
      }
    }
  }

  // ---------------------------------------------------------------- level endings
  // flag: the flag goes up at home, then the clear panel.
  // whale: a whale swallows everyone and the next level starts inside it.
  // spout: the blowhole shoots everyone out, then the clear panel.
  function checkEnding() {
    var E = G.L.ending;
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      if (p.state !== 'play') continue;
      if (E.type === 'flag' && p.x + p.w >= G.L.poleX - 1 && p.x <= G.L.poleX + 1 && p.y < GROUND_Y) { startFlag(p); return; }
      if (E.type === 'whale' && p.x > E.x * TS) { startWhale(); return; }
      if (E.type === 'spout' && p.x + p.w > E.x * TS + 4 && p.x < E.x * TS + 28) { startSpout(); return; }
    }
  }

  function freezePlayers(state) {
    for (var i = 0; i < G.players.length; i++) {
      var q = G.players[i];
      if (q.state === 'rescue') { q.x = G.camX + VW / 2; q.y = GROUND_Y - q.h; }
      q.state = state;
      q.vx = 0; q.vy = 0; q.star = 0; q.inv = 0;
    }
  }

  function startFlag(p) {
    var L = G.L;
    var bonus = Math.max(1, Math.round((GROUND_Y - (p.y + p.h)) / 20));
    p.coins += bonus;
    addText(L.poleX - 10, p.y, '+' + bonus + ' KR', '#ffe060');
    G.end = { type: 'flag', phase: 'slide', t: 0, wait: 0 };
    AU.stopMusic();
    AU.sfx('flag');
    freezePlayers('flag');
    for (var i = 0; i < G.players.length; i++) {
      var q = G.players[i];
      q.facing = 1;
      q.x = L.poleX - q.w - 1;
      if (q.y + q.h > GROUND_Y) q.y = GROUND_Y - q.h;
    }
  }

  function startWhale() {
    G.end = { type: 'whale', phase: 'rise', t: 0, wy: GROUND_Y + 30, jaw: 0 };
    AU.stopMusic();
    freezePlayers('cut');
  }

  function startSpout() {
    G.end = { type: 'spout', phase: 'blast', t: 0 };
    AU.stopMusic();
    AU.sfx('spout');
    freezePlayers('cut');
    for (var i = 0; i < G.players.length; i++) {
      G.players[i].x = G.L.ending.x * TS + 10;
      G.players[i].vy = -1;
    }
  }

  // talk: the level ends after a chat, with hearts if it is that kind of meeting.
  function startTalkEnd(n) {
    G.end = { type: 'talk', phase: 'hearts', t: 0, x: n.x + 8, y: n.y, hearts: n.hearts };
    AU.stopMusic();
    AU.sfx('clear');
    freezePlayers('flag');
  }

  // gates: at Værnes you pick where to fly by pressing up at a gate.
  function findGate() {
    G.gate = null;
    var E = G.L.ending, p = G.players[0];
    if (E.type !== 'gates' || !p || p.state !== 'play' || !p.onGround) return;
    for (var i = 0; i < E.gates.length; i++) {
      var gx = E.gates[i].x * TS;
      if (p.x + p.w / 2 > gx + 4 && p.x + p.w / 2 < gx + 44) { G.gate = E.gates[i]; return; }
    }
  }
  function startFlight(gate) {
    G.end = { type: 'fly', phase: 'go', t: 0, to: gate.to, label: gate.label };
    AU.stopMusic();
    AU.sfx('spout');
    freezePlayers('gone');
  }

  function firework(x, y) {
    var cols = ['#ff5050', '#ffe060', '#60c0ff', '#ffffff', '#80ff80'];
    var col = cols[Math.floor(Math.random() * cols.length)];
    for (var i = 0; i < 28; i++) {
      var a = Math.PI * 2 * i / 28, sp = 1.2 + Math.random() * 0.6;
      part({ kind: 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.02, life: 50, color: col });
    }
    AU.sfx('boom');
  }

  // Save progress and open the next level. Returns the id of the next one.
  function finishLevel() {
    storeWallet();
    var id = G.levelId, next = 'lillesand';
    G.save.done[id] = true;
    var i = ORDER.indexOf(id);
    if (i >= 0 && i + 1 < ORDER.length) next = ORDER[i + 1];
    if (i === ORDER.length - 1) next = id;
    G.save.open[next] = true;
    if (id === 'varnes') for (var k = 0; k < SIDE.length; k++) G.save.open[SIDE[k]] = true;
    writeSave();
    return next;
  }

  function stepEnding() {
    var E = G.end, L = G.L, i, q;
    E.t++;
    if (E.type === 'flag') {
      if (E.phase === 'slide') {
        var done = true;
        for (i = 0; i < G.players.length; i++) {
          q = G.players[i];
          if (q.y + q.h < GROUND_Y) { q.y = Math.min(GROUND_Y - q.h, q.y + 2); done = false; }
        }
        if (G.flagY > FLAG_HIGH) { G.flagY = Math.max(FLAG_HIGH, G.flagY - 1.5); done = false; }
        if (done && ++E.wait > 20) {
          E.phase = 'walk';
          for (i = 0; i < G.players.length; i++) { G.players[i].x = L.poleX + 3; G.players[i].state = 'walkout'; }
        }
      } else if (E.phase === 'walk') {
        var all = true;
        for (i = 0; i < G.players.length; i++) {
          q = G.players[i];
          if (q.state === 'gone') continue;
          q.x += 1; q.vx = 1; q.anim += 0.12; q.onGround = true; q.y = GROUND_Y - q.h;
          if (q.x + q.w / 2 >= L.ending.doorX) q.state = 'gone'; else all = false;
        }
        if (all) { E.phase = 'fire'; E.t = 0; AU.sfx('clear'); }
      } else if (E.phase === 'fire') {
        var cx = L.ending.doorX;
        if (E.t === 40) firework(cx - 30, 50);
        if (E.t === 70) firework(cx + 34, 40);
        if (E.t === 100) firework(cx, 30);
        if (E.t === 130) firework(cx - 50, 60);
        if (E.t > 190) { E.phase = 'clear'; E.t = 0; }
      }
    } else if (E.type === 'whale') {
      var wx = L.ending.whaleX;
      if (E.phase === 'rise') {
        if (E.t === 1) { splash(wx + 40, GROUND_Y + 4); splash(wx + 100, GROUND_Y + 4); AU.sfx('boom'); }
        E.wy -= 1.2;
        if (E.wy <= GROUND_Y - 74) { E.phase = 'open'; E.t = 0; }
      } else if (E.phase === 'open') {
        E.jaw = Math.min(26, E.jaw + 1.2);
        if (E.t === 1) AU.sfx('gulp');
        if (E.t > 25) { E.phase = 'suck'; E.t = 0; }
      } else if (E.phase === 'suck') {
        var mx = wx + 26, my = E.wy + 70, left = 0;
        for (i = 0; i < G.players.length; i++) {
          q = G.players[i];
          if (q.state === 'gone') continue;
          q.x += (mx - q.x) * 0.07;
          q.y += (my - q.h / 2 - q.y) * 0.07;
          q.anim += 0.3;
          if (Math.abs(q.x - mx) < 6 || E.t > 100) q.state = 'gone'; else left++;
        }
        if (!left) { E.phase = 'dive'; E.t = 0; }
      } else if (E.phase === 'dive') {
        E.jaw = Math.max(0, E.jaw - 2);
        if (E.t > 20) E.wy += 1.5;
        if (E.t === 21) splash(wx + 80, GROUND_Y + 4);
        if (E.wy > GROUND_Y + 40) { E.phase = 'dark'; E.t = 0; }
      } else if (E.phase === 'dark') {
        G.fade = Math.min(1, E.t / 40);
        if (E.t > 150) {
          var device = G.players[0].device;
          var next = finishLevel();
          G.fade = 0;
          startLevel(next, device);
          return;
        }
      }
    } else if (E.type === 'finale') {
      stepFinale(E);
      return;
    } else if (E.type === 'fly') {
      G.fade = Math.min(1, E.t / 30);
      if (E.t > 170) {
        var dev = G.players[0].device;
        finishLevel();
        G.fade = 0;
        startLevel(E.to, dev);
        return;
      }
    } else if (E.type === 'talk') {
      if (E.phase === 'hearts') {
        if (E.hearts && E.t % 6 === 0) part({ kind: 'heart', x: E.x - 20 + Math.random() * 40, y: E.y + 10, vx: (Math.random() - 0.5) * 0.6, vy: -0.8, life: 70 });
        if (E.t > 160) { E.phase = 'clear'; E.t = 0; }
      }
    } else if (E.type === 'spout') {
      var sx = L.ending.x * TS + 16;
      if (E.phase === 'blast') {
        var gone = true;
        for (i = 0; i < G.players.length; i++) {
          q = G.players[i];
          q.vy = Math.max(q.vy - 0.3, -7);
          q.y += q.vy;
          if (q.y > -60) gone = false;
        }
        part({ kind: 'drop', color: '#cfe8ff', x: sx + (Math.random() - 0.5) * 20, y: GROUND_Y, vx: (Math.random() - 0.5) * 2, vy: -6 - Math.random() * 3, g: 0.15, life: 50 });
        if (gone && E.t > 40) { E.phase = 'flash'; E.t = 0; AU.sfx('clear'); }
      } else if (E.phase === 'flash') {
        G.fade = Math.max(0, 1 - E.t / 30);
        if (E.t > 30) { G.fade = 0; E.phase = 'clear'; E.t = 0; }
      }
    }
    if (E.phase === 'clear' && E.t > 40 && (anyPressed('jumpP') || anyPressed('startP'))) {
      toMap(finishLevel());
    }
  }

  // ---------------------------------------------------------------- the finale
  // The man in the coat waits by the flagpole on Blåbæråsen. Talking to him
  // starts a boxing match. He telegraphs every punch and stays open a long
  // time afterwards, and taking a hit costs nothing. When he goes down the
  // disguise comes off, and a helicopter brings the statue.
  var GORM_LINES = [
    'AU! FOR EN HØYRE, MAGNIO!',
    'JA, DET VAR MEG HELE TIDEN. GORM, I FORKLEDNING.',
    'JEG LÅNTE VERKTØYKASSA DI FOR Å LAGE EN GAVE TIL DEG. HER HAR DU DEN TILBAKE.',
    'MEN GAVEN KAN JEG IKKE BÆRE ALENE. SE OPP!'
  ];
  var CREDITS = [
    ['SUPER MAGNIO', '#ffe060', 2], ['', '', 1],
    ['GRATLA MED 71-ÅRSDAGEN,', '#ffffff', 1], ['MAGNE!', '#ffffff', 2], ['22. OKTOBER', '#c0d8f0', 1], ['', '', 1],
    ['MED', '#ffe060', 1], ['MAGNE SOM MAGNIO (OG FRODIGI)', '#ffffff', 1], ['GORM SOM MANNEN I FRAKK', '#ffffff', 1],
    ['TOVE, ASLAK, KATHINKA, FRIDE,', '#ffffff', 1], ['TELLEF OG ASTA SOM SEG SELV', '#ffffff', 1],
    ['OG JONAS FRA HVALENS BUK', '#c0d8f0', 1], ['', '', 1],
    ['FRA HARØYA TIL BLÅBÆRÅSEN', '#c0d8f0', 1], ['', '', 1], ['TAKK FOR AT DU SPILTE!', '#ffe060', 1]
  ];

  function startBox() {
    storeWallet();
    G.save.gloves = true;
    writeSave();
    G.box = { phase: 'intro', t: 0, hp: 10, opp: 'guard', ot: 0, openLeft: 0, rt: 0, mag: 'idle', mt: 0, cool: 0,
      msg: '', sub: '', msgT: 0, page: 0, shake: 0 };
    G.state = 'box';
    AU.stopMusic();
    AU.sfx('bell');
  }

  function say(text, frames, sub) {
    var B = G.box;
    B.msg = text; B.sub = sub || ''; B.msgT = frames;
  }

  function stepBox() {
    var B = G.box;
    B.t++;
    if (B.msgT > 0) B.msgT--;
    if (B.shake > 0) B.shake--;
    if (B.phase === 'intro') {
      if (B.t === 1) say('RUNDE 1', 80, 'KJEMP!');
      if (B.t > 90) { B.phase = 'fight'; B.t = 0; B.ot = 0; AU.startMusic('boks'); }
      return;
    }
    if (B.phase === 'fight') {
      var dodge = anyPressed('leftP') || anyPressed('downP') || anyPressed('rightP');
      var punch = anyPressed('jumpP') || anyPressed('fireP');
      if (B.mt > 0) B.mt--; else B.mag = 'idle';
      if (B.cool > 0) B.cool--;
      if (dodge && B.mag !== 'hurt') { B.mag = 'dodge'; B.mt = 40; }
      if (punch && B.cool === 0 && B.mag !== 'hurt') {
        B.mag = 'punch'; B.mt = 12; B.cool = 18;
        if (B.opp === 'open' || B.opp === 'recoil') {
          B.hp--;
          B.opp = 'recoil'; B.rt = 14; B.shake = 8;
          AU.sfx('punch');
          say(['PANG!', 'POW!', 'KLASK!', 'BANG!'][B.hp % 4], 30);
          if (B.hp <= 0) { B.phase = 'ko'; B.t = 0; AU.stopMusic(); AU.sfx('clear'); return; }
        } else {
          AU.sfx('bump');
          say('BLOKK!', 25);
        }
      }
      B.ot++;
      if (B.opp === 'guard') {
        if (B.ot > 70) { B.opp = 'wind'; B.ot = 0; say('DUKK UNNA!', 55, '< ELLER NED'); }
      } else if (B.opp === 'wind') {
        if (B.ot > 55) { B.opp = 'punch'; B.ot = 0; }
      } else if (B.opp === 'punch') {
        if (B.ot === 6) {
          if (B.mag === 'dodge') say('BOM!', 30, 'HAN BOMMET');
          else { B.mag = 'hurt'; B.mt = 30; B.shake = 6; AU.sfx('hurt'); say('AU!', 30); }
        }
        if (B.ot > 14) { B.opp = 'open'; B.ot = 0; B.openLeft = 130; say('SLÅ NÅ!', 60, X + ' ELLER ' + SQ); }
      } else if (B.opp === 'open' || B.opp === 'recoil') {
        if (B.opp === 'recoil' && --B.rt <= 0) B.opp = 'open';
        if (--B.openLeft <= 0) { B.opp = 'guard'; B.ot = 0; }
      }
      return;
    }
    if (B.phase === 'ko') {
      if (B.t === 20) AU.sfx('stomp');
      if (B.t > 170) { B.phase = 'reveal'; B.t = 0; B.page = 0; }
      return;
    }
    if (B.phase === 'reveal') {
      if (B.t > 12 && (anyPressed('jumpP') || anyPressed('upP') || anyPressed('fireP') || anyPressed('startP'))) {
        B.page++; B.t = 0; AU.sfx('talk');
        if (B.page >= GORM_LINES.length) startFinale();
      }
    }
  }

  // Back on Blåbæråsen: everyone gathers, the helicopter lowers the statue,
  // and the flag goes up.
  function startFinale() {
    var L = G.L, base = L.width * TS;
    G.box = null;
    G.state = 'play';
    G.enemies = []; G.items = []; G.shots = []; G.texts = [];
    G.camX = base - VW;
    var cast = [['tove', 'TOVE', 196], ['aslak', 'ASLAK', 174], ['kathinka', 'KATHINKA', 152], ['fride', 'FRIDE', 132],
      ['tellef', 'TELLEF', 112], ['asta', 'ASTA', 92], ['gorm', 'GORM', 70]];
    G.npcs = cast.map(function (c) {
      return makeNpc({ look: c[0], name: c[1], x: (base - c[2]) / TS, lines: [], dance: c[0] === 'asta', ball: c[0] === 'tellef' });
    });
    for (var i = 0; i < G.players.length; i++) {
      var p = G.players[i];
      p.state = 'cut'; p.facing = 1; p.vx = 0; p.vy = 0; p.star = 0; p.inv = 0;
      p.x = base - 346 - i * 16; p.y = GROUND_Y - p.h;
    }
    G.end = { type: 'finale', phase: 'heli', t: 0, hx: base + 40, hy: 18, cable: 0, sx: base - 332, attached: true };
    G.flagY = FLAG_LOW;
    G.save.done.lillesand = true;
    writeSave();
    AU.startMusic('main');
  }

  var STATUE_TOP = GROUND_Y - 104;

  function stepFinale(E) {
    var target = E.sx + 6;
    if (E.phase !== 'party' && E.t % 10 === 0) AU.sfx('rotor');
    if (E.phase === 'heli') {
      E.hx = Math.max(target, E.hx - 1.2);
      if (E.hx === target) { E.phase = 'lower'; E.t = 0; }
    } else if (E.phase === 'lower') {
      var drop = STATUE_TOP - (E.hy + 30) - 0;
      E.cable = Math.min(drop, E.cable + 0.35);
      if (E.cable >= drop) { E.phase = 'release'; E.t = 0; E.attached = false; AU.sfx('stomp'); puff(E.sx + 48, GROUND_Y, 10); }
    } else if (E.phase === 'release') {
      E.cable = Math.max(0, E.cable - 1);
      if (E.t > 30) { E.hx += 1.6; E.hy -= 0.7; }
      if (E.t > 140) {
        E.phase = 'party'; E.t = 0;
        AU.sfx('clear');
        for (var i = 0; i < G.npcs.length; i++) G.npcs[i].dance = true;
      }
    } else if (E.phase === 'party') {
      if (G.flagY > FLAG_HIGH) G.flagY = Math.max(FLAG_HIGH, G.flagY - 1.5);
      if (E.t % 50 === 10) firework(G.camX + 40 + Math.random() * (VW - 80), 30 + Math.random() * 40);
      if (E.t % 3 === 0) {
        var cols = ['#ff5050', '#ffe060', '#60c0ff', '#80ff80', '#ff80e0'];
        part({ kind: 'confetti', color: cols[Math.floor(Math.random() * cols.length)], x: G.camX + Math.random() * VW, y: -8, vy: 0.6 + Math.random() * 0.5, life: 260 });
      }
      for (i = 0; i < G.players.length; i++) {
        var p = G.players[i];
        if (p.onGround && Math.random() < 0.03) { p.vy = -3; p.onGround = false; }
        if (!p.onGround) { p.vy += 0.2; p.y += p.vy; if (p.y >= GROUND_Y - p.h) { p.y = GROUND_Y - p.h; p.vy = 0; p.onGround = true; } }
      }
      if (E.t > 260 && (anyPressed('jumpP') || anyPressed('startP'))) startCredits();
    }
  }

  function startCredits() {
    G.state = 'credits';
    G.credits = { t: 0 };
    G.end = null;
  }

  function stepCredits() {
    G.credits.t++;
    if (G.credits.t > 340 && (anyPressed('jumpP') || anyPressed('startP'))) startCake();
  }

  // After the credits, as in the films: Magne helps himself to cake (src/kake.js),
  // and then everyone dances (src/fest.js).
  // Minigames started by talking to someone in a level (game: in the level
  // file): the drive round Harøya (src/kjoretur.js), Trondheim Børs
  // (src/borsen.js), Catan at Heim (src/catan.js), and gutting Tove's catch
  // on the jetty at Heim (src/sloying.js). Afterwards the level carries on
  // where it was.
  var MINIGAMES = { drive: 'drive', bors: 'stock', catan: 'catan', sloye: 'gut' };
  function startMinigame(name, extra) {
    var p1 = G.players[0];
    G.state = 'minigame';
    G.minigame = SM[MINIGAMES[name]];
    G.minigame.start({
      pressed: anyPressed,
      fish: extra && extra.fish,
      big: p1.power > 0,
      coins: function () { return p1.coins; },
      setCoins: function (n) { p1.coins = n; },
      done: function () {
        G.state = 'play';
        G.minigame = null;
        for (var i = 0; i < G.players.length; i++) G.players[i].jumpBuf = 0;
        AU.startMusic(G.L.music || 'main');
      }
    });
  }

  function startCake() {
    G.state = 'cake';
    G.credits = null;
    SM.cake.start({ pressed: anyPressed, done: startParty });
  }

  function startParty() {
    G.state = 'party';
    SM.party.start({ pressed: anyPressed, done: function () { AU.stopMusic(); toTitle(); } });
  }

  // ---------------------------------------------------------------- drawing the finale
  function drawRingScene() {
    var B = G.box, i;
    var shake = B.shake ? (B.t % 2 ? 2 : -2) : 0;
    ctx.fillStyle = '#141420';
    ctx.fillRect(0, 0, VW, VH);
    // crowd in the dark
    for (i = 0; i < 26; i++) {
      var cx = 8 + i * 15, cy = 70 + (i % 3) * 6 + Math.round(Math.sin(G.t / 9 + i) * 1.5);
      A.disc(ctx, cx, cy, 5, 5, '#24243a');
      ctx.fillStyle = '#24243a'; ctx.fillRect(cx - 7, cy + 4, 14, 20);
    }
    ctx.fillStyle = '#fff8d0';
    for (i = 0; i < 4; i++) ctx.fillRect(40 + i * 96, 8, 30, 3);
    // ring
    ctx.fillStyle = '#d8cca8'; ctx.fillRect(24, 168 + shake, 336, 14);
    ctx.fillStyle = '#2a4a8a'; ctx.fillRect(24, 182 + shake, 336, 18);
    F.draw(ctx, 'BLÅBÆRÅSEN ARENA', Math.round((VW - F.width('BLÅBÆRÅSEN ARENA')) / 2), 188 + shake, '#ffffff');
    var ropes = ['#d82020', '#f4f4f4', '#2a5ad8'];
    for (i = 0; i < 3; i++) { ctx.fillStyle = ropes[i]; ctx.fillRect(24, 104 + i * 16 + shake, 336, 2); }
    ctx.fillStyle = '#a0a0a8'; ctx.fillRect(20, 96 + shake, 6, 76); ctx.fillRect(358, 96 + shake, 6, 76);

    // Magnio, three times the size, with gloves
    var mx = 96, my = 172 - 96 + shake;
    if (B.mag === 'dodge') { mx -= 26; my += 8; }
    if (B.mag === 'hurt') mx -= 10;
    var mspr = A.player.magnio.fire.big.stand.r;
    if (!(B.mag === 'hurt' && (G.t >> 2) & 1)) ctx.drawImage(mspr, mx, my, 48, 96);
    var reach = B.mag === 'punch' ? 44 : 0;
    drawGlove(mx + 2, my + 46, '#d82020');
    drawGlove(mx + 34 + reach, my + 40 - (reach ? 4 : 0), '#d82020');

    // the opponent
    var ox = 232, oy = 172 - 84 + shake;
    if (B.phase === 'ko' || B.phase === 'reveal') {
      drawUnmasked(ox, oy);
    } else {
      if (B.opp === 'recoil') ox += 12;
      ctx.drawImage(A.npc.skurk.l, ox, oy, 48, 84);
      var gx = ox - 4, gy = oy + 26;
      if (B.opp === 'wind') { gx = ox + 18; gy = oy + 14; }
      if (B.opp === 'punch') { gx = ox - 70; gy = oy + 34; }
      if (B.opp === 'open' || B.opp === 'recoil') { gx = ox - 2; gy = oy + 56; }
      drawGlove(ox + 32, gy + 2, '#3a2a1a');
      drawGlove(gx, gy, '#3a2a1a');
      if (B.opp === 'wind') F.shadow(ctx, '!', ox + 20, oy - 26, '#ff5050', 3);
      if (B.opp === 'open' || B.opp === 'recoil') {
        for (i = 0; i < 3; i++) {
          var a = G.t / 10 + i * 2.1;
          ctx.fillStyle = '#ffe060';
          ctx.fillRect(ox + 24 + Math.round(Math.cos(a) * 16), oy + 4 + Math.round(Math.sin(a) * 5), 3, 3);
        }
      }
      // health bar
      F.shadow(ctx, 'MANNEN I FRAKK', VW - 112, 18, '#ffffff');
      for (i = 0; i < 10; i++) {
        ctx.fillStyle = i < B.hp ? '#e83030' : '#3a3a48';
        ctx.fillRect(VW - 112 + i * 10, 30, 8, 6);
      }
      F.shadow(ctx, 'MAGNIO', 12, 18, '#ffffff');
    }

    // the family in the front row
    var row = [['fride', 6], ['tellef', 26], ['asta', 46], ['tove', 300], ['aslak', 322], ['kathinka', 344]];
    for (i = 0; i < row.length; i++) {
      var img = A.npc[row[i][0]].r, hop = Math.abs(Math.round(Math.sin(G.t / 7 + i) * 3));
      if (row[i][1] > VW / 2) img = A.npc[row[i][0]].l;
      ctx.drawImage(img, row[i][1], VH - img.height + 6 - hop);
    }
    if (B.phase === 'fight' && Math.floor(G.t / 120) % 2 === 0) F.shadow(ctx, 'HEIA BESTE!', 8, VH - 44, '#ffe060');

    if (B.msgT > 0) {
      centered(B.msg, 50, '#ffffff', 2, '#000');
      if (B.sub) centered(B.sub, 70, '#ffe060');
    }
    if (B.phase === 'reveal') {
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(10, 140, VW - 20, 68);
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(12, 142, VW - 24, 64);
      F.draw(ctx, 'GORM', 20, 148, '#ffe060');
      var lines = wrap(GORM_LINES[B.page], 56);
      for (i = 0; i < lines.length; i++) F.draw(ctx, lines[i], 20, 162 + i * 11, '#ffffff');
      if (B.t > 12 && (G.t >> 4) & 1) F.draw(ctx, X, VW - 26, 196, '#ffffff');
    }
  }

  function drawGlove(x, y, col) {
    ctx.fillStyle = '#141414'; ctx.fillRect(x - 1, y - 1, 14, 14);
    ctx.fillStyle = col; ctx.fillRect(x, y, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2, y + 2, 4, 3);
  }

  // The knockout: he topples, the hat and the fake moustache fly off, and
  // Gorm gets back up.
  function drawUnmasked(ox, oy) {
    var B = G.box, t = B.phase === 'ko' ? B.t : 999;
    if (t < 90) {
      var ang = Math.min(1, t / 24) * Math.PI / 2;
      ctx.save();
      ctx.translate(ox + 24, oy + 84);
      ctx.rotate(ang);
      ctx.drawImage(t < 20 ? A.npc.skurk.l : A.npc.gorm.l, -24, -84, 48, 84);
      ctx.restore();
    } else {
      ctx.drawImage(A.npc.gorm.l, ox, oy, 48, 84);
    }
    if (t < 160) {
      var hx = ox + 20 + t * 1.6, hy = oy - t * 2.2 + t * t * 0.03;
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(Math.round(hx), Math.round(hy), 22, 8); ctx.fillRect(Math.round(hx) + 5, Math.round(hy) - 6, 12, 6);
      var bx = ox + 10 - t * 1.3, by = oy + 26 - t * 1.6 + t * t * 0.025;
      ctx.save();
      ctx.translate(Math.round(bx), Math.round(by));
      ctx.rotate(t * 0.3);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-10, -2, 20, 5);
      ctx.restore();
    }
    if (B.phase === 'ko' && t > 40) centered('K.O.!', 50, '#ffe060', 3);
  }

  function drawFinaleWorld(cx) {
    var E = G.end;
    // While it hangs from the cable, the statue follows the helicopter.
    var sy = E.attached ? E.hy + 30 + E.cable : STATUE_TOP;
    var sxNow = E.attached ? E.hx - 6 : E.sx;
    ctx.drawImage(A.statue, Math.round(sxNow - cx), Math.round(sy + OFFY));
    var hx = Math.round(E.hx - cx), hy = Math.round(E.hy + OFFY);
    if (hx > -100 && hx < VW + 20 && hy > -60) {
      if (E.cable > 0) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(hx + 40, hy + 33, 1, Math.round(E.cable));
      }
      ctx.drawImage(A.helicopter, hx, hy);
      var blur = G.t % 2;
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(hx + 2 + blur * 16, hy + 1, 80 - blur * 32, 2);
      ctx.fillRect(hx + 75, hy + 4 + blur * 4, 5, 1);
    }
  }

  function drawFinaleText() {
    var E = G.end;
    if (E.phase !== 'party' || E.t < 100) return;
    ctx.fillStyle = 'rgba(12,26,58,0.45)';
    ctx.fillRect(30, 26, VW - 60, 62);
    centered('GRATLA MED DAGEN,', 34, '#ffe060', 2);
    centered('MAGNIO!', 54, '#ffffff', 3);
    if (E.t > 260 && (G.t >> 5) & 1) centered('TRYKK ' + X, 96, '#ffffff');
  }

  function drawCredits() {
    ctx.fillStyle = '#0c1020';
    ctx.fillRect(0, 0, VW, VH);
    var y = Math.round(VH - Math.min(G.credits.t * 0.6, VH - 16));
    for (var i = 0; i < CREDITS.length; i++) {
      var c = CREDITS[i];
      if (c[0]) centered(c[0], y, c[1], c[2]);
      y += c[2] > 1 ? 18 : (c[0] ? 11 : 6);
    }
    var hop = Math.abs(Math.round(Math.sin(G.t / 8) * 3));
    ctx.drawImage(A.statue, VW - 104, VH - 106);
    ctx.drawImage(A.player.magnio.fire.big.stand.r, 24, VH - 36 - hop);
    if (G.credits.t > 340 && (G.t >> 5) & 1) F.draw(ctx, X, VW - 14, 6, '#ffffff');
  }

  // ---------------------------------------------------------------- states
  var wakeLock = null;
  function requestWakeLock() {
    try {
      if (navigator.wakeLock && !wakeLock) {
        navigator.wakeLock.request('screen').then(function (l) {
          wakeLock = l;
          l.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () {});
      }
    } catch (e) { /* not supported */ }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && G.state === 'play') requestWakeLock();
  });

  function makeBacks(zone) {
    var w = (zone.to - zone.from) * TS, back = THEMES[zone.theme].back, img;
    if (back === 'sea') return [{ img: A.seaStrip(w), y: SEA_Y }];
    if (back === 'ridge') { img = A.ridge(w); return [{ img: img, y: GROUND_Y - img.height }]; }
    if (back === 'fjell') { img = A.mountains(w); return [{ img: img, y: SEA_Y - img.height + 1 }, { img: A.seaStrip(w), y: SEA_Y }]; }
    if (back === 'ribs') return [{ img: A.ribs(w), y: 0 }];
    if (back === 'terminal') return [{ img: A.terminal(w), y: 0 }];
    if (back === 'med') { img = A.medSea(w); return [{ img: img, y: SEA_Y - 40 }]; }
    if (back === 'praha') { img = A.pragueSkyline(w); return [{ img: img, y: GROUND_Y - img.height }]; }
    if (back === 'elv') { img = A.wharfRow(w); return [{ img: A.seaStrip(w), y: SEA_Y }, { img: img, y: SEA_Y + 10 - img.height }]; }
    return [];
  }

  function loadLevel(def) {
    var L = def.build();
    L.name = def.name;
    L.subtitle = def.subtitle;
    if (L.ending.flagX) L.poleX = L.ending.flagX * TS + 8;
    L.themeAt = [];
    for (var z = 0; z < L.zones.length; z++) {
      var zone = L.zones[z];
      for (var tx = zone.from; tx < zone.to; tx++) L.themeAt[tx] = zone.theme;
      zone.backs = makeBacks(zone);
    }
    // Drop anything that would stand on water.
    L.decor = L.decor.filter(function (d) {
      if (d.kind.indexOf('cloud') === 0 || ANCHOR[d.kind]) return true;
      var w = d.kind === 'sign' ? 2 : Math.ceil(A.decor[d.kind].width / TS);
      for (var i = 0; i < w; i++) if (L.grid[12][d.x + i] !== '#') return false;
      return true;
    });
    G.L = L;
    // An enemy placed inside a block would be stuck there, so it is left out.
    G.enemies = L.enemies.filter(function (e) {
      var stuck = !ENEMY[e.type].fly && !ENEMY[e.type].bob && !ENEMY[e.type].leap && SOLID[L.grid[e.y][e.x]] === 1;
      if (stuck) console.warn('enemy ' + e.type + ' at ' + e.x + ',' + e.y + ' starts inside a block');
      return !stuck;
    }).map(function (e) { return makeEnemy(e.type, e.x, e.y); });
    G.npcs = (L.npcs || []).map(makeNpc);
    G.trees = (L.trees || []).map(function (t) { return { x: t.x * TS, kind: t.kind || 'pine', state: 'stand', ang: 0, dir: 1, t: 0 }; });
    G.boats = (L.boats || []).map(function (b) {
      return { x: b.from * TS, x0: b.from * TS, x1: b.to * TS, y: GROUND_Y + 2, w: 58, dir: 1, wait: 60, dx: 0 };
    });
    G.items = []; G.shots = []; G.parts = []; G.texts = []; G.bumps = []; G.coinHits = {};
    G.end = null; G.freeze = 0; G.camX = 0; G.flagY = FLAG_LOW; G.paused = false;
    G.talk = null; G.near = null; G.fade = 0;
  }

  function toTitle() {
    loadLevel(levelDef('haroya'));
    G.players = [];
    G.state = 'title';
  }

  function toMap(sel) {
    G.state = 'map';
    G.players = [];
    if (!playable(sel)) {
      sel = 'haroya';
      for (var i = 0; i < ORDER.length; i++) if (playable(ORDER[i])) sel = ORDER[i];
    }
    G.mapSel = sel;
    AU.startMusic('main');
  }

  function startStory(pages, then) {
    G.story = { pages: pages, page: 0, t: 0, then: then };
    G.state = 'story';
  }

  function startLevel(id, device) {
    G.levelId = id;
    loadLevel(levelDef(id));
    var sx = G.L.start.x;
    if (startCol > 0) { sx = startCol; startCol = 0; }
    var p = makePlayer(0, device, sx * TS + 2, GROUND_Y - SMALL_H);
    applyWallet(p);
    G.players = [p];
    G.camX = Math.max(0, Math.min(G.L.width * TS - VW, sx * TS - VW / 2));
    if (G.p2Device && IN.devices[G.p2Device]) joinPlayer(G.p2Device, true);
    G.state = 'play';
    G.intro = 110;
    AU.stopMusic();
    requestWakeLock();
  }

  function joinPlayer(device, quiet) {
    var p1 = G.players[0];
    var p = makePlayer(1, device, p1.x, Math.max(0, p1.y - 40));
    applyWallet(p);
    if (overlapsSolid(p)) p.y = p1.y + p1.h - p.h;
    G.players.push(p);
    G.p2Device = device;
    if (!quiet) {
      puff(p.x + 6, p.y + 8, 8);
      addText(p.x + 6, p.y - 10, 'FRODIGI!', '#80ff80');
      AU.sfx('join');
    }
  }

  function assigned(id) {
    for (var i = 0; i < G.players.length; i++) if (G.players[i].device === id) return true;
    return false;
  }

  function stepTitle() {
    if (!(anyPressed('jumpP') || anyPressed('startP'))) return;
    AU.startMusic('main');
    if (!G.save.prologue) {
      startStory(PROLOGUE, function () {
        G.save.prologue = true;
        writeSave();
        toMap('haroya');
      });
    } else {
      toMap(null);
    }
  }

  function stepStory() {
    var S = G.story;
    S.t++;
    if (S.t > 20 && (anyPressed('jumpP') || anyPressed('startP'))) {
      S.page++;
      S.t = 0;
      AU.sfx('talk');
      if (S.page >= S.pages.length) { G.story = null; S.then(); }
    }
  }

  function stepMap() {
    var dirs = { leftP: 'left', rightP: 'right', upP: 'up', downP: 'down' };
    for (var key in dirs) {
      if (!anyPressed(key)) continue;
      var next = mapStep(G.mapSel, dirs[key]);
      if (next) { G.mapSel = next; AU.sfx('talk'); }
    }
    if (anyPressed('fireP')) { G.showClues = !G.showClues; AU.sfx('talk'); }
    var dev = anyPressed('jumpP') || anyPressed('startP');
    if (dev && G.showClues) { G.showClues = false; return; }
    if (dev && playable(G.mapSel)) startLevel(G.mapSel, dev);
  }

  function stepPlay() {
    var devs = IN.devices, i, id;
    if (G.intro > 0) {
      if (--G.intro === 0) AU.startMusic(G.L.music || 'main');
      return;
    }
    if (G.talk) { stepTalk(); return; }
    if (!G.end) {
      for (i = 0; i < G.players.length; i++) {
        var pd = devs[G.players[i].device];
        if (pd && pd.startP) {
          G.paused = !G.paused;
          AU.setPaused(G.paused);
          AU.sfx('pause');
          return;
        }
      }
    }
    if (G.paused) {
      for (i = 0; i < G.players.length; i++) {
        var d = devs[G.players[i].device];
        if (d && d.fireP) AU.toggleMusic();
        if (d && d.upP) { G.paused = false; AU.setPaused(false); toMap(G.levelId); return; }
      }
      return;
    }
    if (G.players.length < 2 && !G.end) {
      for (id in devs) if (!assigned(id) && devs[id].jumpP) { joinPlayer(id); break; }
    }
    if (G.freeze > 0) {
      G.freeze--;
      for (i = 0; i < G.players.length; i++) {
        var gp = G.players[i];
        if (gp.growT > 0) gp.growT--; else if (gp.growT < 0) gp.growT++;
      }
      return;
    }
    if (!G.end) {
      findNear();
      if (G.near) {
        var nd = devs[G.near.player.device];
        if (G.near.npc.auto && !G.near.npc.talked) { G.near.npc.talked = true; startTalk(G.near.npc); return; }
        if (nd && nd.upP) { startTalk(G.near.npc); return; }
      }
      findGate();
      if (G.gate) {
        var gd = devs[G.players[0].device];
        if (gd && gd.upP) { startFlight(G.gate); return; }
      }
    }
    if (G.end) stepEnding();
    if (G.state !== 'play') return;
    updateBoats();
    for (i = 0; i < G.players.length; i++) updatePlayer(G.players[i], devs[G.players[i].device] || NOINPUT);
    updateCamera();
    clampPlayers();
    updateItems();
    updateEnemies();
    updateShots();
    updateTrees();
    updateNpcs();
    if (!G.end) { collidePlayers(); checkEnding(); }

    if (G.L.bubbles && G.t % 18 === 0) {
      part({ kind: 'bubble', x: G.camX + Math.random() * VW, y: GROUND_Y - 4, vy: -0.5, life: 240 });
    }
    for (i = 0; i < G.parts.length; i++) {
      var pt = G.parts[i];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += pt.g; pt.life--;
      if (pt.kind === 'bubble') pt.x += Math.sin((pt.life + i) * 0.1) * 0.3;
    }
    G.parts = G.parts.filter(function (q) { return q.life > 0; });
    for (i = 0; i < G.texts.length; i++) { G.texts[i].y -= 0.5; G.texts[i].life--; }
    G.texts = G.texts.filter(function (q) { return q.life > 0; });
    for (i = 0; i < G.bumps.length; i++) G.bumps[i].t++;
    G.bumps = G.bumps.filter(function (b) { return b.t < 10; });
  }

  function step() {
    IN.poll();
    G.t++;
    for (var id in IN.devices) if (IN.devices[id].anyP) { AU.resume(); break; }
    var star = false;
    for (var i = 0; i < G.players.length; i++) if (G.players[i].star > 0) star = true;
    AU.update(star);
    if (G.state === 'title') stepTitle();
    else if (G.state === 'story') stepStory();
    else if (G.state === 'map') stepMap();
    else if (G.state === 'play') stepPlay();
    else if (G.state === 'box') stepBox();
    else if (G.state === 'credits') stepCredits();
    else if (G.state === 'cake') SM.cake.step();
    else if (G.state === 'minigame') G.minigame.step();
    else if (G.state === 'party') SM.party.step();
  }

  // ---------------------------------------------------------------- drawing: world
  var QSEQ = [0, 0, 0, 1, 2, 1];

  function drawBackdrop(cx) {
    var L = G.L;
    for (var z = 0; z < L.zones.length; z++) {
      var zone = L.zones[z], x = zone.from * TS - cx;
      for (var b = 0; b < zone.backs.length; b++) {
        var back = zone.backs[b];
        if (x > VW || x + back.img.width < 0) continue;
        ctx.drawImage(back.img, x, back.y + (back.y === 0 ? 0 : OFFY));
      }
    }
  }

  function drawSign(x, text) {
    var w = F.width(text) + 8, top = GROUND_Y - 34 + OFFY;
    ctx.fillStyle = '#4a2e14';
    ctx.fillRect(x + 6, top + 12, 3, GROUND_Y + OFFY - top - 12);
    ctx.fillRect(x, top, w, 13);
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(x + 1, top + 1, w - 2, 11);
    F.draw(ctx, text, x + 4, top + 3, '#f4e8c8');
  }

  // sky: clouds and gulls. back: things on the sea. front: everything on the ground.
  function drawDecor(cx, layer) {
    var L = G.L;
    for (var i = 0; i < L.decor.length; i++) {
      var d = L.decor[i], x = d.x * TS - cx, y;
      var sky = d.kind.indexOf('cloud') === 0 || d.kind === 'gull';
      var anchor = ANCHOR[d.kind];
      var inLayer = sky ? 'sky' : (anchor === 'sea' || anchor === 'boat') ? 'back' : 'front';
      if (inLayer !== layer) continue;
      if (d.kind === 'sign') {
        if (x > -120 && x < VW) drawSign(x, d.text);
        continue;
      }
      if (d.kind === 'tavle') {
        if (x > -130 && x < VW) drawBoard(x);
        continue;
      }
      if (d.kind === 'gull') {
        var phase = d.x * 0.7;
        x += Math.round(Math.sin(G.t / 90 + phase) * 24);
        y = d.y * TS + Math.round(Math.sin(G.t / 25 + phase) * 4);
        if (x > -10 && x < VW) ctx.drawImage(A.gull[(G.t >> 3) % 2], x, y + OFFY);
        continue;
      }
      var im = A.decor[d.kind];
      if (x > VW || x + im.width < 0) continue;
      if (d.kind === 'hvalhale') {
        // The flukes rise out of the water now and then.
        var v = Math.sin(G.t / 150 + d.x);
        if (v < 0.4) continue;
        var vh = Math.round(Math.min(1, (v - 0.4) / 0.4) * im.height);
        ctx.drawImage(im, 0, 0, im.width, vh, x, SEA_Y + 10 - vh + OFFY, im.width, vh);
        continue;
      }
      if (sky) y = d.y * TS;
      else if (anchor === 'sea') y = SEA_Y + 8 - im.height;
      else if (anchor === 'boat') y = SEA_Y + 14 - im.height + Math.round(Math.sin(G.t / 40 + d.x));
      else if (d.kind.indexOf('bush') === 0) y = GROUND_Y - im.height + 4;
      else y = GROUND_Y - im.height;
      ctx.drawImage(im, x, y + OFFY);
      if (d.kind === 'bal') {
        var cols = ['#ff7a1a', '#ffc040', '#ff4a1a'];
        for (var f = 0; f < 4; f++) {
          var fh = 4 + ((G.t >> 2) + f * 3) % 5;
          ctx.fillStyle = cols[(f + (G.t >> 3)) % 3];
          ctx.fillRect(x + 5 + f * 2, y + OFFY - fh + 2, 2, fh);
        }
      }
    }
  }

  function bumpOffset(tx, ty) {
    for (var i = 0; i < G.bumps.length; i++) {
      var b = G.bumps[i];
      if (b.tx === tx && b.ty === ty) return -Math.round(Math.sin(b.t / 10 * Math.PI) * 5);
    }
    return 0;
  }

  function drawTiles(cx) {
    var L = G.L, T = A.tiles;
    var x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(L.width - 1, x0 + Math.ceil(VW / TS) + 1);
    var qf = QSEQ[Math.floor(G.t / 8) % QSEQ.length];
    for (var ty = 0; ty < L.height; ty++) {
      var row = L.grid[ty];
      for (var tx = x0; tx <= x1; tx++) {
        var c = row[tx], img = null, theme = L.themeAt[tx];
        switch (c) {
          case '#': img = (ty > 0 && L.grid[ty - 1][tx] !== '#') ? T.ground[theme].top : T.ground[theme].fill; break;
          case 'B': case 'C': case 'K': img = T.brick; break;
          case '?': case 'M': img = T.q[qf]; break;
          case 'U': img = T.used; break;
          case 'X': img = T.hardBy[theme] || T.hard; break;
          case '[': img = T.column[theme].tl; break;
          case ']': img = T.column[theme].tr; break;
          case '{': img = T.column[theme].bl; break;
          case '}': img = T.column[theme].br; break;
          case 'o': img = A.item.coin[qf]; break;
        }
        if (img) ctx.drawImage(img, tx * TS - cx, ty * TS + OFFY + bumpOffset(tx, ty));
      }
    }
  }

  // Open water (or acid) in the gaps, drawn over anything that has fallen in.
  function drawWater(cx) {
    var L = G.L;
    var x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(L.width - 1, x0 + Math.ceil(VW / TS) + 1);
    var top = GROUND_Y + 6 + OFFY;
    for (var tx = x0; tx <= x1; tx++) {
      if (L.grid[12][tx] === '#') continue;
      var x = tx * TS - cx, liq = liquidAt(tx * TS);
      ctx.fillStyle = liq.top; ctx.fillRect(x, top, TS, 10);
      ctx.fillStyle = liq.deep; ctx.fillRect(x, top + 10, TS, VH - top - 10);
      ctx.fillStyle = liq.hi;
      var wave = (Math.floor(G.t / 12) + tx * 5) % 8;
      ctx.fillRect(x + wave, top, 5, 1);
      ctx.fillRect(x + (wave + 9) % 16, top + 4, 3, 1);
    }
  }

  function drawPoleAndFlag(cx) {
    var px = G.L.poleX - cx;
    if (px < -32 || px > VW + 8) return;
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(px - 1, 40 + OFFY, 2, GROUND_Y - 40);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(px, 40 + OFFY, 1, GROUND_Y - 40);
    A.disc(ctx, px, 37 + OFFY, 3, 3, '#a87810');
    A.disc(ctx, px, 37 + OFFY, 2, 2, '#f0c840');
    ctx.fillStyle = '#7a7470';
    ctx.fillRect(px - 4, GROUND_Y - 3 + OFFY, 8, 3);
    ctx.drawImage(A.flag, px + 1, Math.round(G.flagY) + OFFY);
  }

  // The blowhole: a column of light with spray rising through it.
  function drawSpout(cx) {
    var x = G.L.ending.x * TS - cx;
    if (x < -40 || x > VW) return;
    ctx.globalAlpha = 0.25 + Math.sin(G.t / 10) * 0.05;
    ctx.fillStyle = '#cfe8ff';
    ctx.fillRect(x + 4, 0, 24, GROUND_Y + OFFY);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8f6ff';
    for (var i = 0; i < 12; i++) {
      var yy = (GROUND_Y - ((G.t * 3 + i * 37) % GROUND_Y)) + OFFY;
      ctx.fillRect(x + 6 + (i * 7) % 20, yy, 2, 3);
    }
  }

  function drawGates(cx) {
    var E = G.L.ending;
    if (E.type !== 'gates') return;
    for (var i = 0; i < E.gates.length; i++) {
      var g = E.gates[i], x = g.x * TS - cx, top = GROUND_Y - 60 + OFFY;
      if (x < -80 || x > VW + 40) continue;
      ctx.fillStyle = '#5a5a62'; ctx.fillRect(x, top, 48, 60);
      ctx.fillStyle = '#2a2a32'; ctx.fillRect(x + 4, top + 8, 40, 52);
      ctx.fillStyle = '#9ac8f0'; ctx.fillRect(x + 8, top + 14, 32, 16);
      ctx.fillStyle = '#3a3a40'; ctx.fillRect(x + 23, top + 14, 2, 16);
      var text = 'GATE ' + (i + 1) + ': ' + g.label, w = F.width(text) + 8;
      ctx.fillStyle = '#1f3f7a'; ctx.fillRect(x + 24 - w / 2, top - 14, w, 12);
      F.draw(ctx, text, x + 28 - w / 2, top - 11, '#ffffff');
      if (G.gate === g) F.shadow(ctx, TRI, x + 21, top + 34 + Math.round(Math.sin(G.t / 8) * 2), '#ffffff');
    }
  }

  function drawBoard(x) {
    var y = 34;
    ctx.fillStyle = '#141418'; ctx.fillRect(x, y, 124, 46);
    ctx.fillStyle = '#3a3a40'; ctx.fillRect(x, y, 124, 2);
    F.draw(ctx, 'AVGANGER', x + 6, y + 5, '#ffe060');
    var rows = ['MORAIRA    GATE 1', 'PRAHA      GATE 2', 'LILLESAND  GATE 3'];
    for (var i = 0; i < rows.length; i++) F.draw(ctx, rows[i], x + 6, y + 16 + i * 9, '#f0c040');
  }

  function drawFlight() {
    var E = G.end;
    ctx.fillStyle = '#1a2a50';
    ctx.fillRect(0, 0, VW, VH);
    var px = Math.round(-80 + E.t * 3), py = Math.round(120 - E.t * 0.4);
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(px, py, 64, 10);
    A.disc(ctx, px + 64, py + 5, 6, 5, '#f4f4f4');
    ctx.fillStyle = '#2a5aa8';
    for (var t = 0; t < 14; t++) ctx.fillRect(px + Math.round(t * 0.6), py - 14 + t, 10 - Math.round(t * 0.4), 1);
    ctx.fillStyle = '#c8c8c8'; ctx.fillRect(px + 22, py + 8, 26, 3);
    ctx.fillStyle = '#2c4a6a';
    for (var w = px + 18; w < px + 60; w += 5) ctx.fillRect(w, py + 2, 2, 2);
    centered('AVGANG TIL ' + E.label, 160, '#ffe060', 2);
  }

  function drawWhale(cx) {
    var E = G.end;
    if (!E || E.type !== 'whale') return;
    A.drawWhale(ctx, Math.round(G.L.ending.whaleX - cx), Math.round(E.wy + OFFY), Math.round(E.jaw), 0);
  }

  // After the blowhole: the whale seen from outside, with Magnio flying high.
  var outsideSea = null;
  function drawOutside() {
    if (!outsideSea) outsideSea = A.seaStrip(VW);
    ctx.fillStyle = '#8cc0e8';
    ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(outsideSea, 0, SEA_Y + OFFY);
    ctx.fillStyle = A.WATER_DEEP;
    ctx.fillRect(0, SEA_Y + 56 + OFFY, VW, VH);
    var wx = 150, wy = 150;
    ctx.drawImage(A.whale, wx, wy);
    ctx.fillStyle = '#e8f6ff';
    for (var i = 0; i < 14; i++) {
      var h = (G.t * 2 + i * 23) % 70;
      ctx.fillRect(wx + 118 + Math.round(Math.sin(i * 1.7) * h * 0.15), wy + 20 - h, 2, 3);
    }
    var bob = Math.round(Math.sin(G.t / 15) * 3);
    for (i = 0; i < G.players.length; i++) {
      ctx.drawImage(playerSprite(G.players[i].ch, G.players[i].power, 'normal', 'jump', 1), wx + 110 + i * 18, 30 + bob);
    }
  }

  function drawItem(it, cx) {
    ctx.drawImage(A.item[it.type], Math.round(it.x - 1 - cx), Math.round(it.y + OFFY));
  }

  function drawEnemy(e, cx) {
    if (!e.active) return;
    var fr = Math.floor(e.t / 12) % 2 ? 'walk2' : 'walk1', spr;
    var set = A.enemy[e.type];
    if (e.state === 'flat') spr = set.flat;
    else if (e.state === 'shell' || e.state === 'slide') spr = set.shell;
    else spr = set[ENEMY[e.type].fly ? (Math.floor(e.t / 8) % 2 ? 'walk2' : 'walk1') : fr];
    var img = e.vx > 0 ? spr.l : spr.r; // sprites are drawn facing left
    var x = Math.round(e.x - 2 - cx), y = Math.round(e.y + e.h - 16 + OFFY);
    if (ENEMY[e.type].fly || ENEMY[e.type].bob || ENEMY[e.type].leap) y = Math.round(e.y - 4 + OFFY);
    if (ENEMY[e.type].leap && e.state !== 'dead' && e.y > GROUND_Y + 2) return;
    if (e.state === 'dead') {
      ctx.save();
      ctx.translate(x, y + 16);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(img, x, y);
    }
  }

  function drawNpc(n, cx) {
    var x = Math.round(n.x - cx);
    if (x < -n.w - 4 || x > VW + 4) return;
    var p1 = G.players[0];
    var faceLeft = !n.still && p1 && p1.x + p1.w / 2 < n.x + 8, hop = 0;
    if (n.follow) { faceLeft = n.faceLeft; hop = n.walking ? (G.t >> (n.running ? 2 : 3)) & 1 : 0; }
    if (n.dance) {
      faceLeft = Math.floor(G.t / 20) % 2 === 0;
      hop = Math.abs(Math.round(Math.sin(G.t / 6) * 3));
    }
    ctx.drawImage(faceLeft ? A.npc[n.look].l : A.npc[n.look].r, x, n.y + OFFY - hop);
    for (var f = 0; f < n.table.length; f++) ctx.drawImage(SM.gut.fishArt(n.table[f]), x + 1 + f * 2, n.y + OFFY - 10 - f * 3);
    if (n.ball) {
      var by = GROUND_Y - 6 + OFFY - Math.abs(Math.round(Math.sin(G.t / 9) * 10));
      A.disc(ctx, x + 18, by, 3, 3, '#141414');
      A.disc(ctx, x + 18, by, 2, 2, '#f4f4f4');
      ctx.fillStyle = '#141414'; ctx.fillRect(x + 18, by, 1, 1);
    }
    if (G.near && G.near.npc === n && !G.talk) {
      var bob = Math.round(Math.sin(G.t / 8) * 2);
      F.shadow(ctx, '△', x + n.w / 2 - 3, n.y + OFFY - 11 + bob, '#ffffff');
    }
  }

  function playerFrame(p) {
    if (p.state === 'flag') return 'stand';
    var walk = Math.floor(p.anim) % 2 ? 'walk2' : 'walk1';
    if (p.state === 'walkout') return walk;
    if (p.state === 'cut') return 'jump';
    if (!p.onGround) return 'jump';
    if (Math.abs(p.vx) > 0.15) return walk;
    return 'stand';
  }

  function playerSprite(ch, power, variant, frame, facing) {
    return A.player[ch][variant][power > 0 ? 'big' : 'small'][frame][facing > 0 ? 'r' : 'l'];
  }

  function drawPlayer(p, cx) {
    if (p.state === 'rescue' || p.state === 'gone') return;
    if (p.inv > 0 && p.state === 'play' && G.freeze === 0 && (G.t >> 2) & 1) return;
    var growing = G.freeze > 0 && p.growT !== 0;
    var big = growing ? ((G.t >> 2) & 1) === 0 : p.power > 0;
    var variant = p.star > 0 ? 'star' + (Math.floor(G.t / 3) % 3) : (p.power === 2 ? 'fire' : 'normal');
    var spr = playerSprite(p.ch, big ? 1 : 0, variant, playerFrame(p), p.facing);
    var sx = Math.round(p.x - 2 - cx), sy = Math.round(p.y + p.h - spr.height + OFFY);
    ctx.drawImage(spr, sx, sy);
    if (p.power === 2 && !growing && G.save.gloves) {
      // red boxing gloves on both hands; the front one reaches out when punching
      var hy = big ? 17 : 9, reach = p.punchT > 0 ? 4 : 0;
      var front = p.facing > 0 ? sx + 12 + reach : sx + 1 - reach, back = p.facing > 0 ? sx + 1 : sx + 12;
      ctx.fillStyle = '#a01818'; ctx.fillRect(back, sy + hy, 4, 4); ctx.fillRect(front, sy + hy, 4, 4);
      ctx.fillStyle = '#e83030'; ctx.fillRect(back, sy + hy, 3, 3); ctx.fillRect(front, sy + hy, 3, 3);
    } else if (p.power === 2 && !growing) {
      // the cigar, drawn on top of the moustache
      var row = big ? 9 : 6;
      ctx.fillStyle = '#7a4a20';
      ctx.fillRect(sx + (p.facing > 0 ? 14 : 1), sy + row, 1, 1);
      ctx.fillStyle = (G.t >> 3) & 1 ? '#ff7a1a' : '#ffb040';
      ctx.fillRect(sx + (p.facing > 0 ? 15 : 0), sy + row, 1, 1);
    }
  }

  function drawParts(cx) {
    for (var i = 0; i < G.parts.length; i++) {
      var p = G.parts[i], x = Math.round(p.x - cx), y = Math.round(p.y + OFFY);
      switch (p.kind) {
        case 'coin': ctx.drawImage(A.item.coin[Math.floor(p.life / 3) % 3], x, y); break;
        case 'bag': ctx.drawImage(A.item.bag, x, y); break;
        case 'debris':
          ctx.fillStyle = '#5a3a1c'; ctx.fillRect(x, y, 5, 5);
          ctx.fillStyle = '#c8965a'; ctx.fillRect(x, y, 4, 4);
          break;
        case 'drop':
          ctx.fillStyle = p.color || '#b8e0f8'; ctx.fillRect(x, y, 2, 2);
          break;
        case 'bubble':
          ctx.fillStyle = '#f0a0b8';
          ctx.fillRect(x, y - 1, 2, 1); ctx.fillRect(x - 1, y, 1, 2); ctx.fillRect(x + 2, y, 1, 2); ctx.fillRect(x, y + 2, 2, 1);
          break;
        case 'confetti':
          ctx.fillStyle = p.color;
          ctx.fillRect(x + Math.round(Math.sin(p.life * 0.15) * 3), y, 2, 2);
          break;
        case 'heart':
          ctx.fillStyle = '#e83050';
          ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + 3, y, 2, 2); ctx.fillRect(x, y + 1, 5, 2);
          ctx.fillRect(x + 1, y + 3, 3, 1); ctx.fillRect(x + 2, y + 4, 1, 1);
          break;
        case 'puff':
          var s = Math.max(1, Math.round(4 * p.life / p.max));
          ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x - s / 2, y - s / 2, s, s);
          break;
        case 'smoke':
          ctx.globalAlpha = p.life / p.max;
          ctx.fillStyle = '#d8d8d8'; ctx.fillRect(x, y, 2, 2);
          ctx.globalAlpha = 1;
          break;
        case 'spark':
          ctx.globalAlpha = Math.min(1, p.life / 20);
          ctx.fillStyle = p.color; ctx.fillRect(x, y, 2, 2);
          ctx.globalAlpha = 1;
          break;
      }
    }
  }

  // ---------------------------------------------------------------- drawing: screens
  function drawCoinIcon(x, y) {
    ctx.fillStyle = '#b07810'; ctx.fillRect(x + 1, y, 4, 7); ctx.fillRect(x, y + 1, 6, 5);
    ctx.fillStyle = '#f8c818'; ctx.fillRect(x + 1, y + 1, 3, 5);
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function centered(text, y, color, scale, shade) {
    scale = scale || 1;
    F.shadow(ctx, text, Math.round((VW - F.width(text, scale)) / 2), y, color || '#fff', scale, shade || '#000');
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = '#0c1a3a'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1f3f7a'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  var X = '✕', SQ = '□', TRI = '△';

  function drawHUD() {
    var p1 = G.players[0], p2 = G.players[1];
    F.shadow(ctx, 'MAGNIO', 10, 5, '#ffffff');
    drawCoinIcon(10, 14);
    F.shadow(ctx, 'KR ' + pad2(p1 ? p1.coins : G.save.wallet[0].coins), 19, 14, '#ffffff');
    F.shadow(ctx, G.L.name, Math.round((VW - F.width(G.L.name)) / 2), 9, '#ffffff');
    if (p2) {
      F.shadow(ctx, 'FRODIGI', VW - 10 - F.width('FRODIGI'), 5, '#b0ffb0');
      var t = 'KR ' + pad2(p2.coins);
      F.shadow(ctx, t, VW - 10 - F.width(t), 14, '#ffffff');
      drawCoinIcon(VW - 19 - F.width(t), 14);
    }
  }

  function drawTitle() {
    panel(82, 30, 220, 74);
    centered('SUPER', 38, '#ffe9a0', 2, '#0c1a3a');
    var t = 'MAGNIO', s = 5;
    F.outline(ctx, t, Math.round((VW - F.width(t, s)) / 2), 58, '#ffffff', s, '#0c1a3a');
    ctx.drawImage(A.player.magnio.normal.small.stand.r, G.L.start.x * TS, GROUND_Y - 16 + OFFY);
    ctx.fillStyle = 'rgba(12,26,58,0.75)';
    ctx.fillRect(0, 114, VW, 48);
    if ((G.t >> 5) & 1) centered('TRYKK ' + X + ' FOR Å STARTE', 122, '#ffffff');
    centered('MED EN KONTROLL TIL BLIR FRODIGI MED', 140, '#ffffff');
    centered('TASTATUR: PILER, Z HOPP, X BLÅS', 152, '#ffffff');
  }

  function drawIntro() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, VH);
    drawHUD();
    centered(G.L.name, 78, '#ffffff', 2);
    centered(G.L.subtitle, 98, '#c0d8f0');
    ctx.drawImage(A.player.magnio.normal.small.stand.r, VW / 2 - 8, 120);
  }

  function drawPause() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, VW, VH);
    centered('PAUSE', 76, '#ffffff', 2);
    centered(SQ + '  MUSIKK: ' + (AU.musicOn() ? 'PÅ' : 'AV'), 104, '#ffffff');
    centered(TRI + '  TIL KARTET', 118, '#ffffff');
    centered('OPTIONS: SPILL VIDERE', 132, '#ffffff');
  }

  function drawTalk() {
    var T = G.talk;
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(10, 140, VW - 20, 68);
    ctx.fillStyle = '#0c1a3a'; ctx.fillRect(12, 142, VW - 24, 64);
    F.draw(ctx, T.npc.name, 20, 148, '#ffe060');
    var text = T.pages[T.page], col = text.indexOf('NYTT SPOR') === 0 ? '#80ffb0' : '#ffffff';
    var lines = wrap(text, 56);
    for (var i = 0; i < lines.length && i < 4; i++) F.draw(ctx, lines[i], 20, 162 + i * 11, col);
    if (T.t > 8 && (G.t >> 4) & 1) F.draw(ctx, X, VW - 26, 196, '#ffffff');
  }

  function drawClear() {
    var C = G.L.clear;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(40, 62, VW - 80, 108);
    centered(C.title, 70, '#ffe060', 2);
    var y = 92;
    for (var i = 0; i < G.players.length; i++) {
      centered(G.players[i].name + '   KR ' + pad2(G.players[i].coins), y, i ? '#b0ffb0' : '#ffffff');
      y += 11;
    }
    for (i = 0; i < C.lines.length; i++) centered(C.lines[i], 120 + i * 12, '#ffffff');
    if (G.end.t > 40 && (G.t >> 5) & 1) centered('TRYKK ' + X, 156, '#ffffff');
  }

  function renderWorld() {
    var cx = Math.round(G.camX), i, L = G.L;
    ctx.fillStyle = L.sky;
    ctx.fillRect(0, 0, VW, VH);
    drawDecor(cx, 'sky');
    drawBackdrop(cx);
    drawDecor(cx, 'back');
    drawDecor(cx, 'front');
    drawTrees(cx);
    if (L.ending.flagX) drawPoleAndFlag(cx);
    if (L.ending.type === 'spout') drawSpout(cx);
    drawGates(cx);
    for (i = 0; i < G.items.length; i++) if (G.items[i].emerging > 0) drawItem(G.items[i], cx);
    drawTiles(cx);
    if (G.end && G.end.type === 'finale') drawFinaleWorld(cx);
    drawWhale(cx);
    for (i = 0; i < G.npcs.length; i++) drawNpc(G.npcs[i], cx);
    for (i = 0; i < G.items.length; i++) if (!(G.items[i].emerging > 0)) drawItem(G.items[i], cx);
    for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i], cx);
    for (i = 0; i < G.players.length; i++) drawPlayer(G.players[i], cx);
    for (i = 0; i < G.shots.length; i++) {
      var s = G.shots[i];
      if (s.punch) {
        ctx.globalAlpha = Math.max(0, 1 - s.t / 24);
        ctx.drawImage(s.vx > 0 ? A.punch.r : A.punch.l, Math.round(s.x - cx), Math.round(s.y + OFFY));
      } else {
        ctx.globalAlpha = s.t > 70 ? (90 - s.t) / 20 : 1;
        ctx.drawImage(A.ring, Math.round(s.x - cx), Math.round(s.y + OFFY));
      }
      ctx.globalAlpha = 1;
    }
    drawWater(cx);
    drawFishing(cx);
    for (i = 0; i < G.boats.length; i++) ctx.drawImage(A.decor.sjekte, Math.round(G.boats[i].x - 3 - cx), G.boats[i].y - 4 + OFFY);
    for (i = 0; i < G.players.length; i++) if (G.players[i].boat) drawPlayer(G.players[i], cx);
    drawParts(cx);
    for (i = 0; i < G.texts.length; i++) {
      var t = G.texts[i];
      F.shadow(ctx, t.text, Math.round(t.x - cx - F.width(t.text) / 2), Math.round(t.y + OFFY), t.color);
    }
  }

  // ---------------------------------------------------------------- drawing: story and map
  function drawStory() {
    var S = G.story, pg = S.pages[S.page];
    ctx.fillStyle = '#0c1020';
    ctx.fillRect(0, 0, VW, VH);
    var img = null, scale = 3;
    if (pg.art === 'magnio') img = A.player.magnio.normal.big.stand.r;
    else if (pg.art === 'kasse') { img = A.item.kasse; scale = 4; }
    else if (pg.art === 'skurk') img = A.npc.skurk.r;
    if (img) {
      var w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, Math.round((VW - w) / 2), Math.round(110 - h), w, h);
    }
    var lines = wrap(pg.text, 44);
    for (var i = 0; i < lines.length; i++) centered(lines[i], 130 + i * 13, '#ffffff');
    if (S.t > 20 && (G.t >> 4) & 1) F.draw(ctx, X, VW - 22, VH - 16, '#ffffff');
  }

  // Southern Norway (and a bit of Sweden), as lon/lat, for the map.
  var COAST = [[11.0, 65.5], [10.6, 64.9], [10.3, 64.6], [9.8, 64.1], [9.0, 63.8], [8.5, 63.5], [7.7, 63.1],
    [7.6, 62.9], [7.0, 62.85], [7.4, 62.6], [6.6, 62.7], [6.1, 62.45], [6.6, 62.25], [5.3, 62.2], [5.0, 61.6],
    [5.5, 61.3], [5.0, 61.15], [4.95, 61.0], [4.9, 60.4], [5.6, 60.25], [5.2, 59.95], [5.2, 59.6], [5.3, 59.3],
    [5.6, 58.95], [5.9, 58.5], [6.6, 58.1], [7.05, 57.98], [8.0, 58.13], [8.4, 58.24], [8.8, 58.45], [9.4, 58.85],
    [10.0, 59.03], [10.4, 59.25], [10.6, 59.75], [10.8, 59.6], [10.95, 59.2], [11.17, 58.94], [11.4, 58.4],
    [11.8, 57.8], [12.0, 57.0], [16, 57.0], [16, 65.5]];
  var FJORD = [[9.6, 63.75], [10.0, 63.55], [10.39, 63.43], [10.9, 63.6], [11.3, 63.8]];
  function mapXY(lon, lat) { return [Math.round((lon - 4) * 30 + 40), Math.round((64.6 - lat) * 25 + 18)]; }

  var landImg = null;
  function land() {
    if (landImg) return landImg;
    var c = document.createElement('canvas');
    c.width = VW; c.height = VH;
    var g = c.getContext('2d');
    g.fillStyle = '#5a9a4a';
    g.beginPath();
    for (var i = 0; i < COAST.length; i++) {
      var p = mapXY(COAST[i][0], COAST[i][1]);
      if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = '#2e6ca4';
    g.lineWidth = 2;
    g.beginPath();
    for (i = 0; i < FJORD.length; i++) {
      var q = mapXY(FJORD[i][0], FJORD[i][1]);
      if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]);
    }
    g.stroke();
    // Snap the anti-aliased edges to whole pixels so the map stays crisp.
    var data = g.getImageData(0, 0, VW, VH), d = data.data;
    for (var k = 0; k < d.length; k += 4) {
      var isLand = d[k + 1] > 120 && d[k + 3] > 100;
      d[k] = isLand ? 0x5a : 0; d[k + 1] = isLand ? 0x9a : 0; d[k + 2] = isLand ? 0x4a : 0; d[k + 3] = isLand ? 255 : 0;
    }
    g.putImageData(data, 0, 0);
    landImg = c;
    return c;
  }

  // Where each place sits on the map, and which side its name goes on.
  // Moraira and Praha are off the map, so they sit in the bottom corners.
  var MAP_SPOT = {
    haroya: { label: 'right' }, hvalen: { label: 'left' }, trondheim: { label: 'above' },
    heim: { label: 'left' }, varnes: { label: 'right' }, lillesand: { label: 'right' },
    moraira: { xy: [36, 168], label: 'above' }, praha: { xy: [344, 168], label: 'above' }
  };
  function mapPoint(id) {
    var spot = MAP_SPOT[id];
    if (spot.xy) return spot.xy;
    var m = levelDef(id).map;
    return mapXY(m.lon, m.lat);
  }

  // Which place each arrow leads to, as seen on the map. If that place is not
  // open yet, the nearest open place in that direction is used instead.
  var MAP_NAV = {
    hvalen: { right: 'haroya', down: 'haroya' },
    haroya: { left: 'hvalen', up: 'hvalen', right: 'heim', down: 'moraira' },
    heim: { left: 'haroya', right: 'trondheim', down: 'lillesand' },
    trondheim: { left: 'heim', right: 'varnes', down: 'lillesand' },
    varnes: { left: 'trondheim', right: 'praha', down: 'lillesand' },
    lillesand: { left: 'moraira', right: 'praha', up: 'trondheim' },
    moraira: { right: 'lillesand', up: 'haroya' },
    praha: { left: 'lillesand', up: 'varnes' }
  };
  var DIR = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  function mapStep(from, dir) {
    var want = (MAP_NAV[from] || {})[dir];
    if (want && playable(want)) return want;
    var a = mapPoint(from), d = DIR[dir], best = null, bestCost = Infinity;
    for (var i = 0; i < MAPLIST.length; i++) {
      var id = MAPLIST[i];
      if (id === from || !playable(id)) continue;
      var b = mapPoint(id), vx = b[0] - a[0], vy = b[1] - a[1];
      var along = vx * d[0] + vy * d[1], across = Math.abs(vx * d[1] - vy * d[0]);
      if (along <= 0 || across > along * 2) continue; // roughly in that direction, not off to the side
      var cost = along + across * 2;
      if (cost < bestCost) { bestCost = cost; best = id; }
    }
    return best;
  }

  // Some legs of the route bend so that places don't end up on one line.
  var BEND = { 'hvalen>trondheim': -34, 'heim>varnes': 26 };
  function route(a, b, bend, color) {
    var cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + (bend || 0);
    var steps = Math.round(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]) + Math.abs(bend || 0)) / 5);
    ctx.fillStyle = color;
    for (var s = 1; s < steps; s++) {
      var t = s / steps, u = 1 - t;
      ctx.fillRect(Math.round(u * u * a[0] + 2 * u * t * cx + t * t * b[0]) - 1, Math.round(u * u * a[1] + 2 * u * t * cy + t * t * b[1]) - 1, 2, 2);
    }
  }

  function drawMap() {
    ctx.fillStyle = '#2e6ca4';
    ctx.fillRect(0, 0, VW, VH);
    for (var y = 6; y < VH; y += 12) {
      for (var x = (y * 7) % 23; x < VW; x += 23) { ctx.fillStyle = '#3a7ab2'; ctx.fillRect(x, y, 4, 1); }
    }
    ctx.drawImage(land(), 0, 0);
    var i, id;
    // Only places that have been reached show up, so the route grows as he travels.
    for (i = 0; i + 1 < ORDER.length; i++) {
      if (G.save.open[ORDER[i + 1]]) route(mapPoint(ORDER[i]), mapPoint(ORDER[i + 1]), BEND[ORDER[i] + '>' + ORDER[i + 1]], '#fff4c0');
    }
    for (i = 0; i < SIDE.length; i++) if (G.save.open[SIDE[i]]) route(mapPoint('varnes'), mapPoint(SIDE[i]), 0, '#ffd8a0');
    for (i = 0; i < MAPLIST.length; i++) {
      id = MAPLIST[i];
      if (!G.save.open[id]) continue;
      var d = levelDef(id), p = mapPoint(id), open = playable(id), side = SIDE.indexOf(id) >= 0;
      var col = G.save.done[id] ? '#80e080' : open ? '#f8d040' : '#9aa4b0';
      A.disc(ctx, p[0], p[1], 4, 4, '#0c1a3a');
      A.disc(ctx, p[0], p[1], 3, 3, col);
      var label = d.name, lw = F.width(label), where = MAP_SPOT[id].label, lx, ly;
      if (where === 'left') { lx = p[0] - lw - 8; ly = p[1] - 3; }
      else if (where === 'above') { lx = p[0] - Math.round(lw / 2); ly = p[1] - 14; }
      else { lx = p[0] + 8; ly = p[1] - 3; }
      lx = Math.max(2, Math.min(VW - lw - 2, lx));
      F.shadow(ctx, label, lx, ly, open ? (side ? '#ffe0b0' : '#ffffff') : '#c8d4dc');
    }
    var sel = mapPoint(G.mapSel);
    var hop = Math.abs(Math.round(Math.sin(G.t / 10) * 3));
    ctx.drawImage(A.player.magnio.normal.small.stand.r, sel[0] - 8, sel[1] - 19 - hop);

    drawCoinIcon(10, 8);
    F.shadow(ctx, 'KR ' + pad2(G.save.wallet[0].coins), 19, 8, '#ffffff');
    if (G.showClues) {
      var clues = G.save.clues.length ? G.save.clues : ['INGEN SPOR ENNÅ'];
      var cw = F.width('SPOR I SAKEN');
      for (i = 0; i < clues.length; i++) cw = Math.max(cw, F.width(clues[i]));
      var bx = Math.round((VW - cw) / 2) - 8, bh = 22 + clues.length * 11, by = Math.round((VH - 18 - bh) / 2);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(bx - 2, by - 2, cw + 20, bh + 4);
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(bx, by, cw + 16, bh);
      F.draw(ctx, 'SPOR I SAKEN', bx + 8, by + 6, '#ffe060');
      for (i = 0; i < clues.length; i++) F.draw(ctx, clues[i], bx + 8, by + 19 + i * 11, '#ffffff');
    }
    ctx.fillStyle = 'rgba(12,26,58,0.8)';
    ctx.fillRect(0, VH - 18, VW, 18);
    centered('PILER: VELG STED     ' + X + '  REIS DIT     ' + SQ + '  SPOR', VH - 13, '#ffffff');
  }

  function render() {
    if (G.state === 'story') { drawStory(); return; }
    if (G.state === 'map') { drawMap(); return; }
    if (G.state === 'box') { drawRingScene(); return; }
    if (G.state === 'credits') { drawCredits(); return; }
    if (G.state === 'cake') { SM.cake.draw(ctx); return; }
    if (G.state === 'minigame') { G.minigame.draw(ctx); return; }
    if (G.state === 'party') { SM.party.draw(ctx); return; }
    if (G.end && G.end.type === 'fly' && G.fade >= 1) { drawFlight(); return; }
    if (G.end && G.end.type === 'spout' && (G.end.phase === 'flash' || G.end.phase === 'clear')) drawOutside();
    else renderWorld();
    drawHUD();
    if (G.state === 'title') { drawTitle(); return; }
    if (G.intro > 0) drawIntro();
    else if (G.talk) drawTalk();
    else if (G.paused) drawPause();
    else if (G.end && G.end.phase === 'clear') drawClear();
    else if (G.end && G.end.type === 'finale') drawFinaleText();
    if (G.fade > 0) {
      var white = G.end && G.end.type === 'spout';
      ctx.globalAlpha = G.fade;
      ctx.fillStyle = white ? '#ffffff' : '#000000';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;
      if (!white && G.fade >= 1) centered('SLUKT!', 100, '#ffffff', 2);
    }
  }

  // ---------------------------------------------------------------- shortcuts
  // For testing: ?snarvei shows a page of links straight to each scene, and
  // ?til=<name> follows one. Nothing is saved while a shortcut is in use, so
  // the real progress in this browser stays as it was.
  function finishedSave() {
    var s = freshSave(), all = ORDER.concat(SIDE);
    for (var i = 0; i < all.length; i++) {
      s.open[all[i]] = true;
      s.done[all[i]] = true;
      var npcs = levelDef(all[i]).build().npcs || [];
      for (var j = 0; j < npcs.length; j++) if (npcs[j].clue && s.clues.indexOf(npcs[j].clue) < 0) s.clues.push(npcs[j].clue);
    }
    s.prologue = true;
    s.gloves = true;
    s.wallet[0] = { coins: 150, power: 2 }; // big, with boxing gloves
    return s;
  }

  // Start a level beside whoever starts the minigame, and start it, so the
  // level carries on from there afterwards.
  function atMinigame(level, game) {
    var who = (levelDef(level).build().npcs || []).filter(function (n) { return n.game === game; })[0];
    G.save = finishedSave();
    if (who && !startCol) startCol = who.x - 1;
    startLevel(level, 'kb1');
    G.intro = 0;
    // anyone who walks along with Magnio (Tove at Heim) has come with him
    var p = G.players[0];
    for (var i = 0; i < G.npcs.length; i++) {
      var n = G.npcs[i];
      if (n.follow) n.x = Math.max(0, Math.min(n.follow, p.x - 22));
    }
    startMinigame(game);
  }

  function atLillesandEnd() {
    G.save = finishedSave();
    startLevel('lillesand', 'kb1');
    G.intro = 0;
  }

  // In the order he would come across them: the start, each level (with the
  // drive on Harøya), and the ending.
  var SHORTCUTS = [
    ['tittel', 'Tittelskjermen', function () {}],
    ['prolog', 'Prologen', function () { G.save = freshSave(); startStory(PROLOGUE, function () { toMap('haroya'); }); }],
    ['kart', 'Kartet, ferdig: alt åpent og alle spor funnet', function () { G.save = finishedSave(); toMap('lillesand'); }]
  ];
  MAPLIST.forEach(function (id) {
    SHORTCUTS.push([id, 'Brett: ' + levelDef(id).name.charAt(0) + levelDef(id).name.slice(1).toLowerCase(), function () {
      G.save = finishedSave();
      startLevel(id, 'kb1');
    }]);
    if (id === 'haroya') {
      SHORTCUTS.push(['kjoretur', 'Kjøreturen på Harøya', function () { atMinigame('haroya', 'drive'); }]);
    }
    if (id === 'trondheim') {
      SHORTCUTS.push(['borsen', 'Børsen i Trondheim', function () { atMinigame('trondheim', 'bors'); }]);
    }
    if (id === 'heim') {
      SHORTCUTS.push(['catan', 'Catan på Heim', function () { atMinigame('heim', 'catan'); }]);
      SHORTCUTS.push(['sloying', 'Sløying av fisk på Heim', function () {
        G.save = finishedSave();
        if (!startCol) startCol = 45;
        startLevel('heim', 'kb1');
        G.intro = 0;
        for (var i = 0; i < G.npcs.length; i++) if (G.npcs[i].follow) { G.npcs[i].x = G.npcs[i].follow; G.npcs[i].fishing = true; }
        startMinigame('sloye', { fish: pickCatch() });
      }]);
    }
  });
  SHORTCUTS.push(
    ['boksekamp', 'Boksekampen', function () { atLillesandEnd(); startBox(); }],
    ['finale', 'Finalen med statuen', function () { atLillesandEnd(); startFinale(); }],
    ['rulletekst', 'Rulleteksten', function () { G.save = finishedSave(); AU.startMusic('main'); startCredits(); }],
    ['kake', 'Kakestykket etter rulleteksten', startCake],
    ['fest', 'Dansen helt til slutt', startParty]
  );

  function runShortcut(name) {
    for (var i = 0; i < SHORTCUTS.length; i++) if (SHORTCUTS[i][0] === name) { SHORTCUTS[i][2](); return; }
    console.warn('no shortcut called ' + name + '; see ?snarvei');
  }

  function showShortcuts() {
    autoFullscreen = false; // clicking a link should just follow it
    canvas.style.display = 'none';
    var page = document.createElement('div');
    page.style.cssText = 'color:#f4f4f4;font:16px/1.6 ui-monospace,Menlo,monospace;padding:24px;max-width:640px;margin:auto;align-self:flex-start';
    var html = '<h1 style="font-size:22px;color:#ffe060">Snarveier</h1>' +
      '<p>Rett til en scene, for testing. Fremgangen lagres ikke når man bruker en snarvei.</p><ul>';
    for (var i = 0; i < SHORTCUTS.length; i++) {
      html += '<li><a style="color:#90d8ff" href="?til=' + SHORTCUTS[i][0] + '">' + SHORTCUTS[i][1] + '</a></li>';
    }
    html += '</ul><p>Andre ting i adressen: <code>?ny</code> starter på nytt, <code>?stille</code> slår av lyden, ' +
      '<code>?windowed</code> hopper over fullskjerm og <code>?x=150</code> starter et brett ved kolonne 150. ' +
      'De kan kombineres, for eksempel <code>?til=haroya&amp;x=150&amp;stille</code>.</p>';
    page.innerHTML = html;
    document.body.style.overflow = 'auto';
    document.body.appendChild(page);
  }

  // ---------------------------------------------------------------- main loop
  // Fullscreen, as in smaa-verdener: the first key press or click fills the
  // screen, and F toggles it. Where the browser supports keyboard lock,
  // Escape then has to be held to leave fullscreen, so pressing it to pause
  // does not drop out. ?windowed in the address skips the automatic part.
  // A controller press cannot start fullscreen; browsers only allow it
  // after a key press or click.
  function enterFullscreen() {
    var el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    try {
      var r = el.requestFullscreen({ navigationUI: 'hide' });
      if (r && r.then) {
        r.then(function () {
          if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(function () {});
        }).catch(function () {});
      }
    } catch (e) { /* not allowed here; keep playing in the window */ }
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen().catch(function () {}); }
    else enterFullscreen();
  }
  var autoFullscreen = !navigator.webdriver && !/[?&]windowed\b/.test(location.search);
  function firstGesture() {
    if (autoFullscreen) enterFullscreen();
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('keydown', firstGesture);
  }
  window.addEventListener('pointerdown', firstGesture);
  window.addEventListener('keydown', firstGesture);
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
    if (e.code === 'KeyM') AU.toggleMusic();
  });
  canvas.addEventListener('dblclick', toggleFullscreen);

  // Hide the mouse pointer while playing with keys or a controller.
  var idleTimer = 0;
  window.addEventListener('pointermove', function () {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 2500);
  });

  toTitle();
  if (/[?&]snarvei\b/.test(location.search)) showShortcuts();
  else if (shortcut) runShortcut(shortcut);
  var STEP = 1000 / 60, acc = 0, last = performance.now();
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) { step(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
