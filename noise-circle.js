const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const getCurvePoints = require('cardinal-spline-js/').getCurvePoints;
const { curve } = require('cardinal-spline-js/curve_func.min');
const R = require('ramda');
const { range } = require('./math');
const { translate, drawShape, arcs } = require('./geometry');

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
    segmentCount: 360,
    timeLoops: 4,
    loop: true,
    displacement: 0.125 / 8,
    radius: {
      start: 0.3,
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
    time += 0.025; // Math.sin(playhead * opts.timeLoops * Math.PI);
    const circle = generateCircle(width, height, time, playhead, opts)(
      width * opts.radius.start,
    );

    // Draw
    context.lineWidth = width * 0.002;
    context.strokeStyle = '#666';
    drawShape(context, circle, true);
    context.stroke();
  };
}, settings);

function generateCircle(
  width,
  height,
  time,
  playhead,
  { segmentCount, displacement, loop },
) {
  return R.pipe(
    radius => arcs(segmentCount, radius),
    R.map(displacePt(displacement, loop, time, playhead, segmentCount)),
    R.map(translate([width / 2, height / 2])),
  );
}

function displacePt(displacement, loop, time, playhead, segmentCount) {
  return ({ r, theta }, idx) => ({
    r:
      r +
      r *
        displacement *
        simplex.noise3D(
          Math.cos(theta),
          Math.sin(theta),
          loop ? time : playhead,
        ),
    theta,
  });
}
