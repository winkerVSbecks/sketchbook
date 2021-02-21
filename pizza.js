const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { lerpArray } = require('canvas-sketch-util/math');

const settings = {
  // dimensions: [1280, 640],
  dimensions: [1080, 1080],
  scaleToView: true,
  animate: true,
  fps: 2,
  playbackRate: 'throttle',
  duration: 12,
};

const clrs = {
  base: '#EBE4C4',
  crust: '#F09F31',
  cheese: '#FFCA3B',
  pepperoni: '#ED1F27',
  bg: '#FF8664',
  outline: '#6C1A4D',
};

const sketch = () => {
  return (props) => {
    const { width, height, context } = props;

    const margin = 2;

    const res = [4, 8];
    const size = [
      (width - 2 * margin) / res[0],
      (height - 2 * margin) / res[1],
    ];

    context.clearRect(0, 0, width, height);
    context.fillStyle = clrs.bg;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = clrs.outline;
    context.lineWidth = 8;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    makePizza(context, [width / 2, height / 2], [width / 6, width / 8]);

    // for (let y = 0; y < res[1]; y++) {
    //   for (let x = 0; x < res[0]; x++) {
    //     const pizza = makePizza(
    //       context,
    //       [margin + (x + 0.5) * size[0], margin + (y + 0.5) * size[1]],
    //       [size[0] * 0.25, size[1] * 0.25]
    //     );
    //     // paths.push(pizza);
    //   }
    // }
  };
};

canvasSketch(sketch, settings);

function makePizza(context, [cx, cy], [a, b]) {
  const angles = randomAngles();
  const crustAngleOff = Math.PI * 0.01;

  const angle1 = angles[1] - crustAngleOff;
  const angle2 = angles[2] + crustAngleOff;

  const base = angles.map((angle) => pointOnEllipse([cx, cy], angle, a, b));

  const droopSide = base[1][1] < base[2][1] ? 2 : 1;

  // Draw cheese
  context.fillStyle = clrs.cheese;
  context.beginPath();
  context.moveTo(...base[0]);
  context.lineTo(...base[1]);
  context.ellipse(cx, cy, a, b, 0, angle1, angle2);
  context.closePath();
  context.fill();
  context.stroke();

  // Draw base
  context.fillStyle = clrs.base;
  context.beginPath();
  context.moveTo(...base[0]);
  context.lineTo(...base[droopSide]);
  context.lineTo(base[droopSide][0], base[droopSide][1] + b * 0.1);
  context.lineTo(base[0][0], base[0][1] + b * 0.1);
  context.closePath();
  context.fill();
  context.stroke();

  // Draw cheese drops
  [0, 1, 2]
    .map(() => Random.chance(0.75))
    .forEach((doDraw, idx) => {
      if (doDraw) {
        drawCheese(
          base,
          droopSide,
          {
            location: Random.range(0 + 0.3 * idx, 0.25 + 0.35 * idx),
            thickness: Random.range(0.03, 0.05),
            length: Random.range(b * 0.125, b * 0.25),
          },
          context
        );
      }
    });

  // Draw crust
  let crustScale = 1.12;
  const crustFill = [angles[0], angle1, angle2].map((angle) =>
    pointOnEllipse([cx, cy], angle, a * crustScale, b * crustScale)
  );

  context.strokeStyle = clrs.crust;
  context.lineWidth = 32;
  context.beginPath();
  context.moveTo(...crustFill[1]);
  context.ellipse(cx, cy, a * crustScale, b * crustScale, 0, angle1, angle2);
  context.stroke();

  crustScale = 1.21;
  const crustOutline = [angles[0], angle1, angle2].map((angle) =>
    pointOnEllipse([cx, cy], angle, a * crustScale, b * crustScale)
  );

  context.strokeStyle = clrs.outline;
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(...crustOutline[1]);
  context.ellipse(cx, cy, a * crustScale, b * crustScale, 0, angle1, angle2);
  context.stroke();

  // Draw pepperonis
  const pepperonis = getPepperonis(base, {
    radius: a * 0.1,
    count: Random.rangeFloor(3, 5),
  });

  pepperonis.forEach((pepperoni) => {
    context.fillStyle = clrs.pepperoni;
    context.beginPath();
    context.moveTo(pepperoni[0] + a * 0.1, pepperoni[1]);
    context.arc(pepperoni[0], pepperoni[1], a * 0.1, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  });
}

function randomAngles() {
  const first = Random.range(0, Math.PI * 2);
  const second = first + Random.range(Math.PI * 0.5, Math.PI);
  const third = second + Random.range(Math.PI * 0.3, Math.PI * 0.4);
  return [first, second, third];
}

function pointOnEllipse([cx, cy], theta, a, b) {
  return [cx + a * Math.cos(theta), cy + b * Math.sin(theta)];
}

function randomPointInTriangle(triangle) {
  let wb = Math.random();
  let wc = Math.random();

  // point will be outside of the triangle, invert weights
  if (wb + wc > 1) {
    wb = 1 - wb;
    wc = 1 - wc;
  }

  const [a, b, c] = triangle.map((coords) => ({ x: coords[0], y: coords[1] }));

  const rb_x = wb * (b.x - a.x);
  const rb_y = wb * (b.y - a.y);
  const rc_x = wc * (c.x - a.x);
  const rc_y = wc * (c.y - a.y);

  const r_x = rb_x + rc_x + a.x;
  const r_y = rb_y + rc_y + a.y;

  return [r_x, r_y];
}

function getPepperonis(base, { radius, count }) {
  const pepperonis = [];

  while (pepperonis.length <= count) {
    const pepperoni = randomPointInTriangle(base);
    const valid = pepperonis.reduce(
      (res, pt) => res && !circleCollide(pepperoni, pt, radius),
      true
    );

    if (valid) {
      pepperonis.push(pepperoni);
    }
  }

  return pepperonis;
}

function circleCollide([x1, y1], [x2, y2], r) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  return dist <= r + r ? true : false;
}

function drawCheese(base, droopSide, { location, length, thickness }, context) {
  let cheeseA = lerpArray(
    [base[0][0], base[0][1] - 4],
    base[droopSide],
    location
  );
  let cheeseB = lerpArray(
    [base[0][0], base[0][1] - 4],
    base[droopSide],
    location + thickness
  );

  [cheeseA, cheeseB] =
    cheeseA[0] < cheeseB[0] ? [cheeseB, cheeseA] : [cheeseA, cheeseB];

  const cheeseCenter = (cheeseA[0] + cheeseB[0]) / 2;
  const cheeseRadius = (cheeseA[0] - cheeseB[0]) / 2;

  context.fillStyle = clrs.cheese;
  context.strokeStyle = clrs.cheese;
  context.beginPath();
  context.moveTo(...cheeseA);
  context.lineTo(cheeseA[0], cheeseA[1] + length);
  context.arc(cheeseCenter, cheeseA[1] + length, cheeseRadius, 0, Math.PI);
  context.lineTo(cheeseB[0], cheeseB[1]);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = clrs.outline;
  context.beginPath();
  context.moveTo(...cheeseA);
  context.lineTo(cheeseA[0], cheeseA[1] + length);
  context.arc(cheeseCenter, cheeseA[1] + length, cheeseRadius, 0, Math.PI);
  context.lineTo(cheeseB[0], cheeseB[1]);
  context.stroke();
}
