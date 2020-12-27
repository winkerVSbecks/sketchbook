const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const PoissonDiskSampling = require('poisson-disk-sampling');
const load = require('load-asset');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [800, 600],
  scaleToView: true,
  animate: true,
  duration: 5,
};

const CONFIG = {
  lineCount: 75,
  particleCount: 100,
  planetCount: 8,
  ticks: 50,
  forceMin: 0.25,
  forceMax: 1,
  G: 5,
};

const sketch = async () => {
  const image = await load('./imgs/cloud-1.jpg');

  let particles, planets, poissonDiskSamples;
  const foreground = clrs.ink(); // '#666';
  const foreground2 = clrs.ink(); // '#666';
  const background = clrs.bg; // '#fff';

  return {
    begin({ context, width, height }) {
      context.drawImage(image, 0, 0, width, height);

      particles = [];

      poissonDiskSamples =
        poissonDiskSamples ||
        new PoissonDiskSampling({
          shape: [width, height],
          minDistance: width * 0.005,
          maxDistance: width * 0.1,
          tries: 20,
          distanceFunction: (p) => {
            const pixel = context.getImageData(p[0], p[1], 1, 1).data;
            return (pixel[0] + pixel[1] + pixel[2]) / (255 * 3);
          },
        });

      particles = poissonDiskSamples
        .fill()
        .map(([x, y]) => createParticle(x, y, Random.rangeFloor(5, 10)));

      planets = linspace(CONFIG.planetCount).map(() =>
        createParticle(
          Random.range(0.25 * width, 0.75 * width),
          Random.range(0.25 * height, 0.75 * height),
          Random.rangeFloor(100, 500) * 5
        )
      );

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    },
    render({ context, width, height, playhead }) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = foreground;

      particles.forEach((particle) => {
        updateParticle(particle, planets);
      });

      // planets.forEach((particle) => {
      //   updateParticleSlightAttraction(particle, planets);
      // });

      planets.forEach((planet) => {
        moveParticle(planet, playhead, width);
      });

      particles.forEach((particle) => {
        drawParticle(particle, context, foreground, 1);
      });

      // planets.forEach((planet) => {
      //   drawParticle(planet, context, planet.color, planet.m / 100);
      // });
    },
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

function updateParticle(particle, planets) {
  planets.forEach((planet) => {
    if (planet.id !== particle.id) {
      const forceMagnitude = gravitationalForce(particle, planet);
      const forceAngle = angle(particle.loc, planet.loc);

      particle.loc.x += Math.cos(forceAngle) * forceMagnitude;
      particle.loc.y += Math.sin(forceAngle) * forceMagnitude;

      const returnForceMagnitude = -gravitationalForce(particle, planet) * 0.9;
      const returnForceAngle = angle(particle.loc, particle.originalLoc);

      particle.loc.x += Math.cos(returnForceAngle) * returnForceMagnitude;
      particle.loc.y += Math.sin(returnForceAngle) * returnForceMagnitude;
    }
  });
}

function updateParticleSlightAttraction(particle, planets) {
  planets.forEach((planet) => {
    if (planet.id !== particle.id) {
      const forceMagnitude = Math.min(
        Math.abs(gravitationalForce(particle, planet)),
        0.25
      );
      const forceAngle = angle(particle.loc, planet.loc);

      particle.loc.x += Math.cos(forceAngle) * forceMagnitude;
      particle.loc.y += Math.sin(forceAngle) * forceMagnitude;
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
  return -(F > 100 ? 200000 : F);
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
