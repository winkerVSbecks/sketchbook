const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 5,
  scaleToView: true,
};

const ruleNumber = Random.rangeFloor(0, 255); // 156 135 214 195 151 246 250 190
let ruleSet = toBinary(ruleNumber).split(''); //  [0, 1, 0, 1, 1, 0, 1, 0];

const sketch = () => {
  console.clear();
  Random.setSeed(Random.getRandomSeed());
  console.log(ruleNumber, ruleSet);

  let cells;
  let generations = [];
  let w = 20;

  return {
    begin({ width }) {
      cells = new Array(Math.floor(width / w));

      for (let i = 0; i < cells.length; i++) {
        cells[i] = 0;
      }

      cells[Math.floor(cells.length / 2)] = 1;
      generations.push(cells);
    },
    render({ context, width, height, playhead }) {
      context.fillStyle = '#fff';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      const currentGeneration = Math.floor(playhead * (height / w));

      if (generations.length < currentGeneration) {
        cells = step(cells);
        generations.push(cells);
      }

      // Draw black cells
      context.fillStyle = '#000';
      generations.forEach((cells, generation) => {
        cells.forEach((cell, x) => {
          if (cell == 1) {
            context.fillRect(x * w, generation * w, w, w);
          }
        });
      });
    },
  };
};

canvasSketch(sketch, settings);

function step(cells) {
  let nextGen = cells.slice();
  for (let i = 1; i < cells.length - 1; i++) {
    let left = cells[i - 1];
    let me = cells[i];
    let right = cells[i + 1];
    nextGen[i] = rules(left, me, right);
  }

  return nextGen;
}

function rules(a, b, c) {
  let s = '' + a + b + c;
  let index = parseInt(s, 2);
  const inverseIndex = 7 - index;
  return ruleSet[inverseIndex];
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
