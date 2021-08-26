const canvasSketch = require('canvas-sketch');
const { mapRange, linspace, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const MarchingSquaresJS = require('marchingsquares');
const stackblur = require('stackblur');

const settings = {
  animate: true,
  duration: 4,
  dimensions: [1080, 1080],
  scaleToView: false,
};

const config = {
  resolution: 128 * 2,
  frequency: 0.75,
  amplitude: 1,
};

const gridSize = [config.resolution, config.resolution];

Random.setSeed('chromatic-noise-frosted');

canvasSketch(() => {
  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    // context.fillStyle = '#2a0481';
    context.fillStyle = '#131217'; // '#001';
    context.fillRect(0, 0, width, height);

    const padding = height * 0.2;
    const off = 0.005;

    const config = [
      {
        time: Math.sin(playhead * Math.PI - Math.PI * off * 3),
        color: '#FF0000',
      },
      {
        time: Math.sin(playhead * Math.PI - Math.PI * off * 2),
        color: '#00FF00',
      },
      {
        time: Math.sin(playhead * Math.PI - Math.PI * off),
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

    context.lineWidth = 24;
    bands.forEach((l) => {
      drawLines(l.lines, l.color, context);
    });

    // Apply blur
    const imageData = context.getImageData(0, 0, width, height);
    stackblur(imageData.data, width, height, 24);
    context.putImageData(imageData, 0, 0);
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

      const _n = Random.noise3D(
        x / (gridSize[0] * 0.75),
        y / (gridSize[1] * 0.75),
        time * 0.5,
        config.frequency,
        config.amplitude
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
