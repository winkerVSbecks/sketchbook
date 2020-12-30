const canvasSketch = require('canvas-sketch');
const { linspace, lerp, lerpArray } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    context.lineWidth = 10;
    context.lineJoin = 'round';

    const R = width / 4;
    const center = [width / 2, height / 2 + R / 4];

    const [a, b, c] = triangle(center, R);

    context.strokeStyle = '#ccc';
    drawPath(context, [a, b, c]);

    let k = 0;
    while (k < 1) {
      const [x1, y1] = lerpArray(a, c, k);
      const [x2, y2] = lerpArray(a, b, k + 0.05);
      k += 0.05;

      context.fillStyle = 'black';
      context.beginPath();
      context.fillRect(x1 - 2, y1 - 2, 4, 4);
      context.fillRect(x2 - 2, y2 - 2, 4, 4);
    }

    const done = false;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    let t4 = 0;
    let nextA, nextB;
    let paths = [];
    let state = 'ab';
    let count = 0;

    while (t1 < 1) {
      // t1 = Random.range(t1, Math.min(t1 + 0.25, 1));
      count++;

      const newState = nextState(state, t1, t2, nextA, nextB, [a, b, c]);
      paths.push(newState.path);
      state = newState.state;
      t1 = newState.t1;
      t2 = newState.t2;
      nextA = newState.nextA;
      nextB = newState.nextB;

      // if (state === 'ab') {
      //   t2 = Random.range(t2, t2 + 0.5);
      //   var u = lerpArray(a, c, t1);
      //   var v = lerpArray(a, b, t2);
      // } else {
      //   t2 = Random.range(t2, t2 + 0.5);
      //   var u = lerpArray(a, c, t1);
      //   var v = lerpArray(b, c, t2);
      // }

      // if (nextA && nextB) {
      //   paths.push([nextA, nextB, v, u]);
      // } else {
      //   paths.push([a, u, v]);
      // }

      // const t1Original = t1;
      // const t2Original = t2;
      // t1 = Math.min(t1 + 0.075, 1);
      // t2 = (t1 * t2) / t1Original;

      // if (state === 'ab') {
      //   nextB = lerpArray(a, b, t2);
      //   nextA = lerpArray(a, c, t1);
      // } else {
      //   nextB = lerpArray(b, c, t2);
      //   nextA = lerpArray(a, c, t1);
      // }

      // if (t2 === 1) {
      //   state = 'bc';
      //   // const t1Original = t1;
      //   // const t2Original = t2;

      //   // t1 = t1 + 0.075;
      //   // t2 = (t1 * t2) / t1Original;
      // }
    }

    context.strokeStyle = 'black';
    paths.forEach((path) => {
      drawPath(context, path);
    });
  };
};

canvasSketch(sketch, settings);

function nextState(state, t1, t2, nextA, nextB, [a, b, c]) {
  let path;

  t1 = Math.min(Random.range(t1, t1 + 0.25), 1);
  t2 = Math.min(Random.range(t2, t2 + 0.5), 1);
  const u = lerpArray(a, c, t1);

  if (t2 === 1) {
    state = 'bc';
    t2 = 0;
  }

  const v = state === 'ab' ? lerpArray(a, b, t2) : lerpArray(b, c, t2);

  if (nextA && nextB) {
    path = [nextA, nextB, v, u];
  } else {
    path = [a, u, v];
  }

  const t1Original = t1;
  t1 = Math.min(t1 + 0.05, 1);
  t2 = (t1 * t2) / t1Original;

  nextA = lerpArray(a, c, t1);
  nextB = state === 'ab' ? lerpArray(a, b, t2) : lerpArray(b, c, t2);

  return {
    state,
    path,
    t1,
    t2,
    nextA,
    nextB,
  };
}

function triangle([x, y], R) {
  return linspace(3).map((_, step) => [
    x + R * Math.cos((step * 2 * Math.PI) / 3 + Math.PI / 6),
    y + R * Math.sin((step * 2 * Math.PI) / 3 + Math.PI / 6),
  ]);
}

function drawPath(context, pts) {
  const [first, ...rest] = pts;

  context.beginPath();
  context.moveTo(...first);
  rest.forEach((pt) => {
    context.lineTo(...pt);
  });
  context.closePath();
  context.stroke();
}
