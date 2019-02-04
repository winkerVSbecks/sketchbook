// title: Space Zap

/**
 * https://script-8.github.io/?id=2cea0ddcdd12f23557912f375beece10
 * https://script-8.github.io/?id=badd4f3b48e41f24a41d2650122ce6be
 */
const size = 128;

const targets = [[32, 32], [32, 64], [72, 64], [96, 96]];

initialState = {
  rotation: 0,
  point: [64, 64],
  stars: range(64).map(() => ({
    x: random(0, size),
    y: random(0, size),
    type: random(0, 7),
  })),
  targets: targets,
  meteors: targets.map(c => [
    regularPolygon(c, 6, 16),
    regularPolygon(c, 6, 12),
    regularPolygon(c, 6, 8),
    regularPolygon(c, 6, 4),
  ]),
};

const drawStar = ({ x, y, type }) => {
  sprite(x, y, type);
};

const drawMeteor = angle => (parts, mIdx) => {
  parts.forEach((m, idx) => polyStroke(m, angle + 45 * mIdx, 5 - idx));
};

const drawBeam = (point, target) => {
  if (point && target) {
    line(point[0], point[1], target[0], target[1], 0);
  }
};

update = (state, input, elapsed) => {
  state.totalElapsed += elapsed;
  state.rotation = getRotation(state.totalElapsed);

  state.playhead = state.totalElapsed / 4000;

  if (state.playhead > 1) {
    state.totalElapsed = 0;
    state.playhead = 0;
    state.point = [random(0, 128), random(0, 128)];
  }

  // Choose one of the N targets based on loop time
  const targetIndex = Math.floor(state.playhead * state.targets.length);
  const target = state.targets[targetIndex];

  // Determine a rate at which we will step forward each frame,
  // making it dependent on the time elapsed since last frame
  const rate = (4 * elapsed) / 1000;

  if (target) {
    state.target = target;

    // Interpolate toward the target point at this rate
    const next = [
      lerp(state.point[0], target[0], rate),
      lerp(state.point[1], target[1], rate),
    ];

    state.point = next;
  }
};

draw = state => {
  clear();
  const { angle } = state;
  rectFill(0, 0, size, size, 7);
  state.stars.forEach(drawStar);
  state.meteors.forEach(drawMeteor(state.rotation));
  drawBeam(state.point, state.target);
};

/**
 * Utils
 */
function regularPolygon([cx, cy], sideCount, radius, offset = 0) {
  const angle = 360 / sideCount;
  const vertexIndices = range(sideCount);

  return vertexIndices
    .map(index => {
      return {
        theta: degreesToRadians(offset + angle * index),
        r: radius,
      };
    })
    .map(({ r, theta }) => [
      cx + r * Math.cos(theta),
      cy + r * Math.sin(theta),
    ]);
}

function degreesToRadians(angleInDegrees) {
  return (Math.PI * angleInDegrees) / 180;
}

function getRotation(milliseconds) {
  return milliseconds / 20;
}

function lerp(min, max, t) {
  return min * (1 - t) + max * t;
}
