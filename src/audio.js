// Chiptune sound effects and an original background tune, synthesised with
// Web Audio, so there are no sound files to load.
(function () {
  var SM = window.SM = window.SM || {};

  var ctx = null, master, musicFilter, musicBus, sfxBus, pulse25, pulse50, noiseBuf;
  var musicOn = true, playing = false, paused = false, fast = false, step = 0, nextT = 0;
  // ?stille in the address turns all sound off, for testing without noise.
  var muted = /[?&]stille\b/.test(location.search);

  function init() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(ctx.destination);
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass'; musicFilter.frequency.value = 2600; musicFilter.Q.value = 0.7;
    musicFilter.connect(master);
    freshBus();
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    pulse25 = makePulse(0.25);
    pulse50 = makePulse(0.5);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  // Every tune plays through a bus of its own. When another tune starts (or
  // the same one from the top), the notes already sounding from the last one,
  // like the long chord underneath, fade out in a few hundredths of a
  // second instead of clashing with the new ones.
  function freshBus() {
    if (musicBus) {
      var old = musicBus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(function () { old.disconnect(); }, 500);
    }
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(musicFilter);
  }

  // Pulse wave with the given duty cycle, the classic NES sound.
  function makePulse(duty) {
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }

  // Browsers keep audio off until the page gets a click or key press.
  function resume() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  function osc(wave, f0, f1, t, dur, vol, bus, sustain) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    if (sustain) g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(t, dur, vol, freq, bus, type) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = type || 'bandpass';
    f.frequency.value = freq || 1000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nf(n) {
    var m = /^([A-G])(#?)(\d)$/.exec(n);
    var midi = (+m[3] + 1) * 12 + SEMI[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function seq(notes, t, gap, dur, vol) {
    for (var i = 0; i < notes.length; i++) osc(pulse25, nf(notes[i]), 0, t + i * gap, dur, vol, sfxBus);
  }

  var SFX = {
    jump: function (t) { osc(pulse25, 220, 660, t, 0.16, 0.22, sfxBus); },
    coin: function (t) { osc(pulse25, nf('B5'), 0, t, 0.08, 0.2, sfxBus); osc(pulse25, nf('E6'), 0, t + 0.07, 0.3, 0.2, sfxBus); },
    stomp: function (t) { osc('square', 300, 80, t, 0.12, 0.22, sfxBus); },
    bump: function (t) { osc('triangle', 160, 90, t, 0.1, 0.5, sfxBus); },
    brk: function (t) { noise(t, 0.25, 0.5, 600, sfxBus, 'lowpass'); osc('square', 120, 50, t, 0.15, 0.15, sfxBus); },
    sprout: function (t) { for (var i = 0; i < 6; i++) osc(pulse50, 200 + i * 80, 0, t + i * 0.04, 0.05, 0.12, sfxBus); },
    power: function (t) { seq(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'], t, 0.05, 0.08, 0.18); },
    down: function (t) { seq(['C6', 'G5', 'E5', 'C5', 'G4'], t, 0.07, 0.09, 0.18); },
    puff: function (t) { noise(t, 0.18, 0.35, 900, sfxBus, 'bandpass'); },
    kick: function (t) { osc('square', 500, 150, t, 0.1, 0.2, sfxBus); },
    bell: function (t) { for (var i = 0; i < 3; i++) osc(pulse50, 1320, 0, t + i * 0.22, 0.5, 0.15, sfxBus); },
    rotor: function (t) { noise(t, 0.08, 0.12, 180, sfxBus, 'lowpass'); },
    punch: function (t) { noise(t, 0.12, 0.6, 500, sfxBus, 'lowpass'); osc('square', 180, 60, t, 0.12, 0.25, sfxBus); },
    hurt: function (t) { osc(pulse50, 400, 150, t, 0.3, 0.2, sfxBus); },
    fall: function (t) { osc(pulse25, 700, 200, t, 0.5, 0.15, sfxBus); },
    splash: function (t) { noise(t, 0.35, 0.45, 1200, sfxBus, 'bandpass'); noise(t + 0.05, 0.25, 0.2, 3000, sfxBus, 'highpass'); },
    join: function (t) { seq(['G5', 'C6', 'E6'], t, 0.08, 0.12, 0.2); },
    pause: function (t) { seq(['E6', 'C6', 'E6', 'C6'], t, 0.07, 0.06, 0.15); },
    flag: function (t) { osc(pulse25, 1400, 300, t, 1.0, 0.15, sfxBus); },
    boom: function (t) { noise(t, 0.5, 0.6, 400, sfxBus, 'lowpass'); },
    talk: function (t) { osc(pulse50, 660, 0, t, 0.04, 0.12, sfxBus); osc(pulse50, 880, 0, t + 0.05, 0.04, 0.1, sfxBus); },
    cut: function (t) { noise(t, 0.06, 0.18, 2600, sfxBus, 'bandpass'); },
    gulp: function (t) { osc('triangle', 220, 50, t, 0.7, 0.6, sfxBus); noise(t, 0.6, 0.3, 300, sfxBus, 'lowpass'); },
    spout: function (t) { noise(t, 1.2, 0.5, 1500, sfxBus, 'bandpass'); osc(pulse25, 200, 1200, t, 0.8, 0.12, sfxBus); },
    clear: function (t) {
      var mel = [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2], ['G5', 1], ['C6', 4]];
      for (var i = 0; i < mel.length; i++) {
        var d = mel[i][1] * 0.13;
        osc(pulse25, nf(mel[i][0]), 0, t, d + 0.05, 0.2, sfxBus, true);
        osc('triangle', nf(mel[i][0]) / 4, 0, t, d + 0.05, 0.4, sfxBus, true);
        t += d;
      }
    }
  };

  function sfx(name) {
    if (!init() || ctx.state !== 'running') return;
    var f = SFX[name];
    if (f) f(ctx.currentTime + 0.005);
  }

  // ---------------------------------------------------------------- music
  // Nine original tunes. Each bar is a chord plus eight eighth-note tokens
  // for the melody: a note, '-' to hold the one before, or '.' for a rest.
  // The melody is played with soft triangle and sine tones over a quiet bass
  // and chord pad, and everything goes through a low-pass filter so nothing
  // sounds sharp. swing pushes every second eighth a little late, by that
  // fraction of a step, which makes a tune shuffle.
  var CHORD = {
    G: { bass: ['G2', 'D3'], pad: ['G3', 'B3', 'D4'] },
    C: { bass: ['C3', 'G2'], pad: ['G3', 'C4', 'E4'] },
    D: { bass: ['D3', 'A2'], pad: ['F#3', 'A3', 'D4'] },
    Em: { bass: ['E2', 'B2'], pad: ['G3', 'B3', 'E4'] },
    Am: { bass: ['A2', 'E3'], pad: ['A3', 'C4', 'E4'] },
    F: { bass: ['F2', 'C3'], pad: ['F3', 'A3', 'C4'] },
    Dm: { bass: ['D3', 'A2'], pad: ['F3', 'A3', 'D4'] },
    E: { bass: ['E2', 'B2'], pad: ['G#3', 'B3', 'E4'] },
    A: { bass: ['A2', 'E3'], pad: ['A3', 'C#4', 'E4'] },
    B: { bass: ['B2', 'F#2'], pad: ['B3', 'D#4', 'F#4'] }
  };
  var SONGS = {
    // Folksy but with a bit of groove, for the map and most levels: a
    // syncopated bass, light drums, chord stabs and a slight swing. Two
    // halves, a little under a minute.
    main: { bpm: 122, lead: 'warm', bass: 'groove', perc: 'light', stabs: true, swing: 0.16, bars: [
      ['G', 'D5 - B4 - G4 - B4 D5'], ['C', 'E5 - - D5 C5 - E5 -'], ['G', 'D5 - B4 G4 A4 B4 D5 -'], ['D', 'A4 - - - F#4 - A4 -'],
      ['G', 'D5 - B4 - G4 - B4 D5'], ['C', 'G5 - E5 - C5 - E5 G5'], ['D', 'F#5 - E5 D5 C5 - A4 -'], ['G', 'G4 - - - - - . .'],
      ['Em', 'B4 - E5 - G5 - E5 -'], ['C', 'C5 - E5 - G5 - E5 -'], ['G', 'D5 - G5 - B4 - D5 -'], ['D', 'A4 - F#4 - D5 - . .'],
      ['Em', 'B4 - E5 G5 F#5 E5 D5 B4'], ['C', 'C5 - E5 G5 F#5 E5 C5 A4'], ['D', 'D5 - - E5 F#5 - A5 -'], ['D', 'F#5 - - - E5 - D5 -']
    ] },
    // Slow and dreamy, inside the whale.
    hval: { bpm: 80, lead: 'glass', bass: 'half', perc: false, bars: [
      ['Am', 'A4 - - - C5 - E5 -'], ['F', 'F5 - - - E5 - C5 -'], ['Dm', 'D5 - - - F5 - A5 -'], ['E', 'G#5 - - - E5 - - -'],
      ['Am', 'A5 - - - G5 - E5 -'], ['F', 'F5 - E5 - D5 - C5 -'], ['E', 'B4 - - - G#4 - B4 -'], ['Am', 'A4 - - - - - . .']
    ] },
    // Driving, for the boxing match.
    boks: { bpm: 132, lead: 'punchy', bass: 'drive', perc: true, bars: [
      ['Em', 'E5 - E5 G5 - E5 D5 -'], ['Em', 'E5 - - B4 D5 - E5 -'], ['C', 'G5 - G5 E5 - G5 A5 -'], ['D', 'F#5 - - D5 - - . .'],
      ['Em', 'E5 - E5 G5 - E5 D5 -'], ['Em', 'E5 - - B4 D5 - E5 -'], ['C', 'G5 - A5 - B5 - A5 G5'], ['B', 'F#5 - D#5 - B4 - . .']
    ] },
    // Bright and quick, for the drive round Harøya.
    bil: { bpm: 138, lead: 'punchy', bass: 'drive', perc: true, bars: [
      ['D', 'A4 - D5 - F#5 - E5 D5'], ['G', 'B4 - D5 - G5 - F#5 E5'], ['A', 'E5 - C#5 - A4 - B4 C#5'], ['D', 'D5 - - - A4 - . .'],
      ['D', 'F#5 - A5 - F#5 - E5 D5'], ['G', 'G5 - B5 - G5 - F#5 E5'], ['A', 'E5 F#5 G5 - F#5 - E5 -'], ['D', 'D5 - - - - - . .']
    ] },
    // Dramatic and driving, like a game show, for the quiz.
    quiz: { bpm: 120, lead: 'punchy', bass: 'drive', perc: true, bars: [
      ['Am', 'A4 . C5 . E5 . A5 .'], ['F', 'A5 - G5 F5 E5 - C5 .'], ['G', 'B4 . D5 . G5 . B5 .'], ['E', 'G#5 - - - E5 - . .'],
      ['Am', 'E5 E5 A5 . E5 E5 C6 .'], ['F', 'C6 - A5 . F5 - A5 .'], ['G', 'B5 - G5 . D5 - G5 .'], ['E', 'E5 - G#5 - B5 - . .']
    ] },
    // Swaying, in a scale with a wide step between F and G#, for the Indian restaurant in Moraira.
    indisk: { bpm: 100, lead: 'warm', bass: 'half', perc: true, bars: [
      ['E', 'E5 F5 G#5 - A5 G#5 F5 E5'], ['F', 'F5 - E5 F5 G#5 - F5 E5'], ['E', 'B4 - E5 - F5 E5 D5 C5'], ['E', 'B4 - - - E5 - . .'],
      ['Dm', 'D5 F5 A5 - G#5 - F5 E5'], ['F', 'F5 G#5 A5 - B5 A5 G#5 F5'], ['E', 'G#5 - F5 E5 F5 - E5 D5'], ['E', 'E5 - - - - - . .']
    ] },
    // A polka, for walking round Praha.
    praha: { bpm: 132, lead: 'punchy', bass: 'drive', perc: true, bars: [
      ['C', 'E5 G5 E5 C5 G4 - C5 -'], ['G', 'D5 F5 D5 B4 G4 - B4 -'], ['G', 'D5 - E5 F5 G5 - F5 -'], ['C', 'E5 - D5 - C5 - . .'],
      ['F', 'A5 - G5 F5 E5 - F5 -'], ['C', 'G5 - E5 C5 E5 - G5 -'], ['G', 'F5 - E5 - D5 - B4 -'], ['C', 'C5 - G4 - C5 - . .']
    ] },
    // Easy-going and swinging, like a lounge, while bets are placed at Trondheim Børs.
    bors: { bpm: 112, lead: 'warm', bass: 'groove', perc: 'light', stabs: true, swing: 0.2, bars: [
      ['C', 'E5 - G5 E5 . C5 D5 E5'], ['Am', 'C5 - A4 - . E5 D5 C5'], ['Dm', 'D5 - F5 - A5 - F5 D5'], ['G', 'B4 - D5 - G5 - . .'],
      ['C', 'E5 - G5 E5 . C5 D5 E5'], ['Am', 'A5 - G5 E5 . C5 E5 A5'], ['Dm', 'F5 - E5 D5 G5 - B4 -'], ['C', 'C5 - - - - - . .']
    ] },
    // Funky, for the dance at the very end: a bouncing octave bass and hi-hats.
    funk: { bpm: 112, lead: 'punchy', bass: 'funk', perc: 'funk', bars: [
      ['Em', 'E5 . E5 G5 . A5 G5 E5'], ['A', '. C#5 E5 - D5 . B4 .'], ['Em', 'E5 . E5 G5 . B5 A5 G5'], ['A', 'A5 - . E5 . C#5 . .'],
      ['G', 'D5 . D5 G5 . B5 . G5'], ['A', 'A5 . E5 . C#5 E5 A5 .'], ['Em', 'G5 - E5 . D5 E5 . B4'], ['B', 'D#5 - . F#5 . B5 . .']
    ] }
  };
  for (var sname in SONGS) {
    var sg = SONGS[sname];
    sg.mel = []; sg.chord = [];
    for (var b = 0; b < sg.bars.length; b++) {
      var toks = sg.bars[b][1].split(/\s+/);
      if (toks.length !== 8) console.warn('song ' + sname + ' bar ' + b + ' has ' + toks.length + ' steps');
      sg.mel = sg.mel.concat(toks);
      sg.chord.push(sg.bars[b][0]);
    }
  }
  var song = SONGS.main;

  function held(arr, i) {
    var n = 1;
    while (arr[(i + n) % arr.length] === '-' && n < 8) n++;
    return n;
  }

  // A note with a soft attack and release, so nothing clicks or bites.
  function note(type, freq, t, dur, vol, attack, release) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type);
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, Math.max(t + attack, t + dur - release));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function lead(kind, f, t, dur) {
    if (kind === 'warm') {
      note('triangle', f, t, dur, 0.3, 0.02, 0.08);
      note(pulse50, f, t, dur, 0.035, 0.03, 0.08);
    } else if (kind === 'glass') {
      note('sine', f, t, dur, 0.22, 0.05, 0.25);
      note('sine', f * 2, t, dur, 0.05, 0.05, 0.3);
    } else {
      note('triangle', f, t, dur, 0.26, 0.01, 0.05);
      note(pulse50, f, t, dur, 0.06, 0.01, 0.05);
    }
  }

  function schedule(i, t, sd) {
    var m = song.mel[i];
    if (m !== '-' && m !== '.') lead(song.lead, nf(m), t, held(song.mel, i) * sd * 0.92);
    var pos = i % 8, ch = CHORD[song.chord[Math.floor(i / 8)]];
    if (song.bass === 'funk') {
      var root = nf(ch.bass[0]), FUNK = [1, 0, 2, 1, 0, 1, 2, 1.5]; // root, rest, octave, ... fifth
      if (FUNK[pos]) note('triangle', root * FUNK[pos], t, sd * 0.6, 0.36, 0.005, 0.04);
    } else if (song.bass === 'groove') {
      var gr = nf(ch.bass[0]), GROOVE = [1, 0, 1, 2, 0, 1.5, 0, 2]; // root, rest, root, octave, rest, fifth, rest, octave
      if (GROOVE[pos]) note('triangle', gr * GROOVE[pos], t, sd * (pos === 0 ? 1.4 : 0.55), 0.34, 0.005, 0.04);
    } else if (song.bass === 'half') {
      if (pos === 0) note('triangle', nf(ch.bass[0]), t, sd * 3.8, 0.34, 0.02, 0.15);
      if (pos === 4) note('triangle', nf(ch.bass[1]), t, sd * 3.8, 0.28, 0.02, 0.15);
    } else {
      note('triangle', nf(ch.bass[pos % 4 === 2 ? 1 : 0]), t, sd * 0.8, 0.3, 0.01, 0.05);
    }
    if (pos === 0) for (var k = 0; k < ch.pad.length; k++) note('sine', nf(ch.pad[k]), t, sd * 7.8, song.stabs ? 0.025 : 0.045, 0.25, 0.6);
    // Short chord stabs just off the beat, as a funk guitar would play them.
    if (song.stabs && (pos === 3 || pos === 6)) for (var j = 0; j < ch.pad.length; j++) note(pulse50, nf(ch.pad[j]) * 2, t, sd * 0.45, 0.022, 0.005, 0.04);
    if (song.perc === 'funk') {
      noise(t, 0.04, 0.035, 7000, musicBus, 'highpass');
      if (pos === 0 || pos === 5) note('sine', 80, t, 0.14, 0.4, 0.005, 0.12);
      if (pos === 2 || pos === 6) noise(t, 0.12, 0.12, 1800, musicBus, 'bandpass');
    } else if (song.perc === 'light') {
      if (pos % 2) noise(t, 0.03, 0.025, 8000, musicBus, 'highpass');
      if (pos === 0 || pos === 3) note('sine', 85, t, 0.12, 0.32, 0.005, 0.1);
      if (pos === 2 || pos === 6) noise(t, 0.09, 0.07, 1900, musicBus, 'bandpass');
    } else if (song.perc) {
      if (pos === 0 || pos === 4) note('sine', 90, t, 0.12, 0.35, 0.005, 0.1);
      if (pos === 2 || pos === 6) noise(t, 0.08, 0.06, 1800, musicBus, 'bandpass');
    }
  }

  // Called every frame. isFast speeds the tune up while the cognac lasts, and
  // opens the filter a little so it sounds brighter too.
  function update(isFast) {
    if (ctx && isFast !== fast) musicFilter.frequency.setTargetAtTime(isFast ? 3600 : 2600, ctx.currentTime, 0.1);
    fast = isFast;
    if (!ctx || !playing || paused || !musicOn || ctx.state !== 'running') return;
    var sd = 60 / song.bpm / 2 / (fast ? 1.35 : 1);
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.15) {
      schedule(step, nextT + (step % 2 && song.swing ? song.swing * sd : 0), sd);
      nextT += sd;
      step = (step + 1) % song.mel.length;
    }
  }

  SM.audio = {
    resume: resume,
    sfx: sfx,
    update: update,
    // name picks the tune: 'main', 'hval', 'boks', 'bil', 'quiz', 'indisk', 'praha', 'bors' or 'funk'.
    // A tune that is already playing just carries on.
    startMusic: function (name) {
      var next = name && SONGS[name] ? SONGS[name] : song;
      if (playing && next === song) return;
      song = next;
      if (ctx) freshBus();
      playing = true; step = 0; nextT = 0;
    },
    stopMusic: function () { playing = false; },
    setPaused: function (p) { paused = p; },
    toggleMusic: function () { musicOn = !musicOn; return musicOn; },
    musicOn: function () { return musicOn; }
  };
})();
