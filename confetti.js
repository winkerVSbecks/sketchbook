const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const Color = require('canvas-sketch-util/color');
const tween = require('./tween');
const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [600, 800],
  // scaleToView: true,
  animate: true,
  duration: 2,
  // playbackRate: 'throttle',
  // fps: 24,
};

const DEBUG = {
  one: false,
  decay: true,
  gravity: true,
  tilt: true,
  wobble: true,
};

const colors = [
  '#FB3C52',
  '#FB552A',
  '#57BAFA',
  '#F6FEA6',
  '#FC4654',
  '#FED039',
  '#B6A8DE',
  '#FB5E95',
  '#FD8533',
  '#54A976',
  '#2D76C7',
  '#FC4D5E',
  '#FDF349',
  '#459A69',
].map((c) => Color.parse(c).rgb);

const options = {
  particleCount: DEBUG.one ? 1 : 50,
  radiusRatio: DEBUG.one ? 0.04 : 0.03,
  animDelay: 600,
  noInteractionWait: 5000,
  velocityFactor: DEBUG.one ? 0.075 : 0.08,
  decay: 0.94,
  gravity: 3,
  x: 0,
  y: 0,
  colors,
};

const sketch = ({ width, height }) => {
  let particles = Array.from(Array(options.particleCount).keys()).map(() =>
    createParticle({ width, height }, 0, {
      ...options,
      x: 0,
      y: 0,
    })
  );

  return {
    render({ context, width, height, frame }) {
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);

      // update physics
      particles.forEach((particle) => {
        updateParticle({ width, height }, frame, particle);
      });
      // draw
      particles.forEach((particle) => {
        drawParticle(context, frame, particle);
      });
    },
    begin({ width, height }) {
      const x = DEBUG.one ? width * 0.5 : Random.range(0, width);
      const y = DEBUG.one ? height * 0.9 : Random.range(0, height);

      particles = resetParticles({ width, height }, x, y, particles, options);
    },
  };
};

canvasSketch(sketch, settings);

/**
 * Particles
 */
export function createParticle({ width, height }, maxDist, opts) {
  const endPos = setEndLocation({ width, height }, opts.x, opts.y);
  const angle = DEBUG.one
    ? -Math.PI / 2
    : launchAngle([opts.x, opts.y], endPos);

  const longestEdge = (width > height ? width : height) * 0.5;

  const velocity = launchVelocity(
    maxDist,
    [opts.x, opts.y],
    endPos,
    longestEdge * opts.velocityFactor
  );

  const radius = Math.max(longestEdge * opts.radiusRatio, 6);

  return {
    alive: true,
    x: opts.x,
    y: opts.y,
    velocity,
    angle,
    colors: [Random.pick(opts.colors), Random.pick(opts.colors)],
    decay: opts.decay,
    gravity: opts.gravity,
    radius,
    random: Random.range(200, 800),
    tiltAngle: Random.range(0, Math.PI * 2),
    totalTicks: Random.rangeFloor(90, 120),
    fadeOutTicks: 20,
  };
}

export function updateParticle({ width, height }, tick, particle) {
  // Move
  particle.x += Math.cos(particle.angle) * particle.velocity;
  if (DEBUG.wobble) {
    particle.x =
      particle.x +
      Random.noise2D(
        particle.x / particle.random,
        particle.y / particle.random
      );
  }

  particle.y +=
    Math.sin(particle.angle) * particle.velocity +
    (DEBUG.gravity ? particle.gravity : 0);

  if (DEBUG.decay) {
    particle.velocity *= particle.decay;
  }

  // Tilt
  if (DEBUG.tilt) {
    particle.tiltAngle =
      particle.tiltAngle +
      Random.noise2D(
        particle.x / particle.random,
        particle.y / particle.random,
        1,
        Math.PI / 16
      );
  }

  if (particle.y > height) {
    particle.alive = false;
  }

  if (tick > particle.totalTicks + particle.fadeOutTicks) {
    particle.alive = false;
  }
}

export function drawParticle(context, tick, particle) {
  const fade = tween({
    time: tick,
    duration: particle.fadeOutTicks,
    delay: particle.totalTicks,
    from: 1,
    to: 0,
    ease: 'expoOut',
  });

  const size = tween({
    time: tick,
    duration: 90,
    from: particle.radius * 1.5,
    to: particle.radius,
    ease: 'expoOut',
  });

  // shadow
  context.save();
  context.beginPath();
  context.arc(particle.x, particle.y, size, 0, 2 * Math.PI, true);
  context.shadowColor = '#000';
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 4;
  context.fill();
  context.restore();
  // semi-circles
  particle.colors.forEach((color, idx) => {
    context.save();
    context.beginPath();
    context.translate(particle.x, particle.y);
    context.rotate(particle.tiltAngle);
    context.fillStyle = Color.style([...color, fade]);
    context.arc(0, 0, size, 0, Math.PI, idx === 0);
    context.fill();
    context.restore();
  });
}

export function resetParticles({ width, height }, x, y, particles, options) {
  const maxDist = dist([0, 0], [width, height]);

  return particles.map(() =>
    createParticle({ width, height }, maxDist, { ...options, x, y })
  );
}

function dist([x1, y1], [x2, y2]) {
  const a = x2 - x1;
  const b = y2 - y1;

  return Math.hypot(a, b);
}

function setEndLocation({ width, height }, x, y) {
  const xBounds = [-x, width - x];
  const yBounds = [-y, height - y];

  return [x + Random.range(...xBounds), y + Random.range(...yBounds)];
}

function launchAngle([x1, y1], [x2, y2]) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function launchVelocity(maxDist, startPos, endPos, startVelocity) {
  const d = dist(startPos, endPos);
  return mapRange(d, 0, maxDist, startVelocity * 0.1, 1 * startVelocity);
}
