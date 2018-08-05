const { range, degreesToRadians } = require('./math');

function drawEqTriangle(context, side, cx, cy, color) {
  const h = side * (Math.sqrt(3) / 2);
  context.fillStyle = color;

  context.beginPath();
  context.moveTo(cx, cy - h / 2);
  context.lineTo(cx - side / 2, cy + h / 2);
  context.lineTo(cx + side / 2, cy + h / 2);
  context.lineTo(cx, cy - h / 2);
  context.fill();
}

function arcs(sideCount, radius, offset = 0) {
  const angle = 360 / sideCount;
  const vertexIndices = range(sideCount);

  return vertexIndices.map(index => {
    return {
      theta: degreesToRadians(offset + angle * index),
      r: radius,
    };
  });
}

function regularPolygon([cx, cy], sideCount, radius, offset = 0) {
  return arcs(sideCount, radius, offset).map(({ r, theta }) => [
    cx + r * Math.cos(theta),
    cy + r * Math.sin(theta),
  ]);
}

function translateAll([cx, cy], pts) {
  return pts.map(translate([cx, cy]));
}

function translate([cx, cy]) {
  return ({ r, theta }) => [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
}

function drawShape(context, [start, ...pts], closed = true) {
  context.beginPath();
  context.moveTo(...start);
  pts.forEach(pt => {
    context.lineTo(...pt);
  });
  if (closed) {
    context.closePath();
  }
}

module.exports = {
  drawEqTriangle,
  arcs,
  regularPolygon,
  translate,
  translateAll,
  drawShape,
  range,
};
