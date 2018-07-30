/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { heading, calcVec, normalize } = require('./math');

const simplex = new SimplexNoise('1234567890abcdefghijklmnopqrstuvwxyz');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [800, 600],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

const colourScale = chroma
  .cubehelix()
  .rotations(3)
  .gamma(0.5)
  .scale()
  .correctLightness()
  .domain([-1, 1]);

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const gridSize = 48;
    const padding = height * 0.2;
    const tileSize = (height - padding * 2) / gridSize;
    const length = tileSize;
    const thickness = tileSize * 0.05;
    const time = Math.sin(playhead * 2 * Math.PI);

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

        const n = simplex.noise3D(x / (gridSize * 2), y / (gridSize * 2), time);

        // Draw
        context.save();
        context.fillStyle = colourScale(n);

        const rotation = n * Math.PI;
        const l =
          length / 2 +
          (normalize(
            simplex.noise3D(
              x / (gridSize * 2) + 10000,
              y / (gridSize * 2) + 10000,
              time,
            ),
            -1,
            1,
            -0.5,
            1,
          ) *
            length) /
            2;

        // Rotate in place
        context.translate(t.x, t.y);
        context.rotate(rotation);
        context.translate(-t.x, -t.y);

        // Draw the line
        context.beginPath();
        context.arc(t.x, t.y, l / 4, 0, 2 * Math.PI, false);
        context.fill();
        context.restore();
      }
    }
  };
}, settings);
