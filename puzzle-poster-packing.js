const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const paper = require('paper');
const pack = require('pack-spheres');

const settings = {
  dimensions: [1492, 2013],
  animate: true,
  duration: 2,
};

const debug = false;

const colors = [
  '#ffae00',
  '#fc521f',
  '#ff4785',
  '#9940c3',
  '#0051ff',
  '#1ea7fd',
  '#37d5d3',
  '#00b87a',
];

const shapeTypes = [
  // 'arc',
  // 'react-arc',
  'circle',
  'donut',
  // 'i-small',
  'i',
  'l',
  'semi-circle',
  't',
  'triangle',
  'quarter-circle',
];

const randomShift = (w, h) => {
  return [
    Random.pick([-1, -0.5, 0, 0.5, 1]) * w,
    Random.pick([-1, -0.5, 0, 0.5, 1]) * h,
  ];
};

const shiftAndScale = (paper, radius, shape) => {
  // Remove the wrapper rectangle
  shape.firstChild.remove();

  shape.children.forEach((s) => {
    if (s.className === 'Shape') {
      s.toPath();
      s.remove();
    }
  });

  shape.style = {
    fillColor: Random.pick(colors),
  };
  var scaleFactor =
    (radius * 2) / Math.hypot(shape.bounds.width, shape.bounds.height);
  shape.scale(scaleFactor);
  // shift
  shape.position = new paper.Point(
    randomShift(shape.bounds.width, shape.bounds.height)
  );
  // rotate
  shape.rotate(Random.pick([0, 90, 180, 270]));
};

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());

  const intersectShapes = (shapes, position, radius) => {
    const circle = new paper.Path.Circle(position, radius);
    if (debug) {
      circle.selected = true;
    }

    const shapesGroup = new paper.Group(shapes);

    const children = shapesGroup.children.map((s) => s.children).flat();

    const intersections = children.reduce((acc, curr, idx) => {
      const intersections = children.slice(idx + 1).map((p) => {
        const intersection = curr.intersect(p);

        const pColor = p.fillColor.toCSS(true);
        const currColor = curr.fillColor.toCSS(true);
        const colorOptions = colors.filter(
          (c) => !(c === pColor || c === currColor)
        );
        const intersectionColor = Random.pick(colorOptions);
        intersection.style = { fillColor: intersectionColor };
        if (debug) {
          intersection.selected = true;
        }

        return intersection;
      });
      return acc.concat(intersections);
    }, []);

    shapesGroup.addChildren(intersections);

    shapesGroup.fitBounds(circle.bounds);

    var scaleFactor =
      (radius * 2) /
      Math.hypot(shapesGroup.bounds.width, shapesGroup.bounds.height);
    shapesGroup.scale(scaleFactor);

    shapesGroup.position = circle.position;

    if (debug) {
      const bounds = new paper.Path.Rectangle(shapesGroup.bounds);
      bounds.selected = true;
    }
  };

  return {
    begin({ canvas, styleWidth, styleHeight }) {
      const width = styleWidth * 2;
      const height = styleHeight * 2;
      paper.setup(canvas);

      paper.project.activeLayer.removeChildren();
      paper.view.draw();

      pack({
        dimensions: 2,
        bounds: height,
        sample: () => [
          Random.rangeFloor(0, width),
          Random.rangeFloor(0, height),
        ],
        minRadius: width * 0.05,
        maxRadius: width * 0.125,
        padding: width * 0.01,
      }).map(({ position, radius }) => {
        const shapeCount = Random.rangeFloor(1, 4);
        const types = new Array(shapeCount)
          .fill(0)
          .map(() => Random.pick(shapeTypes));

        const shapePromises = types.map((shape) => {
          return new Promise((res) =>
            paper.project.importSVG(`imgs/${shape}.svg`, {
              insert: false,
              onLoad: (path) => {
                shiftAndScale(paper, radius, path);
                res(path);
              },
            })
          );
        });

        Promise.all(shapePromises).then((shapes) => {
          intersectShapes(shapes, position, radius);
        });
      });
    },
    render({ context, styleWidth, styleHeight, frame, time }) {},
    // resize({ width, height }) {
    //   if (paper.view) {
    //     paper.view.viewSize = new paper.Size(width, height);
    //   }
    // },
  };
};

canvasSketch(sketch, settings);

// const circle = new paper.Path.Circle(position, radius);
// if (debug) {
//   circle.selected = true;
// }

// if (shape === 'circle' || shape === 'donut') {
//   p.fitBounds(circle.bounds);
// } else {
//   var scaleFactor =
//     (radius * 2) / Math.hypot(p.bounds.width, p.bounds.height);
//   p.scale(scaleFactor);
// }
// p.position = circle.position;

// p.style = {
//   fillColor: Random.pick(colors),
// };
// p.rotate(Random.pick([0, 90, 180, 270]));

// if (debug) {
//   const bounds = new paper.Path.Rectangle(p.bounds);
//   bounds.selected = true;
// }
