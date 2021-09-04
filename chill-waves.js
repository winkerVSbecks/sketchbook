const canvasSketch = require('canvas-sketch');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 1,
};

const background = '#F5EEEB';
const foreground = clrs.bg;

const sketch = () => {
  const w = 1080;
  const h = 1080 / 8; //160;

  const colors = [
    '#1C45CB',
    '#377B44',
    '#EBA1C1',
    '#F2C945',
    '#EA332D',
    '#1C45CB',
    '#377B44',
    '#EBA1C1',
    '#F2C945',
    '#EA332D',
    '#1C45CB',
    '#377B44',
    '#EBA1C1',
    '#F2C945',
    '#EA332D',
  ];

  return {
    begin() {},
    render({ context, width, height, playhead }) {
      context.fillStyle = background;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      for (let index = 0; index < 15; index++) {
        context.resetTransform();
        context.translate(0, h / 8 + (index * h) / 2);
        drawWave(context, w, h, playhead, colors[index]);
      }
    },
  };
};

canvasSketch(sketch, settings);

var m = 0.512286623256592433;

function drawWave(context, w, h, playhead, color) {
  const a = h / 4;
  const y = h / 2;

  const steps = 30;
  const shift = 2;

  // prettier-ignore
  const start = [
    'M', a - shift * a * playhead, y,
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

  context.strokeStyle = color;
  context.lineWidth = 12;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash([length * steps, length * shift, 0, length * steps]);
  context.lineDashOffset = -shift * length * playhead;
  const path = new Path2D(pathData);
  context.stroke(path);
}
