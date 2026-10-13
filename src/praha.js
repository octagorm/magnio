// Praha, the other place he and Tove rented out apartments. A side trip from
// Værnes: the old town with the astronomical clock and the trams, then
// Karlsbroa with its statues and the castle above the river. The tram at
// the start goes into town, for a walk round the whole of Praha
// (src/byvandring.js).
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.praha = {
    name: 'PRAHA',
    subtitle: 'GAMLEBYEN OG KARLSBROA',
    map: { lon: 0, lat: 0 },
    build: function () {
      var W = 150, H = 14, grid = [], enemies = [];
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
      function enemy(type, x, y) { enemies.push({ type: type, x: x, y: y }); }
      function arc(x) { set(x - 1, 10, 'o'); set(x, 9, 'o'); set(x + 1, 9, 'o'); set(x + 2, 10, 'o'); }

      ground(0, 60); ground(64, 149);

      // --- Gamlebyen
      set(12, 8, '?');
      row(16, 8, 'B?MB');
      enemy('koffert', 22, 11);
      enemy('due', 26, 6);
      column(34, 2);
      row(40, 8, '?C?');
      enemy('bill', 44, 11); enemy('koffert', 47, 11);
      column(52, 3);
      enemy('due', 56, 5);
      arc(61);

      // --- Karlsbroa
      row(70, 8, 'BKB');
      enemy('bill', 76, 11);
      enemy('due', 82, 6); enemy('due', 96, 5);
      row(88, 7, 'ooooo');
      column(100, 2);
      enemy('koffert', 106, 11); enemy('bill', 108, 11);
      row(112, 8, '?B?');
      enemy('due', 118, 6);
      column(124, 3);

      var npcs = [
        { look: 'trikk', name: 'TRIKKEN', x: 6, still: true, game: 'byvandring', lines: [
          'TRIKKEN INN TIL SENTRUM. DEN GÅR PÅ KRYSS OG TVERS GJENNOM HELE BYEN.'
        ] },
        { look: 'tove', name: 'TOVE', x: 12.5, lines: [
          'SKA ME TA TRIKKEN INN TE BYEN, MAGNE?',
          'DA KAN ME GÅ PÅ KRYSS OG TVERS. OG KJØPE SOKKER TE GUTTENE!'
        ] },
        { look: 'professor', name: 'GUIDEN', x: 30, lines: [
          'VITEJTE! VELKOMMEN TIL PRAHA. DEN ASTRONOMISKE KLOKKA HAR GÅTT SIDEN 1410.',
          'EN MANN I FRAKK SPURTE MEG OM HVOR MYE EN RYTTERSTATUE VEIER. RAR TYPE.'
        ] },
        { look: 'student', name: 'LEIETAKEREN', x: 134, ends: true, pays: 50, clue: 'HAN MÅLTE STATUENE', lines: [
          'DOBRY DEN, PANE MAGNE! LEILIGHETEN ER SOM ET LITE SLOTT.',
          'HER ER HUSLEIEN. DEKUJI!',
          'EN MANN I FRAKK STO PÅ KARLSBROA OG MÅLTE STATUENE MED TOMMESTOKK. HAN SA HAN SKULLE LAGE EN SELV.'
        ] }
      ];

      var decor = [
        { kind: 'sign', x: 1, text: 'PRAHA' },
        { kind: 'praghus', x: 14 }, { kind: 'orloj', x: 26 }, { kind: 'praghus', x: 36 },
        { kind: 'lykt', x: 24 }, { kind: 'lykt', x: 46 }, { kind: 'praghus', x: 50 },
        { kind: 'sign', x: 66, text: 'KARLSBROA' },
        { kind: 'rekkverk', x: 68 }, { kind: 'rekkverk', x: 70 }, { kind: 'helgen', x: 72 }, { kind: 'rekkverk', x: 73 },
        { kind: 'rekkverk', x: 75 }, { kind: 'rekkverk', x: 77 }, { kind: 'helgen', x: 79 }, { kind: 'rekkverk', x: 80 },
        { kind: 'rekkverk', x: 82 }, { kind: 'rekkverk', x: 84 }, { kind: 'helgen', x: 86 }, { kind: 'rekkverk', x: 87 },
        { kind: 'rekkverk', x: 89 }, { kind: 'rekkverk', x: 91 }, { kind: 'helgen', x: 93 }, { kind: 'rekkverk', x: 94 },
        { kind: 'rekkverk', x: 96 }, { kind: 'rekkverk', x: 98 }, { kind: 'helgen', x: 103 }, { kind: 'rekkverk', x: 104 },
        { kind: 'rekkverk', x: 106 }, { kind: 'rekkverk', x: 108 }, { kind: 'helgen', x: 110 }, { kind: 'rekkverk', x: 111 },
        { kind: 'lykt', x: 116 }, { kind: 'trikk', x: 118 }, { kind: 'praghus', x: 128 }, { kind: 'praghus', x: 137 },
        { kind: 'gull', x: 60, y: 3 }
      ];
      var clouds = [[10, 2, 2], [34, 3, 1]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'praha' }],
        start: { x: 3, y: 11 }, sky: '#b0c8e0',
        ending: { type: 'talk' },
        clear: { title: 'PRAHA', lines: ['KARLSBROA, SLOTTET OG HUSLEIE.', 'NÅ GÅR TUREN HJEM TIL LILLESAND.'] }
      };
    }
  };
})();
