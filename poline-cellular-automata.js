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
  duration: 40,
  // fps: 60,
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

const evolutionFunctions = [
  transposeRightToLeft,
  transposeAndShiftRightToLeft,
  rightToLeft,
  wipeBottomToTop,
  wipeAltBottomToTop,
  replaceBottomRow,
];

const ruleNumber = Random.rangeFloor(0, 255); // 156 135 214 195 151 246 250 190
const ruleSet = generateRuleSet(ruleNumber); //  [0, 1, 0, 1, 1, 0, 1, 0];
const state = {
  cells: [],
  generations: [],
  activeLayer: 0,
  evolving: true,
  evolutionFunction: Random.pick(evolutionFunctions),
};

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());
  console.log(ruleNumber, ruleSet);
  console.log(colorSet.length);

  const w = 20;
  // const w = 50;
  let count;

  return {
    begin({ width }) {
      count = Math.floor(width / w);
      state.activeLayer = count - 1;
      state.cells = new Array(count);
      state.generations = [];

      for (let i = 0; i < count; i++) {
        state.cells[i] = {
          value: Random.chance() ? 0 : 1,
          color: Random.pick(colorSet),
        };
      }

      state.generations.push(state.cells);

      for (let i = 1; i < count; i++) {
        state.cells = step(state.cells);
        state.generations.push(state.cells);
      }
    },
    render({ context, width, height, frame, time }) {
      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      if (frame % 5 === 0) {
        if (state.activeLayer === 0) {
          state.evolutionFunction = Random.pick(evolutionFunctions);
          state.activeLayer = count - 1;
          console.log(state.evolutionFunction.name);
        } else {
          state.activeLayer--;
        }

        if (state.activeLayer > 0) {
          state.evolutionFunction(count);
        }
      }

      // Draw cells
      state.generations.forEach((cells, generation) => {
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

function transposeRightToLeft() {
  state.cells = step(state.generations[state.activeLayer]);

  state.generations.forEach((gCells, idx) => {
    gCells[state.activeLayer] = state.cells[idx];
  });

  poline.shiftHue(10);
  colorSet = poline.colorsCSS;
}

function transposeAndShiftRightToLeft() {
  // Transpose & Shift: Right to left
  state.cells = step(state.generations[state.activeLayer]);

  state.generations.forEach((gCells, idx) => {
    gCells.shift();
    gCells.push(state.cells[idx]);
  });

  poline.shiftHue(10);
  colorSet = poline.colorsCSS;
}

function rightToLeft() {
  // Right to left
  let columnCells = state.generations.map((cells) => cells[state.activeLayer]);
  columnCells = step(columnCells);

  state.generations.forEach((cells, idx) => {
    cells[state.activeLayer] = columnCells[idx];
  });

  poline.shiftHue(10);
  colorSet = poline.colorsCSS;
}

function wipeBottomToTop(count) {
  // Wipe effect # 1, bottom to top, one row at a time
  state.cells = step(state.generations[count - state.activeLayer]);
  state.generations[state.activeLayer] = state.cells;

  poline.shiftHue(10);
  colorSet = poline.colorsCSS;
}

function wipeAltBottomToTop() {
  // Wipe effect # 2, bottom to top, one row at a time
  state.cells = step(state.generations[state.activeLayer]);
  state.generations[state.activeLayer] = state.cells;

  poline.shiftHue(10);
  colorSet = poline.colorsCSS;
}

function replaceBottomRow() {
  // Replace bottom row
  state.cells = step(state.cells);
  state.generations.shift();
  state.generations.push(state.cells);
  poline.shiftHue(10);

  colorSet = poline.colorsCSS;
}
