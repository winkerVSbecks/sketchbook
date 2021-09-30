const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const d3 = require('d3-quadtree');
const eases = require('eases');
const generateRandomColorRamp = require('./fettepalette');

const clrs = generateRandomColorRamp({
  total: 9,
  centerHue: 289.2,
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
  dimensions: [8192, 8192],
  scaleToView: false,
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
  const pts = linspace(2000).map(() => [
    Random.rangeFloor(0, width),
    Random.rangeFloor(0, height),
  ]);

  const nodes = quadtreeToNodes(pts, width, height, bg);

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      const circles = [];
      const pingPongPlayhead = eases.cubicIn(Math.sin(Math.PI * playhead));

      nodes.forEach((node) => {
        if (node.shape === 'circle') {
          const circle = drawCircle(context, node, playhead);
          circles.push(circle);
        } else if (node.shape === 'rounded_rect') {
          drawRoundedRect(context, node, pingPongPlayhead);
        } else {
          drawRect(context, node);
        }
      });

      if (circles.length > 1) {
        // connection(context, circles[0], circles[1], clr());
      }

      // for (let index = 1; index < circles.length; index++) {
      //   connection(context, circles[index - 1], circles[index], clr());
      // }
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

  // if (node.details.flatten) {
  //   context.fillStyle = node.color;
  //   context.fillRect(node.x, node.y, node.width, node.height);
  // } else {
  //   context.beginPath();
  //   context.arc(x, y, r, 0, 2 * Math.PI);
  //   context.fill();
  // }
  return { x, y, r };
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

function drawRect(context, node) {
  context.fillStyle = node.color;
  context.fillRect(node.x, node.y, node.width, node.height);
}

function connection(context, circle1, circle2, color) {
  context.lineWidth = 12;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(circle1.x, circle1.y);
  context.lineTo(circle2.x, circle2.y);
  context.stroke();
}

function quadtreeToNodes(pts, width, height, bg) {
  const quadtree = d3
    .quadtree()
    .extent([
      [0, 0],
      [width, height],
    ])
    .addAll(pts);

  const nodes = [];
  quadtree.visit((node, x0, y0, x1, y1) => {
    const width = y1 - y0;
    const isMega = width >= 4096;
    const shape =
      // width === Random.pick([64, 128, 256, 512, 1024, 2048, 4096])
      width > 512 && Random.chance() && (isMega ? state.megaCircles < 2 : true)
        ? 'circle'
        : Random.pick(['rect', 'rounded_rect']);

    const dontSkip = Random.chance() && width <= 4096 && width > 32;

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
            Math.hypot(width, height),
            0,
            Math.PI * 0.5
          ),
        },
      });

      if (shape === 'circle' && width >= 4096) {
        state.megaCircles++;
      } else if (shape === 'circle' && width > 1024) {
        state.circles++;
      }
    } else if (width >= 4096) {
      state.megaSkips++;
    }

    return !isMega && shape === 'circle';
  });
  return nodes;
}
