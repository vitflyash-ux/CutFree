/* CutFree – Video-Editor (Kern: Zustand, Player, Timeline, Panels) */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const fmt = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0'); };
  const fmtS = t => !isFinite(t) ? '' : t < 60 ? t.toFixed(1) + 's' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const easeIO = q => q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
  const easeOut = q => 1 - Math.pow(1 - q, 3);
  const easeBack = q => 1 + 2.70158 * Math.pow(q - 1, 3) + 1.70158 * Math.pow(q - 1, 2);
  const hexA = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  let toastT;
  function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }

  /* ======================= KATALOGE ======================= */
  const FONTS = ['Montserrat', 'Poppins', 'Bangers', 'Anton', 'Bebas Neue', 'Luckiest Guy', 'Permanent Marker', 'Pacifico', 'Arial', 'Impact', 'Courier New', 'Comic Sans MS', 'Georgia'];
  const BASE_STYLE = { font: 'Montserrat', weight: 800, size: 72, color: '#ffffff', stroke: '#000000', strokeW: 8, bg: '', bgAlpha: .7, shadow: true, glow: '', upper: false, italic: false, hl: '#FFE600', hlMode: 'color', pop: true, lineH: 1.15 };
  const STYLE_PRESETS = [
    { name: 'Klassisch', font: 'Montserrat', weight: 800, size: 70, strokeW: 8, hlMode: 'none' },
    { name: 'Hormozi', font: 'Montserrat', weight: 900, size: 80, upper: true, strokeW: 12, hl: '#FFE600', hlMode: 'color', pop: true },
    { name: 'Beast', font: 'Luckiest Guy', weight: 400, size: 88, upper: true, strokeW: 14, hl: '#2BFF4F', hlMode: 'color', pop: true },
    { name: 'Box', font: 'Poppins', weight: 700, size: 62, strokeW: 0, bg: '#000000', bgAlpha: .75, hlMode: 'none', shadow: false },
    { name: 'Karaoke', font: 'Poppins', weight: 800, size: 66, strokeW: 6, hl: '#FF2E88', hlMode: 'box', pop: false },
    { name: 'Neon', font: 'Montserrat', weight: 900, size: 74, color: '#39FF14', stroke: '#003300', strokeW: 4, glow: '#39FF14', hlMode: 'none', shadow: false },
    { name: 'Comic', font: 'Bangers', weight: 400, size: 90, color: '#FFE600', strokeW: 12, hl: '#ff3b3b', hlMode: 'color', upper: true },
    { name: 'Minimal', font: 'Poppins', weight: 600, size: 56, strokeW: 0, hlMode: 'none' },
    { name: 'Marker', font: 'Permanent Marker', weight: 400, size: 72, strokeW: 8, hl: '#00E5FF', hlMode: 'color' },
    { name: 'Kino', font: 'Bebas Neue', weight: 400, size: 96, strokeW: 0, hlMode: 'none' },
    { name: 'Feuer', font: 'Anton', weight: 400, size: 84, upper: true, color: '#FFB300', stroke: '#7a1500', strokeW: 10, hl: '#ffffff', hlMode: 'color', glow: '#ff5a00' },
    { name: 'Schreibmaschine', font: 'Courier New', weight: 700, size: 58, strokeW: 0, bg: '#000000', bgAlpha: .6, hlMode: 'none' },
    { name: 'Pastell', font: 'Pacifico', weight: 400, size: 70, color: '#ffd1f0', stroke: '#7a2c66', strokeW: 6, hlMode: 'none' },
    { name: 'Gelbe Box', font: 'Montserrat', weight: 900, size: 64, upper: true, color: '#000000', strokeW: 0, bg: '#FFE600', bgAlpha: 1, hlMode: 'color', hl: '#ffffff', shadow: false },
  ].map(p => ({ ...BASE_STYLE, ...p }));
  const FILTERS = [
    ['none', 'Original'], ['bw', 'S/W'], ['sepia', 'Sepia'], ['vintage', 'Vintage'], ['warm', 'Warm'], ['cool', 'Kühl'], ['vivid', 'Lebhaft'],
    ['drama', 'Drama'], ['fade', 'Verblasst'], ['bright', 'Hell'], ['dark', 'Dunkel'], ['dream', 'Traum'], ['neon', 'Neon'], ['invert', 'Negativ'], ['cinema', 'Kino'],
  ];
  const EFFECTS = [
    ['none', 'Kein Effekt', '⊘'], ['shake', 'Wackeln', '📳'], ['pulse', 'Puls-Zoom', '💓'], ['kenburns', 'Langsamer Zoom', '🔍'], ['zoomhit', 'Zoom-Hit', '💥'],
    ['glitch', 'Glitch', '📺'], ['vhs', 'VHS', '📼'], ['film', 'Filmkorn', '🎞'], ['vignette', 'Vignette', '⭕'], ['flash', 'Blitz', '⚡'],
    ['rainbow', 'Regenbogen', '🌈'], ['strobe', 'Stroboskop', '🔦'], ['wobble', 'Schwanken', '〰'], ['mirror', 'Spiegeln', '🪞'], ['heartbeat', 'Herzschlag', '❤'], ['letterbox', 'Kino-Balken', '🎬'],
  ];
  const TRANSITIONS = [
    ['none', 'Keiner', '⊘'], ['fade', 'Überblenden', '◐'], ['black', 'Schwarzblende', '⬛'], ['white', 'Weißblitz', '⬜'], ['slideL', 'Schieben ←', '⬅'], ['slideR', 'Schieben →', '➡'],
    ['slideU', 'Schieben ↑', '⬆'], ['slideD', 'Schieben ↓', '⬇'], ['zoomIn', 'Zoom rein', '🔎'], ['zoomOut', 'Zoom raus', '🔭'], ['wipe', 'Wischen', '▤'], ['circle', 'Kreis', '◯'],
    ['spin', 'Drehen', '🌀'], ['blur', 'Unschärfe', '💧'], ['glitch', 'Glitch', '📺'],
  ];
  const ANIMS = [['none', 'Keine'], ['fade', 'Einblenden'], ['zoom', 'Zoom'], ['zoomOutIn', 'Zoom von groß'], ['pop', 'Pop'], ['slideUp', 'Von unten'], ['slideDown', 'Von oben'],
    ['slideLeft', 'Von rechts'], ['slideRight', 'Von links'], ['spin', 'Drehen'], ['bounce', 'Hüpfen'], ['blur', 'Unschärfe'], ['typewriter', 'Schreibmaschine (Text)']];

  /* ======================= ZUSTAND ======================= */
  const state = { w: 1080, h: 1920, bg: 'black', tracks: [{ id: 'main', kind: 'video', name: 'Hauptspur', main: true }], clips: [], markers: [] };
  const media = new Map();
  const els = new Map(), gains = new Map(), imgs = new Map();
  let selId = null, time = 0, playing = false, pps = 80, exporting = false;
  let playT0 = 0, playBase = 0;
  let undoStack = [], redoStack = [], pendingSnap = null;
  let libTab = 'media', audioCat = 'Myinstants', propTab = {};
  let hitBoxes = [], guides = null;
  const ui = { curveMode: 'vol', snap: true, ripple: false, filterAmt: 1, trDur: .5 };

  let canvas = $('#stage'), g = canvas.getContext('2d');
  canvas.width = state.w; canvas.height = state.h;

  /* ---------- Audio-Graph ---------- */
  const actx = new (window.AudioContext || window.webkitAudioContext)();
  const master = actx.createGain(), speaker = actx.createGain(), recDest = actx.createMediaStreamDestination();
  master.connect(speaker); speaker.connect(actx.destination); master.connect(recDest);
  document.addEventListener('pointerdown', () => { if (actx.state !== 'running') actx.resume(); }, true);

  /* ======================= HILFSFUNKTIONEN ======================= */
  const clipById = id => state.clips.find(c => c.id === id);
  const trackById = id => state.tracks.find(t => t.id === id);
  const kindOf = c => (c.type === 'video' || c.type === 'image') ? 'video' : c.type === 'audio' ? 'audio' : 'text';
  const hasIn = c => c.type === 'video' || c.type === 'audio' || c.type === 'caption';
  const srcDur = c => { const m = media.get(c.mediaId); return m && isFinite(m.duration) ? m.duration : Infinity; };
  const isLocked = c => { const t = trackById(c.trackId); return !!(t && t.locked); };
  const projDur = () => state.clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
  const clipsOn = tid => state.clips.filter(c => c.trackId === tid).sort((a, b) => a.start - b.start);
  const snapshot = () => JSON.stringify({ tracks: state.tracks, clips: state.clips, markers: state.markers });
  function restore(s) {
    const o = JSON.parse(s); state.tracks = o.tracks; state.clips = o.clips; state.markers = o.markers || [];
    state.clips.forEach(ensureEl); if (!clipById(selId)) selId = null; renderAll();
  }
  function mutate(fn, keepRender) { const s = snapshot(); const r = fn(); undoStack.push(s); if (undoStack.length > 150) undoStack.shift(); redoStack = []; cleanupTracks(); if (!keepRender) renderAll(); return r; }
  function beginEdit() { if (!pendingSnap) pendingSnap = snapshot(); }
  function endEdit() { if (pendingSnap) { undoStack.push(pendingSnap); redoStack = []; pendingSnap = null; } renderTimeline(); }
  function undo() { if (!undoStack.length) return toast('Nichts zum Rückgängigmachen'); redoStack.push(snapshot()); restore(undoStack.pop()); }
  function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

  function isFree(tid, s, d, ex) { return !state.clips.some(c => c.trackId === tid && c.id !== ex && c.start < s + d - 1e-4 && c.start + c.dur > s + 1e-4); }
  function newTrack(kind, name) {
    const t = { id: uid(), kind, name: name || (kind === 'video' ? 'Overlay' : kind === 'audio' ? 'Audio' : 'Text') };
    if (kind === 'text') state.tracks.unshift(t);
    else if (kind === 'video') state.tracks.splice(state.tracks.findIndex(x => x.main), 0, t);
    else state.tracks.push(t);
    return t;
  }
  function findFreeTrack(kind, s, d, ex, preferMain) {
    let list = state.tracks.filter(t => t.kind === kind);
    if (kind === 'video') { const main = list.find(t => t.main), ov = list.filter(t => !t.main).reverse(); list = preferMain ? [main, ...ov] : [...ov, main]; }
    for (const t of list) if (isFree(t.id, s, d, ex)) return t;
    return newTrack(kind);
  }
  function cleanupTracks() { state.tracks = state.tracks.filter(t => t.main || state.clips.some(c => c.trackId === t.id)); }
  function defaults(c) {
    return Object.assign({ id: uid(), start: 0, dur: 3, in: 0, speed: 1, volume: 1, fadeIn: 0, fadeOut: 0, x: 0, y: 0, scale: 1, rot: 0, opacity: 1,
      filter: 'none', filterAmt: 1, adj: { b: 0, c: 0, s: 0 }, effect: 'none', transition: null, animIn: 'none', animOut: 'none', animDur: .5, fit: 'contain' }, c);
  }
  function addClip(c, trackId) {
    c = defaults(c);
    const kind = kindOf(c); const tr = trackId && trackById(trackId);
    if (tr && tr.kind === kind && isFree(tr.id, c.start, c.dur, c.id)) c.trackId = tr.id;
    else c.trackId = findFreeTrack(kind, c.start, c.dur, c.id, kind === 'video' && !trackId).id;
    state.clips.push(c); ensureEl(c); return c;
  }
  function ensureEl(c) {
    if (!(c.type === 'video' || c.type === 'audio') || els.has(c.id)) return;
    const m = media.get(c.mediaId); if (!m) return;
    const el = document.createElement(c.type === 'video' ? 'video' : 'audio');
    el.src = m.url; el.preload = 'metadata'; el.playsInline = true; el.preservesPitch = true; el._url = m.url;
    // Kette: Quelle → (Original-Regler) → Brumm-Filter → Bass → Stimme → Höhen → Lautstärke → Master (+ Hall-Send)
    // Für die Tonhöhe wird später eine zweite, vorberechnete Tonspur in dieselbe Kette eingespeist.
    const src = actx.createMediaElementSource(el), gn = actx.createGain(); gn.gain.value = 0;
    const bq = (type, f, q) => { const n = actx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q) n.Q.value = q; return n; };
    const srcGain = actx.createGain(), hum = bq('highpass', 10), bass = bq('lowshelf', 180), voice = bq('peaking', 2500, .9), treble = bq('highshelf', 5000), send = actx.createGain(); send.gain.value = 0;
    src.connect(srcGain); srcGain.connect(hum); hum.connect(bass); bass.connect(voice); voice.connect(treble); treble.connect(gn); gn.connect(master); gn.connect(send); send.connect(reverbIn());
    els.set(c.id, el); gains.set(c.id, gn); fxNodes.set(c.id, { src, srcGain, hum, bass, voice, treble, send });
  }
  const fxNodes = new Map(); let reverbNode = null;
  function reverbIn() {
    if (reverbNode) return reverbNode;
    const len = actx.sampleRate * 2.6, ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    reverbNode = actx.createConvolver(); reverbNode.buffer = ir; const wet = actx.createGain(); wet.gain.value = .6; reverbNode.connect(wet); wet.connect(master);
    return reverbNode;
  }
  function applyAfx(c) {
    const n = fxNodes.get(c.id); if (!n) return; const fx = c.afx || {};
    n.hum.frequency.value = fx.hum ? 90 : 10; n.bass.gain.value = fx.bass || 0; n.treble.gain.value = fx.treble || 0; n.voice.gain.value = fx.voice || 0;
    n.send.gain.value = (fx.reverb || 0) * 1.2;
  }

  /* ---------- Tonhöhe in Studio-Qualität (WSOLA, wie SoundTouch/Audacity) ----------
     Der Ton des Clips wird im Hintergrund neu berechnet: erst so umgerechnet, dass er höher/tiefer klingt,
     dann mit passenden, überlappenden Stücken wieder auf die Original-Länge gebracht. Klingt natürlich statt "Roboter". */
  const WSOLA_WORKER = `
    function curveAt(k, l, def) {
      if (!k || !k.length) return def; if (l <= k[0].t) return k[0].v;
      for (let i = 0; i < k.length - 1; i++) { const a = k[i], b = k[i + 1]; if (l <= b.t) { let q = (l - a.t) / Math.max(1e-6, b.t - a.t); q = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; return a.v + (b.v - a.v) * q; } }
      return k[k.length - 1].v;
    }
    function resample(x, phi) { const y = new Float32Array(phi.length), n = x.length; for (let i = 0; i < phi.length; i++) { const p = phi[i], j = p | 0, f = p - j; y[i] = j + 1 < n ? x[j] * (1 - f) + x[j + 1] * f : (x[j] || 0); } return y; }
    onmessage = e => {
      const { id, chans, sr, pts, base, speed, offset } = e.data, len = chans[0].length;
      const ratio = s => Math.pow(2, (base + curveAt(pts, (s - offset) / speed, 0)) / 12);
      // 1) Mit wechselnder Rate umrechnen → andere Tonhöhe (und Länge)
      const phiArr = []; let p = 0; while (p < len - 1) { phiArr.push(p); p += ratio(p / sr); }
      const phi = Float64Array.from(phiArr), ylen = phi.length;
      const mono = new Float32Array(len); chans.forEach(ch => { for (let i = 0; i < len; i++) mono[i] += ch[i] / chans.length; });
      const Y = chans.map(ch => resample(ch, phi)), ym = resample(mono, phi);
      // 2) WSOLA: Stücke so auswählen und überblenden, dass die Original-Zeitachse wieder stimmt
      const L = 2 * Math.round(sr * 0.023), H = L / 2, S = Math.round(sr * 0.012), win = new Float32Array(L);
      for (let i = 0; i < L; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / L);
      const out = chans.map(() => new Float32Array(len)), norm = new Float32Array(len);
      let prev = -1, j = 0;
      for (let o = 0; o < len; o += H) {
        while (j < ylen - 1 && phi[j] < o) j++;
        let n = j;
        if (prev >= 0) {
          const nat = prev + H; let best = n, bestC = -Infinity;
          if (nat + H < ylen) for (let d = -S; d <= S; d += 2) {
            const c0 = n + d; if (c0 < 0 || c0 + H >= ylen) continue;
            let s = 0, en = 1e-9; for (let k = 0; k < H; k += 3) { const a = ym[c0 + k]; s += a * ym[nat + k]; en += a * a; }
            const sc = s / Math.sqrt(en); if (sc > bestC) { bestC = sc; best = c0; }
          }
          n = best;
        }
        for (let k = 0; k < L && o + k < len; k++) { const w = win[k]; norm[o + k] += w; if (n + k < ylen) for (let c = 0; c < out.length; c++) out[c][o + k] += Y[c][n + k] * w; }
        prev = n;
      }
      for (let i = 0; i < len; i++) if (norm[i] > 1e-3) for (let c = 0; c < out.length; c++) out[c][i] /= Math.max(norm[i], 0.5);
      postMessage({ id, chans: out }, out.map(c => c.buffer));
    };`;
  let pitchWorker = null, pitchSeq = 0; const pitchJobs = {}, pitchCache = new Map(), pitchWant = new Map();
  function pitchCall(msg, transfer) {
    if (!pitchWorker) {
      pitchWorker = new Worker(URL.createObjectURL(new Blob([WSOLA_WORKER], { type: 'text/javascript' })));
      pitchWorker.onmessage = e => { const j = pitchJobs[e.data.id]; delete pitchJobs[e.data.id]; if (j) j(e.data.chans); };
    }
    return new Promise(res => { const id = ++pitchSeq; pitchJobs[id] = res; pitchWorker.postMessage({ ...msg, id }, transfer); });
  }
  const pcurve = (c, l) => curveAt(c.pk, l, 0);
  const needsPitch = c => (c.type === 'audio' || c.type === 'video') && ((c.afx && Math.abs(c.afx.pitch || 0) > .01) || (c.pkTape === false && c.pk && c.pk.some(k => Math.abs(k.v) > .01)));
  const pitchKey = c => JSON.stringify([c.mediaId, (c.afx && c.afx.pitch) || 0, c.pk || null, c.pkTape !== false, +c.in.toFixed(3), +c.dur.toFixed(3), c.speed]);
  function encodeWav(chs, sr) {
    const nc = chs.length, n = chs[0].length, ab = new ArrayBuffer(44 + n * nc * 2), v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * nc * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * nc * 2, true);
    let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { v.setInt16(o, clamp(chs[c][i], -1, 1) * 32767, true); o += 2; }
    return new Blob([ab], { type: 'audio/wav' });
  }
  async function renderPitch(c) {
    const key = pitchKey(c); let entry = pitchCache.get(c.id);
    if (!entry) { entry = {}; pitchCache.set(c.id, entry); }
    entry.rendering = key; updatePitchBadge();
    try {
      const ab = await getAudioBuffer(media.get(c.mediaId)), sr = ab.sampleRate;
      const s0 = Math.max(0, Math.floor((c.in - .2) * sr)), s1 = Math.min(ab.length, Math.ceil((Math.max(c.in + c.dur * c.speed, srcAt(c, c.dur)) + .3) * sr));
      const chans = [...Array(Math.min(2, ab.numberOfChannels))].map((_, i) => ab.getChannelData(i).slice(s0, s1));
      const out = await pitchCall({ chans, sr, pts: c.pkTape !== false ? [] : (c.pk || []), base: (c.afx && c.afx.pitch) || 0, speed: c.speed, offset: c.in - s0 / sr }, chans.map(x => x.buffer));
      if (entry.rendering !== key) return;
      if (!entry.el) {
        entry.el = document.createElement('audio'); entry.el.preload = 'auto'; entry.el.preservesPitch = true;
        entry.gain = actx.createGain(); entry.gain.gain.value = 0; actx.createMediaElementSource(entry.el).connect(entry.gain);
        const n = fxNodes.get(c.id); if (n) entry.gain.connect(n.hum);
      }
      if (entry.url) URL.revokeObjectURL(entry.url);
      entry.url = URL.createObjectURL(encodeWav(out, sr)); entry.el.src = entry.url; entry.start = s0 / sr; entry.key = key;
    } catch (e) { console.warn('Tonhöhe konnte nicht berechnet werden', e); entry.key = key; entry.failed = true; }
    entry.rendering = null; updatePitchBadge();
  }
  // Wird regelmäßig aufgerufen: rechnet neu, sobald sich die Tonhöhen-Einstellung eines Clips 0,6 s lang nicht mehr ändert
  function checkPitch() {
    const now = performance.now();
    for (const c of state.clips) {
      if (!needsPitch(c)) continue;
      const k = pitchKey(c), w = pitchWant.get(c.id);
      if (!w || w.key !== k) { pitchWant.set(c.id, { key: k, since: now }); continue; }
      const e = pitchCache.get(c.id);
      if (now - w.since > 600 && (!e || (e.key !== k && e.rendering !== k))) { ensureEl(c); renderPitch(c); }
    }
  }
  function updatePitchBadge() {
    const busy = [...pitchCache.values()].some(e => e.rendering);
    const el = $('#saveState'); if (el) el.textContent = busy ? '🎵 Tonhöhe wird berechnet…' : el.textContent.startsWith('🎵') ? '✓ Tonhöhe fertig' : el.textContent;
  }
  function getImg(m) { let i = imgs.get(m.id); if (!i) { i = new Image(); i.src = m.url; imgs.set(m.id, i); } return i; }

  /* ======================= MEDIEN ======================= */
  const waitEvt = (el, ev, ms = 8000) => new Promise(res => { const t = setTimeout(res, ms); el.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true }); });
  // Schnell importieren: nur die Metadaten (Dauer, Größe) abwarten, alle Dateien gleichzeitig.
  // Das Vorschaubild entsteht danach im Hintergrund – das Video ist sofort benutzbar.
  const kindOfFile = f => {
    if (f.type.startsWith('video')) return 'video'; if (f.type.startsWith('image')) return 'image'; if (f.type.startsWith('audio')) return 'audio';
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    return ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'].includes(ext) ? 'video' : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) ? 'image' : ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'].includes(ext) ? 'audio' : null;
  };
  let libT = 0; const libSoon = () => { clearTimeout(libT); libT = setTimeout(() => { if (libTab === 'media' || libTab === 'audio') renderLib(); }, 60); };
  async function importFiles(files) {
    const list = [...files]; let n = 0;
    await Promise.all(list.map(async f => {
      const kind = kindOfFile(f);
      if (!kind) { toast('Dateityp nicht unterstützt: ' + f.name); return; }
      const m = { id: uid(), name: f.name, kind, url: URL.createObjectURL(f), blob: f, source: 'file', duration: Infinity, loading: true };
      media.set(m.id, m); n++; libSoon();
      try {
        if (kind === 'video') {
          const v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.src = m.url;
          await waitEvt(v, 'loadedmetadata', 15000);
          if (!isFinite(v.duration)) { v.currentTime = 1e7; await waitEvt(v, 'durationchange', 5000); }
          m.duration = isFinite(v.duration) ? v.duration : 10; m.w = v.videoWidth; m.h = v.videoHeight;
          if (!m.w) toast('⚠ „' + f.name + '“: Dieses Videoformat kann der Editor evtl. nicht anzeigen (z.B. iPhone-HEVC). Tipp: als MP4 (H.264) speichern.', 7000);
          makeThumb(m, v);
        } else if (kind === 'image') {
          const i = getImg(m); await (i.complete ? Promise.resolve() : waitEvt(i, 'load')); m.w = i.naturalWidth; m.h = i.naturalHeight; m.thumb = m.url;
        } else {
          const a = new Audio(); a.preload = 'metadata'; a.src = m.url; await waitEvt(a, 'loadedmetadata'); m.duration = a.duration;
        }
      } catch (e) { console.warn(e); }
      m.loading = false; libSoon();
    }));
    if (n) toast(n + ' Datei(en) importiert');
  }
  async function makeThumb(m, v) {
    try {
      v.currentTime = Math.min(1, (m.duration || 2) / 3); await waitEvt(v, 'seeked', 8000);
      const cv = document.createElement('canvas'); cv.height = 120; cv.width = Math.round(120 * (m.w || 16) / (m.h || 9)) || 160;
      cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); m.thumb = cv.toDataURL('image/jpeg', .7);
      libSoon(); renderTimeline();
    } catch (e) { console.warn('Vorschaubild', e); }
    v.removeAttribute('src'); v.load();
  }
  async function getAudioBuffer(m) {
    if (!m.audioBuf) m.audioBuf = (async () => actx.decodeAudioData(await (await fetch(m.url)).arrayBuffer()))();
    return m.audioBuf;
  }
  function ensurePeaks(m) {
    if (m.peaks || m.peaksLoading) return; m.peaksLoading = true;
    getAudioBuffer(m).then(ab => {
      const R = 100, d = ab.getChannelData(0), step = ab.sampleRate / R, n = Math.ceil(d.length / step), p = new Float32Array(n);
      for (let i = 0; i < n; i++) { let mx = 0; const s = Math.floor(i * step), e = Math.min(d.length, s + step); for (let j = s; j < e; j += 4) mx = Math.max(mx, Math.abs(d[j])); p[i] = mx; }
      m.peaks = p; renderTimeline();
    }).catch(() => { m.peaks = new Float32Array(0); });
  }
  const sfxMedia = {};
  function mediaFromSfx(id) {
    if (sfxMedia[id]) return sfxMedia[id];
    const info = SFX.LIST.find(x => x.id === id), r = SFX.render(id);
    const m = { id: 'sfx_' + id, name: info.name, kind: 'audio', sub: info.cat === 'Musik' ? 'music' : 'sfx', url: URL.createObjectURL(r.blob), blob: r.blob, duration: r.duration, source: 'sfx' };
    media.set(m.id, m); return (sfxMedia[id] = m);
  }
  function addMediaClip(m, at, trackId) {
    if (m.loading) return toast('„' + m.name + '“ lädt noch – gleich nochmal klicken');
    const c = mutate(() => {
      let c;
      if (m.kind === 'video' || m.kind === 'image') {
        const dur = m.kind === 'image' ? 3 : m.duration;
        let start = at;
        if (start == null) {
          // Wie CapCut: an der roten Linie einfügen (steht sie mitten in einem Clip: direkt danach) und Nachfolgendes nach hinten schieben
          const main = clipsOn('main'), end = main.length ? main[main.length - 1].start + main[main.length - 1].dur : 0;
          const under = main.find(x => time >= x.start && time < x.start + x.dur);
          start = !main.length ? 0 : under ? under.start + under.dur : Math.min(time, end);
          if (main.some(x => x.start < start + dur - 1e-4 && x.start + x.dur > start + 1e-4)) state.clips.forEach(x => { if (x.trackId === 'main' && x.start >= start - 1e-4) x.start += dur; });
          trackId = 'main';
        }
        c = addClip({ type: m.kind, mediaId: m.id, start, dur, name: m.name }, trackId);
      } else {
        c = addClip({ type: 'audio', sub: m.sub || 'audio', mediaId: m.id, start: at ?? time, dur: m.duration, name: m.name }, trackId);
      }
      selId = c.id; return c;
    });
    // Neuen Clip sichtbar machen: Abspielkopf hin + Timeline dorthin scrollen
    if (c && (m.kind === 'video' || m.kind === 'image')) { setTime(c.start); tlScroll.scrollLeft = Math.max(0, c.start * pps - 80); toast('„' + m.name + '“ eingefügt bei ' + fmt(c.start)); }
    return c;
  }
  function addTextClip(style, at, trackId, text) {
    return mutate(() => { const c = addClip({ type: 'text', text: text || (window.I18N ? I18N.t('Text eingeben') : 'Text eingeben'), style: { ...style }, start: at ?? time, dur: 3, name: 'Text' }, trackId); selId = c.id; propTab.text = 'text'; return c; });
  }

  /* ======================= ABSPIELEN ======================= */
  function setTime(t) { time = clamp(t, 0, Math.max(projDur(), 0)); if (playing) { playBase = time; playT0 = performance.now(); } updatePlayhead(); }
  function play() {
    if (playing) return; if (actx.state !== 'running') actx.resume();
    if (time >= projDur() - .02) time = 0;
    if (!state.clips.length) return toast('Füge zuerst Medien hinzu');
    playing = true; playBase = time; playT0 = performance.now(); $('#btnPlay').textContent = '❚❚';
  }
  function pause() { playing = false; $('#btnPlay').textContent = '▶'; }
  function togglePlay() { playing ? pause() : play(); }

  // Lautstärke-Kurve: Punkte {t (Sek. ab Clip-Start), v (0–2 = 0–200 %)}, weich verbunden
  function curveAt(k, l, def) {
    if (!k || !k.length) return def;
    if (l <= k[0].t) return k[0].v;
    for (let i = 0; i < k.length - 1; i++) { const a = k[i], b = k[i + 1]; if (l <= b.t) return a.v + (b.v - a.v) * easeIO((l - a.t) / Math.max(1e-6, b.t - a.t)); }
    return k[k.length - 1].v;
  }
  const vcurve = (c, l) => curveAt(c.vk, l, 1);
  function volumeAt(c, t) {
    const tr = trackById(c.trackId); if (tr && tr.muted) return 0;
    const l = t - c.start; let v = c.volume * vcurve(c, l);
    if (c.fadeIn > 0 && l < c.fadeIn) v *= l / c.fadeIn;
    if (c.fadeOut > 0 && c.dur - l < c.fadeOut) v *= (c.dur - l) / c.fadeOut;
    // Mini-Blende (20 ms) an jedem Schnitt gegen Knackser
    const e = Math.min(.02, c.dur / 4); if (l < e) v *= Math.max(0, l / e); if (c.dur - l < e) v *= Math.max(0, (c.dur - l) / e);
    return Math.max(0, v);
  }
  // Lautstärke weich nachführen statt springen (verhindert Klick-Geräusche)
  function setG(param, v) {
    if (param._t === v) return; param._t = v;
    if (actx.state === 'running') { param.cancelScheduledValues(actx.currentTime); param.setTargetAtTime(v, actx.currentTime, .006); } else param.value = v;
  }
  // Element erst kurz nach dem Ausblenden anhalten
  function softPause(el) {
    if (el.paused || el._pausing) return;
    el._pausing = setTimeout(() => { el._pausing = null; if (!el._keep) el.pause(); }, 45);
  }
  function keepPlaying(el) { el._keep = true; if (el._pausing) { clearTimeout(el._pausing); el._pausing = null; } }
  // Plattenspieler-/Tape-Modus: Die Tonhöhen-Kurve steuert das Abspieltempo. Tiefer = langsamer, höher = schneller (Bild und Ton).
  const tapeOn = c => c.pkTape !== false && !!c.pk && c.pk.some(k => Math.abs(k.v) > .01);
  const rateAt = (c, l) => c.speed * (tapeOn(c) ? Math.pow(2, curveAt(c.pk, l, 0) / 12) : 1);
  const tapeCache = new Map(), TSTEP = .01;
  function tapeTable(c, need) {
    const key = JSON.stringify(c.pk) + '|' + c.speed; let T = tapeCache.get(c.id);
    if (!T || T.key !== key || T.len < need) {
      const len = Math.max(need * 1.5, 5), n = Math.ceil(len / TSTEP), cum = new Float64Array(n + 1);
      for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + rateAt(c, (i + .5) * TSTEP) * TSTEP;
      T = { key, len, cum }; tapeCache.set(c.id, T);
    }
    return T;
  }
  // Quellzeit (Sekunden im Original-Video) für eine Stelle l im Clip
  function srcAt(c, l) {
    l = Math.max(0, l); if (!tapeOn(c)) return c.in + l * c.speed;
    const T = tapeTable(c, l + 1), x = l / TSTEP, i = Math.floor(x);
    return c.in + T.cum[i] + (T.cum[i + 1] - T.cum[i]) * (x - i);
  }
  // Wie lang der Clip maximal sein kann, bis das Original-Video zu Ende ist
  function maxDur(c) {
    const sd = srcDur(c); if (!isFinite(sd)) return Infinity; if (!tapeOn(c)) return (sd - c.in) / c.speed;
    let l = 0; while (l < 7200 && srcAt(c, l) < sd) l += .05; return l;
  }
  const srcT = (c, t) => srcAt(c, t - c.start);
  function computeNeeds(t) {
    const needs = {};
    for (const tr of state.tracks) {
      if (tr.kind === 'text') continue;
      for (const c of clipsOn(tr.id)) {
        if (t >= c.start && t < c.start + c.dur) {
          needs[c.id] = { t: srcT(c, t), play: true };
          if (c.transition && c.transition.type !== 'none' && t < c.start + c.transition.dur) {
            const prev = clipsOn(tr.id).find(x => x !== c && Math.abs(x.start + x.dur - c.start) < .05);
            if (prev && prev.type === 'video') needs[prev.id] = { t: srcT(prev, prev.start + prev.dur - .05), play: false };
          }
        }
      }
    }
    return needs;
  }
  function syncMedia() {
    const needs = computeNeeds(time);
    for (const c of state.clips) {
      const el = els.get(c.id); if (!el) continue; const n = needs[c.id], gn = gains.get(c.id);
      // Nur Videos in der Nähe des Abspielkopfs geladen halten – sonst gehen dem Rechner bei vielen
      // (z.B. iPhone-/4K-)Videos die Video-Decoder aus und neue Videos bleiben schwarz.
      const near = !!n || (time > c.start - 3 && time < c.start + c.dur + 1);
      if (!near && !el._unloaded) { el.pause(); el.removeAttribute('src'); el.load(); el._unloaded = true; }
      else if (near && el._unloaded) { el.src = el._url; el.preload = 'auto'; el._unloaded = false; }
      else if (near && el.preload !== 'auto') el.preload = 'auto';
      if (el._unloaded) { setG(gn.gain, 0); const pe0 = pitchCache.get(c.id); if (pe0 && pe0.el && !pe0.el.paused) pe0.el.pause(); continue; }
      // Nächster Clip: schon vorher auf sein erstes Bild spulen, damit beim Schnitt kein Schwarzbild entsteht
      if (!n && time < c.start && el.readyState >= 1 && !el.seeking) { const want = srcAt(c, 0); if (!el.paused) el.pause(); if (Math.abs(el.currentTime - want) > .04) el.currentTime = want; }
      // Fertig berechnete Tonhöhen-Spur? Dann statt des Original-Tons diese abspielen
      const pe = pitchCache.get(c.id), usePitch = !!(pe && pe.el && pe.key === pitchKey(c) && !pe.failed && needsPitch(c)), fx = fxNodes.get(c.id);
      if (fx) setG(fx.srcGain.gain, usePitch ? 0 : 1);
      if (pe && pe.gain) setG(pe.gain.gain, usePitch ? 1 : 0);
      const pel = pe && pe.el;
      if (!n) { el._keep = false; setG(gn.gain, 0); softPause(el); if (pel) { pel._keep = false; softPause(pel); } continue; }
      const pt = n.t - (pe ? pe.start : 0);
      if (playing && n.play) {
        const rate = clamp(rateAt(c, time - c.start), .0625, 16), keepPitch = !tapeOn(c);
        if (el.preservesPitch !== keepPitch) el.preservesPitch = keepPitch;
        if (Math.abs(el.playbackRate - rate) > .002) el.playbackRate = rate;
        if (el.paused) { if (Math.abs(el.currentTime - n.t) > .05) el.currentTime = n.t; el.play().catch(() => { }); }
        else if (Math.abs(el.currentTime - n.t) > .3) el.currentTime = n.t;
        if (usePitch) {
          if (pel.preservesPitch !== keepPitch) pel.preservesPitch = keepPitch;
          if (Math.abs(pel.playbackRate - rate) > .002) pel.playbackRate = rate;
          if (pel.paused) { pel.currentTime = Math.max(0, pt); pel.play().catch(() => { }); }
          else if (Math.abs(pel.currentTime - pt) > .12) pel.currentTime = Math.max(0, pt);
        } else if (pel && !pel.paused) pel.pause();
        keepPlaying(el); if (usePitch) keepPlaying(pel); setG(gn.gain, volumeAt(c, time)); applyAfx(c);
      } else {
        el._keep = false; softPause(el); if (pel) { pel._keep = false; softPause(pel); }
        if (Math.abs(el.currentTime - n.t) > .04 && !el.seeking) el.currentTime = n.t;
        setG(gn.gain, 0);
      }
    }
    for (const [id, el] of els) if (!el.paused && !clipById(id)) el.pause();
    for (const [id, e] of pitchCache) if (e.el && !e.el.paused && !clipById(id)) e.el.pause();
  }

  /* ======================= ZEICHNEN ======================= */
  function filterCss(c) {
    const a = c.filterAmt ?? 1; let f = '';
    switch (c.filter) {
      case 'bw': f = `grayscale(${a})`; break;
      case 'sepia': f = `sepia(${a})`; break;
      case 'vintage': f = `sepia(${.5 * a}) contrast(${1 + .1 * a}) saturate(${1 - .25 * a}) brightness(${1 + .05 * a})`; break;
      case 'warm': f = `sepia(${.3 * a}) saturate(${1 + .35 * a}) hue-rotate(${-8 * a}deg)`; break;
      case 'cool': f = `saturate(${1 + .1 * a}) hue-rotate(${18 * a}deg) brightness(${1 + .03 * a})`; break;
      case 'vivid': f = `saturate(${1 + .8 * a}) contrast(${1 + .15 * a})`; break;
      case 'drama': f = `contrast(${1 + .5 * a}) saturate(${1 - .35 * a}) brightness(${1 - .1 * a})`; break;
      case 'fade': f = `contrast(${1 - .3 * a}) brightness(${1 + .1 * a}) saturate(${1 - .3 * a})`; break;
      case 'bright': f = `brightness(${1 + .35 * a})`; break;
      case 'dark': f = `brightness(${1 - .35 * a}) contrast(${1 + .1 * a})`; break;
      case 'dream': f = `blur(${2 * a}px) brightness(${1 + .15 * a}) saturate(${1 + .3 * a})`; break;
      case 'neon': f = `saturate(${1 + 2 * a}) contrast(${1 + .3 * a}) hue-rotate(${-15 * a}deg)`; break;
      case 'invert': f = `invert(${a})`; break;
      case 'cinema': f = `contrast(${1 + .2 * a}) saturate(${1 - .15 * a}) sepia(${.15 * a}) hue-rotate(${-5 * a}deg)`; break;
    }
    const j = c.adj || {};
    if (j.b) f += ` brightness(${1 + j.b})`; if (j.c) f += ` contrast(${1 + j.c})`; if (j.s) f += ` saturate(${1 + j.s})`;
    return f;
  }
  /* ---------- Keyframes: Liste von Momentaufnahmen {t, x, y, scale, rot, opacity}, t relativ zum Clip-Start ---------- */
  const KP = ['x', 'y', 'scale', 'rot', 'opacity'];
  const pickKP = o => Object.fromEntries(KP.map(p => [p, o[p]]));
  function kv(c, local) {
    const k = c.kf; if (!k || !k.length) return c;
    if (local <= k[0].t) return k[0];
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (local <= b.t) { const q = easeIO((local - a.t) / Math.max(1e-6, b.t - a.t)), r = {}; KP.forEach(p => r[p] = a[p] + (b[p] - a[p]) * q); return r; }
    }
    return k[k.length - 1];
  }
  const curLocal = c => clamp(time - c.start, 0, c.dur);
  const kfAt = (c, lt) => (c.kf || []).find(k => Math.abs(k.t - lt) < .04);
  function setProp(c, p, v) {
    if (c.kf && c.kf.length) {
      const lt = curLocal(c); let k = kfAt(c, lt);
      if (!k) { k = { t: lt, ...pickKP(kv(c, lt)) }; c.kf.push(k); c.kf.sort((a, b) => a.t - b.t); }
      k[p] = v;
    } else c[p] = v;
  }
  function toggleKf(c) {
    const lt = curLocal(c), k = kfAt(c, lt);
    if (k) { c.kf = c.kf.filter(x => x !== k); if (!c.kf.length) { Object.assign(c, pickKP(k)); c.kf = null; } }
    else { c.kf = c.kf || []; c.kf.push({ t: lt, ...pickKP(kv(c, lt)) }); c.kf.sort((a, b) => a.t - b.t); }
  }
  function animState(c, local) {
    const d = Math.min(c.animDur || .5, c.dur / 2); const r = { dx: 0, dy: 0, sc: 1, rot: 0, alpha: 1, blur: 0 };
    const apply = (type, q) => {
      q = clamp(q, 0, 1); const e = easeOut(q), k = 1 - e;
      switch (type) {
        case 'fade': r.alpha *= e; break;
        case 'zoom': r.sc *= .5 + .5 * e; r.alpha *= e; break;
        case 'zoomOutIn': r.sc *= 1 + .6 * k; r.alpha *= e; break;
        case 'pop': r.sc *= Math.max(0, easeBack(q)); r.alpha *= Math.min(1, q * 3); break;
        case 'slideUp': r.dy += .25 * k; r.alpha *= e; break;
        case 'slideDown': r.dy -= .25 * k; r.alpha *= e; break;
        case 'slideLeft': r.dx += .4 * k; r.alpha *= e; break;
        case 'slideRight': r.dx -= .4 * k; r.alpha *= e; break;
        case 'spin': r.rot -= 180 * k; r.sc *= .3 + .7 * e; r.alpha *= e; break;
        case 'bounce': r.dy -= .12 * Math.abs(Math.sin(q * Math.PI * 2.5)) * (1 - q); r.alpha *= Math.min(1, q * 4); break;
        case 'blur': r.blur += 30 * k; r.alpha *= e; break;
      }
    };
    if (c.animIn && c.animIn !== 'none' && local < d) apply(c.animIn, local / d);
    if (c.animOut && c.animOut !== 'none' && local > c.dur - d) apply(c.animOut, (c.dur - local) / d);
    return r;
  }
  const prand = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function effectState(c, local) {
    const r = { dx: 0, dy: 0, sc: 1, rot: 0, hue: 0, mirror: false, invert: false };
    switch (c.effect) {
      case 'shake': { const k = Math.floor(local * 30); r.dx = (prand(k) - .5) * .025; r.dy = (prand(k + 9) - .5) * .025; r.rot = (prand(k + 3) - .5) * 1.5; r.sc = 1.04; break; }
      case 'pulse': r.sc = 1 + .05 * (1 + Math.sin(local * Math.PI * 4)) / 2; break;
      case 'kenburns': r.sc = 1 + .18 * (local / c.dur); break;
      case 'zoomhit': r.sc = 1 + .3 * Math.exp(-local * 7); break;
      case 'rainbow': r.hue = local * 180; break;
      case 'strobe': r.invert = Math.floor(local * 8) % 2 === 0; break;
      case 'wobble': r.rot = 3 * Math.sin(local * 5); r.sc = 1.06; break;
      case 'mirror': r.mirror = true; break;
      case 'heartbeat': r.sc = 1 + .09 * Math.pow(Math.max(0, Math.sin(local * Math.PI * 2.4)), 12); break;
    }
    return r;
  }
  const grain = [...Array(4)].map(() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), d = x.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 40; } x.putImageData(d, 0, 0); return cv; });
  function overlayEffects(c, local) {
    const W = state.w, H = state.h;
    g.save();
    switch (c.effect) {
      case 'vhs': {
        g.globalAlpha = .18; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
        g.globalAlpha = .35; g.drawImage(grain[Math.floor(local * 24) % 4], 0, 0, W, H);
        g.globalAlpha = .12; g.globalCompositeOperation = 'lighter'; g.drawImage(canvas, 8, 0); g.globalCompositeOperation = 'source-over';
        const yb = (local * 300) % H; g.globalAlpha = .15; g.fillStyle = '#fff'; g.fillRect(0, yb, W, 30);
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = `600 ${W * .04}px monospace`; g.fillText('▶ PLAY', W * .06, H * .06); break;
      }
      case 'film': g.globalAlpha = .6; g.drawImage(grain[Math.floor(local * 24) % 4], 0, 0, W, H); g.globalAlpha = .08; g.fillStyle = '#c8a060'; g.fillRect(0, 0, W, H); break;
      case 'vignette': { const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.hypot(W, H) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); break; }
      case 'flash': g.globalAlpha = Math.max(0, 1 - (local % .6) * 5) * .7; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); break;
      case 'letterbox': g.fillStyle = '#000'; g.fillRect(0, 0, W, H * .11); g.fillRect(0, H * .89, W, H * .11); break;
      case 'glitch': {
        const k = Math.floor(local * 12);
        if (prand(k) < .45) {
          for (let i = 0; i < 6; i++) { const y = prand(k * 7 + i) * H, h = 10 + prand(k * 3 + i) * H * .06, off = (prand(k * 5 + i) - .5) * W * .12; g.drawImage(canvas, 0, y, W, h, off, y, W, h); }
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25; g.drawImage(canvas, W * .012, 0); g.globalCompositeOperation = 'source-over';
        }
        break;
      }
    }
    g.restore();
  }
  const hasColor = c => !!c.color && Object.values(c.color).some(v => Math.abs(v) > 1e-3);
  function drawVisual(c, t, o = {}) {
    const m = media.get(c.mediaId); if (!m) return;
    // Maske: Clip auf transparente Ebene zeichnen, dann mit weicher Form ausstanzen
    if (c.mask && c.mask.type !== 'none' && !o.noMask && !o.bgBlur) {
      const W = state.w, H = state.h, k = W < 400 ? 6 : 4, L = layerCanvas(k, W, H), M = layerCanvas(k + 1, W, H);
      const lg = L.getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
      const sc = canvas, sg = g, n0 = hitBoxes.length; canvas = L; g = lg;
      try { drawVisual(c, t, { ...o, noMask: true, noBlend: true }); } finally { canvas = sc; g = sg; }
      const hb = hitBoxes[hitBoxes.length - 1]; if (!hb || hitBoxes.length === n0) return;
      const mk = c.mask, mg = M.getContext('2d'); mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.filter = 'none'; mg.clearRect(0, 0, W, H);
      mg.fillStyle = '#fff';
      if (mk.invert) { mg.fillRect(0, 0, W, H); mg.globalCompositeOperation = 'destination-out'; }
      mg.filter = mk.feather > 0 ? `blur(${mk.feather * Math.min(hb.w, hb.h) * .25}px)` : 'none';
      mg.translate(hb.cx, hb.cy); mg.rotate((hb.rot + (mk.rot || 0)) * Math.PI / 180);
      const mx = mk.x * hb.w, my = mk.y * hb.h, mw = mk.w * hb.w, mh = mk.h * hb.h;
      mg.beginPath(); if (mk.type === 'ellipse') mg.ellipse(mx, my, mw / 2, mh / 2, 0, 0, 7); else mg.rect(mx - mw / 2, my - mh / 2, mw, mh); mg.fill();
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.filter = 'none'; mg.globalCompositeOperation = 'source-over';
      lg.globalCompositeOperation = 'destination-in'; lg.drawImage(M, 0, 0); lg.globalCompositeOperation = 'source-over';
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; if (c.blend && c.blend !== 'source-over') g.globalCompositeOperation = c.blend; g.drawImage(L, 0, 0); g.restore();
      return;
    }
    let src, sw, sh;
    if (c.type === 'video') { src = els.get(c.id); if (!src || src.readyState < 2 || !src.videoWidth) { if (!o.bgBlur) frameMissing = true; return; } sw = src.videoWidth; sh = src.videoHeight; }
    else { src = getImg(m); if (!src.complete || !src.naturalWidth) return; sw = src.naturalWidth; sh = src.naturalHeight; }
    const W = state.w, H = state.h, fit = (c.fit === 'cover' ? Math.max : Math.min)(W / sw, H / sh);
    const dw = sw * fit, dh = sh * fit, local = t - c.start;
    const A = o.noAnim ? { dx: 0, dy: 0, sc: 1, rot: 0, alpha: 1, blur: 0 } : animState(c, local), E = effectState(c, local);
    const K = kv(c, local);
    const cx = W / 2 + (K.x + A.dx + E.dx + (o.dx || 0)) * W, cy = H / 2 + (K.y + A.dy + E.dy + (o.dy || 0)) * H;
    const rot = K.rot + A.rot + E.rot + (o.rot || 0), s = K.scale * A.sc * E.sc * (o.sc ?? 1);
    if (window.GLT && !o.bgBlur && ((c.ck && c.ck.on) || hasColor(c))) { const r = GLT.chroma(src, sw, sh, c.ck, c.color); if (r) { src = r; } }
    g.save();
    if (o.clipFn) o.clipFn(g);
    g.globalAlpha = clamp(K.opacity * A.alpha * (o.alpha ?? 1), 0, 1);
    g.translate(cx, cy); g.rotate(rot * Math.PI / 180); g.scale(s * (E.mirror ? -1 : 1), s);
    const bl = (A.blur || 0) + (o.blur || 0);
    const f = (o.bgBlur ? `blur(${o.bgBlur}px) brightness(.6)` : filterCss(c)) + (bl ? ` blur(${bl}px)` : '') + (E.hue ? ` hue-rotate(${E.hue}deg)` : '') + (E.invert ? ' invert(1)' : '');
    g.filter = f.trim() || 'none';
    if (c.blend && c.blend !== 'source-over' && !o.noBlend && !o.bgBlur) g.globalCompositeOperation = c.blend;
    // Zuschneiden: nur einen Teil der Quelle zeichnen, an derselben Stelle
    const cr = (!o.bgBlur && c.crop) || { l: 0, r: 0, t: 0, b: 0 };
    const [S, ox, oy, ow, oh] = Array.isArray(src) ? src : [src, 0, 0, sw, sh];
    const fx = clamp(cr.l, 0, .95), fy = clamp(cr.t, 0, .95), fw = Math.max(.02, 1 - fx - clamp(cr.r, 0, .95)), fh = Math.max(.02, 1 - fy - clamp(cr.b, 0, .95));
    g.drawImage(S, ox + fx * ow, oy + fy * oh, fw * ow, fh * oh, -dw / 2 + fx * dw, -dh / 2 + fy * dh, fw * dw, fh * dh);
    g.restore();
    if (!o.bgBlur) hitBoxes.push({ id: c.id, cx, cy, w: dw * s, h: dh * s, rot });
  }
  function drawBlurBg(c, t) {
    const m = media.get(c.mediaId); if (!m) return; const sw = m.w || 16, sh = m.h || 9;
    const cover = Math.max(state.w / sw, state.h / sh) / Math.min(state.w / sw, state.h / sh);
    drawVisual({ ...c, x: 0, y: 0, rot: 0, scale: cover * 1.1, opacity: 1, effect: 'none', kf: null, ck: null }, t, { bgBlur: 50, noAnim: true });
  }
  const layers = [];
  function layerCanvas(i, w, h) { let c = layers[i]; if (!c) c = layers[i] = document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; }
  function renderInto(cv, fn) {
    const sc = canvas, sg = g; canvas = cv; g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = state.bg === 'white' ? '#fff' : '#000'; g.fillRect(0, 0, cv.width, cv.height);
    try { fn(); } finally { canvas = sc; g = sg; }
  }
  const trLabel = id => { if (id.startsWith('gl:')) { const t = window.GLT && GLT.info(id.slice(3)); return '✨ ' + (t ? t.label : id.slice(3)); } const t = TRANSITIONS.find(x => x[0] === id); return t ? t[2] + ' ' + t[1] : id; };
  function overlayColor(col, a) { g.save(); g.globalAlpha = clamp(a, 0, 1); g.fillStyle = col; g.fillRect(0, 0, state.w, state.h); g.restore(); }
  function drawTransition(c, prev, p, isMain, tt = time) {
    const W = state.w, H = state.h, T = c.transition.type;
    const pt = prev ? prev.start + prev.dur - .05 : 0;
    const P = o => { if (!prev) return; if (isMain && state.bg === 'blur') drawBlurBg(prev, pt); drawVisual(prev, pt, { noAnim: true, ...o }); };
    const C = o => { if (isMain && state.bg === 'blur' && !o.clipFn) drawBlurBg(c, tt); drawVisual(c, tt, o); };
    if (T.startsWith('gl:') && window.GLT) {
      // Beide Bilder in Zwischen-Canvas zeichnen, dann per WebGL-Shader mischen
      const k = W < 400 ? 2 : 0, A = layerCanvas(k, W, H), B = layerCanvas(k + 1, W, H);
      renderInto(A, () => P({})); renderInto(B, () => C({}));
      const r = GLT.render(T.slice(3), A, B, p, W, H);
      if (r) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.drawImage(r[0], r[1], r[2], W, H, 0, 0, W, H); g.restore(); return; }
      P({}); C({ alpha: p }); return;
    }
    switch (T) {
      case 'fade': P({}); C({ alpha: p }); break;
      case 'black': case 'white': { const col = T === 'black' ? '#000' : '#fff'; if (p < .5) { P({}); overlayColor(col, p * 2); } else { C({}); overlayColor(col, (1 - p) * 2); } break; }
      case 'slideL': P({ dx: -p }); C({ dx: 1 - p }); break;
      case 'slideR': P({ dx: p }); C({ dx: -(1 - p) }); break;
      case 'slideU': P({ dy: -p }); C({ dy: 1 - p }); break;
      case 'slideD': P({ dy: p }); C({ dy: -(1 - p) }); break;
      case 'zoomIn': P({ sc: 1 + p * 1.5, alpha: 1 - p }); C({ sc: .6 + .4 * p, alpha: p }); break;
      case 'zoomOut': P({ sc: 1 - .5 * p, alpha: 1 - p }); C({ sc: 1.8 - .8 * p, alpha: p }); break;
      case 'wipe': P({}); C({ clipFn: x => { x.beginPath(); x.rect(0, 0, W * p, H); x.clip(); } }); break;
      case 'circle': P({}); C({ clipFn: x => { x.beginPath(); x.arc(W / 2, H / 2, p * Math.hypot(W, H) / 2, 0, 7); x.clip(); } }); break;
      case 'spin': P({ rot: p * 180, sc: 1 - p, alpha: 1 - p }); C({ rot: -(1 - p) * 180, sc: Math.max(.01, p), alpha: p }); break;
      case 'blur': P({ blur: p * 40, alpha: 1 - p * .5 }); C({ blur: (1 - p) * 40, alpha: p }); break;
      case 'glitch': { const j = (Math.random() - .5) * .1 * (1 - Math.abs(p - .5) * 2); if (p < .5) P({ dx: j }); else C({ dx: j });
        if (Math.random() < .6) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .3; g.drawImage(canvas, W * .02 * (Math.random() - .5) * 4, 0); g.restore(); } break; }
      default: C({});
    }
  }
  function layoutText(c, t) {
    const st = { ...BASE_STYLE, ...c.style }, W = state.w, k = W / 1080, local = t - c.start;
    let tokens = [];
    if (c.type === 'caption') {
      const lt = local + c.in, ws = (c.words || []).filter(w => w.e > c.in - .001 && w.s < c.in + c.dur);
      let ai = -1; ws.forEach((w, i) => { if (lt >= w.s) ai = i; });
      tokens = ws.map((w, i) => ({ txt: w.w, active: i === ai && lt < w.e + .25 }));
    } else {
      (c.text || '').split('\n').forEach((line, li) => { if (li) tokens.push({ br: true }); line.split(/\s+/).filter(Boolean).forEach(x => tokens.push({ txt: x })); });
    }
    if (c.animIn === 'typewriter') {
      const total = tokens.reduce((n, x) => n + (x.txt ? x.txt.length + 1 : 0), 0);
      let show = Math.floor(total * clamp(local / Math.max(.3, Math.min(c.dur * .7, total * .06)), 0, 1));
      const out = []; for (const x of tokens) { if (x.br) { out.push(x); continue; } if (show <= 0) break; out.push({ ...x, txt: x.txt.slice(0, show) }); show -= x.txt.length + 1; } tokens = out;
    }
    if (st.upper) tokens.forEach(x => { if (x.txt) x.txt = x.txt.toUpperCase(); });
    const fs = st.size * k; g.font = `${st.italic ? 'italic ' : ''}${st.weight} ${fs}px "${st.font}"`;
    const maxW = W * .86 / (c.scale || 1), space = g.measureText(' ').width, lines = []; let line = [], lw = 0;
    for (const tk of tokens) {
      if (tk.br) { lines.push({ toks: line, w: lw }); line = []; lw = 0; continue; }
      const w = g.measureText(tk.txt).width;
      if (line.length && lw + space + w > maxW) { lines.push({ toks: line, w: lw }); line = []; lw = 0; }
      lw += (line.length ? space : 0) + w; line.push({ ...tk, w });
    }
    if (line.length || !lines.length) lines.push({ toks: line, w: lw });
    return { st, fs, k, lines, space, lh: fs * st.lineH };
  }
  function drawText(c, t) {
    const L = layoutText(c, t), { st, fs, k, lines, space, lh } = L, W = state.w, H = state.h, local = t - c.start;
    const A = animState(c, local), totalH = lines.length * lh, maxLW = Math.max(10, ...lines.map(l => l.w));
    const K = kv(c, local);
    const cx = W / 2 + (K.x + A.dx) * W, cy = H / 2 + (K.y + A.dy) * H, s = K.scale * A.sc, rot = K.rot + A.rot;
    g.save(); g.globalAlpha = clamp(K.opacity * A.alpha, 0, 1);
    g.translate(cx, cy); g.rotate(rot * Math.PI / 180); g.scale(s, s);
    if (A.blur) g.filter = `blur(${A.blur}px)`;
    g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    const pad = fs * .28;
    if (st.bg) { g.fillStyle = hexA(st.bg, st.bgAlpha); lines.forEach((l, i) => { if (!l.toks.length) return; const y = -totalH / 2 + lh * i; g.beginPath(); g.roundRect(-l.w / 2 - pad, y - pad * .25, l.w + pad * 2, lh + pad * .5, fs * .2); g.fill(); }); }
    lines.forEach((l, i) => {
      const y = -totalH / 2 + lh * (i + .5); let x = -l.w / 2;
      for (const tk of l.toks) {
        const active = tk.active && st.hlMode !== 'none';
        g.save();
        if (active && st.pop) { const mx = x + tk.w / 2; g.translate(mx, y); g.scale(1.12, 1.12); g.translate(-mx, -y); }
        if (active && st.hlMode === 'box') { g.fillStyle = st.hl; g.beginPath(); g.roundRect(x - fs * .12, y - fs * .62, tk.w + fs * .24, fs * 1.2, fs * .16); g.fill(); }
        if (st.glow) { g.shadowColor = st.glow; g.shadowBlur = fs * .45; }
        else if (st.shadow) { g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = fs * .14; g.shadowOffsetY = fs * .05; }
        if (st.strokeW > 0) { g.strokeStyle = st.stroke; g.lineWidth = st.strokeW * k; g.strokeText(tk.txt, x, y); g.shadowColor = 'transparent'; }
        g.fillStyle = active && st.hlMode === 'color' ? st.hl : st.color; g.fillText(tk.txt, x, y);
        g.restore(); x += tk.w + space;
      }
    });
    g.restore();
    hitBoxes.push({ id: c.id, cx, cy, w: (maxLW + pad * 2) * s, h: (totalH + pad) * s, rot });
  }
  const holdCanvas = document.createElement('canvas'); let holdReady = false, frameMissing = false;
  function drawFrame() {
    const W = state.w, H = state.h; frameMissing = false;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    g.fillStyle = state.bg === 'white' ? '#fff' : '#000'; g.fillRect(0, 0, W, H);
    hitBoxes = [];
    const vis = state.tracks.filter(tr => tr.kind !== 'audio' && !tr.hidden).reverse();
    for (const tr of vis) {
      const cs = clipsOn(tr.id), c = cs.find(x => time >= x.start && time < x.start + x.dur);
      if (!c) continue;
      if (tr.kind === 'video') {
        const td = c.transition && c.transition.type !== 'none' ? Math.min(c.transition.dur, c.dur) : 0;
        if (td && time < c.start + td) {
          const prev = cs.find(x => x !== c && Math.abs(x.start + x.dur - c.start) < .05);
          drawTransition(c, prev, easeIO((time - c.start) / td), tr.main);
        } else { if (tr.main && state.bg === 'blur') drawBlurBg(c, time); drawVisual(c, time); }
        if (c.effect && c.effect !== 'none') overlayEffects(c, time - c.start);
      } else drawText(c, time);
    }
    // Ist ein Video gerade noch nicht bereit (z.B. direkt nach einem Schnitt), das letzte gute Bild zeigen statt Schwarz
    if (frameMissing && holdReady && holdCanvas.width === W && holdCanvas.height === H) g.drawImage(holdCanvas, 0, 0);
    else if (!frameMissing) { if (holdCanvas.width !== W || holdCanvas.height !== H) { holdCanvas.width = W; holdCanvas.height = H; } holdCanvas.getContext('2d').drawImage(canvas, 0, 0); holdReady = true; }
    if (!exporting && !playing) {
      const hb = hitBoxes.find(h => h.id === selId);
      if (hb) { g.save(); g.translate(hb.cx, hb.cy); g.rotate(hb.rot * Math.PI / 180); g.strokeStyle = '#1fd1c7'; g.lineWidth = Math.max(3, W / 360); g.setLineDash([16, 10]); g.strokeRect(-hb.w / 2, -hb.h / 2, hb.w, hb.h); g.restore(); }
      if (guides) { g.save(); g.strokeStyle = '#ff3fb4'; g.lineWidth = 3; if (guides.v) { g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); } if (guides.h) { g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); } g.restore(); }
    }
  }

  /* ======================= LIVE-VORSCHAUEN (Effekte, Filter, Übergänge, Animationen) ======================= */
  (() => {
    const mk = fn => { const cv = document.createElement('canvas'); cv.width = cv.height = 240; fn(cv.getContext('2d')); return cv.toDataURL('image/jpeg', .85); };
    const A = mk(x => {
      const gr = x.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, '#ff8a4c'); gr.addColorStop(1, '#ffd36e'); x.fillStyle = gr; x.fillRect(0, 0, 240, 240);
      x.fillStyle = '#fff6b0'; x.beginPath(); x.arc(170, 80, 34, 0, 7); x.fill();
      x.fillStyle = '#3a2a6b'; x.beginPath(); x.moveTo(0, 240); x.lineTo(60, 130); x.lineTo(120, 200); x.lineTo(185, 110); x.lineTo(240, 180); x.lineTo(240, 240); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 54px sans-serif'; x.fillText('A', 18, 62);
    });
    const B = mk(x => {
      const gr = x.createLinearGradient(0, 0, 240, 240); gr.addColorStop(0, '#1fd1c7'); gr.addColorStop(1, '#3b3bd6'); x.fillStyle = gr; x.fillRect(0, 0, 240, 240);
      [[60, 170, 40, '#ffffff55'], [170, 70, 55, '#ff3fb4aa'], [190, 190, 28, '#ffe600cc']].forEach(([cx, cy, r, c]) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); });
      x.fillStyle = '#fff'; x.font = 'bold 54px sans-serif'; x.fillText('B', 18, 62);
    });
    [['demoA', A], ['demoB', B]].forEach(([id, url]) => media.set(id, { id, name: 'Demo', kind: 'image', url, w: 240, h: 240, source: 'demo', duration: Infinity }));
  })();
  function pvTile(kind, id, name, on, onClick) {
    const t = document.createElement('div'); t.className = 'tile pv-tile' + (on ? ' on' : '');
    t.innerHTML = `<canvas class="pv" width="120" height="120" data-kind="${kind}" data-id="${id}"></canvas><span>${name}</span>`;
    if (onClick) t.onclick = onClick; return t;
  }
  function drawPreviews(now) {
    const cvs = libBody.querySelectorAll('canvas.pv'); if (!cvs.length) return;
    const saved = { canvas, g, w: state.w, h: state.h, bg: state.bg, hb: hitBoxes }, vh = innerHeight;
    try {
      for (const cv of cvs) {
        const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || !r.width) continue;
        canvas = cv; g = cv.getContext('2d'); state.w = cv.width; state.h = cv.height; state.bg = 'black'; hitBoxes = [];
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
        const kind = cv.dataset.kind, id = cv.dataset.id, T = kind === 'anim' ? 1.8 : 2.6, local = (now / 1000) % T;
        const a = defaults({ id: 'pvA', type: 'image', mediaId: 'demoA', start: 0, dur: T, fit: 'cover' });
        if (kind === 'effect') { a.effect = id; drawVisual(a, local); if (id !== 'none') overlayEffects(a, local); }
        else if (kind === 'filter') { a.filter = id; a.filterAmt = 1; drawVisual(a, local); }
        else if (kind === 'anim') { a.animIn = id; a.animDur = .9; a.dur = 100; drawVisual(a, local); }
        else {
          const b = defaults({ id: 'pvB', type: 'image', mediaId: 'demoB', start: 0, dur: T, fit: 'cover' }), ph = local / T;
          if (id === 'none') drawVisual(ph < .5 ? a : b, local, { noAnim: true });
          else if (ph < .22) drawVisual(a, local, { noAnim: true });
          else if (ph < .72) { b.transition = { type: id, dur: 1 }; drawTransition(b, a, easeIO((ph - .22) / .5), false, local); }
          else drawVisual(b, local, { noAnim: true });
        }
      }
    } finally { canvas = saved.canvas; g = saved.g; state.w = saved.w; state.h = saved.h; state.bg = saved.bg; hitBoxes = saved.hb; }
  }

  /* ======================= HAUPTSCHLEIFE ======================= */
  let lastTlUpdate = 0, lastPropsT = -1;
  function loop(now) {
    if (playing) {
      time = playBase + (now - playT0) / 1000;
      const d = projDur();
      if (time >= d) { time = d; pause(); if (exporting) finishExport(); }
    }
    syncMedia(); drawFrame();
    $('#timeCur').textContent = fmt(time);
    if (now - lastTlUpdate > 30) {
      updatePlayhead(playing); lastTlUpdate = now;
      // Regler zeigen bei Keyframe-Clips den Wert am Abspielkopf
      const sc = clipById(selId);
      if (sc && sc.kf && !playing && !pendingSnap && time !== lastPropsT && !(document.activeElement && document.activeElement.type === 'range')) { lastPropsT = time; renderProps(); } if (!exporting && ['effects', 'filters', 'transitions'].includes(libTab)) drawPreviews(now); }
    if (exporting && expInfo) { const p = clamp(time / expInfo.dur, 0, 1); $('#expProg div').style.width = (p * 100) + '%'; }
  }
  // Normal per requestAnimationFrame. Ist das Fenster minimiert/verdeckt, pausiert der Browser das –
  // dann läuft Abspielen und Export über einen Timer weiter.
  let lastFrame = 0;
  function rafLoop(now) { lastFrame = performance.now(); loop(now); requestAnimationFrame(rafLoop); }
  setInterval(() => { if ((playing || exporting) && performance.now() - lastFrame > 150) loop(performance.now()); }, 33);

  /* ======================= TIMELINE ======================= */
  const tlScroll = $('#tlScroll'), tlContent = $('#tlContent'), tlTracks = $('#tlTracks'), tlHeads = $('#tlHeads'), tlRuler = $('#tlRuler'), tlPlayhead = $('#tlPlayhead'), tlSnap = $('#tlSnap');
  const trackH = t => t.main ? 64 : t.kind === 'video' ? 52 : t.kind === 'audio' ? 56 : 32;
  const clipCls = c => c.type === 'image' ? 'video' : c.type === 'audio' ? (c.sub || 'audio') : c.type;
  function renderRuler(total) {
    const steps = [.1, .2, .5, 1, 2, 5, 10, 15, 30, 60, 120]; const step = steps.find(s => s * pps >= 70) || 300;
    let h = ''; const minor = step / 5;
    for (let t = 0; t <= total; t += step) h += `<div class="tick" style="left:${t * pps}px">${fmtS(Math.round(t * 10) / 10).replace('.0s', 's')}</div>`;
    if (minor * pps >= 10) for (let t = minor; t <= total; t += minor) if (Math.abs(t / step - Math.round(t / step)) > .01) h += `<div class="tick minor" style="left:${t * pps}px"></div>`;
    h += (state.markers || []).map(mk => `<div class="marker" style="left:${mk * pps}px" data-t="${mk}" title="Marker – Klick: hinspringen, Rechtsklick: löschen"></div>`).join('');
    tlRuler.innerHTML = h;
  }
  function drawWave(c, cv, wpx) {
    const m = media.get(c.mediaId); if (!m) return; ensurePeaks(m); if (!m.peaks || !m.peaks.length) return;
    const w = Math.min(Math.floor(wpx), 4000), h = cv.height = 26; cv.width = w; cv.style.width = Math.min(wpx, 4000) + 'px';
    const x = cv.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < w; i++) { const st = srcAt(c, i / pps); const pk = m.peaks[Math.floor(st * 100)] || 0; const a = Math.min(1, pk * c.volume * vcurve(c, i / pps) * 1.4) * h; x.fillRect(i, (h - a) / 2, 1, Math.max(1, a)); }
  }
  /* ---------- Kurven direkt auf dem Clip: Lautstärke (gelb) oder Tonhöhe (türkis) ---------- */
  const vtip = document.createElement('div'); vtip.className = 'vtip'; document.body.appendChild(vtip);
  const volTxt = v => v <= .001 ? 'stumm' : `${Math.round(v * 100)} %  (${(20 * Math.log10(v)).toFixed(1)} dB)`;
  const pitchTxt = v => Math.abs(v) < .01 ? 'Original (Tempo 100 %)' : `${v > 0 ? '+' : ''}${v.toFixed(1)} Halbtöne · Tempo ${Math.round(Math.pow(2, v / 12) * 100)} %`;
  const CURVES = {
    vol: { key: 'vk', min: 0, max: 2, def: 1, cls: 'vol', txt: volTxt, step: 0, hint: 'lauter/leiser' },
    pitch: { key: 'pk', min: -12, max: 12, def: 0, cls: 'pitch', txt: pitchTxt, step: .5, hint: 'höher/tiefer' },
  };
  function curveEl(c, mode) {
    const C = CURVES[mode], K = C.key, ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'vcurve ' + C.cls);
    const h = Math.max(12, trackH(trackById(c.trackId) || { kind: 'audio' }) - 6 - 3 - 14);
    const Y = v => 3 + (1 - (v - C.min) / (C.max - C.min)) * (h - 6);
    const val = l => curveAt(c[K], l, C.def);
    const draw = () => {
      const w = Math.max(4, c.dur * pps); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const step = Math.max(2, w / 500); let p = '';
      for (let x = 0; x <= w + .01; x += step) p += (x ? 'L' : 'M') + Math.min(x, w).toFixed(1) + ' ' + Y(val(Math.min(x, w) / pps)).toFixed(1);
      svg.innerHTML = (mode === 'pitch' ? `<line class="vc-mid" x1="0" x2="${w}" y1="${Y(0)}" y2="${Y(0)}"/>` : '') +
        `<path class="vc-hit" d="${p}"><title>Klicken = Punkt setzen, ziehen = ${C.hint}</title></path><path class="vc-line" d="${p}"/>` +
        (c[K] || []).map((k, i) => `<circle class="vc-pt" data-i="${i}" cx="${k.t * pps}" cy="${Y(k.v)}" r="5"><title>Doppelklick = Punkt löschen</title></circle>`).join('');
    };
    draw();
    svg.addEventListener('pointerdown', e => {
      if (e.button !== 0 || isLocked(c)) return; e.stopPropagation(); e.preventDefault();
      if (selId !== c.id) { selId = c.id; renderProps(); tlTracks.querySelectorAll('.clip.sel').forEach(x => x.classList.remove('sel')); svg.parentElement.classList.add('sel'); }
      const snap = snapshot(), r = svg.getBoundingClientRect();
      const toTV = ev => ({ t: clamp((ev.clientX - r.left) / pps, 0, c.dur), v: clamp(C.min + (1 - ((ev.clientY - r.top) - 3) / (h - 6)) * (C.max - C.min), C.min, C.max) });
      const ci = e.target.getAttribute && e.target.getAttribute('data-i'); let pt;
      if (ci != null) pt = c[K][+ci];
      else {
        const p = toTV(e); if (!c[K] || !c[K].length) c[K] = [{ t: 0, v: C.def }, { t: c.dur, v: C.def }];
        pt = { t: p.t, v: val(p.t) }; c[K].push(pt); c[K].sort((a, b) => a.t - b.t); draw();
      }
      const tip = ev => { vtip.textContent = C.txt(pt.v); vtip.style.left = ev.clientX + 14 + 'px'; vtip.style.top = ev.clientY - 30 + 'px'; vtip.classList.add('show'); };
      tip(e);
      const mv = ev => {
        const p = toTV(ev), i = c[K].indexOf(pt), lo = i > 0 ? c[K][i - 1].t + .01 : 0, hi = i < c[K].length - 1 ? c[K][i + 1].t - .01 : c.dur;
        pt.t = clamp(p.t, lo, Math.max(lo, hi));
        let v = C.step ? Math.round(p.v / C.step) * C.step : p.v; if (Math.abs(v - C.def) < (C.max - C.min) * .02) v = C.def; pt.v = v;
        draw(); tip(ev);
      };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); vtip.classList.remove('show'); undoStack.push(snap); redoStack = []; renderAll(); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    svg.addEventListener('dblclick', e => {
      e.stopPropagation(); const ci = e.target.getAttribute && e.target.getAttribute('data-i'); if (ci == null) return;
      mutate(() => { c[K].splice(+ci, 1); if (c[K].length < 2 && c[K].every(k => k.v === C.def)) c[K] = null; });
    });
    return svg;
  }
  function clipEl(c) {
    const d = document.createElement('div'); d.className = 'clip t-' + clipCls(c) + (c.id === selId ? ' sel' : '') + (isLocked(c) ? ' locked' : ''); d.dataset.id = c.id;
    d.style.left = c.start * pps + 'px'; d.style.width = Math.max(4, c.dur * pps) + 'px';
    const m = media.get(c.mediaId);
    if ((c.type === 'video' || c.type === 'image') && m && m.thumb) { d.style.backgroundImage = `url(${m.thumb})`; d.style.backgroundSize = 'auto 100%'; }
    let label = c.type === 'text' ? '𝐓 ' + (c.text || '') : c.type === 'caption' ? (c.words || []).filter(w => w.e > c.in && w.s < c.in + c.dur).map(w => w.w).join(' ') : (c.name || (m && m.name) || '');
    if (c.speed !== 1) label = c.speed + 'x · ' + label;
    if (tapeOn(c)) label = '🎵⏩ ' + label;
    d.innerHTML = `<span class="lbl">${esc(label)}</span><div class="h l"></div><div class="h r"></div>`;
    if (c.type === 'audio') { const cv = document.createElement('canvas'); cv.className = 'wave'; d.appendChild(cv); drawWave(c, cv, c.dur * pps); }
    if (c.type === 'audio' || c.type === 'video') d.appendChild(curveEl(c, ui.curveMode));
    const badges = [];
    if (c.filter && c.filter !== 'none') badges.push('◐'); if (c.effect && c.effect !== 'none') badges.push('✦'); if (c.animIn !== 'none' || c.animOut !== 'none') badges.push('↯'); if (c.ck && c.ck.on) badges.push('🟩');
    if (badges.length) d.insertAdjacentHTML('beforeend', `<span class="fx">${badges.join(' ')}</span>`);
    if (c.transition && c.transition.type !== 'none') d.insertAdjacentHTML('beforeend', '<span class="tr"></span>');
    if (c.kf) d.insertAdjacentHTML('beforeend', c.kf.filter(k => k.t >= 0 && k.t <= c.dur).map(k => `<span class="kfd" style="left:${k.t * pps}px"></span>`).join(''));    return d;
  }
  function renderTimeline() {
    const total = Math.max(projDur() + 20, 60);
    tlContent.style.width = total * pps + 'px';
    renderRuler(total);
    tlHeads.innerHTML = ''; tlTracks.innerHTML = '';
    for (const tr of state.tracks) {
      const h = trackH(tr);
      const head = document.createElement('div'); head.className = 'tl-head'; head.style.height = h + 'px';
      const ic = tr.kind === 'video' ? (tr.main ? '🎬' : '🖼') : tr.kind === 'audio' ? '♫' : 'T';
      head.innerHTML = `<span>${ic}</span><span class="nm">${esc(tr.name)}</span>` +
        (tr.kind !== 'text' ? `<button data-a="mute" title="Stumm">${tr.muted ? '🔇' : '🔊'}</button>` : '') +
        `<button data-a="lock" title="Spur sperren">${tr.locked ? '🔒' : '🔓'}</button>` + (tr.kind !== 'audio' ? `<button data-a="hide" title="Ausblenden">${tr.hidden ? '🙈' : '👁'}</button>` : '');
      head.querySelectorAll('button').forEach(b => b.onclick = () => mutate(() => { if (b.dataset.a === 'mute') tr.muted = !tr.muted; else if (b.dataset.a === 'lock') tr.locked = !tr.locked; else tr.hidden = !tr.hidden; }));
      tlHeads.appendChild(head);
      const row = document.createElement('div'); row.className = 'track' + (tr.main ? ' main' : ''); row.style.height = h + 'px'; row.dataset.id = tr.id;
      for (const c of clipsOn(tr.id)) row.appendChild(clipEl(c));
      tlTracks.appendChild(row);
    }
    if (!state.clips.length) tlTracks.insertAdjacentHTML('beforeend', '<div class="tl-empty">⬅ Importiere links Medien und klicke auf ＋ – oder zieh Dateien direkt hierher.</div>');
    tlHeads.insertAdjacentHTML('beforeend', '<div style="height:200px"></div>');
    $('#timeDur').textContent = fmt(projDur());
    updatePlayhead();
  }
  function updatePlayhead(follow) {
    const x = time * pps; tlPlayhead.style.left = x + 'px';
    if (follow) { const v = tlScroll.scrollLeft, w = tlScroll.clientWidth; if (x > v + w - 40 || x < v) tlScroll.scrollLeft = x - 60; }
  }
  tlScroll.addEventListener('scroll', () => { tlHeads.scrollTop = tlScroll.scrollTop; });
  const xToTime = clientX => Math.max(0, (clientX - tlContent.getBoundingClientRect().left) / pps);
  function seekDrag(e) {
    pause(); setTime(xToTime(e.clientX));
    const mv = ev => setTime(xToTime(ev.clientX)), up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  tlRuler.addEventListener('pointerdown', seekDrag);
  tlPlayhead.querySelector('.ph-knob').addEventListener('pointerdown', e => { e.stopPropagation(); seekDrag(e); });
  function snapPoints(ex) { const p = [0, time, ...(state.markers || [])]; for (const c of state.clips) if (c.id !== ex) p.push(c.start, c.start + c.dur); return p; }
  function snapVal(v, ex) {
    if (!ui.snap) return { v, p: null }; let best = null;
    for (const p of snapPoints(ex)) { const d = p - v; if (Math.abs(d) * pps < 9 && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, p }; }
    return best ? { v: v + best.d, p: best.p } : { v, p: null };
  }
  function showSnap(p) { if (p == null) tlSnap.style.display = 'none'; else { tlSnap.style.display = 'block'; tlSnap.style.left = p * pps + 'px'; } }

  tlTracks.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const ce = e.target.closest('.clip');
    if (!ce) { if (e.target.closest('.track')) { select(null); seekDrag(e); } return; }
    const c = clipById(ce.dataset.id); if (!c) return;
    if (isLocked(c)) { if (selId !== c.id) select(c.id); toast('Spur ist gesperrt 🔒'); return; }
    const mode = e.target.classList.contains('h') ? (e.target.classList.contains('l') ? 'l' : 'r') : 'move';
    if (selId !== c.id) select(c.id);
    const el = () => tlTracks.querySelector(`.clip[data-id="${c.id}"]`);
    const dr = { x0: e.clientX, y0: e.clientY, start: c.start, dur: c.dur, in: c.in, snap: snapshot(), moved: false, track: c.trackId, kf: c.kf ? c.kf.map(k => ({ ...k })) : null, vk: c.vk ? c.vk.map(k => ({ ...k })) : null, pk: c.pk ? c.pk.map(k => ({ ...k })) : null, clip: JSON.parse(JSON.stringify(c)) };
    const mv = ev => {
      const dx = ev.clientX - dr.x0;
      if (!dr.moved && Math.abs(dx) < 3 && Math.abs(ev.clientY - dr.y0) < 3) return;
      dr.moved = true; const node = el(); if (!node) return; node.classList.add('dragging');
      if (mode === 'move') {
        let ns = Math.max(0, dr.start + dx / pps), sp = null;
        if (ui.snap) { const a = snapVal(ns, c.id), b = snapVal(ns + c.dur, c.id); if (a.p != null && (b.p == null || Math.abs(a.v - ns) <= Math.abs(b.v - ns - c.dur))) { ns = a.v; sp = a.p; } else if (b.p != null) { ns = b.v - c.dur; sp = b.p; } }
        c.start = Math.max(0, ns); showSnap(sp);
        const row = [...tlTracks.querySelectorAll('.track')].find(r => { const b = r.getBoundingClientRect(); return ev.clientY >= b.top && ev.clientY < b.bottom; });
        if (row && row.dataset.id !== c.trackId && trackById(row.dataset.id).kind === kindOf(c)) { c.trackId = row.dataset.id; row.appendChild(node); }
        node.style.left = c.start * pps + 'px';
      } else if (mode === 'l') {
        const r = snapVal(dr.start + dx / pps, c.id); showSnap(r.p);
        const minStart = hasIn(c) ? dr.start - dr.in / c.speed : 0;
        const ns = clamp(r.v, Math.max(0, minStart), dr.start + dr.dur - .1), delta = ns - dr.start;
        const origIn = dr.clip && tapeOn(dr.clip) ? srcAt(dr.clip, delta) : dr.in + delta * c.speed;
        c.start = ns; c.dur = dr.dur - delta; if (hasIn(c)) c.in = c.type === 'caption' ? dr.in + delta : origIn;
        if (dr.kf) c.kf = dr.kf.map(k => ({ ...k, t: k.t - delta }));
        if (dr.vk) c.vk = dr.vk.map(k => ({ ...k, t: k.t - delta }));
        if (dr.pk) c.pk = dr.pk.map(k => ({ ...k, t: k.t - delta }));
        node.style.left = c.start * pps + 'px'; node.style.width = c.dur * pps + 'px';
      } else {
        const r = snapVal(dr.start + dr.dur + dx / pps, c.id); showSnap(r.p);
        const maxEnd = hasIn(c) && c.type !== 'caption' ? c.start + maxDur(c) : Infinity;
        c.dur = clamp(r.v, c.start + .1, maxEnd) - c.start; node.style.width = c.dur * pps + 'px';
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); showSnap(null);
      if (!dr.moved) return;
      if (!isFree(c.trackId, c.start, c.dur, c.id)) c.trackId = findFreeTrack(kindOf(c), c.start, c.dur, c.id).id;
      undoStack.push(dr.snap); redoStack = []; cleanupTracks(); renderAll();
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  tlTracks.addEventListener('dblclick', e => { const ce = e.target.closest('.clip'); if (ce) { const c = clipById(ce.dataset.id); if (c && (c.type === 'text' || c.type === 'caption')) { const ta = $('#propsBody textarea'); if (ta) ta.focus(); } } });
  tlScroll.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.altKey) return; e.preventDefault();
    const t = xToTime(e.clientX), off = e.clientX - tlScroll.getBoundingClientRect().left;
    setZoom(pps * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); tlScroll.scrollLeft = t * pps - off;
  }, { passive: false });
  function setZoom(v) { pps = clamp(v, 10, 400); $('#tZoom').value = pps; renderTimeline(); }

  // Drag & Drop aus der Bibliothek / vom Desktop
  tlScroll.addEventListener('dragover', e => { e.preventDefault(); tlTracks.querySelectorAll('.track').forEach(r => r.classList.remove('drop-target')); const r = e.target.closest && e.target.closest('.track'); if (r) r.classList.add('drop-target'); });
  tlScroll.addEventListener('dragleave', () => tlTracks.querySelectorAll('.track').forEach(r => r.classList.remove('drop-target')));
  tlScroll.addEventListener('drop', e => {
    e.preventDefault(); tlTracks.querySelectorAll('.track').forEach(r => r.classList.remove('drop-target'));
    if (e.dataTransfer.files.length) return importFiles(e.dataTransfer.files);
    let p; try { p = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
    const t = xToTime(e.clientX), row = e.target.closest && e.target.closest('.track'), tid = row ? row.dataset.id : null;
    dropPayload(p, t, tid);
  });
  function dropPayload(p, t, tid) {
    if (p.type === 'media') {
      const m = media.get(p.id); if (!m) return;
      const tr = tid && trackById(tid);
      if (m.kind === 'video' && tr && tr.kind === 'audio') addAudioFromVideo(m, t, tid); else addMediaClip(m, t, tid);
    }
    else if (p.type === 'mi') miMedia(p).then(m => addMediaClip(m, t, tid)).catch(e => toast(e.message));
    else if (p.type === 'sfx') addMediaClip(mediaFromSfx(p.id), t, tid);
    else if (p.type === 'style') addTextClip(allStyles()[p.idx], t, tid);
  }

  /* ======================= BEARBEITEN ======================= */
  function select(id) { selId = id; renderAll(); }
  function splitClip(c, t) {
    if (t <= c.start + .03 || t >= c.start + c.dur - .03) return null;
    const n = JSON.parse(JSON.stringify(c)); n.id = uid(); const off = t - c.start;
    n.start = t; n.dur = c.dur - off; if (hasIn(c)) n.in = c.type === 'caption' ? c.in + off : srcAt(c, off);
    if (n.kf) n.kf = n.kf.map(k => ({ ...k, t: k.t - off }));
    if (n.vk) n.vk = n.vk.map(k => ({ ...k, t: k.t - off }));
    if (n.pk) n.pk = n.pk.map(k => ({ ...k, t: k.t - off }));
    c.dur = off; n.transition = null; n.animIn = 'none'; c.animOut = 'none'; n.fadeIn = 0; c.fadeOut = 0;
    state.clips.push(n); ensureEl(n); return n;
  }
  function targetClips() {
    const s = clipById(selId);
    if (s && !isLocked(s) && time > s.start && time < s.start + s.dur) return [s];
    const at = c => !isLocked(c) && time > c.start && time < c.start + c.dur, main = state.clips.filter(c => c.trackId === 'main' && at(c));
    return main.length ? main : state.clips.filter(at);
  }
  function toggleMarker() {
    mutate(() => { const m = state.markers || (state.markers = []), i = m.findIndex(x => Math.abs(x - time) < .05); if (i >= 0) m.splice(i, 1); else { m.push(time); m.sort((a, b) => a - b); } });
  }
  tlRuler.addEventListener('pointerdown', e => { const mk = e.target.closest('.marker'); if (mk) { e.stopImmediatePropagation(); pause(); setTime(+mk.dataset.t); } }, true);
  tlRuler.addEventListener('contextmenu', e => { const mk = e.target.closest('.marker'); if (!mk) return; e.preventDefault(); mutate(() => { state.markers = state.markers.filter(x => Math.abs(x - +mk.dataset.t) > 1e-6); }); });
  function doSplit() {
    const cs = targetClips(); if (!cs.length) return toast('Kein Clip am Abspielkopf');
    mutate(() => { let last; cs.forEach(c => { last = splitClip(c, time) || last; }); if (last) selId = last.id; });
  }
  function shiftAfter(trackId, from, by) { state.clips.forEach(c => { if (c.trackId === trackId && c.start >= from - 1e-4) c.start = Math.max(0, c.start - by); }); }
  function doTrimSide(side) {
    const cs = targetClips(); if (!cs.length) return toast('Kein Clip am Abspielkopf');
    mutate(() => cs.forEach(c => {
      const n = splitClip(c, time); if (!n) return;
      if (side === 'left') { state.clips = state.clips.filter(x => x !== c); const gap = n.start - c.start; if (ui.ripple || c.trackId === 'main') { shiftAfter(n.trackId, n.start, gap); setTime(c.start); } selId = n.id; }
      else { state.clips = state.clips.filter(x => x !== n); selId = c.id; }
    }));
  }
  function doDelete() {
    const c = clipById(selId); if (!c) return; if (isLocked(c)) return toast('Spur ist gesperrt 🔒');
    mutate(() => { state.clips = state.clips.filter(x => x !== c); if (ui.ripple) shiftAfter(c.trackId, c.start + c.dur, c.dur); selId = null; });
  }
  function doDuplicate() {
    const c = clipById(selId); if (!c) return;
    mutate(() => { const n = JSON.parse(JSON.stringify(c)); delete n.id; n.start = c.start + c.dur; const nc = addClip(n, c.trackId); selId = nc.id; });
  }
  function applyToTarget(fn, kinds = ['video', 'image']) {
    let c = clipById(selId);
    if (!c || !kinds.includes(c.type)) c = state.clips.find(x => x.trackId === 'main' && time >= x.start && time < x.start + x.dur && kinds.includes(x.type));
    if (!c) { toast('Wähle zuerst einen Clip in der Timeline aus'); return null; }
    mutate(() => { fn(c); selId = c.id; }); return c;
  }

  /* ======================= BIBLIOTHEK ======================= */
  const libBody = $('#libBody');
  const previewAudio = new Audio(); let previewId = null;
  function previewSound(id, btn) {
    if (previewId === id && !previewAudio.paused) { previewAudio.pause(); previewId = null; renderLibButtons(); return; }
    const m = mediaFromSfx(id); previewAudio.src = m.url; previewAudio.currentTime = 0; previewAudio.play(); previewId = id; renderLibButtons();
  }
  previewAudio.onended = () => { previewId = null; renderLibButtons(); };
  function renderLibButtons() {
    libBody.querySelectorAll('[data-prev]').forEach(b => {
      const on = b.dataset.prev === previewId && !previewAudio.paused;
      if (b.closest('.mi-btn')) b.closest('.mi-btn').classList.toggle('playing', on); else b.textContent = on ? '❚❚' : '▶';
    });
  }
  const loadStyles = () => { try { return JSON.parse(localStorage.getItem('cutfree.styles') || '[]'); } catch { return []; } };
  const saveStyles = a => { try { localStorage.setItem('cutfree.styles', JSON.stringify(a)); } catch { } };
  const allStyles = () => [...loadStyles().map(s => ({ ...BASE_STYLE, ...s, mine: true })), ...STYLE_PRESETS];
  function styleTileCss(st) {
    return `font-family:'${st.font}';font-weight:${st.weight};color:${st.color};${st.strokeW ? `-webkit-text-stroke:${Math.min(3, st.strokeW / 4)}px ${st.stroke};paint-order:stroke fill;` : ''}` +
      `${st.bg ? `background:${hexA(st.bg, st.bgAlpha)};` : ''}${st.upper ? 'text-transform:uppercase;' : ''}${st.glow ? `text-shadow:0 0 8px ${st.glow};` : st.shadow ? 'text-shadow:0 2px 4px #000a;' : ''}`;
  }
  function styleGrid(onPick, activeName) {
    const mine = loadStyles();
    let h = '';
    if (mine.length) {
      h += '<h4>Meine Styles</h4><div class="grid two">' + mine.map((s, i) => `<div class="tile textpreset ${activeName === s.name ? 'on' : ''}" data-si="${i}" draggable="true" style="${styleTileCss({ ...BASE_STYLE, ...s })}">${esc(s.name)}<span class="add" data-del="${i}" title="Löschen" style="background:#ff4d6d">×</span></div>`).join('') + '</div>';
    }
    h += '<h4>Vorlagen</h4><div class="grid two">' + STYLE_PRESETS.map((s, i) => `<div class="tile textpreset ${activeName === s.name ? 'on' : ''}" data-si="${mine.length + i}" draggable="true" style="${styleTileCss(s)}">${s.name}</div>`).join('') + '</div>';
    const wrap = document.createElement('div'); wrap.innerHTML = h;
    wrap.querySelectorAll('[data-si]').forEach(t => {
      t.onclick = e => { if (e.target.dataset.del != null) { const a = loadStyles(); a.splice(+e.target.dataset.del, 1); saveStyles(a); renderAll(); return; } onPick(allStyles()[+t.dataset.si]); };
      t.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'style', idx: +t.dataset.si }));
    });
    return wrap;
  }
  function getCapStyleName() { try { return localStorage.getItem('cutfree.capStyle') || 'Hormozi'; } catch { return 'Hormozi'; } }
  function renderLib() {
    $('#libTabs').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === libTab));
    libBody.innerHTML = ''; const sel = clipById(selId);
    if (libTab === 'media') {
      libBody.innerHTML = `<button class="import-btn" id="impBtn">＋ Importieren<br><small>Video, Foto oder Audio – oder einfach reinziehen</small></button><div class="grid" id="mGrid"></div>`;
      $('#impBtn').onclick = () => $('#fileInput').click();
      const files = [...media.values()].filter(m => m.source === 'file');
      $('#mGrid').innerHTML = files.map(m => `<div class="tile media-tile" draggable="true" data-id="${m.id}">${m.thumb ? `<img src="${m.thumb}">` : `<div class="ph">${m.loading || m.kind === 'video' ? '⏳' : m.kind === 'audio' ? '♫' : '▣'}</div>`}${isFinite(m.duration) ? `<span class="dur">${fmtS(m.duration)}</span>` : ''}<div class="meta">${esc(m.name)}</div>${m.kind === 'video' ? '<span class="add snd" title="Nur den Ton einfügen" style="right:28px">♫</span>' : ''}<span class="add">＋</span></div>`).join('') || '<p class="muted small" style="grid-column:1/-1">Noch keine Medien. Tipp: Klicke auf ＋ bei einem Clip, um ihn ans Ende der Hauptspur zu setzen.</p>';
      $('#mGrid').querySelectorAll('.media-tile').forEach(t => { t.onclick = e => { const m = media.get(t.dataset.id); e.target.classList.contains('snd') ? addAudioFromVideo(m) : addMediaClip(m); }; t.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'media', id: t.dataset.id })); });
    }
    else if (libTab === 'audio') {
      const cats = [['Myinstants', '🔥 Soundeffects'], ['Meine', '📁 Meine Audios'], ['Musik', 'Beats'], ['Natur', 'Natur'], ['Lustig', 'Lustig (eigene)'], ['Übergänge', 'Übergänge']];
      libBody.innerHTML = `<div class="chips">${cats.map(([c, n]) => `<span class="chip ${c === audioCat ? 'on' : ''}" data-c="${c}">${n}</span>`).join('')}</div><div id="sList"></div>`;
      libBody.querySelectorAll('.chip').forEach(ch => ch.onclick = () => { audioCat = ch.dataset.c; renderLib(); });
      const list = $('#sList');
      if (audioCat === 'Myinstants') return renderMyinstants(list);
      if (audioCat === 'Meine') {
        list.innerHTML = `<button class="import-btn" id="impA">＋ Audio importieren<br><small>MP3, WAV, M4A … – oder ein Video, um nur den Ton zu nehmen</small></button>
          <div class="note">Songs von Spotify lassen sich nicht direkt einbauen (Kopierschutz). Wenn du einen Song als MP3-Datei hast, zieh ihn einfach hier rein.</div>`;
        $('#impA').onclick = () => $('#fileInput').click();
        const mine = [...media.values()].filter(m => m.source === 'file' && (m.kind === 'audio' || m.kind === 'video'));
        if (mine.length) list.insertAdjacentHTML('beforeend', '<h4>Deine Dateien</h4>');
        mine.forEach(m => {
          const r = document.createElement('div'); r.className = 'sound-row'; r.draggable = m.kind === 'audio';
          r.innerHTML = `<button class="pl">▶</button><span>${m.kind === 'video' ? '🎬' : '♫'}</span><span class="nm">${esc(m.name)}</span><span class="muted small">${fmtS(m.duration)}</span><button class="ad" title="${m.kind === 'video' ? 'Nur den Ton aus dem Video einfügen' : 'Einfügen'}">${m.kind === 'video' ? '＋ Ton' : '＋'}</button>`;
          r.querySelector('.pl').onclick = () => { if (previewAudio.src === m.url && !previewAudio.paused) previewAudio.pause(); else { previewAudio.src = m.url; previewAudio.play(); } };
          r.querySelector('.ad').onclick = () => m.kind === 'video' ? addAudioFromVideo(m) : addMediaClip(m);
          r.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'media', id: m.id }));
          list.appendChild(r);
        });
        return;
      }
      if (audioCat === 'Musik') list.innerHTML = `<div class="note">Lizenzfreie Beats zum direkt Benutzen. Eigene Songs (MP3) gehen über „Meine Audios“.</div>`;
      SFX.LIST.filter(s => s.cat === audioCat).forEach(s => {
        const r = document.createElement('div'); r.className = 'sound-row'; r.draggable = true;
        r.innerHTML = `<button class="pl" data-prev="${s.id}">▶</button><span>${s.icon}</span><span class="nm">${s.name}</span><button class="ad" title="An Abspielkopf einfügen">＋</button>`;
        r.querySelector('.pl').onclick = e => { e.stopPropagation(); previewSound(s.id); };
        r.querySelector('.ad').onclick = e => { e.stopPropagation(); addMediaClip(mediaFromSfx(s.id)); toast(s.name + ' eingefügt'); };
        r.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'sfx', id: s.id }));
        list.appendChild(r);
      });
      renderLibButtons();
    }
    else if (libTab === 'text') {
      libBody.innerHTML = `<button class="import-btn" id="addTxt" style="font-size:15px;color:var(--text)">＋ Text hinzufügen</button><p class="muted small">Klick auf einen Style = neuer Text am Abspielkopf. Ist ein Text ausgewählt, wird der Style darauf angewendet.</p>`;
      $('#addTxt').onclick = () => addTextClip(STYLE_PRESETS[0]);
      libBody.appendChild(styleGrid(st => {
        if (sel && (sel.type === 'text' || sel.type === 'caption')) mutate(() => { sel.style = stripStyle(st); });
        else addTextClip(stripStyle(st));
      }, sel && sel.style && sel.style.name));
    }
    else if (libTab === 'stickers') renderStickersTab();
    else if (libTab === 'captions') renderCaptionsTab();
    else if (libTab === 'voice') renderVoiceTab();
    else if (libTab === 'effects') {
      libBody.innerHTML = `<p class="muted small">Die Vorschauen laufen live. Klick wendet den Effekt auf den ausgewählten Clip an (sonst auf den Clip am Abspielkopf).</p><h4>Video-Effekte</h4><div class="grid" id="efGrid"></div><h4>Animationen (Rein)</h4><div class="grid" id="anGrid"></div>`;
      EFFECTS.forEach(([id, nm]) => $('#efGrid').appendChild(pvTile('effect', id, nm, sel && sel.effect === id, () => applyToTarget(c => c.effect = id))));
      ANIMS.filter(a => a[0] !== 'typewriter').forEach(([id, nm]) => $('#anGrid').appendChild(pvTile('anim', id, nm, sel && sel.animIn === id, () => applyToTarget(c => c.animIn = id, ['video', 'image', 'text', 'caption']))));
    }
    else if (libTab === 'filters') {
      libBody.innerHTML = `<div class="slider"><span>Intensität</span><input type="range" min="0" max="1" step=".05" value="${sel ? sel.filterAmt : ui.filterAmt}" id="fAmt"><output>${Math.round((sel ? sel.filterAmt : ui.filterAmt) * 100)}%</output></div><div class="grid"></div>`;
      const gr = libBody.querySelector('.grid');
      FILTERS.forEach(([id, nm]) => gr.appendChild(pvTile('filter', id, nm, sel && sel.filter === id, () => applyToTarget(c => { c.filter = id; c.filterAmt = ui.filterAmt; }))));
      $('#fAmt').oninput = e => { ui.filterAmt = +e.target.value; e.target.nextElementSibling.textContent = Math.round(ui.filterAmt * 100) + '%'; const c = clipById(selId); if (c && c.filterAmt != null) { beginEdit(); c.filterAmt = ui.filterAmt; } };
      $('#fAmt').onchange = endEdit;
    }
    else if (libTab === 'transitions') {
      libBody.innerHTML = `<p class="muted small">Übergang wird am <b>Anfang</b> des ausgewählten Clips eingefügt (vom vorherigen Clip in diesen hinein).</p>
        <div class="slider"><span>Dauer</span><input type="range" min=".1" max="2" step=".05" value="${ui.trDur}" id="trDur"><output>${ui.trDur.toFixed(2)}s</output></div>
        <button class="wide" id="trAll" style="margin-bottom:8px">Ausgewählten Übergang auf alle Clips der Hauptspur</button>
        <input id="trQ" class="wide" placeholder="Übergang suchen (z.B. cube, glitch, zoom, swirl …)" value="${esc(ui.trQ || '')}" style="margin-bottom:6px">
        <h4>Basis</h4><div class="grid" id="trBase"></div><h4>Profi ✨ <span class="muted" id="trCount" style="text-transform:none"></span></h4><div class="grid" id="trPro"></div>`;
      const cur = sel && sel.transition ? sel.transition.type : 'none';
      const pick = id => { const c = applyToTarget(c => c.transition = id === 'none' ? null : { type: id, dur: ui.trDur }); if (c) { setTime(c.start); play(); setTimeout(() => { if (time > c.start + ui.trDur + .3) pause(); }, (ui.trDur + .5) * 1000); } };
      const fill = () => {
        const q = (ui.trQ || '').toLowerCase(), match = (...s) => !q || s.join(' ').toLowerCase().includes(q);
        $('#trBase').innerHTML = ''; $('#trPro').innerHTML = '';
        TRANSITIONS.filter(([id, nm]) => match(id, nm)).forEach(([id, nm]) => { const t = pvTile('trans', id, nm, cur === id); t.onclick = () => pick(id); $('#trBase').appendChild(t); });
        const pro = (window.GLT ? GLT.list : []).filter(t => !GLT.isBroken(t.name) && match(t.label, t.name, (t.tags || []).join(' ')));
        pro.forEach(t => { const id = 'gl:' + t.name, el = pvTile('trans', id, t.label, cur === id); el.title = t.description || ''; el.onclick = () => pick(id); $('#trPro').appendChild(el); });
        $('#trCount').textContent = `(${pro.length})`;
      };
      fill(); if (window.GLT && !GLT.list.length) GLT.ready.then(() => { if (libTab === 'transitions') fill(); });
      $('#trQ').oninput = e => { ui.trQ = e.target.value; fill(); };
      $('#trDur').oninput = e => { ui.trDur = +e.target.value; e.target.nextElementSibling.textContent = ui.trDur.toFixed(2) + 's'; const c = clipById(selId); if (c && c.transition) { beginEdit(); c.transition.dur = ui.trDur; } };
      $('#trDur').onchange = endEdit;
      $('#trAll').onclick = () => { const c = clipById(selId); const tr = c && c.transition; if (!tr) return toast('Wähle zuerst einen Clip mit Übergang aus'); mutate(() => clipsOn('main').slice(1).forEach(x => x.transition = { ...tr })); toast('Übergang auf alle Clips angewendet'); };
    }
  }
  /* ---------- Sticker ---------- */
  const STICKERS = {
    'Beliebt': '😂 🤣 😭 💀 🔥 💯 ❤️ 😍 🥺 😱 🤯 👀 😎 🤡 👻 ✨ 🎉 👍 👏 🙏 🗿 🫡 😈 💩',
    'Gesichter': '😀 😃 😄 😁 😆 😅 🙂 😉 😊 😇 🥰 😘 😜 🤪 🤨 🧐 🤓 😏 😒 😞 😔 😟 🙁 😣 😫 😩 😤 😠 😡 🤬 😳 🥵 🥶 😨 😰 😥 🤗 🤔 🤭 🤫 😶 😐 😬 🙄 😯 😴 🤤 😵 🤐 🥴 🤢 🤮 🤧 😷 🤑 🤠 👿 🤖 👽',
    'Gesten': '👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 👋 👏 🙌 🙏 💪 🫶 🤝 ✍️ 🤌',
    'Herzen & Zeichen': '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💖 💥 💢 💫 💦 💨 💬 💭 ⭐ 🌟 ⚡ ❗ ❓ ‼️ ✅ ❌ ⛔ 🚫 🆕 🆒 🔝 ⬆️ ⬇️ ➡️ ⬅️ 🔴 🟢',
    'Tiere': '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🦄 🐝 🦋 🐍 🐢 🦖 🐙 🦈 🐬',
    'Sachen': '🎮 🎧 🎤 📱 💻 📸 🎬 🍕 🍔 🍟 🌭 🍿 🍩 🍪 🎂 🍦 ☕ 🥤 ⚽ 🏀 🏆 🥇 🎁 🎈 💰 💎 👑 🚀 🚗 ⏰ 💡 🔔 📌 🧠',
  };
  const TEXT_STICKERS = [['LIKE 👍', 'Gelbe Box'], ['ABONNIEREN 🔔', 'Box'], ['WOW', 'Comic'], ['OMG', 'Beast'], ['LOL', 'Comic'], ['BRUH', 'Hormozi'], ['FAIL', 'Feuer'], ['WAIT FOR IT…', 'Gelbe Box'], ['POV:', 'Klassisch'], ['TEIL 2', 'Beast'], ['ENDE', 'Kino'], ['🔥 KRASS 🔥', 'Neon']];
  function addSticker(text, style, y = -.15) {
    const c = addTextClip({ ...style, name: style.name || 'Sticker' }, time, null, text);
    if (c) { c.animIn = 'pop'; c.name = 'Sticker'; c.y = y; renderAll(); }
  }
  function renderStickersTab() {
    libBody.innerHTML = `<p class="muted small">Klick = Sticker am Abspielkopf einfügen. Danach im Player verschieben (ziehen) und mit dem Mausrad größer/kleiner machen.</p><h4>Text-Sticker</h4><div class="grid two" id="txGrid"></div>` +
      Object.keys(STICKERS).map((k, i) => `<h4>${k}</h4><div class="grid emoji-grid" data-i="${i}"></div>`).join('');
    TEXT_STICKERS.forEach(([txt, sn]) => {
      const st = STYLE_PRESETS.find(s => s.name === sn); const t = document.createElement('div'); t.className = 'tile textpreset'; t.style.cssText = styleTileCss(st); t.textContent = txt;
      t.onclick = () => addSticker(window.I18N ? I18N.t(txt) : txt, { ...stripStyle(st), size: Math.max(st.size, 90) }, -.2); $('#txGrid').appendChild(t);
    });
    Object.values(STICKERS).forEach((list, i) => {
      const gr = libBody.querySelector(`.emoji-grid[data-i="${i}"]`);
      list.split(' ').forEach(e => { const t = document.createElement('div'); t.className = 'tile emoji'; t.textContent = e; t.onclick = () => addSticker(e, { ...BASE_STYLE, size: 260, strokeW: 0, shadow: true, hlMode: 'none', name: 'Sticker' }); gr.appendChild(t); });
    });
  }

  /* ---------- Myinstants (über den lokalen server.py) ---------- */
  const MI_CATS = [['trending', '🔥 Trends (USA)'], ['sound effects', 'Soundeffekte'], ['memes', 'Memes'], ['reactions', 'Reaktionen'], ['tiktok trends', 'TikTok-Trends'], ['viral', 'Viral'],
    ['pranks', 'Pranks'], ['games', 'Games'], ['movies', 'Filme'], ['television', 'TV'], ['anime & manga', 'Anime & Manga'], ['music', 'Musik'], ['sports', 'Sport'], ['whatsapp audios', 'WhatsApp-Audios'], ['politics', 'Politik']];
  const mi = { cat: 'sound effects', q: '', page: 0, pages: 1, items: [], loading: false, err: '' };
  const miCache = {};
  const miUrl = path => '/api/mi-audio?f=' + encodeURIComponent(path);
  async function miMedia(it) {
    if (miCache[it.path]) return miCache[it.path];
    return (miCache[it.path] = (async () => {
      const r = await fetch(miUrl(it.path)); if (!r.ok) throw new Error('Sound konnte nicht geladen werden');
      const blob = await r.blob(), m = { id: uid(), name: it.name, kind: 'audio', sub: 'sfx', blob, url: URL.createObjectURL(blob), source: 'mi', duration: 1 };
      const a = new Audio(m.url); await waitEvt(a, 'loadedmetadata'); if (isFinite(a.duration)) m.duration = a.duration;
      media.set(m.id, m); return m;
    })().catch(e => { delete miCache[it.path]; throw e; }));
  }
  function miReset() { mi.page = 0; mi.pages = 1; mi.items = []; mi.err = ''; }
  async function miLoad() {
    if (location.protocol === 'file:') { mi.err = 'Du hast index.html direkt geöffnet – so gehen die Soundeffects nicht. Schließe den Tab und starte den Editor mit Doppelklick auf START.bat.'; mi.pages = 0; return miDraw(); }
    if (mi.loading || mi.page >= mi.pages) return;
    mi.loading = true; miDraw();
    try {
      const r = await fetch(`/api/mi?cat=${encodeURIComponent(mi.cat)}&q=${encodeURIComponent(mi.q)}&page=${mi.page + 1}`);
      if (!r.ok) throw new Error(); const j = await r.json();
      mi.page++; mi.pages = Math.max(mi.page, j.pages || 0); if (!j.items.length) mi.pages = mi.page;
      const have = new Set(mi.items.map(x => x.path)); mi.items.push(...j.items.filter(x => !have.has(x.path)));
    } catch { mi.err = 'Soundeffects nicht erreichbar. Starte den Editor über START.bat (Internet nötig).'; mi.pages = 0; }
    mi.loading = false; miDraw();
  }
  function miDraw() {
    const box = $('#miList'); if (!box) return;
    box.innerHTML = ''; box.className = 'mi-grid';
    mi.items.forEach(it => {
      const r = document.createElement('div'); r.className = 'mi-item'; r.draggable = true;
      r.innerHTML = `<button class="mi-btn" style="--c:${esc(it.color || '#ff0000')}" title="Abspielen"><span data-prev="mi:${esc(it.path)}"></span></button><span class="mi-nm" title="${esc(it.name)}">${esc(it.name)}</span><button class="mi-add" title="In die Timeline einfügen">＋ Einfügen</button>`;
      r.querySelector('.mi-btn').onclick = () => {
        const id = 'mi:' + it.path;
        if (previewId === id && !previewAudio.paused) { previewAudio.pause(); previewId = null; }
        else { previewAudio.src = miUrl(it.path); previewAudio.play().catch(() => toast('Abspielen fehlgeschlagen')); previewId = id; }
        renderLibButtons();
      };
      r.querySelector('.mi-add').onclick = async () => { try { toast('Lade „' + it.name + '“…'); addMediaClip(await miMedia(it)); toast(it.name + ' eingefügt'); } catch (e) { toast(e.message); } };
      r.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'mi', path: it.path, name: it.name }));
      box.appendChild(r);
    });
    $('#miStat').textContent = mi.err || (mi.loading ? 'Lade Sounds…' : mi.items.length ? `${mi.items.length} Sounds · Seite ${mi.page} von ${mi.pages}` : 'Keine Sounds gefunden.');
    $('#miMore').hidden = mi.loading || mi.page >= mi.pages;
    renderLibButtons();
  }
  function renderMyinstants(list) {
    list.innerHTML = `<div class="row" style="margin-bottom:8px"><input id="miQ" placeholder="Suchen: bruh, fart, vine boom …" value="${esc(mi.q)}" style="flex:3"><button id="miGo" style="flex:none">🔍</button></div>
      <div class="field"><select id="miCat">${MI_CATS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></div>
      <div id="miList"></div><button class="wide" id="miMore" style="margin-top:6px">Mehr laden</button><div class="muted small" id="miStat" style="margin-top:6px"></div>`;
    $('#miCat').value = mi.cat;
    const search = () => { mi.q = $('#miQ').value.trim(); miReset(); miLoad(); };
    $('#miGo').onclick = search; $('#miQ').onkeydown = e => { if (e.key === 'Enter') search(); };
    $('#miCat').onchange = e => { mi.cat = e.target.value; mi.q = ''; $('#miQ').value = ''; miReset(); miLoad(); };
    $('#miMore').onclick = miLoad;
    list.parentElement.onscroll = () => { const p = list.parentElement; if (libTab !== 'audio' || audioCat !== 'Myinstants') return; if (p.scrollTop + p.clientHeight > p.scrollHeight - 80) miLoad(); };
    miDraw(); if (!mi.items.length && !mi.err) miLoad();
  }
  function addAudioFromVideo(m, at, trackId) {
    return mutate(() => { const c = addClip({ type: 'audio', sub: 'audio', mediaId: m.id, start: at ?? time, dur: m.duration, name: '♫ ' + m.name }, trackId); selId = c.id; toast('Ton aus „' + m.name + '“ eingefügt'); return c; });
  }
  function stripStyle(st) { const s = { ...st }; delete s.mine; return s; }
  $('#libTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { libTab = b.dataset.tab; renderLib(); } });

  /* ---------- Untertitel (KI) ---------- */
  const capUI = { model: 'onnx-community/whisper-base_timestamped', lang: window.I18N && I18N.lang === 'en' ? 'english' : 'german', words: 3, y: .28, replace: true, busy: false };
  function renderCaptionsTab() {
    const styleName = getCapStyleName();
    libBody.innerHTML = `
      <div class="note">Automatische Untertitel mit KI (Whisper) – läuft komplett <b>gratis auf deinem PC</b>. Beim ersten Mal wird das Modell einmalig geladen.</div>
      <div class="field"><span>Sprache</span><select id="cLang"><option value="german">Deutsch</option><option value="english">Englisch</option><option value="swiss german">Schweizerdeutsch (experimentell)</option><option value="french">Französisch</option><option value="italian">Italienisch</option><option value="spanish">Spanisch</option><option value="">Automatisch erkennen</option></select></div>
      <div class="field"><span>Genauigkeit</span><select id="cModel"><option value="Xenova/whisper-tiny">Schnell (~40 MB)</option><option value="onnx-community/whisper-base_timestamped">Ausgewogen (~80 MB, Wort-genau)</option><option value="Xenova/whisper-small">Beste Qualität (~250 MB, langsam)</option></select></div>
      <div class="slider"><span>Wörter/Zeile</span><input type="range" id="cWords" min="1" max="8" step="1" value="${capUI.words}"><output>${capUI.words}</output></div>
      <div class="slider"><span>Position</span><input type="range" id="cY" min="-.45" max=".45" step=".01" value="${capUI.y}"><output>${capUI.y > 0 ? 'unten' : capUI.y < 0 ? 'oben' : 'Mitte'}</output></div>
      <label class="chk" style="margin:0 0 8px"><input type="checkbox" id="cRep" ${capUI.replace ? 'checked' : ''}> Alte Untertitel ersetzen</label>
      <button class="btn-primary wide" id="cGo" ${capUI.busy ? 'disabled' : ''}>✨ Untertitel automatisch erstellen</button>
      <div class="bar" id="cBar" ${capUI.busy ? '' : 'hidden'}><div></div></div><div class="muted small" id="cStat"></div>
      <h4 style="margin-top:14px">Untertitel-Style <span class="muted" style="text-transform:none">(aktuell: ${esc(styleName)})</span></h4>
      <p class="muted small">Klick = als Standard für neue Untertitel + auf alle vorhandenen anwenden. Eigene Styles erstellst du rechts bei einem Text/Untertitel → „Als meinen Style speichern“.</p>`;
    $('#cLang').value = capUI.lang; $('#cModel').value = capUI.model;
    $('#cLang').onchange = e => capUI.lang = e.target.value; $('#cModel').onchange = e => capUI.model = e.target.value;
    $('#cWords').oninput = e => { capUI.words = +e.target.value; e.target.nextElementSibling.textContent = capUI.words; };
    $('#cY').oninput = e => { capUI.y = +e.target.value; e.target.nextElementSibling.textContent = capUI.y > .05 ? 'unten' : capUI.y < -.05 ? 'oben' : 'Mitte'; };
    $('#cRep').onchange = e => capUI.replace = e.target.checked;
    $('#cGo').onclick = generateCaptions;
    libBody.appendChild(styleGrid(st => {
      try { localStorage.setItem('cutfree.capStyle', st.name); } catch { }
      const caps = state.clips.filter(c => c.type === 'caption');
      if (caps.length) mutate(() => caps.forEach(c => c.style = stripStyle(st))); else renderLib();
      toast('Style „' + st.name + '“ gewählt');
    }, styleName));
  }
  async function mixProjectAudio() {
    const dur = projDur(), sr = 16000;
    const list = state.clips.filter(c => (c.type === 'video' || (c.type === 'audio' && c.sub !== 'music' && c.sub !== 'sfx')) && c.volume > 0 && !(trackById(c.trackId) || {}).muted);
    if (!list.length) return null;
    const oc = new OfflineAudioContext(1, Math.ceil(dur * sr) + sr, sr); let any = false;
    for (const c of list) {
      try { const ab = await getAudioBuffer(media.get(c.mediaId)); const s = oc.createBufferSource(); s.buffer = ab; s.playbackRate.value = c.speed; s.connect(oc.destination); s.start(c.start, c.in, c.dur * c.speed); any = true; }
      catch (e) { console.warn('Kein Ton in', c.name, e); }
    }
    if (!any) return null;
    return (await oc.startRendering()).getChannelData(0);
  }
  function wordsFromResult(res) {
    let words = [];
    if (res.word) words = res.chunks.map(ch => ({ w: ch.text.trim(), s: ch.timestamp[0], e: ch.timestamp[1] ?? ch.timestamp[0] + .4 }));
    else res.chunks.forEach(ch => {
      const ws = ch.text.trim().split(/\s+/).filter(Boolean), s = ch.timestamp[0], e = ch.timestamp[1] ?? s + ws.length * .35;
      const tot = ws.reduce((n, w) => n + w.length + 1, 0); let acc = 0;
      ws.forEach(w => { const a = s + (e - s) * acc / tot; acc += w.length + 1; words.push({ w, s: a, e: s + (e - s) * acc / tot }); });
    });
    words.forEach(w => { if (w.e - w.s > 1.2) w.s = w.e - .5; });
    return words.filter(w => w.w && !/^\[.*\]$/.test(w.w) && isFinite(w.s));
  }
  function groupWords(words, per) {
    const groups = []; let cur = [];
    words.forEach((w, i) => {
      const prev = cur[cur.length - 1];
      if (cur.length && (cur.length >= per || (prev && w.s - prev.e > .7) || /[.!?]$/.test(prev.w))) { groups.push(cur); cur = []; }
      cur.push(w);
    });
    if (cur.length) groups.push(cur);
    return groups;
  }
  function addCaptionGroups(groups, style, y) {
    let tr = null;
    groups.forEach((gp, i) => {
      const s = gp[0].s, next = groups[i + 1]; let e = Math.max(gp[gp.length - 1].e, s + .3); if (next) e = Math.min(e + .15, next[0].s); if (e - s < .1) e = s + .1;
      const c = defaults({ type: 'caption', start: s, dur: e - s, in: 0, words: gp.map(w => ({ w: w.w, s: w.s - s, e: w.e - s })), style: { ...style }, y, name: 'Untertitel' });
      if (!tr || !isFree(tr.id, c.start, c.dur)) tr = state.tracks.find(t => t.kind === 'text' && t.caption && isFree(t.id, c.start, c.dur)) || Object.assign(newTrack('text', 'Untertitel'), { caption: true });
      c.trackId = tr.id; state.clips.push(c);
    });
  }
  async function generateCaptions() {
    if (!window.AI) return toast('KI-Modul nicht geladen');
    if (!state.clips.length) return toast('Füge zuerst ein Video mit Ton hinzu');
    capUI.busy = true; renderLib();
    const stat = t => { const el = $('#cStat'); if (el) el.textContent = t; }, bar = v => { const b = $('#cBar div'); if (b) { b.parentElement.hidden = false; b.style.width = (v * 100) + '%'; } };
    try {
      stat('Ton wird vorbereitet…'); bar(.02);
      const audio = await mixProjectAudio(); if (!audio) throw new Error('Kein Ton gefunden (Musik & Soundeffekte werden ignoriert).');
      const res = await AI.transcribe(audio, { model: capUI.model, language: capUI.lang || null, onProgress: (v, txt) => { bar(v); stat(txt); } });
      const words = wordsFromResult(res);
      if (!words.length) throw new Error('Keine Sprache erkannt.');
      const st = stripStyle(allStyles().find(s => s.name === getCapStyleName()) || STYLE_PRESETS[1]);
      mutate(() => { if (capUI.replace) state.clips = state.clips.filter(c => c.type !== 'caption'); cleanupTracks(); addCaptionGroups(groupWords(words, capUI.words), st, capUI.y); });
      toast(words.length + ' Wörter erkannt – Untertitel erstellt ✔'); stat('Fertig! Klick einen Untertitel an, um ihn zu bearbeiten.'); bar(1);
    } catch (e) { console.error(e); toast('Fehler: ' + (e.message || e), 6000); stat('Fehler: ' + (e.message || e)); }
    capUI.busy = false; const b = $('#cGo'); if (b) b.disabled = false;
  }

  /* ---------- Stimmen (Text zu Sprache) ---------- */
  const VOICES = [
    ['normal', 'Normal', '🙂', { rate: 1 }], ['kind', 'Kind', '🧒', { rate: 1.32, shelf: 4 }], ['chipmunk', 'Chipmunk', '🐿', { rate: 1.75 }],
    ['oma', 'Oma / Opa', '👵', { rate: .93, vib: [5.5, 45] }], ['monster', 'Monster', '👹', { rate: .66, bass: 9, drive: 3 }], ['riese', 'Riese', '🗿', { rate: .55, echo: [.13, .3] }],
    ['roboter', 'Roboter', '🤖', { rate: 1, ring: [70, .75], comb: [.006, .55] }], ['alien', 'Alien', '👽', { rate: 1.12, ring: [420, .5], vib: [8, 60] }],
    ['telefon', 'Telefon', '📞', { rate: 1, phone: true, drive: 2 }], ['echo', 'Echo-Halle', '🏛', { rate: 1, echo: [.28, .45] }], ['heli', 'Heliumballon', '🎈', { rate: 1.5, vib: [6, 25] }], ['daemon', 'Dämon', '😈', { rate: .75, ring: [30, .35], echo: [.09, .35], bass: 6 }],
  ];
  const voiceUI = { text: '', lang: window.I18N && I18N.lang === 'en' ? 'eng' : 'deu', voice: 'kind', caption: true, busy: false };
  async function processVoice(data, sr, P) {
    const rate = P.rate || 1, tail = P.echo ? 1.5 : .15, outSR = SFX.SR;
    const oc = new OfflineAudioContext(1, Math.ceil((data.length / sr / rate + tail) * outSR), outSR);
    const b = oc.createBuffer(1, data.length, sr); b.copyToChannel(data, 0);
    const src = oc.createBufferSource(); src.buffer = b; src.playbackRate.value = rate; let node = src;
    const chain = n => { node.connect(n); node = n; return n; };
    if (P.vib) { const o = oc.createOscillator(), gn = oc.createGain(); o.frequency.value = P.vib[0]; gn.gain.value = P.vib[1]; o.connect(gn); gn.connect(src.detune); o.start(); }
    if (P.shelf) { const f = chain(oc.createBiquadFilter()); f.type = 'highshelf'; f.frequency.value = 2500; f.gain.value = P.shelf; }
    if (P.bass) { const f = chain(oc.createBiquadFilter()); f.type = 'lowshelf'; f.frequency.value = 250; f.gain.value = P.bass; }
    if (P.phone) { const a = chain(oc.createBiquadFilter()); a.type = 'highpass'; a.frequency.value = 450; const z = chain(oc.createBiquadFilter()); z.type = 'lowpass'; z.frequency.value = 2800; }
    if (P.drive) { const ws = chain(oc.createWaveShaper()); const cu = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cu[i] = Math.tanh(x * P.drive) / Math.tanh(P.drive); } ws.curve = cu; }
    if (P.ring) {
      const inp = node, out = oc.createGain(), dry = oc.createGain(), rg = oc.createGain(), wet = oc.createGain(), o = oc.createOscillator();
      dry.gain.value = 1 - P.ring[1]; wet.gain.value = P.ring[1] * 1.6; rg.gain.value = 0; o.frequency.value = P.ring[0]; o.connect(rg.gain); o.start();
      inp.connect(dry); dry.connect(out); inp.connect(rg); rg.connect(wet); wet.connect(out); node = out;
    }
    const fb = (time, amt) => { const inp = node, out = oc.createGain(), d = oc.createDelay(2), f = oc.createGain(); d.delayTime.value = time; f.gain.value = amt; inp.connect(out); inp.connect(d); d.connect(f); f.connect(d); d.connect(out); node = out; };
    if (P.comb) fb(P.comb[0], P.comb[1]);
    if (P.echo) fb(P.echo[0], P.echo[1]);
    node.connect(oc.destination); src.start();
    const out = (await oc.startRendering()).getChannelData(0);
    let mx = 0; for (let i = 0; i < out.length; i++) mx = Math.max(mx, Math.abs(out[i])); if (mx > 0) for (let i = 0; i < out.length; i++) out[i] *= .9 / mx;
    return out;
  }
  const ttsCache = {};
  async function makeVoice(insert) {
    if (voiceUI.busy) { voiceUI.queued = insert ? 'insert' : 'preview'; return; }
    const demo = voiceUI.lang === 'eng' ? 'Hello! This is how this voice sounds.' : 'Hallo! So klingt diese Stimme.';
    const text = voiceUI.text.trim() || (insert ? '' : demo); if (!text) return toast('Schreib zuerst einen Text');
    if (!window.AI) return toast('KI-Modul nicht geladen');
    voiceUI.busy = true; const stat = t => { const el = $('#vStat'); if (el) el.textContent = t; }, bar = v => { const b = $('#vBar div'); if (b) { b.parentElement.hidden = false; b.style.width = v * 100 + '%'; } };
    const tile = $(`#vGrid [data-v="${voiceUI.voice}"] .vplay`); if (tile) tile.textContent = '⏳';
    $('#vGo').disabled = $('#vPrev').disabled = true;
    try {
      const key = voiceUI.lang + '|' + text;
      if (!ttsCache[key]) { stat('Stimme wird erzeugt…'); ttsCache[key] = await AI.tts(text, { model: voiceUI.lang === 'eng' ? 'Xenova/mms-tts-eng' : 'Xenova/mms-tts-deu', onProgress: (v, t) => { bar(v); stat(t); } }); }
      const raw = ttsCache[key], V = VOICES.find(v => v[0] === voiceUI.voice);
      const data = await processVoice(raw.audio, raw.sr, V[3]);
      const blob = SFX.toWav(data);
      const m = { id: uid(), name: V[2] + ' ' + text.slice(0, 24), kind: 'audio', sub: 'voice', url: URL.createObjectURL(blob), blob, duration: data.length / SFX.SR, source: 'tts' };
      if (insert) media.set(m.id, m);
      previewAudio.src = m.url; previewAudio.play(); stat(`▶ ${V[1]} wird abgespielt`);
      if (insert) {
        const at = time;
        mutate(() => {
          const c = addClip({ type: 'audio', sub: 'voice', mediaId: m.id, start: at, dur: m.duration, name: m.name }); selId = c.id;
          if (voiceUI.caption) {
            const ws = text.split(/\s+/).filter(Boolean), tot = ws.reduce((n, w) => n + w.length + 1, 0), speech = m.duration - .2; let acc = 0;
            const words = ws.map(w => { const s = at + .05 + speech * acc / tot; acc += w.length + 1; return { w, s, e: at + .05 + speech * acc / tot }; });
            addCaptionGroups(groupWords(words, capUI.words), stripStyle(allStyles().find(s => s.name === getCapStyleName()) || STYLE_PRESETS[1]), capUI.y);
          }
        });
        toast('Stimme eingefügt ✔');
      }
      bar(1);
    } catch (e) { console.error(e); toast('Fehler: ' + (e.message || e), 6000); stat('Fehler: ' + (e.message || e)); }
    voiceUI.busy = false; const g1 = $('#vGo'), g2 = $('#vPrev'); if (g1) g1.disabled = false; if (g2) g2.disabled = false;
    document.querySelectorAll('#vGrid .vplay').forEach(x => x.textContent = '▶');
    if (voiceUI.queued) { const q = voiceUI.queued; voiceUI.queued = null; makeVoice(q === 'insert'); }
  }
  function renderVoiceTab() {
    libBody.innerHTML = `
      <div class="field"><span>Text, der gesprochen werden soll</span><textarea id="vText" rows="4" placeholder="z.B. Hallo Leute, heute zeige ich euch was Krasses!">${esc(voiceUI.text)}</textarea></div>
      <div class="field"><span>Sprache</span><select id="vLang"><option value="deu">Deutsch</option><option value="eng">Englisch</option></select></div>
      <h4>Stimmen testen <span class="muted" style="text-transform:none">– ▶ klicken = Probe hören</span></h4>
      <p class="muted small" style="margin-top:0">Ohne eigenen Text hörst du einen Beispielsatz. Beim allerersten Mal wird die KI-Stimme kurz geladen.</p><div class="grid" id="vGrid"></div>
      <label class="chk" style="margin:10px 0"><input type="checkbox" id="vCap" ${voiceUI.caption ? 'checked' : ''}> Auch als Untertitel einfügen</label>
      <div class="row"><button id="vPrev" ${voiceUI.busy ? 'disabled' : ''}>▶ Anhören</button><button class="btn-primary" id="vGo" ${voiceUI.busy ? 'disabled' : ''}>＋ Einfügen</button></div>
      <div class="bar" hidden id="vBar"><div></div></div><div class="muted small" id="vStat"></div>
      <div class="note" style="margin-top:10px">Läuft gratis auf deinem PC (KI-Stimme „MMS“, ca. 30–40 MB einmalig). Die Effekte (Kind, Monster, Roboter …) werden direkt drübergerechnet und sind im Export drin.</div>`;
    $('#vLang').value = voiceUI.lang;
    $('#vText').oninput = e => voiceUI.text = e.target.value; $('#vLang').onchange = e => voiceUI.lang = e.target.value; $('#vCap').onchange = e => voiceUI.caption = e.target.checked;
    const gr = $('#vGrid');
    VOICES.forEach(([id, nm, ic]) => { const t = document.createElement('div'); t.className = 'tile voice-tile' + (voiceUI.voice === id ? ' on' : ''); t.dataset.v = id; t.innerHTML = `<span class="ico">${ic}</span>${nm}<span class="vplay">▶</span>`; t.title = 'Klicken zum Anhören'; t.onclick = () => { voiceUI.voice = id; gr.querySelectorAll('.tile').forEach(x => x.classList.toggle('on', x === t)); makeVoice(false); }; gr.appendChild(t); });
    $('#vPrev').onclick = () => makeVoice(false); $('#vGo').onclick = () => makeVoice(true);
  }

  /* ======================= EIGENSCHAFTEN ======================= */
  const propsBody = $('#propsBody');
  function sec(parent, title) { const s = document.createElement('div'); s.className = 'sec'; if (title) s.innerHTML = `<h5>${title}</h5>`; parent.appendChild(s); return s; }
  function slider(p, label, min, max, step, get, set, f = v => v) {
    const r = document.createElement('div'); r.className = 'slider';
    r.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${get()}"><output>${f(get())}</output>`;
    const inp = r.querySelector('input'), out = r.querySelector('output');
    inp.oninput = () => { beginEdit(); set(+inp.value); out.textContent = f(+inp.value); };
    inp.onchange = endEdit; inp.ondblclick = () => { };
    p.appendChild(r); return r;
  }
  function selectField(p, label, opts, get, set) {
    const f = document.createElement('div'); f.className = 'field';
    f.innerHTML = `<span>${label}</span><select>${opts.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select>`;
    const s = f.querySelector('select'); s.value = get(); s.onchange = () => { beginEdit(); set(s.value); endEdit(); renderProps(); };
    p.appendChild(f); return f;
  }
  function colorRow(p, items) {
    const r = document.createElement('div'); r.className = 'row'; r.style.marginBottom = '8px';
    items.forEach(([label, get, set]) => { const l = document.createElement('label'); l.className = 'chk'; l.style.margin = 0; l.innerHTML = `<input type="color" value="${get() || '#000000'}"> ${label}`; const i = l.querySelector('input'); i.oninput = () => { beginEdit(); set(i.value); }; i.onchange = endEdit; r.appendChild(l); });
    p.appendChild(r);
  }
  function checkRow(p, items) {
    const r = document.createElement('div'); r.className = 'row'; r.style.marginBottom = '8px'; r.style.flexWrap = 'wrap';
    items.forEach(([label, get, set]) => { const l = document.createElement('label'); l.className = 'chk'; l.style.margin = 0; l.innerHTML = `<input type="checkbox" ${get() ? 'checked' : ''}> ${label}`; l.querySelector('input').onchange = e => mutate(() => set(e.target.checked)); r.appendChild(l); });
    p.appendChild(r);
  }
  function ptabs(key, tabs) {
    const cur = propTab[key] && tabs.some(t => t[0] === propTab[key]) ? propTab[key] : tabs[0][0];
    const d = document.createElement('div'); d.className = 'ptabs';
    d.innerHTML = tabs.map(([id, n]) => `<button data-t="${id}" class="${id === cur ? 'on' : ''}">${n}</button>`).join('');
    d.onclick = e => { const b = e.target.closest('button'); if (b) { propTab[key] = b.dataset.t; renderProps(); } };
    propsBody.appendChild(d); return cur;
  }
  const pct = v => Math.round(v * 100) + '%';
  function transformSec(c) {
    const s = sec(propsBody, 'Position & Größe'), lt = curLocal(c), cur = kv(c, lt), on = !!kfAt(c, lt), n = c.kf ? c.kf.length : 0;
    // Keyframe-Leiste wie in CapCut: ◀ vorheriger · ◆ setzen/entfernen · ▶ nächster
    const kb = document.createElement('div'); kb.className = 'kf-bar';
    kb.innerHTML = `<button data-k="prev" title="Vorheriger Keyframe">◀</button><button data-k="tog" class="kf-tog ${on ? 'on' : ''}" title="Keyframe am Abspielkopf setzen/entfernen">◆ ${on ? 'Keyframe entfernen' : 'Keyframe setzen'}</button><button data-k="next" title="Nächster Keyframe">▶</button>`;
    kb.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k;
      if (k === 'tog') { if (time < c.start || time > c.start + c.dur) setTime(c.start); mutate(() => toggleKf(c)); return; }
      const ts = (c.kf || []).map(x => c.start + x.t), tgt = k === 'prev' ? ts.filter(x => x < time - .02).pop() : ts.find(x => x > time + .02);
      if (tgt != null) { pause(); setTime(tgt); renderProps(); } else toast(n ? 'Kein weiterer Keyframe' : 'Noch keine Keyframes');
    };
    s.appendChild(kb);
    s.insertAdjacentHTML('beforeend', `<div class="muted small" style="margin:-2px 0 8px">${n ? `${n} Keyframe${n > 1 ? 's' : ''} – Regler ändern setzt automatisch einen Keyframe am Abspielkopf.` : 'Tipp: Abspielkopf an den Anfang → ◆ setzen, Abspielkopf weiter → Größe/Position ändern = Bewegung & Zoom.'}</div>`);
    slider(s, 'Größe', .1, 4, .01, () => cur.scale, v => setProp(c, 'scale', v), pct);
    slider(s, 'X', -1, 1, .005, () => cur.x, v => setProp(c, 'x', v), v => Math.round(v * 100));
    slider(s, 'Y', -1, 1, .005, () => cur.y, v => setProp(c, 'y', v), v => Math.round(v * 100));
    slider(s, 'Drehung', -180, 180, 1, () => cur.rot, v => setProp(c, 'rot', v), v => v + '°');
    slider(s, 'Deckkraft', 0, 1, .01, () => cur.opacity, v => setProp(c, 'opacity', v), pct);
    const r = document.createElement('div'); r.className = 'row';
    const b = document.createElement('button'); b.textContent = 'Zurücksetzen'; b.onclick = () => mutate(() => { c.kf = null; Object.assign(c, { x: 0, y: c.type === 'caption' ? capUI.y : 0, scale: 1, rot: 0, opacity: 1 }); }); r.appendChild(b);
    if (n) { const d = document.createElement('button'); d.textContent = 'Alle Keyframes löschen'; d.onclick = () => mutate(() => { Object.assign(c, pickKP(kv(c, curLocal(c)))); c.kf = null; }); r.appendChild(d); }
    s.appendChild(r);
  }
  /* ---------- Premiere-Funktionen: Lumetri-Farbe, Maske, Audio-Effekte, Standbild ---------- */
  const BLENDS = [['source-over', 'Normal'], ['multiply', 'Multiplizieren'], ['screen', 'Negativ multiplizieren'], ['overlay', 'Ineinanderkopieren'], ['soft-light', 'Weiches Licht'], ['hard-light', 'Hartes Licht'],
    ['darken', 'Abdunkeln'], ['lighten', 'Aufhellen'], ['color-dodge', 'Farbig abwedeln'], ['color-burn', 'Farbig nachbelichten'], ['difference', 'Differenz'], ['exclusion', 'Ausschluss'],
    ['hue', 'Farbton'], ['saturation', 'Sättigung'], ['color', 'Farbe'], ['luminosity', 'Luminanz']];
  const LOOKS = [
    ['Neutral', {}], ['Kino (Teal & Orange)', { split: .8, contrast: .15, sat: -.05, vig: .3 }], ['Warm & weich', { temp: .6, fade: .3, highlights: -.1 }],
    ['Kalt', { temp: -.6, tint: .1, contrast: .1 }], ['Vintage', { fade: .6, temp: .3, sat: -.3, vig: .4 }], ['S/W Kontrast', { sat: -1, contrast: .4 }],
    ['Knallig', { vib: .6, sat: .2, contrast: .15 }], ['Dunkel & Moody', { exposure: -.3, shadows: -.3, sat: -.25, split: .4, vig: .5 }], ['Sommer', { temp: .35, vib: .4, exposure: .1, highlights: -.15 }],
  ];
  function lumetriSec(c) {
    const col = c.color || (c.color = {}), s = sec(propsBody, 'Lumetri-Farbe');
    const looks = document.createElement('div'); looks.className = 'chips';
    LOOKS.forEach(([n, v]) => { const ch = document.createElement('span'); ch.className = 'chip'; ch.textContent = n; ch.onclick = () => mutate(() => { c.color = { ...v }; }); looks.appendChild(ch); });
    s.appendChild(looks);
    const f = v => (v > 0 ? '+' : '') + Math.round(v * 100);
    [['Belichtung', 'exposure', -1.5, 1.5], ['Kontrast', 'contrast', -.8, .8], ['Lichter', 'highlights', -1, 1], ['Tiefen', 'shadows', -1, 1], ['Temperatur', 'temp', -1, 1], ['Tönung', 'tint', -1, 1],
      ['Sättigung', 'sat', -1, 1], ['Dynamik', 'vib', -1, 1], ['Teal & Orange', 'split', 0, 1.5], ['Verblassen', 'fade', 0, 1], ['Vignette', 'vig', 0, 1]]
      .forEach(([n, k, a, b]) => slider(s, n, a, b, .01, () => col[k] || 0, v => col[k] = v, f));
    const r = document.createElement('button'); r.className = 'wide'; r.textContent = 'Farbe zurücksetzen'; r.onclick = () => mutate(() => { c.color = {}; }); s.appendChild(r);
  }
  function maskSec(c) {
    const mk = c.mask || (c.mask = { type: 'none', x: 0, y: 0, w: .6, h: .6, feather: .2, invert: false, rot: 0 }), s = sec(propsBody, 'Maske');
    s.insertAdjacentHTML('beforeend', '<p class="muted small" style="margin-top:0">Zeigt nur einen Bereich des Clips (z.B. einen Kreis um ein Gesicht). „Umkehren“ blendet den Bereich stattdessen aus.</p>');
    const ch = document.createElement('div'); ch.className = 'chips';
    [['none', 'Keine'], ['rect', '▭ Rechteck'], ['ellipse', '◯ Kreis']].forEach(([v, n]) => { const x = document.createElement('span'); x.className = 'chip' + (mk.type === v ? ' on' : ''); x.textContent = n; x.onclick = () => mutate(() => mk.type = v); ch.appendChild(x); });
    s.appendChild(ch);
    if (mk.type === 'none') return;
    slider(s, 'X', -.5, .5, .005, () => mk.x, v => mk.x = v, v => Math.round(v * 100));
    slider(s, 'Y', -.5, .5, .005, () => mk.y, v => mk.y = v, v => Math.round(v * 100));
    slider(s, 'Breite', .05, 1.5, .01, () => mk.w, v => mk.w = v, pct);
    slider(s, 'Höhe', .05, 1.5, .01, () => mk.h, v => mk.h = v, pct);
    slider(s, 'Drehung', -180, 180, 1, () => mk.rot, v => mk.rot = v, v => v + '°');
    slider(s, 'Weiche Kante', 0, 1, .01, () => mk.feather, v => mk.feather = v, pct);
    checkRow(s, [['Umkehren', () => mk.invert, v => mk.invert = v]]);
  }
  function audioFxSec(c) {
    const fx = c.afx || (c.afx = { bass: 0, treble: 0, reverb: 0, hum: false, voice: 0 }), s = sec(propsBody, 'Audio-Effekte');
    const db = v => (v > 0 ? '+' : '') + Math.round(v) + ' dB';
    slider(s, 'Tonhöhe', -12, 12, .5, () => fx.pitch || 0, v => fx.pitch = v, v => (v > 0 ? '+' : '') + v + ' HT');
    slider(s, 'Bass', -15, 15, .5, () => fx.bass, v => fx.bass = v, db);
    slider(s, 'Höhen', -15, 15, .5, () => fx.treble, v => fx.treble = v, db);
    slider(s, 'Stimme klarer', 0, 12, .5, () => fx.voice || 0, v => fx.voice = v, db);
    slider(s, 'Hall', 0, 1, .01, () => fx.reverb, v => fx.reverb = v, pct);
    checkRow(s, [['Brummen/Rumpeln entfernen', () => fx.hum, v => fx.hum = v]]);
    // Tonhöhen-Kurve: im Tape-Modus (Standard) steuert sie auch das Video-Tempo
    const s2 = sec(propsBody, 'Tonhöhen-Kurve'), n = c.pk ? c.pk.length : 0, d = c.dur, tape = c.pkTape !== false;
    s2.insertAdjacentHTML('beforeend', `<p class="muted small" style="margin-top:0">Oben in der Timeline-Leiste auf <b style="color:#3ff0ff">„🎵 Kurve: Tonhöhe“</b> umschalten, dann auf dem Clip die türkise Linie: klicken = Punkt, ziehen = höher/tiefer (±12 Halbtöne), Doppelklick = löschen.${n ? ` Aktuell ${n} Punkte.` : ''}</p>`);
    checkRow(s2, [['Video-Tempo folgt der Kurve (wie Plattenspieler)', () => tape, v => c.pkTape = v]]);
    s2.insertAdjacentHTML('beforeend', `<p class="muted small" style="margin-top:-4px">${tape ? '✔ <b>An:</b> Tiefer = Video und Ton werden <b>langsamer</b>, höher = <b>schneller</b> – wie eine Schallplatte oder Kassette. Die Clip-Länge bleibt gleich; zieh den Clip rechts länger, wenn du mehr vom Video sehen willst.' : '<b>Aus:</b> Nur die Tonhöhe ändert sich, das Tempo bleibt gleich (wird kurz neu berechnet).'}</p>`);
    const ch = document.createElement('div'); ch.className = 'chips';
    [['Langsam tiefer', [{ t: 0, v: 0 }, { t: d, v: -12 }]], ['Langsam höher', [{ t: 0, v: 0 }, { t: d, v: 12 }]],
      ['Tape-Stop am Ende', [{ t: 0, v: 0 }, { t: Math.max(0, d - 1.2), v: 0 }, { t: d, v: -12 }]], ['Hochfahren am Anfang', [{ t: 0, v: -12 }, { t: Math.min(d, 1.2), v: 0 }, { t: d, v: 0 }]], ['Chipmunk-Mitte', [{ t: 0, v: 0 }, { t: d * .35, v: 0 }, { t: d * .45, v: 7 }, { t: d * .6, v: 7 }, { t: d * .7, v: 0 }, { t: d, v: 0 }]],
      ['Monster-Mitte', [{ t: 0, v: 0 }, { t: d * .35, v: 0 }, { t: d * .45, v: -8 }, { t: d * .6, v: -8 }, { t: d * .7, v: 0 }, { t: d, v: 0 }]],
      ['Sirene', (() => { const k = Math.max(4, Math.round(d)); return Array.from({ length: k + 1 }, (_, i) => ({ t: d * i / k, v: i % 2 ? 5 : -2 })); })()]]
      .forEach(([nm, pts]) => { const x = document.createElement('span'); x.className = 'chip'; x.textContent = nm; x.onclick = () => { mutate(() => { c.pk = pts.map(p => ({ ...p })); }); if (ui.curveMode !== 'pitch') setCurveMode('pitch'); }; ch.appendChild(x); });
    s2.appendChild(ch);
    const r = document.createElement('div'); r.className = 'row';
    const bt = document.createElement('button'); bt.textContent = ui.curveMode === 'pitch' ? '〰 Lautstärke-Kurve zeigen' : '🎵 Tonhöhen-Kurve zeigen'; bt.onclick = () => { setCurveMode(ui.curveMode === 'pitch' ? 'vol' : 'pitch'); renderProps(); }; r.appendChild(bt);
    if (n) { const b = document.createElement('button'); b.textContent = 'Zurücksetzen'; b.onclick = () => mutate(() => { c.pk = null; }); r.appendChild(b); }
    s2.appendChild(r);
  }
  function freezeFrame(c) {
    if (time < c.start || time >= c.start + c.dur) return toast('Stell den Abspielkopf auf den Clip');
    const el = els.get(c.id); if (!el || el.readyState < 2) return toast('Bild ist noch nicht geladen');
    const cv = document.createElement('canvas'); cv.width = el.videoWidth; cv.height = el.videoHeight; cv.getContext('2d').drawImage(el, 0, 0);
    const at = time;
    cv.toBlob(b => {
      const m = { id: uid(), name: 'Standbild', kind: 'image', url: URL.createObjectURL(b), blob: b, w: cv.width, h: cv.height, thumb: cv.toDataURL('image/jpeg', .6), source: 'file', duration: Infinity };
      media.set(m.id, m);
      mutate(() => {
        splitClip(c, at);
        state.clips.forEach(x => { if (x.trackId === c.trackId && x.start >= at - 1e-4) x.start += 2; });
        const f = JSON.parse(JSON.stringify(c));
        Object.assign(f, { id: uid(), type: 'image', mediaId: m.id, start: at, dur: 2, in: 0, speed: 1, transition: null, animIn: 'none', animOut: 'none', kf: null, name: '❄ Standbild' });
        state.clips.push(f); selId = f.id;
      });
      toast('Standbild eingefügt ❄');
    }, 'image/png');
  }
  function chromaSec(c) {
    const ck = c.ck || (c.ck = { on: false, color: '#00ff00', sim: .1, smooth: .08, spill: .1 });
    const s = sec(propsBody, 'Greenscreen (Chroma Key)');
    s.insertAdjacentHTML('beforeend', '<p class="muted small" style="margin-top:0">Entfernt eine Farbe (z.B. grünen Hintergrund). Leg das Video auf eine Overlay-Spur über einen anderen Hintergrund.</p>');
    checkRow(s, [['Greenscreen an', () => ck.on, v => ck.on = v]]);
    const r = document.createElement('div'); r.className = 'row'; r.style.marginBottom = '8px';
    r.innerHTML = `<input type="color" value="${ck.color}" style="flex:none"><button data-c="#00ff00">Grün</button><button data-c="#0047ff">Blau</button><button data-p="1" title="Farbe im Player anklicken">💧 Pipette</button>`;
    r.querySelector('input').oninput = e => { beginEdit(); ck.color = e.target.value; ck.on = true; }; r.querySelector('input').onchange = () => { endEdit(); renderProps(); };
    r.querySelectorAll('[data-c]').forEach(b => b.onclick = () => mutate(() => { ck.color = b.dataset.c; ck.on = true; }));
    r.querySelector('[data-p]').onclick = () => { pickColor = c.id; canvas.style.cursor = 'crosshair'; toast('Klick im Player auf die Farbe, die weg soll'); };
    s.appendChild(r);
    slider(s, 'Stärke', 0, .45, .005, () => ck.sim, v => ck.sim = v, v => Math.round(v / .45 * 100));
    slider(s, 'Weichheit', .005, .3, .005, () => ck.smooth, v => ck.smooth = v, v => Math.round(v / .3 * 100));
    slider(s, 'Grünstich weg', 0, .5, .01, () => ck.spill, v => ck.spill = v, v => Math.round(v / .5 * 100));
  }
  function animSec(c, withEffect) {
    const s = sec(propsBody, 'Animation');
    selectField(s, 'Rein', ANIMS.filter(a => a[0] !== 'typewriter' || c.type === 'text' || c.type === 'caption'), () => c.animIn, v => c.animIn = v);
    selectField(s, 'Raus', ANIMS.filter(a => a[0] !== 'typewriter'), () => c.animOut, v => c.animOut = v);
    slider(s, 'Dauer', .1, 2, .05, () => c.animDur, v => c.animDur = v, v => v.toFixed(2) + 's');
    if (withEffect) {
      const s2 = sec(propsBody, 'Effekt & Übergang');
      selectField(s2, 'Effekt', EFFECTS.map(e => [e[0], e[2] + ' ' + e[1]]), () => c.effect, v => c.effect = v);
      selectField(s2, 'Übergang (am Anfang)', TRANSITIONS.map(e => [e[0], trLabel(e[0])]).concat((window.GLT ? GLT.list : []).map(t => ['gl:' + t.name, '✨ ' + t.label])), () => c.transition ? c.transition.type : 'none', v => c.transition = v === 'none' ? null : { type: v, dur: c.transition ? c.transition.dur : ui.trDur });
      if (c.transition) slider(s2, 'Übergangszeit', .1, 2, .05, () => c.transition.dur, v => c.transition.dur = v, v => v.toFixed(2) + 's');
    }
  }
  function audioSec(c, title = 'Audio') {
    const s = sec(propsBody, title);
    slider(s, 'Lautstärke', 0, 3, .01, () => c.volume, v => c.volume = v, pct);
    slider(s, 'Einblenden', 0, Math.min(10, c.dur / 2), .05, () => c.fadeIn, v => c.fadeIn = v, v => v.toFixed(1) + 's');
    slider(s, 'Ausblenden', 0, Math.min(10, c.dur / 2), .05, () => c.fadeOut, v => c.fadeOut = v, v => v.toFixed(1) + 's');
    const s2 = sec(propsBody, 'Lautstärke-Kurve');
    const n = c.vk ? c.vk.length : 0;
    s2.insertAdjacentHTML('beforeend', `<p class="muted small" style="margin-top:0">Auf dem Clip in der Timeline liegt eine <b style="color:#ffd84d">gelbe Linie</b>: <b>klicken</b> = Punkt setzen, <b>Punkt ziehen</b> = lauter/leiser (oben 200 %, Mitte 100 %, unten stumm), <b>Doppelklick</b> = Punkt löschen.${n ? ` Aktuell ${n} Punkte.` : ''}</p>`);
    const ch = document.createElement('div'); ch.className = 'chips'; const d = c.dur, f = Math.min(1, d / 4);
    [['Langsam lauter', [{ t: 0, v: 0 }, { t: d, v: 1 }]], ['Langsam leiser', [{ t: 0, v: 1 }, { t: d, v: 0 }]],
      ['Mitte leiser', [{ t: 0, v: 1 }, { t: d * .3, v: 1 }, { t: d * .3 + f * .5, v: .25 }, { t: d * .7 - f * .5, v: .25 }, { t: d * .7, v: 1 }, { t: d, v: 1 }]],
      ['Mitte lauter', [{ t: 0, v: 1 }, { t: d * .35, v: 1 }, { t: d * .5, v: 1.8 }, { t: d * .65, v: 1 }, { t: d, v: 1 }]],
      ['Pulsieren', (() => { const n = Math.max(3, Math.round(d * 2)); return Array.from({ length: n + 1 }, (_, i) => ({ t: d * i / n, v: i % 2 ? .3 : 1 })); })()]]
      .forEach(([nm, pts]) => { const x = document.createElement('span'); x.className = 'chip'; x.textContent = nm; x.onclick = () => mutate(() => { c.vk = pts.map(p => ({ ...p })); }); ch.appendChild(x); });
    s2.appendChild(ch);
    if (n) { const b = document.createElement('button'); b.className = 'wide'; b.textContent = 'Kurve zurücksetzen'; b.onclick = () => mutate(() => { c.vk = null; }); s2.appendChild(b); }
  }
  function speedSec(c) {
    const s = sec(propsBody, 'Geschwindigkeit');
    const r = slider(s, 'Tempo', .25, 4, .05, () => c.speed, v => { const end = c.in + c.dur * c.speed; c.speed = v; c.dur = Math.min((end - c.in) / v, (srcDur(c) - c.in) / v); }, v => v.toFixed(2) + 'x');
    const chips = document.createElement('div'); chips.className = 'chips';
    [.5, 1, 1.5, 2, 3].forEach(v => { const ch = document.createElement('span'); ch.className = 'chip' + (c.speed === v ? ' on' : ''); ch.textContent = v + 'x'; ch.onclick = () => mutate(() => { const end = c.in + c.dur * c.speed; c.speed = v; c.dur = (end - c.in) / v; }); chips.appendChild(ch); });
    s.appendChild(chips);
  }
  function renderProps() {
    const c = clipById(selId); propsBody.innerHTML = '';
    $('#selInfo').textContent = c ? `${c.name || c.type} · ${fmt(c.start)} – ${fmt(c.start + c.dur)}` : '';
    if (!c) {
      $('#propsHead').textContent = 'Eigenschaften';
      propsBody.innerHTML = `<div class="empty">Wähle einen Clip in der Timeline aus,<br>um ihn zu bearbeiten.<br><br><b>Tastenkürzel</b><br>Leertaste · Abspielen<br>S · Teilen &nbsp; Q/W · Links/Rechts weg<br>Entf · Löschen &nbsp; Strg+D · Duplizieren<br>Strg+Z / Strg+Y · Rückgängig<br>← → · Bild für Bild<br>Strg+Mausrad · Timeline zoomen</div>`;
      return;
    }
    if (c.type === 'video' || c.type === 'image') {
      $('#propsHead').textContent = c.type === 'video' ? 'Video' : 'Bild';
      const tabs = [['basic', 'Bild'], ['adjust', 'Farbe'], ['mask', 'Maske'], ['ck', 'Greenscreen'], ['anim', 'Animation']]; if (c.type === 'video') tabs.push(['audio', 'Ton']);
      const t = ptabs('visual', tabs);
      if (t === 'basic') {
        transformSec(c);
        const s = sec(propsBody, 'Einpassen & Füllmethode');
        selectField(s, 'Modus', [['contain', 'Ganzes Bild (Einpassen)'], ['cover', 'Bild füllen (Zuschneiden)']], () => c.fit, v => c.fit = v);
        selectField(s, 'Füllmethode (Blend-Modus)', BLENDS, () => c.blend || 'source-over', v => c.blend = v);
        const cr = c.crop || (c.crop = { l: 0, r: 0, t: 0, b: 0 }), s2 = sec(propsBody, 'Zuschneiden');
        [['Links', 'l'], ['Rechts', 'r'], ['Oben', 't'], ['Unten', 'b']].forEach(([n, k]) => slider(s2, n, 0, .9, .005, () => cr[k], v => cr[k] = v, pct));
        if (c.type === 'video') {
          const s3 = sec(propsBody, 'Standbild'); const fb = document.createElement('button'); fb.className = 'wide'; fb.textContent = '❄ Standbild am Abspielkopf einfügen (2 s)'; fb.onclick = () => freezeFrame(c); s3.appendChild(fb);
        }
      } else if (t === 'mask') maskSec(c);
      else if (t === 'adjust') {
        lumetriSec(c);
        const s = sec(propsBody, 'Filter');
        selectField(s, 'Filter', FILTERS, () => c.filter, v => c.filter = v);
        slider(s, 'Intensität', 0, 1, .05, () => c.filterAmt, v => c.filterAmt = v, pct);
        const s2 = sec(propsBody, 'Anpassen');
        slider(s2, 'Helligkeit', -.6, .6, .01, () => c.adj.b, v => c.adj.b = v, v => Math.round(v * 100));
        slider(s2, 'Kontrast', -.6, .8, .01, () => c.adj.c, v => c.adj.c = v, v => Math.round(v * 100));
        slider(s2, 'Sättigung', -1, 1, .01, () => c.adj.s, v => c.adj.s = v, v => Math.round(v * 100));
      } else if (t === 'ck') chromaSec(c);
      else if (t === 'anim') animSec(c, true);
      else {
        audioSec(c, 'Ton'); audioFxSec(c); speedSec(c);
        const s = sec(propsBody, 'Ton'); const b = document.createElement('button'); b.className = 'wide'; b.textContent = '♫ Audio trennen (als eigene Spur)';
        b.onclick = () => mutate(() => { const a = addClip({ type: 'audio', sub: 'audio', mediaId: c.mediaId, start: c.start, dur: c.dur, in: c.in, speed: c.speed, volume: c.volume, pk: c.pk ? c.pk.map(k => ({ ...k })) : null, pkTape: c.pkTape, name: '♫ ' + (c.name || '') }); c.volume = 0; selId = a.id; });
        s.appendChild(b);
      }
    } else if (c.type === 'audio') {
      $('#propsHead').textContent = c.sub === 'voice' ? 'Stimme' : c.sub === 'sfx' ? 'Soundeffekt' : c.sub === 'music' ? 'Musik' : 'Audio';
      audioSec(c); audioFxSec(c); speedSec(c);
    } else {
      $('#propsHead').textContent = c.type === 'caption' ? 'Untertitel' : 'Text';
      const t = ptabs('text', [['text', 'Text'], ['style', 'Styles'], ['anim', 'Animation'], ['pos', 'Position']]);
      const st = c.style;
      if (t === 'text') {
        const s = sec(propsBody);
        const ta = document.createElement('textarea'); ta.rows = 3; ta.className = 'wide'; ta.style.marginBottom = '8px';
        ta.value = c.type === 'caption' ? c.words.filter(w => w.e > c.in && w.s < c.in + c.dur).map(w => w.w).join(' ') : c.text;
        ta.oninput = () => {
          beginEdit();
          if (c.type === 'text') c.text = ta.value;
          else {
            const vis = c.words.filter(w => w.e > c.in && w.s < c.in + c.dur), ws = ta.value.split(/\s+/).filter(Boolean);
            if (ws.length === vis.length) vis.forEach((w, i) => w.w = ws[i]);
            else { const s0 = c.in, len = c.dur, tot = ws.reduce((n, w) => n + w.length + 1, 0) || 1; let acc = 0; const rest = c.words.filter(w => !vis.includes(w)); c.words = rest.concat(ws.map(w => { const a = s0 + len * acc / tot; acc += w.length + 1; return { w, s: a, e: s0 + len * acc / tot }; })).sort((a, b) => a.s - b.s); }
          }
        };
        ta.onchange = endEdit; s.appendChild(ta);
        selectField(s, 'Schrift', FONTS.map(f => [f, f]), () => st.font, v => { st.font = v; st.weight = ['Montserrat', 'Poppins', 'Arial', 'Courier New', 'Georgia'].includes(v) ? (st.weight >= 600 ? st.weight : 800) : 400; });
        slider(s, 'Größe', 20, 220, 1, () => st.size, v => st.size = v);
        slider(s, 'Dicke', 100, 900, 100, () => st.weight, v => st.weight = v);
        slider(s, 'Kontur', 0, 30, 1, () => st.strokeW, v => st.strokeW = v);
        colorRow(s, [['Text', () => st.color, v => st.color = v], ['Kontur', () => st.stroke, v => st.stroke = v]]);
        colorRow(s, [['Hintergrund', () => st.bg || '#000000', v => st.bg = v]]);
        checkRow(s, [['Hintergrund an', () => !!st.bg, v => st.bg = v ? (st.bg || '#000000') : ''], ['Schatten', () => st.shadow, v => st.shadow = v], ['GROSS', () => st.upper, v => st.upper = v], ['Kursiv', () => st.italic, v => st.italic = v]]);
        if (st.bg) slider(s, 'HG-Deckkraft', 0, 1, .05, () => st.bgAlpha, v => st.bgAlpha = v, pct);
        checkRow(s, [['Leuchten', () => !!st.glow, v => st.glow = v ? st.color : '']]);
        if (c.type === 'caption') {
          const s3 = sec(propsBody, 'Wort-Hervorhebung (Karaoke)');
          selectField(s3, 'Art', [['none', 'Aus'], ['color', 'Wort einfärben'], ['box', 'Box hinter Wort']], () => st.hlMode, v => st.hlMode = v);
          colorRow(s3, [['Farbe', () => st.hl, v => st.hl = v]]);
          checkRow(s3, [['Aktives Wort größer (Pop)', () => st.pop, v => st.pop = v]]);
          const b = document.createElement('button'); b.className = 'wide'; b.textContent = 'Diesen Style auf ALLE Untertitel'; b.onclick = () => mutate(() => state.clips.filter(x => x.type === 'caption').forEach(x => { x.style = { ...st }; x.y = c.y; x.scale = c.scale; })); s3.appendChild(b);
        }
        const s4 = sec(propsBody, 'Meine Styles');
        const b2 = document.createElement('button'); b2.className = 'wide btn-primary'; b2.textContent = '★ Als meinen Style speichern';
        b2.onclick = () => { const name = prompt('Name für deinen Style:', 'Mein Style ' + (loadStyles().length + 1)); if (!name) return; const a = loadStyles().filter(x => x.name !== name); a.unshift({ ...st, name }); saveStyles(a); st.name = name; toast('Style „' + name + '“ gespeichert ✔'); renderLib(); };
        s4.appendChild(b2);
      } else if (t === 'style') {
        propsBody.appendChild(styleGrid(ps => mutate(() => { c.style = stripStyle(ps); }), st.name));
      } else if (t === 'anim') animSec(c, false);
      else transformSec(c);
    }
    const s = sec(propsBody, 'Clip');
    s.insertAdjacentHTML('beforeend', `<div class="muted small" style="margin-bottom:8px">Start ${fmt(c.start)} · Dauer ${fmt(c.dur)}</div>`);
    const r = document.createElement('div'); r.className = 'row';
    [['✂ Teilen', doSplit], ['⧉ Duplizieren', doDuplicate], ['🗑 Löschen', doDelete]].forEach(([n, f]) => { const b = document.createElement('button'); b.textContent = n; b.onclick = f; r.appendChild(b); });
    s.appendChild(r);
  }
  function renderAll() { renderTimeline(); renderProps(); if (['effects', 'filters', 'transitions', 'text'].includes(libTab)) renderLib(); }

  /* ======================= VORSCHAU-INTERAKTION ======================= */
  function canvasPt(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * state.w / r.width, y: (e.clientY - r.top) * state.h / r.height }; }
  function hitTest(p) {
    for (let i = hitBoxes.length - 1; i >= 0; i--) { const h = hitBoxes[i], a = -h.rot * Math.PI / 180, dx = p.x - h.cx, dy = p.y - h.cy, x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(x) <= h.w / 2 && Math.abs(y) <= h.h / 2) return h.id; }
    return null;
  }
  let pickColor = null;
  canvas.addEventListener('pointerdown', e => {
    const p = canvasPt(e);
    if (pickColor) {
      // Pipette: Bild ohne Keying zeichnen und Farbe unter dem Mauszeiger übernehmen
      const c = clipById(pickColor); pickColor = null; canvas.style.cursor = ''; if (!c || !c.ck) return;
      const was = c.ck.on; c.ck.on = false; drawFrame(); const d = g.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data; c.ck.on = was;
      mutate(() => { c.ck.color = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); c.ck.on = true; });
      toast('Farbe übernommen – mit „Stärke“ feinjustieren'); return;
    }
    const id = hitTest(p); if (!id) { select(null); return; }
    if (id !== selId) select(id);
    const c = clipById(id), k0 = kv(c, curLocal(c)), x0 = k0.x, y0 = k0.y, snap = snapshot(); let moved = false;
    canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'move';
    const mv = ev => {
      const q = canvasPt(ev); let nx = x0 + (q.x - p.x) / state.w, ny = y0 + (q.y - p.y) / state.h; moved = true;
      guides = { v: Math.abs(nx) < .015, h: Math.abs(ny) < .015 }; if (guides.v) nx = 0; if (guides.h) ny = 0;
      setProp(c, 'x', nx); setProp(c, 'y', ny);
    };
    const up = () => { canvas.removeEventListener('pointermove', mv); canvas.removeEventListener('pointerup', up); canvas.style.cursor = ''; guides = null; if (moved) { undoStack.push(snap); redoStack = []; renderProps(); } };
    canvas.addEventListener('pointermove', mv); canvas.addEventListener('pointerup', up);
  });
  canvas.addEventListener('wheel', e => { const c = clipById(selId); if (!c || c.type === 'audio') return; e.preventDefault(); beginEdit(); setProp(c, 'scale', clamp(kv(c, curLocal(c)).scale * (e.deltaY < 0 ? 1.05 : 1 / 1.05), .05, 8)); clearTimeout(canvas._wt); canvas._wt = setTimeout(() => { endEdit(); renderProps(); }, 400); }, { passive: false });
  function fitCanvas() {
    const wrap = $('#stageWrap'), W = wrap.clientWidth - 16, H = wrap.clientHeight - 16, s = Math.min(W / state.w, H / state.h);
    canvas.style.width = Math.max(10, state.w * s) + 'px'; canvas.style.height = Math.max(10, state.h * s) + 'px';
  }
  new ResizeObserver(fitCanvas).observe($('#stageWrap'));
  const sw = $('#stageWrap');
  sw.addEventListener('dragover', e => { e.preventDefault(); sw.classList.add('dragover'); });
  sw.addEventListener('dragleave', () => sw.classList.remove('dragover'));
  sw.addEventListener('drop', e => { e.preventDefault(); sw.classList.remove('dragover'); if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); else { try { dropPayload(JSON.parse(e.dataTransfer.getData('text/plain')), time, null); } catch { } } });

  /* ======================= EXPORT ======================= */
  let expInfo = null;
  $('#exportBtn').onclick = () => { if (!state.clips.length) return toast('Nichts zu exportieren'); $('#expName').value = ($('#projectName').value || 'video').replace(/[^\w\- äöüÄÖÜß]/g, ''); $('#exportModal').hidden = false; $('#expProg').hidden = true; $('#expStart').disabled = false; };
  $('#expCancel').onclick = () => { if (exporting && expInfo) { expInfo.cancel = true; pause(); finishExport(); } $('#exportModal').hidden = true; };
  $('#expStart').onclick = async () => {
    const fps = +$('#expFps').value, stream = canvas.captureStream(fps);
    recDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)); if (!mime) return toast('Dein Browser kann leider nicht exportieren');
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: +$('#expQuality').value, audioBitsPerSecond: 192000 });
    const chunks = []; rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    expInfo = { rec, chunks, mime, dur: projDur(), name: $('#expName').value || 'video', cancel: false, stream };
    rec.onstop = () => {
      stream.getVideoTracks().forEach(t => t.stop());
      if (!expInfo.cancel) { const blob = new Blob(chunks, { type: mime.split(';')[0] }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = expInfo.name + (mime.includes('mp4') ? '.mp4' : '.webm'); a.click(); toast('Export fertig ✔ (' + (blob.size / 1048576).toFixed(1) + ' MB)', 5000); }
      expInfo = null; $('#exportModal').hidden = true;
    };
    $('#expStart').disabled = true; $('#expProg').hidden = false;
    pause(); selId = null; renderAll(); setTime(0); syncMedia();
    await new Promise(r => setTimeout(r, 600));
    if (actx.state !== 'running') await actx.resume();
    speaker.gain.value = $('#expMute').checked ? 0 : 1; exporting = true;
    rec.start(200); play();
  };
  function finishExport() {
    if (!expInfo) return; exporting = false; speaker.gain.value = 1;
    setTimeout(() => { if (expInfo && expInfo.rec.state !== 'inactive') expInfo.rec.stop(); }, 250);
  }

  /* ======================= STEUERUNG ======================= */
  $('#btnPlay').onclick = togglePlay;
  $('#btnBack').onclick = () => setTime(0);
  $('#btnFwd').onclick = () => setTime(projDur());
  $('#btnFull').onclick = () => { const w = $('#stageWrap'); document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen(); };
  $('#tUndo').onclick = undo; $('#tRedo').onclick = redo; $('#tSplit').onclick = doSplit; $('#tDel').onclick = doDelete; $('#tMark').onclick = toggleMarker;
  const setCurveMode = m => { ui.curveMode = m; $('#tCurve').textContent = m === 'pitch' ? '🎵 Kurve: Tonhöhe' : '〰 Kurve: Lautstärke'; $('#tCurve').classList.toggle('on-pitch', m === 'pitch'); renderTimeline(); };
  $('#tCurve').onclick = () => setCurveMode(ui.curveMode === 'vol' ? 'pitch' : 'vol'); $('#tDup').onclick = doDuplicate;
  $('#tSplitL').onclick = () => doTrimSide('left'); $('#tSplitR').onclick = () => doTrimSide('right');
  $('#tSnap').onchange = e => ui.snap = e.target.checked; $('#tRipple').onchange = e => ui.ripple = e.target.checked;
  $('#tZoom').oninput = e => setZoom(+e.target.value);
  $('#tZoomIn').onclick = () => setZoom(pps * 1.3); $('#tZoomOut').onclick = () => setZoom(pps / 1.3);
  $('#fileInput').onchange = e => { importFiles(e.target.files); e.target.value = ''; };
  $('#aspectSel').onchange = e => { const [w, h] = e.target.value.split('x').map(Number); state.w = w; state.h = h; canvas.width = w; canvas.height = h; fitCanvas(); };
  $('#bgSel').onchange = e => state.bg = e.target.value;
  if (window.I18N) { $('#langSel').value = I18N.lang; $('#langSel').onchange = e => I18N.set(e.target.value); }
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select') && !(e.target.type === 'range' || e.target.type === 'checkbox')) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === ' ') { e.preventDefault(); togglePlay(); }
    else if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && k === 'y') { e.preventDefault(); redo(); }
    else if (mod && k === 'd') { e.preventDefault(); doDuplicate(); }
    else if (mod) return;
    else if (k === 's' || k === 'b') doSplit();
    else if (k === 'm') toggleMarker();
    else if (k === 'q') doTrimSide('left');
    else if (k === 'w') doTrimSide('right');
    else if (k === 'delete' || k === 'backspace') { e.preventDefault(); doDelete(); }
    else if (k === 'arrowleft') { e.preventDefault(); pause(); setTime(time - (e.shiftKey ? 1 : 1 / 30)); }
    else if (k === 'arrowright') { e.preventDefault(); pause(); setTime(time + (e.shiftKey ? 1 : 1 / 30)); }
    else if (k === 'home') setTime(0);
    else if (k === 'end') setTime(projDur());
    else if (k === 'escape') select(null);
  });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { e.preventDefault(); });

  // Schriften vorladen, damit der Canvas sie sofort nutzen kann
  if (document.fonts) FONTS.forEach(f => document.fonts.load(`700 40px "${f}"`).catch(() => { }));

  // Ohne server.py (z.B. index.html direkt geöffnet) gibt es keine Myinstants-Sounds → deutlicher Hinweis
  (location.protocol === 'file:' ? Promise.reject() : fetch('/api/ping').then(r => { if (!r.ok) throw 0; return r.json(); }).then(j => { if (!j.ok) throw 0; }))
    .catch(() => document.body.insertAdjacentHTML('afterbegin', `<div style="background:#ff4d6d;color:#fff;padding:10px 14px;font-weight:600;text-align:center">
      ⚠ Der Editor wurde falsch geöffnet – darum fehlen die Soundeffects. Schließ diesen Tab und starte ihn mit Doppelklick auf <u>START.bat</u> (im CutFree-Ordner).</div>`));

  /* ======================= AUTOMATISCH SPEICHERN (IndexedDB im Browser) ======================= */
  const DB = (() => {
    let p; const open = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open('cutfree', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
    const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('kv', mode), req = fn(t.objectStore('kv')); t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error); }); };
    return { get: k => tx('readonly', s => s.get(k)), set: (k, v) => tx('readwrite', s => s.put(v, k)), clear: () => tx('readwrite', s => s.clear()) };
  })();
  const savedBlobs = new Set(); let lastSaved = '', saving = false, restoring = true;
  const META = ['id', 'name', 'kind', 'sub', 'source', 'duration', 'w', 'h', 'thumb'];
  async function saveProject() {
    if (saving || restoring || exporting) return;
    const used = new Set(state.clips.map(c => c.mediaId));
    const list = [...media.values()].filter(m => m.source !== 'demo' && (used.has(m.id) || m.source === 'file'));
    const proj = { v: 1, name: $('#projectName').value, w: state.w, h: state.h, bg: state.bg, tracks: state.tracks, clips: state.clips, markers: state.markers, media: list.map(m => Object.fromEntries(META.map(k => [k, m[k]]))) };
    const json = JSON.stringify(proj); if (json === lastSaved) return;
    saving = true;
    try {
      for (const m of list) if (!m.id.startsWith('sfx_') && m.blob && !savedBlobs.has(m.id)) { await DB.set('m:' + m.id, m.blob); savedBlobs.add(m.id); }
      await DB.set('project', json); lastSaved = json;
      $('#saveState').textContent = '✓ Gespeichert';
    } catch (e) { console.warn('Speichern fehlgeschlagen', e); $('#saveState').textContent = '⚠ Nicht gespeichert'; }
    saving = false;
  }
  async function restoreProject() {
    try {
      const json = await DB.get('project'); if (!json) return;
      const p = JSON.parse(json); if (!p.clips || !p.clips.length) return;
      for (const mm of p.media) {
        if (mm.id.startsWith('sfx_')) { try { mediaFromSfx(mm.id.slice(4)); } catch { } continue; }
        const blob = await DB.get('m:' + mm.id); if (!blob) continue;
        const m = { ...mm, blob, url: URL.createObjectURL(blob) }; if (m.kind === 'image' || m.duration == null) m.duration = Infinity;
        if (m.kind === 'image' && !m.thumb) m.thumb = m.url;
        media.set(m.id, m); savedBlobs.add(m.id);
      }
      Object.assign(state, { w: p.w, h: p.h, bg: p.bg, tracks: p.tracks, clips: p.clips.filter(c => media.has(c.mediaId) || c.type === 'text' || c.type === 'caption'), markers: p.markers || [] });
      canvas.width = state.w; canvas.height = state.h; $('#aspectSel').value = state.w + 'x' + state.h; $('#bgSel').value = state.bg; if (p.name) $('#projectName').value = p.name;
      state.clips.forEach(ensureEl); lastSaved = json; fitCanvas(); renderLib(); renderAll();
      toast('Dein letztes Projekt wurde wiederhergestellt ✔');
    } catch (e) { console.warn('Wiederherstellen fehlgeschlagen', e); }
  }
  $('#newProj').onclick = async () => {
    if (state.clips.length && !confirm('Neues Projekt starten? Das aktuelle Projekt wird gelöscht.')) return;
    pause(); state.tracks = [{ id: 'main', kind: 'video', name: 'Hauptspur', main: true }]; state.clips = []; state.markers = []; selId = null; undoStack = []; redoStack = [];
    for (const [id, m] of media) if (m.source !== 'demo') media.delete(id);
    Object.keys(sfxMedia).forEach(k => delete sfxMedia[k]); Object.keys(miCache).forEach(k => delete miCache[k]); savedBlobs.clear(); lastSaved = '';
    try { await DB.clear(); } catch { }
    $('#projectName').value = 'Mein Projekt'; setTime(0); renderLib(); renderAll(); toast('Neues Projekt');
  };
  setInterval(saveProject, 3000);
  setInterval(checkPitch, 300);

  renderLib(); renderAll(); fitCanvas(); requestAnimationFrame(rafLoop);
  restoreProject().finally(() => { restoring = false; });
  window.CutFree = { saveNow: () => saveProject(), _pitch: pitchCache, _els: els, srcAt, state, media, importFiles, addMediaClip, mediaFromSfx, addTextClip, setTime, play, pause, select, get time() { return time; } };
})();