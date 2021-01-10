const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, linspace } = require('canvas-sketch-util/math');
const { quintInOut, backInOut, quintIn } = require('eases');
const ticker = require('tween-ticker')({ defaultEase: quintInOut });
const Tween = require('tween-chain');
const chroma = require('chroma-js');
const { rectGrid } = require('./grid');
const { range } = require('./math');
const { drawShape, drawEqTriangle, trianglePts } = require('./geometry');

const CONFIGS = {
  roundedShapes: {
    n1: 40,
    n2: 10,
    n3: 10,
    m: 0,
    a: 1,
    b: 1,
    range: [...range(16), ...range(16).reverse()],
    duration: 3,
  },
  loops: {
    n1: 0.2,
    n2: 1.7,
    n3: 1.7,
    m: 0,
    a: 1,
    b: 1,
    range: range(12),
    duration: 1,
    angle: Math.PI * 12,
  },
  bigBang: {
    n1: 0.3,
    n2: 0.3,
    n3: 0.3,
    m: 0,
    a: 1,
    b: 1,
    range: range(24).filter((x) => x % 2 === 0),
    duration: 1.4,
    angle: Math.PI * 2,
  },
};

const params = CONFIGS.bigBang;

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: params.duration,
  scaleToView: true,
};

let osc = 0;

const sketch = () => {
  let pts = [];
  let polylines = [];
  console.clear();

  return {
    begin({ context, width, height }) {
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.lineJoin = 'bevel';

      const radius = width / 3;
      const total = 500;

      polylines = linspace(total, true)
        .map((x) => params.angle * x)
        .map((angle) => {
          let polyline = [];

          params.range.forEach((i) => {
            params.m = i;
            const r = supershape(params, angle);
            const x = radius * r * Math.cos(angle);
            const y = radius * r * Math.sin(angle);
            polyline.push([x, y]);
          });
          return polyline;
        });
    },
    render({ context, width, height, deltaTime, playhead }) {
      m = Math.ceil(mapRange(beat(playhead), 0, 1, 0, 6));
      osc += 0.05;

      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.lineJoin = 'bevel';

      context.translate(width / 2, height / 2);
      context.lineWidth = 4;
      context.strokeStyle = chroma.random();

      let start;
      context.beginPath();
      polylines.forEach((polyline, idx) => {
        const [x, y] = lerpFrames(polyline, playhead);
        if (idx === 0) {
          // start = [x, y];
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      // context.lineTo(...start);
      context.stroke();
      context.restore();
    },
  };
};

canvasSketch(sketch, settings);

function supershape({ n1, n2, n3, m, a, b }, theta) {
  let part1 = (1 / a) * Math.cos((theta * m) / 4);
  part1 = Math.abs(part1);
  part1 = Math.pow(part1, n2);

  let part2 = (1 / b) * Math.sin((theta * m) / 4);
  part2 = Math.abs(part2);
  part2 = Math.pow(part2, n3);

  const part3 = Math.pow(part1 + part2, 1 / n1);

  if (part3 === 0) {
    return 0;
  }

  return 1 / part3;
}

function beat(value, intensity = 2, frequency = 2) {
  const v = Math.atan(Math.sin(value * Math.PI * frequency) * intensity);
  return (v + Math.PI / 2) / Math.PI;
}
