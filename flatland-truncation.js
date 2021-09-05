const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const R = require('ramda');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 12,
  scaleToView: true,
};

const config = {
  bg: '#fad1c2',
  left: '#188F5C',
  right: '#FCBE31',
  polygon: '#fff',
  truncatedPolygon: '#f17447',
  lineWidth: 144,
};

const sketch = ({ width, height }) => {
  console.clear();
  Random.setSeed('truncation');

  let state = {
    vertexCount: 3,
    scale: 0,
  };

  const size = width;
  const c = size / 2;

  return {
    render({ context, width, height, playhead }) {
      context.fillStyle = config.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      state.vertexCount = loopNoise(
        { cx: 270, cy: 540, radius: width, offset: 0, range: [2, 5] }, // 3, 12
        playhead
      );
      state.scale = loopNoise(
        { cx: 810, cy: 540, radius: width, offset: 1000, range: [0, 2] }, // 0, 1
        playhead
      );

      const polygon = generatePolygon(state.vertexCount, size / 4, [
        width / 2,
        height / 2,
      ]);
      const midpoints = generateMidpoints(polygon);
      const splitVertices = generateSplitVertices(polygon, midpoints);
      const truncatedPolygon = truncatePolygon(splitVertices, state.scale);

      drawShape(
        context,
        [
          [-c, 0],
          [c, 0],
          [c, size],
          [-c, size],
        ],
        { fill: config.left }
      );
      drawShape(
        context,
        [
          [size, 0],
          [size, size],
          [c, size],
        ],
        { fill: config.right }
      );
      drawShape(context, polygon, {
        fill: config.polygon,
        stroke: config.polygon,
        lineWidth: config.lineWidth,
      });
      drawShape(context, truncatedPolygon, {
        fill: config.truncatedPolygon,
        stroke: config.truncatedPolygon,
        lineWidth: config.lineWidth * 0.75,
      });
    },
  };
};

canvasSketch(sketch, settings);

function loopNoise({ cx, cy, radius, offset, range }, playhead) {
  const v = Random.noise2D(
    (cx + radius * Math.cos(Math.PI * 2 * playhead) + offset) / 2000,
    (cy + radius * Math.sin(Math.PI * 2 * playhead) + offset) / 2000,
    2,
    1
  );

  return mapRange(v, -1, 1, range[0], range[1]);
}

function drawShape(context, shape, { fill, stroke, lineWidth }) {
  context.strokeStyle = stroke;
  context.fillStyle = fill;

  const [start, ...points] = shape;

  context.beginPath();
  context.moveTo(...start);
  points.forEach((point) => {
    context.lineTo(...point);
  });
  context.closePath();

  if (stroke) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = lineWidth;
    context.stroke();
  }
  if (fill) {
    context.fill();
  }
}

/**
 * Geometry
 */
function generatePolygon(vertexCount, r, center) {
  var theta = 360 / vertexCount;

  var polygon = R.map(function (i) {
    return polarToCart(r, theta * i, center);
  }, R.range(0, vertexCount));

  return polygon;
}

/**
 * Utilities
 */
function rad(a) {
  return (Math.PI * a) / 180;
}

function polarToCart(r, a, [cx, cy]) {
  return [cx - r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))];
}

function midpoint(u, v) {
  return [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
}

function lerp(start, stop, amt) {
  return amt * (stop - start) + start;
}

function generateMidpoints(vertices) {
  return vertices.map((vertex, idx, vertices) => {
    return idx === vertices.length - 1
      ? midpoint(vertex, vertices[0])
      : midpoint(vertex, vertices[idx + 1]);
  });
}

function generateSplitVertices(vertices, _mps) {
  var duplicate = R.chain(function (n) {
    return [n, n];
  });

  var splitVertices = duplicate(vertices);
  var mps = duplicate(_mps);

  return splitVertices.map((vertex, idx) => {
    if (idx === 0) {
      return [vertex, mps[mps.length - 1]];
    } else if (idx === 1) {
      return [vertex, mps[0]];
    } else if (idx % 2 === 0) {
      return [vertex, mps[idx - 1]];
    } else {
      return [vertex, mps[idx]];
    }
  });
}

function truncatePolygon(splitVertices, scale) {
  return R.map(function (pair) {
    // Pair consists of vertex + mp
    var x = lerp(pair[0][0], pair[1][0], scale);
    var y = lerp(pair[0][1], pair[1][1], scale);
    return [x, y];
  }, splitVertices);
}
