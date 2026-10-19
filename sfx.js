/* CutFree – Sound-Bibliothek
   Alle Sounds und Musik-Loops werden hier im Browser synthetisiert (keine Downloads, keine Lizenzprobleme). */
(function () {
  const SR = 44100;
  const TAU = Math.PI * 2;
  const buf = d => new Float32Array(Math.ceil(d * SR));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function wave(type, ph) {
    const p = ph - Math.floor(ph);
    switch (type) {
      case 'saw': return 2 * p - 1;
      case 'square': return p < .5 ? 1 : -1;
      case 'tri': return 1 - 4 * Math.abs(p - .5);
      default: return Math.sin(TAU * p);
    }
  }
  // Ton mit Hüllkurve in Puffer mischen
  function tone(b, t0, dur, freq, o = {}) {
    const { type = 'sine', amp = .5, a = .005, r = .05, decay = 0, vib = 0, vibF = 5, drive = 0 } = o;
    const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
    let ph = o.phase || 0;
    for (let i = 0; i < n && s0 + i < b.length; i++) {
      if (s0 + i < 0) continue;
      const t = i / SR;
      let f = typeof freq === 'function' ? freq(t) : freq;
      if (vib) f *= 1 + vib * Math.sin(TAU * vibF * t);
      ph += f / SR;
      let e = Math.min(1, t / a) * Math.min(1, Math.max(0, dur - t) / r);
      if (decay) e *= Math.exp(-t / decay);
      let s = wave(type, ph);
      if (drive) s = Math.tanh(s * drive) / Math.tanh(drive);
      b[s0 + i] += s * amp * e;
    }
  }
  function noise(b, t0, dur, o = {}) {
    const { amp = .5, a = .002, r = .03, decay = 0, rand = Math.random, color = 'white' } = o;
    const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
    let br = 0;
    for (let i = 0; i < n && s0 + i < b.length; i++) {
      if (s0 + i < 0) continue;
      const t = i / SR;
      let s = rand() * 2 - 1;
      if (color === 'brown') { br = (br + .02 * s) / 1.02; s = br * 3.5; }
      let e = Math.min(1, t / a) * Math.min(1, Math.max(0, dur - t) / r);
      if (decay) e *= Math.exp(-t / decay);
      b[s0 + i] += s * amp * e;
    }
  }
  function lowpass(x, fc) { const a = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } return x; }
  function highpass(x, fc) { const a = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = x[i] - y; } return x; }
  // Bandpass (RBJ), Frequenz darf eine Funktion der Zeit sein
  function bandpass(x, f, q = 1) {
    const out = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
    const coef = fc => { const w = TAU * clamp(fc, 20, SR / 2.2) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al; b0 = al / a0; b1 = 0; b2 = -al / a0; a1 = -2 * Math.cos(w) / a0; a2 = (1 - al) / a0; };
    coef(typeof f === 'function' ? f(0) : f);
    for (let i = 0; i < x.length; i++) {
      if (typeof f === 'function' && i % 64 === 0) coef(f(i / SR));
      const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y; out[i] = y;
    }
    return out;
  }
  function mix(dst, src, g = 1, offset = 0) { const o = Math.floor(offset * SR); for (let i = 0; i < src.length && i + o < dst.length; i++) dst[i + o] += src[i] * g; return dst; }
  function env(x, fn) { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR); return x; }
  function normalize(x, peak = .9) { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); if (m > 0) { const g = peak / m; for (let i = 0; i < x.length; i++) x[i] *= g; } return x; }
  function fadeEdges(x, fi = .005, fo = .02) { const a = fi * SR, z = fo * SR, n = x.length; for (let i = 0; i < n; i++) { if (i < a) x[i] *= i / a; if (n - i < z) x[i] *= (n - i) / z; } return x; }
  // Karplus-Strong Zupfsaite
  function pluck(b, t0, freq, o = {}) {
    const { amp = .4, dur = 1.2, damp = .996, bright = .5, rand = Math.random } = o;
    const N = Math.max(2, Math.round(SR / freq)); const d = new Float32Array(N);
    for (let i = 0; i < N; i++) d[i] = rand() * 2 - 1;
    const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let idx = 0, prev = 0;
    for (let i = 0; i < n && s0 + i < b.length; i++) {
      const cur = d[idx]; const nx = d[(idx + 1) % N];
      d[idx] = damp * (bright * cur + (1 - bright) * (cur + nx) / 2);
      const e = Math.min(1, (n - i) / (SR * .03));
      b[s0 + i] += (cur * .7 + prev * .3) * amp * e; prev = cur; idx = (idx + 1) % N;
    }
  }
  // Drum-Bausteine
  function kick(b, t, amp = .9) { tone(b, t, .45, x => 45 + 110 * Math.exp(-x * 30), { amp, decay: .14, a: .001, r: .05, drive: 1.5 }); }
  function snare(b, t, amp = .45, rand) { noise(b, t, .2, { amp: amp, decay: .06, rand }); tone(b, t, .12, 190, { amp: amp * .6, decay: .04 }); }
  function hat(b, t, amp = .14, open = false, rand) { const n = buf(open ? .35 : .06); noise(n, 0, n.length / SR, { amp, decay: open ? .12 : .018, rand }); highpass(n, 7000); highpass(n, 7000); mix(b, n, 1, t); }
  function clap(b, t, amp = .45, rand) { const n = buf(.25); for (let k = 0; k < 3; k++) noise(n, k * .011, .015, { amp, rand }); noise(n, .033, .2, { amp, decay: .07, rand }); mix(b, bandpass(n, 1300, .8), 2.2, t); }
  function e808(b, t, m, dur, amp = .8) { const f = mtof(m); tone(b, t, dur, x => f * (1 + .25 * Math.exp(-x * 40)), { amp, a: .002, r: .06, decay: dur * .7, drive: 2 }); }
  function crash(b, t, amp = .3, rand) { const n = buf(2); noise(n, 0, 2, { amp, decay: .6, rand }); highpass(n, 4000); mix(b, n, 1, t); }
  function epiano(b, t, m, dur, amp = .12) { const f = mtof(m); tone(b, t, dur, f, { amp, decay: 1.4, a: .004, r: .15, vib: .002, vibF: 4 }); tone(b, t, dur, f * 2, { amp: amp * .35, decay: .5, a: .002, r: .1 }); tone(b, t, dur * .3, f * 3.01, { amp: amp * .1, decay: .15 }); }
  function bell(b, t, m, amp = .18) { const f = mtof(m); tone(b, t, 1.4, f, { amp, decay: .5 }); tone(b, t, 1, f * 2.76, { amp: amp * .4, decay: .18 }); tone(b, t, .6, f * 5.4, { amp: amp * .2, decay: .08 }); }

  /* ------------------------- SOUNDEFFEKTE ------------------------- */
  const G = {};
  G.rain = () => { const d = 10, r = rng(7), b = buf(d); const n = buf(d); noise(n, 0, d, { amp: .5, rand: r, a: .5, r: .5 }); highpass(n, 500); lowpass(n, 5000); mix(b, n, .6);
    const lo = buf(d); noise(lo, 0, d, { amp: .6, color: 'brown', rand: r, a: .5, r: .5 }); mix(b, lo, .5);
    for (let k = 0; k < 900; k++) tone(b, r() * d, .03, 1800 + r() * 4500, { amp: .02 + r() * .08, decay: .006, a: .0005 });
    return b; };
  G.storm = () => { const d = 8, r = rng(3), b = G.rain().slice(0, Math.ceil(d * SR)); for (let i = 0; i < b.length; i++) b[i] *= .5;
    const cr = buf(d); noise(cr, .4, .4, { amp: 1, decay: .08, rand: r }); highpass(cr, 1500); mix(b, cr, .7);
    const ru = buf(d); noise(ru, .45, 6.5, { amp: 1, color: 'brown', a: .05, decay: 2.2, rand: r }); lowpass(ru, 180); env(ru, t => .6 + .4 * Math.sin(t * 5.3) * Math.sin(t * 2.1)); mix(b, ru, 2.2);
    return b; };
  G.wind = () => { const d = 8, r = rng(11), n = buf(d); noise(n, 0, d, { amp: .8, rand: r, a: 1, r: 1 }); const b = bandpass(n, t => 450 + 300 * Math.sin(t * .9) + 150 * Math.sin(t * 2.3), 2.5); env(b, t => .5 + .5 * Math.sin(t * .7 + 1) ** 2); return b; };
  G.waves = () => { const d = 12, r = rng(5), n = buf(d); noise(n, 0, d, { amp: .8, rand: r, a: .3, r: .5 }); lowpass(n, 1400); env(n, t => { const p = (t % 6) / 6; return .15 + .85 * Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.4)), 2); }); return n; };
  G.fire = () => { const d = 8, r = rng(9), b = buf(d); noise(b, 0, d, { amp: .5, color: 'brown', rand: r, a: .3, r: .3 }); lowpass(b, 600);
    const c = buf(d); for (let k = 0; k < 260; k++) noise(c, r() * d, .012, { amp: .3 + r() * .7, decay: .002 + r() * .004, rand: r }); highpass(c, 1500); mix(b, c, .6); return b; };
  G.birds = () => { const d = 6, r = rng(21), b = buf(d); for (let g = 0; g < 9; g++) { const t0 = r() * (d - .6), base = 2800 + r() * 2000, cnt = 2 + Math.floor(r() * 4);
      for (let k = 0; k < cnt; k++) tone(b, t0 + k * .09, .07, x => base + 1500 * Math.sin(x * 70), { amp: .25, a: .005, r: .02 }); } return b; };
  G.heart = () => { const d = 4, b = buf(d); for (let k = 0; k < 4; k++) { tone(b, k * .9, .15, 55, { amp: .9, decay: .05, drive: 2 }); tone(b, k * .9 + .22, .15, 48, { amp: .7, decay: .05, drive: 2 }); } return b; };
  G.clock = () => { const d = 4, b = buf(d), r = rng(2); for (let k = 0; k < 8; k++) { const n = buf(.03); noise(n, 0, .03, { amp: .8, decay: .003, rand: r }); mix(b, bandpass(n, k % 2 ? 2500 : 3200, 6), 3, k * .5); } return b; };
  G.applause = () => { const d = 4, r = rng(4), b = buf(d); for (let k = 0; k < 1200; k++) { const t = r() * d; const n = buf(.03); noise(n, 0, .03, { amp: .3 + r() * .5, decay: .006, rand: r }); mix(b, bandpass(n, 900 + r() * 1500, 1.2), 1, t); }
    env(b, t => Math.min(1, t / .3) * Math.min(1, (d - t) / 1.2)); return b; };

  function fart(d, seed, wet) {
    const r = rng(seed), b = buf(d); let ph = 0, f = 85 + r() * 40, rough = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, p = t / d;
      if (i % 150 === 0) { f += (r() - .5) * 14; f = clamp(f, 55, 165); }
      const ff = f * (1 + .55 * Math.pow(p, 4) - .15 * Math.sin(p * 9));
      ph += ff / SR; const fr = ph % 1;
      rough += .004 * ((r() * 2 - 1) - rough);
      const s = Math.exp(-fr * 9) * 2 - .45;
      const flutter = .55 + .45 * Math.sin(TAU * (14 + 9 * Math.sin(t * 4)) * t);
      const e = Math.min(1, t / .015) * Math.min(1, (d - t) / .06);
      b[i] = s * flutter * e * (.8 + rough * 6);
    }
    lowpass(b, 900); lowpass(b, 1400);
    const n = buf(d); noise(n, 0, d, { amp: .5, rand: r, a: .01, r: .05 }); lowpass(n, 350); mix(b, n, .4);
    if (wet) { const w = buf(d); for (let k = 0; k < d * 40; k++) noise(w, r() * d, .02, { amp: .5 + r() * .5, decay: .006, rand: r }); mix(b, bandpass(w, 700, 1.5), 1.2); }
    return b;
  }
  G.fart1 = () => fart(.55, 13, false);
  G.fart2 = () => fart(1.9, 31, false);
  G.fart3 = () => fart(1.2, 77, true);
  G.fart4 = () => { const b = buf(1.6); for (let k = 0; k < 4; k++) mix(b, fart(.22 + k * .03, 100 + k, false), 1, k * .33); return b; };
  G.burp = () => {
    const d = 1.3, r = rng(42), src = buf(d); let ph = 0, f = 95, rough = 0;
    for (let i = 0; i < src.length; i++) {
      const t = i / SR; if (i % 220 === 0) f = clamp(f + (r() - .55) * 6, 48, 110);
      ph += (f - t * 18) / SR; rough += .01 * ((r() * 2 - 1) - rough);
      const e = Math.min(1, t / .04) * Math.min(1, (d - t) / .25);
      src[i] = (Math.exp(-(ph % 1) * 14) - .07) * e * (.65 + rough * 8);
    }
    const b = buf(d); mix(b, bandpass(src, t => 420 + 60 * Math.sin(t * 6), 3), 1); mix(b, bandpass(src, 900, 4), .7); mix(b, bandpass(src, 2300, 5), .25);
    return b;
  };
  G.burp2 = () => { const b = buf(2.2); const a = G.burp(); mix(b, a, 1); const c = G.burp(); for (let i = 0; i < c.length; i++) c[i] *= .7; mix(b, c, 1, .9); return b; };
  G.boing = () => { const b = buf(1); tone(b, 0, 1, x => (150 + 320 * Math.min(1, x * 6)) * (1 + .12 * Math.sin(TAU * 13 * x) * Math.exp(-x * 2)), { amp: .7, decay: .35 }); return b; };
  G.vineboom = () => { const b = buf(1.8); tone(b, 0, 1.8, x => 42 + 90 * Math.exp(-x * 9), { amp: 1, a: .002, decay: .55, drive: 3 }); tone(b, 0, 1.4, x => 84 + 160 * Math.exp(-x * 9), { amp: .35, decay: .3, drive: 2 }); noise(b, 0, .04, { amp: .3, decay: .01 }); return b; };
  G.sadtrombone = () => { const b = buf(2.6), notes = [62, 61, 60, 59]; notes.forEach((m, k) => { const last = k === 3; tone(b, k * .45, last ? 1.3 : .45, mtof(m), { type: 'saw', amp: .35, a: .03, r: .08, vib: last ? .025 : .004, vibF: 5.5 }); }); lowpass(b, 1500); lowpass(b, 2500); return b; };
  G.airhorn = () => { const b = buf(1.7); [[0, .18], [.24, .18], [.48, 1.1]].forEach(([t, d]) => { [440, 553, 659, 445].forEach(f => tone(b, t, d, x => f * (1 - .03 * Math.exp(-x * 20)), { type: 'saw', amp: .2, a: .01, r: .05, drive: 2.5 })); }); lowpass(b, 4000); return b; };
  G.badumtss = () => { const r = rng(8), b = buf(1.8); tone(b, 0, .3, x => 90 + 90 * Math.exp(-x * 20), { amp: .7, decay: .1 }); tone(b, .2, .3, x => 120 + 100 * Math.exp(-x * 20), { amp: .7, decay: .1 }); snare(b, .2, .2, r); crash(b, .45, .5, r); return b; };
  G.drumroll = () => { const r = rng(12), b = buf(3.4); for (let t = 0; t < 2.6; t += .028) snare(b, t, .08 + .25 * (t / 2.6), r); kick(b, 2.65); crash(b, 2.65, .6, r); return b; };
  G.squeak = () => { const b = buf(.5); tone(b, 0, .45, x => 1700 + 700 * Math.sin(x * 30) + 900 * x, { amp: .4, a: .02, r: .1 }); return b; };
  G.laser = () => { const b = buf(.35); tone(b, 0, .35, x => 2000 * Math.exp(-x * 9) + 150, { type: 'square', amp: .25, decay: .15 }); return b; };
  G.slideup = () => { const b = buf(1); tone(b, 0, 1, x => 400 * Math.pow(4, x), { amp: .4, vib: .02, vibF: 6, a: .05, r: .1 }); return b; };
  G.slidedown = () => { const b = buf(1); tone(b, 0, 1, x => 1600 * Math.pow(.25, x), { amp: .4, vib: .02, vibF: 6, a: .05, r: .1 }); return b; };
  G.ding = () => { const b = buf(1.6); bell(b, 0, 88, .6); return b; };
  G.chaching = () => { const r = rng(5), b = buf(1.4); for (let k = 0; k < 14; k++) tone(b, .02 + r() * .3, .25, 3000 + r() * 3000, { amp: .08, decay: .05 }); bell(b, .3, 93, .4); bell(b, .3, 100, .25); return b; };
  G.buzzer = () => { const b = buf(1); tone(b, 0, .9, 110, { type: 'square', amp: .25 }); tone(b, 0, .9, 116, { type: 'saw', amp: .25 }); lowpass(b, 2000); return b; };
  G.bonk = () => { const b = buf(.4); tone(b, 0, .35, x => 150 + 400 * Math.exp(-x * 40), { amp: .9, decay: .06 }); noise(b, 0, .02, { amp: .3, decay: .004 }); return b; };
  G.pop = () => { const b = buf(.15); tone(b, 0, .12, x => 300 + 1500 * Math.exp(-x * 60), { amp: .8, decay: .025 }); return b; };
  G.whoosh = () => { const d = .9, n = buf(d); noise(n, 0, d, { amp: 1, a: .3, r: .4 }); const b = bandpass(n, t => 300 + 2600 * Math.sin(Math.PI * t / d), 1.8); return b; };
  G.glitch = () => { const r = rng(66), b = buf(.7); let t = 0; while (t < .65) { const d = .02 + r() * .06; if (r() < .5) tone(b, t, d, 200 + r() * 2000, { type: 'square', amp: .25 }); else noise(b, t, d, { amp: .35, rand: r }); t += d + r() * .02; } for (let i = 0; i < b.length; i++) b[i] = Math.round(b[i] * 6) / 6; return b; };
  G.click = () => { const b = buf(.06); noise(b, 0, .02, { amp: .9, decay: .002 }); return bandpass(b, 3000, 2); };
  G.riser = () => { const d = 3, b = buf(d), n = buf(d); noise(n, 0, d, { amp: .5, a: 2.5, r: .02 }); mix(b, bandpass(n, t => 400 + 6000 * Math.pow(t / d, 2), 2), 1); tone(b, 0, d, x => 100 * Math.pow(8, x / d), { type: 'saw', amp: .12, a: 2.5, r: .02 }); return b; };
  G.impact = () => { const r = rng(17), b = buf(2); tone(b, 0, 2, x => 38 + 70 * Math.exp(-x * 12), { amp: 1, decay: .6, drive: 4 }); const n = buf(2); noise(n, 0, 1.5, { amp: .7, decay: .35, rand: r }); lowpass(n, 2500); mix(b, n, .6); return b; };
  G.notify = () => { const b = buf(.45); tone(b, 0, .18, 880, { amp: .4, decay: .08 }); tone(b, .12, .3, 1320, { amp: .4, decay: .12 }); return b; };
  G.tada = () => { const b = buf(1.8); tone(b, 0, .12, mtof(60), { type: 'saw', amp: .15 }); tone(b, .12, .12, mtof(64), { type: 'saw', amp: .15 });
    [60, 64, 67, 72].forEach(m => tone(b, .26, 1.4, mtof(m), { type: 'saw', amp: .13, vib: .006, vibF: 5.5, a: .02, r: .4 })); lowpass(b, 3000); return b; };
  G.camera = () => { const r = rng(3), b = buf(.4); noise(b, 0, .02, { amp: .9, decay: .003, rand: r }); const n = buf(.4); noise(n, .05, .15, { amp: .5, decay: .05, rand: r }); mix(b, bandpass(n, 1800, 1), 1.5); noise(b, .2, .02, { amp: .7, decay: .003, rand: r }); return b; };
  G.cartoonrun = () => { const b = buf(1.2); for (let k = 0; k < 12; k++) tone(b, k * .09, .07, x => 500 + 400 * Math.sin(x * 90), { amp: .35, decay: .04 }); return b; };
  G.spring = () => { const b = buf(1.2); tone(b, 0, 1.2, x => 300 + 250 * Math.sin(TAU * 9 * x) * Math.exp(-x * 2.5), { type: 'tri', amp: .5, decay: .5 }); return b; };

  /* --------------------------- MUSIK --------------------------- */
  G.m_lofi = () => {
    const bpm = 80, be = 60 / bpm, bars = 8, d = bars * 4 * be, b = buf(d + .5), r = rng(81);
    const ch = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
    for (let bar = 0; bar < bars; bar++) { const t0 = bar * 4 * be; ch[bar % 4].forEach((m, k) => epiano(b, t0 + k * .015, m, 4 * be, .09)); epiano(b, t0, ch[bar % 4][0] - 12, 4 * be, .12);
      kick(b, t0, .7); kick(b, t0 + 2.5 * be, .6); snare(b, t0 + be, .25, r); snare(b, t0 + 3 * be, .25, r);
      for (let k = 0; k < 8; k++) hat(b, t0 + k * be / 2 + (k % 2 ? be * .08 : 0), k % 2 ? .06 : .1, false, r); }
    lowpass(b, 3800); const cr = buf(d + .5); for (let k = 0; k < d * 25; k++) noise(cr, r() * d, .004, { amp: .3 * r(), decay: .001, rand: r }); highpass(cr, 2000); mix(b, cr, .25);
    return b;
  };
  G.m_trap = () => {
    const bpm = 140, be = 60 / bpm, bars = 8, d = bars * 4 * be, b = buf(d + 1), r = rng(55);
    const bass = [36, 36, 39, 34], mel = [72, 75, 77, 75, 79, 77, 75, 70];
    for (let bar = 0; bar < bars; bar++) { const t0 = bar * 4 * be;
      e808(b, t0, bass[bar % 4], 1.6 * be, .7); e808(b, t0 + 2.5 * be, bass[bar % 4], 1.3 * be, .6); kick(b, t0, .5);
      clap(b, t0 + 2 * be, .5, r);
      for (let k = 0; k < 8; k++) hat(b, t0 + k * be / 2, .1, false, r);
      if (bar % 2) for (let k = 0; k < 6; k++) hat(b, t0 + 3.5 * be + k * be / 12, .07, false, r);
      mel.forEach((m, k) => { if ((k + bar) % 3 !== 2) bell(b, t0 + k * be / 2, m, .08); }); }
    return b;
  };
  G.m_pop = () => {
    const bpm = 120, be = 60 / bpm, bars = 8, d = bars * 4 * be, b = buf(d + 1), r = rng(12);
    const ch = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
    for (let bar = 0; bar < bars; bar++) { const t0 = bar * 4 * be, c = ch[bar % 4];
      for (let k = 0; k < 4; k++) kick(b, t0 + k * be, .75);
      clap(b, t0 + be, .35, r); clap(b, t0 + 3 * be, .35, r);
      for (let k = 0; k < 4; k++) hat(b, t0 + k * be + be / 2, .08, true, r);
      for (let k = 0; k < 8; k++) pluck(b, t0 + k * be / 2, mtof(c[0] - 24), { amp: .35, dur: be / 2, damp: .99, bright: .2, rand: r });
      [0, 1.5, 2, 3, 3.5].forEach(o => c.forEach((m, i) => pluck(b, t0 + o * be + i * .012, mtof(m + 12), { amp: .12, dur: .6, damp: .995, rand: r }))); }
    return b;
  };
  G.m_suspense = () => {
    const d = 16, b = buf(d), r = rng(3);
    tone(b, 0, d, mtof(33), { type: 'saw', amp: .18, a: 2, r: 2 }); tone(b, 0, d, mtof(33) * 1.005, { type: 'saw', amp: .18, a: 2, r: 2 }); lowpass(b, 300);
    for (let t = 0; t < d; t += .86) { tone(b, t, .15, 55, { amp: .6, decay: .05, drive: 2 }); tone(b, t + .2, .15, 48, { amp: .4, decay: .05 }); }
    const hi = buf(d); [76, 77].forEach((m, k) => tone(hi, k * 8, 8, mtof(m), { type: 'tri', amp: .05, a: 3, r: 3, vib: .01, vibF: 7 })); mix(b, hi, 1);
    return b;
  };
  G.m_comedy = () => {
    const bpm = 110, be = 60 / bpm, bars = 8, d = bars * 4 * be, b = buf(d + 1), r = rng(19);
    const bass = [48, 43, 48, 43, 45, 41, 43, 43], mel = [72, 74, 76, 72, 77, 76, 74, 71, 72, 79, 77, 76, 74, 72, 71, 74];
    for (let bar = 0; bar < bars; bar++) { const t0 = bar * 4 * be;
      [0, 2].forEach(k => tone(b, t0 + k * be, be * .6, mtof(bass[bar] - 12), { type: 'saw', amp: .22, a: .01, r: .05, decay: .3 }));
      [1, 3].forEach(k => [64, 67].forEach(m => pluck(b, t0 + k * be, mtof(m - 12), { amp: .15, dur: .3, damp: .98, rand: r })));
      for (let k = 0; k < 8; k++) pluck(b, t0 + k * be / 2, mtof(mel[(bar * 8 + k) % 16]), { amp: .3, dur: .25, damp: .985, bright: .7, rand: r });
      if (bar % 2 === 1) G.__bonk(b, t0 + 3.5 * be); }
    lowpass(b, 6000); return b;
  };
  G.__bonk = (b, t) => tone(b, t, .2, x => 300 + 500 * Math.exp(-x * 40), { amp: .4, decay: .05 });

  const LIST = [
    // Natur & Atmo
    ['rain', 'Regen', 'Natur', '🌧'], ['storm', 'Gewitter', 'Natur', '⛈'], ['wind', 'Wind', 'Natur', '🌬'], ['waves', 'Meereswellen', 'Natur', '🌊'],
    ['fire', 'Lagerfeuer', 'Natur', '🔥'], ['birds', 'Vögel', 'Natur', '🐦'], ['heart', 'Herzschlag', 'Natur', '❤'], ['clock', 'Uhr tickt', 'Natur', '⏱'], ['applause', 'Applaus', 'Natur', '👏'],
    // Lustig / Soundboard
    ['fart1', 'Furz (kurz)', 'Lustig', '💨'], ['fart2', 'Furz (lang)', 'Lustig', '💨'], ['fart3', 'Furz (nass)', 'Lustig', '💦'], ['fart4', 'Furz-Serie', 'Lustig', '💨'],
    ['burp', 'Rülpser', 'Lustig', '🤢'], ['burp2', 'Doppel-Rülpser', 'Lustig', '🤮'], ['vineboom', 'Vine Boom', 'Lustig', '💥'], ['sadtrombone', 'Sad Trombone', 'Lustig', '🎺'],
    ['airhorn', 'Airhorn (MLG)', 'Lustig', '📯'], ['badumtss', 'Ba-dum-tss', 'Lustig', '🥁'], ['boing', 'Boing', 'Lustig', '🦘'], ['bonk', 'Bonk', 'Lustig', '🔨'],
    ['squeak', 'Quietschen', 'Lustig', '🐭'], ['buzzer', 'Fail-Buzzer', 'Lustig', '❌'], ['slideup', 'Pfeife hoch', 'Lustig', '⤴'], ['slidedown', 'Pfeife runter', 'Lustig', '⤵'],
    ['cartoonrun', 'Cartoon-Rennen', 'Lustig', '🏃'], ['spring', 'Feder', 'Lustig', '🌀'], ['drumroll', 'Trommelwirbel', 'Lustig', '🥁'], ['tada', 'Ta-da!', 'Lustig', '🎉'],
    // Übergänge & UI
    ['whoosh', 'Whoosh', 'Übergänge', '💨'], ['riser', 'Riser', 'Übergänge', '📈'], ['impact', 'Impact', 'Übergänge', '💢'], ['glitch', 'Glitch', 'Übergänge', '📺'],
    ['laser', 'Laser Pew', 'Übergänge', '🔫'], ['pop', 'Pop', 'Übergänge', '🫧'], ['click', 'Klick', 'Übergänge', '🖱'], ['ding', 'Ding', 'Übergänge', '🔔'],
    ['notify', 'Benachrichtigung', 'Übergänge', '📱'], ['chaching', 'Kasse', 'Übergänge', '💰'], ['camera', 'Kamera', 'Übergänge', '📷'],
    // Musik
    ['m_lofi', 'Lo-Fi Chill', 'Musik', '🎧'], ['m_trap', 'Trap Beat', 'Musik', '🔊'], ['m_pop', 'Happy Pop', 'Musik', '☀'], ['m_comedy', 'Comedy', 'Musik', '🤡'], ['m_suspense', 'Spannung', 'Musik', '🕵'],
  ].map(([id, name, cat, icon]) => ({ id, name, cat, icon }));

  function toWav(data) {
    const n = data.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, clamp(data[i], -1, 1) * 32767, true);
    return new Blob([ab], { type: 'audio/wav' });
  }
  function floatToWav(data, sr) { // für fremde Abtastraten (z.B. Text-zu-Sprache)
    if (sr === SR) return toWav(data);
    const out = new Float32Array(Math.round(data.length * SR / sr));
    for (let i = 0; i < out.length; i++) { const p = i * sr / SR, k = Math.floor(p), f = p - k; out[i] = (data[k] || 0) * (1 - f) + (data[k + 1] || 0) * f; }
    return toWav(out);
  }
  const cache = {};
  function render(id) {
    if (!cache[id]) { const d = G[id](); fadeEdges(d); normalize(d, id.startsWith('m_') ? .8 : .9); cache[id] = { data: d, blob: toWav(d), duration: d.length / SR }; }
    return cache[id];
  }
  window.SFX = { LIST, render, toWav, floatToWav, SR };
})();
