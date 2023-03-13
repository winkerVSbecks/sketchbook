const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { Poline, positionFunctions } = require('poline/dist/index.cjs');

// https://textilelearner.net/types-of-fabric-weave-structure/
// https://shop.newtess.com/en/types-of-weaves-textile-glossary/
// https://openprocessing.org/sketch/89249/

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 20,
  scaleToView: true,
  loop: false,
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

/**
 * warp ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 * weft ↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️
 *      ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 *      ↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️
 *      ↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️↕️
 */
const threads = {
  warp: colors.slice(0, 7),
  weft: colors.slice(7),
};

const getThread = (type, index) => {
  const thread = threads[type];
  index = index > thread.length - 1 ? 0 : index;
  return thread[index];
};

const sketch = () => {
  let blocks = { warpUp: [], warpDown: [], weft: [] };

  const patternLength = Random.rangeFloor(2, 10);
  const pattern = [
    new Array(patternLength).fill(0).map(() => Random.pick([0, 1])), //[0, 1, 1, 1, 0, 1],
    new Array(patternLength).fill(0).map(() => Random.pick([0, 1])), //[1, 0, 1, 0, 1, 0],
  ];
  console.table(pattern);
  const threadSize = 20;

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

  const drawWarp = ({ context, blocks }) => {
    blocks.forEach(({ x, y, color }) => {
      context.fillStyle = color;
      context.fillRect(x, y, threadSize, threadSize);
    });
  };

  const drawWeft = ({ context, width, x, y }) => {
    for (let i = 0; i < y; i++) {
      const index = getIndex(i, 'weft');
      context.fillStyle = getThread('weft', index);
      const w = i === y - 1 ? x * width : width;
      context.fillRect(0, i * threadSize, w, threadSize);
    }
  };

  return {
    begin({ context, width, height }) {
      // createWeave({ width, height });
    },
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const warpCount = width / threadSize;
      const weftCount = height / threadSize;

      const limit = Math.ceil(warpCount * playhead);
      const weftLimit = Math.ceil(weftCount * playhead);

      createWeave({ weftCount, warpCount, limit, playhead });
      drawWarp({ context, blocks: blocks.warpDown });
      drawWeft({
        context,
        width,
        x: (warpCount * playhead) % 1,
        y: limit,
      });
      drawWarp({ context, blocks: blocks.warpUp });
    },
  };
};

canvasSketch(sketch, settings);
