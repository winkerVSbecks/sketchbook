const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const getCurvePoints = require('cardinal-spline-js/').getCurvePoints;
const { curve } = require('cardinal-spline-js/curve_func.min');
const R = require('ramda');
const { normalize, noiseGrid, randomNumber, range } = require('./math');
const { regularPolygon, polygon, drawShape, arcs } = require('./geometry');

const simplex = new SimplexNoise('1234567890abcdefghijklmnopqrstuvwxyz');

const settings = {
  // animate: true,
  duration: 8,
  dimensions: [800, 800],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 8,
};

canvasSketch(() => {
  const opts = {
    circleCount: 1,
    segmentCount: 24,
    timeLoops: 2,
    loop: true,
    displacement: 0.125,
  };

  return ({ context, frame, width, height, playhead }) => {
    // clear
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    // Setup
    const time = Math.sin(playhead * opts.timeLoops * Math.PI);
    const circles = R.pipe(
      concentricRadii(width),
      generateCircles(width, height, time, playhead, opts),
    )(opts.circleCount);

    // Draw
    context.lineWidth = width * 0.01;
    context.strokeStyle = '#222';
    circles.forEach(drawCircle(context));
  };
}, settings);

function drawCircle(context) {
  return R.pipe(
    R.flatten,
    pts => {
      context.beginPath();
      curve(context, pts, 0.5, 25, true);
      context.stroke();
      context.closePath();
    },
  );
}

var f = n => (n > 50 ? false : [-n, n + 10]);
R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]

function concentricRadii(width) {
  return circleCount =>
    range(circleCount).map(idx => width * 0.125 + width * 0.05 * idx);
}

function generateCircles(
  width,
  height,
  time,
  playhead,
  { segmentCount, displacement, loop },
) {
  return radii =>
    radii.map(radius => {
      const pts = arcs(segmentCount, radius).map(({ r, theta }) => ({
        r:
          r +
          r * displacement * simplex.noise3D(r, theta, loop ? time : playhead),
        theta,
      }));

      return polygon([width / 2, height / 2], pts);
    });
}
