const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, clamp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
// const clrs = require('./clrs').clrs();
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');
const d3 = require('d3-quadtree');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  // duration: 6,
  // fps: 6,
  // playbackRate: 'throttle',
};

const config = {
  resolution: 90,
  size: 5,
  walkerCount: 4, //Random.rangeFloor(20, 40),
  colors: createColors(),
  margin: 0,
};

const state = {
  grid: [],
  walkers: [],
  pts: [],
  nodes: [],
  activeNode: 0,
  activeColor: config.colors.ink(),
  mode: 'draw',
};

const sketch = () => {
  return {
    begin({ width, height }) {
      state.pts =
        state.pts.length > 0
          ? state.pts
          : new Array(25)
              .fill(null)
              .map(() => [
                Random.rangeFloor(0, config.resolution),
                Random.rangeFloor(0, config.resolution),
              ]);
      state.nodes =
        state.nodes.length > 0
          ? state.nodes
          : quadTreeToNodes(state.pts, width, height);
      state.grid = makeGrid();
      state.walkers = new Array(config.walkerCount).fill(null).map(makeWalker);
    },
    render({ context, width, height, playhead }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.colors.background;
      context.fillRect(0, 0, width, height);

      // context.lineWidth = 2;
      // context.strokeStyle = config.colors.grid;
      // state.nodes.forEach((node) => {
      //   context.strokeRect(
      //     toWorld(node.x, width),
      //     toWorld(node.y, height),
      //     toWorld(node.width, width),
      //     toWorld(node.height, height)
      //   );
      // });

      context.lineWidth = 8;
      const node = state.nodes[state.activeNode];
      context.strokeStyle = config.colors.lines;
      context.strokeRect(
        toWorld(node.x, width),
        toWorld(node.y, height),
        toWorld(node.width, width),
        toWorld(node.height, height)
      );

      for (let index = 0; index < 100; index++) {
        drawGrid(context, state.grid, width, height);

        state.walkers.forEach((walker) => {
          if (walker.state === 'alive') {
            step(walker);
          }
          drawWalker(context, walker, width, height);
        });

        const validOptions = state.grid
          .filter((cell) => !cell.occupied)
          .filter((cell) => inNode(cell));

        // if (state.walkers.length === 0) {
        //   spawnWalker();
        // }

        if (
          validOptions.length === 0 &&
          state.activeNode < state.nodes.length - 1
        ) {
          state.activeNode++;
          spawnWalker();
        } else if (state.activeNode === state.nodes.length - 1) {
          state.mode = 'complete';
        }
      }
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
  if (state.mode !== 'complete') {
    const walker = makeWalker();

    if (walker) {
      state.walkers.push(walker);
    }
  }
}

function makeWalker() {
  const start = getStart();

  if (start) {
    start.moveTo = true;
    setOccupied(start);

    return {
      path: [start],
      color: config.colors.ink(),
      state: 'alive',
      nextStep: Random.pick(walkerTypes)(),
    };
  }
  return null;
}

function getStart() {
  const options = state.grid
    .filter((cell) => !cell.occupied)
    .filter((cell) => inNode(cell));

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
  return inBounds(option) && inNode(option) && !isOccupied(option);
}

/**
 * Utils
 */
// i = x + width*y;
function xyToIndex(x, y) {
  return x + (config.resolution + 1) * y;
}

function inBounds({ x, y }) {
  return x >= 0 && x <= config.resolution && y >= 0 && y <= config.resolution;
}

function inNode({ x, y }) {
  const node = state.nodes[state.activeNode];

  return (
    x >= node.x &&
    x <= node.x + node.width &&
    y >= node.y &&
    y <= node.y + node.height
  );
}

function xyToCoords(x, y, width, height) {
  return [toWorld(x, width), toWorld(y, height)];
}

function toWorld(v, size) {
  const margin = config.margin * size;
  return mapRange(v, 0, config.resolution, margin, size - margin);
}

/**
 * Quadtree
 */
function quadTreeToNodes(pts, width, height) {
  const quadtree = d3
    .quadtree()
    .extent([
      [0, 0],
      [config.resolution, config.resolution],
      // [config.margin * width, config.margin * height],
      // [width - config.margin * width, height - config.margin * height],
    ])
    .addAll(pts);

  const nodes = [];
  quadtree.visitAfter((node, x0, y0, x1, y1) => {
    nodes.push({
      x: x0,
      y: y0,
      x1,
      y1,
      width: y1 - y0,
      height: x1 - x0,
    });
  });
  return nodes;
}

function createColors() {
  const colorConfig = {
    total: 9,
    centerHue: Random.range(0, 360),
    hueCycle: 1,
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
  const background = hsl(Random.pick(darkColorSystem.dark));
  const inkColors = colorSystem.light.map(hsl).filter((c) => c !== background);
  const ink = () => Random.pick(inkColors);

  return {
    background,
    ink,
    grid: ink(),
    lines: ink(),
  };
}

canvasSketch(sketch, settings);
