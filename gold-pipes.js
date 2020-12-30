const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1600, 1600],
  // animate: true,
  duration: 4,
};

const colors = {
  light: '#F3C35B',
  dark: '#9C772F',
  bg: '#171717',
};

const angle = Math.PI / 6;

const sketch = () => {
  const w = 20;
  const m = 10;
  const margin = w * m;
  let xCount, yCount, pipes;

  return {
    begin({ width, height }) {
      xCount = width / w;
      yCount = height / w;

      pipes = linspace(5).map(() => {
        const x = randomLocation(m, xCount - 2 * m);
        const size = randomSize(x, [m, xCount - m], [6, 12]);
        return {
          x,
          size,
          y: [yCount - m, yCount - Random.rangeFloor(1 * m, 5 * m)],
        };
      });
    },
    render({ context, width, height, playhead }) {
      context.fillStyle = colors.bg;
      context.fillRect(0, 0, width, height);

      // Bg lines
      linspace(xCount - (2 * m - 1)).forEach((_, idx) => {
        context.strokeStyle = idx % 2 === 0 ? colors.light : colors.bg;
        context.beginPath();
        lineVertical(context, w, m + idx, [height - margin, margin]);
        context.stroke();
      });

      context.lineJoin = 'miter';
      context.lineCap = 'butt';

      pipes
        .sort((a, b) => a.y[1] - b.y[1])
        .forEach((pipe) => {
          drawPipe(context, w, pipe);
          // drawPipe(context, w, {
          //   ...pipe,
          //   y: [pipe.y[0], mapRange(playhead, 0, 1, pipe.y[0], pipe.y[1])],
          // });
        });
    },
  };
};

canvasSketch(sketch, settings);

function lineVertical(context, w, x, [yStart, yEnd], move = true) {
  context.lineWidth = w;
  if (move) {
    context.moveTo(w * x, yStart);
  }
  context.lineTo(w * x, yEnd);
}

function lineDiagonal(context, w, { x, y, span = 1, direction = 'up' }) {
  context.lineWidth = w;
  const sign = direction === 'up' ? 1 : -1;
  context.lineTo(
    w * sign * (x + span),
    y - sign * Math.tan(angle) * (w * span)
  );
}

function drawPipe(context, w, { x, size, y: [yStart, yEnd], open = true }) {
  const h = Math.tan(angle) * w;

  // plug the middle
  context.beginPath();
  context.strokeStyle = colors.bg;
  lineVertical(context, w, x, [yStart * w, yEnd * w - h]);
  context.stroke();

  // Draw the rest of the pipe around it
  linspace(size).forEach((_, idx) => {
    const step = idx + 1;
    const yOff = h * step;

    context.beginPath();
    context.strokeStyle = (x + step) % 2 === 0 ? colors.light : colors.bg;
    lineVertical(context, w, x - step, [yStart * w, yEnd * w - yOff]);
    lineDiagonal(context, w, {
      x: x - step,
      y: yEnd * w - yOff,
      span: step,
      direction: 'up',
    });
    context.lineTo(w * (x + step), yEnd * w - yOff);
    lineVertical(context, w, x + step, [yEnd * w - yOff, yStart * w], false);
    context.stroke();
  });

  // Perspective colouring
  context.fillStyle = `rgba(23, 23, 23, 0.5)`;
  if (open) {
    // inside
    context.beginPath();
    context.moveTo(w * x, yEnd * w);
    context.lineTo(w * x, yEnd * w - 2 * h * size);
    context.lineTo(w * (x + size), yEnd * w - h * size);
    context.closePath();
    context.fill();
  }
  // outside
  context.beginPath();
  context.moveTo(w * x, yEnd * w);
  context.lineTo(w * x, yStart * w);
  context.lineTo(w * (x - size), yStart * w);
  context.lineTo(w * (x - size), yEnd * w - h * size);
  context.closePath();
  context.fill();
}

function randomLocation(min, max) {
  const t = Random.rangeFloor(min, max);
  return t % 2 === 0 ? t + 1 : t;
}

function randomSize(x, [xMin, xMax], [min, max]) {
  let t = Random.rangeFloor(min, max);
  t = t % 2 === 0 ? t : t + 1;

  if (x + t > xMax) {
    t = t - (x + t - xMax);
    return t % 2 === 0 ? t : t + 1;
  } else if (x - t < xMin) {
    t = t - (xMin - (x - t));
    return t % 2 === 0 ? t : t + 1;
  }
  return t;
}
