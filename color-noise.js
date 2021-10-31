const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const MarchingSquaresJS = require('marchingsquares');
const { generateRandomColorRamp } = require('fettepalette/dist/index.umd');

const simplex = new SimplexNoise('chromatic');
const config = { intervals: 12, lineWidth: 20, offset: 0.005 };

const settings = {
  animate: true,
  duration: 8,
  dimensions: [1080, 1080],
  scaleToView: true,
};

const gridSize = [128, 128];

const centerHue = Random.range(0, 300);
const clrs = generateRandomColorRamp({
  total: config.intervals,
  centerHue, //: 289.2,
  hueCycle: 0.5,
  // centerHue: Random.range(240, 300),
  // hueCycle: Random.range(0.5, 1),
  curveMethod: 'lamé',
  curveAccent: 0.2,
  offsetTint: 0.251,
  offsetShade: 0.01,
  tintShadeHueShift: 0.0,
  offsetCurveModTint: 0.03,
  offsetCurveModShade: 0.03,
  minSaturationLight: [0, 0],
  maxSaturationLight: [1, 1],
});

const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;

const bg = hsl(Random.pick(clrs.light));

canvasSketch(() => {
  const levels = [
    { offset: Math.PI * config.offset * 3, colorScale: createColorScale(0.3) },
    { offset: Math.PI * config.offset * 2, colorScale: createColorScale(0.2) },
    { offset: Math.PI * config.offset, colorScale: createColorScale(0.1) },
    { offset: 0, colorScale: createColorScale(0) },
  ];

  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);

    levels.forEach(({ offset, colorScale }) => {
      const time = loopNoise(
        { cx: 0, cy: 0, radius: 1, offset, range: [0, 1] },
        playhead
      );

      let data = noiseData(time);
      const lines = drawIsoLines(data, [width, height], colorScale);
      drawLines(lines, context);
    });
  };
}, settings);

function noiseData(time) {
  const data = [];

  for (let y = 0; y < gridSize[1]; y++) {
    data[y] = [];

    for (let x = 0; x < gridSize[0]; x++) {
      const rawN = simplex.noise3D(
        x / (gridSize[0] * 0.8),
        y / (gridSize[1] * 0.8),
        time
      );

      const n = mapRange(rawN, -1, 1, 0, 1);
      data[y].push(n);
    }
  }

  return data;
}

function drawIsoLines(noiseData, [sizeX, sizeY], colourScale) {
  const intervals = linspace(config.intervals);
  const lines = [];

  MarchingSquaresJS.isoLines(noiseData, intervals, {
    polygons: false,
    linearRing: false,
  }).forEach((isoLines, idx) => {
    isoLines.forEach((band) => {
      const scaledBand = band.map(([x, y]) => {
        return [
          mapRange(x, 0, gridSize[0] - 1, 0, sizeX),
          mapRange(y, 0, gridSize[1] - 1, 0, sizeY),
        ];
      });

      lines.push({
        line: scaledBand,
        color: colourScale(idx),
      });
    });
  });

  const margin = sizeY * 0.04;

  return lines
    .map(({ line, color }) => {
      const clippedLines = clipPolylinesToBox(
        [line],
        [margin, margin, sizeX - margin, sizeY - margin],
        false,
        false
      ).flat();

      return {
        color,
        line: clippedLines,
      };
    })
    .filter(({ line }) => line.length > 0);
}

function drawLines(lines, context) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.lineWidth = config.lineWidth;

  lines.forEach(({ line, color }) => {
    const [start, ...pts] = line;

    context.strokeStyle = color;

    context.beginPath();
    context.moveTo(...start);
    pts.forEach((pt, idx) => {
      context.lineTo(...pt);
    });

    context.stroke();
  });
}

function loopNoise({ cx, cy, radius, offset, range }, playhead) {
  const v = Random.noise2D(
    (cx + radius * Math.cos(Math.PI * 2 * playhead) + offset) / 10,
    (cy + radius * Math.sin(Math.PI * 2 * playhead) + offset) / 10,
    1,
    1
  );

  return mapRange(v, -1, 1, range[0], range[1]);
}

function createColorScale(shift) {
  const clrs = generateRandomColorRamp({
    total: config.intervals,
    centerHue: centerHue, //289.2,
    hueCycle: 0.5 + shift,
    curveMethod: 'lamé',
    curveAccent: 0.2,
    offsetTint: 0.251,
    offsetShade: 0.01,
    tintShadeHueShift: 0.0,
    offsetCurveModTint: 0.03,
    offsetCurveModShade: 0.03,
    minSaturationLight: [0, 0],
    maxSaturationLight: [1, 1],
  });

  const hsl = (c) => `hsla(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%, 1)`;

  const colors = clrs.all.map(hsl).filter((c) => c !== bg);
  return (idx) => colors[idx];
}
