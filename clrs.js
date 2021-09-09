const Random = require('canvas-sketch-util/random');
const { clamp } = require('canvas-sketch-util/math');
const Color = require('canvas-sketch-util/color');
const risoColors = require('riso-colors').map((h) => h.hex);
const paperColors = require('paper-colors').map((h) => h.hex);
const hsluv = require('hsluv');

const some = ['#3333ff', '#fc7f95', '#fbfc6e', '#55f9fc', '#fefefc'];

function fillHsluv(h, s, l) {
  const rgb = hsluv.hsluvToRgb([h, s, l]);
  return `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;
}

function spectrum() {
  return [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  ].map((i) => fillHsluv(i * 25, 100, 50));
  // return [0, 1, 2, 3, 4, 5].map((i) => fillHsluv(i * 25, 100, 50));
}

function hueCycle(hueStart, t, sat = 0.75, light = 0.5) {
  const hue = (t + hueStart) % 1;
  const hsl = [
    Math.floor(hue * 360),
    `${Math.floor(100 * sat)}%`,
    `${Math.floor(100 * light)}%`,
  ].join(', ');

  return `hsl(${hsl})`;
}

const pigments = [
  ['#5FBD7D', '#1172C8'],
  ['#335136', '#99c478'],
  ['#4d4277', '#ee1a5c'],
  ['#3655F9', '#FFE9D3'],
  ['#7B5CB1', '#10DEB5'],
  ['#DC5757', '#FFA987'],
  ['#FFCA3E', '#F4DAB5'],
  ['#FE5F49', '#F4BF1B'],
  ['#13C0EF', '#FFC327'],
  ['#537881', '#E6C79C'],
  ['#263ED7', '#CEBEAC'],
  ['#EC1F5A', '#6A2760'],
];

const pastel = [
  '#ffe2e2',
  '#99ddcc',
  '#5ba19b',
  '#f3d179',
  '#fff1c1',
  '#808b97',
  '#a9eca2',
  '#6c5b7c',
  '#d7acd4',
  '#ea8a8a',
  '#8a79af',
  '#d38cad',
  '#eaafaf',
  '#f46060',
  '#f3d179',
];

const ellsworthKelly = ['#f13401', '#0769ce', '#f1d93c', '#11804b'];

const warm = [
  '#7c203a',
  '#f85959',
  '#ff9f68',
  '#feff89',
  '#f8b195',
  '#f67280',
  '#c06c84',
  '#355c7d',
  '#6c567b',
];

const bilbao = [
  '#FAD5DC',
  '#05323D',
  '#F6C4B1',
  '#D4DB6E',
  '#EB7574',
  '#55B867',
  '#D7C84A',
  '#33B2A2',
  '#CD202F',
];

function clrs(minContrast = 3) {
  const background = Random.pick(paperColors);

  const inkColors = risoColors
    .filter((color) => Color.contrastRatio(background, color) >= minContrast)
    .filter((c) => c !== '#000000');

  const ink = () => Random.pick(inkColors);

  return {
    bg: background,
    paper: () => Random.pick(paperColors),
    ink,
    inkColors,
  };
}

/**
 * A set of color utilities: contrast, OKLAB, hex, RGB, etc.
 *
 * Reference:
 * https://github.com/mattdesl/canvas-sketch-util/blob/master/math.js
 * https://github.com/nschloe/colorio
 */
// red, green, and blue coefficients
var rc = 0.2126;
var gc = 0.7152;
var bc = 0.0722;
// low-gamma adjust coefficient
var lowc = 1 / 12.92;

const adjustGamma = (a) => Math.pow((a + 0.055) / 1.055, 2.4);

export const luma = (n, a = ~~((n / 100) * 255)) => rgbToHex([a, a, a]);

export const blend = (c0, c1, opacity) => {
  c0 = hexToRGB(c0);
  c1 = hexToRGB(c1);
  for (var i = 0; i < 3; i++) {
    c1[i] = c1[i] * opacity + c0[i] * (1 - opacity);
  }
  return rgbToHex(c1);
};

export const relativeLuminance = (rgb) => {
  if (typeof rgb == 'string') rgb = hexToRGB(rgb);
  var rsrgb = rgb[0] / 255;
  var gsrgb = rgb[1] / 255;
  var bsrgb = rgb[2] / 255;
  var r = rsrgb <= 0.03928 ? rsrgb * lowc : adjustGamma(rsrgb);
  var g = gsrgb <= 0.03928 ? gsrgb * lowc : adjustGamma(gsrgb);
  var b = bsrgb <= 0.03928 ? bsrgb * lowc : adjustGamma(bsrgb);
  return r * rc + g * gc + b * bc;
};

// // Extracted from @tmcw / wcag-contrast
// // https://github.com/tmcw/wcag-contrast
export const contrastRatio = (colorA, colorB) => {
  var a = relativeLuminance(colorA);
  var b = relativeLuminance(colorB);
  var l1 = Math.max(a, b);
  var l2 = Math.min(a, b);
  return (l1 + 0.05) / (l2 + 0.05);
};

export const hexToRGB = (str) => {
  var hex = str.replace('#', '');
  // NOTE: This can be removed for brevity if you stick with 6-character codes
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  var num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

export function rgbToHex(rgb) {
  var r = clamp(~~rgb[0], 0, 255);
  var g = clamp(~~rgb[1], 0, 255);
  var b = clamp(~~rgb[2], 0, 255);
  return '#' + (b | (g << 8) | (r << 16) | (1 << 24)).toString(16).slice(1);
}

const gammaToLinear = (c) =>
  c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const linearToGamma = (c) =>
  c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;

export function oklabToRGB([l, a, b]) {
  let L = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  let M = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  let S = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    clamp(
      ~~(
        255 *
        linearToGamma(+4.0767245293 * L - 3.3072168827 * M + 0.2307590544 * S)
      ),
      0,
      255
    ),
    clamp(
      ~~(
        255 *
        linearToGamma(-1.2681437731 * L + 2.6093323231 * M - 0.341134429 * S)
      ),
      0,
      255
    ),
    clamp(
      ~~(
        255 *
        linearToGamma(-0.0041119885 * L - 0.7034763098 * M + 1.7068625689 * S)
      ),
      0,
      255
    ),
  ];
}

export const rgbToOklab = (rgb) => {
  if (typeof rgb === 'string') rgb = hexToRGB(rgb);
  let [r, g, b] = rgb;
  r = gammaToLinear(r / 255);
  g = gammaToLinear(g / 255);
  b = gammaToLinear(b / 255);
  let L = Math.cbrt(0.412165612 * r + 0.536275208 * g + 0.0514575653 * b);
  let M = Math.cbrt(0.211859107 * r + 0.6807189584 * g + 0.107406579 * b);
  let S = Math.cbrt(0.0883097947 * r + 0.2818474174 * g + 0.6302613616 * b);
  return [
    0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S,
  ];
};

export function Lch(L, c, h) {
  const a = (h / 180) * Math.PI;
  c /= 100;
  L /= 100;
  return rgbToHex(
    oklabToRGB([L, c ? c * Math.cos(a) : 0, c ? c * Math.sin(a) : 0])
  );
}

const normalizeHue = (hue) => ((hue = hue % 360) < 0 ? hue + 360 : hue);

export const LabToLch = ([l, a, b]) => {
  let c = Math.sqrt(a * a + b * b);
  let res = [l, c, c ? normalizeHue((Math.atan2(b, a) * 180) / Math.PI) : 0];
  res[0] *= 100;
  res[1] *= 100;
  return res;
};

export const getBestColors = (
  colors,
  others,
  min = 1,
  thresholds = [3, 2.5, 2]
) => {
  for (let i = 0; i < thresholds.length; i++) {
    const best = colors.filter((c) =>
      others.every((b) => contrastRatio(c, b) >= thresholds[i])
    );
    if (best.length >= min) return best;
  }
};

module.exports = {
  some,
  hueCycle,
  pigments,
  spectrum,
  pastel,
  ellsworthKelly,
  warm,
  bilbao,
  clrs,
  luma,
  blend,
  relativeLuminance,
  contrastRatio,
  hexToRGB,
  rgbToHex,
  oklabToRGB,
  rgbToOklab,
  Lch,
  LabToLch,
  getBestColors,
};
