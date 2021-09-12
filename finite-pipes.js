const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const eases = require('eases');
const clrsThing = require('./clrs').clrs();

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 8,
  scaleToView: true,
};

const clrs = {
  outline: clrsThing.ink(),
  fills: [
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
    clrsThing.ink(),
  ],
  bg: clrsThing.bg,
};

const config = {
  pipeCount: 5,
  lineWidth: 12,
  margin: 30,
  exp: 0.25,
};

const sketch = async ({ width, height }) => {
  const r = width * 0.0625;
  const h = height * 0.25;

  const pipes = new Array(config.pipeCount).fill().map((_, index) =>
    createPipe({
      r,
      h,
      index,
      color: Random.pick(clrs.fills),
    })
  );

  return {
    render({ context, width, height, playhead, time }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      const targets = Object.keys(animations);
      const targetIndex = Math.floor(playhead * targets.length);

      const t = mapRange(time, targetIndex, targetIndex + 1, 0, 1);

      context.translate(
        width / 2 - ((config.pipeCount - 1) * (2 * r + config.margin)) / 2,
        height / 2
      );
      pipes.forEach((pipe) => {
        drawPipe(context, pipe, playhead, t, { targets, targetIndex });
      });
    },
  };
};

function createPipe({ r, h, index, color, direction }) {
  return {
    x: index * (2 * r + config.margin),
    r,
    h,
    exp: Random.range(0.25, 0.75) * h,
    color,
    direction,
    direction: Random.sign(),
  };
}

function drawPipe(context, pipe, playhead, t, { targets, targetIndex }) {
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const [inner, outer] = animations[targets[targetIndex]](pipe, t);
  // const [inner, outer] = animations.expandInner(pipe, t);

  drawOutside(context, { ...pipe, ...outer });
  drawInside(context, { ...pipe, ...inner });
}

function drawInside(
  context,
  { x, r: rOriginal, h, exp, offset, direction, color }
) {
  const r = Math.max(rOriginal - config.lineWidth, 0);
  const y = offset || direction * (h - exp);

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - exp);
  context.arc(x, y - exp, r, Math.PI, 0);
  context.lineTo(x + r, y + exp);
  context.arc(x, y + exp, r, 0, Math.PI);
  context.lineTo(x - r, y);
  context.fill();
}

function drawOutside(context, { x, r, h, exp, direction }) {
  const y = direction * (h - exp);

  context.lineWidth = r < config.lineWidth * 0.25 ? 0 : config.lineWidth;
  context.strokeStyle = clrs.outline;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - exp);
  context.arc(x, y - exp, r, Math.PI, 0);
  context.lineTo(x + r, y + exp);
  context.arc(x, y + exp, r, 0, Math.PI);
  context.lineTo(x - r, y);
  context.stroke();
}

const animations = {
  appearOuter: ({ r }, t) => [
    { r: 0, exp: 0 },
    { r: eases.expoInOut(t) * r, exp: 0 },
  ],
  expandOuter: ({ r, h, exp }, t) => [
    { r: 0, exp: 0 },
    {
      r,
      exp: eases.expoInOut(t) * exp,
    },
  ],
  appearInner: ({ r, h, exp }, t) => [
    { r: eases.expoInOut(t) * r, exp: 0 },
    { r, exp: exp },
  ],
  fullExpand: ({ r, h, direction, exp }, t) => {
    const offset = mapRange(
      eases.expoInOut(t),
      0,
      1,
      direction * h,
      -1 * direction * h
    );

    return [
      {
        r,
        exp: 0,
        offset,
      },
      {
        r,
        exp: mapRange(
          offset,
          direction * exp + direction * r,
          -1 * direction * h,
          exp,
          h,
          true
        ),
      },
    ];
  },
  expandInner: ({ r, h, direction, exp }, t) => [
    {
      r,
      exp: eases.expoInOut(t) * exp,
      offset: mapRange(
        eases.expoInOut(t),
        0,
        1,
        -1 * direction * h,
        -1 * direction * h + 1 * direction * exp
      ),
    },
    {
      r,
      exp: h,
    },
  ],
  retreat: ({ r, h, direction, exp }, t) => [
    {
      r,
      exp,
      offset: mapRange(
        eases.expoInOut(t),
        0,
        1,
        -1 * direction * h + 1 * direction * exp,
        direction * h - 1 * direction * exp
      ),
    },
    {
      r,
      exp: h,
    },
  ],
  collapse: ({ r, h, exp }, t) => {
    const expOuter = mapRange(eases.expoInOut(t), 0, 1, h, 0);

    return [
      {
        r,
        exp: mapRange(expOuter, exp, 0, exp, 0, true),
      },
      { r, exp: expOuter },
    ];
  },
  disappear: ({ r }, t) => [
    { r: r - eases.expoInOut(t) * r, exp: 0 },
    { r: r - eases.expoInOut(t) * r, exp: 0 },
  ],
};

canvasSketch(sketch, settings);
