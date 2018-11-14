const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const { Vector } = require('p5');
const collide = require('triangle-circle-collision');
const { drawShape, regularPolygon } = require('./geometry');
const { bilbao } = require('./clrs');

const [pink, blue, ...bilbaoClrs] = bilbao;

const settings = {
  animate: false,
  dimensions: [800, 800],
  scaleToView: true,
};

const CONFIG = {
  circleCount: 1000,
  minRadius: 3,
  maxRadius: 200,
  triangle: regularPolygon([400, 400 + (Math.sqrt(3) * 200) / 6], 3, 200, -90),
};

/**
 * 1. Create a new Circle
 *  a. Check to see if the circle is valid i.e., not in the triangle
 *     and doesn't collide with other circles
 * 2. Grow it slightly and check again if it collides.
 * 4. Repeat these steps until there is a collision, or the circle reaches a max size
 * 5. Create another circle and repeat x times.
 */
canvasSketch(() => {
  console.clear();
  let circles = [];

  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = pink;
    context.fillRect(0, 0, width, height);

    while (circles.length < CONFIG.circleCount) {
      // Start with a random circle
      const circle = randomCircle(width, height, Random.pick(bilbaoClrs));

      if (ifSafeCircle(circles, circle, width, height)) {
        // Grow the circle
        linspace(CONFIG.maxRadius - CONFIG.minRadius).forEach(() => {
          circle.r++;

          if (!ifSafeCircle(circles, circle, width, height)) {
            circle.r--;
          }
        });

        // Add it to the list of circles
        circles.push(circle);
      }
    }

    // Draw the circles
    context.lineWidth = 2;
    circles
      .sort((a, b) => a.r < b.r)
      .forEach(circle => {
        context.strokeStyle = circle.color;
        context.fillStyle = chroma(circle.color)
          .luminance(0.5)
          .alpha(0.0625 * 2)
          .css();
        context.beginPath();
        context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
      });

    // Draw the triangle
    drawShape(context, CONFIG.triangle);
    context.strokeStyle = chroma(blue)
      .alpha(0.5)
      .css();
    context.fillStyle = chroma(blue)
      .alpha(0.0625)
      .css();
    context.lineJoin = 'round';
    context.fill();
    context.stroke();
  };
}, settings);

function ifSafeCircle(otherCircles, circle, width, height, shapeData) {
  return (
    !hasACollision(otherCircles, circle, width, height) &&
    !isInEclipsedZone(circle, width, shapeData)
  );
}

function hasWallCollision(circle, width, height) {
  return (
    circle.x + circle.r >= width ||
    circle.x - circle.r <= 0 ||
    (circle.y + circle.r >= height || circle.y - circle.r <= 0)
  );
}

function hasACollision(otherCircles, circle, width, height) {
  return (
    hasWallCollision(circle, width, height) ||
    otherCircles.some(otherCircle => {
      const maxDistForOverlap = circle.r + otherCircle.r + 1;
      const d = Math.hypot(circle.x - otherCircle.x, circle.y - otherCircle.y);
      return d < maxDistForOverlap;
    })
  );
}

function isInEclipsedZone(circle, w) {
  return collide(CONFIG.triangle, [circle.x, circle.y], circle.r + 2);
}

function randomCircle(width, height, color) {
  return {
    x: Random.rangeFloor(0, width),
    y: Random.rangeFloor(0, height),
    r: CONFIG.minRadius,
    color,
  };
}
