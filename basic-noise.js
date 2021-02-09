/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { heading, calcVec, normalize } = require('./math');

// 1234567890abcdefghijklmnopqrstuvwxyz
const simplex = new SimplexNoise();

const settings = {
  // animate: true,
  duration: 8,
  // dimensions: [800, 800],
  dimensions: [800, 400],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

const colourScale = chroma.scale().domain([1, -1]);

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const gridSize = [64, 48];
    const padding = 0; // height * 0.2;
    const tileSize = [
      (width - padding * 2) / gridSize[0],
      (height - padding * 2) / gridSize[1],
    ];
    const length = [tileSize[0] * 1.1, tileSize[1] * 1.1];
    const time = Math.sin(playhead * 2 * Math.PI);

    for (let x = 0; x < gridSize[0]; x++) {
      for (let y = 0; y < gridSize[1]; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize[0] <= 1 ? 0.5 : x / (gridSize[0] - 1);
        const v = gridSize[1] <= 1 ? 0.5 : y / (gridSize[1] - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, width - padding, u),
          y: lerp(padding, height - padding, v),
        };

        const n = simplex.noise3D(
          x / (gridSize[0] * 0.5),
          y / (gridSize[1] * 0.5),
          time
        );

        // Draw
        context.save();
        context.fillStyle = colourScale(n);

        context.beginPath();
        context.fillRect(t.x, t.y - length[1], length[0], length[1]);
        context.restore();
      }
    }
  };
}, settings);
