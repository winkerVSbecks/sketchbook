const canvasSketch = require('canvas-sketch');
const { noise3D } = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 4,
};

const sketch = ({ width, height }) => {
  const maxDist = Math.hypot(width, height) / 2;
  let origin = [width / 2, height / 2];

  return ({ context, width, height, playhead: t }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const d = (noise3D(origin[0] / width, origin[1] / height, t) * maxDist) / 2;
    let cx = origin[0] + d * Math.cos(Math.PI * 2 * t);
    let cy = origin[1] + d * Math.sin(Math.PI * 2 * t);

    context.fillStyle = '#fff';

    for (let x = 0; x <= width; x += 40) {
      for (let y = 0; y <= height; y += 40) {
        let size = Math.hypot(cx - x, cy - y);
        const radius = (size * 50) / maxDist;

        context.beginPath();
        context.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        context.fill();
      }
    }
  };
};

canvasSketch(sketch, settings);
