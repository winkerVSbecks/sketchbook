import lerp from 'lerp';
const canvasSketch = require('canvas-sketch');
const { linspace, lerpArray, inverseLerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const clrs = require('./clrs').clrs();
const colors = require('./clrs');
const risoColors = require('riso-colors')
  .map((h) => h.hex)
  .filter((c) => c !== '#000000');

const settings = {
  dimensions: [398, 640],
  scaleToView: true,
  // animate: true,
  duration: 2,
  fps: 12,
  playbackRate: 'throttle',
};

const sketch = () => {
  let w, bands, blocks;
  const BAND_COUNT = 8;
  const background = clrs.bg;
  const foreground = clrs.ink();

  return ({ context, width, height, playhead }) => {
    w = width / BAND_COUNT;
    // const t = mapRange(playhead, 0, 1, 0, 4); // Math.sin(Math.PI * playhead);
    // const origin = [
    //   lerpFrames([width, width, 0, 0, width], playhead),
    //   lerpFrames([0, height, height, 0, 0], playhead),
    //   // mapRange(t, 1, 2, width, 0, true),
    //   // mapRange(t, 0, 1, 0, height, true),
    // ];
    const origin = [0, height];
    blocks = [];

    bands = [
      [
        ...linspace(64).map((step) => [width, height * (1 - step)]),
        ...linspace(65, true).map((step) => [width * (1 - step), 0]),
      ],
    ];

    for (let index = 0; index < 8; index++) {
      blocks.push(bandToBlocks(bands[index], origin, w));
      bands.push(nextBand(bands[index], origin, w));
    }

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    blocks.forEach((band, idx) => {
      drawBand(idx, context, band, idx === blocks.length - 1, [
        background,
        foreground,
      ]);
    });
  };
};

canvasSketch(sketch, settings);

function nextBand(band, origin, delta) {
  const max = band[0][0];
  const step = inverseLerp(origin[0], max, max - delta);

  return band
    .filter((_, idx) => (band.length <= 3 ? true : idx % 2 === 0))
    .map((pt) => lerpArray(origin, pt, step));
}

function bandToBlocks(band, origin, delta) {
  const max = band[0][0];
  const step = inverseLerp(origin[0], max, max - delta);
  return band.map((pt) => [pt, lerpArray(origin, pt, step)]).flat();
}

function drawBand(idx, context, band, last = false, c) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  if (last) {
    context.fillStyle = c[1]; //Random.pick(c); // Random.pick(risoColors);
    context.beginPath();
    context.moveTo(band[0][0], band[0][1]);
    context.lineTo(band[1][0], band[1][1]);
    context.lineTo(band[4][0], band[4][1]);
    context.lineTo(band[2][0], band[2][1]);
    context.closePath();
    context.fill();

    context.strokeStyle = Random.pick(c);
    context.stroke();
  } else {
    let i = idx;
    for (let index = 0; index < band.length - 3; index += 2) {
      // context.fillStyle = Random.pick(risoColors);
      context.fillStyle = c[1]; //Random.pick(c);

      context.beginPath();
      context.moveTo(band[index][0], band[index][1]);
      context.lineTo(band[index + 1][0], band[index + 1][1]);
      context.lineTo(band[index + 3][0], band[index + 3][1]);
      context.lineTo(band[index + 2][0], band[index + 2][1]);
      context.closePath();
      context.fill();

      context.strokeStyle = Random.pick(c);
      context.stroke();
    }
  }
}
