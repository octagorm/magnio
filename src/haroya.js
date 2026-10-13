// Harøya, where he was born. Marsh, sheep and the church first, then the quay
// at Steinshamn with herring barrels and the whaling station. At the end of
// the quay a whale comes up and swallows him.
//
// Tiles are the same as in lillesand.js. People (npcs) stand on the ground
// and talk when you press up or △ next to them.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.haroya = {
    name: 'HARØYA',
    subtitle: 'DER DET HELE BEGYNTE',
    map: { lon: 6.43, lat: 62.78 },
    build: function () {
      var W = 210, H = 14, grid = [], enemies = [];
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
      // y is the row the enemy stands in, or flies along
      function enemy(type, x, y) { enemies.push({ type: type, x: x, y: y }); }
      function arc(x) { set(x - 1, 10, 'o'); set(x, 9, 'o'); set(x + 1, 9, 'o'); set(x + 2, 10, 'o'); }

      ground(0, 40); ground(43, 70); ground(73, 100); ground(103, 150); ground(154, 196);

      // --- The island: marsh, stone walls and sheep
      set(11, 8, '?');
      row(15, 8, 'BMB?B');
      set(17, 4, '?');
      enemy('bill', 20, 11);
      column(26, 2);
      enemy('make', 30, 6);
      column(34, 3);
      enemy('bill', 38, 11);
      arc(41);
      row(46, 8, '?B?');
      row(46, 4, 'BBB');
      set(52, 8, 'h');
      column(62, 4);
      enemy('bill', 66, 11);
      enemy('make', 68, 5);
      arc(71);
      row(76, 8, 'BKB');
      stairsUp(82, 3); stairsDown(86, 3);
      enemy('bill', 90, 11); enemy('bill', 92, 11);
      set(95, 8, 'C');
      arc(101);
      row(106, 8, 'B?B');
      set(107, 4, 'M');
      enemy('make', 112, 5);

      // --- Steinshamn: the quay, barrels and the whaling station
      column(122, 2);
      enemy('krabbe', 126, 11);
      column(130, 3);
      enemy('krabbe', 134, 11);
      row(136, 8, '?B?');
      row(151, 8, 'ooo');
      row(158, 8, 'BBMBB');
      column(165, 2);
      enemy('krabbe', 168, 11);
      enemy('make', 172, 6);
      column(176, 3);
      row(180, 7, 'oooo');
      enemy('krabbe', 186, 11);

      var npcs = [
        { look: 'fisker', name: 'FISKAREN', x: 8, clue: 'MANN I FRAKK OG HATT', lines: [
          'NEI, SJÅ KVEN SOM ER HEIME ATT! ER DET IKKJE MAGNIO?',
          'SILDA STÅR SÅ TETT I ÅR AT DU KAN GÅ TØRRSKODD OVER SUNDET.',
          'FORRESTEN: EIN FRAMAND MANN I LANG FRAKK OG HATT KOM MED MORGONBÅTEN. HAN BAR PÅ EI TUNG RAUD KASSE.'
        ] },
        { look: 'kone', name: 'KONA VED KYRKJA', x: 58, clue: 'BARTEN VAR LIMT PÅ', lines: [
          'MAGNIO! SÅ STOR DU HAR VORTE.',
          'PASS DEG FOR MÅSANE. DEI STEL ALT SOM GLINSAR.',
          'MANNEN I FRAKKEN? HAN HADDE MØRKE BRILLER, OG BARTEN HANS SÅG UT TIL Å VERE LIMT PÅ.'
        ] },
        { look: 'bil', name: 'BILEN', x: 104, still: true, game: 'drive', lines: [
          'EIN RAUD STASJONSVOGN MED NØKKELEN I TENNINGA. KANSKJE EIN TUR RUNDT ØYA?'
        ] },
        { look: 'hvalfanger', name: 'HVALFANGAREN', x: 147, lines: [
          'HAN I FRAKKEN VILLE BLI MED HVALBÅTEN. EG SA NEI.',
          'SÅ GJEKK HAN UT PÅ ENDEN AV KAIA OG VINKA PÅ NOKO UTE PÅ SJØEN...',
          'VER FORSIKTIG DER UTE. DET HAR GÅTT EIN KJEMPEKVAL INNANFOR SKJERA HEILE DAGEN.'
        ] }
      ];

      var zones = [
        { from: 0, to: 118, theme: 'haroy' },
        { from: 118, to: W, theme: 'kai' }
      ];

      var decor = [
        { kind: 'sign', x: 1, text: 'HARØYA' },
        { kind: 'sildebat', x: 10 }, { kind: 'holme', x: 30 }, { kind: 'hvalhale', x: 45 },
        { kind: 'sildebat', x: 60 }, { kind: 'holme', x: 80 }, { kind: 'sildebat', x: 125 },
        { kind: 'hvalhale', x: 140 }, { kind: 'hvalbat', x: 150 }, { kind: 'holme', x: 170 },
        { kind: 'gull', x: 15, y: 4 }, { kind: 'gull', x: 50, y: 3 }, { kind: 'gull', x: 90, y: 4 },
        { kind: 'gull', x: 150, y: 3 }, { kind: 'gull', x: 185, y: 4 },

        { kind: 'lave', x: 22 }, { kind: 'kirke', x: 53 },
        { kind: 'hus2', x: 36 }, { kind: 'hus2', x: 91 }, { kind: 'hus2', x: 109 },
        { kind: 'hjell', x: 97 }, { kind: 'hjell', x: 113 },
        { kind: 'sau', x: 5 }, { kind: 'sau', x: 20 }, { kind: 'sau', x: 31 }, { kind: 'sau', x: 44 },
        { kind: 'sau', x: 67 }, { kind: 'sau', x: 79 }, { kind: 'sau', x: 96 },
        { kind: 'myrull', x: 3 }, { kind: 'myrull', x: 13 }, { kind: 'myrull', x: 29 },
        { kind: 'myrull', x: 45 }, { kind: 'myrull', x: 60 }, { kind: 'myrull', x: 75 },
        { kind: 'myrull', x: 93 }, { kind: 'myrull', x: 104 },

        { kind: 'sign', x: 116, text: 'STEINSHAMN' },
        { kind: 'sjobu', x: 121 }, { kind: 'sjobu', x: 128 }, { kind: 'hvalstasjon', x: 139 },
        { kind: 'tonne', x: 149 }, { kind: 'tonne', x: 150 },
        { kind: 'pullert', x: 125 }, { kind: 'pullert', x: 157 }, { kind: 'pullert', x: 170 },
        { kind: 'pullert', x: 185 }, { kind: 'pullert', x: 194 }
      ];
      var clouds = [[8, 3, 1], [19, 2, 1], [27, 3, 3], [36, 2, 2]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor, zones: zones,
        start: { x: 3, y: 11 }, sky: '#8cc0e8',
        ending: { type: 'whale', x: 192, whaleX: W * 16 - 182 }
      };
    }
  };
})();
