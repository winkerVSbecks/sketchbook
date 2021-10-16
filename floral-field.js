const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const PoissonDiskSampling = require('poisson-disk-sampling');
const eases = require('eases');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const clrs = generateRandomColorRamp({
  total: 24,
  centerHue: Random.range(240, 300),
  hueCycle: Random.range(0.5, 1), //0.5,
  curveMethod: 'lamé',
  curveAccent: 0.2,
  offsetTint: 0.251,
  offsetShade: 0.01,
  tintShadeHueShift: 0.0,
  offsetCurveModTint: 0.03,
  offsetCurveModShade: 0.03,
  minSaturationLight: [0, 0],
  maxSaturationLight: [1, 1],
});

const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;

const bg = hsl(Random.pick(clrs.light));
const colors = clrs.all.map(hsl).filter((c) => c !== bg);

const settings = {
  dimensions: [1080, 1080],
  scaleToFit: true,
  animate: true,
  duration: 2,
};

canvasSketch(({ width, height }) => {
  const nodes = [];
  colors.forEach((color, idx) => {
    nodes.push(
      ...someNodes(
        width,
        height,
        color,
        1,
        // idx % 2 === 0 ? delayFunctions.bottomMiddle : delayFunctions.topLeft
        delayFunctions.topLeft
      )
    );
  });

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      // context.filter = 'blur(8px)';

      nodes.forEach((node) => {
        drawCircle(context, node, playhead);
      });
    },
  };
}, settings);

function drawRect(context, node, playhead) {
  context.fillStyle = node.color;

  const { x, y, width, height } = node;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const t = eases.expoInOut(
    Math.abs(Math.cos(Math.PI * playhead - node.delay))
  );

  const w = width - width * 1 * t;
  const h = height - height * 1 * t;

  context.beginPath();
  context.moveTo(cx - w / 2, cy - h / 2);
  context.lineTo(cx + w / 2, cy - h / 2);
  context.lineTo(cx + w / 2, cy + h / 2);
  context.lineTo(cx - w / 2, cy + h / 2);
  context.closePath();
  context.fill();
}

function drawCircle(context, node, playhead) {
  const t = eases.cubicIn(Math.abs(Math.sin(node.delay + Math.PI * playhead)));
  context.fillStyle = node.color;

  const r = node.size * 0.5 * t;
  const d = r * 2;
  const x = node.x;
  const y = node.y;

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + d, y, x + d, y + d, r);
  context.arcTo(x + d, y + d, x, y + d, r);
  context.arcTo(x, y + d, x, y, r);
  context.arcTo(x, y, x + d, y, r);
  context.closePath();
  context.fill();
}

const delayFunctions = {
  bottomMiddle: ([x, y], [width, height], count, dir) =>
    mapRange(
      Math.hypot(width / 2 - x, height - y),
      0,
      Math.hypot(width, height),
      0,
      Math.PI * count * -1
    ),
  topLeft: ([x, y], [width, height], count, dir) =>
    mapRange(
      Math.hypot(x, y),
      0,
      Math.hypot(width, height),
      0,
      Math.PI * count * dir
    ),
  bottomRight: ([x, y], [width, height], count, dir) =>
    mapRange(
      Math.hypot(width - x, height - y),
      0,
      Math.hypot(width, height),
      0,
      Math.PI * count * -1
    ),
  something: ([x, y], [width, height], count, dir) =>
    mapRange(
      Math.hypot(width * 0.25 - x, height * 0.75 - y),
      0,
      Math.hypot(width, height),
      0,
      Math.PI * count * -1
    ),
};

function node([x, y], width, height, size, color, dir, delayFunction) {
  return {
    x: x,
    y: y,
    size,
    width: size,
    height: size,
    color: color,
    delay: delayFunction([x, y], [width, height], 12, dir),
  };
}

function someNodes(width, height, color, dir, delayFunction) {
  const minDistance = width * 0.0625;
  const maxDistance = width * 0.125;
  const size = minDistance * 0.25;

  const poissonDiskSamples = new PoissonDiskSampling({
    shape: [width, height],
    minDistance,
    maxDistance,
  });

  return poissonDiskSamples
    .fill()
    .map((pt) => node(pt, width, height, size, color, dir, delayFunction));
}
