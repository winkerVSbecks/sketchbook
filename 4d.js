const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const d3 = require('d3-quadtree');
const chroma = require('chroma-js');

const settings = {
  dimensions: [800, 800],
  scaleToView: false,
  animate: true,
  duration: 4,
};

const clr = () =>
  Random.pick(['#c4f4fe', '#4A3E3E', '#fff648', '#feb6de', '#fa530a']);

canvasSketch(() => {
  let pts;
  let fills = [];
  let fill = clr();

  return {
    begin({ width, height }) {
      pts = linspace(2500).map(() => [
        Random.rangeFloor(0, width),
        Random.rangeFloor(0, height),
      ]);
    },
    render({ context, width, height, playhead }) {
      const t = Math.sin(Math.PI * playhead);

      const points = pts.map(([x, y]) => [
        x + Random.noise2D(x, t, 1, width * 0.01),
        y + Random.noise2D(y, t, 1, height * 0.01),
      ]);

      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const nodes = quadtreeToNodes(points, width, height);
      context.strokeStyle = '#fff';
      context.lineWidth = 1;

      nodes.forEach((node, idx) => {
        if (!fills[idx]) fills[idx] = clr();
        context.fillStyle = fills[idx];
        context.fillRect(node.x, node.y, node.width, node.height);
        context.strokeRect(node.x, node.y, node.width, node.height);
      });

      // context.fillStyle = '#000';
      // pts.forEach(([x, y]) => {
      //   context.fillRect(x, y, 5, 5);
      // });
    },
  };
}, settings);

function quadtreeToNodes(pts, width, height) {
  const quadtree = d3
    .quadtree()
    .extent([[0, 0], [width, height]])
    .addAll(pts);

  const nodes = [];
  quadtree.visit((node, x0, y0, x1, y1) => {
    nodes.push({
      x: x0,
      y: y0,
      x1,
      y1,
      width: y1 - y0,
      height: x1 - x0,
    });
  });
  return nodes;
}
