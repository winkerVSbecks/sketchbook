const { lerp } = require('canvas-sketch-util/math');

/**
 * Based on Random text shuffle by Sascha Sigl
 * https://codepen.io/SaschaSigl/pen/woGYKJ
 * and Jeremie Boulay's _ Digital HUD _
 * https://codepen.io/Jeremboo/pen/XzmEEJ?editors=0010
 */
// prettier-ignore
const SHUFFLING_VALUES = [
  '!', '§', '$', '%', '&', '/', '(', ')', '=', '?', '_',
  '<', '>', '^', '*', '#', '-', ':', ';', '~', '.'
];

function letterShuffler(letter, t, start = 0, end = 1) {
  const n = lerp(start, end, t);

  if (t <= start) return '';
  if (t > end) return letter;

  return end - t < Number.EPSILON
    ? letter
    : SHUFFLING_VALUES[Math.floor(Math.random() * SHUFFLING_VALUES.length)];
}

function wordShuffler(word, t, start = 0, end = 0.4, offset = 0.05) {
  const letters = [...word];

  return letters
    .map((letter, idx) => letterShuffler(letter, t, start, end + offset * idx))
    .join('');
}

module.exports = {
  wordShuffler,
  letterShuffler,
};
