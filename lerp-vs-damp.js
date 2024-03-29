const canvasSketch = require('canvas-sketch');
const { lerp, damp } = require('canvas-sketch-util/math');
const eases = require('eases');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 2,
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
  context.fillStyle = colors.fg;
  context.fillRect(
    margin * 2,
    height - margin * 2,
    (width - margin * 4) * time,
    4
  );
};

// let state = { lerpX: 0, dampX: 0 };
let x, y;
let x2, y2;
let spdx = 0;
const lambda = 6;

const colors = {
  bg: 'rgba(27, 25, 31, 0.0625)',
  fg: 'rgb(217,215,224)',
};

const sketch = () => {
  const margin = 25;

  return {
    begin({ context, width, height }) {
      x = width * 0.25;
      y = height * 0.4;

      x2 = width * 0.25;
      y2 = height * 0.6;
    },
    render(props) {
      // Destructure a few props we need
      const { context, width, height, playhead } = props;

      // rect(context, 0, 0, width, height, 'hsl(0, 0%, 98%)');

      rect(
        context,
        margin,
        margin,
        width - margin * 2,
        height - margin * 2,
        colors.bg
      );

      // Draw this scene
      drawLerp(props);
      drawSpring(props);
      drawDamp(props);
      drawSlerp(props);

      // Also draw a timeline at the bottom
      progress(context, playhead, width, height, margin);
    },
  };

  function drawLerp({ context, width, height, playhead }) {
    // Chosoe size of circle & stroke
    const lineWidth = 4;
    const radius = 20;

    // Choose a start and end point somewhere in our canvas
    const start = [width * 0.25, height * 0.2];
    const end = [width * 0.75, height * 0.2];

    // Draw the start and end point
    circle(context, start[0], start[1], radius, colors.fg, lineWidth);
    circle(context, end[0], end[1], radius, colors.fg, lineWidth);

    // Choose a 't' value between 0..1, in this case the loop playhead
    const t = playhead;

    // Interpolate the x dimension from start X to end X, using t
    const x = lerp(start[0], end[0], t);

    // Now interpolate the y dimension
    const y = lerp(start[1], end[1], t);

    // Now we have our new point in between the start and end
    const point = [x, y];

    // And draw it
    circle(context, point[0], point[1], radius / 2, colors.fg);
  }

  // https://www.gamedeveloper.com/programming/improved-lerp-smoothing-
  // https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
  // https://github.com/mattdesl/blog-posts/blob/master/lerp/03-spring-toward-target.js
  // Or use linear interpolation to spring toward a moving target.
  // Each frame, interpolate from the current value to the target value with a small t parameter, such as 0.05.
  // It’s like saying: walk 5% toward the target each frame.
  function drawDamp({ context, width, height, deltaTime, playhead }) {
    // Choose size of circle & stroke
    const lineWidth = 4;
    const radius = 20;

    // Choose a start and end point somewhere in our canvas
    const start = [width * 0.25, height * 0.4];
    const end = [width * 0.75, height * 0.4];

    // Draw the start and end point
    circle(context, start[0], start[1], radius, colors.fg, lineWidth);
    circle(context, end[0], end[1], radius, colors.fg, lineWidth);

    // const lambda = 3;

    // Interpolate the x dimension from start X to end X, using deltaTime
    x = damp(x, end[0], lambda, deltaTime);

    // Now interpolate the y dimension
    y = damp(y, end[1], lambda, deltaTime);

    // Now we have our new point in between the start and end
    const point = [x, y];

    // And draw it
    circle(context, point[0], point[1], radius / 2, colors.fg);
  }

  function drawSpring({ context, width, height, deltaTime, playhead }) {
    // Chosoe size of circle & stroke
    const lineWidth = 4;
    const radius = 20;

    // Choose a start and end point somewhere in our canvas
    const start = [width * 0.25, height * 0.6];
    const end = [width * 0.75, height * 0.6];

    // Draw the start and end point
    circle(context, start[0], start[1], radius, colors.fg, lineWidth);
    circle(context, end[0], end[1], radius, colors.fg, lineWidth);

    // const rate = lambda * deltaTime; // 1 - Math.exp(-3 * deltaTime);
    const rate = 1 - Math.pow(0.125, deltaTime);

    // Interpolate toward the target point at this rate
    spdx = lerp(spdx, (end[0] - x2) * 0.4, deltaTime * 24);
    x2 += spdx;
    // x2 = lerp(x2, end[0], rate);
    y2 = lerp(y2, end[1], rate);

    // Now we have our new point in between the start and end
    const point = [x2, y2];

    // And draw it
    circle(context, point[0], point[1], radius / 2, colors.fg);
  }

  // https://observablehq.com/@spattana/slerp-spherical-linear-interpolation
  // https://en.wikipedia.org/wiki/Slerp
  function drawSlerp({ context, width, height, deltaTime, playhead }) {
    // Chosoe size of circle & stroke
    const lineWidth = 4;
    const radius = 20;

    // Choose a start and end point somewhere in our canvas
    const start = [width * 0.25, height * 0.8];
    const end = [width * 0.75, height * 0.8];

    // Draw the start and end point
    circle(context, start[0], start[1], radius, colors.fg, lineWidth);
    circle(context, end[0], end[1], radius, colors.fg, lineWidth);

    const point = slerp(start, end, playhead);

    // And draw it
    circle(context, point[0], point[1], radius / 2, colors.fg);
  }
};

canvasSketch(sketch, settings);

const dot = ([ax, ay], [bx, by]) =>
  (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));

function slerp(p0, p1, t) {
  const angle = Math.acos(dot(p0, p1));

  const factor1 = Math.sin(angle * (1 - t)) / Math.sin(angle);
  const factor2 = Math.sin(angle * t) / Math.sin(angle);

  return [p0[0] * factor1 + p1[0] * factor2, p0[1] * factor1 + p1[1] * factor2];
}
