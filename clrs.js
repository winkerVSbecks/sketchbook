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
