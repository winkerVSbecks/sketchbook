const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { normalize, noiseGrid } = require('./math');

const simplex = new SimplexNoise(
  '1234567890abcdefghijklmnopqrstuvwxyz',
  //'@$!@£$@£!@%@£$£@1234567890abcdefghijklmnopqrstuvwxyz',
);

const settings = {
  animate: true,
  duration: 4,
  dimensions: [800, 800],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

const colourScale = chroma
  // .scale('Spectral')
  .scale('YlGnBu')
  // .cubehelix()
  // .rotations(3)
  // .scale()
  // .correctLightness()
  .domain([-1, 1]);

canvasSketch(() => {
  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const gridSize = 48;
    const padding = 0; // width * 0.2;
    const tileSize = (width - padding * 2) / gridSize;
    const length = tileSize;
    const thickness = tileSize * 1.1;
    const time = Math.sin(playhead * 2 * Math.PI);
    const noise = noiseGrid(simplex, gridSize);

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

        const n = normalize(noise(x, y, time), -1, 1, 0, 1);
        const n1 = normalize(noise(x, y, time, 100000), -1, 1, 0, 1);
        const n2 = noise(x, y, time, 10000);
        const n3 = noise(x, y, time, 2918342);

        // Draw
        context.save();
        context.fillStyle = '#fff'; // colourScale(n2);

        context.translate(t.x, t.y);
        context.transform(1 * n, 0.2 * n2, 0.2 * n3, 1 * n1, 0, 0);
        context.translate(-t.x, -t.y);

        context.fillRect(
          t.x - thickness,
          t.y - thickness,
          thickness,
          thickness,
        );
        context.fill();
        context.restore();
      }
    }
  };
}, settings);
