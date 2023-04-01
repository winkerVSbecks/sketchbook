const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, lerpFrames } = require('canvas-sketch-util/math');
const chroma = require('chroma-js');
const load = require('load-asset');

const settings = {
  dimensions: [640, 640],
  animate: true,
  duration: 2,
  scaleToView: true,
  loop: true,
};

const colors = {
  surface: '#0000EC',
  highlight: '#fff',
  mid: 'rgba(255, 255, 255, 0.5)',
};

const config = {
  dotSize: 4,
  dotSpacing: 24,
  dotOffset: 10,
  margin: 24,
};

const sketch = ({ width, height }) => {
  const grid = makeGrid({ width, height });
  const bits = new Array(20).fill(0).map(() => {
    const type = Random.weightedSet([
      { value: 'pulse', weight: 50 },
      { value: 'arc', weight: 50 },
      { value: 'gradientStroke', weight: 200 },
    ]); //Random.pick(['pulse', 'arc', 'gradientStroke']);
    const location = pickFromGrid(grid);
    const path = createPath({ start: location, grid, stepCount: 16 });

    return {
      ...location,
      type,
      offset: Random.range(0, 1),
      path,
      lineWidth:
        type === 'gradientStroke' ? config.dotSize : config.dotSize / 2,
    };
  });

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = colors.surface;
      context.fillRect(0, 0, width, height);

      drawDots({ context, grid });

      bits.forEach(({ type, ...embellishment }) => {
        embellishments[type]({
          context,
          radius: config.dotSpacing * 0.5,
          lineWidth: config.dotSize / 2,
          playhead,
          ...embellishment,
        });
      });

      context.fillStyle = colors.mid;
      const s = width * 0.25;
      context.fillRect(width / 2 - s / 2, height / 2 - s / 2, s, s);
    },
  };
};

canvasSketch(sketch, settings);

/**
 * Grid
 */
function makeGrid({ width, height }) {
  const res = [
    Math.ceil((width - 2 * config.dotOffset) / config.dotSpacing),
    Math.ceil((height - 2 * config.dotOffset) / config.dotSpacing),
  ];
  const pts = [];

  const skipX = Math.floor(res[1] / 3);
  const skipY = Math.floor(res[1] / 3);

  for (let y = 1; y < res[1]; y++) {
    for (let x = 1; x < res[0]; x++) {
      if (x < skipX || x >= res[0] - skipX || y < skipY || y > res[1] - skipY) {
        pts.push({
          x: config.dotOffset + x * config.dotSpacing,
          y: config.dotOffset + y * config.dotSpacing,
          occupied: false,
        });
      }
    }
  }
  return pts;
}

function drawDots({ context, grid }) {
  grid.forEach(({ x, y }) => {
    context.fillStyle = colors.mid;
    // draw circle at i, j
    context.beginPath();
    context.arc(x, y, config.dotSize / 2, 0, 2 * Math.PI);
    context.fill();
  });
}

function plus({ context, width, height }) {
  context.save();
  context.lineWidth = 4;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  const x = 480;
  const y = height / 2;
  const size = 20;

  context.strokeStyle = colors.highlight;
  context.beginPath();
  context.moveTo(x, y - size);
  context.lineTo(x, y + size);
  context.moveTo(x - size, y);
  context.lineTo(x + size, y);
  context.stroke();

  context.restore();
}

/**
 * Embellishments
 */
const embellishments = {
  arc,
  pulse,
  gradientStroke,
};

function pickFromGrid(grid) {
  const notOccupied = grid.filter((pt) => !pt.occupied);
  const pt = Random.pick(notOccupied);
  if (pt) {
    pt.occupied = true;
    return pt;
  }
  return null;
}

// generate a path by following the grid
function createPath({ start, grid, stepCount }) {
  const path = [start];
  let current = start;
  let next = null;

  const findNext = ({ current, grid }) => {
    const { x, y } = current;
    const candidates = grid.filter(
      (pt) =>
        (pt.x === x && Math.abs(pt.y - y) === config.dotSpacing) ||
        (pt.y === y &&
          Math.abs(pt.x - x) === config.dotSpacing &&
          !path.includes(pt))
    );

    return pickFromGrid(candidates);
  };

  for (let i = 0; i < stepCount; i++) {
    next = findNext({ current, grid });
    if (next) {
      path.push(next);
      current = next;
    } else {
      return null;
    }
  }

  return path;
}

function gradientStroke({ context, path, lineWidth = 1, playhead }) {
  if (!path) return;
  context.save();
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  // Draw segments with gradient
  const length = path.length;

  // const gradient = context.createLinearGradient(
  //   path[length - 2].x,
  //   path[length - 2].y,
  //   path[length - 1].x,
  //   path[length - 1].y
  // );

  // gradient.addColorStop(0, colors.highlight);
  // gradient.addColorStop(1, 'rgb(0 0 236 / 0%)');

  // for (let i = 1; i < length; i++) {
  //   context.strokeStyle = i === length - 1 ? gradient : colors.highlight;
  //   context.beginPath();
  //   context.moveTo(path[i - 1].x, path[i - 1].y);
  //   context.lineTo(path[i].x, path[i].y);
  //   context.stroke();
  // }

  const points = calcWaypoints(path);
  const head = Math.floor((points.length - 1) * playhead);
  const tail = Math.floor(
    mapRange(playhead, 0.25, 1, 1, points.length - 1, true)
  );

  // draw a line segment from the last waypoint
  // to the current waypoint
  const scale = chroma.scale([colors.surface, colors.highlight]);

  for (let idx = tail; idx < head; idx++) {
    const gradient = context.createLinearGradient(
      points[idx - 1].x,
      points[idx - 1].y,
      points[idx].x,
      points[idx].y
    );

    gradient.addColorStop(0, scale(mapRange(idx - 1, 1, head, 0, 1)).css());
    gradient.addColorStop(1, scale(mapRange(idx, 1, head, 0, 1)).css());

    context.strokeStyle = gradient; //idx > 1 && idx > t - 50 ? gradient : colors.highlight;
    context.beginPath();
    context.moveTo(points[idx - 1].x, points[idx - 1].y);
    context.lineTo(points[idx].x, points[idx].y);
    context.stroke();
  }
  context.restore();
}

// calc waypoints traveling along vertices
function calcWaypoints(vertices) {
  var waypoints = [];
  for (var i = 1; i < vertices.length; i++) {
    var pt0 = vertices[i - 1];
    var pt1 = vertices[i];
    var dx = pt1.x - pt0.x;
    var dy = pt1.y - pt0.y;
    for (var j = 0; j < 100; j++) {
      var x = pt0.x + (dx * j) / 100;
      var y = pt0.y + (dy * j) / 100;
      waypoints.push({
        x: x,
        y: y,
      });
    }
  }
  return waypoints;
}

const PI_25 = 0.25 * Math.PI;
const PI_1_75 = 1.75 * Math.PI;

function arc({ context, x, y, radius, offset, lineWidth = 1, playhead }) {
  context.save();
  context.lineWidth = lineWidth;
  context.strokeStyle = colors.highlight;

  const start = lerpFrames([PI_25, PI_25, PI_1_75], playhead);
  const end = lerpFrames([PI_25, PI_1_75, PI_1_75], playhead);

  context.translate(x, y);
  context.rotate(offset * Math.PI + 2 * Math.PI * playhead);
  context.beginPath();
  context.arc(0, 0, radius, start, end);
  context.stroke();

  context.restore();
}

function pulse({ context, x, y, radius, lineWidth = 1, playhead }) {
  context.save();
  context.lineWidth = lineWidth;

  const alpha = lerpFrames([0, 1, 1, 0], playhead);
  const r = radius * playhead;

  context.strokeStyle = `rgba(255, 255, 255, ${alpha})`; // colors.highlight;
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI);
  context.stroke();

  context.restore();
}
