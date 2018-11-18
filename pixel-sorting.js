const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const R = require('ramda');
const load = require('load-asset');

const settings = {
  pixelated: true,
  dimensions: [128, 128],
  animate: false,
};

const sketch = async ({ update }) => {
  const image = await load('path-to-img');

  update({
    dimensions: [image.width, image.height],
  });

  return ({ context, width, height }) => {
    console.clear();

    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    let data = pixels.data;

    const byWeightedHsl = compareByHsl({ h: 2, l: 4, s: 0 });

    R.compose(
      R.addIndex(R.forEach)((x, idx) => {
        data[idx] = x;
      }),
      R.flatten,
      R.sort(byWeightedHsl),
      R.splitEvery(4),
    )(data);

    context.putImageData(pixels, 0, 0);
  };
};

canvasSketch(sketch, settings);

function compareByHsl(weights) {
  (a, b) => {
    const hslA = hsl(a);
    const hslB = hsl(b);
    const vA = weights.h * hslA.h + weights.s * hslA.l + weights.s * hslA.s;
    const vB = weights.h * hslB.h + weights.s * hslB.l + weights.s * hslB.s;
    return vB - vA;
  };
}

/**
 * RGB to hSL
 * from p5.js
 * https://github.com/processing/p5.js/blob/master/src/color/color_conversion.js
 */
function hsl([r, g, b]) {
  const val = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const li = val + min;
  const chroma = val - min;

  let hue, sat;
  if (chroma === 0) {
    hue = 0;
    sat = 0;
  } else {
    if (li < 1) {
      sat = chroma / li;
    } else {
      sat = chroma / (2 - li);
    }
    if (r === val) {
      // Magenta to yellow.
      hue = (g - b) / chroma;
    } else if (g === val) {
      // Yellow to cyan.
      hue = 2 + (b - r) / chroma;
    } else if (b === val) {
      // Cyan to magenta.
      hue = 4 + (r - g) / chroma;
    }
    if (hue < 0) {
      // Confine hue to the interval [0, 1).
      hue += 6;
    } else if (hue >= 6) {
      hue -= 6;
    }
  }

  return { h: hue / 6, s: sat, l: li / 2 };
}
