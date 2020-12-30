const canvasSketch = require('canvas-sketch');
const { linspace, lerpArray } = require('canvas-sketch-util/math');
const eases = require('eases');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  duration: 2,
};

const sketch = ({ width, height }) => {
  const R = width / 4;
  const center = [width / 2, height / 2 + R / 4];

  const [a, b, c] = triangle(center, R);

  let t1 = 0;
  let t2 = 0;
  let t3 = 0;
  let t4 = 0;
  let paths = [];
  let state = 'ab';
  let from = { t1, t2 };

  while (t3 < 1) {
    const newState = nextState(state, t1, t2, t3, t4, [a, b, c], from);
    paths.push(newState.path);
    state = newState.state;
    t1 = newState.t1;
    t2 = newState.t2;
    t3 = newState.t3;
    t4 = newState.t4;
    from = newState.from;
  }

  return ({ context, width, height, playhead }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    context.lineWidth = 10;
    context.lineJoin = 'round';

    context.strokeStyle = '#ccc';
    // drawPath(context, [a, b, c]);

    context.strokeStyle = '#333';
    context.fillStyle = '#333';
    const pingPonPlayhead = Math.sin(Math.PI * playhead);
    const t = eases.expoInOut(pingPonPlayhead);
    paths.forEach((path) => {
      const p = path.from.map((pt, idx) => lerpArray(pt, path.to[idx], t));

      drawPath(context, p);
      context.fill();
    });
  };
};

canvasSketch(sketch, settings);

function nextState(state, t1, t2, t3, t4, [a, b, c], from) {
  let path,
    wraps = false;

  t3 = Math.min(Random.range(t1, t1 + 0.25), 1);
  t3 = t3 > 0.95 ? 1 : t3;
  t4 =
    state === 'ab'
      ? Random.range(t2, t2 + 0.75)
      : Math.min(Random.range(t2, t2 + 0.25), 1);

  if (t3 === 1) {
    t4 = 1;
  }

  const u = lerpArray(a, c, t1);
  const fromU = lerpArray(a, c, from.t1);
  const v = state === 'ab' ? lerpArray(a, b, t2) : lerpArray(b, c, t2);
  const fromV =
    state === 'ab' ? lerpArray(a, b, from.t2) : lerpArray(b, c, from.t2);

  if (t2 <= 1 && t4 > 1) {
    state = 'bc';
    wraps = true;
    t4 = Random.range(0.1, 0.25);
  }

  const w = state === 'ab' ? lerpArray(a, b, t4) : lerpArray(b, c, t4);
  const x = lerpArray(a, c, t3);

  const pathFrom = wraps ? [fromU, fromV, b, w, x] : [fromU, fromV, w, x];
  const pathTo = wraps ? [u, v, b, w, x] : [u, v, w, x];

  path = { from: pathFrom, to: pathTo };

  from = { t1: t3, t2: t4 };

  t1 = Math.min(t3 + 0.05, 1);
  t2 = Math.min(nextT2(state, t1, t3, t4), 1);

  return {
    state,
    path,
    t1,
    t2,
    t3,
    t4,
    from,
  };
}

function nextT2(state, t1, t3, t4) {
  if (state === 'ab') {
    return (t4 * t1) / t3;
  }

  const t1Prime = 1 - t1;
  const t3Prime = 1 - t3;
  const t4Prime = 1 - t4;

  return 1 - (t4Prime * t1Prime) / t3Prime;
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
