const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { pastel, ellsworthKelly } = require('./clrs');
const { point, drawShape } = require('./geometry');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 10,
  scaleToView: true,
};

const sketch = () => {
  console.clear();
  let curves;
  Random.setSeed(Random.getRandomSeed());

  return {
    begin({ context, width, height }) {
      curves = linspace(8).map(
        (_, idx) =>
          new Lissajous(
            [width / 2, height / 2],
            width * 0.2,
            [Random.rangeFloor(1, 10), Random.rangeFloor(1, 10)],
            [Random.range(0, 2 * Math.PI), Random.range(0, 2 * Math.PI)],
            Random.rangeFloor(2, 10),
            Random.pick(pastel),
          ),
      );
    },
    render({ context, width, height, playhead, deltaTime }) {
      const angle = mapRange(playhead, 0, 1, 0, Math.PI * 2);

      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      curves.forEach(curve => {
        curve.update(angle);
        curve.drawPath(context, width * 0.0625);
      });
    },
  };
};

canvasSketch(sketch, settings);

class Lissajous {
  constructor(
    center,
    r,
    vel = [1, 3],
    start = [-Math.PI / 2, -Math.PI / 2],
    length = 50,
    color = '#fff',
  ) {
    this.center = center;
    this.r = r;
    this.vel = vel;
    this.start = start;
    this.length = length;
    this.color = color;
    this.path = [];
  }

  update(angle) {
    this.path = linspace(this.length).map(dt => [
      this.center[0] +
        this.r * Math.cos((angle + 0.2 * dt) * this.vel[0] - this.start[0]),
      this.center[1] +
        this.r * Math.sin((angle + 0.2 * dt) * this.vel[1] - this.start[1]),
    ]);
  }

  drawPath(context, s = 40) {
    const delta = Math.hypot(
      Math.abs(this.path[0][0] - this.path[this.path.length - 1][0]),
      Math.abs(this.path[0][1] - this.path[this.path.length - 1][1]),
    );
    // Scale width based on length
    context.lineWidth = mapRange(delta, 0, this.r, 1.25 * s, 0.5 * s, true);
    // constant width
    context.lineWidth = s;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = this.color;
    drawShape(context, this.path, false);
    context.stroke();
  }
}
