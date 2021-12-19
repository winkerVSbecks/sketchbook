const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, clamp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
// const clrs = require('./clrs').clrs();
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  // duration: 12,
  // fps: 24,
  // playbackRate: 'throttle',
};

const colorConfig = {
  total: 9,
  centerHue: Random.range(0, 300),
  hueCycle: 0.5,
  curveMethod: 'lamé',
  curveAccent: 0.2,
  offsetTint: 0.251,
  offsetShade: 0.01,
  tintShadeHueShift: 0.0,
  offsetCurveModTint: 0.03,
  offsetCurveModShade: 0.03,
  minSaturationLight: [0, 0],
  maxSaturationLight: [1, 1],
};

const colorSystem = generateRandomColorRamp(colorConfig);

const darkColorSystem = generateRandomColorRamp({
  ...colorConfig,
  maxSaturationLight: [0.25, 0.25],
});

const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;
const bg = hsl(Random.pick(darkColorSystem.dark));
const inkColors = colorSystem.light.map(hsl).filter((c) => c !== bg);
const clrs = {
  bg,
  ink: () => Random.pick(inkColors),
};

const config = {
  resolution: 60,
  size: 5,
  walkerCount: Random.rangeFloor(1, 20),
  colors: {
    background: clrs.bg,
    grid: clrs.ink(),
  },
};

const state = {
  grid: [],
  walkers: [],
};

const sketch = () => {
  return {
    begin() {
      state.grid = makeGrid();
      state.walkers = new Array(config.walkerCount).fill(null).map(makeWalker);
    },
    render({ context, width, height }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.colors.background;
      context.fillRect(0, 0, width, height);

      drawGrid(context, state.grid, width, height);

      state.walkers.forEach((walker) => {
        if (walker.state === 'alive') {
          step(walker);
        }
        drawWalker(context, walker, width, height);
      });
    },
  };
};

/**
 * Walker
 */
const walkerTypes = [
  () =>
    ({ x, y }) =>
      Random.pick(
        [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ].filter(validOption)
      ),
  () => {
    let preferredOption = Random.pick([0, 1]);

    return ({ x, y }) => {
      const options = [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x, y: y + 1 },
        { x: x, y: y - 1 },
      ];
      let preferred = options[preferredOption];

      // Try bouncing once
      if (!validOption(preferred)) {
        preferredOption = preferredOption === 0 ? 1 : 0;
        preferred = options[preferredOption];
      }

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(options.filter(validOption));
    };
  },
  () => {
    let preferredOption = Random.pick([2, 3]);

    return ({ x, y }) => {
      const options = [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x, y: y + 1 },
        { x: x, y: y - 1 },
      ];
      let preferred = options[preferredOption];

      // Try bouncing once
      if (!validOption(preferred)) {
        preferredOption = preferredOption === 2 ? 3 : 2;
        preferred = options[preferredOption];
      }

      if (validOption(preferred)) {
        return preferred;
      }

      return Random.pick(options.filter(validOption));
    };
  },
];

function spawnWalker() {
  const doSpawn = !state.grid.every((cell) => cell.occupied);

  if (doSpawn) {
    const walker = makeWalker();

    if (walker) {
      state.walkers.push(walker);
    }
  }
}

function makeWalker() {
  const start = getStart();

  if (start) {
    (start.moveTo = true), setOccupied(start);

    return {
      path: [start],
      color: clrs.ink(),
      state: 'alive',
      nextStep: Random.pick(walkerTypes)(),
    };
  }
  return null;
}

function getStart() {
  return Random.pick(state.grid.filter((cell) => !cell.occupied));
}

function step(walker) {
  let currentIndex = walker.path.length - 1;
  let current = walker.path[currentIndex];
  let next = walker.nextStep(current);

  if (next) {
    setOccupied(next);
    walker.path.push(next);
  } else {
    walker.state = 'dead';
    spawnWalker();
  }
}

function findNextStep({ x, y }) {
  const options = [
    { x: x + 1, y: y },
    { x: x - 1, y: y },
    { x: x, y: y + 1 },
    { x: x, y: y - 1 },
  ].filter((potentialNext) => {
    return inBounds(potentialNext) && !isOccupied(potentialNext);
  });

  return Random.pick(options);
}

function drawWalker(context, walker, width, height) {
  context.strokeStyle = walker.color;
  context.lineWidth = config.size;

  context.beginPath();

  walker.path.map(({ x, y, moveTo }) => {
    const operation = moveTo ? 'moveTo' : 'lineTo';
    context[operation](...xyToCoords(x, y, width, height));
  });

  context.stroke();
}

/**
 * Grid
 */
function makeGrid() {
  const grid = [];

  for (let y = 1; y < config.resolution; y++) {
    for (let x = 1; x < config.resolution; x++) {
      grid.push({ x, y, occupied: false });
    }
  }

  return grid;
}

function drawGrid(context, grid, width, height) {
  grid.map(({ x, y, occupied }) => {
    context.fillStyle = config.colors.grid;
    if (!occupied) {
      const [worldX, worldY] = xyToCoords(x, y, width, height);

      context.fillRect(
        worldX - config.size / 2,
        worldY - config.size / 2,
        config.size,
        config.size
      );
    }
  });
}

function isOccupied({ x, y }) {
  const idx = xyToIndex(x, y);
  return state.grid[idx].occupied;
}

function setOccupied({ x, y }) {
  const idx = xyToIndex(x, y);
  if (idx >= 0) {
    state.grid[idx].occupied = true;
  }
}

function validOption(option) {
  return inBounds(option) && !isOccupied(option);
}

/**
 * Utils
 */
// i = x + width*y;
function xyToIndex(x, y) {
  return x - 1 + (config.resolution - 1) * (y - 1);
}

function inBounds({ x, y }) {
  return x > 0 && x < config.resolution && y > 0 && y < config.resolution;
}

function xyToCoords(x, y, width, height) {
  return [
    (x * width) / config.resolution - 1,
    (y * height) / config.resolution - 1,
  ];
}

canvasSketch(sketch, settings);

// const walkerTypes = [
//   ({ x, y }) =>
//     Random.pick(
//       [
//         { x: x + 1, y: y },
//         { x: x - 1, y: y },
//         { x: x, y: y + 1 },
//         { x: x, y: y - 1 },
//       ].filter(validOption)
//     ),
//   ({ x, y }) => {
//     const preferred = { x: x + 1, y: y };

//     if (validOption(preferred)) {
//       return preferred;
//     }

//     return Random.pick(
//       [
//         { x: x - 1, y: y },
//         { x: x, y: y + 1 },
//         { x: x, y: y - 1 },
//       ].filter(validOption)
//     );
//   },
//   ({ x, y }) => {
//     const preferred = { x: x - 1, y: y };

//     if (validOption(preferred)) {
//       return preferred;
//     }

//     return Random.pick(
//       [
//         { x: x + 1, y: y },
//         { x: x, y: y + 1 },
//         { x: x, y: y - 1 },
//       ].filter(validOption)
//     );
//   },
//   ({ x, y }) => {
//     const preferred = { x: x, y: y + 1 };

//     if (validOption(preferred)) {
//       return preferred;
//     }

//     return Random.pick(
//       [
//         { x: x + 1, y: y },
//         { x: x - 1, y: y },
//         { x: x, y: y - 1 },
//       ].filter(validOption)
//     );
//   },
//   ({ x, y }) => {
//     const preferred = { x: x, y: y - 1 };

//     if (validOption(preferred)) {
//       return preferred;
//     }

//     return Random.pick(
//       [
//         { x: x + 1, y: y },
//         { x: x - 1, y: y },
//         { x: x, y: y + 1 },
//       ].filter(validOption)
//     );
//   },
// ];
