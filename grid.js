const lerp = require('lerp');
const { range } = require('./math');

function rectGrid({
  size = { x: 1, y: 1 },
  resolution = { x: 30, y: 30 },
  padding = { x: 0.15, y: 0.15 },
  forEach = x => x,
}) {
  const _padding = { x: size.x * padding.x, y: size.y * padding.y };
  const tileSize = {
    x: (size.x - _padding.x * 2) / resolution.x,
    y: (size.y - _padding.y * 2) / resolution.y,
  };

  let pts = [];
  const step = {
    x:
      lerp(_padding.x, size.x - _padding.x, 1 / (resolution.x - 1)) -
      _padding.x,
    y:
      lerp(_padding.y, size.y - _padding.y, 1 / (resolution.y - 1)) -
      _padding.y,
  };

  for (let y = 0; y < resolution.y; y++) {
    for (let x = 0; x < resolution.x; x++) {
      // get a 0..1 UV coordinate
      const u = resolution.x <= 1 ? 0.5 : x / (resolution.x - 1);
      const v = resolution.y <= 1 ? 0.5 : y / (resolution.y - 1);

      const pt = {
        x: lerp(_padding.x, size.x - _padding.x, u),
        y: lerp(_padding.y, size.y - _padding.y, v),
        s: tileSize,
        xIdx: x,
        yIdx: y,
        step,
      };

      pts.push(pt);
      forEach(pt);
    }
  }

  return pts;
}

function squareGrid({ size, resolution, padding = 0.15, forEach = () => {} }) {
  return rectGrid({
    size: { x: size, y: size },
    resolution: { x: resolution, y: resolution },
    padding: { x: padding, y: padding },
    forEach: ({ x, y, s }) => {
      forEach({ x, y, s: s.x });
    },
  });
}

module.exports = {
  rectGrid,
  squareGrid,
};
