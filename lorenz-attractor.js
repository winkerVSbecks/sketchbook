const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { point, line, drawShape } = require('./geometry');
const { matrixMultiply } = require('./matrix');
const { hueCycle } = require('./clrs');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 40,
  scaleToView: true,
};

const sketch = () => {
  console.clear();
  let angle = Math.PI / 4;
  Random.setSeed(Random.getRandomSeed());
  // Choose a new starting hue
  let hueStart = Random.value();
  const attractor = [];

  let x = 0.01;
  let y = 0;
  let z = 0;

  let a = 10;
  let b = 28;
  let c = 8.0 / 3.0;

  return ({ context, width, height, playhead }) => {
    angle += 0.01;
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

    let dt = 0.01;
    let dx = a * (y - x) * dt;
    let dy = (x * (b - z) - y) * dt;
    let dz = (x * y - c * z) * dt;
    x = x + dx;
    y = y + dy;
    z = z + dz;

    attractor.push([x, y, z]);

    const projected = attractor.map(vertex => {
      const v = vertex.map(v => [v]);
      let rotated = matrixMultiply(rotationX, v);
      rotated = matrixMultiply(rotationY, rotated);
      rotated = matrixMultiply(rotationZ, rotated);
      const scaled = matrixMultiply(scale(5), rotated);

      // prettier-ignore
      const projection2d = [
        [1, 0,   0],
        [0,   1, 0],
      ];
      const projected2d = matrixMultiply(projection2d, scaled);

      return projected2d;
    });

    context.fillStyle = '#000022';
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);

    const color = hueCycle(hueStart, playhead);

    context.strokeStyle = color;
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // // Rainbow version
    // const [start, ...pts] = projected;
    // let prev = start;
    // const l = pts.length;
    // pts.forEach((pt, idx) => {
    //   const color = hueCycle(hueStart, idx / l);
    //   context.strokeStyle = color;
    //   context.beginPath();
    //   context.moveTo(...prev);
    //   context.lineTo(...pt);
    //   prev = pt;
    //   context.stroke();
    // });

    // Dancing version
    drawShape(context, projected, false);
    context.stroke();
    if (attractor.length > 40) {
      attractor.shift();
    }
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
