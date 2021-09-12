const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const eases = require('eases');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 8,
  scaleToView: true,
};

// const clrs = {
//   even: {
//     outline: '#2C4BFF',
//     fill: '#FF5885',
//     bg: '#012483',
//   },
//   odd: {
//     outline: '#FF0D6C',
//     fill: '#FE664C',
//     bg: '#FFD06E',
//   },
//   bg: '#FFDBE7',
// };

// const clrs = {
//   even: {
//     outline: '#3E4CCC',
//     fill: '#EC6249',
//     bg: '#EBECE5',
//   },
//   odd: {
//     outline: '#3E4CCC',
//     fill: '#EBECE5',
//     bg: '#EC6249',
//   },
//   bg: '#0F0E2C',
// };

// const clrs = {
//   even: {
//     outline: '#2D2EBE',
//     fill: '#FFFFFF',
//     bg: '#487DE6',
//   },
//   odd: {
//     outline: '#ED9F38',
//     fill: '#DD7761',
//     bg: '#E6BF45',
//   },
//   bg: '#C9DDF1',
// };

// const clrs = {
//   even: {
//     outline: '#091e25',
//     fill: '#1cadfe',
//     bg: '#33d682',
//   },
//   odd: {
//     outline: '#091e25',
//     fill: '#ff6871',
//     bg: '#ffe15e',
//   },
//   bg: '#19e0ff',
// };

// const clrs = {
//   even: {
//     outline: '#FCA7FF',
//     fill: '#FF79E2',
//     bg: '#FDE3BF',
//   },
//   odd: {
//     outline: '#17B9B9',
//     fill: '#53F8C6',
//     bg: '#EAFCFF',
//   },
//   bg: '#FFFFFF',
// };

const clrs = {
  stuff: [
    {
      outline: '#3624F4',
      fill: '#3624F4',
      bg: '#0A1918',
    },
    {
      outline: '#FDC22D',
      fill: '#FDC22D',
      bg: '#0A1918',
    },
    {
      outline: '#FB331C',
      fill: '#FB331C',
      bg: '#0A1918',
    },
    {
      outline: '#F992E2',
      fill: '#F992E2',
      bg: '#0A1918',
    },
    {
      outline: '#E7EEF6',
      fill: '#E7EEF6',
      bg: '#0A1918',
    },
  ],
  even: {
    outline: '#3624F4',
    fill: '#3624F4',
    bg: '#0A1918',
  },
  odd: {
    outline: '#FDC22D',
    fill: '#FDC22D',
    bg: '#0A1918',
  },
  bg: '#0A1918',
};

const config = {
  pipeCount: 9,
  lineWidth: 12,
  margin: 30,
  r: 0.0625 / 2,
  h: 0.3,
  exp: 0.25,
  symmetric: false,
};

const sketch = async ({ width, height }) => {
  const r = width * config.r;
  const h = height * config.h;

  const pipes = new Array(config.pipeCount).fill().map((_, index) => {
    const colors = Random.pick(clrs.stuff);

    return createPipe({
      r,
      h,
      index,
      outline: colors.outline, //index % 2 === 0 ? clrs.even.outline : clrs.odd.outline,
      fill: colors.fill, //index % 2 === 0 ? clrs.even.fill : clrs.odd.fill,
      bg: colors.bg, //index % 2 === 0 ? clrs.even.bg : clrs.odd.bg,
    });
  });

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

function createPipe({ r, h, index, outline, fill, bg }) {
  return {
    x: index * (2 * r + config.margin),
    r,
    h,
    exp: (config.symmetric ? 0.25 : Random.range(0.25, 0.75)) * h,
    direction: Random.sign(),
    outline,
    fill,
    bg,
  };
}

function drawPipe(context, pipe, playhead, t, { targets, targetIndex }) {
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const [inner, outer] = animations[targets[targetIndex]](pipe, t);

  drawOutside(context, { ...pipe, ...outer });
  drawInside(context, { ...pipe, ...inner });
}

function drawInside(
  context,
  { x, r: rOriginal, h, exp, offset, direction, fill }
) {
  const r = Math.max(rOriginal - config.lineWidth * 1.5, 0);
  const y = offset || direction * (h - exp);

  context.fillStyle = fill;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - exp);
  context.arc(x, y - exp, r, Math.PI, 0);
  context.lineTo(x + r, y + exp);
  context.arc(x, y + exp, r, 0, Math.PI);
  context.lineTo(x - r, y);
  context.fill();
}

function drawOutside(context, { x, r, h, exp, direction, outline, bg }) {
  const y = direction * (h - exp);

  context.lineWidth = r < config.lineWidth * 0.25 ? 0 : config.lineWidth;
  context.strokeStyle = outline;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - exp);
  context.arc(x, y - exp, r, Math.PI, 0);
  context.lineTo(x + r, y + exp);
  context.arc(x, y + exp, r, 0, Math.PI);
  context.lineTo(x - r, y);

  context.fillStyle = bg;
  context.fill();
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
          direction * exp,
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
