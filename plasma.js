/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { heading, calcVec, normalize } = require('./math');

// const simplex = new SimplexNoise('1234567890abcdefghijklmnopqrstuvwxyz');
const simplex = new SimplexNoise('random');

const settings = {
  animate: true,
  duration: 8,
  // dimensions: [800, 800],
  dimensions: [1920, 1080],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

const MODE = 'PLASMA'; // B/W

const colourScale =
  MODE === 'B/W'
    ? (v) => {
        const b = mapRange(v, -1, 1, 0, 255);
        return `rgb(${b},${b},${b})`;
      }
    : chroma
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

    const gridSize = MODE === 'B/W' ? [16 * 4, 9 * 4] : [32, 24];
    const padding = 0; // height * 0.2;
    const tileSizeX = (width - padding * 2) / gridSize[0];
    const tileSizeY = (height - padding * 2) / gridSize[1];
    const length = [tileSizeX * 1.1, tileSizeY * 1.1];
    const time = Math.sin(playhead * 2 * Math.PI);

    for (let x = 0; x < gridSize[0]; x++) {
      for (let y = 0; y < gridSize[0]; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize[0] <= 1 ? 0.5 : x / (gridSize[0] - 1);
        const v = gridSize[1] <= 1 ? 0.5 : y / (gridSize[1] - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, width - padding, u),
          y: lerp(padding, height - padding, v),
        };

        const scale = MODE === 'B/W' ? 0.4 : 2;

        const n = simplex.noise3D(
          x / (gridSize[0] * scale),
          y / (gridSize[1] * scale),
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
