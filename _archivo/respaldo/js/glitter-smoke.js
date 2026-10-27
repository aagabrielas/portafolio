/**
 * GlitterSmoke — humo de fluido (WebGL2) relleno de glitter lila que sigue al cursor.
 * Basado en humo-glitter.html: simulación Navier-Stokes + shader de glitter dentro del humo.
 *
 *   const smoke = new GlitterSmoke(canvas, { bg, edge, softness, curl, ... });
 *   smoke.stop(); smoke.start(); smoke.destroy();
 *
 * Colores: '#rrggbb', [r,g,b] (0-1) o nombre de variable CSS ('--bg').
 * Con prefers-reduced-motion, sin WebGL2 o sin EXT_color_buffer_float no dibuja nada
 * (queda el fondo de la página) y no lanza errores.
 */
const GS_BASE_VS = `#version 300 es
precision highp float;
in vec2 aPos; out vec2 vUv, vL, vR, vT, vB; uniform vec2 texel;
void main(){ vUv=aPos*.5+.5; vL=vUv-vec2(texel.x,0.); vR=vUv+vec2(texel.x,0.); vT=vUv+vec2(0.,texel.y); vB=vUv-vec2(0.,texel.y); gl_Position=vec4(aPos,0.,1.); }`;

const GS_HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 o;`;

const GS_FS = {
  splat: GS_HEAD + `
    uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
    void main(){ vec2 p=vUv-point; p.x*=aspect; vec3 s=exp(-dot(p,p)/radius)*color; o=vec4(texture(uTarget,vUv).rgb+s,1.); }`,
  advect: GS_HEAD + `
    uniform sampler2D uVelocity, uSource; uniform vec2 texel; uniform float dt, dissipation, fade;
    void main(){ vec2 c=vUv-dt*texture(uVelocity,vUv).xy*texel; vec4 r=texture(uSource,c)/(1.+dissipation*dt); o=vec4(max(r.rgb-fade*dt,0.),1.); }`,
  div: GS_HEAD + `
    uniform sampler2D uVelocity;
    void main(){ float L=texture(uVelocity,vL).x,R=texture(uVelocity,vR).x,T=texture(uVelocity,vT).y,B=texture(uVelocity,vB).y;
      vec2 C=texture(uVelocity,vUv).xy; if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
      o=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
  curl: GS_HEAD + `
    uniform sampler2D uVelocity;
    void main(){ float L=texture(uVelocity,vL).y,R=texture(uVelocity,vR).y,T=texture(uVelocity,vT).x,B=texture(uVelocity,vB).x; o=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
  vort: GS_HEAD + `
    uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main(){ float L=texture(uCurl,vL).x,R=texture(uCurl,vR).x,T=texture(uCurl,vT).x,B=texture(uCurl,vB).x,C=texture(uCurl,vUv).x;
      vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+1e-4; f*=curl*C; f.y*=-1.;
      vec2 v=texture(uVelocity,vUv).xy+f*dt; o=vec4(clamp(v,-1000.,1000.),0.,1.); }`,
  pressure: GS_HEAD + `
    uniform sampler2D uPressure, uDivergence;
    void main(){ float L=texture(uPressure,vL).x,R=texture(uPressure,vR).x,T=texture(uPressure,vT).x,B=texture(uPressure,vB).x;
      o=vec4((L+R+B+T-texture(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
  grad: GS_HEAD + `
    uniform sampler2D uPressure, uVelocity;
    void main(){ float L=texture(uPressure,vL).x,R=texture(uPressure,vR).x,T=texture(uPressure,vT).x,B=texture(uPressure,vB).x;
      vec2 v=texture(uVelocity,vUv).xy-vec2(R-L,T-B); o=vec4(v,0.,1.); }`,
  clear: GS_HEAD + `
    uniform sampler2D uTexture; uniform float value; void main(){ o=value*texture(uTexture,vUv); }`,
  display: GS_HEAD + `
    uniform sampler2D uDye; uniform vec3 bg, edge; uniform vec2 dyeTexel, cssRes; uniform float soft, uTime;
    float h21(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    vec3 pal(int i){
      if(i<2) return vec3(1.);
      if(i==2) return vec3(.914,.863,1.);
      if(i==3) return vec3(.624,.953,1.);
      if(i==4) return vec3(.498,.910,1.);
      if(i==5) return vec3(1.,.608,.910);
      if(i==6) return vec3(.961,.659,1.);
      if(i==7) return vec3(.659,1.,.812);
      return vec3(.78,.722,1.);
    }
    // Glitter lila: fondo degradado + grano que parpadea + destellos
    vec3 glitter(vec2 px, vec2 uv, float t){
      vec3 col = vec3(.416,.247,.776);
      float k = length((uv-vec2(.48,.52))*cssRes)/(max(cssRes.x,cssRes.y)*.65);
      vec4 g = k<.45 ? mix(vec4(.549,.549,.941,.75), vec4(.49,.373,.882,.45), k/.45)
                     : mix(vec4(.49,.373,.882,.45), vec4(.373,.157,.725,0.), clamp((k-.45)/.55,0.,1.));
      col = mix(col, g.rgb, g.a);
      // grano (cambia ~14 veces por segundo)
      vec2 cell = floor(px); float f = mod(floor(t*14.),6.);
      float r = h21(cell+f*17.31), r2 = h21(cell+7.7+f*3.1), r3 = h21(cell+f*5.3+1.9);
      if(r<.10){ vec3 c = r2<.35?vec3(1.,.667,.961):r2<.65?vec3(.588,.922,1.):r2<.8?vec3(.667,1.,.784):vec3(1.);
                 col = mix(col,c,(40.+r3*120.)/255.); }
      else if(r<.35){ col = mix(col,vec3(.235,.078,.549),(30.+r3*50.)/255.); }
      // destellos (1 por cada ~180 px²)
      float cs = 13.416; vec2 ci = floor(px/cs); vec3 add = vec3(0.);
      for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++){
        vec2 c = ci+vec2(float(i),float(j));
        float a = sin(t*(1.5+h21(c+19.9)*4.5)+h21(c+23.3)*6.283); a = a>0.? a*a*a : 0.;
        if(a<.03) continue;
        float r3b=h21(c+7.3), r4=h21(c+11.7);
        bool big = r3b<.06; float s = big ? 1.6+r4*1.6 : .6+r4*1.1;
        vec2 d = px-(c+vec2(h21(c),h21(c+3.1)))*cs;
        vec3 cc = pal(int(h21(c+29.1)*9.));
        if(big){
          float rr = s*(2.5+a*3.);
          float cr = max((1.-smoothstep(.3,.9,abs(d.y)))*(1.-smoothstep(rr-1.,rr,abs(d.x))),
                         (1.-smoothstep(.3,.9,abs(d.x)))*(1.-smoothstep(rr-1.,rr,abs(d.y))));
          float gl2 = (1.-smoothstep(s*2.2-1.,s*2.2,length(d)))*.35;
          float core = 1.-smoothstep(s*.5,s*.5+.5,max(abs(d.x),abs(d.y)));
          add += cc*a*max(cr,gl2) + vec3(a*core);
        } else add += cc*a*(1.-smoothstep(s*.5,s*.5+.6,max(abs(d.x),abs(d.y))));
      }
      return min(col+add,1.);
    }
    void main(){
      float d=0., wsum=0.;
      for(int x=-2;x<=2;x++) for(int y=-2;y<=2;y++){
        float w=exp(-float(x*x+y*y)*.35);
        d+=w*texture(uDye,vUv+vec2(float(x),float(y))*dyeTexel*soft).r; wsum+=w; }
      d=clamp(d/wsum,0.,1.);
      float body = smoothstep(.03,.95,d); body = body*body*(3.-2.*body);
      float rim  = smoothstep(.0,.35,d)*(1.-smoothstep(.3,.9,d));
      vec3 col = mix(bg, edge, rim*.9);
      if(body>.003){                                   // el brillo solo se calcula dentro del humo
        vec2 px = vec2(vUv.x,1.-vUv.y)*cssRes;
        col = mix(col, glitter(px,vUv,uTime), body);
      }
      o=vec4(col,1.); }`,
};

class GlitterSmoke {
  static DEFAULTS = {
    bg: '--bg',                 // fondo (el humo se dibuja sobre este color)
    edge: '#4a2a9a',            // tinte en los bordes del humo
    splatRadius: 0.0012,        // grosor del humo al mover el mouse (más = más grueso)
    dyeAmount: 0.7,             // cuánta densidad deja el mouse
    force: 2400,                // empuje que el mouse le da al fluido
    softness: 3.6,              // difuminado de los bordes (0 = nítido)
    curl: 16,                   // remolinos / volutas
    dyeDissipation: 0.8,        // qué tan rápido se diluye el humo
    dyeFade: 0.22,              // cuánto se apaga del todo por segundo
    velDissipation: 0.35,       // cuánto dura el movimiento interno
    pressureIters: 18,
    simRes: 128,                // resolución de la física
    dyeRes: 640,                // resolución del dibujo (se reduce en pantallas pequeñas)
  };

  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.cfg = { ...GlitterSmoke.DEFAULTS, ...opts };
    this.running = false;
    this.visible = true;
    this.wanted = true;
    this.raf = 0;
    this.last = null;
    this.res = [];                                   // recursos GL para liberar

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = reduce ? null : canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) { canvas.hidden = true; return; }
    this.gl = gl;
    this._setup();
    this._sync();
  }

  _color(v) {
    if (Array.isArray(v)) return v;
    let s = String(v).trim();
    if (s.startsWith('--')) s = getComputedStyle(this.canvas).getPropertyValue(s).trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(s);
    const n = m ? parseInt(m[1], 16) : 0;
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  _sh(type, src) {
    const { gl } = this;
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }

  _prog(fs) {
    const { gl } = this;
    const vs = this._sh(gl.VERTEX_SHADER, GS_BASE_VS), f = this._sh(gl.FRAGMENT_SHADER, fs);
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(f);
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const nm = gl.getActiveUniform(p, i).name;
      u[nm] = gl.getUniformLocation(p, nm);
    }
    this.res.push(() => gl.deleteProgram(p));
    return { p, u };
  }

  _fbo(w, h, internal, format, filter) {
    const { gl } = this;
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    this.targets.push({ t, f });
    return { t, f, w, h, tx: [1 / w, 1 / h], attach: i => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); return i; } };
  }

  _dbl(w, h, i, f, fl) {
    let a = this._fbo(w, h, i, f, fl), b = this._fbo(w, h, i, f, fl);
    return { w, h, tx: a.tx, get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; } };
  }

  _freeTargets() {
    const { gl } = this;
    for (const { t, f } of this.targets || []) { gl.deleteTexture(t); gl.deleteFramebuffer(f); }
    this.targets = [];
  }

  _setup() {
    const { gl, canvas } = this;
    this.P = {};
    for (const k in GS_FS) this.P[k] = this._prog(GS_FS[k]);
    this.targets = [];

    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.res.push(() => gl.deleteBuffer(vb));

    this.bg = this._color(this.cfg.bg);
    this.edge = this._color(this.cfg.edge);

    this._onResize = () => this._resize();
    this._onPointer = e => this._pointer(e.clientX, e.clientY);
    this._onTouch = e => { const t = e.touches[0]; if (t) this._pointer(t.clientX, t.clientY); };
    this._onLeave = () => { this.last = null; };
    this._onVis = () => this._sync();
    addEventListener('resize', this._onResize);
    addEventListener('pointermove', this._onPointer, { passive: true });
    addEventListener('touchmove', this._onTouch, { passive: true });
    document.documentElement.addEventListener('pointerleave', this._onLeave);
    document.addEventListener('visibilitychange', this._onVis);
    this._io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this._sync(); });
    this._io.observe(canvas);

    this._resize();
  }

  _dims(base) {
    const ar = this.canvas.clientWidth / this.canvas.clientHeight;
    return ar > 1 ? { w: Math.round(base * ar), h: base } : { w: base, h: Math.round(base / ar) };
  }

  _resize() {
    const { gl, canvas, cfg } = this;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    this._freeTargets();
    const s = this._dims(cfg.simRes), d = this._dims(W < 700 ? Math.min(cfg.dyeRes, 420) : cfg.dyeRes);
    this.vel = this._dbl(s.w, s.h, gl.RG16F, gl.RG, gl.LINEAR);
    this.prs = this._dbl(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.dvg = this._fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.crl = this._fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.dye = this._dbl(d.w, d.h, gl.RGBA16F, gl.RGBA, gl.LINEAR);
  }

  _blit(target) {
    const { gl, canvas } = this;
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); }
    else { gl.viewport(0, 0, canvas.width, canvas.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  _use(p, tx) {
    const { gl } = this;
    gl.useProgram(p.p);
    if (p.u.texel) gl.uniform2f(p.u.texel, tx[0], tx[1]);
    return p.u;
  }

  /* ---------- Interacción ---------- */
  _splat(x, y, dx, dy, amount) {
    const { gl, P, vel, dye, cfg, canvas } = this;
    const ar = canvas.clientWidth / canvas.clientHeight;
    let u = this._use(P.splat, vel.tx);
    gl.uniform1i(u.uTarget, vel.read.attach(0)); gl.uniform1f(u.aspect, ar); gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0); gl.uniform1f(u.radius, cfg.splatRadius * (ar > 1 ? 1 : 1 / ar));
    this._blit(vel.write); vel.swap();
    u = this._use(P.splat, dye.tx);
    gl.uniform1i(u.uTarget, dye.read.attach(0)); gl.uniform3f(u.color, amount, amount, amount); gl.uniform2f(u.point, x, y); gl.uniform1f(u.aspect, ar);
    gl.uniform1f(u.radius, cfg.splatRadius * 1.1 * (ar > 1 ? 1 : 1 / ar));
    this._blit(dye.write); dye.swap();
  }

  _pointer(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const x = (cx - r.left) / r.width, y = 1 - (cy - r.top) / r.height;
    if (this.last) {
      const dx = x - this.last.x, dy = y - this.last.y;
      const speed = Math.hypot(dx * r.width, dy * r.height);
      if (speed > 0.5) {
        // La fuerza empuja el fluido; el humo nace en el punto, no sigue al cursor.
        this._splat(x, y, dx * this.cfg.force, dy * this.cfg.force, Math.min(speed / 14, 1) * this.cfg.dyeAmount);
      }
    }
    this.last = { x, y };
  }

  /* ---------- Simulación ---------- */
  _step(dt) {
    const { gl, P, cfg, vel, dye, prs, dvg, crl } = this;
    let u = this._use(P.curl, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); this._blit(crl);
    u = this._use(P.vort, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uCurl, crl.attach(1));
    gl.uniform1f(u.curl, cfg.curl); gl.uniform1f(u.dt, dt); this._blit(vel.write); vel.swap();
    u = this._use(P.div, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); this._blit(dvg);
    u = this._use(P.clear, vel.tx); gl.uniform1i(u.uTexture, prs.read.attach(0)); gl.uniform1f(u.value, .8); this._blit(prs.write); prs.swap();
    u = this._use(P.pressure, vel.tx); gl.uniform1i(u.uDivergence, dvg.attach(0));
    for (let i = 0; i < cfg.pressureIters; i++) { gl.uniform1i(u.uPressure, prs.read.attach(1)); this._blit(prs.write); prs.swap(); }
    u = this._use(P.grad, vel.tx); gl.uniform1i(u.uPressure, prs.read.attach(0)); gl.uniform1i(u.uVelocity, vel.read.attach(1)); this._blit(vel.write); vel.swap();
    u = this._use(P.advect, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uSource, vel.read.attach(0));
    gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, cfg.velDissipation); gl.uniform1f(u.fade, 0); this._blit(vel.write); vel.swap();
    u = this._use(P.advect, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uSource, dye.read.attach(1));
    gl.uniform2f(u.texel, vel.tx[0], vel.tx[1]); gl.uniform1f(u.dissipation, cfg.dyeDissipation); gl.uniform1f(u.fade, cfg.dyeFade); this._blit(dye.write); dye.swap();
  }

  _render() {
    const { gl, canvas, P, dye, cfg } = this;
    const u = this._use(P.display, [1 / canvas.width, 1 / canvas.height]);
    gl.uniform1i(u.uDye, dye.read.attach(0)); gl.uniform2f(u.dyeTexel, dye.tx[0], dye.tx[1]); gl.uniform1f(u.soft, cfg.softness);
    gl.uniform2f(u.cssRes, canvas.clientWidth, canvas.clientHeight); gl.uniform1f(u.uTime, performance.now() / 1000);
    gl.uniform3fv(u.bg, this.bg); gl.uniform3fv(u.edge, this.edge);
    this._blit(null);
  }

  start() { this.wanted = true; this._sync(); }
  stop() { this.wanted = false; this._sync(); }

  /** Corre solo si se pidió, la pestaña se ve y el canvas está en pantalla. */
  _sync() {
    if (!this.gl) return;
    const go = this.wanted && this.visible && !document.hidden;
    if (go && !this.running) {
      this.running = true;
      this.prev = performance.now();
      this.raf = requestAnimationFrame(t => this._frame(t));
    } else if (!go) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.last = null;
    }
  }

  _frame(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.prev) / 1000, 1 / 30);
    this.prev = now;
    this._step(dt); this._render();
    this.raf = requestAnimationFrame(t => this._frame(t));
  }

  destroy() {
    this.wanted = false;
    this.running = false;
    cancelAnimationFrame(this.raf);
    const { gl } = this;
    if (!gl) return;
    removeEventListener('resize', this._onResize);
    removeEventListener('pointermove', this._onPointer);
    removeEventListener('touchmove', this._onTouch);
    document.documentElement.removeEventListener('pointerleave', this._onLeave);
    document.removeEventListener('visibilitychange', this._onVis);
    this._io.disconnect();
    this._freeTargets();
    this.res.forEach(fn => fn());
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}
