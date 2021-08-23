const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { lerp } = require('canvas-sketch-util/math');
const PoissonDiskSampling = require('poisson-disk-sampling');

const settings = {
  dimensions: [1080, 1080],
  scaleToView: true,
  animate: true,
  duration: 8,
};

const clrs = {
  bg: ['#261E1C', '#262626', '#262125', '#26221F', '#252126', '#062601'],
  polaris: '#F3DEAB',
  trails: [
    // { value: '#033E8C', weight: 20 },
    // { value: '#355B8C', weight: 20 },
    // { value: '#BF8969', weight: 20 },
    // { value: '#F2F2F2', weight: 20 },
    // { value: '#2A5CBF', weight: 20 },
    // { value: '#8090A6', weight: 100 },
    // { value: '#023373', weight: 100 },
    // { value: '#023373', weight: 100 },
    { value: '#F2AB6D', weight: 20 },
    { value: '#727F94', weight: 50 },
    { value: '#82999B', weight: 50 },
    { value: '#8DA8AF', weight: 50 },
    { value: '#B1C3C0', weight: 50 },
    { value: '#88BABF', weight: 50 },
    { value: '#F2E291', weight: 10 },
    { value: '#F2D544', weight: 10 },
    { value: '#F2C335', weight: 10 },
    { value: '#595959', weight: 100 },
    { value: '#575914', weight: 100 },
    { value: '#593202', weight: 300 },
    { value: '#732002', weight: 300 },
    { value: '#593202', weight: 300 },
    { value: '#361E40', weight: 300 },
    { value: '#062601', weight: 400 },
  ],
};

const config = {
  targets: 6,
  step: 5,
  trailSize: { min: 5, max: 15 },
  headMode: false,
  distortion: Math.PI / 16,
};

const sketch = ({ width, height }) => {
  Random.setSeed('star-traces-around-polaris');

  const poissonDiskSamples = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: width * 0.01,
    maxDistance: width * 0.1,
    tries: 10,
  });

  config.starCount =
    poissonDiskSamples.fill().length -
    Math.floor(poissonDiskSamples.fill().length * 0.01);

  const stars = new Array(config.starCount).fill().map(() => ({
    paths: [],
    length: Random.rangeFloor(config.trailSize.min, config.trailSize.max),
    color: Random.weightedSet(clrs.trails),
    thickness: Random.rangeFloor(2, 8),
  }));

  return {
    begin() {
      stars.forEach((star) => {
        star.paths = [];
      });

      for (let index = 0; index < config.targets; index++) {
        generatePaths({ poissonDiskSamples, width, height }, stars);
      }

      stars.forEach((star) => {
        star.paths.push(star.paths[0]);
        star.path = star.paths[0];
      });
    },
    render({ context, width, height, playhead, deltaTime }) {
      context.fillStyle = clrs.bg;
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      const targetIndex = Math.floor(playhead * config.targets) + 1;

      stars.forEach((star) => drawStar(context, targetIndex, deltaTime, star));
    },
  };
};

canvasSketch(sketch, settings);

/**
 * Stars
 */
function generatePaths({ poissonDiskSamples, width, height }, stars) {
  poissonDiskSamples.reset();

  const locations = poissonDiskSamples.fill().slice(0, config.starCount);

  const center = [
    width * Random.range(0.2, 0.8),
    height * Random.range(0.2, 0.8),
  ];

  locations.map(([x, y], idx) => {
    stars[idx].paths.push(
      generatePath(center, { x, y, length: stars[idx].length })
    );
  });
}

function generatePath(center, { x, y, length }) {
  const path = [[x, y]];

  for (let index = 0; index < length; index++) {
    const angle = field([x, y], center);
    const distortion = 0; // Random.noise2D(x, y, 1, config.distortion);

    x += config.step * Math.cos(angle + distortion);
    y += config.step * Math.sin(angle + distortion);

    path.push([x, y]);
  }

  return path;
}

function drawStar(context, targetIndex, deltaTime, star) {
  const { paths, color, thickness } = star;

  context.strokeStyle = color;
  context.lineWidth = thickness;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  const [startPoint, ...otherPoints] = star.path;

  if (config.headMode) {
    const size = thickness;
    context.fillStyle = color;
    context.beginPath();
    context.arc(startPoint[0], startPoint[1], size, 0, 2 * Math.PI);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(...startPoint);
    otherPoints.forEach((pt) => {
      context.lineTo(...pt);
    });
    context.stroke();
  }

  star.path = star.path.map((point, idx) =>
    interpolate(point, paths[targetIndex][idx], deltaTime)
  );
}

/**
 * Utils
 */
function interpolate(point, target, deltaTime) {
  // Determine a rate at which we will step forward each frame,
  // making it dependent on the time elapsed since last frame
  const rate = (config.targets + 1) * deltaTime;

  // Interpolate toward the target point at this rate
  return [lerp(point[0], target[0], rate), lerp(point[1], target[1], rate)];
}

function field([x, y], [cx, cy]) {
  return heading(calcVec(x - cx, y - cy));
}

function calcVec(x, y) {
  return [-y, x];
  return [y - x, -x - y];
}

function heading([x, y]) {
  return Math.atan2(y, x);
}

function hexToRgb(hex) {
  return hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => '#' + r + r + g + g + b + b
    )
    .substring(1)
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16));
}
