const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const { randomNumber } = require('../math');
const Tree = require('./tree');

const settings = {
  animate: true,
  duration: 20,
  dimensions: [800, 600],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

const clrs = chroma
  .cubehelix()
  .start(randomNumber(0, 360))
  .rotations(-0.35)
  .gamma(0.7)
  .lightness([0.4, 0.8])
  .scale()
  .correctLightness()
  .colors(8);

// Each vertex a/b has two children:
// (a+b)/b and a/(a+b)
function fractions([a, b]) {
  return [[a, a + b], [a + b, b]];
}

function drawCalkinWilf(context) {
  return function calkinWilf([w, h], [a, b], direction, [x, y], [f, l], d) {
    // Draw Fraction
    context.fillStyle = clrs[d];
    context.font = `${f}px monospace`;
    context.fillText(`${a}/${b}`, x, y);
    // Draw Branches
    if (direction === 'HORIZONTAL') {
      drawLine('LEFT', context, [x, y], [w, h], [f, l]);
      drawLine('RIGHT', context, [x, y], [w, h], [f, l]);
    } else {
      drawLine('TOP', context, [x, y], [w, h], [f, l]);
      drawLine('BOTTOM', context, [x, y], [w, h], [f, l]);
    }

    if (d < 6) {
      const [A, B] = fractions([a, b]);
      const nDirection = direction === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
      const nDimensions = [w * 0.667, h * 0.667];
      const nF = f * 0.8;
      const nL = l - d * 0.1;
      const nD = d + 1;

      if (direction === 'HORIZONTAL') {
        calkinWilf(nDimensions, A, nDirection, [x - w, y], [nF, nL], nD);
        calkinWilf(nDimensions, B, nDirection, [x + w, y], [nF, nL], nD);
      } else {
        calkinWilf(nDimensions, A, nDirection, [x, y - h], [nF, nL], nD);
        calkinWilf(nDimensions, B, nDirection, [x, y + h], [nF, nL], nD);
      }
    }
  };
}

canvasSketch(() => {
  console.clear();

  return {
    render({ context, frame, width, height, playhead }) {},
    begin({ context, width, height }) {
      steps = [];
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#111322';
      context.fillRect(0, 0, width, height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.strokeStyle = clrs[0];

      drawCalkinWilf(context)(
        [width / 4, (height * 1.5) / 4],
        [1, 1],
        'HORIZONTAL',
        [width / 2, height / 2],
        [36, 1],
        0,
      );
    },
  };
}, settings);

function drawLine(direction, context, [x, y], [w, h], [f, l]) {
  const xPad = f * 1.25;
  const yPad = f * 0.75;

  if (direction === 'LEFT') {
    context.moveTo(x - xPad, y);
    context.lineTo(x - w + xPad, y);
  } else if (direction === 'RIGHT') {
    context.moveTo(x + xPad, y);
    context.lineTo(x + w - xPad, y);
  } else if (direction === 'TOP') {
    context.moveTo(x, y - yPad);
    context.lineTo(x, y - h + yPad);
  } else {
    context.moveTo(x, y + yPad);
    context.lineTo(x, y + h - yPad);
  }

  context.lineWidth = l;
  context.stroke();
}
