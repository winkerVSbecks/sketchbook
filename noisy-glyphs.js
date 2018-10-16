const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, lerp } = require('canvas-sketch-util/math');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [800, 800],
  scaleToView: true,
};

const glyphs = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖', '✳'];
// const glyphs = ['◧', '◨', '◩', '◪', '■', '□', '⬒', '⬓', '⬕'];
// const glyphs = ['¤', '✳', '●', '◔', '○', '◕', '◐', '◑', '◒'];

canvasSketch(() => {
  Random.permuteNoise();

  return ({ context, frame, width, height, playhead }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#001';
    context.fillRect(0, 0, width, height);

    const gridSize = 16;
    const padding = width * 0.2;
    const tileSize = (width - padding * 2) / gridSize;
    const time = Math.sin(playhead * 2 * Math.PI);

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
        const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

        // scale to dimensions with a border padding
        const t = {
          x: lerp(padding, width - padding, u),
          y: lerp(padding, height - padding, v),
        };

        const scale = gridSize * 2;
        const n = Random.noise3D(x / scale, y / scale, time);
        const angle = mapRange(n, -1, 1, 0, 360);
        const dir = Math.round(angle / 45); //=== 8 ? 0 : Math.round(angle / 45);

        // Draw
        context.font = `400 ${tileSize * 0.75}px 'Riforma LL'`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#fff';
        context.fillText(glyphs[dir], t.x, t.y);
      }
    }
  };
}, settings);
