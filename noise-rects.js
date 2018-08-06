const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const lerp = require('lerp');
const { curve } = require('cardinal-spline-js/curve_func.min');
const R = require('ramda');
const { normalize, noiseGrid, randomNumber, range } = require('./math');
const { regularPolygon, translateAll, drawShape, arcs } = require('./geometry');

const simplex = new SimplexNoise('1234567890abcdefghijklmnopqrstuvwxyz');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [800, 800],
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 8,
};

canvasSketch(() => {
  const opts = {
    circleCount: 16,
    segmentCount: 32,
    timeLoops: 2,
    loop: true,
    displacement: 0.125,
    curves: false,
    radius: {
      start: 0.0625,
      delta: 0.05,
    },
  };

  let time = 0;

  return ({ context, frame, width, height, playhead }) => {
    // clear
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    // Setup
    time += 0.01; // Math.sin(playhead * opts.timeLoops * Math.PI);
    const circles = R.pipe(
      concentricRadii(width, opts.radius),
      generateCircles(width, height, time, playhead, opts),
    )(opts.circleCount);

    // Draw
    context.lineWidth = width * 0.003;
    context.strokeStyle = '#222';

    if (opts.curves) {
      circles.forEach(drawCircle(context));
    } else {
      circles.forEach(pts => {
        drawShape(context, pts);
        context.stroke();
      });
    }
  };
}, settings);

function drawCircle(context) {
  return R.pipe(
    R.flatten,
    pts => {
      context.beginPath();
      curve(context, pts, 0.4, 48, true);
      context.stroke();
      context.closePath();
    },
  );
}

function concentricRadii(width, radius) {
  return circleCount =>
    range(circleCount).map(
      idx => width * radius.start + width * radius.delta * idx,
    );
}

function generateCircles(
  width,
  height,
  time,
  playhead,
  { segmentCount, displacement, loop },
) {
  return R.pipe(
    R.map(radius => arcs(segmentCount, radius)),
    R.map(pts =>
      pts.map(({ r, theta }) => ({
        r:
          r *
          Math.min(
            1 / Math.abs(Math.cos(theta)),
            1 / Math.abs(Math.sin(theta)),
          ),
        theta,
      })),
    ),
    R.map(displacePts(displacement, loop, time, playhead)),
    R.map(pts => translateAll([width / 2, height / 2], pts)),
  );
}

function rectPath(segmentCount, s) {
  return [[-s, -s], [s, -s], [s, s], [-s, s]];
}

function displacePts(displacement, loop, time, playhead) {
  return pts =>
    pts.map(({ r, theta }) => ({
      r:
        r +
        r *
          displacement *
          simplex.noise3D(
            (Math.cos(theta) * r) / 1000,
            (Math.sin(theta) * r) / 1000,
            // Math.min(
            //   1 / Math.abs(Math.cos(theta)),
            //   1 / Math.abs(Math.sin(theta)),
            // ) / 2,
            // Math.min(
            //   1 / Math.abs(Math.cos(theta)),
            //   1 / Math.abs(Math.sin(theta)),
            // ) / 2,
            loop ? time : playhead,
          ),
      theta,
    }));
}
