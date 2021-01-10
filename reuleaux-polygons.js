const canvasSketch = require('canvas-sketch');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const flubber = require('flubber');
const eases = require('eases');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 4,
};

const sketch = ({ width, height }) => {
  const polygons = [3, 5, 7].map((count) =>
    reuleauxPolygon([width / 2, height / 2], width * 0.25, count)
  );

  const interpolators = [
    flubber.fromCircle(width / 2, height / 2, width * 0.125, polygons[0]),
    ...polygons.map((polygon, idx) => {
      if (idx === polygons.length - 1) {
        return flubber.toCircle(polygon, width / 2, height / 2, width * 0.25);
      } else {
        return flubber.interpolate(polygon, polygons[idx + 1]);
      }
    }),
    flubber.toCircle(
      polygons[polygons.length - 1],
      width / 2,
      height / 2,
      width * 0.125
    ),
  ];

  const cycle = 1 / interpolators.length;

  const fill = '#ffb700'; // clrs.ink();
  const stroke = '#2F3030'; // clrs.ink();
  const background = '#A9D7FD'; // clrs.bg;

  // '#fff', '#fff', '#ED705C', '#ED705C', '#337EED', '#337EED', '#ffb700', '#ffb700']

  return ({ context, width, height, playhead, deltaTime }) => {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const targetIndex = Math.floor(playhead * interpolators.length);
    const target = interpolators[targetIndex];
    const time = mapRange(
      playhead,
      cycle * targetIndex,
      cycle * (targetIndex + 1),
      0,
      1
    );

    const t = eases.expoOut(time);
    const d = target(t);

    context.strokeStyle = stroke;
    context.fillStyle = fill;
    context.lineWidth = 30;
    context.lineJoin = 'round';
    const path = new Path2D(d);

    context.beginPath();
    context.scale(1.05, 1.05);
    context.translate(-20, -50);
    context.fill(path);
    context.setTransform(1, 0, 0, 1, 0, 0);

    context.beginPath();
    context.stroke(path);
  };
};

canvasSketch(sketch, settings);

function triangleWave(A, P, t) {
  return t - Math.floor(t + 1 / 2);
}

/**
 * Polygon Math
 */
function pts(sideCount, radius) {
  const angle = 360 / sideCount;
  const vertexIndices = linspace(sideCount).map((_, idx) => idx);
  const offsetDeg = 90 - (180 - angle) / 2;
  const offset = degreesToRadians(offsetDeg);

  return vertexIndices.map((index) => {
    return {
      theta: offset + degreesToRadians(angle * index),
      r: radius,
    };
  });
}

function degreesToRadians(angleInDegrees) {
  return (Math.PI * angleInDegrees) / 180;
}

function polygon([cx, cy], radius, sideCount) {
  return pts(sideCount, radius).map(({ r, theta }) => [
    cx + r * Math.cos(theta),
    cy + r * Math.sin(theta),
  ]);
}

function dist([x1, y1], [x2, y2]) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function reuleauxPolygon([cx, cy], radius, sideCount) {
  const pts = polygon([cx, cy], radius, sideCount);
  const l = dist(pts[0], pts[2]);
  const [o, ...rest] = pts;

  return [
    'M',
    o[0],
    o[1],
    ...rest.map((p) => `A ${l} ${l} 0 0 1 ${p[0]} ${p[1]}`),
    `A ${l} ${l} 0 0 1 ${o[0]} ${o[1]}`,
    'Z',
  ].join(' ');
}
