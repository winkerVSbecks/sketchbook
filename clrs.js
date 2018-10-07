const hsluv = require('hsluv');

const clrs = ['#3333ff', '#fc7f95', '#fbfc6e', '#55f9fc', '#fefefc'];

// function fillHsluv(h, s, l) {
//   const rgb = hsluv.hsluvToRgb([h, s, l]);
//   return `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;
// }

// const spectrum = [0, 1, 2, 3, 4, 5].map(i => fillHsluv(i * 25, 100, 50));
// console.clear();
// spectrum.map(c => {
//   console.log('%c █', `color: ${c}`);
// });

function hueCycle(hueStart, t) {
  const hue = (t + hueStart) % 1;
  const sat = 0.75;
  const light = 0.5;
  const hsl = [
    Math.floor(hue * 360),
    `${Math.floor(100 * sat)}%`,
    `${Math.floor(100 * light)}%`,
  ].join(', ');

  return `hsl(${hsl})`;
}

module.exports = {
  hueCycle,
};
