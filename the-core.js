const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 2,
  scaleToView: true,
  fps: 120,
};

const clrs = {
  bg: 'rgba(54, 29, 72)',
  pink: [252, 23, 125],
  orange: [253, 125, 36],
};

const sketch = () => {
  let u = [270, 540];
  let v = [405, 270];
  let w = [810, 540];

  return {
    begin({ context, width, height }) {},
    render({ context, width, height, playhead, deltaTime }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
    },
  };
};

canvasSketch(sketch, settings);

function createCuboid(size, color, offset, time) {
  this.now = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  var o_x = offset * Math.cos(Math.PI / 3);
  var o_y = offset * Math.sin(Math.PI / 3);

  const delta = [
    [-1.25 * o_x, 1.25 * o_y],
    [1.25 * o_x, -1.25 * o_y],
    [1.25 * o_x, -1.25 * o_y],
    [1.25 * o_x, -1.25 * o_y],
    [-1.25 * o_x, 1.25 * o_y],
    [-1.25 * o_x, 1.25 * o_y],
  ];

  const startPos = [
    [-size + 0.25 * o_x, -0.25 * o_y],
    [-size + size * cos(PI / 3) - 0.25 * o_x, 0.25 * o_y - size * sin(PI / 3)],
    [size * cos(PI / 3) - 0.25 * o_x, 0.25 * o_y - size * sin(PI / 3)],
    [size - 0.25 * o_x, 0.25 * o_y],
    [size * cos(PI / 3) + 0.25 * o_x, -0.25 * o_y + size * sin(PI / 3)],
    [-size + size * cos(PI / 3) + 0.25 * o_x, -0.25 * o_y + size * sin(PI / 3)],
  ];

  return {
    size,
    color,
    offset: offset,
    start: 0,
    time,
    startPos,
    delta,
  };
}

function updateCuboid({ now, startPos, delta, time }) {
  for (let i = now.length - 1; i >= 0; i--) {
    now[i].x = bounce(frameCount - start, startPos[i].x, delta[i].x, time);
    now[i].y = bounce(frameCount - start, startPos[i].y, delta[i].y, time);
  }
}

function resetCuboid({ now, startPos }) {
  for (var i = now.length - 1; i >= 0; i--) {
    now[i] = startPos[i].get();
  }
}

Cuboid.prototype.render = function () {
  noStroke();
  fill(this.col);
  beginShape();
  for (var i = 0; i < this.now.length; i++) {
    vertex(this.now[i].x, this.now[i].y);
  }
  endShape(CLOSE);
};

/**
 * Utils
 */
function bounce(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t);
}
