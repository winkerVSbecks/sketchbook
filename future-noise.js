const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, degToRad, lerpFrames } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 4,
};

// const config = {
//   frequency: 0.0005, // 0.001,
//   amplitude: 1,
//   particleCount: 50,
//   damping: 0.1,
//   step: 10,
//   stepCount: 100,
//   lineWidth: 50,
//   random: false,
// };

const baseConfig = {
  frequency: 0.0005, // 0.001,
  amplitude: 1,
  particleCount: Random.rangeFloor(5, 100),
  damping: 0.1, // 0.1,
  step: Random.rangeFloor(10, 50),
  lineWidth: Random.rangeFloor(10, 500),
  clip: false,
};

/**
 * Directions:
 *
 *         -90
 *  180 ____|____ 0
 *         |
 *        90
 */
const configs = {
  top: {
    ...baseConfig,
    directions: [0, 45, 90, 135, 180],
    x: (idx, count, width) => mapRange(idx, 0, count, 0, width),
    y: () => 0,
  },
  left: {
    ...baseConfig,
    directions: [-90, -45, 0, 45, 90],
    x: () => 0,
    y: (idx, count, height) => mapRange(idx, 0, count, 0, height),
  },
};

const config = configs.left;

const colors = Random.shuffle([
  '#201c1d',
  '#5f6ce0',
  '#ffad72',
  '#bafc9d',
  '#bf8dff',
  '#2a1f38',
  '#ffb06b',
  '#382718',
  '#fc9de7',
  '#382333',
  '#d4ffff',
  '#ffffff',
  '#fff3d4',
]);

const clrs = {
  bg: colors.pop(),
  lines: colors,
};

// const clrs = {
//   bg: '#201c1d',
//   lines: [
//     '#5f6ce0',
//     '#ffad72',
//     '#bafc9d',
//     '#bf8dff',
//     '#2a1f38',
//     '#ffb06b',
//     '#382718',
//     '#fc9de7',
//     '#382333',
//     '#d4ffff',
//     '#ffffff',
//     '#fff3d4',
//   ],
// };

const sketch = () => {
  // Random.setSeed('noise-flow-field');

  let particles = [];

  return {
    begin({ width, height }) {
      particles = [];
      let colorIdx = 0;

      // Generate some particles with a random position
      for (let idx = 0; idx < config.particleCount; idx++) {
        particles.push({
          x: config.x(idx, config.particleCount, width),
          y: config.y(idx, config.particleCount, height),
          vx: 0,
          vy: 0,
          line: [],
          color: clrs.lines[colorIdx],
          done: false,
          lineWidth: config.lineWidth,
        });
        colorIdx = colorIdx === clrs.lines.length ? 0 : colorIdx + 1;
      }

      // while (!particles.every((p) => p.done)) {
      //   particles.forEach((particle) => {
      //     moveParticle(particle, [width, height]);
      //   });
      // }
    },
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = clrs.bg;
      context.fillRect(0, 0, width, height);

      const margin = 0.05 * width;
      const clipBox = [
        [margin, margin],
        [width - margin, height - margin],
      ];

      particles.forEach((particle) => {
        moveParticle(particle, [width, height]);
      });

      const clippedParticles = particles.map((particle) => ({
        ...particle,
        line:
          clipPolylinesToBox([particle.line], clipBox, false, false)[0] || [],
      }));

      // context.lineWidth = config.lineWidth;
      // context.lineJoin = 'round';
      context.lineCap = 'square';
      // particles = particles.sort((a, b) => b.lineWidth - a.lineWidth);

      (config.clip ? clippedParticles : particles).forEach(
        ({ line, color, lineWidth }, index) => {
          if (line.length > 0) {
            const [start, ...pts] = line;

            context.lineWidth = lineWidth;

            context.beginPath();
            context.moveTo(...start);
            pts.forEach((pt) => {
              context.lineTo(...pt);
            });

            if (particles[index]) {
              context.strokeStyle = color;
              context.stroke();
            }
          }
        }
      );
    },
  };
};

canvasSketch(sketch, settings);

function moveParticle(particle, [width, height]) {
  // if (
  //   particle.x < 0 ||
  //   particle.x > width ||
  //   particle.y < 0 ||
  //   particle.y > height
  // ) {
  //   particle.done = true;
  //   return;
  // }

  // Calculate direction from noise
  const t = Random.noise2D(
    particle.x,
    particle.y,
    config.frequency,
    config.amplitude
  );

  const direction = Math.floor(mapRange(t, -1, 1, 0, 4));

  const angleDeg = config.directions[direction];
  const angle = degToRad(angleDeg);

  if (config.damping > 0) {
    // Update the velocity of the particle
    // based on the direction
    particle.vx += Math.cos(angle) * config.step;
    particle.vy += Math.sin(angle) * config.step;

    // Move the particle
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Use damping to slow down the particle (think friction)
    particle.vx *= config.damping;
    particle.vy *= config.damping;
  } else {
    particle.vx = Math.cos(angle) * config.step;
    particle.vy = Math.sin(angle) * config.step;

    particle.x += particle.vx;
    particle.y += particle.vy;
  }

  particle.x = Math.floor(particle.x < Number.EPSILON ? 0 : particle.x);
  particle.y = Math.floor(particle.y < Number.EPSILON ? 0 : particle.y);

  particle.line.push([particle.x, particle.y]);
}
