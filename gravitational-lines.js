const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const PoissonDiskSampling = require('poisson-disk-sampling');
const load = require('load-asset');
const streamlines = require('@anvaka/streamlines');
const { drawShape } = require('./geometry');
const clrs = require('./clrs').clrs();

const settings = {
  // dimensions: [800, 600],
  dimensions: [2778, 1284],
  scaleToView: true,
  // animate: true,
  // duration: 5,
};

const CONFIG = {
  lineCount: 75,
  particleCount: 100,
  planetCount: 5,
  ticks: 50,
  forceMin: 0.25,
  forceMax: 1,
  G: 5,
};

const sketch = async ({ width, height }) => {
  let lines, planets;
  const foreground = clrs.ink();
  const background = clrs.bg;

  planets = linspace(CONFIG.planetCount).map(() =>
    createParticle(
      Random.range(0.25 * width, 0.75 * width),
      Random.range(0.25 * height, 0.75 * height),
      Random.rangeFloor(width * 0.125, width * 0.625) * 10
    )
  );

  lines = [];
  lines2 = [];

  await streamlines({
    vectorField(p) {
      const particle = createParticle(
        p.x,
        p.y,
        Random.rangeFloor(width * 0.125, width * 0.25)
      );
      updateParticle(particle, planets);
      return particle.loc;
    },
    boundingBox: { left: 0, top: 0, width, height },
    seed: { x: Random.range(0, width), y: Random.range(0, height) },
    dSep: 0.01 * width,
    dTest: 0.01 * width,
    timeStep: 0.15,
    onStreamlineAdded(points) {
      console.log('stream line created. Number of points: ', points.length);
      const line = points.map(({ x, y }) => [x, y]);
      lines.push(line);
    },
  }).run();

  return ({ context, width, height }) => {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = foreground;
    context.lineCap = 'round';
    context.lineWidth = 8;

    lines.forEach((line) => {
      // context.strokeStyle = clrs.ink();
      drawShape(context, line, false);
      context.stroke();
    });

    planets.forEach((planet) => {
      drawParticle(planet, context, background, planet.m / 50);
    });

    planets.forEach((planet) => {
      drawParticle(planet, context, foreground, planet.m / 100);
    });
  };
};

canvasSketch(sketch, settings);

function createParticle(x, y, m) {
  return {
    id: x + y,
    loc: { x, y },
    originalLoc: { x, y },
    m,
    random: Random.range(100, 1000),
    color: clrs.ink(),
  };
}

function updateParticle(particle, planets, rebound = false) {
  planets.forEach((planet) => {
    if (planet.id !== particle.id) {
      const forceMagnitude = gravitationalForce(particle, planet);
      const forceAngle = angle(particle.loc, planet.loc);

      particle.loc.x += Math.cos(forceAngle) * forceMagnitude;
      particle.loc.y += Math.sin(forceAngle) * forceMagnitude;

      if (rebound) {
        const returnForceMagnitude =
          -gravitationalForce(particle, planet) * 0.9;
        const returnForceAngle = angle(particle.loc, particle.originalLoc);

        particle.loc.x += Math.cos(returnForceAngle) * returnForceMagnitude;
        particle.loc.y += Math.sin(returnForceAngle) * returnForceMagnitude;
      }
    }
  });
}

function moveParticle(particle, time, width) {
  particle.loc.x += Random.noise3D(
    particle.loc.x / particle.random,
    particle.loc.y / particle.random,
    time,
    1,
    width * 0.01
  );
  particle.loc.y += Random.noise3D(
    particle.loc.x / particle.random,
    particle.loc.y / particle.random,
    time,
    1,
    width * 0.01
  );
}

function drawParticle(particle, context, color, size) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(
    particle.loc.x,
    particle.loc.y,
    size,
    size,
    0,
    0,
    Math.PI * 2
  );
  context.fill();
}

function gravitationalForce(p1, p2) {
  const d2 = distSq(p1.loc, p2.loc);
  const F = (CONFIG.G * p1.m * p2.m) / d2;
  return -Math.min(F, 200);
  // return -(F > 100 ? 200000 : F);
}

function dist({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function distSq({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

function angle({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return Math.atan2(y2 - y1, x2 - x1);
}
