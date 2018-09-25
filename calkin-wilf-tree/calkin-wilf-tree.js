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
  .lightness([0.5, 1])
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
    context.fillStyle = clrs[d];
    context.font = `${f}px monospace`;
    context.fillText(`${a}/${b}`, x, y);

    if (d < 6) {
      const [U, V] = fractions([a, b]);
      const nDirection = direction === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
      const nDimensions = [w * 0.667, h * 0.667];
      const nF = f * 0.8;
      const nL = l; // - 0.1;
      const nD = d + 1;

      if (direction === 'HORIZONTAL') {
        drawLine('LEFT', context, [x, y], [w, h], [f, l]);
        drawLine('RIGHT', context, [x, y], [w, h], [f, l]);
        calkinWilf(nDimensions, U, nDirection, [x - w, y], [nF, nL], nD);
        calkinWilf(nDimensions, V, nDirection, [x + w, y], [nF, nL], nD);
      } else {
        drawLine('TOP', context, [x, y], [w, h], [f, l]);
        drawLine('BOTTOM', context, [x, y], [w, h], [f, l]);
        calkinWilf(nDimensions, U, nDirection, [x, y - h], [nF, nL], nD);
        calkinWilf(nDimensions, V, nDirection, [x, y + h], [nF, nL], nD);
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
      // context.fillStyle = '#fff';
      context.strokeStyle = clrs[0]; //'#56a9fd';

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
  context.lineWidth = l;

  if (direction === 'LEFT') {
    context.moveTo(x - f, y);
    context.lineTo(x - w + f, y);
  } else if (direction === 'RIGHT') {
    context.moveTo(x + f, y);
    context.lineTo(x + w - f, y);
  } else if (direction === 'TOP') {
    context.moveTo(x, y - f / 2);
    context.lineTo(x, y - h + f / 2);
  } else {
    context.moveTo(x, y + f / 2);
    context.lineTo(x, y + h - f / 2);
  }

  context.stroke();
}
