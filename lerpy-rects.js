const canvasSketch = require('canvas-sketch');
const { lerp, damp } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 2,
};

const rect = (context, x, y, width, height, color) => {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
};

const movementTypes = {
  lerp: drawLerp,
  spring: drawSpring,
  damp: drawDamp,
  slerp: drawSlerp,
};

const config = {
  colors: {
    bg: 'rgba(27, 25, 31, 0.0625)',
    bgSolid: 'rgba(27, 25, 31, 1)',
    fg: 'rgb(217,215,224)',
  },
  lambda: 6,
  spring: {
    stiffness: 0.2,
    damping: 0.1,
  },
  trail: false,
  resolution: 10,
  rect: {
    w: 2,
    h: 40,
  },
  span: 1,
  movement: 'damp',
};

const sketch = () => {
  let horRects, vertRects;

  return {
    begin({ width, height }) {
      horRects = vertRects = [];

      for (let x = -config.span; x <= config.resolution + config.span; x++) {
        for (let y = -config.span; y <= config.resolution + config.span; y++) {
          const [ax, ay] = [
            (x * width) / config.resolution,
            (y * height) / config.resolution,
          ];
          const [hR, vR] = makeRects(
            [ax, ay],
            [
              (width * config.span) / config.resolution,
              (height * config.span) / config.resolution,
            ]
          );
          horRects.push(hR);
          vertRects.push(vR);
        }
      }
    },
    render(props) {
      const { context, width, height } = props;

      rect(
        context,
        0,
        0,
        width,
        height,
        config.trail ? config.colors.bg : config.colors.bgSolid
      );

      horRects.forEach((rect) => moveRect(rect, props));
      vertRects.forEach((rect) => moveRect(rect, props));

      horRects.forEach(({ x, y, w, h }) => {
        rect(context, x, y, w, h, config.colors.fg);
      });
      vertRects.forEach(({ x, y, w, h }) => {
        rect(context, x, y, w, h, config.colors.fg);
      });
    },
  };
};

function makeRects([x, y], [spanX, spanY]) {
  const w = config.rect.w;
  const h = config.rect.h;

  return [
    // horizontal
    {
      x: x - h / 2,
      y: y - w / 2,
      w: h,
      h: w,
      start: [x - h / 2, y - w / 2],
      end: [x - h / 2 + spanX, y - w / 2],
      spd: [0, 0],
    },
    // vertical
    {
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      start: [x - w / 2, y - h / 2],
      end: [x - w / 2, y - h / 2 + spanY],
      spd: [0, 0],
    },
  ];
}

function moveRect(rect, props) {
  const [x, y] = movementTypes[config.movement](
    props,
    [rect.start, rect.end],
    [rect.x, rect.y],
    rect.spd
  );

  rect.x = x;
  rect.y = y;
}

function drawLerp({ playhead }, [start, end]) {
  return [lerp(start[0], end[0], playhead), lerp(start[1], end[1], playhead)];
}

function drawDamp({ deltaTime }, [start, end], pos) {
  return [
    damp(pos[0], end[0], config.lambda, deltaTime),
    damp(pos[1], end[1], config.lambda, deltaTime),
  ];
}

function drawSpring({ deltaTime }, [start, end], pos, spd) {
  spd[0] = lerp(
    spd[0],
    (end[0] - pos[0]) * config.spring.stiffness,
    config.spring.damping
  );
  spd[1] = lerp(
    spd[1],
    (end[1] - pos[1]) * config.spring.stiffness,
    config.spring.damping
  );

  return [pos[0] + spd[0], pos[1] + spd[1]];
}

function drawSlerp({ playhead }, [start, end]) {
  return slerp(start, end, playhead);
}

const dot = ([ax, ay], [bx, by]) =>
  (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));

function slerp(p0, p1, t) {
  const angle = Math.acos(dot(p0, p1));

  const factor1 = Math.sin(angle * (1 - t)) / Math.sin(angle);
  const factor2 = Math.sin(angle * t) / Math.sin(angle);

  return [p0[0] * factor1 + p1[0] * factor2, p0[1] * factor1 + p1[1] * factor2];
}

canvasSketch(sketch, settings);
