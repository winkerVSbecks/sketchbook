const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { heading, calcVec, normalize } = require('./math');

const settings = {
  dimensions: [800, 800],
  scaleToView: true,
  duration: 5,
  animate: true,
};

const opts = [
  {
    bg: '#F1E7F0',
    shadow: '#E0C4D0',
    fg: '#FF2952',
    shadowX: -1,
    shadowY: 1,
  },
  {
    bg: '#B8C4DA',
    shadow: '#BBD2F4',
    fg: '#101741',
    shadowX: 1,
    shadowY: -1,
  },
  {
    bg: '#fff',
    shadow: '#E1E9EE',
    fg: '#262626',
    shadowX: 1,
    shadowY: -1,
  },
][2];

canvasSketch(() => {
  let columns = [];
  let offset = 0;
  const gridSize = 60;
  const padding = 80;

  return {
    begin({ context, frame, width, height }) {
      columns = [];
      offset = 0;
      const tileSize = (width - padding * 2) / gridSize;
      for (let x = 0; x < gridSize; x++) {
        const steps = [];
        for (let y = 0; y < gridSize; y++) {
          steps.push(createStep(context, x, y, padding, tileSize));
        }
        columns.push(steps);
      }
    },
    render({ context, width, height, frame }) {
      const tileSize = (width - padding * 2) / gridSize;
      const thickness = 2;

      if (frame % ((settings.duration * 24) / gridSize) === 0) {
        offset = offset + tileSize;
        columns.forEach((steps, x) => {
          // Random
          // steps.pop();
          // steps.forEach(step => step.update());
          // steps.unshift(createStep(context, x, 0, padding, tileSize));

          // Cycle
          const first = steps.pop();
          steps.unshift(first);
          steps.forEach((step, idx) => step.update(idx));
        });
      }

      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = opts.bg;
      context.fillRect(0, 0, width, height);

      // Draw shadow
      context.lineWidth = thickness;
      context.strokeStyle = opts.fg;
      context.strokeStyle = opts.shadow;
      columns.forEach(steps => {
        context.beginPath();
        steps.forEach(step =>
          step.draw(opts.shadowX * thickness, opts.shadowY * thickness),
        );
        context.closePath();
        context.stroke();
      });

      // Draw lines
      context.strokeStyle = opts.fg;
      columns.forEach(steps => {
        context.beginPath();
        steps.forEach(step => step.draw(0, 0));
        context.closePath();
        context.stroke();
      });
    },
  };
}, settings);

function createStep(context, x, y, padding, tileSize) {
  y = 0;
  const skip = Random.weightedSet([
    {
      value: false,
      weight: 300,
    },
    {
      value: true,
      weight: 100,
    },
  ]);

  const rotation = Random.weightedSet([
    {
      value: Math.PI / 2,
      weight: 300,
    },
    {
      value: 0,
      weight: 50,
    },
  ]);

  const a = [padding + x * tileSize, padding + y * tileSize];

  const b = [
    a[0] + tileSize * Math.cos(rotation),
    a[1] + tileSize * Math.sin(rotation),
  ];

  let offset = 0;

  // Draw
  if (skip) {
    return {
      draw(offX, offY) {
        context.moveTo(b[0] + offX, b[1] + offY + offset);
      },
      update(idx) {
        offset = idx * tileSize;
      },
    };
  } else if (rotation === 0) {
    return {
      draw(offX, offY) {
        context.lineTo(
          a[0] + tileSize * Math.cos(rotation) + offX,
          a[1] + offY + offset,
        );
        context.moveTo(a[0] + offX, a[1] + tileSize + offY + offset);
      },
      update(idx) {
        offset = idx * tileSize;
      },
    };
  } else {
    return {
      draw(offX, offY) {
        context.moveTo(a[0] + offX, a[1] + offY + offset);
        context.lineTo(b[0] + offX, b[1] + offY + offset);
      },
      update(idx) {
        offset = idx * tileSize;
      },
    };
  }
}
