const canvasSketch = require('canvas-sketch');
const { lerpFrames, mapRange } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const R = require('ramda');
const chroma = require('chroma-js');
const { rectGrid } = require('./grid');
const { drawShape } = require('./geometry');

const settings = {
  dimensions: [2048, 2048],
  duration: 2,
  scaleToView: true,
};

const clr = chroma
  .scale([
    chroma('#5ba19b').brighten(0.5),
    ...random.shuffle(['#fceaea', '#fbead1', '#f5d9d9']),
  ])
  .padding(0.15)
  .mode('lch');

const sketch = () => ({ context, width, height, playhead }) => {
  const RESOLUTION = 8;
  context.fillStyle = clr(0.25);
  context.fillRect(0, 0, width, height);
  let odd = false;

  // Make a grid
  rectGrid({
    size: { x: width, y: height },
    resolution: { x: RESOLUTION, y: RESOLUTION },
    padding: { x: 0.15, y: 0.15 },
  })
    // offset every second row and distort the mesh
    .map(({ x, y, s, yIdx }) => {
      const a = 8;
      const odd = yIdx % 2 === 0;
      const offset = odd ? s.x / 2 : 0;

      return [
        x + offset + random.range(-s.x / 2, s.x / 2),
        y + random.range(-s.y / 2, s.y / 2),
      ];
    })
    // Group points into triangles
    .reduce((acc, _, i, pts) => {
      // The mesh is created slightly differently
      // for even vs odd rows
      if (i % RESOLUTION === 0) {
        odd = !odd;
      }

      if (i % RESOLUTION === RESOLUTION - 1 || i >= pts.length - RESOLUTION) {
        return acc;
      }

      return odd
        ? acc.concat([
            [pts[i], pts[i + RESOLUTION], pts[i + RESOLUTION + 1]],
            [pts[i], pts[i + RESOLUTION + 1], pts[i + 1]],
          ])
        : acc.concat([
            [pts[i], pts[i + RESOLUTION], pts[i + 1]],
            [pts[i + 1], pts[i + RESOLUTION], pts[i + RESOLUTION + 1]],
          ]);
    }, [])
    // Draw triangles and outlines
    .forEach(pts => {
      context.lineWidth = width * 0.002;
      context.lineJoin = 'bevel';
      context.fillStyle = clr(random.noise3D(pts[2][0], pts[2][1], playhead))
        .alpha(0.75)
        .css();
      context.strokeStyle = clr(0);
      context.lineWidth = 2;
      drawShape(context, pts.map(([x, y]) => [x, y]));
      context.fill();
      context.stroke();
    });
};

canvasSketch(sketch, settings);
