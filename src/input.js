// Keyboard and gamepad input. Every keyboard layout and every connected
// controller is a "device" with the same set of buttons, so the game does
// not care which one a player is holding.
(function () {
  var SM = window.SM = window.SM || {};

  var keys = {};
  var PREVENT = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1, Tab: 1 };
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (PREVENT[e.code]) e.preventDefault();
    if (SM.audio) SM.audio.resume();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  window.addEventListener('pointerdown', function () { if (SM.audio) SM.audio.resume(); });

  var KEYBOARDS = [
    { id: 'kb1', left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
      jump: ['KeyZ', 'Space'], fire: ['KeyX'], start: ['Enter', 'Escape'] },
    { id: 'kb2', left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
      jump: ['KeyG'], fire: ['KeyH'], start: [] }
  ];
  var BUTTONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'start'];

  // A stick has to be pushed well past the middle before it counts, so a
  // shaky hand resting on it does not walk the character around.
  var STICK = 0.45;

  var devices = {};

  function anyKey(list) {
    for (var i = 0; i < list.length; i++) if (keys[list[i]]) return true;
    return false;
  }

  function update(id, raw) {
    var d = devices[id];
    if (!d) {
      d = devices[id] = { id: id };
      for (var j = 0; j < BUTTONS.length; j++) d[BUTTONS[j]] = false;
    }
    d.anyP = false;
    for (var i = 0; i < BUTTONS.length; i++) {
      var b = BUTTONS[i], now = !!raw[b];
      d[b + 'P'] = now && !d[b];
      if (d[b + 'P']) d.anyP = true;
      d[b] = now;
    }
  }

  // Standard mapping: 0 ✕, 1 ○, 2 □, 3 △, 4/5 L1/R1, 6/7 L2/R2, 9 Options, 12-15 d-pad.
  // Jump is on ✕ and ○, △ (or up) talks to people, and □ or any shoulder
  // button blows smoke.
  function padRaw(gp) {
    var b = gp.buttons, a = gp.axes;
    function bp(i) { var x = b[i]; return !!x && (x.pressed || x.value > 0.5); }
    var ax = a[0] || 0, ay = a[1] || 0;
    return {
      left: bp(14) || ax < -STICK,
      right: bp(15) || ax > STICK,
      up: bp(12) || bp(3) || ay < -0.6,
      down: bp(13) || ay > 0.6,
      jump: bp(0) || bp(1),
      fire: bp(2) || bp(4) || bp(5) || bp(6) || bp(7),
      start: bp(9)
    };
  }

  function poll() {
    for (var i = 0; i < KEYBOARDS.length; i++) {
      var k = KEYBOARDS[i], raw = {};
      for (var j = 0; j < BUTTONS.length; j++) raw[BUTTONS[j]] = anyKey(k[BUTTONS[j]]);
      update(k.id, raw);
    }
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var seen = {};
    for (var p = 0; p < pads.length; p++) {
      var gp = pads[p];
      if (!gp || !gp.connected) continue;
      var id = 'pad' + gp.index;
      seen[id] = true;
      update(id, padRaw(gp));
    }
    for (var key in devices) {
      if (key.indexOf('pad') === 0 && !seen[key]) delete devices[key];
    }
  }

  SM.input = { poll: poll, devices: devices };
})();
