// Værnes airport, outside Trondheim. A terminal with suitcases on the loose,
// and three gates at the end: Moraira and Praha are side trips, Lillesand
// carries the story on. Press up or △ at a gate to fly there.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.varnes = {
    name: 'VÆRNES',
    subtitle: 'FLYPLASSEN',
    map: { lon: 11.4, lat: 63.2 },
    build: function () {
      var W = 128, H = 14, grid = [], enemies = [];
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

      ground(0, W - 1);

      column(22, 2);
      row(26, 8, '?B?');
      enemy('koffert', 34, 11); enemy('koffert', 36, 11);
      column(44, 3);
      row(50, 8, 'BMB');
      enemy('due', 56, 6);
      enemy('koffert', 60, 11); enemy('koffert', 62, 11);
      column(68, 2);
      stairsUp(72, 3); stairsDown(76, 3);
      row(73, 6, 'ooo');
      set(82, 8, 'C');
      enemy('koffert', 86, 11);

      var npcs = [
        { look: 'hvalfanger', name: 'SIKKERHETSVAKTEN', x: 14, clue: 'KASSA SKAL TIL LILLESAND', lines: [
          'MANNEN I FRAKK? HAN HADDE EN RØD VERKTØYKASSE I HÅNDBAGASJEN. DEN FIKK HAN IKKE TA MED.',
          'SÅ HAN SENDTE DEN SOM SPESIALBAGASJE TIL LILLESAND. SAMMEN MED TRE TONN GIPS.'
        ] },
        { look: 'student', name: 'BETJENTEN', x: 90, lines: [
          'VELKOMMEN TIL VÆRNES! GÅ TIL EN GATE OG TRYKK OPP FOR Å REISE.',
          'LILLESAND ER NESTE STOPP I SAKEN. MORAIRA OG PRAHA KAN DU BESØKE FØRST, OM DU HAR LYST.'
        ] }
      ];

      var decor = [
        { kind: 'tavle', x: 4 },
        { kind: 'benk', x: 10 }, { kind: 'plante', x: 18 }, { kind: 'benk', x: 30 }, { kind: 'plante', x: 40 },
        { kind: 'benk', x: 54 }, { kind: 'plante', x: 66 }, { kind: 'tavle', x: 84 }, { kind: 'plante', x: 94 },
        { kind: 'plante', x: 103 }, { kind: 'plante', x: 113 }
      ];

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'fly' }],
        start: { x: 3, y: 11 }, sky: '#e0e0dc',
        ending: { type: 'gates', gates: [
          { x: 96, to: 'moraira', label: 'MORAIRA' },
          { x: 106, to: 'praha', label: 'PRAHA' },
          { x: 116, to: 'lillesand', label: 'LILLESAND' }
        ] }
      };
    }
  };
})();
