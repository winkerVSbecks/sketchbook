const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const R = require('ramda');
const { linspace } = require('canvas-sketch-util/math');
const { point, line } = require('./geometry');
const { matrixMultiply } = require('./matrix');

const settings = {
  dimensions: [800, 800],
  animate: true,
  duration: 4,
  scaleToView: true,
};

const sketch = () => {
  console.clear();
  let angle = Math.PI / 4;
  // prettier-ignore
  const cube = [
    [-0.5, -0.5, -0.5],
    [ 0.5, -0.5, -0.5],
    [ 0.5,  0.5, -0.5],
    [-0.5,  0.5, -0.5],
    [-0.5, -0.5,  0.5],
    [ 0.5, -0.5,  0.5],
    [ 0.5,  0.5,  0.5],
    [-0.5,  0.5,  0.5],
  ];

  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  return ({ context, width, height, playhead }) => {
    // const angle = beat(playhead, 0.5) * 2 * Math.PI;
    const angle = Math.PI / 2 + (Math.sin(playhead * Math.PI) * Math.PI) / 2;
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

    const distance = 1.75;

    const projected = cube.map(vertex => {
      let rotated = matrixMultiply(rotationY, vertex.map(v => [v]));
      rotated = matrixMultiply(rotationX, rotated);
      rotated = matrixMultiply(rotationZ, rotated);

      const w = 1 / (distance - rotated[2]);

      // prettier-ignore
      const projection = [
        [w, 0, 0],
        [0, w, 0],
      ];
      return matrixMultiply(projection, rotated).map(v => (v * width) / 3);
    });

    context.fillStyle = '#0D0308';
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    // projected.forEach(v => {
    //   point(context, v);
    // });

    // context.shadowBlur = 25;
    // context.shadowColor = '#fff';

    edges.forEach(([a, b]) => {
      line(context, projected[a], projected[b], {
        lineWidth: 1,
        stroke: chroma.random(),
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
