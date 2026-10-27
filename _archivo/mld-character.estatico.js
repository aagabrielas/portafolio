// 1 char = 1 pixel, "." = transparent. Add poses as arrays of frames: poses.walk = [frame1, frame2, ...]
window.MLD_SPRITE = {
 palette: {"0":"#80848c","1":"#767a7f","2":"#8875b8","3":"#7768a8","4":"#c0a7f4","a":"#090000","b":"#442d1d","c":"#523b2b","d":"#3b2414","e":"#4a3424","f":"#6f594c","g":"#cbc1e4","h":"#bfb2de","i":"#b6aad4","j":"#e0dbec","k":"#b7a2e6","l":"#9f8bd2","m":"#ad9ed2","n":"#ab95de","o":"#9783c8","p":"#321b0b","q":"#d8d2e8","r":"#f9e4dd","s":"#594232","t":"#987a73","u":"#c4a097","v":"#ebbeb5","w":"#f3cec3","x":"#644a41","y":"#7c6461","z":"#e7b3ad","A":"#9a635f","B":"#b67d72","C":"#a688dd","D":"#8f71c6","E":"#ece0db","F":"#552b28","G":"#78413d","H":"#fefefe","I":"#785cae","J":"#a34f4c","K":"#b85d5a","L":"#e7e6e7","M":"#f9eeee","N":"#f5d4d2","O":"#b25552","P":"#f8c2bb","Q":"#c9958a","R":"#240d01","S":"#ddaca2","T":"#040709","U":"#212122","V":"#333638","W":"#282c2e","X":"#5d6167","Y":"#8c9096","Z":"#51545b"},
 heart: [
  [".kk.kk.","kgkkkkn","kkkkkkn",".kkkkn.","..kkn..","...n..."],
  ["..k.k..",".kgkkn.",".kkkkn.","..kkn..","..kn...","...n..."],
  ["...l...","...l...","...l...","...l...","...l...","...l..."],
  ["..o.o..",".lllo..",".llllo.","..lllo.","...lo..","...o..."],
  [".ll.ll.","llllllo","llllllo",".llllo.","..llo..","...o..."],
  ["..o.o..",".lllo..",".llllo.","..lllo.","...lo..","...o..."],
  ["...l...","...l...","...l...","...l...","...l...","...l..."],
  ["..k.k..",".kgkkn.",".kkkkn.","..kkn..","..kn...","...n..."]
 ],
 heartOffset: {x:-8,y:11},
 poses: {
  idle: [[
   ".................aaaaaaaa................",
   ".............aaaabccccccbaaa.............",
   "...........aaccbcccccccccccbaa...........",
   ".........aacbbdcccbbbbbbbccccbaa.........",
   "........acbcccbcbbcccccccbbccccca........",
   ".......acccccccdcccccccccccbccccca.......",
   "......acccccbbddccccccccccccbccccca......",
   ".....acbcccbcccdcccccccccccccbcccbca.....",
   "....acceeebcccccbbbbbbbcccccccbeeecca....",
   "....aceffcfeeecbcccccccbbcceeefcffeca....",
   "...accfffcffffebeeeeeeeeebeffffcfffcca...",
   "...accffcffffffcffffffffffcfffffcffcca...",
   "..acceffcfffffcccffffffffffcffffcffecca..",
   "..acccefcffffcfffppbbfffffffcfffcfeccca..",
   "..accccbeeffcffpprrrrbppffffcffebecccca..",
   "..accccbccebeeprrrrrrrbrpffeebeccbcccca..",
   ".accbccbccbccprrrrrrrrrcrpeccbcccbccbcca.",
   ".accccbcccbcprrrrrrrrrrrcrpccbcccsbcccca.",
   ".accccbccbccprrrrrrrrrrrcrpccsbsssbcccca.",
   ".acccbcccbcprrrrrrrrrrrrcrpsssbssssbccca.",
   ".accdcccbccprrrrrrrrrrrrrcrpssbssssbccca.",
   ".accccccbcprrrrrrrrrrrrrrcrpsssbssssdcca.",
   ".acccccbccpttuvwrrrrrrrrrcvupssbssssscca.",
   ".acccccbcpxxxytuwrrrrrrrwucypsssbsssscca.",
   ".accccbccprrrrrrrrrrrrrrrrrcrpsssbssscca.",
   ".acccdccprrrrrrrrrrrrrrrrrrrbrpsssbsccca.",
   ".acccppprwzAzzwwrrrrrrrrrwwzzAzppssbccca.",
   ".accBwCCCCCCCCCCCCrrrrrCCCCCCCCCCCCwBcca.",
   ".accBwCCCDEEpaapDCCrrrCCDpaapEEDCCCwBcca.",
   ".accBwDCDcEEpaapEDCCCCCDEpaapEEcDCDwBcca.",
   ".accBwcCrAEEFGHFHrCIIICrHcHGFEEArCcwBcca.",
   ".abccBcCrwHHJKLJHrCrMrCrHJLKJHHwrCcBccba.",
   ".abccccDNwwHHJOHrrDrwrDrrHOJHHwwNDccccba.",
   "..apcccpDPPPPPwrrDrrrrrDrrwPPPPPDpcccpa..",
   "..apccspbDPPPPwrDrwrrrwrDrwPPPPDbpsccpa..",
   "..acdcsppbDDDDDDrrrzzzrrrDDDDDDbppscdca..",
   "..acdcsppbbQQPwrrrrrrrrrrrwPQQbbppscdca..",
   ".abccpssRpbpbBBBrrrrrrrrrBBBbpbpRsspccba.",
   ".accppcsRppbbaRRBBSvvvSBBRRabbppRscppcca.",
   "abccpbpsRppbbaRTwvvvvvvvwTRabbppRspbpccba",
   "assdbbpcsRbbbaBUrrwvvvwrrUBabbbRscpbbdssa",
   "assdbbdbcpbbbQrUrrrrrrrrrUrQbbbpcbdbbdssa",
   "accdbbdbcpcbaQraUUUUUUUUUarQabcpcbdbbdcca",
   "abcpbbdbbdcbQwrTVVVVVVVVVTrwQbcdbbdbbpcba",
   ".abbppbbbdcaQrrTVVVVVVVVVTrrQacdbbbppbba.",
   "..abbpbbdccaQwrTVVVVVVVVVTrwQaccdbbpbba..",
   "...apbbcdccQwwwTVVVVVVVVVTwwwQccdcbbpa...",
   "aaabcccpcccQwwTWVVVVVVVVVWTwwQcccpcccbaaa",
   ".accccpcccbQwwTVWWVVVVVVVVTwwQbcccpcccca.",
   "..aaapccccQwwwTVVVWWWVVVVVTwwwQccccpaaa..",
   ".....accccQwwwTVVVVVVVVVVVTwwwQcccca.....",
   ".....acccbQwwQwUUVVVVVVVUWwQwwQbccca.....",
   ".....abccQwwwXYYYUUVVVUUYYYXwwwQccba.....",
   "......accQwwwZ00000UUU00000ZwwwQcca......",
   "......assBwwvXYYYYYY0YYYYYYXvwwBssa......",
   "......assBwwwXYYYYYY0YYYYYYXwwwBssa......",
   ".....asspbBBBZ0YYY0ZZZ0YYY0ZBBBbpssa.....",
   "....assaabbbX0Y0YYYZRZYYY0Y0Xbbbaassa....",
   "........abbbXY01YYYXRXYYY10YXbbba........",
   ".........abbXYY0YYYXRXYYY0YYXbba.........",
   "..........acXYY0YYYXRXYYY0YYXca..........",
   "..........acZYY0YYYXRXYYY0YYZca..........",
   ".........acXY00YYYYXRXYYYY00YXca.........",
   "...........XYYYYYYYX.XYYYYYYYX...........",
   "...........XYYYYYYYX.XYYYYYYYX...........",
   "...........X111YYYYX.XYYYY111X...........",
   ".............Bw1111X.X1111wB.............",
   ".............2nnnnn2.2nnnnn2.............",
   ".............2kkkkn3.3nkkkk2.............",
   ".............2nk444424444kn2.............",
   ".............2nnkkkk2kkkknn2.............",
   "..............333333.333333.............."
  ]],
  blink: [[
   ".................aaaaaaaa................",
   ".............aaaabccccccbaaa.............",
   "...........aaccbcccccccccccbaa...........",
   ".........aacbbdcccbbbbbbbccccbaa.........",
   "........acbcccbcbbcccccccbbccccca........",
   ".......acccccccdcccccccccccbccccca.......",
   "......acccccbbddccccccccccccbccccca......",
   ".....acbcccbcccdcccccccccccccbcccbca.....",
   "....acceeebcccccbbbbbbbcccccccbeeecca....",
   "....aceffcfeeecbcccccccbbcceeefcffeca....",
   "...accfffcffffebeeeeeeeeebeffffcfffcca...",
   "...accffcffffffcffffffffffcfffffcffcca...",
   "..acceffcfffffcccffffffffffcffffcffecca..",
   "..acccefcffffcfffppbbfffffffcfffcfeccca..",
   "..accccbeeffcffpprrrrbppffffcffebecccca..",
   "..accccbccebeeprrrrrrrbrpffeebeccbcccca..",
   ".accbccbccbccprrrrrrrrrcrpeccbcccbccbcca.",
   ".accccbcccbcprrrrrrrrrrrcrpccbcccsbcccca.",
   ".accccbccbccprrrrrrrrrrrcrpccsbsssbcccca.",
   ".acccbcccbcprrrrrrrrrrrrcrpsssbssssbccca.",
   ".accdcccbccprrrrrrrrrrrrrcrpssbssssbccca.",
   ".accccccbcprrrrrrrrrrrrrrcrpsssbssssdcca.",
   ".acccccbccpttuvwrrrrrrrrrcvupssbssssscca.",
   ".acccccbcpxxxytuwrrrrrrrwucypsssbsssscca.",
   ".accccbccprrrrrrrrrrrrrrrrrcrpsssbssscca.",
   ".acccdccprrrrrrrrrrrrrrrrrrrbrpsssbsccca.",
   ".acccppprwzAzzwwrrrrrrrrrwwzzAzppssbccca.",
   ".accBwCCCCCCCCCCCCrrrrrCCCCCCCCCCCCwBcca.",
   ".accBwCCCDrrrrrrDCCrrrCCDrrrrrrDCCCwBcca.",
   ".accBwDCDcrrrrrrrDCCCCCDrrrrrrrcDCDwBcca.",
   ".accBwcCrArrrrrrrrCIIICrrrrrrrrArCcwBcca.",
   ".abccBcCrwpaaaaaprCrMrCrpaaaaapwrCcBccba.",
   ".abccccDNwrrrrrrrrDrwrDrrrrrrrrwNDccccba.",
   "..apcccpDPPPPPwrrDrrrrrDrrwPPPPPDpcccpa..",
   "..apccspbDPPPPwrDrwrrrwrDrwPPPPDbpsccpa..",
   "..acdcsppbDDDDDDrrrzzzrrrDDDDDDbppscdca..",
   "..acdcsppbbQQPwrrrrrrrrrrrwPQQbbppscdca..",
   ".abccpssRpbpbBBBrrrrrrrrrBBBbpbpRsspccba.",
   ".accppcsRppbbaRRBBSvvvSBBRRabbppRscppcca.",
   "abccpbpsRppbbaRTwvvvvvvvwTRabbppRspbpccba",
   "assdbbpcsRbbbaBUrrwvvvwrrUBabbbRscpbbdssa",
   "assdbbdbcpbbbQrUrrrrrrrrrUrQbbbpcbdbbdssa",
   "accdbbdbcpcbaQraUUUUUUUUUarQabcpcbdbbdcca",
   "abcpbbdbbdcbQwrTVVVVVVVVVTrwQbcdbbdbbpcba",
   ".abbppbbbdcaQrrTVVVVVVVVVTrrQacdbbbppbba.",
   "..abbpbbdccaQwrTVVVVVVVVVTrwQaccdbbpbba..",
   "...apbbcdccQwwwTVVVVVVVVVTwwwQccdcbbpa...",
   "aaabcccpcccQwwTWVVVVVVVVVWTwwQcccpcccbaaa",
   ".accccpcccbQwwTVWWVVVVVVVVTwwQbcccpcccca.",
   "..aaapccccQwwwTVVVWWWVVVVVTwwwQccccpaaa..",
   ".....accccQwwwTVVVVVVVVVVVTwwwQcccca.....",
   ".....acccbQwwQwUUVVVVVVVUWwQwwQbccca.....",
   ".....abccQwwwXYYYUUVVVUUYYYXwwwQccba.....",
   "......accQwwwZ00000UUU00000ZwwwQcca......",
   "......assBwwvXYYYYYY0YYYYYYXvwwBssa......",
   "......assBwwwXYYYYYY0YYYYYYXwwwBssa......",
   ".....asspbBBBZ0YYY0ZZZ0YYY0ZBBBbpssa.....",
   "....assaabbbX0Y0YYYZRZYYY0Y0Xbbbaassa....",
   "........abbbXY01YYYXRXYYY10YXbbba........",
   ".........abbXYY0YYYXRXYYY0YYXbba.........",
   "..........acXYY0YYYXRXYYY0YYXca..........",
   "..........acZYY0YYYXRXYYY0YYZca..........",
   ".........acXY00YYYYXRXYYYY00YXca.........",
   "...........XYYYYYYYX.XYYYYYYYX...........",
   "...........XYYYYYYYX.XYYYYYYYX...........",
   "...........X111YYYYX.XYYYY111X...........",
   ".............Bw1111X.X1111wB.............",
   ".............2nnnnn2.2nnnnn2.............",
   ".............2kkkkn3.3nkkkk2.............",
   ".............2nk444424444kn2.............",
   ".............2nnkkkk2kkkknn2.............",
   "..............333333.333333.............."
  ]]
 }
};

// <mld-character scale="6" blink heart></mld-character>
// Pixel art 100% CSS (box-shadow), sin opacidades. Requiere window.MLD_SPRITE (arriba).
class MldCharacter extends HTMLElement {
  static get observedAttributes() { return ['scale', 'blink', 'heart', 'pose']; }
  connectedCallback() {
    this.eyes = 'open'; this.hf = 0;
    this.root = this.attachShadow ? (this.shadowRoot || this.attachShadow({ mode: 'open' })) : this;
    this.render();
    this.hi = setInterval(() => { if (this.hasAttribute('heart')) { this.hf = (this.hf + 1) % 8; this.renderHeart(); } }, 110);
    this.scheduleBlink();
  }
  disconnectedCallback() { clearInterval(this.hi); clearTimeout(this.bt); }
  attributeChangedCallback() { if (this.root) this.render(); }
  get u() { return Math.max(1, parseInt(this.getAttribute('scale') || '6', 10)); }
  setEyes(v) { this.eyes = v; this.renderBody(); }
  scheduleBlink() {
    this.bt = setTimeout(() => {
      if (!this.hasAttribute('blink')) return this.scheduleBlink();
      const twice = Math.random() < 0.25;
      this.setEyes('closed');
      this.bt = setTimeout(() => {
        this.setEyes('open');
        if (twice) this.bt = setTimeout(() => { this.setEyes('closed'); this.bt = setTimeout(() => { this.setEyes('open'); this.scheduleBlink(); }, 130); }, 160);
        else this.scheduleBlink();
      }, 140);
    }, 2200 + Math.random() * 2200);
  }
  shadow(rows) {
    const S = window.MLD_SPRITE, u = this.u, out = [];
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') out.push((x + 1) * u + 'px ' + y * u + 'px 0 0 ' + S.palette[r[x]]); });
    return out.join(',');
  }
  layer(rows, left, top) {
    const u = this.u, w = document.createElement('div'), p = document.createElement('div');
    w.style.cssText = 'position:absolute;left:' + left + 'px;top:' + top + 'px;width:' + rows[0].length * u + 'px;height:' + rows.length * u + 'px';
    p.style.cssText = 'position:absolute;left:' + -u + 'px;top:0;width:' + u + 'px;height:' + u + 'px;box-shadow:' + this.shadow(rows);
    w.appendChild(p); return w;
  }
  bodyRows() {
    const P = window.MLD_SPRITE.poses, pose = P[this.getAttribute('pose')] ? this.getAttribute('pose') : 'idle';
    return (pose === 'idle' && this.eyes === 'closed' ? P.blink : P[pose])[0];
  }
  render() {
    const S = window.MLD_SPRITE, u = this.u, body = this.bodyRows(), gx = -S.heartOffset.x;
    this.root.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = 'position:relative;display:inline-block;width:' + (body[0].length + gx) * u + 'px;height:' + body.length * u + 'px';
    this.heartEl = this.hasAttribute('heart') ? this.layer(S.heart[this.hf], 0, S.heartOffset.y * u) : null;
    this.bodyEl = this.layer(body, gx * u, 0);
    if (this.heartEl) box.appendChild(this.heartEl);
    box.appendChild(this.bodyEl);
    this.root.appendChild(box);
  }
  renderBody() { if (this.bodyEl) this.bodyEl.firstChild.style.boxShadow = this.shadow(this.bodyRows()); }
  renderHeart() { if (this.heartEl) this.heartEl.firstChild.style.boxShadow = this.shadow(window.MLD_SPRITE.heart[this.hf]); }
}
customElements.define('mld-character', MldCharacter);
