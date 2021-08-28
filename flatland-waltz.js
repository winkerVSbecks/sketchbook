const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 24,
  scaleToView: true,
  fps: 60,
};

const clrs = {
  bg: '#1B2280',
  triangle: '#1B2280',
  centroidTriangle: '#2151B7',
  edgeTriangles: ['#E23122', '#F5C644', '#9B2153'],
  handle: '#FF851B',
};

const sketch = () => {
  console.clear();
  Random.setSeed('napoleon-theorem');

  let u = [270, 540];
  let v = [405, 270];
  let w = [810, 540];

  return {
    begin({ context, width, height }) {},
    render({ context, width, height, playhead, deltaTime }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

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
      drawGeometry(context, state, { width, height });
    },
  };
};

canvasSketch(sketch, settings);

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
    2,
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

const scale = 1;
function drawGeometry(
  context,
  { triangle, a, b, c, centroidTriangle },
  { width, height }
) {
  context.lineWidth = 6 * scale;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  drawTriangle(context, [[0, 0], a[1], a[2]], '#F2A5A3');

  drawTriangle(context, [[0, 0], a[2], b[1]], '#EC572A');
  drawTriangle(context, [[0, 0], b[1], [width, 0]], '#D1E2F6');

  drawTriangle(context, [[width, 0], b[1], b[2]], '#807CC7');

  drawTriangle(context, [[width, 0], b[2], [width, height]], '#E33123');
  drawTriangle(context, [b[2], [width, height], c[1]], '#E47590');

  drawTriangle(context, [[width, height], c[1], [0, height]], '#E33222');

  drawTriangle(context, [[0, height], c[1], c[2]], '#4FADEC');

  drawTriangle(context, [[0, height], c[2], [0, 0]], '#F6C644');

  drawTriangle(context, [[0, 0], a[1], a[0]], '#FFFFFF');

  drawTriangle(context, a, clrs.edgeTriangles[0]);
  drawTriangle(context, b, clrs.edgeTriangles[1]);
  drawTriangle(context, c, clrs.edgeTriangles[2]);
  drawTriangle(context, triangle, clrs.triangle);
  drawTriangle(context, centroidTriangle, clrs.centroidTriangle);

  // context.fillStyle = clrs.handle;
  // triangle.forEach((point) => {
  //   context.beginPath();
  //   context.arc(point[0], point[1], 27 * scale, 0, 2 * Math.PI);
  //   context.fill();
  // });
}

function drawTriangle(context, triangle, color) {
  // context.strokeStyle = color;
  context.fillStyle = color;

  context.beginPath();
  context.moveTo(...triangle[0]);
  context.lineTo(...triangle[1]);
  context.lineTo(...triangle[2]);
  context.closePath();
  // context.stroke();
  context.fill();
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
