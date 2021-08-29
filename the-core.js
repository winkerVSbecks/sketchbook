const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 4,
  scaleToView: true,
  // fps: 60,
};

const clrs = {
  bg: 'rgba(54, 29, 72)',
};

const sketch = () => {
  const cuboids = [
    createCuboid({
      size: 120 * 1.5,
      colors: ['#fc5f3d', '#fc3563'],
      offset: 80,
      duration: 0.6,
    }),
    createCuboid({
      size: 100 * 1.5,
      colors: ['#fd7569', '#fd5d7e'],
      offset: 80,
      duration: 0.55,
    }),
    createCuboid({
      size: 80 * 1.5,
      colors: ['#fe8984', '#fe7d8f'],
      offset: 80,
      duration: 0.5,
    }),
    createCuboid({
      size: 60 * 1.5,
      colors: ['#feaa94', '#fea399'],
      offset: 80,
      duration: 0.45,
    }),
    createCuboid({
      size: 40 * 1.5,
      colors: ['#fec59d', '#fec2a0'],
      offset: 80,
      duration: 0.4,
    }),
    createCuboid({
      size: 20 * 1.5,
      colors: ['#fedba2', '#fddaa4'],
      offset: 80,
      duration: 0.35,
    }),
  ];

  return {
    begin() {
      cuboids.forEach((cuboid) => {
        updateCuboid(cuboid, 0);
      });
    },
    render({ context, width, height, playhead }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      context.translate(width / 2, height / 2);

      cuboids.forEach((cuboid) => {
        updateCuboid(cuboid, playhead);
      });

      cuboids.forEach((cuboid) => {
        drawCuboid(context, cuboid);
      });
    },
  };
};

canvasSketch(sketch, settings);

function createCuboid({ size, colors, offset, duration }) {
  const offX = offset * Math.cos(Math.PI / 3);
  const offY = offset * Math.sin(Math.PI / 3);

  const getDelta = (scale) => [
    [-scale * offX, +scale * offY],
    [+scale * offX, -scale * offY],
    [+scale * offX, -scale * offY],
    [+scale * offX, -scale * offY],
    [-scale * offX, +scale * offY],
    [-scale * offX, +scale * offY],
  ];

  const delta = getDelta(1.25);

  const startVertices = [
    [-size + 0.25 * offX, -0.25 * offY],
    [
      -size + size * Math.cos(Math.PI / 3) - 0.25 * offX,
      0.25 * offY - size * Math.sin(Math.PI / 3),
    ],
    [
      size * Math.cos(Math.PI / 3) - 0.25 * offX,
      0.25 * offY - size * Math.sin(Math.PI / 3),
    ],
    [size - 0.25 * offX, 0.25 * offY],
    [
      size * Math.cos(Math.PI / 3) + 0.25 * offX,
      -0.25 * offY + size * Math.sin(Math.PI / 3),
    ],
    [
      -size + size * Math.cos(Math.PI / 3) + 0.25 * offX,
      -0.25 * offY + size * Math.sin(Math.PI / 3),
    ],
  ];

  return {
    size,
    colors,
    offset,
    duration,
    startVertices,
    delta,
    vertices: [...startVertices],
  };
}

function updateCuboid(cuboid, playhead) {
  const { vertices, startVertices, delta, duration } = cuboid;

  const t = playhead; // playhead > 0.5 ? 1 : mapRange(playhead, 0, 0.5, 0, 1);

  if (t < duration) {
    cuboid.vertices = vertices.map((_, idx) => [
      bounce(t, startVertices[idx][0], delta[idx][0], duration),
      bounce(t, startVertices[idx][1], delta[idx][1], duration),
    ]);
  }
}

function drawCuboid(context, { vertices, colors }) {
  const [start, ...points] = vertices;

  const gradient = context.createLinearGradient(...points[4], ...points[1]);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);

  context.fillStyle = gradient;

  context.beginPath();
  context.moveTo(...start);
  points.forEach((point) => {
    context.lineTo(...point);
  });
  context.closePath();
  context.fill();
}

/**
 * Utils
 * t: current time
 * b: base
 * c: change
 * d: duration
 */
function bounce(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t);
}
