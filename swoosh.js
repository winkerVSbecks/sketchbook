const canvasSketch = require('canvas-sketch');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 2,
};

const sketch = () => {
  const foreground1 = clrs.ink();
  const foreground2 = clrs.ink();
  const background = clrs.bg;

  return ({ context, width, height, playhead }) => {
    const l = (width * 0.5) / 3;
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.lineWidth = 32;
    context.setLineDash([width * 0.25, width * 0.25]);
    context.lineCap = 'round';

    let i = 0;
    context.strokeStyle = foreground1;
    for (let y = height * 0.25; y < height * 0.75; y += 0.05 * height) {
      context.lineDashOffset = width * 0.125 * i + width * playhead;
      context.beginPath();
      context.moveTo(width * 0.25, y);
      context.quadraticCurveTo(width * 0.5, y + 0.05 * height, width * 0.75, y);
      context.stroke();
      i++;
    }

    i = 0;
    context.setLineDash([width * 0.5, width * 0.5]);
    context.strokeStyle = foreground2;
    for (let y = height * 0.25; y < height * 0.75; y += 0.05 * height) {
      context.lineDashOffset = -width * 0.125 * i - width * playhead;
      context.beginPath();
      context.moveTo(width * 0.25, y);
      context.quadraticCurveTo(width * 0.5, y + 0.05 * height, width * 0.75, y);
      context.stroke();
      i++;
    }
  };
};

canvasSketch(sketch, settings);
