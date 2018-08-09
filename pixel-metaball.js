const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const { squareGrid } = require('./grid');
const { randomNumber } = require('./math');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [640, 640],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
  clrs: [
    ['#111113', '#8925DD', '#40EDE8'],
    ['#462A4A', '#A04595', '#EA433E'],
    ['#FEE6EC', '#353FFB', '#FDFD72'],
    ['#e3a943', '#c37a01', '#f8a006'],
    ['#290d0c', '#c41a1d', '#e4413f'],
    ['#620a09', '#9f0f0c', '#800c0a'],
    // ['#f6bfb1', '#f76246', '#e82e20'],
    ['#f6bfb1', '#e82e20', '#e82e20'],
  ],
  size: 1.2,
};

canvasSketch(() => {
  const SUM_THRESHOLD = 1;
  const NUM_CIRCLES = 5;
  const RESOLUTION = 128;
  const scale = chroma
    .scale(settings.clrs[settings.clrs.length - 1])
    .domain([0, SUM_THRESHOLD, SUM_THRESHOLD * 8]);

  let circles = [];
  for (var i = 0; i < NUM_CIRCLES; i++) {
    circles.push({
      // x: randomNumber(
      //   settings.dimensions[0] * 0.4,
      //   settings.dimensions[0] * 0.8,
      // ),
      // y: randomNumber(
      //   settings.dimensions[1] * 0.6,
      //   settings.dimensions[1] * 0.8,
      // ),
      // r: randomNumber(40 * 1.25, 80 * 1.25),
      x: randomNumber(0, settings.dimensions[0]),
      y: randomNumber(0, settings.dimensions[1]),
      r: randomNumber(40, 80),
      vx: randomNumber(-5, 5),
      vy: randomNumber(-5, 5),
    });
  }

  return ({ context, frame, width, height, playhead }) => {
    // Clear
    context.clearRect(0, 0, width, height);
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);

    // Move the circles
    circles.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;

      if (c.x - c.r < 0) {
        c.vx = +Math.abs(c.vx);
      }
      if (c.x + c.r > width) {
        c.vx = -Math.abs(c.vx);
      }
      if (c.y - c.r < 0) {
        c.vy = +Math.abs(c.vy);
      }
      if (c.y + c.r > height) {
        c.vy = -Math.abs(c.vy);
      }
    });

    // Draw the metaballs
    squareGrid({
      size: width,
      resolution: RESOLUTION,
      padding: 0,
      forEach: ({ x, y, s }) => {
        const sum = circles.reduce((sum, c) => {
          const dx = x - c.x;
          const dy = y - c.y;
          const d2 = dx * dx + dy * dy;
          return sum + (c.r * c.r) / d2;
        }, 0);

        // Draw the pixel
        // if (sum > SUM_THRESHOLD) {
        const a = s * settings.size;
        context.save();
        context.fillStyle = scale(sum);
        context.fillRect(x - a / 2, y - a / 2, a, a);
        context.restore();
      },
    });
  };
}, settings);
