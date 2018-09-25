const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const { randomNumber, range } = require('../math');
const Tree = require('./tree');

const DEPTH = 6;

const settings = {
  animate: true,
  duration: DEPTH + 2,
  dimensions: [800, 600],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 1,
};

let steps;
let clrs;

// Each vertex a/b has two children:
// (a+b)/b and a/(a+b)
function fractions([a, b]) {
  return [[a, a + b], [a + b, b]];
}

function drawCalkinWilf(context) {
  return function calkinWilf([w, h], [a, b], direction, [x, y], [f, l], d) {
    steps[d].push(() => {
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
    });

    if (d < DEPTH) {
      const [nA, nB] = fractions([a, b]);
      const nDirection = direction === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
      const nDimensions = [w * 0.667, h * 0.667];
      const nF = f * 0.8;
      const nL = l - d * 0.1;
      const nD = d + 1;

      if (direction === 'HORIZONTAL') {
        calkinWilf(nDimensions, nA, nDirection, [x - w, y], [nF, nL], nD);
        calkinWilf(nDimensions, nB, nDirection, [x + w, y], [nF, nL], nD);
      } else {
        calkinWilf(nDimensions, nA, nDirection, [x, y - h], [nF, nL], nD);
        calkinWilf(nDimensions, nB, nDirection, [x, y + h], [nF, nL], nD);
      }
    }
  };
}

canvasSketch(() => {
  return {
    render({ context, frame, width, height, playhead, time }) {
      const activeStep = Math.floor(time) - 1;

      clrs = palette();
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.strokeStyle = clrs[0];

      steps[activeStep] &&
        steps[activeStep].forEach(node => {
          node();
        });
    },
    begin({ context, width, height }) {
      clrs = palette();
      steps = range(DEPTH + 1).reduce(
        (acc, idx) => ({ ...acc, [idx]: [] }),
        {},
      );

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#111322';
      context.fillRect(0, 0, width, height);

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

  context.beginPath();
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

function palette() {
  // prettier-ignore
  return chroma
    .cubehelix()
    .start(randomNumber(0, 360))
    .rotations(-0.35)
    .gamma(0.7)
    .lightness([0.4, 0.8])
  .scale()
    .correctLightness()
    .colors(DEPTH + 2);
}
