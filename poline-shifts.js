const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const {
  Poline,
  positionFunctions,
  randomHSLPair,
} = require('poline/dist/index.cjs');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 5,
  scaleToView: true,
};

const polines = [];

const evolutionFunctions = [replaceBottomRow];

const ruleNumber = Random.rangeFloor(0, 255);
const ruleSet = generateRuleSet(ruleNumber);
const state = {
  cells: [],
  generations: [],
  activeLayer: 0,
  evolving: true,
  evolutionFunction: Random.pick(evolutionFunctions),
};

const sketch = ({ width }) => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());
  console.log(ruleNumber, ruleSet);

  // const w = 20;
  // const w = 60;
  const w = 40;

  const count = Math.floor(width / w);
  state.activeLayer = count - 1;
  state.cells = new Array(count);
  state.generations = [];

  const anchorColors = [
    [Random.range(0, 360), 1, 0.9],
    [Random.range(0, 360), 1, 0.9],
  ];

  for (let i = 0; i < count; i++) {
    const poline = new Poline({
      anchorColors,
      // invertedLightness: true,
      numPoints: 6,
      positionFunction: positionFunctions.linearPosition,
    });
    polines.push(poline);
  }

  return {
    begin() {
      for (let idx = 0; idx < count; idx++) {
        // polines[idx].shiftHue(1 * (idx + 1));

        if (Random.chance()) {
          // polines[idx].shiftHue(Random.rangeFloor(1, 5));
          polines[idx].shiftHue(1);
        }

        const value = Random.chance() ? 0 : 1;

        state.cells[idx] = {
          value,
          colorIndex: value,
        };
      }

      state.generations.push(state.cells);

      for (let idx = 1; idx < count; idx++) {
        state.cells = step(state.cells);
        evolve(0, false);
      }
    },
    render({ context, width, height, frame }) {
      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      if (frame % 10 === 0) {
        state.cells = step(state.cells);
        evolve(frame);
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
  return { value: ruleSet[inverseIndex], colorIndex: inverseIndex };
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

function evolve(frame, shift = true) {
  state.cells = state.cells.map((cell, idx) => {
    // const t = mapRange(Random.noise2D(frame, idx), -1, 1, 0, 1);
    // polines[idx].shiftHue(t);
    // polines[idx].shiftHue(1);
    // const colorSet = polines[idx].colorsCSS;
    const colorSet = polines[idx].colorsCSS;

    return {
      ...cell,
      color: colorSet[cell.colorIndex],
    };
  });
  if (shift) {
    state.generations.shift();
  }
  state.generations.push(state.cells);
}

function replaceBottomRow() {
  // Replace bottom row
  state.cells = step(state.cells);
  state.generations.shift();
  state.generations.push(state.cells);
  poline.shiftHue(10);

  colorSet = poline.colorsCSS;
}
