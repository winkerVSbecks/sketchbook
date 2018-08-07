const canvasSketch = require('canvas-sketch');
const { squareGrid } = require('./grid');
const { randomNumber } = require('./math');

const settings = {
  animate: true,
  duration: 6,
  dimensions: [640, 640],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

canvasSketch(() => {
  const SUM_THRESHOLD = 3;
  const NUM_CIRCLES = 10;
  const RESOLUTION = 128;
  let circles = [];
  for (var i = 0; i < NUM_CIRCLES; i++) {
    circles.push({
      x: randomNumber(0, settings.dimensions[0]),
      y: randomNumber(0, settings.dimensions[1]),
      r: randomNumber(40, 80),
      vx: randomNumber(-5, 5),
      vy: randomNumber(-5, 5),
      red: randomNumber(50, 255),
      green: randomNumber(50, 255),
      blue: randomNumber(50, 255),
    });
  }

  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#2D2B36';
    context.fillRect(0, 0, width, height);

    for (var i = 0; i < circles.length; i++) {
      var c = circles[i];

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
    }

    // context.fillStyle = 'white';

    squareGrid({
      size: width,
      resolution: RESOLUTION,
      padding: 0,
      forEach: ({ x, y, s }) => {
        // Draw the pixel
        var sum = 0;
        var closestD2 = Infinity;
        var closestColor = null;
        for (var i = 0; i < circles.length; i++) {
          var c = circles[i];
          var dx = x - c.x;
          var dy = y - c.y;
          var d2 = dx * dx + dy * dy;
          sum += (c.r * c.r) / d2;

          if (d2 < closestD2) {
            closestD2 = d2;
            closestColor = [c.red, c.green, c.blue];
          }
        }
        if (sum > SUM_THRESHOLD) {
          const a = s * 0.65;
          context.save();
          context.fillStyle = '#2E40FB';
          context.fillRect(x - a / 2, y - a / 2, a, a);
          context.restore();
        }
      },
    });
  };
}, settings);
