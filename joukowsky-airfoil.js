/**
 *  Based on
 * https://github.com/complex-analysis/complex-analysis.github.io/blob/master/applets/p5js/joukowsky/joukowskyairfoil.js
 *
 * by https://github.com/jcponce
 */

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, lerpFrames } = require('canvas-sketch-util/math');
const Color = require('canvas-sketch-util/color');
const risoColors = require('riso-colors');
const paperColors = require('paper-colors');
const clrs = require('./clrs').clrs();

const settings = {
  // dimensions: [800, 500],
  dimensions: [1080, 1080],
  // dimensions: [1920, 1080],
  animate: true,
  // scaleToView: true,
  duration: 8,
};

const particleCount = 600 * 2;
const t = 0;
const h = 0.01;
const particles = [];

const airfoilRadius = 1;

const xMax = 4;
const xMin = -4;
const yMax = 4;
const yMin = -4;

const params = {
  velocity: 1, // speed
  circulation: 0, // circulation
  transformation: 0, // transformation using homotopy
};

const sketch = () => {
  const particleColor = clrs.ink(); // risoColors.find((c) => c.name === 'Sky Blue').hex;
  const airfoilColor = clrs.ink(); // risoColors.find((c) => c.name === 'Paprika').hex;
  const background = Color.parse(clrs.bg)
    .rgba; /* Color.parse(
    paperColors.find((c) => c.name === 'Warm White')
  ).rgba; */

  let imageData;

  return {
    begin({ context, width, height }) {
      for (let idx = 0; idx < particleCount; idx++) {
        context.fillStyle = `rgba(${background[0]}, ${background[1]}, ${background[2]}, 1)`; // background
        context.fillRect(0, 0, width, height);
        particles[idx] = createParticle(
          Random.range(xMin, xMax),
          Random.range(yMin, yMax),
          t,
          h,
          width
        );
      }

      imageData = context.getImageData(0, 0, width, height);
    },
    render({ context, width, height, playhead }) {
      context.putImageData(imageData, 0, 0);
      context.fillStyle = `rgba(${background[0]}, ${background[1]}, ${background[2]}, 0.05)`; // background
      context.fillRect(0, 0, width, height);

      // context.fillStyle = particleColor;

      // Update and draw particles
      particles.forEach((p, idx) => {
        p = updateParticle(p);
        drawParticle(context, p, {
          width,
          height,
          background,
          foreground: particleColor,
        });

        if (
          p.x > xMax ||
          p.y > yMax ||
          p.x < xMin ||
          p.y < yMin ||
          Math.hypot(p.x, p.y) < airfoilRadius
        ) {
          particles.splice(idx, 1);

          particles.push(
            createParticle(
              Random.range(xMin, xMin * 0.9),
              Random.range(yMin, yMax),
              t,
              h,
              width
            )
          );
        }
      });

      // Draw airfoil
      params.transformation = lerpFrames([0, 0.8 * airfoilRadius, 0], playhead);

      context.fillStyle = airfoilColor;
      context.beginPath();
      for (let theta = 0; theta <= 2 * Math.PI; theta += Math.PI / 50) {
        let xC = airfoilRadius * Math.cos(theta);
        let yC = airfoilRadius * Math.sin(theta);

        const x = scaleX(
          xC * (1 - params.transformation) +
            JkTransX(xC, yC) * params.transformation,
          width
        );

        const y = scaleY(
          -(
            yC * (1 - params.transformation) +
            JkTransY(xC, yC) * params.transformation
          ),
          height
        );

        if (theta === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();

      imageData = context.getImageData(0, 0, width, height);
    },
  };
};

canvasSketch(sketch, settings);

// Components of the Joukowsky transformation
const rd = 0.23 * 2 * 2.54950975679639241501; // radius

const JkTransX = (x, y) =>
  rd * x -
  0.15 +
  (rd * x - 0.15) /
    ((rd * x - 0.15) * (rd * x - 0.15) + (rd * y + 0.23) * (rd * y + 0.23));

const JkTransY = (x, y) =>
  rd * y +
  0.23 -
  (rd * y + 0.23) /
    ((rd * x - 0.15) * (rd * x - 0.15) + (rd * y + 0.23) * (rd * y + 0.23));

/**
 * Define particles and how they are moved
 * with Runge–Kutta method of 4th degree.
 */
function createParticle(x, y, t, h, width) {
  return {
    x,
    y,
    time: t,
    radius: width * 0.01,
    h,
    positions: [[x, y]],
  };
}

function P(t, x, y) {
  return (
    4.9 *
    ((2 * airfoilRadius * airfoilRadius * params.velocity * y * y) /
      ((x * x + y * y) * (x * x + y * y)) +
      params.velocity *
        (1 - (airfoilRadius * airfoilRadius) / (x * x + y * y)) -
      (params.circulation * y) / (2 * Math.PI * (x * x + y * y)))
  );
}

function Q(t, x, y) {
  return (
    4.9 *
    (-(2 * airfoilRadius * airfoilRadius * params.velocity * x * y) /
      ((x * x + y * y) * (x * x + y * y)) +
      (params.circulation * x) / (2 * Math.PI * (x * x + y * y)))
  );
}

function updateParticle(p) {
  p.k1 = P(p.time, p.x, p.y);
  p.j1 = Q(p.time, p.x, p.y);

  p.k2 = P(
    p.time + (1 / 2) * p.h,
    p.x + (1 / 2) * p.h * p.k1,
    p.y + (1 / 2) * p.h * p.j1
  );
  p.j2 = Q(
    p.time + (1 / 2) * p.h,
    p.x + (1 / 2) * p.h * p.k1,
    p.y + (1 / 2) * p.h * p.j1
  );

  p.k3 = P(
    p.time + (1 / 2) * p.h,
    p.x + (1 / 2) * p.h * p.k2,
    p.y + (1 / 2) * p.h * p.j2
  );
  p.j3 = Q(
    p.time + (1 / 2) * p.h,
    p.x + (1 / 2) * p.h * p.k2,
    p.y + (1 / 2) * p.h * p.j2
  );

  p.k4 = P(p.time + p.h, p.x + p.h * p.k3, p.y + p.h * p.j3);
  p.j4 = Q(p.time + p.h, p.x + p.h * p.k3, p.y + p.h * p.j3);

  p.x = p.x + (p.h / 6) * (p.k1 + 2 * p.k2 + 2 * p.k3 + p.k4);
  p.y = p.y + (p.h / 6) * (p.j1 + 2 * p.j2 + 2 * p.j3 + p.j4);
  p.time += p.h;

  p.positions.push([p.x, p.y]);

  return p;
}

function drawParticle(context, p, { width, height, background, foreground }) {
  // const length = p.positions.length;

  // p.positions.forEach(([x, y], idx) => {
  //   const updateX = scaleX(
  //     x * (1 - params.transformation) + JkTransX(x, y) * params.transformation,
  //     width
  //   );

  //   const updateY = scaleY(
  //     -y * (1 - params.transformation) - JkTransY(x, y) * params.transformation,
  //     height
  //   );

  //   drawTrailStep(context, [updateX, updateY], p.radius, {
  //     background,
  //     foreground,
  //     opacity: (idx + 1) / length,
  //   });
  // });

  const updateX = scaleX(
    p.x * (1 - params.transformation) +
      JkTransX(p.x, p.y) * params.transformation,
    width
  );

  const updateY = scaleY(
    -p.y * (1 - params.transformation) -
      JkTransY(p.x, p.y) * params.transformation,
    height
  );

  context.fillStyle = foreground;
  context.beginPath();
  context.arc(updateX, updateY, p.radius, 0, Math.PI * 2);
  context.fill();
}

function drawTrailStep(
  context,
  [x, y],
  radius,
  { background, foreground, opacity = 1 }
) {
  context.fillStyle = Color.blend(background, foreground, opacity).hex;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function scaleX(v, width) {
  return mapRange(v, xMin, xMax, 0, width);
}

function scaleY(v, height) {
  return mapRange(v, xMin, xMax, 0, height);
}
