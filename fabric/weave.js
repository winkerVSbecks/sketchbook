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

const threadSize = 5 * 2;
const config = {
  shadow: true,
  looseEndSize: 0,
  threadSize,
  margin: threadSize * 4, //threadSize * 8,
  shadowSize: 0.5 * 2,
  animateWeft: true,
  animateNeedle: true,
  colorVariation: true,
  flutter: true,
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
  .alpha(0.25)
  .css();
// .hex();

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

const sketch = ({ canvas }) => {
  const patternLength = Random.rangeFloor(2, 10);
  const pattern = new Array(Random.rangeFloor(2, 10))
    .fill(0)
    .map(() => new Array(patternLength).fill(0).map(() => Random.pick([0, 1])));

  console.table(pattern);

  const [svgFilter, feTurbulence, feDisplacementMap] = createSVGFilter();
  if (config.flutter) {
    document.body.appendChild(svgFilter);
    canvas.style.filter = 'url(#hand-drawn)';
  }

  return {
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const trim = config.margin / 4;
      context.fillStyle = '#111';
      context.fillRect(trim, trim, width - 2 * trim, height - 2 * trim);

      if (config.flutter) {
        feTurbulence.setAttribute(
          'baseFrequency',
          0.03 + 0.005 * Math.sin(playhead * Math.PI)
        );
        // feDisplacementMap.setAttribute(
        //   'scale',
        //   5 + 5 * Math.sin(playhead * Math.PI)
        // );
      }

      weave({
        context,
        pattern,
        width: width - config.margin * 2,
        height: height - config.margin * 2,
        playhead,
        x: config.margin,
        y: config.margin,
      });
    },
  };
};

canvasSketch(sketch, settings);

/**
 * Weave a pattern
 */
const weaveStep = ({ pattern, weftCount, warpCount, limit }) => {
  blocks = { warpUp: [], warpDown: [], weft: [] };

  for (let y = 0; y < weftCount; y++) {
    const p = pattern[y % pattern.length];
    const step = p.length;

    for (let x = 0; x < warpCount; x += step) {
      for (let i = 0; i < step; i++) {
        const index = getIndex(x + i, threads.warp);

        if (p[i]) {
          blocks.warpUp.push({
            x: x + i,
            y: y,
            color: getThread('warp', index),
          });
        } else {
          blocks.warpDown.push({
            x: x + i,
            y: y,
            color: getThread('warp', index),
          });
          blocks.weft.push({
            x: x + i,
            y: y,
            color: getThread('weft', getIndex(y, 'weft')),
          });
        }
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
    const X = x * config.threadSize;
    const Y = y * config.threadSize;
    const W = config.threadSize;
    const H = config.threadSize;

    if (x >= config.looseEndSize && x < warpCount - config.looseEndSize) {
      // shadow
      if (
        config.shadow &&
        y >= config.looseEndSize &&
        y < limit - config.looseEndSize
      ) {
        context.fillStyle = shadowColor;
        // prettier-ignore
        context.fillRect(
          X - config.shadowSize, Y,
          W + 2 * config.shadowSize, H
        );
      }

      context.fillStyle = config.colorVariation
        ? getRandomColorVariation(color, 0.05)
        : color;
      // prettier-ignore
      context.fillRect(
        X, Y - 1,
        W, H + 1
      );
    }
  });
};

// weft ↔️↔️↔️
const drawWeft = ({
  context,
  blocks,
  x: xLimit,
  y: yLimit,
  weftCount,
  warpCount,
}) => {
  blocks.forEach(({ x, y, color }) => {
    const X = x * config.threadSize;
    const Y = y * config.threadSize;
    const W = config.threadSize;
    const H = config.threadSize;
    const limit = y === yLimit - config.looseEndSize - 1 ? xLimit : warpCount;

    if (
      x < limit &&
      y >= config.looseEndSize &&
      y < yLimit - config.looseEndSize
    ) {
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
      context.fillStyle = config.colorVariation
        ? getRandomColorVariation(color, 0.05)
        : color;
      context.fillRect(X - 1, Y, W + 1, H); // overlap to avoid gaps
    }
  });
};

const weave = ({ context, pattern, width, height, playhead, x, y }) => {
  const warpCount = width / config.threadSize;
  const weftCount = height / config.threadSize;

  const weftLimit = config.animateWeft
    ? Math.ceil(weftCount * playhead)
    : weftCount;
  const warpLimit = config.animateWeft
    ? Math.ceil(warpCount * playhead)
    : warpCount;

  context.translate(x, y);
  weaveStep({ pattern, weftCount, warpCount, limit: weftLimit, playhead });
  // ↕️↕️↕️ (underneath)
  drawWarp({
    context,
    blocks: blocks.warpDown,
    limit: weftLimit,
    warpCount,
  });
  // ↔️↔️↔️
  drawWeft({
    context,
    blocks: blocks.weft,
    x: config.animateNeedle
      ? Math.ceil(warpCount * ((weftCount * playhead) % 1))
      : warpCount,
    y: weftLimit,
    warpCount,
  });
  // ↕️↕️↕️ (on top)
  drawWarp({
    context,
    blocks: blocks.warpUp,
    limit: weftLimit,
    warpCount,
  });
};

const getRandomColorVariation = (color, variation) => {
  const [h, s, l] = chroma(color).hsl();
  const newH = h + Random.range(-variation, variation);
  const newS = s + Random.range(-variation, variation);
  const newL = l + Random.range(-variation, variation);
  return chroma.hsl(newH, newS, newL).css();
};

/**
 * SVG filter for movement effect
 */
function createSVGFilter() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.zIndex = '-1';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  const filter = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'filter'
  );
  filter.setAttribute('id', 'hand-drawn');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  defs.appendChild(filter);

  const feTurbulence = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'feTurbulence'
  );
  feTurbulence.setAttribute('type', 'fractalNoise');
  feTurbulence.setAttribute('baseFrequency', '0.03');
  feTurbulence.setAttribute('numOctaves', '0.5');
  feTurbulence.setAttribute('result', 'noise');
  feTurbulence.setAttribute('seed', Random.value());
  filter.appendChild(feTurbulence);

  const feDisplacementMap = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'feDisplacementMap'
  );
  feDisplacementMap.setAttribute('in', 'SourceGraphic');
  feDisplacementMap.setAttribute('in2', 'noise');
  feDisplacementMap.setAttribute('scale', '5');
  feDisplacementMap.setAttribute('xChannelSelector', 'R');
  feDisplacementMap.setAttribute('yChannelSelector', 'G');
  filter.appendChild(feDisplacementMap);

  return [svg, feTurbulence, feDisplacementMap];
}
