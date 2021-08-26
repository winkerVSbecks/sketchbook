const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { linspace } = require('canvas-sketch-util/math');
const collide = require('triangle-circle-collision');
const { drawShape, regularPolygon } = require('./geometry');
const stackblur = require('stackblur');

const SIZE = 1080;

const settings = {
  animate: true,
  duration: 1,
  dimensions: [SIZE, SIZE],
  // scaleToView: true,
};

const A = SIZE / 2;
const R = A / 2;

const CONFIG = {
  gradient: true,
  blur: false,
  circleCount: 1000,
  minRadius: 3,
  maxRadius: 200,
  triangle: regularPolygon([A, A + (Math.sqrt(3) * R) / 6], 3, R, -90),
};

const clrs = {
  bg: '#0A1918',
  triangle: '#FDC22D',
  circles: ['#F992E2', '#E7EEF6', '#FB331C', '#3624F4'],
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
    circles = [];
    context.clearRect(0, 0, width, height);
    context.fillStyle = clrs.bg; // pink;
    context.fillRect(0, 0, width, height);

    while (circles.length < CONFIG.circleCount) {
      // Start with a random circle
      const circle = randomCircle(width, height, Random.pick(clrs.circles));

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
      .forEach((circle) => {
        context.strokeStyle = clrs.bg;

        if (CONFIG.gradient) {
          applyGradient(
            context,
            {
              x: circle.x - circle.r,
              y: circle.y - circle.r,
              x1: circle.x + circle.r,
              y1: circle.y + circle.r,
            },
            circle.color
          );
        } else {
          context.fillStyle = circle.color;
        }

        context.beginPath();
        context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
      });

    if (CONFIG.blur) {
      // Apply blur
      let imageData = context.getImageData(0, 0, width, height);
      stackblur(imageData.data, width, height, 12);
      context.putImageData(imageData, 0, 0);
    }

    // Draw the triangle
    drawShape(context, CONFIG.triangle);
    context.strokeStyle = clrs.triangle; //clrs.bg;

    if (CONFIG.gradient) {
      applyGradient(
        context,
        {
          x: CONFIG.triangle[2][0],
          y: CONFIG.triangle[0][1],
          x1: CONFIG.triangle[1][0],
          y1: CONFIG.triangle[1][1],
        },
        clrs.triangle
      );
    } else {
      context.fillStyle = clrs.triangle;
    }

    context.lineJoin = 'round';
    context.fill();
    // context.stroke();
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
    circle.y + circle.r >= height ||
    circle.y - circle.r <= 0
  );
}

function hasACollision(otherCircles, circle, width, height) {
  return (
    hasWallCollision(circle, width, height) ||
    otherCircles.some((otherCircle) => {
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

function applyGradient(context, { x, y, x1, y1 }, color) {
  const gradient = context.createLinearGradient(x, y, x1, y1);

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, chroma(color).brighten(2).css());

  context.fillStyle = gradient;
}
