const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const chroma = require('chroma-js');
const { Poline, positionFunctions } = require('poline/dist/index.cjs');

// https://textilelearner.net/types-of-fabric-weave-structure/
// https://shop.newtess.com/en/types-of-weaves-textile-glossary/
// https://openprocessing.org/sketch/89249/

const settings = {
  dimensions: [800 * 2, 600 * 2],
  animate: true,
  duration: 5,
  scaleToView: true,
  loop: false,
};

const config = {
  shadow: true,
  gap: 0, // gap logic is broken
  looseEndSize: 4,
  threadSize: 5 * 2,
  shadowSize: 0.5 * 2,
  animateWeft: false,
  animateWarp: false,
};

const poline = new Poline({
  numPoints: 9,
  positionFunctionX: positionFunctions.sinusoidalPosition,
  positionFunctionY: positionFunctions.quadraticPosition,
  positionFunctionZ: positionFunctions.linearPosition,
});

const colors = poline.colorsCSS;
colors.forEach((color) => {
  console.log('%c  ', `background: ${color};`);
});

const shadowColor = chroma(colors.at(Math.floor(colors.length / 2)))
  .darken(1)
  .hex();

/**
 * warp ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 * weft ↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️
 *      ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 *      ↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️
 *      ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 */
const threads = {
  warp: colors.slice(0, 7), // colors.slice(0, 7),
  weft: colors.slice(0, 7), // colors.slice(7),
};

const getThread = (type, index) => {
  const thread = threads[type];
  index = index > thread.length - 1 ? 0 : index;
  return thread[index];
};

/**
 * Weave a pattern
 */
const weaveStep = ({ pattern, weftCount, warpCount, limit }) => {
  blocks = { warpUp: [], warpDown: [], weft: [] };

  const yLimit = config.animateWarp ? limit : weftCount;

  for (let y = 0; y < yLimit; y++) {
    const p = pattern[y % pattern.length];
    const step = p.length;

    for (let x = 0; x < warpCount; x += step) {
      for (let i = 0; i < step; i++) {
        const index = getIndex(x + i, threads.warp);

        blocks[p[i] ? 'warpUp' : 'warpDown'].push({
          x: x + i,
          y: y,
          color: getThread('warp', index),
        });
      }
    }
  }
};

// cycle through the thread colors as x + i increases
function getIndex(index, opts) {
  if (index > opts.length - 1) {
    index = index % opts.length;
  }
  return index;
}

// warp ↕️↕️↕️
const drawWarp = ({ context, blocks, limit, warpCount }) => {
  blocks.forEach(({ x, y, color }) => {
    if (x >= config.looseEndSize && x < warpCount - config.looseEndSize) {
      // shadow
      // if (
      //   config.shadow &&
      //   y >= config.looseEndSize &&
      //   y < limit - config.looseEndSize
      // ) {
      //   context.fillStyle = shadowColor;
      //   context.fillRect(
      //     x * config.threadSize - config.shadowSize,
      //     y * config.threadSize,
      //     config.threadSize + 2 * config.shadowSize,
      //     config.threadSize
      //   );
      // }

      context.fillStyle = color;
      // prettier-ignore
      context.fillRect(
        x * config.threadSize,
        y * config.threadSize,
        config.threadSize - config.gap,
        config.threadSize
      );
    }
  });
};

// weft ↔️↔️↔️
const drawWeft = ({
  context,
  width,
  x: xLimit,
  y: yLimit,
  weftCount,
  warpCount,
}) => {
  for (let y = config.looseEndSize; y < yLimit - config.looseEndSize; y++) {
    for (let x = 0; x < xLimit; x++) {
      const index = getIndex(y, 'weft');
      const color = getThread('weft', index);

      const X = x * config.threadSize;
      const Y = y * config.threadSize;
      const W = config.threadSize;
      const H = config.threadSize;

      if (
        config.shadow &&
        x >= config.looseEndSize &&
        x < warpCount - config.looseEndSize
      ) {
        // shadow
        context.fillStyle = shadowColor;
        // prettier-ignore
        context.fillRect(
          X, Y - config.shadowSize,
          W, H + 2 * config.shadowSize
        );
      }

      // thread
      context.fillStyle = color;
      // prettier-ignore
      context.fillRect(X - 1, Y, W + 1, H); // overlap to avoid gaps
    }
  }
};

const weave = ({ context, pattern, width, height, playhead, x, y }) => {
  const warpCount = width / config.threadSize;
  const weftCount = height / config.threadSize;

  const weftLimit = config.animateWeft
    ? Math.ceil(weftCount * playhead)
    : weftCount;
  const warpLimit = config.animateWarp
    ? Math.ceil(warpCount * playhead)
    : warpCount;

  context.translate(x, y);
  weaveStep({ pattern, weftCount, warpCount, limit: weftLimit, playhead });
  // ↕️↕️↕️ (underneath)
  drawWarp({
    context,
    type: 'under',
    blocks: blocks.warpDown,
    limit: weftLimit,
    warpCount,
  });
  // ↔️↔️↔️
  drawWeft({
    context,
    width,
    x: warpLimit, //(warpCount * playhead) % 1,
    y: weftLimit,
    weftCount,
    warpCount,
  });
  // ↕️↕️↕️ (on top)
  drawWarp({
    context,
    type: 'over',
    blocks: blocks.warpUp,
    limit: weftLimit,
    warpCount,
  });
};

const sketch = () => {
  const patternLength = Random.rangeFloor(2, 10);
  const pattern = new Array(Random.rangeFloor(2, 10))
    .fill(0)
    .map(() => new Array(patternLength).fill(0).map(() => Random.pick([0, 1])));

  console.table(pattern);

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const margin = config.threadSize * 8;

      weave({
        context,
        pattern,
        width: width - margin * 2,
        height: height - margin * 2,
        playhead,
        x: margin,
        y: margin,
      });
    },
  };
};

canvasSketch(sketch, settings);
