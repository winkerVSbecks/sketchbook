const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const MarchingSquaresJS = require('marchingsquares');

// 1234567890abcdefghijklmnopqrstuvwxyz
const simplex = new SimplexNoise('noise');

const settings = {
  animate: true,
  duration: 4,
  // dimensions: [800, 400],
  dimensions: [660, 320],
  // dimensions: [1062, 300],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

const colourScale = chroma.scale().domain([0, 1]);
const gridSize = [64 * 2, 48 * 2];

canvasSketch(() => {
  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    // context.fillStyle = '#2a0481';
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const padding = height * 0.2;
    const tileSize = [
      (width - padding * 2) / gridSize[0],
      (height - padding * 2) / gridSize[1],
    ];
    const length = [tileSize[0] * 1.1, tileSize[1] * 1.1];
    const time = Math.sin(playhead * Math.PI);

    let data = [];

    for (let y = 0; y < gridSize[1]; y++) {
      data[y] = [];
      for (let x = 0; x < gridSize[0]; x++) {
        // get a 0..1 UV coordinate
        const u = gridSize[0] <= 1 ? 0.5 : x / (gridSize[0] - 1);
        const v = gridSize[1] <= 1 ? 0.5 : y / (gridSize[1] - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, width - padding, u),
          y: lerp(padding, height - padding, v),
        };

        const _n = simplex.noise3D(
          x / (gridSize[0] * 0.75),
          y / (gridSize[1] * 0.75),
          time * 0.5
        );

        const n = mapRange(_n, -1, 1, 0, 1);

        data[y].push(n);

        // context.fillStyle = colourScale(n);
        // context.beginPath();
        // context.fillRect(t.x, t.y - length[1], length[0], length[1]);
      }
    }

    const lines = drawIsoLines(data, [width, height]);

    const gradient = context.createLinearGradient(0, 0, width, height);

    gradient.addColorStop(0, 'rgb(86, 119, 254, 0.1)');
    gradient.addColorStop(1, 'rgb(255, 115, 0, 0.1)');
    context.strokeStyle = gradient;
    context.strokeStyle = '#f1f9fe';
    context.lineWidth = 4;

    lines.forEach((line) => {
      const [start, ...pts] = line;

      context.beginPath();
      context.moveTo(...start);
      pts.forEach((pt) => {
        context.lineTo(...pt);
      });

      context.stroke();
    });
  };
}, settings);

function drawIsoLines(noiseData, [sizeX, sizeY]) {
  const intervals = linspace(12);
  const lines = [];

  intervals.forEach((_, idx) => {
    if (idx > 0) {
      const lowerBand = intervals[idx - 1];
      const upperBand = intervals[idx];

      MarchingSquaresJS.isoBands(noiseData, lowerBand, upperBand - lowerBand, {
        successCallback(bands) {
          bands.forEach((band) => {
            const scaledBand = band.map(([x, y]) => {
              return [
                mapRange(x, 0, gridSize[0] - 1, 0, sizeX),
                mapRange(y, 0, gridSize[1] - 1, 0, sizeY),
              ];
            });

            lines.push(drawShape(scaledBand));
          });
        },
        noQuadTree: true,
        noFrame: true,
      });
    }
  });

  const margin = sizeY * 0.04;

  return clipPolylinesToBox(lines, [
    margin,
    margin,
    sizeX - margin,
    sizeY - margin,
  ]);
}

function drawShape([start, ...pts]) {
  return [start, ...pts, start];
}
