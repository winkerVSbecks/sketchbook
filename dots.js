const canvasSketch = require('canvas-sketch');
const { lerpFrames } = require('canvas-sketch-util/math');
const { range } = require('canvas-sketch-util/random');
const R = require('ramda');
var TWEEN = require('@tweenjs/tween.js');
const chroma = require('chroma-js');
const { rectGrid } = require('./grid');
const { drawShape } = require('./geometry');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  duration: 5,
  scaleToView: true,
  // playbackRate: 'throttle',
  // fps: 24,
};

let pts = [];
var dots = new TWEEN.Group();

const sketch = () => {
  console.clear();

  return ({ context, width, height, playhead, frame, duration }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    context.lineJoin = 'bevel';

    // Create a grid
    if (frame === 1) {
      pts = rectGrid({
        size: { x: width, y: height },
        resolution: { x: 16, y: 16 },
        padding: { x: 0.15, y: 0.15 },
      }).reduce((acc, { x, y, s, yIdx, xIdx }) => {
        const even = yIdx % 2 === 0;
        const offsetEven = even ? s.x / 2 : 0;
        const offsetOdd = !even ? s.x / 2 : 0;

        const pt = { x: x - range(s.x, s.x * 8), y, opacity: 0, r: 6 };

        const fadeInRight = new TWEEN.Tween(pt, dots)
          .to({ x, opacity: 1, r: 6 }, 1200)
          .easing(TWEEN.Easing.Quintic.Out);

        const moveDown = new TWEEN.Tween(pt, dots)
          .to({ x: `+${offsetEven}`, r: 12 }, 400)
          .easing(TWEEN.Easing.Quintic.InOut);

        const twistBack = new TWEEN.Tween(pt, dots)
          .delay(200)
          .to({ x: `${even ? '-' : '+'}${s.x / 2}` }, 300)
          .easing(TWEEN.Easing.Quintic.InOut);

        const twistForward = new TWEEN.Tween(pt, dots)
          .delay(200)
          .to(
            {
              // x: `+${s.x / 2}`,
              x: `${even ? '-' : '+'}${s.x / 2}`,
              // y: `${even ? '+' : '-'}${s.y}`,
            },
            300,
          )
          .easing(TWEEN.Easing.Quintic.InOut);

        const twist = twistForward.chain(twistBack);

        const reset = new TWEEN.Tween(pt, dots)
          .delay(400)
          .to({ x, y, r: 6 }, 200)
          .easing(TWEEN.Easing.Quintic.InOut);

        const fadeOut = new TWEEN.Tween(pt, dots)
          .delay(400)
          .to({ opacity: 0, y: y + s.y / 4 }, 800)
          .easing(TWEEN.Easing.Quintic.InOut);

        fadeInRight
          .chain(moveDown.chain(twist.chain(reset.chain(fadeOut))))
          .start();

        return acc.concat([pt]);
      }, []);
    }

    dots.update();

    pts.forEach(({ x, y, r, opacity }) => {
      context.globalAlpha = opacity;

      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI);
      context.fill();
    });

    // pts.forEach((polyline, idx) => {
    //   const scale = beat(playhead, 10, 2);
    //   const loc = [
    //     polyline[0][0] + (polyline[1][0] - polyline[0][0]) * scale,
    //     polyline[0][1] + (polyline[1][1] - polyline[0][1]) * scale,
    //   ];

    //   const r = 6 + 6 * Math.sin(Math.PI * scale); //6 + 6 * scale;

    //   context.fillStyle = '#fff';
    //   context.globalAlpha = scale;
    //   context.beginPath();
    //   context.arc(...loc, r, 0, 2 * Math.PI);
    //   context.fill();
    // });
  };
};

canvasSketch(sketch, settings);

function beat(value, intensity = 2, frequency = 2) {
  const v = Math.atan(Math.sin(value * Math.PI * frequency) * intensity);
  return (v + Math.PI / 2) / Math.PI;
}
