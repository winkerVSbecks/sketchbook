const canvasSketch = require('canvas-sketch');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 1,
  scaleToView: true,
  // fps: 60,
};

// const clrs = {
//   bg: '#222',
// };

const background = clrs.ink();
const foreground = clrs.bg;

const sketch = () => {
  const w = 260;
  const h = 160;
  return {
    begin() {},
    render({ context, width, height, playhead }) {
      context.fillStyle = background;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      context.translate(width / 2, height / 2 - h / 2);
      drawWave(context, w, h, playhead);
    },
  };
};

canvasSketch(sketch, settings);

var m = 0.512286623256592433;

function drawWave(context, w, h, playhead) {
  const a = h / 4;
  const y = h / 2;

  const steps = 7;
  const shift = 2;

  // prettier-ignore
  const start = [
    'M', -steps/2 * a - shift * a * playhead, y + a / 2,
    'c', a * m, 0, -(1 - a) * m, -a, a, -a,
  ]

  // prettier-ignore
  const pathData = [
    ...start,
    ...new Array(steps).fill().map(() => [
      's', -(1 - a) * m, a, a, a,
      's', -(1 - a) * m, -a, a, -a,
    ]).flat(),
  ].join(' ');

  var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', start.join(' '));
  const length = pathEl.getTotalLength();

  context.strokeStyle = foreground;
  context.lineWidth = 12;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash([length * steps, length * shift, 0, length * steps]);
  context.lineDashOffset = -shift * length * playhead;
  const path = new Path2D(pathData);
  context.stroke(path);

  // context.setLineDash([0, 0]);
  // context.beginPath();
  // context.moveTo(-w / 2, 0);
  // context.lineTo(w / 2, 0);
  // context.lineTo(w / 2, h);
  // context.lineTo(-w / 2, h);
  // context.closePath();
  // context.stroke();

  context.fillStyle = background;
  context.beginPath();
  context.moveTo(w * 0.7, 0);
  context.lineTo(w * 3, 0);
  context.lineTo(w * 3, h);
  context.lineTo(w * 0.7, h);
  context.closePath();
  context.fill();
}
