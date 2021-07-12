const canvasSketch = require('canvas-sketch');
const Tone = require('tone');
const anime = require('animejs');
const Random = require('canvas-sketch-util/random');
const {
  mapRange,
  lerpFrames,
  linspace,
  clamp,
} = require('canvas-sketch-util/math');
const { drawShape } = require('./geometry');

const settings = {
  // dimensions: [800, 600],
  animate: true,
  duration: 4,
  scaleToView: true,
};

let PALETTE = Random.shuffle([
  '#fff',
  '#fff791',
  '#9aeeeb',
  '#1a5ece',
  '#6ee99d',
  '#000',
  '#faf8f4',
]);
const GRID_SIZE = 16;

var animTime = {
  t: 0,
};

const animation = anime({
  targets: animTime,
  easing: 'easeInOutCubic',
  keyframes: [{ t: 0.5 }, { t: 1 }],
  autoplay: false,
  duration: settings.duration * 1000,
});

const sketch = async (app) => {
  // Setup a reverb with ToneJS
  const reverb = new Tone.Reverb({
    decay: 4,
    wet: 0.5,
    preDelay: 0.2,
  }).toMaster();

  // Load the reverb
  await reverb.generate();

  // Setup a synth with ToneJS
  const synth = new Tone.Synth({
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.001,
      decay: 0.5,
      sustain: 0.001,
      release: 5,
    },
  }).connect(reverb);

  // The notes we will use
  const notes = ['C5', 'A3', 'D4', 'G4', 'A4', 'F4'];
  const tones = linspace(24).map((_, idx) => 40 + 30 * idx);
  let metronome = 1;

  // Generate pipes
  let background;
  let pipes;

  const reset = () => {
    PALETTE = Random.shuffle([
      '#fff',
      '#fff791',
      '#9aeeeb',
      '#1a5ece',
      '#6ee99d',
      '#000',
      '#faf8f4',
    ]);

    background = PALETTE.shift();

    pipes = linspace(24 * 4).map(() => ({
      pipe: pipeObj(8, app.width, app.height),
      color: Random.pick(PALETTE),
      frequency: Random.rangeFloor(50, 100),
    }));
  };

  reset();
  window.addEventListener('click', reset);

  return {
    render({ deltaTime, context, width, height, time }) {
      animation.tick(time * 1000);

      // Draw background
      context.fillStyle = background;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.fillRect(0, 0, width, height);

      // Play tones
      tones.forEach((tone) => {
        if (metronome % tone === 0) {
          addNote();
        }
      });
      metronome++;

      // Draw pipes
      const drawPipe = drawPipeToScale(context, [width, height]);
      pipes.forEach(({ color, pipe, frequency }) => {
        drawPipe(pipe, color, background);
      });
    },
    resize() {
      reset();
    },
    unload() {
      reverb.dispose();
      synth.dispose();
      window.removeEventListener('click', reset);
    },
  };

  function addNote() {
    // Random note
    const noteIndex = Random.rangeFloor(notes.length);

    // Trigger a sound
    const velocity = 1;
    synth.triggerAttackRelease(
      notes[noteIndex],
      '16n',
      synth.context.currentTime,
      velocity
    );
  }
};

function drawPipeToScale(context, [width, height]) {
  return ({ pts, length: l }, color, bg) => {
    const t = animTime.t;

    context.setLineDash([l * 0.5, l * 0.5]);
    context.lineDashOffset = mapRange(t, 0, 1, 0, -l);

    // bg
    context.strokeStyle = bg;
    context.lineWidth = 24;
    drawShape(context, pts, false);
    context.stroke();

    // outer
    context.strokeStyle = color;
    context.lineWidth = 18;
    drawShape(context, pts, false);
    context.stroke();

    // middle
    context.setLineDash([l * 0.4, l * 0.6]);
    context.lineDashOffset = lerpFrames([[0], [-l * 0.6], [-l]], t)[0];
    context.strokeStyle = bg;
    context.lineWidth = 12;
    drawShape(context, pts, false);
    context.stroke();

    // inner
    context.setLineDash([l * 0.3, l * 0.7]);
    context.lineDashOffset = lerpFrames([[0], [-l * 0.7], [-l]], t)[0];
    context.strokeStyle = color;
    context.lineWidth = 6;
    drawShape(context, pts, false);
    context.stroke();
  };
}

function uvToXy([width, height]) {
  return ([x, y]) => [
    mapRange(x, 0, GRID_SIZE, 0, width),
    mapRange(y, 0, GRID_SIZE, 0, height),
  ];
}

function pipeObj(size, width, height) {
  const pts = makeLoop(makePipe(size)).map(uvToXy([width, height]));
  return {
    pts,
    length: pipeLength(pts),
  };
}

function makePipe(length = 6) {
  let prevDir = [0, 0];

  const start = [
    Random.rangeFloor(1, GRID_SIZE - 1),
    Random.rangeFloor(1, GRID_SIZE - 1),
  ];

  return linspace(length).reduce(
    (polyline) => {
      const dir = randomDir(prevDir);
      const a = polyline[polyline.length - 1];

      const b = dir.map((v) => v * Random.rangeFloor(1, 3));
      prevDir = dir;
      return polyline.concat([
        [clampToGrid(b[0] + a[0]), clampToGrid(b[1] + a[1])],
      ]);
    },
    [start]
  );
}

function pipeLength(pts) {
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[i - 1];
    length = length + Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  return length;
}

function randomDir(prevDir) {
  const prev = prevDir.map((v) => v * -1);
  return Random.pick(
    [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ].filter((dir) => !(prev && dir[0] === prev[0] && dir[1] === prev[1]))
  );
}

function clampToGrid(v) {
  return clamp(v, 1, GRID_SIZE - 1);
}

function makeLoop(polyline) {
  const reflect = Math.max(...polyline.map(([x, y]) => y));
  const t = 3;
  let dir = 1;

  return [
    ...polyline,
    ...polyline
      .map(([x, y], idx) => {
        if (polyline[idx - 1] && polyline[idx - 1][1] !== y) {
          dir = dir * -1;
        }
        return [x, clampToGrid(reflect + dir * Math.round((reflect - y) / t))];
      })
      .reverse(),
    polyline[0],
  ];
}

canvasSketch(sketch, settings);
