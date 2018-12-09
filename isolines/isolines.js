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

  return props => {
    const { width, height } = props;
    const size = height * 0.8;
    const offset = [(width - size) / 2, (height - size) / 2];
    const padding = size * 0.1;

    drawIsolines(props, { size, offset, padding });
    drawShell(props, { size, offset, padding });
    drawLabel(props, { size, offset, padding });
  };

  function drawIsolines(
    { context, width, height, playhead },
    { size, offset, padding },
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
        // get a 0..1 UV coordinate
        const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
        const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, size - padding, u),
          y: lerp(padding, size - padding, v),
        };

        const scale = gridSize;
        const n = Random.noise3D(x / scale, y / scale, time);
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
            // linearRing: false,
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
    { context, width, height, playhead, duration },
    { size, offset, padding },
  ) {
    const opacity = 1 - beat(playhead, 0.5, duration * 10);

    context.font = `${size * 0.04}px courier`;
    context.fillStyle = '#fff'; //`rgba(255, 255, 255, ${opacity})`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(
      `C O N T O U R                 ${Math.abs(
        Random.noise1D(playhead),
      ).toFixed(2)}°`,
      padding * 0.8 + offset[0],
      offset[1] + size - padding * 0.4,
    );
  }
}, settings);
