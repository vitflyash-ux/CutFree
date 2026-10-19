/* CutFree – KI-Funktionen (Spracherkennung für Untertitel + Text-zu-Sprache)
   Läuft komplett lokal im Browser über transformers.js in einem Hintergrund-Worker. */
(function () {
  const TF = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2';
  const workerCode = `
    import { pipeline, env } from '${TF}';
    env.allowLocalModels = false;
    const pipes = {};
    function progress(id) {
      const files = {};
      return p => {
        if (p.status === 'progress' && p.total) {
          files[p.file] = [p.loaded, p.total];
          let l = 0, t = 0; for (const k in files) { l += files[k][0]; t += files[k][1]; }
          postMessage({ id, type: 'progress', value: l / t, loaded: l, total: t });
        }
      };
    }
    async function get(task, model, id) {
      const key = task + '|' + model;
      if (!pipes[key]) pipes[key] = pipeline(task, model, { progress_callback: progress(id) });
      try { return await pipes[key]; } catch (e) { delete pipes[key]; throw e; }
    }
    onmessage = async e => {
      const { id, cmd } = e.data;
      try {
        if (cmd === 'asr') {
          const asr = await get('automatic-speech-recognition', e.data.model, id);
          postMessage({ id, type: 'status', text: 'Sprache wird erkannt… (kann etwas dauern)' });
          const opts = { task: 'transcribe' };
          if (e.data.language) opts.language = e.data.language;
          // Eigene Fenster (<30 s), an leisen Stellen geschnitten – genauere Zeitstempel als das eingebaute Chunking
          const a = e.data.audio, SR = 16000, wins = [];
          let pos = 0;
          while (pos < a.length) {
            let end = Math.min(a.length, pos + 28 * SR);
            if (end < a.length) {
              let best = end, bestE = Infinity;
              for (let s = pos + 18 * SR; s < end - 1600; s += 800) { let en = 0; for (let j = s; j < s + 1600; j += 4) en += a[j] * a[j]; if (en < bestE) { bestE = en; best = s + 800; } }
              end = best;
            }
            wins.push([pos, end]); pos = end;
          }
          const chunks = []; let word = true, text = '';
          for (let w = 0; w < wins.length; w++) {
            const [s0, s1] = wins[w], seg = a.subarray(s0, s1);
            let rms = 0; for (let j = 0; j < seg.length; j += 8) rms += seg[j] * seg[j]; if (Math.sqrt(rms / (seg.length / 8)) < 0.003) continue;
            postMessage({ id, type: 'status', text: 'Sprache wird erkannt… ' + Math.round(w / wins.length * 100) + '%' });
            let out;
            try { out = await asr(seg, { ...opts, return_timestamps: 'word' }); }
            catch (err) { word = false; out = await asr(seg, { ...opts, return_timestamps: true }); }
            const off = s0 / SR;
            (out.chunks || []).forEach(c => chunks.push({ text: c.text, timestamp: [c.timestamp[0] + off, c.timestamp[1] == null ? null : c.timestamp[1] + off] }));
            text += out.text;
          }
          postMessage({ id, type: 'done', result: { chunks, text, word } });
        } else if (cmd === 'tts') {
          const tts = await get('text-to-speech', e.data.model, id);
          postMessage({ id, type: 'status', text: 'Stimme wird gesprochen…' });
          const out = await tts(e.data.text);
          postMessage({ id, type: 'done', result: { audio: out.audio, sr: out.sampling_rate } }, [out.audio.buffer]);
        }
      } catch (err) { postMessage({ id, type: 'error', error: String((err && err.message) || err) }); }
    };`;
  let worker = null, seq = 0;
  const jobs = {};
  function getWorker() {
    if (worker) return worker;
    worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' })), { type: 'module' });
    worker.onmessage = e => {
      const { id, type } = e.data, j = jobs[id]; if (!j) return;
      if (type === 'progress') j.onProgress && j.onProgress(e.data.value, `Modell wird geladen… ${(e.data.loaded / 1048576).toFixed(0)} / ${(e.data.total / 1048576).toFixed(0)} MB`);
      else if (type === 'status') j.onProgress && j.onProgress(1, e.data.text);
      else if (type === 'done') { delete jobs[id]; j.resolve(e.data.result); }
      else if (type === 'error') { delete jobs[id]; j.reject(new Error(e.data.error)); }
    };
    worker.onerror = e => { const msg = 'KI konnte nicht starten (Internet für den ersten Download nötig): ' + (e.message || ''); Object.values(jobs).forEach(j => j.reject(new Error(msg))); for (const k in jobs) delete jobs[k]; worker = null; };
    return worker;
  }
  function run(msg, onProgress, transfer) {
    return new Promise((resolve, reject) => {
      const id = ++seq; jobs[id] = { resolve, reject, onProgress };
      getWorker().postMessage({ ...msg, id }, transfer || []);
    });
  }
  window.AI = {
    transcribe(audio, { model, language, onProgress } = {}) {
      const copy = new Float32Array(audio);
      return run({ cmd: 'asr', audio: copy, model, language }, onProgress, [copy.buffer]);
    },
    tts(text, { model, onProgress } = {}) { return run({ cmd: 'tts', text, model }, onProgress); },
  };
})();
