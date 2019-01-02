const canvasSketch = require('canvas-sketch');
const { linspace } = require('canvas-sketch-util/math');
const anime = require('animejs');
const easings = require('../easings');
const Renderer3D = require('../renderer-3d');
const isolines = require('./isolines');
const { drawShape } = require('../geometry');

const settings = {
  dimensions: [800, 600],
  animate: true,
  duration: 3 * 2,
  scaleToView: true,
};

const renderer = new Renderer3D(
  1.5,
  {
    x: Math.atan(1 / 2 ** 0.5), //Math.asin(Math.tan(Math.PI / 6)),
    z: 0,
    y: Math.PI / 4,
  },
  settings.dimensions[0],
);

const sketch = () => {
  console.clear();
  const A = 0.5;
  const TAB = { s: 0.025, s_2: 0.025 / 2, z: A - 0.025 / 2 };

  let timeline,
    anms,
    gridScrollLarge,
    gridScrollLargeAnim,
    gridScrollSmall,
    gridScrollSmallAnim;

  return {
    begin() {
      timeline = anime.timeline({
        autoplay: false,
      });

      anms = {
        pulse: { size: 0, fill: 'rgba(255, 255, 255, 0.25)' },
        tabs: { a: TAB.s_2, b: TAB.s_2, fill: 'rgba(255, 255, 255, 0)' },
        angles: { y: Math.PI / 4 },
        grids: { top: -A / 8, bottom: A / 8, stroke: 'rgba(255, 255, 255, 0)' },
        isolines: { y: A / 8 },
      };

      timeline
        .add({
          offset: 0.4,
          targets: anms.angles,
          y: Math.PI / 4 + Math.PI / 7,
          easing: 'easeOutSine',
          duration: 1.8,
        })
        .add({
          offset: 0.2,
          targets: anms.pulse,
          fill: 'rgba(255, 255, 255, 0)',
          size: 0.8,
          easing: 'easeInOutCubic',
          duration: 0.6,
        })
        .add({
          offset: 0.2,
          targets: anms.tabs,
          a: A - TAB.s_2,
          b: -(A - TAB.s_2),
          fill: { value: 'rgba(255, 255, 255, 0.7)', duration: 0.1 },
          easing: 'easeInOutCubic',
          duration: 0.8,
        })
        .add({
          offset: 0,
          targets: anms.grids,
          stroke: 'rgba(255, 255, 255, 0.2)',
          easing: 'easeInOutCubic',
          duration: 0.2,
        })
        .add({
          offset: 0.2,
          targets: anms.grids,
          top: -A,
          bottom: A,
          easing: 'easeInOutCubic',
          duration: 0.8,
        })
        .add({
          offset: 0.2,
          targets: anms.isolines,
          y: [
            { value: A * 0.8, duration: 1.2 },
            { delay: 0.4, value: 0, duration: 1.2 },
          ],
          easing: 'easeInOutCubic',
        })
        .add({ targets: {}, duration: 0.8 });

      gridScrollLarge = { x: 0 };
      gridScrollLargeAnim = anime({
        targets: gridScrollLarge,
        x: 1,
        easing: 'linear',
        duration: 1,
        loop: true,
        autoplay: false,
      });

      gridScrollSmall = { x: 0 };
      gridScrollSmallAnim = anime({
        targets: gridScrollSmall,
        x: 1,
        easing: 'linear',
        duration: 0.4,
        loop: true,
        autoplay: false,
      });
    },
    render({ context, width, height, time, playhead }) {
      timeline.tick(time);
      gridScrollLargeAnim.tick(time);
      gridScrollSmallAnim.tick(time);
      renderer.setRotationY(anms.angles.y);

      context.fillStyle = '#0D0308';
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      context.translate(width / 2, height / 2);

      // renderer.cube(context, A);
      drawCornerTabs(context, A, anms, TAB);
      drawPulse(context, A, anms);
      drawGrid(
        context,
        7,
        anms.grids.bottom,
        A,
        anms.grids.stroke,
        gridScrollSmall.x,
      );
      drawIsolines(context, playhead, {
        y: anms.isolines.y,
        size: A,
        offset: [0, 0],
      });
      drawGrid(
        context,
        2,
        anms.grids.top,
        A,
        anms.grids.stroke,
        gridScrollLarge.x,
      );

      renderer.text(context, 'REC ◼', [0.5, -0.45, 0.45], 'right');
      renderer.text(context, 'REC ◼', [-0.45, -0.45, 0.5], 'left');
    },
  };
};

canvasSketch(sketch, settings);

/**
 * Tabs on each corner of the cube
 */
function drawCornerTabs(context, A, anms, TAB) {
  [
    [
      ['right', TAB.s, [anms.tabs.a, TAB.z], A],
      ['right', TAB.s, [anms.tabs.b, TAB.z], A],
    ],
    [
      ['left', TAB.s, [anms.tabs.a, TAB.z], -A],
      ['left', TAB.s, [anms.tabs.b, TAB.z], -A],
    ],
    [
      ['left', TAB.s, [anms.tabs.a, -TAB.z], A],
      ['left', TAB.s, [anms.tabs.b, -TAB.z], A],
    ],
    [
      ['right', TAB.s, [anms.tabs.a, -TAB.z], -A],
      ['right', TAB.s, [anms.tabs.b, -TAB.z], -A],
    ],
    [
      ['left', TAB.s, [anms.tabs.a, -TAB.z], -A],
      ['left', TAB.s, [anms.tabs.b, -TAB.z], -A],
    ],
    [
      ['right', TAB.s, [anms.tabs.a, TAB.z], -A],
      ['right', TAB.s, [anms.tabs.b, TAB.z], -A],
    ],
    [
      ['right', TAB.s, [anms.tabs.a, -TAB.z], A],
      ['right', TAB.s, [anms.tabs.b, -TAB.z], A],
    ],
    [
      ['left', TAB.s, [anms.tabs.a, TAB.z], A],
      ['left', TAB.s, [anms.tabs.b, TAB.z], A],
    ],
  ].forEach(([f1, f2]) => {
    renderer.face(context, f1, anms.tabs.fill);
    renderer.face(context, f2, anms.tabs.fill);
  });
}

/**
 * Pulses on each face of the cube
 */
function drawPulse(context, A, anms) {
  [
    ['right', anms.pulse.size],
    ['right', anms.pulse.size, [0, 0], -A],
    ['left', anms.pulse.size],
    ['left', anms.pulse.size, [0, 0], -A],
  ].forEach(faceProps => {
    renderer.face(context, faceProps, anms.pulse.fill);
  });
}

/**
 * Draw a grid in the XY plane
 */
function drawGrid(context, resolution, y, amplitude, stroke, _translateX = 0) {
  const offset = amplitude / (resolution * 2);
  const translateX = _translateX * offset * 2;

  linspace(resolution + 1).forEach((_, idx) => {
    const a1 = [offset + idx * offset * 2 - translateX, y, -amplitude];
    const b1 = [offset + idx * offset * 2 - translateX, y, amplitude];
    // Only draw the line if it is visible in the cube
    if (a1[0] <= amplitude) {
      renderer.line(context, a1, b1, stroke);
    }

    const a2 = [-(offset + idx * offset * 2 + translateX), y, -amplitude];
    const b2 = [-(offset + idx * offset * 2 + translateX), y, amplitude];
    // Only draw the line if it is visible in the cube
    if (a2[0] >= -amplitude) {
      renderer.line(context, a2, b2, stroke);
    }
  });

  linspace(resolution).forEach(step => {
    const a1 = [-amplitude, y, offset + step * amplitude];
    const b1 = [amplitude, y, offset + step * amplitude];
    renderer.line(context, a1, b1, stroke);

    const a2 = [-amplitude, y, -(offset + step * amplitude)];
    const b2 = [amplitude, y, -(offset + step * amplitude)];
    renderer.line(context, a2, b2, stroke);
  });
}

function drawIsolines(context, playhead, { y, size, offset }) {
  context.lineWidth = 3;
  context.lineJoin = 'round';

  isolines({ y, size, offset }, playhead, band => {
    renderer.shape(context, band, 'hsla(220, 100%, 50%, 0.3)');
    context.stroke();
  });

  renderer.shape(
    context,
    [[-size, y, -size], [size, y, -size], [size, y, size], [-size, y, size]],
    '#000',
  );
}
