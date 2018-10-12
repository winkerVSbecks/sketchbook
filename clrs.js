const hsluv = require('hsluv');

const clrs = ['#3333ff', '#fc7f95', '#fbfc6e', '#55f9fc', '#fefefc'];

function fillHsluv(h, s, l) {
  const rgb = hsluv.hsluvToRgb([h, s, l]);
  return `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;
}

function spectrum() {
  return [0, 1, 2, 3, 4, 5].map(i => fillHsluv(i * 25, 100, 50));
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

module.exports = {
  hueCycle,
  pigments,
  spectrum,
};
