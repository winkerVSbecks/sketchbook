const canvasSketch = require('canvas-sketch');
const { lerp, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const Quadtree = require('@timohausmann/quadtree-js');
const eases = require('eases');

const settings = {
  dimensions: [1080 * 4, 1080 * 3],
  scaleToFit: true,
  scaleToFitPadding: 20,
  animate: true,
  duration: 4,
};

const config = {
  margin: 0.02,
  gap: Random.pick([20, 0]),
  pointCount: Random.pick([100, 200, 300, 500]),
  maxQtObjects: Random.pick([20, 50]),
  maxQtLevels: 4,
  bg: '#242632',
  colors: [
    '#064ED6',
    '#3067EB',
    '#F5818C',
    '#111A38',
    '#E1A9F5',
    '#E9EEF5',
    '#F45C67',
    '#F5D34D',
    '#D4DAE4',
    // '#14CBDF',
    '#F4BCD6',
    '#F58EED',
  ],
  shiftEnabled: Random.chance(),
  pause: 0.1,
  showGrid: false,
};

const state = {};

document.addEventListener('keydown', (event) => {
  if (event.key === 'd') {
    config.showGrid = !config.showGrid;
    console.log(config);
  }
});

const sketch = ({ width, height }) => {
  let margin = config.margin * Math.min(width, height);
  let gap = config.gap;

  state.pts = new Array(config.pointCount).fill(null).map(() => ({
    x: Random.rangeFloor(margin + gap, width - margin - gap),
    y: Random.rangeFloor(margin + gap, height - margin - gap),
    width: 4,
    height: 4,
  }));

  state.grid = createQtGrid({
    width: width - margin * 2 - gap,
    height: height - margin * 2 - gap,
    points: state.pts,
    gap: gap,
    maxQtObjects: config.maxQtObjects,
    maxQtLevels: config.maxQtLevels,
  });

  state.nodes = state.grid.areas.map(areaToNode);

  return {
    begin({ width, height }) {
      state.nodes.forEach((node) =>
        assignBehaviour(node, {
          xMin: gap,
          xMax: width - margin * 2 - gap * 2,
          yMin: gap,
          yMax: height - margin * 2 - gap * 2,
        })
      );
    },
    render({ context, width, height, playhead }) {
      margin = config.margin * Math.min(width, height);

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      context.translate(gap / 2, gap / 2);

      context.fillStyle = config.bg;
      context.fillRect(
        margin - gap,
        margin - gap,
        width - margin * 2 + gap,
        height - margin * 2 + gap
      );

      context.translate(margin, margin);

      let pingPongPlayhead = 0;

      if (playhead < config.pause) {
        pingPongPlayhead = 0;
      } else if (playhead > config.pause && playhead <= 0.5) {
        const t = mapRange(playhead, config.pause, 0.5, 0, 1);
        pingPongPlayhead = eases.expoInOut(t);
      } else if (playhead > 0.5 && playhead <= 0.5 + config.pause) {
        pingPongPlayhead = 1;
      } else if (playhead > 0.5 + config.pause) {
        const t = mapRange(playhead, 0.5 + config.pause, 1, 1, 0);
        pingPongPlayhead = eases.expoInOut(t);
      }

      state.nodes.forEach((node) => {
        node.tick(pingPongPlayhead);
      });

      state.nodes.forEach((node) => {
        drawNode(context, node);
      });

      if (config.showGrid) {
        state.nodes.forEach((node) => {
          debugNode(context, node);
        });
      }
    },
  };
};

/**
 * Node
 */
function areaToNode({ x, y, width, height }) {
  const x1 = x + width;
  const y1 = y + height;

  return {
    initial: { x, y, x1, y1 },
    x,
    y,
    x1,
    y1,
    width,
    height,
    color: Random.pick(config.colors),
  };
}

function assignBehaviour(node, globalBounds) {
  const { initial } = node;

  const direction = Random.pick(['x', 'y']);
  const movement = Random.weightedSet([
    { value: 'expand', weight: 200 },
    { value: 'shift', weight: 50 },
  ]);

  const { x, y, x1, y1 } = initial;
  node.x = x;
  node.x1 = x1;
  node.y = y;
  node.y1 = y1;

  if (movement === 'expand' || !config.shiftEnabled) {
    assignExpand(node, globalBounds, direction);
  } else {
    assignShift(node, globalBounds, direction);
  }
}

function assignExpand(node, globalBounds, direction) {
  if (direction === 'x') {
    if (node.x === globalBounds.xMin) {
      node.tick = (t) => {
        node.x1 = lerp(node.initial.x1, globalBounds.xMax, t);
      };
    } else if (node.x1 === globalBounds.xMax) {
      node.tick = (t) => {
        node.x = lerp(node.initial.x, globalBounds.xMin, t);
      };
    } else {
      const side = Random.pick(['x', 'x1']);
      node.tick = (t) => {
        const target = side === 'x' ? globalBounds.xMin : globalBounds.xMax;
        node[side] = lerp(node.initial[side], target, t);
      };
    }
  } else if (direction === 'y') {
    if (node.y === globalBounds.yMin) {
      node.tick = (t) => {
        node.y1 = lerp(node.initial.y1, globalBounds.yMax, t);
      };
    } else if (node.y1 === globalBounds.yMax) {
      node.tick = (t) => {
        node.y = lerp(node.initial.y, globalBounds.yMin, t);
      };
    } else {
      const side = Random.pick(['y', 'y1']);
      node.tick = (t) => {
        const target = side === 'y' ? globalBounds.yMin : globalBounds.yMax;
        node[side] = lerp(node.initial[side], target, t);
      };
    }
  }
}

function assignShift(node, globalBounds, direction) {
  const { width, height } = node;

  if (direction === 'x') {
    const right = (t) => {
      node.x1 = lerp(node.initial.x1, globalBounds.xMax, t);
      node.x = lerp(node.initial.x, globalBounds.xMax - width, t);
    };
    const left = (t) => {
      node.x1 = lerp(node.initial.x1, globalBounds.xMin + width, t);
      node.x = lerp(node.initial.x, globalBounds.xMin, t);
    };

    if (node.x === globalBounds.xMin) {
      node.tick = right;
    } else if (node.x1 === globalBounds.xMax) {
      node.tick = left;
    } else {
      node.tick = Random.pick([right, left]);
    }
  } else if (direction === 'y') {
    const down = (t) => {
      node.y = lerp(node.initial.y, globalBounds.yMax - height, t);
      node.y1 = lerp(node.initial.y1, globalBounds.yMax, t);
    };
    const up = (t) => {
      node.y = lerp(node.initial.y, globalBounds.yMin, t);
      node.y1 = lerp(node.initial.y1, globalBounds.yMin + height, t);
    };

    if (node.y === globalBounds.yMin) {
      node.tick = down;
    } else if (node.y1 === globalBounds.yMax) {
      node.tick = up;
    } else {
      node.tick = Random.pick([down, up]);
    }
  }
}

function drawNode(context, node) {
  const { x, y, x1, y1 } = node;
  context.fillStyle = node.color;

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x1, y);
  context.lineTo(x1, y1);
  context.lineTo(x, y1);
  context.closePath();

  context.fill();
}

function debugNode(context, node) {
  const { x, y, x1, y1 } = node;
  context.strokeStyle = '#1EA7FD';
  context.fillStyle = '#fff';

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x1, y);
  context.lineTo(x1, y1);
  context.lineTo(x, y1);
  context.closePath();
  context.stroke();

  const size = 10;

  [
    [x, y],
    [x1, y],
    [x1, y1],
    [x, y1],
  ].forEach(([x, y]) => {
    context.fillRect(x - size / 2, y - size / 2, size, size);
    context.strokeRect(x - size / 2, y - size / 2, size, size);
  });
}

/**
 * Quad Tree
 * from: https://github.com/georgedoescode/generative-utils/blob/master/src/createQtGrid.js
 */
const defaultQtOpts = {
  width: 1024,
  height: 1024,
  points: [],
  gap: 0,
  maxQtObjects: 10,
  maxQtLevels: 4,
};

function getIndividualQtNodes(node) {
  const individualNodes = [];

  (function r(node) {
    if (node.nodes.length === 0) {
      individualNodes.push(node);
    } else {
      node.nodes.forEach((n) => r(n));
    }
  })(node);

  return individualNodes;
}

function createQtGrid(opts) {
  opts = Object.assign({}, defaultQtOpts, opts);

  const quadTree = new Quadtree(
    {
      x: 0,
      y: 0,
      width: opts.width,
      height: opts.height,
    },
    opts.maxQtObjects,
    opts.maxQtLevels
  );

  opts.points.forEach((point) => {
    quadTree.insert(point);
  });

  const maxSubdivisions = Math.pow(2, opts.maxQtLevels);

  return {
    width: opts.width,
    height: opts.height,
    cols: maxSubdivisions,
    rows: maxSubdivisions,
    areas: getIndividualQtNodes(quadTree).map(({ bounds }) => {
      return {
        x: bounds.x + opts.gap,
        y: bounds.y + opts.gap,
        width: bounds.width - opts.gap * 2,
        height: bounds.height - opts.gap * 2,
      };
    }),
  };
}

canvasSketch(sketch, settings);
