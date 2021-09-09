const canvasSketch = require('canvas-sketch');
const { lerpArray } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const Matter = require('matter-js');
const Bezier = require('bezier-js');
const { Lch } = require('./clrs');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 7,
  fps: 60,
};

const config = {
  debug: false,
  step: 0.04,
  curve: {
    steps: 30,
    tightness: 0.5,
  },
  spring: {
    stiffness: 0.5,
    damping: 0.05,
  },
};

// const clrs = {
//   bg: '#fff',
//   fills: ['#f13401', '#0769ce', '#f1d93c', '#11804b'],
// };
const clrs = {
  fills: [
    Lch(50, 50, Random.range(180, 360)),
    Lch(100, 70, Random.range(0, 180)),
    Lch(100, 20, Random.range(0, 180)),
    Lch(20, 90, Random.range(0, 180)),
  ],
  bg: Lch(95, 0, 0),
};

const sketch = ({ width, height }) => {
  Random.setSeed('curve-relief');

  let engine, world, curves;

  return {
    begin({ canvas, width, height }) {
      engine = Matter.Engine.create();
      world = engine.world;
      runner = Matter.Runner.create();
      curves = clrs.fills
        .map((color) => springyCurve(world, { width, height }, color))
        .sort((c1, c2) => c2.dist - c1.dist);
      if (config.debug) {
        const render = Matter.Render.create({
          canvas,
          engine: engine,
          options: {
            width,
            height,
          },
        });

        Matter.Render.run(render);
      }
    },
    render({ context, width, height, playhead, deltaTime }) {
      if (!config.debug) {
        context.fillStyle = clrs.bg;
        context.clearRect(0, 0, width, height);
        context.fillRect(0, 0, width, height);

        Matter.Engine.update(engine);

        curves.forEach((curve) => {
          drawCurve(context, curve);
        });
      }
    },
    end() {
      Matter.Engine.clear(engine);
      Matter.Composite.clear(world);
    },
  };
};

canvasSketch(sketch, settings);

function springyCurve(world, { width, height }, color) {
  const bodies = [];
  const constraints = [];

  const points = [
    { x: width, y: 0 },
    {
      x: Random.range(width * 0.4, width * 0.6),
      y: Random.range(height * 0.4, height * 0.6),
    },
    { x: 0, y: height },
  ];

  const curve = Bezier.quadraticFromPoints(
    points[0],
    points[1],
    points[2],
    config.curve.tightness
  ).getLUT(config.curve.steps);

  curve.forEach(({ x, y }) => {
    const body = Matter.Bodies.polygon(x, y, 0, 30, {
      collisionFilter: { group: -1 },
    });

    if (bodies.length > 0) {
      const constraint = Matter.Constraint.create({
        bodyA: bodies[bodies.length - 1],
        bodyB: body,
        ...config.spring,
      });
      constraints.push(constraint);
    }

    bodies.push(body);
  });

  const constraintEnd1 = Matter.Constraint.create({
    pointA: points[0],
    bodyB: bodies[0],
    ...config.spring,
  });

  const constraintEnd2 = Matter.Constraint.create({
    pointA: points[2],
    bodyB: bodies[bodies.length - 1],
    ...config.spring,
  });

  const constraintOrigin = Matter.Constraint.create({
    pointA: { x: 0, y: 0 },
    bodyB: bodies[bodies.length - 1],
    stiffness: 1,
    damping: 1,
  });

  Matter.Composite.add(world, [
    ...bodies,
    ...constraints,
    constraintEnd1,
    constraintEnd2,
    constraintOrigin,
  ]);

  return {
    bodies,
    constraints,
    color,
    points,
    dist: Math.hypot(points[1].x, points[1].y),
  };
}

function drawCurve(context, { color, points, bodies }) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let idx = 1; idx < bodies.length; idx++) {
    const bodyA = bodies[idx - 1];
    const bodyB = bodies[idx];

    const xc = (bodyA.position.x + bodyB.position.x) / 2;
    const yc = (bodyA.position.y + bodyB.position.y) / 2;
    context.quadraticCurveTo(bodyA.position.x, bodyA.position.y, xc, yc);
    context.quadraticCurveTo(
      bodyA.position.x,
      bodyA.position.y,
      bodyB.position.x,
      bodyB.position.y
    );
  }
  context.lineTo(0, 0);
  context.closePath();
  context.fill();
}
