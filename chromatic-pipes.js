const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const {
  mapRange,
  linspace,
  clamp,
  lerpFrames,
} = require('canvas-sketch-util/math');
const { drawShape } = require('./geometry');
const eases = require('eases');

const settings = {
  animate: true,
  duration: 6,
  dimensions: [1080, 1080],
};

const PALETTE = Random.shuffle([
  '#FDC22D',
  '#F992E2',
  '#FB331C',
  '#3624F4',
  '#E7EEF6',
]);
const GRID_SIZE = 16 * 2;

const sketch = async (app) => {
  // Take a background color
  const background = '#000'; // PALETTE.shift();

  const pipes = linspace(24 * 16).map(() => ({
    pts: pipeOfLength(12),
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
    const time = Math.sin(playhead * Math.PI);
    const t = eases.quadInOut(time);

    const pts = _pts.map(uvToXy([width, height]));

    let l = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[i - 1];

      l = l + Math.hypot(a[0] - b[0], a[1] - b[1]);
    }

    // bg
    context.strokeStyle = bg;
    context.lineWidth = 20;
    context.setLineDash([l * 0.1, l]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    drawShape(context, pts, false);
    context.stroke();

    const step = 0.04;

    context.lineWidth = 12;
    // inner
    context.setLineDash([
      lerpFrames([l * 0.1, l * (0.1 + step * 3), l * 0.1], t),
      l,
    ]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    context.strokeStyle = '#00f';
    drawShape(context, pts, false);
    context.stroke();
    // inner
    context.setLineDash([
      lerpFrames([l * 0.1, l * (0.1 + step * 2), l * 0.1], t),
      l,
    ]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    context.strokeStyle = '#0f0';
    drawShape(context, pts, false);
    context.stroke();
    // inner
    context.setLineDash([
      lerpFrames([l * 0.1, l * (0.1 + step * 1), l * 0.1], t),
      l,
    ]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    context.strokeStyle = '#f00';
    drawShape(context, pts, false);
    context.stroke();
    // inner
    context.setLineDash([l * 0.1, l]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l * 0.7);
    context.strokeStyle = '#fff';
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
