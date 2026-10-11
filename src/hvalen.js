// I hvalens buk: inside the whale that swallowed him at Harøya. Ribs for
// walls, stomach acid instead of water, and Jonas, who has lived here a while.
// The way out is the blowhole at the far end.
(function () {
  var SM = window.SM = window.SM || {};
  SM.levelDefs = SM.levelDefs || {};

  SM.levelDefs.hvalen = {
    name: 'I HVALENS BUK',
    subtitle: 'SLUKT MED HUD OG HÅR',
    map: { lon: 5.6, lat: 63.3 },
    build: function () {
      var W = 144, H = 14, grid = [], enemies = [];
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
      function enemy(type, x, y) { enemies.push({ type: type, x: x, y: y }); }

      ground(0, 30); ground(33, 55); ground(59, 80); ground(84, 110); ground(114, 143);

      set(18, 8, '?');
      row(22, 8, 'BMB');
      enemy('reke', 26, 11);
      enemy('manet', 31, 8);
      column(36, 2);
      enemy('reke', 40, 11); enemy('reke', 42, 11);
      column(46, 3);
      row(50, 7, 'ooo');
      enemy('manet', 57, 7);
      row(62, 8, '?C?');
      set(63, 4, 'K');
      enemy('reke', 66, 11);
      column(70, 4);
      enemy('reke', 74, 11);
      enemy('manet', 81, 6); enemy('manet', 83, 9);
      stairsUp(86, 3);
      row(92, 8, 'BMB');
      enemy('reke', 96, 11); enemy('reke', 98, 11);
      enemy('manet', 102, 6);
      enemy('manet', 112, 8);
      column(118, 2);
      row(122, 7, 'oooo');
      enemy('reke', 126, 11); enemy('reke', 130, 11);

      var npcs = [
        { look: 'jonas', name: 'JONAS', x: 11, clue: 'EN LØSBART', lines: [
          'VELKOMEN INN! EG ER JONAS. EG HAR BUDD HER EI STUND.',
          'EIN MANN I FRAKK REID PÅ RYGGEN TIL KVALEN I STAD. HAN SKULLE TIL TRONDHEIM, SA HAN.',
          'HAN MISTE DENNE HER DÅ HAN HOPPA AV. TA DU HAN.',
          'VIL DU UT, ER BLÅSEHOLET LENGST INNE TIL HØGRE. HOPP RETT INN I PUSTEN!'
        ] }
      ];

      var decor = [
        { kind: 'bal', x: 13 },
        { kind: 'stovel', x: 7 }, { kind: 'anker', x: 34 }, { kind: 'robat', x: 43 },
        { kind: 'tonne', x: 60 }, { kind: 'tonne', x: 61 }, { kind: 'stovel', x: 88 },
        { kind: 'anker', x: 104 }, { kind: 'robat', x: 120 },
        { kind: 'sign', x: 132, text: 'BLÅSEHOLET >' }
      ];

      return {
        width: W, height: H, grid: grid, enemies: enemies, npcs: npcs, decor: decor,
        zones: [{ from: 0, to: W, theme: 'hval' }],
        start: { x: 3, y: 11 }, sky: '#3a0e16', bubbles: true, music: 'hval',
        ending: { type: 'spout', x: 138 },
        clear: { title: 'UT AV HVALEN!', lines: ['TAKK, JONAS!', 'MANNEN I FRAKK HAR REIST TIL TRONDHEIM.'] }
      };
    }
  };
})();
