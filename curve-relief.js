const canvasSketch = require('canvas-sketch');
const { lerpArray } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const Matter = require('matter-js');
const Bezier = require('bezier-js');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 6,
  fps: 60,
};

const config = {
  debug: false,
  step: 0.04,
  curve: {
    steps: 40,
    tightness: 0.5,
  },
  spring: {
    stiffness: 0.5,
    damping: 0.05,
  },
};

const clrs = {
  bg: '#fff',
  fills: ['#f13401', '#0769ce', '#f1d93c', '#11804b'],
};

const sketch = () => {
  // Random.setSeed('curve-relief');

  let engine;
  let world;
  let runner;
  let curves;

  return {
    begin({ canvas, width, height }) {
      engine = Matter.Engine.create();
      world = engine.world;
      runner = Matter.Runner.create();

      curves = clrs.fills
        .map((color) => springyCurve(world, { width, height }, color))
        .sort((c1, c2) => c2.y - c1.y);

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

      // Matter.Runner.run(runner, engine);
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

  const ends = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
  ];

  const points = [
    ends[0],
    { x: Random.range(0, width), y: Random.range(0, height) },
    ends[1],
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
    pointA: ends[0],
    bodyB: bodies[0],
    ...config.spring,
  });

  const constraintEnd2 = Matter.Constraint.create({
    pointA: ends[1],
    bodyB: bodies[bodies.length - 1],
    ...config.spring,
  });

  Matter.Composite.add(world, [
    ...bodies,
    ...constraints,
    constraintEnd1,
    constraintEnd2,
  ]);

  return { bodies, constraints, color, y: points[1].y };
}

function drawCurve(context, { color, bodies }) {
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.fillStyle = color;
  context.beginPath();
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
  context.closePath();
  context.fill();
}
