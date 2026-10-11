// Moraira on the Costa Blanca, where he and Tove rented out apartments.
// A side trip from Værnes: sand, palms, the turquoise sea and the Peñón on
// the horizon. The tenant at the end pays the rent.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.moraira = {
    name: 'MORAIRA',
    subtitle: 'SOL OG HUSLEIE',
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

      ground(0, 50); ground(54, 95); ground(99, 149);

      set(10, 8, '?');
      row(14, 8, 'BMB?');
      enemy('krabbe', 20, 11);
      column(26, 2);
      enemy('make', 30, 6);
      row(34, 8, '?K?');
      enemy('krabbe', 40, 11); enemy('krabbe', 44, 11);
      arc(51);
      enemy('manet', 52, 8);
      column(60, 3);
      row(66, 7, 'ooooo');
      enemy('krabbe', 70, 11);
      row(76, 8, 'B?C?B');
      enemy('make', 84, 5);
      column(88, 2);
      arc(96);
      enemy('manet', 97, 7);
      row(106, 8, '?M?');
      enemy('krabbe', 112, 11); enemy('krabbe', 114, 11);
      column(120, 3);

      var npcs = [
        { look: 'kone', name: 'SENORA LOPEZ', x: 46, lines: [
          'HOLA, MAGNE! APPELSINENE ER MODNE I ÅR.',
          'EN MANN I FRAKK HER I VARMEN? NEI, DET HAR JEG IKKE SETT. HAN MÅTTE I SÅ FALL HA SVETTET!'
        ] },
        { look: 'student', name: 'LEIETAKEREN', x: 132, ends: true, pays: 50, clue: 'TEGNING AV EN HVAL MED RYTTER', lines: [
          'HOLA, SENOR MAGNE! LEILIGHETEN ER HELT FANTASTISK.',
          'HER ER HUSLEIEN. MUCHAS GRACIAS!',
          'FORRESTEN: EN MANN I FRAKK SENDTE ET POSTKORT HIT. DET VAR EN TEGNING AV EN HVAL MED EN RYTTER PÅ.'
        ] }
      ];

      var decor = [
        { kind: 'sign', x: 1, text: 'MORAIRA' },
        { kind: 'palme', x: 4 }, { kind: 'parasoll', x: 8 }, { kind: 'villa', x: 12 }, { kind: 'palmeHoy', x: 18 },
        { kind: 'parasoll', x: 24 }, { kind: 'villa', x: 30 }, { kind: 'palme', x: 36 }, { kind: 'parasoll', x: 42 },
        { kind: 'palmeHoy', x: 56 }, { kind: 'villa', x: 62 }, { kind: 'palme', x: 68 }, { kind: 'parasoll', x: 74 },
        { kind: 'villa', x: 80 }, { kind: 'palme', x: 90 },
        { kind: 'palmeHoy', x: 100 }, { kind: 'parasoll', x: 104 }, { kind: 'villa', x: 108 }, { kind: 'palme', x: 116 },
        { kind: 'villa', x: 124 }, { kind: 'leilighet', x: 135 }, { kind: 'palmeHoy', x: 141 },
        { kind: 'seilbat', x: 20 }, { kind: 'bat', x: 70 }, { kind: 'seilbat', x: 115 },
        { kind: 'gull', x: 25, y: 3 }, { kind: 'gull', x: 85, y: 4 }
      ];
      var clouds = [[12, 2, 1], [40, 3, 2]];
      for (var b = 0; b < W; b += 48) {
        for (var i = 0; i < clouds.length; i++) {
          if (b + clouds[i][0] < W) decor.push({ kind: 'cloud' + clouds[i][2], x: b + clouds[i][0], y: clouds[i][1] });
        }
      }

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'spania' }],
        start: { x: 3, y: 11 }, sky: '#5ab0f0',
        ending: { type: 'talk' },
        clear: { title: 'MORAIRA', lines: ['SOL, APPELSINER OG HUSLEIE.', 'NÅ GÅR TUREN HJEM TIL LILLESAND.'] }
      };
    }
  };
})();
