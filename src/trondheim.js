// Trondheim, where he lived for many years. Along Nidelva with the old wharf
// houses and Nidarosdomen across the river, past the university and up
// through Bakklandet, to Lykkens portal at Gamle Bybro, where Tove is waiting.
// Talking to her ends the level, and she swaps his cigar for boxing gloves.
// Near the start, the stockbroker outside the exchange runs Trondheim Børs.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.trondheim = {
    name: 'TRONDHEIM',
    subtitle: 'LANGS NIDELVA TIL LYKKENS PORTAL',
    map: { lon: 10.39, lat: 63.43 },
    build: function () {
      var W = 190, H = 14, grid = [], enemies = [];
      for (var y = 0; y < H; y++) {
        var r = [];
        for (var x = 0; x < W; x++) r.push('.');
        grid.push(r);
      }

      function set(x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = c; }
      function ground(a, b) { for (var x = a; x <= b; x++) { set(x, 12, '#'); set(x, 13, '#'); } }
      function row(x, y, s) { for (var i = 0; i < s.length; i++) if (s[i] !== ' ') set(x + i, y, s[i]); }
      function column(x, h) {
        var top = 12 - h;
        set(x, top, '['); set(x + 1, top, ']');
        for (var y = top + 1; y < 12; y++) { set(x, y, '{'); set(x + 1, y, '}'); }
      }
      function stairsUp(x, n) { for (var i = 0; i < n; i++) for (var k = 0; k <= i; k++) set(x + i, 11 - k, 'X'); }
      function stairsDown(x, n) { for (var i = 0; i < n; i++) for (var k = 0; k < n - i; k++) set(x + i, 11 - k, 'X'); }
      function enemy(type, x, y) { enemies.push({ type: type, x: x, y: y }); }
      function arc(x) { set(x - 1, 10, 'o'); set(x, 9, 'o'); set(x + 1, 9, 'o'); set(x + 2, 10, 'o'); }

      ground(0, 44); ground(47, 90); ground(93, 140); ground(143, 189);

      // --- Along the river
      set(10, 8, '?');
      row(14, 8, 'B?MB');
      enemy('bill', 18, 11);
      column(24, 2);
      enemy('make', 28, 6);
      row(30, 8, '?B?');
      enemy('bill', 34, 11); enemy('bill', 36, 11);
      column(40, 3);
      arc(45);

      // --- The university
      row(68, 8, 'BKB');
      enemy('bill', 72, 11);
      enemy('make', 76, 5);
      column(80, 4);
      set(85, 8, 'h');
      arc(91);

      // --- Bakklandet
      row(98, 8, '?C?');
      set(99, 4, 'M');
      enemy('bill', 104, 11); enemy('bill', 106, 11);
      stairsUp(110, 3); stairsDown(114, 3);
      enemy('make', 118, 6);
      column(124, 3);
      enemy('bill', 128, 11); enemy('bill', 130, 11);
      arc(141);

      // --- Gamle Bybro
      row(150, 8, 'B??B');
      enemy('bill', 156, 11);
      column(160, 2);
      enemy('make', 165, 5);
      row(168, 7, 'oooo');

      var npcs = [
        { look: 'megler', name: 'MEGLEREN', x: 10, game: 'bors', lines: [
          'MAGNIO! VELKOMMEN TIL TRONDHEIM BØRS. HER LØPER AKSJENE OM KAPP, OG DU KAN SATSE KRONENE DINE.',
          'JEG HAR ET GODT TIPS: KJØP LAVT OG SELG HØYT. KOM INN!'
        ] },
        { look: 'student', name: 'STUDENTEN', x: 52, clue: 'SKJEGG UNDER BARTEN', lines: [
          'MANNEN I FRAKK? HAN SPURTE MEG OM VEIEN TIL GAMLE BYBRO.',
          'JEG KUNNE SVERGE PÅ AT HAN HADDE ET HELT ANNET SKJEGG UNDER DEN BARTEN.'
        ] },
        { look: 'professor', name: 'PROFESSOREN', x: 64, lines: [
          'LETER DU ETTER TOVE? HUN VAR HER PÅ UNIVERSITETET I STAD.',
          'HUN GIKK NED MOT BYBROA. HUN SA HUN SKULLE MØTE NOEN VED LYKKENS PORTAL.'
        ] },
        { look: 'tove', name: 'TOVE', x: 174, ends: true, hearts: true, gives: 'hansker', clue: 'HAN SKAL BYGGE NOE STORT', lines: [
          'DER E DU JO, MAGNE!',
          'EN MANN I FRAKK? HMM... HAN SA HAN SKULLE BYGGE NOE STORT. OG AT HAN TRENGTE VERKTØYKASSA DI.',
          'OG EN TING TE: NÅ E DET SLUTT PÅ SIGARENE. PRØV DISSE BOKSEHANSKENE I STEDEN!',
          'KOM, SÅ GÅR ME OVER BROA SAMMEN.'
        ] }
      ];

      var decor = [
        { kind: 'sign', x: 1, text: 'TRONDHEIM' },
        { kind: 'gull', x: 15, y: 4 }, { kind: 'gull', x: 60, y: 3 }, { kind: 'gull', x: 120, y: 4 }, { kind: 'gull', x: 170, y: 3 },
        { kind: 'bors', x: 5 }, { kind: 'lykt', x: 12 }, { kind: 'lykt', x: 20 }, { kind: 'lykt', x: 36 },
        { kind: 'pullert', x: 12 }, { kind: 'pullert', x: 30 },
        { kind: 'universitet', x: 55 }, { kind: 'sign', x: 49, text: 'UNIVERSITETET' },
        { kind: 'lykt', x: 76 }, { kind: 'lykt', x: 86 },
        { kind: 'sign', x: 94, text: 'BAKKLANDET' },
        { kind: 'bakk1', x: 97 }, { kind: 'bakk2', x: 101 }, { kind: 'bakk3', x: 104 }, { kind: 'bakk4', x: 108 },
        { kind: 'bakk2', x: 117 }, { kind: 'bakk1', x: 120 }, { kind: 'bakk4', x: 126 }, { kind: 'bakk3', x: 130 },
        { kind: 'bakk1', x: 134 },
        { kind: 'lykt', x: 145 }, { kind: 'lykt', x: 158 }, { kind: 'portal', x: 176 }
      ];
      var clouds = [[8, 3, 2], [22, 2, 1], [33, 3, 3], [44, 2, 1]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'trd' }],
        start: { x: 3, y: 11 }, sky: '#a8c4dc',
        ending: { type: 'portal' },
        clear: { title: 'LYKKENS PORTAL', lines: ['MAGNIO OG TOVE FANT HVERANDRE,', 'OG SIGAREN BLE BYTTET MOT BOKSEHANSKER.'] }
      };
    }
  };
})();
