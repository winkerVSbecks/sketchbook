const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const paper = require('paper');

const settings = {
  dimensions: [800, 800],
  animate: true,
  duration: 2,
  scaleToView: true,
  scaleToFit: true,
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
  // 'i',
  'l',
  'semi-circle',
  't',
  'triangle',
  'quarter-circle',
];

const randomBounds = (grid, size) => {
  const x = Random.rangeFloor(0, grid.step - size) * grid.x;
  const y = Random.rangeFloor(0, grid.step - size) * grid.y;

  const w = size * grid.x;
  const h = size * grid.y;

  const rect = new paper.Rectangle(x, y, w, h);

  if (debug) {
    const r = new paper.Path.Rectangle(rect);
    r.fillColor = 'rgba(0,255,0,0.2)';
  }

  return rect;
};

const shiftAndScale = (shape, grid, size) => {
  // Remove the wrapper rectangle
  shape.firstChild.remove();

  shape.children.forEach((s) => {
    if (s.className === 'Shape') {
      s.toPath();
      s.remove();
    }
  });

  shape.fillColor = Random.pick(colors);

  // rotate
  shape.rotate(Random.pick([0, 90, 180, 270]));
  // fit
  shape.fitBounds(randomBounds(grid, size));
};

var drawGridLines = function (
  num_rectangles_wide,
  num_rectangles_tall,
  boundingRect
) {
  var width_per_rectangle = boundingRect.width / num_rectangles_wide;
  var height_per_rectangle = boundingRect.height / num_rectangles_tall;
  for (var i = 0; i <= num_rectangles_wide; i++) {
    var xPos = boundingRect.left + i * width_per_rectangle;
    var topPoint = new paper.Point(xPos, boundingRect.top);
    var bottomPoint = new paper.Point(xPos, boundingRect.bottom);
    var aLine = new paper.Path.Line(topPoint, bottomPoint);
    aLine.strokeColor = 'black';
  }
  for (var i = 0; i <= num_rectangles_tall; i++) {
    var yPos = boundingRect.top + i * height_per_rectangle;
    var leftPoint = new paper.Point(boundingRect.left, yPos);
    var rightPoint = new paper.Point(boundingRect.right, yPos);
    var aLine = new paper.Path.Line(leftPoint, rightPoint);
    aLine.strokeColor = 'black';
  }
};

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());

  const intersectShapes = (shapes, position, radius) => {
    // const circle = new paper.Path.Circle(position, radius);
    // if (debug) {
    //   circle.selected = true;
    // }

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

    // shapesGroup.fitBounds(circle.bounds);

    // var scaleFactor =
    //   (radius * 2) /
    //   Math.hypot(shapesGroup.bounds.width, shapesGroup.bounds.height);
    // shapesGroup.scale(scaleFactor);

    // shapesGroup.position = circle.position;

    if (debug) {
      const bounds = new paper.Path.Rectangle(shapesGroup.bounds);
      bounds.selected = true;
    }
  };

  return {
    begin({ canvas, width: w, height: h }) {
      const width = (w * canvas.width) / w;
      const height = (h * canvas.height) / h;
      paper.setup(canvas);

      paper.project.activeLayer.removeChildren();
      paper.view.draw();

      const res = 10;
      const grid = { x: width / res, y: height / res, step: res };
      const size = Random.rangeFloor(4, 6);

      console.log({ width, height, grid });

      if (debug) {
        drawGridLines(res, res, new paper.Rectangle(0, 0, width, height));
      }

      const radius = width / 2;
      const position = new paper.Point(width / 2, height / 2);
      const shapeCount = Random.rangeFloor(2, 4);
      const types = new Array(shapeCount)
        .fill(0)
        .map(() => Random.pick(shapeTypes));

      const shapePromises = types.map((shape) => {
        return new Promise((res) =>
          paper.project.importSVG(`imgs/${shape}.svg`, {
            insert: false,
            onLoad: (path) => {
              shiftAndScale(path, grid, size);
              res(path);
            },
          })
        );
      });

      Promise.all(shapePromises).then((shapes) => {
        intersectShapes(shapes, position, radius);
      });
    },
    render() {
      // paper.view.draw();
    },
  };
};

canvasSketch(sketch, settings);
