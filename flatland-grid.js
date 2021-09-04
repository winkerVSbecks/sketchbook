const canvasSketch = require('canvas-sketch');
const { mapRange, lerpArray, linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 24,
  scaleToView: true,
};

const clrs = {
  bg: '#F1F2EE',
  lines: '#1B2280',
};

const config = {
  u: [540 - 270, 540],
  v: [540, 540 - 270],
  w: [540 + 270, 540],
  margin: 3,
  lineWidth: 6,
  splits: 6,
};

const sketch = ({ width, height }) => {
  Random.setSeed('flatland-grid');

  const systems = [
    {
      u: config.u,
      v: config.v,
      w: config.w,
      color: clrs.lines,
    },
  ];

  return {
    render({ context, width, height, playhead }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      systems.forEach(({ u, v, w, color }) => {
        system({
          u,
          v,
          w,
          context,
          width,
          height,
          playhead,
          color,
        });
      });
    },
  };
};

canvasSketch(sketch, settings);

function system({ u, v, w, context, width, height, playhead, color }) {
  const nextU = movePoint(
    { cx: 270, cy: 540, radius: width, offset: 0, width, height },
    u,
    playhead
  );
  const nextV = movePoint(
    { cx: 405, cy: 270, radius: width, offset: 1000, width, height },
    v,
    playhead
  );
  const nextW = movePoint(
    { cx: 810, cy: 540, radius: width, offset: 2000, width, height },
    w,
    playhead
  );
  const state = getState(nextU, nextV, nextW);
  drawGeometry(context, state, { width, height, margin: config.margin }, color);
}

function movePoint({ cx, cy, radius, width, offset }, [x, y], playhead) {
  const r = loopNoise(
    { cx, cy, radius, offset: offset + 0, range: width * 0.25 },
    playhead
  );
  const theta = loopNoise(
    { cx, cy, radius, offset: offset + 1000, range: 2 * Math.PI },
    playhead
  );

  return [x + r * Math.cos(theta), y + r * Math.sin(theta)];
}

function loopNoise({ cx, cy, radius, offset, range }, playhead) {
  const v = Random.noise2D(
    (cx + radius * Math.cos(Math.PI * 2 * playhead) + offset) / 1000,
    (cy + radius * Math.sin(Math.PI * 2 * playhead) + offset) / 1000,
    1,
    1
  );

  return mapRange(v, -1, 1, 0, range);
}

function getState(u, v, w) {
  const cc = circumCenter(u, v, w);
  const a = eqTriangle(u, v, cc, w);
  const b = eqTriangle(v, w, cc, u);
  const c = eqTriangle(w, u, cc, v);

  return {
    triangle: [u, v, w],
    a,
    b,
    c,
    centroidTriangle: [centroid(a), centroid(b), centroid(c)],
  };
}

function drawGeometry(
  context,
  { triangle, a, b, c },
  { width, height, margin },
  color
) {
  context.lineWidth = config.lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const triangles = [
    [[margin, margin], a[1], a[2]],
    [[margin, margin], a[2], b[1]],
    [[margin, margin], b[1], [width - margin, margin]],
    [[width - margin, margin], b[1], b[2]],
    [[width - margin, margin], b[2], [width - margin, height - margin]],
    [b[2], [width - margin, height - margin], c[1]],
    [[width - margin, height - margin], c[1], [margin, height - margin]],
    [[margin, height - margin], c[1], c[2]],
    [[margin, height - margin], c[2], [margin, margin]],
    [[margin, margin], a[1], a[0]],
    a,
    b,
    c,
    triangle,
  ];
  triangles.forEach((t) => drawTriangle(context, t, color));
}

function drawTriangle(context, [a, b, c], color) {
  context.strokeStyle = color;

  context.beginPath();
  context.moveTo(...a);
  context.lineTo(...b);
  context.lineTo(...c);
  context.closePath();
  context.stroke();

  linspace(config.splits).forEach((t) => {
    drawLine(context, a, lerpArray(b, c, t), color);
  });

  linspace(config.splits).forEach((t) => {
    drawLine(context, c, lerpArray(a, b, t), color);
  });
}

function drawLine(context, a, b, color) {
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(...a);
  context.lineTo(...b);
  // context.fill();
  context.stroke();
}

/**
 * Geometry
 */
function eqTriangle(u, v, cc) {
  return [u, apex(u, v, cc), v];
}

function apex([ux, uy], [vx, vy], [ccx, ccy]) {
  const [mpx, mpy] = [(vx + ux) / 2, (vy + uy) / 2];
  const dir = sign([ccx, ccy], [ux, uy], [vx, vy]) > 0 ? 1 : -1;
  const ccMp = [mpx - ccx, mpy - ccy].map((x) => x * dir);

  const h = triangleHeight([ux, uy], [vx, vy]);
  const m = magnitude(ccMp);

  const [nx, ny] = ccMp.map((s) => (s * (h + dir * m)) / m);

  return [nx + ccx, ny + ccy];
}

function circumCenter([ax, ay], [bx, by], [cx, cy]) {
  const d = (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  const x =
    ((((ax - cx) * (ax + cx) + (ay - cy) * (ay + cy)) / 2) * (by - cy) -
      (((bx - cx) * (bx + cx) + (by - cy) * (by + cy)) / 2) * (ay - cy)) /
    d;
  const y =
    ((((bx - cx) * (bx + cx) + (by - cy) * (by + cy)) / 2) * (ax - cx) -
      (((ax - cx) * (ax + cx) + (ay - cy) * (ay + cy)) / 2) * (bx - cx)) /
    d;

  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function centroid([[ux, uy], [vx, vy], [wx, wy]]) {
  return [avg(ux, vx, wx), avg(uy, vy, wy)];
}

/**
 * Utils
 */
function magnitude([x, y]) {
  return (x ** 2 + y ** 2) ** 0.5;
}

function triangleHeight([ux, uy], [vx, vy]) {
  return (3 ** 0.5 * dist([ux, uy], [vx, vy])) / 2;
}

function dist([ux, uy], [vx, vy]) {
  return Math.sqrt((ux - vx) * (ux - vx) + (uy - vy) * (uy - vy));
}

function avg(t0, t1, t2) {
  return (t0 + t1 + t2) / 3;
}

function sign([p1x, p1y], [p2x, p2y], [p3x, p3y]) {
  return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
}
