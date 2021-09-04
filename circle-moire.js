const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 1,
  scaleToView: true,
};

const clrs = {
  bg: '#3333ff',
  foreground: '#fff',
};

const scale = 5;

const sketch = () => {
  const circles = [
    { cx: 0, cy: 0, r: 95 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 90 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 85 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 80 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 75 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 70 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 65 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 60 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 55 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 50 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 45 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 40 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 35 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 30 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 25 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 20 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 15 * scale, fill: 1 },
    { cx: 0, cy: 0, r: 10 * scale, fill: 0 },
    { cx: 0, cy: 0, r: 5 * scale, fill: 1 },
  ];

  return {
    begin({ context, width, height }) {},
    render({ context, width, height, playhead }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      const offset = playhead * -10 * scale;

      const patterns = [
        createPattern(context, 0, offset),
        createPattern(context, 5 * scale, offset),
      ];

      context.translate(width / 2, height / 2);
      circles.forEach((circle) =>
        drawCircle(context, circle, patterns[circle.fill])
      );
    },
  };
};

canvasSketch(sketch, settings);

function drawCircle(context, { cx, cy, r }, fill) {
  context.fillStyle = fill;
  context.beginPath();
  context.arc(cx, cy, r, 0, 2 * Math.PI);
  context.fill();
}

function createPattern(context, x, offset) {
  const patternCanvas = document.createElement('canvas');
  const patternContext = patternCanvas.getContext('2d');

  patternCanvas.width = 10 * scale;
  patternCanvas.height = 200 * scale;

  patternContext.fillStyle = clrs.bg;
  patternContext.fillRect(x - 10 * scale + offset, 0, 5 * scale, 200 * scale);
  patternContext.fillRect(x + offset, 0, 5 * scale, 200 * scale);
  patternContext.fillRect(x + 10 * scale + offset, 0, 5 * scale, 200 * scale);

  patternContext.fillStyle = clrs.foreground;
  patternContext.fillRect(x - 5 * scale + offset, 0, 5 * scale, 200 * scale);
  patternContext.fillRect(x + 5 * scale + offset, 0, 5 * scale, 200 * scale);
  patternContext.fillRect(x + 15 * scale + offset, 0, 5 * scale, 200 * scale);

  return context.createPattern(patternCanvas, 'repeat');
}

{
  /* <pattern id="pattern1" x="90" width="10" height="200" patternUnits="userSpaceOnUse">
  <rect x="0" y="0" width="5" height="200" fill="#357EDD" />
  <rect x="5" y="0" width="5" height="200" fill="white" />
  <rect x="10" y="0" width="5" height="200" fill="#357EDD" />
  <rect x="15" y="0" width="5" height="200" fill="white" />
</pattern>
<pattern id="pattern2" x="95" width="10" height="200" patternUnits="userSpaceOnUse">
  <rect x="0" y="0" width="5" height="200" fill="#357EDD" />
  <rect x="5" y="0" width="5" height="200" fill="white" />
  <rect x="10" y="0" width="5" height="200" fill="#357EDD" />
  <rect x="15" y="0" width="5" height="200" fill="white" />
</pattern> */
}

// // Create a pattern, offscreen
// const patternCanvas = document.createElement('canvas');
// const patternContext = patternCanvas.getContext('2d');

// // Give the pattern a width and height of 50
// patternCanvas.width = 50;
// patternCanvas.height = 50;

// // Give the pattern a background color and draw an arc
// patternContext.fillStyle = '#fec';
// patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
// patternContext.arc(0, 0, 50, 0, .5 * Math.PI);
// patternContext.stroke();

// // Create our primary canvas and fill it with the pattern
// const canvas = document.createElement('canvas');
// const ctx = canvas.getContext('2d');
// const pattern = ctx.createPattern(patternCanvas, 'repeat');
// ctx.fillStyle = pattern;
// ctx.fillRect(0, 0, canvas.width, canvas.height);
