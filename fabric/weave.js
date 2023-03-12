const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { Poline, positionFunctions } = require('poline/dist/index.cjs');

// https://textilelearner.net/types-of-fabric-weave-structure/
// https://shop.newtess.com/en/types-of-weaves-textile-glossary/
// https://openprocessing.org/sketch/89249/

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 6,
  scaleToView: true,
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

const threads = {
  warp: colors.slice(0, 7),
  weft: colors.slice(7),
  // weft: colors.slice(0, 7),
  // warp: colors.slice(7),
};

const getThread = (type, index) => {
  const thread = threads[type];
  index = index > thread.length - 1 ? 0 : index;
  return thread[index];
};

const sketch = () => {
  let blocks = [];
  const patternLength = Random.rangeFloor(2, 10);
  const pattern = [
    new Array(patternLength).fill(0).map(() => Random.pick([0, 1])), //[0, 1, 1, 1, 0, 1],
    new Array(patternLength).fill(0).map(() => Random.pick([0, 1])), //[1, 0, 1, 0, 1, 0],
  ];
  console.table(pattern);
  const threadSize = 10;

  const createWeave = ({ width, height, playhead }) => {
    const weftCount = width / threadSize;
    const warpCount = height / threadSize;

    const limit = Math.ceil(warpCount * playhead);

    blocks = [];

    for (let y = 0; y < limit; y++) {
      const p = pattern[y % pattern.length];
      const step = p.length;

      for (let x = 0; x < weftCount; x += step) {
        for (let i = 0; i < step; i++) {
          const state = p[i] ? 'warp' : 'weft';
          const rawIndex = p[i] ? y : x + i;
          const index = getIndex(rawIndex, threads[state]);

          blocks.push({
            x: (x + i) * threadSize,
            y: y * threadSize,
            color: getThread(state, index),
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

  const drawFabric = (context) => {
    blocks.forEach(({ x, y, color }) => {
      context.fillStyle = color;
      context.fillRect(x, y, threadSize, threadSize);
    });
  };

  return {
    begin({ width, height }) {
      // createWeave({ width, height });
    },
    render({ context, width, height, playhead }) {
      createWeave({ width, height, playhead });
      drawFabric(context);
    },
  };
};

canvasSketch(sketch, settings);
