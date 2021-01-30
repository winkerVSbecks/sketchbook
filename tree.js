const canvasSketch = require('canvas-sketch');
const ln = require('@lnjs/core');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  duration: 4,
};

const sketch = () => {
  const scene = new ln.Scene();

  const min = new ln.Vector(-0.5, -2, -0.5);
  const max = new ln.Vector(0.5, 2, 0.5);
  const box = new ln.Cube(min, max);
  scene.add(box);

  for (let index = 0; index < 6; index++) {
    const side = 3 - 0.5 * index;
    const p = new ln.Cube(
      new ln.Vector(-side, 2 + index, -side),
      new ln.Vector(side, 2 + index + 0.1, side)
    );
    scene.add(p);
  }

  const side = 0.125;
  const p = new ln.Cube(
    new ln.Vector(-side, 2 + 6, -side),
    new ln.Vector(side, 2 + 6 + 0.05, side)
  );
  scene.add(p);

  let eye = new ln.Vector(12, 12, 12);
  let center = new ln.Vector(0, 3, 0);
  let up = new ln.Vector(0, -1, 0);

  const radius = Math.hypot(12, 12);

  return ({ context, width, height, playhead }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    const theta = Math.PI * 2 * playhead;

    eye.x = radius * Math.sin(theta);
    // eye.y = radius * Math.cos(theta);
    eye.z = radius * Math.cos(theta);

    let paths = scene.render(
      eye,
      center,
      up,
      width,
      height,
      50.0,
      0.1,
      100,
      0.01
    );

    context.lineWidth = 4;
    context.strokeStyle = 'white';

    paths.forEach((path) => {
      drawPath(context, path);
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);

export function drawPath(context, path) {
  const [start, ...pts] = path;

  context.beginPath();
  context.moveTo(start.x, start.y);
  pts.forEach((pt) => {
    context.lineTo(pt.x, pt.y);
  });
}
