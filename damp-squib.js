const canvasSketch = require('canvas-sketch');
const { dampArray, lerpArray, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const pack = require('pack-spheres');
const Delaunay = require('d3-delaunay').Delaunay;

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 2,
  scaleToView: true,
};

const config = {
  container: 0.4,
};

const clrs = {
  arapawa: '#000059',
  ultramarine: '#0021b8',
  blueRibbon: '#4e4bec',
  mediumPurple: '#8a78ff',
  frenchLilac: '#fad9ff',
  red: '#f66966',
  yellow: '#f4cf5d',
};

const rect = (context, x, y, width, height, color) => {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
};

const line = (context, [from, to], lineWidth, color) => {
  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.stroke();
};

const ring = (context, x, y, radius, fillColor, strokeColor, lineWidth = 8) => {
  context.fillStyle = clrs.mediumPurple;
  context.beginPath();
  context.arc(x, y, 2 * radius, 0, Math.PI * 2, false);
  context.fill();

  context.strokeStyle = strokeColor;
  context.fillStyle = clrs.mediumPurple;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.stroke();
  context.fill();
};

const circle = (context, x, y, radius, color, lineWidth) => {
  context.strokeStyle = context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.lineWidth = lineWidth;
  if (lineWidth != null) context.stroke();
  else context.fill();
};

const polygon = (context, [start, ...pts], color, lineWidth) => {
  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(...start);

  pts.forEach((pt) => {
    context.lineTo(...pt);
  });

  // context.closePath();
  context.stroke();
};

let grid = [];
let originOptions;

const sketch = () => {
  const margin = 50;
  let balls = [];
  let step;
  let circles;
  let polygons;

  return {
    begin({ width, height }) {
      step = (width - 2 * margin) * 0.0625;
      grid = [];
      balls = [];

      for (let x = margin; x <= width - margin; x += step) {
        for (let y = margin; y <= height - margin; y += step) {
          grid.push({ x, y, occupied: false });
        }
      }

      circles = makeCircles(width, step);
      originOptions = Random.shuffle(
        circles
          .filter(({ radius }) => radius >= step * 0.5)
          .map(({ position }) => position)
      );

      // circles.unshift({
      //   position: [width / 2, height / 2],
      //   radius: width * config.container - step * 0.25,
      // });

      while (originOptions.length >= 2) {
        balls.push(makeBall(step / 2));
      }

      circles
        .filter(({ radius }) => radius < step * 0.5)
        .map(({ position }) => position)
        .forEach((position) => {
          balls.push(makeLittleBall(step / 2, position));
        });

      const delaunay = Delaunay.from(circles.map(({ position }) => position));
      polygons = [...delaunay.trianglePolygons()];
    },
    render(props) {
      const { context, width, height, playhead, deltaTime, time } = props;

      rect(context, 0, 0, width, height, clrs.blueRibbon);
      drawGrid(context, width, height, margin, step);

      polygons.forEach((p) => polygon(context, p, clrs.frenchLilac, 2));

      const drawProps = { context, deltaTime, playhead, time };

      circles.forEach((c) => {
        context.strokeStyle = clrs.ultramarine;
        context.beginPath();
        context.arc(
          c.position[0],
          c.position[1],
          c.radius,
          0,
          Math.PI * 2,
          false
        );
        context.fillStyle = clrs.mediumPurple;
        context.fill();
        context.lineWidth = 3;
        context.stroke();
      });

      balls.forEach((ball) => {
        if (ball.style === 'connect') {
          drawConnectingBall(drawProps, ball);
        } else if (ball.style === 'shift') {
          drawShiftingBall(drawProps, ball);
        } else if (ball.style === 'scale') {
          drawScalingBall(drawProps, ball);
        } else if (ball.style === 'megaScale') {
          drawMegaScalingBall(drawProps, ball);
        }
      });
    },
  };
};

function makeCircles(width, step) {
  return pack({
    dimensions: 2,
    bounds: width,
    packAttempts: 500,
    maxCount: 100,
    minRadius: step * 0.25,
    maxRadius: step * 4,
    padding: step * 0.125,
    sample: () => {
      const option = Random.pick(grid);
      return [option.x, option.y];
    },
    outside: (position, radius) => {
      const d = Math.hypot(position[0] - width / 2, position[1] - width / 2);
      return d + radius > width * config.container - radius;
    },
  });
}

function makeLittleBall(step, position) {
  const style = 'scale';
  const from = position;
  const to = [0, 0];
  const radius = 0.125 * step;

  return {
    position: from,
    connector: [from, from],
    from: from,
    to: to,
    r1: 0,
    r2: radius + radius * beat(0, 4, 2),
    radius,
    lambda: Random.rangeFloor(2, 5),
    style: style,
    playhead: 0,
    connectorTimer: 0,
    state: 'moveHead',
    color: clrs.ultramarine,
  };
}

function makeBall(step) {
  const style = Random.pick(['connect', 'megaScale' /* 'shift' */]);
  const from = randomPointOnGrid();
  const to = style === 'connect' ? randomPointOnGrid() : [0, 0];
  const radius = 0.25 * step;

  return {
    position: from,
    connector: [from, from],
    from: from,
    to: to,
    r1: 0,
    r2: radius + radius * beat(0, 4, 2),
    radius,
    lambda: Random.rangeFloor(2, 5),
    style: style,
    playhead: 0,
    connectorTimer: 0,
    state: 'moveHead',
    color: clrs.frenchLilac,
  };
}

function drawShiftingBall({ context, deltaTime }, ball) {
  const { to, position, radius, lambda, color } = ball;

  ball.position = dampArray(position, to, lambda, deltaTime);

  circle(context, ball.position[0], ball.position[1], radius, clrs.red);
}

function drawMegaScalingBall({ context, playhead: globalPlayhead }, ball) {
  const { radius } = ball;

  ball.playhead = globalPlayhead;

  const scale = beat(ball.playhead, 12, 2);
  ball.r1 = radius + 2 * radius * scale;

  circle(context, ball.position[0], ball.position[1], ball.r1, clrs.red);
}

function drawConnectingBall({ context, deltaTime, playhead }, ball) {
  const { radius, lineWidth, from, to, color } = ball;

  ball.playhead = playhead;

  // The connector
  const rate = 12 * deltaTime;
  ball.connector[0] = lerpArray(ball.connector[0], to, rate);
  if (ball.playhead > 0.3) {
    ball.connector[1] = lerpArray(ball.connector[1], to, rate);
  }

  // line(context, ball.connector, 4, clrs.frenchLilac);

  // Origin circle
  const scale = beat(ball.playhead, 5, 2);
  ball.lineWidth = 32 * Math.sin(Math.PI * scale);
  ball.r1 = radius * (2 + 1 * scale);
  ring(
    context,
    from[0],
    from[1],
    ball.r1,
    clrs.blueRibbon,
    clrs.arapawa,
    lineWidth
  );

  // Destination circle
  if (ball.playhead >= 0.3) {
    const t = mapRange(ball.playhead, 0.3, 1, 0, 1);
    ball.r2 = radius + radius * beat(t, 4, 2);
  }

  circle(context, to[0], to[1], ball.r2, clrs.arapawa);
}

function drawScalingBall(
  { context, deltaTime, playhead: globalPlayhead, time },
  ball
) {
  const { radius, color } = ball;

  ball.playhead = globalPlayhead;

  const scale = beat(ball.playhead, 12, 2);
  ball.r1 = 2 * radius * scale;

  circle(context, ball.position[0], ball.position[1], ball.r1, color);
}

function randomPointOnGrid() {
  return originOptions.pop();
}

function drawGrid(context, width, height, margin, step) {
  for (let x = margin; x <= width - margin; x += step) {
    context.lineWidth = 1;
    context.strokeStyle = clrs.mediumPurple;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = margin; y <= height - margin; y += step) {
    context.lineWidth = 1;
    context.strokeStyle = clrs.mediumPurple;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function beat(value, intensity = 2, frequency = 2, offset = 0) {
  const v = Math.atan(
    offset - Math.PI + Math.sin(value * Math.PI * frequency) * intensity
  );
  return (v + Math.PI / 2) / Math.PI;
}

canvasSketch(sketch, settings);
