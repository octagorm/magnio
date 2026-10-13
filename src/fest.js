// The very last screen, after the cake: Magnio and Frodigi dance to a funky
// tune, and one by one the people and animals from the game come in and
// dance behind them, with the whale nodding along at the back. Every few
// bars people change moves, wander to a new spot, or pop out for a while and
// come back. Three couples dance together, and now and then someone jumps
// into the whale's mouth and is blown out of the blowhole. It goes on until
// someone presses ✕.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216, FLOOR = 128; // the dance floor starts here
  var BEAT = 3600 / 112;               // frames per beat of the funk tune
  var BAR = BEAT * 4;
  var ARRIVE = 45;                     // frames between guests
  var X = '✕';

  // Who comes in, in this order. People stand in two rows behind the
  // dancers (row 0 at the back), and a guest with a partner dances with
  // them once both are there. The animals each have their own spot and
  // their own way of moving.
  var GUESTS = [
    { look: 'tove', x: 120, row: 1 }, { look: 'aslak', x: 36, row: 1, partner: 'kathinka' }, { look: 'kathinka', x: 54, row: 1 },
    { look: 'fride', x: 262, row: 1, partner: 'asta' }, { look: 'asta', x: 280, row: 1 }, { look: 'tellef', x: 330, row: 1 },
    { animal: 'sau', x: 26 }, { look: 'jonas', x: 140, row: 0, partner: 'hvalfanger' }, { look: 'hvalfanger', x: 158, row: 0 },
    { animal: 'fisk', x: 344 }, { look: 'fisker', x: 230, row: 0 }, { look: 'kone', x: 300, row: 0 },
    { animal: 'krabbe', x: 66 }, { look: 'professor', x: 80, row: 0 }, { look: 'student', x: 350, row: 0 },
    { animal: 'make' }, { animal: 'manet' }, { look: 'gorm', x: 14, row: 0 }
  ];
  var MOVES = ['hop', 'sway', 'spin', 'jump', 'shuffle'];
  var PAIR_MOVES = ['swing', 'hands', 'hands', 'twirl'];
  var ROW_FEET = [150, 170];
  var FRONT_FEET = 206;
  // The whale at the back, facing the dancers, and its blowhole and mouth on screen.
  var WHALE_X = VW - 152, WHALE_Y = FLOOR - 92;
  var BLOWHOLE = [WHALE_X + 121, WHALE_Y + 21], MOUTH = [WHALE_X + 18, WHALE_Y + 66];
  var COLORS = ['#ff4080', '#40c0ff', '#ffe040', '#80ff60', '#c060ff'];
  var TILES = ['#8a2450', '#24689a', '#8a7a1c', '#3a7a30', '#6a3090']; // dimmer, so the dancers stand out

  var S = null, env = null;

  function start(e) {
    env = e;
    S = { t: 0, bar: 0, guests: [], confetti: [], whale: { open: 0, spout: 0, rider: null } };
    AU.startMusic('funk');
  }

  function hash(a, b, c) {
    var h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // ---------------------------------------------------------------- choreography
  // Both partners there and dancing: returns the pair as [left, right].
  function couple(q) {
    var p = q.partner;
    if (!p || q.state !== 'dance' || p.state !== 'dance') return null;
    return q.def.partner ? [q, p] : [p, q];
  }

  // A free spot in a row, away from everyone else in it.
  function freeSpot(row, self) {
    for (var k = 0; k < 20; k++) {
      var x = 8 + Math.round(Math.random() * (VW - 32)), ok = true;
      for (var i = 0; i < S.guests.length; i++) {
        var q = S.guests[i];
        if (q === self || !q.def.look || q.row !== row || q.state === 'away') continue;
        if (Math.abs(q.home - x) < 22) { ok = false; break; }
      }
      if (ok) return x;
    }
    return self.home;
  }

  // At the start of every bar, some people try something new.
  function newBar() {
    var away = S.guests.filter(function (q) { return q.state === 'leave' || q.state === 'away'; }).length;
    if (!S.whale.rider && S.bar % 3 === 0 && Math.random() < 0.7) intoWhale();
    for (var i = 0; i < S.guests.length; i++) {
      var q = S.guests[i];
      if (!q.def.look) continue;
      if (q.state === 'away') {
        if (--q.awayBars <= 0) {
          q.row = Math.random() < 0.5 ? 0 : 1;
          q.home = freeSpot(q.row, q);
          q.x = q.home < VW / 2 ? -24 : VW + 8;
          q.state = 'walk';
        }
        continue;
      }
      if (q.state !== 'dance') continue;
      var pair = couple(q);
      if (pair) {
        if (q === pair[0] && Math.random() < 0.5) pair[0].pairMove = pick(PAIR_MOVES);
        continue;
      }
      if (q.partner) { if (Math.random() < 0.4) q.move = pick(MOVES); continue; } // waiting for the partner
      var r = Math.random();
      if (r < 0.05 && away < 2) {
        q.state = 'leave'; away++;
        q.home = q.x < VW / 2 ? -24 : VW + 8;
      } else if (r < 0.17) {
        q.state = 'walk';
        q.home = freeSpot(q.row, q);
      } else if (r < 0.5) {
        q.move = pick(MOVES);
      }
    }
  }

  // Someone dancing on their own takes a running jump into the whale's
  // mouth, is swallowed, and a moment later shoots out of the blowhole and
  // tumbles down onto the floor somewhere else.
  function intoWhale() {
    var free = S.guests.filter(function (q) { return q.def.look && q.state === 'dance' && !q.partner; });
    if (!free.length) return;
    var q = pick(free), dist = Math.abs(MOUTH[0] - 8 - q.x);
    q.state = 'ride';
    q.ride = { phase: 'dive', t: 0, x0: q.x, f0: ROW_FEET[q.row], x1: MOUTH[0] - 8, f1: MOUTH[1] + 14,
      n: Math.round(30 + dist / 5), h: Math.round(20 + dist / 8) };
    S.whale.rider = q;
  }

  // Where along a jump someone is: [x, feet].
  function arc(r) {
    var u = Math.min(1, r.t / r.n);
    return [r.x0 + (r.x1 - r.x0) * u, r.f0 + (r.f1 - r.f0) * u - Math.sin(Math.PI * u) * r.h];
  }

  function stepRide(q) {
    var r = q.ride;
    r.t++;
    if (r.phase === 'dive' && r.t >= r.n) {
      q.ride = { phase: 'inside', t: 0 };
      AU.sfx('gulp');
    } else if (r.phase === 'inside' && r.t >= 70) {
      q.row = Math.random() < 0.5 ? 0 : 1;
      q.home = freeSpot(q.row, q);
      q.ride = { phase: 'spout', t: 0, x0: BLOWHOLE[0] - 8, f0: BLOWHOLE[1] + 20, x1: q.home, f1: ROW_FEET[q.row], n: 80, h: 90 };
      S.whale.spout = 60;
      AU.sfx('spout');
    } else if (r.phase === 'spout' && r.t >= r.n) {
      q.x = q.home;
      q.ride = null;
      q.state = 'dance';
      S.whale.rider = null;
    }
  }

  function step() {
    S.t++;
    var n = Math.floor(S.t / ARRIVE), i;
    while (S.guests.length < Math.min(n, GUESTS.length)) {
      var g = GUESTS[S.guests.length], fromLeft = (g.x || 0) < VW / 2;
      var q = { def: g, i: S.guests.length, x: fromLeft ? -24 : VW + 8, home: g.x, row: g.row, state: 'walk',
        move: MOVES[S.guests.length % MOVES.length], pairMove: 'hands' };
      if (g.animal) q.state = 'arrive';
      S.guests.push(q);
      // the second partner to arrive links the couple
      for (i = 0; i < S.guests.length - 1; i++) {
        var o = S.guests[i];
        if (g.look && o.def.partner === g.look) { o.partner = q; q.partner = o; }
      }
    }
    var b = Math.floor(S.t / BAR);
    if (b !== S.bar) { S.bar = b; newBar(); }
    for (i = 0; i < S.guests.length; i++) {
      q = S.guests[i];
      if (q.ride) { stepRide(q); continue; }
      if (q.state === 'dance' || q.state === 'away' || q.def.animal === 'make' || q.def.animal === 'manet') continue;
      var dx = q.home - q.x;
      if (Math.abs(dx) > 1.3) { q.x += dx > 0 ? 1.3 : -1.3; continue; }
      q.x = q.home;
      if (q.state === 'leave') { q.state = 'away'; q.awayBars = 2 + Math.floor(Math.random() * 3); } else q.state = 'dance';
    }
    var W = S.whale, beat = Math.floor(S.t / BEAT);
    if (W.rider && W.rider.ride.phase === 'dive') W.open = Math.min(12, W.open + 1);
    else W.open = beat % 2 ? Math.round(Math.abs(Math.sin(Math.PI * S.t / BEAT)) * 5) : 0; // singing along
    if (W.spout > 0) W.spout--;
    if (S.t % 4 === 0) {
      S.confetti.push({ x: Math.random() * VW, y: -4, vy: 0.5 + Math.random() * 0.5, col: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
    for (i = 0; i < S.confetti.length; i++) S.confetti[i].y += S.confetti[i].vy;
    S.confetti = S.confetti.filter(function (c) { return c.y < VH; });
    if (S.t > 300 && (env.pressed('jumpP') || env.pressed('startP'))) env.done();
  }

  // ---------------------------------------------------------------- drawing
  function drawRoom(ctx, beat) {
    ctx.fillStyle = '#1c1034';
    ctx.fillRect(0, 0, VW, FLOOR);
    // beams of light from the disco ball, sweeping back and forth
    ctx.globalAlpha = 0.13;
    for (var b = 0; b < 4; b++) {
      var a = Math.PI / 2 + Math.sin(S.t / 50 + b * 1.7) * 1.1;
      ctx.fillStyle = COLORS[b];
      ctx.beginPath();
      ctx.moveTo(192, 16);
      ctx.lineTo(192 + Math.cos(a - 0.12) * 400, 16 + Math.sin(a - 0.12) * 400);
      ctx.lineTo(192 + Math.cos(a + 0.12) * 400, 16 + Math.sin(a + 0.12) * 400);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the dance floor: tiles that light up on the beat
    ctx.fillStyle = '#140a24';
    ctx.fillRect(0, FLOOR, VW, VH - FLOOR);
    for (var ty = 0; FLOOR + ty * 12 < VH; ty++) {
      for (var tx = 0; tx < VW / 16; tx++) {
        var h = hash(tx, ty, beat);
        ctx.fillStyle = h % 4 === 0 ? TILES[(h >> 3) % TILES.length] : '#2a1a40';
        ctx.fillRect(tx * 16, FLOOR + ty * 12, 15, 11);
      }
    }
    // the disco ball
    ctx.fillStyle = '#808080';
    ctx.fillRect(191, 0, 1, 7);
    A.disc(ctx, 192, 16, 9, 9, '#6a6a78');
    for (var y = -8; y <= 8; y += 3) {
      for (var x = -8; x <= 8; x += 3) {
        if (x * x + y * y > 72) continue;
        var lit = hash(x + 20, y + 20, Math.floor(S.t / 6)) % 4 === 0;
        ctx.fillStyle = lit ? '#ffffff' : ((x + y) & 2 ? '#b8b8c8' : '#9a9aac');
        ctx.fillRect(192 + x, 16 + y, 2, 2);
      }
    }
  }

  // The whale nods on every beat, the head dipping while the tail end
  // stays put, and drops its jaw when it sings or swallows someone.
  function drawWhale(ctx) {
    var W = S.whale;
    A.drawWhale(ctx, WHALE_X, WHALE_Y, W.open, Math.abs(Math.sin(Math.PI * S.t / BEAT)) * 6);
    if (W.spout > 0) {
      // the spout: a column of water out of the blowhole, rising then falling back
      var top = Math.round(Math.min(46, (60 - W.spout) * 4, W.spout * 2));
      for (var y = 0; y < top; y++) {
        var wob = Math.round(Math.sin((y + S.t) / 3) * (1 + y / 14));
        ctx.fillStyle = y % 3 ? '#8ac4ec' : '#c8f0f8';
        ctx.fillRect(BLOWHOLE[0] - 2 + wob, BLOWHOLE[1] - y, 5, 1);
      }
      if (top > 6) for (var k = 0; k < 6; k++) {
        ctx.fillStyle = '#c8f0f8';
        ctx.fillRect(BLOWHOLE[0] + Math.round(Math.cos(k + S.t / 9) * 8), BLOWHOLE[1] - top + (k % 3) * 2, 2, 2);
      }
    }
  }

  // A hop on every beat. Half the guests are off the beat, so the crowd bounces.
  function hop(i, height, period) {
    return Math.round(Math.abs(Math.sin(Math.PI * (S.t / (period || BEAT) + (i % 2) * 0.5))) * height);
  }

  function drawPerson(ctx, look, x, feet, left) {
    var spr = left ? A.npc[look].l : A.npc[look].r;
    ctx.drawImage(spr, Math.round(x), Math.round(feet - spr.height));
    return spr;
  }

  // Where a dancing person is this frame, by their move: [x offset, lift, facing left].
  function pose(q, beat) {
    var i = q.i, phase = S.t / BEAT;
    switch (q.move) {
      case 'sway': return [Math.sin(phase * Math.PI / 2) * 5, hop(i, 1), Math.cos(phase * Math.PI / 2) < 0];
      case 'spin': return [0, hop(i, 2), Math.floor(S.t / (BEAT / 4)) % 2 === 0];
      case 'jump': return [0, hop(i, 12, BEAT * 2), (Math.floor(beat / 2) + i) % 2 === 0];
      case 'shuffle': return [beat % 2 ? 3 : -3, hop(i, 2), beat % 2 === 0];
      default: return [0, hop(i, 4), (Math.floor(beat / 2) + i) % 2 === 0];
    }
  }

  function drawCouple(ctx, a, b, beat) {
    var feet = ROW_FEET[a.row], move = a.pairMove, phase = S.t / BEAT;
    if (move === 'swing') {
      // round and round each other, half a turn per bar
      var c = (a.home + b.home) / 2, th = phase * Math.PI / 2, dx = Math.cos(th) * 9, dy = Math.sin(th) * 2;
      var pa = [c - dx, feet - dy], pb = [c + dx, feet + dy];
      var first = dy > 0 ? [a, pa, pb] : [b, pb, pa], second = dy > 0 ? [b, pb, pa] : [a, pa, pb];
      drawPerson(ctx, first[0].def.look, first[1][0], first[1][1] - hop(0, 2), first[2][0] < first[1][0]);
      drawPerson(ctx, second[0].def.look, second[1][0], second[1][1] - hop(0, 2), second[2][0] < second[1][0]);
      return;
    }
    if (move === 'twirl') {
      // one spins on the spot while the other bounces along
      drawPerson(ctx, a.def.look, a.home, feet - hop(0, 2), Math.floor(S.t / (BEAT / 4)) % 2 === 0);
      drawPerson(ctx, b.def.look, b.home, feet - hop(1, 3), true);
      return;
    }
    // hand in hand, facing each other, bouncing on alternate beats
    var ha = hop(0, 3), hb = hop(1, 3);
    var la = drawPerson(ctx, a.def.look, a.home, feet - ha, false);
    var lb = drawPerson(ctx, b.def.look, b.home, feet - hb, true);
    var hy = Math.round(feet - Math.min(la.height, lb.height) * 0.42 - (ha + hb) / 2);
    ctx.fillStyle = '#f8c088';
    ctx.fillRect(Math.round(a.home) + 13, hy, Math.round(b.home - a.home) - 10, 2);
  }

  function drawGuest(ctx, q, beat) {
    var d = q.def, i = q.i, left = (Math.floor(beat / 2) + i) % 2 === 0, spr, x, y;
    if (d.look) {
      var pair = couple(q);
      if (pair) { if (q === pair[0]) drawCouple(ctx, pair[0], pair[1], beat); return; }
      if (q.state === 'away') return;
      if (q.ride) {
        if (q.ride.phase === 'inside') return;
        var at = arc(q.ride), r = q.ride;
        // diving: facing the mouth; out of the blowhole: tumbling over and over
        left = r.phase === 'dive' ? r.x1 < r.x0 : Math.floor(S.t / 5) % 2 === 0;
        drawPerson(ctx, d.look, at[0], at[1], left);
        return;
      }
      var feet = ROW_FEET[q.row];
      if (q.state !== 'dance') { drawPerson(ctx, d.look, q.x, feet - ((S.t >> 3) & 1), q.home < q.x); return; }
      var p = pose(q, beat);
      drawPerson(ctx, d.look, q.x + p[0], feet - p[1], p[2]);
      return;
    }
    var t = S.t - i * ARRIVE, flap = Math.floor(S.t / 8) % 2 ? 'walk2' : 'walk1', arrived = q.state === 'dance';
    if (d.animal === 'sau') {
      spr = A.decor.sau;
      x = Math.round(q.x); y = FRONT_FEET - spr.height - (arrived ? hop(i, 6) : 0);
      if (left) ctx.drawImage(spr, x, y);
      else { ctx.save(); ctx.translate(x + spr.width, y); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0); ctx.restore(); }
    } else if (d.animal === 'krabbe') {
      // sideways, of course
      spr = A.enemy.krabbe[flap].l;
      x = Math.round(q.x + (arrived ? Math.sin(S.t / BEAT * Math.PI) * 10 : 0));
      ctx.drawImage(spr, x, FRONT_FEET - spr.height);
    } else if (d.animal === 'fisk') {
      // leaps up and flips over at the top of every jump
      spr = A.enemy.fisk[flap][left ? 'l' : 'r'];
      x = Math.round(q.x); y = FRONT_FEET - spr.height - (arrived ? hop(i, 22) : 0);
      ctx.drawImage(spr, x, y);
    } else if (d.animal === 'make') {
      // circles above everyone, beak first (the sprite is drawn facing left)
      var a = t / 45, swing = Math.min(1, t / 90);
      x = Math.round(192 + Math.cos(a) * 150 * swing + (1 - swing) * 250);
      y = Math.round(54 + Math.sin(a * 2) * 12);
      spr = A.enemy.make[flap][Math.sin(a) > 0 ? 'r' : 'l'];
      ctx.drawImage(spr, x - 8, y);
    } else if (d.animal === 'manet') {
      // drifts down from the ceiling and bobs to the beat
      x = 40; y = Math.round(Math.min(64, -20 + t * 0.6) - hop(i, 5));
      ctx.drawImage(A.enemy.manet[flap].r, x, y);
    }
  }

  // Magnio and Frodigi in front, mirroring each other through an eight-beat routine.
  function drawStars(ctx, beat) {
    var b = beat % 8, frame, h, flip;
    if (b < 4) { frame = b % 2 ? 'walk2' : 'walk1'; h = hop(0, 3); flip = b % 2; }
    else if (b < 6) { frame = 'jump'; h = hop(0, 9); flip = 0; }
    else { frame = 'stand'; h = hop(0, 2); flip = Math.floor(S.t / (BEAT / 2)) % 2; }
    var who = [['magnio', 166, 1], ['frodigi', 202, -1]];
    for (var i = 0; i < who.length; i++) {
      var facing = (flip ? -1 : 1) * who[i][2];
      var spr = A.player[who[i][0]].normal.big[frame][facing > 0 ? 'r' : 'l'];
      ctx.drawImage(spr, who[i][1], FRONT_FEET - spr.height - h);
    }
  }

  function depth(q) {
    var d = q.def;
    if (q.ride) return 8; // flying through the air, in front of everyone else
    if (d.animal === 'make' || d.animal === 'manet') return 9;
    return d.look ? q.row : 5;
  }

  function draw(ctx) {
    var beat = Math.floor(S.t / BEAT), i;
    drawRoom(ctx, beat);
    drawWhale(ctx);
    for (i = 0; i < S.confetti.length; i++) {
      ctx.fillStyle = S.confetti[i].col;
      ctx.fillRect(Math.round(S.confetti[i].x), Math.round(S.confetti[i].y), 2, 2);
    }
    // back to front, so the nearer rows stand in front
    var order = S.guests.slice().sort(function (p, q) { return depth(p) - depth(q) || p.i - q.i; });
    for (i = 0; i < order.length; i++) drawGuest(ctx, order[i], beat);
    drawStars(ctx, beat);
    var text = 'GRATLA MED DAGEN, MAGNIO!';
    F.outline(ctx, text, Math.round((VW - F.width(text, 2)) / 2), 34, COLORS[beat % COLORS.length], 2, '#000');
    if (S.t > 300 && (S.t >> 5) & 1) F.draw(ctx, X, VW - 12, VH - 10, '#ffffff');
  }

  SM.party = { start: start, step: step, draw: draw, state: function () { return S; } }; // state is for poking at from the console
})();
