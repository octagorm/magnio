// Heim, the cabin two hours west of Trondheim, where he and Tove fished and
// drove the boat. It starts at the car park. Tove walks along behind Magnio,
// past the pines (which the boxing gloves can fell) and the cabin, where the
// Catan box stands on a table by the door. Then she runs on ahead to the end
// of the jetty and fishes. Her catch lands on the table behind her, where he
// can gut it.
// He takes the sjekte across the fjord; mackerel jump out of the water on the way.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.heim = {
    name: 'HEIM',
    subtitle: 'HYTTA, SJEKTA OG MAKRELLEN',
    map: { lon: 9.07, lat: 63.42 },
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

      ground(0, 48); ground(73, 149);

      // --- The car park, the pines and the cabin
      set(13, 8, '?');
      row(17, 8, 'BMB');
      enemy('bill', 36, 11);
      enemy('krabbe', 40, 11);

      // --- The crossing: wait for the boat at the end of the jetty
      enemy('fisk', 54, 0); enemy('fisk', 59, 0); enemy('fisk', 65, 0);
      enemy('make', 60, 4);
      row(56, 6, 'ooo'); row(64, 6, 'ooo');

      // --- The headland
      row(78, 8, '?M?');   // the gloves again, if the fjord took them
      enemy('krabbe', 82, 11);
      column(88, 3);
      row(94, 8, 'BBMBB');
      enemy('bill', 100, 11); enemy('bill', 102, 11);
      set(106, 8, 'h');
      column(110, 2);

      // --- The road to the airport bus
      row(118, 8, '?C?');
      enemy('krabbe', 124, 11);
      column(128, 3);
      enemy('bill', 134, 11);

      var npcs = [
        { look: 'tove', name: 'TOVE', x: 8, follow: 47, runAt: 30, lines: [
          'KOM, MAGNE! ME GÅR FORBI HYTTA OG NED TE BRYGGA.',
          'EG HAR LYST TE Å FISKE I DAG. EG HÅBE DET BIDE HYSE!'
        ], fishLines: [
          'EG BLI HER OG FISKE. TA DU SJEKTA, SÅ SEES ME ETTERPÅ!',
          'DET BIDE GODT I DAG! HÅBER DET BLIR HYSE TE MIDDAG.'
        ] },
        { look: 'sloyebord', name: 'SLØYEBORDET', x: 44.6, still: true, game: 'sloye', lines: [
          'ET BORD TIL Å SLØYE FISK PÅ. NÅR TOVE FÅR NOE, HAVNER DET HER.'
        ] },
        { look: 'catan', name: 'CATAN', x: 29, still: true, game: 'catan', lines: [
          'ET SPILL CATAN LIGGER KLART PÅ BORDET UTENFOR HYTTA.'
        ] },
        { look: 'fisker', name: 'NABOEN', x: 114, clue: 'HAN SKAL FLY FRA VÆRNES', lines: [
          'HEI, MAGNE! FIKK DU NOE?',
          'EN MANN I FRAKK LÅNTE TELEFONEN MIN. HAN BESTILTE FLYBILLETT FRA VÆRNES.'
        ] },
        { look: 'hvalfanger', name: 'SJÅFØREN', x: 142, ends: true, lines: [
          'FLYBUSSEN TIL VÆRNES GÅR OM ET LITE ØYEBLIKK. HOPP PÅ!',
          'MANNEN I FRAKK? HAN TOK FORRIGE BUSS, MED EN DIGER PAKKE PÅ FANGET.'
        ] }
      ];

      // pines that the boxing gloves can fell
      var trees = [
        { x: 10, kind: 'pine' }, { x: 15, kind: 'pineTall' }, { x: 20, kind: 'pine' },
        // a whole little forest between the cabin and the sea
        { x: 31, kind: 'pine' }, { x: 33, kind: 'pineTall' }, { x: 35, kind: 'pine' },
        { x: 39, kind: 'pineSmall' }, { x: 41, kind: 'pineTall' }, { x: 43, kind: 'pine' }, { x: 45, kind: 'pineSmall' },
        // and more out on the headland
        { x: 77, kind: 'pineSmall' }, { x: 85, kind: 'pine' }, { x: 91, kind: 'pineTall' }, { x: 98, kind: 'pine' },
        { x: 104, kind: 'pineSmall' }, { x: 116, kind: 'pine' }, { x: 122, kind: 'pineTall' }, { x: 131, kind: 'pine' },
        { x: 137, kind: 'pineSmall' }
      ];

      var decor = [
        { kind: 'sign', x: 0, text: 'HEIM' }, { kind: 'bil', x: 3 },
        { kind: 'hytte', x: 25 }, { kind: 'pullert', x: 46 }, { kind: 'pullert', x: 74 },
        { kind: 'holme', x: 20 }, { kind: 'holme', x: 70 }, { kind: 'seilbat', x: 98 }, { kind: 'fyr', x: 108 },
        { kind: 'holme', x: 138 },
        { kind: 'svaberg', x: 79 }, { kind: 'bush2', x: 96 }, { kind: 'svabergSmall', x: 120 }, { kind: 'bush1', x: 137 },
        { kind: 'sign', x: 144, text: 'FLYBUSS' },
        { kind: 'gull', x: 30, y: 3 }, { kind: 'gull', x: 90, y: 4 }, { kind: 'gull', x: 130, y: 3 }
      ];
      var clouds = [[8, 3, 2], [22, 2, 1], [33, 3, 3], [44, 2, 1]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, trees: trees, decor: decor,
        zones: [{ from: 0, to: W, theme: 'heim' }],
        boats: [{ from: 49, to: 69 }],
        start: { x: 6, y: 11 }, sky: '#9cc4e4',
        ending: { type: 'talk' },
        clear: { title: 'HYTTELIV PÅ HEIM', lines: ['MAKRELLEN BET, OG SJEKTA GIKK.', 'NESTE STOPP: VÆRNES.'] }
      };
    }
  };
})();
