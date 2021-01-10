const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
};

const sketch = () => {
  return {
    begin({ context, width, height }) {
      context.fillStyle = 'black';
      context.fillRect(0, 0, width, height);
    },
    render({ context, width, height }) {
      const x = Random.gaussian(width / 2, width / 2);
      const y = Random.gaussian(height / 2, height / 2);

      context.fillStyle = Random.pick(['#fff', '#f00', '#0f0', '#00f']);

      if (insideCircle([x, y], [width / 2, height / 2], width / 4)) {
        context.fillRect(x, y, 1, 1);
      } else if (Random.chance(0.1)) {
        context.fillRect(x, y, 1, 1);
      }
    },
  };
};

canvasSketch(sketch, settings);

function insideCircle([x, y], [cx, cy], radius) {
  const dist = Math.hypot(cx - x, cy - y);

  return dist < radius;
}
