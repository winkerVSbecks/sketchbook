/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { heading, calcVec, normalize } = require('./math');

const simplex = new SimplexNoise('81234n32478320');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [1600, 1600],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

const clrs = {
  red: '#da3900',
  blue: '#e1e9ee',
  gray: ['#262626', '#757575', '#e9e9e9'],
  white: '#ffffff',
};

const colourScale = chroma
  .scale([clrs.gray[1], clrs.blue, clrs.red])
  .domain([-1, 1]);

canvasSketch(() => {
  let z = 0;
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = clrs.gray[0];
    context.fillRect(0, 0, width, height);

    const gridSize = 30;
    const padding = height * 0.15;
    const tileSize = (height - padding * 2) / gridSize;
    const length = tileSize * 0.65;
    const thickness = tileSize * 0.1;
    const time = Math.sin(playhead * 2 * Math.PI);
    z = z + 0.01;

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
        const clr = simplex.noise3D(
          x / (gridSize * 2) + 10000,
          y / (gridSize * 2) + 10000,
          time
        );
        context.fillStyle = colourScale(clr);

        const rotation =
          simplex.noise3D(x / gridSize, y / gridSize, time) * Math.PI;
        const l =
          length / 2 +
          (normalize(
            simplex.noise3D(
              x / (gridSize * 2) + 10000,
              y / (gridSize * 2) + 10000,
              time
            ),
            -1,
            1,
            -0.5,
            1
          ) *
            length) /
            2;

        // Rotate in place
        context.translate(t.x, t.y);
        context.rotate(rotation);
        context.translate(-t.x, -t.y);

        // Draw the line
        context.fillRect(t.x, t.y - thickness, l, thickness);
        context.restore();
      }
    }
  };
}, settings);
