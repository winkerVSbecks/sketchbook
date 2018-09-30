const canvasSketch = require('canvas-sketch');
const { range } = require('canvas-sketch-util/random');
const R = require('ramda');
const { quintInOut, backInOut, quintIn } = require('eases');
const ticker = require('tween-ticker')({ defaultEase: quintInOut });
const Tween = require('tween-chain');
const chroma = require('chroma-js');
const { rectGrid } = require('./grid');
const { drawShape } = require('./geometry');

const settings = {
  dimensions: [800, 800],
  animate: true,
  duration: 5,
  scaleToView: true,
  fps: 60,
  playbackRate: 'fixed',
};

const sketch = () => {
  console.clear();
  let pts = [];

  return {
    begin({ context, width, height }) {
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.lineJoin = 'bevel';
      // Create a grid
      pts = rectGrid({
        size: { x: width, y: height },
        resolution: { x: 16, y: 16 },
        padding: { x: 0.15, y: 0.15 },
      }).reduce((acc, props) => {
        const { chain, pt } = animations.one(props, { width, height });

        ticker.push(chain);
        return acc.concat([pt]);
      }, []);
    },
    render({ context, width, height, deltaTime }) {
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);
      context.lineJoin = 'bevel';

      ticker.tick();

      pts.forEach(({ x, y, r, opacity = 1, fill = '#fff' }) => {
        context.globalAlpha = opacity;

        context.fillStyle = fill;
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.fill();
      });
    },
  };
};

canvasSketch(sketch, settings);

const animations = {
  one({ x, y, s, step, yIdx, xIdx }) {
    const even = yIdx % 2 === 0;
    const offsetX = even ? step.x / 2 : 0;
    const offsetY = even ? step.y : -step.y;
    const r = s.x / 8;
    const pt = { x: x - range(step.x, step.x * 8), y, opacity: 0, r };

    return {
      pt,
      chain: Tween()
        // fade in right
        .chain(pt, { x, opacity: 1, r, duration: 1.6 })
        // move right
        .then(pt, {
          x: x + offsetX,
          r: r * 1.6,
          duration: 0.4,
          ease: backInOut,
        })
        // twist
        .then(pt, {
          x: x,
          y: y + offsetY,
          delay: 0.4,
          duration: 0.6,
        })
        // back to grid
        .then(pt, {
          y,
          r,
          delay: 0.8,
          duration: 0.6,
          ease: quintIn,
        })
        // fade out
        .then(pt, {
          opacity: 0,
          delay: 0.4,
          duration: 0.3,
        }),
    };
  },
  two({ x, y, s, step, yIdx, xIdx }, { width, height }) {
    const even = yIdx % 2 === 0;
    const offsetX = even ? step.x / 2 : 0;
    const offsetY = even ? step.y : -step.y;
    const r = s.x / 8;
    const pt = { x, y, r: 0, fill: randomColor() };

    return {
      pt,
      chain: Tween()
        .chain(pt, { r, delay: range(0, 0.6), duration: 0.2 })
        .then(pt, { r: 0, delay: range(0, 0.1), duration: 0.2 }),
    };
  },
  three({ x, y, s, step, yIdx, xIdx }, { width, height }) {
    const even = yIdx % 2 === 0;
    const offsetX = even ? step.x / 2 : 0;
    const offsetY = even ? step.y : -step.y;
    const r = s.x / 8;
    const pt = { x, y, r: 0 };

    return {
      pt,
      chain: Tween()
        .chain(pt, { r, delay: range(0, 0.6), duration: 0.2 })
        .chain(pt, { r: 0, delay: 1 + range(0, 0), duration: 0.2 }),
    };
  },
};

function randomColor() {
  // prettier-ignore
  return chroma.cubehelix()
    .start(range(0, 360))
    .rotations(-0.5)
    .gamma(0.8)
    .lightness([0.3, 0.8])(range(0, 1));
}
