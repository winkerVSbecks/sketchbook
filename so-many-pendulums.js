const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { linspace } = require('canvas-sketch-util/math');
const { point, line, drawShape } = require('./geometry');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 20,
  scaleToView: true,
};

const clrs = [
  '#ffe2e2',
  '#99ddcc',
  '#5ba19b',
  '#f3d179',
  '#fff1c1',
  '#808b97',
  '#a9eca2',
  '#6c5b7c',
  '#d7acd4',
  '#ea8a8a',
  '#8a79af',
  '#d38cad',
  '#eaafaf',
  '#f46060',
  '#f3d179',
];

/**
 * Double Pendulum
 * https://www.myphysicslab.com/pendulum/double-pendulum-en.html
 * based on https://github.com/CodingTrain/website/blob/master/CodingChallenges/CC_093_DoublePendulum_p5.js/sketch.js
 */
const sketch = () => {
  console.clear();
  let pendulums = [];
  Random.setSeed(Random.getRandomSeed());

  return {
    begin() {
      pendulums = linspace(5).map(initPendulum);
    },
    render: ({ context, width, height, playhead }) => {
      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      context.translate(width / 2, height / 2);

      pendulums.forEach((pendulum) => {
        // Draw Trails
        makeTrail(pendulum);
        drawTrail(context, pendulum);
        // Update acceleration ➡ velocity ➡ angle
        updatePendulum(pendulum);
      });
    },
  };
};

canvasSketch(sketch, settings);

// angular acceleration of top rod
function angularAccTop({ r1, r2, m1, m2, a1, a2, a1Vel, a2Vel, g }) {
  const num1 = -g * (2 * m1 + m2) * Math.sin(a1);
  const num2 = -m2 * g * Math.sin(a1 - 2 * a2);
  const num3 = -2 * Math.sin(a1 - a2) * m2;
  const num4 = a2Vel * a2Vel * r2 + a1Vel * a1Vel * r1 * Math.cos(a1 - a2);
  const den = r1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
  return (num1 + num2 + num3 * num4) / den;
}

// angular acceleration of bottom rod
function angularAccBottom({ r1, r2, m1, m2, a1, a2, a1Vel, a2Vel, g }) {
  const num1 = 2 * Math.sin(a1 - a2);
  const num2 = a1Vel * a1Vel * r1 * (m1 + m2);
  const num3 = g * (m1 + m2) * Math.cos(a1);
  const num4 = a2Vel * a2Vel * r2 * m2 * Math.cos(a1 - a2);
  const den = r2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
  return (num1 * (num2 + num3 + num4)) / den;
}

function initPendulum() {
  return {
    r1: Random.range(50, 150),
    r2: Random.range(50, 150),
    m1: Random.range(8, 20),
    m2: Random.range(8, 20),
    a1: Random.range(Math.PI, 2 * Math.PI),
    a2: Random.range(Math.PI * 0.75, Math.PI * 1.5),
    a1Vel: 0,
    a2Vel: 0,
    g: 0.5,
    trail1: [],
    trail2: [],
    pathLength: 25,
    colors: [Random.pick(clrs), Random.pick(clrs)],
  };
}

function updatePendulum(pendulum) {
  const a1Acc = angularAccTop(pendulum);
  const a2Acc = angularAccBottom(pendulum);
  pendulum.a1Vel += a1Acc;
  pendulum.a2Vel += a2Acc;
  pendulum.a1 += pendulum.a1Vel;
  pendulum.a2 += pendulum.a2Vel;
  // air friction
  pendulum.a1Vel *= 0.999;
  pendulum.a2Vel *= 0.999;
}

function makeTrail(pendulum) {
  const location1 = [
    pendulum.r1 * Math.sin(pendulum.a1),
    pendulum.r1 * Math.cos(pendulum.a1),
  ];
  const location2 = [
    location1[0] + pendulum.r2 * Math.sin(pendulum.a2),
    location1[1] + pendulum.r2 * Math.cos(pendulum.a2),
  ];

  pendulum.trail1.push(location1);
  pendulum.trail2.push(location2);

  if (pendulum.trail1.length > pendulum.pathLength) {
    pendulum.trail1.shift();
  }
  if (pendulum.trail2.length > pendulum.pathLength) {
    pendulum.trail2.shift();
  }
}

function drawTrail(context, pendulum) {
  context.lineWidth = 12;
  context.lineCap = 'round';
  // Motion path of top rod
  context.strokeStyle = pendulum.colors[0];
  drawShape(context, pendulum.trail1, false);
  context.stroke();
  // Motion path of bottom rod
  context.strokeStyle = pendulum.colors[1];
  drawShape(context, pendulum.trail2, false);
  context.stroke();
}
