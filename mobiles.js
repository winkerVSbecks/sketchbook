const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
import { Tree } from 'itsy-bitsy-data-structures';

const settings = {
  dimensions: [1600, 1600],
  scaleToView: true,
};

const clrs = {
  bg: '#F9F6F2',
  wire: '#1E1F1F',
  shapes: ['##DF3F41', '#5BA746', '#F9D36E', '#F5B8A9', '#3061D1'],
};

const config = {
  resolution: 20,
};

const sketch = () => {
  Random.setSeed('mobiles');

  const mobile = buildMobile(config.resolution);
  console.log(mobile);

  return ({ context, width, height, playhead }) => {
    // Clear
    context.fillStyle = clrs.bg;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);

    debugGrid(context, config.resolution, [width, height]);
    drawMobile(context, config.resolution, [width, height], mobile);
  };
};

canvasSketch(sketch, settings);

function drawMobile(context, resolution, [width, height], mobile) {
  mobile.traverse((node) => {
    context.strokeStyle = clrs.wire;
    context.lineWidth = 4;
    context.beginPath();

    node?.children.forEach((child) => {
      drawLine(node.value, child.value, context, resolution, [width, height]);
    });

    context.stroke();
  });
}

function buildMobile(resolution) {
  const mobile = new Tree();

  let position = pt([1, 1], [resolution - 2, 1]);
  mobile.add(position);

  while (position[1] < resolution - 1) {
    const next = node(position, resolution);
    if (next.left) {
      mobile.add(next.left, position);
      mobile.add(next.right, position);
      position = next.left;
    } else {
      mobile.add(next, position);
      position = next;
    }
  }

  return mobile;
}

function node([x, y], resolution) {
  if (Random.chance()) {
    // split
    return {
      left: pt([x, y], [0, resolution]),
      right: pt([x, y], [resolution, resolution]),
    };
  } else {
    // straight down
    return pt([x, y], [x, resolution]);
  }
}

function pt([xMin, yMin], [xMax, yMax]) {
  return [Random.rangeFloor(xMin, xMax), Random.rangeFloor(yMin, yMax)];
}

function drawLine(from, to, context, resolution, [width, height]) {
  const [x1, y1] = [
    (from[0] * width) / resolution,
    (from[1] * height) / resolution,
  ];
  const [x2, y2] = [
    (to[0] * width) / resolution,
    (to[1] * height) / resolution,
  ];

  console.log([x1, y1], [x2, y2]);

  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
}

function debugGrid(context, resolution, [width, height]) {
  context.strokeStyle = clrs.wire;
  context.beginPath();

  for (let idx = 0; idx <= resolution; idx++) {
    const x = mapRange(idx, 0, resolution, 0, width);
    context.moveTo(x, 0);
    context.lineTo(x, height);

    const y = mapRange(idx, 0, resolution, 0, height);
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.stroke();
}
