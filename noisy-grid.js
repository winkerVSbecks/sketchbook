const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');

const simplex = new SimplexNoise();

const settings = {
  animate: true,
  duration: 8,
  dimensions: [1080, 1080],
  scaleToView: true,
};

// const glyphs = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖', '✳'];
const glyphs = ['◧', '◨', '◩', '◪', '■', '□', '⬒', '⬓', '⬕'];
// const glyphs = ['¤', '✳', '●', '◔', '○', '◕', '◐', '◑', '◒'];

canvasSketch(() => {
  const gridSize = 24;
  const frequency = 1 / (gridSize * 2);

  return ({ context, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const time = Math.sin(playhead * 2 * Math.PI);
    const padding = width * 0.15;
    const tileSize = (width - padding * 2) / gridSize;

    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y <= gridSize; y++) {
        // Get the noise value
        const n = simplex.noise3D(x * frequency, y * frequency, time);
        // Map the noise to 0 - 360 degree angle
        const angle = mapRange(n, -1, 1, 0, 360);
        // Convert angle to a direction
        const dir = Math.round(angle / 45);

        const position = [
          mapRange(x, 0, gridSize, padding, width - padding),
          mapRange(y, 0, gridSize, padding, height - padding),
        ];

        // Visualize the grid
        context.font = `400 ${tileSize * 0.6}px 'monospace'`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#fff';
        context.fillText(glyphs[dir], position[0], position[1]);
      }
    }
  };
}, settings);

function mapRange(value, inputMin, inputMax, outputMin, outputMax, clamp) {
  if (Math.abs(inputMin - inputMax) < Number.EPSILON) {
    return outputMin;
  } else {
    var outVal =
      ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) +
      outputMin;
    if (clamp) {
      if (outputMax < outputMin) {
        if (outVal < outputMax) outVal = outputMax;
        else if (outVal > outputMin) outVal = outputMin;
      } else {
        if (outVal > outputMax) outVal = outputMax;
        else if (outVal < outputMin) outVal = outputMin;
      }
    }
    return outVal;
  }
}
