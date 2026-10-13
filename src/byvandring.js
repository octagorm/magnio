// Praha på kryss og tvers. A map of the middle of Praha seen from above,
// four times the size of the screen, where Magnio and Tove walk wherever
// they like along the streets, as tiny figures a few pixels high. It starts
// with a tram ride, and trams, cars, boats and tourists go about their
// business all around. Walking past the sights, the two of them talk about
// them, and there are shops on the way: socks for the sons, blue Bohemian
// glass, a marionette and a garnet brooch are on Tove's list. □ takes the
// tram home.
//
// The map is drawn once, when the game starts it: first as a grid of zones
// (house, street, square, river, park...), which also says where one can
// walk, then coloured pixel by pixel, and then the sights are drawn on top.
// North is up. The river Vltava runs up the middle and turns east at the top.
(function () {
  var SM = window.SM = window.SM || {};
  var F = SM.font, AU = SM.audio, A = SM.art;

  var VW = 384, VH = 216, X = '✕';
  var MW = 960, MH = 600;
  var SPEED = 0.9;

  // ---------------------------------------------------------------- zones
  var BLD = 0, STREET = 1, SQUARE = 2, WATER = 3, PARK = 4, PATH = 5, BRIDGE = 6, KARLUV = 7, RAIL = 8,
    CASTLE = 9, CEM = 10, WALLZ = 11, TRACK = 12, PARAPET = 13;
  var WALK = [];
  [STREET, SQUARE, PARK, PATH, BRIDGE, KARLUV, RAIL].forEach(function (z) { WALK[z] = true; });

  // The tram lines, as points along the middle of the street.
  var TRAMS = [
    // over the castle hill, down through Malá Strana, over Most Legií and along Národní
    [[290, 128], [360, 128], [382, 142], [372, 154], [394, 164], [412, 182], [425, 194], [410, 208], [392, 226], [384, 248],
      [390, 300], [402, 345], [414, 384], [430, 386], [552, 386], [600, 370], [655, 356], [660, 410], [664, 480], [668, 600]],
    // along the river on the Old Town side, and east under Letná
    [[568, 610], [564, 540], [556, 505], [556, 440], [556, 386], [557, 330], [556, 268], [555, 205], [560, 152], [588, 134],
      [640, 131], [720, 131], [820, 127], [960, 123]],
    // over Štefánikův most and down Revoluční
    [[815, 0], [815, 106], [805, 180], [808, 246], [830, 262], [880, 290], [960, 300]]
  ];
  var STOPS = [
    [[300, 128], [420, 190], [386, 238], [412, 378], [565, 386], [640, 361], [660, 430]],
    [[556, 395], [556, 262], [555, 205], [588, 134], [720, 131]],
    [[810, 180], [808, 246]]
  ];
  var CARS = [
    [[460, 610], [452, 500], [446, 440], [444, 400], [430, 388]],
    [[412, 252], [430, 240], [440, 215], [447, 200], [552, 200]],
    [[462, 500], [556, 500], [600, 492], [650, 480], [700, 470], [812, 478]],
    [[760, 610], [800, 560], [900, 524], [970, 524]],
    [[592, 44], [592, 126], [598, 126], [608, 160], [618, 196]],
    [[815, 0], [815, 106], [805, 180], [808, 246], [830, 262], [880, 290], [960, 300]],
    [[425, 194], [430, 182], [448, 148], [466, 108], [486, 80], [512, 60], [556, 44], [640, 36], [740, 38], [840, 34], [960, 27]]
  ];
  var RIVER = [[518, 610, 44], [512, 520, 42], [500, 450, 46], [498, 386, 48], [497, 320, 50], [497, 262, 50],
    [495, 200, 48], [500, 150, 46], [520, 112, 42], [560, 90, 40], [640, 80, 40], [740, 82, 40], [840, 78, 40], [970, 72, 40]];
  var FUNICULAR = [[418, 410], [340, 385], [254, 346]];

  // Where something gets said, once, when one walks past. r is how near.
  var SIGHTS = [
    { x: 470, y: 262, r: 16, lines: [['tove', 'SÅ MANGE FOLK PÅ BROA!'], ['me', 'HER STO MANNEN I FRAKK OG MÅLTE STATUENE.']] },
    { x: 506, y: 262, r: 6, lines: [['tove', 'KLAPP PÅ HUNDEN, MAGNE. DET GIR LYKKE!'], ['me', 'DEN ER HELT BLANK AV ALL KLAPPINGA.']] },
    { x: 612, y: 244, r: 14, lines: [['tove', 'OM LITT SLÅR KLOKKA, OG SÅ KOMME APOSTLENE UT.'], ['me', 'DEN HAR GÅTT SIDEN 1410. BEDRE ENN KLOKKA MI.']] },
    { x: 664, y: 222, r: 14, lines: [['me', 'TÝNKIRKEN. DET SER UT SOM ET SLOTT I EN DISNEYFILM.'], ['tove', 'DET E OMVENDT, MAGNE. DISNEY HAR LÅNT FRA PRAHA.']] },
    { x: 636, y: 226, r: 10, lines: [['me', 'JAN HUS. HAN STO PÅ SITT.']] },
    { x: 318, y: 186, r: 24, lines: [['tove', 'SLOTTET E SÅ STORT! DET SKAL VÆRE VERDENS STØRSTE BORG.'], ['me', 'OG VAKTENE STÅR HELT STILLE.']] },
    { x: 222, y: 340, r: 14, lines: [['tove', 'DET E JO ET LITE EIFFELTÅRN!'], ['me', 'I GÅR IKKE OPP ALLE DE TRAPPENE.']] },
    { x: 566, y: 502, r: 14, lines: [['me', 'DET HUSET HAR DRUKKET FOR MYE PILSNER.'], ['tove', 'DET E DET DANSENDE HUSET, MAGNE. FRED OG GINGER!']] },
    { x: 574, y: 392, r: 14, lines: [['tove', 'SE PÅ GULLTAKET!'], ['me', 'NASJONALTEATERET. FOLK SAMLET INN PENGER TIL DET TO GANGER.']] },
    { x: 824, y: 470, r: 16, lines: [['me', 'VÁCLAV PÅ HESTEN.'], ['tove', 'EN RYTTERSTATUE. DET HADDE VÆRT NOE FOR DEG, MAGNE.'], ['me', 'PÅ EN HVAL, KANSKJE.']] },
    { x: 762, y: 250, r: 12, lines: [['me', 'KRUTTÅRNET. HER HADDE DE KRUTTET.'], ['tove', 'DA SKA DU IKKE RØYKE SIGAR HER.']] },
    { x: 409, y: 285, r: 9, lines: [['tove', 'SÅ MANGE FARGER!'], ['me', 'ALL YOU NEED IS LOVE. OG EN VERKTØYKASSE.']] },
    { x: 600, y: 180, r: 12, lines: [['tove', 'DEN GAMLE SYNAGOGEN. DEN E OVER SJU HUNDRE ÅR.']] },
    { x: 578, y: 183, r: 10, lines: [['tove', 'DEN GAMLE KIRKEGÅRDEN. SÅ TETT DE STÅR, STEINENE.']] },
    { x: 566, y: 42, r: 16, lines: [['me', 'DER STO STALIN FØR. NÅ STÅR DET EN METRONOM.'], ['tove', 'DET VAR BEDRE.']] },
    { x: 168, y: 214, r: 14, lines: [['me', 'STRAHOV-KLOSTERET. MUNKENE BRYGGER ØL.'], ['tove', 'SELVSAGT GJØR DE DET.']] },
    { x: 436, y: 320, r: 12, lines: [['tove', 'SE, SVANENE!']] },
    { x: 424, y: 300, r: 8, lines: [['me', 'DJEVELBEKKEN. VANNHJULET GÅR FORTSATT.']] },
    { x: 366, y: 250, r: 14, lines: [['tove', 'SANKT NIKOLAS-KIRKEN. FOR EN GRØNN KUPPEL!']] },
    { x: 788, y: 250, r: 12, lines: [['tove', 'OBECNÍ DŮM. SÅ FINT! DET E JUGEND.']] },
    { x: 568, y: 206, r: 10, lines: [['me', 'RUDOLFINUM. HER SPILLER DE KONSERT.']] },
    { x: 536, y: 434, r: 10, lines: [['tove', 'SLAVISK ØY. HER DANSET DE VALS I GAMLE DAGER.']] }
  ];

  // The shops. list: on Tove's shopping list. Prices are in kroner.
  var SHOPS = [
    { id: 'sokker', x: 650, y: 289, name: 'SOKKER TIL SØNNENE', price: 6, list: true, icon: 'sock',
      lines: [['tove', 'SOKKER TE GUTTENE! DET E ALLTID LURT.'], ['me', 'TO PAR TIL HVER. DE BLIR GLADE.']] },
    { id: 'glass', x: 584, y: 258, name: 'BLÅ GLASSTING', price: 12, list: true, icon: 'glass',
      lines: [['tove', 'SE SÅ BLÅTT! DET MÅ ME HA.'], ['me', 'I BÆRER. FORSIKTIG.']] },
    { id: 'marionett', x: 336, y: 222, name: 'MARIONETT', price: 8, list: true, icon: 'puppet',
      lines: [['me', 'EN MARIONETT AV EN MANN I FRAKK?! HM.'], ['tove', 'DEN E JO HEILT LIK HAN SOM TOK VERKTØYKASSA DI!']] },
    { id: 'granat', x: 714, y: 237, name: 'GRANATSMYKKE', price: 15, list: true, icon: 'ring',
      lines: [['me', 'ET GRANATSMYKKE. TIL DEG, TOVE.'], ['tove', 'Å, MAGNE! DU E SÅ FIN.']] },
    { id: 'trdelnik', x: 628, y: 238, name: 'TRDELNÍK', price: 3, icon: 'cake',
      lines: [['me', 'SKORSTEINSKAKE MED IS!'], ['tove', 'DET E BARE FOR TURISTER, MAGNE.'], ['me', 'I ER TURIST.']],
      again: [[['tove', 'EN TIL? DU BLIR JO MÆTT.']], [['me', 'DEN FORRIGE VAR SÅ LITEN.']], [['tove', 'DU E HEILT UMULIG, MAGNE.']],
        [['me', 'NAM.']]] },
    { id: 'ol', x: 612, y: 428, name: 'EN HALVLITER PÅ U FLEKŮ', price: 3, icon: 'beer',
      lines: [['me', 'MØRKT ØL. DE HAR BRYGGET HER SIDEN 1499.'], ['tove', 'BARE EN, MAGNE.']],
      again: [[['tove', 'BARE EN, SA EG.']], [['me', 'SKÅL!'], ['tove', 'MAGNE...']], [['me', 'PRAHA ER EN FIN BY. EN VELDIG, VELDIG FIN BY.']],
        [['tove', 'NÅ E DET NOK, MAGNE. ME SKA FINNE VEIEN HJEM OGSÅ.']], [['me', 'HIKK!']]] }
  ];

  var SIGN = 16;      // how far above its shop a sign floats
  var Z = null, map = null, built = false;
  var S = null, env = null;

  // ---------------------------------------------------------------- painting zones
  function put(x, y, z, only) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return;
    var i = y * MW + x;
    if (only && !only[Z[i]]) return;
    Z[i] = z;
  }
  function stamp(cx, cy, r, z, only) {
    for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) put(x, y, z, only);
      }
    }
  }
  function line(pts, w, z, only) {
    var r = Math.max(0.75, w / 2);
    for (var i = 0; i + 1 < pts.length; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / Math.max(0.5, r / 6)));
      for (var k = 0; k <= n; k++) stamp(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, r, z, only);
    }
  }
  function poly(pts, z, only) {
    var minY = Infinity, maxY = -Infinity, i;
    for (i = 0; i < pts.length; i++) { minY = Math.min(minY, pts[i][1]); maxY = Math.max(maxY, pts[i][1]); }
    for (var y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      var yc = y + 0.5, xs = [];
      for (i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort(function (p, q) { return p - q; });
      for (var k = 0; k + 1 < xs.length; k += 2) for (var x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(x, y, z, only);
    }
  }
  function box(x, y, w, h, z, only) { for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) put(i, j, z, only); }
  function zone(x, y) { x = Math.round(x); y = Math.round(y); return x < 0 || y < 0 || x >= MW || y >= MH ? BLD : Z[y * MW + x]; }
  function walkable(x, y) { return !!WALK[zone(x, y)]; }

  var NOT_WATER = {}; NOT_WATER[BLD] = NOT_WATER[PARK] = NOT_WATER[STREET] = NOT_WATER[SQUARE] = NOT_WATER[PATH] = NOT_WATER[CASTLE] = true;
  var ONLY_LAND = {}; ONLY_LAND[BLD] = ONLY_LAND[PARK] = ONLY_LAND[CASTLE] = ONLY_LAND[PATH] = ONLY_LAND[STREET] = ONLY_LAND[SQUARE] = ONLY_LAND[CEM] = true;
  var ONLY_PARK = {}; ONLY_PARK[PARK] = true;
  var ONLY_GREEN = {}; ONLY_GREEN[PARK] = ONLY_GREEN[BLD] = ONLY_GREEN[CASTLE] = true;   // where a path may go: not over streets
  var ONLY_BLD = {}; ONLY_BLD[BLD] = true;

  function lay() {
    Z = new Uint8Array(MW * MH);
    var i;
    // --- green: Petřín, Letná, the castle gardens, Kampa, Karlovo náměstí
    poly([[150, 226], [230, 232], [300, 252], [350, 280], [378, 330], [398, 372], [410, 404], [426, 452], [434, 610], [176, 610], [160, 560],
      [140, 520], [148, 470], [132, 420], [140, 360], [126, 300], [138, 260]], PARK);
    poly([[230, -5], [970, -5], [970, 34], [840, 38], [740, 42], [640, 40], [560, 48], [520, 70], [478, 108], [462, 150], [436, 182], [404, 152], [372, 126],
      [236, 124], [220, 100], [250, 70], [236, 30]], PARK);
    box(236, 126, 136, 12, PARK);                                    // the Royal Garden
    poly([[425, 236], [452, 236], [452, 366], [425, 366]], PARK);    // Kampa
    poly([[668, 420], [704, 414], [714, 520], [676, 526]], PARK);    // Karlovo náměstí
    poly([[130, 160], [250, 150], [250, 196], [210, 222], [140, 226]], PARK); // above Strahov
    // --- the river, the devil's stream round Kampa, and the islands
    for (i = 0; i + 1 < RIVER.length; i++) {
      var a = RIVER[i], b = RIVER[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 2);
      for (var k = 0; k <= n; k++) { var u = k / n; stamp(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, WATER); }
    }
    line([[450, 370], [426, 356], [421, 300], [423, 250], [450, 232]], 3, WATER);
    poly([[468, 356], [480, 352], [486, 380], [484, 420], [472, 424], [466, 390]], PARK); // Střelecký ostrov
    poly([[526, 408], [540, 404], [542, 456], [530, 460]], PARK);    // Slovanský ostrov
    // --- the castle and the cemetery, which one cannot walk into
    poly([[248, 140], [372, 136], [380, 168], [374, 192], [262, 194], [250, 182]], CASTLE);
    poly([[566, 150], [590, 148], [590, 176], [568, 178]], CEM);
    // --- squares
    poly([[612, 196], [652, 194], [668, 206], [668, 232], [656, 248], [620, 248], [608, 234], [606, 210]], SQUARE); // Staroměstské náměstí
    poly([[240, 170], [272, 168], [276, 198], [244, 202]], SQUARE);  // Hradčanské náměstí
    poly([[352, 222], [392, 222], [394, 252], [352, 254]], SQUARE);  // Malostranské náměstí
    box(596, 232, 18, 16, SQUARE);                                   // Malé náměstí
    box(556, 194, 18, 14, SQUARE);                                   // náměstí Jana Palacha
    box(584, 304, 22, 18, SQUARE);                                   // Betlémské náměstí
    box(628, 282, 54, 12, SQUARE);                                   // Havelské tržiště
    box(768, 238, 32, 26, SQUARE);                                   // náměstí Republiky
    box(402, 276, 17, 17, SQUARE);                                   // Velkopřevorské náměstí
    line([[703, 338], [838, 466]], 24, SQUARE);                      // Václavské náměstí
    line([[728, 364], [760, 394]], 3, PARK); line([[776, 408], [812, 442]], 3, PARK);
    // --- streets
    var streets = [
      [4, [[354, 238], [320, 226], [296, 212], [285, 200], [270, 196]]],                             // Nerudova and Ke Hradu
      [4, [[354, 250], [330, 252], [310, 254], [296, 256]]],                                          // Vlašská
      [5, [[384, 246], [402, 262]]],                                                                  // Mostecká
      [4, [[404, 266], [408, 280]]], [3, [[392, 300], [404, 290]]],                                   // Lázeňská
      [4, [[408, 258], [430, 240], [440, 215], [447, 200]]],                                          // U Lužického semináře
      [5, [[240, 186], [200, 190], [170, 196], [174, 222]]],                                          // Loretánská, Pohořelec
      [4, [[256, 172], [258, 140], [290, 130]]],
      [6, [[414, 384], [425, 450], [434, 610]]],                                                      // Újezd
      [6, [[430, 388], [444, 400], [446, 440], [452, 500], [460, 610]]],                              // Janáčkovo nábřeží
      [5, [[425, 194], [430, 182], [448, 148], [466, 108], [486, 80], [512, 60], [556, 44], [640, 36], [740, 38], [840, 34], [970, 27]]], // under Letná
      [4, [[553, 262], [565, 258], [572, 262], [580, 255], [588, 258], [596, 248], [604, 240]]],      // Karlova
      [4, [[612, 238], [620, 234]]],
      [6, [[618, 198], [608, 160], [598, 126], [592, 126]]],                                          // Pařížská
      [4, [[570, 182], [624, 180]]],                                                                  // Široká
      [4, [[608, 208], [574, 200]]],                                                                  // Kaprova
      [4, [[650, 198], [640, 160], [632, 114]]],                                                      // Dušní
      [5, [[662, 200], [700, 190], [740, 186], [790, 182], [808, 182]]],                              // Dlouhá
      [5, [[668, 228], [700, 234], [730, 240], [770, 250]]],                                          // Celetná
      [7, [[772, 258], [740, 290], [715, 320], [700, 338]]],                                          // Na Příkopě
      [6, [[655, 356], [700, 340]]],                                                                  // Národní, the last bit
      [4, [[630, 246], [636, 270], [642, 296], [652, 322], [668, 340], [700, 340]]],                  // Melantrichova
      [4, [[650, 246], [662, 284]]], [4, [[606, 248], [612, 290], [618, 330], [630, 356]]],           // Železná, Husova
      [4, [[572, 262], [578, 290], [586, 306]]], [4, [[604, 316], [616, 318]]],                       // Liliová
      [4, [[588, 298], [610, 292]]], [4, [[612, 300], [636, 300]]], [4, [[618, 330], [650, 326]]],
      [4, [[682, 290], [720, 300], [740, 290]]],                                                      // Rytířská
      [5, [[660, 400], [760, 382]]],                                                                  // Vodičkova
      [4, [[556, 450], [600, 440], [662, 430]]],                                                      // Myslíkova
      [5, [[556, 500], [600, 492], [650, 480], [700, 470], [812, 478]]],                              // Resslova, Žitná
      [4, [[610, 372], [612, 450]]],                                                                  // Křemencova, past U Fleků
      [6, [[760, 610], [800, 560], [900, 524], [970, 524]]],                                          // Legerova
      [4, [[812, 250], [860, 250], [900, 230], [970, 228]]], [4, [[760, 382], [800, 360], [860, 350], [970, 350]]],
      [4, [[700, 520], [760, 540], [800, 560]]], [4, [[668, 560], [720, 580], [760, 560]]],
      [4, [[600, 520], [610, 600]]], [4, [[556, 560], [610, 560], [668, 560]]]
    ];
    for (i = 0; i < streets.length; i++) line(streets[i][1], streets[i][0], STREET, ONLY_LAND);
    for (i = 0; i < TRAMS.length; i++) line(TRAMS[i], 6, RAIL, ONLY_LAND);
    // --- paths in the parks
    var paths = [
      [[175, 222], [190, 250], [205, 290], [215, 322], [222, 340], [254, 346]],
      [[254, 346], [300, 352], [275, 370], [330, 382], [300, 400], [360, 410], [340, 428], [400, 420], [418, 416]],
      [[296, 256], [250, 262], [222, 300], [222, 322]],
      [[270, 196], [300, 198], [340, 198], [372, 196], [390, 194], [410, 190], [425, 194]],   // under the castle, to the old castle steps
      [[272, 178], [366, 178], [374, 194]],                                                   // the castle courtyards
      [[436, 244], [436, 358]], [[418, 286], [436, 286]],                                     // Kampa, and over the stream to it
      [[672, 424], [696, 470], [700, 520]], [[670, 470], [712, 470]],
      [[592, 40], [580, 20], [560, 10]],
      [[300, 300], [260, 420], [240, 520], [260, 600]], [[300, 400], [330, 470], [380, 520], [430, 520]],
      [[160, 200], [200, 170], [236, 168]]
    ];
    for (i = 0; i < paths.length; i++) line(paths[i], 3, PATH, ONLY_GREEN);
    // --- the rest of the streets: a net of lanes over whatever is still
    // houses, crooked in the old parts of town and straighter further out
    var nodes = [], gx, gy;
    for (gy = 0; gy * 24 < MH + 24; gy++) {
      nodes.push([]);
      for (gx = 0; gx * 26 < MW + 26; gx++) {
        var nx = gx * 26, ny = gy * 24, old = roofsAt(nx, ny) === ROOFS.old, j = old ? 9 : 3;
        nodes[gy].push([nx + (hash(gx, gy) - 0.5) * 2 * j, ny + (hash(gy + 50, gx) - 0.5) * 2 * j, old]);
      }
    }
    for (gy = 0; gy < nodes.length; gy++) {
      for (gx = 0; gx < nodes[gy].length; gx++) {
        var nd = nodes[gy][gx];
        if (gx + 1 < nodes[gy].length && hash(gx * 3 + 1, gy * 5) < (nd[2] ? 0.5 : 0.62)) line([nd, nodes[gy][gx + 1]], 3, STREET, ONLY_BLD);
        if (gy + 1 < nodes.length && hash(gx * 7, gy * 3 + 2) < (nd[2] ? 0.5 : 0.62)) line([nd, nodes[gy + 1][gx]], 3, STREET, ONLY_BLD);
      }
    }
    // --- bridges, which go over everything
    line([[447, 200], [552, 200]], 7, BRIDGE);                       // Mánesův most
    line([[430, 386], [552, 386]], 8, RAIL);                         // Most Legií
    line([[452, 500], [556, 500]], 7, BRIDGE);                       // Jiráskův most
    line([[592, 132], [592, 40]], 7, BRIDGE);                        // Čechův most
    line([[815, 128], [815, 30]], 8, RAIL);                          // Štefánikův most
    line([[538, 430], [556, 430]], 4, BRIDGE);                       // over to Slovanský ostrov
    box(398, 258, 157, 9, KARLUV);                                   // Karlův most
    box(398, 257, 157, 1, PARAPET); box(398, 267, 157, 1, PARAPET);
    box(433, 267, 6, 1, KARLUV); box(434, 268, 4, 3, PATH);         // the steps down to Kampa
    // --- where the sights stand, so one walks round them
    box(594, 200, 22, 38, BLD);                                      // the Old Town Hall
    box(596, 184, 17, 14, BLD);                                      // Sankt Nikolas in the Old Town
    box(669, 190, 31, 42, BLD);                                      // Týn
    box(558, 178, 28, 16, BLD);                                      // Rudolfinum
    box(576, 212, 12, 28, BLD);                                      // Klementinum
    box(593, 160, 15, 13, BLD);                                      // the Old-New Synagogue
    box(774, 218, 28, 20, BLD);                                      // Obecní dům
    box(560, 392, 26, 14, BLD);                                      // the National Theatre
    box(560, 474, 22, 20, BLD);                                      // the Dancing House
    box(842, 480, 52, 32, BLD);                                      // the National Museum
    box(633, 212, 7, 4, BLD);                                        // Jan Hus
    box(356, 228, 20, 14, BLD);                                      // Sankt Nikolas in Malá Strana
    box(822, 454, 8, 6, BLD);                                        // Václav
    line(FUNICULAR, 2, TRACK);
    line([[160, 610], [170, 500], [190, 420], [204, 340], [200, 300], [188, 250]], 2, WALLZ, ONLY_PARK); // Hladová zeď
  }

  // ---------------------------------------------------------------- colouring
  function hash(a, b) {
    var h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  var RGB = {};
  function rgb(hex) {
    if (!RGB[hex]) { var n = parseInt(hex.slice(1), 16); RGB[hex] = [n >> 16, (n >> 8) & 255, n & 255]; }
    return RGB[hex];
  }
  var ROOFS = {
    old: ['#c8643c', '#b85a34', '#d4744a', '#a84e2e', '#c06a44', '#cc5e36'],
    josefov: ['#a8a29a', '#c86a44', '#8e8a84', '#b85a34', '#9a9690'],
    nove: ['#9a8e86', '#b86040', '#8a7a70', '#a8a098', '#c06a44', '#8e8680'],
    out: ['#a09890', '#8e8680', '#b0a8a0', '#b86848']
  };
  var WALLS = ['#f0e0b0', '#e8c8a8', '#f4f0e0', '#d8e0c8', '#f0d098', '#e0c0c0', '#e8e0f0'];

  function roofsAt(x, y) {
    if (y < 130 || x > 860 || x < 150) return ROOFS.out;
    if (x > 545 && x < 650 && y < 192) return ROOFS.josefov;
    if (x > 545 && y > oldTownEdge(x)) return ROOFS.nove;
    if (x > 700 && y > 300) return ROOFS.nove;
    return ROOFS.old;
  }
  // The line along Národní and Na Příkopě, where the Old Town ends and the New Town begins.
  function oldTownEdge(x) {
    if (x < 552) return 390;
    if (x < 700) return 380 + (x - 552) * (334 - 380) / 148;
    if (x < 772) return 334 + (x - 700) * (254 - 334) / 72;
    return 256;
  }

  function colour(img) {
    var d = img.data, x, y, c;
    function set(x, y, hex) { var q = rgb(hex), o = (y * MW + x) * 4; d[o] = q[0]; d[o + 1] = q[1]; d[o + 2] = q[2]; d[o + 3] = 255; }
    function solid(z) { return z === BLD || z === CASTLE; }
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        var z = Z[y * MW + x], up = zone(x, y - 1), dn = zone(x, y + 1), dn2 = zone(x, y + 2), lf = zone(x - 1, y), rt = zone(x + 1, y);
        if (z === BLD || z === CASTLE) {
          var castle = z === CASTLE;
          var off = Math.floor(hash(Math.floor(y / 6), 7) * 8), cx = Math.floor((x + off) / 8), cy = Math.floor(y / 6);
          var facade = castle ? (!solid(dn) || !solid(zone(x, y + 3)) || !solid(zone(x, y + 6)) ? 1 : 0) : (!solid(dn) && dn !== WATER ? 2 : !solid(dn2) && dn2 !== WATER ? 1 : 0);
          if (facade) {
            var wall = castle ? '#ece4d0' : WALLS[Math.floor(hash(cx, 3) * WALLS.length)];
            c = wall;
            if (castle ? (x % 3 === 1 && y % 3 === 1) : (facade === 1 && x % 3 === 1)) c = '#4a4a54';
            if (!castle && facade === 2) c = '#c8bca4';
          } else if (castle) {
            c = hash(cx, cy) < 0.6 ? '#6a9a88' : '#b8603a';
            if ((y % 6) === 0) c = '#4a7a68';
          } else {
            var pal = roofsAt(x, y);
            c = pal[Math.floor(hash(cx, cy) * pal.length)];
            if (y % 6 === 3) c = shade(c, 18);
            if ((x + off) % 8 === 0 || y % 6 === 0) c = shade(c, -34);
          }
          if (!solid(up) && up !== WATER && !facade) c = shade(c, -40);
          if ((!solid(lf) || !solid(rt)) && !facade && lf !== WATER && rt !== WATER) c = shade(c, -26);
        } else if (z === STREET || z === RAIL) {
          c = z === RAIL ? '#b0aa9e' : '#d6cdb8';
          if (z === STREET && (x * 7 + y * 13) % 11 === 0) c = '#c4baa4';
          if (solid(up)) c = shade(c, -22);
        } else if (z === SQUARE) {
          c = ((x >> 1) + (y >> 1)) & 1 ? '#e2d8c2' : '#d8cdb4';
          if (solid(up)) c = shade(c, -22);
        } else if (z === WATER) {
          c = '#3a78a8';
          if (hash(x >> 3, y) < 0.05 && (x & 7) < 4) c = '#5a98c8';
          if ((up !== WATER && up !== BRIDGE && up !== RAIL && up !== KARLUV && up !== PARAPET) ||
              (dn !== WATER && dn !== BRIDGE && dn !== RAIL && dn !== KARLUV && dn !== PARAPET) ||
              (lf !== WATER && lf !== BRIDGE && lf !== RAIL && lf !== KARLUV) || (rt !== WATER && rt !== BRIDGE && rt !== RAIL && rt !== KARLUV)) c = '#8a8070';
          else if (zone(x, y - 2) !== WATER && zone(x, y - 2) !== BRIDGE) c = '#2a5a80';
        } else if (z === PARK) {
          c = hash(x >> 1, y >> 1) < 0.5 ? '#6aa84a' : '#62a044';
        } else if (z === PATH) {
          c = (x * 5 + y * 3) % 7 === 0 ? '#c8b890' : '#e0d0a8';
        } else if (z === BRIDGE) {
          c = '#a09c94';
          if (zone(x, y - 2) === WATER || zone(x, y + 2) === WATER || zone(x - 2, y) === WATER || zone(x + 2, y) === WATER) c = '#d0ccc0';
        } else if (z === KARLUV) {
          c = ((x * 3 + y * 5) % 7 === 0) ? '#a89a7e' : '#bcae92';
        } else if (z === PARAPET) {
          c = '#7a6c56';
        } else if (z === CEM) {
          c = hash(x, y) < 0.22 && (x + y) % 2 ? '#a8a8a0' : '#4a6a3a';
        } else if (z === WALLZ) {
          c = (x + y) % 3 ? '#8a8070' : '#a89e8a';
        } else if (z === TRACK) {
          c = '#5a4a3a';
        }
        set(x, y, c);
      }
    }
    // trees, wherever there is room in a park
    for (y = 2; y < MH; y += 5) {
      for (x = 2; x < MW; x += 5) {
        var tx = x + Math.floor(hash(x, y) * 4) - 2, ty = y + Math.floor(hash(y, x) * 4) - 2;
        var dense = tx < 420 && ty > 220 ? 0.75 : ty < 60 ? 0.35 : 0.55;
        if (hash(tx * 3, ty * 7) > dense) continue;
        var r = hash(tx, ty * 5) < 0.4 ? 3 : 2, ok = true;
        for (var dy = -r - 1; dy <= r + 1 && ok; dy++) for (var dx = -r; dx <= r + 1; dx++) if (zone(tx + dx, ty + dy) !== PARK) { ok = false; break; }
        if (!ok) continue;
        for (dy = -r; dy <= r; dy++) for (dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 1) continue;
          var col = dx + dy < -r ? '#5aa848' : dx + dy > r - 1 ? '#2a5e26' : '#3e8a34';
          set(tx + dx, ty + dy, col);
        }
        set(tx + r + 1, ty + 1, '#4a8838'); set(tx + 1, ty + r + 1, '#4a8838');
      }
    }
  }
  function shade(hex, n) {
    var q = rgb(hex);
    function ch(v) { v = Math.max(0, Math.min(255, v + n)); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + ch(q[0]) + ch(q[1]) + ch(q[2]);
  }

  // ---------------------------------------------------------------- the sights
  // Drawn standing up, the way an illustrated tourist map does it, each one
  // with its foot at (bx, by).
  var g = null;
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function D(x, y, rx, ry, c) { A.disc(g, Math.round(x), Math.round(y), rx, ry, c); }
  function spire(x, y, w, h, c) { for (var i = 0; i < h; i++) { var sw = Math.max(1, Math.round(w * (i + 1) / h)); R(x - Math.floor(sw / 2), y + i, sw, 1, c); } }

  function vitus(bx, by) {
    var stone = '#8a8680', dark = '#4a4846', roof = '#34363c';
    R(bx - 28, by - 22, 58, 22, stone);
    for (var x = bx - 26; x < bx + 30; x += 6) { R(x, by - 22, 1, 22, dark); R(x + 2, by - 18, 2, 10, '#3a4a6a'); }
    R(bx - 28, by - 30, 58, 8, roof); R(bx - 28, by - 30, 58, 1, '#5a5c62');
    // the two west spires
    var w = [bx - 36, bx - 26];
    for (var k = 0; k < 2; k++) {
      R(w[k], by - 46, 8, 46, stone);
      R(w[k] + 3, by - 40, 2, 10, dark);
      spire(w[k] + 4, by - 64, 7, 18, roof);
    }
    D(bx - 26, by - 36, 3, 3, '#4a5a8a'); D(bx - 26, by - 36, 1, 1, '#d8b040'); // the rose window, between them
    // the great south tower, with its copper helm and gilded crown
    R(bx + 2, by - 50, 14, 50, stone);
    R(bx + 6, by - 44, 2, 12, dark); R(bx + 10, by - 44, 2, 12, dark);
    D(bx + 9, by - 30, 3, 3, '#d8b040');
    D(bx + 9, by - 53, 7, 4, '#5a8a7a');
    spire(bx + 9, by - 66, 6, 12, '#5a8a7a');
    R(bx + 8, by - 69, 3, 3, '#e8c040');
    // the apse, with its buttresses and pinnacles
    for (var p = 0; p < 4; p++) { R(bx + 30 + p * 3, by - 18 + p, 2, 18 - p, stone); spire(bx + 31 + p * 3, by - 24 + p, 2, 6, roof); }
  }
  function gateTower(bx, by, h, wide, dark) {
    var w = wide || 10, body = dark || '#5a5650';
    R(bx - w / 2, by - h, w, h, body);
    R(bx - w / 2, by - h, 1, h, '#3a3632');
    R(bx - 2, by - 8, 5, 8, '#2a2622');
    R(bx - 1, by - h + 6, 1, 3, '#2a2622'); R(bx + 1, by - h + 6, 1, 3, '#2a2622');
    R(bx - w / 2 - 1, by - h - 1, w + 2, 2, '#3a3632');
    spire(bx, by - h - 12, w, 12, '#2a2c30');
    R(bx - w / 2 - 1, by - h - 5, 1, 4, '#2a2c30'); R(bx + w / 2, by - h - 5, 1, 4, '#2a2c30');
    R(bx, by - h - 14, 1, 2, '#e0b040');
  }
  function tyn(bx, by) {
    R(bx - 14, by - 26, 28, 12, '#4a4848');
    spire(bx, by - 34, 16, 8, '#3a3a3c');
    var t = [bx - 12, bx + 4];
    for (var k = 0; k < 2; k++) {
      R(t[k], by - 40, 8, 30, '#6a6660');
      R(t[k] + 3, by - 34, 2, 6, '#2a2a2c');
      spire(t[k] + 4, by - 56, 8, 16, '#26262a');
      for (var s = 0; s < 4; s++) {
        var sx = t[k] + [0, 7, 1, 6][s], sy = by - 46 + (s > 1 ? -4 : 0);
        R(sx, sy, 1, 6, '#26262a'); R(sx, sy - 1, 1, 1, '#e0b040');
      }
      R(t[k] + 4, by - 57, 1, 1, '#e0b040');
    }
    // the Týn school in front, with its arcades
    R(bx - 15, by - 14, 30, 14, '#e8dcc0');
    for (var x = bx - 13; x < bx + 14; x += 5) R(x, by - 6, 3, 6, '#5a5048');
    R(bx - 15, by - 16, 30, 2, '#b85a34');
  }
  function townHall(bx, by) {
    R(bx - 16, by - 16, 12, 16, '#e8d8b0'); R(bx - 16, by - 19, 12, 3, '#b85a34');
    R(bx - 14, by - 12, 2, 3, '#4a4a54'); R(bx - 9, by - 12, 2, 3, '#4a4a54');
    R(bx - 5, by - 40, 10, 40, '#8a7e6a');
    R(bx - 6, by - 32, 12, 2, '#3a3a38');
    spire(bx, by - 48, 10, 8, '#2a2c30');
    R(bx - 6, by - 45, 1, 4, '#2a2c30'); R(bx + 5, by - 45, 1, 4, '#2a2c30');
    D(bx, by - 18, 4, 4, '#d8b040'); D(bx, by - 18, 3, 3, '#2a5aa8'); D(bx, by - 18, 1, 1, '#c84a30');
    D(bx, by - 7, 3, 3, '#d8b040'); D(bx, by - 7, 2, 2, '#e8e0c0');
    R(bx - 2, by - 26, 4, 3, '#3a3a38');
  }
  function hus(bx, by) {
    R(bx - 6, by - 3, 12, 3, '#7a7468');
    R(bx - 1, by - 11, 3, 8, '#2a4a3a'); R(bx - 1, by - 13, 3, 2, '#3a5a4a');
    R(bx - 5, by - 7, 2, 4, '#2a4a3a'); R(bx + 4, by - 7, 2, 4, '#2a4a3a'); R(bx - 3, by - 6, 2, 3, '#2a4a3a');
  }
  function nicholasSmall(bx, by) {
    R(bx - 8, by - 12, 16, 12, '#f0e8d8');
    D(bx, by - 15, 4, 4, '#5a9a7a'); R(bx, by - 22, 1, 4, '#e0b040');
    R(bx - 8, by - 18, 4, 6, '#f0e8d8'); R(bx + 4, by - 18, 4, 6, '#f0e8d8');
    D(bx - 6, by - 20, 2, 2, '#5a9a7a'); D(bx + 6, by - 20, 2, 2, '#5a9a7a');
    R(bx - 2, by - 6, 4, 6, '#4a3a2a');
  }
  function nicholasBig(bx, by) {
    R(bx - 11, by - 16, 22, 16, '#ece4d4');
    for (var x = bx - 9; x < bx + 10; x += 4) R(x, by - 13, 2, 5, '#5a5a64');
    D(bx - 2, by - 20, 8, 7, '#5a9a7a'); D(bx - 4, by - 23, 3, 2, '#7abaa0');
    R(bx - 3, by - 32, 3, 6, '#ece4d4'); R(bx - 2, by - 35, 1, 3, '#e0b040');
    R(bx + 8, by - 34, 7, 34, '#ece4d4'); R(bx + 10, by - 28, 2, 4, '#5a5a64');
    D(bx + 11, by - 36, 4, 3, '#5a9a7a'); spire(bx + 11, by - 44, 3, 6, '#5a9a7a'); R(bx + 11, by - 45, 1, 1, '#e0b040');
  }
  function petrin(bx, by) {
    var col = '#8a4a2a', dk = '#5a2a1a';
    for (var y = 0; y < 44; y++) {
      var hw = Math.round(6 - y * 4.5 / 44);
      R(bx - hw, by - y, 1, 1, col); R(bx + hw, by - y, 1, 1, col);
      if (y % 6 < 3) { R(bx - hw + (y % 6), by - y, 1, 1, dk); R(bx + hw - (y % 6), by - y, 1, 1, dk); }
    }
    R(bx - 7, by - 16, 15, 2, col); R(bx - 4, by - 36, 9, 2, col);
    R(bx - 1, by - 50, 3, 6, col); R(bx, by - 56, 1, 6, '#3a3a3a');
    R(bx + 1, by - 56, 3, 2, '#c82020');
    R(bx - 8, by, 17, 2, '#5a5a5a');
  }
  function strahov(bx, by) {
    R(bx - 10, by - 14, 20, 14, '#f0e8d4');
    spire(bx, by - 22, 10, 8, '#f0e8d4');
    var t = [bx - 10, bx + 5];
    for (var k = 0; k < 2; k++) {
      R(t[k], by - 26, 5, 26, '#f0e8d4'); R(t[k] + 2, by - 20, 1, 3, '#4a4a54');
      D(t[k] + 2, by - 28, 2, 2, '#4a8a6a'); R(t[k] + 2, by - 33, 1, 4, '#4a8a6a'); R(t[k] + 2, by - 34, 1, 1, '#e0b040');
    }
    R(bx - 2, by - 6, 4, 6, '#4a3a2a');
  }
  function rudolfinum(bx, by) {
    R(bx - 13, by - 13, 26, 13, '#e4d4b0');
    for (var x = bx - 11; x < bx + 12; x += 3) R(x, by - 10, 1, 8, '#a89878');
    R(bx - 14, by - 15, 28, 2, '#c8b890');
    for (x = bx - 12; x < bx + 13; x += 4) R(x, by - 17, 1, 2, '#6a6458');
    R(bx - 5, by - 19, 10, 4, '#e4d4b0');
  }
  function clementinum(bx, by) {
    R(bx - 3, by - 22, 7, 22, '#e8dcc0'); R(bx - 1, by - 16, 2, 3, '#4a4a54');
    D(bx, by - 24, 3, 2, '#5a8a7a'); R(bx, by - 30, 1, 5, '#e0b040'); D(bx, by - 31, 1, 1, '#e0b040');
  }
  function synagogue(bx, by) {
    R(bx - 7, by - 10, 14, 10, '#a86a4a');
    for (var s = 0; s < 4; s++) R(bx - 6 + s * 1.5, by - 12 - s * 2, 12 - s * 3, 2, '#b8784e');
    R(bx - 4, by - 7, 1, 3, '#3a2a2a'); R(bx + 3, by - 7, 1, 3, '#3a2a2a');
  }
  function municipal(bx, by) {
    R(bx - 14, by - 12, 28, 12, '#e8d8a8');
    D(bx, by - 8, 5, 4, '#e8a030'); D(bx, by - 8, 3, 2, '#c84a2a');
    D(bx, by - 15, 6, 4, '#6a9a88'); R(bx, by - 22, 1, 4, '#e0b040');
    for (var x = bx - 12; x < bx + 13; x += 4) R(x, by - 4, 2, 4, '#5a5048');
  }
  function theatre(bx, by) {
    R(bx - 13, by - 12, 26, 12, '#e0d0b0');
    for (var x = bx - 11; x < bx + 12; x += 4) R(x, by - 6, 2, 6, '#5a5048');
    for (var r = 0; r < 7; r++) R(bx - 12 + r, by - 13 - r, 24 - r * 2, 1, '#2a3a6a');
    for (x = bx - 9; x < bx + 10; x += 3) R(x, by - 15 - (x % 2), 1, 1, '#e8c040');
    R(bx - 6, by - 20, 12, 1, '#e8c040');
    R(bx - 12, by - 16, 1, 4, '#e8c040'); R(bx + 11, by - 16, 1, 4, '#e8c040');
  }
  function dancing(bx, by) {
    for (var y = 0; y < 22; y++) {
      var w = 4 + Math.round(Math.abs(y - 11) / 3);
      R(bx - 4 - w, by - y, w, 1, y % 3 ? '#a8c8d8' : '#7a98a8');
    }
    R(bx - 2, by - 22, 11, 22, '#e8e0d0');
    for (y = 3; y < 21; y += 3) for (var x = 0; x < 9; x += 3) R(bx - 1 + x + Math.round(Math.sin(y / 3) * 1), by - y, 2, 1, '#4a5a6a');
    D(bx + 3, by - 24, 4, 2, '#7a7a7a');
    for (x = -3; x <= 3; x += 2) R(bx + 3 + x, by - 28 + Math.abs(x), 1, 2, '#6a6a6a');
  }
  function museum(bx, by) {
    R(bx - 27, by - 16, 54, 16, '#d8c8a0');
    for (var x = bx - 25; x < bx + 26; x += 4) R(x, by - 12, 2, 6, '#5a5048');
    R(bx - 9, by - 24, 18, 8, '#d8c8a0');
    for (x = bx - 7; x < bx + 8; x += 3) R(x, by - 23, 1, 7, '#a89878');
    D(bx, by - 27, 7, 5, '#6a8a7a'); R(bx, by - 35, 1, 4, '#e0b040');
    D(bx - 24, by - 18, 3, 2, '#6a8a7a'); D(bx + 24, by - 18, 3, 2, '#6a8a7a');
    R(bx - 6, by - 2, 12, 2, '#a8a294');
  }
  function zofin(bx, by) { R(bx - 7, by - 8, 14, 8, '#f0d070'); R(bx - 8, by - 10, 16, 2, '#8a8a8a'); R(bx - 2, by - 5, 4, 5, '#6a5040'); }
  function stall(x, y, c) { R(x, y, 7, 2, c); for (var i = 0; i < 7; i += 2) R(x + i, y, 1, 2, '#f4f4f0'); R(x, y + 2, 1, 2, '#6a5a4a'); R(x + 6, y + 2, 1, 2, '#6a5a4a'); }

  function sights() {
    var i, x;
    vitus(316, 178);
    // the bridge: its towers, and the statues along the parapets
    gateTower(404, 267, 30);
    gateTower(395, 257, 18, 8, '#6a645c');
    gateTower(546, 267, 32, 11);
    for (x = 414; x < 536; x += 10) {
      R(x, 252, 2, 5, '#3a3630'); R(x, 251, 2, 1, '#4a463e');
      if (x % 20 === 4) R(x, 249, 2, 1, '#e0b040');
      R(x + 5, 265, 2, 3, '#3a3630');
    }
    townHall(610, 238);
    tyn(684, 232);
    hus(636, 216);
    nicholasSmall(604, 197);
    nicholasBig(366, 242);
    petrin(222, 334);
    strahov(152, 214);
    rudolfinum(572, 194);
    clementinum(582, 240);
    synagogue(600, 172);
    gateTower(764, 258, 26, 12, '#3e3a36');                     // Prašná brána
    municipal(788, 238);
    theatre(572, 406);
    dancing(571, 494);
    museum(868, 512);
    // Václav on his horse
    R(822, 456, 8, 4, '#8a8478'); R(822, 451, 8, 4, '#2a4a3a');
    R(822, 455, 1, 2, '#2a4a3a'); R(829, 455, 1, 2, '#2a4a3a'); R(828, 448, 2, 3, '#2a4a3a');
    R(825, 446, 2, 5, '#2a4a3a'); R(825, 444, 2, 2, '#3a5a4a'); R(827, 440, 1, 8, '#2a4a3a'); R(828, 440, 2, 2, '#2a4a3a');
    zofin(536, 432);
    // the metronome's plinth, up on Letná; its arm swings and is drawn each frame
    R(558, 28, 16, 6, '#8a8478'); R(558, 28, 16, 1, '#a8a294');
    // the Lennon wall
    var lennon = ['#e83a3a', '#f0c030', '#3aa8e8', '#5ac85a', '#e85ac8', '#ffffff', '#f08a2a'];
    for (var y = 276; y < 293; y++) for (x = 400; x < 402; x++) R(x, y, 1, 1, lennon[Math.floor(hash(x, y) * lennon.length)]);
    // the water wheel on Čertovka
    D(421, 300, 3, 3, '#6a4a2a'); D(421, 300, 1, 1, '#3a2a1a'); R(418, 300, 7, 1, '#3a2a1a'); R(421, 297, 1, 7, '#3a2a1a');
    // the market stalls on Havelská
    var stalls = ['#c82020', '#2a8a3a', '#e8a020', '#2a5aa8'];
    for (i = 0; i < 6; i++) { stall(630 + i * 9, 279, stalls[i % 4]); stall(634 + i * 8, 291, stalls[(i + 2) % 4]); }
    // the funicular stations
    R(414, 404, 9, 6, '#d8c8a0'); R(414, 403, 9, 1, '#b85a34');
    R(250, 340, 9, 6, '#d8c8a0'); R(250, 339, 9, 1, '#b85a34');
    // the tram stops
    for (var t = 0; t < STOPS.length; t++) for (i = 0; i < STOPS[t].length; i++) {
      var p = nearestOn(TRAMS[t], STOPS[t][i][0], STOPS[t][i][1]);
      R(p.x + 4, p.y - 6, 1, 5, '#5a5a5a'); R(p.x + 3, p.y - 8, 3, 2, '#c82020'); R(p.x + 4, p.y - 8, 1, 1, '#f4f4f0');
    }
  }

  function rails() {
    for (var t = 0; t < TRAMS.length; t++) {
      var pts = TRAMS[t];
      for (var i = 0; i + 1 < pts.length; i++) {
        var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
        for (var k = 0; k <= L * 2; k++) {
          var x = a[0] + (b[0] - a[0]) * k / (L * 2), y = a[1] + (b[1] - a[1]) * k / (L * 2);
          R(Math.round(x + nx * 1.5), Math.round(y + ny * 1.5), 1, 1, '#7a746a');
          R(Math.round(x - nx * 1.5), Math.round(y - ny * 1.5), 1, 1, '#7a746a');
        }
      }
    }
  }

  // Names on the map, the way the Czechs write them.
  var LABELS = [
    ['HRADČANY', 180, 142], ['MALÁ STRANA', 322, 264], ['PETŘÍN', 250, 470], ['KAMPA', 426, 330],
    ['STARÉ MĚSTO', 655, 268], ['JOSEFOV', 632, 140], ['NOVÉ MĚSTO', 700, 420], ['LETNÁ', 420, 40],
    ['VLTAVA', 480, 310], ['VLTAVA', 680, 90], ['KARLŮV MOST', 440, 245]
  ];
  function labels() {
    for (var i = 0; i < LABELS.length; i++) {
      var l = LABELS[i];
      F.outline(g, l[0], l[1], l[2], l[0] === 'VLTAVA' ? '#c8e8ff' : '#fff8e0', 1, l[0] === 'VLTAVA' ? '#1a3a5a' : '#3a2a20');
    }
  }

  // Every car and tram has to keep to the roads; say so in the console if a
  // route has drifted off them, onto houses, park or river.
  function checkRoutes() {
    var road = {}, bad = [], all = TRAMS.concat(CARS);
    road[STREET] = road[RAIL] = road[BRIDGE] = road[SQUARE] = true;
    for (var n = 0; n < all.length; n++) {
      var r = route(all[n]);
      for (var t = 0; t <= r.len; t += 2) {
        var p = at(r, t), x = Math.round(p.x), y = Math.round(p.y);
        if (x < 0 || y < 0 || x >= MW || y >= MH || road[zone(x, y)]) continue;
        bad.push((n < TRAMS.length ? 'tram ' + n : 'car ' + (n - TRAMS.length)) + ' at ' + x + ',' + y);
        t += 20;
      }
    }
    if (bad.length) console.warn('byvandring: off the road: ' + bad.join('; '));
    return bad;
  }

  function build() {
    if (built) return;
    lay();
    checkRoutes();
    map = document.createElement('canvas');
    map.width = MW; map.height = MH;
    g = map.getContext('2d');
    var img = g.createImageData(MW, MH);
    colour(img);
    g.putImageData(img, 0, 0);
    rails();
    sights();
    labels();
    built = true;
  }

  // ---------------------------------------------------------------- routes
  function route(pts) {
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, acc: acc, len: acc[acc.length - 1] };
  }
  function at(r, s) {
    s = Math.max(0, Math.min(r.len, s));
    var i = 1;
    while (i < r.acc.length - 1 && r.acc[i] < s) i++;
    var a = r.pts[i - 1], b = r.pts[i], u = (s - r.acc[i - 1]) / ((r.acc[i] - r.acc[i - 1]) || 1);
    return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u };
  }
  function nearestOn(pts, x, y) {
    var best = null, bd = Infinity, r = route(pts);
    for (var s = 0; s <= r.len; s += 1) {
      var p = at(r, s), d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bd) { bd = d; best = { x: Math.round(p.x), y: Math.round(p.y), s: s }; }
    }
    return best;
  }

  function makeVehicles() {
    var trams = [], cars = [], i, k;
    for (i = 0; i < TRAMS.length; i++) {
      var r = route(TRAMS[i]), stops = STOPS[i].map(function (p) { return nearestOn(TRAMS[i], p[0], p[1]).s; });
      for (k = 0; k < 2; k++) trams.push({ r: r, s: r.len * (k ? 0.65 : 0.2), dir: k ? -1 : 1, v: 0.7, len: 18, stops: stops, wait: 0, last: -1 });
    }
    var colors = ['#e8e8e8', '#2a4a8a', '#c82020', '#3a3a3a', '#d8b020', '#5a8a5a', '#8a8a92'];
    for (i = 0; i < CARS.length; i++) {
      var cr = route(CARS[i]);
      for (k = 0; k < 3; k++) cars.push({ r: cr, s: cr.len * (k / 3 + 0.1), dir: k % 2 ? -1 : 1, v: 0.8 + k * 0.15, len: 5, col: colors[(i * 3 + k) % colors.length] });
    }
    return { trams: trams, cars: cars };
  }

  function stepVehicle(v) {
    if (v.wait > 0) { v.wait--; return; }
    v.s += v.dir * v.v;
    if (v.s > v.r.len) { v.s = v.r.len; v.dir = -1; }
    if (v.s < 0) { v.s = 0; v.dir = 1; }
    if (v.stops) {
      for (var i = 0; i < v.stops.length; i++) {
        if (i !== v.last && Math.abs(v.s - v.stops[i]) < v.v) { v.wait = 90; v.last = i; break; }
      }
    }
  }

  // ---------------------------------------------------------------- start and step
  var BUILT_PEOPLE = null;
  function people() {
    var T = [];
    function crowd(n, x0, y0, x1, y1) {
      for (var i = 0; i < n; i++) {
        for (var tries = 0; tries < 40; tries++) {
          var x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0);
          if (walkable(x, y)) { T.push({ x: x, y: y, tx: x, ty: y, box: [x0, y0, x1, y1], col: ['#e83a3a', '#3a6ae8', '#f0c030', '#5ac85a', '#f4f4f4', '#2a2a2a', '#e87ac8'][i % 7], t: Math.floor(Math.random() * 100) }); break; }
        }
      }
    }
    crowd(40, 410, 259, 545, 266);       // Karlův most
    crowd(30, 608, 196, 668, 246);       // Staroměstské náměstí
    crowd(24, 700, 330, 840, 470);       // Václavské náměstí
    crowd(10, 240, 170, 276, 200);       // Hradčanské náměstí
    crowd(10, 352, 222, 392, 252);       // Malostranské náměstí
    crowd(8, 553, 240, 610, 262);        // Karlova
    crowd(10, 628, 282, 682, 294);       // the market
    crowd(6, 768, 238, 800, 264);
    crowd(6, 272, 176, 366, 200);        // the castle
    return T;
  }

  function start(e) {
    env = e;
    build();
    var v = makeVehicles();
    S = {
      phase: 'tram', t: 0, cx: 0, cy: 0, x: 0, y: 0, trail: [], step: 0, moving: false, fx: [], bits: [], tipsy: 0, flying: {}, lean: 1,
      trams: v.trams, cars: v.cars, tourists: people(), boats: [], swans: [],
      said: {}, bought: {}, say: null, queue: [], near: null, funi: route(FUNICULAR), ride: null, ding: 0,
      arrive: { r: route(TRAMS[0]), s: 0, stop: 0 }
    };
    var river = route(RIVER.map(function (p) { return [p[0] + 8, p[1]]; }));
    S.boats = [{ r: river, s: 260, dir: -1, v: 0.35, len: 12 }, { r: river, s: 600, dir: 1, v: 0.3, len: 10 }, { r: river, s: 820, dir: -1, v: 0.4, len: 9 }];
    S.swans = [[440, 318], [444, 340], [452, 300], [530, 470], [470, 180]].map(function (p, i) { return { x: p[0], y: p[1], ph: i * 1.7 }; });
    // the tram we arrive on comes up Spálená and along Národní, and stops at the National Theatre
    var a = S.arrive;
    a.stop = nearestOn(TRAMS[0], 565, 386).s;
    a.s = nearestOn(TRAMS[0], 662, 470).s;
    var p = at(a.r, a.s);
    S.cx = p.x - VW / 2; S.cy = p.y - VH / 2;
    clampCam();
    AU.startMusic('praha');
  }

  // The camera glides after Magnio when he is far off (off the tram, off the
  // funicular), and otherwise sits exactly on his whole-pixel position, so
  // he and the town move the same pixel at the same time. Following him
  // smoothly instead, both get rounded separately, and walking at a slant
  // he would jitter a pixel back and forth on the screen.
  function follow() {
    var tx = Math.max(0, Math.min(MW - VW, Math.round(S.x) - VW / 2));
    var ty = Math.max(0, Math.min(MH - VH, Math.round(S.y) - VH / 2));
    S.cx = Math.abs(tx - S.cx) > 6 ? S.cx + (tx - S.cx) * 0.15 : tx;
    S.cy = Math.abs(ty - S.cy) > 6 ? S.cy + (ty - S.cy) * 0.15 : ty;
  }

  function clampCam() {
    S.cx = Math.max(0, Math.min(MW - VW, S.cx));
    S.cy = Math.max(0, Math.min(MH - VH, S.cy));
  }

  // tag: where the lines come from, so a shop never queues up more than one round of them
  function say(lines, tag) { for (var i = 0; i < lines.length; i++) S.queue.push({ who: lines[i][0], text: lines[i][1], tag: tag }); }

  function step() {
    S.t++;
    var i;
    for (i = 0; i < S.trams.length; i++) stepVehicle(S.trams[i]);
    for (i = 0; i < S.cars.length; i++) stepVehicle(S.cars[i]);
    for (i = 0; i < S.boats.length; i++) stepVehicle(S.boats[i]);
    stepTourists();
    stepFx();
    if (S.say) {
      S.say.t++;
      if (S.say.t > 40 + S.say.text.length * 4 || (S.say.t > 12 && env.pressed('jumpP') && !shopNear())) S.say = null;
    }
    if (!S.say && S.queue.length) { var q = S.queue.shift(); S.say = { who: q.who, text: q.text, t: 0 }; }

    if (S.phase === 'tram') { stepArrive(); return; }
    if (S.phase === 'ride') { stepRide(); return; }
    if (S.phase === 'ask') {
      if (env.pressed('jumpP')) { S.phase = 'leave'; S.t = 0; S.queue = []; S.say = null; AU.sfx('bell'); }
      else if (env.pressed('fireP')) S.phase = 'walk';
      return;
    }
    if (S.phase === 'leave') {
      if (S.t > 90 && env.pressed('jumpP')) { AU.stopMusic(); env.done(); }
      return;
    }
    // everything on the list is bought: once that has been said, and the
    // last thing has landed in the list, they are done for the day
    if (S.finish && !S.say && !S.queue.length && !Object.keys(S.flying).length) {
      S.phase = 'leave'; S.t = 0; S.happy = true;
      AU.sfx('clear');
      return;
    }
    stepWalk();
  }

  function stepArrive() {
    var a = S.arrive;
    if (a.s > a.stop) {
      a.s = Math.max(a.stop, a.s - Math.min(1.1, 0.2 + (a.s - a.stop) * 0.02));
      var p = at(a.r, a.s);
      S.cx += (p.x - VW / 2 - S.cx) * 0.2; S.cy += (p.y - VH / 2 - S.cy) * 0.2;
      clampCam();
      if (a.s === a.stop) { AU.sfx('bell'); S.t = 0; }
      return;
    }
    if (S.t === 40) {
      var q = at(a.r, a.stop);
      S.x = Math.round(q.x) + 2; S.y = Math.round(q.y) - 4;
      while (!walkable(S.x, S.y) && S.y > 0) S.y--;
      S.trail = [];
      for (var i = 0; i < 20; i++) S.trail.push([S.x + 6, S.y]);
      say([['tove', 'NÅ SKA ME GÅ PÅ KRYSS OG TVERS! HUSK SOKKER TE GUTTENE.'], ['me', 'OG NOE BLÅTT GLASS.']]);
    }
    if (S.t > 70) {
      // and it drives on, like any other tram
      S.trams.push({ r: a.r, s: a.stop, dir: -1, v: 0.7, len: 18, stops: S.trams[0].stops, wait: 0, last: -1 });
      S.phase = 'walk';
    }
  }

  function stepTourists() {
    for (var i = 0; i < S.tourists.length; i++) {
      var p = S.tourists[i];
      p.t++;
      var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d < 1 || p.t % 400 === 0) {
        var b = p.box, nx = b[0] + Math.random() * (b[2] - b[0]), ny = b[1] + Math.random() * (b[3] - b[1]);
        if (walkable(nx, ny)) { p.tx = nx; p.ty = ny; }
        continue;
      }
      var nx2 = p.x + dx / d * 0.25, ny2 = p.y + dy / d * 0.25;
      if (walkable(nx2, ny2)) { p.x = nx2; p.y = ny2; } else { p.tx = p.x; p.ty = p.y; }
    }
  }

  function shopNear() {
    for (var i = 0; i < SHOPS.length; i++) {
      if (SHOPS[i].list && S.bought[SHOPS[i].id]) continue;
      // anywhere from just below the shop's spot up to its sign counts
      if (Math.abs(SHOPS[i].x - S.x) < 9 && S.y > SHOPS[i].y - SIGN - 6 && S.y < SHOPS[i].y + 7) return SHOPS[i];
    }
    return null;
  }
  function stationNear() {
    var r = S.funi, lo = at(r, 0), hi = at(r, r.len);
    if (Math.hypot(lo.x - S.x, lo.y - S.y) < 9) return { from: 0, to: r.len, name: 'OPP' };
    if (Math.hypot(hi.x - S.x, hi.y - S.y) < 9) return { from: r.len, to: 0, name: 'NED' };
    return null;
  }

  // Walking is forgiving, since the lanes are narrow and most streets run at
  // an angle: if the way straight ahead is blocked, he tries a little to
  // either side (first the side that worked last time, so he does not
  // dither), and so slides along walls and follows a street round a bend.
  // Failing that, he looks a few pixels sideways for an opening in the
  // direction pressed, and slips across to it, round the corner.
  function tryMove(vx, vy) {
    var sp = Math.hypot(vx, vy), a = Math.atan2(vy, vx), k, side, d;
    if (walkable(S.x + vx, S.y + vy)) { S.x += vx; S.y += vy; return true; }
    for (k = 1; k <= 2; k++) {
      for (side = 0; side < 2; side++) {
        var sgn = side ? -S.lean : S.lean, b = a + sgn * k * Math.PI / 6;
        var nx = Math.cos(b) * sp, ny = Math.sin(b) * sp;
        if (walkable(S.x + nx, S.y + ny)) { S.x += nx; S.y += ny; S.lean = sgn; return true; }
      }
    }
    var px = -Math.sin(a), py = Math.cos(a), fx = Math.cos(a), fy = Math.sin(a);
    for (d = 1; d <= 10; d++) {
      for (side = 0; side < 2; side++) {
        var sg = side ? -S.lean : S.lean, ex = S.x + px * d * sg, ey = S.y + py * d * sg, clear = true;
        for (k = 1; k <= d && clear; k++) clear = walkable(S.x + px * k * sg, S.y + py * k * sg);
        if (clear && walkable(ex + fx * 2, ey + fy * 2)) { S.x += px * sp * sg; S.y += py * sp * sg; S.lean = sg; return true; }
      }
    }
    return false;
  }

  function stepWalk() {
    var dx = (env.pressed('right') ? 1 : 0) - (env.pressed('left') ? 1 : 0);
    var dy = (env.pressed('down') ? 1 : 0) - (env.pressed('up') ? 1 : 0);
    S.moving = false;
    if (dx || dy) {
      var n = dx && dy ? SPEED * 0.71 : SPEED;
      var ox = S.x, oy = S.y;
      tryMove(dx * n, dy * n);
      // after a beer or two he does not walk quite straight
      if (S.tipsy > 0) {
        var sway = Math.sin(S.t / 14) * 0.2 * S.tipsy;
        if (dx && walkable(S.x, S.y + sway)) S.y += sway;
        else if (!dx && walkable(S.x + sway, S.y)) S.x += sway;
      }
      if (S.x !== ox || S.y !== oy) {
        S.moving = true;
        S.step++;
        var last = S.trail[S.trail.length - 1];
        if (!last || Math.hypot(last[0] - S.x, last[1] - S.y) >= 1) {
          S.trail.push([S.x, S.y]);
          if (S.trail.length > 40) S.trail.shift();
        }
      }
    }
    follow();

    for (var i = 0; i < SIGHTS.length; i++) {
      var s = SIGHTS[i];
      if (!S.said[i] && Math.hypot(s.x - S.x, s.y - S.y) < s.r) { S.said[i] = true; say(s.lines); }
    }
    // the astronomical clock strikes now and then, when one is near
    if (Math.hypot(610 - S.x, 230 - S.y) < 80 && S.t % 1200 === 600) { AU.sfx('bell'); S.ding = 90; }
    if (S.ding > 0) S.ding--;
    // a tram rings its bell when it passes close by
    for (i = 0; i < S.trams.length; i++) {
      var tp = at(S.trams[i].r, S.trams[i].s);
      if (Math.hypot(tp.x - S.x, tp.y - S.y) < 14 && !S.trams[i].wait && S.t - (S.trams[i].rang || -999) > 300) { S.trams[i].rang = S.t; AU.sfx('bell'); }
    }

    S.near = shopNear() || stationNear();
    if (env.pressed('jumpP') && S.near) {
      if (S.near.price !== undefined) buy(S.near);
      else { S.ride = { from: S.near.from, to: S.near.to, t: 0 }; S.phase = 'ride'; AU.sfx('bell'); }
      return;
    }
    if (env.pressed('fireP')) { S.phase = 'ask'; AU.sfx('talk'); }
  }

  function buy(shop) {
    var n = S.bought[shop.id] || 0;
    var lines = (n && shop.again ? shop.again[Math.min(n, shop.again.length) - 1] : shop.lines).slice();
    if (env.coins() >= shop.price) env.setCoins(env.coins() - shop.price);
    else lines.push(['tove', 'EG BETALE, EG.']);
    S.bought[shop.id] = n + 1;
    AU.sfx('coin');
    S.queue = S.queue.filter(function (q) { return q.tag !== shop.id; });
    say(lines, shop.id);
    bought(shop);
    var all = true;
    for (var i = 0; i < SHOPS.length; i++) if (SHOPS[i].list && !S.bought[SHOPS[i].id]) all = false;
    if (all && shop.list) { say([['tove', 'NÅ HAR ME ALT PÅ LISTA! DA TAR ME TRIKKEN HJEM.']], 'alt'); S.finish = true; }
  }

  function stepRide() {
    var R0 = S.ride, r = S.funi;
    R0.t++;
    var u = Math.min(1, R0.t / 200), s = R0.from + (R0.to - R0.from) * (0.5 - Math.cos(Math.PI * u) / 2), p = at(r, s);
    S.cx += (p.x - VW / 2 - S.cx) * 0.15; S.cy += (p.y - VH / 2 - S.cy) * 0.15;
    clampCam();
    R0.s = s;
    if (R0.t === 100 && !S.said.funi) { S.said.funi = true; say([['tove', 'DET E SÅ BRATT!'], ['me', 'LANOVKA. MYE BEDRE ENN Å GÅ.']]); }
    if (u >= 1) {
      var end = at(r, R0.to);
      S.x = Math.round(end.x) + (R0.to ? -4 : 0); S.y = Math.round(end.y) + (R0.to ? 6 : 6);
      for (var k = 0; k < 12 && !walkable(S.x, S.y); k++) S.y++;
      S.trail = [];
      for (var i = 0; i < 20; i++) S.trail.push([S.x, S.y]);
      S.ride = null;
      S.phase = 'walk';
    }
  }

  // ---------------------------------------------------------------- drawing
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  // The two of them, five pixels wide and eight high.
  var FIG = {
    me: { rows: ['.CCC.', '.SSS.', '.SWS.', 'RRRRR', 'SRRRS', '.OOO.'], pal: { C: '#c8302c', S: '#f8c088', W: '#f4f4f4', R: '#1a62f0', O: '#1c1c22' } },
    tove: { rows: ['.YYY.', 'YSSSY', 'YSSSY', 'CCCCC', 'SCCCS', '.LLL.'], pal: { Y: '#f0d070', S: '#f8c088', C: '#c8304a', L: '#2a3448' } }
  };
  function drawFig(ctx, who, x, y, walking) {
    var f = FIG[who], x0 = Math.round(x) - 2, y0 = Math.round(y) - 8;
    for (var r = 0; r < f.rows.length; r++) for (var c = 0; c < 5; c++) {
      var ch = f.rows[r][c];
      if (ch !== '.') rect(ctx, x0 + c, y0 + r, 1, 1, f.pal[ch]);
    }
    var leg = who === 'me' ? '#1c1c22' : '#2a3448', ph = walking ? (S.step >> 3) % 2 : 0;
    rect(ctx, x0 + 1 + (ph ? 0 : 0), y0 + 6, 1, ph ? 1 : 2, leg); rect(ctx, x0 + 3, y0 + 6, 1, ph ? 2 : 1, leg);
    rect(ctx, x0 + 1, y0 + (ph ? 7 : 8), 1, 1, '#3a2010'); rect(ctx, x0 + 3, y0 + (ph ? 8 : 7), 1, 1, '#3a2010');
  }

  function drawVehicle(ctx, v, body, top, w) {
    var head = at(v.r, v.s);
    for (var k = v.len; k >= 0; k--) {
      var p = at(v.r, v.s - v.dir * k);
      rect(ctx, p.x - S.cx - w / 2, p.y - S.cy - w / 2, w, w, body);
    }
    for (k = v.len - 1; k >= 1; k--) {
      if (top && k !== Math.round(v.len / 2)) { var q = at(v.r, v.s - v.dir * k); rect(ctx, q.x - S.cx - (w - 2) / 2, q.y - S.cy - (w - 2) / 2, w - 2, w - 2, top); }
    }
    rect(ctx, head.x - S.cx - 1, head.y - S.cy - 1, 2, 2, '#3a3a3a');
  }

  function inView(x, y, m) { return x > S.cx - m && x < S.cx + VW + m && y > S.cy - m && y < S.cy + VH + m; }

  // little signs over the shops, bobbing, so one can find them
  var ICONS = {
    sock: [['.RR..', '.RR..', '.RW..', '.RR..', 'RRR..', 'RRR..'], { R: '#c82020', W: '#f4f4f4' }],
    glass: [['.BBB.', '..B..', '.BBB.', 'BbBBB', 'BBBbB', '.BBB.'], { B: '#2a5ad8', b: '#a8d0ff' }],
    puppet: [['L...L', '.L.L.', '..K..', '.KKK.', 'K.K.K', '.K.K.'], { L: '#a8a8a8', K: '#3a2a2a' }],
    ring: [['..R..', '.GRG.', 'G...G', 'G...G', '.GGG.', '.....'], { R: '#c81838', G: '#e8c040' }],
    cake: [['.CCC.', 'CcCcC', 'CCCCC', 'CcCcC', 'CCCCC', '.WWW.'], { C: '#b8783a', c: '#e8c070', W: '#f4f4f4' }],
    beer: [['WWWW.', 'AaAAB', 'AaAA.', 'AaAAB', 'AAAA.', '.....'], { W: '#ffffff', A: '#d08a28', a: '#f4c868', B: '#8a8a8a' }]
  };
  function drawIcon(ctx, name, x, y, lit) {
    var ic = ICONS[name];
    if (lit) rect(ctx, x - 5, y - 2, 11, 11, '#ffe060');
    rect(ctx, x - 4, y - 1, 9, 8, '#f0e4cc'); rect(ctx, x - 4, y + 7, 9, 1, '#2a2a2a');
    for (var r = 0; r < ic[0].length; r++) for (var c = 0; c < 5; c++) if (ic[0][r][c] !== '.') rect(ctx, x - 2 + c, y + r, 1, 1, ic[1][ic[0][r][c]]);
  }

  function draw(ctx) {
    var i, p, x, y;
    var cx = Math.round(S.cx), cy = Math.round(S.cy);
    S.cx = cx; S.cy = cy;
    // a beer or two and the whole town sways
    var ox = Math.round(Math.sin(S.t / 50) * 1.4 * S.tipsy), oy = Math.round(Math.sin(S.t / 67) * 0.9 * S.tipsy);
    ctx.save();
    ctx.translate(ox, oy);
    var sx0 = Math.max(0, cx - 8), sy0 = Math.max(0, cy - 8), sx1 = Math.min(MW, cx + VW + 8), sy1 = Math.min(MH, cy + VH + 8);
    if (S.tipsy > 0) { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-8, -8, VW + 16, VH + 16); }
    ctx.drawImage(map, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0 - cx, sy0 - cy, sx1 - sx0, sy1 - sy0);
    // the river glitters
    for (i = 0; i < 60; i++) {
      x = cx + Math.floor(hash(i, Math.floor(S.t / 20)) * VW); y = cy + Math.floor(hash(Math.floor(S.t / 20), i + 99) * VH);
      if (zone(x, y) === WATER && zone(x + 1, y) === WATER && zone(x - 1, y) === WATER) rect(ctx, x - cx, y - cy, 2, 1, '#9ad0f0');
    }
    // boats, which go under the bridges
    for (i = 0; i < S.boats.length; i++) {
      var b = S.boats[i];
      for (var k = 0; k <= b.len; k++) {
        p = at(b.r, b.s - b.dir * k);
        for (var w = -1; w <= 1; w++) {
          x = Math.round(p.x) + w; y = Math.round(p.y);
          if (zone(x, y) === WATER && inView(x, y, 0)) rect(ctx, x - cx, y - cy, 1, 1, k < 2 || w ? '#f4f4f0' : (k % 3 ? '#3a4a6a' : '#f4f4f0'));
        }
      }
      var wake = at(b.r, b.s - b.dir * (b.len + 3));
      if (zone(wake.x, wake.y) === WATER) rect(ctx, wake.x - cx, wake.y - cy, 2, 1, '#c8e8f8');
    }
    for (i = 0; i < S.swans.length; i++) {
      var sw = S.swans[i];
      x = sw.x + Math.round(Math.sin(S.t / 90 + sw.ph) * 4); y = sw.y + Math.round(Math.sin(S.t / 60 + sw.ph));
      rect(ctx, x - cx, y - cy, 3, 2, '#ffffff'); rect(ctx, x - cx + 2, y - cy - 1, 1, 1, '#ffffff'); rect(ctx, x - cx + 3, y - cy - 1, 1, 1, '#f08020');
    }
    // the funicular: two cars on one cable, passing halfway
    var fs = S.ride ? S.ride.s : S.funi.len * (0.5 - Math.cos(S.t / 300) / 2);
    var cars2 = [fs, S.funi.len - fs];
    for (i = 0; i < 2; i++) { p = at(S.funi, cars2[i]); rect(ctx, p.x - cx - 2, p.y - cy - 2, 5, 4, i ? '#c82020' : '#d83030'); rect(ctx, p.x - cx - 1, p.y - cy - 1, 3, 1, '#f0e8d0'); }
    // the metronome's arm
    var ang = Math.sin(S.t / 50) * 0.7;
    for (i = 0; i < 26; i++) rect(ctx, 566 + Math.sin(ang) * i - cx, 28 - Math.cos(ang) * i - cy, 2, 1, '#c83020');
    for (i = 0; i < S.cars.length; i++) {
      var c = S.cars[i], cp = at(c.r, c.s);
      if (inView(cp.x, cp.y, 10)) drawVehicle(ctx, c, c.col, null, 3);
    }
    for (i = 0; i < S.trams.length; i++) {
      var tp = at(S.trams[i].r, S.trams[i].s);
      if (inView(tp.x, tp.y, 30)) drawVehicle(ctx, S.trams[i], '#c82020', '#f0e8d0', 4);
    }
    if (S.phase === 'tram') drawVehicle(ctx, { r: S.arrive.r, s: S.arrive.s, dir: -1, len: 18 }, '#c82020', '#f0e8d0', 4);
    for (i = 0; i < S.tourists.length; i++) {
      var tt = S.tourists[i];
      if (!inView(tt.x, tt.y, 2)) continue;
      rect(ctx, tt.x - cx, tt.y - cy - 2, 1, 1, '#f0c090'); rect(ctx, tt.x - cx, tt.y - cy - 1, 1, 2, tt.col);
    }
    if (S.ding > 0) F.outline(ctx, 'DING DONG!', 590 - cx, 186 - cy - (S.ding >> 3), '#ffe060', 1, '#000');
    // the shops
    for (i = 0; i < SHOPS.length; i++) {
      var sh = SHOPS[i];
      if (sh.list && S.bought[sh.id]) continue;
      if (!inView(sh.x, sh.y, 30)) continue;
      var lit = S.near === sh && S.phase === 'walk', iy = sh.y - cy - SIGN + (lit ? 0 : Math.round(Math.sin(S.t / 10 + i) * 1.5));
      rect(ctx, sh.x - cx, iy + 8, 1, sh.y - cy - iy - 8, '#6a5a48');      // the post down to the shop itself
      drawIcon(ctx, sh.icon, sh.x - cx, iy, lit);
    }
    // Tove, a few steps behind, and Magnio
    if (S.phase !== 'tram' && S.phase !== 'ride' || (S.phase === 'tram' && S.t > 40)) {
      var tv = S.trail[Math.max(0, S.trail.length - 14)] || [S.x, S.y];
      drawFig(ctx, 'tove', tv[0] - cx, tv[1] - cy, S.moving);
      drawFig(ctx, 'me', S.x - cx, S.y - cy, S.moving);
    }
    drawBits(ctx);
    ctx.restore();
    if (S.tipsy > 0) {
      // seeing double, and everything a little golden
      if (S.tipsy > 1) {
        ctx.globalAlpha = Math.min(0.35, (S.tipsy - 1) * 0.15);
        ctx.drawImage(ctx.canvas, 0, 0, VW, VH, Math.round(3 + Math.sin(S.t / 37) * S.tipsy * 1.5), 0, VW, VH);
        ctx.globalAlpha = 1;
      }
      rect(ctx, 0, 0, VW, VH, 'rgba(255,190,80,' + Math.min(0.14, S.tipsy * 0.035) + ')');
    }
    // what they say stays readable, however many beers
    ctx.save();
    ctx.translate(ox, oy);
    drawSaying(ctx);
    ctx.restore();
    drawHud(ctx);
    drawFx(ctx);
  }

  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      if (cur && (cur + ' ' + words[i]).length > n) { lines.push(cur); cur = words[i]; } else cur = cur ? cur + ' ' + words[i] : words[i];
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function drawSaying(ctx) {
    if (!S.say) return;
    var tv = S.trail[Math.max(0, S.trail.length - 14)] || [S.x, S.y];
    var wx = S.say.who === 'tove' ? tv[0] : S.x, wy = S.say.who === 'tove' ? tv[1] : S.y;
    if (S.phase === 'ride' || S.phase === 'tram') { var pp = S.phase === 'ride' ? at(S.funi, S.ride.s) : at(S.arrive.r, S.arrive.s); wx = pp.x; wy = pp.y; }
    var lines = wrap(S.say.text, 24), w = 0, i;
    for (i = 0; i < lines.length; i++) w = Math.max(w, F.width(lines[i]));
    var bw = w + 8, bh = lines.length * 9 + 5, ax = Math.round(wx - S.cx), ay = Math.round(wy - S.cy) - 11;
    var bx = Math.max(2, Math.min(VW - bw - 2, ax - Math.round(bw / 2))), by = ay - bh - 3;
    if (by < 14) by = ay + 16;
    rect(ctx, bx - 1, by - 1, bw + 2, bh + 2, '#1a1a1a');
    rect(ctx, bx, by, bw, bh, '#fffaf0');
    if (by < ay) { rect(ctx, ax - 1, by + bh + 1, 3, 2, '#1a1a1a'); rect(ctx, ax, by + bh, 1, 3, '#fffaf0'); }
    for (i = 0; i < lines.length; i++) F.draw(ctx, lines[i], bx + 4, by + 3 + i * 9, S.say.who === 'tove' ? '#a01e4a' : '#1a2a6a');
  }

  // Where they are, in Czech, as the street signs have it.
  function place() {
    var z = zone(S.x, S.y), x = S.x, y = S.y;
    if (z === KARLUV) return 'KARLŮV MOST';
    if (z === RAIL && y > 380 && y < 392 && x > 430 && x < 552) return 'MOST LEGIÍ';
    if (z === BRIDGE) return 'MOST';
    if (z === SQUARE && x > 604 && x < 670 && y > 192 && y < 250) return 'STAROMĚSTSKÉ NÁMĚSTÍ';
    if (z === SQUARE && x > 695 && y > 325 && y < 475) return 'VÁCLAVSKÉ NÁMĚSTÍ';
    if (y < 46 || (x > 380 && x < 470 && y < 150 && z === PARK)) return 'LETNÁ';
    if (x < 380 && y < 205) return 'PRAŽSKÝ HRAD';
    if (x < 440 && y > 225 && (z === PARK || z === PATH)) return x > 420 && y < 370 ? 'KAMPA' : 'PETŘÍN';
    if (x < 447) return 'MALÁ STRANA';
    if (x < 650 && y < 192) return 'JOSEFOV';
    if (y > oldTownEdge(x)) return 'NOVÉ MĚSTO';
    return 'STARÉ MĚSTO';
  }

  function check(ctx, x, y, on) {
    rect(ctx, x, y, 7, 7, '#fffaf0'); rect(ctx, x + 1, y + 1, 5, 5, '#3a3a3a'); rect(ctx, x + 2, y + 2, 3, 3, '#fffaf0');
    if (on) { rect(ctx, x + 1, y + 3, 1, 2, '#2a9a3a'); rect(ctx, x + 2, y + 4, 1, 2, '#2a9a3a'); rect(ctx, x + 3, y + 2, 1, 3, '#2a9a3a'); rect(ctx, x + 4, y + 1, 1, 2, '#2a9a3a'); rect(ctx, x + 5, y, 1, 2, '#2a9a3a'); }
  }

  function drawHud(ctx) {
    var i;
    if (S.phase === 'tram') {
      F.outline(ctx, 'PRAHA', Math.round((VW - F.width('PRAHA', 3)) / 2), 24, '#ffe060', 3, '#000');
      F.outline(ctx, 'PÅ KRYSS OG TVERS', Math.round((VW - F.width('PÅ KRYSS OG TVERS', 2)) / 2), 52, '#ffffff', 2, '#000');
      return;
    }
    var name = S.phase === 'ride' ? 'LANOVKA NA PETŘÍN' : place();
    rect(ctx, 0, 0, F.width(name) + 10, 13, 'rgba(20,24,40,0.8)');
    F.draw(ctx, name, 5, 4, '#ffffff');
    var kr = env.coins() + ' KR';
    rect(ctx, 0, 13, F.width(kr) + 10, 11, 'rgba(20,24,40,0.8)');
    F.draw(ctx, kr, 5, 15, '#ffe060');
    // Tove's list
    var list = SHOPS.filter(function (s) { return s.list; });
    var lw = 124, lx = VW - lw - 2, ly = 2;
    rect(ctx, lx, ly, lw, 12 + list.length * 10, 'rgba(255,250,240,0.92)');
    rect(ctx, lx, ly, lw, 1, '#c8304a');
    F.draw(ctx, 'TOVES LISTE', lx + 4, ly + 3, '#a01e4a');
    for (i = 0; i < list.length; i++) {
      var done = !!S.bought[list[i].id] && !S.flying[list[i].id];
      check(ctx, lx + 4, ly + 12 + i * 10, done);
      F.draw(ctx, list[i].name, lx + 14, ly + 12 + i * 10, done ? '#8a8a8a' : '#2a2a2a');
      if (done) rect(ctx, lx + 14, ly + 15 + i * 10, F.width(list[i].name), 1, '#8a8a8a');
    }
    // what one can do
    var hint = null;
    if (S.phase === 'ask') hint = 'TA TRIKKEN HJEM?   ' + X + ' JA   □ NEI';
    else if (S.phase === 'walk' && S.near) hint = S.near.price !== undefined ? X + ' KJØP ' + S.near.name + ' (' + S.near.price + ' KR)' : X + ' TA LANOVKA ' + S.near.name;
    if (hint) { rect(ctx, 0, VH - 14, VW, 14, 'rgba(20,24,40,0.88)'); F.draw(ctx, hint, Math.round((VW - F.width(hint)) / 2), VH - 10, '#ffffff'); }
    else if (S.phase === 'walk') F.outline(ctx, '□ HJEM', VW - F.width('□ HJEM') - 4, VH - 10, '#ffffff', 1, '#000');
    if (S.phase === 'leave') drawLeave(ctx);
  }

  // ---------------------------------------------------------------- what buying looks like
  // The thing bought pops up over Magnio. What is on Tove's list then flies
  // up into the list and gets ticked off; what is eaten or drunk comes with
  // a NAM! or a SKÅL!, sugar or foam, and the beer makes him tipsy for a while.
  var LIST_X = VW - 124 - 2, LIST_Y = 2;
  function bought(shop) {
    var row = SHOPS.filter(function (s) { return s.list; }).indexOf(shop);
    var from = [S.x - S.cx, S.y - S.cy - 14];
    S.fx.push({ icon: shop.icon, id: shop.id, x0: from[0], y0: from[1], to: row >= 0 ? [LIST_X + 7, LIST_Y + 12 + row * 10] : null, t: 0 });
    if (row >= 0) S.flying[shop.id] = true;
    if (shop.id === 'ol') {
      S.tipsy = Math.min(4, S.tipsy + 1);
      pop('SKÅL!', '#ffe060');
      burst(['#fff8e0', '#f4f0d8', '#e8c060'], 16);
      AU.sfx('gulp');
    } else if (shop.id === 'trdelnik') {
      pop('NAM!', '#ffe060');
      burst(['#f8f0d0', '#e8c070', '#ffffff'], 12);
    }
  }
  function pop(text, col) { S.bits.push({ text: text, col: col, x: S.x, y: S.y - 16, vx: 0, vy: -0.4, life: 60 }); }
  function burst(cols, n) {
    for (var i = 0; i < n; i++) {
      S.bits.push({ col: cols[i % cols.length], x: S.x + (Math.random() - 0.5) * 4, y: S.y - 8,
        vx: (Math.random() - 0.5) * 1.2, vy: -0.6 - Math.random() * 1.2, g: 0.04, life: 30 + Math.random() * 20 });
    }
  }
  function stepFx() {
    var i;
    if (S.tipsy > 0) S.tipsy = Math.max(0, S.tipsy - 1 / 1500);   // each beer wears off in about 25 seconds
    for (i = 0; i < S.bits.length; i++) { var b = S.bits[i]; b.x += b.vx; b.y += b.vy; b.vy += b.g || 0; b.life--; }
    S.bits = S.bits.filter(function (q) { return q.life > 0; });
    for (i = 0; i < S.fx.length; i++) {
      var f = S.fx[i];
      f.t++;
      if (f.to && f.t === 50) { delete S.flying[f.id]; AU.sfx('talk'); }
    }
    S.fx = S.fx.filter(function (q) { return q.t < (q.to ? 50 : 60); });
  }
  function drawBits(ctx) {
    for (var i = 0; i < S.bits.length; i++) {
      var b = S.bits[i];
      if (b.text) F.outline(ctx, b.text, Math.round(b.x - S.cx - F.width(b.text) / 2), Math.round(b.y - S.cy - 10), b.col, 1, '#000');
      else rect(ctx, b.x - S.cx, b.y - S.cy, 1, 1, b.col);
    }
  }
  function drawFx(ctx) {
    for (var i = 0; i < S.fx.length; i++) {
      var f = S.fx[i], x, y;
      if (f.t < 16) { x = f.x0; y = f.y0 - f.t * 0.8; }                // up out of the shop
      else if (f.to) {                                                 // and then away to the list
        var u = Math.min(1, (f.t - 16) / 34), e = u * u * (3 - 2 * u);
        x = f.x0 + (f.to[0] - f.x0) * e; y = f.y0 - 12 + (f.to[1] - f.y0 + 12) * e - Math.sin(Math.PI * u) * 20;
      } else { x = f.x0; y = f.y0 - 12 - (f.t - 16) * 0.2; if ((f.t >> 2) % 2 && f.t > 44) continue; }
      drawIcon(ctx, f.icon, Math.round(x), Math.round(y));
    }
  }

  function drawLeave(ctx) {
    var a = Math.min(0.85, S.t / 40);
    rect(ctx, 0, 0, VW, VH, 'rgba(10,14,30,' + a + ')');
    if (S.t < 30) return;
    var got = SHOPS.filter(function (s) { return S.bought[s.id]; }), i;
    var lines = [S.happy ? 'ALT PÅ LISTA!' : 'MED TRIKKEN HJEM.'];
    if (!got.length) lines.push('DE KJØPTE INGENTING, MEN DE GIKK GODT.');
    for (i = 0; i < got.length; i++) lines.push(got[i].name + (S.bought[got[i].id] > 1 ? ' X' + S.bought[got[i].id] : ''));
    var top = S.happy ? 16 : 30, first = S.happy ? 66 : 60;
    F.outline(ctx, lines[0], Math.round((VW - F.width(lines[0], 2)) / 2), top, '#ffe060', 2, '#000');
    if (S.happy) {
      // pleased with the day, one after the other
      var said = [['TOVE', 'FOR EN FIN HANDLETUR! GUTTENE BLI SÅ GLADE.', '#ff9ab8', 50],
        ['MAGNIO', 'I ER GODT FORNØYD, I OGSÅ.', '#9ac8ff', 110]];
      for (i = 0; i < said.length; i++) {
        if (S.t < said[i][3]) continue;
        var t = said[i][0] + ': ' + said[i][1];
        F.draw(ctx, t, Math.round((VW - F.width(t)) / 2), 40 + i * 11, said[i][2]);
      }
      for (i = 0; i < 10; i++) {                                         // and a few hearts going up
        var hy = 150 - ((S.t * 0.6 + i * 37) % 130), hx = 20 + (i * 71) % (VW - 40) + Math.sin(S.t / 20 + i) * 4;
        rect(ctx, hx, hy, 2, 2, '#e84a6a'); rect(ctx, hx + 3, hy, 2, 2, '#e84a6a'); rect(ctx, hx, hy + 1, 5, 2, '#e84a6a'); rect(ctx, hx + 1, hy + 3, 3, 1, '#e84a6a'); rect(ctx, hx + 2, hy + 4, 1, 1, '#e84a6a');
      }
    }
    for (i = 1; i < lines.length; i++) {
      var lw = F.width(lines[i]), lx = Math.round((VW - lw) / 2), ly = first + (i - 1) * 12;
      F.draw(ctx, lines[i], lx, ly, '#ffffff');
      if (S.happy && got[i - 1].list) check(ctx, lx - 11, ly, true);
    }
    // and off they go
    var tram = A.decor.trikk, tx = -tram.width + (S.t - 30) * 1.6;
    rect(ctx, 0, 186, VW, 2, '#5a5650');
    ctx.drawImage(tram, Math.round(tx), 186 - tram.height + 2);
    var wy = 186 - tram.height + 2 + 12;                                 // the faces in the first two windows
    rect(ctx, Math.round(tx) + 8, wy + 3, 5, 5, '#f8c088'); rect(ctx, Math.round(tx) + 8, wy + 1, 6, 2, '#c8302c'); rect(ctx, Math.round(tx) + 9, wy + 6, 3, 1, '#f4f4f4');
    rect(ctx, Math.round(tx) + 20, wy + 3, 5, 5, '#f8c088'); rect(ctx, Math.round(tx) + 19, wy + 1, 7, 2, '#f0d070'); rect(ctx, Math.round(tx) + 19, wy + 3, 1, 5, '#f0d070'); rect(ctx, Math.round(tx) + 25, wy + 3, 1, 5, '#f0d070');
    if (S.t > 90 && !S.happy && (S.t >> 5) & 1) F.draw(ctx, X, VW - 14, VH - 12, '#ffffff');
    if (S.t > 90 && S.happy) F.outline(ctx, X + ' TILBAKE TIL PRAHA', 6, VH - 12, '#ffffff', 1, '#000');
  }

  SM.city = { start: start, step: step, draw: draw, state: function () { return S; }, map: function () { build(); return map; }, walkable: walkable, checkRoutes: checkRoutes }; // state is for poking at from the console
})();
