const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange } = require('canvas-sketch-util/math');
const PoissonDiskSampling = require('poisson-disk-sampling');

const settings = {
  dimensions: [1080, 1080],
  scaleToView: true,
  animate: true,
  duration: 4,
};

const clrs = {
  bg: ['#261E1C', '#262626', '#262125', '#26221F', '#252126', '#062601'],
  polaris: '#F3DEAB',
  trails: [
    { value: '#033E8C', weight: 20 },
    { value: '#355B8C', weight: 20 },
    { value: '#BF8969', weight: 20 },
    { value: '#F2F2F2', weight: 20 },
    { value: '#2A5CBF', weight: 20 },
    { value: '#8090A6', weight: 100 },
    { value: '#023373', weight: 100 },
    { value: '#023373', weight: 100 },
  ],
  trailsBg: [
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
  step: 1,
  trailSize: { min: 5, max: 15 },
  drawHead: false,
  distortion: Math.PI / 16,
  debugCenter: false,
};

const sketch = ({ width, height }) => {
  Random.setSeed('star-traces-around-polaris');

  const stars = createStars(width, height, {
    colors: clrs.trails,
    minDistance: (width * 0.01) / 2,
    maxDistance: width * 0.1,
  });

  const bgStars = createStars(width, height, {
    colors: clrs.trailsBg,
    minDistance: (width * 0.01) / 2,
    maxDistance: width * 0.1,
  });

  const cx = width * Random.range(0.4, 0.6);
  const cy = height * Random.range(0.4, 0.6);

  return ({ context, width, height, playhead, time }) => {
    // Clear
    context.fillStyle = clrs.bg;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);

    // const theta = Random.noise1D(Math.sin(playhead * 2 * Math.PI));
    // const radius =
    //   Random.noise1D(Math.sin(playhead * 2 * Math.PI)) * width * 0.4;
    // center = [cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)];
    center = [
      mapRange(
        Random.noise1D(Math.sin(playhead * 2 * Math.PI)),
        -1,
        1,
        0,
        width
      ),
      mapRange(
        Random.noise1D(Math.cos(playhead * 2 * Math.PI)),
        -1,
        1,
        0,
        height
      ),
    ];

    const scale = Math.floor(mapRange(playhead, 0, 1, 1, 10));

    // bgStars.forEach(updateStar);
    // bgStars.forEach(drawStar);

    stars.forEach((star) => {
      for (let index = 0; index < star.length * scale; index++) {
        updateStar(star);
      }
    });

    // stars.forEach(updateStar);
    stars.forEach(drawStar);

    if (config.debugCenter) {
      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(center[0], center[1], 12, 0, 2 * Math.PI);
      context.fill();
    }

    /**
     * Stars
     */
    function updateStar(star) {
      const { x, y } = star;
      const angle = field([x, y], center);
      const distortion = Random.noise2D(x, y, 1, config.distortion);

      star.x = x + config.step * Math.cos(angle + distortion);
      star.y = y + config.step * Math.sin(angle + distortion);

      if (star.path.length >= star.length) {
        star.path.shift();
      }

      star.path.push([star.x, star.y]);
    }

    function drawStar({ x, y, path, color, thickness }) {
      context.strokeStyle = color;
      context.lineWidth = thickness;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      const [start, ...pts] = path;

      context.beginPath();
      context.moveTo(...start);
      pts.forEach((pt) => {
        context.lineTo(...pt);
      });
      context.stroke();

      if (config.drawHead) {
        context.fillStyle = Random.weightedSet(clrs.trails);
        context.beginPath();
        context.arc(x, y, size, 0, 2 * Math.PI);
        context.fill();
      }
    }
  };
};

canvasSketch(sketch, settings);

function createStars(width, height, { colors, minDistance, maxDistance }) {
  const poissonDiskSamples = new PoissonDiskSampling({
    shape: [width * 2, height * 2],
    minDistance,
    maxDistance,
  });

  return poissonDiskSamples.fill().map(([_x, _y]) => {
    const x = _x - width / 2;
    const y = _y - height / 2;

    return {
      x,
      y,
      ox: x,
      oy: y,
      path: [[x, y]],
      length: Random.rangeFloor(config.trailSize.min, config.trailSize.max),
      color: Random.weightedSet(colors),
      thickness: Random.rangeFloor(1, 3),
    };
  });
}

/**
 * Utils
 */
function field([x, y], [cx, cy]) {
  return heading(calcVec(x - cx, y - cy));
}

function calcVec(x, y) {
  // return [-y, x];
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
