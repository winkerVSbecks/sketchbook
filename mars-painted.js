const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { matrixMultiply } = require('./matrix');
const { mapRange } = require('canvas-sketch-util/math');
const {
  createHatchLines,
  clipSegmentToCircle,
} = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: [1600, 1600],
  animate: true,
  duration: 1,
  scaleToView: true,
  fps: 12,
};

const config = {
  debug: false,
  strokeCount: 800 * 40,
  strokeLength: 20,
  strokeWidth: {
    min: 2,
    max: 6,
  },
  noise: {
    frequency: 5,
    amplitude: 10,
  },
  planetSize: 50,
  craterCount: 12,
  craterRadius: {
    min: 20,
    max: 80,
  },
  bg: '#729ADF',
  bgColors: [
    '#508BBF',
    '#022873',
    '#3B74BF',
    '#548DBF',
    '#355B8C',
    '#4E7DA6',
    '#2E62A6',
  ],
  colors: [
    '#D94350',
    '#F2C7BD',
    '#508BBF',
    '#D92323',
    '#F2D1C9',
    '#D98B84',
    '#022873',
    '#F2F2F2',
  ],
  craterColors: ['#EDA382', '#F2C7BD', '#F2D1C9', '#D98B84'],
};

const sketch = ({ width, height }) => {
  let angleY = Math.PI / 4;
  Random.setSeed('many-polygons');
  // Choose a new starting hue
  const planetStrokes = [];
  const bgStrokes = [];

  const craters = new Array(config.craterCount).fill().map(() => {
    const [x, y] = Random.insideCircle(width / 4);
    return {
      x,
      y,
      r: Random.range(config.craterRadius.min, config.craterRadius.max),
      color: Random.pick(config.craterColors),
      width: Random.rangeFloor(config.strokeWidth.min, config.strokeWidth.max),
    };
  });

  for (let idx = 0; idx < config.strokeCount; idx++) {
    planetStrokes.push(createPlanetStroke(idx));
  }

  for (let idx = 0; idx < config.strokeCount * 4; idx++) {
    bgStrokes.push(createBgStroke(width, height));
  }

  for (let idx = 0; idx < config.strokeLength; idx++) {
    planetStrokes.forEach((stroke) => updatePlanetStroke(stroke));
    bgStrokes.forEach((stroke) => updateBgStroke(stroke, 0));
  }

  return ({ context, width, height, playhead }) => {
    const angleX = 0;
    const angleZ = 0;
    // angleY = Math.PI * 2 * playhead;
    // prettier-ignore
    const rotationZ = [
      [Math.cos(angleZ), -Math.sin(angleZ), 0],
      [Math.sin(angleZ),  Math.cos(angleZ), 0],
      [0, 0, 1],
    ];

    // prettier-ignore
    const rotationX = [
      [1, 0, 0],
      [0, Math.cos(angleX), -Math.sin(angleX)],
      [0, Math.sin(angleX),  Math.cos(angleX)],
    ];

    // prettier-ignore
    const rotationY = [
      [ Math.cos(angleY), 0, Math.sin(angleY)],
      [ 0, 1, 0],
      [-Math.sin(angleY), 0, Math.cos(angleY)],
    ];

    // Clear
    context.fillStyle = config.bg;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);

    bgStrokes.forEach((stroke) => drawBgStroke(context, playhead, stroke));

    context.translate(width / 2, height / 2);

    // planetStrokes.forEach((stroke) => updateStroke(stroke, playhead));
    planetStrokes.forEach((stroke) =>
      drawPlanetStroke(
        context,
        playhead,
        [rotationX, rotationY, rotationZ],
        stroke,
        craters
      )
    );

    craters.forEach((crater) => drawCrater(context, crater));

    if (config.debug) {
      craters.forEach(({ x, y, r }) => {
        context.fillStyle = 'rgba(255,0,0,0.5)';
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.fill();
      });
    }
  };
};

canvasSketch(sketch, settings);

function scale(v) {
  // prettier-ignore
  return [
    [v, 0, 0],
    [0, v, 0],
    [0, 0, v],
  ];
}

/**
 * Planet paint strokes
 */
function createPlanetStroke(idx) {
  const [x, y, z] = Random.onSphere(config.planetSize);

  return {
    color: Random.pick(config.colors),
    x,
    y,
    z,
    v: Random.range(0, 1),
    path: [],
    width: Random.rangeFloor(config.strokeWidth.min, config.strokeWidth.max),
  };
}

function updatePlanetStroke(stroke) {
  const { v, x, y, z } = stroke;

  const direction = Random.noise3D(
    x / config.planetSize,
    y / config.planetSize,
    z / config.planetSize,
    config.noise.frequency,
    config.noise.amplitude
  );

  stroke.x = x + v * Math.cos(direction);
  stroke.y = y + v * Math.sin(direction);
  stroke.z = z + v * Math.cos(direction);

  stroke.path.push([stroke.x, stroke.y, stroke.z]);

  if (stroke.path.length > config.strokeLength) {
    stroke.path.shift();
  }
}

function drawPlanetStroke(
  context,
  playhead,
  [rotationX, rotationY, rotationZ],
  stroke,
  craters
) {
  const offset = Random.range(0, 12);

  const projected = stroke.path
    .map((vertex) => {
      const mag = Math.hypot(...vertex);
      const v = vertex.map((v) => [(v * config.planetSize) / mag]);

      let rotated = matrixMultiply(rotationX, v);
      rotated = matrixMultiply(rotationY, rotated);
      rotated = matrixMultiply(rotationZ, rotated);
      const scaled = matrixMultiply(scale(10), rotated);

      // prettier-ignore
      const projection2d = [
        [1, 0,   0],
        [0,   1, 0],
      ];
      const projected2d = matrixMultiply(projection2d, scaled);

      return projected2d;
    })
    // Wrap around craters
    .map((point) => {
      craters.forEach((crater) => {
        if (inCircle(point, crater)) {
          point = wrapAroundCircle(point, crater, offset);
        }
      });

      return point;
    });

  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawPath(context, projected);
  context.stroke();
}

/**
 * Crater stuff
 */
function inCircle(point, circle) {
  return Math.hypot(circle.x - point[0], circle.y - point[1]) < circle.r;
}

function wrapAroundCircle(point, circle, offset = 0) {
  const angle = Math.atan2(point[1] - circle.y, point[0] - circle.x);
  const r = circle.r + offset;

  return [circle.x + r * Math.cos(angle), circle.y + r * Math.sin(angle)];
}

function drawCrater(context, { color, width, x, y, r: _r }) {
  const r = _r - config.strokeWidth.max;

  for (let index = 0; index < 2; index++) {
    const bounds = [
      [x - r, y - r],
      [x + r, y + r],
    ];
    const lines = createHatchLines(bounds, Random.range(0, Math.PI), width * 1);

    context.strokeStyle = color;
    context.lineWidth = width * 0.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    lines.forEach((line) => {
      let hits = [];
      clipSegmentToCircle(line[0], line[1], [x, y], r, hits);
      if (hits.length > 0) {
        hits = hits.map(([x, y]) => {
          const t = Random.noise2D(x, y) * width;
          return [x + t, y + t];
        });

        drawPath(context, hits);
        context.stroke();
      }
    });
  }
}

/**
 * Background paint strokes
 */
function createBgStroke(width, height) {
  const x = Random.range(width * 0.02, width * 0.98);
  const y = Random.range(height * 0.02, height * 0.98);

  return {
    color: Random.pick(config.bgColors),
    x,
    y,
    v: Random.range(0, 1) * 4,
    path: [],
    width: Random.rangeFloor(config.strokeWidth.min, config.strokeWidth.max),
  };
}

function updateBgStroke(stroke, playhead) {
  const { v, x, y } = stroke;

  const direction = Random.noise2D(
    x / config.planetSize,
    y / config.planetSize,
    config.noise.frequency / 2,
    config.noise.amplitude / 2
  );

  stroke.x = x + v * Math.cos(direction);
  stroke.y = y + v * Math.sin(direction);

  stroke.path.push([stroke.x, stroke.y]);

  if (stroke.path.length > config.strokeLength) {
    stroke.path.shift();
  }
}

function drawBgStroke(context, playhead, stroke) {
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawPath(context, stroke.path);
  context.stroke();
}

/**
 * Utils
 */
function drawPath(context, [start, ...pts]) {
  context.beginPath();
  context.moveTo(...start);
  pts.forEach((pt) => {
    context.lineTo(...pt);
  });
}
