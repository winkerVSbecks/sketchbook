const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames } = require('canvas-sketch-util/math');
const Bezier = require('bezier-js');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [800, 600],
  orientation: 'landscape',
  scaleToView: true,
  animate: true,
  duration: 6,
  fps: 24,
};

const colors = {
  background: clrs.bg,
  front: clrs.paper(),
  back: clrs.paper(),
  outline: clrs.ink(),
  // background: '#EDEEEE',
  // front: '#E5DECF',
  // back: '#CCE5E0',
  // outline: '#77746E',
};

const sketch = () => {
  return ({ context, playhead, width, height }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = colors.background;
    context.strokeStyle = colors.outline;
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.fillRect(0, 0, width, height);

    const margin = width / 22;

    const pingPongPlayhead = (idx) =>
      Math.abs(Math.sin(playhead * Math.PI + ((Math.PI / 4) * idx) / 6));

    context.beginPath();
    [0, 1, 2, 3, 4, 5, 6].forEach((idx) => {
      drawBlock(context, {
        x: margin + margin * 3 * idx,
        y: margin,
        width: margin * 2,
        height: height - margin * 2,
        playhead: Math.min(pingPongPlayhead(idx), 0.99),
      });
    });
  };
};

canvasSketch(sketch, settings);

/**
 *    *       *
 *
 *
 *
 *    b(edge1) b(edge2)
 *    (point where curve starts)
 *
 *
 *    * a c   *
 */
function drawBlock(context, props) {
  const { x, y, width, height, playhead } = props;
  const b1 = [x, mapRange(playhead, 0, 1, y + height * 1, y)];
  const b2 = [x + width, mapRange(playhead, 0, 1, y + height * 1, y)];

  context.moveTo(x, y);
  context.lineTo(x + width, y);

  const edge1 = edge(b1, props);
  const edge2 = edge(b2, props, true);

  const intersectionProps = intersections(edge1, edge2);

  drawFaces(context, intersectionProps, { x, y, width, height });
  drawFrontEdge(context, edge1);
}

function edge(b, { x, y, width, height, playhead: rawPlayhead }, hiddenEdge) {
  const playhead = hiddenEdge ? 1 - rawPlayhead : rawPlayhead;

  const [e1, e2] = edgeLocations({
    width,
    thickness: width * 0.002,
    playhead: playhead,
    x,
  });

  const a = [e1, y + height];
  const c = [e2, y + height];
  const ec1 = edgeCurve(b, a, rawPlayhead);
  const ec2 = edgeCurve(b, c, rawPlayhead);

  return { ec1, ec2, a, b, c };
}

/**
 *    U       V
 *    *       *
 *
 *    p       q
 *
 *       ta
 *       tb
 *
 *    *  s r  *
 */
function drawFaces(
  context,
  { tA, tB, curve1, curve2, curve3, curve4 },
  { x, y, width }
) {
  const U = [x, y];
  const V = [x + width, y];
  const [p, , , s] = curve3.points;
  const [q, , , r] = curve2.points;

  // Found an intersection
  // draw chunks of front and back parts
  if (tA && tB) {
    context.fillStyle = colors.front;

    context.beginPath();
    context.moveTo(p.x, p.y);
    context.lineTo(...U);
    context.lineTo(...V);
    context.lineTo(q.x, q.y);
    drawBezierCurve(context, curve2.split(tA[0]).left);
    drawBezierCurve(context, curve1.split(tA[1]).left, {
      move: false,
      reverse: true,
    });

    context.fill();
    context.stroke();

    context.fillStyle = colors.back;

    context.beginPath();
    context.moveTo(s.x, s.y);
    drawBezierCurve(context, curve3.split(tB[1]).right, {
      move: false,
      reverse: true,
    });
    drawBezierCurve(context, curve4.split(tB[0]).right, {
      move: false,
    });
    context.closePath();

    context.fill();
    context.stroke();
  } else {
    // No intersection
    // Draw the full front face
    context.fillStyle = colors.front;
    context.beginPath();

    context.moveTo(p.x, p.y);
    context.lineTo(...U);
    context.lineTo(...V);
    context.lineTo(q.x, q.y);
    drawBezierCurve(context, curve2, { move: false });
    context.lineTo(s.x, s.y);
    drawBezierCurve(context, curve3, { move: false, reverse: true });

    context.fill();
    context.stroke();
  }
}

function drawFrontEdge(context, { ec1, ec2, a, b, c }) {
  context.beginPath();
  context.moveTo(...b);
  context.bezierCurveTo(...ec1);
  context.moveTo(...b);
  context.bezierCurveTo(...ec2);
  context.lineTo(...a);

  context.fillStyle = '#fff';
  context.fill('evenodd');
  context.stroke();
}

/**
 * curve1 curve3 curve2 curve4
 */
function intersections(edge1, edge2) {
  const curve1 = new Bezier(...edge1.b, ...edge1.ec2);
  const curve2 = new Bezier(...edge2.b, ...edge2.ec2);

  const curve3 = new Bezier(...edge1.b, ...edge1.ec1);
  const curve4 = new Bezier(...edge2.b, ...edge2.ec1);

  const intersectionsA = curve2.intersects(curve1, 0.1);
  const intersectionsB = curve4.intersects(curve3, 0.1);

  const tA = intersectionsA.map((pair) =>
    pair.split('/').map((v) => parseFloat(v))
  );

  const tB = intersectionsB.map((pair) =>
    pair.split('/').map((v) => parseFloat(v))
  );

  return {
    tA: tA[0],
    tB: tB[0],
    curve1,
    curve2,
    curve3,
    curve4,
  };
}

function edgeLocations({ x, width, thickness: s, playhead: t }) {
  const angle = Math.PI + Math.PI * t;
  const r = width / 2;

  const p = [x + r + r * Math.cos(angle), r * Math.sin(angle)];
  const p1 = [p[0] + p[1] * s, p[1] + -p[0] * s];
  const p2 = [p[0] + -p[1] * s, p[1] + p[0] * s];

  return [p1[0], p2[0]];
}

const K = 0.37;
function edgeCurve([x1, y1], [x2, y2], playhead) {
  const K1 = 0.37;
  const K2 = lerpFrames([0, 0, 0.37], playhead);

  const cp1 = [x1, y1 + K1 * (y2 - y1)];
  const cp2 = [x2, y2 - K2 * (y2 - y1)];

  return [...cp1, ...cp2, x2, y2];
}

function drawBezierCurve(
  context,
  curve,
  { move = true, reverse = false } = {}
) {
  const [p0, p1, p2, p3] = curve.points;
  if (move) {
    context.moveTo(p0.x, p0.y);
  }
  if (reverse) {
    context.bezierCurveTo(p2.x, p2.y, p1.x, p1.y, p0.x, p0.y);
  } else {
    context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }
}
