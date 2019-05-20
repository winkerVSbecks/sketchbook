const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { pointInPoly } = require('point-util');
const { Delaunay } = require('d3-delaunay');
const { drawShape } = require('./geometry');

const settings = {
  dimensions: [2400, 2400],
  scaleToView: false,
};

const clr = () => Random.pick(['#4A3E3E', '#fff648', '#feb6de', '#fa530a']);
const clrs = {
  blue: '#c4f4fe',
  black: '#4A3E3E',
  yellow: '#fff648',
  pink: '#feb6de',
  red: '#fa530a',
};

canvasSketch(() => {
  let pts;
  let fills = [];
  let fill = clr();

  return {
    render({ context, width, height, playhead }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#c4f4fe';
      context.fillRect(0, 0, width, height);

      // // Random Polygons
      // const polygons = linspace(25).map(() => {
      //   const location = [
      //     Random.gaussian(width * 0.5, width * 0.4),
      //     Random.gaussian(height * 0.5, height * 0.4),
      //   ];
      //   return {
      //     polygon: randomPolygon(height * 0.125, height * 0.25, location),
      //     draw: getFill(),
      //   };
      // });

      // // Poisson Disc Sampler Polygons
      // const polygons = [
      //   ...poissonDiscSampler(0, 0, width, height, width * 0.2),
      // ].map(location => {
      //   return {
      //     polygon: randomPolygon(height * 0.125, height * 0.25, location),
      //     draw: getFill(),
      //   };
      // });

      // Poisson Disc Sampler Polygons + Voronoi
      const pts = [...poissonDiscSampler(0, 0, width, height, width * 0.1)];
      const delaunay = Delaunay.from(pts);
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      const polygons = [...voronoi.cellPolygons()].map(polygon => ({
        polygon,
        draw: getFill(),
      }));

      polygons.forEach(({ polygon, draw }) => {
        draw(context, polygon, width * 0.01);
      });
    },
  };
}, settings);

function randomPolygon(min, max, [cx, cy]) {
  return [0, 1, 2, 3].map(i => {
    const r = Random.range(min, max);
    (2 * Math.PI) / 4;
    const theta = Random.range(
      (2 * Math.PI * i) / 4,
      (2 * Math.PI * (i + 1)) / 4,
    );
    return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
  });
}

function makeGradient(context, [x1, y1], [x2, y2], start, end) {
  const gradient = context.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
}

function spaceFill(context, polygon, size, fill = clrs.blue) {
  const [xMin, yMin, xMax, yMax] = [
    polygon.reduce((a, [x, y]) => Math.min(a, x), polygon[0][0]),
    polygon.reduce((a, [x, y]) => Math.min(a, y), polygon[0][1]),
    polygon.reduce((a, [x, y]) => Math.max(a, x), polygon[0][0]),
    polygon.reduce((a, [x, y]) => Math.max(a, y), polygon[0][1]),
  ];

  const points = [...poissonDiscSampler(xMin, yMin, xMax, yMax, size * 2)];

  context.save();
  let region = new Path2D();
  const [first, ...rest] = polygon;

  region.moveTo(...first);
  rest.forEach(pt => {
    region.lineTo(...pt);
  });
  region.closePath();
  context.clip(region, 'evenodd');

  context.fillStyle = fill;
  points.forEach(([x, y]) => {
    context.beginPath();
    context.arc(x, y, Random.range(size * 0.125, size * 0.5), 0, 2 * Math.PI);
    context.fill();
  });

  context.restore();
}

function getFill() {
  return Random.weightedSet([
    // {
    //   weight: 50,
    //   value: (context, polygon) => {
    //     context.fillStyle = makeGradient(
    //       context,
    //       polygon[0],
    //       polygon[2],
    //       clrs.pink,
    //       clrs.red,
    //     );
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    // {
    //   weight: 50,
    //   value: (context, polygon) => {
    //     context.fillStyle = makeGradient(
    //       context,
    //       polygon[0],
    //       polygon[2],
    //       clrs.red,
    //       clrs.yellow,
    //     );
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    // {
    //   weight: 50,
    //   value: (context, polygon) => {
    //     context.fillStyle = clrs.blue;
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    // {
    //   weight: 20,
    //   value: (context, polygon) => {
    //     context.fillStyle = clrs.red;
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    // {
    //   weight: 20,
    //   value: (context, polygon) => {
    //     context.fillStyle = clrs.yellow;
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    // {
    //   weight: 20,
    //   value: (context, polygon) => {
    //     context.fillStyle = clrs.pink;
    //     drawShape(context, polygon);
    //     context.fill();
    //   },
    // },
    {
      weight: 100,
      value: (context, polygon, size) => {
        context.fillStyle = clrs.black;
        context.strokeStyle = clrs.black;
        drawShape(context, polygon);
        context.fill();
        context.stroke();
        spaceFill(context, polygon, size, clrs.blue);
      },
    },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.black;
    //     context.strokeStyle = clrs.black;
    //     drawShape(context, polygon);
    //     context.fill();
    //     context.stroke();
    //     spaceFill(context, polygon, size, clrs.pink);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.black;
    //     context.strokeStyle = clrs.black;
    //     drawShape(context, polygon);
    //     context.fill();
    //     context.stroke();
    //     spaceFill(context, polygon, size, clrs.yellow);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.black;
    //     context.strokeStyle = clrs.black;
    //     drawShape(context, polygon);
    //     context.fill();
    //     context.stroke();
    //     spaceFill(context, polygon, size, clrs.red);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.pink;
    //     drawShape(context, polygon);
    //     context.fill();
    //     spaceFill(context, polygon, size, clrs.red);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.red;
    //     drawShape(context, polygon);
    //     context.fill();
    //     spaceFill(context, polygon, size, clrs.yellow);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.red;
    //     drawShape(context, polygon);
    //     context.fill();
    //     spaceFill(context, polygon, size, clrs.yellow);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.yellow;
    //     drawShape(context, polygon);
    //     context.fill();
    //     spaceFill(context, polygon, size, clrs.pink);
    //   },
    // },
    // {
    //   weight: 100,
    //   value: (context, polygon, size) => {
    //     context.fillStyle = clrs.blue;
    //     drawShape(context, polygon);
    //     context.fill();
    //     spaceFill(context, polygon, size, clrs.yellow);
    //   },
    // },
  ]);
}

/**
 * https://observablehq.com/@mbostock/the-delaunays-dual
 */
function* poissonDiscSampler(x0, y0, x1, y1, radius) {
  const k = 30; // maximum number of samples before rejection
  const width = x1 - x0;
  const height = y1 - y0;
  const radius2 = radius * radius;
  const radius2_3 = 3 * radius2;
  const cellSize = radius * Math.SQRT1_2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight);
  const queue = [];

  // Pick the first sample.
  yield sample(
    width / 2 + Math.random() * radius,
    height / 2 + Math.random() * radius,
  );

  // Pick a random existing sample from the queue.
  pick: while (queue.length) {
    const i = (Math.random() * queue.length) | 0;
    const parent = queue[i];

    // Make a new candidate between [radius, 2 * radius] from the existing sample.
    for (let j = 0; j < k; ++j) {
      const a = 2 * Math.PI * Math.random();
      const r = Math.sqrt(Math.random() * radius2_3 + radius2);
      const x = parent[0] + r * Math.cos(a);
      const y = parent[1] + r * Math.sin(a);

      // Accept candidates that are inside the allowed extent
      // and farther than 2 * radius to all existing samples.
      if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) {
        yield sample(x, y);
        continue pick;
      }
    }

    // If none of k candidates were accepted, remove it from the queue.
    const r = queue.pop();
    if (i < queue.length) queue[i] = r;
  }

  function far(x, y) {
    const i = (x / cellSize) | 0;
    const j = (y / cellSize) | 0;
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, gridWidth);
    const j1 = Math.min(j + 3, gridHeight);
    for (let j = j0; j < j1; ++j) {
      const o = j * gridWidth;
      for (let i = i0; i < i1; ++i) {
        const s = grid[o + i];
        if (s) {
          const dx = s[0] - x;
          const dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }
    return true;
  }

  function sample(x, y, parent) {
    queue.push(
      (grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = [x, y]),
    );
    return [x + x0, y + y0];
  }
}
