const canvasSketch = require('canvas-sketch');
const { mapRange, lerp, lerpFrames } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  duration: 24,
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

const sketch = ({ width, height, canvas }) => {
  Random.setSeed(Random.getRandomSeed());
  console.log(Random.getSeed());

  state.balls = config.balls.reduce((balls, s, idx) => {
    const ball = makeBall(s, width, height, balls[idx - 1]);

    balls.push(ball);
    return balls;
  }, []);

  canvas.style.boxShadow = 'none';
  canvas.style.borderRadius = '50%';
  canvas.style.border = `${config.t / 4}px solid ${
    config.colors.ink[Math.floor(state.balls[0].r / config.spacing)]
  }`;

  return ({ context, width, height, time, playhead }) => {
    // clear
    context.clearRect(0, 0, width, height);
    context.fillStyle = config.colors.bg[1];
    context.fillRect(0, 0, width, height);

    const pingPongPlayhead = lerpFrames([-1, 0, 1], playhead);

    state.balls.forEach((ball, idx, balls) => {
      if (idx > 0) {
        step(ball, balls[idx - 1], pingPongPlayhead);
      }
    });

    state.balls.forEach((ball, idx, balls) => {
      drawBall(
        context,
        ball,
        balls[idx - 1] || { x: width / 2, y: height / 2 },
        time,
        pingPongPlayhead
      );
    });
  };
};

function makeBall(size, width, height, parent) {
  const r = size * width;

  if (!parent) {
    const angleA = Random.range(0, Math.PI * 2);
    const angleB = Math.PI + angleA;
    return {
      r,
      x: 0,
      y: 0,
      patternShift: 0,
      rippleA: {
        x: r * Math.cos(angleA),
        y: r * Math.sin(angleA),
        angle: angleA,
      },
      rippleB: {
        x: r * Math.cos(angleB),
        y: r * Math.sin(angleB),
        angle: angleB,
      },
    };
  }

  const angle = parent.rippleB.angle;
  const x = r * Math.cos(parent.rippleA.angle);
  const y = r * Math.sin(parent.rippleA.angle);

  return {
    r,
    x,
    y,
    posA: {
      x,
      y,
    },
    posB: {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    },
    patternShift: 0,
    rippleA: {
      angle,
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    },
    rippleB: {
      angle: parent.rippleA.angle,
      x: r * Math.cos(parent.rippleA.angle),
      y: r * Math.sin(parent.rippleA.angle),
    },
  };
}

function step(ball, parent, playhead) {
  const { posA, posB } = ball;

  if (playhead < 0) {
    const t = Math.abs(playhead);
    ball.x = mapRange(t, 1, 0, posA.x, posB.x);
    ball.y = mapRange(t, 1, 0, posA.y, posB.y);
  } else {
    ball.x = mapRange(playhead, 0, 1, posB.x, posA.x);
    ball.y = mapRange(playhead, 0, 1, posB.y, posA.y);
  }
}

function drawBall(context, ball, parent, time, playhead) {
  const { r, x, y, patternShift, rippleA, rippleB } = ball;

  // Animate ripple
  ball.patternShift = lerp(0, 40, time % 1);

  context.strokeStyle = config.colors.ink[Math.floor(r / config.spacing)];
  context.lineWidth = config.t;

  context.translate(parent.x, parent.y);

  // Pick ripple direction
  const ripple = playhead < 0 ? rippleA : rippleB;

  // Background gradient fill
  const gradient = context.createLinearGradient(
    x + r * Math.cos(ripple.angle),
    y + r * Math.sin(ripple.angle),
    x + r * Math.cos(Math.PI + ripple.angle),
    y + r * Math.sin(Math.PI + ripple.angle)
  );
  gradient.addColorStop(0, config.colors.bg[0]);
  gradient.addColorStop(1, config.colors.bg[1]);
  context.fillStyle = gradient;

  // Outline
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Clip to ball shape
  context.clip();

  // Draw ripples
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
  const inkColors = colorSystem.light.map(hsl);

  return { bg: [bgColors[0], bgColors[2]], ink: inkColors };
}

canvasSketch(sketch, settings);
