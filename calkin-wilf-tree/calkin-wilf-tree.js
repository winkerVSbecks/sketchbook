const canvasSketch = require('canvas-sketch');
const Tree = require('./tree');

const settings = {
  animate: true,
  duration: 4,
  dimensions: [800, 600],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

// Each vertex a/b has two children: (a+b)/b and a/(a+b).
function fractions([a, b]) {
  return [[a, a + b], [a + b, b]];
}

function drawCalkinWilf(context) {
  return function calkinWilf([w, h], [a, b], direction, [x, y], [f, l]) {
    context.font = `${f}px monospace`;
    context.fillText(`${a}/${b}`, x, y);

    if (h > 18) {
      const [U, V] = fractions([a, b]);
      const nDirection = direction === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
      const nDimensions = [w * 0.667, h * 0.667];
      const nF = f * 0.8;
      const nL = l - 0.2;

      setTimeout(() => {
        if (direction === 'HORIZONTAL') {
          // Left
          calkinWilf(nDimensions, U, nDirection, [x - w, y], [nF, nL]);
          drawLine('LEFT', context, [x, y], [w, h], [f, l]);
          // Right
          calkinWilf(nDimensions, V, nDirection, [x + w, y], [nF, nL]);
          drawLine('RIGHT', context, [x, y], [w, h], [f, l]);
        } else {
          // Top
          calkinWilf(nDimensions, U, nDirection, [x, y - h], [nF, nL]);
          drawLine('TOP', context, [x, y], [w, h], [f, l]);
          // Bottom
          calkinWilf(nDimensions, V, nDirection, [x, y + h], [nF, nL]);
          drawLine('BOTTOM', context, [x, y], [w, h], [f, l]);
        }
      }, 500);
    }
  };
}

canvasSketch(() => {
  console.clear();

  return {
    render({ context, frame, width, height, playhead }) {},
    begin({ context, width, height }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);

      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#fff';
      context.strokeStyle = '#fff';

      drawCalkinWilf(context)(
        [width / 4, height / 4],
        [1, 1],
        'HORIZONTAL',
        [width / 2, height / 2],
        [36, 2],
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
