/* CutFree – Profi-Übergänge mit WebGL.
   Shader aus dem Open-Source-Projekt gl-transitions (MIT-Lizenz, https://gl-transitions.com),
   lokal gespeichert in gl-transitions.json. */
(function () {
  let list = [], byName = {}, glc = null, gl = null, buf = null, texA = null, texB = null;
  const progs = {}, broken = new Set();
  const VS = 'attribute vec2 _p; varying vec2 _uv; void main(){ gl_Position = vec4(_p,0.0,1.0); _uv = (_p+1.0)/2.0; }';
  const head = 'precision highp float; varying vec2 _uv; uniform sampler2D from, to; uniform float progress, ratio, _fromR, _toR;\n' +
    'vec4 getFromColor(vec2 uv){ return texture2D(from, uv); }\nvec4 getToColor(vec2 uv){ return texture2D(to, uv); }\n';
  const pretty = n => n.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase()).replace('Rigth', 'Right');

  function init() {
    if (gl) return true;
    glc = document.createElement('canvas'); glc.width = 1080; glc.height = 1920;
    gl = glc.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return false;
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const mkTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR)); return t; };
    texA = mkTex(); texB = mkTex();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    return true;
  }
  function compile(name) {
    if (progs[name]) return progs[name];
    const t = byName[name]; if (!t || broken.has(name)) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, head + t.glsl + '\nvoid main(){ gl_FragColor = transition(_uv); }'));
      gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return (progs[name] = p);
    } catch (e) { console.warn('Übergang', name, 'geht nicht:', e.message); broken.add(name); return null; }
  }
  function setParams(p, t) {
    for (const [k, type] of Object.entries(t.paramsTypes || {})) {
      const loc = gl.getUniformLocation(p, k); if (!loc) continue; let v = t.defaultParams[k];
      switch (type) {
        case 'float': gl.uniform1f(loc, v); break;
        case 'int': case 'bool': gl.uniform1i(loc, +v); break;
        case 'vec2': gl.uniform2fv(loc, v); break; case 'vec3': gl.uniform3fv(loc, v); break; case 'vec4': gl.uniform4fv(loc, v); break;
        case 'ivec2': gl.uniform2iv(loc, v); break; case 'ivec3': gl.uniform3iv(loc, v); break; case 'ivec4': gl.uniform4iv(loc, v); break;
      }
    }
  }
  // Zeichnet den Übergang und gibt [Canvas, sx, sy] zurück (Bild liegt unten links im GL-Canvas)
  function render(name, from, to, progress, w, h) {
    if (!init()) return null;
    const p = compile(name); if (!p) return null;
    if (glc.width < w || glc.height < h) { glc.width = Math.max(glc.width, w); glc.height = Math.max(glc.height, h); }
    gl.viewport(0, 0, w, h); gl.useProgram(p);
    const loc = gl.getAttribLocation(p, '_p'); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, from);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, to);
    gl.uniform1i(gl.getUniformLocation(p, 'from'), 0); gl.uniform1i(gl.getUniformLocation(p, 'to'), 1);
    gl.uniform1f(gl.getUniformLocation(p, 'progress'), progress);
    const r = w / h; ['ratio', '_fromR', '_toR'].forEach(u => gl.uniform1f(gl.getUniformLocation(p, u), r));
    setParams(p, byName[name]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return [glc, 0, glc.height - h];
  }
  // Greenscreen: Farbabstand im UV-Farbraum → Transparenz, plus Entfernen von Farbstich an den Kanten
  // + Farbkorrektur wie Lumetri: Belichtung, Kontrast, Lichter/Tiefen, Temperatur/Tönung, Sättigung/Dynamik, Teal&Orange, Vignette
  const CK_FS = `precision highp float; varying vec2 _uv; uniform sampler2D tex; uniform vec3 key; uniform float sim, smoothv, spill, ckOn;
    uniform float exposure, contrast, highlights, shadows, temp, tint, sat, vib, split, vig, fade;
    const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
    vec2 cuv(vec3 c){ return vec2(c.r*-0.169+c.g*-0.331+c.b*0.5+0.5, c.r*0.5+c.g*-0.419+c.b*-0.081+0.5); }
    void main(){
      vec4 c = texture2D(tex, _uv); vec3 col = c.rgb; float a = c.a;
      if (ckOn > 0.5) {
        float d = distance(cuv(col), cuv(key));
        a *= clamp((d - sim) / smoothv, 0.0, 1.0);
        float s = pow(clamp((d - sim) / max(spill, 0.0001), 0.0, 1.0), 1.5);
        col = mix(vec3(dot(col, LW)), col, s);
      }
      col *= pow(2.0, exposure);
      col += vec3(temp * 0.08, tint * 0.06, -temp * 0.08);
      col = (col - 0.5) * (1.0 + contrast) + 0.5;
      float l = dot(col, LW);
      col += shadows * 0.35 * (1.0 - smoothstep(0.0, 0.55, l)) + highlights * 0.35 * smoothstep(0.45, 1.0, l);
      col += split * (vec3(0.09, 0.03, -0.07) * smoothstep(0.45, 1.0, l) + vec3(-0.07, 0.02, 0.08) * (1.0 - smoothstep(0.0, 0.55, l)));
      float l2 = dot(col, LW), mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b));
      col = mix(vec3(l2), col, max(0.0, 1.0 + sat + vib * (1.0 - clamp(mx - mn, 0.0, 1.0))));
      col = mix(col, vec3(0.5) + (col - 0.5) * 0.8 + 0.06, fade);
      col *= 1.0 - vig * smoothstep(0.25, 0.8, distance(_uv, vec2(0.5)));
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), a);
    }`;
  let ckProg = null;
  const NO_CK = { color: '#00ff00', sim: 0, smooth: 1, spill: 0 }, COL_KEYS = ['exposure', 'contrast', 'highlights', 'shadows', 'temp', 'tint', 'sat', 'vib', 'split', 'vig', 'fade'];
  function chroma(src, sw, sh, ck, color) {
    const on = !!(ck && ck.on); ck = on ? ck : NO_CK; color = color || {};
    if (!init()) return null;
    if (!ckProg) {
      const sh2 = (type, s) => { const x = gl.createShader(type); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
      try { ckProg = gl.createProgram(); gl.attachShader(ckProg, sh2(gl.VERTEX_SHADER, VS)); gl.attachShader(ckProg, sh2(gl.FRAGMENT_SHADER, CK_FS)); gl.linkProgram(ckProg); }
      catch (e) { console.warn('Greenscreen-Shader:', e.message); ckProg = null; return null; }
    }
    const w = Math.min(sw, 1920), h = Math.max(1, Math.round(sh * w / sw));
    if (glc.width < w || glc.height < h) { glc.width = Math.max(glc.width, w); glc.height = Math.max(glc.height, h); }
    gl.viewport(0, 0, w, h); gl.useProgram(ckProg);
    const loc = gl.getAttribLocation(ckProg, '_p'); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const n = parseInt(ck.color.slice(1), 16);
    gl.uniform1i(gl.getUniformLocation(ckProg, 'tex'), 0);
    gl.uniform3f(gl.getUniformLocation(ckProg, 'key'), (n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
    gl.uniform1f(gl.getUniformLocation(ckProg, 'sim'), ck.sim); gl.uniform1f(gl.getUniformLocation(ckProg, 'smoothv'), Math.max(.001, ck.smooth)); gl.uniform1f(gl.getUniformLocation(ckProg, 'spill'), ck.spill);
    gl.uniform1f(gl.getUniformLocation(ckProg, 'ckOn'), on ? 1 : 0);
    COL_KEYS.forEach(k => gl.uniform1f(gl.getUniformLocation(ckProg, k), color[k] || 0));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return [glc, 0, glc.height - h, w, h];
  }
  const ready = fetch('gl-transitions.json').then(r => r.json()).then(j => {
    list = j.filter(t => !(t.textures && t.textures.length) && !Object.values(t.paramsTypes || {}).some(x => /sampler/.test(x)))
      .map(t => ({ ...t, label: pretty(t.name) })).sort((a, b) => a.label.localeCompare(b.label));
    list.forEach(t => byName[t.name] = t);
    return list;
  }).catch(e => { console.warn('gl-transitions.json nicht geladen', e); return []; });
  window.GLT = { ready, render, chroma, get list() { return list; }, isBroken: n => broken.has(n), info: n => byName[n] };
})();
