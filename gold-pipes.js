const canvasSketch = require('canvas-sketch');
const { linspace } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [1600, 1200],
};

const colors = {
  light: '#F3C35B',
  dark: '#9C772F',
  bg: '#171717',
};

const tan30 = Math.tan(Math.PI / 6);
const tan60 = Math.tan(Math.PI / 3);

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    const w = 20;
    const m = 6;
    const margin = w * m;
    const xCount = width / w;

    linspace(xCount - 2 * m).forEach((_, idx) => {
      lineVertical(context, w, m + idx, [height - margin, margin]);
    });

    // context.lineJoin = 'miter';
    // context.lineCap = 'square';

    lineVertical(context, w, 10, [height - margin, height / 2], 'dark', 'LTR');
    lineLTR(context, w, { idx: 10, span: 3, y: height / 2, shade: 'dark' });

    lineVertical(context, w, 12, [height - margin, height / 2], 'dark', 'LTR');
    lineLTR(context, w, { idx: 12, span: 1, y: height / 2, shade: 'dark' });
  };
};

canvasSketch(sketch, settings);

function lineVertical(context, w, idx, [yStart, yEnd], shade = 'light', cap) {
  context.fillStyle = idx % 2 === 0 ? colors[shade] : colors.bg;
  context.beginPath();
  context.moveTo(w * idx, yEnd);
  context.lineTo(w * idx, yStart);
  context.lineTo(w * (idx + 1), yStart);
  context.lineTo(w * (idx + 1), yEnd);

  // if (cap === 'LTR') {
  //   context.lineTo(w * idx, yEnd - w * tan30);
  // }
  context.closePath();
  context.fill();
}

function lineLTR(context, w, { idx, span, y, shade = 'light' }) {
  context.fillStyle = idx % 2 === 0 ? colors[shade] : colors.bg;
  context.beginPath();
  context.moveTo(w * (idx + span + 0.5), y - w * (span + 0.5) * tan30);
  context.lineTo(w * (idx + 1), y);
  context.lineTo(w * idx, y);
  context.lineTo(w * idx, y - w * tan30);
  context.lineTo(
    w * (idx + span + 0.5),
    y - w * tan30 - (span + 0.5) * w * tan30
  );
  context.closePath();
  context.fill();
  context.stroke();
}
