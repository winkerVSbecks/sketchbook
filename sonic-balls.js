const canvasSketch = require('canvas-sketch');
const { mapRange, clamp, damp, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const config = {
  balls: [0.5, 0.25, 0.125, 0.0625],
  colors: createColors(),
  t: 5,
  spacing: 40,
};

const state = {
  balls: [],
};

const sketch = () => {
  // Random.setSeed('545362');
  // Random.setSeed('281476');
  Random.setSeed(Random.getRandomSeed());
  console.log(Random.getSeed());

  return {
    begin({ width, height, canvas }) {
      canvas.style.boxShadow = 'none';
      state.balls = config.balls.reduce((balls, s, idx) => {
        const ball = makeBall(s, width, height, balls[idx - 1]);

        balls.push(ball);
        return balls;
      }, []);

      canvas.style.borderRadius = '50%';
      canvas.style.border = `${config.t / 4}px solid ${
        config.colors.ink[Math.floor(state.balls[0].r / config.spacing)]
      }`;
    },
    render({ context, width, height, time }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.colors.bg[1];
      context.fillRect(0, 0, width, height);

      state.balls.forEach((ball, idx, balls) => {
        if (idx > 0) {
          step(ball, balls[idx - 1], idx === 1);
        }
      });

      state.balls.forEach((ball, idx, balls) => {
        drawBall(
          context,
          ball,
          balls[idx - 1] || { x: width / 2, y: height / 2 },
          time
        );
      });
    },
  };
};

function makeBall(size, width, height, parent) {
  const r = size * width;

  if (!parent) {
    const angle = Random.range(0, Math.PI * 2);
    return {
      r,
      x: 0,
      y: 0,
      prev: { x: 0, y: 0 },
      vx: 0,
      vy: 0,
      patternShift: 0,
      ripple: { x: r * Math.cos(angle), y: r * Math.sin(angle), angle },
    };
  }

  // const angle = Math.PI + parent.ripple.angle;
  // const vel = 5; // Random.range(0.5, 1);

  // const [x, y] = Random.onCircle(parent.r - r - config.t * 2);
  // return {
  //   r,
  //   x: (r - config.t) * Math.cos(parent.ripple.angle),
  //   y: (r - config.t) * Math.sin(parent.ripple.angle),
  //   prev: { x: 0, y: 0 },
  //   vx: vel * Math.cos(angle),
  //   vy: vel * Math.sin(angle),
  //   patternShift: 0,
  //   ripple: {
  //     angle,
  //     x: r * Math.cos(angle),
  //     y: r * Math.sin(angle),
  //   },
  // };

  const [x, y] = Random.insideCircle(parent.r - r - config.t * 2);
  const vel = Random.range(0.5, 1);
  const angle = Random.range(0, Math.PI * 2);

  return {
    r,
    x: x,
    y: y,
    prev: { x: 0, y: 0 },
    vx: vel * Math.cos(angle),
    vy: vel * Math.sin(angle),
    patternShift: 0,
    ripple: {
      angle,
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    },
  };
}

function step(ball, parent, first) {
  const { x, y, vx, vy, prev } = ball;

  ball.prev = { x, y };
  ball.x = x + vx;
  ball.y = y + vy;

  const d = Math.hypot(ball.x, ball.y);

  if (Math.hypot(ball.x - prev.x, ball.y - prev.y) < 1) {
  } else if (outOfBounds(ball, parent)) {
    const vel = Math.hypot(vx, vy);
    var angleToCollisionPoint = Math.atan2(-y, x);
    var oldAngle = Math.atan2(-vy, vx);
    var newAngle = 2 * angleToCollisionPoint - oldAngle;

    ball.vx = -vel * Math.cos(newAngle);
    ball.vy = vel * Math.sin(newAngle);

    const angle = Math.atan2(ball.vy, ball.vx);

    ball.ripple.angle = angle;
    ball.ripple.x = ball.r * Math.cos(angle);
    ball.ripple.y = ball.r * Math.sin(angle);

    if (first) {
      const angleParent = Math.PI + angle;

      parent.ripple.angle = angleParent;
      parent.ripple.x = parent.r * Math.cos(angleParent);
      parent.ripple.y = parent.r * Math.sin(angleParent);
    }
  }
}

function drawBall(context, ball, parent, time) {
  const { r, x, y, patternShift, ripple } = ball;

  ball.patternShift = lerp(0, 40, time % 1);

  context.strokeStyle = config.colors.ink[Math.floor(r / config.spacing)];
  context.lineWidth = config.t;

  // [
  //   [r * Math.cos(ripple.angle), r * Math.sin(ripple.angle)],
  //   [
  //     r * Math.cos(Math.PI + ripple.angle),
  //     r * Math.sin(Math.PI + ripple.angle),
  //   ],
  // ].forEach(([_x, _y]) => {
  //   context.fillStyle = 'red';
  //   context.beginPath();
  //   context.arc(parent.x + x + _x, parent.y + y + _y, 25, 0, Math.PI * 2);
  //   context.fill();
  // });
  // context.fillStyle = config.colors.bg;

  context.translate(parent.x, parent.y);

  const gradient = context.createLinearGradient(
    x + r * Math.cos(ripple.angle),
    y + r * Math.sin(ripple.angle),
    x + r * Math.cos(Math.PI + ripple.angle),
    y + r * Math.sin(Math.PI + ripple.angle)
  );
  gradient.addColorStop(0, config.colors.bg[0]);
  gradient.addColorStop(1, config.colors.bg[1]);
  context.fillStyle = gradient;

  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.clip();

  for (let r1 = 0; r1 <= r; r1 += config.spacing) {
    context.strokeStyle = config.colors.ink[Math.floor(r1 / config.spacing)];
    const radius = r1 + patternShift;
    context.beginPath();
    context.arc(
      x + ripple.x - radius * Math.cos(ripple.angle),
      y + ripple.y - radius * Math.sin(ripple.angle),
      radius,
      0,
      Math.PI * 2
    );
    context.stroke();
  }
}

function outOfBounds({ x, y, r }, parent) {
  const d = Math.hypot(x, y);
  return d > parent.r - r - config.t;
}

function createColors() {
  const colorConfig = {
    total: 32,
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
    total: 3,
    hueCycle: 1,
    maxSaturationLight: [1, 0.5],
  });

  const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;
  const bgColors = darkColorSystem.light.map(hsl);

  // const bgColors = hsl(Random.pick(darkColorSystem.dark));
  const bg2 = hsl(Random.pick(darkColorSystem.dark));
  const inkColors = colorSystem.light.map(hsl);
  const ink = Random.pick(inkColors);

  return { bg: [bgColors[0], bgColors[2]], ink: inkColors };
}

canvasSketch(sketch, settings);
