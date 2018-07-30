/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const { heading, calcVec, normalize } = require('./math');

const simplex = new SimplexNoise(Math.random);

const settings = {
  animate: true,
  duration: 12,
  dimensions: [640, 640],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 60,
};

const clrs = {
  red: '#da3900',
  blue: '#e1e9ee',
  gray: ['#262626', '#757575', '#e9e9e9'],
  white: '#ffffff',
};

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = clrs.gray[0];
    context.fillRect(0, 0, width, height);

    const gridSize = 7;
    const padding = width * 0.2;
    const tileSize = (width - padding * 2) / gridSize;

    const t = [
      simplex.noise2D(playhead, playhead),
      simplex.noise2D(playhead + height, playhead + height),
    ];
    const cx = normalize(t[0], -1, 1, 0, width, true);
    const cy = normalize(t[1], -1, 1, 0, height, true);

    const length = tileSize * 0.65;
    const thickness = tileSize * 0.1;
    const initialRotation = Math.PI / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
        const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, width - padding, u),
          y: lerp(padding, height - padding, v),
        };

        // Draw
        context.save();
        context.fillStyle = clrs.blue;

        const rotation = heading(calcVec(t.x - cx, t.y - cx));

        // Rotate in place
        context.translate(t.x, t.y);
        context.rotate(rotation);
        context.translate(-t.x, -t.y);

        // Draw the line
        context.fillRect(
          t.x - length / 2,
          t.y - thickness / 2,
          length,
          thickness,
        );
        context.restore();
      }
    }

    // Debug field origin
    context.save();
    context.fillStyle = clrs.red;
    const s = 10;
    context.fillRect(cx - s / 2, cy - s / 2, s, s);
    context.restore();
  };
}, settings);
