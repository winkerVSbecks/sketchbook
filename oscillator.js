const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const Renderer3D = require('./renderer-3d');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 2,
  scaleToView: true,
};

const colors = {
  bg: '#FFBACB', // '#F5F2F0',
  x: '#211BA9', // '#3652FB',
  y: '#211BA9', // '#3652FB',
};

const sketch = (props) => {
  const { width, height } = props;

  const renderer = new Renderer3D(
    5,
    { x: Math.atan(1 / 2 ** 0.5), y: Math.PI / 4, z: 0 },
    settings.dimensions[0]
  );

  const margin = 0.05 * width;
  const RESOLUTION = [64 + 32, 64 + 32];

  const clipBox = [
    [margin, margin],
    [width - margin, height - margin],
  ];

  const origin = [0, 0.5, 0.5];
  const offset = [0, 0, 0]; // [0.25, 0, 0];
  const scale = 1; // 2;

  return ({ context, width, height, playhead }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    const shift = 2 * Math.PI * playhead;

    for (let x = 0; x < RESOLUTION[0]; x++) {
      for (let y = 0; y < RESOLUTION[1]; y++) {
        if (y > 0) {
          const u1 = -0.5 + x / (RESOLUTION[0] - 1);
          const v1 = -0.5 + y / (RESOLUTION[1] - 1);
          const v2 = -0.5 + (y - 1) / (RESOLUTION[1] - 1);

          const [point1, point2] = getPoints(
            [u1, v1],
            origin,
            offset,
            scale,
            shift
          );
          const [point3, point4] = getPoints(
            [u1, v2],
            origin,
            offset,
            scale,
            shift
          );

          renderer.line(context, point1, point3, colors.x, 4);
          renderer.line(context, point2, point4, colors.x, 4);
        }
      }
    }
  };
};

canvasSketch(sketch, settings);

function getPoints([u, v], o, offset, scale, shift) {
  const p1 = [u, v];
  const d1 = ((o[0] - p1[0]) ** 2 + (o[2] - p1[1])) ** 2;
  const t1 = Math.sin(shift + lerp(0, Math.PI * 5, d1 * scale));
  const point1 = [
    offset[0] + p1[0] * scale,
    offset[1] + o[1] + 0.05 * t1,
    offset[2] + p1[1] * scale,
  ];

  const p2 = [v, u];
  const d2 = ((o[0] - p2[0]) ** 2 + (o[2] - p2[1])) ** 2;
  const t2 = Math.sin(shift + lerp(0, Math.PI * 5, d2 * scale));
  const point2 = [
    offset[0] + p2[0] * scale,
    offset[1] + o[1] + 0.05 * t2,
    offset[2] + p2[1] * scale,
  ];

  return [point1, point2];
}
