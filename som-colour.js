const canvasSketch = require('canvas-sketch');
const { linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const chroma = require('chroma-js');
const R = require('ramda');
const load = require('load-asset');
const SOM = require('ml-som');
const clrs = require('./clrs');

const settings = {
  pixelated: true,
  dimensions: [400, 400],
  animate: true,
  // duration: 15,
};

const sketch = async ({ update }) => {
  const image = await load('/imgs/rainbow.png');

  update({
    dimensions: [image.width * 2, image.height],
  });

  const som = new SOM(image.width, image.height, {
    fields: [
      { name: 'r', range: [0, 255] },
      { name: 'g', range: [0, 255] },
      { name: 'b', range: [0, 255] },
      { name: 'a', range: [0, 255] },
    ],
  });

  // const trainingSet = [];
  // const res = 20;

  // var som = new SOM(res, res, {
  //   fields: [
  //     { name: 'r', range: [0, 255] },
  //     { name: 'g', range: [0, 255] },
  //     { name: 'b', range: [0, 255] },
  //     { name: 'a', range: [0, 1] },
  //   ],
  // });

  // for (let x = 0; x < res; x++) {
  //   for (let y = 0; y < res; y++) {
  //     const [r, g, b, a] = chroma(Random.pick(clrs.ellsworthKelly)).rgba();
  //     trainingSet.push({ r, g, b, a });
  //   }
  // }

  let data, pixels;
  let count = 0;

  return {
    begin({ context, width, height }) {
      console.clear();
      // drawClrs(context, res, width, height, trainingSet);

      context.drawImage(image, 0, 0, width / 2, height);
      context.drawImage(image, width / 2, 0, width / 2, height);
      pixels = context.getImageData(0, width / 2, width / 2, height);
      data = pixels.data;

      const trainingSet = [];
      for (let x = 0; x < width / 2; x++) {
        for (let y = 0; y < height; y++) {
          const pixel = context.getImageData(x, y, 1, 1);
          const [r, g, b, a] = pixel.data;
          trainingSet.push({ r, g, b, a });
        }
      }

      // const trainingSet = R.compose(
      //   R.map(([r, g, b, a]) => ({ r, g, b, a })),
      //   R.splitEvery(4),
      // )(data);

      som.setTraining(trainingSet);
    },
    render({ context, width, height }) {
      // if (som.trainOne()) {
      //   if (som.trainOne()) {
      //     const nodes = som.getConvertedNodes();
      //     drawNodes(context, res, width, height, nodes);
      //   }
      // }

      if (som.trainOne()) {
        count++;
        console.log(`training iteration number ${count}`);
        const nodes = som.getConvertedNodes();

        for (let x = 0; x < width / 2; x++) {
          for (let y = 0; y < height; y++) {
            const pixel = context.getImageData(x, y, 1, 1);
            const data = pixel.data;

            const { r, g, b, a } = nodes[x][y];
            data[0] = r;
            data[1] = g;
            data[2] = b;
            data[3] = a;

            context.putImageData(pixel, x, y);
          }
        }

        // nodes.forEach((node, nodeIdx) => {
        //   const p = context.getImageData(width / 2 + nodeIdx, 0, 1, height);
        //   const d = p.data;

        //   // const { r, g, b, a } = node[0];
        //   // console.log(
        //   //   `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(
        //   //     b,
        //   //   )}, ${Math.floor(a)})`,
        //   // );

        //   // node.forEach(({ r, g, b, a }, y) => {
        //   //   context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        //   //   context.fillRect(nodeIdx, y, 1, 1);
        //   // });

        //   R.compose(
        //     R.addIndex(R.forEach)((v, idx) => {
        //       d[idx] = v;
        //     }),
        //     R.tap(x => console.log(x.length)),
        //     R.flatten,
        //     R.map(({ r, g, b, a }) => [r, g, b, a].map(Math.floor)),
        //   )(node);

        //   context.putImageData(p, nodeIdx, 0);
        // });

        // R.compose(
        //   R.addIndex(R.forEach)((x, idx) => {
        //     data[idx] = x;
        //   }),
        //   R.flatten,
        //   R.map(({ r, g, b, a }) => [r, g, b, a]),
        //   R.flatten,
        // )(nodes);
      }
    },
  };
};

canvasSketch(sketch, settings);

function drawNodes(context, res, width, height, nodes) {
  const resX = width / res;
  const resY = height / res;

  for (let x = 0; x < res; x++) {
    for (let y = 0; y < res; y++) {
      const { r, g, b, a } = nodes[x][y];
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      context.fillRect(x * resX, y * resY, resX, resY);
    }
  }
}

function drawClrs(context, res, width, height, data) {
  const resX = width / res;
  const resY = height / res;

  for (let x = 0; x < res; x++) {
    for (let y = 0; y < res; y++) {
      const idx = x + res * y;
      const { r, g, b, a } = data[idx];
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      context.fillRect(x * resX, y * resY, resX, resY);
    }
  }
}
