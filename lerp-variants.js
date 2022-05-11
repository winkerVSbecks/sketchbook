const canvasSketch = require('canvas-sketch');
const { lerp, damp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 1,
  // fps: 60,
  // playbackRate: 'throttle',
};

const rect = (context, x, y, width, height, color) => {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
};

const circle = (context, x, y, radius, color, lineWidth) => {
  context.strokeStyle = context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.lineWidth = lineWidth;
  if (lineWidth != null) context.stroke();
  else context.fill();
};

const progress = (context, time, width, height, margin = 0) => {
  context.fillStyle = config.colors.fg;
  context.fillRect(
    margin * 2,
    height - margin * 2,
    (width - margin * 4) * time,
    4
  );
};

const config = {
  colors: {
    bg: 'rgba(27, 25, 31, 0.0625)',
    bgSolid: 'rgba(27, 25, 31, 1)',
    fg: 'rgb(217,215,224)',
  },
  lambda: 6,
  spring: {
    stiffness: 0.3,
    damping: 0.2,
  },
  trail: false,
};

const sketch = () => {
  const margin = 0;

  const balls = [
    // { type: 'slerp', start: [0.2, 0.5], end: [0.8, 0.5] },
    // random
    { type: 'spring', random: true },
    // compare different movements
    // { type: 'lerp', start: [0.2, 0.2], end: [0.8, 0.2] },
    // { type: 'damp', start: [0.2, 0.4], end: [0.8, 0.4] },
    // { type: 'spring', start: [0.2, 0.6], end: [0.8, 0.6] },
    // { type: 'slerp', start: [0.2, 0.8], end: [0.8, 0.8] },
    // different lengths
    // { type: 'damp', start: [0.2, 0.2], end: [0.8, 0.2] },
    // { type: 'damp', start: [0.2, 0.4], end: [0.7, 0.4] },
    // { type: 'damp', start: [0.2, 0.6], end: [0.6, 0.6] },
    // { type: 'damp', start: [0.2, 0.8], end: [0.5, 0.8] },
  ].map(makeBall);

  return {
    begin({ width, height }) {
      balls.forEach((b) => b.init({ width, height }));
    },
    render(props) {
      const { context, width, height, playhead } = props;

      rect(
        context,
        margin,
        margin,
        width - margin * 2,
        height - margin * 2,
        config.trail ? config.colors.bg : config.colors.bgSolid
      );

      balls.forEach((b) => b.render(props));

      progress(context, playhead, width, height, 25);
    },
  };
};

function makeBall({ type, start: _start, end: _end, random = false }) {
  let pos = [];
  let spd = [0, 0];
  let start, end;

  return {
    init({ width, height }) {
      if (random) {
        start = end || [
          width * Random.range(0.125, 0.875),
          height * Random.range(0.125, 0.875),
        ];
        end = [
          width * Random.range(0.125, 0.875),
          height * Random.range(0.125, 0.875),
        ];
      } else {
        start = [_start[0] * width, _start[1] * height];
        end = [_end[0] * width, _end[1] * height];
      }

      pos[0] = start[0];
      pos[1] = start[1];
    },
    render(props) {
      movementTypes[type](props, [start, end], pos, spd);
    },
  };
}

const movementTypes = {
  lerp: drawLerp,
  spring: drawSpring,
  damp: drawDamp,
  slerp: drawSlerp,
};

function drawLerp({ context, playhead }, [start, end]) {
  // Chosoe size of circle & stroke
  const lineWidth = 4;
  const radius = 20;

  // Draw the start and end point
  circle(context, start[0], start[1], radius, config.colors.fg, lineWidth);
  circle(context, end[0], end[1], radius, config.colors.fg, lineWidth);

  // Choose a 't' value between 0..1, in this case the loop playhead
  const t = playhead;

  // Interpolate the x & y from start to end, using t
  const point = [lerp(start[0], end[0], t), lerp(start[1], end[1], t)];

  // And draw it
  circle(context, point[0], point[1], radius / 2, config.colors.fg);
}

// https://www.gamedeveloper.com/programming/improved-lerp-smoothing-
// https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
// https://github.com/mattdesl/blog-posts/blob/master/lerp/03-spring-toward-target.js
// Or use linear interpolation to spring toward a moving target.
// Each frame, interpolate from the current value to the target value with a small t parameter, such as 0.05.
// It’s like saying: walk 5% toward the target each frame.
function drawDamp({ context, deltaTime }, [start, end], pos) {
  // Choose size of circle & stroke
  const lineWidth = 4;
  const radius = 20;

  // Draw the start and end point
  circle(context, start[0], start[1], radius, config.colors.fg, lineWidth);
  circle(context, end[0], end[1], radius, config.colors.fg, lineWidth);

  // Interpolate the x & y from start to end, using deltaTime
  pos[0] = damp(pos[0], end[0], config.lambda, deltaTime);
  pos[1] = damp(pos[1], end[1], config.lambda, deltaTime);

  circle(context, pos[0], pos[1], radius / 2, config.colors.fg);
}

function drawSpring({ context, deltaTime }, [start, end], pos, spd) {
  const lineWidth = 4;
  const radius = 20;

  // Draw the start and end point
  circle(context, start[0], start[1], radius, config.colors.fg, lineWidth);
  circle(context, end[0], end[1], radius, config.colors.fg, lineWidth);

  // Interpolate toward the target point at this rate
  spd[0] = lerp(
    spd[0],
    (end[0] - pos[0]) * config.spring.stiffness,
    config.spring.damping // deltaTime *
  );
  pos[0] += spd[0];
  spd[1] = lerp(
    spd[1],
    (end[1] - pos[1]) * config.spring.stiffness,
    config.spring.damping // deltaTime *
  );
  pos[1] += spd[1];

  circle(context, pos[0], pos[1], radius / 2, config.colors.fg);
}

// https://observablehq.com/@spattana/slerp-spherical-linear-interpolation
// https://en.wikipedia.org/wiki/Slerp
function drawSlerp({ context, playhead }, [start, end]) {
  // Chosoe size of circle & stroke
  const lineWidth = 4;
  const radius = 20;

  // Draw the start and end point
  circle(context, start[0], start[1], radius, config.colors.fg, lineWidth);
  circle(context, end[0], end[1], radius, config.colors.fg, lineWidth);

  const point = slerp(start, end, playhead);

  // And draw it
  circle(context, point[0], point[1], radius / 2, config.colors.fg);
}

const dot = ([ax, ay], [bx, by]) =>
  (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));

function slerp(p0, p1, t) {
  const angle = Math.acos(dot(p0, p1));

  const factor1 = Math.sin(angle * (1 - t)) / Math.sin(angle);
  const factor2 = Math.sin(angle * t) / Math.sin(angle);

  return [p0[0] * factor1 + p1[0] * factor2, p0[1] * factor1 + p1[1] * factor2];
}

canvasSketch(sketch, settings);
