const hsv2hsl = (e, o, t, r = t - (t * o) / 2, n = Math.min(r, 1 - r)) => [
    e,
    n ? (t - r) / n : 0,
    r,
  ],
  random = (e, o) => (o || ((o = e), (e = 0)), Math.random() * (o - e) + e),
  pointOnCurve = (e, o, t, r, n = [0, 0], h = [1, 1]) => {
    const V = Math.PI / 2,
      p = V / t;
    let s = 0,
      a = 0;
    if (e === 'lam\xE9') {
      const m = (o / t) * V,
        b = 2 / (2 + 20 * r),
        u = Math.cos(m),
        M = Math.sin(m);
      (s = Math.sign(u) * Math.abs(u) ** b),
        (a = Math.sign(M) * Math.abs(M) ** b);
    } else
      e === 'arc'
        ? ((a = Math.cos(-Math.PI / 2 + o * p + r)),
          (s = Math.sin(Math.PI / 2 + o * p - r)))
        : e === 'pow'
        ? ((s = Math.pow(1 - o / t, 1 - r)), (a = Math.pow(o / t, 1 - r)))
        : e === 'powY'
        ? ((s = Math.pow(1 - o / t, r)), (a = Math.pow(o / t, 1 - r)))
        : e === 'powX' &&
          ((s = Math.pow(o / t, r)), (a = Math.pow(o / t, 1 - r)));
    return (
      (s = n[0] + Math.min(Math.max(s, 0), 1) * (h[0] - n[0])),
      (a = n[1] + Math.min(Math.max(a, 0), 1) * (h[1] - n[1])),
      [s, a]
    );
  };

module.exports = function I({
  total: e = 3,
  centerHue: o = 0,
  hueCycle: t = 0.3,
  offsetTint: r = 0.1,
  offsetShade: n = 0.1,
  curveAccent: h = 0,
  tintShadeHueShift: V = 0.1,
  curveMethod: p = 'arc',
  offsetCurveModTint: s = 0.03,
  offsetCurveModShade: a = 0.03,
  minSaturationLight: m = [0, 0],
  maxSaturationLight: b = [1, 1],
} = {}) {
  const u = [],
    M = [],
    d = [];
  for (let l = 1; l < e + 1; l++) {
    const [c, x] = pointOnCurve(p, l, e + 1, h, m, b),
      f = (360 + (-180 * t + (o + l * (360 / (e + 1)) * t))) % 360,
      y = hsv2hsl(f, c, x);
    u.push(y);
    const [g, i] = pointOnCurve(p, l, e + 1, h + s, m, b),
      w = hsv2hsl(f, g, i);
    M.push([(f + 360 * V) % 360, w[1] - r, w[2] + r]);
    const [R, k] = pointOnCurve(p, l, e + 1, h - a, m, b),
      C = hsv2hsl(f, R, k);
    d.push([(360 + (f - 360 * V)) % 360, C[1] - n, C[2] - n]);
  }
  return { light: M, dark: d, base: u, all: [...M, ...u, ...d] };
};
