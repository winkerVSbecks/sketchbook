const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const {
  mapRange,
  lerpFrames,
  linspace,
  clamp,
} = require('canvas-sketch-util/math');
const eases = require('eases');
const { Lch } = require('./clrs');
const clrsThing = require('./clrs').clrs();

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 1,
  scaleToView: true,
};

const clrs = {
  outline: clrsThing.ink(),
  fills: [
    clrsThing.ink(), //Lch(50, 50, Random.range(180, 360)),
    clrsThing.ink(), //Lch(100, 70, Random.range(0, 180)),
    clrsThing.ink(), //Lch(100, 20, Random.range(0, 180)),
    clrsThing.ink(), //Lch(20, 90, Random.range(0, 180)),
    clrsThing.ink(), //Lch(50, 50, Random.range(180, 360)),
    clrsThing.ink(), //Lch(100, 70, Random.range(0, 180)),
    clrsThing.ink(), //Lch(100, 20, Random.range(0, 180)),
    clrsThing.ink(), //Lch(20, 90, Random.range(0, 180)),
  ],
  bg: clrsThing.bg, // Lch(95, 0, 0),
};

const config = {
  pipeCount: 5,
  lineWidth: 12,
  margin: 30,
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
    render({ context, width, height, playhead, deltaTime }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      context.translate(
        width / 2 - ((config.pipeCount - 1) * (2 * r + config.margin)) / 2,
        height / 2
      );
      pipes.forEach((pipe) => {
        drawPipe(context, pipe, eases.expoInOut(playhead));
      });
    },
  };
};

function createPipe({ r, h, index, color, direction }) {
  return {
    x: index * (2 * r + config.margin),
    r,
    h,
    color,
    direction,
    direction: Random.sign(),
  };
}

function drawPipe(context, pipe, playhead) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.lineWidth = config.lineWidth;
  drawOutside(context, pipe, playhead);
  drawInside(context, pipe, playhead);
}

function drawInside(context, { x, r: _r, h: _h, direction, color }, playhead) {
  const r = _r - config.lineWidth;
  const h = _h * playhead;
  const y = direction * (_h - h);

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - h);
  context.arc(x, y - h, r, Math.PI, 0);
  context.lineTo(x + r, y + h);
  context.arc(x, y + h, r, 0, Math.PI);
  context.lineTo(x - r, y);
  context.fill();
}

function drawOutside(context, { x, r: _r, h: _h, direction }, playhead) {
  const r = _r;
  const h = _h * playhead;
  const y = direction * (_h - h);

  context.strokeStyle = clrs.outline;
  context.beginPath();
  context.moveTo(x - r, y);
  context.lineTo(x - r, y - h);
  context.arc(x, y - h, r, Math.PI, 0);
  context.lineTo(x + r, y + h);
  context.arc(x, y + h, r, 0, Math.PI);
  context.lineTo(x - r, y);
  context.stroke();
}

canvasSketch(sketch, settings);
