const canvasSketch = require('canvas-sketch');
const chroma = require('chroma-js');
const Random = require('canvas-sketch-util/random');
const { point, line, drawShape, trail } = require('./geometry');
const { matrixMultiply } = require('./matrix');
const { hueCycle } = require('./clrs');
const { beat } = require('./easings');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 12,
  scaleToView: true,
};

// const clr = chroma.scale('YlGnBu').colors(3);
const clr = ['#fff', '#999', '#333'];
// const clr = ['#fff', '#ffe2e2', '#99ddcc'];
// const clr = ['#fbfbfb', '#808b97', '#5ba19b'];
// const clr = ['#fbfbfb', '#f3d179', '#808b97'];
// const clr = ['#fff', '#9a9b94', '#52524e'];

/**
 * Double Pendulum
 * https://www.myphysicslab.com/pendulum/double-pendulum-en.html
 * based on https://github.com/CodingTrain/website/blob/master/CodingChallenges/CC_093_DoublePendulum_p5.js/sketch.js
 */
const sketch = () => {
  console.clear();
  // Choose a new starting hues
  Random.setSeed(Random.getRandomSeed());
  let hueStart1 = Random.value();
  let hueStart2 = Random.value() * Random.value();

  let pendulum = {};

  return {
    begin() {
      pendulum = {
        r1: 125,
        r2: 125,
        m1: 10,
        m2: 10,
        a1: Math.PI,
        a2: Math.PI * 0.75,
        a1Vel: 0,
        a2Vel: 0,
        g: 1,
        trail1: [],
        trail2: [],
        pathLength: 25,
      };
    },
    render: ({ context, width, height, playhead }) => {
      const location1 = [
        pendulum.r1 * Math.sin(pendulum.a1),
        pendulum.r1 * Math.cos(pendulum.a1),
      ];
      const location2 = [
        location1[0] + pendulum.r2 * Math.sin(pendulum.a2),
        location1[1] + pendulum.r2 * Math.cos(pendulum.a2),
      ];

      context.fillStyle = clr[0];
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      context.translate(width / 2, height / 2);

      // Draw Pendulum
      line(context, [0, 0], location1, {
        lineWidth: 1,
        stroke: clr[1],
      });
      line(context, location1, location2, {
        lineWidth: 1,
        stroke: clr[1],
      });
      point(context, [0, 0], 2, { fill: clr[1] });
      point(context, location1, 6, { fill: clr[1] });
      point(context, location2, 6, { fill: clr[2] });

      // // Draw Trails
      // pendulum.trail1.push(location1);
      // pendulum.trail2.push(location2);

      // if (pendulum.trail1.length > pendulum.pathLength) {
      //   pendulum.trail1.shift();
      // }
      // if (pendulum.trail2.length > pendulum.pathLength) {
      //   pendulum.trail2.shift();
      // }

      // context.lineWidth = 4;
      // context.lineCap = 'round';
      // // Motion path of top rod
      // context.strokeStyle = clr[1]; //hueCycle(hueStart1, playhead, 0.75, 0.75 * fade);
      // drawShape(context, pendulum.trail1, false);
      // context.stroke();
      // // Motion path of bottom rod
      // context.strokeStyle = clr[2]; //hueCycle(hueStart2, playhead, 0.75, 0.75 * fade);
      // drawShape(context, pendulum.trail2, false);
      // context.stroke();

      // Update acceleration ➡ velocity ➡ angle
      const a1Acc = angularAccTop(pendulum);
      const a2Acc = angularAccBottom(pendulum);
      pendulum.a1Vel += a1Acc;
      pendulum.a2Vel += a2Acc;
      pendulum.a1 += pendulum.a1Vel;
      pendulum.a2 += pendulum.a2Vel;
      // air friction
      // pendulum.a1Vel *= 0.9999;
      // pendulum.a2Vel *= 0.9999;
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
