const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { point, line } = require('./geometry');
const { matrixMultiply } = require('./matrix');
const { hueCycle } = require('./clrs');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 4,
  scaleToView: true,
};

const sketch = () => {
  console.clear();
  let angle = Math.PI / 4;
  Random.setSeed(Random.getRandomSeed());
  // Choose a new starting hue
  let hueStart = Random.value();
  // prettier-ignore
  const hyperCube = [
    [-1, -1, -1,  1],
    [ 1, -1, -1,  1],
    [ 1,  1, -1,  1],
    [-1,  1, -1,  1],
    [-1, -1,  1,  1],
    [ 1, -1,  1,  1],
    [ 1,  1,  1,  1],
    [-1,  1,  1,  1],
    [-1, -1, -1, -1],
    [ 1, -1, -1, -1],
    [ 1,  1, -1, -1],
    [-1,  1, -1, -1],
    [-1, -1,  1, -1],
    [ 1, -1,  1, -1],
    [ 1,  1,  1, -1],
    [-1,  1,  1, -1],
  ];

  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    //
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    //
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
    //
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 12],
    //
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    //
    [0, 8],
    [1, 9],
    [2, 10],
    [3, 11],
    //
    [8, 12],
    [9, 13],
    [10, 14],
    [11, 15],
    //
    [4, 12],
    [5, 13],
    [6, 14],
    [7, 15],
  ];

  return ({ context, width, height, playhead }) => {
    // const angle = Math.sin(playhead * Math.PI) * 2 * Math.PI;
    const angle = playhead * 2 * Math.PI;

    // prettier-ignore
    const rotationXY = [
      [Math.cos(angle), -Math.sin(angle), 0, 0],
      [Math.sin(angle),  Math.cos(angle), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    // prettier-ignore
    const rotationZW = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, Math.cos(angle), -Math.sin(angle)],
      [0, 0, Math.sin(angle),  Math.cos(angle)],
    ];

    // prettier-ignore
    const rotationX = [
      [1, 0, 0],
      [0, Math.cos(-Math.PI / 2), -Math.sin(-Math.PI / 2)],
      [0, Math.sin(-Math.PI / 2),  Math.cos(-Math.PI / 2)],
    ];

    const distance = 2.25;

    const projected = hyperCube.map((vertex) => {
      const v = vertex.map((v) => [v]);

      // Rotate around planes
      let rotated4d = matrixMultiply(rotationXY, v);
      rotated4d = matrixMultiply(rotationZW, rotated4d);

      // Project from 4D to 3D
      const w4d = 1 / (distance - rotated4d[3]);
      // prettier-ignore
      const projection3d = [
        [w4d, 0,   0,   0],
        [0,   w4d, 0,   0],
        [0,   0,   w4d, 0],
      ];
      const projected3d = matrixMultiply(projection3d, rotated4d);
      const rotated3d = matrixMultiply(rotationX, projected3d);

      // Project from 3D to 2D
      const w3d = 1 / (distance - rotated3d[2]);
      // prettier-ignore
      const projection2d = [
        [w3d, 0,   0],
        [0,   w3d, 0],
      ];
      const projected2d = matrixMultiply(projection2d, rotated3d);

      return projected2d.map((v) => (v * width) / 3);
    });

    context.fillStyle = '#0D0308';
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);

    const color = hueCycle(hueStart, playhead);
    context.shadowBlur = 25;
    context.shadowColor = chroma(color).brighten(2);

    edges.forEach(([a, b]) => {
      line(context, projected[a], projected[b], {
        lineWidth: 4,
        stroke: color,
      });
    });

    // angle += 0.01;
  };
};

canvasSketch(sketch, settings);

function beat(value, intensity = 2, frequency = 2) {
  const v = Math.atan(Math.sin(value * Math.PI * frequency) * intensity);
  return (v + Math.PI / 2) / Math.PI;
}
