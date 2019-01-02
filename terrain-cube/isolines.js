const MarchingSquaresJS = require('marchingsquares');
const { lerp, mapRange, linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

Random.permuteNoise();
const intervals = linspace(12);

function isolines({ y, size, offset }, playhead, renderCb) {
  const gridSize = 100;

  const time = Math.sin(playhead * Math.PI);
  let data = [];

  for (let y = 0; y < gridSize; y++) {
    data[y] = [];
    for (let x = 0; x < gridSize; x++) {
      // get a 0..1 UV coordinate
      const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
      const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

      // scale to dimensions
      const t = {
        x: lerp(0, size - 0, u),
        y: lerp(0, size - 0, v),
      };

      const scale = gridSize;
      const n = Random.noise3D(x / scale, y / scale, time);
      data[y].push(mapRange(n, -1, 1, 0, 1));
    }
  }

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
              const scaledBand = band.map(([x, z]) => [
                offset[0] + mapRange(x, 0, 99, -size, size),
                y,
                offset[1] + mapRange(z, 0, 99, -size, size),
              ]);

              renderCb(scaledBand);
            });
          },
          noQuadTree: true,
        },
      );
    }
  });
}

module.exports = isolines;
