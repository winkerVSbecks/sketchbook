const hsluv = require('hsluv');

const some = ['#3333ff', '#fc7f95', '#fbfc6e', '#55f9fc', '#fefefc'];

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

module.exports = {
  some,
  hueCycle,
  pigments,
  spectrum,
  pastel,
  ellsworthKelly,
  warm,
  bilbao,
};
