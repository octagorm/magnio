// Lillesand, where he lives now. From the harbour, through the town, up to
// his house on Blåbæråsen, where the man in the coat is waiting. The finale
// (the boxing match, the statue and the party) lives in game.js.
//
// Tiles:  # ground   B wooden crate   ? coin box   M power-up box (chocolate, then cigar)
//         K crate with cognac   C crate full of coins   h hidden money bag
//         X granite block   [ ] { } two-wide column (fish crates, or a pine stump)   o coin
//
// Gaps in the ground are water. The look of the ground and the columns
// comes from the zone a tile is in.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.lillesand = {
    name: 'LILLESAND',
    subtitle: 'FRA BRYGGA TIL BLÅBÆRÅSEN',
    map: { lon: 8.38, lat: 58.25 },
    build: function () {
      var W = 212, H = 14, grid = [], enemies = [];
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
      function pillar(x, h) { for (var k = 0; k < h; k++) set(x, 11 - k, 'X'); }
      // y is the row the enemy stands in
      function enemy(type, x, y) { enemies.push({ type: type, x: x, y: y }); }

      ground(0, 68); ground(71, 85); ground(89, 150); ground(153, 211);

      // --- Havna: docks, fish crates, crabs and bills
      set(12, 8, '?');
      row(16, 8, 'BMB?B');
      set(18, 4, '?');
      enemy('bill', 22, 11);
      column(28, 2);
      row(32, 9, 'ooo');
      column(38, 3);
      enemy('krabbe', 42, 11);
      column(46, 4);
      row(50, 7, 'ooooo');
      enemy('bill', 51, 11); enemy('krabbe', 53, 11);
      column(57, 4);
      set(64, 8, 'h');
      set(68, 10, 'o'); set(69, 9, 'o'); set(70, 9, 'o'); set(71, 10, 'o');
      row(77, 8, 'BMB');
      row(80, 4, 'BBBBBBBB');
      enemy('bill', 81, 3); enemy('bill', 84, 3);
      set(86, 9, 'o'); set(87, 8, 'o'); set(88, 9, 'o');

      // --- Sentrum: cobbled streets and white houses
      row(91, 4, 'BBB?');
      set(94, 8, 'C');
      row(100, 8, 'BK');
      set(106, 8, '?'); set(109, 8, '?'); set(112, 8, '?'); set(109, 4, 'M');
      enemy('krabbe', 108, 11);
      enemy('bill', 115, 11); enemy('bill', 117, 11);
      set(118, 8, 'B');
      row(121, 4, 'BBB');
      enemy('bill', 124, 11); enemy('bill', 126, 11);
      row(128, 4, 'B??B');
      row(129, 8, 'BB');
      stairsUp(134, 4); stairsDown(140, 4);
      row(138, 7, 'oo');

      // --- Blåbæråsen: granite, heather, pines, and home
      stairsUp(147, 4);
      set(151, 6, 'o'); set(152, 6, 'o');
      stairsDown(153, 4);
      column(163, 2);
      row(168, 8, 'BB?B');
      enemy('flatt', 173, 11); enemy('flatt', 175, 11);
      column(179, 2);
      enemy('flatt', 177, 11);
      stairsUp(181, 8); pillar(189, 8);

      // The family. The kids call him Beste, and Tove Farmor.
      var npcs = [
        { look: 'tellef', name: 'TELLEF', x: 24, ball: true, clue: 'EN TUNG RØD KASSE', lines: [
          'HEI BESTE! SÅ DU AT JEG SCORA? JEG ER KAPTEIN SABELTANN, OG DU ER EN DINOSAUR!',
          'JEG SÅ EN MANN I FRAKK! HAN GIKK SOM EN T-REX MED EN TUNG RØD KASSE.'
        ] },
        { look: 'fride', name: 'FRIDE', x: 99, lines: [
          'BESTE! JEG HAR BEGYNT PÅ SKOLEN, VISSTE DU DET?',
          'VI SKAL HA FILMKVELD I KVELD MED FARMOR. DET BLIR EN FILM MED ENHJØRNINGER. DU KAN SITTE VED SIA AV MEG.',
          'MANNEN I FRAKK SA AT DET VAR EN HEMMELIGHED. JEG ER KJEMPEFLINK TE Å HOLDE HEMMELIGHEDER!'
        ] },
        { look: 'kafevert', name: 'KAFEVERTEN', x: 110, game: 'quiz', lines: [
          'VELKOMMEN TIL KAFEEN, MAGNE! I KVELD ER DET QUIZ: VIL DU BLI MAGNIONÆR?'
        ] },
        { look: 'kathinka', name: 'KATHINKA', x: 114, lines: [
          'HEI MAGNE! UNGENE HAR GLEDA SEG HELE UGA.',
          'IKKE SI NOE TE NOEN, MEN... NEI, GLEM DED. JEG HAR IKKE SAGT NOE!'
        ] },
        { look: 'aslak', name: 'ASLAK', x: 127, clue: 'NOE MED ET HELIKOPTER', lines: [
          'HEI, MAGNE! EN MANN I FRAKK BANKA PÅ HOS OSS I GÅR OG LÅNTE STIGEN.',
          'HAN SPURTE OM DET E LOV Å LANDE ET HELIKOPTER PÅ BLÅBÆRÅSEN. RAR TYPE, ALTSÅ.'
        ] },
        { look: 'asta', name: 'ASTA', x: 160, dance: true, lines: [
          'FINN WILLY! FINN WILLY! DANS MED MEG, BESTE!',
          'MANNEN I FRAKK DANSA OGSÅ. HAN VAR IKKE FLINK.'
        ] },
        // The man in the coat waits at home. He starts talking as soon as
        // Magnio comes close, and then it is time to box.
        { look: 'skurk', name: 'MANNEN I FRAKK', x: 193, auto: true, ends: 'box', lines: [
          'SÅ DU FANT MEG TIL SLUTT, MAGNIO!',
          'VERKTØYKASSA? DEN FÅR DU IKKE TILBAKE UTEN KAMP.',
          'OPP MED HANSKENE!'
        ] }
      ];

      var zones = [
        { from: 0, to: 90, theme: 'havn' },
        { from: 90, to: 146, theme: 'by' },
        { from: 146, to: W, theme: 'skog' }
      ];

      // Scenery. Things that stand on the ground are left out over water.
      var decor = [
        { kind: 'sign', x: 1, text: 'LILLESAND' },
        { kind: 'holme', x: 6 }, { kind: 'seilbat', x: 14 }, { kind: 'bat', x: 23 },
        { kind: 'fyr', x: 33 }, { kind: 'seilbat', x: 52 }, { kind: 'holme', x: 61 },
        { kind: 'bat', x: 74 }, { kind: 'holme', x: 83 },
        { kind: 'sjobu', x: 8 }, { kind: 'sjobu', x: 34 }, { kind: 'sjobu', x: 62 },
        { kind: 'pullert', x: 4 }, { kind: 'pullert', x: 20 }, { kind: 'pullert', x: 33 },
        { kind: 'pullert', x: 55 }, { kind: 'pullert', x: 66 }, { kind: 'pullert', x: 73 }, { kind: 'pullert', x: 80 },
        { kind: 'gull', x: 12, y: 4 }, { kind: 'gull', x: 30, y: 3 }, { kind: 'gull', x: 58, y: 5 },
        { kind: 'gull', x: 78, y: 3 }, { kind: 'gull', x: 104, y: 2 },

        { kind: 'hus3', x: 90 }, { kind: 'hus2', x: 96 }, { kind: 'kirke', x: 101 },
        { kind: 'kafe', x: 106 }, { kind: 'hus2', x: 111 }, { kind: 'hus3', x: 115 },
        { kind: 'hus1', x: 121 }, { kind: 'hus2', x: 126 }, { kind: 'hus1', x: 130 },
        { kind: 'stakitt', x: 91 }, { kind: 'stakitt', x: 97 }, { kind: 'stakitt', x: 107 },
        { kind: 'stakitt', x: 116 }, { kind: 'stakitt', x: 122 }, { kind: 'stakitt', x: 131 },
        { kind: 'lykt', x: 95 }, { kind: 'lykt', x: 105 }, { kind: 'lykt', x: 114 },
        { kind: 'lykt', x: 120 }, { kind: 'lykt', x: 133 },

        { kind: 'pineTall', x: 143 },
        { kind: 'svaberg', x: 156 }, { kind: 'sign', x: 157, text: 'BLÅBÆRÅSEN' }, { kind: 'pine', x: 158 }, { kind: 'bush2', x: 160 },
        { kind: 'pineSmall', x: 165 }, { kind: 'bush1', x: 167 }, { kind: 'svabergSmall', x: 170 },
        { kind: 'pineTall', x: 172 }, { kind: 'pine', x: 176 }, { kind: 'bush3', x: 182 },
        { kind: 'svaberg', x: 190 }, { kind: 'pine', x: 193 }, { kind: 'bush2', x: 195 },
        { kind: 'pineTall', x: 199 }, { kind: 'pineTall', x: 204 }, { kind: 'pineTall', x: 208 },
        { kind: 'svabergSmall', x: 199 }, { kind: 'hjem', x: 201 }
      ];
      var clouds = [[8, 3, 1], [19, 2, 1], [27, 3, 3], [36, 2, 2]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor, zones: zones,
        start: { x: 3, y: 11 }, sky: '#7fb8ee',
        ending: { type: 'finale', flagX: 198 }
      };
    }
  };
})();
