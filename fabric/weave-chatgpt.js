const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [800 * 2, 600 * 2],
  animate: true,
  duration: 5,
  scaleToView: true,
  loop: false,
};

const sketch = () => {
  const lineCount = 40;
  const lineWidth = 4;

  const colors = ['black', 'red'];

  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    context.lineWidth = lineWidth;

    const gridSize = Math.min(width, height);
    const cellSize = gridSize / lineCount;

    for (let y = 0; y < lineCount; y++) {
      for (let x = 0; x < lineCount; x++) {
        const xPos = x * cellSize;
        const yPos = y * cellSize;

        context.strokeStyle = colors[(x + y) % colors.length];
        context.lineWidth = cellSize;

        // Draw horizontal lines
        if (y % 2 === 0) {
          context.beginPath();
          context.moveTo(xPos, yPos + cellSize / 2);
          context.lineTo(xPos + cellSize, yPos + cellSize / 2);
          context.stroke();
        }

        // Draw vertical lines
        if (x % 2 === 0) {
          context.beginPath();
          context.moveTo(xPos + cellSize / 2, yPos);
          context.lineTo(xPos + cellSize / 2, yPos + cellSize);
          context.stroke();
        }
      }
    }
  };
};

canvasSketch(sketch, settings);
