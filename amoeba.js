import { Path } from 'p5';
const canvasSketch = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 24,
  scaleToView: true,
};

const config = {
  parentMembrane: 96 * 2,
  childMembrane: 64 * 2,
  parentEcto: 48 * 2,
  childEcto: 32 * 2,
  nucleus: 12 * 2,
  lineWidth: 24,
};

const clrs = {
  bg: '#080327',
  membrane: '#3050D5',
  ecto: '#FFB742',
  nucleus: '#FF5645',
};

const sketch = () => {
  Random.setSeed('amoeba');

  let state = {};

  return {
    begin({ width, height }) {
      state = {
        membraneLoc: [width * 0.5, height * 0.5],
        coreLoc: [width * 0.5, height * 0.5],
        nucleusLoc: [width * 0.5, height * 0.5],
      };
    },
    render({ context, width, height, playhead }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      const target = movePoint(
        { cx: 270, cy: 540, radius: width, offset: 0, width, height },
        [width * 0.5, height * 0.5],
        playhead
      );

      state.membraneLoc = lerp(0.03, state.membraneLoc, target);
      state.coreLoc = lerp(0.075, state.coreLoc, target);
      state.nucleusLoc = lerp(0.07, state.nucleusLoc, target);

      context.lineWidth = 12;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      drawGeometry(context, {
        membraneLoc: state.membraneLoc,
        coreLoc: state.coreLoc,
        nucleusLoc: state.nucleusLoc,
      });
    },
  };
};

canvasSketch(sketch, settings);

function movePoint({ cx, cy, radius, width, offset }, [x, y], playhead) {
  const r = loopNoise(
    {
      cx,
      cy,
      radius,
      offset: offset + 0,
      range: [-width * 0.5, width * 0.5],
    },
    playhead
  );
  const theta = loopNoise(
    { cx, cy, radius, offset: offset + 1000, range: [0, 2 * Math.PI] },
    playhead
  );

  return [x + r * Math.cos(theta), y + r * Math.sin(theta)];
}

function loopNoise({ cx, cy, radius, offset, range }, playhead) {
  const v = Random.noise2D(
    (cx + radius * Math.cos(Math.PI * 2 * playhead) + offset) / 1000,
    (cy + radius * Math.sin(Math.PI * 2 * playhead) + offset) / 1000,
    2,
    1
  );

  return mapRange(v, -1, 1, range[0], range[1]);
}

function drawGeometry(context, { membraneLoc, coreLoc, nucleusLoc }) {
  drawCircle(
    context,
    {
      x: membraneLoc[0],
      y: membraneLoc[1],
      size: config.parentMembrane,
    },
    { fill: clrs.bg, stroke: clrs.membrane, lineWidth: config.lineWidth }
  );
  drawCircle(
    context,
    {
      x: membraneLoc[0],
      y: membraneLoc[1],
      size: config.parentEcto,
    },
    { fill: clrs.bg, stroke: clrs.ecto, lineWidth: config.lineWidth }
  );
  drawCircle(
    context,
    {
      x: membraneLoc[0],
      y: membraneLoc[1],
      size: config.nucleus,
    },
    { fill: clrs.nucleus, stroke: clrs.nucleus, lineWidth: config.lineWidth }
  );

  const membraneConnector = metaball(
    config.parentMembrane,
    config.childMembrane,
    membraneLoc,
    coreLoc
  );

  const ectoplasmConnector = metaball(
    config.parentEcto,
    config.childEcto,
    membraneLoc,
    coreLoc
  );

  const nucleusConnector = metaball(
    config.nucleus,
    config.nucleus,
    membraneLoc,
    nucleusLoc
  );

  if (membraneConnector) {
    context.lineWidth = config.lineWidth;
    context.fillStyle = clrs.bg;
    context.strokeStyle = clrs.membrane;
    context.fill(membraneConnector);
    context.stroke(membraneConnector);
  }
  if (ectoplasmConnector) {
    context.lineWidth = config.lineWidth;
    context.fillStyle = clrs.bg;
    context.strokeStyle = clrs.ecto;
    context.fill(ectoplasmConnector);
    context.stroke(ectoplasmConnector);
  }
  if (nucleusConnector) {
    context.lineWidth = config.lineWidth;
    context.fillStyle = clrs.nucleus;
    context.strokeStyle = clrs.nucleus;
    context.fill(nucleusConnector);
    context.stroke(nucleusConnector);
  }
}

function drawCircle(context, { x, y, size }, { fill, stroke, lineWidth }) {
  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;

  context.beginPath();
  context.arc(x, y, size, 0, 2 * Math.PI);
  if (fill) {
    context.fill();
  }
  if (stroke) {
    context.stroke();
  }
}

/**
 * Geometry
 */
// const { start, w, h } = getStartInfo(element);

/**
 * Various metaball style connectors
 */
/**
 * Based on Metaball script by SATO Hiroyuki
 * http://park12.wakwak.com/~shp/lc/et/en_aics_script.html
 */
function metaball(
  radius1,
  radius2,
  center1,
  center2,
  handleLenRate = 2.4,
  v = 0.5
) {
  const HALF_PI = Math.PI / 2;
  const d = dist(center1, center2);
  const maxDist = radius1 + radius2 * 2.5;
  let u1, u2;

  if (radius1 === 0 || radius2 === 0) {
    return '';
  }

  if (d <= Math.abs(radius1 - radius2)) {
    return '';
  } else if (d < radius1 + radius2) {
    u1 = Math.acos(
      (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d)
    );
    u2 = Math.acos(
      (radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d)
    );
  } else {
    u1 = 0;
    u2 = 0;
  }

  // All the angles
  const angle1 = angle(center2, center1);
  const angle2 = Math.acos((radius1 - radius2) / d);
  const angle1a = angle1 + u1 + (angle2 - u1) * v;
  const angle1b = angle1 - u1 - (angle2 - u1) * v;
  const angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
  const angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
  // Points
  const p1a = getVector(center1, angle1a, radius1);
  const p1b = getVector(center1, angle1b, radius1);
  const p2a = getVector(center2, angle2a, radius2);
  const p2b = getVector(center2, angle2b, radius2);

  // Define handle length by the
  // distance between both ends of the curve
  const totalRadius = radius1 + radius2;
  const d2Base = Math.min(v * handleLenRate, dist(p1a, p2a) / totalRadius);

  // Take into account when circles are overlapping
  const d2 = d2Base * Math.min(1, (d * 2) / (radius1 + radius2));

  const r1 = radius1 * d2;
  const r2 = radius2 * d2;

  const h1 = getVector(p1a, angle1a - HALF_PI, r1);
  const h2 = getVector(p2a, angle2a + HALF_PI, r2);
  const h3 = getVector(p2b, angle2b - HALF_PI, r2);
  const h4 = getVector(p1b, angle1b + HALF_PI, r1);

  return metaballToPath(
    p1a,
    p2a,
    p1b,
    p2b,
    h1,
    h2,
    h3,
    h4,
    d > radius1,
    radius2
  );
}

function metaballToPath(p1a, p2a, p1b, p2b, h1, h2, h3, h4, escaped, r) {
  // prettier-ignore
  const pathData = [
    'M', p1a,
    'C', h1, h2, p2a,
    'A', r, r, 0, escaped ? 1 : 0, 0, p2b,
    'C', h3, h4, p1b,
  ].join(' ');

  return new Path2D(pathData);
}

/**
 * Utils
 */
function getStartInfo(element) {
  const start = {
    x: +element.getAttribute('cx'),
    y: +element.getAttribute('cy'),
  };
  const w = document.body.clientWidth;
  const h = document.body.clientHeight;
  return { start, w, h };
}

function scaleToCanvas({ start: { x, y }, w, h }) {
  const svgW = w > h ? VIEWBOX_SIZE.W : (VIEWBOX_SIZE.W * w) / h;
  const svgH = w > h ? (VIEWBOX_SIZE.H * h) / w : VIEWBOX_SIZE.H;

  return (e) => ({
    x: x + mapFromToRange(e.deltaX, 0, w, 0, svgW),
    y: y + mapFromToRange(e.deltaY, 0, h, 0, svgH),
  });
}

function mapFromToRange(x, x1, x2, y1, y2) {
  return (x - x1) * ((y2 - y1) / (x2 - x1)) + y1;
}

function moveTo([x, y], element) {
  element.setAttribute('cx', x);
  element.setAttribute('cy', y);
}

function dist([x1, y1], [x2, y2]) {
  return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
}

function angle([x1, y1], [x2, y2]) {
  return Math.atan2(y1 - y2, x1 - x2);
}

function getVector([cx, cy], a, r) {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function lerp(rate, [x, y], [targetX, targetY]) {
  const mapValue = (value, tValue) => {
    const delta = (tValue - value) * rate;
    return value + delta;
  };

  return [mapValue(x, targetX), mapValue(y, targetY)];
}
