const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { pigments } = require('./clrs');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 5,
  scaleToView: true,
};

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());
  let x = 0;
  let y = 0;
  let spacing = 10;
  let gradient = Random.pick(pigments);

  return {
    begin() {
      gradient = Random.pick(pigments);
      Random.permuteNoise();
    },
    render({ context, width, height, frame, playhead }) {
      context.fillStyle = gradient[0];
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      spacing = width / 20;

      context.lineCap = 'square';
      context.lineWidth = 2;

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          context.beginPath();
          context.strokeStyle = gradient[1];
          const t = Math.sin(playhead * Math.PI);
          const time = (t * x) / 480 + y;
          const left = Math.abs(Random.noise3D(x, y, time));

          if (left > 0.5) {
            context.moveTo(x, y);
            context.lineTo(x + spacing, y + spacing);
          } else {
            context.moveTo(x + spacing, y);
            context.lineTo(x, y + spacing);
          }
          context.stroke();
          context.closePath();
        }
      }
    },
  };
};

canvasSketch(sketch, settings);
