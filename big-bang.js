// The story of the universe, as told in etched space hieroglyphics.
const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, clamp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const pack = require('pack-spheres');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const settings = {
  dimensions: [1080 * 2, 1080 * 2],
  animate: true,
  scaleToFitPadding: 0,
  fps: 120,
  playbackRate: 'throttle',
};

const config = {
  resolution: 120,
  size: 5,
  walkerCount: Random.rangeFloor(20, 40),
  colors: createColors(),
};

const state = {
  grid: [],
  walkers: [],
  circles: [],
  mode: 'IN_CIRCLE',
};

const sketch = () => {
  return {
    begin() {
      state.mode === 'IN_CIRCLE';
      state.grid = makeGrid();
      state.circles = makeCircles();
      // Check if a cell is in a circle or not and update the grid
      state.grid = state.grid.map((cell) => {
        const circle = state.circles.find((circle) => inCircle(circle, cell));

        if (!circle) {
          cell.notInCircle = true;
          cell.occupied = true;
        } else {
          cell.inCircle = true;
          cell.circle = circle;
        }

        return cell;
      });
      state.walkers = new Array(config.walkerCount).fill(null).map(makeWalker);
    },
    render({ context, width, height }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.colors.bg;
      context.fillRect(0, 0, width, height);

      drawGrid(context, state.grid, width, height);

      state.walkers.forEach((walker) => {
        if (walker.state === 'alive' && state.mode !== 'COMPLETE') {
          step(walker);
        }
        drawWalker(context, walker, width, height);
      });

      // Once circles are complete, reenable cells outside of circles and spawn a new walker
      if (
        state.walkers.every((walker) => walker.state === 'dead') &&
        state.mode === 'IN_CIRCLE'
      ) {
        state.grid.forEach((cell) => {
          if (cell.notInCircle) {
            cell.occupied = false;
          }
        });

        state.mode = 'BG_ONLY';

        new Array(config.walkerCount).fill(null).forEach(() => spawnWalker());
      }

      if (
        state.grid.every((cell) => cell.occupied) &&
        state.mode === 'BG_ONLY'
      ) {
        state.mode = 'COMPLETE';
      }

      // state.circles.forEach((circle) =>
      //   debugCircle(context, circle, width, height)
      // );
    },
  };
};

/**
 * Walker
 */
const walkerTypes = [
  (circle) =>
    ({ x, y }) =>
      Random.pick(
        [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ].filter((o) => validOption(o, circle))
      ),
  (circle) => {
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
      if (!validOption(preferred, circle)) {
        preferredOption = preferredOption === 0 ? 1 : 0;
        preferred = options[preferredOption];
      }

      if (validOption(preferred, circle)) {
        return preferred;
      }

      return Random.pick(options.filter((o) => validOption(o, circle)));
    };
  },
  (circle) => {
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
      if (!validOption(preferred, circle)) {
        preferredOption = preferredOption === 2 ? 3 : 2;
        preferred = options[preferredOption];
      }

      if (validOption(preferred, circle)) {
        return preferred;
      }

      return Random.pick(options.filter((o) => validOption(o, circle)));
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

  start.moveTo = true;

  setOccupied(start);

  const color =
    state.mode === 'BG_ONLY'
      ? config.colors.darkInk()
      : // in circle mode, pick slightly darker color for smaller circles
      start.circle.radius < config.resolution * 0.08
      ? config.colors.midInk()
      : config.colors.ink();

  return {
    path: [start],
    color,
    state: 'alive',
    nextStep: Random.pick(walkerTypes)(start.circle),
  };
}

function getStart() {
  const availableOptions = state.grid.filter((cell) => !cell.occupied);
  const options =
    state.mode === 'IN_CIRCLE'
      ? availableOptions.filter((cell) => cell.inCircle)
      : availableOptions;

  return Random.pick(options);
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

  for (let y = 0; y <= config.resolution; y++) {
    for (let x = 0; x <= config.resolution; x++) {
      grid.push({ x, y, occupied: false });
    }
  }

  return grid;
}

function drawGrid(context, grid, width, height) {
  grid.map(({ x, y, occupied, notInCircle }) => {
    context.fillStyle = config.colors.grid;

    const drawOutside = state.mode === 'IN_CIRCLE' && notInCircle;

    if (!occupied || drawOutside) {
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

function validOption(option, circle) {
  return inBounds(option) && inCircle(circle, option) && !isOccupied(option);
}

/**
 * Utils
 */
// i = x + width*y;
function xyToIndex(x, y) {
  return x + (config.resolution + 1) * y;
}

function inBounds({ x, y }) {
  return x > 0 && x < config.resolution && y > 0 && y < config.resolution;
}

function xyToCoords(x, y, width, height) {
  return [toWorld(x, width), toWorld(y, height)];
}

function toWorld(v, size) {
  const margin = 0.03 * size;
  return mapRange(v, 0, config.resolution, margin, size - margin);
}

/**
 * Planets
 */
function makeCircles() {
  return pack({
    dimensions: 2,
    bounds: config.resolution,
    packAttempts: 500,
    maxCount: 1000,
    minRadius: config.resolution * 0.0625,
    maxRadius: config.resolution * 0.75,
    padding: 0.5,
    sample: () => [
      Random.rangeFloor(-config.resolution, config.resolution),
      Random.rangeFloor(-config.resolution, config.resolution),
    ],
  }).map((circle) => {
    return {
      ...circle,
      position: circle.position.map((v) =>
        mapRange(v, -config.resolution, config.resolution, 0, config.resolution)
      ),
      radius: circle.radius / 2,
    };
  });
}

function debugCircle(context, { position, radius }, width, height) {
  context.strokeStyle = '#fff';
  context.lineWidth = 1;
  context.beginPath();
  context.arc(
    ...xyToCoords(position[0], position[1], width, height),
    toWorld(radius, width),
    0,
    2 * Math.PI
  );
  context.stroke();
}

function inCircle(circle, { x, y }) {
  if (!circle) {
    return true;
  }

  const {
    position: [cx, cy],
    radius,
  } = circle;

  return Math.hypot(cx - x, cy - y) < radius;
}

/**
 * Colors
 */
function createColors() {
  const colorConfig = {
    total: 9,
    centerHue: Random.range(0, 60),
    hueCycle: 0.25,
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
  const midColorSystem = generateRandomColorRamp({
    ...colorConfig,
    hueCycle: 0.5,
    centerHue: Random.range(70, 160),
    maxSaturationLight: [1, 0.5],
  });
  const darkColorSystem = generateRandomColorRamp({
    ...colorConfig,
    centerHue: Random.range(220, 340),
    maxSaturationLight: [0.5, 0.25],
  });

  const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;
  const bg = hsl(Random.pick(darkColorSystem.dark));
  const inkColors = colorSystem.light.map(hsl).filter((c) => c !== bg);
  const midInkColors = midColorSystem.light.map(hsl).filter((c) => c !== bg);
  const darkInkColors = darkColorSystem.light.map(hsl).filter((c) => c !== bg);

  return {
    bg,
    grid: Random.pick(inkColors),
    ink: () => Random.pick(inkColors),
    midInk: () => Random.pick(midInkColors),
    darkInk: () => Random.pick(darkInkColors),
  };
}

canvasSketch(sketch, settings);
