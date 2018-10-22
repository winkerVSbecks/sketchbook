const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

const settings = {
  pixelated: true,
  dimensions: [128, 128],
  animate: false,
};

const sketch = async ({ update }) => {
  const image = await load('assets/baboon.jpg');

  update({
    dimensions: [image.width, image.height],
  });

  return ({ context, width, height }) => {
    console.clear();
    context.filter = 'grayscale(100%)';
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const data = pixels.data;
    const factor = 1;

    for (let y = 0; y < height; y++) {
      for (let x = 1; x < width; x++) {
        // Get color for current pixel
        const i = index(x, y, width);
        const color = getColor(i, data);

        // Calculate new colour and
        // set it as the value for current pixel
        const newColor = {
          r: Math.round((factor * color.r) / 255) * (255 / factor),
          g: Math.round((factor * color.g) / 255) * (255 / factor),
          b: Math.round((factor * color.b) / 255) * (255 / factor),
          a: color.a,
        };
        setColor(newColor, i, data);

        // Calculate error
        const error = calcError(color, newColor);

        // Update colour for East pixel
        const indexE = index(x, y);
        const colorE = getColor(indexE, data);
        const newColorE = {
          r: colorE.r + (error.r * 7) / 16,
          g: colorE.g + (error.g * 7) / 16,
          b: colorE.b + (error.b * 7) / 16,
          a: colorE.a,
        };
        setColor(newColorE, indexE, data);

        // Update colour for South West pixel
        const indexSW = index(x - 4, y + 4);
        const colorSW = getColor(indexSW, data);
        const newColorSW = {
          r: colorSW.r + (error.r * 3) / 16,
          g: colorSW.g + (error.g * 3) / 16,
          b: colorSW.b + (error.b * 3) / 16,
          a: colorSW.a,
        };
        setColor(newColorSW, indexSW, data);

        // Update colour for South pixel
        const indexS = index(x, y + 4);
        const colorS = getColor(indexS, data);
        const newColorS = {
          r: colorS.r + (error.r * 5) / 16,
          g: colorS.g + (error.g * 5) / 16,
          b: colorS.b + (error.b * 5) / 16,
          a: colorS.a,
        };
        setColor(newColorS, indexS, data);

        // Update colour for South East pixel
        const indexSE = index(x + 4, y + 4);
        const colorSE = getColor(indexSE, data);
        const newColorSE = {
          r: colorSE.r + (error.r * 1) / 16,
          g: colorSE.g + (error.g * 1) / 16,
          b: colorSE.b + (error.b * 1) / 16,
          a: colorSE.a,
        };
        setColor(newColorSE, indexSE, data);
      }
    }

    context.putImageData(pixels, 0, 0);
  };
};

canvasSketch(sketch, settings);

function index(x, y, w) {
  return x + y * w;
}

function calcError(color, newColor) {
  return {
    r: color.r - newColor.r,
    g: color.b - newColor.b,
    b: color.g - newColor.g,
  };
}

function getColor(i, data) {
  return {
    r: data[i * 4 + 0],
    g: data[i * 4 + 1],
    b: data[i * 4 + 2],
    a: data[i * 4 + 3],
  };
}

function setColor({ r, g, b, a }, i, data) {
  data[i * 4 + 0] = r;
  data[i * 4 + 1] = g;
  data[i * 4 + 2] = b;
  data[i * 4 + 3] = a;
}
