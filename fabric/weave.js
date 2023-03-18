const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const chroma = require('chroma-js');
const { Poline, positionFunctions } = require('poline/dist/index.cjs');

// https://textilelearner.net/types-of-fabric-weave-structure/
// https://shop.newtess.com/en/types-of-weaves-textile-glossary/
// https://openprocessing.org/sketch/89249/

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 5,
  scaleToView: true,
  loop: false,
};

const config = {
  shadow: true,
  gap: 0,
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

const sketch = () => {
  let blocks = { warpUp: [], warpDown: [], weft: [] };

  const patternLength = Random.rangeFloor(2, 10);
  const pattern = new Array(Random.rangeFloor(2, 10))
    .fill(0)
    .map(() => new Array(patternLength).fill(0).map(() => Random.pick([0, 1])));

  console.table(pattern);
  const threadSize = 5;
  const shadowSize = 0.5;

  const createWeave = ({ weftCount, warpCount, limit }) => {
    blocks = { warpUp: [], warpDown: [], weft: [] };

    for (let y = 0; y < weftCount /* limit */; y++) {
      const p = pattern[y % pattern.length];
      const step = p.length;

      for (let x = 0; x < warpCount; x += step) {
        for (let i = 0; i < step; i++) {
          const state = p[i] ? 'warp' : 'weft';
          const rawIndex = p[i] ? y : x + i;
          const index = getIndex(rawIndex, threads[state]);

          blocks[p[i] ? 'warpUp' : 'warpDown'].push({
            x: (x + i) * threadSize,
            y: y * threadSize,
            color: getThread('warp', getIndex(x + i, threads.warp)),
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
  const drawWarp = ({ context, blocks, limit }) => {
    blocks.forEach(({ x, y, color }) => {
      // shadow
      if (config.shadow && y < limit * threadSize) {
        context.fillStyle = shadowColor; // chroma(color).darken().hex(); // '#333';
        context.fillRect(
          x - shadowSize,
          y,
          threadSize + 2 * shadowSize,
          threadSize
        );
      }

      context.fillStyle = color;
      context.fillRect(x, y, threadSize - config.gap, threadSize);
    });
  };

  // weft ↔️↔️↔️
  const drawWeft = ({ context, width, x, y }) => {
    for (let i = 0; i < y; i++) {
      const index = getIndex(i, 'weft');
      const w = i === y - 1 ? x * width : width;
      const color = getThread('weft', index);

      if (config.shadow) {
        // shadow
        context.fillStyle = shadowColor; // chroma(color).darken().hex(); // '#333';
        context.fillRect(
          0,
          i * threadSize - shadowSize,
          w,
          threadSize + 2 * shadowSize
        );
      }

      // thread
      context.fillStyle = color;
      context.fillRect(0, i * threadSize, w, threadSize - config.gap);
    }
  };

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);

      const warpCount = width / threadSize;
      const weftCount = height / threadSize;

      const limit = Math.ceil(warpCount * playhead);
      const weftLimit = Math.ceil(weftCount * playhead);

      createWeave({ weftCount, warpCount, limit, playhead });
      drawWarp({ context, blocks: blocks.warpDown, limit });
      drawWeft({
        context,
        width,
        x: (warpCount * playhead) % 1,
        y: limit,
      });
      drawWarp({ context, blocks: blocks.warpUp, limit });
    },
  };
};

canvasSketch(sketch, settings);
