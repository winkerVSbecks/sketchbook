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
      const { context } = props;
      pos = movementTypes[type](props, [start, end], pos, spd);

      const lineWidth = 4;
      const radius = 20;

      // start
      circle(context, start[0], start[1], radius, config.colors.fg, lineWidth);
      // end
      circle(context, end[0], end[1], radius, config.colors.fg, lineWidth);
      // inner
      circle(context, pos[0], pos[1], radius / 2, config.colors.fg);
    },
  };
}

const movementTypes = {
  lerp: ({ playhead }, [start, end]) => {
    return [lerp(start[0], end[0], playhead), lerp(start[1], end[1], playhead)];
  },
  damp: ({ deltaTime }, [start, end], pos) => {
    return [
      damp(pos[0], end[0], config.lambda, deltaTime),
      damp(pos[1], end[1], config.lambda, deltaTime),
    ];
  },
  spring: ({ deltaTime }, [start, end], pos, spd) => {
    spd[0] = lerp(
      spd[0],
      (end[0] - pos[0]) * config.spring.stiffness,
      config.spring.damping
    );
    spd[1] = lerp(
      spd[1],
      (end[1] - pos[1]) * config.spring.stiffness,
      config.spring.damping
    );

    return [pos[0] + spd[0], pos[1] + spd[1]];
  },
  slerp: ({ playhead }, [start, end]) => {
    const angle = Math.acos(dot(start, end));

    const factor1 = Math.sin(angle * (1 - playhead)) / Math.sin(angle);
    const factor2 = Math.sin(angle * playhead) / Math.sin(angle);

    return [
      start[0] * factor1 + end[0] * factor2,
      start[1] * factor1 + end[1] * factor2,
    ];
  },
};

canvasSketch(sketch, settings);
