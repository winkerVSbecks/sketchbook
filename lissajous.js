const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const { pastel, ellsworthKelly } = require('./clrs');
const { point, drawShape } = require('./geometry');
const stackblur = require('stackblur');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 10,
  // scaleToView: true,
};

// https://fonts.google.com/specimen/Monoton?category=Display&preview.text=Space%20Worms&preview.text_type=custom
// https://fonts.google.com/specimen/Bebas+Neue?category=Display&preview.text=Space%20Worms&preview.text_type=custom&sort=popularity#standard-styles
// https://fonts.google.com/specimen/Righteous?category=Display&preview.text=Space%20Worms&preview.text_type=custom&sort=popularity

const clrs = {
  // bg: '#0A1918',
  // paths: ['#FDC22D', '#F992E2', '#E7EEF6', '#FB331C', '#3624F4'],
  bg: '#1B1812',
  paths: [
    '#F2AFFA',
    '#EE7E6C',
    '#EEBABC',
    '#FAECEB',
    '#9FCDDE',
    '#54A9BD',
    // '#8618F6',
    // '#0800F5',
    // '#49A1F8',
    // '#75FBF8',
    // '#75FB5A',
    // '#EAFE53',
    // '#F7CC45',
    // '#EB4025',
  ],
};

const sketch = () => {
  console.clear();
  let curves;
  Random.setSeed(Random.getRandomSeed());

  return {
    begin({ context, width, height }) {
      curves = linspace(8).map(
        (_, idx) =>
          new Lissajous({
            center: [width / 2, height * 0.75],
            r: width * 0.2,
            vel: [Random.rangeFloor(1, 10), Random.rangeFloor(1, 10)],
            start: [Random.range(0, 2 * Math.PI), Random.range(0, 2 * Math.PI)],
            length: Random.rangeFloor(2, 10),
            color: Random.pick(clrs.paths),
          })
      );
    },
    render({ context, width, height, playhead, deltaTime }) {
      const angle = mapRange(playhead, 0, 1, 0, Math.PI * 2);

      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      curves.forEach((curve, idx) => {
        curve.update(angle);
        if (idx === 0) {
          curve.drawPath(context, width * 0.0625 * 2);
          const imageData = context.getImageData(0, 0, width, height);
          stackblur(imageData.data, width, height, 6);
          context.putImageData(imageData, 0, 0);
        } else {
          curve.drawPath(context, width * 0.0625);
        }
      });
    },
  };
};

canvasSketch(sketch, settings);

class Lissajous {
  constructor({
    center,
    r,
    vel = [1, 3],
    start = [-Math.PI / 2, -Math.PI / 2],
    length = 50,
    color = '#fff',
  }) {
    this.center = center;
    this.r = r;
    this.vel = vel;
    this.start = start;
    this.length = length;
    this.color = color;
    this.path = [];
  }

  update(angle) {
    this.path = linspace(this.length).map((dt) => [
      this.center[0] +
        this.r * Math.cos((angle + 0.2 * dt) * this.vel[0] - this.start[0]),
      this.center[1] +
        this.r * Math.sin((angle + 0.2 * dt) * this.vel[1] - this.start[1]),
    ]);
  }

  drawPath(context, s = 40) {
    const delta = Math.hypot(
      Math.abs(this.path[0][0] - this.path[this.path.length - 1][0]),
      Math.abs(this.path[0][1] - this.path[this.path.length - 1][1])
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
