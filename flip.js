const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { lerp, linspace, mapRange } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const clrs = require('./clrs').clrs();

const USE_NOISE = false;

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: USE_NOISE ? 8 : 4,
};

const sketch = () => {
  let angles = [];
  let colors = [];
  const foreground = clrs.ink();
  const background = clrs.bg;

  return ({ context, width, height, playhead }) => {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const pingPongPlayhead = Math.sin(2 * Math.PI * playhead);

    const res = USE_NOISE ? 20 : 13;
    const tileSize = width / res;

    let lines = [];

    for (let x = 1; x <= res; x++) {
      for (let y = 1; y <= res; y++) {
        const minX = tileSize * (x - 1);
        const maxX = tileSize * x;

        const minY = tileSize * (y - 1);
        const maxY = tileSize * y;

        const index = x + res * y;

        angles[index] = angles[index]
          ? angles[index]
          : angle([x, y], [7, 7], res / 2);

        colors[index] = colors[index] ? colors[index] : clrs.ink();

        const sign = 1; // x > res / 2 ? -1 : 1;

        const a = mapRange(
          Random.noise3D(x / res, y / res, pingPongPlayhead),
          0,
          1,
          0,
          1
        );

        const shift = USE_NOISE
          ? a
          : sign * angles[index] + sign * 1 * pingPongPlayhead;

        const tileLines = linspace(12, true)
          .map((t) => mapRange(t, 0, 1, -1, 2))
          .map((t) => [
            [lerp(minX, maxX, t + shift), minY],
            [lerp(minX, maxX, t - shift), maxY],
          ]);

        // lines.push(...clipPolylinesToBox(tileLines, [minX, minY, maxX, maxY]));
        context.strokeStyle = foreground; // colors[index];
        context.lineWidth = USE_NOISE
          ? 4
          : mapRange(Math.abs(angles[index]), 0, 0.25, 4, 6);

        clipPolylinesToBox(tileLines, [minX, minY, maxX, maxY]).forEach(
          drawLine(context)
        );
      }
    }
  };
};

canvasSketch(sketch, settings);

function angle([x, y], [cx, cy], radius) {
  const d = Math.hypot(x - cx, y - cy);

  return mapRange(d, 0, radius, -0.25, 0.5);
}

function drawLine(context) {
  return ([[x1, y1], [x2, y2]]) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  };
}
