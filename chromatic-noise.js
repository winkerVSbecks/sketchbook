const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const MarchingSquaresJS = require('marchingsquares');

const simplex = new SimplexNoise();
// 'chromatic';

const settings = {
  animate: true,
  duration: 6,
  dimensions: [1080, 1080],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

const colourScale = chroma.scale().domain([0, 1]);
const gridSize = [128 * 2, 128 * 2];

canvasSketch(() => {
  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    // context.fillStyle = '#2a0481';
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const padding = height * 0.2;
    const off = 0.005;

    const config = [
      {
        time: Math.sin(playhead * Math.PI + Math.PI * off * 3),
        color: '#FF0000',
      },
      {
        time: Math.sin(playhead * Math.PI + Math.PI * off * 2),
        color: '#00FF00',
      },
      {
        time: Math.sin(playhead * Math.PI + Math.PI * off),
        color: '#0000FF',
      },
      { time: Math.sin(playhead * Math.PI), color: '#fff' },
    ];

    let data = config.map((c) => ({
      color: c.color,
      data: noiseData(c.time, padding, width, height),
    }));

    const bands = data.map((c) => ({
      color: c.color,
      lines: drawIsoLines(c.data, [width, height]),
    }));

    context.lineWidth = 12;

    bands.forEach((l) => {
      drawLines(l.lines, l.color, context);
    });
  };
}, settings);

function noiseData(time, padding, width, height) {
  const data = [];

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
    }
  }

  return data;
}

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

function drawLines(lines, color, context) {
  context.strokeStyle = color;

  lines.forEach((line) => {
    const [start, ...pts] = line;

    context.beginPath();
    context.moveTo(...start);
    pts.forEach((pt) => {
      context.lineTo(...pt);
    });

    context.stroke();
  });
}

function drawShape([start, ...pts]) {
  return [start, ...pts, start];
}
