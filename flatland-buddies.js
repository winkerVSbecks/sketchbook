const canvasSketch = require('canvas-sketch');
const { mapRange, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const PoissonDiskSampling = require('poisson-disk-sampling');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 24,
  scaleToView: true,
  fps: 60,
};

const config = {
  count: 10000,
  bg: '#FFFFFF',
  all: [
    '#E23122',
    '#F5C644',
    '#9B2153',
    '#2151B7',
    '#1B2280',
    '#F2A5A3',
    '#EC572A',
    '#D1E2F6',
    '#807CC7',
    '#E47590',
    '#4FADEC',
    '#F6C644',
  ],
};

const sketch = ({ width, height }) => {
  console.clear();
  Random.setSeed('napoleon-theorem');

  let u = [270, 540];
  let v = [405, 270];
  let w = [810, 540];
  let buddyHolders;

  return {
    begin({ context, width, height }) {},
    render({ context, width, height, playhead, deltaTime }) {
      context.fillStyle = config.bg;
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
      const { triangle, a, b, c } = state;
      const triangles = [
        [[0, 0], a[1], a[2]],
        [[0, 0], a[2], b[1]],
        [[0, 0], b[1], [width, 0]],
        [[width, 0], b[1], b[2]],
        [[width, 0], b[2], [width, height]],
        [b[2], [width, height], c[1]],
        [[width, height], c[1], [0, height]],
        [[0, height], c[1], c[2]],
        [[0, height], c[2], [0, 0]],
        [[0, 0], a[1], a[0]],
        a,
        b,
        c,
        triangle,
      ];

      if (!buddyHolders) {
        buddyHolders = triangles.map((triangle) =>
          createBuddiesHolder(triangle, { width, height })
        );
      }

      drawGeometry(context, state, { width, height }, buddyHolders, deltaTime);
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
    1,
    0.5
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
  { width, height },
  buddyHolders,
  deltaTime
) {
  context.lineWidth = 6;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const triangles = [
    [[0, 0], a[1], a[2]],
    [[0, 0], a[2], b[1]],
    [[0, 0], b[1], [width, 0]],
    [[width, 0], b[1], b[2]],
    [[width, 0], b[2], [width, height]],
    [b[2], [width, height], c[1]],
    [[width, height], c[1], [0, height]],
    [[0, height], c[1], c[2]],
    [[0, height], c[2], [0, 0]],
    [[0, 0], a[1], a[0]],
    a,
    b,
    c,
    triangle,
  ];

  triangles.forEach((triangle, idx) => {
    drawTriangle(context, triangle, config.bg);
    const buddies = getBuddies(triangle, buddyHolders[idx], deltaTime);
    buddies.forEach((buddy) => drawBuddy(context, buddy));
  });
}

function drawTriangle(context, triangle, color) {
  context.fillStyle = color;
  context.strokeStyle = '#222';

  context.beginPath();
  context.moveTo(...triangle[0]);
  context.lineTo(...triangle[1]);
  context.lineTo(...triangle[2]);
  context.closePath();
  context.fill();
  context.stroke();
}

/**
 * Buddies
 */

function createBuddiesHolder(triangle, { width, height }) {
  const poissonDiskSamples = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: 8,
    maxDistance: 16,
    tries: 10,
  });

  const samples = poissonDiskSamples.fill().filter(isInTriangle(triangle));
  // .slice(0, config.count);

  return {
    poissonDiskSamples,
    positions: samples,
    colors: samples.map(() => Random.pick(config.all)),
  };
}

function getBuddies(
  triangle,
  { poissonDiskSamples, positions, colors },
  deltaTime
) {
  const targets = poissonDiskSamples.fill().filter(isInTriangle(triangle));
  // .slice(0, config.count);

  return targets.map((target, idx) => ({
    position: positions[idx]
      ? interpolate(positions[idx], target, deltaTime)
      : target,
    color: colors[0],
  }));
}

function drawBuddy(context, { position, color }) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(position[0], position[1], 2, 0, 2 * Math.PI);
  context.fill();
}

function isInTriangle(triangle) {
  return (pt) => {
    const d1 = sign(pt, triangle[0], triangle[1]);
    const d2 = sign(pt, triangle[1], triangle[2]);
    const d3 = sign(pt, triangle[2], triangle[0]);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
  };
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

function interpolate(point, target, deltaTime) {
  // Determine a rate at which we will step forward each frame,
  // making it dependent on the time elapsed since last frame
  const rate = 12 * deltaTime;

  // Interpolate toward the target point at this rate
  return [lerp(point[0], target[0], rate), lerp(point[1], target[1], rate)];
}
