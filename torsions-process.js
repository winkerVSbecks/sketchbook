const canvasSketch = require('canvas-sketch');
const { mapRange, lerpFrames, lerp } = require('canvas-sketch-util/math');
const Bezier = require('bezier-js');
const clrs = require('./clrs').clrs();

const settings = {
  dimensions: [600, 600],
  orientation: 'landscape',
  scaleToView: true,
  animate: true,
  duration: 6,
  fps: 24,
};

const colors = {
  outline: '#77746E',
  background: '#f2f2f2',
  front: '#f8e6d1',
  back: '#e1dce9',
  outline: '#70747c',
};

let activeState = 0;

// 0 8 11
const processStates = [
  {
    name: 'edge-curve-animated',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: false,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-curve', // not animated
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: true,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-curve-bottom-animated',
    state: {
      edge: false,
      faces: true,
      edgeLines: true,
      animateBottom: true,
      edgeCurve: false,
      debugCurve: false,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-curve-cp-animated',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: false,
      edgeCurve: true,
      debugCurve: true,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-curve-animated-combined',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: true,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'double-curve',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: false,
      doubleCurve: true,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-thickness',
    state: {
      edge: true,
      faces: false,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: false,
      debugCurve: false,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'face-and-edge',
    state: {
      edge: true,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: true,
      doubleCurve: false,
      splitFace: false,
      perspective: false,
      intersections: false,
    },
  },
  {
    name: 'edge-thickness-perspective',
    state: {
      edge: true,
      faces: false,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: false,
      debugCurve: false,
      doubleCurve: false,
      splitFace: false,
      perspective: true,
      intersections: false,
    },
  },
  {
    name: 'intersections',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: false,
      doubleCurve: true,
      splitFace: false,
      perspective: false,
      intersections: true,
    },
  },
  {
    name: 'edge-curve-split',
    state: {
      edge: false,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: false,
      doubleCurve: false,
      splitFace: true,
      perspective: true,
      intersections: false,
    },
  },
  {
    name: 'final',
    state: {
      edge: true,
      faces: true,
      edgeLines: false,
      animateBottom: true,
      edgeCurve: true,
      debugCurve: false,
      doubleCurve: false,
      splitFace: true,
      perspective: true,
      intersections: false,
    },
  },
];

let process = {};

// Show Move The Bottom Vertex stand alone without the curve
// Then show the two movements combining
// Add vertex labels

const sketch = () => {
  return ({ context, playhead, width, height }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = colors.background;
    context.strokeStyle = colors.outline;
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.fillRect(0, 0, width, height);

    const margin = (width * 1.33) / 22;

    const pingPongPlayhead = (idx) =>
      Math.abs(Math.sin(playhead * Math.PI + ((Math.PI / 4) * idx) / 6));

    // const pingPongPlayhead = () => Math.abs(Math.sin(playhead * Math.PI * 3));
    // activeState = [0, 10, 11][Math.floor(lerp(0, 3, playhead))];

    const w = margin * 2;

    process = processStates[activeState].state;

    drawBlock(context, {
      x: width / 2 - w / 2,
      y: margin,
      width: w,
      height: height - w,
      thickness: w * 0.002,
      playhead: Math.min(pingPongPlayhead(0), 0.99),
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
  const b1 = [x, mapRange(playhead, 0, 1, y + height * 1, y)]; // start point 1
  const b2 = [x + width, mapRange(playhead, 0, 1, y + height * 1, y)]; // start point 2

  const edge1 = edge(
    b1,
    { ...props, playhead: process.animateBottom ? playhead : 1 },
    false,
    true
  );
  const edge2 = edge(
    b2,
    { ...props, playhead: process.animateBottom ? playhead : 1 },
    true
  );

  const intersectionProps = intersections(edge1, edge2);
  if (process.faces) {
    drawFaces(context, intersectionProps, { x, y, width, height });
  }
  if (process.edge) {
    drawFrontEdge(context, edge1);
  }
  if (process.intersections) {
    drawIntersections(context, intersectionProps);
  }
}

function edge(
  b,
  { x, y, width, height, thickness, playhead: rawPlayhead },
  hiddenEdge,
  perspective
) {
  const playhead = hiddenEdge ? 1 - rawPlayhead : rawPlayhead;

  const [e1, e2] = edgeLocations({
    width,
    thickness: thickness,
    playhead: playhead,
    x,
  });

  const a = [e1, y + height];
  const c = [e2, y + height];
  const ec1 = edgeCurve(b, a, rawPlayhead);
  const ec2 = edgeCurve(b, c, rawPlayhead, perspective);

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
  if (tA && tB && process.splitFace) {
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

    if (process.edgeCurve) {
      context.moveTo(p.x, p.y);
      context.lineTo(...U);
      context.lineTo(...V);
      context.lineTo(q.x, q.y);
      drawBezierCurve(context, curve2, { move: false });
      context.lineTo(s.x, s.y);
      drawBezierCurve(context, curve3, { move: false, reverse: true });

      if (process.doubleCurve) {
        drawBezierCurve(context, curve1, { move: true });
        drawBezierCurve(context, curve4, { move: true });
      }

      context.fill();
      context.stroke();
    } else if (process.edgeLines) {
      // context.moveTo(p.x, p.y);
      context.moveTo(...U);
      context.lineTo(...V);
      context.lineTo(r.x, r.y);
      context.lineTo(s.x, s.y);
      context.lineTo(...U);
      context.fill();
      context.stroke();

      drawNode(context, { x: U[0], y: U[1] }, '(x1, y1)', 'left');
      drawNode(context, s, '(x2, y2)');
    }

    if (process.debugCurve) {
      context.fillStyle = colors.outline;
      context.lineWidth = 3;
      const cp1 = curve3.points[1];
      const cp2 = curve3.points[2];

      context.beginPath();
      context.moveTo(p.x, p.y);
      context.lineTo(cp1.x, cp1.y);

      context.moveTo(s.x, s.y);
      context.lineTo(cp2.x, cp2.y);
      context.stroke();

      drawNode(context, p, '(x1, y1)', 'left');
      drawNode(context, cp1, 'cp1', 'left');
      drawNode(context, cp2, 'cp2');
      drawNode(context, s, '(x2, y2)');
    }
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

function edgeCurve([x1, y1], [x2, y2], playhead, perspective) {
  const K1 = 0.37;
  const K2 =
    process.perspective && perspective
      ? lerpFrames([0, 0, 0.6], playhead)
      : lerpFrames([0, 0, 0.37], playhead);

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

function drawNode(context, pt, label, alignment = 'right') {
  context.beginPath();
  context.fillStyle = colors.back;
  context.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
  context.fill();
  context.stroke();

  drawLabel(context, label, 16, pt, alignment);
}

function drawIntersections(
  context,
  { tA, tB, curve1, curve2, curve3, curve4 }
) {
  if (tA && tB) {
    drawNode(context, curve2.get(tA[0]), 'intersection point');
    // drawNode(context, curve4.get(tB[0]));
  }
}

function drawLabel(context, text, fontSize, { x, y }, alignment = 'right') {
  context.save();

  context.font = `${fontSize}px monospace`;
  context.textBaseline = 'middle';
  context.textAlign = alignment === 'left' ? 'right' : 'left';
  context.fillStyle = colors.back;

  // get width of text
  const width = context.measureText(text).width;
  const padding = fontSize * 0.5;
  const xOff = x + (alignment === 'right' ? 2 * padding : -2 * padding - width);

  // draw background rect assuming height of font
  context.fillRect(
    xOff - padding / 2,
    y - fontSize / 2 - padding / 2,
    width + padding,
    fontSize + padding
  );

  const xText = alignment === 'right' ? xOff : xOff + width;

  context.fillStyle = colors.outline;
  context.fillText(text, xText, y);

  // restore original state
  context.restore();
}
