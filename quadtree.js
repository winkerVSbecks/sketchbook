const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const d3 = require('d3-quadtree');
const chroma = require('chroma-js');

const settings = {
  dimensions: [2400, 2400],
  scaleToView: false,
};

const clr = () => Random.pick(['#0e0737', '#0f29a3', '#fc302a', '#f6d0db']);
// const clr = () => Random.pick(chroma.scale('YlGnBu').colors(6));
// const clr = () =>
//   Random.pick([
//     '#0A1918',
//     '#FDC22D',
//     '#F992E2',
//     '#E7EEF6',
//     '#FB331C',
//     '#3624F4',
//   ]);

canvasSketch(() => {
  let pts;

  return {
    begin({ width, height }) {
      pts = linspace(2500).map(() => [
        Random.rangeFloor(0, width),
        Random.rangeFloor(0, height),
      ]);
    },
    render({ context, width, height }) {
      // clear
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const nodes = quadtreeToNodes(pts, width, height);
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      nodes.forEach(node => {
        context.fillStyle = clr();

        const gradient = context.createLinearGradient(
          node.x,
          node.y,
          node.x1,
          node.y1,
        );

        const color = clr();
        gradient.addColorStop(0, color);
        gradient.addColorStop(
          1,
          chroma(color)
            .brighten(2)
            // .alpha(0)
            .css(),
        );

        context.fillStyle = gradient;
        context.fillRect(node.x, node.y, node.width, node.height);
        context.strokeRect(node.x, node.y, node.width, node.height);
      });

      // const nodes2 = quadtreeToNodes(pts2, width, height);
      nodes.forEach(node => {
        context.fillStyle = chroma(clr())
          .darken(2)
          .alpha(0.1)
          .css();

        linspace(500).forEach(() => {
          const cx = Random.rangeFloor(node.x, node.x1);
          const cy = Random.rangeFloor(node.y, node.y1);
          context.fillRect(cx, cy, 1, 1);
        });
      });

      nodes.forEach(node => {
        const color = clr();

        const x = node.x + node.width / 2;
        const y = node.y + node.height / 2;
        const r = Math.min(node.width, node.height) / 2;

        if (Random.chance(0.05)) {
          const gradient = context.createLinearGradient(
            node.x,
            node.y,
            node.x1,
            node.y1,
          );

          const color = clr();
          gradient.addColorStop(0, color);
          gradient.addColorStop(
            1,
            chroma(color)
              .brighten(2)
              // .alpha(0)
              .css(),
          );

          context.beginPath();
          context.arc(x, y, r, 0, 2 * Math.PI);

          context.fillStyle = gradient;
          context.fill();

          context.fillStyle = chroma(color)
            .brighten(1)
            .css();
          linspace(2500).forEach(() => {
            const [cx, cy] = Random.insideCircle(r);
            context.save();
            context.translate(x, y);
            context.fillRect(cx, cy, 1, 1);
            context.restore();
          });
        }
      });
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
