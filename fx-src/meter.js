// 計測用(M-2): 100ms ごとに K特性の平均二乗などを postMessage するだけ。音は出さない(出力は無音)。
// 計算の基準は www/js/loud.js の SD.LOUD.Front(同じ式。test/fxw-meter.js が一致を検査)。ゲート・窓・VU・判定は loud.js 側。
// 送るもの: {kl,kr,km,ll,rr,lr,sp,tp}=K特性後の L/R/(L+R)/2 の平均二乗・生の L²/R²/L·R の平均・サンプルピーク・トゥルーピーク(4倍オーバーサンプルの近似)
// 受け取るもの: {reset:true}=区間とフィルターの状態を捨てて頭から数え直す
class MeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    const fs = sampleRate;
    this.N = Math.round(fs * 0.1);
    const G = 3.999843853973347, Q1 = 0.7071752369554196, f1 = 1681.9744509555319, Q2 = 0.5003270373253953, f2 = 38.13547087613982;
    const K = Math.tan(Math.PI * f1 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.499666774155), a0 = 1 + K / Q1 + K * K;
    this.sh = [(Vh + Vb * K / Q1 + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q1 + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q1 + K * K) / a0];
    const k2 = Math.tan(Math.PI * f2 / fs), c0 = 1 + k2 / Q2 + k2 * k2;
    this.hp = [1, -2, 1, 2 * (k2 * k2 - 1) / c0, (1 - k2 / Q2 + k2 * k2) / c0];
    this.H = new Float64Array(49);
    for (let i = 0; i < 49; i++) { const x = (i - 24) / 4, w = 0.5 + 0.5 * Math.cos(Math.PI * (i - 24) / 25); this.H[i] = (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * w; }
    this.reset();
    this.port.onmessage = (e) => { if (e && e.data && e.data.reset) this.reset(); };
  }
  reset() {
    this.f = [new Float64Array(8), new Float64Array(8), new Float64Array(8)];
    this.th = [new Float64Array(13), new Float64Array(13)];
    this.ti = 0; this.n = 0;
    this.kl = 0; this.kr = 0; this.km = 0; this.ll = 0; this.rr = 0; this.lr = 0; this.sp = 0; this.tp = 0;
  }
  // K特性(2段)。s=[shelf x1,x2,y1,y2, hp x1,x2,y1,y2]
  k(s, x) {
    const c = this.sh, d = this.hp;
    let y = c[0] * x + c[1] * s[0] + c[2] * s[1] - c[3] * s[2] - c[4] * s[3];
    s[1] = s[0]; s[0] = x; s[3] = s[2]; s[2] = y;
    const z = d[0] * y + d[1] * s[4] + d[2] * s[5] - d[3] * s[6] - d[4] * s[7];
    s[5] = s[4]; s[4] = y; s[7] = s[6]; s[6] = z;
    return z;
  }
  // トゥルーピーク(近似): 履歴 h(13)に x を入れ、4位相の絶対値の最大を返す
  tpush(h, x) {
    h[this.ti] = x;
    const H = this.H; let m = 0;
    for (let p = 0; p < 4; p++) {
      let a = 0;
      for (let k = 0; k < 13; k++) { const v = 4 * k + p; if (v < 49) a += H[v] * h[(this.ti + k) % 13]; }
      a = a < 0 ? -a : a; if (a > m) m = a;
    }
    return m;
  }
  process(inputs, outputs) {
    const input = inputs[0], output = outputs[0];
    let frames = 128;
    if (output && output.length) { frames = output[0].length; for (let c = 0; c < output.length; c++) output[c].fill(0); }
    const A = input && input.length ? input[0] : null, B = input && input.length > 1 ? input[1] : A;
    for (let i = 0; i < frames; i++) {
      let x = A ? A[i] : 0, y = B ? B[i] : 0;
      if (!(x === x)) x = 0; if (!(y === y)) y = 0;
      const u = this.k(this.f[0], x), v = this.k(this.f[1], y), t = this.k(this.f[2], (x + y) * 0.5);
      this.kl += u * u; this.kr += v * v; this.km += t * t; this.ll += x * x; this.rr += y * y; this.lr += x * y;
      let q = Math.max(x < 0 ? -x : x, y < 0 ? -y : y); if (q > this.sp) this.sp = q;
      this.ti = (this.ti + 12) % 13;
      q = Math.max(this.tpush(this.th[0], x), this.tpush(this.th[1], y)); if (q > this.tp) this.tp = q;
      if (++this.n === this.N) {
        const N = this.N;
        this.port.postMessage({ kl: this.kl / N, kr: this.kr / N, km: this.km / N, ll: this.ll / N, rr: this.rr / N, lr: this.lr / N, sp: this.sp, tp: this.tp });
        this.n = 0; this.kl = 0; this.kr = 0; this.km = 0; this.ll = 0; this.rr = 0; this.lr = 0; this.sp = 0; this.tp = 0;
      }
    }
    return true;
  }
}
registerProcessor('sd-meter', MeterProcessor);
