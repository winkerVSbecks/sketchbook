const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { pigments } = require('./clrs');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 5,
  scaleToView: true,
};

const sketch = () => {
  let lines = [];

  const createLines = ({ width, height }) => {
    const numLines = 20;
    lines = [];
    for (let i = 0; i < numLines; i++) {
      lines.push({
        x1: Math.random() * width,
        y1: Math.random() * height,
        x2: Math.random() * width,
        y2: Math.random() * height,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        width: Math.random() * 5 + 1,
      });
    }
  };

  const drawLines = (context) => {
    lines.forEach((line) => {
      context.strokeStyle = line.color;
      context.lineWidth = line.width;
      context.beginPath();
      context.moveTo(line.x1, line.y1);
      context.lineTo(line.x2, line.y2);
      context.stroke();
    });
  };

  const drawIntersections = (context) => {
    lines.forEach((line1, idx1) => {
      lines.forEach((line2, idx2) => {
        if (idx1 === idx2) return;

        const intersect = intersectLines(line1, line2);
        if (intersect) {
          context.beginPath();
          context.arc(intersect.x, intersect.y, 5, 0, Math.PI * 2);
          context.fill();
        }
      });
    });
  };

  const intersectLines = (line1, line2) => {
    const a1 = line1.y2 - line1.y1;
    const b1 = line1.x1 - line1.x2;
    const c1 = a1 * line1.x1 + b1 * line1.y1;

    const a2 = line2.y2 - line2.y1;
    const b2 = line2.x1 - line2.x2;
    const c2 = a2 * line2.x1 + b2 * line2.y1;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant === 0) {
      return;
    } else {
      const x = (b2 * c1 - b1 * c2) / determinant;
      const y = (a1 * c2 - a2 * c1) / determinant;
      return { x, y };
    }
  };

  return {
    begin({ width, height }) {
      createLines({ width, height });
    },
    render({ context }) {
      drawLines(context);
      drawIntersections(context);
    },
  };
};

canvasSketch(sketch, settings);
