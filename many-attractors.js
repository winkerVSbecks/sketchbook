const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { point, line, drawShape } = require('./geometry');
const { matrixMultiply } = require('./matrix');
const { hueCycle } = require('./clrs');
const { mapRange } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 8,
  scaleToView: true,
};

// const BG = '#D9D2C5';
// const colors = [
//   '#D92B3A',
//   '#32628C',
//   '#2DA690',
//   '#F2A71B',
//   '#D96E30',
//   '#594032',
//   '#0D1526',
//   '#203359',
// ];

const BG = '#00010D';
const colors = [
  '#1B0A59',
  '#1A0D73',
  '#100F40',
  '#0B0D26',
  '#141DD9',
  '#141BA6',
  '#1B3DA6',
  '#99AABF',
  '#637AA6',
  '#3F59A6',
];

const COUNT = 240;

const sketch = () => {
  let angle = Math.PI / 4;
  Random.setSeed('many-polygons');
  // Choose a new starting hue
  const attractors = [];

  for (let idx = 0; idx < COUNT; idx++) {
    attractors.push(createAttractor(idx));
  }

  return ({ context, width, height, playhead }) => {
    // angle += 0.01;
    // prettier-ignore
    const rotationZ = [
      [Math.cos(angle / 2), -Math.sin(angle / 2), 0],
      [Math.sin(angle / 2),  Math.cos(angle / 2), 0],
      [0, 0, 1],
    ];

    // prettier-ignore
    const rotationX = [
      [1, 0, 0],
      [0, Math.cos(angle), -Math.sin(angle)],
      [0, Math.sin(angle),  Math.cos(angle)],
    ];

    // prettier-ignore
    const rotationY = [
      [ Math.cos(angle), 0, Math.sin(angle)],
      [ 0, 1, 0],
      [-Math.sin(angle), 0, Math.cos(angle)],
    ];

    // Clear
    context.fillStyle = BG;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);

    attractors.forEach(updateAttractor);
    attractors.forEach((attractor) =>
      drawAttractor(
        context,
        playhead,
        [rotationX, rotationY, rotationZ],
        attractor
      )
    );
  };
};

canvasSketch(sketch, settings);

function scale(v) {
  // prettier-ignore
  return [
    [v, 0, 0],
    [0, v, 0],
    [0, 0, v],
  ];
}

function createAttractor(idx) {
  return {
    hueStart: Random.pick(colors), // mapRange(idx, 0, 60, 0.1, 1)
    // starting point
    x: mapRange(idx, 0, COUNT, 0.1, 20), //0.01,
    y: mapRange(idx, 0, COUNT, 0.1, 20), //0,
    z: mapRange(idx, 0, COUNT, 0.1, 20), //0,
    offset: idx < COUNT / 2 ? Random.range(0, -10) : Random.range(-25, -50), // Random.range(-50, -25),
    // attractor config
    a: Random.range(1, 20) * 4,
    b: Random.range(1, 50) * 4,
    c: Random.range(0.5, 6.0),
    // a: 10,
    // b: 28,
    // c: 8.0 / 3.0,
    // shape
    path: [],
    width: Random.rangeFloor(16, 48),
  };
}

function updateAttractor(attractor) {
  const { a, b, c, x, y, z } = attractor;

  let dt = 0.01 * 0.25;
  let dx = a * (y - x) * dt;
  let dy = (x * (b - z) - y) * dt;
  let dz = (x * y - c * z) * dt;

  attractor.x = x + dx;
  attractor.y = y + dy;
  attractor.z = z + dz;

  attractor.path.push([x, y, z]);

  if (attractor.path.length > 2) {
    const first = attractor.path[0];
    const last = attractor.path[attractor.path.length - 2];

    if (
      Math.hypot(first[0] - last[0], first[1] - last[1], first[2] - last[2]) < 5
    ) {
      attractor.path = [];
    }
  }

  if (attractor.path.length > 20) {
    attractor.path.shift();
  }
}

function drawAttractor(
  context,
  playhead,
  [rotationX, rotationY, rotationZ],
  attractor
) {
  const projected = attractor.path.map((vertex) => {
    const v = vertex.map((v) => [attractor.offset + v]);
    let rotated = matrixMultiply(rotationX, v);
    rotated = matrixMultiply(rotationY, rotated);
    rotated = matrixMultiply(rotationZ, rotated);
    const scaled = matrixMultiply(
      scale(mapRange(playhead, 0, 1, 12, 4)),
      // scale(mapRange(playhead, 0, 1, 24, 12)),
      rotated
    );

    // prettier-ignore
    const projection2d = [
        [1, 0,   0],
        [0,   1, 0],
      ];
    const projected2d = matrixMultiply(projection2d, scaled);

    return projected2d;
  });

  // const color = hueCycle(attractor.hueStart, playhead);

  context.strokeStyle = attractor.hueStart;
  context.lineWidth = attractor.width;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  // Rainbow version
  // const [start, ...pts] = projected;

  // let prev = start;
  // const l = pts.length;

  // pts.forEach((pt, idx) => {
  //   const color = hueCycle(attractor.hueStart, idx / l);
  //   context.strokeStyle = color;
  //   context.beginPath();
  //   context.moveTo(...prev);
  //   context.lineTo(...pt);
  //   prev = pt;
  //   context.stroke();
  // });

  // Dancing version
  if (projected.length > 3) {
    drawShape(context, projected, false);
  }
  context.stroke();
}
