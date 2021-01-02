const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, linspace, clamp } = require('canvas-sketch-util/math');
const { drawShape } = require('./geometry');

const settings = {
  animate: true,
  duration: 6,
  dimensions: [800, 800],
  scaleToView: true,
};

const PALETTE = Random.shuffle([
  '#fff',
  '#fff791',
  '#9aeeeb',
  '#1a5ece',
  '#6ee99d',
  '#000',
  '#faf8f4',
]);
const GRID_SIZE = 16;

const sketch = async (app) => {
  const { canvas } = app;

  // Take a background color
  const background = PALETTE.shift();

  const pipes = linspace(24 + 6).map(() => ({
    pts: pipeOfLength(12), // [[1, 1], [3, 1], [3, 4], [6, 4], [6, 6], [8, 6], [10, 6], [10, 12]]
    color: Random.pick(PALETTE),
  }));

  // Return the renderer object
  return {
    // The draw function
    render({ deltaTime, context, width, height, time, playhead }) {
      // Draw background
      context.fillStyle = background;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.fillRect(0, 0, width, height);

      // Draw pipes
      const drawPipe = drawPipeToScale(context, [width, height]);
      pipes.forEach(({ color, pts }) => {
        drawPipe(pts, color, background, playhead);
      });

      // drawGrid(context, width, height);
    },
  };
};

canvasSketch(sketch, settings);

function drawPipeToScale(context, [width, height]) {
  return (_pts, color, bg, playhead) => {
    const t = Math.sin(playhead * Math.PI);
    const pts = _pts.map(uvToXy([width, height]));

    let l = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[i - 1];

      l = l + Math.hypot(a[0] - b[0], a[1] - b[1]);
    }

    context.setLineDash([l * 0.5, l]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.5);

    // bg
    context.strokeStyle = bg;
    context.lineWidth = 24;
    drawShape(context, pts, false);
    context.stroke();

    // outer
    context.strokeStyle = color;
    context.lineWidth = 18;
    drawShape(context, pts, false);
    context.stroke();

    // middle
    context.setLineDash([l * 0.4, l]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.6);
    context.strokeStyle = bg;
    context.lineWidth = 12;
    drawShape(context, pts, false);
    context.stroke();

    // inner
    context.setLineDash([l * 0.3, l]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    context.strokeStyle = color;
    context.lineWidth = 6;
    drawShape(context, pts, false);
    context.stroke();
  };
}

function uvToXy([width, height]) {
  return ([x, y]) => [
    mapRange(x, 0, GRID_SIZE, 0, width),
    mapRange(y, 0, GRID_SIZE, 0, height),
  ];
}

function pipeOfLength(length = 6) {
  let prevDir = [0, 0];

  const start = [
    Random.rangeFloor(1, GRID_SIZE - 1),
    Random.rangeFloor(1, GRID_SIZE - 1),
  ];

  return linspace(length).reduce(
    (polyline) => {
      const dir = randomDir(prevDir);
      const a = polyline[polyline.length - 1];

      const b = dir.map((v) => v * Random.rangeFloor(1, 3));
      prevDir = dir;
      return polyline.concat([
        [clampToGrid(b[0] + a[0]), clampToGrid(b[1] + a[1])],
      ]);
    },
    [start]
  );
}

function randomDir(prevDir) {
  const prev = prevDir.map((v) => v * -1);
  return Random.pick(
    [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ].filter((dir) => !(prev && dir[0] === prev[0] && dir[1] === prev[1]))
  );
}

function clampToGrid(v) {
  return clamp(v, 1, GRID_SIZE - 1);
}

function drawGrid(context, width, height) {
  const s = 2;
  for (let x = 1; x < GRID_SIZE; x++) {
    for (let y = 1; y < GRID_SIZE; y++) {
      // get a 0..1 UV coordinate
      const u = GRID_SIZE <= 1 ? 0.5 : x / (GRID_SIZE - 1);
      const v = GRID_SIZE <= 1 ? 0.5 : y / (GRID_SIZE - 1);

      // scale to dimensions
      const [ptx, pty] = uvToXy([width, height])([x, y]);

      context.fillStyle = '#000';
      context.fillRect(ptx - s / 2, pty - s / 2, s, s);
    }
  }
}
