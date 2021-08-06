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
  dimensions: [800 * 2, 600 * 2],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

const colourScale = chroma.scale('Spectral').mode('lch').domain([-1, 1]);

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#222';
    context.fillRect(0, 0, width, height);

    const gridSize = 24;
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

        const rotation = n * Math.PI;
        const l = length / 2;
        // const l =
        //   length / 2 +
        //   (normalize(
        //     simplex.noise3D(
        //       x / (gridSize * 2) + 10000,
        //       y / (gridSize * 2) + 10000,
        //       time,
        //     ),
        //     -1,
        //     1,
        //     -0.5,
        //     1,
        //   ) *
        //     length) /
        //     2;

        context.translate(t.x, t.y);
        context.rotate(rotation);
        context.translate(-t.x, -t.y);

        context.fillStyle = colourScale(n);
        context.beginPath();
        context.arc(t.x, t.y, l / 2 + (l / 2) * n, 0, Math.PI, false);
        context.fill();
        context.restore();
      }
    }
  };
}, settings);
