function heading([x, y]) {
  return Math.atan2(y, x);
}

function calcVec(x, y) {
  return [y - x, -x - y];
}

function normalize(n, start1, stop1, start2, stop2, withinBounds) {
  const v = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return v;
  }

  if (start2 < stop2) {
    return constrain(v, start2, stop2);
  } else {
    return constrain(v, stop2, start2);
  }
}

function constrain(n, low, high) {
  return Math.max(Math.min(n, high), low);
}

function noiseGrid(simplex, gridSize) {
  return (x, y, time, offset = 0) =>
    simplex.noise3D(
      x / (gridSize * 2) + offset,
      y / (gridSize * 2) + offset,
      time,
    );
}

function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

function randomNumber(start, end) {
  return Math.floor(Math.random() * end) + start;
}

function range(count) {
  return Array.from(Array(count).keys());
}

function degreesToRadians(angleInDegrees) {
  return (Math.PI * angleInDegrees) / 180;
}

module.exports = {
  heading,
  calcVec,
  normalize,
  constrain,
  noiseGrid,
  lerp,
  randomNumber,
  range,
  degreesToRadians,
};
