// All the pixel art. Characters, enemies and items are drawn as text grids,
// one letter per pixel, coloured through a palette. Tiles and scenery are
// drawn with small helper functions. Everything is rendered once at load
// into little canvases that the game blits each frame.
(function () {
  var SM = window.SM = window.SM || {};

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function fromRows(rows, pal, name) {
    var h = rows.length, w = rows[0].length;
    var c = mk(w, h), g = c.getContext('2d');
    for (var y = 0; y < h; y++) {
      if (rows[y].length !== w) console.warn('sprite ' + name + ': row ' + y + ' is ' + rows[y].length + ' wide, expected ' + w);
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch === '.') continue;
        if (!pal[ch]) { console.warn('sprite ' + name + ': no colour for ' + ch); continue; }
        g.fillStyle = pal[ch];
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function mirror(src) {
    var c = mk(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  // r = facing right, l = facing left
  function pair(rows, pal, name) {
    var r = fromRows(rows, pal, name);
    return { r: r, l: mirror(r) };
  }

  function merge(a, b) {
    var o = {}, k;
    for (k in a) o[k] = a[k];
    for (k in b) o[k] = b[k];
    return o;
  }

  function rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }

  // Crisp filled ellipse, one scanline at a time, so edges stay pixel-sharp.
  function disc(g, cx, cy, rx, ry, col) {
    g.fillStyle = col;
    if (ry <= 0) { g.fillRect(cx - rx, cy, rx * 2 + 1, 1); return; }
    for (var y = -ry; y <= ry; y++) {
      var t = 1 - (y * y) / (ry * ry);
      var hw = Math.floor(rx * Math.sqrt(Math.max(0, t)) + 0.5);
      g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
    }
  }

  // ---------------------------------------------------------------- players
  // C = flat cap, R = jumper, B/b = the patterned band across the chest,
  // O = trousers, S = skin, P = nose, W/w = moustache, H = hair, K = eyes,
  // N = shoes.

  var SMALL_TOP = [
    '......CCCCc.....',
    '.....CcCCCCCCC..',
    '.....HHSSKS.....',
    '....HSSSSKSSS...',
    '....HSSSSSSPPS..',
    '....HSSWWWWWWW..',
    '.....SSSwwSwww..',
    '......SSSSS.....',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...RBbBbBbBbR...',
    '...SSRRRRRRSS...'
  ];
  var SMALL_TOP_JUMP = SMALL_TOP.slice(0, 8).concat([
    '.....RRRRRR.SS..',
    '....RRRRRRRRR...',
    '..SSBbBbBbBbR...',
    '..SS.RRRRRR.....'
  ]);
  var SMALL_LEGS = {
    stand: [
      '....OOOOOOOO....',
      '....OOO..OOO....',
      '...NNNN..NNNN...',
      '..NNNNN..NNNNN..'
    ],
    walk1: [
      '...OOOOOOOOO....',
      '..OOOO....OOO...',
      '.NNNN......NNN..',
      '.NNN.......NNNN.'
    ],
    walk2: [
      '....OOOOOOO.....',
      '.....OOOOO......',
      '.....NNNNN......',
      '....NNNNNNN.....'
    ]
  };
  var SMALL = {
    stand: SMALL_TOP.concat(SMALL_LEGS.stand),
    walk1: SMALL_TOP.concat(SMALL_LEGS.walk1),
    walk2: SMALL_TOP.concat(SMALL_LEGS.walk2),
    jump: SMALL_TOP_JUMP.concat(SMALL_LEGS.walk1)
  };

  var BIG_HEAD = [
    '.....CCCCCc.....',
    '....CCcCCCCCCC..',
    '....CCCCCCCCCCCC',
    '....HHHSSSKS....',
    '...HHSSSSSKSS...',
    '...HSSSSSSSPPS..',
    '...HSSSSSSPPPP..',
    '...HSSSWWWWWWW..',
    '....SSWWWWWWWWW.',
    '....SSSwwSSwww..',
    '.....SSSSSSSS...',
    '......SSSSSS....'
  ];
  var BIG_TORSO = [
    '.....RRRRRRR....',
    '....RRRRRRRRRR..',
    '...RRRRRRRRRRRR.',
    '..RBbBbBbBbBbBbR',
    '..RbBbBbBbBbBbBR',
    '..RRR.RRRRRR.RRR',
    '..SSS.RRRRRR.SSS',
    '..SS..RRRRRR..SS',
    '......OOOOOO....',
    '.....OOOOOOOO...'
  ];
  var BIG_TORSO_JUMP = [
    '.....RRRRRRR.SS.',
    '....RRRRRRRRRSS.',
    '...RRRRRRRRRRRR.',
    '..RBbBbBbBbBbBR.',
    '..RbBbBbBbBbBR..',
    '..RRR.RRRRRR....',
    '..SSS.RRRRRR....',
    '..SS..RRRRRR....',
    '......OOOOOO....',
    '.....OOOOOOOO...'
  ];
  var BIG_LEGS = {
    stand: [
      '.....OOOOOOOO...',
      '....OOOOOOOOOO..',
      '....OOOO..OOOO..',
      '....OOOO..OOOO..',
      '....OOO....OOO..',
      '....OOO....OOO..',
      '....OOO....OOO..',
      '...NNNN....NNNN.',
      '..NNNNN....NNNNN',
      '..NNNNN....NNNNN'
    ],
    walk1: [
      '.....OOOOOOOO...',
      '....OOOOOOOOOO..',
      '...OOOO...OOOO..',
      '..OOOO.....OOOO.',
      '..OOO.......OOO.',
      '.OOO........OOO.',
      '.OOO.........OOO',
      'NNNN.........NNN',
      'NNNN........NNNN',
      'NNN.........NNNN'
    ],
    walk2: [
      '.....OOOOOOOO...',
      '.....OOOOOOOO...',
      '......OOOOOO....',
      '......OOOOOO....',
      '......OOOOO.....',
      '.......OOOO.....',
      '.......OOOO.....',
      '......NNNNN.....',
      '.....NNNNNNN....',
      '.....NNNNNNN....'
    ]
  };
  var BIG = {
    stand: BIG_HEAD.concat(BIG_TORSO, BIG_LEGS.stand),
    walk1: BIG_HEAD.concat(BIG_TORSO, BIG_LEGS.walk1),
    walk2: BIG_HEAD.concat(BIG_TORSO, BIG_LEGS.walk2),
    jump: BIG_HEAD.concat(BIG_TORSO_JUMP, BIG_LEGS.walk1)
  };

  var BASE = {
    K: '#141414', S: '#f8c088', P: '#e8946a', W: '#f4f4f4', w: '#a8a8a8', H: '#b4b4b4',
    N: '#5a3416', C: '#7a5c3c', c: '#a8865e', b: '#1f2f6a'
  };
  var CHARS = {
    magnio: {
      normal: { R: '#c8281c', B: '#f4f4f4', O: '#2a3448' },
      fire: { R: '#f0f0ea', B: '#c8281c', O: '#2a3448' }
    },
    frodigi: {
      normal: { R: '#1f8e3a', B: '#f4f4f4', O: '#3a3020' },
      fire: { R: '#f0f0ea', B: '#1f8e3a', O: '#3a3020' }
    }
  };
  // Golden glow while the cognac lasts. The game cycles through these.
  var STAR = [
    { R: '#f8b800', B: '#fff6c0', O: '#d82818', C: '#f8d040' },
    { R: '#ffffff', B: '#f8b800', O: '#f8b800', C: '#ffffff' },
    { R: '#f87800', B: '#ffd080', O: '#3a2a10', C: '#f87800' }
  ];

  var player = {};
  for (var ch in CHARS) {
    player[ch] = {};
    var variants = { normal: CHARS[ch].normal, fire: CHARS[ch].fire, star0: STAR[0], star1: STAR[1], star2: STAR[2] };
    for (var v in variants) {
      var pal = merge(BASE, variants[v]);
      var set = { small: {}, big: {} };
      for (var f in SMALL) set.small[f] = pair(SMALL[f], pal, ch + ' small ' + f);
      for (f in BIG) set.big[f] = pair(BIG[f], pal, ch + ' big ' + f);
      player[ch][v] = set;
    }
  }

  // ---------------------------------------------------------------- enemies
  // Regningen: an angry envelope. Stomp it and it is BETALT.
  var BILL_TOP = [
    '................',
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KEKEEEEEEEEKEK.',
    '.KEEKEEEEEEKEEK.',
    '.KEEEKEEEEKEEEK.',
    '.KEEEEKKKKEEEEK.',
    '.KEKKEEEEEEKKEK.',
    '.KEEEKKEEKKEEEK.',
    '.KEEEKKEEKKEEEK.',
    '.KEEEEEEEEEEEEK.',
    '.KEEEEKKKKEEEEK.',
    '.KEEEKEEEEKEEEK.',
    '.KKKKKKKKKKKKKK.'
  ];
  var BILL_FLAT = [
    '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................',
    '.KKKKKKKKKKKKKK.',
    '.KEKKEEEEEEKKEK.',
    '.KEEEKKEEKKEEEK.',
    '.KEEEEKKKKEEEEK.',
    '.KKKKKKKKKKKKKK.',
    '.NNNN......NNNN.'
  ];
  // Krabben: walks along the docks. Stomp it and it pulls in its legs,
  // then it can be kicked along like a shell.
  var CRAB_TOP = [
    '................', '................', '................', '................',
    '.RR..........RR.',
    'RRRR........RRRR',
    'RRR..K....K..RRR',
    '.RR..K....K..RR.',
    '..R.RRRRRRRR.R..',
    '...RRRRRRRRRR...',
    '..RRrRRRRRRrRR..',
    '..RRRRRRRRRRRR..',
    '...rRRRRRRRRr...'
  ];
  var CRAB_SHELL = [
    '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................',
    '...RRRRRRRRRR...',
    '..RRrRRRRRRrRR..',
    '.RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRR.',
    '..rRRRRRRRRRRr..',
    '...rrrrrrrrrr...'
  ];
  // Flåtten: lives in the heather on Blåbæråsen.
  var TICK_TOP = [
    '................', '................', '................', '................', '................',
    '................', '................',
    '......KKKK......',
    '.....KrrrrK.....',
    '..K.KrrrrrrK.K..',
    '...KrrrrrrrrK...',
    '.K.KrrWrrWrrK.K.',
    '..KKrrrrrrrrKK..'
  ];
  var TICK_FLAT = [
    '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................',
    '................', '................',
    '..KKKKKKKKKKKK..',
    '.KrrrrrrrrrrrrK.',
    '.KKKKKKKKKKKKKK.',
    'K.K.K......K.K.K'
  ];
  var EPAL = { K: '#2a1a10', E: '#f4e8c8', N: '#6a3a1a' };
  var CPAL = { R: '#e04020', r: '#a02010', K: '#141414' };
  var TPAL = { K: '#2a1a14', r: '#6a2a1a', W: '#f4f4f4' };
  var enemy = {
    bill: {
      walk1: pair(BILL_TOP.concat(['..NNN......NNN..', '.NNNN......NNNN.']), EPAL, 'bill1'),
      walk2: pair(BILL_TOP.concat(['...NNN....NNN...', '..NNNN....NNNN..']), EPAL, 'bill2'),
      flat: pair(BILL_FLAT, EPAL, 'billflat')
    },
    krabbe: {
      walk1: pair(CRAB_TOP.concat(['..R.r......r.R..', '.R..R......R..R.', '.R............R.']), CPAL, 'crab1'),
      walk2: pair(CRAB_TOP.concat(['...R.r....r.R...', '..R..R....R..R..', '..R..........R..']), CPAL, 'crab2'),
      shell: pair(CRAB_SHELL, CPAL, 'crabshell')
    },
    flatt: {
      walk1: pair(TICK_TOP.concat(['.K.KrrrrrrrrK.K.', '...K.KKKKKK.K...', '..K..........K..']), TPAL, 'tick1'),
      walk2: pair(TICK_TOP.concat(['..KKrrrrrrrrKK..', '.K.K.KKKKKK.K.K.', '................']), TPAL, 'tick2'),
      flat: pair(TICK_FLAT, TPAL, 'tickflat')
    }
  };

  // ---------------------------------------------------------------- items
  var CHOC = [
    '................',
    '................',
    '..YYYYYYYYYYYYY.',
    '..YWYYYYYYYYYYY.',
    '..YYYYYYYYYYYYY.',
    '..KKKKKKKKKKKKK.',
    '..KLLDKLLDKLLDK.',
    '..KLDDKLDDKLDDK.',
    '..KKKKKKKKKKKKK.',
    '..KLLDKLLDKLLDK.',
    '..KLDDKLDDKLDDK.',
    '..KKKKKKKKKKKKK.',
    '..RRRRRRRRRRRRR.',
    '..RRWRRRRRRRRRR.',
    '..RRRRRRRRRRRRR.',
    '................'
  ];
  var CIGAR = [
    '................',
    '................',
    '................',
    '...........G....',
    '............G...',
    '...........G....',
    '..........G.....',
    '...........G....',
    '................',
    '...NNNNNNrYrNNNe',
    '..nNNNNNNrYrNNNe',
    '...nnnnnnrrrnnne',
    '................',
    '................',
    '................',
    '................'
  ];
  var COGNAC = [
    '................',
    '....WWWWWWWW....',
    '...W........W...',
    '..W..........W..',
    '.W.w..........W.',
    '.WAAAAAAAAAAAAW.',
    '.WAwAAAAAAAAAAW.',
    '.WAAAAAAAAAAAaW.',
    '..WAAAAAAAAAaW..',
    '...WAAAAAAAaW...',
    '....WWWWWWWW....',
    '.......WW.......',
    '.......WW.......',
    '.......WW.......',
    '.....WWWWWW.....',
    '....WWWWWWWW....'
  ];
  var BAG = [
    '................',
    '................',
    '......NN.NN.....',
    '.......NNN......',
    '......rrrrr.....',
    '.....NNNNNNN....',
    '....NNNNNNNNN...',
    '...NNNNYNNNNNN..',
    '...NNNYYYNNNNN..',
    '...NNNYNNNNNNN..',
    '...NNNYYYNNNNN..',
    '...NNNNNYNNNNN..',
    '...NNNYYYNNNNN..',
    '....NNNNYNNNN...',
    '.....NNNNNNN....',
    '................'
  ];
  var COIN0 = [
    '................',
    '......YYYY......',
    '.....YYYYYY.....',
    '....YYwYYYYD....',
    '....YwYYYYYD....',
    '....YwYDDYYD....',
    '....YwYDYYYD....',
    '....YwYDYYYD....',
    '....YwYDYYYD....',
    '....YwYDDYYD....',
    '....YwYYYYYD....',
    '....YYYYYYDD....',
    '.....YYYYDD.....',
    '......DDDD......',
    '................',
    '................'
  ];
  var COIN1 = [
    '................',
    '.......YY.......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YwYD......',
    '......YYDD......',
    '.......DD.......',
    '................',
    '................'
  ];
  var COIN2 = [
    '................',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '.......YD.......',
    '................',
    '................'
  ];
  var RING = [
    '..WWWW..',
    '.WGGGGW.',
    'WG....GW',
    'WG....GW',
    'WG....GW',
    'WG....GW',
    '.WGGGGW.',
    '..WWWW..'
  ];

  var item = {
    choc: fromRows(CHOC, { Y: '#f8d040', W: '#fff8c0', K: '#3a1806', L: '#9a5a2a', D: '#6a3414', R: '#c81e1e' }, 'choc'),
    cigar: fromRows(CIGAR, { N: '#a06a38', n: '#6a4020', r: '#c01818', Y: '#f8d040', e: '#ff8020', G: '#d8d8d8' }, 'cigar'),
    cognac: fromRows(COGNAC, { W: '#dff0ff', A: '#e08a20', a: '#a85810', w: '#fff4c8' }, 'cognac'),
    bag: fromRows(BAG, { N: '#b08040', r: '#c01818', Y: '#f8d040' }, 'bag'),
    coin: [COIN0, COIN1, COIN2].map(function (rows, i) {
      return fromRows(rows, { Y: '#f8c818', w: '#fff8b0', D: '#b07810' }, 'coin' + i);
    })
  };
  var ring = fromRows(RING, { W: '#f0f0f0', G: '#a8a8a8' }, 'ring');

  // ---------------------------------------------------------------- tiles
  // The water line sits 6 pixels below the top of the ground row, both
  // under the docks and in the open water between them.
  var WATER = '#1d4d74', WATER_DEEP = '#18405f';

  function tile(draw) {
    var c = mk(16, 16);
    draw(c.getContext('2d'));
    return c;
  }

  // Bryggekant: wooden decking over the harbour, with a piling underneath.
  function dockTop(g) {
    rect(g, 0, 0, 16, 16, WATER);
    rect(g, 6, 6, 4, 10, '#5a4028'); rect(g, 6, 6, 1, 10, '#7a5a38');
    rect(g, 0, 0, 16, 6, '#8a6a48');
    rect(g, 0, 0, 16, 1, '#c8a878');
    rect(g, 0, 5, 16, 1, '#3a2614');
    for (var x = 3; x < 16; x += 6) rect(g, x, 1, 1, 4, '#5a4028');
    rect(g, 1, 3, 1, 1, '#3a2614'); rect(g, 13, 3, 1, 1, '#3a2614');
  }
  function dockFill(g) {
    rect(g, 0, 0, 16, 16, WATER_DEEP);
    rect(g, 6, 0, 4, 16, '#5a4028'); rect(g, 6, 0, 1, 16, '#7a5a38');
    rect(g, 1, 5, 3, 1, '#2a5a84'); rect(g, 11, 11, 3, 1, '#2a5a84');
  }

  // Brostein: cobbles in the town streets.
  function cobbles(g, curb) {
    rect(g, 0, 0, 16, 16, '#5c5a58');
    for (var y = curb ? 3 : 0; y < 16; y += 4) {
      for (var x = ((y >> 2) % 2) ? -2 : 0; x < 16; x += 5) {
        rect(g, x, y, 4, 3, '#a09c98');
        rect(g, x, y, 3, 1, '#c4c0bc');
      }
    }
    if (curb) {
      rect(g, 0, 0, 16, 2, '#d4d0cc');
      rect(g, 0, 2, 16, 1, '#77736f');
    }
  }

  // Granite with moss and heather on top, for Blåbæråsen.
  var SPECKS = [[2, 3], [7, 9], [12, 5], [4, 13], [10, 12], [14, 9], [1, 8], [8, 2]];
  function granite(g) {
    rect(g, 0, 0, 16, 16, '#a89c96');
    for (var i = 0; i < SPECKS.length; i++) {
      rect(g, SPECKS[i][0], SPECKS[i][1], 1, 1, i % 2 ? '#7a6e68' : '#d0c4bc');
    }
    rect(g, 5, 6, 1, 3, '#8a7e78');
  }
  function heather(g) {
    granite(g);
    rect(g, 0, 0, 16, 4, '#3f7a2e');
    rect(g, 0, 0, 16, 1, '#6aa848');
    var tufts = [0, 3, 5, 9, 12, 14];
    for (var i = 0; i < tufts.length; i++) rect(g, tufts[i], 4, 1, 1 + (i % 2), '#2a5a20');
    rect(g, 3, 2, 1, 1, '#2c3a9c'); rect(g, 11, 1, 1, 1, '#2c3a9c'); rect(g, 12, 2, 1, 1, '#4a5ad0');
  }

  // Trekasse: a wooden crate. Big Magnio can smash these.
  function crate(g) {
    rect(g, 0, 0, 16, 16, '#5a3a1c');
    rect(g, 1, 1, 14, 14, '#c8965a');
    rect(g, 1, 1, 14, 1, '#e8b880');
    rect(g, 1, 5, 14, 1, '#8a6036');
    rect(g, 1, 10, 14, 1, '#8a6036');
    for (var i = 0; i < 12; i++) rect(g, 2 + i, 13 - i, 2, 1, '#8a6036');
  }

  // Kroneboks: blue box with a gold coin. Bump it from underneath.
  function prizeBox(coin) {
    return tile(function (g) {
      rect(g, 0, 0, 16, 16, '#0c2c58');
      rect(g, 0, 0, 15, 15, '#2a68b8');
      rect(g, 0, 0, 15, 1, '#6aa0e0'); rect(g, 0, 0, 1, 15, '#6aa0e0');
      rect(g, 2, 2, 1, 1, '#f0c040'); rect(g, 12, 2, 1, 1, '#f0c040');
      rect(g, 2, 12, 1, 1, '#f0c040'); rect(g, 12, 12, 1, 1, '#f0c040');
      disc(g, 7, 7, 4, 4, '#a87010');
      disc(g, 7, 7, 3, 3, coin);
      rect(g, 6, 5, 1, 4, '#fff4a0');
      rect(g, 8, 6, 1, 3, '#a87010');
    });
  }
  function usedBox(g) {
    rect(g, 0, 0, 16, 16, '#1c2434');
    rect(g, 1, 1, 14, 14, '#5a6a84');
    rect(g, 3, 3, 1, 1, '#1c2434'); rect(g, 12, 3, 1, 1, '#1c2434');
    rect(g, 3, 12, 1, 1, '#1c2434'); rect(g, 12, 12, 1, 1, '#1c2434');
  }

  // Hoggen granitt: cut granite blocks for steps and walls.
  function graniteBlock(g) {
    rect(g, 0, 0, 16, 16, '#5e5450');
    rect(g, 0, 0, 15, 15, '#b0a49c');
    rect(g, 0, 0, 15, 1, '#d8ccc4'); rect(g, 0, 0, 1, 15, '#d8ccc4');
    for (var i = 0; i < SPECKS.length; i++) rect(g, SPECKS[i][0], SPECKS[i][1], 1, 1, i % 2 ? '#857973' : '#cfc3bb');
  }

  // Two-wide obstacles. At the harbour they are stacks of fish crates,
  // on Blåbæråsen they are pine stumps.
  function crateStack() {
    function body(g, y0) {
      rect(g, 1, y0, 30, 16 - y0, '#2a64b4');
      rect(g, 1, y0, 30, 1, '#5a94dc');
      rect(g, 1, 15, 30, 1, '#163a70');
      rect(g, 0, y0, 1, 16 - y0, '#163a70'); rect(g, 31, y0, 1, 16 - y0, '#163a70');
      for (var x = 5; x < 30; x += 6) rect(g, x, y0 + 2, 1, 13 - y0, '#1f4f94');
      rect(g, 6, y0 + 3, 6, 2, '#0c1f3a'); rect(g, 20, y0 + 3, 6, 2, '#0c1f3a');
    }
    var top = mk(32, 16), g = top.getContext('2d');
    var fish = '#c8d4dc', fin = '#7a8a98';
    rect(g, 4, 1, 8, 3, fish); rect(g, 12, 0, 2, 2, fin); rect(g, 12, 3, 2, 2, fin); rect(g, 5, 2, 1, 1, '#141414');
    rect(g, 17, 2, 9, 3, fish); rect(g, 26, 1, 2, 2, fin); rect(g, 26, 4, 2, 1, fin); rect(g, 18, 3, 1, 1, '#141414');
    body(g, 4);
    var bottom = mk(32, 16);
    body(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }
  function stump() {
    function bark(g, y0) {
      rect(g, 3, y0, 26, 16 - y0, '#9a5230');
      rect(g, 3, y0, 2, 16 - y0, '#5a2e18'); rect(g, 27, y0, 2, 16 - y0, '#5a2e18');
      var cracks = [8, 13, 19, 23];
      for (var i = 0; i < cracks.length; i++) rect(g, cracks[i], y0, 1, 16 - y0, '#6a3620');
      rect(g, 10, y0, 2, 16 - y0, '#c06a3a'); rect(g, 16, y0, 1, 16 - y0, '#b8643a');
    }
    var top = mk(32, 16), g = top.getContext('2d');
    bark(g, 3);
    disc(g, 16, 3, 13, 3, '#5a2e18');
    disc(g, 16, 3, 12, 2, '#e0bc88');
    disc(g, 16, 3, 8, 1, '#c09060');
    disc(g, 16, 3, 7, 1, '#e0bc88');
    disc(g, 16, 3, 3, 0, '#c09060');
    var bottom = mk(32, 16);
    bark(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }
  function halves(pairOf) {
    function half(src, sx) {
      var c = mk(16, 16);
      c.getContext('2d').drawImage(src, sx, 0, 16, 16, 0, 0, 16, 16);
      return c;
    }
    return { tl: half(pairOf.top, 0), tr: half(pairOf.top, 16), bl: half(pairOf.body, 0), br: half(pairOf.body, 16) };
  }

  var tiles = {
    // ground per part of the level: top row and the rows below it
    ground: {
      havn: { top: tile(dockTop), fill: tile(dockFill) },
      by: { top: tile(function (g) { cobbles(g, true); }), fill: tile(function (g) { cobbles(g, false); }) },
      skog: { top: tile(heather), fill: tile(granite) }
    },
    column: {
      havn: halves(crateStack()),
      by: halves(crateStack()),
      skog: halves(stump())
    },
    brick: tile(crate),
    q: [prizeBox('#f8c818'), prizeBox('#ffe060'), prizeBox('#e0a810')],
    used: tile(usedBox),
    hard: tile(graniteBlock)
  };

  // ---------------------------------------------------------------- scenery
  // Clouds and bushes share a shape: n bumps on top of a rounded body.
  function puff(n, h, baseY, line, fill, shade) {
    var w = n * 16 + 24, c = mk(w, h), g = c.getContext('2d');
    var parts = [];
    for (var i = 0; i < n; i++) parts.push([20 + i * 16, baseY - 6, 11, 10]);
    parts.push([11, baseY, 9, 7]);
    parts.push([w - 12, baseY, 9, 7]);
    function all(off, grow, col) {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        disc(g, p[0], p[1] + off, p[2] + grow, p[3] + grow, col);
      }
      rect(g, 10 - grow, baseY - 4 + off - grow, w - 20 + grow * 2, 11 + grow * 2, col);
    }
    all(0, 1, line);
    all(0, 0, shade);
    all(-2, -1, fill);
    return c;
  }

  // Blåbærlyng: a low green bush dotted with blueberries.
  function blueberryBush(n) {
    var c = puff(n, 24, 20, '#1a4a1e', '#3f8a3a', '#2c6a2c'), g = c.getContext('2d');
    var data = g.getImageData(0, 0, c.width, c.height).data;
    for (var k = 0; k < n * 9; k++) {
      var x = (k * 13 + 5) % c.width, y = 6 + (k * 7) % 14;
      if (data[(y * c.width + x) * 4 + 3] === 0) continue;
      rect(g, x, y, 2, 2, '#2c3a9c');
      rect(g, x, y, 1, 1, '#6a7ae0');
    }
    return c;
  }

  // Svaberg: smooth granite rocks.
  function svaberg(w, h) {
    var c = mk(w, h), g = c.getContext('2d'), cx = Math.floor(w / 2);
    disc(g, cx, h, cx - 1, h - 1, '#6a605c');
    disc(g, cx, h, cx - 2, h - 2, '#b4a8a0');
    disc(g, cx - Math.floor(w / 8), h, Math.floor(cx * 0.55), h - 6, '#c8bcb4');
    rect(g, cx + 6, h - Math.floor(h * 0.6), 1, 6, '#8a7e78');
    rect(g, cx - 10, h - Math.floor(h * 0.4), 6, 1, '#8a7e78');
    disc(g, cx + Math.floor(w / 5), h - 3, 6, 2, '#5a8a44');
    return c;
  }

  // Furu: a pine with a bare orange trunk and a crown at the top.
  function pine(h) {
    var w = 40, c = mk(w, h), g = c.getContext('2d'), s = h / 80;
    rect(g, 19, Math.round(h * 0.2), 3, h, '#a85a30');
    rect(g, 19, Math.round(h * 0.2), 1, h, '#d0844a');
    rect(g, 21, Math.round(h * 0.2), 1, h, '#6a3418');
    var clumps = [[20, 6, 9, 6], [12, 14, 10, 5], [28, 18, 10, 5], [17, 24, 11, 5], [27, 30, 9, 4], [12, 34, 8, 4], [22, 40, 8, 3]];
    for (var i = 0; i < clumps.length; i++) {
      var k = clumps[i], cy = Math.round(k[1] * s);
      disc(g, k[0], cy, k[2], k[3], '#16381e');
      disc(g, k[0] - 1, cy - 1, k[2] - 1, k[3] - 1, '#2c5e34');
      disc(g, k[0] - 3, cy - 2, Math.max(1, k[2] - 5), 1, '#3f7a44');
    }
    return c;
  }

  // Sørlandshus: white panelled house with a tiled roof.
  function windowAt(g, x, y) {
    rect(g, x, y, 10, 12, '#ffffff');
    rect(g, x + 1, y + 1, 8, 10, '#2c4a6a');
    rect(g, x + 5, y + 1, 1, 10, '#ffffff');
    rect(g, x + 1, y + 5, 8, 1, '#ffffff');
    rect(g, x + 2, y + 2, 1, 2, '#6a90b8');
  }
  function house(w, wallH, roofH, opt) {
    var c = mk(w, wallH + roofH), g = c.getContext('2d');
    var roof = opt.roof || '#a83a2a', roofDark = opt.roofDark || '#7a2418';
    var slope = opt.slope || 1;
    if (opt.chimney) rect(g, opt.chimney, 0, 7, roofH, '#7a7a7a');
    for (var y = 0; y < roofH; y++) {
      var inset = Math.round((roofH - 1 - y) * slope);
      rect(g, inset, y, w - inset * 2, 1, y % 4 === 3 ? roofDark : roof);
    }
    var wy = roofH;
    rect(g, 2, wy, w - 4, wallH, opt.wall || '#f4f2ea');
    for (var yy = wy + 2; yy < wy + wallH; yy += 3) rect(g, 2, yy, w - 4, 1, opt.line || '#d6d4cc');
    rect(g, 2, wy, 2, wallH, '#ffffff'); rect(g, w - 4, wy, 2, wallH, '#ffffff');
    rect(g, 2, wy, w - 4, 1, '#9a9a90');
    var doorX = opt.doorX !== undefined ? opt.doorX : Math.floor(w / 2) - 5;
    for (var x = 8; x + 10 <= w - 6; x += 16) {
      if (x + 10 > doorX - 2 && x < doorX + 12) continue;
      windowAt(g, x, wy + 8);
    }
    rect(g, doorX, wy + wallH - 22, 10, 22, '#ffffff');
    rect(g, doorX + 1, wy + wallH - 21, 8, 21, opt.door || '#2f5f9f');
    rect(g, doorX + 2, wy + wallH - 19, 6, 4, '#2c4a6a');
    rect(g, doorX + 7, wy + wallH - 10, 1, 2, '#e0c040');
    return c;
  }

  // Sjøbu: red boathouse with the gable facing the water.
  function sjobu() {
    var w = 40, h = 44, c = mk(w, h), g = c.getContext('2d');
    function topAt(x) { return Math.round(16 - (x < 20 ? x : w - x) * 16 / 20); }
    for (var x = 0; x < w; x++) {
      var t = topAt(x);
      rect(g, x, t, 1, h - t, x % 3 === 0 ? '#8a2a20' : '#a8382a');
    }
    for (var y = 0; y <= 16; y++) {
      var half = Math.round(y * 20 / 16);
      rect(g, 20 - half - 1, y, 2, 1, '#f4f4f4');
      rect(g, 20 + half - 1, y, 2, 1, '#f4f4f4');
    }
    rect(g, 0, 16, 2, 28, '#f4f4f4'); rect(g, 38, 16, 2, 28, '#f4f4f4');
    rect(g, 12, 26, 16, 18, '#f4f4f4');
    rect(g, 13, 27, 14, 17, '#6a2018');
    rect(g, 20, 27, 1, 17, '#f4f4f4');
    rect(g, 17, 7, 6, 5, '#f4f4f4');
    rect(g, 18, 8, 4, 3, '#2c4a6a');
    return c;
  }

  // Hjemme på Blåbæråsen: a modern two-storey house in grey, weathered
  // vertical cladding, with a flat roof, slatted balconies, a carport with a
  // terrace on top, and a slatted fence in front.
  function home() {
    var w = 128, h = 88, c = mk(w, h), g = c.getContext('2d');
    var glass = '#26313c', frame = '#3a3836', slat = '#a8a49c', dark = '#4a4844';
    function boards(x, y, bw, bh) {
      rect(g, x, y, bw, bh, '#7d7a73');
      for (var xx = 0; xx < bw; xx += 4) {
        rect(g, x + xx, y, 1, bh, '#5f5c56');
        if ((xx >> 2) % 3 === 1) rect(g, x + xx + 2, y, 1, bh, '#8f8c85');
      }
    }
    function win(x, y, ww, wh, panes) {
      rect(g, x, y, ww, wh, frame);
      rect(g, x + 1, y + 1, ww - 2, wh - 2, glass);
      for (var i = 1; i < panes; i++) rect(g, x + Math.round(i * ww / panes), y, 1, wh, frame);
      rect(g, x + 2, y + 2, 1, Math.min(4, wh - 4), '#5a7088');
    }
    function railing(x, y, rw, rh) {
      for (var yy = 0; yy < rh; yy += 3) rect(g, x, y + yy, rw, 2, slat);
      rect(g, x, y, rw, 1, '#c4c0b8');
    }

    // left volume, two floors
    boards(4, 8, 72, 80);
    rect(g, 54, 0, 8, 6, '#6a6a6a');
    rect(g, 0, 4, 80, 4, '#2e3034');
    rect(g, 0, 7, 80, 1, '#55585c');
    win(6, 18, 6, 9, 1);
    win(14, 13, 42, 17, 4);
    rect(g, 8, 30, 52, 2, '#5a5854');
    railing(8, 32, 52, 12);
    rect(g, 10, 46, 48, 42, dark);
    rect(g, 10, 44, 48, 2, '#6a6862');
    rect(g, 10, 46, 3, 42, '#6a6862');
    win(16, 56, 10, 14, 1);
    rect(g, 34, 52, 11, 36, frame);
    rect(g, 35, 53, 9, 35, '#8aa0b0');
    rect(g, 42, 70, 1, 3, '#d0d0d0');
    win(62, 50, 10, 30, 1);

    // right volume: set-back upper floor with the tall window
    boards(76, 14, 38, 26);
    rect(g, 74, 10, 44, 4, '#2e3034');
    rect(g, 74, 13, 44, 1, '#55585c');
    win(78, 16, 20, 24, 2);
    win(101, 20, 10, 16, 1);
    railing(76, 38, 52, 10);
    boards(76, 48, 52, 8);
    rect(g, 76, 48, 52, 1, '#5a5854');

    // ground floor right: front door, then the carport with the car
    boards(76, 56, 16, 32);
    rect(g, 80, 60, 9, 28, '#2e2c2a');
    rect(g, 81, 61, 2, 26, '#3c3a38');
    rect(g, 87, 72, 1, 4, '#c8c8c8');
    rect(g, 92, 56, 36, 32, '#26272a');
    rect(g, 92, 56, 3, 32, '#6a6862');
    rect(g, 98, 70, 28, 12, '#5a5e64');
    rect(g, 102, 64, 20, 7, '#5a5e64');
    rect(g, 104, 65, 7, 5, '#2a3038');
    rect(g, 113, 65, 7, 5, '#2a3038');
    rect(g, 98, 74, 28, 1, '#7a7e84');
    disc(g, 104, 82, 3, 3, '#141414');
    disc(g, 120, 82, 3, 3, '#141414');

    // blue flower pots by the door
    rect(g, 70, 82, 5, 6, '#2a5ad0'); disc(g, 72, 80, 3, 2, '#3f8a3a');
    rect(g, 76, 83, 4, 5, '#2a5ad0'); disc(g, 78, 81, 2, 2, '#3f8a3a');

    // slatted fence along the front
    for (var fy = 70; fy < 88; fy += 3) rect(g, 0, fy, 62, 2, '#9c988f');
    rect(g, 0, 70, 62, 1, '#bcb8b0');
    for (var fx = 0; fx < 62; fx += 20) rect(g, fx, 70, 2, 18, '#6a6862');
    return c;
  }

  // Kirke: white wooden church with a tall spire.
  function church() {
    var w = 56, h = 120, c = mk(w, h), g = c.getContext('2d');
    for (var y = 0; y < 14; y++) rect(g, 4 + Math.round((13 - y) * 0.5), 56 + y, w - 8 - Math.round((13 - y) * 1.0), 1, '#2e3440');
    rect(g, 4, 70, w - 8, 50, '#f4f2ea');
    for (var yy = 72; yy < 120; yy += 3) rect(g, 4, yy, w - 8, 1, '#d6d4cc');
    rect(g, 8, 80, 7, 20, '#ffffff'); rect(g, 9, 81, 5, 19, '#2c4a6a');
    rect(g, 41, 80, 7, 20, '#ffffff'); rect(g, 42, 81, 5, 19, '#2c4a6a');
    rect(g, 20, 30, 16, 90, '#f8f6ee');
    rect(g, 20, 30, 1, 90, '#d6d4cc'); rect(g, 35, 30, 1, 90, '#d6d4cc');
    for (var s = 0; s < 30; s++) {
      var half = Math.round(s * 8 / 30);
      rect(g, 28 - half, s, half * 2, 1, '#2e3440');
    }
    rect(g, 27, 0, 2, 3, '#e0c040');
    disc(g, 28, 44, 3, 3, '#2e3440');
    disc(g, 28, 44, 2, 2, '#f4f4f4');
    rect(g, 24, 100, 8, 20, '#7a2418');
    return c;
  }

  function holme(lighthouse) {
    var w = 56, h = lighthouse ? 34 : 10, c = mk(w, h), g = c.getContext('2d');
    disc(g, 28, h, 27, 9, '#7a706a');
    disc(g, 28, h, 25, 7, '#a8a098');
    disc(g, 22, h - 6, 10, 2, '#5a8a4a');
    if (lighthouse) {
      rect(g, 25, 6, 7, 20, '#f4f4f4');
      rect(g, 25, 11, 7, 3, '#c8281c');
      rect(g, 25, 19, 7, 3, '#c8281c');
      rect(g, 26, 2, 5, 4, '#f8e080');
      rect(g, 25, 0, 7, 2, '#c8281c');
    }
    return c;
  }

  function sailboat() {
    var c = mk(24, 26), g = c.getContext('2d');
    for (var y = 0; y < 18; y++) {
      var wd = Math.round(y * 10 / 17);
      rect(g, 12 - wd, y, wd, 1, '#f8f8f8');
      if (y > 4) rect(g, 13, y, Math.round((y - 4) * 6 / 13), 1, '#e8e8e8');
    }
    rect(g, 12, 0, 1, 20, '#5a4a3a');
    rect(g, 2, 19, 20, 3, '#f4f4f4');
    rect(g, 2, 21, 20, 1, '#2a5aa0');
    rect(g, 4, 22, 16, 2, '#f4f4f4');
    return c;
  }

  function motorboat() {
    var c = mk(44, 18), g = c.getContext('2d');
    rect(g, 4, 10, 38, 6, '#f4f4f4');
    for (var i = 0; i < 4; i++) rect(g, 4 - i, 10 + i, 1, 4 - i, '#f4f4f4');
    rect(g, 2, 13, 40, 1, '#2a5aa0');
    rect(g, 6, 16, 34, 2, '#e8e8e8');
    rect(g, 14, 4, 20, 6, '#f4f4f4');
    for (var x = 16; x < 32; x += 5) rect(g, x, 6, 3, 2, '#2c4a6a');
    rect(g, 30, 0, 1, 4, '#5a4a3a');
    rect(g, 31, 0, 4, 3, '#c8281c');
    return c;
  }

  var GULL = [
    ['gW.....Wg', '.gW...Wg.', '...WGW...'],
    ['.........', 'gWW.G.WWg', '...WWW...']
  ];
  var gull = GULL.map(function (rows, i) { return fromRows(rows, { W: '#ffffff', G: '#c8c8c8', g: '#505050' }, 'gull' + i); });

  function bollard() {
    var c = mk(6, 8), g = c.getContext('2d');
    rect(g, 1, 2, 4, 6, '#2a2a2a');
    rect(g, 0, 1, 6, 2, '#3a3a3a');
    rect(g, 1, 3, 1, 4, '#5a5a5a');
    return c;
  }

  function fence() {
    var c = mk(32, 14), g = c.getContext('2d');
    rect(g, 0, 4, 32, 2, '#d8d8d8');
    rect(g, 0, 10, 32, 2, '#d8d8d8');
    for (var x = 1; x < 32; x += 4) {
      rect(g, x, 1, 2, 13, '#f8f8f8');
      rect(g, x + 1, 2, 1, 12, '#cfcfcf');
      rect(g, x, 0, 1, 1, '#f8f8f8');
    }
    return c;
  }

  function lamp() {
    var c = mk(10, 44), g = c.getContext('2d');
    rect(g, 4, 8, 2, 36, '#2a3a30');
    rect(g, 3, 40, 4, 4, '#2a3a30');
    rect(g, 1, 2, 8, 6, '#2a3a30');
    rect(g, 2, 3, 6, 4, '#f8e8a0');
    rect(g, 3, 0, 4, 2, '#2a3a30');
    return c;
  }

  // Norwegian flag, 22 x 16, the official proportions.
  function flag() {
    var c = mk(22, 16), g = c.getContext('2d');
    rect(g, 0, 0, 22, 16, '#ba0c2f');
    rect(g, 6, 0, 4, 16, '#ffffff');
    rect(g, 0, 6, 22, 4, '#ffffff');
    rect(g, 7, 0, 2, 16, '#00205b');
    rect(g, 0, 7, 22, 2, '#00205b');
    return c;
  }

  // Far background strips, drawn once per level.
  function seaStrip(w) {
    var h = 56, c = mk(w, h), g = c.getContext('2d');
    rect(g, 0, 0, w, h, '#2e6ca4');
    rect(g, 0, 36, w, h - 36, '#28609a');
    rect(g, 0, 0, w, 1, '#a8d0f0');
    rect(g, 0, 1, w, 1, '#5a94c8');
    var rows = [5, 10, 17, 26, 38, 48];
    for (var i = 0; i < rows.length; i++) {
      var y = rows[i], step = 9 + i * 3;
      for (var x = (y * 7) % step; x < w; x += step) rect(g, x, y, 3 + (i >> 1), 1, '#4a88c0');
    }
    return c;
  }

  function ridge(w) {
    var h = 80, c = mk(w, h), g = c.getContext('2d');
    var x, top;
    for (x = 0; x < w; x++) {
      top = Math.round(30 + 8 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.041));
      rect(g, x, top, 1, h - top, '#4a7a58');
    }
    for (x = 0; x < w; x += 6) {
      top = Math.round(22 + 8 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.041)) - (x * 31) % 7;
      for (var k = 0; k < 14; k++) {
        var hw = Math.floor(k / 3);
        rect(g, x + 3 - hw, top + k, hw * 2 + 1, 1, '#3c6a4a');
      }
    }
    for (x = 0; x < w; x++) {
      top = Math.round(54 + 5 * Math.sin(x * 0.02 + 1) + 3 * Math.sin(x * 0.07));
      rect(g, x, top, 1, h - top, '#2f5a3c');
    }
    return c;
  }

  var CLOUD = ['#203060', '#ffffff', '#b8d8ff'];
  var decor = {
    cloud1: puff(1, 32, 22, CLOUD[0], CLOUD[1], CLOUD[2]),
    cloud2: puff(2, 32, 22, CLOUD[0], CLOUD[1], CLOUD[2]),
    cloud3: puff(3, 32, 22, CLOUD[0], CLOUD[1], CLOUD[2]),
    bush1: blueberryBush(1),
    bush2: blueberryBush(2),
    bush3: blueberryBush(3),
    svaberg: svaberg(80, 30),
    svabergSmall: svaberg(48, 18),
    pine: pine(80),
    pineTall: pine(104),
    pineSmall: pine(64),
    hus1: house(64, 48, 20, { door: '#3a7a4a', chimney: 44 }),
    hus2: house(48, 44, 18, { roof: '#2e2e36', roofDark: '#1a1a20', door: '#a83a2a' }),
    hus3: house(80, 52, 22, { door: '#2f5f9f', chimney: 18 }),
    hjem: home(),
    sjobu: sjobu(),
    kirke: church(),
    holme: holme(false),
    fyr: holme(true),
    seilbat: sailboat(),
    bat: motorboat(),
    pullert: bollard(),
    stakitt: fence(),
    lykt: lamp()
  };

  // ================================================================ Harøya
  // Myr: grass with cotton grass on top of peat and stones.
  var STONES = [[2, 6, 3, 2], [9, 9, 4, 3], [4, 13, 3, 2], [12, 3, 2, 2]];
  function peat(g) {
    rect(g, 0, 0, 16, 16, '#4a3424');
    for (var i = 0; i < STONES.length; i++) {
      var s = STONES[i];
      rect(g, s[0], s[1], s[2], s[3], '#7a6a5a');
      rect(g, s[0], s[1], s[2], 1, '#9a8a78');
    }
  }
  function marsh(g) {
    peat(g);
    rect(g, 0, 0, 16, 5, '#5aa040');
    rect(g, 0, 0, 16, 1, '#8ad060');
    var tufts = [1, 4, 7, 10, 13];
    for (var i = 0; i < tufts.length; i++) rect(g, tufts[i], 5, 1, 1 + (i % 2), '#3a7a2a');
    rect(g, 3, 1, 1, 1, '#f4f4f4'); rect(g, 11, 2, 1, 1, '#f4f4f4');
  }

  // Steingard: a dry stone wall, two tiles wide.
  function stoneStack() {
    function stones(g, y0) {
      rect(g, 1, y0, 30, 16 - y0, '#3e3e3c');
      for (var y = y0; y < 16; y += 5) {
        var off = ((y - y0) / 5) % 2 ? 4 : 0;
        for (var x = 1 + off - 4; x < 31; x += 9) {
          var xx = Math.max(1, x), ww = Math.min(x + 8, 31) - xx;
          if (ww <= 0) continue;
          rect(g, xx, y, ww, 4, '#8a8a84');
          rect(g, xx, y, ww, 1, '#b0b0aa');
        }
      }
    }
    var top = mk(32, 16), g = top.getContext('2d');
    stones(g, 2);
    rect(g, 2, 0, 28, 2, '#5a8a3a');
    var bottom = mk(32, 16);
    stones(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }

  // Sildetønner: herring barrels stacked on the quay.
  function barrelStack() {
    function barrel(g, x, y0, lid) {
      rect(g, x + 1, y0, 14, 16 - y0, '#a87040');
      for (var s = x + 3; s < x + 14; s += 3) rect(g, s, y0, 1, 16 - y0, '#8a5a30');
      rect(g, x + 1, y0, 1, 16 - y0, '#6a4020'); rect(g, x + 14, y0, 1, 16 - y0, '#6a4020');
      rect(g, x + 1, y0 + 2, 14, 1, '#3a2a1a'); rect(g, x + 1, 13, 14, 1, '#3a2a1a');
      if (lid) {
        rect(g, x + 2, y0 - 2, 12, 2, '#c08a50');
        rect(g, x + 5, y0 - 3, 3, 1, '#c8d4dc'); rect(g, x + 9, y0 - 3, 2, 1, '#c8d4dc');
      }
    }
    var top = mk(32, 16), g = top.getContext('2d');
    barrel(g, 0, 3, true); barrel(g, 16, 3, true);
    var bottom = mk(32, 16), g2 = bottom.getContext('2d');
    barrel(g2, 0, 0, false); barrel(g2, 16, 0, false);
    return { top: top, body: bottom };
  }

  var SHEEP = [
    '......wwwwww......',
    '....wwwwwwwwww....',
    '.KK.wwwwwwwwwwww..',
    'KKKKwwwwwwwwwwwww.',
    'KWKKwwwwwwwwwwwww.',
    '.KK.wwwwwwwwwwwww.',
    '....wwwwwwwwwwww..',
    '.....wwwwwwwwww...',
    '.....K.K....K.K...',
    '.....K.K....K.K...',
    '.....K.K....K.K...'
  ];

  // Låve: red barn with white trim.
  function barn() {
    var w = 64, h = 48, c = mk(w, h), g = c.getContext('2d');
    for (var y = 0; y < 18; y++) {
      var inset = Math.round((17 - y) * 1.2);
      rect(g, inset, y, w - inset * 2, 1, y % 4 === 3 ? '#2a2a30' : '#44444c');
    }
    rect(g, 2, 18, w - 4, 30, '#a8382a');
    for (var x = 4; x < w - 2; x += 3) rect(g, x, 18, 1, 30, '#8a2a20');
    rect(g, 2, 18, 2, 30, '#f4f4f4'); rect(g, w - 4, 18, 2, 30, '#f4f4f4'); rect(g, 2, 18, w - 4, 1, '#f4f4f4');
    rect(g, 22, 26, 20, 22, '#f4f4f4');
    rect(g, 23, 27, 18, 21, '#7a2418');
    rect(g, 32, 27, 1, 21, '#f4f4f4');
    for (var i = 0; i < 18; i++) {
      var yy = 27 + Math.round(i * 19 / 18);
      rect(g, 23 + i, yy, 1, 2, '#f4f4f4');
      rect(g, 40 - i, yy, 1, 2, '#f4f4f4');
    }
    rect(g, 8, 26, 8, 6, '#f4f4f4'); rect(g, 9, 27, 6, 4, '#2c4a6a');
    rect(g, 48, 26, 8, 6, '#f4f4f4'); rect(g, 49, 27, 6, 4, '#2c4a6a');
    return c;
  }

  // Hjell: a drying rack with fish hanging from it.
  function hjell() {
    var c = mk(48, 34), g = c.getContext('2d'), wood = '#7a5a38';
    for (var y = 0; y < 34; y++) {
      var s = Math.round(y * 5 / 34);
      rect(g, 6 - s, y, 2, 1, wood); rect(g, 6 + s, y, 2, 1, wood);
      rect(g, 40 - s, y, 2, 1, wood); rect(g, 40 + s, y, 2, 1, wood);
    }
    rect(g, 3, 1, 42, 2, '#5a4028');
    for (var x = 11; x < 38; x += 4) {
      rect(g, x, 3, 2, 11, '#b0a080');
      rect(g, x + 1, 3, 1, 11, '#8a7a5a');
      rect(g, x - 1, 13, 4, 2, '#7a6a50');
    }
    return c;
  }

  function cottonGrass() {
    var c = mk(10, 10), g = c.getContext('2d');
    rect(g, 2, 3, 1, 7, '#3a7a2a'); rect(g, 5, 1, 1, 9, '#3a7a2a'); rect(g, 8, 4, 1, 6, '#3a7a2a');
    rect(g, 1, 1, 3, 3, '#f4f4f4'); rect(g, 4, 0, 3, 2, '#f4f4f4'); rect(g, 7, 2, 3, 3, '#f4f4f4');
    return c;
  }

  // Hvalstasjonen in Steinshamn: a long factory with a tall chimney.
  function station() {
    var w = 104, h = 84, c = mk(w, h), g = c.getContext('2d');
    rect(g, 82, 0, 10, 56, '#8a3a2a');
    rect(g, 82, 0, 10, 2, '#5a2418'); rect(g, 82, 10, 10, 2, '#f4f4f4');
    for (var y = 4; y < 56; y += 4) rect(g, 82, y, 10, 1, '#6a2a1e');
    rect(g, 0, 36, 98, 6, '#3a3a40');
    rect(g, 2, 42, 94, 42, '#d8d4c8');
    for (var x = 4; x < 96; x += 3) rect(g, x, 42, 1, 42, '#c0bcb0');
    for (x = 8; x < 90; x += 14) {
      rect(g, x, 48, 8, 8, '#f4f4f4'); rect(g, x + 1, 49, 6, 6, '#2c4a6a');
    }
    rect(g, 40, 62, 22, 22, '#5a4028'); rect(g, 41, 63, 20, 21, '#3a2a1a');
    rect(g, 51, 63, 1, 21, '#5a4028');
    return c;
  }

  // Hvalbåt: a whale catcher with a harpoon cannon on the bow.
  function whaleBoat() {
    var w = 72, h = 44, c = mk(w, h), g = c.getContext('2d');
    rect(g, 4, 30, 64, 10, '#1a1a1a');
    for (var i = 0; i < 6; i++) rect(g, 4 - i, 28 + i, 1, 6 - i, '#1a1a1a');
    rect(g, 6, 40, 60, 3, '#a82020');
    rect(g, 2, 26, 12, 4, '#1a1a1a');
    rect(g, 3, 22, 9, 3, '#4a4a4a'); rect(g, 0, 23, 4, 1, '#c8c8c8');
    rect(g, 26, 18, 26, 12, '#f4f4f4');
    for (var x = 29; x < 50; x += 6) rect(g, x, 21, 3, 3, '#2c4a6a');
    rect(g, 42, 6, 8, 12, '#d8a020'); rect(g, 42, 6, 8, 3, '#1a1a1a');
    rect(g, 20, 0, 1, 30, '#3a3a3a'); rect(g, 18, 5, 5, 3, '#5a4028');
    return c;
  }

  // Sildebåt: a fishing boat from the herring years.
  function fishingBoat() {
    var w = 52, h = 30, c = mk(w, h), g = c.getContext('2d');
    rect(g, 4, 18, 46, 8, '#f4f4f4');
    for (var i = 0; i < 5; i++) rect(g, 4 - i, 16 + i, 1, 6 - i, '#f4f4f4');
    rect(g, 3, 22, 47, 2, '#1f7a3a');
    rect(g, 6, 26, 42, 2, '#a82020');
    rect(g, 30, 8, 12, 10, '#f4f4f4'); rect(g, 32, 10, 3, 3, '#2c4a6a'); rect(g, 37, 10, 3, 3, '#2c4a6a');
    rect(g, 30, 7, 12, 1, '#a82020');
    rect(g, 16, 0, 1, 18, '#5a4a3a');
    return c;
  }

  // Whale flukes, which rise out of the sea now and then.
  function flukes() {
    var c = mk(32, 20), g = c.getContext('2d');
    disc(g, 8, 4, 8, 3, '#2a3a4c');
    disc(g, 24, 4, 8, 3, '#2a3a4c');
    rect(g, 13, 4, 6, 16, '#2a3a4c');
    rect(g, 14, 5, 1, 15, '#4a5a6c');
    return c;
  }

  // Sunnmørsalpene on the horizon.
  function mountains(w) {
    var h = 44, c = mk(w, h), g = c.getContext('2d'), x, top;
    for (x = 0; x < w; x++) {
      top = Math.round(h - 10 - Math.abs(Math.sin(x * 0.021)) * 16 - Math.abs(Math.sin(x * 0.053 + 1)) * 12);
      rect(g, x, top, 1, h - top, '#8a9ab4');
      if (top < 18) rect(g, x, top, 1, 18 - top + 2, '#e8eef4');
    }
    for (x = 0; x < w; x++) {
      top = Math.round(h - 6 - Math.abs(Math.sin(x * 0.034 + 2)) * 10);
      rect(g, x, top, 1, h - top, '#6a7a94');
    }
    return c;
  }

  // ================================================================ Inside the whale
  function fleshFill(g) {
    rect(g, 0, 0, 16, 16, '#a83a54');
    rect(g, 2, 6, 6, 1, '#8a2a40'); rect(g, 9, 11, 5, 1, '#8a2a40'); rect(g, 5, 13, 3, 1, '#c04a66');
  }
  function fleshTop(g) {
    fleshFill(g);
    rect(g, 0, 0, 16, 4, '#d0607a');
    rect(g, 0, 0, 16, 1, '#f49ab0');
    rect(g, 3, 1, 2, 1, '#ffd0dc'); rect(g, 11, 2, 1, 1, '#ffd0dc');
    rect(g, 0, 4, 16, 1, '#8a2a40');
  }
  function bonePillar() {
    function shaft(g, y0) {
      rect(g, 7, y0, 18, 16 - y0, '#e8dcc0');
      rect(g, 7, y0, 3, 16 - y0, '#fff4e0');
      rect(g, 21, y0, 4, 16 - y0, '#b8a888');
    }
    var top = mk(32, 16), g = top.getContext('2d');
    shaft(g, 5);
    disc(g, 10, 5, 7, 4, '#b8a888'); disc(g, 22, 5, 7, 4, '#b8a888');
    disc(g, 10, 4, 6, 3, '#e8dcc0'); disc(g, 22, 4, 6, 3, '#e8dcc0');
    rect(g, 6, 2, 4, 1, '#fff4e0');
    var bottom = mk(32, 16);
    shaft(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }
  function cartilage(g) {
    rect(g, 0, 0, 16, 16, '#8a7a64');
    rect(g, 0, 0, 15, 15, '#d8c8b0');
    rect(g, 0, 0, 15, 1, '#f4e8d4'); rect(g, 0, 0, 1, 15, '#f4e8d4');
    rect(g, 4, 5, 6, 1, '#b8a890'); rect(g, 7, 10, 5, 1, '#b8a890');
  }

  // The ribs and walls of the whale's belly, as a full-height backdrop.
  function ribs(w) {
    var h = 216, c = mk(w, h), g = c.getContext('2d'), bg = '#4a1420';
    rect(g, 0, 0, w, h, bg);
    for (var x = 0; x < w; x += 6) rect(g, x, 20 + Math.round(Math.sin(x * 0.05) * 6), 3, 1, '#5e1c2a');
    for (var cx = 48; cx < w + 64; cx += 128) {
      disc(g, cx, 226, 74, 210, '#8a7462');
      disc(g, cx, 226, 72, 208, '#c8b498');
      disc(g, cx, 226, 64, 200, bg);
    }
    rect(g, 0, 0, w, 10, '#6a2430');
    for (x = 0; x < w; x += 16) rect(g, x, 10, 8, 2, '#5e1c2a');
    return c;
  }

  function boot() {
    var c = mk(14, 14), g = c.getContext('2d');
    rect(g, 2, 0, 7, 10, '#2a2a2a'); rect(g, 2, 9, 12, 5, '#2a2a2a');
    rect(g, 3, 1, 1, 8, '#4a4a4a'); rect(g, 2, 13, 12, 1, '#141414');
    return c;
  }
  function anchor() {
    var c = mk(20, 24), g = c.getContext('2d'), col = '#5a6068';
    disc(g, 10, 3, 3, 3, col);
    rect(g, 9, 5, 3, 16, col); rect(g, 4, 8, 13, 2, col);
    for (var i = 0; i < 7; i++) {
      rect(g, 3 + i, 20 - Math.round(i * 0.8), 2, 2, col);
      rect(g, 16 - i, 20 - Math.round(i * 0.8), 2, 2, col);
    }
    rect(g, 1, 15, 3, 3, col); rect(g, 17, 15, 3, 3, col);
    g.clearRect(10, 2, 1, 2);
    return c;
  }
  function rowboat() {
    var c = mk(48, 18), g = c.getContext('2d');
    for (var y = 0; y < 10; y++) {
      var inset = Math.round(y * 0.8);
      rect(g, inset, 6 + y, 48 - inset * 2, 1, y < 2 ? '#c88a50' : '#a86a38');
    }
    rect(g, 0, 6, 48, 1, '#e0a868');
    rect(g, 8, 4, 30, 1, '#7a5a38');
    rect(g, 30, 0, 1, 6, '#7a5a38'); rect(g, 22, 2, 18, 1, '#7a5a38');
    return c;
  }
  function smallBarrel() {
    var c = mk(14, 16), g = c.getContext('2d');
    rect(g, 1, 0, 12, 16, '#a87040');
    for (var s = 3; s < 12; s += 3) rect(g, s, 0, 1, 16, '#8a5a30');
    rect(g, 1, 2, 12, 1, '#3a2a1a'); rect(g, 1, 13, 12, 1, '#3a2a1a');
    return c;
  }
  function campfire() {
    var c = mk(18, 6), g = c.getContext('2d');
    rect(g, 1, 3, 16, 3, '#6a4020'); rect(g, 4, 1, 10, 3, '#8a5a30');
    rect(g, 2, 5, 14, 1, '#3a2a1a');
    return c;
  }

  // The whale itself, for the end of Harøya, the view from outside and the
  // dance at the very end. Facing left, mouth shut; drawWhale opens it.
  function bigWhale() {
    var w = 176, h = 96, c = mk(w, h), g = c.getContext('2d');
    disc(g, 100, 60, 96, 40, '#1e2a38');
    disc(g, 100, 60, 94, 38, '#3a4a5c');
    g.globalCompositeOperation = 'source-atop';
    disc(g, 90, 98, 92, 24, '#c8d0d8');
    for (var y = 78; y < 96; y += 4) rect(g, 0, y, w, 1, '#9aa4b0');
    for (var i = 0; i < 76; i++) rect(g, 6 + i, 63 + Math.round(i * 3 / 76), 1, 1, '#141a22');
    disc(g, 60, 50, 3, 3, '#f4f4f4');
    disc(g, 59, 50, 2, 2, '#141414');
    rect(g, 118, 21, 6, 2, '#141a22');
    g.globalCompositeOperation = 'source-over';
    return c;
  }
  var whale = bigWhale();
  var WHALE_JAW = 84, WHALE_PIVOT = 130;

  // Draw the whale with its lower jaw dropped by `jaw` pixels at the front
  // (0 is shut), showing the mouth, baleen and tongue inside, and its head
  // dipped by `nod` pixels while the tail end stays put. It is drawn one
  // column at a time, each moved by whole pixels, so the edges stay crisp.
  function drawWhale(g, x, y, jaw, nod) {
    var h = whale.height;
    for (var cx = 0; cx < whale.width; cx++) {
      var sx = x + cx, sy = y + (nod && cx < WHALE_PIVOT ? Math.round(nod * (WHALE_PIVOT - cx) / WHALE_PIVOT) : 0);
      var gap = cx >= 4 && cx < WHALE_JAW ? Math.round(jaw * (WHALE_JAW - cx) / (WHALE_JAW - 4)) : 0;
      if (!gap) { g.drawImage(whale, cx, 0, 1, h, sx, sy, 1, h); continue; }
      var m = 63 + Math.round((cx - 6) * 3 / 76); // the mouth line
      g.drawImage(whale, cx, 0, 1, m, sx, sy, 1, m);
      g.fillStyle = '#5a1424';
      g.fillRect(sx, sy + m, 1, gap);
      var tongue = gap > 3 ? Math.max(2, Math.floor(gap / 4)) : 0;
      if (tongue) {
        g.fillStyle = '#c84a5a'; g.fillRect(sx, sy + m + gap - tongue, 1, tongue);
        g.fillStyle = '#e07080'; g.fillRect(sx, sy + m + gap - tongue, 1, 1);
      }
      if (cx % 3 === 0) { g.fillStyle = '#e8e0c8'; g.fillRect(sx, sy + m, 1, Math.min(gap, gap > 8 ? 3 : 2)); } // baleen
      g.drawImage(whale, cx, m, 1, h - m, sx, sy + m + gap, 1, h - m);
    }
  }

  // ================================================================ people
  // Heads (11 rows) and bodies (17 rows), combined into 16 x 28 people.
  var HEADS = {
    hair: [
      '................', '................', '................',
      '.....HHHHHH.....', '....HHHHHHHH....', '....HHSSSSSH....', '....HSSSSKSS....',
      '....SSSSSSSSS...', '....SSSSSSPP....', '.....SSSSSS.....', '......SSSS......'
    ],
    sydvest: [
      '................', '......YYYY......', '....YYYYYYYY....', '..YYYYYYYYYYYY..',
      '....HSSSSSSH....', '....HSSSSKSS....', '....SSSSSSSSS...', '....WSSSSSPP....',
      '....WWWWWWWW....', '.....WWWWWW.....', '......WWWW......'
    ],
    skaut: [
      '................', '................', '.....RRRRRR.....', '....RRRRRRRR....',
      '....RRSSSSSR....', '....RHSSSKSS....', '....RSSSSSSSS...', '....RSSSSSPP....',
      '.....SSSSSS.....', '.....RSSSSR.....', '......RRRR......'
    ],
    lue: [
      '................', '......BBBB......', '.....BBBBBB.....', '....BBBBBBBB....',
      '....bbbbbbbb....', '....HSSSSKSS....', '....SSSSSSSSS...', '....DSSSSSPP....',
      '....DDDDDDDD....', '.....DDDDDD.....', '......SSSS......'
    ],
    jonas: [
      '................', '.....WWWWWW.....', '....WWWWWWWW....', '...WWSSSSSWW....',
      '...WSSSSSKSS....', '...WSSSSSSSSS...', '...WSSSSSSSPP...', '...WWWWWWWWWW...',
      '...WWWWWWWWWW...', '....WWWWWWWW....', '.....WWWWWW.....'
    ],
    fedora: [
      '................', '.....FFFFFF.....', '.....FFFFFF.....', '.....ffffff.....',
      '..FFFFFFFFFFFF..', '....HSSSSSSS....', '....SKKKKKKS....', '....SSSSSSPPS...',
      '....SMMMMMMMM...', '.....SSSSSS.....', '......SSSS......'
    ]
  };
  var BODIES = {
    plain: [
      '.....CCCCCC.....', '....CCCCCCCC....', '...CCCCCCCCCC...', '...CCCCCCCCCC...',
      '...CCCCCCCCCC...', '...CC.CCCC.CC...', '...CC.CCCC.CC...', '...SS.CCCC.SS...',
      '......CCCC......', '.....LLLLLL.....', '.....LLLLLL.....', '.....LL..LL.....',
      '.....LL..LL.....', '.....LL..LL.....', '.....LL..LL.....', '....NNN..NNN....',
      '....NNN..NNN....'
    ],
    dress: [
      '.....CCCCCC.....', '....CCCCCCCC....', '...CCCAAAACCC...', '...CCAAAAAACC...',
      '...CCAAAAAACC...', '...CCAAAAAACC...', '...SSAAAAAASS...', '....CAAAAAAC....',
      '....CAAAAAAC....', '...CCAAAAAACC...', '...CCCAAAACCC...', '...CCCCCCCCCC...',
      '...CCCCCCCCCC...', '..CCCCCCCCCCCC..', '..CCCCCCCCCCCC..', '.....NN..NN.....',
      '.....NN..NN.....'
    ],
    coat: [
      '.....CCCCCC.....', '....CCCcCCCC....', '...CCCCcCCCCC...', '...CCCCcCCCCC...',
      '...CCCCcCCCCC...', '...CC.CcCC.CC...', '...CC.CcCC.CC...', '...SS.CcCC.SS...',
      '....cCCcCCCCc...', '....CCCcCCCCC...', '....CCCcCCCCC...', '....CCCcCCCCC...',
      '....CCCcCCCCC...', '.....LL..LL.....', '.....LL..LL.....', '....NNN..NNN....',
      '....NNN..NNN....'
    ]
  };
  var PEOPLE = {
    fisker: { head: 'sydvest', body: 'plain', pal: { Y: '#f0c020', C: '#f0c020', L: '#d8a818', N: '#1a1a1a', W: '#d8d8d8', H: '#a0a0a0' } },
    kone: { head: 'skaut', body: 'dress', pal: { R: '#c8281c', C: '#2a4a8a', A: '#f4f4f4', N: '#3a2a1a', H: '#6a4a2a' } },
    hvalfanger: { head: 'lue', body: 'plain', pal: { B: '#24357e', b: '#1a2860', D: '#5a3a1a', C: '#d8d8d0', L: '#2a3448', N: '#2a1a10', H: '#5a3a1a' } },
    jonas: { head: 'jonas', body: 'dress', pal: { W: '#f0f0f0', C: '#8a6a40', A: '#9a7a4a', N: '#f8c088' } },
    skurk: { head: 'fedora', body: 'coat', pal: { F: '#4a3a2a', f: '#1a1a1a', K: '#101010', M: '#1a1a1a', C: '#b08850', c: '#7a5a30', L: '#2a2a2a', N: '#141414', H: '#4a3a2a' } }
  };
  var npc = {};
  for (var who in PEOPLE) {
    var pp = PEOPLE[who];
    npc[who] = pair(HEADS[pp.head].concat(BODIES[pp.body]),
      merge({ S: '#f8c088', P: '#e8946a', K: '#141414', H: '#5a3a1a' }, pp.pal), 'npc ' + who);
  }

  // ================================================================ more enemies
  // Måsen flies back and forth. Drawn facing left.
  var GULL_BODY = ['.YWWWWWWWWWWW...', 'YYWWWWWWWWWWWWg.'];
  var GPAL = { W: '#ffffff', G: '#a8b0b8', g: '#404850', Y: '#f0c020', K: '#141414' };
  enemy.make = {
    walk1: pair(['......gg........', '.......GG.......', '........GG......', '.........GG.....',
      '...KW....WGG....'].concat(GULL_BODY, ['...WWWWWWWWWWgg.', '.....WWWWWW.....', '......Y..Y......',
      '................', '................']), GPAL, 'gull1'),
    walk2: pair(['................', '................', '................', '................',
      '...KW...........'].concat(GULL_BODY, ['...WWWWWGGWWWgg.', '.....WWWGGGW....', '......Y..GGG....',
      '..........GG....', '...........g....']), GPAL, 'gull2')
  };
  // Reka walks around inside the whale. Drawn facing left.
  var SHRIMP_TOP = [
    '................', '................', '................', '................', '................',
    '.R..............', '..R.............', '...RRRRR........', '..RKRRRRRr......', '..RRRRRRRRRr....',
    '...RrRrRrRRRR...', '....RRRRRRRRRR..', '.....rRrRrRRRRR.'
  ];
  var SPAL = { R: '#f08060', r: '#c04a30', K: '#141414' };
  enemy.reke = {
    walk1: pair(SHRIMP_TOP.concat(['.....r.r.r..RRR.', '....r.r.r....RR.', '...........RRRR.']), SPAL, 'shrimp1'),
    walk2: pair(SHRIMP_TOP.concat(['.....r..r..r.RRR', '......r..r...RR.', '...........RRRR.']), SPAL, 'shrimp2'),
    flat: pair(['................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................',
      '................', '................',
      '...RRRRRRRRRR...', '..RKrRrRrRrRRR..', '..RRRRRRRRRRRRR.', '....r.r.r.r.....'], SPAL, 'shrimpflat')
  };
  // Maneten floats up and down.
  var JELLY = [
    '................', '................',
    '.....MMMMMM.....', '....MmMMMMMM....', '...MmMMMMMMMM...', '...MMMMMMMMMM...',
    '...MMKMMMMKMM...', '...MMMMMMMMMM...', '...mMmMmMmMmM...', '....t.t.t.t.t...',
    '...t.t.t.t.t....', '....t.t.t.t.t...', '...t.t.t.t.t....', '....t...t...t...',
    '................', '................'
  ];
  var JPAL = { M: '#e070c0', m: '#ffb0e8', K: '#3a0a3a', t: '#c060b0' };
  enemy.manet = {
    walk1: pair(JELLY, JPAL, 'jelly1'),
    walk2: pair(JELLY.slice(0, 9).concat(['...t.t.t.t.t....', '....t.t.t.t.t...', '...t.t.t.t.t....', '....t.t.t.t.t...',
      '...t...t...t....', '................', '................']), JPAL, 'jelly2')
  };

  // ================================================================ register
  tiles.ground.haroy = { top: tile(marsh), fill: tile(peat) };
  tiles.ground.kai = tiles.ground.havn;
  tiles.ground.hval = { top: tile(fleshTop), fill: tile(fleshFill) };
  tiles.column.haroy = halves(stoneStack());
  tiles.column.kai = halves(barrelStack());
  tiles.column.hval = halves(bonePillar());
  tiles.hardBy = { hval: tile(cartilage) };

  decor.sau = fromRows(SHEEP, { w: '#f0ece0', K: '#1a1a1a', W: '#ffffff' }, 'sheep');
  decor.lave = barn();
  decor.hjell = hjell();
  decor.myrull = cottonGrass();
  decor.hvalstasjon = station();
  decor.hvalbat = whaleBoat();
  decor.sildebat = fishingBoat();
  decor.hvalhale = flukes();
  decor.stovel = boot();
  decor.anker = anchor();
  decor.robat = rowboat();
  decor.tonne = smallBarrel();
  decor.bal = campfire();

  // ================================================================ family and Trondheim
  // Grown-ups use the 11-row heads above. Children are 16 x 20: an 8-row
  // head on a 12-row body.
  HEADS.fedora = [
    '................', '.....FFFFFF.....', '.....FFFFFF.....', '.....ffffff.....',
    '..FFFFFFFFFFFF..', '....HSSSSSSS....', '....SKKKKKKS....', '....SSSSSSPPS...',
    '....DMMMMMMMM...', '....DDDDDDDD....', '.....DDDDDD.....'
  ];
  HEADS.tove = [
    '................', '....YYYYYYY.....', '...YYYYYYYYY....', '..YYYSSSSSYYY...',
    '..YYSSSSKSSYY...', '..YYSSSSSSSSY...', '..YYSSSSSSPPY...', '..YYYSSSSSSYY...',
    '..YYYYSSSSYYY...', '...YYYYYYYYY....', '...YYYY..YYY....'
  ];
  HEADS.aslak = [
    '................', '................', '.....HHHHHH.....', '....HHHHHHHH....',
    '...HHHSSSSSHH...', '...HHSSSSKSSH...', '...HHSSSSSSSSS..', '...HHDSSSSSPP...',
    '...H.DDDDDDDD...', '.....DDDDDDD....', '......DDDD......'
  ];
  HEADS.kathinka = [
    '................', '................', '.....YYYYYY.....', '....YYYYYYYY....',
    '...YYYSSSSSY....', '...YYSSSSKSS....', '...YYSSSSSSSS...', '...YYSSSSSSPP...',
    '....Y.SSSSSS....', '......SSSS......', '................'
  ];
  HEADS.student = [
    '................', '................', '.....RRRRRR.....', '....RRRRRRRR....',
    '....RRRRRRRRR...', '....HSSSSKSS....', '....SSSSSSSSS...', '....SSSSSSPP....',
    '.....SSSSSS.....', '......SSSS......', '................'
  ];
  HEADS.professor = [
    '................', '................', '.....WWWWWW.....', '....W......W....',
    '....WSSSSSSW....', '....SKKSKKSS....', '....SSSSSSSSS...', '....SSSSSSPP....',
    '.....SSSSSS.....', '......SSSS......', '................'
  ];
  PEOPLE.skurk.pal.D = '#5e5248';
  PEOPLE.skurk.pal.H = '#5e5248';
  PEOPLE.tove = { head: 'tove', body: 'plain', pal: { Y: '#f0d070', C: '#c8304a', L: '#2a3448', N: '#3a2a1a' } };
  PEOPLE.aslak = { head: 'aslak', body: 'plain', pal: { H: '#6a4a2a', D: '#5a3a20', C: '#3a6a4a', L: '#2a3448', N: '#2a1a10' } };
  PEOPLE.kathinka = { head: 'kathinka', body: 'plain', pal: { Y: '#f0d070', C: '#e0a040', L: '#2a3448', N: '#3a2a1a' } };
  PEOPLE.student = { head: 'student', body: 'plain', pal: { R: '#d83030', C: '#3a5a9a', L: '#2a2a3a', N: '#f4f4f4', H: '#3a2a1a' } };
  PEOPLE.professor = { head: 'professor', body: 'plain', pal: { W: '#e8e8e8', C: '#6a5a4a', L: '#3a3a3a', N: '#1a1a1a' } };

  var KID_HEAD = [
    '................', '.....YYYYYY.....', '....YYYYYYYY....', '....YSSSSKSY....',
    '....YSSSSSSS....', '....YSSSSSPS....', '.....SSSSSS.....', '......SSSS......'
  ];
  var KID_BODY = [
    '.....CCCCCC.....', '....CCCCCCCC....', '...SCCCCCCCCS...', '...SCCCECCCCS...',
    '....CCCCCCCC....', '....CCCCCCCC....', '.....LLLLLL.....', '.....LL..LL.....',
    '.....LL..LL.....', '.....LL..LL.....', '....NNN..NNN....', '....NNN..NNN....'
  ];
  var KIDS = {
    // Fride: unicorn horn and a unicorn on her shirt
    fride: { head: ['.......UU.......', '......UYYY......'].concat(KID_HEAD.slice(2)),
      pal: { U: '#f0c840', Y: '#f0d070', C: '#e870b0', E: '#ffffff', L: '#5a4a8a', N: '#f4f4f4' } },
    // Tellef: Kaptein Sabeltann hat and a dinosaur on his shirt
    tellef: { head: ['...KKKKKKKKKK...', '....KKKWKKKK....', '....YYYYYYYY....'].concat(KID_HEAD.slice(3)),
      pal: { K: '#1a1a1a', W: '#f4f4f4', Y: '#f0d070', C: '#2a8a3a', E: '#a0e070', L: '#2a3448', N: '#d83030' } },
    // Asta: pigtails, ready to dance
    asta: { head: ['................', '.....YYYYYY.....', '..YYYYYYYYYYYY..', '..Y.YSSSSKSY.Y..'].concat(KID_HEAD.slice(4)),
      pal: { Y: '#f0d070', C: '#f0a030', E: '#ffe080', L: '#d84060', N: '#d84060' } }
  };
  for (var kid in KIDS) {
    npc[kid] = pair(KIDS[kid].head.concat(KID_BODY), merge({ S: '#f8c088', P: '#e8946a', K: '#141414' }, KIDS[kid].pal), 'kid ' + kid);
  }
  for (who in { tove: 1, aslak: 1, kathinka: 1, student: 1, professor: 1, skurk: 1 }) {
    pp = PEOPLE[who];
    npc[who] = pair(HEADS[pp.head].concat(BODIES[pp.body]),
      merge({ S: '#f8c088', P: '#e8946a', K: '#141414', H: '#5a3a1a' }, pp.pal), 'npc ' + who);
  }

  // Magnio's red toolbox, the thing that went missing.
  item.kasse = fromRows([
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '.....K....K.....',
    '..KKKKKKKKKKKK..',
    '..KRRRRRRRRRRK..',
    '..KRrrrrrrrrRK..',
    '..KKKKKYYKKKKK..',
    '..KRRRRYYRRRRK..',
    '..KRRRRRRRRRRK..',
    '..KRRRRRRRRRRK..',
    '..KrrrrrrrrrrK..',
    '..KKKKKKKKKKKK..',
    '................',
    '................'
  ], { K: '#3a1010', R: '#d83030', r: '#a82020', Y: '#c8c8c8' }, 'toolbox');

  // Bryggene: the old wharf houses on stilts, with Nidarosdomen behind them.
  var WHARF = ['#d8a040', '#a8382a', '#f0ece0', '#5a8a5a', '#c86a3a', '#e8d090', '#4a6a9a'];
  function wharfRow(w) {
    var h = 110, c = mk(w, h), g = c.getContext('2d');
    for (var dx = 160; dx < w; dx += 900) {
      for (var ry = 0; ry < 10; ry++) rect(g, dx + 20 + ry, 26 + ry, 100 - ry * 2, 1, '#4a5a58');
      rect(g, dx + 20, 36, 100, 40, '#7a7a80');
      rect(g, dx + 20, 22, 14, 54, '#6a6a70'); rect(g, dx + 106, 22, 14, 54, '#6a6a70');
      rect(g, dx + 60, 16, 16, 30, '#6a6a70');
      for (var s = 0; s < 16; s++) rect(g, dx + 68 - Math.round(s * 7 / 16), s, Math.round(s * 14 / 16) + 1, 1, '#4a5a58');
      disc(g, dx + 68, 48, 5, 5, '#3a3a40');
      for (var wx = dx + 38; wx < dx + 104; wx += 10) rect(g, wx, 56, 4, 12, '#3a3a40');
    }
    var x = 0, i = 0;
    while (x < w) {
      var hw = 28 + ((i * 7) % 3) * 6, hh = 44 + ((i * 5) % 3) * 8, col = WHARF[i % WHARF.length];
      var top = h - 14 - hh;
      for (var y = 0; y < 14; y++) {
        var half = Math.round((y + 1) * hw / 28);
        rect(g, x + hw / 2 - half, top + y, half * 2, 1, '#3a3036');
      }
      rect(g, x + 1, top + 14, hw - 2, hh, col);
      for (var bx = x + 3; bx < x + hw - 2; bx += 3) rect(g, bx, top + 14, 1, hh, 'rgba(0,0,0,0.12)');
      for (var row = 0; row < 3; row++) {
        for (var col2 = 0; col2 < Math.floor(hw / 10); col2++) {
          rect(g, x + 5 + col2 * 10, top + 20 + row * 12, 5, 6, '#f4f4f4');
          rect(g, x + 6 + col2 * 10, top + 21 + row * 12, 3, 4, '#2c4a6a');
        }
      }
      rect(g, x + hw / 2 - 1, top + 6, 2, 8, '#5a4028');
      for (var px = x + 3; px < x + hw - 2; px += 7) rect(g, px, h - 14, 3, 14, '#3a2a1a');
      x += hw + 2;
      i++;
    }
    return c;
  }

  // Lykkens portal, at the end of Gamle Bybro.
  function portal() {
    var w = 56, h = 76, c = mk(w, h), g = c.getContext('2d');
    var red = '#a8302a', dark = '#6a1a14', white = '#f4f4f4';
    // hipped roof, narrower at the top
    for (var y = 0; y < 12; y++) rect(g, 10 - Math.round(y * 0.8), y, 36 + Math.round(y * 1.6), 1, y % 3 === 2 ? '#2a2026' : '#3a3036');
    // lintel with white lattice
    rect(g, 2, 12, 52, 20, red);
    rect(g, 2, 12, 52, 1, white); rect(g, 2, 31, 52, 1, white);
    rect(g, 2, 12, 1, 20, white); rect(g, 53, 12, 1, 20, white);
    for (var i = 0; i < 18; i++) {
      for (var k = 0; k < 4; k++) {
        rect(g, 4 + k * 12 + Math.round(i * 12 / 18), 13 + i, 1, 1, white);
        rect(g, 16 + k * 12 - Math.round(i * 12 / 18), 13 + i, 1, 1, white);
      }
    }
    // posts
    rect(g, 2, 32, 12, 44, red); rect(g, 42, 32, 12, 44, red);
    rect(g, 2, 32, 2, 44, white); rect(g, 52, 32, 2, 44, white);
    rect(g, 12, 32, 2, 44, dark); rect(g, 42, 32, 2, 44, dark);
    return c;
  }

  // Universitetet: a grey stone main building with a tower.
  function university() {
    var w = 120, h = 92, c = mk(w, h), g = c.getContext('2d');
    var stone = '#8e8c86', line = '#6a6864';
    rect(g, 0, 38, w, 54, stone);
    for (var y = 42; y < h; y += 6) rect(g, 0, y, w, 1, line);
    for (var s = 0; s < 14; s++) rect(g, Math.round(s * 1.5), 24 + s, w - Math.round(s * 3), 1, '#3a4a48');
    rect(g, 48, 8, 24, 84, '#9a9892');
    for (s = 0; s < 18; s++) rect(g, 60 - Math.round(s * 12 / 18), -10 + s, Math.round(s * 24 / 18) + 1, 1, '#3a4a48');
    for (var x = 6; x < w - 10; x += 14) {
      if (x > 42 && x < 74) continue;
      rect(g, x, 50, 8, 14, '#f4f4f4'); rect(g, x + 1, 51, 6, 13, '#2c4a6a');
      rect(g, x, 72, 8, 12, '#f4f4f4'); rect(g, x + 1, 73, 6, 11, '#2c4a6a');
    }
    disc(g, 60, 26, 5, 5, '#f4f4f4'); disc(g, 60, 26, 4, 4, '#2c4a6a');
    rect(g, 54, 66, 12, 26, '#3a2a1a');
    disc(g, 60, 66, 6, 6, '#3a2a1a');
    return c;
  }

  // Tarred wooden piles, the two-wide column along the river.
  function piles() {
    function logs(g, y0) {
      for (var i = 0; i < 3; i++) {
        var x = 3 + i * 9;
        rect(g, x, y0, 8, 16 - y0, '#4a3424');
        rect(g, x + 1, y0, 2, 16 - y0, '#6a4a34');
      }
      rect(g, 3, 8, 26, 2, '#c8a870');
    }
    var top = mk(32, 16), g = top.getContext('2d');
    logs(g, 3);
    for (var i = 0; i < 3; i++) { disc(g, 7 + i * 9, 3, 4, 2, '#8a6a48'); disc(g, 7 + i * 9, 3, 2, 1, '#5a4028'); }
    var bottom = mk(32, 16);
    logs(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }

  tiles.ground.trd = tiles.ground.by;
  tiles.column.trd = halves(piles());
  decor.portal = portal();
  decor.universitet = university();
  decor.bakk1 = house(48, 40, 16, { wall: '#d8a040', line: '#c08a30', roof: '#3a3036', roofDark: '#2a2026', door: '#5a3a1a' });
  decor.bakk2 = house(40, 36, 16, { wall: '#a8382a', line: '#8a2a20', roof: '#3a3036', roofDark: '#2a2026', door: '#f4f4f4' });
  decor.bakk3 = house(48, 44, 18, { wall: '#5a8a5a', line: '#4a7a4a', roof: '#3a3036', roofDark: '#2a2026', door: '#a8382a' });
  decor.bakk4 = house(40, 38, 16, { wall: '#4a6a9a', line: '#3a5a8a', roof: '#3a3036', roofDark: '#2a2026', door: '#f0d070' });

  // ================================================================ boxing
  item.hansker = fromRows([
    '................',
    '................',
    '..RRRR....RRRR..',
    '.RRRRRR..RRRRRR.',
    '.RRwRRR..RRwRRR.',
    '.RRRRRR..RRRRRR.',
    '.RRRRRR..RRRRRR.',
    '.RRRRRr..RRRRRr.',
    '..RRRr....RRRr..',
    '..WWWW....WWWW..',
    '..WWWW....WWWW..',
    '................',
    '................',
    '................',
    '................',
    '................'
  ], { R: '#d82020', r: '#a01818', w: '#ff8080', W: '#f4f4f4' }, 'gloves');
  var punchWave = pair([
    '..WW..GG..',
    '....W...G.',
    '.....W...G',
    '......W..G',
    '......W..G',
    '......W..G',
    '......W..G',
    '......W..G',
    '.....W...G',
    '....W...G.',
    '..WW..GG..',
    '..........'
  ], { W: '#ffffff', G: '#c8d8f0' }, 'punch');

  // ================================================================ more enemies
  enemy.due = {
    walk1: pair(['......gg........', '.......GG.......', '........GG......', '.........GG.....',
      '...KW....WGG....'].concat(GULL_BODY, ['...WWWWWWWWWWgg.', '.....WWWWWW.....', '......Y..Y......',
      '................', '................']), { W: '#a8acb4', G: '#7a7e88', g: '#4a4e58', Y: '#e8a050', K: '#141414' }, 'pigeon1'),
    walk2: pair(['................', '................', '................', '................',
      '...KW...........'].concat(GULL_BODY, ['...WWWWWGGWWWgg.', '.....WWWGGGW....', '......Y..GGG....',
      '..........GG....', '...........g....']), { W: '#a8acb4', G: '#7a7e88', g: '#4a4e58', Y: '#e8a050', K: '#141414' }, 'pigeon2')
  };
  var FISH = [
    '................', '................', '................', '................',
    '................',
    '....BBBBBBB.....',
    '..BBbBbBbBBBB..T',
    '.BKBBBBBBBBBBTT.',
    'BBWWWWWWWWWWWTT.',
    '.WWWWWWWWWWWW.TT',
    '..WWWWWWWWWW..T.',
    '....WWWWWW......',
    '................', '................', '................', '................'
  ];
  var FPAL = { B: '#3a6a9a', b: '#1a3a5a', K: '#141414', W: '#d8e4ec', T: '#3a6a9a' };
  enemy.fisk = { walk1: pair(FISH, FPAL, 'fish'), walk2: pair(FISH, FPAL, 'fish2') };
  var CASE_TOP = [
    '................', '................',
    '......KKKK......', '......K..K......', '..KKKKKKKKKKKK..', '..KCCCCCCCCCCK..',
    '..KCKKCCCCKKCK..', '..KCCKCCCCKCCK..', '..KCCCCCCCCCCK..', '..KCYYYYYYYYCK..',
    '..KCCCCCCCCCCK..', '..KCCCKKKKCCCK..', '..KCCCCCCCCCCK..', '..KKKKKKKKKKKK..'
  ];
  var KPAL = { K: '#1a1a1a', C: '#3a7ac0', Y: '#f0c840' };
  enemy.koffert = {
    walk1: pair(CASE_TOP.concat(['...KK......KK...', '...KK......KK...']), KPAL, 'case1'),
    walk2: pair(CASE_TOP.concat(['..KK........KK..', '..KK........KK..']), KPAL, 'case2'),
    flat: pair(['................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................',
      '..KKKKKKKKKKKK..', '..KCKKCCCCKKCK..', '..KCYYYYYYYYCK..', '..KCCCCCCCCCCK..', '..KKKKKKKKKKKK..',
      '...KK......KK...'], KPAL, 'caseflat')
  };

  // ================================================================ Heim
  function cabin() {
    var w = 64, h = 46, c = mk(w, h), g = c.getContext('2d');
    for (var y = 0; y < 16; y++) {
      var inset = Math.round((15 - y) * 1.3);
      rect(g, inset, y, w - inset * 2, 1, y < 3 ? '#3a7a2a' : (y % 3 ? '#4a8a34' : '#2a5a20'));
    }
    rect(g, 46, 0, 6, 8, '#6a6a6a');
    rect(g, 2, 16, w - 4, 30, '#a8382a');
    for (var x = 4; x < w - 2; x += 3) rect(g, x, 16, 1, 30, '#8a2a20');
    rect(g, 2, 16, w - 4, 1, '#f4f4f4');
    rect(g, 2, 16, 2, 30, '#f4f4f4'); rect(g, w - 4, 16, 2, 30, '#f4f4f4');
    windowAt(g, 8, 22); windowAt(g, 46, 22);
    rect(g, 27, 24, 10, 22, '#f4f4f4'); rect(g, 28, 25, 8, 21, '#2a5a8a');
    return c;
  }
  // Sjekte: a small wooden boat with an outboard motor. Its deck is a platform.
  function sjekte() {
    var w = 64, h = 22, c = mk(w, h), g = c.getContext('2d');
    for (var y = 0; y < 12; y++) {
      var inset = Math.round(y * y * 0.12);
      rect(g, inset, 4 + y, w - inset * 2 - 6, 1, y < 2 ? '#e8e0c8' : (y % 3 ? '#c8a878' : '#a88858'));
    }
    rect(g, 0, 4, w - 6, 1, '#f4f4f4');
    rect(g, w - 10, 0, 6, 10, '#2a2a2a'); rect(g, w - 9, 1, 3, 3, '#d82020');
    rect(g, w - 8, 10, 2, 10, '#3a3a3a');
    return c;
  }

  // ================================================================ Værnes
  function terminal(w) {
    var h = 216, c = mk(w, h), g = c.getContext('2d');
    rect(g, 0, 0, w, h, '#e0e0dc');
    rect(g, 0, 0, w, 20, '#4a4a52');
    for (var x = 20; x < w; x += 48) rect(g, x, 16, 16, 3, '#fff8d0');
    for (var n = 0, x = 8; x + 88 <= w; x += 96, n++) {
      rect(g, x, 30, 88, 120, '#3a3a40');
      for (var y = 0; y < 96; y++) rect(g, x + 3, 33 + y, 82, 1, y < 50 ? '#9ac8f0' : '#b8dcf4');
      rect(g, x + 3, 129, 82, 18, '#7a7a7a');
      rect(g, x + 3, 136, 82, 1, '#f0e080');
      if (n % 3 === 0) {
        rect(g, x + 10, 112, 64, 10, '#f4f4f4');
        disc(g, x + 10, 117, 4, 5, '#f4f4f4');
        for (var t = 0; t < 14; t++) rect(g, x + 62 + Math.round(t * 0.6), 98 + t, 10 - Math.round(t * 0.4), 1, '#2a5aa8');
        rect(g, x + 30, 120, 26, 3, '#c8c8c8');
        for (var wv = x + 16; wv < x + 60; wv += 5) rect(g, wv, 114, 2, 2, '#2c4a6a');
      }
      rect(g, x + 43, 30, 3, 120, '#3a3a40');
    }
    rect(g, 0, 150, w, 42, '#c8c8c4');
    rect(g, 0, 160, w, 3, '#1f3f7a');
    return c;
  }
  function floorTop(g) {
    rect(g, 0, 0, 16, 16, '#a8a8a4');
    rect(g, 0, 0, 16, 3, '#d8d8d4');
    rect(g, 0, 0, 16, 1, '#f4f4f0');
    rect(g, 0, 8, 16, 1, '#9a9a96'); rect(g, 7, 3, 1, 13, '#9a9a96');
  }
  function floorFill(g) {
    rect(g, 0, 0, 16, 16, '#8a8a86');
    rect(g, 0, 8, 16, 1, '#7a7a76'); rect(g, 7, 0, 1, 16, '#7a7a76');
  }
  function suitcases() {
    function bags(g, y0) {
      var cols = ['#c83a3a', '#3a7ac0', '#2a2a2a', '#d8a030'];
      for (var i = 0; i < 2; i++) {
        var col = cols[(i + y0) % cols.length];
        rect(g, i * 16 + 1, y0, 14, 16 - y0, col);
        rect(g, i * 16 + 1, y0, 14, 1, 'rgba(255,255,255,0.35)');
        rect(g, i * 16 + 7, y0 + 3, 2, 13 - y0, 'rgba(0,0,0,0.25)');
      }
    }
    var top = mk(32, 16), g = top.getContext('2d');
    bags(g, 3);
    rect(g, 5, 0, 6, 3, '#1a1a1a');
    rect(g, 21, 0, 6, 3, '#1a1a1a');
    var bottom = mk(32, 16);
    bags(bottom.getContext('2d'), 0);
    return { top: top, body: bottom };
  }
  function steelBox(g) {
    rect(g, 0, 0, 16, 16, '#4a5058');
    rect(g, 0, 0, 15, 15, '#8a9098');
    rect(g, 0, 0, 15, 1, '#c0c8d0'); rect(g, 0, 0, 1, 15, '#c0c8d0');
    rect(g, 3, 3, 1, 1, '#4a5058'); rect(g, 11, 3, 1, 1, '#4a5058'); rect(g, 3, 11, 1, 1, '#4a5058'); rect(g, 11, 11, 1, 1, '#4a5058');
  }
  function plant() {
    var c = mk(16, 26), g = c.getContext('2d');
    rect(g, 3, 16, 10, 10, '#e0e0dc'); rect(g, 3, 16, 10, 2, '#c8c8c4');
    disc(g, 8, 9, 6, 7, '#2a7a3a'); disc(g, 6, 7, 3, 3, '#3a9a4a'); disc(g, 11, 11, 3, 3, '#3a9a4a');
    return c;
  }
  function bench() {
    var c = mk(40, 12), g = c.getContext('2d');
    rect(g, 0, 2, 40, 4, '#3a3a40'); rect(g, 0, 2, 40, 1, '#6a6a70');
    rect(g, 3, 6, 2, 6, '#2a2a30'); rect(g, 35, 6, 2, 6, '#2a2a30');
    return c;
  }

  // ================================================================ Moraira
  function palm(h) {
    var w = 48, c = mk(w, h), g = c.getContext('2d'), top = 14;
    for (var y = top; y < h; y++) {
      var k = (h - y) / (h - top), x = 20 + Math.round(k * k * 6);
      rect(g, x, y, 4, 1, (y % 4 === 0) ? '#6a4a28' : '#8a6a40');
    }
    var angles = [-2.7, -2.1, -1.4, -0.6, 0.2, 0.9];
    for (var a = 0; a < angles.length; a++) {
      for (var t = 0; t < 20; t++) {
        var px = 26 + Math.round(Math.cos(angles[a]) * t), py = top + Math.round(Math.sin(angles[a]) * t * 0.6 + t * t * 0.03);
        rect(g, px, py, 3, 2, t % 3 ? '#2a8a3a' : '#4ab04a');
      }
    }
    disc(g, 25, top + 2, 2, 2, '#6a4a20'); disc(g, 28, top + 3, 2, 2, '#6a4a20');
    return c;
  }
  function parasol() {
    var c = mk(28, 28), g = c.getContext('2d');
    for (var y = 0; y < 8; y++) {
      var half = Math.round(4 + y * 1.3);
      for (var x = -half; x < half; x++) rect(g, 14 + x, y, 1, 1, ((x + 20) >> 2) % 2 ? '#e83030' : '#f8f4ec');
    }
    rect(g, 13, 8, 2, 20, '#8a7a6a');
    return c;
  }
  function apartment(wall, line, roof, accent) {
    var w = 80, h = 96, c = mk(w, h), g = c.getContext('2d');
    rect(g, 0, 0, w, 6, roof);
    rect(g, 2, 6, w - 4, h - 6, wall);
    for (var y = 10; y < h; y += 3) rect(g, 2, y, w - 4, 1, line);
    for (var fl = 0; fl < 3; fl++) {
      var fy = 12 + fl * 28;
      for (var x = 8; x < w - 12; x += 22) {
        rect(g, x, fy, 14, 16, '#ffffff'); rect(g, x + 1, fy + 1, 12, 15, '#2c4a6a');
        rect(g, x - 3, fy, 3, 16, accent); rect(g, x + 14, fy, 3, 16, accent);
      }
      if (fl < 2) {
        rect(g, 4, fy + 18, w - 8, 2, '#d8d0c0');
        for (x = 5; x < w - 4; x += 3) rect(g, x, fy + 20, 1, 6, accent);
        rect(g, 4, fy + 26, w - 8, 1, accent);
      }
    }
    rect(g, 34, h - 18, 12, 18, '#5a3a1a');
    return c;
  }
  function medSea(w) {
    var h = 96, c = mk(w, h), g = c.getContext('2d');
    for (var dx = 120; dx < w; dx += 640) {
      for (var x = 0; x < 120; x++) {
        var t = x / 120, top = Math.round(40 - (t < 0.35 ? t / 0.35 * 34 : 34 - (t - 0.35) / 0.65 * 30));
        rect(g, dx + x, top, 1, 40 - top + 2, '#b8a890');
        if (x % 7 === 0) rect(g, dx + x, top + 4, 1, 6, '#9a8a74');
      }
    }
    rect(g, 0, 40, w, 56, '#2aa8c8');
    rect(g, 0, 40, w, 1, '#c8f0f8'); rect(g, 0, 70, w, 26, '#1a88b0');
    for (var r = 0; r < 5; r++) for (x = (r * 11) % 17; x < w; x += 17) rect(g, x, 46 + r * 9, 4, 1, '#6ad0e8');
    return c;
  }
  function sandTop(g) {
    rect(g, 0, 0, 16, 16, '#d8b078');
    rect(g, 0, 0, 16, 5, '#f0d8a0'); rect(g, 0, 0, 16, 1, '#fff0c8');
    rect(g, 3, 2, 1, 1, '#c8a870'); rect(g, 10, 3, 1, 1, '#c8a870');
    rect(g, 4, 9, 4, 1, '#c09868'); rect(g, 10, 13, 3, 1, '#c09868');
  }
  function sandFill(g) {
    rect(g, 0, 0, 16, 16, '#d8b078');
    rect(g, 4, 5, 4, 1, '#c09868'); rect(g, 10, 11, 3, 1, '#c09868');
  }
  function pots() {
    function pot(g, x, y0) {
      rect(g, x + 2, y0, 12, 16 - y0, '#c8603a');
      rect(g, x + 1, y0, 14, 3, '#d8784a');
      rect(g, x + 3, y0 + 4, 2, 12 - y0, '#e08a5a');
      rect(g, x + 11, y0 + 3, 2, 13 - y0, '#a04a2a');
    }
    var top = mk(32, 16), g = top.getContext('2d');
    pot(g, 0, 4); pot(g, 16, 4);
    disc(g, 8, 3, 5, 3, '#3a8a3a'); disc(g, 24, 3, 5, 3, '#3a8a3a');
    rect(g, 6, 1, 2, 2, '#f08020'); rect(g, 25, 2, 2, 2, '#e83070');
    var bottom = mk(32, 16), g2 = bottom.getContext('2d');
    pot(g2, 0, 0); pot(g2, 16, 0);
    return { top: top, body: bottom };
  }

  // ================================================================ Praha
  function pragueSkyline(w) {
    var h = 110, c = mk(w, h), g = c.getContext('2d');
    for (var dx = 60; dx < w; dx += 720) {
      disc(g, dx + 140, h + 30, 170, 70, '#4a6a4a');
      rect(g, dx + 40, 40, 200, 26, '#e8dcc0');
      rect(g, dx + 40, 36, 200, 4, '#5a8a7a');
      for (var x = dx + 46; x < dx + 236; x += 8) rect(g, x, 46, 3, 5, '#5a5a50');
      // Vituskatedralen: nave with a steep roof, two thin west spires and a
      // main tower with a green copper top.
      var stone = '#7a7874', dark = '#4a4846', copper = '#5a8a7a';
      rect(g, dx + 118, 30, 46, 22, stone);
      for (var r = 0; r < 10; r++) rect(g, dx + 120 + r, 20 + r, 42 - r * 2, 1, dark);
      for (var wx2 = dx + 126; wx2 < dx + 158; wx2 += 7) rect(g, wx2, 34, 2, 10, dark);
      var spires = [dx + 116, dx + 132];
      for (var k = 0; k < spires.length; k++) {
        rect(g, spires[k], 18, 8, 34, stone);
        rect(g, spires[k] + 3, 24, 2, 8, dark);
        for (var sp = 0; sp < 18; sp++) {
          var sw = 1 + Math.round(sp * 7 / 18);
          rect(g, spires[k] + 4 - Math.floor(sw / 2), sp, sw, 1, dark);
        }
      }
      rect(g, dx + 160, 20, 14, 32, stone);
      rect(g, dx + 165, 28, 4, 8, dark);
      disc(g, dx + 167, 18, 7, 4, copper);
      for (sp = 0; sp < 10; sp++) rect(g, dx + 167 - Math.floor(sp / 4), 4 + sp, 1 + Math.floor(sp / 2), 1, copper);
    }
    var cols = ['#f0d8a0', '#e8c8c0', '#f4f0e0', '#d8e0c0', '#f0c890'];
    var s = 0;
    for (x = 0; x < w; s++) {
      var hw = 22 + (s * 7) % 3 * 6, hh = 26 + (s * 5) % 3 * 6, top = h - hh;
      for (var y = 0; y < 10; y++) rect(g, x + 10 - y, top - 10 + y, hw - 20 + y * 2, 1, '#b8502a');
      rect(g, x, top, hw, hh, cols[s % cols.length]);
      for (var wx = x + 3; wx < x + hw - 4; wx += 7) { rect(g, wx, top + 6, 4, 6, '#3a4a5a'); rect(g, wx, top + 16, 4, 6, '#3a4a5a'); }
      x += hw;
    }
    return c;
  }
  function tram() {
    var w = 80, h = 36, c = mk(w, h), g = c.getContext('2d');
    rect(g, 2, 8, w - 4, 24, '#f0e8d0');
    rect(g, 2, 22, w - 4, 10, '#c82020');
    rect(g, 2, 8, w - 4, 2, '#c82020');
    for (var x = 6; x < w - 8; x += 12) rect(g, x, 12, 9, 8, '#2c4a6a');
    rect(g, 30, 2, 20, 2, '#3a3a3a'); rect(g, 38, 0, 2, 8, '#3a3a3a');
    disc(g, 16, 33, 3, 3, '#1a1a1a'); disc(g, w - 16, 33, 3, 3, '#1a1a1a');
    return c;
  }
  function orloj() {
    var w = 40, h = 120, c = mk(w, h), g = c.getContext('2d');
    rect(g, 6, 24, 28, 96, '#7a7468');
    for (var y = 28; y < h; y += 6) rect(g, 6, y, 28, 1, '#6a6458');
    for (var s = 0; s < 24; s++) rect(g, 20 - Math.round(s * 14 / 24), s, Math.round(s * 28 / 24) + 1, 1, '#3a3a38');
    rect(g, 4, 22, 32, 3, '#3a3a38');
    disc(g, 20, 76, 11, 11, '#d8b040');
    disc(g, 20, 76, 9, 9, '#2a5aa8');
    disc(g, 20, 76, 5, 5, '#c84a30');
    rect(g, 20, 66, 1, 10, '#f0d060'); rect(g, 20, 76, 8, 1, '#f0d060');
    rect(g, 14, 104, 12, 16, '#3a2a1a');
    return c;
  }
  function saint() {
    var c = mk(16, 44), g = c.getContext('2d'), col = '#3a3a34';
    rect(g, 1, 30, 14, 14, '#8a8478'); rect(g, 1, 30, 14, 2, '#a8a294');
    disc(g, 8, 6, 3, 3, col);
    rect(g, 5, 9, 6, 21, col); rect(g, 3, 12, 2, 8, col); rect(g, 11, 12, 2, 8, col);
    for (var a = 0; a < 12; a++) rect(g, 8 + Math.round(Math.cos(a / 12 * Math.PI * 2) * 5), 6 + Math.round(Math.sin(a / 12 * Math.PI * 2) * 5), 1, 1, '#d8b040');
    return c;
  }
  function balustrade() {
    var c = mk(32, 18), g = c.getContext('2d');
    rect(g, 0, 0, 32, 4, '#a8a294'); rect(g, 0, 0, 32, 1, '#c8c2b4');
    for (var x = 2; x < 32; x += 6) { rect(g, x, 4, 3, 12, '#9a9488'); rect(g, x - 1, 8, 5, 3, '#9a9488'); }
    rect(g, 0, 16, 32, 2, '#8a8478');
    return c;
  }

  // ================================================================ register
  tiles.ground.heim = tiles.ground.skog;
  tiles.column.heim = tiles.column.haroy;
  tiles.ground.fly = { top: tile(floorTop), fill: tile(floorFill) };
  tiles.column.fly = halves(suitcases());
  tiles.hardBy.fly = tile(steelBox);
  tiles.ground.spania = { top: tile(sandTop), fill: tile(sandFill) };
  tiles.column.spania = halves(pots());
  tiles.ground.praha = tiles.ground.by;
  tiles.column.praha = tiles.column.haroy;

  decor.hytte = cabin();
  decor.sjekte = sjekte();
  decor.plante = plant();
  decor.benk = bench();
  decor.palme = palm(72);
  decor.palmeHoy = palm(96);
  decor.parasoll = parasol();
  decor.villa = house(64, 40, 12, { wall: '#f8f4ec', line: '#ebe4d6', roof: '#c8603a', roofDark: '#a04a2a', door: '#2a6aa8', slope: 2.4 });
  decor.leilighet = apartment('#f8f4ec', '#ebe4d6', '#c8603a', '#2a6aa8');
  decor.praghus = apartment('#f0d8a0', '#e0c890', '#b8502a', '#5a8a7a');
  decor.trikk = tram();
  decor.orloj = orloj();
  decor.helgen = saint();
  decor.rekkverk = balustrade();

  // ================================================================ the finale
  // Gorm without his disguise.
  HEADS.gorm = [
    '................', '................', '.....HHHHHH.....', '....HHHHHHHH....',
    '....HHSSSSSH....', '....HSSSSKSS....', '....SSSSSSSSS...', '....DSSSSSPP....',
    '....DDDDDDDD....', '.....DDDDDD.....', '......DDDD......'
  ];
  PEOPLE.gorm = { head: 'gorm', body: 'coat', pal: { H: '#5e5248', D: '#5e5248', C: '#b08850', c: '#7a5a30', L: '#2a2a2a', N: '#141414' } };
  npc.gorm = pair(HEADS.gorm.concat(BODIES.coat), merge({ S: '#f8c088', P: '#e8946a', K: '#141414' }, PEOPLE.gorm.pal), 'npc gorm');

  // The statue: Magne riding a whale, with a mullet, raising a boxing glove.
  function statue() {
    var w = 96, h = 104, c = mk(w, h), g = c.getContext('2d');
    var mid = '#4a7a6a', hi = '#7ab0a0', lo = '#2a4a40';
    // pedestal with a gold plaque
    rect(g, 12, 76, 72, 6, '#c8c2b4');
    rect(g, 16, 82, 64, 22, '#a8a294');
    rect(g, 16, 82, 64, 2, '#c8c2b4');
    rect(g, 34, 88, 28, 10, '#a87810');
    rect(g, 35, 89, 26, 8, '#e0b840');
    // the whale, facing left, tail up behind
    disc(g, 46, 62, 36, 15, lo);
    disc(g, 46, 61, 34, 13, mid);
    disc(g, 40, 56, 22, 5, hi);
    for (var i = 0; i < 14; i++) disc(g, 74 + i, Math.round(58 - i * 1.4), 5 - Math.floor(i / 5), 4 - Math.floor(i / 5), mid);
    disc(g, 81, 37, 7, 3, mid); disc(g, 91, 37, 4, 3, mid);
    rect(g, 14, 66, 22, 1, lo);
    disc(g, 22, 58, 2, 2, lo);
    // the rider
    rect(g, 44, 44, 5, 14, mid); rect(g, 44, 44, 2, 14, hi);
    rect(g, 42, 28, 14, 18, mid); rect(g, 42, 28, 3, 18, hi);
    disc(g, 49, 22, 6, 6, mid);
    disc(g, 47, 20, 3, 3, hi);
    rect(g, 43, 15, 13, 4, lo);
    rect(g, 53, 18, 5, 14, lo);
    rect(g, 43, 25, 7, 2, hi);
    rect(g, 38, 12, 4, 18, mid);
    disc(g, 39, 9, 5, 5, mid);
    disc(g, 38, 8, 2, 2, hi);
    return c;
  }

  // A yellow helicopter. The rotor is drawn by the game so it can spin.
  function helicopter() {
    var w = 84, h = 36, c = mk(w, h), g = c.getContext('2d');
    rect(g, 40, 2, 4, 6, '#3a3a3a');
    rect(g, 52, 14, 26, 5, '#f0c020'); rect(g, 52, 14, 26, 1, '#fff080');
    rect(g, 74, 4, 5, 12, '#f0c020');
    disc(g, 77, 8, 4, 4, '#5a5a5a');
    disc(g, 38, 18, 22, 11, '#d8a010');
    disc(g, 38, 17, 21, 10, '#f0c020');
    disc(g, 25, 15, 9, 6, '#9ac8f0'); disc(g, 23, 13, 3, 2, '#e0f0ff');
    rect(g, 30, 22, 30, 2, '#d82020');
    rect(g, 22, 31, 36, 2, '#3a3a3a');
    rect(g, 28, 27, 2, 5, '#3a3a3a'); rect(g, 48, 27, 2, 5, '#3a3a3a');
    return c;
  }

  SM.art = {
    statue: statue(),
    helicopter: helicopter(),
    punch: punchWave,
    terminal: terminal,
    medSea: medSea,
    pragueSkyline: pragueSkyline,
    npc: npc,
    wharfRow: wharfRow,
    whale: whale,
    drawWhale: drawWhale,
    mountains: mountains,
    ribs: ribs,
    player: player,
    enemy: enemy,
    item: item,
    ring: ring,
    tiles: tiles,
    decor: decor,
    gull: gull,
    flag: flag(),
    seaStrip: seaStrip,
    ridge: ridge,
    disc: disc,
    WATER: WATER,
    WATER_DEEP: WATER_DEEP
  };
})();
