/**
 * Based on animated-grid by Matt DesLauriers (@mattdesl)
 * https://github.com/mattdesl/canvas-sketch/blob/master/examples/animated-grid.js
 */
const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const chroma = require('chroma-js');
const { heading, calcVec, normalize } = require('./math');
const clrs = require('./clrs').clrs();

const simplex = new SimplexNoise('81234n32478320');

const settings = {
  animate: true,
  duration: 8,
  // dimensions: [1600, 1600],
  dimensions: [1080, 1080],
  // dimensions: [1080, 1920],
  scaleToView: true,
};

const colourScale = chroma.scale([clrs.ink(), clrs.ink()]).domain([-1, 1]);

canvasSketch(() => {
  let z = 0;
  const foreground = clrs.ink();
  const foreground2 = clrs.ink();
  const background = clrs.bg;

  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const gridSize = 30;
    const padding = height * 0.15;
    const tileSize = (height - padding * 2) / gridSize;
    const length = tileSize * 0.65;
    const thickness = tileSize * 0.1;
    const time = Math.sin(playhead * 2 * Math.PI);
    z = z + 0.01;

    // context.save();
    // context.translate(width / 2, height / 2);
    // context.rotate(Math.PI / 16);
    // context.translate(-width / 2, -height / 2);

    // for (let x = 0; x < gridSize; x++) {
    //   for (let y = 0; y < gridSize; y++) {
    //     // get a 0..1 UV coordinate
    //     const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
    //     const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

    //     // scale to dimensions with a border padding
    //     const t = {
    //       x: lerp(padding, width - padding, u),
    //       y: lerp(padding, height - padding, v),
    //     };

    //     // Draw
    //     context.save();
    //     const clr = simplex.noise3D(
    //       x / (gridSize * 2) + 10000,
    //       y / (gridSize * 2) + 10000,
    //       time
    //     );
    //     context.fillStyle = foreground; // colourScale(clr);

    //     const rotation =
    //       simplex.noise3D(x / gridSize, y / gridSize, time) * Math.PI;
    //     const l =
    //       length / 2 +
    //       (normalize(
    //         simplex.noise3D(
    //           x / (gridSize * 2) + 10000,
    //           y / (gridSize * 2) + 10000,
    //           time
    //         ),
    //         -1,
    //         1,
    //         -0.5,
    //         1
    //       ) *
    //         length) /
    //         2;

    //     // Rotate in place
    //     context.translate(t.x, t.y);
    //     context.rotate(rotation);
    //     context.translate(-t.x, -t.y);

    //     // Draw the line
    //     context.fillRect(t.x, t.y - thickness, l, thickness);
    //     context.restore();
    //   }
    // }

    // context.restore();

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

        // Draw
        context.save();
        const clr = simplex.noise3D(
          x / (gridSize * 2) + 10000,
          y / (gridSize * 2) + 10000,
          time
        );
        context.fillStyle = colourScale(clr); //foreground2;

        const rotation =
          simplex.noise3D(x / gridSize, y / gridSize, time) * Math.PI;
        const l =
          length / 2 +
          (normalize(
            simplex.noise3D(
              x / (gridSize * 2) + 10000,
              y / (gridSize * 2) + 10000,
              time
            ),
            -1,
            1,
            -0.5,
            1
          ) *
            length) /
            2;

        // Rotate in place
        context.translate(t.x, t.y);
        context.rotate(rotation);
        context.translate(-t.x, -t.y);

        // Draw the line
        context.fillRect(t.x, t.y - thickness, l, thickness);
        context.restore();
      }
    }
  };
}, settings);
