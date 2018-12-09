const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const MarchingSquaresJS = require('marchingsquares');
const { mapRange, lerp, linspace } = require('canvas-sketch-util/math');
const { drawShape } = require('../geometry');
const { beat } = require('../easings');

const settings = {
  animate: true,
  duration: 6,
  dimensions: [800, 600],
  scaleToView: true,
};

canvasSketch(() => {
  Random.permuteNoise();
  const intervals = linspace(12);
  let timeShift = 0;

  return props => {
    const { width, height } = props;
    const size = height * 0.8;
    const offset = [(width - size) / 2, (height - size) / 2];
    const padding = size * 0.1;
    timeShift++;

    drawIsolines(props, { size, offset, padding, timeShift });
    drawShell(props, { size, offset, padding });
    drawLabel(props, { size, offset, padding, timeShift });
  };

  function drawIsolines(
    { context, width, height, playhead },
    { size, offset, padding, timeShift },
  ) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const gridSize = 100;

    const tileSize = (width - padding * 2) / gridSize;
    const time = Math.sin(playhead * Math.PI);
    let data = [];

    for (let y = 0; y < gridSize; y++) {
      data[y] = [];
      for (let x = 0; x < gridSize; x++) {
        const scale = gridSize;
        const n = Random.noise3D((x + timeShift) / scale, y / scale, 1);
        data[y].push(mapRange(n, -1, 1, 0, 1));
      }
    }

    context.strokeStyle = '#fff';
    context.lineWidth = 4;
    context.lineJoin = 'round';

    intervals.forEach((step, idx) => {
      if (idx > 0) {
        const lowerBand = intervals[idx - 1];
        const upperBand = intervals[idx];
        const band = MarchingSquaresJS.isoBands(
          data,
          lowerBand,
          upperBand - lowerBand,
          {
            successCallback(bands) {
              bands.forEach(band => {
                const scaledBand = band.map(([x, y]) => [
                  offset[0] + mapRange(x, 0, 99, padding, size - padding),
                  offset[1] + mapRange(y, 0, 99, padding, size - padding),
                ]);
                drawShape(context, scaledBand);
                context.stroke();
              });
            },
            noQuadTree: true,
          },
        );
      }
    });
  }

  function drawShell({ context, width, height }, { size, offset, padding }) {
    context.beginPath();
    context.rect(
      offset[0] + padding * 0.8,
      offset[1] + padding * 0.8,
      size - 1.6 * padding,
      size - 1.6 * padding,
    );
    context.strokeStyle = '#fff';
    context.lineJoin = 'miter';
    context.lineWidth = 6;
    context.stroke();
    context.closePath();

    context.beginPath();
    context.rect(
      offset[0] + padding,
      offset[1] + padding,
      size - 2 * padding,
      size - 2 * padding,
    );
    context.strokeStyle = '#000';
    context.lineWidth = 6;
    context.stroke();
    context.closePath();
  }

  function drawLabel(
    { context, width, height, playhead },
    { size, offset, padding, timeShift },
  ) {
    const info = [
      Math.floor(mapRange(Random.noise2D(playhead, timeShift), -1, 1, 10, 99)),
      Math.floor(mapRange(Random.noise1D(playhead), -1, 1, 10, 99)),
    ];

    context.font = `${size * 0.04}px courier`;
    context.fillStyle = '#fff';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(
      `C O N T O U R              [${info.join(', ')}]`,
      padding * 0.8 + offset[0],
      offset[1] + size - padding * 0.4,
    );
  }
}, settings);
