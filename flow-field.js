const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const scale = 2;

const debug = false;
const trace = true;

const settings = {
  dimensions: [800 * scale, 600 * scale],
  scaleToView: true,
  animate: true,
  duration: 2,
  playbackRate: 'throttle',
  fps: 24,
};

const FREQUENCY = 0.001 / scale;
const AMPLITUDE = 5;

const PARTICLE_COUNT = debug ? 100 : 900;
const DAMPING = 0.1;

const STEP = 5 * scale;
const PARTICLE_STEPS = 30 * scale;

const sketch = () => {
  const seed = 'noise-flow-field';
  Random.setSeed(seed);

  let particles = [];
  let STEPS_TAKEN = 0;

  return {
    begin({ width, height }) {
      STEPS_TAKEN = 0;
      particles = [];

      // Generate some particles with a random position
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Random.range(0, width),
          y: Random.range(0, height),
          vx: 0,
          vy: 0,
          line: [],
          color: debug
            ? '#da3900'
            : Random.pick(['#fcfaf1', '#aaa', '#cacaca', '#e6b31e']),
        });
      }
    },
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#343434';
      context.fillRect(0, 0, width, height);

      const margin = 0.03 * width;
      const clipBox = [
        [margin, margin],
        [width - margin, height - margin],
      ];

      if (debug) {
        drawVectorField(context, width, height);
      }

      STEPS_TAKEN = Math.floor(mapRange(playhead, 0, 1, 0, PARTICLE_STEPS));

      if (particles[0].line.length < PARTICLE_STEPS) {
        particles.forEach((particle) => {
          moveParticle(particle);
        });
      }

      const lines = particles.map((particle) => particle.line);

      const clippedLines = clipPolylinesToBox(lines, clipBox, false, false);

      context.lineWidth = 4;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      if (trace) {
        clippedLines.forEach((line, index) => {
          const [start, ...pts] = line;

          context.beginPath();
          context.moveTo(...start);
          pts.forEach((pt) => {
            context.lineTo(...pt);
          });

          context.strokeStyle = particles[index].color;
          context.stroke();
        });
      } else {
        clippedLines.forEach((line, index) => {
          const tail = line[line.length - 1];

          context.fillStyle = particles[index].color;
          context.beginPath();
          context.arc(...tail, 10, 0, 2 * Math.PI);
          context.fill();
        });
      }
    },
  };
};

canvasSketch(sketch, settings);

function moveParticle(particle) {
  // Calculate direction from noise
  const angle = Random.noise2D(particle.x, particle.y, FREQUENCY, AMPLITUDE);

  // Update the velocity of the particle
  // based on the direction
  particle.vx += Math.cos(angle) * STEP;
  particle.vy += Math.sin(angle) * STEP;

  // Move the particle
  particle.x += particle.vx;
  particle.y += particle.vy;

  // Use damping to slow down the particle (think friction)
  particle.vx *= DAMPING;
  particle.vy *= DAMPING;

  particle.line.push([particle.x, particle.y]);
}

function drawVectorField(context, width, height) {
  // const angle = Random.noise2D(particle.x, particle.y, FREQUENCY, AMPLITUDE);

  const length = 20;
  const thickness = 4;
  const padding = 0; // 0.1 * height;

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      context.save();
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';

      const t = {
        x: mapRange(x, 0, 31, padding, width - padding),
        y: mapRange(y, 0, 31, padding, height - padding),
      };

      const angle = Random.noise2D(t.x, t.y, FREQUENCY, AMPLITUDE);

      // Rotate in place
      context.translate(t.x, t.y);
      context.rotate(angle);
      context.translate(-t.x, -t.y);

      // Draw the line
      context.fillRect(
        t.x - length / 2,
        t.y - thickness / 2,
        length,
        thickness
      );
      context.restore();
    }
  }
}
