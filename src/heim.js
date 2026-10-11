// Heim, the cabin two hours west of Trondheim, where he and Tove fished and
// drove the boat. Two stretches of fjord are crossed on a sjekte that goes
// back and forth on its own; mackerel jump out of the water on the way.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.heim = {
    name: 'HEIM',
    subtitle: 'HYTTA, SJEKTA OG MAKRELLEN',
    map: { lon: 9.07, lat: 63.42 },
    build: function () {
      var W = 172, H = 14, grid = [], enemies = [];
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

      ground(0, 40); ground(65, 110); ground(131, 171);

      // --- The cabin
      set(14, 8, '?');
      row(18, 8, 'BMB');
      enemy('bill', 24, 11);
      column(28, 2);
      enemy('krabbe', 34, 11);

      // --- First crossing: wait for the boat at the end of the jetty
      enemy('fisk', 46, 0); enemy('fisk', 51, 0); enemy('fisk', 57, 0);
      enemy('make', 52, 4);
      row(48, 6, 'ooo'); row(56, 6, 'ooo');

      // --- The headland
      row(70, 8, '?K?');
      enemy('krabbe', 74, 11);
      column(80, 3);
      row(86, 8, 'BB?BB');
      enemy('bill', 92, 11); enemy('bill', 94, 11);
      set(98, 8, 'h');
      column(102, 2);

      // --- Second crossing
      enemy('fisk', 115, 0); enemy('fisk', 120, 0); enemy('fisk', 125, 0);
      enemy('make', 121, 5);
      row(117, 6, 'oooo');

      // --- The road to the airport bus
      row(140, 8, '?C?');
      enemy('krabbe', 146, 11);
      column(150, 3);
      enemy('bill', 156, 11);

      var npcs = [
        { look: 'tove', name: 'TOVE', x: 9, lines: [
          'SKAL VI TA SJEKTA UT OG FISKE, MAGNE?',
          'BÅTEN VENTER PÅ ENDEN AV BRYGGA. OG PASS DEG FOR MAKRELLEN, DEN HOPPER HØYT I DAG.'
        ] },
        { look: 'fisker', name: 'NABOEN', x: 136, clue: 'HAN SKAL FLY FRA VÆRNES', lines: [
          'HEI, MAGNE! FIKK DU NOE?',
          'EN MANN I FRAKK LÅNTE TELEFONEN MIN. HAN BESTILTE FLYBILLETT FRA VÆRNES.'
        ] },
        { look: 'hvalfanger', name: 'SJÅFØREN', x: 164, ends: true, lines: [
          'FLYBUSSEN TIL VÆRNES GÅR OM ET LITE ØYEBLIKK. HOPP PÅ!',
          'MANNEN I FRAKK? HAN TOK FORRIGE BUSS, MED EN DIGER PAKKE PÅ FANGET.'
        ] }
      ];

      var decor = [
        { kind: 'sign', x: 1, text: 'HEIM' },
        { kind: 'hytte', x: 3 }, { kind: 'pine', x: 0 }, { kind: 'pineTall', x: 12 },
        { kind: 'sjobu', x: 30 }, { kind: 'pullert', x: 38 }, { kind: 'pullert', x: 66 },
        { kind: 'pullert', x: 108 }, { kind: 'pullert', x: 132 },
        { kind: 'holme', x: 20 }, { kind: 'sildebat', x: 48 }, { kind: 'holme', x: 70 }, { kind: 'fyr', x: 100 },
        { kind: 'seilbat', x: 130 }, { kind: 'holme', x: 150 },
        { kind: 'svaberg', x: 76 }, { kind: 'pine', x: 84 }, { kind: 'bush2', x: 96 }, { kind: 'pineSmall', x: 105 },
        { kind: 'svabergSmall', x: 142 }, { kind: 'pine', x: 153 }, { kind: 'bush1', x: 159 },
        { kind: 'sign', x: 166, text: 'FLYBUSS' },
        { kind: 'gull', x: 30, y: 3 }, { kind: 'gull', x: 90, y: 4 }, { kind: 'gull', x: 140, y: 3 }
      ];
      var clouds = [[8, 3, 2], [22, 2, 1], [33, 3, 3], [44, 2, 1]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'heim' }],
        boats: [{ from: 41, to: 61 }, { from: 111, to: 127 }],
        start: { x: 3, y: 11 }, sky: '#9cc4e4',
        ending: { type: 'talk' },
        clear: { title: 'HYTTELIV PÅ HEIM', lines: ['MAKRELLEN BET, OG SJEKTA GIKK.', 'NESTE STOPP: VÆRNES.'] }
      };
    }
  };
})();
