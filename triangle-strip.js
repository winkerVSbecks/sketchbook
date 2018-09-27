const canvasSketch = require('canvas-sketch');
const { lerpFrames } = require('canvas-sketch-util/math');
const { range } = require('canvas-sketch-util/random');
const R = require('ramda');
const chroma = require('chroma-js');
const { rectGrid } = require('./grid');
const { drawShape } = require('./geometry');

const settings = {
  dimensions: [2048, 2048],
  animate: false,
  duration: 2,
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
};

// const polyline = [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]];
// lerpFrames(polyline, playhead)

const sketch = () => {
  console.clear();

  return ({ context, width, height, playhead }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    context.lineJoin = 'bevel';
    const pts = [];

    rectGrid({
      size: { x: width, y: height },
      resolution: { x: 16, y: 16 },
      padding: { x: 0.15, y: 0.15 },
      forEach: ({ x, y, s }, idx) => {
        const a = 8;
        const odd = idx % 2 === 0;
        const offset = 0; //odd ? s.x / 2 : 0;

        pts.push([x - a / 2 + offset, y - a / 2]);

        // // Draw the pixel
        // context.save();
        // const t = 223;
        // context.fillStyle = [
        //   t,
        //   t + 1,
        //   t % 2 === 0 ? t + 1 + 16 : t + 16,
        // ].includes(idx)
        //   ? '#f0f'
        //   : '#fff';
        // context.fillRect(x - a / 2 + offset, y - a / 2, a, a);
        // context.restore();
      },
    });

    const triangleStrips = R.pipe(
      res => initializeGrid(res, res),
      R.map(idx => pts[idx - 1]),
      R.aperture(3),
      R.forEach(pts => {
        context.lineWidth = width * 0.002;
        context.fillStyle = chroma.random().desaturate(100);
        context.strokeStyle = '#000';
        drawShape(
          context,
          pts.map(([x, y]) => [x + range(-5, 5), y + range(-5, 5)]),
        );
        context.fill();
        context.stroke();
      }),
    )(16);
  };
};

canvasSketch(sketch, settings);

function initializeGrid(cols, rows) {
  var trianglestrip = [];
  var RCvertices = 2 * cols * (rows - 1);
  var TSvertices = 2 * cols * (rows - 1) + 2 * (rows - 2);
  numVertices = TSvertices;
  var j = 0;
  for (var i = 1; i <= RCvertices; i += 2) {
    trianglestrip[j] = (1 + i) / 2;
    trianglestrip[j + 1] = (cols * 2 + i + 1) / 2;
    if (trianglestrip[j + 1] % cols == 0) {
      if (trianglestrip[j + 1] != cols && trianglestrip[j + 1] != cols * rows) {
        trianglestrip[j + 2] = trianglestrip[j + 1];
        trianglestrip[j + 3] = (1 + i + 2) / 2;
        j += 2;
      }
    }
    j += 2;
  }
  return trianglestrip;
}
