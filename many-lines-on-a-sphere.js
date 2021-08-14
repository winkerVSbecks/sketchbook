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

const COUNT = 800;
const SPHERE_SIZE = 50;

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

    attractors.forEach((attractor) => updateAttractor(attractor, playhead));
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
  const [x, y, z] = Random.onSphere(SPHERE_SIZE);

  return {
    color: Random.pick(colors),
    // starting point
    x,
    y,
    z,
    v: Random.range(0, 1),
    // shape
    path: [],
    // width: Random.rangeFloor(16, 48),
    width: 16,
  };
}

function updateAttractor(attractor) {
  const { v, x, y, z } = attractor;

  const direction = Random.noise3D(
    x / SPHERE_SIZE,
    y / SPHERE_SIZE,
    z / SPHERE_SIZE,
    2,
    1
  );

  attractor.x = x + v * Math.cos(direction);
  attractor.y = y + v * Math.sin(direction);
  attractor.z = z + v * Math.cos(direction);

  attractor.path.push([attractor.x, attractor.y, attractor.z]);

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
    const mag = Math.hypot(...vertex);
    const v = vertex.map((v) => [(v * SPHERE_SIZE) / mag]);

    // const v = vertex.map((v) => [v]);

    let rotated = matrixMultiply(rotationX, v);
    rotated = matrixMultiply(rotationY, rotated);
    rotated = matrixMultiply(rotationZ, rotated);
    const scaled = matrixMultiply(scale(10), rotated);

    // prettier-ignore
    const projection2d = [
        [1, 0,   0],
        [0,   1, 0],
      ];
    const projected2d = matrixMultiply(projection2d, scaled);

    return projected2d;
  });

  context.strokeStyle = attractor.color;
  context.lineWidth = attractor.width;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawShape(context, projected, false);
  context.stroke();
}
