const { point, line, drawShape } = require('./geometry');
const { matrixMultiply } = require('./matrix');

// prettier-ignore
const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const faces = {
  top: ([u, v], d, s) => [
    [u - s, d, v - s],
    [u + s, d, v - s],
    [u + s, d, v + s],
    [u - s, d, v + s],
  ],
  right: ([u, v], d, s) => [
    [u - s, v - s, d],
    [u + s, v - s, d],
    [u + s, v + s, d],
    [u - s, v + s, d],
  ],
  left: ([v, u], d, s) => [
    [d, u - s, v - s],
    [d, u + s, v - s],
    [d, u + s, v + s],
    [d, u - s, v + s],
  ],
};

class Renderer3D {
  constructor(
    d,
    angles = { x: Math.atan(2 ** 0.5), y: 0, z: Math.PI / 4 },
    scale,
  ) {
    this.d = d;
    this.scale = scale;
    this.angles = angles;
    this.setRotationX(angles.x);
    this.setRotationY(angles.y);
    this.setRotationZ(angles.z);
    this.toIso = this.toIso.bind(this);
  }

  setRotationX(angle) {
    this.angles.x = angle;
    // prettier-ignore
    this.rotationX = [
      [1, 0, 0],
      [0, Math.cos(angle), Math.sin(angle)],
      [0, -Math.sin(angle), Math.cos(angle)],
    ];
  }

  setRotationY(angle) {
    this.angles.y = angle;
    // prettier-ignore
    this.rotationY = [
      [Math.cos(angle), 0, -Math.sin(angle)],
      [0, 1, 0],
      [Math.sin(angle), 0, Math.cos(angle)],
    ];
  }

  setRotationZ(angle) {
    this.angles.z = angle;
    // prettier-ignore
    this.rotationZ = [
      [Math.cos(angle), -Math.sin(angle), 0],
      [Math.sin(angle), Math.cos(angle), 0],
      [0, 0, 1],
    ];
  }

  // http://www.petercollingridge.co.uk/tutorials/svg/isometric-projection/
  toIso(vertex) {
    let rotated = matrixMultiply(this.rotationX, this.rotationY);
    rotated = matrixMultiply(rotated, vertex.map(v => [v]));

    // prettier-ignore
    const projection = [
      [this.d, 0, 0],
      [0, this.d, 0],
    ];

    return matrixMultiply(projection, rotated).map(v => (v * this.scale) / 4);
  }

  cube(context, size) {
    // prettier-ignore
    const cube = [
      [-size, -size, -size],
      [size, -size, -size],
      [size, size, -size],
      [-size, size, -size],
      [-size, -size, size],
      [size, -size, size],
      [size, size, size],
      [-size, size, size],
    ].map(this.toIso);

    cubeEdges.forEach(([a, b]) => {
      line(context, cube[a], cube[b], {
        lineWidth: 1,
        stroke: 'rgba(255, 0, 255, 0.5)',
      });
    });
  }

  getFace(direction, size = 0.1, [u, v] = [0, 0], distance = 0.5) {
    return faces[direction]([u, v], distance, size / 2);
  }

  /**
   * Draw a face of the isometric cube
   */
  face(context, faceProps, fill = '#fff', stroke) {
    context.fillStyle = fill;
    const face = this.getFace(...faceProps).map(this.toIso);

    drawShape(context, face);
    context.fill();

    if (stroke) {
      context.strokeStyle = stroke;
      context.stroke();
    }
  }

  line(context, a, b, stroke, lineWidth = 1) {
    line(context, this.toIso(a), this.toIso(b), { lineWidth, stroke });
  }

  shape(context, shape, stroke) {
    context.strokeStyle = stroke;
    drawShape(context, shape.map(this.toIso));
    context.stroke();
  }

  text(context, string, location, direction, font = '24px monospace') {
    const angleY = this.angles.y - Math.PI / 2;
    const rotationY =
      direction === 'right'
        ? [
            [Math.cos(angleY), 0, -Math.sin(angleY)],
            [0, 1, 0],
            [Math.sin(angleY), 0, Math.cos(angleY)],
          ]
        : this.rotationY;
    let r = matrixMultiply(this.rotationX, rotationY);

    const [x, y] = this.toIso(location);

    context.save();
    // context.transform(r[0][0], r[1][0], r[0][1], r[1][1], r[0][2], r[1][2]);
    context.font = font;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillStyle = '#fff';

    context.fillText(string, x, y);
    context.restore();
  }
}

module.exports = Renderer3D;
