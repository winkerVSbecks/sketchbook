const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const { normalize, noiseGrid } = require('./math');
const { drawEqTriangle } = require('./geometry');

const simplex = new SimplexNoise('1234567890abcdefghijklmnopqrstuvwxyz');

const settings = {
  animate: true,
  duration: 4,
  dimensions: [800, 800],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

const clrs = {
  black: '#070512',
  purple: '#30145D',
  red: '#FB1A33',
  blue: '#08E7E4',
  green: '#14D45D',
  lightGreen: '#9BFDAA',
};

const pos = [0, 1, 2].map(() => [Math.random() * 50, Math.random() * 50]);

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = clrs.black;
    context.fillRect(0, 0, width, height);
    const time = Math.sin(playhead * Math.PI);
    const noiseX = (x, y, offset = 0) =>
      normalize(simplex.noise3D(x + offset, y + offset, time), -1, 1, -1, 1);
    const noiseY = (x, y, offset = 0) =>
      normalize(simplex.noise3D(x + offset, y + offset, time), -1, 1, -1, 1);

    const n = [
      { x: noiseX(...pos[0], time, 0), y: noiseY(...pos[0], time, 10000) },
      {
        x: noiseX(...pos[1], time, 1298431029),
        y: noiseY(...pos[1], time, 298490332),
      },
      {
        x: noiseX(...pos[2], time, 324873294),
        y: noiseY(...pos[2], time, 9473874),
      },
    ];
    const w = width * 0.8;
    const h = (height * 0.8 * 3) / 4;
    const side = width * 0.2;
    const [cx, cy] = [width / 2, height / 2];

    pos[2].x =
      width / 2 +
      (width / 2) * normalize(Math.pow(Math.sin(time), 3), 0, 0.6, 1, -1);
    pos[2].y =
      height / 2 +
      (height / 4) * normalize(Math.pow(Math.sin(time), 8), 0, 0.3, 1, -1);
    // Math.sin(time) * Math.sin(time * 1.5);
    // Math.sin(Math.exp(Math.cos(time * 0.8)) * 2)
    // normalize(, -0.7, -1.1, -1, 1); // simplex.noise3D(0, 1, time);
    // normalize(Math.sin(Math.tan(Math.cos(time) * 1.2)), 0.5, 1, -1, 1);

    drawEqTriangle(context, side, cx, cy, clrs.green);
    context.lineWidth = width * 0.015;
    // context.strokeStyle = clrs.red;
    // context.strokeRect(side + n[0].x, side + n[0].y, w, h);

    // context.strokeStyle = clrs.blue;
    // context.strokeRect(side + n[1].x, side + n[1].y, w, h);

    context.strokeStyle = clrs.lightGreen;
    context.strokeRect(pos[2].x, pos[2].y, w / 3, h / 3);
  };
}, settings);
