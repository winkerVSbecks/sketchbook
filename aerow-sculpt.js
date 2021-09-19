const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const MarchingSquaresJS = require('marchingsquares');
const PoissonDiskSampling = require('poisson-disk-sampling');

const settings = {
  animate: true,
  duration: 4,
  dimensions: [1080, 1080],
};

const gridSize = [128 * 4, 128 * 4];

canvasSketch(({ width, height }) => {
  const poissonDiskSamples = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: width * 0.25,
    maxDistance: width * 0.5,
  });

  const circles = poissonDiskSamples.fill().map(([x, y]) => {
    return {
      x,
      y,
      r: Random.range(width * 0.0625, width * 0.125),
    };
  });

  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    circles.forEach(({ x, y, r }) => {
      context.fillStyle = '#FB2536';
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI);
      context.fill();
    });

    const time = Math.sin(playhead * Math.PI);

    const data = noiseData(gridSize, time);
    const lines = noiseToIsoLines(data, [width, height]);
    drawLines(context, lines, '#111');
  };
}, settings);

function noiseData(gridSize, time) {
  let data = [];

  for (let y = 0; y < gridSize[1]; y++) {
    data[y] = [];
    for (let x = 0; x < gridSize[0]; x++) {
      // const value = Random.noise3D(x, y, time, 0.04, 8);
      const value = Random.noise3D(x, y, time * 50, 0.005, 2);
      data[y].push(value);
    }
  }

  return data;
}

function drawLines(context, lines, color) {
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  lines.forEach((line) => {
    const [start, ...pts] = line;

    context.beginPath();
    context.moveTo(...start);
    pts.forEach((pt) => {
      context.lineTo(...pt);
    });

    context.fill();
    context.stroke();
  });
}

function noiseToIsoLines(noiseData, [sizeX, sizeY]) {
  const intervals = [0.2, 0.4]; // linspace(12);
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

  return lines;
}

function drawShape([start, ...pts]) {
  return [start, ...pts, start];
}
