/**
 * GlitterSmoke — fondo de glitter gris oscuro (WebGL2) que el cursor "tiñe" de lila con humo de fluido.
 * Simulación Navier-Stokes + un solo shader de glitter: gris fuera del humo, lila dentro.
 *
 *   const smoke = new GlitterSmoke(canvas, { softness, curl, ... });
 *   smoke.stop(); smoke.start();      // pausa por visibilidad (scroll)
 *   smoke.setPaused(true);            // pausa elegida por la persona (deja un fotograma fijo)
 *   smoke.destroy();
 *
 * Rendimiento:
 *  - Solo simula mientras hay humo (activeMs tras el último movimiento); en reposo redibuja a idleFps.
 *  - Se pausa si la pestaña o el canvas no se ven.
 *  - Si los fotogramas son lentos baja la calidad sola (autoQuality).
 * Accesibilidad:
 *  - Con prefers-reduced-motion (o setPaused) dibuja un solo fotograma estático, sin humo ni parpadeo.
 *  - Sin WebGL2 / EXT_color_buffer_float, o si se pierde el contexto, oculta el canvas (queda el fondo de la página).
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
    void main(){ vec2 c=vUv-dt*texture(uVelocity,vUv).xy*texel; vec4 r=texture(uSource,c)/(1.+dissipation*dt);
      vec3 v=r.rgb; if(fade>0.) v=max(v-fade*dt,0.);   // el recorte a 0 solo vale para el humo; la velocidad tiene signo
      o=vec4(v,1.); }`,
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
    uniform sampler2D uPressure, uVelocity; uniform float maxV;
    void main(){ float L=texture(uPressure,vL).x,R=texture(uPressure,vR).x,T=texture(uPressure,vT).x,B=texture(uPressure,vB).x;
      vec2 v=texture(uVelocity,vUv).xy-vec2(R-L,T-B);
      float s=length(v); if(s>maxV) v*=maxV/s;          // tope: evita que el humo se estire en líneas
      o=vec4(v,0.,1.); }`,
  clear: GS_HEAD + `
    uniform sampler2D uTexture; uniform float value; void main(){ o=value*texture(uTexture,vUv); }`,
  display: GS_HEAD + `
    uniform sampler2D uDye; uniform vec3 edge; uniform vec2 dyeTexel, cssRes;
    uniform float soft, uTime, glow, dim, base, gmove, uIdle;
    float h21(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    vec3 palG(int i){                                  // destellos grises
      if(i<2) return vec3(1.);
      if(i==2) return vec3(.941);
      if(i==3) return vec3(.851);
      if(i==4) return vec3(.769);
      if(i==5) return vec3(.690);
      if(i==6) return vec3(.902);
      if(i==7) return vec3(.604);
      return vec3(.812);
    }
    vec3 palL(int i){                                  // los mismos destellos, versión lila
      if(i<2) return vec3(1.);
      if(i==2) return vec3(.914,.863,1.);
      if(i==3) return vec3(.831,.749,1.);
      if(i==4) return vec3(.765,.651,1.);
      if(i==5) return vec3(.706,.549,1.);
      if(i==6) return vec3(.941,.831,1.);
      if(i==7) return vec3(.624,.478,.918);
      return vec3(.804,.722,1.);
    }
    // Glitter gris oscuro y tenue (m=0) que se vuelve lila y vivo (m=1). Mismas posiciones: solo cambia el color y el ritmo.
    vec3 glitter(vec2 px, vec2 uv, float t, float m){
      float k = length((uv-vec2(.48,.52))*cssRes)/(max(cssRes.x,cssRes.y)*.65);
      float kk = clamp((k-.45)/.55,0.,1.);
      float ag = k<.45 ? mix(.75,.45,k/.45) : mix(.45,0.,kk);
      float cg = k<.45 ? mix(120.,70.,k/.45) : mix(70.,10.,kk);
      vec3 gray = mix(vec3(.078), vec3(cg/255.), ag) * base;
      vec4 g = k<.45 ? mix(vec4(.549,.549,.941,.75), vec4(.49,.373,.882,.45), k/.45)
                     : mix(vec4(.49,.373,.882,.45), vec4(.373,.157,.725,0.), kk);
      vec3 lil = mix(vec3(.416,.247,.776), g.rgb, g.a);
      vec3 col = mix(gray, lil, m);
      float lv = mix(dim, 1., m);                      // brillo del glitter: tenue en el gris, pleno en el lila
      float ta = smoothstep(0.,.25,m);                 // 0 = fondo gris (suave), 1 = dentro del humo (normal)
      float tg = t*gmove;                              // el fondo gris corre más lento
      vec2 cell = floor(px); float f = mod(floor((ta>.5 ? t : tg)*14.),6.);
      float r = h21(cell+f*17.31), r2 = h21(cell+7.7+f*3.1), r3 = h21(cell+f*5.3+1.9);
      if(r<.10){
        vec3 cG = r2<.35?vec3(.784):r2<.65?vec3(.627):r2<.8?vec3(.471):vec3(1.);
        vec3 cL = r2<.35?vec3(.85,.72,1.):r2<.65?vec3(.74,.62,1.):r2<.8?vec3(.9,.8,1.):vec3(1.);
        col = mix(col, mix(cG,cL,m), (40.+r3*120.)/255.*lv);
      } else if(r<.35){
        col = mix(col, mix(vec3(0.),vec3(.235,.078,.549),m), (30.+r3*50.)/255.);
      }
      float cs = 13.416; vec2 ci = floor(px/cs); vec3 add = vec3(0.);
      for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++){
        vec2 c = ci+vec2(float(i),float(j));
        float sp = 1.5+h21(c+19.9)*4.5, ph = h21(c+23.3)*6.283;
        float a = 0.;                                  // solo se evalúa el seno que hace falta
        if(ta<1.){ float a1 = sin(tg*sp+ph); a += (1.-ta)*(a1>0.? a1*a1 : 0.); }       // fondo: destello ancho y suave
        if(ta>0.){ float a2 = sin(t*sp+ph);  a += ta*(a2>0.? a2*a2*a2 : 0.); }         // humo: como estaba
        if(a<.03) continue;
        float r3b=h21(c+7.3), r4=h21(c+11.7);
        bool big = r3b<.06; float s = big ? 1.6+r4*1.6 : .6+r4*1.1;
        vec2 d = px-(c+vec2(h21(c),h21(c+3.1)))*cs;
        int pi = int(h21(c+29.1)*9.);
        vec3 cc = mix(palG(pi), palL(pi), m);
        if(big){
          float rr = s*(2.5+a*3.);
          float cr = max((1.-smoothstep(.3,.9,abs(d.y)))*(1.-smoothstep(rr-1.,rr,abs(d.x))),
                         (1.-smoothstep(.3,.9,abs(d.x)))*(1.-smoothstep(rr-1.,rr,abs(d.y))));
          float gl2 = (1.-smoothstep(s*2.2-1.,s*2.2,length(d)))*.35;
          float core = 1.-smoothstep(s*.5,s*.5+.5,max(abs(d.x),abs(d.y)));
          add += cc*a*max(cr,gl2) + vec3(a*core);
        } else add += cc*a*(1.-smoothstep(s*.5,s*.5+.6,max(abs(d.x),abs(d.y))));
      }
      return min(col+add*lv,1.);
    }
    void main(){
      float d=0.;
      if(uIdle<.5){                                    // en reposo no hay humo: se salta el desenfoque (25 lecturas por píxel)
        float wsum=0.;
        for(int x=-2;x<=2;x++) for(int y=-2;y<=2;y++){
          float w=exp(-float(x*x+y*y)*.35);
          d+=w*texture(uDye,vUv+vec2(float(x),float(y))*dyeTexel*soft).r; wsum+=w; }
        d=clamp(d/wsum,0.,1.);
      }
      float body = smoothstep(.03,.95,d); body = body*body*(3.-2.*body);
      float rim  = smoothstep(.0,.35,d)*(1.-smoothstep(.3,.9,d));
      vec2 px = vec2(vUv.x,1.-vUv.y)*cssRes;
      vec3 col = glitter(px, vUv, uTime, body);
      col += edge*rim*glow;                            // halo lila en el borde del humo
      o=vec4(min(col,1.),1.); }`,
};

class GlitterSmoke {
  static DEFAULTS = {
    edge: '#9b7bff',            // color del halo en el borde del humo
    edgeGlow: 0.28,             // intensidad del halo (0 = sin halo)
    grayDim: 0.2,               // brillo del glitter gris (0 = apagado, 1 = como el original)
    grayBase: 0.34,             // claridad del fondo gris (0 = negro puro, 1 = como el original)
    grayMotion: 0.24,           // movimiento del glitter gris (0 = quieto, 1 = como el original)
    splatRadius: 0.0027,        // grosor del humo al mover el mouse (más = más grueso)
    dyeAmount: 0.95,            // cuánta densidad deja el mouse
    force: 4500,                // empuje que el mouse le da al fluido
    softness: 6.3,              // difuminado de los bordes (0 = nítido)
    curl: 24,                   // remolinos / volutas
    dyeDissipation: 0.75,       // qué tan rápido se diluye el humo
    dyeFade: 0.34,              // cuánto se apaga del todo por segundo
    velDissipation: 0.9,        // cuánto dura el movimiento interno
    maxSpeed: 60,               // tope de velocidad del fluido (evita líneas de estiramiento)
    pressureIters: 18,
    simRes: 128,                // resolución de la física
    dyeRes: 640,                // resolución del dibujo (se reduce en pantallas pequeñas)
    maxDpr: 1.5,                // tope de densidad de píxeles del canvas
    activeMs: 8000,             // cuánto sigue simulando tras el último movimiento (el humo ya se apagó)
    idleFps: 20,                // fotogramas por segundo en reposo (el fondo se mueve muy despacio)
    autoQuality: true,          // baja la calidad si los fotogramas son lentos
    paused: false,              // empezar pausado (preferencia de la persona)
  };

  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.cfg = { ...GlitterSmoke.DEFAULTS, ...opts };
    this.running = false;
    this.visible = true;
    this.wanted = true;
    this.userPaused = !!this.cfg.paused;
    this.raf = 0;
    this.last = null;
    this.res = [];                                   // recursos GL para liberar
    this.quality = 0;                                // 0 = completa; sube si va lento
    this.dprCap = this.cfg.maxDpr;
    this.activeUntil = 0;
    this.lastDraw = 0;
    this.idle = true;
    this.slow = 0;
    this.revealed = false;
    this.key = '';

    this.mq = matchMedia('(prefers-reduced-motion: reduce)');
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) { canvas.hidden = true; return; }
    this.gl = gl;
    this._setup();
    this._sync();
  }

  /** Hay movimiento solo si la persona no pidió reducirlo ni lo pausó. */
  get animated() { return !this.mq.matches && !this.userPaused; }

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

    this.edge = this._color(this.cfg.edge);

    this._onPointer = e => this._pointer(e.clientX, e.clientY);
    this._onTouch = e => { const t = e.touches[0]; if (t) this._pointer(t.clientX, t.clientY); };
    this._onLeave = () => { this.last = null; };
    this._onVis = () => this._sync();
    this._onMotion = () => this._sync();
    this._onLost = e => { e.preventDefault(); this.destroy(); canvas.hidden = true; };   // sin contexto: queda el fondo de la página
    addEventListener('pointermove', this._onPointer, { passive: true });
    addEventListener('touchmove', this._onTouch, { passive: true });
    document.documentElement.addEventListener('pointerleave', this._onLeave);
    document.addEventListener('visibilitychange', this._onVis);
    this.mq.addEventListener('change', this._onMotion);
    canvas.addEventListener('webglcontextlost', this._onLost);
    this._ro = new ResizeObserver(() => { clearTimeout(this._rt); this._rt = setTimeout(() => this._resize(), 120); });
    this._ro.observe(canvas);
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
    if (!gl) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, this.dprCap);
    const key = `${W}x${H}@${dpr}`;
    if (key === this.key) return;                    // nada cambió: no reasignar texturas
    this.key = key;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    this._freeTargets();
    const s = this._dims(cfg.simRes), d = this._dims(W < 700 ? Math.min(cfg.dyeRes, 420) : cfg.dyeRes);
    this.vel = this._dbl(s.w, s.h, gl.RG16F, gl.RG, gl.LINEAR);
    this.prs = this._dbl(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.dvg = this._fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.crl = this._fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    this.dye = this._dbl(d.w, d.h, gl.RGBA16F, gl.RGBA, gl.LINEAR);
    if (!this.running) this._still();
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
    if (!this.running) return;                       // pausado, fuera de pantalla o con movimiento reducido
    const r = this.canvas.getBoundingClientRect();
    const x = (cx - r.left) / r.width, y = 1 - (cy - r.top) / r.height;
    if (this.last) {
      const dx = x - this.last.x, dy = y - this.last.y;
      const speed = Math.hypot(dx * r.width, dy * r.height);
      if (speed > 0.5) {
        // La fuerza empuja el fluido; el humo nace en el punto, no sigue al cursor.
        this._splat(x, y, dx * this.cfg.force, dy * this.cfg.force, Math.min(speed / 14, 1) * this.cfg.dyeAmount);
        this.activeUntil = performance.now() + this.cfg.activeMs;
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
    u = this._use(P.grad, vel.tx); gl.uniform1i(u.uPressure, prs.read.attach(0)); gl.uniform1i(u.uVelocity, vel.read.attach(1)); gl.uniform1f(u.maxV, cfg.maxSpeed); this._blit(vel.write); vel.swap();
    u = this._use(P.advect, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uSource, vel.read.attach(0));
    gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, cfg.velDissipation); gl.uniform1f(u.fade, 0); this._blit(vel.write); vel.swap();
    u = this._use(P.advect, vel.tx); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uSource, dye.read.attach(1));
    gl.uniform2f(u.texel, vel.tx[0], vel.tx[1]); gl.uniform1f(u.dissipation, cfg.dyeDissipation); gl.uniform1f(u.fade, cfg.dyeFade); this._blit(dye.write); dye.swap();
  }

  _clearDye() {
    const { gl, P, dye } = this;
    const u = this._use(P.clear, dye.tx);
    gl.uniform1i(u.uTexture, dye.read.attach(0)); gl.uniform1f(u.value, 0);
    this._blit(dye.write); dye.swap();
  }

  /** idle = no hay humo: el shader se salta el desenfoque. */
  _render(t = performance.now() / 1000, idle = false) {
    const { gl, canvas, P, dye, cfg } = this;
    const u = this._use(P.display, [1 / canvas.width, 1 / canvas.height]);
    gl.uniform1i(u.uDye, dye.read.attach(0)); gl.uniform2f(u.dyeTexel, dye.tx[0], dye.tx[1]); gl.uniform1f(u.soft, cfg.softness);
    gl.uniform2f(u.cssRes, canvas.clientWidth, canvas.clientHeight); gl.uniform1f(u.uTime, t);
    gl.uniform3fv(u.edge, this.edge); gl.uniform1f(u.glow, cfg.edgeGlow);
    gl.uniform1f(u.dim, cfg.grayDim); gl.uniform1f(u.base, cfg.grayBase); gl.uniform1f(u.gmove, cfg.grayMotion);
    gl.uniform1f(u.uIdle, idle ? 1 : 0);
    this._blit(null);
  }

  /** Un solo fotograma fijo: movimiento reducido, pausa o antes de empezar. */
  _still() {
    if (!this.gl || !this.dye) return;
    this._clearDye();
    this._render(0, true);
    this._reveal();
  }

  _reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.canvas.classList.add('is-ready');           // el CSS lo muestra con un fundido
  }

  start() { this.wanted = true; this._sync(); }
  stop() { this.wanted = false; this._sync(); }
  setPaused(p) { this.userPaused = !!p; this._sync(); }

  /** Corre solo si se pidió, la pestaña se ve, el canvas está en pantalla y hay permiso de movimiento. */
  _sync() {
    if (!this.gl) return;
    const live = this.wanted && this.visible && !document.hidden;
    const go = live && this.animated;
    if (go && !this.running) {
      this.running = true;
      this.idle = false;
      this.prev = performance.now();
      this.raf = requestAnimationFrame(t => this._frame(t));
    } else if (!go) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.last = null;
      if (live) this._still();
    }
  }

  _frame(now) {
    if (!this.running) return;
    const raw = now - this.prev;
    this.prev = now;
    if (now < this.activeUntil) {
      this.idle = false;
      this._step(Math.min(raw / 1000, 1 / 30));
      this._render(now / 1000, false);
      this._watch(raw);
    } else {
      if (!this.idle) { this.idle = true; this._clearDye(); this.lastDraw = 0; }
      if (now - this.lastDraw >= 1000 / this.cfg.idleFps) { this._render(now / 1000, true); this.lastDraw = now; }
    }
    this._reveal();
    this.raf = requestAnimationFrame(t => this._frame(t));
  }

  /** Si va lento de forma sostenida, baja resolución / iteraciones (máx. 3 pasos). */
  _watch(raw) {
    if (!this.cfg.autoQuality || this.quality >= 3 || raw > 250) return;
    this.slow = raw > 36 ? this.slow + 1 : Math.max(0, this.slow - 1);
    if (this.slow < 24) return;
    this.slow = 0;
    const q = ++this.quality;
    if (q === 1) this.dprCap = 1;
    else if (q === 2) { this.cfg.pressureIters = 10; this.cfg.dyeRes = Math.min(this.cfg.dyeRes, 420); }
    else this.cfg.simRes = Math.min(this.cfg.simRes, 96);
    this.key = '';
    this._resize();
  }

  destroy() {
    this.wanted = false;
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this._rt);
    const { gl } = this;
    if (!gl) return;
    removeEventListener('pointermove', this._onPointer);
    removeEventListener('touchmove', this._onTouch);
    document.documentElement.removeEventListener('pointerleave', this._onLeave);
    document.removeEventListener('visibilitychange', this._onVis);
    this.mq.removeEventListener('change', this._onMotion);
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this._ro.disconnect();
    this._io.disconnect();
    this._freeTargets();
    this.res.forEach(fn => fn());
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}
