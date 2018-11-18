const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const chroma = require('chroma-js');
const R = require('ramda');
const load = require('load-asset');

const settings = {
  dimensions: [128, 128],
  animate: false,
};

const sketch = async ({ update }) => {
  const image = await load('path-to-image');

  update({
    dimensions: [image.width, image.height],
  });

  return ({ context, width, height }) => {
    console.clear();

    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    let data = pixels.data;

    const slice = width / 16; // 200
    const paddingX = (width - slice * 12) / 2;
    const paddingY = (height - slice * 12) / 2;

    let chunks = [];
    for (let y = paddingY; y < height - paddingY; y += slice * 2) {
      for (let x = paddingX; x < width - paddingX; x += slice * 2) {
        chunks.push([x, y]);
      }
    }

    const shuffledChunks = Random.shuffle(chunks);
    const shuffledChunksData = shuffledChunks.map(([x, y]) =>
      context.getImageData(x, y, slice, slice),
    );

    // Grid
    // chunks.forEach(([x, y], idx) => {
    //   context.putImageData(shuffledChunksData[idx], x, y);
    // });

    // Pixelated overlay
    const _paddingX = (width - slice * 6) / 2;
    const _paddingY = (height - slice * 6) / 2;
    let chunks2 = [];
    for (let y = _paddingY; y < height - _paddingY; y += slice) {
      for (let x = _paddingX; x < width - _paddingX; x += slice) {
        chunks2.push([x, y]);
      }
    }

    const chunksData = chunks.map(([x, y]) =>
      context.getImageData(x, y, slice, slice),
    );

    chunks2.forEach(([x, y], idx) => {
      chunksData[idx] && context.putImageData(chunksData[idx], x, y);
    });

    // // Random Glitches
    // const sliceW = width / 12;
    // const sliceH = height / 8;
    // chunks.forEach(([x, y], idx) => {
    //   if (Random.value() < 0.05) {
    //     const [oX, oY] = Random.pick(chunks);
    //     const thisData = context.getImageData(x, y, sliceW, sliceH);
    //     const otherData = context.getImageData(oX, oY, sliceW, sliceH);
    //     context.putImageData(otherData, x, y);
    //     context.putImageData(thisData, oX, oY);
    //   }
    // });
  };
};

canvasSketch(sketch, settings);

function index(x, y, w) {
  return x + y * w;
}
