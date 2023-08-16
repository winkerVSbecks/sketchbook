const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const {
  Poline,
  positionFunctions,
  randomHSLPair,
} = require('poline/dist/index.cjs');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  // duration: 4,
  scaleToView: true,
};

const poline = new Poline({
  anchorColors: randomHSLPair(),
  numPoints: 6,
  positionFunctionX: positionFunctions.smoothStepPosition, // sinusoidalPosition,
  positionFunctionY: positionFunctions.quadraticPosition,
  positionFunctionZ: positionFunctions.linearPosition,
});

let colorSet = poline.colorsCSS;

const ruleNumber = Random.rangeFloor(0, 255); // 156 135 214 195 151 246 250 190
let ruleSet = generateRuleSet(ruleNumber); //  [0, 1, 0, 1, 1, 0, 1, 0];

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());
  console.log(ruleNumber, ruleSet);
  console.log(colorSet.length);
  console.log(randomHSLPair(), poline);

  let cells;
  let generations = [];
  let w = 20;
  let count;
  let activeLayer = 0;

  return {
    begin({ width }) {
      count = Math.floor(width / w);
      activeLayer = count - 1;
      cells = new Array(count);
      generations = [];

      for (let i = 0; i < count; i++) {
        cells[i] = {
          value: Random.chance() ? 0 : 1,
          color: Random.pick(colorSet),
        };
      }

      generations.push(cells);

      for (let i = 1; i < count; i++) {
        cells = step(cells);
        generations.push(cells);
      }
    },
    render({ context, width, height, frame }) {
      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      if (frame % 5 === 0) {
        // Transpose: Right to left
        cells = step(generations[activeLayer]);

        generations.forEach((gCells, idx) => {
          if (idx > 20 && idx < 40) {
            gCells[activeLayer] = cells[idx];
          }
        });

        poline.shiftHue(10);
        colorSet = poline.colorsCSS;
        activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // // Transpose & Shift: Right to left
        // cells = step(generations[activeLayer]);

        // generations.forEach((gCells, idx) => {
        //   gCells.shift();
        //   gCells.push(cells[idx]);
        // });

        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;
        // activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // ---

        // // Transpose: Right to left
        // cells = step(generations[activeLayer]);

        // generations.forEach((gCells, idx) => {
        //   gCells[activeLayer] = cells[idx];
        // });

        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;
        // activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // ---

        // // Right to left
        // columnCells = generations.map((cells) => cells[activeLayer]);
        // columnCells = step(columnCells);

        // generations.forEach((cells, idx) => {
        //   cells[activeLayer] = columnCells[idx];
        // });

        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;
        // activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // ---

        // // Wipe effect # 1, bottom to top, one row at a time
        // cells = step(generations[count - activeLayer]);
        // generations[activeLayer] = cells;
        // activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;

        // ---

        // // Wipe effect # 2, bottom to top, one row at a time
        // cells = step(generations[activeLayer]);
        // generations[activeLayer] = cells;
        // activeLayer = activeLayer === 0 ? count - 1 : activeLayer - 1;

        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;

        // ---

        // // Replace bottom row
        // cells = step(cells);
        // generations.shift();
        // generations.push(cells);
        // poline.shiftHue(10);
        // colorSet = poline.colorsCSS;
      }

      // Draw cells
      generations.forEach((cells, generation) => {
        cells.forEach((cell, x) => {
          context.fillStyle = cell.color;
          context.fillRect(x * w, generation * w, w, w);
        });
      });
    },
  };
};

canvasSketch(sketch, settings);

function step(cells) {
  let nextGen = cells.slice();
  for (let i = 1; i < cells.length - 1; i++) {
    let left = cells[i - 1].value;
    let me = cells[i].value;
    let right = cells[i + 1].value;
    nextGen[i] = rules(left, me, right);
  }

  return nextGen;
}

function rules(a, b, c) {
  let s = '' + a + b + c;
  let index = parseInt(s, 2);
  const inverseIndex = 7 - index;
  return { value: ruleSet[inverseIndex], color: colorSet[inverseIndex] };
}

function generateRuleSet(n) {
  let ruleSet = toBinary(n).split('');

  // Pad with zeros at the beginning
  while (ruleSet.length < 8) {
    ruleSet.unshift('0');
  }

  return ruleSet;
}

function toBinary(n) {
  var s = '';
  for (; n >= 0; n /= 2) {
    rem = n % 2;
    n -= rem;
    s = rem + s;
    if (n == 0) break;
  }
  return s;
}
