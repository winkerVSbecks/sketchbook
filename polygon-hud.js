const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const {
  lerp,
  linspace,
  mapRange,
  degToRad,
} = require('canvas-sketch-util/math');
const { beat } = require('./easings');
const { regularPolygon, drawShape } = require('./geometry');

const settings = {
  dimensions: [1060, 500],
  animate: true,
  duration: 5,
  // scaleToView: true,
};

const clrs = {
  black: '#030002',
  blue: '#31c1f5',
  white: '#fffdff',
};

const rect = (context, x, y, width, height, color) => {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
};

const circle = (context, [x, y], radius, color, lineWidth) => {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.lineWidth = lineWidth;
  context.fill();
};

const circularArrow = (
  context,
  {
    location: [x, y],
    radius,
    sweep: [start, end],
    color,
    arrowSize,
    lineWidth = 3,
  },
) => {
  context.strokeStyle = color;
  context.lineWidth = lineWidth;

  const head = [x + radius * Math.cos(end), y + radius * Math.sin(end)];

  context.beginPath();
  context.arc(x, y, radius, start, end, true);
  if (arrowSize !== 0) {
    context.translate(head[0], head[1]);
    context.rotate(end);
    context.moveTo(arrowSize, arrowSize, radius);
    context.lineTo(0, 0, radius);
    context.lineTo(-arrowSize, arrowSize, radius);
  }
  context.stroke();
  context.restore();
};

const sketch = ({ width, height }) => {
  console.clear();
  let sweepEnd = 1.5 * Math.PI;
  let rotation = 45;

  return {
    begin() {
      sweepEnd = 1.5 * Math.PI;
      rotation = 45;
    },
    render(props) {
      const { context, width, height, playhead } = props;
      rect(context, 0, 0, width, height, clrs.black);
      drawKnob(props);
      drawPolygon(props);
      drawSlider(props);
    },
  };

  function drawKnob({ context, width, height, playhead, deltaTime }) {
    sweepEnd = lerp(sweepEnd, 0, deltaTime);

    circle(context, [width * 0.25, height * 0.5], width * 0.08, clrs.white);
    circularArrow(context, {
      location: [width * 0.25, height * 0.5],
      radius: width * 0.12,
      sweep: [-0.5 * Math.PI, sweepEnd],
      color: clrs.blue,
      arrowSize: width * 0.01,
    });
  }

  function drawPolygon({ context, width, height, playhead, deltaTime }) {
    rotation = lerp(rotation, 0, deltaTime);
    const sideCount = 3 + Math.floor(lerp(0, 5, playhead));
    const polygon = regularPolygon(
      [width * 0.65, height * 0.7],
      sideCount,
      width * 0.12,
      rotation,
    );

    context.beginPath();
    drawShape(context, polygon);
    context.strokeStyle = clrs.blue;
    context.lineWidth = 3;
    context.stroke();
  }

  function drawSlider({ context, width, height, playhead, deltaTime }) {
    const range = height * 0.3;
    const offset = height * 0.2;
    const steps = linspace(8, true).map(idx => offset + range * idx);
    const sliderValue = lerp(height * 0.3 * 0.715, 0, playhead);

    context.strokeStyle = clrs.blue;
    context.lineWidth = 3;

    // Segments
    steps.forEach(y => {
      context.beginPath();
      context.moveTo(width * 0.9, y);
      context.lineTo(width * 0.92, y);
      context.stroke();
    });

    // Handle
    context.save();
    context.translate(0, sliderValue);

    context.beginPath();
    context.moveTo(width * 0.92, steps[1]);
    context.lineTo(width * 0.95, steps[1]);
    context.stroke();

    context.beginPath();
    context.moveTo(width * 0.92 - 1.5, steps[0]);
    context.lineTo(width * 0.92 - 1.5, steps[2]);
    context.stroke();

    circle(context, [width * 0.95, steps[1]], width * 0.01, clrs.white);
    context.restore();
  }
};

canvasSketch(sketch, settings);
