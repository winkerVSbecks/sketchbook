const canvasSketch = require('canvas-sketch');
const { linspace, mapRange } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const R = require('ramda');
const anime = require('animejs');
const { drawShape } = require('./geometry');
const { wordShuffler, letterShuffler } = require('./word-shuffler');

const settings = {
  dimensions: [800, 800],
  animate: true,
  duration: 7,
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 60,
};

const sketch = ({ context, width, height }) => {
  console.clear();

  const fontSize = 18;
  const lineHeight = 1;
  context.font = `${fontSize}px monospace`;

  const text = `                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                 >>>                  '
                                      '
            Shadow-Piercing           '
         Descendant Combinator        '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '
                                      '`.replace(/'/g, ' ');

  const lines = text.split('\n');
  let chars = text
    .replace(/\n/g, '')
    .split('')
    .map(() => '');
  let finalChars = text.replace(/\n/g, '').split('');
  let charTimes = chars.map(() => ({ t: 0 }));

  const offset = [
    (width - context.measureText(text.split('\n')[1]).width) / 2,
    (height - fontSize * lineHeight * lines.length) / 2,
  ];

  const animation = anime({
    targets: charTimes,
    t: [
      {
        value: 1,
        duration: 200,
      },
      {
        value: 2,
        duration: 200,
        delay: 350,
      },
    ],
    delay: anime.stagger(5, { grid: [39, 21], from: 'first' }),
    easing: 'easeInOutQuad',
    autoplay: false,
    loop: false,
    duration: 1000,
  });

  return {
    begin({ context, width }) {},
    render({ context, width, height, time, playhead }) {
      context.fillStyle = '#222';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      context.translate(...offset);

      context.fillStyle = '#fff';
      context.font = `${fontSize}px monospace`;
      animation.tick(playhead * 1000);

      const newChars = chars.map((c, idx) =>
        charTimes[idx].t <= 1.1
          ? letterShuffler(finalChars[idx], charTimes[idx].t, 0, 1)
          : letterShuffler(' ', charTimes[idx].t, 1, 2),
      );

      const animatedLines = R.compose(
        R.map(R.join('')),
        R.splitEvery(39),
      )(newChars);

      animatedLines.forEach((line, idx) => {
        context.fillText(line, 0, fontSize * lineHeight * idx);
      });
    },
  };
};

canvasSketch(sketch, settings);
