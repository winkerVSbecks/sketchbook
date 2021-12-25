const canvasSketch = require('canvas-sketch');
const { mapRange, clamp, damp, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  // duration: 6,
  // fps: 6,
  // playbackRate: 'throttle',
};

const config = {
  balls: [0.5, 0.25, 0.125, 0.0625],
  colors: createColors(),
  t: 10,
};

const state = {
  balls: [],
};

const sketch = () => {
  return {
    begin({ width, height, canvas }) {
      canvas.style.borderRadius = '50%';
      canvas.style.border = `${config.t / 4}px solid ${config.colors.ink}`;
      canvas.style.boxShadow = 'none';
      state.balls = config.balls.reduce((balls, s, idx) => {
        const ball = makeBall(s, width, height, balls[idx - 1]);

        balls.push(ball);
        return balls;
      }, []);
    },
    render({ context, width, height, time }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.colors.bg;
      context.fillRect(0, 0, width, height);

      state.balls.forEach((ball, idx, balls) => {
        if (idx > 0) {
          step(ball, balls[idx - 1], time);
        }
      });

      state.balls.forEach((ball, idx, balls) => {
        drawBall(
          context,
          ball,
          balls[idx - 1] || { x: width / 2, y: height / 2 }
        );
      });
    },
  };
};

function makeBall(size, width, height, parent) {
  const r = size * width;

  if (!parent) {
    return { r, x: 0, y: 0, vx: 0, vy: 0, patternShift: 0 };
  }

  const [x, y] = Random.insideCircle(parent.r - r);

  return {
    r,
    x: x,
    y: y,
    vx: Random.range(-2, 2),
    vy: Random.range(-2, 2),
    patternShift: 0,
  };
}

function step(ball, parent, time) {
  const { x, y, vx, vy } = ball;

  ball.x = x + vx;
  ball.y = y + vy;
  ball.patternShift = lerp(0, 40, time % 1);

  if (outOfBounds(ball, parent)) {
    var distanceFromCenter = Math.hypot(x, y);

    var normalMagnitude = distanceFromCenter;
    var normalX = x / normalMagnitude;
    var normalY = y / normalMagnitude;

    var tangentX = -normalY;
    var tangentY = normalX;

    var normalSpeed = -(normalX * ball.vx + normalY * ball.vy);
    var tangentSpeed = tangentX * ball.vx + tangentY * ball.vy;

    ball.vx = normalSpeed * normalX + tangentSpeed * tangentX;
    ball.vy = normalSpeed * normalY + tangentSpeed * tangentY;

    // const angle = Math.atan2(y, x);
    // ball.x = Math.cos(angle) * (parent.r - r);
    // ball.y = Math.sin(angle) * (parent.r - r);
  }
}

function outOfBounds({ x, y, r }, parent) {
  const d = Math.hypot(x, y);
  return d > parent.r - r;
}

function drawBall(context, ball, parent) {
  const { r, x, y, patternShift } = ball;
  context.lineWidth = config.t;
  context.strokeStyle = config.colors.ink;
  context.fillStyle = config.colors.bg;

  context.translate(parent.x, parent.y);

  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.clip();

  for (let r1 = 0; r1 <= r; r1 += 40) {
    context.beginPath();
    context.arc(x, y, r1 + patternShift, 0, Math.PI * 2);
    context.stroke();
  }
}

function createColors() {
  const colorConfig = {
    total: 1,
    centerHue: Random.range(0, 360),
    hueCycle: 0,
    curveMethod: 'lamé',
    curveAccent: 0.2,
    offsetTint: 0.251,
    offsetShade: 0.01,
    tintShadeHueShift: 0.0,
    offsetCurveModTint: 0.03,
    offsetCurveModShade: 0.03,
    minSaturationLight: [0, 0],
    maxSaturationLight: [1, 1],
  };

  const colorSystem = generateRandomColorRamp(colorConfig);

  const darkColorSystem = generateRandomColorRamp({
    ...colorConfig,
    maxSaturationLight: [1, 0.5],
  });

  const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;
  const bg = hsl(Random.pick(darkColorSystem.dark));
  const inkColors = colorSystem.light.map(hsl).filter((c) => c !== bg);
  const ink = Random.pick(inkColors);

  return { bg, ink };
}

canvasSketch(sketch, settings);
