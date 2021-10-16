const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const d3 = require('d3-quadtree');
const eases = require('eases');
const generateRandomColorRamp = require('./fettepalette');

const clrs = generateRandomColorRamp({
  total: 9,
  centerHue: 289.2, // Random.range(240, 300),
  hueCycle: 0.5,
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
  dimensions: [1024, 1024],
  scaleToFit: true,
  animate: true,
  duration: 2,
};

const clr = () => Random.pick(colors);

const state = {
  circles: 0,
  megaCircles: 0,
  megaSkips: 0,
};

canvasSketch(({ width, height }) => {
  let size = Math.ceil(width > height ? height : width / 32) * 32;
  let nodes = quadtreeToNodes(size, bg);

  return {
    resize({ width, height }) {
      size = width > height ? height : width;
      nodes = quadtreeToNodes(size, bg);
    },
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      context.translate(width / 2 - size / 2, height / 2 - size / 2);

      const region = new Path2D();
      region.rect(0, 0, size, size);
      context.clip(region, 'evenodd');

      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      const pingPongPlayhead = eases.cubicIn(Math.sin(Math.PI * playhead));

      nodes.forEach((node) => {
        if (node.shape === 'circle') {
          drawCircle(context, node, playhead);
        } else if (node.shape === 'rounded_rect') {
          drawRoundedRect(context, node, pingPongPlayhead);
        } else {
          drawRect(context, node, playhead);
        }
      });
    },
  };
}, settings);

/**
 * Shapes
 */
function drawCircle(context, node, playhead) {
  const t = eases.cubicIn(
    Math.abs(Math.sin(node.details.delay + Math.PI * playhead))
  );
  context.fillStyle = node.color;
  const r = (node.width / 2) * t;
  const d = node.width;
  const x = node.x + node.width / 2;
  const y = node.y + node.height / 2;

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + d, y, x + d, y + d, r);
  context.arcTo(x + d, y + d, x, y + d, r);
  context.arcTo(x, y + d, x, y, r);
  context.arcTo(x, y, x + d, y, r);
  context.closePath();
  context.fill();
}

function drawRoundedRect(context, node, playhead) {
  context.fillStyle = node.color;
  const r = node.width / 2;
  const d = node.width;
  const { x, y } = node;

  const radii = [0, 1, 2, 3].map((idx) =>
    idx === node.details.roundedCorner ? r * playhead : 0
  );

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + d, y, x + d, y + d, radii[0]);
  context.arcTo(x + d, y + d, x, y + d, radii[1]);
  context.arcTo(x, y + d, x, y, radii[2]);
  context.arcTo(x, y, x + d, y, radii[3]);
  context.closePath();
  context.fill();
}

function drawRect(context, node, playhead) {
  context.fillStyle = node.color;

  const { x, y, width, height } = node;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const t =
    width < 512
      ? eases.expoInOut(
          Math.abs(Math.sin(Math.PI * playhead - node.details.delay))
        )
      : 1;

  const w = width * t;
  const h = height * t;

  context.beginPath();
  context.moveTo(cx - w / 2, cy - h / 2);
  context.lineTo(cx + w / 2, cy - h / 2);
  context.lineTo(cx + w / 2, cy + h / 2);
  context.lineTo(cx - w / 2, cy + h / 2);
  context.closePath();
  context.fill();
}

function quadtreeToNodes(size, bg) {
  let pts = linspace(2000).map(() => [
    Random.rangeFloor(0, size),
    Random.rangeFloor(0, size),
  ]);

  const quadtree = d3
    .quadtree()
    .extent([
      [0, 0],
      [size, size],
    ])
    .addAll(pts);

  const nodes = [];
  quadtree.visit((node, x0, y0, x1, y1) => {
    const min = Math.max(size / 256, 16);
    const max = size / 2;

    const width = y1 - y0;
    const isMega = width >= max;
    const shape =
      width > size / 16 &&
      Random.chance() &&
      (isMega ? state.megaCircles < 2 : true)
        ? 'circle'
        : Random.pick(['rect', 'rounded_rect']);

    const dontSkip = Random.chance() && width <= max && width > min;

    if (dontSkip || state.megaSkips > 3) {
      nodes.push({
        x: x0,
        y: y0,
        x1,
        y1,
        width,
        height: x1 - x0,
        color: clr(bg),
        shape,
        details: {
          roundedCorner: Random.rangeFloor(0, 4),
          flatten: Random.chance(),
          delay: mapRange(
            Math.hypot(x0, y0),
            0,
            Math.hypot(size, size),
            0,
            Math.PI * 0.5
          ),
        },
      });

      if (shape === 'circle' && width >= max) {
        state.megaCircles++;
      } else if (shape === 'circle' && width > size / 8) {
        state.circles++;
      }
    } else if (width >= max) {
      state.megaSkips++;
    }

    return !isMega && shape === 'circle';
  });
  return nodes;
}
