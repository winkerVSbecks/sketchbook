const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const d3 = require('d3-quadtree');
const eases = require('eases');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const clrs = generateRandomColorRamp({
  total: 9,
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

const hsl = (c) => `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)`;

const bg = hsl(Random.pick(clrs.light));
const colors = clrs.all.map(hsl).filter((c) => c !== bg);

const settings = {
  dimensions: [1080, 1080],
  scaleToFit: true,
  animate: true,
  duration: 2,
};

const clr = () => Random.pick(colors);

canvasSketch(({ width, height }) => {
  const nodes = [];
  nodes.push(...someNodes([5, 5], width, height, 1));
  nodes.push(...someNodes([10, 5], width, height, -1));
  nodes.push(...someNodes([20, 5], width, height, 1));
  nodes.push(...someNodes([30, 10], width, height, -1));
  nodes.push(...someNodes([40, 20], width, height, 1));

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      nodes.forEach((node) => {
        drawRect(context, node, playhead);
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

function someNodes(count, width, height, dir) {
  const nodes = [];
  const colors = [
    [clr(bg), clr(bg)],
    [clr(bg), clr(bg)],
  ];

  const size = [width / count[0], height / count[1]];

  for (let x = 0; x < count[0]; x++) {
    const even = x % 2 === 0;
    const offset = even ? 0 : 1;
    const max = even ? count[1] : count[1] - 1;

    for (let y = offset; y < max; y++) {
      nodes.push({
        x: x * size[0],
        y: y * size[1],
        width: size[0],
        height: size[1],
        color: (even ? colors[0] : colors[1])[y % 2 === 0 ? 0 : 1], //: clr(bg),
        delay: mapRange(
          Math.hypot(x * size[0], y * size[1]),
          0,
          Math.hypot(width, height),
          0,
          Math.PI * dir
        ),
      });
    }
  }

  return nodes;
}
