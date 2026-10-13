// The pictures in the prologue. Where the red toolbox stood in the
// workshop, there is now an old photo album. On its first page is Harøya,
// with a man in a coat at the edge of the picture, sneaking out of it, and
// as Magnio looks closer the picture grows until he is standing in it.
// Every level after that is a page in the album, and Lillesand, the last
// one, is today. (Gorm put the album there; he says so at the end.)
//
// draw(ctx, kind, t) draws one picture above the text of a story page;
// t counts frames since the page came up.
(function () {
  var SM = window.SM = window.SM || {};
  var A = SM.art, F = SM.font;

  var VW = 384, PH_W = 96, PH_H = 64;   // the photo of Harøya, at its own size

  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function disc(g, x, y, rx, ry, c) { A.disc(g, Math.round(x), Math.round(y), rx, ry, c); }

  // ---------------------------------------------------------------- the workshop
  // The wall above the workbench: planks, a pegboard with the shapes of
  // the tools on it, and the shelf the toolbox always stood on.
  function workshop(g, t) {
    for (var y = 0; y < 120; y += 8) rect(g, 0, y, VW, 8, (y / 8) % 2 ? '#5a3e28' : '#644530');
    for (y = 0; y < 120; y += 8) for (var x = (y * 3) % 50; x < VW; x += 50) rect(g, x, y, 1, 8, '#4a3220');
    var boards = [24, 284];
    for (var b = 0; b < boards.length; b++) {
      var bx = boards[b];
      rect(g, bx, 14, 76, 74, '#c8a878');
      for (y = 18; y < 86; y += 6) for (x = bx + 4; x < bx + 74; x += 6) rect(g, x, y, 1, 1, '#8a6a48');
    }
    // the tools hanging on the boards: hammer, saw, wrench, screwdriver, pliers
    rect(g, 34, 22, 3, 30, '#8a5a2a'); rect(g, 29, 20, 13, 6, '#5a5a62');
    for (var s = 0; s < 22; s++) rect(g, 52 + s, 26 + Math.round(s * 0.5), 1, 18 - Math.round(s * 0.5), '#a8a8b0');
    rect(g, 48, 24, 6, 14, '#a83a2a');
    rect(g, 300, 22, 3, 34, '#8a8a92'); disc(g, 301, 22, 4, 4, '#8a8a92'); rect(g, 299, 18, 5, 4, '#c8a878');
    rect(g, 320, 34, 2, 22, '#c8c8d0'); rect(g, 318, 22, 6, 12, '#e8c020');
    rect(g, 336, 26, 2, 24, '#5a5a62'); rect(g, 342, 26, 2, 24, '#5a5a62'); rect(g, 336, 24, 8, 4, '#3a3a42');
    // the shelf
    rect(g, 116, 100, 152, 5, '#9a7448'); rect(g, 116, 100, 152, 1, '#c09468'); rect(g, 116, 105, 152, 2, '#3a2818');
    rect(g, 130, 105, 4, 12, '#6a4a2a'); rect(g, 250, 105, 4, 12, '#6a4a2a');
  }

  function emptySpot(g, t) {
    workshop(g, t);
    // a dashed outline on the shelf, the shape of the toolbox that is gone
    var x0 = 164, y0 = 62, w = 56, h = 38, c = '#e8d8a8', k;
    for (k = 0; k < w; k += 4) { rect(g, x0 + k, y0, 2, 1, c); rect(g, x0 + k, y0 + h - 1, 2, 1, c); }
    for (k = 0; k < h; k += 4) { rect(g, x0, y0 + k, 1, 2, c); rect(g, x0 + w - 1, y0 + k, 1, 2, c); }
    for (k = 0; k < 20; k += 4) rect(g, x0 + 18 + k, y0 - 8, 2, 1, c);
    for (k = 0; k < 8; k += 4) { rect(g, x0 + 18, y0 - 8 + k, 1, 2, c); rect(g, x0 + 37, y0 - 8 + k, 1, 2, c); }
    F.outline(g, '?', 185, 64 + Math.round(Math.sin(t / 10) * 2), '#ffe060', 3, '#3a2818');
  }

  function albumShut(g, t) {
    workshop(g, t);
    // standing on the shelf, cover out, where the toolbox used to be
    var x0 = 166, y0 = 40, w = 52, h = 60;
    rect(g, x0 + 3, y0 + 2, w, h, '#2a1810');
    rect(g, x0, y0, w, h, '#6a2a1a');
    rect(g, x0, y0, 5, h, '#4a1a10');
    rect(g, x0 + 9, y0 + 6, w - 14, h - 12, '#7a3420');
    rect(g, x0 + 9, y0 + 6, w - 14, 1, '#d8a838'); rect(g, x0 + 9, y0 + h - 7, w - 14, 1, '#d8a838');
    rect(g, x0 + 9, y0 + 6, 1, h - 12, '#d8a838'); rect(g, x0 + w - 6, y0 + 6, 1, h - 12, '#d8a838');
    F.draw(g, 'MAGNE', x0 + 13, y0 + 26, '#f0c848');
    // a twinkle at the corner now and then, as if it wants to be opened
    var tw = t % 60;
    if (tw < 16) {
      var r = tw < 8 ? tw >> 1 : (16 - tw) >> 1, sx = x0 + w - 8, sy = y0 + 8;
      rect(g, sx - r, sy, r * 2 + 1, 1, '#fff8d0'); rect(g, sx, sy - r, 1, r * 2 + 1, '#fff8d0');
    }
  }

  // ---------------------------------------------------------------- the photo
  // Harøya: sky, sea, the island with its church, a red barn and the sheep.
  var photo = null;
  function haroya() {
    if (photo) return photo;
    photo = document.createElement('canvas');
    photo.width = PH_W; photo.height = PH_H;
    var g = photo.getContext('2d');
    for (var y = 0; y < 34; y++) rect(g, 0, y, PH_W, 1, y < 16 ? '#8ac0ec' : '#a8d4f4');
    rect(g, 0, 34, PH_W, 30, '#2a6a9a');
    for (var i = 0; i < 10; i++) rect(g, (i * 23) % PH_W, 38 + (i * 7) % 22, 5, 1, '#4a8ab8');
    disc(g, 18, 9, 7, 3, '#ffffff'); disc(g, 24, 8, 5, 3, '#ffffff'); disc(g, 70, 12, 6, 2, '#ffffff');
    // the island, green on top and dark peat at the shore
    disc(g, 44, 44, 40, 14, '#3a6a2a');
    disc(g, 44, 42, 38, 12, '#5a9a3a');
    rect(g, 4, 44, 80, 20, '#5a9a3a');
    rect(g, 0, 56, 90, 8, '#4a7a30');
    // the church on the hill: a white nave under a sloping dark roof, and the
    // tower in front with its spire
    for (var r = 0; r < 4; r++) rect(g, 40 - r, 20 + r, 12 + r * 2, 1, '#3a3a3e');
    rect(g, 37, 24, 18, 10, '#f4f4f0');
    rect(g, 49, 27, 2, 3, '#4a5a6a'); rect(g, 52, 27, 1, 3, '#4a5a6a');
    rect(g, 40, 14, 6, 20, '#f4f4f0');
    for (r = 0; r < 6; r++) rect(g, 43 - Math.floor(r / 2), 8 + r, 1 + Math.floor(r / 2) * 2, 1, '#2a2a2a');
    rect(g, 42, 18, 2, 3, '#4a5a6a');
    rect(g, 41, 28, 3, 6, '#5a3a2a');
    // a red barn and some sheep
    for (r = 0; r < 5; r++) rect(g, 21 - 2 - r * 1.5, 33 + r, 4 + r * 3, 1, '#5a2a1a');   // the roof, narrow at the ridge
    rect(g, 14, 38, 14, 8, '#b8302a'); rect(g, 19, 41, 4, 5, '#7a1a14');
    var sheep = [[34, 48], [52, 50], [60, 46], [26, 52]];
    for (i = 0; i < sheep.length; i++) { rect(g, sheep[i][0], sheep[i][1], 4, 2, '#f4f0e4'); rect(g, sheep[i][0] + 4, sheep[i][1], 1, 1, '#1a1a1a'); }
    return photo;
  }

  // The man in the coat, a few pixels high, slipping out of the picture.
  function coatMan(g, x, y) {
    rect(g, x, y, 6, 2, '#2a2a2a'); rect(g, x - 1, y + 2, 8, 1, '#2a2a2a');
    rect(g, x + 1, y + 3, 4, 3, '#f8c088');
    rect(g, x, y + 6, 6, 7, '#b08850'); rect(g, x + 2, y + 6, 1, 7, '#7a5a30');
    rect(g, x + 1, y + 13, 1, 2, '#2a2a2a'); rect(g, x + 4, y + 13, 1, 2, '#2a2a2a');
    rect(g, x - 3, y + 8, 4, 3, '#c8281c');                 // and the red toolbox
  }

  function framed(g, img, x, y, w, h) {
    rect(g, x - 4, y - 4, w + 8, h + 8, '#fbf8f0');
    g.drawImage(img, x, y, w, h);
    var c = '#2a2018';
    for (var k = 0; k < 6; k++) {
      rect(g, x - 4, y - 4 + k, 6 - k, 1, c); rect(g, x + w - 2 + k, y - 4 + k, 6 - k, 1, c);
      rect(g, x - 4, y + h + 3 - k, 6 - k, 1, c); rect(g, x + w - 2 + k, y + h + 3 - k, 6 - k, 1, c);
    }
  }

  function albumOpen(g, t) {
    rect(g, 0, 0, VW, 120, '#3a2818');
    rect(g, 36, 10, 312, 106, '#4a1a10');
    rect(g, 42, 12, 148, 100, '#f4ecd8'); rect(g, 194, 12, 148, 100, '#f0e8d0');
    rect(g, 188, 12, 8, 100, '#d8ccb0'); rect(g, 191, 12, 2, 100, '#b8a888');
    var px = 68, py = 26;
    framed(g, haroya(), px, py, PH_W, PH_H);
    // he walks out of the right-hand edge of the photo, toolbox and all
    g.save();
    g.beginPath(); g.rect(px, py, PH_W, PH_H); g.clip();
    coatMan(g, px + 78 + Math.min(30, Math.max(0, t - 40) * 0.25), py + 38);
    g.restore();
    F.draw(g, 'HARØYA', 228, 30, '#4a2a18');
    rect(g, 228, 39, 36, 1, '#8a6a4a');
    // later pages, glimpsed: the whale, and the wharves in Trondheim
    g.globalAlpha = 0.55;
    rect(g, 210, 54, 50, 36, '#fbf8f0');
    rect(g, 213, 57, 44, 14, '#a8c8e8'); rect(g, 213, 71, 44, 16, '#2a6a9a');
    // a whale, head to the left, spouting, with its flukes up behind
    disc(g, 230, 74, 12, 5, '#3a4a5a'); disc(g, 229, 77, 8, 2, '#8a9aa8');
    rect(g, 222, 73, 1, 1, '#0a0a10');
    rect(g, 241, 70, 3, 4, '#3a4a5a'); rect(g, 243, 66, 3, 5, '#3a4a5a'); rect(g, 243, 64, 4, 2, '#3a4a5a');
    for (var f = 0; f < 4; f++) { rect(g, 240 + f, 62 + f, 2, 1, '#3a4a5a'); rect(g, 249 - f, 62 + f, 2, 1, '#3a4a5a'); }
    rect(g, 222, 62, 2, 6, '#e8f4fc'); rect(g, 219, 61, 2, 1, '#e8f4fc'); rect(g, 225, 61, 2, 1, '#e8f4fc');
    rect(g, 218, 63, 1, 1, '#e8f4fc'); rect(g, 227, 63, 1, 1, '#e8f4fc');
    for (f = 0; f < 6; f++) rect(g, 215 + f * 7, 80 + (f % 2) * 3, 4, 1, '#4a8ab8');
    rect(g, 276, 58, 50, 36, '#fbf8f0'); rect(g, 279, 61, 44, 30, '#a8c4dc');
    var wh = ['#d8a040', '#a8382a', '#f0ece0', '#5a8a5a', '#c86a3a'];
    for (var i = 0; i < 5; i++) rect(g, 280 + i * 9, 70, 8, 16, wh[i]);
    rect(g, 279, 86, 44, 5, '#2a6a9a');
    g.globalAlpha = 1;
  }

  // Into the picture: it grows from its place in the album to fill the
  // whole screen, and then Magnio is standing in it.
  var ZOOM = 70;
  var big = null;
  function intoPhoto(g, t) {
    if (!big) { big = document.createElement('canvas'); big.width = PH_W; big.height = PH_H; }
    var bg = big.getContext('2d');
    bg.clearRect(0, 0, PH_W, PH_H);
    bg.drawImage(haroya(), 0, 0);
    if (t > ZOOM + 6) {
      var me = A.player.magnio.normal.small.stand.r;
      bg.drawImage(me, 52, 28);
    }
    var u = Math.min(1, t / ZOOM), e = u * u * (3 - 2 * u);
    var w = PH_W + (VW - PH_W) * e, h = w * PH_H / PH_W;
    var x = 68 + (0 - 68) * e, y = 26 + (216 - (VW * PH_H / PH_W) - 26) * e;   // ends with its foot at the bottom of the screen
    rect(g, 0, 0, VW, 216, '#3a2818');
    if (u < 1) framed(g, big, x, y, Math.round(w), Math.round(h));
    else g.drawImage(big, 0, Math.round(y), VW, Math.round(h));
    if (t > ZOOM && t < ZOOM + 14) {
      g.globalAlpha = 1 - (t - ZOOM) / 14;
      rect(g, 0, 0, VW, 216, '#ffffff');
      g.globalAlpha = 1;
    }
  }

  function skurk(g, t) {
    rect(g, 0, 0, VW, 120, '#0c1020');
    // sneaking off to the left, on his toes, with the toolbox under his arm
    var x = Math.round(250 - Math.min(150, t * 0.7)), hop = (t >> 3) & 1;
    var img = A.npc.skurk.l, top = 110 - img.height * 3 - hop * 2;
    g.drawImage(img, x, top, img.width * 3, img.height * 3);
    // the toolbox hangs from his near hand (columns 3-4, row 18 of the
    // picture, three times over), with his fingers round the handle
    var hx = x + 9, hy = top + 54;
    g.drawImage(A.item.kasse, hx - 12, hy - 6, 32, 32);
    rect(g, hx, hy, 6, 3, '#f8c088');
  }

  var SCENES = { tom: emptySpot, album: albumShut, side: albumOpen, inn: intoPhoto, skurk: skurk };
  // top: the picture fills the screen, so the text goes at the top, on a band
  SM.album = { draw: function (ctx, kind, t) { SCENES[kind](ctx, t); }, has: function (kind) { return !!SCENES[kind]; },
    top: function (kind) { return kind === 'inn'; } };
})();
