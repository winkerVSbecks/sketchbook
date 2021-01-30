const canvasSketch = require('canvas-sketch');
const { lerpArray, linspace } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const polygonClipping = require('polygon-clipping');
const distToSegment = require('./point-to-line');

const side = 2048;
const EVEN_SPACING = false;
const height = side * (Math.sqrt(3) / 2);
const colors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
const triangleBandCount = 9 + 15;
const rectBandCount = 14 + 24;
const centroid = [side / 2, (2 * height) / 3];

const settings = {
  dimensions: [side, height],
  animate: true,
  fps: 6,
  playbackRate: 'throttle',
  duration: 16,
  scaleToView: true,
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    const t = triangle(height * 0.75, width / 2);

    /**
     * Rectangle
     */
    const rectBandThickness = width / rectBandCount;
    const rectLines = [
      {
        a: [0, 0],
        b: [0, height],
      },
    ];
    const rectFillLines = rectLines.reduce(
      (lines, line) => lines.concat(lerpRectLine(line, rectBandThickness)),
      []
    );
    const rectBands = rectFillLines.map(band(rectBandThickness));

    /**
     * Triangle
     */
    const triangleBandThickness =
      distToSegment(t[0], t[1], centroid) / triangleBandCount;
    const triangleLines = [
      { a: t[0], b: t[1], clipPoly: [t[0], t[1], centroid] },
      { a: t[1], b: t[2], clipPoly: [t[1], t[2], centroid] },
      { a: t[2], b: t[0], clipPoly: [t[2], t[0], centroid] },
    ];
    const triangleFillLines = triangleLines.reduce(
      (lines, line) =>
        lines.concat(lerpTriangleLine(line, triangleBandThickness)),
      []
    );
    const triangleBands = triangleFillLines.map(band(triangleBandThickness));

    const bands = [...rectBands, ...triangleBands];
    bands.forEach(renderBand(context));
  };
};

canvasSketch(sketch, settings);

/**
 * Draw band
 */
let bandFills = [];
function renderBand(context) {
  return (segments, bandIdx) => {
    bandFills[bandIdx] = bandFills[bandIdx] || random.shuffle(colors);

    segments.forEach((box, idx) => {
      const [first, ...rest] = box;
      context.beginPath();
      context.fillStyle = bandFills[bandIdx][idx];
      context.moveTo(...first);
      rest.forEach((p) => {
        context.lineTo(...p);
      });
      context.closePath();
      context.fill();
    });

    shiftFills(bandFills[bandIdx]);
  };
}

function shiftFills(fills) {
  fills.push(fills.shift());
}

function band(thickness) {
  return ({ a, b, clipPoly }) => {
    const spacing = linspace(colors.length + 1, true).map((v) =>
      v === 1 || v === 0 || EVEN_SPACING
        ? v
        : Math.max(0, v + random.range(-0.1, 0.1))
    );

    const points = spacing.map((t) => lerpArray(a, b, t));
    const segments = pairs(points);
    return bandSegments(segments, clipPoly, thickness).filter(
      (segments) => segments.length > 0
    );
  };
}

function bandSegments(segments, clipPoly, thickness) {
  return segments.map(([a, b]) => {
    const angle = direction(a, b);
    const segment = [
      a,
      normal(a, thickness, angle),
      normal(b, thickness, angle),
      b,
    ];
    try {
      return clipPoly
        ? polygonClipping.intersection([segment], [clipPoly]).flat(2)
        : segment;
    } catch {
      return segment;
    }
  });
}

function lerpTriangleLine(line, thickness) {
  const angle = direction(line.a, line.b);

  return linspace(triangleBandCount).map((_, idx) => ({
    a: normal(line.a, thickness * idx, angle),
    b: normal(line.b, thickness * idx, angle),
    clipPoly: line.clipPoly,
  }));
}

function lerpRectLine(line, thickness) {
  return linspace(rectBandCount + 1).map((_, idx) => ({
    a: [line.a[0] + thickness * idx, line.a[1]],
    b: [line.b[0] + thickness * idx, line.b[1]],
    clipPoly: line.clipPoly,
  }));
}

/**
 * Utils
 */
function triangle() {
  return [
    [0, height],
    [side / 2, 0],
    [side, height],
  ];
}

function pairs(list) {
  return list.reduce(function (result, value, index, array) {
    if (index < array.length - 1) result.push([value, array[index + 1]]);
    return result;
  }, []);
}

function normal([x, y], d, angle) {
  return [-d * Math.sin(angle) + x, d * Math.cos(angle) + y];
}

function direction(a, b) {
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}
