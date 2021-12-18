const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, clamp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 6,
};

const config = {
  resolution: 40,
  size: 5,
  walkerCount: 10,
  colors: {
    background: clrs.bg,
    grid: clrs.ink(),
  },
};

const state = {
  grid: [],
};

const sketch = () => {
  state.grid = makeGrid();
  state.walkers = new Array(config.walkerCount).fill(null).map(makeWalker);

  return ({ context, width, height }) => {
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
  };
};

/**
 * Walker
 */
function makeWalker() {
  const start = {
    x: Random.rangeFloor(1, config.resolution - 1),
    y: Random.rangeFloor(1, config.resolution - 1),
    moveTo: true,
  };

  return {
    path: [start],
    color: clrs.ink(),
    state: 'alive',
  };
}

function step(walker) {
  let currentIndex = walker.path.length - 1;
  let current = walker.path[currentIndex];
  let next = findNextStep(current);

  while (!next) {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      break;
    }

    current = walker.path[currentIndex];
    next = findNextStep(current);
    if (next) {
      next.moveTo = true;
    }
  }

  if (next) {
    setOccupied(next);
    walker.path.push(next);
  } else {
    walker.state = 'dead';
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
